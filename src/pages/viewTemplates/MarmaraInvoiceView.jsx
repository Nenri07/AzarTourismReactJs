import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/marmara-logo.png';

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
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}.${mm}.${yy}`;
  } catch { return dateStr; }
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "0.00";
  return parseFloat(val).toLocaleString('en-US', {
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
  const allItems = [];
  
  // 1. Accommodation Details (Handles both Radisson nested style and Marmara flat style)
  (data.accommodationDetails || []).forEach((night, idx) => {
    // A. MARMARA / FLAT STYLE (Expected for Marmara Taksim)
    if (!night.hotelExpenses && !night.accommodationTax) {
      if (night.description || night.rate || night.amount || night.debit) {
        allItems.push({
          id: `flat_${idx}`,
          rawDate: parseDateForSort(night.date),
          date: formatDate(night.date),
          desc: night.description || "Accommodation Package",
          debit: night.rate || night.amount || night.debit || 0,
          credit: night.credit || "",
          exchange: night.exchangeRate || data.exchangeRate || "",
        });
      }
    }

    if (night.hotelExpenses) {
      const he = night.hotelExpenses;
      allItems.push({
        id: `he_${idx}`,
        rawDate: parseDateForSort(he.date || night.date),
        date: formatDate(he.date || night.date),
        desc: he.description || "Accommodation Package",
        debit: he.debit || he.amount || 0,
        credit: he.credit || "",
        exchange: he.exchangeRate || night.exchangeRate || data.exchangeRate || "",
      });
    }
    if (night.accommodationTax) {
      const at = night.accommodationTax;
      allItems.push({
        id: `at_${idx}`,
        rawDate: parseDateForSort(at.date || night.date),
        date: formatDate(at.date || night.date),
        desc: at.description || "Accommodation TAX",
        debit: at.debit || at.amount || 0,
        credit: at.credit || "",
        exchange: "",
      });
    }
  });

  // 2. Other Services
  (data.otherServices || []).forEach((svc, i) => {
    allItems.push({
      id: `svc_${i}`,
      rawDate: parseDateForSort(svc.date),
      date: formatDate(svc.date),
      desc: svc.name || "Service",
      debit: svc.amount || 0,
      credit: svc.credit || "",
      exchange: svc.exchangeRate || 1.00,
    });
  });

  // Sort all items by rawDate
  allItems.sort((a, b) => a.rawDate - b.rawDate);

  const taxableRoom     = data.taxableAmount        || 0;   
  const totalAccTax     = data.totalAccTax          || 0;   
  const grandTotal      = data.grandTotal           || 0;   
  const totalVat10      = data.totalVat10           || 0;   
  const totalVat20      = data.totalVat20           || 0;   
  const totalSvcTaxable = data.totalServicesTaxable || 0;   
  const totalSvcGross   = data.totalServicesGross   || 0;   
  const totalRoomGross  = data.totalRoomAllNights   || 0;   

  const taxRows = [];
  if (totalAccTax > 0) {
    taxRows.push({
      label: "Accommodation Tax",
      taxRate: "0%",
      netAmount: totalAccTax,
      taxAmt: 0,
    });
  }
  if (taxableRoom > 0) {
    taxRows.push({
      label: "VAT",
      taxRate: "10%",
      netAmount: taxableRoom,
      taxAmt: totalVat10,
    });
  }
  if (totalSvcTaxable > 0) {
    taxRows.push({
      label: "VAT",
      taxRate: "20%",
      netAmount: totalSvcTaxable,
      taxAmt: totalVat20,
    });
  }

  const taxableBase = taxableRoom + totalSvcTaxable;

  return {
    invoiceNo:    data.invoiceNo       || data.invoiceN || "", 
    billingDate:  formatDate(data.billingDate  || data.invoiceDate) || "",
    roomNo:       data.roomNo          || "",
    pax:          data.pax             || 1,
    guestName:    data.guestName       || "",
    checkInDate:  formatDate(data.arrivalDate)   || "",
    checkOutDate: formatDate(data.departureDate) || "",
    party:        data.party           || "",
    branch:       data.branch          || "",
    reservation:  data.reservation      || "",
    voucher:      data.voucherNo       || data.reservation || "",
    
    // Additional Hotel Fields
    arNumber:     data.arNumber  || data.ar_number || "1",
    groupCode:    data.groupCode || data.group_code || "",
    cashierNo:    data.cashierNo || data.cashier_no || "",
    userId:       data.userId    || data.user_code  || "",
    folioNo:      data.folioNo   || data.folio_no   || data.invoiceNo || "",
    accountNo:    data.accountNo || data.account_no || "",

    items:        allItems,
    summary: {
      subtotal:         totalRoomGross,
      accommodationTax: totalAccTax,
      grandTotal:       grandTotal,
      balance:          data.balance || 0,
    },
    taxRows,
    taxTotalNetAmount: taxableRoom + totalAccTax + totalSvcTaxable,
    taxTotalTaxAmt:    totalVat10 + totalVat20,
    taxableBase,
    grandTotal,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE BUILDER
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

const MarmaraInvoiceView = ({ invoiceData }) => {
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
        filename:  `Marmara_Invoice_${invoice.invoiceNo || 'Invoice'}.pdf`,
        image:     { type: 'jpeg', quality: 1 },
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
      font-size: 11px;
      color: #000;
      background: transparent;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .inv-page {
      width: 100%;
      max-width: 794px;
      padding: 18mm 12mm 18mm 12mm;
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
      margin-bottom: 30px;
    }
    .logo-container img { max-width: 105px; }

    .top-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      font-size: 11px;
    }
    .top-section p { margin: 0; line-height: 1.4; }
    .left-info{
      width: 45%;
      }
    .right-info{
      width: 42.5%;
      }

    .marmara-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
    .marmara-table th { 
      font-weight: bold; 
      padding: 0px 2px;
      vertical-align: top;
    }
    .marmara-table td { 
      padding: 4px 2px; 
      vertical-align: top;
      line-height: 1.4;
    }

    .marmara-header-line th {
      background-color: #f5f5f5;
      padding-top: 2px;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      line-height: 1.3;
    }
    .marmara-totals td {
      padding: 8px 2px;
    }
    .marmara-totals td:nth-child(n+3) {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    .marmara-totals td{
      border-top: 1px solid #000;
    }

    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }
    .text-left { text-align: left !important; }

    .footer-block {
      display: flex;
      font-size: 11px;
      margin-top: 15px;
    }
    
    .invoice-grid {
      display: grid;
      grid-template-columns: 190px 130px 130px 148px;
      margin-left: 50px;
      line-height: 1.4;
    }

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
    }
  `;

  const PageHeader = ({ page }) => (
    <>
      <div className="logo-container">
        <img src={logo} alt="Marmara Logo" />
      </div>

      <div className="top-section">
        <div className="left-info">
          <p>AZAR TOURISM</p>
          <p>ALGERIA SQUARE</p>
          <p>BUILDING NUMBER 12 FIRST FLOOR,</p>
          <p>TRIPOLI</p>
          <p>Libyan Arab Jamahiriya</p>
          <p style={{ textTransform: 'uppercase' }}>{invoice.guestName}</p>
          <p>COPY OF INVOICE</p>

          <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '90px 1fr', lineHeight: '1.3'}}>
            <span>A/R Number</span><span>: {invoice.arNumber || ""}</span>
            <span>Group Code</span><span>: {invoice.groupCode || ""}</span>
            <span>Company Name</span><span>: {invoice.party}</span>
            <span>Account No</span><span>: {invoice.accountNo || ""}</span>
          </div>
        </div>
        <div className="right-info">
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', lineHeight: '1.3'}}>
            <span>Room No.</span><span>: {invoice.roomNo}</span>
            <span>Arrival</span><span>: {invoice.checkInDate}</span>
            <span>Departure</span><span>: {invoice.checkOutDate}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', marginTop: '34px', lineHeight: '1.3' }}>
            <span>Page No.</span><span>: {page.pageNo} of {page.totalPages}</span>
            <span>Folio No.</span><span>: {invoice.folioNo || ""}</span>
            <span>Conf. No.</span><span>: {invoice.reservation || ''}</span>
            <span>Cashier No.</span><span>: {invoice.cashierNo || ''}</span>
            <span>User ID</span><span>: {invoice.userId || ''}</span>
          </div>
        </div>
      </div>
    </>
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

            <table className="marmara-table">
              <thead>
                <tr className="marmara-header-line">
                  <th className="text-left" style={{ width: '10%', paddingLeft: '6px' }}>Date</th>
                  <th className="text-left" style={{ width: '32%' }}>Text</th>
                  <th className="text-right" style={{ width: '14%', paddingRight: '30px' }}>Exchange</th>
                  <th className="text-center" style={{ width: '11%' }}>Charges<br/>TRY</th>
                  <th className="text-center" style={{ width: '11%' }}>Credits<br/>TRY</th>
                  <th className="text-center" style={{ width: '11%' }}>Charges<br/>TRY</th>
                  <th className="text-center" style={{ width: '11%'}}>Credits<br/>TRY</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ height: '15px' }}><td colSpan="7"></td></tr>
                {page.items.map((item, i) => (
                   <tr key={i}>
                     <td>{item.date}</td>
                     <td>{item.desc}</td>
                     <td className="text-right" style={{ paddingRight: '30px' }}>{item.exchange}</td>
                     <td className="text-center">{item.debit != null && item.debit !== "" && Number(item.debit) !== 0 ? formatCurrency(item.debit) : ""}</td>
                     <td className="text-center">{item.credit != null && item.credit !== "" && Number(item.credit) !== 0 ? formatCurrency(item.credit) : ""}</td>
                     <td className="text-center">{item.debit != null && item.debit !== "" && Number(item.debit) !== 0 ? formatCurrency(item.debit) : ""}</td>
                     <td className="text-center">{item.credit != null && item.credit !== "" && Number(item.credit) !== 0 ? formatCurrency(item.credit) : "0.00"}</td>
                   </tr>
                ))}
                <tr style={{ height: '15px' }}><td colSpan="7"></td></tr>
              </tbody>
              
              {page.showTotals && (
                <tfoot>
                  <tr className="marmara-totals">
                    <td></td>
                    <td>Total</td>
                    <td></td>
                    <td className="text-center">{formatCurrency(invoice.summary.grandTotal)}</td>
                    <td className="text-center">{formatCurrency(invoice.summary.grandTotal)}</td>
                    <td className="text-center">{formatCurrency(invoice.summary.grandTotal)}</td>
                    <td className="text-center">{formatCurrency(invoice.summary.grandTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>

            {page.showTotals && (
              <div className="footer-block">
                <div className="invoice-grid">
                   <span>Balance</span>
                   <span className="text-right">{formatCurrency(invoice.summary.balance)} TRY</span>
                   <span></span>
                   <span></span>

                   <span>Total incl. vat</span>
                   <span className="text-right">{formatCurrency(invoice.summary.grandTotal)} TRY</span>
                   <span></span>
                   <span className="text-right">{formatCurrency(invoice.summary.grandTotal)} TRY</span>

                   <span>Net Amount</span>
                   <span className="text-right">{formatCurrency(invoice.taxableBase)} TRY</span>
                   <span></span>
                   <span className="text-right">{formatCurrency(invoice.taxableBase)} TRY</span>

                   <div style={{ gridColumn: 'span 4', height: '20px' }}></div>

                   <span>Tax Room and Package</span>
                   <span className="text-right">{formatCurrency(invoice.taxTotalTaxAmt)} TRY</span>
                   <span></span>
                   <span className="text-right">{formatCurrency(invoice.taxTotalTaxAmt)} TRY</span>

                   <span>Accomodation Tax</span>
                   <span className="text-right">{formatCurrency(invoice.summary.accommodationTax)} TRY</span>
                   <span></span>
                   <span className="text-right">{formatCurrency(invoice.summary.accommodationTax)} TRY</span>
                </div>
              </div>
            )}
            
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default MarmaraInvoiceView;
