



import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/cheya-logo.png?url';

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
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
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
  const allItems = [];
  
  (data.accommodationDetails || []).forEach((night, idx) => {
    // FLAT STYLE OR ROOM RATES
    if (!night.hotelExpenses && !night.accommodationTax) {
      if (night.description || night.rate || night.amount || night.debit || night.credit) {
        let amt = parseFloat(night.rate || night.amount || night.debit || 0) - parseFloat(night.credit || 0);
        allItems.push({
          id: `flat_${idx}`,
          rawDate: parseDateForSort(night.date),
          date: formatDate(night.date),
          departman: night.departman || "Room Rates / Odalar - Room Rates / Odalar",
          desc: night.description || "ROOM",
          evrakNo: night.evrakNo || "",
          amount: amt
        });
      }
    }

    if (night.hotelExpenses) {
      const he = night.hotelExpenses;
      let amt = parseFloat(he.debit || he.amount || 0) - parseFloat(he.credit || 0);
      allItems.push({
        id: `he_${idx}`,
        rawDate: parseDateForSort(he.date || night.date),
        date: formatDate(he.date || night.date),
        departman: he.departman || "Room Rates / Odalar - Room Rates / Odalar",
        desc: he.description || "ROOM",
        evrakNo: he.evrakNo || "",
        amount: amt
      });
    }
    if (night.accommodationTax) {
      const at = night.accommodationTax;
      let amt = parseFloat(at.debit || at.amount || 0) - parseFloat(at.credit || 0);
      allItems.push({
        id: `at_${idx}`,
        rawDate: parseDateForSort(at.date || night.date),
        date: formatDate(at.date || night.date),
        departman: at.departman || "Accommodation Tax / Konaklama Vergisi",
        desc: at.description || "Tax",
        evrakNo: at.evrakNo || "",
        amount: amt
      });
    }
  });

  (data.otherServices || []).forEach((svc, i) => {
    let amt = parseFloat(svc.amount || 0) - parseFloat(svc.credit || 0);
    allItems.push({
      id: `svc_${i}`,
      rawDate: parseDateForSort(svc.date),
      date: formatDate(svc.date),
      departman: svc.departman || "Other Services",
      desc: svc.name || "Service",
      evrakNo: svc.evrakNo || "",
      amount: amt
    });
  });

  // Adding payments inline mapping exactly to 'Cash Payment / Kasa Nakit'
  if (data.payments && Array.isArray(data.payments)) {
    data.payments.forEach((pay, idx) => {
      let amt = -parseFloat(pay.amount || 0); // credits are negative
      allItems.push({
        id: `pay_${idx}`,
        rawDate: parseDateForSort(pay.date),
        date: formatDate(pay.date),
        departman: "Cash Payment / Kasa Nakit",
        desc: pay.description || "Checkout without close folio",
        evrakNo: pay.evrakNo || "",
        amount: amt
      });
    });
  }

  allItems.sort((a, b) => a.rawDate - b.rawDate);

  const grandTotal = parseFloat(data.grandTotal || 0);

  return {
    refferenceNo: data.referenceNo,
    invoiceNo:    data.invoiceNo       || data.invoiceN || "", 
    billingDate:  formatDate(data.billingDate  || data.invoiceDate) || "22.01.2026",
    roomNo:       data.odaNo          || "",
    pax:          data.pax             || 0,
    guestName:    data.guestName       || "",
    checkInDate:  formatDate(data.arrivalDate)   || "",
    checkOutDate: formatDate(data.departureDate) || "",
    invoiceTime: data.invoiceTime || "00:00",
    acenta:       data.party || data.agency || "AZAR TOURISM", 
    folioNo:      data.folyoNo || data.invoiceNo || "",
    roomType:     data.roomCategory || data.roomType || "2 BEDROOM APT",
    voucher:      data.voucherNo       || data.reservation || "45216371",
    time:         data.time || "10:39", 
    totalInEur: data.totalInEur || 0,
    
    items: allItems,
    grandTotal: grandTotal,
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
  const MAX_ROWS_NORMAL = 27; 
  const MAX_ROWS_WITH_TOTALS = 22; 

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

const CheyaInvoiceView = ({ invoiceData }) => {
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
          windowWidth:     1050,
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

  // Exact styles injected from the HTML match
  const styles = `
    @page { 
        size: A4; 
        margin: 0; 
    }

    * { box-sizing: border-box; }

    .invoice-container {
        font-family: 'Arial Narrow', Arial, sans-serif;
        font-size: 11px;
        color: #000;
        background-color: transparent;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .inv-page {
        width: 100%;
        max-width: 1050px;
        padding: 40px 40px; 
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

    /* Top Header Layout */
    .header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 25px;
        color: #000;
    }
    .logo-box {
        width: 250px;
        display: flex;
        flex-direction: column;
    }
    .logo-box img {
        width: 100px;
        height: auto;
        margin-bottom: 6px;
    }
    .logo-text {
        font-size: 11px;
        color: #000;
    }
    .title-box {
        flex-grow: 1;
        text-align: center;
        margin-top: 35px;
    }
    .title-box h1 {
        font-size: 20px;
        font-weight: bold;
        margin: 0;
        letter-spacing: -0.5px;
        color: #000 !important;
    }
    .date-box {
        width: 150px;
        text-align: right;
        font-size: 10px;
        line-height: 1.5;
        margin-top: 35px;
        color: #000 !important;
    }

    /* Reservation Info Section */
    .rezervasyon-section {
        color: #000 !important;
    }
    .rezervasyon-section h2 {
        font-size: 16px;
        font-weight: bold;
        padding-left: 10px;
        color: #000 !important;
    }
    .divider {
        width: 100%;
        height: 2px;
        background-color: #000;
        margin: 3px 0 3px 0 !important; 
    }

    /* Info Grid */
    .info-grid {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        color: #000 !important;
    }
    
    /* Left Table */
    .info-left {
        width: 65%;
    }
    .info-table {
        border-collapse: collapse;
        font-size: 11px;
        color: #000 !important;
    }
    .info-table td {
        padding: 5px 0;
        vertical-align: top;
        color: #000 !important;
    }
    .info-table .label {
        font-weight: bold;
        width: 65px;
        line-height: 1.4;
    }
    .info-table .colon {
        width: 15px;
        text-align: center;
        font-weight: bold;
    }
    .info-table .value {
        line-height: 1.4;
    }

    /* Right Table */
    .info-right {
        width: 35%;
        display: flex;
        justify-content: flex-end;
        padding-right: 5px;
    }
    .right-info-table .label {
        width: 67px;
        font-weight: bold;
    }

    /* Transactions Data Table */
    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
    }
    .data-table td {
        padding: 5px 8px;
        text-align: left;
    }
    .data-table th {
        padding: 5px 8px;
        text-align: left;
    }
    
    .data-table th {
        background-color: #e5e5e5 !important;
        font-weight: bold;
        border-right: 1.5px solid #fff;
        color: #000;
        font-size: 11px;
    }
    .data-table th:last-child {
        border-right: none;
    }
    
    .data-table tbody tr:nth-child(odd) {
        background-color: #f2f2f2 !important;
         border-top: 1px solid #c0c0c0 !important;
                        border-bottom: 1px solid #c0c0c0 !important;
    }
    .data-table tbody tr:nth-child(even) {
        background-color: #ffffff !important;
    }

    /* Column Alignments */
    .col-date { width: 10%; }
    .col-dept { width: 35%; }
    .col-doc  { width: 10%; }
    .col-note { width: 13%; }
    .col-amount { 
        width: 15%; 
        text-align: right !important; 
    }

    /* Exact Bottom Total Row Styling */
    .total-row {
        background-color: #ffffff !important;
    }
    .total-row td {
        font-weight: bold;
                background-color: #ffffff !important;

        font-size: 13px;
        padding: 5px 8px; /* Balanced vertical padding */
        border-top: 1px solid #d1d1d1 !important;    /* Light grey top border */
        border-bottom: 1px solid #d1d1d1 !important; /* Light grey bottom border */
    }

    /* --- STRICT PRINT STYLES --- */
    @media print {
        body * {
            visibility: hidden;
        }
        .invoice-container, .invoice-container * {
            visibility: visible;
        }
        .invoice-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: none !important;
        }
        .inv-page {
            box-shadow: none !important;
            margin: 0 !important; 
            padding: 40px 40px !important; 
            max-width: 100%;
            width: 100%;
            page-break-after: always !important;
            break-after: page !important;
        }
        .inv-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
        }
        .data-table th {
            background-color: #e5e5e5 !important;
        }
        .data-table tbody tr:nth-child(odd) {
            background-color: #f2f2f2 !important;
            border-top: 1px solid #c0c0c0 !important;
                        border-bottom: 1px solid #c0c0c0 !important;

        }
        /* Ensure border prints */
        .total-row td {
            border-top: 1px solid #c0c0c0!important;
            border-bottom: 1px solid #c0c0c0 !important;
        }
    }
  `;

  const PageHeader = () => (
    <>
      <div className="header-top">
        <div className="logo-box">
          <img src={logo} alt="CHEYA Logo" />
        </div>
        <div className="title-box">
          <h1>Oda Nolu Misafir Folyosu</h1>
        </div>
        <div className="date-box">
          {invoice.billingDate}<br />
          {invoice.invoiceTime}
        </div>
      </div>

      <div className="rezervasyon-section">
        <h2>Rezervasyon Bilgi</h2>
        <div className="divider"></div>
        
        <div className="info-grid">
          <div className="info-left">
            <table className="info-table">
              <tbody>
                <tr>
                  <td className="label" style={{paddingBottom: "3px"}}>Acenta</td>
                  <td className="colon" style={{paddingBottom: "3px"}}>:</td>
                  <td className="value" style={{paddingBottom: "3px"}}>{invoice.acenta}</td>
                </tr>
                <tr>
                  <td className="label" style={{paddingTop: "0px" , paddingBottom: "3px", lineHeight: "1.7"}}>Folyo<br />No</td>
                  <td className="colon" style={{ verticalAlign: 'middle', paddingTop: "0px", paddingBottom: "3px" }}>:</td>
                  <td className="value" style={{ verticalAlign: 'middle' ,paddingTop: "0px" , paddingBottom: "3px"}}>{invoice.folioNo}</td>
                </tr>
                <tr>
                  <td className="label" style={{paddingTop: "0px"}}>Oda No</td>
                  <td className="colon" style={{paddingTop: "0px"}}>:</td>
                  <td className="value" style={{paddingTop: "0px"}}>{invoice.roomNo}</td>
                </tr>
                <tr>
                  <td className="label">Misafir</td>
                  <td className="colon">:</td>
                  <td className="value" style={{ whiteSpace: 'pre-wrap' }}>{invoice.guestName}</td>
                </tr>
                <tr>
                  <td className="label">Kisi</td>
                  <td className="colon">:</td>
                  <td className="value">{invoice.pax}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="info-right">
            <table className="info-table right-info-table">
              <tbody>
                <tr>
                  <td className="label">Oda Tipi</td>
                  <td className="colon">:</td>
                  <td className="value">{invoice.roomType}</td>
                </tr>
                <tr>
                  <td className="label">Geliş</td>
                  <td className="colon">:</td>
                  <td className="value">{invoice.checkInDate}</td>
                </tr>
                <tr>
                  <td className="label">Ayrılış</td>
                  <td className="colon">:</td>
                  <td className="value">{invoice.checkOutDate}</td>
                </tr>
                <tr>
                  <td className="label">Voucher No</td>
                  <td className="colon">:</td>
                  <td className="value">{invoice.voucher}</td>
                </tr>
              </tbody>
            </table>
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
      <div className="invoice-container" ref={invoiceRef}>
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

            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-date">Tarih</th>
                  <th className="col-dept">Departman</th>
                  <th className="col-doc">Evrak No</th>
                  <th className="col-note">Notlar</th>
                  <th className="col-amount">Toplam TRY</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.date}</td>
                    <td>{item.departman}</td>
                    <td>{item.evrakNo}</td>
                    <td>{item.desc}</td>
                    <td className="col-amount">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                
              {page.showTotals && (
                  <>
                    <tr className="total-row">
                      <td colSpan="4" style={{ textAlign: 'left' }}>Toplam</td>
                      <td className="col-amount">{formatCurrency(invoice.grandTotal)} TRY</td>
                    </tr>
                    <tr className="total-row">
                      <td colSpan="4" style={{ textAlign: 'left' }}>Toplam (EUR)</td>
                      <td className="col-amount">{formatCurrency(invoice.totalInEur)} EUR</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            <div style={{ flex: 1 }}></div>
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default CheyaInvoiceView;