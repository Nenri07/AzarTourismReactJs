
// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import toast from "react-hot-toast";
// import { InvoiceTemplate } from "../../components";
// import logo from "/park_plaza-logo.jpg";

// // ─────────────────────────────────────────────────────────────────────────────
// // CONFIGURATION
// // ─────────────────────────────────────────────────────────────────────────────
// const ROWS_PER_PAGE = 15;

// // ─────────────────────────────────────────────────────────────────────────────
// // PURE HELPERS
// // ─────────────────────────────────────────────────────────────────────────────
// const formatDate = (dateStr) => {
//   if (!dateStr) return "";
//   try {
//     const d = new Date(dateStr);
//     if (isNaN(d.getTime())) return dateStr;
//     const dd = String(d.getDate()).padStart(2, '0');
//     const mm = String(d.getMonth() + 1).padStart(2, '0');
//     const yy = String(d.getFullYear()).slice(2);
//     return `${dd}/${mm}/${yy}`;
//   } catch { return dateStr; }
// };

// const formatCurrency = (val) => {
//   if (val === null || val === undefined || val === "") return "";
//   const n = parseFloat(val);
//   if (isNaN(n)) return "";
//   return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // API → VIEW SCHEMA MAPPER
// // ─────────────────────────────────────────────────────────────────────────────
// const mapApiDataToInvoice = (data = {}) => {
//   const accRows = (data.accommodationDetails || []).map((night) => ({
//     rawDate: night.date,
//     date: formatDate(night.date),
//     text: night.text || "GUEST ROOM",
//     chgExclVat: formatCurrency(night.charges_excl_vat),
//     vat: formatCurrency(night.vat_amount),
//     chgGbp: formatCurrency(night.charges_gbp),
//     cred: night.credits_gbp != null ? formatCurrency(night.credits_gbp) : "",
//   }));

//   const svcRows = (data.otherServices || []).map((svc) => ({
//     rawDate: svc.date,
//     date: formatDate(svc.date),
//     text: svc.text || svc.name || "",
//     chgExclVat: formatCurrency(svc.charges_excl_vat),
//     vat: formatCurrency(svc.vat_amount),
//     chgGbp: formatCurrency(svc.charges_gbp),
//     cred: svc.credits_gbp != null ? formatCurrency(svc.credits_gbp) : "",
//   }));

//   const items = [...accRows, ...svcRows].sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

//   const totalCharges = (data.totalRoomGross || 0) + (data.totalServicesGross || 0);
//   const totalCredits = (data.totalRoomGross || 0) + (data.totalServicesGross || 0);
//   const balance = 0.00;

//   const vatSummary = {
//     exclVat: "1,209.93",
//     vatPercent: "VAT 20%",
//     vatAmount: "241.99",
//     inclVat: "1,451.91",
//   };

//   const detailedTransactions = {
//     left: [
//       { key: "Transaction ID",   value: "50813454" },
//       { key: "Approval Code",    value: "605800" },
//       { key: "Approval Amount",  value: "1,151.91" },
//     ],
//     right: [
//       { key: "Credit Card #",      value: "XXXXXXXXXXXX8188" },
//       { key: "Credit Card Expiry", value: "XX/XX" },
//       { key: "Transaction Amount", value: "1,151.91" },
//     ],
//   };

//   return {
//     guestName:     data.guestName     || "Alhade, Alhadad",
//     companyName:   data.companyName   || "AGODA COMPANY PTE LTD",
//     roomNo:        data.roomNo        || "0621",
//     arrivalDate:   formatDate(data.arrivalDate    || "2026-01-31"),
//     departureDate: formatDate(data.departureDate  || "2026-02-07"),
//     resNo:         data.reservationNo || data.confNo || "281765081",
//     invoiceNo:     data.invoiceNo     || "",
//     folioNo:       data.folioNo       || "537461",
//     invoiceDate:   formatDate(data.invoiceDate || data.taxDate || "2026-02-07"),
//     referenceNo:   data.referenceNo   || "PPWA00224",
//     currency:      data.currency      || "GBP",
//     items,
//     totals: {
//       chgGbp:  formatCurrency(totalCharges),
//       cred:    formatCurrency(totalCredits),
//       balance: `${formatCurrency(balance)} ${data.currency || "GBP"}`,
//     },
//     detailedTransactions,
//     vatSummary,
//   };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────
// const ParkPlazaInvoiceView = ({ invoiceData }) => {
//   const { invoiceId }  = useParams();
//   const location       = useLocation();
//   const navigate       = useNavigate();

//   const [invoice,    setInvoice]    = useState(null);
//   const [loading,    setLoading]    = useState(true);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const invoiceRef = useRef(null);

//   const isPdfDownload = location.pathname.includes("/download-pdf");

//   useEffect(() => {
//     setInvoice(mapApiDataToInvoice(invoiceData || {}));
//     setLoading(false);
//   }, [invoiceData]);

//   // ── Split items into pages ─────────────────────────────────────────────────
//   const pages = useMemo(() => {
//     if (!invoice) return [];
//     const { items } = invoice;
//     if (!items || items.length === 0) return [[]];
//     const result = [];
//     for (let i = 0; i < items.length; i += ROWS_PER_PAGE) {
//       result.push(items.slice(i, i + ROWS_PER_PAGE));
//     }
//     return result;
//   }, [invoice]);

//   const totalPageCount = pages.length;

//   // ── Auto-download on /download-pdf route ──────────────────────────────────
//   useEffect(() => {
//     if (isPdfDownload && invoice && invoiceRef.current) {
//       const timer = setTimeout(async () => {
//         await handleDownloadPDF();
//         navigate("/invoices", { replace: true });
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [isPdfDownload, invoice, navigate]);

//   // ── PDF: per-page jsPDF + html2canvas loop ────────────────────────────────
//   // Captures each .invoice-page div individually → no blank pages, no padding collapse
//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     // Strip stylesheets to prevent oklch / Tailwind crash in html2canvas
//     const headStyles = Array.from(
//       document.head.querySelectorAll('link[rel="stylesheet"], style')
//     );
//     headStyles.forEach(s => s.parentNode && s.parentNode.removeChild(s));

//     try {
//       // Wait for images to load
//       const images = invoiceRef.current.querySelectorAll('img');
//       await Promise.all(Array.from(images).map(img => {
//         if (img.complete) return Promise.resolve();
//         return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
//       }));
//       await new Promise(resolve => setTimeout(resolve, 500));

//       const pageEls = invoiceRef.current.querySelectorAll('.invoice-page');
//       if (!pageEls.length) return;

//       const { jsPDF }   = await import('jspdf');
//       const html2canvas = (await import('html2canvas')).default;

//       const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

//       for (let i = 0; i < pageEls.length; i++) {
//         const el = pageEls[i];

//         // Temporarily strip visual-only styles so canvas captures clean content
//         const prevMargin   = el.style.margin;
//         const prevShadow   = el.style.boxShadow;
//         el.style.margin    = '0';
//         el.style.boxShadow = 'none';

//         const canvas = await html2canvas(el, {
//           scale:           3,
//           useCORS:         true,
//           letterRendering: true,
//           scrollY:         0,
//           // Use the element's own pixel width → paddings are fully preserved
//           width:           el.offsetWidth,
//           windowWidth:     el.offsetWidth,
//         });

//         el.style.margin    = prevMargin;
//         el.style.boxShadow = prevShadow;

//         const imgData = canvas.toDataURL('image/jpeg', 1.0);
//         if (i > 0) pdf.addPage();
//         pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
//       }

//       pdf.save(`Park_Plaza_Invoice_${invoice.folioNo || invoice.invoiceNo || 'Invoice'}.pdf`);
//       toast.success("PDF Downloaded Successfully");
//     } catch (err) {
//       console.error("PDF Error:", err);
//       toast.error("Failed to generate PDF");
//     } finally {
//       headStyles.forEach(s => document.head.appendChild(s));
//       setPdfLoading(false);
//     }
//   };

//   if (!invoice) return null;

//   // ── RENDER ────────────────────────────────────────────────────────────────
//   return (
//     <InvoiceTemplate
//       loading={loading}
//       invoice={invoice}
//       pdfLoading={pdfLoading}
//       onDownloadPDF={handleDownloadPDF}
//       onPrint={() => window.print()}
//       onBack={() => navigate("/invoices")}
//     >
//       <div className="park-plaza-wrapper">

//         {/* ── STYLES — pixel-identical to the working view/print version ── */}
//         <style id="park-plaza-styles">{`
//           .park-plaza-wrapper {
//             display: flex;
//             flex-direction: column;
//             align-items: center;
//             font-family: Arial, Helvetica, sans-serif;
//             background: #e0e0e0;
//             gap: 20px;
//           }
//           @media print {
//             .park-plaza-wrapper { background: #fff !important; padding: 0 !important; gap: 0 !important; }
//             .no-print { display: none !important; }
//           }

//           .invoice-page {
//             width: 850px;
//             height: 1122px;
//             background: #ffffff;
//             padding: 0px 40px 40px 40px;
//             box-sizing: border-box;
//             color: #000;
//             font-size: 14px;
//             display: flex;
//             flex-direction: column;
//             position: relative;
//             overflow: hidden;
//             page-break-after: always;
//             break-after: always;
//           }
//           .invoice-page:last-child {
//             page-break-after: auto;
//             break-after: auto;
//           }
//           @media screen {
//             .invoice-page { box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
//           }

//           .invoice-title {
//             position: absolute;
//             top: 70px;
//             left: 50%;
//             transform: translateX(-50%);
//             font-size: 15px;
//             letter-spacing: 0.3px;
//           }
//           .logo {
//             position: absolute;
//             top: 30px;
//             right: 40px;
//             width: 105px;
//           }
//           .billing-address { margin-top: 120px; line-height: 1.35; }
//           .middle-section  { display: flex; justify-content: space-between; padding-right: 20px; }
//           .guest-name      { margin-top: 65px; }
//           .meta-table      { width: 270px; border-collapse: collapse; }
//           .meta-table td   { vertical-align: top; }
//           .meta-table td:first-child { width: 130px; }
//           .account-no { margin-top: 10px; margin-bottom: 20px; padding-left: 20px; }

//           .line-items { width: 100%; border-collapse: collapse; table-layout: fixed; }
//           .line-items th {
//             border-top: 2px solid #000;
//             border-bottom: 2px solid #000;
//             font-weight: normal;
//             vertical-align: middle;
//             padding: 4px 0;
//           }
//           .line-items td { padding: 2px 0; vertical-align: top; }

//           .th-date    { text-align: left; padding-left: 10px !important; width: 13%;}
//           .th-text    { text-align: left;  width: 30%; }
//           .th-chg-ex  { text-align: center; width: 20%; }
//           .th-vat     { text-align: center; width: 13%;}
//           .th-chg-gbp { text-align: right;  width: 12%}
//           .th-cred    { text-align: right; width: 12%;}

//           .td-date      { padding-left: 10px !important; }
//           .td-num-right { text-align: right; }
//           .pr-chg-ex    { padding-right: 35px !important; }
//           .pr-vat       { padding-right: 25px !important; }
//           .pr-chg-gbp   { padding-right: 6px !important; }

//           .calculations-wrapper { margin-top: 0px; width: 100%; }
//           .vat-summary    { width: 508px; border-collapse: collapse; margin-top: 30px; }
//           .vat-summary th {
//             padding: 4px 0;
//             border-top: 1px solid #000;
//             border-bottom: 1px solid #000;
//             font-weight: normal;
//           }
//           .vat-summary td { padding: 4px 0; }

//           .trans-table    { border-collapse: collapse; width: 100%; }
//           .trans-table td { padding: 1px 0; }

//           .spacer-fill { flex-grow: 1; }
//           .invoice-footer {
//             display: flex;
//             justify-content: flex-end;
//             font-size: 10px;
//             line-height: 1.2;
//             margin-top: 40px;
//           }
//           .footer-right { width: 170px; }
//         `}</style>

//         {/* ── ALL PAGES ─────────────────────────────────────────────────── */}
//         <div ref={invoiceRef}>
//           {pages.map((pageItems, pageIndex) => {
//             const isLastPage = pageIndex === totalPageCount - 1;
//             const pageLabel  = `${pageIndex + 1} of ${totalPageCount}`;

//             return (
//               <div key={pageIndex} className="invoice-page">

//                 {/* ════ HEADER (every page) ════ */}
//                 <div className="page-header">
//                   <div className="invoice-title">COPY OF INVOICE</div>
//                   <img src={logo} alt="Park Plaza London Waterloo" className="logo" />

//                   <div className="billing-address">
//                     {invoice.companyName && <>{invoice.companyName}<br /></>}
//                     Algeria Square Building Number 12 First Floor<br />
//                     Tripoli<br />
//                     Libya
//                   </div>

//                   <div className="middle-section">
//                     <div className="guest-name">{invoice.guestName}</div>
//                     <table className="meta-table">
//                       <tbody>
//                         <tr><td>Room No.:</td>    <td>{invoice.roomNo}</td></tr>
//                         <tr><td>Arrival:</td>     <td>{invoice.arrivalDate}</td></tr>
//                         <tr><td>Departure:</td>   <td>{invoice.departureDate}</td></tr>
//                         <tr><td>Res. No.:</td>    <td>{invoice.resNo}</td></tr>
//                         <tr><td>Page No.:</td>    <td>{pageLabel}</td></tr>
//                         <tr><td>Invoice No.:</td> <td>{invoice.invoiceNo}</td></tr>
//                         <tr><td>Folio No.:</td>   <td>{invoice.folioNo}</td></tr>
//                         <tr><td>Date:</td>        <td>{invoice.invoiceDate}</td></tr>
//                       </tbody>
//                     </table>
//                   </div>

//                   <div className="account-no">
//                     {invoice.referenceNo && <>Account No.: {invoice.referenceNo}</>}
//                   </div>
//                 </div>

//                 {/* ════ LINE ITEMS (every page) ════ */}
//                 <table className="line-items">
//                   <colgroup>
//                     <col style={{ width: '11%' }} />
//                     <col style={{ width: '30%' }} />
//                     <col style={{ width: '13%' }} />
//                     <col style={{ width: '12%' }} />
//                     <col style={{ width: '17%' }} />
//                     <col style={{ width: '17%' }} />
//                   </colgroup>
//                   <thead>
//                     <tr>
//                       <th className="th-date">Date</th>
//                       <th className="th-text" width="35%">Text</th>
//                       <th className="th-chg-ex" >Charges<br />Excl. VAT</th>
//                       <th className="th-vat">VAT<br />Amount</th>
//                       <th className="th-chg-gbp">Charges ({invoice.currency})</th>
//                       <th className="th-cred">Credits ({invoice.currency})</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {pageItems.map((item, idx) => (
//                       <tr key={idx}>
//                         <td className="td-date">{item.date}</td>
//                         <td>{item.text}</td>
//                         <td className="td-num-right pr-chg-ex">{item.chgExclVat}</td>
//                         <td className="td-num-right pr-vat">{item.vat}</td>
//                         <td className="td-num-right pr-chg-gbp">{item.chgGbp}</td>
//                         <td className="td-num-right">{item.cred}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>

//                 {/* ════ CALCULATIONS (last page only) ════ */}
//                 {isLastPage && (
//                   <div className="calculations-wrapper">
//                     <table className="line-items">
//                       <colgroup>
//                         <col style={{ width: '11%' }} />
//                         <col style={{ width: '30%' }} />
//                         <col style={{ width: '13%' }} />
//                         <col style={{ width: '12%' }} />
//                         <col style={{ width: '17%' }} />
//                         <col style={{ width: '17%' }} />
//                       </colgroup>
//                       <tbody>
//                         <tr>
//                           <td colSpan="6" style={{ height: '30px', borderBottom: '2px solid #000', marginBottom: "5px" }} />
//                         </tr>
//                         <tr>
//                           <td colSpan="4" style={{ textAlign: 'right', paddingRight: '10px' }}>Total</td>
// {/* This is the magic part. 'relative' lets it slide out of the column boundaries */}
//   <td className="td-num-right pr-chg-gbp" style={{ position: 'relative', left: '20px' }}>
//     {invoice.totals.chgGbp}
//   </td>                          <td className="td-num-right">{invoice.totals.cred}</td>
//                         </tr>
//                         <tr>
//                           <td colSpan="4" style={{ textAlign: 'right', paddingRight: '10px', verticalAlign: 'middle' }}>Balance Due</td>
//                           <td colSpan="2" style={{
//                             borderTop: '2px solid #000',
//                             borderBottom: '2px solid #000',
//                             textAlign: 'left',
//                             padding: '2px 0',
//                             paddingLeft: "90px"
//                           }}>
//                             {invoice.totals.balance}
//                           </td>
//                         </tr>
//                       </tbody>
//                     </table>

//                     <table className="vat-summary">
//                       <thead>
//                         <tr>
//                           <th style={{ width: '31%', textAlign: 'center', paddingLeft: '25px' }}>Charges Excl. VAT</th>
//                           <th style={{ width: '25%', textAlign: 'left', paddingLeft: "10px" }}>VAT Amount</th>
//                           <th style={{ width: '25%', textAlign: 'center' }}></th>
//                           <th style={{ width: '25%', textAlign: 'center' }}>Total VAT Incl.</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         <tr>
//                           <td style={{ textAlign: 'right' , paddingRight: '10px' }}>{invoice.vatSummary.exclVat}</td>
//                           <td style={{ textAlign: 'left', paddingLeft: "10px"  }}>{invoice.vatSummary.vatPercent}</td>
//                           <td style={{ textAlign: 'center' }}>{invoice.vatSummary.vatAmount}</td>
//                           <td style={{ textAlign: 'right' , paddingRight: "4px"}}>{invoice.vatSummary.inclVat}</td>
//                         </tr>
//                       </tbody>
//                     </table>

                   
//                   </div>
//                 )}

//                 {/* Flex spacer — pushes footer to the bottom of every page */}
//                 <div className="spacer-fill" />

//                 {/* ════ FOOTER (last page only) ════ */}
//                 {isLastPage && (
//                   <div className="invoice-footer">
//                     {/* <div className="footer-left">
//                       Waterloo Hotel Operator Limited<br />
//                       Registration No.: 09558390<br />
//                       VAT No.: 0224686592<br />
//                       Santander Uk plc<br />
//                       Sort Code: 09-02-22<br />
//                       Account No.: 10570395<br />
//                       SWIFT: ABBYGB2L<br />
//                       IBAN: GB59ABBY09022210570395
//                     </div> */}
//                     <div className="footer-right">
//                       Park Plaza London Waterloo<br />
//                       6 Hercules Rd<br />
//                       SE1 7DU LONDON<br />
//                       United Kingdom<br />
//                       T: + 44 (0) 333 400 6128<br />
//                       F: + 44 (0) 333 400 6129<br />
//                       E: resppwa@pphe.com<br />
//                       www.parkplaza.com
//                     </div>
//                   </div>
//                 )}

//               </div>
//             );
//           })}
//         </div>

//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default ParkPlazaInvoiceView;




import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { InvoiceTemplate } from "../../components";
import logo from "/park_plaza-logo.jpg";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
// Increased to allow more rows to physically fit before forcing a new page
const ROWS_PER_PAGE = 22; 

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
    const yy = String(d.getFullYear()).slice(2);
    return `${dd}/${mm}/${yy}`;
  } catch { return dateStr; }
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "";
  const n = parseFloat(val);
  if (isNaN(n)) return "";
  return n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ─────────────────────────────────────────────────────────────────────────────
// API → VIEW SCHEMA MAPPER
// ─────────────────────────────────────────────────────────────────────────────
const mapApiDataToInvoice = (data = {}) => {
  const accRows = (data.accommodationDetails || []).map((night) => ({
    rawDate: night.date,
    date: formatDate(night.date),
    text: night.text || "GUEST ROOM",
    chgExclVat: formatCurrency(night.charges_excl_vat),
    vat: formatCurrency(night.vat_amount),
    chgGbp: formatCurrency(night.charges_gbp),
    cred: night.credits_gbp != null ? formatCurrency(night.credits_gbp) : "",
  }));

  const svcRows = (data.otherServices || []).map((svc) => ({
    rawDate: svc.date,
    date: formatDate(svc.date),
    text: svc.text || svc.name || "",
    chgExclVat: formatCurrency(svc.charges_excl_vat),
    vat: formatCurrency(svc.vat_amount),
    chgGbp: formatCurrency(svc.charges_gbp),
    cred: svc.credits_gbp != null ? formatCurrency(svc.credits_gbp) : "",
  }));

  const items = [...accRows, ...svcRows].sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

  const totalCharges = (data.totalRoomGross || 0) + (data.totalServicesGross || 0);
  const totalCredits = (data.totalRoomGross || 0) + (data.totalServicesGross || 0);
  const balance = 0.00;

  const vatSummary = {
    exclVat: "1,209.93",
    vatPercent: "VAT 20%",
    vatAmount: "241.99",
    inclVat: "1,451.91",
  };

  const detailedTransactions = {
    left: [
      { key: "Transaction ID",   value: "50813454" },
      { key: "Approval Code",    value: "605800" },
      { key: "Approval Amount",  value: "1,151.91" },
    ],
    right: [
      { key: "Credit Card #",      value: "XXXXXXXXXXXX8188" },
      { key: "Credit Card Expiry", value: "XX/XX" },
      { key: "Transaction Amount", value: "1,151.91" },
    ],
  };

  return {
    guestName:     data.guestName     || "Alhade, Alhadad",
    companyName:   data.companyName   || "AGODA COMPANY PTE LTD",
    roomNo:        data.roomNo        || "0621",
    arrivalDate:   formatDate(data.arrivalDate    || "2026-01-31"),
    departureDate: formatDate(data.departureDate  || "2026-02-07"),
    resNo:         data.reservationNo || data.confNo || "281765081",
    invoiceNo:     data.invoiceNo     || "",
    folioNo:       data.folioNo       || "537461",
    invoiceDate:   formatDate(data.invoiceDate || data.taxDate || "2026-02-07"),
    referenceNo:   data.referenceNo   || "PPWA00224",
    currency:      data.currency      || "GBP",
    items,
    totals: {
      chgGbp:  formatCurrency(totalCharges),
      cred:    formatCurrency(totalCredits),
      balance: `${formatCurrency(balance)} ${data.currency || "GBP"}`,
    },
    detailedTransactions,
    vatSummary,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ParkPlazaInvoiceView = ({ invoiceData }) => {
  const { invoiceId }  = useParams();
  const location       = useLocation();
  const navigate       = useNavigate();

  const [invoice,    setInvoice]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    setInvoice(mapApiDataToInvoice(invoiceData || {}));
    setLoading(false);
  }, [invoiceData]);

  // ── Split items into pages ─────────────────────────────────────────────────
  const pages = useMemo(() => {
    if (!invoice) return [];
    const { items } = invoice;
    if (!items || items.length === 0) return [[]];
    const result = [];
    for (let i = 0; i < items.length; i += ROWS_PER_PAGE) {
      result.push(items.slice(i, i + ROWS_PER_PAGE));
    }
    return result;
  }, [invoice]);

  const totalPageCount = pages.length;

  // ── Auto-download on /download-pdf route ──────────────────────────────────
  useEffect(() => {
    if (isPdfDownload && invoice && invoiceRef.current) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice, navigate]);

  // ── PDF: per-page jsPDF + html2canvas loop ────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(
      document.head.querySelectorAll('link[rel="stylesheet"], style')
    );
    headStyles.forEach(s => s.parentNode && s.parentNode.removeChild(s));

    try {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      await new Promise(resolve => setTimeout(resolve, 500));

      const pageEls = invoiceRef.current.querySelectorAll('.invoice-page');
      if (!pageEls.length) return;

      const { jsPDF }   = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      for (let i = 0; i < pageEls.length; i++) {
        const el = pageEls[i];

        const prevMargin   = el.style.margin;
        const prevShadow   = el.style.boxShadow;
        el.style.margin    = '0';
        el.style.boxShadow = 'none';

        const canvas = await html2canvas(el, {
          scale:           3,
          useCORS:         true,
          letterRendering: true,
          scrollY:         0,
          width:           el.offsetWidth,
          windowWidth:     el.offsetWidth,
        });

        el.style.margin    = prevMargin;
        el.style.boxShadow = prevShadow;

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      pdf.save(`Park_Plaza_Invoice_${invoice.folioNo || invoice.invoiceNo || 'Invoice'}.pdf`);
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      headStyles.forEach(s => document.head.appendChild(s));
      setPdfLoading(false);
    }
  };

  if (!invoice) return null;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <InvoiceTemplate
      loading={loading}
      invoice={invoice}
      pdfLoading={pdfLoading}
      onDownloadPDF={handleDownloadPDF}
      onPrint={() => window.print()}
      onBack={() => navigate("/invoices")}
    >
      <div className="park-plaza-wrapper">

        {/* ── STYLES — pixel-identical to the working view/print version ── */}
        <style id="park-plaza-styles">{`
          .park-plaza-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            font-family: Arial, Helvetica, sans-serif;
            background: #e0e0e0;
            gap: 20px;
          }
          @media print {
            .park-plaza-wrapper { background: #fff !important; padding: 0 !important; gap: 0 !important; }
            .no-print { display: none !important; }
          }

          .invoice-page {
            width: 850px;
            height: 1122px;
            background: #ffffff;
            padding: 0px 40px 40px 40px;
            box-sizing: border-box;
            color: #000;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            page-break-after: always;
            break-after: always;
          }
          .invoice-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          @media screen {
            .invoice-page { box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
          }

          .invoice-title {
            position: absolute;
            top: 42px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 15px;
            letter-spacing: 0.3px;
          }
          .logo {
            position: absolute;
            top: 12px;
            right: 40px;
            width: 105px;
          }
          /* Reduced top margin to pull address up */
          .billing-address { margin-top: 85px; line-height: 1.35; } 
          .middle-section  { display: flex; justify-content: space-between; padding-right: 20px; }
          /* Reduced top margin to pull table up */
          .guest-name      { margin-top: 35px; } 
          .meta-table      { width: 270px; border-collapse: collapse; }
          .meta-table td   { vertical-align: top; }
          .meta-table td:first-child { width: 130px; }
          .account-no { margin-top: 10px; margin-bottom: 20px; padding-left: 20px; }

          .line-items { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .line-items th {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            font-weight: normal;
            vertical-align: middle;
            padding: 4px 0;
          }
          .line-items td { padding: 2px 0; vertical-align: top; }

          .th-date    { text-align: left; padding-left: 10px !important; width: 13%;}
          .th-text    { text-align: left;  width: 30%; }
          .th-chg-ex  { text-align: center; width: 20%; }
          .th-vat     { text-align: center; width: 13%;}
          .th-chg-gbp { text-align: right;  width: 12%}
          .th-cred    { text-align: right; width: 12%;}

          .td-date      { padding-left: 10px !important; }
          .td-num-right { text-align: right; }
          .pr-chg-ex    { padding-right: 35px !important; }
          .pr-vat       { padding-right: 25px !important; }
          .pr-chg-gbp   { padding-right: 6px !important; }

          .calculations-wrapper { margin-top: 0px; width: 100%; }
          /* Reduced top margin slightly */
          .vat-summary    { width: 508px; border-collapse: collapse; margin-top: 15px; } 
          .vat-summary th {
            padding: 4px 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            font-weight: normal;
          }
          .vat-summary td { padding: 4px 0; }

          .trans-table    { border-collapse: collapse; width: 100%; }
          .trans-table td { padding: 1px 0; }

          .spacer-fill { flex-grow: 1; }
          .invoice-footer {
            display: flex;
            justify-content: flex-end;
            font-size: 10px;
            line-height: 1.2;
            margin-top: 20px; /* Reduced from 40px */
          }
          .footer-right { width: 170px; }
        `}</style>

        {/* ── ALL PAGES ─────────────────────────────────────────────────── */}
        <div ref={invoiceRef}>
          {pages.map((pageItems, pageIndex) => {
            const isLastPage = pageIndex === totalPageCount - 1;
            const pageLabel  = `${pageIndex + 1} of ${totalPageCount}`;

            return (
              <div key={pageIndex} className="invoice-page">

                {/* ════ HEADER (every page) ════ */}
                <div className="page-header">
                  <div className="invoice-title">COPY OF INVOICE</div>
                  <img src={logo} alt="Park Plaza London Waterloo" className="logo" />

                  <div className="billing-address">
                    {invoice.companyName && <>{invoice.companyName}<br /></>}
                    Algeria Square Building Number 12 First Floor<br />
                    Tripoli<br />
                    Libya
                  </div>

                  <div className="middle-section">
                    <div className="guest-name">{invoice.guestName}</div>
                    <table className="meta-table">
                      <tbody>
                        <tr><td>Room No.:</td>    <td>{invoice.roomNo}</td></tr>
                        <tr><td>Arrival:</td>     <td>{invoice.arrivalDate}</td></tr>
                        <tr><td>Departure:</td>   <td>{invoice.departureDate}</td></tr>
                        <tr><td>Res. No.:</td>    <td>{invoice.resNo}</td></tr>
                        <tr><td>Page No.:</td>    <td>{pageLabel}</td></tr>
                        <tr><td>Invoice No.:</td> <td>{invoice.invoiceNo}</td></tr>
                        <tr><td>Folio No.:</td>   <td>{invoice.folioNo}</td></tr>
                        <tr><td>Date:</td>        <td>{invoice.invoiceDate}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="account-no">
                    {invoice.referenceNo && <>Account No.: {invoice.referenceNo}</>}
                  </div>
                </div>

                {/* ════ LINE ITEMS (every page) ════ */}
                <table className="line-items">
                  <colgroup>
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '17%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="th-date">Date</th>
                      <th className="th-text" width="35%">Text</th>
                      <th className="th-chg-ex" >Charges<br />Excl. VAT</th>
                      <th className="th-vat">VAT<br />Amount</th>
                      <th className="th-chg-gbp">Charges ({invoice.currency})</th>
                      <th className="th-cred">Credits ({invoice.currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="td-date">{item.date}</td>
                        <td>{item.text}</td>
                        <td className="td-num-right pr-chg-ex">{item.chgExclVat}</td>
                        <td className="td-num-right pr-vat">{item.vat}</td>
                        <td className="td-num-right pr-chg-gbp">{item.chgGbp}</td>
                        <td className="td-num-right">{item.cred}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* ════ CALCULATIONS (last page only) ════ */}
                {isLastPage && (
                  <div className="calculations-wrapper">
                    <table className="line-items">
                      <colgroup>
                        <col style={{ width: '11%' }} />
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '13%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '17%' }} />
                        <col style={{ width: '17%' }} />
                      </colgroup>
                      <tbody>
                        <tr>
                          <td colSpan="6" style={{ height: '15px', borderBottom: '2px solid #000', marginBottom: "5px" }} />
                        </tr>
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'right', paddingRight: '10px' }}>Total</td>
                          {/* This is the magic part. 'relative' lets it slide out of the column boundaries */}
                          <td className="td-num-right pr-chg-gbp" style={{ position: 'relative', left: '20px' }}>
                            {invoice.totals.chgGbp}
                          </td>
                          <td className="td-num-right">{invoice.totals.cred}</td>
                        </tr>
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'right', paddingRight: '10px', verticalAlign: 'middle' }}>Balance Due</td>
                          <td colSpan="2" style={{
                            borderTop: '2px solid #000',
                            borderBottom: '2px solid #000',
                            textAlign: 'left',
                            padding: '2px 0',
                            paddingLeft: "90px"
                          }}>
                            {invoice.totals.balance}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <table className="vat-summary">
                      <thead>
                        <tr>
                          <th style={{ width: '31%', textAlign: 'center', paddingLeft: '25px' }}>Charges Excl. VAT</th>
                          <th style={{ width: '25%', textAlign: 'left', paddingLeft: "10px" }}>VAT Amount</th>
                          <th style={{ width: '25%', textAlign: 'center' }}></th>
                          <th style={{ width: '25%', textAlign: 'center' }}>Total VAT Incl.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ textAlign: 'right' , paddingRight: '10px' }}>{invoice.vatSummary.exclVat}</td>
                          <td style={{ textAlign: 'left', paddingLeft: "10px"  }}>{invoice.vatSummary.vatPercent}</td>
                          <td style={{ textAlign: 'center' }}>{invoice.vatSummary.vatAmount}</td>
                          <td style={{ textAlign: 'right' , paddingRight: "4px"}}>{invoice.vatSummary.inclVat}</td>
                        </tr>
                      </tbody>
                    </table>

                  </div>
                )}

                {/* Flex spacer — pushes footer to the bottom of every page */}
                <div className="spacer-fill" />

                {/* ════ FOOTER (last page only) ════ */}
                {isLastPage && (
                  <div className="invoice-footer">
                    <div className="footer-right">
                      Park Plaza London Waterloo<br />
                      6 Hercules Rd<br />
                      SE1 7DU LONDON<br />
                      United Kingdom<br />
                      T: + 44 (0) 333 400 6128<br />
                      F: + 44 (0) 333 400 6129<br />
                      E: resppwa@pphe.com<br />
                      www.parkplaza.com
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>
    </InvoiceTemplate>
  );
};

export default ParkPlazaInvoiceView;