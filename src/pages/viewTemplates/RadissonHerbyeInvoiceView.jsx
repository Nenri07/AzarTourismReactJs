import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/radisson_blu_turkey-logo.png';

// ─────────────────────────────────────────────────────────────────────────────
// PURE HELPERS  
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
  } catch { return dateStr; }
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "0,00";
  return parseFloat(val).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseDateForSort = (dateStr) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

// ─────────────────────────────────────────────────────────────────────────────
// API → VIEW SCHEMA MAPPER
// ─────────────────────────────────────────────────────────────────────────────

const mapApiDataToInvoice = (data = {}) => {
  const accItems = [];
  (data.accommodationDetails || []).forEach((night) => {
    const he = night.hotelExpenses;
    const at = night.accommodationTax;

    if (he) {
      accItems.push({
        id:           `he_${night.day}`,
        rawDate:      parseDateForSort(he.date),
        date:         formatDate(he.date),
        desc:         he.description,
        qty:          he.qty,
        netUnitPrice: he.netUnitPrice,
        netAmount:    he.netAmount,
        tax:          he.tax,
        taxAmt:       he.taxAmount,
        debit:        he.debit,
        credit:       he.credit || "",
      });
    }

    if (at) {
      accItems.push({
        id:           `at_${night.day}`,
        rawDate:      parseDateForSort(at.date),
        date:         formatDate(at.date),
        desc:         at.description,
        qty:          at.qty,
        netUnitPrice: at.netUnitPrice,
        netAmount:    at.netAmount,
        tax:          at.tax,
        taxAmt:       at.taxAmount,
        debit:        at.debit,
        credit:       at.credit || "",
      });
    }
  });

  const serviceItems = (data.otherServices || []).map((svc, i) => ({
    id:           `svc_${i}`,
    rawDate:      parseDateForSort(svc.date),
    date:         formatDate(svc.date),
    desc:         svc.name,
    qty:          1,
    netUnitPrice: svc.taxable_amount,
    netAmount:    svc.taxable_amount,
    tax:          "20%",
    taxAmt:       svc.vat_20_percent,
    debit:        svc.amount,
    credit:       "",
  }));

  const allItems = [...accItems, ...serviceItems].sort(
    (a, b) => a.rawDate - b.rawDate
  );

  const taxableRoom     = data.taxableAmount        || 0;   
  const totalAccTax     = data.totalAccTax          || 0;   
  const grandTotal      = data.grandTotal           || 0;   
  const totalVat10      = data.totalVat10           || 0;   
  const totalVat20      = data.totalVat20           || 0;   
  const totalSvcGross   = data.totalServicesGross   || 0;   
  const totalSvcTaxable = data.totalServicesTaxable || 0;   
  const totalRoomGross  = data.totalRoomAllNights   || 0;   

  const taxRows = [];

  if (totalAccTax > 0) {
    taxRows.push({
      label:     "Accommodation Tax",
      taxRate:   "0%",
      netAmount: totalAccTax,
      taxAmt:    0,
      debit:     totalAccTax,
    });
  }

  if (taxableRoom > 0) {
    taxRows.push({
      label:     "VAT",
      taxRate:   "10%",
      netAmount: taxableRoom,
      taxAmt:    totalVat10,
      debit:     taxableRoom + totalVat10,
    });
  }

  if (totalSvcTaxable > 0) {
    taxRows.push({
      label:     "VAT",
      taxRate:   "20%",
      netAmount: totalSvcTaxable,
      taxAmt:    totalVat20,
      debit:     totalSvcGross,
    });
  }

  const taxTotalNetAmount = taxableRoom + totalAccTax + totalSvcTaxable;
  const taxTotalTaxAmt    = totalVat10 + totalVat20;

  return {
    invoiceNo:    data.invoiceNo       || data.invoiceN || "", 
    billingDate:  formatDate(data.billingDate  || data.invoiceDate) || "",
    roomNo:       data.roomNo          || "",
    pax:          data.pax             || 1,
    guestName:    data.guestName       || "",
    checkInDate:  formatDate(data.arrivalDate)   || "",
    checkOutDate: formatDate(data.departureDate) || "",

    party:       data.party       || "",
    branch:      data.branch      || "",
    reservation: data.reservation || "",
    voucher:     data.voucherNo   || data.reservation || "",

    items: allItems,

    summary: {
      subtotal:         totalRoomGross,
      accommodationTax: totalAccTax,
      grandTotal:       grandTotal,
      balance:          data.balance || 0,
    },

    taxRows,
    taxTotalNetAmount,
    taxTotalTaxAmt,
    grandTotal,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION (FIXED LOGIC)
// ─────────────────────────────────────────────────────────────────────────────
const buildPages = (items = []) => {
  if (items.length === 0) {
    return [{ items: [], showTotals: true, pageNo: 1, totalPages: 1 }];
  }
  
  const pages = [];
  const MAX_ROWS_NORMAL = 24;
  const MAX_ROWS_WITH_TOTALS = 14; 

  for (let i = 0; i < items.length;) {
    const remaining = items.length - i;
    let take = 0;
    let isLastPage = false;

    if (remaining <= MAX_ROWS_WITH_TOTALS) {
      take = remaining;
      isLastPage = true;
    } else if (remaining <= MAX_ROWS_NORMAL && remaining > MAX_ROWS_WITH_TOTALS) {
      take = remaining;
      isLastPage = false; 
    } else {
      take = MAX_ROWS_NORMAL;
    }

    pages.push({
      items: items.slice(i, i + take),
      showTotals: isLastPage,
    });
    i += take;

    if (i >= items.length && !isLastPage) {
      pages.push({
        items: [],
        showTotals: true
      });
      break;
    }
  }

  const total = pages.length;
  pages.forEach((p, idx) => { p.pageNo = idx + 1; p.totalPages = total; });
  return pages;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const RadissonHerbyeInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();

  const [invoice,        setInvoice]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const [paginatedData,  setPaginatedData]  = useState([]);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    setInvoice(mapApiDataToInvoice(invoiceData || {}));
    setLoading(false);
  }, [invoiceData]);

  useEffect(() => {
    if (!invoice?.items) return;
    setPaginatedData(buildPages(invoice.items));
  }, [invoice]);

  useEffect(() => {
    if (isPdfDownload && invoice && invoiceRef.current) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice, navigate]);

  const handleDownloadPDF = async () => {
  if (!invoiceRef.current) return;
  setPdfLoading(true);

  // Remove all stylesheets to avoid oklch/Tailwind crash in html2canvas
  const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
  headStyles.forEach(style => style.parentNode.removeChild(style));

  try {
    const images = invoiceRef.current.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    }));
    await new Promise(resolve => setTimeout(resolve, 500));

    const opt = {
      margin:    0,
      filename:  `Radisson_Invoice_${invoice.invoiceNo || 'Invoice'}.pdf`,
      image:     { type: 'jpeg', quality: 3 },
      html2canvas: {
        scale:           4,
        useCORS:         true,
        letterRendering: true,
        scrollY:         0,
        windowWidth:     794,
      },
      jsPDF:     { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    await html2pdf().set(opt).from(invoiceRef.current).save();
    toast.success("PDF Downloaded");
  } catch (err) {
    console.error("PDF Error:", err);
    toast.error("PDF generation failed");
  } finally {
    // Restore all stylesheets
    headStyles.forEach(style => document.head.appendChild(style));
    setPdfLoading(false);
  }
};

  if (!invoice) return null;

  const styles = `
    @page { size: A4; margin: 0mm; }

    * { box-sizing: border-box; }

    .invoice-box {
      width: 100%;
      font-family: Arial, sans-serif;
      font-size: 9px;
      color: #000;
      background: transparent;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .inv-page {
      width: 100%;
      max-width: 794px;
      padding: 8mm 10mm 6mm 10mm;
      margin: 0 auto 24px auto;
      background: #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      page-break-after: always;
      break-after: page;
      position: relative;
    }
    .inv-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
      margin-bottom: 0;
    }

    .logo-container {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }
    .logo-container img { max-width: 190px; margin-bottom: 37px; }

    .top-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 60px;
      font-size: 8px;
    }
    .address-block p { margin: 0; line-height: 1.45; }
    .address-block .bold { font-weight: bold; }
    .address-block .inline-info { display: flex; gap: 20px; }
    .copy-text { font-weight: bold; font-size: 9px; margin-top: 30px; margin-right: 275px; }

    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 4px 2px; vertical-align: top; }
    .text-right  { text-align: right  !important; }
    .text-center { text-align: center !important; }

    .guest-table th {
      text-align: left;
      font-weight: bold;
      font-style: italic;
      font-size: 8px;
    }
    .guest-table th span { text-decoration: underline; }
    .guest-table td { padding-bottom: 30px; }

    .items-table th {
      text-align: left;
      font-weight: bold;
      font-style: italic;
      font-size: 8px;
    }
    .items-table th span { text-decoration: underline; }
    .items-table { margin-bottom: 16px; }
    .items-table tbody tr td { line-height: 1.4; }

    .summary-wrapper { display: flex; justify-content: flex-end; margin-bottom: 16px; }
    .summary-table { width: 58%; }
    .summary-table td { padding: 3px 0; }

    .payment-wrapper { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .payment-block   { width: 62%; }
    .payment-title   { font-weight: bold; font-style: italic; }
    .payment-row     { display: flex; justify-content: space-between; padding: 5px 0; }
    .payment-line    { border-bottom: 1px solid #000; margin: 2px 0; }

    .tax-wrapper { display: flex; justify-content: flex-end; }
    .tax-table   { width: 80%; }
    .tax-table th {
      font-weight: bold;
      font-style: italic;
      font-size: 8px;
      padding-bottom: 0;
    }
    .tax-line-header, .tax-line-footer { border-bottom: 1px solid #000; padding: 0 !important; }
    .tax-table td { padding: 2px 2px; }
    .tax-total-row td { padding-top: 8px; }

    .signature-block {
      margin-bottom: 20px;
      display: flex;
      align-items: flex-end;
    }
    .sig-text { margin-right: 105px; }
    .sig-line { border-bottom: 1px solid #000; width: 100px; display: inline-block; }

    .notes-block { margin-bottom: 40px; }

    .bottom-footer { font-size: 8px; line-height: 1.5; color: #000; }
    .bottom-footer p { margin: 1px 0; }

    @media print {
      .invoice-box { background: none !important; }
      .inv-page {
        box-shadow: none !important;
        margin: 0 0 !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .inv-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .no-print { display: none !important; }
    }
  `;

  const PageHeader = ({ page }) => (
    <>
      <div className="logo-container">
        <img src={logo} alt="Radisson Logo" />
      </div>

      <div className="top-section">
        <div className="address-block">
          <p style={{ fontStyle: 'italic', fontWeight: 'bold', textDecoration: 'underline' }}>
            Fiscal Information
          </p>
          <p>/</p>
          <p>AZAR TOURISM</p>
          <p>ALGERIA SQUARE BUILDING NUMBER 12 FIRST FLOOR 12/1</p>
          <p>1254</p>
          <p>TRIPOLI - Libya</p>
          <div className="inline-info">
            <p><span className="bold">Party</span> {invoice.party}</p>
            <p><span className="bold">Branch</span> {invoice.branch}</p>
          </div>
          <div className="inline-info">
            <p><span className="bold">Reservation</span> {invoice.reservation}</p>
            <p><span className="bold">Voucher</span> {invoice.voucher}</p>
          </div>
        </div>
        <div className="copy-text">Copy</div>
      </div>

      <table className="guest-table">
        <thead>
          <tr>
            <th><span>Invoice N</span></th>
            <th><span>Billing Date</span></th>
            <th><span>Room</span></th>
            <th><span>PAX</span></th>
            <th><span>Main Guest Name</span></th>
            <th><span>Check in Date</span></th>
            <th><span>Check out Date</span></th>
            <th><span>Page</span></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{invoice.invoiceNo}</td>
            <td>{invoice.billingDate}</td>
            <td>{invoice.roomNo}</td>
            <td>{invoice.pax}</td>
            <td style={{ whiteSpace: 'pre-wrap' }}>{invoice.guestName}</td>
            <td>{invoice.checkInDate}</td>
            <td>{invoice.checkOutDate}</td>
            <td>{page.pageNo}/{page.totalPages}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const PageFooter = () => (
    <div className="bottom-footer" style={{ marginTop: 'auto', paddingTop: '10px' }}>
      <p>Radisson Hotel Istanbul Harbiye</p>
      <p>Cumhuriyet Caddesi No: 8 Harbiye, 34367 Istanbul, Turkey</p>
      <p>T: +90 (212) 3686868 | info.harbiye.istanbul@radissonhotels.com</p>
      <p>https://www.radissonhotels.com/en-us/hotels/radisson-istanbul-harbiye</p>
      <p>Harbiye Otelcilik ve Turizm A.S. — VD: Mecidiyeköy 8140462491</p>
      <p>Şekerbank TRY TR12 0005 9020 1013 0201 0050 23</p>
      <p>Şekerbank EUR TR46 0005 9020 1013 0201 0051 87</p>
      <p>Şekerbank USD TR73 0005 9020 1013 0201 0051 86</p>
    </div>
  );

  return (
    <InvoiceTemplate
      loading={loading}
      invoice={invoice}
      pdfLoading={pdfLoading}
      onDownloadPDF={handleDownloadPDF}
      onPrint={() => window.print()}
      onBack={() => navigate("/invoices")}
    >
      <div className="invoice-box" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{ __html: styles }} />

        {paginatedData.map((page, pageIdx) => (
          <div
            className="inv-page"
            key={pageIdx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '277mm',
            }}
          >
            <PageHeader page={page} />

            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}></th>
                  <th><span>Item</span></th>
                  <th className="text-center"><span>Qty</span></th>
                  <th className="text-right"><span>Net Unit Price</span></th>
                  <th className="text-right"><span>Net Amount</span></th>
                  <th className="text-right"><span>Tax</span></th>
                  <th className="text-right"><span>Tax Amt</span></th>
                  <th className="text-right"><span>Debit</span></th>
                  <th className="text-right"><span>Credit</span></th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.date}</td>
                    <td>{item.desc}</td>
                    <td className="text-center">{item.qty}</td>
                    <td className="text-right">{formatCurrency(item.netUnitPrice)}</td>
                    <td className="text-right">{formatCurrency(item.netAmount)}</td>
                    <td className="text-right">{item.tax}</td>
                    <td className="text-right">{formatCurrency(item.taxAmt)}</td>
                    <td className="text-right">{item.debit != null && item.debit !== "" ? formatCurrency(item.debit) : ""}</td>
                    <td className="text-right">{item.credit != null && item.credit !== "" ? formatCurrency(item.credit) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {page.showTotals && (
              <>
                <div className="summary-wrapper">
                  <table className="summary-table">
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'left' }}>Subtotal</td>
                        <td className="text-right">{formatCurrency(invoice.summary.subtotal)}</td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left' }}>Accommodation Tax</td>
                        <td className="text-right">{formatCurrency(invoice.summary.accommodationTax)}</td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left' }}>Total</td>
                        <td className="text-right">{formatCurrency(invoice.summary.grandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="payment-wrapper">
                  <div className="payment-block">
                    <div className="payment-title">Payment Method</div>
                    <div className="payment-row" style={{ marginBottom: '12px' }}>
                      <span>PREPAYMENT W/O INVOI</span>
                      <span>{formatCurrency(invoice.summary.grandTotal)} TRY</span>
                    </div>
                    <div className="payment-line" />
                    <div className="payment-row">
                      <span>Balance due</span>
                      <span>{formatCurrency(invoice.summary.balance)} TRY</span>
                    </div>
                  </div>
                </div>

                <div className="tax-wrapper">
                  <table className="tax-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', width: '20%' }}>Tax info</th>
                        <th className="text-center">Tax</th>
                        <th className="text-right">Net Amount</th>
                        <th className="text-right">Tax Amt</th>
                        <th className="text-right">Total Debit</th>
                        <th className="text-right">Total Credit</th>
                      </tr>
                      <tr><td colSpan="6" className="tax-line-header" /></tr>
                    </thead>
                    <tbody>
                      {invoice.taxRows.map((row, i) => (
                        <tr key={i} style={ i === invoice.taxRows.length - 1 ? { paddingBottom: '12px' } : {}}>
                          <td style={ i === invoice.taxRows.length - 1 ? { paddingBottom: '12px' } : {}}>{row.label}</td>
                          <td className="text-center">{row.taxRate}</td>
                          <td className="text-right">{formatCurrency(row.netAmount)}</td>
                          <td className="text-right">{formatCurrency(row.taxAmt)}</td>
                          <td className="text-right">{formatCurrency(row.debit)}</td>
                          <td></td>
                        </tr>
                      ))}
                      <tr><td colSpan="6" className="tax-line-footer" /></tr>
                      <tr className="tax-total-row">
                        <td style={{ fontWeight: 'bold' }}>Total</td>
                        <td></td>
                        <td className="text-right">{formatCurrency(invoice.taxTotalNetAmount)}</td>
                        <td className="text-right">{formatCurrency(invoice.taxTotalTaxAmt)}</td>
                        <td className="text-right">
                          {formatCurrency(invoice.grandTotal)} <strong>TRY</strong>
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="signature-block" style={{ marginTop: '16px' }}>
                  <span className="sig-text">Signature</span>
                  <span className="sig-line" />
                </div>

                <div className="notes-block">
                  ABOVE PRICES INCLUDE 10% VAT &amp; 2% ACCOMMODATION TAX
                </div>
              </>
            )}

            <PageFooter />
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default RadissonHerbyeInvoiceView;