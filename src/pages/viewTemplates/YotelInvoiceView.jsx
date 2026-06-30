


import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/yotal-logo.png?url';

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
    return `${dd}-${mm}-${d.getFullYear()}`;
  } catch { return dateStr; }
};

const parseTimeString = (timeStr) => {
  if (!timeStr) return null;
  
  // Check if it's a direct time string like "00:02" or "14:30:15"
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    const parts = timeStr.split(':');
    const hh = parts[0] ? parts[0].padStart(2, '0') : '00';
    const mm = parts[1] ? parts[1].padStart(2, '0') : '00';
    const ss = parts[2] ? parts[2].padStart(2, '0') : '00'; // Auto-adds seconds if missing
    return `${hh}:${mm}:${ss}`;
  }
  
  return null;
};
const formatTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  } catch { return ""; }
}

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

const DualAmount = ({ val, rate }) => {
  if (val === null || val === undefined || Number(val) === 0) {
    return null;
  }
  const tryNum = Number(val);
  const r = Number(rate) || 50.0676;
  const eurNum = tryNum / r;
  return (
    <div className="text-right">
      <div style={{ letterSpacing: '0.2px' }}>€ {formatCurrency(eurNum)}</div>
      <div style={{ fontStyle: 'italic', letterSpacing: '0.2px' }}>₺ {formatCurrency(tryNum)}</div>
    </div>
  );
};

const DualAmountTotals = ({ val, rate }) => {
  const tryNum = Number(val) || 0;
  const r = Number(rate) || 50.0676;
  const eurNum = tryNum / r;
  return (
    <div className="text-right">
      <div style={{ fontWeight: 'bold' }}>€ {formatCurrency(eurNum)}</div>
      <div style={{ fontStyle: 'italic' }}>₺ {formatCurrency(tryNum)}</div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// API → VIEW SCHEMA MAPPER
// ─────────────────────────────────────────────────────────────────────────────

// Helper to parse dates safely (handles YYYY-MM-DD and DD-MM-YYYY)
const parseSafeDate = (dateStr) => {
  if (!dateStr) return new Date(NaN);
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) {
     const parts = String(dateStr).split(/[.\-/]/);
     if (parts.length === 3) {
        if (parts[0].length === 4) d = new Date(parts[0], parts[1]-1, parts[2]);
        else d = new Date(parts[2], parts[1]-1, parts[0]);
     }
  }
  return d;
};

// Helper to get day of week
const getDayOfWeek = (dateStr) => {
  const d = parseSafeDate(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString('en-US', { weekday: 'long' });
};

const mapApiDataToInvoice = (data = {}) => {
  const allItems = [];
  
  // 1. Accommodation Details
  let rawSource = data.accommodationDetails || data.accommodation_details || data.nightsDetails || data.nights_details || data.nights || [];
  // If we receive a single object instead of an array, wrap it
  if (rawSource && !Array.isArray(rawSource) && typeof rawSource === 'object') {
     rawSource = [rawSource];
  }
  const accommodationSource = Array.isArray(rawSource) ? rawSource : [];
  
  accommodationSource.forEach((night, idx) => {
    const subEntries = [];
    if (night.hotelExpenses) subEntries.push({ ...night.hotelExpenses, type: 'he' });
    if (night.accommodationTax) subEntries.push({ ...night.accommodationTax, type: 'at' });
    
    if (subEntries.length === 0) {
      subEntries.push({ ...night, type: 'flat' });
    }

    subEntries.forEach((e, sIdx) => {
      // Very loose check to ensure we show entries
      if (e.date || night.date || e.amount || e.debit || e.rate || e.rate_amount || e.rateAmount) {
        const itemDate = e.date || night.date;
        const weekday = getDayOfWeek(itemDate);
        const formatted = formatDate(itemDate);
        
        let itemDesc = e.description || e.desc || "";
        if (!itemDesc || itemDesc === "Accommodation Package" || itemDesc === "Daily Charges") {
           itemDesc = e.type === 'at' ? "Accommodation TAX" : `Daily Charges For ${weekday} ${formatted}`;
        }
        
        allItems.push({
          id: `acc_${idx}_${sIdx}`,
          rawDate: parseDateForSort(itemDate),
          date: formatted,
          desc: itemDesc,
          debit: e.amount || e.debit || e.rate || e.rate_amount || e.rateAmount || 0,
          credit: e.credit || "",
          exchange: e.exchangeRate || night.exchangeRate || data.exchangeRate || 50.0676,
        });
      }
    });
  });

  // Fallback if still empty: check data.nightlyRows or similar
  if (allItems.length === 0 && data.totalRoomAllNights > 0) {
     allItems.push({
        id: 'fallback_acc',
        rawDate: parseDateForSort(data.invoiceDate || data.arrivalDate),
        date: formatDate(data.invoiceDate || data.arrivalDate),
        desc: "Accommodation Package",
        debit: data.totalRoomAllNights,
        credit: 0,
        exchange: data.exchangeRate || 50.0676
     });
  }

  // 2. Other Services
  let svcSource = data.otherServices || data.other_services || data.services || [];
  if (svcSource && !Array.isArray(svcSource) && typeof svcSource === 'object') svcSource = [svcSource];
  const otherServicesSource = Array.isArray(svcSource) ? svcSource : [];
  
  otherServicesSource.forEach((svc, i) => {
    allItems.push({
      id: `svc_${i}`,
      rawDate: parseDateForSort(svc.date),
      date: formatDate(svc.date),
      desc: svc.name || svc.description || "Service",
      debit: svc.amount || svc.debit || 0,
      credit: svc.credit || "",
      exchange: svc.exchangeRate || data.exchangeRate || 50.0676,
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
  let exRate = data.exchangeRate || 50.0676;
const resolvedTime = parseTimeString(data.invoiceTime) || formatTime(data.invoiceTime) || "13:35:32";
  const dObj = data.billingDate || data.invoiceDate || new Date();
  const fullInvoiceDate = `${formatDate(dObj)} ${formatTime(dObj)}`;

  let calculatedCredits = 0;
  allItems.forEach(i => calculatedCredits += Number(i.credit) || 0);

  return {
    refferenceNo: data.referenceNo,
    invoiceNo:    data.invoice_number || data.invoiceNumber || data.invoiceNo || data.invoice_no || "", 
    billingDate:  formatDate(data.billingDate  || data.invoiceDate) || "",
    fullInvoiceDate: `${formatDate(dObj)} ${resolvedTime || "13:35:32"}`,
    roomNo:       data.roomNo          || "",
    pax:          data.pax             || 1,
    nights:       data.nights          || 1,
    guestName:    data.guestName       || "",
    checkInDate:  formatDate(data.arrivalDate)   || "",
    checkOutDate: formatDate(data.departureDate) || "",
    party:        data.party           || "Azar Tourism Services",
    branch:       data.branch          || "",
    reservation:  data.reservation      || "",
    voucher:      data.voucherNo       || data.reservation || "",
    
    // Additional Hotel Fields
    folioNo:      data.folioNo   || data.folio_no   || data.invoiceNo || "",
    confNo:       data.confNo    || data.conf_no    || "",
    iataNo:       data.iataNo    || data.iata_no    || "45216371",
    taxNo:        data.taxNo     || data.tax_no     || "222222222222",
    exchangeRate: exRate,

    items:        allItems,
    summary: {
      subtotal:         totalRoomGross,
      accommodationTax: totalAccTax,
      grandTotal:       grandTotal,
      totalCredits:     calculatedCredits,
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

const YotelInvoiceView = ({ invoiceData }) => {
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
        filename:  `${invoice.refferenceNo || 'Invoice'}.pdf`,
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @page { size: A4; margin: 0mm; }

    * { box-sizing: border-box; }

    .invoice-box {
      width: 100%;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: #000;
      background: transparent;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .inv-page {
      width: 100%;
      max-width: 794px;
      padding: 22mm 25mm 22mm 25mm;
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
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .logo-container img { max-width: 95px; margin-top: 8px;}
    .invoice-title { font-size: 20px; font-weight: 600; }

    .header-left-text {
      font-size: 9px;
      line-height: 1.4;
      margin-bottom: 52px;
    }
    .header-left-text .bold-company {
      font-weight: bold;
      font-size: 10px;
    }

    .info-blocks {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      font-size: 9px;
      line-height: 1.5;
    }
    .left-info { width: 50%; }
    .right-info { width: 45%; }
    
    .right-info-grid {
      text-align: right;
      line-height: 1.6;
    }
    .right-info-grid .label { font-weight: bold; color: #000; }
    .right-info-grid .value { color: #000; padding-left: 2px;}

    .lower-info-blocks {
      display: flex;
      justify-content: space-between;
      margin-bottom: 50px;
      font-size: 9px;
      line-height: 1.5;
    }
    .lower-info-grid {
      text-align: left;
      line-height: 1.6;
    }
    .lower-info-grid .label { font-weight: bold; color: #000; padding-right: 2px;}

    .yotel-table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 5px; }
    .yotel-table th { 
      font-weight: bold; 
      padding: 3px 0;
      text-align: left;
    }
    .yotel-table td { 
      vertical-align: top;
      line-height: 1.4;
    }
    .yotel-table .text-right { text-align: right; }

    .table-line-bottom {
      border-bottom: 1px solid #ccc;
    }

    .totals-section {
      display: flex;
      justify-content: flex-end;
      font-size: 9px;
      margin-top: 5px;
    }
    .totals-grid {
      display: grid;
      grid-template-columns: auto auto;
      gap: 4px 80px;
      line-height: 1.4;
      justify-items: end;
    }
    .totals-grid .label {
      font-weight: bold;
      text-align: right;
      color: #000;
      align-self: flex-start;
      margin-top: 2px;
    }

    @media print {
      /* Specifically hide buttons and typical UI header wrappers injected by InvoiceTemplate */
      button, nav, header { 
        display: none !important; 
      }
      .no-print { 
        display: none !important; 
      }

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

  const PageHeader = () => (
    <>
      <div className="logo-container">
        <img src={logo} alt="Yotel Logo" />
        <div className="invoice-title">Invoice</div>
      </div>

      <div className="header-left-text">
        <div className="bold-company">YOTELAIR Istanbul Airport (Airside)</div>
        <div>Tayakadın Mahallesi, Terminal Caddesi No:1, Arnavutköy</div>
        <div>34283 Istanbul</div>
        <div>Turkey</div>
      </div>

      <div className="info-blocks">
        <div className="left-info">
          <div>{invoice.party}</div>
          <div>Mejrab, Abdullah</div>
          <div>Algeria Square Building Number 12 First Floor, Tripoli,</div>
          <div>1254 TRIPOLI</div>
          <div>Libyan Arab Jamahiriya</div>
          <div><span style={{ fontWeight: 'bold' }}>Tax Number: </span>{invoice.taxNo}</div>
        </div>
        <div className="right-info">
          <div className="right-info-grid">
            <div><span className="label">Guest Name: </span><span className="value">{invoice.guestName}</span></div>
            <div><span className="label">Arrival Date: </span><span className="value">{invoice.checkInDate}</span></div>
            <div><span className="label">Departure Date: </span><span className="value">{invoice.checkOutDate}</span></div>
            <div><span className="label">Room Number: </span><span className="value">{invoice.roomNo}</span></div>
            <div><span className="label">Confirmation Number: </span><span className="value">{invoice.confNo}</span></div>
            <div><span className="label">Number of Guests: </span><span className="value">{invoice.pax}</span></div>
            <div><span className="label">Invoice Currency: </span><span className="value">TRY</span></div>
          </div>
        </div>
      </div>

      <div className="lower-info-blocks">
        <div className="left-info">
          <div className="lower-info-grid">
             <div><span className="label">Invoice Date: </span><span>{invoice.fullInvoiceDate}</span></div>
             <div><span className="label">Invoice Number: </span><span>{invoice.invoiceNo}</span></div>
             <div><span className="label">Folio Number: </span><span>{invoice.folioNo}</span></div>
          </div>
        </div>
        <div className="right-info" style={{ textAlign: 'right' }}>
           <span style={{ fontWeight: 'bold' }}>IATA Number: </span><span>{invoice.iataNo}</span>
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
            <PageHeader />

            <table className="yotel-table">
              <thead>
                <tr>
                  <th style={{ width: '17%' }}>Date of Charge</th>
                  <th style={{ width: '46%' }}>Charge Description</th>
                  <th className="text-right" style={{ width: '18%' }}>Charge Amount</th>
                  <th className="text-right" style={{ width: '19%' }}>Credit Amount</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((item, i) => (
                   <tr key={i}>
                     <td>{item.date}</td>
                     <td>{item.desc}</td>
                     <td className="text-right">
                        <DualAmount val={item.debit} rate={invoice.exchangeRate} />
                     </td>
                     <td className="text-right">
                        <DualAmount val={item.credit} rate={invoice.exchangeRate} />
                     </td>
                   </tr>
                ))}
                <tr>
                  <td colSpan="4" className="table-line-bottom" style={{ padding: 0, height: 5 }}></td>
                </tr>
              </tbody>
            </table>

            {page.showTotals && (
              <div className="totals-section">
                <div className="totals-grid">
                  <span className="label">Total Charge</span>
                  <DualAmountTotals val={invoice.summary.grandTotal} rate={invoice.exchangeRate} />

                  <span className="label">Total Credits</span>
                  <DualAmountTotals val={invoice.summary.totalCredits} rate={invoice.exchangeRate} />

                  <span className="label">Net Amount</span>
                  <DualAmountTotals val={invoice.taxableBase} rate={invoice.exchangeRate} />

                  <span className="label">Balance</span>
                  <DualAmountTotals val={invoice.summary.balance} rate={invoice.exchangeRate} />

                  <span className="label" style={{ fontWeight: 'normal' }}>VAT</span>
                  <DualAmountTotals val={invoice.taxTotalTaxAmt} rate={invoice.exchangeRate} />

                  <span className="label" style={{ fontWeight: 'normal' }}>2% Accommodation Tax</span>
                  <DualAmountTotals val={invoice.summary.accommodationTax} rate={invoice.exchangeRate} />
                </div>
              </div>
            )}
            
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default YotelInvoiceView;