import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "react-router-dom";
const logo = '/TRYP-Logo.png';
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

    accommodationDetails.forEach((acc, index) => {
      transactions.push({
        id: `acc-${index}`,
        description: "Package Rate",
        rate: `${(data.actualRate || 0).toFixed(2)} EUR / ${(data.exchangeRate || 0).toFixed(5)}`,
        date: formatDate(acc.date || data.arrivalDate),
        debit: acc.rate || 0,
        credit: null
      });
    });

    otherServices.forEach((service, index) => {
      transactions.push({
        id: `svc-${index}`,
        description: service.name || service.service_name || "Service",
        rate: "",
        date: formatDate(service.date || service.service_date),
        debit: service.amount || service.gross_amount || 0,
        credit: null
      });
    });

    const d = parseFloat(data.taxable_amount_room || data.taxableAmountRoom || 0);
    const e = otherServices.reduce((sum, s) => sum + parseFloat(s.taxable_amount || 0), 0);
    const f = d + e;
    const g = parseFloat(data.vat_10_percent || data.vatTotal || 0);
    const h = otherServices.reduce((sum, s) => sum + parseFloat(s.vat_20_percent || 0), 0);
    const i = g + h;
    const j = Number((d * 0.02).toFixed(2));
    const k = f + i + j;

    const exchangeRate = parseFloat(data.exchangeRate || data.exchange_rate || 0);
    const m = (exchangeRate > 0) ? Number((k / exchangeRate).toFixed(2)) : 0;

    return {
      meta: {
        folio: data.folio_number || data.voucherNo || "",
        date: formatDate(data.invoiceDate),
        vatOffice: "LIBYA",
        vatNo: "2222222222",
        company: {
          name: "Azar Tourism Services",
          addressLine1: "Algeria Square Building Number 12 First Floor, Tripoli, Libya, P.O.BOX Number: 1254",
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
        voucherNo: data.voucherNo || "",
      },
      transactions,
      totals: {
        taxTable: [
          { rate: "%10", base: d, amount: g },
          { rate: "%20", base: e, amount: h }
        ].filter(tax => tax.base > 0 || tax.amount > 0),
        exchangeRates: {
          eur: exchangeRate
        },
        totalEuro: m,
        textAmount: numberToTurkishWords(k),
        summary: {
          totalAmount: f,
          taxableAmount: f,
          totalVat: i,
          accTax: j,
          totalIncVat: k,
          deposit: -k,
          balance: 0.00
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

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
      style.parentNode.removeChild(style);
    });

    try {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

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

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("❌ PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      headStyles.forEach(style => {
        document.head.appendChild(style);
      });
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

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
      <InvoiceTemplate loading={loading} error={error} name="TRYP" onBack={() => navigate("/invoices")}>
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
      <style>{`
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size:9.5px; }

        .tryp-invoice-page {
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

        .tryp-invoice-page:last-child {
          page-break-after: auto;
        }

        .header-section { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .company-details { display: flex; flex-direction: column; justify-content: center; width: 60%; line-height: 1.3; }
        .company-sub { font-weight: bold; }
        .logo-container { text-align: right; width: 30%; }
        .logo-img { max-width: 88px; height: auto; }

        .meta-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .guest-name { margin-top: 4px; margin-bottom: 3px; font-weight: bold; }

        .info-grid {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr 1fr 1.8fr 1.2fr;
          gap: 2px 10px;
          margin-bottom: 5px;
        }

        .grid-item { white-space: nowrap; }

        .main-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #000; }
        .main-table thead tr { background-color: #f0f0f0; }
        .main-table th { text-align: left; padding: 4px 6px; font-weight: normal; border: 1px solid #000; }
        .main-table td { padding: 4px 6px; vertical-align: top; border-right: 1px solid #000; }
        .main-table td:last-child { border-right: none; }
        .main-table tr:last-child td { border-bottom: 1px solid #000; }

        .col-desc { width: 62%; }
        .col-date { width: 15%; }
        .col-debit { text-align: left; width: 12%; }
        .col-credit { text-align: right; width: 11%; }
        .desc-with-rate { display: flex; justify-content: space-between; align-items: center; }

        .footer-section { display: flex; justify-content: space-between; margin-top: 20px; }
        .footer-left { width: 45%; }
        .footer-right { width: 45%; text-align: right; }

        .tax-table { width: 90%; border-collapse: collapse; margin-bottom: 15px; }
        .tax-table th { background-color: #f0f0f0; text-align: center; font-weight: normal; border: 1px solid #ccc; }
        .tax-table td { text-align: center; border: 1px solid #ccc; padding: 2px; }

        .exchange-info { line-height: 1.4; margin-bottom: 15px; text-align: left; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .balance-row { margin-top: 15px; font-weight: bold; }

        @media print {
          .tryp-invoice-page { width: 100%; padding: 20px; box-shadow: none; min-height: auto; }
          .no-print { display: none !important; }
          .main-table thead tr, .tax-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div ref={invoiceRef}>
        {paginatedData.map((page, pageIdx) => (
          <div key={pageIdx} className="tryp-invoice-page">
            <div className="header-section">
              <div className="company-details">
                <div className="company-sub">{invoice.meta.company.name}</div>
                <div>{invoice.meta.company.addressLine1}</div>
                <div>{invoice.meta.company.addressLine2}</div>
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
                  <th className="col-debit">Debit/Borç</th>
                  <th className="col-credit">Credit/Alacak</th>
                </tr>
              </thead>
              <tbody>
                {page.transactions.map((txn, idx) => (
                  <tr key={idx}>
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
                    <td>{txn.date}</td>
                    <td className="col-debit">{txn.debit ? txn.debit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
                    <td className="col-credit">{txn.credit ? txn.credit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
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

                  <div className="amount-in-words" style={{ textAlign: 'left' }}>
                    {invoice.totals.textAmount}
                  </div>
                </div>

                <div className="footer-right">
                  <div className="totals-row"><span>Total Amount/Toplam Tutar</span><span>{invoice.totals.summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                  <div className="totals-row"><span>Taxable Amount/KDV Matrahı</span><span>{invoice.totals.summary.taxableAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                  <div className="totals-row"><span>Total VAT/Hesaplanan KDV</span><span>{invoice.totals.summary.totalVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                  <div className="totals-row"><span>Total Acc Tax/Konaklama Vergisi</span><span>{invoice.totals.summary.accTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                  <div className="totals-row" style={{ fontWeight: 'bold' }}><span>Total Inc.Vat/KDV Dahil Tutar</span><span>{invoice.totals.summary.totalIncVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>

                  <div style={{ textAlign: 'left', marginTop: '10px' }}>Payments/Ödemeler</div>
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
