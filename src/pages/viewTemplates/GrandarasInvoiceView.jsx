import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "react-router-dom";
const logo = '/grandaras-logo.png';
import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
import toast from "react-hot-toast";
import { InvoiceTemplate } from "../../components";
import html2pdf from 'html2pdf.js';

const GrandArasInvoiceView = ({ invoiceData }) => {
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
      console.log("this is Transformed Data", transformed);


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
      console.log("this is all data", transformed);

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

    console.log("📊 Original accommodationDetails:", accommodationDetails);
    console.log("📊 Original otherServices:", otherServices);

    // Calculate daily room amount based on total_room_all_nights / nights
    const nights = data.nights || 13;
    const dailyRoomAmount = (data.total_room_all_nights || 0) / nights;

    console.log("📊 Nights:", nights, "Daily room amount:", dailyRoomAmount);

    // Create room transactions for each night
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(data.arrivalDate);
      currentDate.setDate(currentDate.getDate() + i);

      transactions.push({
        id: i + 1,
        description: "Room",
        rate: `${(data.actualRate || 220).toFixed(2)} EUR / ${(data.exchangeRate || 48.7707).toFixed(5)}`,
        date: formatDate(currentDate),
        debit: dailyRoomAmount.toFixed(2),
        credit: null,
        sortDate: new Date(currentDate)
      });
    }

    // Add other services with their dates
    let serviceId = transactions.length + 1;
    otherServices.forEach(service => {
      const serviceDate = service.date || service.service_date || data.arrivalDate;
      transactions.push({
        id: serviceId++,
        description: service.name || service.service_name || "Service",
        rate: "",
        date: formatDate(serviceDate),
        debit: service.amount || service.gross_amount || 0,
        credit: null,
        sortDate: new Date(serviceDate)
      });
    });

    // Sort ALL transactions by date
    transactions.sort((a, b) => a.sortDate - b.sortDate);

    // Reassign IDs based on sorted order
    transactions.forEach((txn, index) => {
      txn.id = index + 1;
    });

    // Calculate totals from actual data
    const taxableAmountRoom = parseFloat(data.taxable_amount_room || data.taxable_amount || 124539.42);
    const taxableAmountServices = otherServices.reduce((sum, s) => sum + parseFloat(s.taxable_amount || 0), 0);
    const totalTaxableAmount = taxableAmountRoom + taxableAmountServices;

    const vat10Percent = parseFloat(data.vat7 || data.vat_10_percent || data.vat1_10 || 12453.94);
    const vat20Percent = parseFloat(data.vat20 || 850);
    const otherServicesVat = otherServices.reduce((sum, s) => sum + parseFloat(s.vat_20_percent || 0), 0);
    const totalVat = data.vatTotal;
    const accommodationTax = parseFloat(data.accommodation_tax || data.accommodationTaxTotal || 2490.79);
    const grandTotal = parseFloat(data.grandTotal || 144584.15);
    const exchangeRate = parseFloat(data.exchangeRate || 48.7707);
    const totalEuro = exchangeRate > 0 ? (grandTotal / exchangeRate) : 0;

    console.log("📊 Calculated totals:", {
      taxableAmountRoom,
      taxableAmountServices,
      totalTaxableAmount,
      vat10Percent,
      vat20Percent,
      totalVat,
      accommodationTax,
      grandTotal,
      exchangeRate,
      totalEuro
    });

    return {
      meta: {
        folio: data.folio_number || data.vNo || "9090",
        date: formatDate(data.invoiceDate),
        vatOffice: data.vd || "70000000",
        vatNo: data.vNo || "22-4340",
        company: {
          name: "AZAR TOURISM",
          subName: "Azar Tourism Services",
          addressLine1: "Algeria Square Building Number 12 First Floor, Tripoli, Libya, P.O.BOX Number: 1254",

        },
        hotel: { logoUrl: logo }
      },
      guest: {
        name: data.guestName || "Muhammad Haris Javaid",
        room: data.roomNo || "100",
        arrival: formatDate(data.arrivalDate),
        departure: formatDate(data.departureDate),
        adults: data.paxAdult || 1,
        children: data.paxChild || 0,
        passport: data.passportNo || data.confirmation || "AB456789",
        user: data.userId || "Azar",
        cashierNo: data.batchNo || data.cshNo || data.cashNo || "7737",
        voucherNo: data.voucherNo || "22-4340",
        crsNo: data.voucherNo || "22-4340"
      },
      transactions,
      totals: {
        taxTable: [
          { rate: "%10", base: taxableAmountRoom, amount: vat10Percent },
          { rate: "%20", base: taxableAmountServices, amount: otherServicesVat }
        ].filter(tax => tax.base > 0 || tax.amount > 0),
        exchangeRates: { eur: exchangeRate },
        totalEuro: totalEuro,
        textAmount: numberToTurkishWords(grandTotal),
        summary: {
          totalAmount: totalTaxableAmount,
          taxableAmount: totalTaxableAmount,
          totalVat: totalVat,
          accTax: accommodationTax,
          totalIncVat: grandTotal,
          deposit: -grandTotal,
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

    // 1. Style Guard (Tailwind v4 Bypass)
    // Save and temporarily remove CSS files to avoid oklch crash
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
        filename: `GrandAras_Invoice_${invoice.meta.folio}.pdf`,
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

  // Helper component to ensure colons align perfectly
  // width prop determines how wide the label area is before the colon
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
      <div ref={invoiceRef}>
        <style>{`
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size:9.5px; }

          .invoice-page {
            background-color: white;
            width: 100%;
            max-width: 794px;
            min-height: 296mm; /* Slightly less than 297mm to prevent rounding errors adding blank pages */
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
          .logo-img { max-width: 122px; height: auto; }

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
          .main-table td { padding: 2px 6px; vertical-align: top; }
          .main-table th.col-debit, 
          .main-table th.col-credit { 
            text-align: right; 
            padding-right: 9px; 
          }

          .col-desc { width: 62%; }
          .col-date { width: 15%; }
          .col-debit { 
              width: 100px;           
              text-align: right;    
              padding-right: 25px !important;  
            }
          .col-credit { 
              width: 100px; 
              text-align: right; 
              padding-right: 15px; 
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

        {paginatedData.map((page, pageIdx) => (
          <div key={pageIdx} className="invoice-page">
            <div className="header-section">
              <div className="company-details">
                <div className="company-sub">Azar Tourism Services</div>
                <div>Algeria Square Building Number 12 First Floor, Tripoli, Libya</div>
              </div>
              <div className="logo-container">
                <img src={invoice.meta.hotel.logoUrl} alt="Logo" className="logo-img" />
              </div>
            </div>

            <div className="meta-row">
              <div>V.D. &nbsp; : &nbsp; {invoice.meta.vatOffice || " "}</div>
              <div>Date/Tarih : &nbsp; {invoice.meta.date}</div>
            </div>
            <div className="meta-row">
              <div>V. NO : &nbsp; {invoice.meta.vatNo || " "}</div>
              <div></div>
            </div>

            <div className="guest-name">{invoice.guest.name}</div>

            <div className="info-grid">
              {/* Row 1 */}
              <InfoItem label="Room/Oda" value={invoice.guest.room} width="65px" />
              <InfoItem label="Arrival/Giriş" value={invoice.guest.arrival} width="75px" />
              <InfoItem label="Adult/Yetişkin" value={invoice.guest.adults} width="75px" />
              <InfoItem label="Passport No - TC No" value={invoice.guest.passport} width="110px" />
              <InfoItem label="User/Kullanıcı" value={invoice.guest.user} width="85px" />

              {/* Row 2 */}
              <InfoItem label="Folio No" value={invoice.meta.folio} width="65px" />
              <InfoItem label="Departure/Çıkış" value={invoice.guest.departure} width="75px" />
              <InfoItem label="Child/Çocuk" value={invoice.guest.children} width="75px" />
              <InfoItem label="Crs No/Voucher No" value={invoice.guest.voucherNo || invoice.guest.crsNo || ''} width="110px" />
              <InfoItem label="Csh No/Kasa No" value={invoice.guest.cashierNo} width="85px" />

              {/* Row 3 - Page Number */}
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
                    <td>{txn.date}</td>
                    <td className="col-debit">{txn.debit ? (parseFloat(txn.debit)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
                    <td className="col-credit">{txn.credit ? (parseFloat(txn.credit)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
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
                    Room Check-in EUR Exch. Rate &nbsp;&nbsp; {invoice.totals.exchangeRates.eur.toFixed(4)} TRY<br />
                    Total in EUR : &nbsp;&nbsp; {invoice.totals.totalEuro.toFixed(2)} EUR
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

export default GrandArasInvoiceView;
