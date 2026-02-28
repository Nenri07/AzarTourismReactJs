// import React from 'react';
// import logo from '../../../public/intercontinental-logo.png'
// // Dummy data simulating your future API response
// const dummyData = {
//   hotel: {
//     logo: "/intercontinental-logo.png", // Replace with actual asset path
//   },
//   guest: {
//     name: "Mr. ISMAEIL HURAMA",
//     ihgRewardsNo: "",
//     companyAgent: "Azar Tourism",
//     addressLine1: "Azar Tourism",
//     addressLine2: "Algeria Square Building Number 12 First Floor, Tripoli",
//     addressLine3: "1254 Tripoli Lebanon"
//   },
//   info: {
//     roomNumber: "1855",
//     arrivalDate: "06-01-26",
//     departureDate: "10-01-26",
//     cashier: "BAHGATP",
//     date: "10-01-26",
//     pageNo: "1 of 1",
//     invoiceNo: "1535687",
//     time: "10:10"
//   },
//   items: [
//     { id: 1, date: "06-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
//     { id: 2, date: "07-01-26", desc: "Laundry", subDesc: "", charges: "13,460.22", credits: "" },
//     { id: 3, date: "07-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
//     { id: 4, date: "08-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
//     { id: 5, date: "09-01-26", desc: "Laundry", subDesc: "", charges: "13,398.18", credits: "" },
//     { id: 6, date: "09-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
//   ],
//   totals: {
//     charges: "85,287.20",
//     credits: "85,287.20",
//     creditsUsd: "1,810.00 USD"
//   },
//   footer: {
//     vatRate: "10,234.46",
//     exchangeRate: "1 USD = 47.12 EGP."
//   }
// };

// const IntercontinentalInvoiceView = () => {
//   return (
//     <div style={{ backgroundColor: '#e6e6e6', padding: '20px', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
//       <style dangerouslySetInnerHTML={{__html: `
//         * {
//             box-sizing: border-box;
//             margin: 0;
//             padding: 0;
//         }

//         .page-container {
//             width: 210mm;
//             min-height: 297mm;
//             background-color: #fff;
//             padding: 40px 35px;
//             position: relative;
//             font-family: Arial, Helvetica, sans-serif;
//             font-size: 11px;
//             color: #000;
//         }

//         .logo-section {
//             text-align: center;
//             margin-bottom:15px;
//             display: flex;
//             justify-content: center;
//         }

//         .info-section {
//             display: flex;
//             justify-content: space-between;
//             margin-bottom: 15px;
//             line-height: 1.4;
//         }

//         .left-info {
//             width: 55%;
//         }

//         .right-info {
//             width: 40%;
//             position: relative;
//         }

//         .info-grid-left, .info-grid-right {
//             display: grid;
//             row-gap: 5px;
//         }

//         .info-grid-left {
//             grid-template-columns: 125px 1fr;
//         }

//         .info-grid-right {
//             grid-template-columns: 110px 1fr;
//         }

//         .label {
//             color: #000;
//         }

//         .info-grid-right .label {
//             text-align: right;
//             padding-right: 10px;
//         }

//         .value {
//             font-weight: bold;
//         }

//         .value.normal-weight {
//             font-weight: normal;
//         }

//         .floating-time {
//             position: absolute;
//             right: 15px;
//             top: 72px;
//             font-weight: bold;
//         }

//         .invoice-title {
//             font-weight: bold;
//             font-size: 11px;
//             margin-bottom: 5px;
//             margin-top: 25px;
//             padding-left: 20px;
//         }

//         table.invoice-table {
//             width: 100%;
//             border-collapse: collapse;
//             table-layout: fixed;
//         }

//         .invoice-table th, 
//         .invoice-table td {
//             vertical-align: top;
//             padding: 6px 5px;
//         }

//         .col-date { width: 14%; }
//         .col-desc { width: 56%; }
//         .col-charges { width: 15%; }
//         .col-credits { width: 15%; }

//         .border-right {
//             border-right: 1px solid #000 !important;
//         }

//         .border-top {
//             border-top: 1px solid #000 !important;
//         }

//         .border-bottom {
//             border-bottom: 1px solid #000 !important;
//         }

//         .invoice-table thead th {
//             border-top: 1px solid #000 !important;
//             border-bottom: 1px solid #000 !important;
//             font-weight: normal;
//             text-align: left;
//             padding: 8px 5px;
//         }

//         .desc-inner {
//             display: flex;
//             justify-content: space-between;
//             padding-right: 50px;
//         }

//         .total-row td {
//             font-weight: bold;
//             padding: 8px 5px;
//         }

//         .footer-spacer {
//             height: 30px;
//         }

//         .vat-exchange {
//             margin-top: 10px;
//             line-height: 1.5;
//             padding-left: 5px;
//         }

//         @media print {
//             body, div {
//                 background-color: transparent !important;
//             }
//             .page-container {
//                 box-shadow: none;
//                 margin: 0;
//                 padding: 0;
//                 width: 100%;
//             }
//         }
//       `}} />

//       <div className="page-container">
//         <div className="logo-section">
//           <img src={logo} alt="InterContinental Logo" />
//         </div>

//         <div className="info-section">
//           <div className="left-info">
//             <div className="info-grid-left">
//               <div className="label">Guest Name.</div>
//               <div className="value">{dummyData.guest.name}</div>

//               <div className="label">IHG® Rewards No.:</div>
//               <div className="value">{dummyData.guest.ihgRewardsNo}</div>

//               <div className="label">Address.</div>
//               <div className="value normal-weight" style={{ lineHeight: 1.2 }}>
//                 {dummyData.guest.addressLine1}<br />
//                 {dummyData.guest.addressLine2}<br />
//                 {dummyData.guest.addressLine3}
//               </div>
//             </div>

//             <div className="info-grid-left" style={{ marginTop: '15px' }}>
//               <div className="label">Company/Agent:</div>
//               <div className="value normal-weight">{dummyData.guest.companyAgent}</div>
//             </div>
//           </div>

//           <div className="right-info">
//             <div className="info-grid-right">
//               <div className="label">Room Number:</div>
//               <div className="value">{dummyData.info.roomNumber}</div>

//               <div className="label">Arriva Date:</div>
//               <div className="value normal-weight">{dummyData.info.arrivalDate}</div>

//               <div className="label">Departure Date:</div>
//               <div className="value normal-weight">{dummyData.info.departureDate}</div>

//               <div className="label">Cashier:</div>
//               <div className="value normal-weight">{dummyData.info.cashier}</div>

//               <div className="label">Date:</div>
//               <div className="value normal-weight">{dummyData.info.date}</div>

//               <div className="label">Page No.:</div>
//               <div className="value normal-weight">{dummyData.info.pageNo}</div>

//               <div className="label">Invoice No.:</div>
//               <div className="value normal-weight">{dummyData.info.invoiceNo}</div>
//             </div>
//             <div className="floating-time">{dummyData.info.time}</div>
//           </div>
//         </div>

//         <div className="invoice-title">INFORMATION INVOICE</div>

//         <table className="invoice-table">
//           <colgroup>
//             <col className="col-date" />
//             <col className="col-desc" />
//             <col className="col-charges" />
//             <col className="col-credits" />
//           </colgroup>

//           <thead>
//             <tr>
//               <th className="border-right" style={{ paddingLeft: '10px' }}>Date</th>
//               <th className="border-right" style={{ textAlign: 'center' }}>Descriptions</th>
//               <th className="border-right" style={{ textAlign: 'center' }}>Charges EGP.</th>
//               <th style={{ textAlign: 'center' }}>Credits EGP.</th>
//             </tr>
//           </thead>

//           <tbody style={{ lineHeight: 1.6 }}>
//             {dummyData.items.map((item) => (
//               <tr key={item.id}>
//                 <td className="border-right">{item.date}</td>
//                 <td className="border-right">
//                   {item.subDesc ? (
//                     <div className="desc-inner">
//                       <span>{item.desc}</span>
//                       <span>{item.subDesc}</span>
//                     </div>
//                   ) : (
//                     item.desc
//                   )}
//                 </td>
//                 <td className="border-right" style={{ textAlign: 'right' }}>{item.charges}</td>
//                 <td>{item.credits}</td>
//               </tr>
//             ))}
//             {/* Empty spacer row to push the footer down if needed */}
//             <tr>
//               <td className="border-right" style={{ height: '380px' }}></td>
//               <td className="border-right"></td>
//               <td className="border-right"></td>
//               <td></td>
//             </tr>
//           </tbody>

//           <tbody>
//             <tr className="total-row">
//               <td className="border-top border-bottom border-right">Total</td>
//               <td className="border-top border-bottom border-right"></td>
//               <td className="border-top border-bottom border-right" style={{ textAlign: 'right' }}>{dummyData.totals.charges}</td>
//               <td className="border-top border-bottom" style={{ textAlign: 'right' }}>
//                 {dummyData.totals.credits}
//                 <div style={{ marginTop: '10px' }}>{dummyData.totals.creditsUsd}</div>
//               </td>
//             </tr>
//           </tbody>

//           <tbody>
//             <tr>
//               <td colSpan="4" className="footer-spacer"></td>
//             </tr>
//             <tr>
//               <td rowSpan="3" className="border-top border-right" style={{ paddingTop: '10px' }}>Approved by</td>
//               <td className="border-top" style={{ height: '35px' }}></td>
//               <td colSpan="2" className="border-top"></td>
//             </tr>
//             <tr>
//               <td className="border-top border-bottom border-right" style={{ padding: '8px 5px' }}>Company / Travel Agency</td>
//               <td colSpan="2" className="border-top border-bottom" style={{ padding: '8px 5px' }}>Account Receivable No..</td>
//             </tr>
//             <tr>
//               <td style={{ paddingTop: '10px', textAlign: 'center' }}>Signature</td>
//               <td colSpan="2" style={{ paddingTop: '10px', paddingLeft: '5px' }}>Address</td>
//             </tr>
//           </tbody>
//         </table>

//         <div className="vat-exchange">
//           Vat Rate = {dummyData.footer.vatRate}<br />
//           Exchange Rate {dummyData.footer.exchangeRate}
//         </div>

//       </div>
//     </div>
//   );
// };

// export default IntercontinentalInvoiceView;




// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import html2pdf from 'html2pdf.js';
// import toast from 'react-hot-toast';
// import { InvoiceTemplate } from '../../components';
// import logo from '../../../public/intercontinental-logo.png';

// // ── Fallback dummy (dev only) ────────────────────────────────────────────────
// const dummyData = {
//   guest: {
//     name: "Mr. ISMAEIL HURAMA",
//     ihgRewardsNo: "",
//     companyAgent: "Azar Tourism",
//     addressLine1: "Azar Tourism",
//     addressLine2: "Algeria Square Building Number 12 First Floor, Tripoli",
//     addressLine3: "1254 Tripoli Lebanon"
//   },
//   info: {
//     roomNumber: "1855",
//     arrivalDate: "06-01-26",
//     departureDate: "10-01-26",
//     cashier: "BAHGATP",
//     date: "10-01-26",
//     pageNo: "1 of 1",
//     invoiceNo: "1535687",
//     time: "10:10"
//   },
//   items: [
//     { id: 1, date: "06-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
//     { id: 2, date: "07-01-26", desc: "Laundry", subDesc: "", charges: "13,460.22", credits: "" },
//     { id: 3, date: "07-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
//     { id: 4, date: "08-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
//     { id: 5, date: "09-01-26", desc: "Laundry", subDesc: "", charges: "13,398.18", credits: "" },
//     { id: 6, date: "09-01-26", desc: "Accommodation", subDesc: "310.00 USD * 47.12", charges: "14,607.20", credits: "" },
//   ],
//   totals: {
//     charges: "85,287.20",
//     credits: "85,287.20",
//     creditsUsd: "1,810.00 USD"
//   },
//   footer: {
//     vatRate: "10,234.46",
//     exchangeRate: "1 USD = 47.12 EGP."
//   }
// };

// // ── Helpers ──────────────────────────────────────────────────────────────────
// const formatDate = (dateString) => {
//   if (!dateString) return "";
//   try {
//     const d = new Date(dateString);
//     if (isNaN(d.getTime())) return dateString;
//     const dd = String(d.getDate()).padStart(2, '0');
//     const mm = String(d.getMonth() + 1).padStart(2, '0');
//     const yy = String(d.getFullYear()).slice(-2);
//     return `${dd}-${mm}-${yy}`;
//   } catch { return dateString; }
// };

// const formatCurrency = (val) => {
//   if (val === undefined || val === null || val === "") return "";
//   return parseFloat(val).toLocaleString('en-US', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2
//   });
// };

// // ── Transform flat API response → component shape ────────────────────────────
// const transformApiData = (raw) => {
//   if (!raw) return null;

//   // Build address lines from the single address string
//   const addressParts = raw.address ? raw.address.split(',') : [];
//   const addressLine1 = raw.companyName || "";
//   const addressLine2 = addressParts[0]?.trim() || "";
//   const addressLine3 = addressParts.slice(1).join(',').trim();

//   // Build items from accommodationDetails + otherServices (same logic as Radisson)
//   const items = [];
//   let idCounter = 0;

//   if (Array.isArray(raw.accommodationDetails)) {
//     raw.accommodationDetails.forEach((acc) => {
//       const date = formatDate(acc.date);
//       const rawD = new Date(acc.date).getTime() || 0;
//       const usdPart = raw.exchangeRate
//         ? `${formatCurrency(raw.usdAmount / (raw.nights || 1))} USD * ${raw.exchangeRate}`
//         : "";

//       items.push({ id: ++idCounter, date, rawDate: rawD, desc: "Accommodation", subDesc: usdPart, charges: formatCurrency(acc.baseRate), credits: "", type: 1 });
//       items.push({ id: ++idCounter, date, rawDate: rawD, desc: "12% Service Charge", subDesc: "", charges: formatCurrency(acc.serviceCharge), credits: "", type: 2 });
//       items.push({ id: ++idCounter, date, rawDate: rawD, desc: "14% VAT", subDesc: "", charges: formatCurrency(acc.vat), credits: "", type: 3 });
//       items.push({ id: ++idCounter, date, rawDate: rawD, desc: "1% City Tax", subDesc: "", charges: formatCurrency(acc.cityTax), credits: "", type: 4 });
//     });
//   }

//   if (Array.isArray(raw.otherServices)) {
//     raw.otherServices.forEach((svc) => {
//       const date = formatDate(svc.date);
//       const rawD = new Date(svc.date).getTime() || 0;
//       items.push({ id: ++idCounter, date, rawDate: rawD, desc: svc.name || "Service", subDesc: "", charges: formatCurrency(svc.amount), credits: "", type: 5 });
//     });
//   }

//   // Sort by date then type (same as Radisson)
//   items.sort((a, b) => a.rawDate - b.rawDate || a.type - b.type);

//   const grandTotal = formatCurrency(raw.grandTotalEgp);

//   return {
//     guest: {
//       name: raw.guestName || "",
//       ihgRewardsNo: raw.ihgRewardsNumber || "",
//       companyAgent: raw.companyName || "",
//       addressLine1,
//       addressLine2,
//       addressLine3,
//     },
//     info: {
//       roomNumber: raw.roomNo || "",
//       arrivalDate: formatDate(raw.arrivalDate),
//       departureDate: formatDate(raw.departureDate),
//       cashier: raw.cashierId || raw.userId || "",
//       date: formatDate(raw.invoiceDate),
//       invoiceNo: raw.invoiceNo || "",
//       time: raw.invoiceTime || "",
//     },
//     items,
//     totals: {
//       charges: grandTotal,
//       credits: grandTotal,
//       creditsUsd: raw.balanceUsd ? `${formatCurrency(raw.balanceUsd)} USD` : "",
//     },
//     footer: {
//       vatRate: formatCurrency(raw.vat14Percent),
//       exchangeRate: raw.exchangeRate ? `1 USD = ${raw.exchangeRate} EGP.` : "",
//     }
//   };
// };

// // ── Pagination constants ─────────────────────────────────────────────────────
// const ROWS_PER_FIRST_PAGE = 18;
// const ROWS_PER_MIDDLE_PAGE = 28;
// const ROWS_PER_LAST_PAGE = 18;

// // ── Component ────────────────────────────────────────────────────────────────
// const IntercontinentalInvoiceView = ({ invoiceData }) => {
//   const navigate = useNavigate();
//   const invoiceRef = useRef(null);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [pages, setPages] = useState([]);
//   const [invoice, setInvoice] = useState(null);

//   // Transform API data or fall back to dummy
//   useEffect(() => {
//     if (invoiceData) {
//       const transformed = transformApiData(invoiceData);
//       setInvoice(transformed);
//     } else {
//       setInvoice(dummyData);
//     }
//   }, [invoiceData]);

//   // Build page slices whenever invoice changes
//   useEffect(() => {
//     if (!invoice) return;

//     const items = invoice.items || [];
//     const result = [];

//     if (items.length === 0) {
//       result.push({ items: [], pageNo: 1, totalPages: 1, isFirst: true, isLast: true });
//     } else {
//       let remaining = [...items];
//       let pageNo = 0;

//       while (remaining.length > 0) {
//         pageNo++;
//         const isFirst = pageNo === 1;
//         const limit = isFirst ? ROWS_PER_FIRST_PAGE : ROWS_PER_MIDDLE_PAGE;
//         const chunk = remaining.splice(0, limit);
//         result.push({ items: chunk, pageNo, isFirst, isLast: false });
//       }

//       // Ensure last page has room for totals/footer
//       const lastPage = result[result.length - 1];
//       if (lastPage.items.length > ROWS_PER_LAST_PAGE) {
//         const overflow = lastPage.items.splice(ROWS_PER_LAST_PAGE);
//         result.push({ items: overflow, pageNo: result.length + 1, isFirst: false, isLast: false });
//       }

//       result[result.length - 1].isLast = true;
//       result.forEach((p, i) => {
//         p.pageNo = i + 1;
//         p.totalPages = result.length;
//       });
//     }

//     setPages(result);
//   }, [invoice]);

//   // ── PDF ────────────────────────────────────────────────────────────────────
//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//     headStyles.forEach(s => s.parentNode && s.parentNode.removeChild(s));

//     try {
//       const images = invoiceRef.current.querySelectorAll('img');
//       await Promise.all(Array.from(images).map(img => {
//         if (img.complete) return Promise.resolve();
//         return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
//       }));

//       await new Promise(resolve => setTimeout(resolve, 500));

//       const opt = {
//         margin: 0,
//         filename: `${invoice?.info?.invoiceNo || 'intercontinental-invoice'}.pdf`,
//         image: { type: 'jpeg', quality: 0.92 },
//         html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, windowWidth: 794 },
//         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['css'] }
//       };

//       await html2pdf().set(opt).from(invoiceRef.current).save();
//       toast.success("PDF Downloaded Successfully");
//     } catch (err) {
//       console.error("PDF Error:", err);
//       toast.error("Failed to generate PDF");
//     } finally {
//       headStyles.forEach(s => document.head.appendChild(s));
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   if (!invoice) return null;

//   // ── Render ─────────────────────────────────────────────────────────────────
//   return (
//     <InvoiceTemplate
//       loading={false}
//       error={null}
//       invoice={{ referenceNo: invoice.info?.invoiceNo }}
//       pdfLoading={pdfLoading}
//       onDownloadPDF={handleDownloadPDF}
//       onPrint={handlePrint}
//       onBack={() => navigate("/invoices")}
//     >
//       <style dangerouslySetInnerHTML={{
//         __html: `
//         .ic-wrapper {
//             width: 100%;
//             display: flex;
//             flex-direction: column;
//             align-items: center;
//             background-color: #e6e6e6;
//             box-sizing: border-box;
//             gap: 0;
//         }
//         .ic-page {
//             width: 794px;
//             height: 1122px;
//             background: #fff;
//             padding: 28px 17px 20px 17px;
//             box-sizing: border-box;
//             font-family: Arial, Helvetica, sans-serif;
//             font-size: 11px;
//             color: #000;
//             overflow: hidden;
//             position: relative;
//             display: flex;
//             flex-direction: column;
//         }
//         .ic-logo-section {
//             display: flex;
//             justify-content: center;
//             margin-bottom: 10px;
//         }
//         .ic-logo-section img {
//             max-height: 85px;
//             width: auto;
//         }
//         .ic-info-section {
//             display: flex;
//             justify-content: space-between;
//             margin-bottom: 10px;
//             line-height: 1.4;
//             flex-shrink: 0;
//         }
//         .ic-left-info  { width: 55%; }
//         .ic-right-info { width: 50%; position: relative; }
//         .ic-grid-left, .ic-grid-right { display: grid; row-gap: 6px; }
//         .ic-grid-left  { grid-template-columns: 125px 1fr; }
//         .ic-grid-right { grid-template-columns: 110px 1fr; }
//         .ic-label { color: #000; }
//         .ic-grid-right .ic-label { text-align: right; padding-right: 10px; }
//         .ic-value           { font-weight: bold; }
//         .ic-value.ic-normal { font-weight: normal; }
//         .ic-floating-time {
//             position: absolute;
//             right: 80px;
//             top: 85px;
            
//         }
//         .ic-invoice-title {
//             font-weight: bold;
//             margin-bottom: 4px;
           
//             padding-left: 20px;
//             flex-shrink: 0;
//         }
//         .ic-table-wrapper {
//             flex: 1;
//             display: flex;
//             flex-direction: column;
//             overflow: hidden;
//         }
//         table.ic-table {
//             width: 100%;
//             border-collapse: collapse;
//             table-layout: fixed;
//             height: 100%;
//         }
//         .ic-table th, .ic-table td {
//             vertical-align: top;
//             padding: 5px 5px;
//             box-sizing: border-box;
//         }
//             .ic-nb{
//             border-right: none !important;
//             }
//         .ic-col-date    { width: 14%; }
//         .ic-col-desc    { width: 56%; }
//         .ic-col-charges { width: 15%; }
//         .ic-col-credits { width: 15%; }
//         .ic-br { border-right:  1px solid #000 !important; }
//         .ic-bt { border-top:    1px solid #000 !important; }
//         .ic-bb { border-bottom: 1px solid #000 !important; }
//         .ic-table thead th {
//             border-top: 1px solid #000 !important;
//             border-bottom: 1px solid #000 !important;
//             border-right:none !important;
//             font-weight: normal;
//             text-align: left;
//             padding: 7px 5px;
//         }
//             .ic-rr{
//             border-right:1px solid #000 !important;
//             }
//         .ic-desc-inner {
//             display: flex;
//             justify-content: space-between;
//             padding-right: 120px;
//         }
//         .ic-spacer td          {  }
//         .ic-spacer td:last-child { border-right: none; }
//         .ic-total-row td { font-weight: bold; padding: 7px 5px; }
//         .ic-vat-exchange {
//             line-height: 1.5;
//             padding-left: 5px;
//             flex-shrink: 0;
//         }
//             .ic-btt{
//             border-bottom:1px solid #000 !important;
//             }
//         @page { size: A4 portrait; margin: 0; }
//         @media print {
//             body, html { margin: 0 !important; padding: 0 !important; background: #fff !important; }
//             button, nav, header, footer, .no-print { display: none !important; }
//             .ic-wrapper { padding: 0 !important; gap: 0 !important; background: none !important; }
//             .ic-page {
//                 margin-bottom: 0 !important;
//                 width: 210mm !important;
//                 height: 297mm !important;
//                 padding: 8mm 12mm 6mm 12mm !important;
//                 page-break-after: always;
//                 overflow: hidden !important;
//             }
//             .ic-page:last-child { page-break-after: avoid; }
//         }
//       `}} />

//       <div className="ic-wrapper" ref={invoiceRef}>
//         {pages.map((page) => (
//           <div className="ic-page" key={page.pageNo}>

//             <div className="ic-logo-section">
//               <img src={logo} alt="InterContinental Logo" />
//             </div>

//             <div className="ic-info-section">
//               <div className="ic-left-info">
//                 <div className="ic-grid-left">
//                   <div className="ic-label">Guest Name.</div>
//                   <div className="ic-value">{invoice.guest.name}</div>

//                   <div className="ic-label">IHG® Rewards No.:</div>
//                   <div className="ic-value">{invoice.guest.ihgRewardsNo}</div>

//                   <div className="ic-label">Address.</div>
//                   <div className="ic-value ic-normal" style={{ lineHeight: 1.2 }}>
//                     {invoice.guest.addressLine1}<br />
//                     {invoice.guest.addressLine2}<br />
//                     {invoice.guest.addressLine3}
//                   </div>
//                 </div>
//                 <div className="ic-grid-left" style={{ marginTop: '10px' }}>
//                   <div className="ic-label">Company/Agent:</div>
//                   <div className="ic-value ic-normal">{invoice.guest.companyAgent}</div>
//                 </div>
//               </div>

//               <div className="ic-right-info">
//                 <div className="ic-grid-right">
//                   <div className="ic-label">Room Number:</div>
//                   <div className="ic-value">{invoice.info.roomNumber}</div>

//                   <div className="ic-label">Arriva Date:</div>
//                   <div className="ic-value ic-normal">{invoice.info.arrivalDate}</div>

//                   <div className="ic-label">Departure Date:</div>
//                   <div className="ic-value ic-normal">{invoice.info.departureDate}</div>

//                   <div className="ic-label">Cashier:</div>
//                   <div className="ic-value ic-normal">{invoice.info.cashier}</div>

//                   <div className="ic-label">Date:</div>
//                   <div className="ic-value ic-normal">{invoice.info.date}</div>

//                   <div className="ic-label">Page No.:</div>
//                   <div className="ic-value ic-normal">{page.pageNo} of {page.totalPages}</div>

//                   <div className="ic-label">Invoice No.:</div>
//                   <div className="ic-value ic-normal">{invoice.info.invoiceNo}</div>
//                 </div>
//                 <div className="ic-floating-time"> Time {invoice.info.time}</div>
//               </div>
//             </div>

//             <div className="ic-invoice-title">INFORMATION INVOICE</div>

//             <div className="ic-table-wrapper">
//               <table className="ic-table">
//                 <colgroup>
//                   <col className="ic-col-date" />
//                   <col className="ic-col-desc" />
//                   <col className="ic-col-charges" />
//                   <col className="ic-col-credits" />
//                 </colgroup>
//                 <thead>
//                   <tr>
//                     <th className="ic-br ic-nb" style={{ paddingLeft: '10px' }}>Date</th>
//                     <th className="ic-br ic-nb" style={{ textAlign: 'center'}}>Descriptions</th>
//                     <th className="ic-br ic-nb" style={{ textAlign: 'center'}}>Charges EGP.</th>
//                     <th  className=" ic-nb"style={{ textAlign: 'center'  }}>Credits EGP.</th>
//                   </tr>
//                 </thead>

//                 <tbody style={{ lineHeight: 1.5 }}>
//                   {page.items.map(item => (
//                     <tr key={item.id}>
//                       <td className="ic-br">{item.date}</td>
//                       <td className="ic-br">
//                         {item.subDesc ? (
//                           <div className="ic-desc-inner">
//                             <span>{item.desc}</span>
//                             <span>{item.subDesc}</span>
//                           </div>
//                         ) : item.desc}
//                       </td>
//                       <td className="ic-br" style={{ textAlign: 'right', paddingRight: '20px' }}>{item.charges}</td>
//                       <td>{item.credits}</td>
//                     </tr>
//                   ))}

//                   {/* Spacer fills remaining space */}
//                   <tr className="ic-spacer" style={{ height: '100%' }}>
//                     <td className="ic-br"></td>
//                     <td className="ic-br"></td>
//                     <td className="ic-br"></td>
//                     <td></td>
//                   </tr>

//                   {/* Totals + signature + VAT — last page only */}
//                   {page.isLast && (
//                     <>
//                       <tr className="ic-total-row">
//                         <td className="ic-bt ic-bb ic-br" style={{ textAlign: 'center', alignContent: 'center' }}>Total</td>
//                         <td className="ic-bt ic-bb ic-br"></td>
//                         <td className="ic-bt ic-bb ic-br" style={{ textAlign: 'right', paddingRight: '20px' }}>
//                           {invoice.totals.charges}
//                         </td>
//                         <td className="ic-bt ic-bb" style={{ textAlign: 'right', paddingRight: '23px' }}>
//                           {invoice.totals.credits}
//                           <div style={{ marginTop: '6px' }}>{invoice.totals.creditsUsd}</div>
//                         </td>
//                       </tr>
//                       <tr><td colSpan="4" style={{ height: '14px' }}></td></tr>
//                       <tr>
//                         <td rowSpan="2" className="ic-bt ic-br ic-bb" style={{ paddingTop: '8px' }}>Approved by</td>
//                         <td className="ic-bt " style={{ height: '28px' }}></td>
//                         <td colSpan="2" className="ic-bt "></td>
//                       </tr>
//                       <tr>
//                         <td className="ic-bt ic-bb ic-br" style={{ padding: '6px 5px', borderRight: 'none' }}>Company / Travel Agency</td>
//                         <td colSpan="2" className="ic-bt ic-bb" style={{ padding: '6px 5px' }}>Account Receivable No..</td>
//                       </tr>
//                       <tr className='ic-btt'>
//                         <tr colSpan="2" rowSpan="2" style={{ height: '14px' }}>
//                           {page.isLast && (
//                             <div className="ic-vat-exchange ic-rr" style={{ width: "345%" }}>
//                               Vat Rate = {invoice.footer.vatRate}<br />
//                               Exchange Rate {invoice.footer.exchangeRate}
//                             </div>
//                           )}

//                         </tr>
//                         <td style={{ textAlign: 'center',paddingLeft:'190px' }}>Signature</td>
//                         <td colSpan="2" style={{  paddingLeft: '5px' }}>Address</td>
//                       </tr>
//                     </>
//                   )}
//                 </tbody>
//               </table>
//             </div>


//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default IntercontinentalInvoiceView;





import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';
import { InvoiceTemplate } from '../../components';
import cairoInvoiceApi from '../../Api/cairoInvoice.api';
import logo from '../../../public/intercontinental-logo.png';

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
  } catch { return dateString; }
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || val === "") return "";
  return parseFloat(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// ── Transform flat API response → component shape ────────────────────────────
const transformApiData = (raw) => {
  if (!raw) return null;

  const addressParts = raw.address ? raw.address.split(',') : [];
  const addressLine1 = raw.companyName || "";
  const addressLine2 = addressParts[0]?.trim() || "";
  const addressLine3 = addressParts.slice(1).join(',').trim();

  const allItems = [];
  let idCounter = 0;

  if (Array.isArray(raw.accommodationDetails)) {
    raw.accommodationDetails.forEach((acc) => {
      const date = formatDate(acc.date);
      const rawD = new Date(acc.date).getTime() || 0;

      // subDesc: "310.00 USD * 47.12" — build from acc.rate if present,
      // otherwise reconstruct from usdAmount × exchangeRate
      const subDesc = acc.rate
        ? acc.rate                          // e.g. "55.00 USD * 70.444" from buildRow
        : (raw.usdAmount && raw.exchangeRate
            ? `${formatCurrency(raw.usdAmount)} USD * ${raw.exchangeRate}`
            : "");

      // chargesEgp carries the EGP nightly amount for InterContinental
      const chargeAmount = acc.chargesEgp ?? acc.rate ?? acc.baseRate ?? 0;

      allItems.push({
        id:       ++idCounter,
        date,
        rawDate:  rawD,
        sortOrder: 0,
        desc:     acc.description || "Accommodation",
        subDesc,
        charges:  formatCurrency(chargeAmount),
        credits:  "",
      });
    });
  }

  if (Array.isArray(raw.otherServices)) {
    raw.otherServices.forEach((svc) => {
      const date = formatDate(svc.date);
      const rawD = new Date(svc.date).getTime() || 0;
      allItems.push({
        id:        ++idCounter,
        date,
        rawDate:   rawD,
        sortOrder: 1,           // services after accommodation on same day
        desc:      svc.name || "Service",
        subDesc:   "",
        charges:   formatCurrency(svc.amount),
        credits:   "",
      });
    });
  }

  // Sort by date, then accommodation before services on same day
  allItems.sort((a, b) =>
    a.rawDate - b.rawDate || a.sortOrder - b.sortOrder
  );

  // Strip internal sort keys
  const items = allItems.map(({ rawDate, sortOrder, ...item }) => item);

  const grandTotal = formatCurrency(raw.grandTotalEgp);

  return {
    guest: {
      name:         (raw.guestName || "").toUpperCase(),
      ihgRewardsNo: raw.ihgRewardsNumber || "",
      companyAgent: raw.companyName || "",
      addressLine1,
      addressLine2,
      addressLine3,
    },
    info: {
      roomNumber:    raw.roomNo       || "",
      arrivalDate:   formatDate(raw.arrivalDate),
      departureDate: formatDate(raw.departureDate),
      cashier:       raw.cashierId    || raw.userId || "",
      date:          formatDate(raw.invoiceDate),
      invoiceNo:     raw.invoiceNo    || "",
      time:          raw.invoiceTime  || "",
    },
    items,
    totals: {
      charges:    grandTotal,
      credits:    grandTotal,
      creditsUsd: raw.balanceUsd
        ? `${formatCurrency(raw.balanceUsd)} USD`
        : "",
    },
    footer: {
      vatRate:      formatCurrency(raw.vat14Percent),
      exchangeRate: raw.exchangeRate
        ? `1 USD = ${raw.exchangeRate} EGP.`
        : "",
    },
  };
};

// ── Pagination constants ─────────────────────────────────────────────────────
const ROWS_PER_FIRST_PAGE  = 18;
const ROWS_PER_MIDDLE_PAGE = 28;
const ROWS_PER_LAST_PAGE   = 18;

// ── Component ────────────────────────────────────────────────────────────────
const IntercontinentalInvoiceView = ({ invoiceData }) => {
  const navigate          = useNavigate();
  const { invoiceId }     = useParams();
  const location          = useLocation();
  const invoiceRef        = useRef(null);

  const [invoice,    setInvoice]    = useState(null);
  const [loading,    setLoading]    = useState(!invoiceData);
  const [error,      setError]      = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pages,      setPages]      = useState([]);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (invoiceData) {
      setInvoice(transformApiData(invoiceData));
      setLoading(false);
    } else if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceData, invoiceId]);

  // ── Auto-download when route is /download-pdf ──────────────────────────────
  useEffect(() => {
    if (isPdfDownload && invoice && invoiceRef.current) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await cairoInvoiceApi.getInvoiceById(invoiceId);

      // Unwrap nested data — same pattern as Radisson / Hilton
      let rawData = response.data || response;
      if (rawData.data) {
        rawData = rawData.data;
        if (rawData.data) rawData = rawData.data;
      }

      setInvoice(transformApiData(rawData));
    } catch (err) {
      console.error("❌ Error fetching InterContinental invoice:", err);
      setError(err.message || "Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  // ── Build page slices whenever invoice changes ─────────────────────────────
  useEffect(() => {
    if (!invoice) return;

    const items  = invoice.items || [];
    const result = [];

    if (items.length === 0) {
      result.push({ items: [], pageNo: 1, totalPages: 1, isFirst: true, isLast: true });
    } else {
      let remaining = [...items];
      let pageNo    = 0;

      while (remaining.length > 0) {
        pageNo++;
        const isFirst = pageNo === 1;
        const limit   = isFirst ? ROWS_PER_FIRST_PAGE : ROWS_PER_MIDDLE_PAGE;
        const chunk   = remaining.splice(0, limit);
        result.push({ items: chunk, pageNo, isFirst, isLast: false });
      }

      // Ensure last page has room for totals / footer
      const lastPage = result[result.length - 1];
      if (lastPage.items.length > ROWS_PER_LAST_PAGE) {
        const overflow = lastPage.items.splice(ROWS_PER_LAST_PAGE);
        result.push({ items: overflow, pageNo: result.length + 1, isFirst: false, isLast: false });
      }

      result[result.length - 1].isLast = true;
      result.forEach((p, i) => {
        p.pageNo     = i + 1;
        p.totalPages = result.length;
      });
    }

    setPages(result);
  }, [invoice]);

  // ── PDF ────────────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(s => s.parentNode && s.parentNode.removeChild(s));

    try {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin: 0,
        filename: `${invoice?.info?.invoiceNo || 'intercontinental-invoice'}.pdf`,
        image:    { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, windowWidth: 794 },
        jsPDF:    { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css'] },
      };

      await html2pdf().set(opt).from(invoiceRef.current).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      headStyles.forEach(s => document.head.appendChild(s));
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!invoice) {
    return (
      <InvoiceTemplate
        loading={loading}
        error={error}
        invoice={null}
        onBack={() => navigate("/invoices")}
      >
        <></>
      </InvoiceTemplate>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <InvoiceTemplate
      loading={loading}
      error={error}
      invoice={{ referenceNo: invoice.info?.invoiceNo }}
      pdfLoading={pdfLoading}
      onDownloadPDF={handleDownloadPDF}
      onPrint={handlePrint}
      onBack={() => navigate("/invoices")}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        .ic-wrapper {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: #e6e6e6;
            box-sizing: border-box;
            gap: 0;
        }
        .ic-page {
            width: 794px;
            height: 1122px;
            background: #fff;
            padding: 28px 17px 20px 17px;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #000;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        .ic-logo-section {
            display: flex;
            justify-content: center;
            margin-bottom: 10px;
        }
        .ic-logo-section img {
            max-height: 85px;
            width: auto;
        }
        .ic-info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            line-height: 1.4;
            flex-shrink: 0;
        }
        .ic-left-info  { width: 55%; }
        .ic-right-info { width: 50%; position: relative; }
        .ic-grid-left, .ic-grid-right { display: grid; row-gap: 6px; }
        .ic-grid-left  { grid-template-columns: 125px 1fr; }
        .ic-grid-right { grid-template-columns: 110px 1fr; }
        .ic-label { color: #000; }
        .ic-grid-right .ic-label { text-align: right; padding-right: 10px; }
        .ic-value           { font-weight: bold; }
        .ic-value.ic-normal { font-weight: normal; }
        .ic-floating-time {
            position: absolute;
            right: 80px;
            top: 85px;
        }
        .ic-invoice-title {
            font-weight: bold;
            margin-bottom: 4px;
            padding-left: 20px;
            flex-shrink: 0;
        }
        .ic-table-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        table.ic-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            height: 100%;
        }
        .ic-table th, .ic-table td {
            vertical-align: top;
            padding: 5px 5px;
            box-sizing: border-box;
        }
            .ic-nb{
            border-right: none !important;
            }
        .ic-col-date    { width: 14%; }
        .ic-col-desc    { width: 56%; }
        .ic-col-charges { width: 15%; }
        .ic-col-credits { width: 15%; }
        .ic-br { border-right:  1px solid #000 !important; }
        .ic-bt { border-top:    1px solid #000 !important; }
        .ic-bb { border-bottom: 1px solid #000 !important; }
        .ic-table thead th {
            border-top: 1px solid #000 !important;
            border-bottom: 1px solid #000 !important;
            border-right:none !important;
            font-weight: normal;
            text-align: left;
            padding: 7px 5px;
        }
            .ic-rr{
            border-right:1px solid #000 !important;
            }
        .ic-desc-inner {
            display: flex;
            justify-content: space-between;
            padding-right: 120px;
        }
        .ic-spacer td          {  }
        .ic-spacer td:last-child { border-right: none; }
        .ic-total-row td { font-weight: bold; padding: 7px 5px; }
        .ic-vat-exchange {
            line-height: 1.5;
            padding-left: 5px;
            flex-shrink: 0;
        }
            .ic-btt{
            border-bottom:1px solid #000 !important;
            }
        @page { size: A4 portrait; margin: 0; }
        @media print {
            body, html { margin: 0 !important; padding: 0 !important; background: #fff !important; }
            button, nav, header, footer, .no-print { display: none !important; }
            .ic-wrapper { padding: 0 !important; gap: 0 !important; background: none !important; }
            .ic-page {
                margin-bottom: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                padding: 8mm 12mm 6mm 12mm !important;
                page-break-after: always;
                overflow: hidden !important;
            }
            .ic-page:last-child { page-break-after: avoid; }
        }
      `}} />

      <div className="ic-wrapper" ref={invoiceRef}>
        {pages.map((page) => (
          <div className="ic-page" key={page.pageNo}>

            <div className="ic-logo-section">
              <img src={logo} alt="InterContinental Logo" />
            </div>

            <div className="ic-info-section">
              <div className="ic-left-info">
                <div className="ic-grid-left">
                  <div className="ic-label">Guest Name.</div>
                  <div className="ic-value">{invoice.guest.name}</div>

                  <div className="ic-label">IHG® Rewards No.:</div>
                  <div className="ic-value">{invoice.guest.ihgRewardsNo}</div>

                  <div className="ic-label">Address.</div>
                  <div className="ic-value ic-normal" style={{ lineHeight: 1.2 }}>
                    {invoice.guest.addressLine1}<br />
                    {invoice.guest.addressLine2}<br />
                    {invoice.guest.addressLine3}
                  </div>
                </div>
                <div className="ic-grid-left" style={{ marginTop: '10px' }}>
                  <div className="ic-label">Company/Agent:</div>
                  <div className="ic-value ic-normal">{invoice.guest.companyAgent}</div>
                </div>
              </div>

              <div className="ic-right-info">
                <div className="ic-grid-right">
                  <div className="ic-label">Room Number:</div>
                  <div className="ic-value">{invoice.info.roomNumber}</div>

                  <div className="ic-label">Arriva Date:</div>
                  <div className="ic-value ic-normal">{invoice.info.arrivalDate}</div>

                  <div className="ic-label">Departure Date:</div>
                  <div className="ic-value ic-normal">{invoice.info.departureDate}</div>

                  <div className="ic-label">Cashier:</div>
                  <div className="ic-value ic-normal">{invoice.info.cashier}</div>

                  <div className="ic-label">Date:</div>
                  <div className="ic-value ic-normal">{invoice.info.date}</div>

                  <div className="ic-label">Page No.:</div>
                  <div className="ic-value ic-normal">{page.pageNo} of {page.totalPages}</div>

                  <div className="ic-label">Invoice No.:</div>
                  <div className="ic-value ic-normal">{invoice.info.invoiceNo}</div>
                </div>
                <div className="ic-floating-time"> Time {invoice.info.time}</div>
              </div>
            </div>

            <div className="ic-invoice-title">INFORMATION INVOICE</div>

            <div className="ic-table-wrapper">
              <table className="ic-table">
                <colgroup>
                  <col className="ic-col-date" />
                  <col className="ic-col-desc" />
                  <col className="ic-col-charges" />
                  <col className="ic-col-credits" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="ic-br ic-nb" style={{ paddingLeft: '10px' }}>Date</th>
                    <th className="ic-br ic-nb" style={{ textAlign: 'center' }}>Descriptions</th>
                    <th className="ic-br ic-nb" style={{ textAlign: 'center' }}>Charges EGP.</th>
                    <th className=" ic-nb"      style={{ textAlign: 'center' }}>Credits EGP.</th>
                  </tr>
                </thead>

                <tbody style={{ lineHeight: 1.5 }}>
                  {page.items.map(item => (
                    <tr key={item.id}>
                      <td className="ic-br">{item.date}</td>
                      <td className="ic-br">
                        {item.subDesc ? (
                          <div className="ic-desc-inner">
                            <span>{item.desc}</span>
                            <span>{item.subDesc}</span>
                          </div>
                        ) : item.desc}
                      </td>
                      <td className="ic-br" style={{ textAlign: 'right', paddingRight: '20px' }}>{item.charges}</td>
                      <td>{item.credits}</td>
                    </tr>
                  ))}

                  {/* Spacer fills remaining space */}
                  <tr className="ic-spacer" style={{ height: '100%' }}>
                    <td className="ic-br"></td>
                    <td className="ic-br"></td>
                    <td className="ic-br"></td>
                    <td></td>
                  </tr>

                  {/* Totals + signature + VAT — last page only */}
                  {page.isLast && (
                    <>
                      <tr className="ic-total-row">
                        <td className="ic-bt ic-bb ic-br" style={{ textAlign: 'center', alignContent: 'center' }}>Total</td>
                        <td className="ic-bt ic-bb ic-br"></td>
                        <td className="ic-bt ic-bb ic-br" style={{ textAlign: 'right', paddingRight: '20px' }}>
                          {invoice.totals.charges}
                        </td>
                        <td className="ic-bt ic-bb" style={{ textAlign: 'right', paddingRight: '23px' }}>
                          {invoice.totals.credits}
                          <div style={{ marginTop: '6px' }}>{invoice.totals.creditsUsd}</div>
                        </td>
                      </tr>
                      <tr><td colSpan="4" style={{ height: '14px' }}></td></tr>
                      <tr>
                        <td rowSpan="2" className="ic-bt ic-br ic-bb" style={{ paddingTop: '8px' }}>Approved by</td>
                        <td className="ic-bt " style={{ height: '28px' }}></td>
                        <td colSpan="2" className="ic-bt "></td>
                      </tr>
                      <tr>
                        <td className="ic-bt ic-bb ic-br" style={{ padding: '6px 5px', borderRight: 'none' }}>Company / Travel Agency</td>
                        <td colSpan="2" className="ic-bt ic-bb" style={{ padding: '6px 5px' }}>Account Receivable No..</td>
                      </tr>
                      <tr className='ic-btt'>
                        <tr colSpan="2" rowSpan="2" style={{ height: '14px' }}>
                          {page.isLast && (
                            <div className="ic-vat-exchange ic-rr" style={{ width: "345%" }}>
                              Vat Rate = {invoice.footer.vatRate}<br />
                              Exchange Rate {invoice.footer.exchangeRate}
                            </div>
                          )}
                        </tr>
                        <td style={{ textAlign: 'center', paddingLeft: '190px' }}>Signature</td>
                        <td colSpan="2" style={{ paddingLeft: '5px' }}>Address</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default IntercontinentalInvoiceView;