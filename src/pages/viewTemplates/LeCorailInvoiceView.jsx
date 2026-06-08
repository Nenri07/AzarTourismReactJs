// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// import logo from '/lecroil-logo.png';

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
//     const yy = String(d.getFullYear()).slice(-2);
//     return `${dd}/${mm}/${yy}`;
//   } catch { return dateStr; }
// };

// const formatCurrency = (val) => {
//   if (val === null || val === undefined || val === "") return "";
//   return parseFloat(val).toLocaleString('fr-FR', {
//     minimumFractionDigits: 3,
//     maximumFractionDigits: 3,
//   }).replace(/\s/g, ' ');
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // API → VIEW SCHEMA MAPPER
// // ─────────────────────────────────────────────────────────────────────────────

// const mapApiDataToInvoice = (data = {}) => {
//   if (!data) return null;

//   const itemsRaw = [];

//   if (data.accommodationDetails && data.accommodationDetails.length > 0) {
//     data.accommodationDetails.forEach((acc) => {
//       itemsRaw.push({
//         rawDate: acc.date,
//         client: data.guestName,
//         desc: acc.detail || "Tarifs Agence de Voyage",
//         pensio: acc.pensio || "LO",
//         room: acc.room || data.roomNo,
//         voucher: acc.voucher || "",
//         qty: acc.qty || 1,
//         debit: acc.debit,
//         credit: acc.credit
//       });

//       if (data.showPerNightTax && data.cityTaxPerNight) {
//         itemsRaw.push({
//           rawDate: acc.date,
//           client: data.guestName,
//           desc: "Taxe de Séjour",
//           pensio: "LO",
//           room: data.roomNo,
//           voucher: "",
//           qty: data.cityTaxPerPerson || 1,
//           debit: data.cityTaxPerNight,
//           credit: ""
//         });
//       }
//     });
//   }

//   if (data.otherServices && data.otherServices.length > 0) {
//     data.otherServices.forEach((svc) => {
//       itemsRaw.push({
//         rawDate: svc.date,
//         client: data.guestName,
//         desc: svc.name,
//         pensio: "",
//         room: data.roomNo,
//         voucher: "",
//         qty: 1,
//         debit: svc.amount,
//         credit: ""
//       });
//     });
//   }

//   if (!data.showPerNightTax && data.cityTaxTotal > 0) {
//     itemsRaw.push({
//       rawDate: data.invoiceDate,
//       client: data.guestName,
//       desc: "Taxe de Séjour",
//       pensio: "",
//       room: data.roomNo,
//       voucher: "",
//       qty: data.nights || 1,
//       debit: data.cityTaxTotal,
//       credit: ""
//     });
//   }

//   itemsRaw.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

//   const items = itemsRaw.map(item => ({
//     ...item,
//     date: formatDate(item.rawDate)
//   }));

//   const addressParts = data.address ? data.address.split(',').map(s => s.trim()) : [];
//   const compAddr1 = addressParts[0] || "";
//   const compAddr2 = addressParts[1] || "";
//   const compAddr3 = addressParts.slice(2).join(', ') || "";

//   return {
//     meta: {
//       invoiceNo: data.invoiceNo || "",
//       date: formatDate(data.invoiceDate || new Date()),
//       time: data.invoiceTime || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
//     },
//     guest: {
//       identifiant: data.userId || "",
//       name: data.guestName || "",
//       room: data.roomNo || "",
//       arrival: formatDate(data.arrivalDate),
//       departure: formatDate(data.departureDate),
//       companyName: data.companyName || "",
//       companyAddress1: compAddr1,
//       companyAddress2: compAddr2,
//       companyAddress3: compAddr3,
//       mf: data.vatNo || "",
//       tel: data.companyTel || ""
//     },
//     items,
//     totals: {
//       netAmount: formatCurrency(data.totalHorsTaxes),
//       taxBase: formatCurrency(data.totalHorsTaxes),
//       tva7: formatCurrency(data.vat7Pct),
//       stampDuty: formatCurrency(data.stampTaxTotal),
//       balance: formatCurrency(data.grandTotalTnd),
//     }
//   };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // PAGINATION  ← FIXED
// // ─────────────────────────────────────────────────────────────────────────────

// const buildPages = (items = []) => {
//   // How many rows fit comfortably when the totals block must also appear on the page
//   const MAX_ROWS_WITH_TOTALS = 18;
//   // How many rows fit on a "continuation" page that carries no totals block
//   const MAX_ROWS_NORMAL = 30;

//   const pages = [];

//   if (items.length === 0) {
//     pages.push({ items: [], isLastPage: true, pageNo: 1, totalPages: 1 });
//     return pages;
//   }

//   let i = 0;
//   while (i < items.length) {
//     const remaining = items.length - i;

//     if (remaining <= MAX_ROWS_WITH_TOTALS) {
//       // All remaining rows fit alongside the totals block → final page
//       pages.push({ items: items.slice(i, i + remaining), isLastPage: true });
//       i += remaining;
//     } else if (remaining <= MAX_ROWS_NORMAL) {
//       // Rows fit on one page but the totals block would be too crowded.
//       // Put all rows here WITHOUT the totals, then add a dedicated totals-only page.
//       pages.push({ items: items.slice(i, i + remaining), isLastPage: false });
//       i += remaining;
//       // Dedicated last page (no rows, just totals/footer)
//       pages.push({ items: [], isLastPage: true });
//     } else {
//       // More rows than fit on a single page → take a full slice and keep going
//       pages.push({ items: items.slice(i, i + MAX_ROWS_NORMAL), isLastPage: false });
//       i += MAX_ROWS_NORMAL;
//     }
//   }

//   const total = pages.length;
//   pages.forEach((p, idx) => { p.pageNo = idx + 1; p.totalPages = total; });
//   return pages;
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────

// const LeCorailInvoiceView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const initialData = invoiceData || location.state?.initialData;

//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [paginatedData, setPaginatedData] = useState([]);
//   const invoiceRef = useRef(null);

//   const isPdfDownload = location.pathname.includes("/download-pdf");

//   useEffect(() => {
//     if (initialData) {
//       setInvoice(mapApiDataToInvoice(initialData));
//       setLoading(false);
//     }
//   }, [initialData]);

//   useEffect(() => {
//     if (!invoice?.items) return;
//     setPaginatedData(buildPages(invoice.items));
//   }, [invoice]);

//   useEffect(() => {
//     if (isPdfDownload && invoice && invoiceRef.current) {
//       const timer = setTimeout(async () => {
//         await handleDownloadPDF();
//         navigate("/invoices", { replace: true });
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [isPdfDownload, invoice, navigate]);

//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//     headStyles.forEach(style => style.parentNode.removeChild(style));

//     const element = invoiceRef.current;
//     element.classList.add('pdf-export-mode');

//     try {
//       const images = element.querySelectorAll('img');
//       await Promise.all(Array.from(images).map(img => {
//         if (img.complete) return Promise.resolve();
//         return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
//       }));
//       await new Promise(resolve => setTimeout(resolve, 500));

//       const opt = {
//         margin: 0,
//         filename: `Le_Corail_Invoice_${invoice.guest.room || 'Room'}.pdf`,
//         image: { type: 'jpeg', quality: 1 },
//         html2canvas: { scale: 4, useCORS: true, letterRendering: true, scrollY: 0, windowWidth: 794 },
//         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['css', 'legacy'] },
//       };

//       await html2pdf().set(opt).from(element).save();
//       toast.success("PDF Downloaded");
//     } catch (err) {
//       console.error("PDF Error:", err);
//       toast.error("PDF generation failed");
//     } finally {
//       element.classList.remove('pdf-export-mode');
//       headStyles.forEach(style => document.head.appendChild(style));
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   // ─────────────────────────────────────────────────────────────────────────
//   // STYLES  (invoice page internals only — the outer chrome is InvoiceTemplate)
//   // ─────────────────────────────────────────────────────────────────────────
//   const styles = `
//     @page { size: A4 portrait; margin: 0; }

//     /* ── Single A4 page ── */
//     .lc-page-container {
//       background: #fff;
//       width: 210mm;
//       height: 297mm;
//       padding: 10mm 8mm;
//       box-shadow: 0 2px 12px rgba(0,0,0,0.13);
//       color: #000;
//       position: relative;
//       display: flex;
//       flex-direction: column;
//       page-break-after: always;
//       break-after: page;
//       page-break-inside: avoid;
//       box-sizing: border-box;
//     }
//     .lc-page-container:last-child {
//       page-break-after: avoid;
//       break-after: avoid;
//     }

//     /* ── PDF export overrides ── */
//     .lc-pdf-export-mode { background: #fff !important; padding: 0 !important; gap: 0 !important; }
//     .lc-pdf-export-mode .lc-page-container {
//       margin: 0 !important;
//       box-shadow: none !important;
//       border: none !important;
//       height: 295mm !important;
//       max-height: 295mm !important;
//       overflow: hidden !important;
//       page-break-after: avoid !important;
//       page-break-inside: avoid !important;
//     }
// .wrapper{
// display: flex;
// }
//     /* ── Wrapper that InvoiceTemplate renders into ── */
//     .lc-invoice-wrapper {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   gap: 20px;
//   padding: 0 0 40px 0;
//   background: transparent;
// }

//     /* ── Invoice internals ── */
//     .lc-invoice-wrapper * { box-sizing: border-box; }
//     .lc-bold { font-weight: bold; }
//     .lc-text-right { text-align: right; }
//     .lc-text-center { text-align: center; }
//     .lc-flex-between { display: flex; justify-content: space-between; }
//     .lc-divider-thick { border-top: 1px solid #959595; margin: 4px 0 8px 0; }

//     .lc-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
//     .lc-header-left { display: flex; gap: 0px; }
//     .lc-logo-img { width: 165px; height: auto; object-fit: contain; }
//     .lc-hotel-address { font-size: 13px; line-height: 1.4; font-family: Arial, Helvetica, sans-serif; }
//     .lc-header-right { display: flex; flex-direction: column; align-items: flex-end; font-size: 11.5px; }
//     .lc-page-info { margin-bottom: 0px; word-spacing: 4px; font-size: 13px; }
//     .lc-contact-table { font-size: 12px; text-align: left; border-spacing: 0; position: absolute; top: 70px; right: 113px;}
//     .lc-contact-table td { padding-bottom: 0px; }
//     .lc-contact-table td:first-child { width: 80px; }

//     .lc-middle-section { display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 8px; margin-top: 8px; }
//     .lc-invoice-left { width: 49%; }
//     .lc-invoice-title-row { display: flex; align-items: center; gap: 15px; margin-bottom: 3px; }
//     .lc-invoice-title-row h1 { font-size: 22px; font-weight: bold; margin: 0; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif; }
//     .lc-shadow-input-box { border: 1px solid #999; box-shadow: 4px 4px 0px #cfcfcf; padding: 3px 10px; font-size: 17px; font-weight: bold; width: 210px; font-family: Arial, Helvetica, sans-serif; }
//     .lc-invoice-meta-grid { display: grid; grid-template-columns: 95px auto;  font-size: 11.5px; font-family: Arial, Helvetica, sans-serif; }

//     .lc-client-right { width: 62%; padding-top: 2px; }
//     .lc-open-right-box { border-top: 2px solid #a5a5a5; border-bottom: 2px solid #a5a5a5; border-left: 2px solid #a5a5a5; border-right: none; border-top-left-radius: 12px; border-bottom-left-radius: 12px; padding: 3px 0 0px 12px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
//     .lc-open-right-box h3 { font-size: 15px; margin-bottom: 6px; font-family: Arial, Helvetica, sans-serif; }
//     .lc-open-right-box p { font-size: 12.5px; margin-bottom: 2px; font-family: Arial, Helvetica, sans-serif; }

//     .lc-data-table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; margin-bottom: 8px; font-family: Arial, Helvetica, sans-serif; }
//     .lc-data-table thead th { border-top: 2px solid #a5a5a5; border-bottom: 2px solid #a5a5a5; padding: 4px 2px; text-align: left; font-weight: normal; }
//     .lc-data-table tbody td { padding: 3px 2px; vertical-align: top; line-height: 1.25; }
//     .lc-row-grey { background-color: #e6e8e9; }

//     .lc-col-date { width: 11%; }
//     .lc-col-detail { width: 45%; }
//     .lc-col-pensio { width: 8%; }
//     .lc-col-roo { width: 5%; text-align: center; }
//     .lc-col-voucher { width: 9%; }
//     .lc-col-qty { width: 5%; text-align: center; }
//     .lc-col-debit { width: 9%; text-align: right; }
//     .lc-col-credit { width: 8%; text-align: right; }

//     .lc-detail-split { display: flex; justify-content: space-between; }
//     .lc-detail-client { width: 48%; }
//     .lc-detail-action { width: 52%; padding-left: 4px; }

//     .lc-calc-section { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 15px; }
//     .lc-vat-closed-box { width: 40%; border: 1.5px solid #777; border-radius: 10px; overflow: hidden; }
//     .lc-vat-table { width: 100%; height: 112px; border-collapse: collapse; font-size: 12px; font-family: Arial, Helvetica, sans-serif; }
//     .lc-vat-table th, .lc-vat-table td { padding: 4px 10px 0px 10px; }
//     .lc-vat-table th { font-weight: normal; border-bottom: 1.5px solid #777;  }
//     .lc-vat-table th:not(:last-child), .lc-vat-table td:not(:last-child) { border-right: 1.5px solid #777; }

//     .lc-totals-closed-box { width: 49%;  solid #777;  padding: 10px 14px; font-size: 13.5px; display: flex; flex-direction: column; gap: 10px; font-family: Arial, Helvetica, sans-serif; border-top: 2px solid #a5a5a5;
//     border-bottom: 2px solid #a5a5a5;
//     border-left: 2px solid #a5a5a5;
//     border-right: none;
//     border-top-left-radius: 12px;
//     border-bottom-left-radius: 12px;
//      }
//     .lc-totals-row { display: flex; justify-content: space-between; }

//     .lc-total-container-right { display: flex; flex-direction: column; align-items: flex-end; width: 49%; margin-top: 10px; }
//     .lc-invoice-total-row { display: flex; justify-content: flex-end; align-items: stretch; width: 100%; height: 22px; gap: 5px; }
//     .lc-total-label-box { border: 1px solid #999; width: 160px; padding: 3px 10px; display: flex; align-items: center; font-size: 13px; font-family: Arial, Helvetica, sans-serif; box-shadow: 4px 4px 0px #cfcfcf;}
//     .lc-total-value-box { border: 1px solid #999; box-shadow: 4px 4px 0px #cfcfcf; width: 170px; padding: 3px 10px; text-align: right; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: flex-end; font-family: Arial, Helvetica, sans-serif; }

//     .lc-bottom-statement { margin-top: 20px; width: 70%; }
//     .lc-statement-text { font-size: 13px; margin-bottom: 5px; font-family: Arial, Helvetica, sans-serif; }
//     .lc-statement-line { border-top: 1px solid #000;  margin-bottom: 6px; }
//     .lc-statement-amount { font-size: 15px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; }
//   .wrapper{justify-content: right;}
//     .lc-footer-sticky { margin-top: auto; width: 100%; }
//     .lc-finance-dept-container { margin-top: 25px; margin-bottom: 30px; width: 100%; display: flex; justify-content: flex-start; flex-direction: column; }
//     .lc-finance-line { border-top: 1px solid #777; width: 68%; margin-bottom: 6px; }
//     .lc-footer-dept { font-size: 11.5px; font-family: Arial, Helvetica, sans-serif; }
//     .lc-footer-tnd { font-size: 11.5px; font-weight: bold; margin-top: 15px; font-family: Arial, Helvetica, sans-serif; }
//     .lc-footer-contact { font-size: 11.5px; font-weight: bold; margin-top: 4px; font-family: Arial, Helvetica, sans-serif; }
//     .lc-footer-corporate { font-size: 10px; margin-top: 15px; padding-top: 5px; border-top: 1px solid #ccc; font-family: Arial, Helvetica, sans-serif; }

//     @media print {
//       .lc-invoice-wrapper { padding: 0; gap: 0; }
//       .lc-page-container { box-shadow: none !important; margin: 0 !important; height: 297mm !important; border: none !important; page-break-after: always; }
//       .lc-page-container:last-child { page-break-after: avoid; }
//     }
//   `;

//   // ─────────────────────────────────────────────────────────────────────────
//   // PAGE HEADER
//   // ─────────────────────────────────────────────────────────────────────────
//   const PageHeader = ({ page }) => (
//     <>
//           <div className="lc-divider-thick"></div>

//       <div className="lc-header-top">
//         <div className="lc-header-left">
//           <img src={logo} alt="LE CORAIL" className="lc-logo-img" />
//           <div className="lc-hotel-address">
//             <span className="lc-bold" style={{ fontSize: '14px' }}>LE CORAIL Suites Hôtel</span><br />
//             Rue de la feuille D'érable<br />
//             Cité les Pins<br />
//             Les Berges du Lac II<br />
//             MF : 083575TAE003
//           </div>
//         </div>
//         <div className="lc-header-right">
//           <div className="lc-page-info">
//             {invoice.meta.date} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {invoice.meta.time} Page {page.pageNo} of {page.totalPages}
//           </div>
//           <table className="lc-contact-table">
//             <tbody>
//               <tr><td>Téléphone:</td><td>+216 71 268 000</td></tr>
//               <tr><td>Fax:</td><td>+216 71 268 444</td></tr>
//               <tr><td>RIB:</td><td>BT LAC 2 : 05031000098300042891</td></tr>
//               <tr><td>IBAN:</td><td>TN5905031000098300042891</td></tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <div className="lc-divider-thick"></div>

//       <div className="lc-middle-section">
//         <div className="lc-invoice-left">
//           <div className="lc-invoice-title-row">
//             <h1>INVOICE</h1>
//             <div className="lc-shadow-input-box">{invoice.meta.invoiceNo}</div>
//           </div>
//           <div className="lc-invoice-meta-grid">
//             <div style={{ gridColumn: '1 / span 2' }}>
//               <span style={{ display: 'inline-block', width: '90px' }}></span>
//               <strong style={{ fontSize: '13px' }}>Date &nbsp; {invoice.meta.date}</strong>
//             </div>
//             <div>Identifiant:</div><div><strong style={{ fontSize: '12px' }}>{invoice.guest.identifiant}</strong></div>
//             <div>Room number:</div><div><strong style={{ fontSize: '12px' }}>{invoice.guest.room}</strong></div>
//             <div>Stay:</div><div><strong style={{ fontSize: '12px' }}>{invoice.guest.arrival} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {invoice.guest.departure}</strong></div>
//             <div>Client :</div><div><strong style={{ fontSize: '12px' }}>{invoice.guest.name}</strong></div>
//           </div>
//         </div>

//         <div className="lc-client-right">
//           <div className="lc-open-right-box">
//             <div>
//               <h3>{invoice.guest.companyName}</h3>
//               {invoice.guest.companyAddress1 && <p>{invoice.guest.companyAddress1}</p>}
//               {invoice.guest.companyAddress2 && <p>{invoice.guest.companyAddress2}</p>}
//               {invoice.guest.companyAddress3 && <p>{invoice.guest.companyAddress3}</p>}
//             </div>
//             <div className="lc-flex-between" style={{ fontSize: '12.5px', marginTop: '10px', paddingRight: '12px' }}>
//               <span>MF : {invoice.guest.mf}</span>
//               {invoice.guest.tel && <span>Tel: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {invoice.guest.tel}</span>}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="lc-divider-thick"></div>
//     </>
//   );

//   // ─────────────────────────────────────────────────────────────────────────
//   // RENDER — now using InvoiceTemplate exactly like RaddisonBluInvoiceView
//   // ─────────────────────────────────────────────────────────────────────────
//   return (
//     <InvoiceTemplate
//       loading={loading}
//       error={null}
//       invoice={invoice}
//       pdfLoading={pdfLoading}
//       onDownloadPDF={handleDownloadPDF}
//       onPrint={handlePrint}
//       onBack={() => navigate("/invoices")}
//     >
//       <style dangerouslySetInnerHTML={{ __html: styles }} />

//       <div className="lc-invoice-wrapper" ref={invoiceRef}>
//         {paginatedData.map((page, pageIdx) => {
//           let lastRenderedDate = "";

//           return (
//             <React.Fragment key={pageIdx}>
//               <div className="lc-page-container">

//                 <PageHeader page={page} />

//                 <table className="lc-data-table" style={{ marginBottom: page.isLastPage ? '15px' : '8px' }}>
//                   <thead>
//                     <tr>
//                       <th className="lc-col-date">Date</th>
//                       <th className="lc-col-detail">Detail</th>
//                       <th className="lc-col-pensio">Pensio</th>
//                       <th className="lc-col-roo">Roo</th>
//                       <th className="lc-col-voucher">Voucher</th>
//                       <th className="lc-col-qty">Qty</th>
//                       <th className="lc-col-debit">Debit</th>
//                       <th className="lc-col-credit">Credit</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {page.items.map((txn, index) => {
//                       const showDate = txn.date !== lastRenderedDate;
//                       if (showDate) lastRenderedDate = txn.date;
//                       const isGreyRow = index % 2 === 0;

//                       return (
//                         <tr key={index} className={isGreyRow ? "lc-row-grey" : ""}>
//                           <td className="lc-bold">{showDate ? txn.date : ""}</td>
//                           <td className={txn.client === "Débiteurs" ? "lc-bold" : ""}>
//                             {txn.client === "Débiteurs" ? (
//                               "Débiteurs"
//                             ) : (
//                               <div className="lc-detail-split">
//                                 <div className="lc-detail-client">{txn.client}</div>
//                                 <div className="lc-detail-action">{txn.desc}</div>
//                               </div>
//                             )}
//                           </td>
//                           <td>{txn.pensio}</td>
//                           <td className="lc-text-center">{txn.room}</td>
//                           <td>{txn.voucher}</td>
//                           <td className="lc-text-center">{txn.qty}</td>
//                           <td className="lc-text-right">{txn.debit ? formatCurrency(txn.debit) : ""}</td>
//                           <td className={`lc-text-right ${txn.client === "Débiteurs" ? "lc-bold" : ""}`} style={{ whiteSpace: 'nowrap' }}>
//                             {txn.credit ? formatCurrency(txn.credit) : ""}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>

//                 {page.isLastPage && (
//                   <>
//                     <div className="lc-calc-section">
//                       <div className="lc-vat-closed-box">
//                         <table className="lc-vat-table">
//                           <thead>
//                             <tr>
//                               <th style={{textAlign: "left", verticalAlign: "bottom", display: "flex"}}>VAT rate</th>
//                               <th className="lc-text-right">Base</th>
//                               <th className="lc-text-right">VAT</th>
//                             </tr>
//                           </thead>
//                           <tbody style={{verticalAlign : 'top'}}>
//                             <tr>
//                               <td>TVA 7.000%</td>
//                               <td className="lc-text-right">{invoice.totals.taxBase}</td>
//                               <td className="lc-text-right">{invoice.totals.tva7}</td>
//                             </tr>
//                           </tbody>
//                         </table>
//                       </div>

//                       <div className="lc-totals-closed-box">
//                         <div className="lc-totals-row">
//                           <span>Total VAT excluded</span>
//                           <span>{invoice.totals.netAmount}</span>
//                         </div>
//                         <div className="lc-totals-row">
//                           <span>VAT</span>
//                           <span>{invoice.totals.tva7}</span>
//                         </div>
//                         <div className="lc-totals-row">
//                           <span>Fiscal stamp</span>
//                           <span>{invoice.totals.stampDuty}</span>
//                         </div>
//                       </div>
//                     </div>

//                     <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
//                       <div className="lc-total-container-right">
//                         <div className="lc-invoice-total-row">
//                           <div className="lc-total-label-box">Invoice TOTAL</div>
//                           <div className="lc-total-value-box">{invoice.totals.balance}</div>
//                         </div>
//                       </div>
//                     </div>
//                       <div className="wrapper">
//                     <div className="lc-bottom-statement">
//                       <div className="lc-statement-text">The total of this invoice is:</div>
//                       <div className="lc-statement-line"></div>
//                       <div className="lc-statement-amount">{invoice.totals.balance}</div>
//                     </div>
//                     </div>
//                   </>
//                 )}

//                 <div className="lc-footer-sticky">
//                   <div className="lc-finance-dept-container">
//                     <div className="lc-finance-line" style={{ width: page.isLastPage ? '68%' : '100%' }}></div>
//                     <div className={`lc-footer-dept ${!page.isLastPage ? "lc-bold" : ""}`}>
//                       FINANCE DEPARTMENT {!page.isLastPage && "| SHAYMA"}
//                     </div>
//                   </div>

//                   {page.isLastPage ? (
//                     <>
//                       <div className="lc-footer-tnd">Our invoices are in Tunisian Dinars (TND)</div>
//                       <div className="lc-footer-contact">For any financial information, please contact us by phone or by email : controle2@corail-suites.com</div>
//                     </>
//                   ) : (
//                     <div className="lc-footer-corporate lc-text-center lc-bold">
//                       Société Mehari Beach Immeuble Hannibal Les Berges du Lac Tunis | Tel +216 71 960 220 | Fax +216 71 960 231
//                     </div>
//                   )}
//                 </div>

//               </div>
//             </React.Fragment>
//           );
//         })}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default LeCorailInvoiceView;



import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { InvoiceTemplate } from "../../components";
import logo from '/lecroil-logo.png';

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
    return `${dd}/${mm}/${yy}`;
  } catch { return dateStr; }
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "";
  return parseFloat(val).toLocaleString('fr-FR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).replace(/\s/g, ' ');
};

// ─────────────────────────────────────────────────────────────────────────────
// API → VIEW SCHEMA MAPPER
// ─────────────────────────────────────────────────────────────────────────────

const mapApiDataToInvoice = (data = {}) => {
  if (!data) return null;

  const itemsRaw = [];

  if (data.accommodationDetails && data.accommodationDetails.length > 0) {
    data.accommodationDetails.forEach((acc) => {
      itemsRaw.push({
        rawDate: acc.date,
        client: data.guestName,
        desc: acc.detail || "Tarifs Agence de Voyage",
        pensio: acc.pensio || "LO",
        room: acc.room || data.roomNo,
        voucher: acc.voucher || "",
        qty: acc.qty || 1,
        debit: acc.debit,
        credit: acc.credit
      });

      if (data.showPerNightTax && data.cityTaxPerNight) {
        itemsRaw.push({
          rawDate: acc.date,
          client: data.guestName,
          desc: "Taxe de Séjour",
          pensio: "LO",
          room: data.roomNo,
          voucher: "",
          qty: data.cityTaxPerPerson || 1,
          debit: data.cityTaxPerNight,
          credit: ""
        });
      }
    });
  }

  if (data.otherServices && data.otherServices.length > 0) {
    data.otherServices.forEach((svc) => {
      itemsRaw.push({
        rawDate: svc.date,
        client: data.guestName,
        desc: svc.name,
        pensio: "",
        room: data.roomNo,
        voucher: "",
        qty: 1,
        debit: svc.amount,
        credit: ""
      });
    });
  }

  if (!data.showPerNightTax && data.cityTaxTotal > 0) {
    itemsRaw.push({
      rawDate: data.invoiceDate,
      client: data.guestName,
      desc: "Taxe de Séjour",
      pensio: "",
      room: data.roomNo,
      voucher: "",
      qty: data.nights || 1,
      debit: data.cityTaxTotal,
      credit: ""
    });
  }

  itemsRaw.sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

  const items = itemsRaw.map(item => ({
    ...item,
    date: formatDate(item.rawDate)
  }));

  const addressParts = data.address ? data.address.split(',').map(s => s.trim()) : [];
  const compAddr1 = addressParts[0] || "";
  const compAddr2 = addressParts[1] || "";
  const compAddr3 = addressParts.slice(2).join(', ') || "";

  return {
    meta: {
      invoiceNo: data.invoiceNo || "",
      date: formatDate(data.invoiceDate || new Date()),
      time: data.invoiceTime || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
    },
    guest: {
      identifiant: data.userId || "",
      name: data.guestName || "",
      room: data.roomNo || "",
      arrival: formatDate(data.arrivalDate),
      departure: formatDate(data.departureDate),
      companyName: data.companyName || "",
      companyAddress1: compAddr1,
      companyAddress2: compAddr2,
      companyAddress3: compAddr3,
      mf: data.vatNo || "",
      tel: data.companyTel || ""
    },
    items,
    totals: {
      netAmount: formatCurrency(data.totalHorsTaxes),
      taxBase: formatCurrency(data.totalHorsTaxes),
      tva7: formatCurrency(data.vat7Pct),
      stampDuty: formatCurrency(data.stampTaxTotal),
      balance: formatCurrency(data.grandTotalTnd),
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

const buildPages = (items = []) => {
  const MAX_ROWS_LAST = 18;
  const MAX_ROWS_CONT = 30;
  const pages = [];

  if (items.length === 0) {
    pages.push({ items: [], isLastPage: true, pageNo: 1, totalPages: 1 });
    return pages;
  }

  let i = 0;
  while (i < items.length) {
    const remaining = items.length - i;

    if (remaining <= MAX_ROWS_LAST) {
      // All remaining rows fit on the final page with the totals block
      pages.push({ items: items.slice(i, i + remaining), isLastPage: true });
      i += remaining;

    } else if (remaining <= MAX_ROWS_CONT) {
      // Rows fit on one page but too many to share with totals.
      // Show all rows here as the last page (totals still render since isLastPage=true).
      pages.push({ items: items.slice(i, i + remaining), isLastPage: true });
      i += remaining;

    } else {
      // More rows than fit on one page — take a full continuation slice
      pages.push({ items: items.slice(i, i + MAX_ROWS_CONT), isLastPage: false });
      i += MAX_ROWS_CONT;
    }
  }

  const total = pages.length;
  pages.forEach((p, idx) => { p.pageNo = idx + 1; p.totalPages = total; });
  return pages;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const LeCorailInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialData = invoiceData || location.state?.initialData;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (initialData) {
      setInvoice(mapApiDataToInvoice(initialData));
      setLoading(false);
    }
  }, [initialData]);

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

  // ─────────────────────────────────────────────────────────────────────────
  // buildPrintHTML — constructs a fully self-contained HTML document from
  // the live invoice state. No canvas, no image capture. The browser's own
  // renderer prints it — identical quality to the Print button.
  // Logo is inlined as a data URL so the popup window can load it.
  // ─────────────────────────────────────────────────────────────────────────
  const buildPrintHTML = async (pagesData, invoiceState, stylesStr, logoSrc) => {
    // Convert logo to data URL so popup can render it without CORS
    let logoDataUrl = logoSrc;
    try {
      const liveLogoEl = invoiceRef.current?.querySelector('img.lc-logo-img');
      if (liveLogoEl && liveLogoEl.complete && liveLogoEl.naturalWidth > 0) {
        const c = document.createElement('canvas');
        c.width = liveLogoEl.naturalWidth;
        c.height = liveLogoEl.naturalHeight;
        c.getContext('2d').drawImage(liveLogoEl, 0, 0);
        logoDataUrl = c.toDataURL('image/png');
      }
    } catch (_) {}

    const renderPage = (page) => {
      let lastDate = "";

      const rows = page.items.map((txn, index) => {
        const showDate = txn.date !== lastDate;
        if (showDate) lastDate = txn.date;
        const grey = index % 2 === 0 ? 'background:#e6e8e9;' : '';
        const debit = txn.debit ? formatCurrency(txn.debit) : '';
        const credit = txn.credit ? formatCurrency(txn.credit) : '';

        const detailCell = txn.client === 'Débiteurs'
          ? `<strong>Débiteurs</strong>`
          : `<div style="display:flex;justify-content:space-between;">
               <div style="width:48%">${txn.client || ''}</div>
               <div style="width:52%;padding-left:4px">${txn.desc || ''}</div>
             </div>`;

        return `<tr style="${grey}">
          <td style="font-weight:bold;padding:3px 2px;">${showDate ? txn.date : ''}</td>
          <td style="padding:3px 2px;vertical-align:top;line-height:1.25;">${detailCell}</td>
          <td style="padding:3px 2px;">${txn.pensio || ''}</td>
          <td style="padding:3px 2px;text-align:center;">${txn.room || ''}</td>
          <td style="padding:3px 2px;">${txn.voucher || ''}</td>
          <td style="padding:3px 2px;text-align:center;">${txn.qty || ''}</td>
          <td style="padding:3px 2px;text-align:right;">${debit}</td>
          <td style="padding:3px 2px;text-align:right;white-space:nowrap;">${credit}</td>
        </tr>`;
      }).join('');

      const tableHTML = page.items.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;margin-bottom:${page.isLastPage ? '15px' : '8px'};font-family:Arial,Helvetica,sans-serif;">
          <colgroup>
            <col style="width:11%"><col style="width:45%"><col style="width:8%">
            <col style="width:5%"><col style="width:9%"><col style="width:5%">
            <col style="width:9%"><col style="width:8%">
          </colgroup>
          <thead>
            <tr style="border-top:2px solid #a5a5a5;border-bottom:2px solid #a5a5a5;">
              <th style="padding:4px 2px;text-align:left;font-weight:normal;border-top:2px solid #a5a5a5;border-bottom:2px solid #a5a5a5;">Date</th>
              <th style="padding:4px 2px;text-align:left;font-weight:normal;border-top:2px solid #a5a5a5;border-bottom:2px solid #a5a5a5;">Detail</th>
              <th style="padding:4px 2px;text-align:left;font-weight:normal;border-top:2px solid #a5a5a5;border-bottom:2px solid #a5a5a5;">Pensio</th>
              <th style="padding:4px 2px;text-align:center;font-weight:normal;border-top:2px solid #a5a5a5;border-bottom:2px solid #a5a5a5;">Roo</th>
              <th style="padding:4px 2px;text-align:left;font-weight:normal;border-top:2px solid #a5a5a5;border-bottom:2px solid #a5a5a5;">Voucher</th>
              <th style="padding:4px 2px;text-align:center;font-weight:normal;border-top:2px solid #a5a5a5;border-bottom:2px solid #a5a5a5;">Qty</th>
              <th style="padding:4px 2px;text-align:right;font-weight:normal;border-top:2px solid #a5a5a5;border-bottom:2px solid #a5a5a5;">Debit</th>
              <th style="padding:4px 2px;text-align:right;font-weight:normal;border-top:2px solid #a5a5a5;border-bottom:2px solid #a5a5a5;">Credit</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>` : '';

      const totalsHTML = page.isLastPage ? `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:15px;">
          <div style="width:40%;border:1.5px solid #777;border-radius:10px;overflow:hidden;">
            <table style="width:100%;height:112px;border-collapse:collapse;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
              <thead>
                <tr>
                  <th style="padding:4px 10px 0 10px;font-weight:normal;border-bottom:1.5px solid #777;border-right:1.5px solid #777;text-align:left;">VAT rate</th>
                  <th style="padding:4px 10px 0 10px;font-weight:normal;border-bottom:1.5px solid #777;border-right:1.5px solid #777;text-align:right;">Base</th>
                  <th style="padding:4px 10px 0 10px;font-weight:normal;border-bottom:1.5px solid #777;text-align:right;">VAT</th>
                </tr>
              </thead>
              <tbody style="vertical-align:top;">
                <tr>
                  <td style="padding:4px 10px 0 10px;border-right:1.5px solid #777;">TVA 7.000%</td>
                  <td style="padding:4px 10px 0 10px;text-align:right;border-right:1.5px solid #777;">${invoiceState.totals.taxBase}</td>
                  <td style="padding:4px 10px 0 10px;text-align:right;">${invoiceState.totals.tva7}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="width:49%;padding:10px 14px;font-size:13.5px;display:flex;flex-direction:column;gap:10px;font-family:Arial,Helvetica,sans-serif;border-top:2px solid #a5a5a5;border-bottom:2px solid #a5a5a5;border-left:2px solid #a5a5a5;border-right:none;border-top-left-radius:12px;border-bottom-left-radius:12px;">
            <div style="display:flex;justify-content:space-between;"><span>Total VAT excluded</span><span>${invoiceState.totals.netAmount}</span></div>
            <div style="display:flex;justify-content:space-between;"><span>VAT</span><span>${invoiceState.totals.tva7}</span></div>
            <div style="display:flex;justify-content:space-between;"><span>Fiscal stamp</span><span>${invoiceState.totals.stampDuty}</span></div>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;width:100%;margin-top:10px;">
          <div style="display:flex;justify-content:flex-end;align-items:stretch;height:22px;gap:5px;">
            <div style="border:1px solid #999;box-shadow:4px 4px 0px #cfcfcf;width:160px;padding:3px 10px;display:flex;align-items:center;font-size:13px;font-family:Arial,Helvetica,sans-serif;">Invoice TOTAL</div>
            <div style="border:1px solid #999;box-shadow:4px 4px 0px #cfcfcf;width:170px;padding:3px 10px;text-align:right;font-weight:bold;font-size:14px;display:flex;align-items:center;justify-content:flex-end;font-family:Arial,Helvetica,sans-serif;">${invoiceState.totals.balance}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:right;">
          <div style="margin-top:20px;width:70%;">
            <div style="font-size:13px;margin-bottom:5px;font-family:Arial,Helvetica,sans-serif;">The total of this invoice is:</div>
            <div style="border-top:1px solid #000;margin-bottom:6px;"></div>
            <div style="font-size:15px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">${invoiceState.totals.balance}</div>
          </div>
        </div>` : '';

      const footerLineWidth = page.isLastPage ? '68%' : '100%';
      const footerDeptText = page.isLastPage
        ? 'FINANCE DEPARTMENT'
        : '<strong>FINANCE DEPARTMENT | SHAYMA</strong>';
      const footerBottom = page.isLastPage
        ? `<div style="font-size:11.5px;font-weight:bold;margin-top:15px;font-family:Arial,Helvetica,sans-serif;">Our invoices are in Tunisian Dinars (TND)</div>
           <div style="font-size:11.5px;font-weight:bold;margin-top:4px;font-family:Arial,Helvetica,sans-serif;">For any financial information, please contact us by phone or by email : controle2@corail-suites.com</div>`
        : `<div style="font-size:10px;margin-top:15px;padding-top:5px;border-top:1px solid #ccc;font-family:Arial,Helvetica,sans-serif;text-align:center;font-weight:bold;">Société Mehari Beach Immeuble Hannibal Les Berges du Lac Tunis | Tel +216 71 960 220 | Fax +216 71 960 231</div>`;

      return `
      <div style="background:#fff;width:210mm;height:297mm;padding:10mm 8mm;color:#000;position:relative;display:flex;flex-direction:column;box-sizing:border-box;page-break-after:always;break-after:page;">

        <div style="border-top:1px solid #959595;margin:4px 0 8px 0;"></div>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;">
          <div style="display:flex;">
            <img src="${logoDataUrl}" alt="LE CORAIL" style="width:165px;height:auto;object-fit:contain;" />
            <div style="font-size:13px;line-height:1.4;font-family:Arial,Helvetica,sans-serif;">
              <span style="font-weight:bold;font-size:14px;">LE CORAIL Suites Hôtel</span><br/>
              Rue de la feuille D'érable<br/>
              Cité les Pins<br/>
              Les Berges du Lac II<br/>
              MF : 083575TAE003
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;font-size:11.5px;">
            <div style="word-spacing:4px;font-size:13px;">${invoiceState.meta.date} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${invoiceState.meta.time} Page ${page.pageNo} of ${page.totalPages}</div>
            <table style="font-size:12px;text-align:left;border-spacing:0;position:absolute;top:70px;right:113px;">
              <tbody>
                <tr><td style="width:80px;">Téléphone:</td><td>+216 71 268 000</td></tr>
                <tr><td>Fax:</td><td>+216 71 268 444</td></tr>
                <tr><td>RIB:</td><td>BT LAC 2 : 05031000098300042891</td></tr>
                <tr><td>IBAN:</td><td>TN5905031000098300042891</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="border-top:1px solid #959595;margin:4px 0 8px 0;"></div>

        <div style="display:flex;justify-content:space-between;align-items:stretch;margin-bottom:8px;margin-top:8px;">
          <div style="width:49%;">
            <div style="display:flex;align-items:center;gap:15px;margin-bottom:3px;">
              <h1 style="font-size:22px;font-weight:bold;margin:0;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;">INVOICE</h1>
              <div style="border:1px solid #999;box-shadow:4px 4px 0px #cfcfcf;padding:3px 10px;font-size:17px;font-weight:bold;width:210px;font-family:Arial,Helvetica,sans-serif;">${invoiceState.meta.invoiceNo}</div>
            </div>
            <div style="display:grid;grid-template-columns:95px auto;font-size:11.5px;font-family:Arial,Helvetica,sans-serif;">
              <div style="grid-column:1/span 2;">
                <span style="display:inline-block;width:90px;"></span>
                <strong style="font-size:13px;">Date &nbsp; ${invoiceState.meta.date}</strong>
              </div>
              <div>Identifiant:</div><div><strong style="font-size:12px;">${invoiceState.guest.identifiant}</strong></div>
              <div>Room number:</div><div><strong style="font-size:12px;">${invoiceState.guest.room}</strong></div>
              <div>Stay:</div><div><strong style="font-size:12px;">${invoiceState.guest.arrival} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${invoiceState.guest.departure}</strong></div>
              <div>Client :</div><div><strong style="font-size:12px;">${invoiceState.guest.name}</strong></div>
            </div>
          </div>
          <div style="width:62%;padding-top:2px;">
            <div style="border-top:2px solid #a5a5a5;border-bottom:2px solid #a5a5a5;border-left:2px solid #a5a5a5;border-right:none;border-top-left-radius:12px;border-bottom-left-radius:12px;padding:3px 0 0 12px;height:100%;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <h3 style="font-size:15px;margin-bottom:6px;font-family:Arial,Helvetica,sans-serif;">${invoiceState.guest.companyName}</h3>
                ${invoiceState.guest.companyAddress1 ? `<p style="font-size:12.5px;margin-bottom:2px;font-family:Arial,Helvetica,sans-serif;">${invoiceState.guest.companyAddress1}</p>` : ''}
                ${invoiceState.guest.companyAddress2 ? `<p style="font-size:12.5px;margin-bottom:2px;font-family:Arial,Helvetica,sans-serif;">${invoiceState.guest.companyAddress2}</p>` : ''}
                ${invoiceState.guest.companyAddress3 ? `<p style="font-size:12.5px;margin-bottom:2px;font-family:Arial,Helvetica,sans-serif;">${invoiceState.guest.companyAddress3}</p>` : ''}
              </div>
              <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-top:10px;padding-right:12px;">
                <span>MF : ${invoiceState.guest.mf}</span>
                ${invoiceState.guest.tel ? `<span>Tel: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${invoiceState.guest.tel}</span>` : ''}
              </div>
            </div>
          </div>
        </div>

        <div style="border-top:1px solid #959595;margin:4px 0 8px 0;"></div>

        ${tableHTML}
        ${totalsHTML}

        <div style="margin-top:auto;width:100%;">
          <div style="margin-top:25px;margin-bottom:30px;width:100%;display:flex;justify-content:flex-start;flex-direction:column;">
            <div style="border-top:1px solid #777;width:${footerLineWidth};margin-bottom:6px;"></div>
            <div style="font-size:11.5px;font-family:Arial,Helvetica,sans-serif;">${footerDeptText}</div>
          </div>
          ${footerBottom}
        </div>

      </div>`;
    };

    const allPagesHTML = pagesData.map(renderPage).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Le_Corail_Invoice_${invoiceState.guest.room || 'Room'}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
  @page { size: A4 portrait; margin: 0; }
  html, body { background: #fff; width: 210mm; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #000; }
  body { display: flex; flex-direction: column; align-items: center; }
  div[style*="page-break-after:always"]:last-child { page-break-after: avoid !important; break-after: avoid !important; }
  h1, h2, h3, h4, h5, h6, p, span, td, th, div { font-family: Arial, Helvetica, sans-serif; }
</style>
</head>
<body>
${allPagesHTML}
<script>
  window.onload = function() {
    document.title = 'Le_Corail_Invoice_${invoiceState.guest.room || "Room"}';
    setTimeout(function() { window.print(); }, 500);
  };
  window.onafterprint = function() { window.close(); };
<\/script>
</body>
</html>`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // handleDownloadPDF — opens a tiny invisible popup with the invoice HTML,
  // auto-triggers the print dialog. Chrome defaults to "Save as PDF" with
  // the invoice filename pre-filled. User presses Enter → saved. Popup closes.
  // Quality = identical to Print button (same Skia renderer, full shadows).
  // No html2canvas, no jsPDF, no canvas artifacts.
  // ─────────────────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!invoice || !paginatedData.length) return;
    setPdfLoading(true);

    try {
      const html = await buildPrintHTML(paginatedData, invoice, styles, logo);

      // 1×1 popup — invisible, auto-prints, auto-closes
      const popup = window.open('', '_blank', 'width=1,height=1,left=-100,top=-100');
      if (!popup) {
        toast.error("Allow popups for this site, then try again");
        return;
      }

      popup.document.open();
      popup.document.write(html);
      popup.document.close();

      toast.success("Print dialog opening — press Enter to save PDF");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("PDF generation failed");
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  // ─────────────────────────────────────────────────────────────────────────
  // STYLES
  // ─────────────────────────────────────────────────────────────────────────
  const styles = `
    @page { size: A4 portrait; margin: 0; }

    .lc-page-container {
      background: #fff;
      width: 210mm;
      height: 297mm;
      padding: 10mm 8mm;
      box-shadow: 0 2px 12px rgba(0,0,0,0.13);
      color: #000;
      position: relative;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      box-sizing: border-box;
    }
    .lc-page-container:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    .wrapper{ display: flex; }

    .lc-invoice-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 0 0 40px 0;
      background: transparent;
    }

    .lc-invoice-wrapper * { box-sizing: border-box; }
    .lc-bold { font-weight: bold; }
    .lc-text-right { text-align: right; }
    .lc-text-center { text-align: center; }
    .lc-flex-between { display: flex; justify-content: space-between; }
    .lc-divider-thick { border-top: 1px solid #959595; margin: 4px 0 8px 0; }

    .lc-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
    .lc-header-left { display: flex; gap: 0px; }
    .lc-logo-img { width: 165px; height: auto; object-fit: contain; }
    .lc-hotel-address { font-size: 13px; line-height: 1.4; font-family: Arial, Helvetica, sans-serif; }
    .lc-header-right { display: flex; flex-direction: column; align-items: flex-end; font-size: 11.5px; }
    .lc-page-info { margin-bottom: 0px; word-spacing: 4px; font-size: 13px; }
    .lc-contact-table { font-size: 12px; text-align: left; border-spacing: 0; position: absolute; top: 70px; right: 113px;}
    .lc-contact-table td { padding-bottom: 0px; }
    .lc-contact-table td:first-child { width: 80px; }

    .lc-middle-section { display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 8px; margin-top: 8px; }
    .lc-invoice-left { width: 49%; }
    .lc-invoice-title-row { display: flex; align-items: center; gap: 15px; margin-bottom: 3px; }
    .lc-invoice-title-row h1 { font-size: 22px; font-weight: bold; margin: 0; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif; }
    .lc-shadow-input-box { border: 1px solid #999; box-shadow: 4px 4px 0px #cfcfcf; padding: 3px 10px; font-size: 17px; font-weight: bold; width: 210px; font-family: Arial, Helvetica, sans-serif; }
    .lc-invoice-meta-grid { display: grid; grid-template-columns: 95px auto; font-size: 11.5px; font-family: Arial, Helvetica, sans-serif; }

    .lc-client-right { width: 62%; padding-top: 2px; }
    .lc-open-right-box { border-top: 2px solid #a5a5a5; border-bottom: 2px solid #a5a5a5; border-left: 2px solid #a5a5a5; border-right: none; border-top-left-radius: 12px; border-bottom-left-radius: 12px; padding: 3px 0 0px 12px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
    .lc-open-right-box h3 { font-size: 15px; margin-bottom: 6px; font-family: Arial, Helvetica, sans-serif; }
    .lc-open-right-box p { font-size: 12.5px; margin-bottom: 2px; font-family: Arial, Helvetica, sans-serif; }

    .lc-data-table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; margin-bottom: 8px; font-family: Arial, Helvetica, sans-serif; }
    .lc-data-table thead th { border-top: 2px solid #a5a5a5; border-bottom: 2px solid #a5a5a5; padding: 4px 2px; text-align: left; font-weight: normal; }
    .lc-data-table tbody td { padding: 3px 2px; vertical-align: top; line-height: 1.25; }
    .lc-row-grey { background-color: #e6e8e9; }

    .lc-col-date { width: 11%; }
    .lc-col-detail { width: 45%; }
    .lc-col-pensio { width: 8%; }
    .lc-col-roo { width: 5%; text-align: center; }
    .lc-col-voucher { width: 9%; }
    .lc-col-qty { width: 5%; text-align: center; }
    .lc-col-debit { width: 9%; text-align: right; }
    .lc-col-credit { width: 8%; text-align: right; }

    .lc-detail-split { display: flex; justify-content: space-between; }
    .lc-detail-client { width: 48%; }
    .lc-detail-action { width: 52%; padding-left: 4px; }

    .lc-calc-section { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 15px; }
    .lc-vat-closed-box { width: 49%; border: 1.5px solid #777; border-radius: 10px; overflow: hidden; }
    .lc-vat-table { width: 100%; height: 112px; border-collapse: collapse; font-size: 12px; font-family: Arial, Helvetica, sans-serif; }
    .lc-vat-table th, .lc-vat-table td { padding: 4px 10px 0px 10px; }
    .lc-vat-table th { font-weight: normal; border-bottom: 1.5px solid #777; }
    .lc-vat-table th:not(:last-child), .lc-vat-table td:not(:last-child) { border-right: 1.5px solid #777; }

    .lc-totals-closed-box { width: 38%; padding: 10px 14px; font-size: 13.5px; display: flex; flex-direction: column; gap: 10px; font-family: Arial, Helvetica, sans-serif; border-top: 2px solid #a5a5a5; border-bottom: 2px solid #a5a5a5; border-left: 2px solid #a5a5a5; border-right: none; border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
    .lc-totals-row { display: flex; justify-content: space-between; }

    .lc-total-container-right { display: flex; flex-direction: column; align-items: flex-end; width: 49%; margin-top: 10px; }
    .lc-invoice-total-row { display: flex; justify-content: flex-end; align-items: stretch; width: 100%; height: 22px; gap: 5px; }
    .lc-total-label-box { border: 1px solid #999; width: 160px; padding: 3px 10px; display: flex; align-items: center; font-size: 13px; font-family: Arial, Helvetica, sans-serif; box-shadow: 4px 4px 0px #cfcfcf; }
    .lc-total-value-box { border: 1px solid #999; box-shadow: 4px 4px 0px #cfcfcf; width: 170px; padding: 3px 10px; text-align: right; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: flex-end; font-family: Arial, Helvetica, sans-serif; }

    .lc-bottom-statement { margin-top: 20px; width: 70%; }
    .lc-statement-text { font-size: 13px; margin-bottom: 5px; font-family: Arial, Helvetica, sans-serif; }
    .lc-statement-line { border-top: 1px solid #000; margin-bottom: 6px; }
    .lc-statement-amount { font-size: 15px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; }
    .wrapper { justify-content: right; }

    .lc-footer-sticky { margin-top: auto; width: 100%; }
    .lc-finance-dept-container { margin-top: 25px; margin-bottom: 30px; width: 100%; display: flex; justify-content: flex-start; flex-direction: column; }
    .lc-finance-line { border-top: 1px solid #777; width: 68%; margin-bottom: 6px; }
    .lc-footer-dept { font-size: 11.5px; font-family: Arial, Helvetica, sans-serif; }
    .lc-footer-tnd { font-size: 11.5px; font-weight: bold; margin-top: 15px; font-family: Arial, Helvetica, sans-serif; }
    .lc-footer-contact { font-size: 11.5px; font-weight: bold; margin-top: 4px; font-family: Arial, Helvetica, sans-serif; }
    .lc-footer-corporate { font-size: 10px; margin-top: 15px; padding-top: 5px; border-top: 1px solid #ccc; font-family: Arial, Helvetica, sans-serif; }

    @media print {
      html, body { margin: 0; padding: 0; }
      body * { visibility: hidden; }
      .lc-invoice-wrapper, .lc-invoice-wrapper * { visibility: visible; }
      .lc-invoice-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        padding: 0;
        gap: 0;
        width: 100%;
      }
      .lc-page-container {
        box-shadow: none !important;
        margin: 0 !important;
        height: 297mm !important;
        border: none !important;
        page-break-after: always;
        visibility: visible;
      }
      .lc-page-container:last-child { page-break-after: avoid; }
    }
  `;

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE HEADER
  // ─────────────────────────────────────────────────────────────────────────
  const PageHeader = ({ page }) => (
    <>
      <div className="lc-divider-thick"></div>
      <div className="lc-header-top">
        <div className="lc-header-left">
          <img src={logo} alt="LE CORAIL" className="lc-logo-img" />
          <div className="lc-hotel-address">
            <span className="lc-bold" style={{ fontSize: '14px' }}>LE CORAIL Suites Hôtel</span><br />
            Rue de la feuille D'érable<br />
            Cité les Pins<br />
            Les Berges du Lac II<br />
            MF : 083575TAE003
          </div>
        </div>
        <div className="lc-header-right">
          <div className="lc-page-info">
            {invoice.meta.date} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {invoice.meta.time} Page {page.pageNo} of {page.totalPages}
          </div>
          <table className="lc-contact-table">
            <tbody>
              <tr><td>Téléphone:</td><td>+216 71 268 000</td></tr>
              <tr><td>Fax:</td><td>+216 71 268 444</td></tr>
              <tr><td>RIB:</td><td>BT LAC 2 : 05031000098300042891</td></tr>
              <tr><td>IBAN:</td><td>TN5905031000098300042891</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="lc-divider-thick"></div>
      <div className="lc-middle-section">
        <div className="lc-invoice-left">
          <div className="lc-invoice-title-row">
            <h1>INVOICE</h1>
            <div className="lc-shadow-input-box">{invoice.meta.invoiceNo}</div>
          </div>
          <div className="lc-invoice-meta-grid">
            <div style={{ gridColumn: '1 / span 2' }}>
              <span style={{ display: 'inline-block', width: '90px' }}></span>
              <strong style={{ fontSize: '13px' }}>Date &nbsp; {invoice.meta.date}</strong>
            </div>
            <div>Identifiant:</div><div><strong style={{ fontSize: '12px' }}>{invoice.guest.identifiant}</strong></div>
            <div>Room number:</div><div><strong style={{ fontSize: '12px' }}>{invoice.guest.room}</strong></div>
            <div>Stay:</div><div><strong style={{ fontSize: '12px' }}>{invoice.guest.arrival} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {invoice.guest.departure}</strong></div>
            <div>Client :</div><div><strong style={{ fontSize: '12px' }}>{invoice.guest.name}</strong></div>
          </div>
        </div>
        <div className="lc-client-right">
          <div className="lc-open-right-box">
            <div>
              <h3>{invoice.guest.companyName}</h3>
              {invoice.guest.companyAddress1 && <p>{invoice.guest.companyAddress1}</p>}
              {invoice.guest.companyAddress2 && <p>{invoice.guest.companyAddress2}</p>}
              {invoice.guest.companyAddress3 && <p>{invoice.guest.companyAddress3}</p>}
            </div>
            <div className="lc-flex-between" style={{ fontSize: '12.5px', marginTop: '10px', paddingRight: '12px' }}>
              <span>MF : {invoice.guest.mf}</span>
              {invoice.guest.tel && <span>Tel: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {invoice.guest.tel}</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="lc-divider-thick"></div>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <InvoiceTemplate
      loading={loading}
      error={null}
      invoice={invoice}
      pdfLoading={pdfLoading}
      onDownloadPDF={handleDownloadPDF}
      onPrint={handlePrint}
      onBack={() => navigate("/invoices")}
    >
      <style data-lc-owned="1" dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="lc-invoice-wrapper" ref={invoiceRef}>
        {paginatedData.map((page, pageIdx) => {
          let lastRenderedDate = "";
          return (
            <React.Fragment key={pageIdx}>
              <div className="lc-page-container">
                <PageHeader page={page} />
                {page.items.length > 0 && (
                  <table className="lc-data-table" style={{ marginBottom: page.isLastPage ? '15px' : '8px' }}>
                    <thead>
                      <tr>
                        <th className="lc-col-date">Date</th>
                        <th className="lc-col-detail">Detail</th>
                        <th className="lc-col-pensio">Pensio</th>
                        <th className="lc-col-roo">Roo</th>
                        <th className="lc-col-voucher">Voucher</th>
                        <th className="lc-col-qty">Qty</th>
                        <th className="lc-col-debit">Debit</th>
                        <th className="lc-col-credit">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.items.map((txn, index) => {
                        const showDate = txn.date !== lastRenderedDate;
                        if (showDate) lastRenderedDate = txn.date;
                        const isGreyRow = index % 2 === 0;
                        return (
                          <tr key={index} className={isGreyRow ? "lc-row-grey" : ""}>
                            <td className="lc-bold">{showDate ? txn.date : ""}</td>
                            <td className={txn.client === "Débiteurs" ? "lc-bold" : ""}>
                              {txn.client === "Débiteurs" ? "Débiteurs" : (
                                <div className="lc-detail-split">
                                  <div className="lc-detail-client">{txn.client}</div>
                                  <div className="lc-detail-action">{txn.desc}</div>
                                </div>
                              )}
                            </td>
                            <td>{txn.pensio}</td>
                            <td className="lc-text-center">{txn.room}</td>
                            <td>{txn.voucher}</td>
                            <td className="lc-text-center">{txn.qty}</td>
                            <td className="lc-text-right">{txn.debit ? formatCurrency(txn.debit) : ""}</td>
                            <td className={`lc-text-right ${txn.client === "Débiteurs" ? "lc-bold" : ""}`} style={{ whiteSpace: 'nowrap' }}>
                              {txn.credit ? formatCurrency(txn.credit) : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {page.isLastPage && (
                  <>
                    <div className="lc-calc-section">
                      <div className="lc-vat-closed-box">
                        <table className="lc-vat-table">
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left", verticalAlign: "bottom", display: "flex" }}>VAT rate</th>
                              <th className="lc-text-right">Base</th>
                              <th className="lc-text-right">VAT</th>
                            </tr>
                          </thead>
                          <tbody style={{ verticalAlign: 'top' }}>
                            <tr>
                              <td>TVA 7.000%</td>
                              <td className="lc-text-right">{invoice.totals.taxBase}</td>
                              <td className="lc-text-right">{invoice.totals.tva7}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="lc-totals-closed-box">
                        <div className="lc-totals-row"><span>Total VAT excluded</span><span>{invoice.totals.netAmount}</span></div>
                        <div className="lc-totals-row"><span>VAT</span><span>{invoice.totals.tva7}</span></div>
                        <div className="lc-totals-row"><span>Fiscal stamp</span><span>{invoice.totals.stampDuty}</span></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                      <div className="lc-total-container-right">
                        <div className="lc-invoice-total-row">
                          <div className="lc-total-label-box">Invoice TOTAL</div>
                          <div className="lc-total-value-box">{invoice.totals.balance}</div>
                        </div>
                      </div>
                    </div>
                    <div className="wrapper">
                      <div className="lc-bottom-statement">
                        <div className="lc-statement-text">The total of this invoice is:</div>
                        <div className="lc-statement-line"></div>
                        <div className="lc-statement-amount">{invoice.totals.balance}</div>
                      </div>
                    </div>
                  </>
                )}

                <div className="lc-footer-sticky">
                  <div className="lc-finance-dept-container">
                    <div className="lc-finance-line" style={{ width: page.isLastPage ? '68%' : '100%' }}></div>
                    <div className={`lc-footer-dept ${!page.isLastPage ? "lc-bold" : ""}`}>
                      FINANCE DEPARTMENT {!page.isLastPage && "| SHAYMA"}
                    </div>
                  </div>
                  {page.isLastPage ? (
                    <>
                      <div className="lc-footer-tnd">Our invoices are in Tunisian Dinars (TND)</div>
                      <div className="lc-footer-contact">For any financial information, please contact us by phone or by email : controle2@corail-suites.com</div>
                    </>
                  ) : (
                    <div className="lc-footer-corporate lc-text-center lc-bold">
                      Société Mehari Beach Immeuble Hannibal Les Berges du Lac Tunis | Tel +216 71 960 220 | Fax +216 71 960 231
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </InvoiceTemplate>
  );
};

export default LeCorailInvoiceView;