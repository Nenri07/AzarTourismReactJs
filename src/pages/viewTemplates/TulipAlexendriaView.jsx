// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import cairoInvoiceApi from "../../Api/cairoInvoice.api"; // adjust path as needed
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components"; // adjust path as needed
// import logo from "../../../public/tolip_alexendria-logo.png"; // adjust path as needed
// // ─── Dummy data (replace with real API payload shape) ────────────────────────
// const dummyData = {
//   hotel: { logo: logo },
//   guest: {
//     companyName: "AZAR TOURISM",
//     addressLine1: "Algeria Square Building Number 12 First",
//     addressLine2: "Floor, Tripoli 1254 Tripoli Libya",
//     guestName: "Mr. Elmahjoub , Mohamed",
//     membershipNo: "",
//     groupCode: "",
//     taSource: "AZAR TOURISM",
//     group: ""
//   },
//   stayDetails: {
//     roomNo: "0329",
//     arrival: "12-02-25",
//     departure: "05-03-25",
//     folioNo: "1106",
//     confNo: "14706528",
//     cashierNo: "130",
//     userId: "HMOHSEN,",
//     datePrinted: "05-03-25"
//   },
//   transactions: [
//     { id: 1,  date: "12-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 2,  date: "13-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 3,  date: "14-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 4,  date: "15-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 5,  date: "16-02-25", text: "Guest Laundry",  rate: "",                       debit: "6,007.19",  credit: "0.00" },
//     { id: 6,  date: "16-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 7,  date: "17-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 8,  date: "18-02-25", text: "Guest Laundry",  rate: "",                       debit: "4,009.09",  credit: "0.00" },
//     { id: 9,  date: "18-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 10, date: "19-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 11, date: "20-02-25", text: "Guest Laundry",  rate: "",                       debit: "5,897.21",  credit: "0.00" },
//     { id: 12, date: "20-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 13, date: "21-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 14, date: "22-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 15, date: "23-02-25", text: "Guest Laundry",  rate: "",                       debit: "5,876.66",  credit: "0.00" },
//     { id: 16, date: "23-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 17, date: "24-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 18, date: "25-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 19, date: "26-02-25", text: "Guest Laundry",  rate: "",                       debit: "5,000.16",  credit: "0.00" },
//     { id: 20, date: "26-02-25", text: "Guest Laundry",  rate: "",                       debit: "6,019.87",  credit: "0.00" },
//     { id: 21, date: "26-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 22, date: "27-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 23, date: "28-02-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 24, date: "01-03-25", text: "Guest Laundry",  rate: "",                       debit: "6,789.30",  credit: "0.00" },
//     { id: 25, date: "01-03-25", text: "Guest Laundry",  rate: "",                       debit: "7,006.30",  credit: "0.00" },
//     { id: 26, date: "01-03-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 27, date: "02-03-25", text: "Guest Laundry",  rate: "",                       debit: "5,012.36",  credit: "0.00" },
//     { id: 28, date: "02-03-25", text: "Guest Laundry",  rate: "",                       debit: "4,386.74",  credit: "0.00" },
//     { id: 29, date: "02-03-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 30, date: "03-03-25", text: "Guest Laundry",  rate: "",                       debit: "5,808.70",  credit: "0.00" },
//     { id: 31, date: "03-03-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//     { id: 32, date: "04-03-25", text: "Guest Laundry",  rate: "",                       debit: "4,369.92",  credit: "0.00" },
//     { id: 33, date: "04-03-25", text: "Accommodation",  rate: "450.00 USD / 0.019869", debit: "22,648.35", credit: "0.00" },
//   ],
//   totals: {
//     totalDebit: "541,798.85",
//     totalCredit: "541,798.85",
//     balance: "0.00",
//     totalUsd: "10,765.00"
//   }
// };

// // ─── Rows per page (tune as needed) ──────────────────────────────────────────
// const ROWS_PER_PAGE = 25;

// // ─────────────────────────────────────────────────────────────────────────────

// const TolipAlexandriaView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [paginatedData, setPaginatedData] = useState([]);

//   const invoiceRef = useRef(null);
//   const isPdfDownload = location.pathname.includes("/download-pdf");

//   // ── Data loading ────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (invoiceData) {
//       setInvoice(transformInvoiceData(invoiceData));
//       setLoading(false);
//     } else if (invoiceId) {
//       fetchInvoiceData();
//     } else {
//       // Dev fallback: use dummy data when there's no route param
//       setInvoice(transformInvoiceData(dummyData));
//       setLoading(false);
//     }
//   }, [invoiceData, invoiceId]);

//   // ── Auto-download when URL ends in /download-pdf ────────────────────────────
//   useEffect(() => {
//     if (isPdfDownload && invoice && invoiceRef.current) {
//       const timer = setTimeout(async () => {
//         await handleDownloadPDF();
//         navigate("/invoices", { replace: true });
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [isPdfDownload, invoice]);

//   const fetchInvoiceData = async () => {
//     try {
//       setLoading(true);
//       const response = await cairoInvoiceApi.getInvoiceById(invoiceId);
//       let rawData = response.data || response;
//       if (rawData.data) rawData = rawData.data;
//       if (rawData.data) rawData = rawData.data;
//       setInvoice(transformInvoiceData(rawData));
//     } catch (err) {
//       console.error("Error fetching Tolip Alexandria invoice:", err);
//       setError("Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Transform API payload → local shape (pass-through for dummyData) ────────
//   const transformInvoiceData = (data) => {
//     if (!data) return null;

//     // If the payload already has the flat dummyData shape, return as-is
//     if (data.guest && data.stayDetails && data.transactions) return data;

//     // Otherwise map from a real API response — adjust field names to match yours
//     return {
//       hotel: { logo: data.hotelLogo || "/tolip-alexendria-logo.png" },
//       guest: {
//         companyName:  data.companyName  || "",
//         addressLine1: data.addressLine1 || "",
//         addressLine2: data.addressLine2 || "",
//         guestName:    data.guestName    || "",
//         membershipNo: data.membershipNo || "",
//         groupCode:    data.groupCode    || "",
//         taSource:     data.taSource     || data.companyName || "",
//         group:        data.group        || "",
//       },
//       stayDetails: {
//         roomNo:      data.roomNo      || "",
//         arrival:     data.arrival     || "",
//         departure:   data.departure   || "",
//         folioNo:     data.folioNo     || "",
//         confNo:      data.confNo      || "",
//         cashierNo:   data.cashierNo   || "",
//         userId:      data.userId      || "",
//         datePrinted: data.datePrinted || "",
//       },
//       transactions: Array.isArray(data.transactions) ? data.transactions : [],
//       totals: {
//         totalDebit:  data.totalDebit  || "0.00",
//         totalCredit: data.totalCredit || "0.00",
//         balance:     data.balance     || "0.00",
//         totalUsd:    data.totalUsd    || "0.00",
//       },
//     };
//   };

//   // ── Pagination ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!invoice?.transactions) return;

//     const tx = invoice.transactions;
//     if (tx.length === 0) {
//       setPaginatedData([{ items: [], pageNo: 1, totalPages: 1, showTotals: true }]);
//       return;
//     }

//     const totalPages = Math.ceil(tx.length / ROWS_PER_PAGE);
//     const pages = [];
//     for (let i = 0; i < tx.length; i += ROWS_PER_PAGE) {
//       pages.push({
//         items:      tx.slice(i, i + ROWS_PER_PAGE),
//         pageNo:     Math.floor(i / ROWS_PER_PAGE) + 1,
//         totalPages,
//         showTotals: i + ROWS_PER_PAGE >= tx.length,
//       });
//     }
//     setPaginatedData(pages);
//   }, [invoice]);

//   // ── PDF download (mirrors Radisson logic exactly) ───────────────────────────
//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const headStyles = Array.from(
//       document.head.querySelectorAll('link[rel="stylesheet"], style')
//     );
//     headStyles.forEach(s => s.parentNode?.removeChild(s));

//     try {
//       const images = invoiceRef.current.querySelectorAll('img');
//       await Promise.all(
//         Array.from(images).map(img =>
//           img.complete
//             ? Promise.resolve()
//             : new Promise(res => { img.onload = res; img.onerror = res; })
//         )
//       );
//       await new Promise(res => setTimeout(res, 500));

//       const opt = {
//         margin:   0,
//         filename: `tolip-alexandria-${invoice.stayDetails?.folioNo || 'invoice'}.pdf`,
//         image:    { type: 'jpeg', quality: 3 },
//         html2canvas: {
//           scale:       4,
//           useCORS:     true,
//           letterRendering: true,
//           scrollY:     0,
//           windowWidth: 794,
//         },
//         jsPDF:     { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['avoid-all'] },
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

//   // ── Empty / loading state ────────────────────────────────────────────────────
//   if (!invoice) {
//     return (
//       <InvoiceTemplate
//         loading={loading}
//         error={error}
//         invoice={invoice}
//         onBack={() => navigate("/invoices")}
//       >
//         <></>
//       </InvoiceTemplate>
//     );
//   }

//   const { guest, stayDetails, totals } = invoice;

//   // ── Render ───────────────────────────────────────────────────────────────────
//   return (
//     <InvoiceTemplate
//       loading={loading}
//       error={error}
//       invoice={invoice}
//       pdfLoading={pdfLoading}
//       onDownloadPDF={handleDownloadPDF}
//       onPrint={handlePrint}
//       onBack={() => navigate("/invoices")}
//     >
//       <div className="tolip-invoice-wrapper" ref={invoiceRef}>
//         <style dangerouslySetInnerHTML={{ __html: `
//           /* ── Wrapper ── */
//           .tolip-invoice-wrapper {
//             width: 100%;
//             background-color: transparent;
//           }
//           .tolip-invoice-wrapper * {
//             font-family: Arial, Helvetica, sans-serif;
//             color: #000;
//           }

//           /* ── A4 page card ── */
//           .tolip-page {
//             width: 100%;
//             max-width: 794px;
//              padding: 4mm 4mm 4mm;
//             margin: 0 auto 20px auto;
//             background: #fff;
//             box-shadow: 0 0 10px rgba(0,0,0,0.1);
//             box-sizing: border-box;
//             position: relative;
//             font-size: 14px;
//             line-height: 1.3;
//           }

//           /* ── Logo ── */
//           .tolip-logo {
//           display: flex;
//           justify-content: flex-end;
//             text-align: right;
//             margin-bottom: 10px;
//           }
//           .tolip-logo img {
//             width: 160px;
//             height: auto;
//           }

//           /* ── Header two-column block ── */
//           .tolip-header {
//             display: flex;
//             justify-content: space-between;
//             margin-bottom: 0;
//             line-height: 1.3;
//           }
//           .tolip-left  { width: 60%; }
//           .tolip-right { width: 35%; }

//           .tolip-meta-table { width: 100%; border-collapse: collapse; }
//           .tolip-meta-table td { padding: 2px 0; vertical-align: top; }
//           .tolip-meta-table td:first-child { width: 45%; }

//           /* ── Sub-header bar ── */
//           .tolip-subheader {
//             display: flex;
//             justify-content: space-between;
//             align-items: flex-end;
//             margin-bottom: 10px;
//           }
//           .tolip-subheader .sh-group { width: 30%; text-align: left; }
//           .tolip-subheader .sh-center { width: 40%; text-align: center; font-size: 13px; }
//           .tolip-subheader .sh-date   { width: 30%; text-align: right; padding-right: 25px; }

//           /* ── Transaction table ── */
//           .tolip-table {
//             width: 100%;
//             border-collapse: collapse;
//             margin-bottom: 20px;
//           }
//           .tolip-table th {
//             border-top: 2px solid #000;
//             border-bottom: 2px solid #000;
//             padding: 5px 0;
//             font-size: 13px;
//             font-weight: bold;
//             text-align: left;
//           }
//           .tolip-table th.right { text-align: right; }
//           .tolip-table td {
//             padding: 3px 0;
//             vertical-align: top;
//           }
//           .tolip-table td.right     { text-align: right; }
//           .tolip-table td.rate-col  { padding-left: 15px; }
//           .tolip-total-row td {
//             border-top: 2px solid #000;
//             border-bottom: 2px solid #000;
//             font-weight: bold;
//             padding: 5px 0;
//             text-align: center;
//           }
//           .tolip-total-row td.right { text-align: right; }

//           /* ── Summary ── */
//           .tolip-summary {
//             display: flex;
//             flex-direction: column;
//             align-items: flex-end;
//             margin-top: 10px;
//             margin-bottom: 30px;
//           }
//           .tolip-summary-line {
//             display: flex;
//             justify-content: flex-end;
//             width: 300px;
//             margin-bottom: 5px;
//             font-size: 13px;
//           }
//           .tolip-summary-line .s-label {
//             font-weight: bold;
//             width: 120px;
//             text-align: center;
//           }
//           .tolip-summary-line .s-value {
//             width: 120px;
//             text-align: right;
//             padding-bottom: 2px;
//           }
//           .tolip-summary-line.usd .s-value {
//             border-bottom: 3px solid #000;
//           }

//           /* ── Disclaimer & signature ── */
//           .tolip-disclaimer {
//             font-size: 11px;
//             line-height: 1.4;
//             margin-top: 40px;
//             margin-bottom: 30px;
//           }
//           .tolip-signature { margin-top: 20px; width: 150px; }
//           .tolip-signature .sig-title { font-size: 11px; margin-bottom: 20px; font-weight: bold; }
//           .tolip-signature .sig-line  { border-bottom: 1px solid #000; width: 100%; }

//           /* ── Utilities ── */
//           .spacer-line  { margin-bottom: 15px; }
//           .spacer-small { margin-bottom: 8px; }
//           .no-break     { page-break-inside: avoid; break-inside: avoid; }

//           /* ── Print ── */
//           @page { size: A4 portrait; margin: 0; }
//           @media print {
//             body, html { margin: 0 !important; padding: 0 !important; background: #fff !important; }
//             button, nav, header, footer, .no-print { display: none !important; }
//             .tolip-invoice-wrapper { padding: 0 !important; margin: 0 !important; background: none !important; }
//             .tolip-page {
//               margin: 0 !important;
//             //   padding: 10mm 15mm !important;
//               box-shadow: none !important;
//               border: none !important;
//             }
//           }
//         `}} />

//         {paginatedData.map((page, idx) => (
//           <div className="tolip-page" key={idx}>

//             {/* Logo */}
//             <div className="tolip-logo">
//               <img src={logo} alt="Tolip Hotel Alexandria" />
//             </div>

//             {/* Header */}
//             <div className="tolip-header">
//               <div className="tolip-left">
//                 <strong>{guest.companyName}</strong><br />
//                 {guest.addressLine1}<br />
//                 {guest.addressLine2}<br />
//                 <div className="spacer-line" />
//                 {guest.guestName}<br />
//                 <div className="spacer-small" />
//                 <strong>INFORMATION INVOICE</strong><br />
//                 Membership No. {guest.membershipNo}<br />
//                 <div className="spacer-line" />
//                 Group Code {guest.groupCode}<br />
//                 Company Name / TA : {guest.taSource}<br />
//                 Source<br />
//               </div>

//               <div className="tolip-right">
//                 <table className="tolip-meta-table">
//                   <tbody>
//                     <tr><td>Room No.</td>   <td>{stayDetails.roomNo}</td></tr>
//                     <tr><td>Arrival</td>    <td>{stayDetails.arrival}</td></tr>
//                     <tr><td>Departure</td>  <td>{stayDetails.departure}</td></tr>
//                     <tr><td colSpan="2"><div className="spacer-small" /></td></tr>
//                     <tr><td>Page No.</td>   <td>{page.pageNo} of {page.totalPages}</td></tr>
//                     <tr><td>Folio No.</td>  <td>{stayDetails.folioNo}</td></tr>
//                     <tr><td>Conf. No.</td>  <td>{stayDetails.confNo}</td></tr>
//                     <tr><td>Cashier No.</td><td>{stayDetails.cashierNo}</td></tr>
//                     <tr><td>User ID</td>    <td>{stayDetails.userId}</td></tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             {/* Sub-header */}
//             <div className="tolip-subheader">
//               <div className="sh-group">Group {guest.group}</div>
//               <div className="sh-center">Thank You For Staying With Us</div>
//               <div className="sh-date">{stayDetails.datePrinted}</div>
//             </div>

//             {/* Transaction table */}
//             <table className="tolip-table">
//               <thead>
//                 <tr>
//                   <th style={{ width: '15%' }}>Date</th>
//                   <th style={{ width: '25%' }}>Text</th>
//                   <th style={{ width: '30%' }}></th>
//                   <th className="right" style={{ width: '15%' }}>Debit<br />EGP</th>
//                   <th className="right" style={{ width: '15%' }}>Credit<br />EGP</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {page.items.map(row => (
//                   <tr key={row.id}>
//                     <td>{row.date}</td>
//                     <td>{row.text}</td>
//                     <td className="rate-col">{row.rate}</td>
//                     <td className="right">{row.debit}</td>
//                     <td className="right">{row.credit}</td>
//                   </tr>
//                 ))}

//                 {page.showTotals && (
//                   <tr className="tolip-total-row">
//                     <td colSpan="3">Total</td>
//                     <td className="right">{totals.totalDebit}</td>
//                     <td className="right">{totals.totalCredit}</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//             {/* Summary */}
//             {page.showTotals && (
//               <>
//                 <div className="tolip-summary no-break">
//                   <div className="tolip-summary-line">
//                     <div className="s-label">Balance</div>
//                     <div className="s-value">{totals.balance}</div>
//                   </div>
//                   <div className="tolip-summary-line usd">
//                     <div className="s-label">Total In USD</div>
//                     <div className="s-value">{totals.totalUsd}</div>
//                   </div>
//                 </div>

//                 <div className="tolip-disclaimer no-break">
//                   I agree that my liability for this bill is not waived and I agree to be held personally liable
//                   in the event that the indicated person, company or association fails to pay for any part of
//                   the full amount of these charges.
//                 </div>

//                 <div className="tolip-signature no-break">
//                   <div className="sig-title">Guest Signatures</div>
//                   <div className="sig-line"></div>
//                 </div>
//               </>
//             )}

//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default TolipAlexandriaView;



// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import cairoInvoiceApi from "../../Api/cairoInvoice.api"; // adjust path as needed
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components"; // adjust path as needed
// import logo from "../../../public/tolip_alexendria-logo.png"; // adjust path as needed

// // ─── Rows per page (tune as needed) ──────────────────────────────────────────
// const ROWS_PER_PAGE = 25;

// const TolipAlexandriaView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [paginatedData, setPaginatedData] = useState([]);

//   const invoiceRef = useRef(null);
//   const isPdfDownload = location.pathname.includes("/download-pdf");

//   // ── Data loading ────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (invoiceData) {
//       setInvoice(transformInvoiceData(invoiceData));
//       setLoading(false);
//     } else if (invoiceId) {
//       fetchInvoiceData();
//     }
//   }, [invoiceData, invoiceId]);

//   // ── Auto-download when URL ends in /download-pdf ────────────────────────────
//   useEffect(() => {
//     if (isPdfDownload && invoice && invoiceRef.current) {
//       const timer = setTimeout(async () => {
//         await handleDownloadPDF();
//         navigate("/invoices", { replace: true });
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [isPdfDownload, invoice]);

//   const fetchInvoiceData = async () => {
//     try {
//       setLoading(true);
//       const response = await cairoInvoiceApi.getInvoiceById(invoiceId);
      
//       let rawData = response.data || response;
//       if (rawData.data) rawData = rawData.data;
//       if (rawData.data) rawData = rawData.data;
      
//       setInvoice(transformInvoiceData(rawData));
//     } catch (err) {
//       console.error("Error fetching Tolip Alexandria invoice:", err);
//       setError("Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "";
//     try {
//         const d = new Date(dateString);
//         if (isNaN(d.getTime())) return dateString;
//         const dd = String(d.getDate()).padStart(2, '0');
//         const mm = String(d.getMonth() + 1).padStart(2, '0');
//         const yy = String(d.getFullYear()).slice(-2);
//         return `${dd}-${mm}-${yy}`; 
//     } catch { return dateString; }
//   };

//   const formatCurrency = (val) => {
//     if (val === undefined || val === null || val === "") return "";
//     return parseFloat(val).toLocaleString('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });
//   };

//   // ── Transform API payload → local shape ────────
//   const transformInvoiceData = (data) => {
//     if (!data) return null;

//     const addressParts = data.address ? data.address.split(',') : [];
//     const addressLine1 = addressParts[0] ? addressParts[0].trim() : "";
//     const addressLine2 = addressParts.slice(1).join(',').trim();

//     const transactions = [];
//     let txId = 1;

//     // Map Accommodation Details
//     if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
//       data.accommodationDetails.forEach(item => {
//         transactions.push({
//           id: txId++,
//           rawDate: new Date(item.date).getTime() || 0,
//           date: formatDate(item.date),
//           text: item.text || item.description || "Accommodation",
//           rate: item.exchangeRateCol || "",
//           debit: formatCurrency(item.debitEgp || item.rate || 0),
//           credit: formatCurrency(item.creditEgp || 0)
//         });
//       });
//     }

//     // Map Other Services
//     if (data.otherServices && Array.isArray(data.otherServices)) {
//       data.otherServices.forEach(item => {
//         transactions.push({
//           id: txId++,
//           rawDate: new Date(item.date).getTime() || 0,
//           date: formatDate(item.date),
//           text: item.name || "Service",
//           rate: "",
//           debit: formatCurrency(item.amount || 0),
//           credit: "0.00"
//         });
//       });
//     }

//     // Sort combined transactions by Date
//     transactions.sort((a, b) => a.rawDate - b.rawDate);

//     return {
//       hotel: { logo: logo },
//       guest: {
//         companyName: data.companyName || "",
//         addressLine1: addressLine1,
//         addressLine2: addressLine2,
//         guestName: data.guestName || "",
//         membershipNo: data.membershipNo || "",
//         groupCode: data.groupCode || "",
//         taSource: data.companyName || "",
//         group: data.groupCode || ""
//       },
//       stayDetails: {
//         roomNo: data.roomNo || "",
//         arrival: formatDate(data.arrivalDate),
//         departure: formatDate(data.departureDate),
//         folioNo: data.folioNo || "",
//         confNo: data.confNo || "",
//         cashierNo: data.cashierId || "",
//         userId: data.userId || "",
//         datePrinted: formatDate(data.invoiceDate)
//       },
//       transactions: transactions,
//       totals: {
//         totalDebit: formatCurrency(data.grandTotalEgp),
//         totalCredit: "0.00",
//         balance: formatCurrency(data.grandTotalEgp),
//         totalUsd: formatCurrency(data.balanceUsd)
//       }
//     };
//   };

//   // ── Pagination ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!invoice?.transactions) return;

//     const tx = invoice.transactions;
//     if (tx.length === 0) {
//       setPaginatedData([{ items: [], pageNo: 1, totalPages: 1, showTotals: true }]);
//       return;
//     }

//     const totalPages = Math.ceil(tx.length / ROWS_PER_PAGE);
//     const pages = [];
//     for (let i = 0; i < tx.length; i += ROWS_PER_PAGE) {
//       pages.push({
//         items:      tx.slice(i, i + ROWS_PER_PAGE),
//         pageNo:     Math.floor(i / ROWS_PER_PAGE) + 1,
//         totalPages,
//         showTotals: i + ROWS_PER_PAGE >= tx.length,
//       });
//     }
//     setPaginatedData(pages);
//   }, [invoice]);

//   // ── PDF download (mirrors Radisson logic exactly) ───────────────────────────
//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const headStyles = Array.from(
//       document.head.querySelectorAll('link[rel="stylesheet"], style')
//     );
//     headStyles.forEach(s => s.parentNode?.removeChild(s));

//     try {
//       const images = invoiceRef.current.querySelectorAll('img');
//       await Promise.all(
//         Array.from(images).map(img =>
//           img.complete
//             ? Promise.resolve()
//             : new Promise(res => { img.onload = res; img.onerror = res; })
//         )
//       );
//       await new Promise(res => setTimeout(res, 500));

//       const opt = {
//         margin:   0,
//         filename: `tolip-alexandria-${invoice.stayDetails?.folioNo || 'invoice'}.pdf`,
//         image:    { type: 'jpeg', quality: 3 },
//         html2canvas: {
//           scale:       4,
//           useCORS:     true,
//           letterRendering: true,
//           scrollY:     0,
//           windowWidth: 794,
//         },
//         jsPDF:     { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['avoid-all'] },
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

//   // ── Empty / loading state ────────────────────────────────────────────────────
//   if (!invoice) {
//     return (
//       <InvoiceTemplate
//         loading={loading}
//         error={error}
//         invoice={invoice}
//         onBack={() => navigate("/invoices")}
//       >
//         <></>
//       </InvoiceTemplate>
//     );
//   }

//   const { guest, stayDetails, totals } = invoice;

//   // ── Render ───────────────────────────────────────────────────────────────────
//   return (
//     <InvoiceTemplate
//       loading={loading}
//       error={error}
//       invoice={invoice}
//       pdfLoading={pdfLoading}
//       onDownloadPDF={handleDownloadPDF}
//       onPrint={handlePrint}
//       onBack={() => navigate("/invoices")}
//     >
//       <div className="tolip-invoice-wrapper" ref={invoiceRef}>
//         <style dangerouslySetInnerHTML={{ __html: `
//           /* ── Wrapper ── */
//           .tolip-invoice-wrapper {
//             width: 100%;
//             background-color: transparent;
//           }
//           .tolip-invoice-wrapper * {
//             font-family: Arial, Helvetica, sans-serif;
//             color: #000;
//           }

//           /* ── A4 page card ── */
//           .tolip-page {
//             width: 100%;
//             max-width: 794px;
//              padding: 4mm 4mm 4mm;
//             margin: 0 auto 20px auto;
//             background: #fff;
//             box-shadow: 0 0 10px rgba(0,0,0,0.1);
//             box-sizing: border-box;
//             position: relative;
//             font-size: 14px;
//             line-height: 1.3;
//           }

//           /* ── Logo ── */
//           .tolip-logo {
//           display: flex;
//           justify-content: flex-end;
//             text-align: right;
//             margin-bottom: 10px;
//           }
//           .tolip-logo img {
//             width: 160px;
//             height: auto;
//           }

//           /* ── Header two-column block ── */
//           .tolip-header {
//             display: flex;
//             justify-content: space-between;
//             margin-bottom: 0;
//             line-height: 1.3;
//           }
//           .tolip-left  { width: 60%; }
//           .tolip-right { width: 35%; }

//           .tolip-meta-table { width: 100%; border-collapse: collapse; }
//           .tolip-meta-table td { padding: 2px 0; vertical-align: top; }
//           .tolip-meta-table td:first-child { width: 45%; }

//           /* ── Sub-header bar ── */
//           .tolip-subheader {
//             display: flex;
//             justify-content: space-between;
//             align-items: flex-end;
//             margin-bottom: 10px;
//           }
//           .tolip-subheader .sh-group { width: 30%; text-align: left; }
//           .tolip-subheader .sh-center { width: 65%; text-align: right; font-size: 13px; }
//           .tolip-subheader .sh-date   { width: 30%; text-align: right; padding-right: 25px; }

//           /* ── Transaction table ── */
//           .tolip-table {
//             width: 100%;
//             border-collapse: collapse;
//             margin-bottom: 20px;
//           }
//           .tolip-table th {
//             border-top: 2px solid #000;
//             border-bottom: 2px solid #000;
//             padding: 5px 0;
//             font-size: 13px;
//             font-weight: bold;
//             text-align: left;
//           }
//           .tolip-table th.right { text-align: right; }
//           .tolip-table td {
//             padding: 3px 0;
//             vertical-align: top;
//           }
//           .tolip-table td.right     { text-align: right; }
//           .tolip-table td.rate-col  { padding-left: 15px; }
//           .tolip-total-row td {
//             border-top: 2px solid #000;
//             border-bottom: 2px solid #000;
//             font-weight: bold;
//             padding: 5px 0;
//             text-align: center;
//           }
//           .tolip-total-row td.right { text-align: right; }

//           /* ── Summary ── */
//           .tolip-summary {
//             display: flex;
//             flex-direction: column;
//             align-items: flex-end;
//             margin-top: 10px;
//             margin-bottom: 30px;
//           }
//           .tolip-summary-line {
//             display: flex;
//             justify-content: space-between;
//             width: 550px;
//             margin-bottom: 5px;
//             font-size: 13px;
//           }
//           .tolip-summary-line .s-label {
//             font-weight: bold;
//             width: 120px;
//             text-align: center;
//           }
//           .tolip-summary-line .s-value {
//             width: 185px;
//             text-align: right;
//             padding-bottom: 2px;
//           }
//           .tolip-summary-line.usd .s-value {
//             border-bottom: 3px solid #000;
//           }

//           /* ── Disclaimer & signature ── */
//           .tolip-disclaimer {
//             font-size: 11px;
//             line-height: 1.4;
//             margin-top: 40px;
//             margin-bottom: 30px;
//           }
//           .tolip-signature { margin-top: 20px; width: 150px; }
//           .tolip-signature .sig-title { font-size: 11px; margin-bottom: 20px; font-weight: bold; }
//           .tolip-signature .sig-line  { border-bottom: 1px solid #000; width: 100%; }

//           /* ── Utilities ── */
//           .spacer-line  { margin-bottom: 15px; }
//           .spacer-small { margin-bottom: 8px; }
//           .no-break     { page-break-inside: avoid; break-inside: avoid; }

//           /* ── Print ── */
//           @page { size: A4 portrait; margin: 0; }
//           @media print {
//             body, html { margin: 0 !important; padding: 0 !important; background: #fff !important; }
//             button, nav, header, footer, .no-print { display: none !important; }
//             .tolip-invoice-wrapper { padding: 0 !important; margin: 0 !important; background: none !important; }
//             .tolip-page {
//               margin: 0 !important;
//             //   padding: 10mm 15mm !important;
//               box-shadow: none !important;
//               border: none !important;
//             }
//           }
//         `}} />

//         {paginatedData.map((page, idx) => (
//           <div className="tolip-page" key={idx}>

//             {/* Logo */}
//             <div className="tolip-logo">
//               <img src={logo} alt="Tolip Hotel Alexandria" />
//             </div>

//             {/* Header */}
//             <div className="tolip-header">
//               <div className="tolip-left">
//                 <strong>{guest.companyName}</strong><br />
//                 {guest.addressLine1}<br />
//                 {guest.addressLine2}<br />
//                 <div className="spacer-line" />
//                 {guest.guestName}<br />
//                 <div className="spacer-small" />
//                 <strong>INFORMATION INVOICE</strong><br />
//                 Membership No. {guest.membershipNo}<br />
//                 <div className="spacer-line" />
//                 Group Code {guest.groupCode}<br />
//                 Company Name / TA : {guest.taSource}<br />
//                 Source<br />
//               </div>

//               <div className="tolip-right">
//                 <table className="tolip-meta-table">
//                   <tbody>
//                     <tr><td>Room No.</td>   <td>{stayDetails.roomNo}</td></tr>
//                     <tr><td>Arrival</td>    <td>{stayDetails.arrival}</td></tr>
//                     <tr><td>Departure</td>  <td>{stayDetails.departure}</td></tr>
//                     <tr><td colSpan="2"><div className="spacer-small" /></td></tr>
//                     <tr><td>Page No.</td>   <td>{page.pageNo} of {page.totalPages}</td></tr>
//                     <tr><td>Folio No.</td>  <td>{stayDetails.folioNo}</td></tr>
//                     <tr><td>Conf. No.</td>  <td>{stayDetails.confNo}</td></tr>
//                     <tr><td>Cashier No.</td><td>{stayDetails.cashierNo}</td></tr>
//                     <tr><td>User ID</td>    <td>{stayDetails.userId}</td></tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             {/* Sub-header */}
//             <div className="tolip-subheader">
//               <div className="sh-group">Group {guest.group}</div>
//               <div className="sh-center">Thank You For Staying With Us</div>
//               <div className="sh-date">{stayDetails.datePrinted}</div>
//             </div>

//             {/* Transaction table */}
//             <table className="tolip-table">
//               <thead>
//                 <tr>
//                   <th style={{ width: '15%', verticalAlign: 'top' }}>Date</th>
//                   <th style={{ width: '25%', verticalAlign:'top' }}>Text</th>
//                   <th style={{ width: '30%' }}></th>
//                   <th className="right" style={{ width: '15%' }}>Debit<br /><span style={{fontWeight:"normal"}}>EGP</span></th>
//                   <th className="right" style={{ width: '15%' }}>Credit<br /><span style={{fontWeight:"normal"}}>EGP</span></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {page.items.map(row => (
//                   <tr key={row.id}>
//                     <td>{row.date}</td>
//                     <td>{row.text}</td>
//                     <td className="rate-col">{row.rate}</td>
//                     <td className="right">{row.debit}</td>
//                     <td className="right">{row.credit}</td>
//                   </tr>
//                 ))}

//                 {page.showTotals && (
//                   <tr className="tolip-total-row">
//                     <td colSpan="3">Total</td>
//                     <td className="right">{totals.totalDebit}</td>
//                     <td className="right">{totals.totalDebit}</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//             {/* Summary */}
//             {page.showTotals && (
//               <>
//                 <div className="tolip-summary no-break">
//                   <div className="tolip-summary-line">
//                     <div className="s-label">Balance</div>
//                       <div className="s-value">0.00</div>
//                       <div style={{width:'50%'}}></div>
//                   </div>
//                   <div className="tolip-summary-line usd">
//                     <div className="s-label">Total In USD</div>
//                     <div className="s-value">{totals.totalUsd}</div>
//                   </div>
//                 </div>

//                 <div className="tolip-disclaimer no-break">
//                   I agree that my liability for this bill is not waived and I agree to be held personally liable
//                   in the event that the indicated person, company or association fails to pay for any part of
//                   the full amount of these charges.
//                 </div>

//                 <div className="tolip-signature no-break">
//                   <div className="sig-title">Guest Signatures</div>
//                   <div className="sig-line"></div>
//                 </div>
//               </>
//             )}

//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default TolipAlexandriaView;


// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import cairoInvoiceApi from "../../Api/cairoInvoice.api"; // adjust path as needed
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components"; // adjust path as needed
// import logo from "../../../public/tolip_alexendria-logo.png"; // adjust path as needed

// // ─── Rows per page (tune as needed) ──────────────────────────────────────────
// const ROWS_PER_PAGE = 21;

// const TolipAlexandriaView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [paginatedData, setPaginatedData] = useState([]);

//   const invoiceRef = useRef(null);
//   const isPdfDownload = location.pathname.includes("/download-pdf");

//   // ── Data loading ────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (invoiceData) {
//       setInvoice(transformInvoiceData(invoiceData));
//       setLoading(false);
//     } else if (invoiceId) {
//       fetchInvoiceData();
//     }
//   }, [invoiceData, invoiceId]);

//   // ── Auto-download when URL ends in /download-pdf ────────────────────────────
//   useEffect(() => {
//     if (isPdfDownload && invoice && invoiceRef.current) {
//       const timer = setTimeout(async () => {
//         await handleDownloadPDF();
//         navigate("/invoices", { replace: true });
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [isPdfDownload, invoice]);

//   const fetchInvoiceData = async () => {
//     try {
//       setLoading(true);
//       const response = await cairoInvoiceApi.getInvoiceById(invoiceId);
      
//       let rawData = response.data || response;
//       if (rawData.data) rawData = rawData.data;
//       if (rawData.data) rawData = rawData.data;
      
//       setInvoice(transformInvoiceData(rawData));
//     } catch (err) {
//       console.error("Error fetching Tolip Alexandria invoice:", err);
//       setError("Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "";
//     try {
//         const d = new Date(dateString);
//         if (isNaN(d.getTime())) return dateString;
//         const dd = String(d.getDate()).padStart(2, '0');
//         const mm = String(d.getMonth() + 1).padStart(2, '0');
//         const yy = String(d.getFullYear()).slice(-2);
//         return `${dd}-${mm}-${yy}`; 
//     } catch { return dateString; }
//   };

//   const formatCurrency = (val) => {
//     if (val === undefined || val === null || val === "") return "";
//     return parseFloat(val).toLocaleString('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });
//   };

//   // ── Transform API payload → local shape ────────
//   const transformInvoiceData = (data) => {
//     if (!data) return null;

//     const addressParts = data.address ? data.address.split(',') : [];
//     const addressLine1 = addressParts[0] ? addressParts[0].trim() : "";
//     const addressLine2 = addressParts.slice(1).join(',').trim();

//     const transactions = [];
//     let txId = 1;

//     // Map Accommodation Details
//     if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
//       data.accommodationDetails.forEach(item => {
//         transactions.push({
//           id: txId++,
//           rawDate: new Date(item.date).getTime() || 0,
//           date: formatDate(item.date),
//           text: item.text || item.description || "Accommodation",
//           rate: item.exchangeRateCol || "",
//           debit: formatCurrency(item.debitEgp || item.rate || 0),
//           credit: formatCurrency(item.creditEgp || 0)
//         });
//       });
//     }

//     // Map Other Services
//     if (data.otherServices && Array.isArray(data.otherServices)) {
//       data.otherServices.forEach(item => {
//         transactions.push({
//           id: txId++,
//           rawDate: new Date(item.date).getTime() || 0,
//           date: formatDate(item.date),
//           text: item.name || "Service",
//           rate: "",
//           debit: formatCurrency(item.amount || 0),
//           credit: "0.00"
//         });
//       });
//     }

//     // Sort combined transactions by Date
//     transactions.sort((a, b) => a.rawDate - b.rawDate);

//     return {
//       hotel: { logo: logo },
//       guest: {
//         companyName: data.companyName || "",
//         addressLine1: addressLine1,
//         addressLine2: addressLine2,
//         guestName: data.guestName || "",
//         membershipNo: data.membershipNo || "",
//         groupCode: data.groupCode || "",
//         taSource: data.companyName || "",
//         group: data.groupCode || ""
//       },
//       stayDetails: {
//         roomNo: data.roomNo || "",
//         arrival: formatDate(data.arrivalDate),
//         departure: formatDate(data.departureDate),
//         folioNo: data.folioNo || "",
//         confNo: data.confNo || "",
//         cashierNo: data.cashierId || "",
//         userId: data.userId || "",
//         datePrinted: formatDate(data.invoiceDate)
//       },
//       transactions: transactions,
//       totals: {
//         totalDebit: formatCurrency(data.grandTotalEgp),
//         totalCredit: "0.00",
//         balance: formatCurrency(data.grandTotalEgp),
//         totalUsd: formatCurrency(data.balanceUsd)
//       }
//     };
//   };

//   // ── Pagination ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!invoice?.transactions) return;

//     const tx = invoice.transactions;
//     if (tx.length === 0) {
//       setPaginatedData([{ items: [], pageNo: 1, totalPages: 1, showTotals: true }]);
//       return;
//     }

//     const totalPages = Math.ceil(tx.length / ROWS_PER_PAGE);
//     const pages = [];
//     for (let i = 0; i < tx.length; i += ROWS_PER_PAGE) {
//       pages.push({
//         items:      tx.slice(i, i + ROWS_PER_PAGE),
//         pageNo:     Math.floor(i / ROWS_PER_PAGE) + 1,
//         totalPages,
//         showTotals: i + ROWS_PER_PAGE >= tx.length,
//       });
//     }
//     setPaginatedData(pages);
//   }, [invoice]);

//   // ── PDF download ───────────────────────────────────────────────────────────
//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const headStyles = Array.from(
//       document.head.querySelectorAll('link[rel="stylesheet"], style')
//     );
//     headStyles.forEach(s => s.parentNode?.removeChild(s));

//     try {
//       const images = invoiceRef.current.querySelectorAll('img');
//       await Promise.all(
//         Array.from(images).map(img =>
//           img.complete
//             ? Promise.resolve()
//             : new Promise(res => { img.onload = res; img.onerror = res; })
//         )
//       );
//       await new Promise(res => setTimeout(res, 500));

//       const opt = {
//         margin:   0,
//         filename: `tolip-alexandria-${invoice.stayDetails?.folioNo || 'invoice'}.pdf`,
//         image:    { type: 'jpeg', quality: 3 },
//         html2canvas: {
//           scale:       4,
//           useCORS:     true,
//           letterRendering: true,
//           scrollY:     0,
//           windowWidth: 794,
//         },
//         jsPDF:     { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['avoid-all'] },
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

//   // ── Empty / loading state ────────────────────────────────────────────────────
//   if (!invoice) {
//     return (
//       <InvoiceTemplate
//         loading={loading}
//         error={error}
//         invoice={invoice}
//         onBack={() => navigate("/invoices")}
//       >
//         <></>
//       </InvoiceTemplate>
//     );
//   }

//   const { guest, stayDetails, totals } = invoice;

//   // ── Render ───────────────────────────────────────────────────────────────────
//   return (
//     <InvoiceTemplate
//       loading={loading}
//       error={error}
//       invoice={invoice}
//       pdfLoading={pdfLoading}
//       onDownloadPDF={handleDownloadPDF}
//       onPrint={handlePrint}
//       onBack={() => navigate("/invoices")}
//     >
//       <div className="tolip-invoice-wrapper" ref={invoiceRef}>
//         <style dangerouslySetInnerHTML={{ __html: `
//           /* ── Wrapper ── */
//           .tolip-invoice-wrapper {
//             width: 100%;
//             background-color: transparent;
//           }
//           .tolip-invoice-wrapper * {
//             font-family: Arial, Helvetica, sans-serif;
//             color: #000;
//           }

//           /* ── A4 page card ── */
//           .tolip-page {
//             width: 100%;
//             max-width: 794px;
//             padding: 4mm 7mm 7mm;
//             margin: 0 auto 20px auto;
//             background: #fff;
//             box-shadow: 0 0 10px rgba(0,0,0,0.1);
//             box-sizing: border-box;
//             position: relative;
//             font-size: 14px;
//             line-height: 1.3;
//           }

//           /* ── Logo ── */
//           .tolip-logo {
//             display: flex;
//             justify-content: flex-end;
//             text-align: right;
//             margin-bottom: 10px;
//           }
//           .tolip-logo img {
//             width: 160px;
//             height: auto;
//           }

//           /* ── Header two-column block ── */
//           .tolip-header {
//             display: flex;
//             justify-content: space-between;
//             margin-bottom: 0;
//             line-height: 1.3;
//           }
//           .tolip-left  { width: 60%; }
//           .tolip-right { width: 35%; }

//           .tolip-meta-table { width: 100%; border-collapse: collapse; }
//           .tolip-meta-table td { padding: 2px 0; vertical-align: top; }
//           .tolip-meta-table td:first-child { width: 45%; }

//           /* ── Sub-header bar ── */
//           .tolip-subheader {
//             display: flex;
//             justify-content: space-between;
//             align-items: flex-end;
//             margin-bottom: 10px;
//           }
//           .tolip-subheader .sh-group  { width: 30%; text-align: left; }
//           .tolip-subheader .sh-center { width: 65%; text-align: right; font-size: 13px; }
//           .tolip-subheader .sh-date   { width: 30%; text-align: right; padding-right: 25px; }

//           /* ── Transaction table ── */
//           .tolip-table {
//             width: 100%;
//             border-collapse: collapse;
//           }
//           .tolip-table th {
//             border-top: 2px solid #000;
//             border-bottom: 2px solid #000;
//             padding: 5px 0;
//             font-size: 13px;
//             font-weight: bold;
//             text-align: left;
//           }
//           .tolip-table th.right { text-align: right; }
//           .tolip-table td {
//             padding: 3px 0;
//             vertical-align: top;
//           }
//           .tolip-table td.right    { text-align: right; }
//           .tolip-table td.rate-col { padding-left: 15px; }
//           .tolip-total-row td {
//             border-top: 2px solid #000;
//             border-bottom: 2px solid #000;
//             font-weight: bold;
//             padding: 5px 0;
//             text-align: center;
//           }
//           .tolip-total-row td.right { text-align: right; }

//           /* ── Summary ── */
//           .tolip-summary {
//             width: 100%;
//             border-collapse: collapse;
//             margin-bottom: 30px;
//             font-size: 13px;
//           }
//           .tolip-summary td {
//             padding: 3px 0;
//           }
//           .tolip-summary .sum-label {
//             width: 70%;
//             text-align: center;
//             font-weight: bold;
//             padding-left:20px;
//           }
//           .tolip-summary .sum-value {
//             width: 15%;
//             text-align: right;
//           }
//           .tolip-summary .sum-empty {
//             width: 15%;
//           }
//           .tolip-summary tr.usd-row td.sum-value {
//             border-bottom: 2px solid #000;
//             padding-bottom: 4px;
//           }

//           /* ── Disclaimer & signature ── */
//           .tolip-disclaimer {
//             font-size: 11px;
//             line-height: 1.4;
//             margin-top: 40px;
//             margin-bottom: 30px;
//           }
//           .tolip-signature { margin-top: 20px; width: 150px; }
//           .tolip-signature .sig-title { font-size: 11px; margin-bottom: 20px; font-weight: bold; }
//           .tolip-signature .sig-line  { border-bottom: 1px solid #000; width: 100%; }

//           /* ── Utilities ── */
//           .spacer-line  { margin-bottom: 15px; }
//           .spacer-small { margin-bottom: 8px; }
//           .no-break     { page-break-inside: avoid; break-inside: avoid; }

//           /* ── Print ── */
//           @page { size: A4 portrait; margin: 0; }
//           @media print {
//             body, html { margin: 0 !important; padding: 0 !important; background: #fff !important; }
//             button, nav, header, footer, .no-print { display: none !important; }
//             .tolip-invoice-wrapper { padding: 0 !important; margin: 0 !important; background: none !important; }
//             .tolip-page {
//               margin: 0 !important;
//               box-shadow: none !important;
//               border: none !important;
//             }
//           }
//         `}} />

//         {paginatedData.map((page, idx) => (
//           <div className="tolip-page" key={idx}>

//             {/* Logo */}
//             <div className="tolip-logo">
//               <img src={logo} alt="Tolip Hotel Alexandria" />
//             </div>

//             {/* Header */}
//             <div className="tolip-header">
//               <div className="tolip-left">
//                 <strong>{guest.companyName}</strong><br />
//                 {guest.addressLine1}<br />
//                 {guest.addressLine2}<br />
//                 <div className="spacer-line" />
//                 {guest.guestName}<br />
//                 <div className="spacer-small" />
//                 <strong>INFORMATION INVOICE</strong><br />
//                 Membership No. {guest.membershipNo}<br />
//                 <div className="spacer-line" />
//                 Group Code {guest.groupCode}<br />
//                 Company Name / TA : {guest.taSource}<br />
//                 Source<br />
//               </div>

//               <div className="tolip-right">
//                 <table className="tolip-meta-table">
//                   <tbody>
//                     <tr><td>Room No.</td>   <td>{stayDetails.roomNo}</td></tr>
//                     <tr><td>Arrival</td>    <td>{stayDetails.arrival}</td></tr>
//                     <tr><td>Departure</td>  <td>{stayDetails.departure}</td></tr>
//                     <tr><td colSpan="2"><div className="spacer-small" /></td></tr>
//                     <tr><td>Page No.</td>   <td>{page.pageNo} of {page.totalPages}</td></tr>
//                     <tr><td>Folio No.</td>  <td>{stayDetails.folioNo}</td></tr>
//                     <tr><td>Conf. No.</td>  <td>{stayDetails.confNo}</td></tr>
//                     <tr><td>Cashier No.</td><td>{stayDetails.cashierNo}</td></tr>
//                     <tr><td>User ID</td>    <td>{stayDetails.userId}</td></tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             {/* Sub-header */}
//             <div className="tolip-subheader">
//               <div className="sh-group">Group {guest.group}</div>
//               <div className="sh-center">Thank You For Staying With Us</div>
//               <div className="sh-date">{stayDetails.datePrinted}</div>
//             </div>

//             {/* Transaction table */}
//             <table className="tolip-table">
//               <thead>
//                 <tr>
//                   <th style={{ width: '15%', verticalAlign: 'top' }}>Date</th>
//                   <th style={{ width: '25%', verticalAlign: 'top' }}>Text</th>
//                   <th style={{ width: '30%' }}></th>
//                   <th className="right" style={{ width: '15%', paddingRight: '10px' }}>Debit<br /><span style={{fontWeight:"normal"}}>EGP</span></th>
//                   <th className="right" style={{ width: '15%', paddingRight: '10px' }}>Credit<br /><span style={{fontWeight:"normal"}}>EGP</span></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {page.items.map(row => (
//                   <tr key={row.id}>
//                     <td>{row.date}</td>
//                     <td>{row.text}</td>
//                     <td className="rate-col">{row.rate}</td>
//                     <td className="right">{row.debit}</td>
//                     <td className="right">{row.credit}</td>
//                   </tr>
//                 ))}

//                 {page.showTotals && (
//                   <tr className="tolip-total-row">
//                     <td colSpan="3">Total</td>
//                     <td className="right">{totals.totalDebit}</td>
//                     <td className="right">{totals.totalDebit}</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//             {/* Summary */}
//             {page.showTotals && (
//               <>
//                 <table className="tolip-summary no-break">
//                   <colgroup>
//                     <col style={{ width: '15%' }} />
//                     <col style={{ width: '25%' }} />
//                     <col style={{ width: '30%' }} />
//                     <col style={{ width: '15%' }} />
//                     <col style={{ width: '15%' }} />
//                   </colgroup>
//                   <tbody>
//                     <tr>
//                       <td colSpan="3" className="sum-label">Balance</td>
//                       <td className="sum-value">0.00</td>
//                       <td className="sum-empty"></td>
//                     </tr>
//                     <tr className="usd-row">
//                       <td colSpan="3" className="sum-label" style={{paddingLeft:"45px"}}>Total In USD</td>
//                       <td className="sum-value">{totals.totalUsd}</td>
//                       <td className="sum-empty" style={{borderBottom:"2px solid #000"}}></td>
//                     </tr>
//                   </tbody>
//                 </table>

//                 <div className="tolip-disclaimer no-break">
//                   I agree that my liability for this bill is not waived and I agree to be held personally liable
//                   in the event that the indicated person, company or association fails to pay for any part of
//                   the full amount of these charges.
//                 </div>

//                 <div className="tolip-signature no-break">
//                   <div className="sig-title">Guest Signatures</div>
//                   <div className="sig-line"></div>
//                 </div>
//               </>
//             )}

//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default TolipAlexandriaView;



import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import cairoInvoiceApi from "../../Api/cairoInvoice.api"; // adjust path as needed
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components"; // adjust path as needed
import logo from "../../../public/tolip_alexendria-logo.png"; // adjust path as needed

// ─── Rows per page (tune as needed) ──────────────────────────────────────────
// Keep this at 21-25 max. 32 will physically overflow an A4 page.
const ROWS_PER_PAGE = 21;

const TolipAlexandriaView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);

  const invoiceRef = useRef(null);
  const isPdfDownload = location.pathname.includes("/download-pdf");

  // ── Data loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (invoiceData) {
      setInvoice(transformInvoiceData(invoiceData));
      setLoading(false);
    } else if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceData, invoiceId]);

  // ── Auto-download when URL ends in /download-pdf ────────────────────────────
  useEffect(() => {
    if (isPdfDownload && invoice && invoiceRef.current) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await cairoInvoiceApi.getInvoiceById(invoiceId);
      
      let rawData = response.data || response;
      if (rawData.data) rawData = rawData.data;
      if (rawData.data) rawData = rawData.data;
      
      setInvoice(transformInvoiceData(rawData));
    } catch (err) {
      console.error("Error fetching Tolip Alexandria invoice:", err);
      setError("Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

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

  // ── Transform API payload → local shape ────────
  const transformInvoiceData = (data) => {
    if (!data) return null;

    const addressParts = data.address ? data.address.split(',') : [];
    const addressLine1 = addressParts[0] ? addressParts[0].trim() : "";
    const addressLine2 = addressParts.slice(1).join(',').trim();

    const transactions = [];
    let txId = 1;

    // Map Accommodation Details
    if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
      data.accommodationDetails.forEach(item => {
        transactions.push({
          id: txId++,
          rawDate: new Date(item.date).getTime() || 0,
          date: formatDate(item.date),
          text: item.text || item.description || "Accommodation",
          rate: item.exchangeRateCol || "",
          debit: formatCurrency(item.debitEgp || item.rate || 0),
          credit: formatCurrency(item.creditEgp || 0)
        });
      });
    }

    // Map Other Services
    if (data.otherServices && Array.isArray(data.otherServices)) {
      data.otherServices.forEach(item => {
        transactions.push({
          id: txId++,
          rawDate: new Date(item.date).getTime() || 0,
          date: formatDate(item.date),
          text: item.name || "Service",
          rate: "",
          debit: formatCurrency(item.amount || 0),
          credit: "0.00"
        });
      });
    }

    // Sort combined transactions by Date
    transactions.sort((a, b) => a.rawDate - b.rawDate);

    return {
      hotel: { logo: logo },
      guest: {
        companyName: data.companyName || "",
        addressLine1: addressLine1,
        addressLine2: addressLine2,
        guestName: data.guestName || "",
        membershipNo: data.membershipNo || "",
        groupCode: data.groupCode || "",
        taSource: data.companyName || "",
        group: data.groupCode || ""
      },
      stayDetails: {
        roomNo: data.roomNo || "",
        arrival: formatDate(data.arrivalDate),
        departure: formatDate(data.departureDate),
        folioNo: data.folioNo || "",
        confNo: data.confNo || "",
        cashierNo: data.cashierId || "",
        userId: data.userId || "",
        datePrinted: formatDate(data.invoiceDate)
      },
      transactions: transactions,
      totals: {
        totalDebit: formatCurrency(data.grandTotalEgp),
        totalCredit: "0.00",
        balance: formatCurrency(data.grandTotalEgp),
        totalUsd: formatCurrency(data.balanceUsd)
      }
    };
  };

  // ── Pagination ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!invoice?.transactions) return;

    const tx = invoice.transactions;
    if (tx.length === 0) {
      setPaginatedData([{ items: [], pageNo: 1, totalPages: 1, showTotals: true }]);
      return;
    }

    const totalPages = Math.ceil(tx.length / ROWS_PER_PAGE);
    const pages = [];
    for (let i = 0; i < tx.length; i += ROWS_PER_PAGE) {
      pages.push({
        items:      tx.slice(i, i + ROWS_PER_PAGE),
        pageNo:     Math.floor(i / ROWS_PER_PAGE) + 1,
        totalPages,
        showTotals: i + ROWS_PER_PAGE >= tx.length,
      });
    }
    setPaginatedData(pages);
  }, [invoice]);

  // ── PDF download ───────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(
      document.head.querySelectorAll('link[rel="stylesheet"], style')
    );
    headStyles.forEach(s => s.parentNode?.removeChild(s));

    try {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise(res => { img.onload = res; img.onerror = res; })
        )
      );
      await new Promise(res => setTimeout(res, 500));

      const opt = {
        margin:   0,
        filename: `tolip-alexandria-${invoice.stayDetails?.folioNo || 'invoice'}.pdf`,
        image:    { type: 'jpeg', quality: 3 },
        html2canvas: {
          scale:       4,
          useCORS:     true,
          letterRendering: true,
          scrollY:     0,
          windowWidth: 794,
        },
        jsPDF:     { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all'] },
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

  // ── Empty / loading state ────────────────────────────────────────────────────
  if (!invoice) {
    return (
      <InvoiceTemplate
        loading={loading}
        error={error}
        invoice={invoice}
        onBack={() => navigate("/invoices")}
      >
        <></>
      </InvoiceTemplate>
    );
  }

  const { guest, stayDetails, totals } = invoice;

  // ── Render ───────────────────────────────────────────────────────────────────
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
      <div className="tolip-invoice-wrapper" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{ __html: `
          /* ── Wrapper ── */
          .tolip-invoice-wrapper {
            width: 100%;
            background-color: transparent;
          }
          .tolip-invoice-wrapper * {
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
          }

          /* ── A4 page card ── */
          .tolip-page {
            width: 100%;
            max-width: 794px;
            padding: 4mm 7mm 7mm;
            margin: 0 auto 20px auto;
            background: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            box-sizing: border-box;
            position: relative;
            font-size: 14px;
            line-height: 1.3;
            page-break-after: always;
            break-after: page;
          }

          /* ── Logo ── */
          .tolip-logo {
            display: flex;
            justify-content: flex-end;
            text-align: right;
            margin-bottom: 10px;
          }
          .tolip-logo img {
            width: 160px;
            height: auto;
          }

          /* ── Header two-column block ── */
          .tolip-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0;
            line-height: 1.3;
          }
          .tolip-left  { width: 60%; }
          .tolip-right { width: 35%; }

          .tolip-meta-table { width: 100%; border-collapse: collapse; }
          .tolip-meta-table td { padding: 2px 0; vertical-align: top; }
          .tolip-meta-table td:first-child { width: 45%; }

          /* ── Sub-header bar ── */
          .tolip-subheader {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 10px;
          }
          .tolip-subheader .sh-group  { width: 30%; text-align: left; }
          .tolip-subheader .sh-center { width: 65%; text-align: right; font-size: 13px; }
          .tolip-subheader .sh-date   { width: 30%; text-align: right; padding-right: 25px; }

          /* ── Transaction table ── */
          .tolip-table {
            width: 100%;
            border-collapse: collapse;
          }
          .tolip-table th {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 5px 0;
            font-size: 13px;
            font-weight: bold;
            text-align: left;
          }
          .tolip-table th.right { text-align: right; }
          .tolip-table td {
            padding: 3px 0;
            vertical-align: top;
          }
          .tolip-table td.right    { text-align: right; }
          .tolip-table td.rate-col { padding-left: 15px; }
          .tolip-total-row td {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            font-weight: bold;
            padding: 5px 0;
            text-align: center;
          }
          .tolip-total-row td.right { text-align: right; }

          /* ── Summary ── */
          .tolip-summary {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 13px;
          }
          .tolip-summary td {
            padding: 3px 0;
          }
          .tolip-summary .sum-label {
            width: 70%;
            text-align: center;
            font-weight: bold;
            padding-right:67px;
          }
          .tolip-summary .sum-value {
            width: 15%;
            text-align: center;
          }
          .tolip-summary .sum-empty {
            width: 15%;
          }
          .tolip-summary tr.usd-row td.sum-value {
            border-bottom: 2px solid #000;
            padding-bottom: 4px;
          }

          /* ── Disclaimer & signature ── */
          .tolip-disclaimer {
            font-size: 11px;
            line-height: 1.4;
            margin-top: 40px;
            margin-bottom: 30px;
          }
          .tolip-signature { margin-top: 20px; width: 150px; }
          .tolip-signature .sig-title { font-size: 11px; margin-bottom: 20px; font-weight: bold; }
          .tolip-signature .sig-line  { border-bottom: 1px solid #000; width: 100%; }

          /* ── Utilities ── */
          .spacer-line  { margin-bottom: 15px; }
          .spacer-small { margin-bottom: 8px; }
          .no-break     { page-break-inside: avoid; break-inside: avoid; }

          /* ── Print ── */
          @page { size: A4 portrait; margin: 0; }
          @media print {
            body, html { margin: 0 !important; padding: 0 !important; background: #fff !important; }
            button, nav, header, footer, .no-print { display: none !important; }
            .tolip-invoice-wrapper { padding: 0 !important; margin: 0 !important; background: none !important; }
            .tolip-page {
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: always !important;
              page-break-inside: avoid !important;
              break-after: page !important;
            }
          }
        `}} />

        {paginatedData.map((page, idx) => (
          <div className="tolip-page" key={idx}>

            {/* Logo */}
            <div className="tolip-logo">
              <img src={logo} alt="Tolip Hotel Alexandria" />
            </div>

            {/* Header */}
            <div className="tolip-header">
              <div className="tolip-left">
                <strong>{guest.companyName}</strong><br />
                {guest.addressLine1}<br />
                {guest.addressLine2}<br />
                <div className="spacer-line" />
                {guest.guestName}<br />
                <div className="spacer-small" />
                <strong>INFORMATION INVOICE</strong><br />
                Membership No. {guest.membershipNo}<br />
                <div className="spacer-line" />
                Group Code {guest.groupCode}<br />
                Company Name / TA : {guest.taSource}<br />
                Source<br />
              </div>

              <div className="tolip-right">
                <table className="tolip-meta-table">
                  <tbody>
                    <tr><td>Room No.</td>   <td>{stayDetails.roomNo}</td></tr>
                    <tr><td>Arrival</td>    <td>{stayDetails.arrival}</td></tr>
                    <tr><td>Departure</td>  <td>{stayDetails.departure}</td></tr>
                    <tr><td colSpan="2"><div className="spacer-small" /></td></tr>
                    <tr><td>Page No.</td>   <td>{page.pageNo} of {page.totalPages}</td></tr>
                    <tr><td>Folio No.</td>  <td>{stayDetails.folioNo}</td></tr>
                    <tr><td>Conf. No.</td>  <td>{stayDetails.confNo}</td></tr>
                    <tr><td>Cashier No.</td><td>{stayDetails.cashierNo}</td></tr>
                    <tr><td>User ID</td>    <td>{stayDetails.userId}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-header */}
            <div className="tolip-subheader">
              <div className="sh-group">Group {guest.group}</div>
              <div className="sh-center">Thank You For Staying With Us</div>
              <div className="sh-date">{stayDetails.datePrinted}</div>
            </div>

            {/* Transaction table */}
            <table className="tolip-table">
              <thead>
                <tr>
                  <th style={{ width: '12%', verticalAlign: 'top' }}>Date</th>
                  <th style={{ width: '17%', verticalAlign: 'top' }}>Text</th>
                  <th style={{ width: '15%' }}></th>
                  <th className="right" style={{ width: '15%',paddingRight:"15px" }}>Debit<br /><span style={{fontWeight:"normal"}}>EGP</span></th>
                  <th className="right" style={{ width: '15%', paddingRight: '43px' }}>Credit<br /><span style={{fontWeight:"normal"}}>EGP</span></th>
                </tr>
              </thead>
              <tbody>
                {page.items.map(row => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{row.text}</td>
                    <td className="rate-col">{row.rate}</td>
                    <td className="right">{row.debit}</td>
                    <td className="right" style={{ paddingRight: '43px' }}>{row.credit}</td>
                  </tr>
                ))}

                {page.showTotals && (
                  <tr className="tolip-total-row">
                    <td colSpan="3">Total</td>
                    <td className="right">{totals.totalDebit}</td>
                    <td className="right" style={{paddingRight:"10px"}}>{totals.totalDebit}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Summary */}
            {page.showTotals && (
              <>
                <table className="tolip-summary no-break">
                  <colgroup>
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '25%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td colSpan="3" className="sum-label">Balance</td>
                      <td className="sum-value">0.00</td>
                      <td className="sum-empty"></td>
                    </tr>
                    <tr className="usd-row">
                      <td colSpan="3" className="sum-label" style={{paddingLeft:"22px"}}>Total In USD</td>
                      <td className="sum-value" style={{paddingRight:"20px"}}>{totals.totalUsd}</td>
                      <td className="sum-empty" style={{borderBottom:"2px solid #000",paddingRight:"20px"}}></td>
                    </tr>
                  </tbody>
                </table>

                <div className="tolip-disclaimer no-break">
                  I agree that my liability for this bill is not waived and I agree to be held personally liable
                  in the event that the indicated person, company or association fails to pay for any part of
                  the full amount of these charges.
                </div>

                <div className="tolip-signature no-break">
                  <div className="sig-title">Guest Signatures</div>
                  <div className="sig-line"></div>
                </div>
              </>
            )}

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default TolipAlexandriaView;