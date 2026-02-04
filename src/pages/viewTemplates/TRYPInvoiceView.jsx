import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import logo from '../../../public/TRYP-Logo.png';
import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
import toast from "react-hot-toast";
import { InvoiceTemplate } from "../../components";
import html2pdf from 'html2pdf.js';

const TRYPInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);
  const ROWS_PER_PAGE = 22;

  useEffect(() => {
    if (invoiceData) {
      const transformed = transformInvoiceData(invoiceData);
      setInvoice(transformed);
      setLoading(false);
    } else if (invoiceId) {
      fetchInvoiceData();
    } else {
      setError("No invoice identifier provided");
      setLoading(false);
    }
  }, [invoiceData, invoiceId]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      let data = response.data || response;
      if (data.data && typeof data.data === 'object') {
        data = data.data;
        if (data.data && typeof data.data === 'object') {
          data = data.data;
        }
      }
      const transformed = transformInvoiceData(data);
      setInvoice(transformed);
    } catch (err) {
      console.error("❌ Error fetching invoice:", err);
      setError(err.message || "Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const transformInvoiceData = (data) => {
    if (!data) return null;

    const accommodationDetails = data.accommodationDetails || [];
    const otherServices = data.otherServices || [];
    const transactions = [];

    // --- Transaction Processing ---

    // 1. Accommodation Rows
    accommodationDetails.forEach((acc, index) => {
      transactions.push({
        id: `acc-${index}`,
        description: "Package Rate",
        // Format rate exactly like Grand Aras: EUR amount / Exchange Rate
        rate: `${(data.actualRate || 0).toFixed(2)} EUR / ${(data.exchangeRate || 0).toFixed(5)}`,
        date: formatDate(acc.date || data.arrivalDate),
        debit: acc.rate || 0,
        credit: null,
        sortDate: new Date(acc.date || data.arrivalDate) // Helper for sorting if needed
      });
    });

    // 2. Other Services
    otherServices.forEach((service, index) => {
      transactions.push({
        id: `svc-${index}`,
        description: service.name || service.service_name || "Service",
        rate: "", // Services usually don't show the rate breakdown in this column
        date: formatDate(service.date || service.service_date),
        debit: parseFloat(service.amount || service.gross_amount || 0),
        credit: null,
        sortDate: new Date(service.date || service.service_date)
      });
    });
    transactions.sort((a, b) => a.sortDate - b.sortDate);
    // --- Calculations (Preserved from TRYP Logic) ---

    // d = room taxable base
    const d = parseFloat(data.taxable_amount_room || data.taxableAmountRoom || 0);
    // e = sum of services taxable
    const e = otherServices.reduce((sum, s) => sum + parseFloat(s.taxable_amount || 0), 0);
    // f = d + e (KDV Matrahı)
    const f = d + e;
    // g = room VAT 10%
    const g = parseFloat(data.vat_10_percent || data.vatTotal || 0);
    // h = services VAT 20%
    const h = otherServices.reduce((sum, s) => sum + parseFloat(s.vat_20_percent || 0), 0);
    // i = total VAT
    const i = g + h;
    // j = acc tax = d * 0.02
    const j = Number((d * 0.02).toFixed(2));
    // k = total inc VAT
    const k = f + i + j;

    const exchangeRate = parseFloat(data.exchangeRate || data.exchange_rate || 0);
    const m = (exchangeRate > 0) ? Number((k / exchangeRate).toFixed(2)) : 0;

    return {
      meta: {
        folio: data.folio_number || data.voucherNo || "",
        date: formatDate(data.invoiceDate),
        vatOffice: data.vd || "" ,
        vatNo: data.vNo || "",
        company: {
          name: "Azar Tourism Services",
          addressLine1: "Algeria Square Building Number 12 First Floor, Tripoli, Libya",

        },
        hotel: { logoUrl: logo }
      },
      guest: {
        name: data.guestName || "Guest",
        room: data.roomNo || "",
        arrival: formatDate(data.arrivalDate),
        departure: formatDate(data.departureDate),
        adults: data.paxAdult || 1,
        children: data.paxChild || 0,
        passport: data.passportNo || "",
        user: data.userId || "",
        cashierNo: data.batchNo || "1",
        voucherNo: data.voucherNo || "", // Added to match Grand Aras fields
        crsNo: ""
      },
      transactions,
      totals: {
        taxTable: [
          { rate: "%10", base: d, amount: g },
          { rate: "%20", base: e, amount: h }
        ].filter(tax => tax.base > 0 || tax.amount > 0),
        exchangeRates: {
          usd: 38.6761, // specific hardcoded value from your example
          eur: exchangeRate
        },
        totalEuro: m,
        summary: {
          totalAmount: k, // Check if this should be f or k based on label. Usually "Total Amount" before tax is f.
          // Grand Aras uses: totalAmount = totalTaxableAmount (f). Let's stick to your TRYP logic or Grand Aras?
          // Grand Aras: totalAmount = Taxable. TRYP: totalAmount = Grand Total.
          // I will use Grand Aras logic for the SUMMARY display to match the visual expectations if the labels are "Total Amount" vs "Inc VAT"

          // Re-mapping to match Grand Aras visual slots:
          totalAmount: f, // Matches "Total Amount" slot (usually taxable base)
          taxableAmount: f, // Matches "Taxable Amount" slot
          totalVat: i,
          accTax: j,
          totalIncVat: k,
          deposit: -k,
          balance: 0.00,
        
        }
      }
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return `${day}.${month}.${year}`;
    } catch { return dateString; }
  };

  const numberToTurkishWords = (amount) => {
    const rounded = Math.round(amount * 100) / 100;
    const lira = Math.floor(rounded);
    const kurus = Math.round((rounded - lira) * 100);
    return `Yalnız ${lira.toLocaleString('tr-TR')} Türk Lirası ${kurus} Kuruştur`;
  };

  useEffect(() => {
    if (invoice && invoice.transactions) {
      const pages = [];
      const totalTransactions = invoice.transactions.length;

      for (let i = 0; i < totalTransactions; i += ROWS_PER_PAGE) {
        pages.push({
          transactions: invoice.transactions.slice(i, i + ROWS_PER_PAGE),
          pageNum: pages.length + 1,
          isLastPage: i + ROWS_PER_PAGE >= totalTransactions
        });
      }

      if (pages.length === 0) {
        pages.push({
          transactions: [],
          pageNum: 1,
          isLastPage: true
        });
      }

      setPaginatedData(pages);
    }
  }, [invoice]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    // 1. Style Guard (Tailwind v4 Bypass)
    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
      style.parentNode.removeChild(style);
    });

    try {
      // 3. Image Loading Verification
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Small delay to ensure layout is settled
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2 & 4. Targeting and Smart Pagination
      const element = invoiceRef.current;
      const opt = {
        margin: 0,
        filename: `TRYP_Invoice_${invoice.meta.folio}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      // Generate PDF
      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("❌ PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      // 5. Instant Recovery (Styles Restore)
      headStyles.forEach(style => {
        document.head.appendChild(style);
      });
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  // Helper component from Grand Aras
  const InfoItem = ({ label, value, width = "65px" }) => (
    <div className="grid-item" style={{ display: 'flex', alignItems: 'flex-start' }}>
      <div style={{
        width: width,
        minWidth: width,
        display: 'flex',
        justifyContent: 'space-between',
        marginRight: '6px'
      }}>
        <span>{label}</span>
        <span>:</span>
      </div>
      <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </div>
  );

  if (!invoice) {
    return (
      <InvoiceTemplate loading={loading} error={error} invoice={invoice} onBack={() => navigate("/invoices")}>
        <></>
      </InvoiceTemplate>
    );
  }

  return (
    <InvoiceTemplate
      loading={loading}
      error={error}
      invoice={invoice}
      pdfLoading={pdfLoading}
      onDownloadPDF={handleDownloadPDF}
      onPrint={handlePrint}
      onBack={() => navigate("/invoices")}
    >
      {/* --- STYLES --- 
         Copied exactly from GrandArasInvoiceView to ensure identical look 
      */}
      <style>{`
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size:9.5px; }

        .invoice-page {
          background-color: white;
          width: 100%;
          max-width: 794px;
          min-height: 296mm;
          margin: 0 auto;
          padding: 40px 50px;
          color: #000;
          position: relative;
          box-sizing: border-box;
          page-break-inside: avoid;
          page-break-after: always;
        }

        .invoice-page:last-child {
          page-break-after: auto;
        }

        .header-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .company-details { display: flex; flex-direction: column; justify-content: center; width: 65%; line-height: 1.4; }
        .company-name { font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 2px; }
        .logo-container { text-align: right; width: 35%; padding-right: 50px; }
        /* Adjusted logo size slightly for TRYP shape if needed, but kept class same */
        .logo-img { max-width: 110px; height: auto; }

        .meta-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .guest-name { margin-top: 4px; margin-bottom: 3px;  }

        .info-grid {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr 1fr 1.8fr 1.2fr;
          gap: 2px 10px;
          margin-bottom: 5px;
        }

        .grid-item { white-space: nowrap; }

        .main-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #000; }
        .main-table thead tr { background-color: #f0f0f0; }
        .main-table th { text-align: left; padding: 4px 6px; font-weight: normal; }
        .main-table td { padding: 4px 6px; vertical-align: top; }

        .col-desc { width: 62%; }
        .col-date { width: 15%; }
        /* Update these specific classes */
        .col-debit { 
          text-align: right !important; 
          padding-right: 30px !important; 
        width: 100px;
      }

    .col-credit { 
        text-align: right !important; 
      padding-right: 10px !important; 
      width: 100px;
    }

        
    .main-table th.col-debit, 
  .main-table th.col-credit { 
    text-align: right; 
    }
        .desc-with-rate { display: flex; column-gap: 182px; align-items: center; }
        .rate-value { padding-right: 20px; }

        .footer-section { display: flex; justify-content: space-between; margin-top: 20px; }
        .footer-left { width: 45%; }
        .footer-right { width: 45%; text-align: right; margin-top: -10px; }

        .tax-table { width: 90%; border-collapse: collapse; margin-bottom: 15px; margin-top: -10px; }
        .tax-table th { background-color: #f0f0f0; text-align: center; font-weight: normal; }
        .tax-table td { text-align: center; }

        .exchange-info { line-height: 1.4; margin-bottom: 15px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .payment-header { margin-top: 15px; margin-bottom: 3px; text-align: left; }
        .balance-row { margin-top: 15px; font-weight: bold; }

        @media print {
          .invoice-page { width: 100%; padding: 20px; box-shadow: none; min-height: auto; }
          .no-print { display: none !important; }
          .main-table thead tr, .tax-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div ref={invoiceRef}>
        {paginatedData.map((page, pageIdx) => (
          <div key={pageIdx} className="invoice-page">
            <div className="header-section">
              <div className="company-details">
                <div className="company-sub">{invoice.meta.company.name}</div>
                <div>{invoice.meta.company.addressLine1}</div>
                <div>{invoice.meta.company.addressLine2 || "İSTANBUL / TÜRKİYE"}</div>
              </div>
              <div className="logo-container">
                <img src={invoice.meta.hotel.logoUrl} alt="Logo" className="logo-img" />
              </div>
            </div>

            <div className="meta-row">
              <div>V.D. &nbsp; : &nbsp; {invoice.meta.vatOffice}</div>
              <div style={{ marginRight: "5px" }}>Date/Tarih : &nbsp; {invoice.meta.date}</div>
            </div>
            <div className="meta-row">
              <div>V. NO : &nbsp; {invoice.meta.vatNo}</div>
              <div></div>
            </div>

            <div className="guest-name">{invoice.guest.name}</div>

            <div className="info-grid">
              <InfoItem label="Room/Oda" value={invoice.guest.room} width="65px" />
              <InfoItem label="Arrival/Giriş" value={invoice.guest.arrival} width="75px" />
              <InfoItem label="Adult/Yetişkin" value={invoice.guest.adults} width="75px" />
              <InfoItem label="Passport No - TC No" value={invoice.guest.passport} width="110px" />
              <InfoItem label="User/Kullanıcı" value={invoice.guest.user} width="85px" />

              <InfoItem label="Folio No" value={invoice.meta.folio} width="65px" />
              <InfoItem label="Departure/Çıkış" value={invoice.guest.departure} width="75px" />
              <InfoItem label="Child/Çocuk" value={invoice.guest.children} width="75px" />
              <InfoItem label="Crs No/Voucher No" value={invoice.guest.voucherNo} width="110px" />
              <InfoItem label="Csh No/Kasa No" value={invoice.guest.cashierNo} width="85px" />

              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <InfoItem label="Page/Sayfa" value={`${page.pageNum} / ${paginatedData.length}`} width="85px" />
            </div>

            <table className="main-table">
              <thead>
                <tr>
                  <th className="col-desc">Açıklama/Description</th>
                  <th className="col-date">Date/Tarih</th>
                  <th className="col-debit"><span className='innercol-debit'>Debit/Borç</span></th>
                  <th className="col-credit">Credit/Alacak</th>
                </tr>
              </thead>
              <tbody>
                {page.transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td>
                      {txn.rate ? (
                        <div className="desc-with-rate">
                          <span>{txn.description}</span>
                          <span className="rate-value">{txn.rate}</span>
                        </div>
                      ) : (
                        txn.description
                      )}
                    </td>
                    <td >{txn.date}</td>
                    <td className="col-debit">
                      {txn.debit !== null && txn.debit !== undefined ? 
                        Number(txn.debit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                        : ''}
                    </td>
                    <td className="col-credit">
                      {txn.credit !== null && txn.credit !== undefined ? 
                        Number(txn.credit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {page.isLastPage && (
              <div className="footer-section">
                <div className="footer-left">
                  <table className="tax-table">
                    <thead>
                      <tr>
                        <th>Tax Rate<br />KDV Oranı</th>
                        <th>Tax Base<br />KDV Matrahı</th>
                        <th>Tax Amount<br />KDV Tutarı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.totals.taxTable.map((tax, index) => (
                        <tr key={index}>
                          <td>{tax.rate}</td>
                          <td>{tax.base.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td>{tax.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="exchange-info">
                    Room Check-in EUR Exch. Rate &nbsp;&nbsp; {invoice.totals.exchangeRates.eur.toFixed(5)} TRY<br />
                    Total in EUR : &nbsp;&nbsp; {invoice.totals.totalEuro.toFixed(2)} EUR
                  </div>

                  <div className="amount-in-words">
                    {invoice.totals.textAmount}
                  </div>
                </div>

                <div className="footer-right">
                  <div className="totals-row"><span>Total Amount/Toplam Tutar</span><span>{invoice.totals.summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                  <div className="totals-row"><span>Taxable Amount/KDV Matrahı</span><span>{invoice.totals.summary.taxableAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                  <div className="totals-row"><span>Total VAT/Hesaplanan KDV</span><span>{invoice.totals.summary.totalVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                  <div className="totals-row"><span>Total Acc Tax/Konaklama Vergisi</span><span>{invoice.totals.summary.accTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                  <div className="totals-row"><span>Total Inc.Vat/KDV Dahil Tutar</span><span>{invoice.totals.summary.totalIncVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>

                  <div className="payment-header">Payments/Ödemeler</div>
                  <div className="totals-row"><span>Deposit Transfer at C/IN</span><span>{invoice.totals.summary.deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>

                  <div className="totals-row balance-row"><span>Balance/Bakiye</span><span>{invoice.totals.summary.balance.toFixed(2)}</span></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default TRYPInvoiceView;
