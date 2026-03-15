// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// // import invoiceApi from "../../Api/invoice.api";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// import logo from '../../../public/LPBC-logo.png'; // Adjust path as needed

// const LansonPalaceInvoiceView = ({ invoiceData }) => {
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

//   // Dummy data to simulate API response for Lanson Place
//   const dummyData = {
//     guestName: "Mr. Shaban Mohamed Belgasem Ashur",
//     attention: "Mr Shaban Mohamed Belgasem Ashur",
//     company: "",
//     address: "Tripoli",
//     confirmationNo: "57775986-1",
//     roomNo: "703",
//     crsOtaNo: "",
//     taxInvoiceNo: "223801",
//     arrivalDate: "08-JAN-2026",
//     departureDate: "20-JAN-2026",
//     datePrinted: "20-JAN-2026",
//     cashier: "Lindsay Verlinie Anak Barnabas",
//     sstRegNo: "W10-1808-31039762",
//     ttxRegNo: "141-2017-10000377",
//     transactions: [
//       { id: '1', date: '18-JAN-2026', desc: 'Room Package', amount: 438.00 },
//       { id: '2', date: '18-JAN-2026', desc: 'Room - SST', amount: 35.04 },
//       { id: '3', date: '18-JAN-2026', desc: 'Tourism Tax', amount: 10.00 },
//       { id: '4', date: '19-JAN-2026', desc: 'Room Package', amount: 438.00 },
//       { id: '5', date: '19-JAN-2026', desc: 'Room - SST', amount: 35.04 },
//       { id: '6', date: '19-JAN-2026', desc: 'Tourism Tax', amount: 10.00 }
//     ],
//     totals: {
//       totalPayableExcludingTax: 5256.00,
//       serviceTax: 420.48,
//       tourismTax: 120.00,
//       totalAmountPayable: 5796.48,
//       balance: 0.00
//     }
//   };

//   useEffect(() => {
//     if (invoiceData) {
//       setInvoice(invoiceData);
//       setLoading(false);
//     } else {
//       fetchInvoiceData();
//     }
//   }, [invoiceData, invoiceId]);

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
//       await new Promise(resolve => setTimeout(resolve, 500));
//       setInvoice(dummyData);
//     } catch (err) {
//       console.error("Error fetching invoice:", err);
//       setError("Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatCurrency = (val) => {
//     if (val === undefined || val === null || val === "") return "";
//     return parseFloat(val).toLocaleString('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });
//   };

//   // ── Pagination Logic ────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!invoice?.transactions) return;

//     const tx = invoice.transactions;
//     const pages = [];

//     const MAX_ROWS_NORMAL_PAGE = 30; 
//     const MAX_ROWS_WITH_FOOTER = 15; 

//     if (tx.length === 0) {
//       pages.push({ items: [], showTotals: true });
//     } else {
//       for (let i = 0; i < tx.length; i += MAX_ROWS_NORMAL_PAGE) {
//         const chunk = tx.slice(i, i + MAX_ROWS_NORMAL_PAGE);
//         const isLastChunk = i + MAX_ROWS_NORMAL_PAGE >= tx.length;

//         if (isLastChunk) {
//           if (chunk.length > MAX_ROWS_WITH_FOOTER) {
//             const itemsForCurrentPage = chunk.slice(0, chunk.length - 2);
//             const itemsForLastPage = chunk.slice(chunk.length - 2);

//             pages.push({ items: itemsForCurrentPage, showTotals: false });
//             pages.push({ items: itemsForLastPage, showTotals: true });
//           } else {
//             pages.push({ items: chunk, showTotals: true });
//           }
//         } else {
//           pages.push({ items: chunk, showTotals: false });
//         }
//       }
//     }

//     const totalPages = pages.length;
//     pages.forEach((p, idx) => {
//       p.pageNo = idx + 1;
//       p.totalPages = totalPages;
//     });

//     setPaginatedData(pages);
//   }, [invoice]);

//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//     headStyles.forEach(style => {
//       if (style.parentNode) {
//         style.parentNode.removeChild(style);
//       }
//     });

//     try {
//       const images = invoiceRef.current.querySelectorAll('img');
//       await Promise.all(Array.from(images).map(img => {
//         if (img.complete) return Promise.resolve();
//         return new Promise(resolve => {
//           img.onload = resolve;
//           img.onerror = resolve;
//         });
//       }));

//       await new Promise(resolve => setTimeout(resolve, 500));

//       const element = invoiceRef.current;
//       const opt = {
//         margin: 0,
//         filename: `LansonPlace_${invoice.taxInvoiceNo || 'Invoice'}.pdf`,
//         image: { type: 'jpeg', quality: 1 },
//         html2canvas: { 
//           scale: 3, 
//           useCORS: true, 
//           letterRendering: true,
//           scrollY: 0,
//           windowWidth: 794 
//         },
//         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['avoid-all'] }
//       };
      
//       await html2pdf().set(opt).from(element).save();
//       toast.success("PDF Downloaded Successfully");
//     } catch (err) {
//       console.error("PDF Error:", err);
//       toast.error("Failed to generate PDF");
//     } finally {
//       headStyles.forEach(style => {
//         document.head.appendChild(style);
//       });
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   if (!invoice) {
//     return (
//       <InvoiceTemplate loading={loading} error={error} invoice={invoice} onBack={() => navigate("/invoices")}>
//         <></>
//       </InvoiceTemplate>
//     );
//   }

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
//       <div className="lanson-invoice-wrapper" ref={invoiceRef}>
//         <style dangerouslySetInnerHTML={{__html: `
//           .lanson-invoice-wrapper {
//               width: 100%;
//               background-color: transparent;
//           }
//           .lanson-invoice-wrapper * {
//               box-sizing: border-box;
//               font-family: Arial, sans-serif; 
//               font-size: 11px; /* Changed to 11px to match doc standard */
//               color: #000;
//           }
//           .lanson-invoice-wrapper .page {
//               background: white;
//               width: 100%;
//               max-width: 794px;
//               min-height: 1123px; 
//               margin: 0 auto 20px auto;
//               padding: 50px 60px;
//               box-shadow: 0 4px 15px rgba(0,0,0,0.1);
//               position: relative;
//               page-break-after: always;
//               break-after: page;
//           }
          
//           .lanson-invoice-wrapper .logo-container {
//               display: flex;
//               justify-content: center;
//               margin-bottom: 10px;
//           }
//           .lanson-invoice-wrapper .logo-container img {
//               max-width: 200px;
//               height: auto;
//           }

//           .lanson-invoice-wrapper .invoice-title {
//               font-size: 22px;
//               font-weight: bold;
//               margin-bottom: 8px;
//           }
//           .lanson-invoice-wrapper .reg-info {
//               font-size: 10px;
//               line-height: 1.4;
//               margin-bottom: 12px;
//           }

//           .lanson-invoice-wrapper .meta-container {
//               display: flex;
//               justify-content: space-between;
//               margin-bottom: 15px;
//           }
//           .lanson-invoice-wrapper .meta-left { width: 55%; }
//           .lanson-invoice-wrapper .meta-right { width: 45%; }
          
//           .lanson-invoice-wrapper .meta-table {
//               width: 100%;
//               border-collapse: collapse;
//           }
//           .lanson-invoice-wrapper .meta-table td {
//               padding: 0.5px 0;
//               vertical-align: top;
//           }
//           .lanson-invoice-wrapper .meta-table td:nth-child(1) { width: 130px; }
//           .lanson-invoice-wrapper .meta-table td:nth-child(2) { width: 15px; }

//           .lanson-invoice-wrapper .items-table {
//               width: 100%;
//               border-collapse: collapse;
//               margin-bottom: 5px;
//           }
//           .lanson-invoice-wrapper .items-table th {
//               border-top: 2px solid #000;
//               border-bottom: 2px solid #000;
//               padding: 3px 4px;
//               text-align: left;
//               font-weight: bold;
//           }
//           .lanson-invoice-wrapper .items-table th.right, 
//           .lanson-invoice-wrapper .items-table td.right {
//               text-align: right;
//               width: 100px; /* Fixed width to force exact alignment down the page */
//           }
//           .lanson-invoice-wrapper .items-table td {
//               padding: 0px 4px;
//           }
          
//           .lanson-invoice-wrapper .items-table tbody tr:nth-child(even):not(.table-total-row) {
//               background-color: #f4f4f4;
//           }

//           .lanson-invoice-wrapper .table-total-row td {
//               padding-top: 9px;
//           }
//           .lanson-invoice-wrapper .table-total-label {
//               font-weight: bold;
//               padding-right: 20px;
//           }
//           /* Extended total line over the 0.00 */
//           .lanson-invoice-wrapper .amount-total-cell {
//               border-top: 1px solid #000;
//               padding-top: 8px !important;
//           }

//           /* New block wrapper for the bottom right section */
//           .lanson-invoice-wrapper .bottom-right-section {
//               width: 400px; /* Adjusts the width of the whole block */
//               margin-left: auto; /* Pushes everything inside exactly to the right */
//               padding-right: 4px; /* Padding adjustment to perfectly align with upper table */
//           }

//           .lanson-invoice-wrapper .summary-table {
//               width: 100%;
//               border-collapse: collapse;
//               margin-bottom: 40px; /* Space between totals and signature */
//           }
//           .lanson-invoice-wrapper .summary-table td {
//               // padding: 4px 0;
//               text-align: right;
//           }
//           .lanson-invoice-wrapper .summary-table td:first-child {
//               font-weight: bold;
//               padding-right: 20px;
//           }
//           /* Force this column to exactly match the Amount column width above */
//           .lanson-invoice-wrapper .summary-table td:last-child {
//               width: 100px;
//           }

//           .lanson-invoice-wrapper .signature-text {
//               text-align: left;
//               margin-bottom: 60px;
//               line-height: 1.4;
//           }
//           .lanson-invoice-wrapper .signature-line {
//               border-top: 1px solid #000;
//               text-align: center;
//               padding-top: 5px;
//           }

//           .lanson-invoice-wrapper .footer-stamp {
//               position: absolute;
//               bottom: 50px;
//               left: 60px;
//               font-size: 9px; /* Made smaller than body text */
//               line-height: 1.4;
//           }
//           .lanson-invoice-wrapper .footer-stamp strong {
//               font-size: 10px;
//               font-weight: bold;
//           }

//           @page { size: A4 portrait; margin: 0; }
//           @media print {
//               body, html { 
//                   // margin: 0 !important; 
//                   // padding: 0 !important; 
//                   background-color: #fff !important; 
//               }
//               button, nav, header, footer, .no-print { 
//                   display: none !important; 
//               }
//               .lanson-invoice-wrapper {
//                   // padding: 0 !important; 
//                   // margin: 0 !important;
//                   background: none !important;
//               }
//               .lanson-invoice-wrapper .page {
//                   // margin: 0 !important;
//                   padding: 9mm 9mm !important;
//                   box-shadow: none !important;
//                   border: none !important;
//                   height: auto !important;
//                   min-height: auto !important;
//                   page-break-after: always !important;
//                   page-break-inside: avoid !important;
//                   break-after: page !important;
//               }
//               .lanson-invoice-wrapper .footer-stamp {
//                   position: static;
//                   margin-top: 40px;
//               }
//           }
//         `}} />

//         {paginatedData.map((page, index) => (
//           <div className="page" key={`page-${index}`}>
            
//             <div className="logo-container">
//               <img src={logo} alt="Lanson Place Logo" />
//             </div>

//             <div className="invoice-title">Tax Invoice</div>
//             <div className="reg-info">
//               SST Reg No.: {invoice.sstRegNo}<br />
//               TTX Reg No.: {invoice.ttxRegNo}
//             </div>

//             <div className="meta-container">
//               <div className="meta-left">
//                 <table className="meta-table">
//                   <tbody>
//                     <tr>
//                       <td>Attention</td>
//                       <td>:</td>
//                       <td>{invoice.attention}</td>
//                     </tr>
//                     <tr>
//                       <td>Company</td>
//                       <td>:</td>
//                       <td>{invoice.company}</td>
//                     </tr>
//                     <tr>
//                       <td>Address</td>
//                       <td>:</td>
//                       <td>{invoice.address}</td>
//                     </tr>
//                     <tr>
//                       <td>Guest Name</td>
//                       <td>:</td>
//                       <td>{invoice.guestName}</td>
//                     </tr>
//                     <tr>
//                       <td>Confirmation No.</td>
//                       <td>:</td>
//                       <td>{invoice.confirmationNo}</td>
//                     </tr>
//                     <tr>
//                       <td>Room No.</td>
//                       <td>:</td>
//                       <td>{invoice.roomNo}</td>
//                     </tr>
//                     <tr>
//                       <td>CRS/OTA No.</td>
//                       <td>:</td>
//                       <td>{invoice.crsOtaNo}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//               <div className="meta-right">
//                 <table className="meta-table">
//                   <tbody>
//                     <tr>
//                       <td>Tax Invoice No.</td>
//                       <td>:</td>
//                       <td>{invoice.taxInvoiceNo}</td>
//                     </tr>
//                     <tr>
//                       <td>Arrival</td>
//                       <td>:</td>
//                       <td>{invoice.arrivalDate}</td>
//                     </tr>
//                     <tr>
//                       <td>Departure</td>
//                       <td>:</td>
//                       <td>{invoice.departureDate}</td>
//                     </tr>
//                     <tr>
//                       <td>Date Printed</td>
//                       <td>:</td>
//                       <td>{invoice.datePrinted}</td>
//                     </tr>
//                     <tr>
//                       <td>Cashier</td>
//                       <td>:</td>
//                       <td>
//                         {invoice.cashier.split(' ').slice(0, 3).join(' ')}<br />
//                         {invoice.cashier.split(' ').slice(3).join(' ')}
//                       </td>
//                     </tr>
//                     <tr>
//                       <td>Page No.</td>
//                       <td>:</td>
//                       <td>{page.pageNo}/{page.totalPages}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <table className="items-table">
//               <thead>
//                 <tr>
//                   <th style={{width:"18%"}}>Date</th>
//                   <th>Description</th>
//                   <th className="right" style={{width:"18%"}}>Amount</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {page.items.map((item, idx) => (
//                   <tr key={item.id || idx}>
//                     <td>{item.date}</td>
//                     <td>{item.desc}</td>
//                     <td className="right">{formatCurrency(item.amount)}</td>
//                   </tr>
//                 ))}
                
//                 {/* Inner Table Total */}
//                 {page.showTotals && (
//                   <tr className="table-total-row">
//                     <td></td>
//                     <td className="right table-total-label">Total</td>
//                     <td className="right amount-total-cell">
//                       0.00
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//             {/* NEW: Wrapper specifically groups the Totals and Signature Block */}
//             {page.showTotals && (
//               <div className="bottom-right-section">
                
//                 <table className="summary-table">
//                   <tbody>
//                     <tr>
//                       <td>Total Amount Payable Excluding Tax</td>
//                       <td>{formatCurrency(invoice.totals.totalPayableExcludingTax)}</td>
//                     </tr>
//                     <tr>
//                       <td>Service Tax</td>
//                       <td>{formatCurrency(invoice.totals.serviceTax)}</td>
//                     </tr>
//                     <tr>
//                       <td>Tourism Tax</td>
//                       <td>{formatCurrency(invoice.totals.tourismTax)}</td>
//                     </tr>
//                     <tr>
//                       <td>Total Amount Payable</td>
//                       <td>{formatCurrency(invoice.totals.totalAmountPayable)}</td>
//                     </tr>
//                     <tr>
//                       <td>Balance</td>
//                       <td>{formatCurrency(invoice.totals.balance)}</td>
//                     </tr>
//                   </tbody>
//                 </table>

//                 <div className="signature-box" style={{paddingLeft:"140px"}}>
//                   <div className="signature-text">
//                     Regardless of charge instruction, I agree to be held<br />
//                     personally liable for paying/reimbursing of the above<br />
//                     amounts.
//                   </div>
//                   <div className="signature-line">Signature</div>
//                 </div>

//               </div>
//             )}

//             <div className="footer-stamp">
//               <strong>Lanson Place Bukit Ceylon</strong><br />
//               address | 10, Jalan Ceylon Kuala Lumpur Malaysia 50200<br />
//               phone | +60 3-2725 8888<br />
//               fax | +60 3 2725 8899<br />
//               web | https://www.lansonplace.com/bukitceylon
//             </div>
            
//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default LansonPalaceInvoiceView;



// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// // import invoiceApi from "../../Api/invoice.api";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// import logo from '../../../public/LPBC-logo.png'; // Adjust path as needed

// const LansonPalaceInvoiceView = ({ invoiceData }) => {
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

//   // Dummy data to simulate API response for Lanson Place
//   const dummyData = {
//     guestName: "Mr. Shaban Mohamed Belgasem Ashur",
//     attention: "Mr Shaban Mohamed Belgasem Ashur",
//     company: "",
//     address: "Tripoli",
//     confirmationNo: "57775986-1",
//     roomNo: "703",
//     crsOtaNo: "",
//     taxInvoiceNo: "223801",
//     arrivalDate: "08-JAN-2026",
//     departureDate: "20-JAN-2026",
//     datePrinted: "20-JAN-2026",
//     cashier: "Lindsay Verlinie Anak Barnabas",
//     sstRegNo: "W10-1808-31039762",
//     ttxRegNo: "141-2017-10000377",
//     transactions: [
//       { id: '1', date: '18-JAN-2026', desc: 'Room Package', amount: 438.00 },
//       { id: '2', date: '18-JAN-2026', desc: 'Room - SST', amount: 35.04 },
//       { id: '3', date: '18-JAN-2026', desc: 'Tourism Tax', amount: 10.00 },
//       { id: '4', date: '19-JAN-2026', desc: 'Room Package', amount: 438.00 },
//       { id: '5', date: '19-JAN-2026', desc: 'Room - SST', amount: 35.04 },
//       { id: '6', date: '19-JAN-2026', desc: 'Tourism Tax', amount: 10.00 }
//     ],
//     totals: {
//       totalPayableExcludingTax: 5256.00,
//       serviceTax: 420.48,
//       tourismTax: 120.00,
//       totalAmountPayable: 5796.48,
//       balance: 0.00
//     }
//   };

//   useEffect(() => {
//     if (invoiceData) {
//       setInvoice(invoiceData);
//       setLoading(false);
//     } else {
//       fetchInvoiceData();
//     }
//   }, [invoiceData, invoiceId]);

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
//       await new Promise(resolve => setTimeout(resolve, 500));
//       setInvoice(dummyData);
//     } catch (err) {
//       console.error("Error fetching invoice:", err);
//       setError("Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatCurrency = (val) => {
//     if (val === undefined || val === null || val === "") return "";
//     return parseFloat(val).toLocaleString('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });
//   };

//   // ── Pagination Logic ────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!invoice?.transactions) return;

//     const tx = invoice.transactions;
//     const pages = [];

//     const MAX_ROWS_NORMAL_PAGE = 30; 
//     const MAX_ROWS_WITH_FOOTER = 15; 

//     if (tx.length === 0) {
//       pages.push({ items: [], showTotals: true });
//     } else {
//       for (let i = 0; i < tx.length; i += MAX_ROWS_NORMAL_PAGE) {
//         const chunk = tx.slice(i, i + MAX_ROWS_NORMAL_PAGE);
//         const isLastChunk = i + MAX_ROWS_NORMAL_PAGE >= tx.length;

//         if (isLastChunk) {
//           if (chunk.length > MAX_ROWS_WITH_FOOTER) {
//             const itemsForCurrentPage = chunk.slice(0, chunk.length - 2);
//             const itemsForLastPage = chunk.slice(chunk.length - 2);

//             pages.push({ items: itemsForCurrentPage, showTotals: false });
//             pages.push({ items: itemsForLastPage, showTotals: true });
//           } else {
//             pages.push({ items: chunk, showTotals: true });
//           }
//         } else {
//           pages.push({ items: chunk, showTotals: false });
//         }
//       }
//     }

//     const totalPages = pages.length;
//     pages.forEach((p, idx) => {
//       p.pageNo = idx + 1;
//       p.totalPages = totalPages;
//     });

//     setPaginatedData(pages);
//   }, [invoice]);

//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//     headStyles.forEach(style => {
//       if (style.parentNode) {
//         style.parentNode.removeChild(style);
//       }
//     });

//     try {
//       const images = invoiceRef.current.querySelectorAll('img');
//       await Promise.all(Array.from(images).map(img => {
//         if (img.complete) return Promise.resolve();
//         return new Promise(resolve => {
//           img.onload = resolve;
//           img.onerror = resolve;
//         });
//       }));

//       await new Promise(resolve => setTimeout(resolve, 500));

//       const element = invoiceRef.current;
//       const opt = {
//         margin: 0,
//         filename: `LansonPlace_${invoice.taxInvoiceNo || 'Invoice'}.pdf`,
//         image: { type: 'jpeg', quality: 1 },
//         html2canvas: { 
//           scale: 3, // High scale for crisp text
//           useCORS: true, 
//           letterRendering: true,
//           scrollY: 0,
//           windowWidth: 794 // Ensures it renders as A4 width exactly
//         },
//         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['avoid-all'] }
//       };
      
//       await html2pdf().set(opt).from(element).save();
//       toast.success("PDF Downloaded Successfully");
//     } catch (err) {
//       console.error("PDF Error:", err);
//       toast.error("Failed to generate PDF");
//     } finally {
//       headStyles.forEach(style => {
//         document.head.appendChild(style);
//       });
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   if (!invoice) {
//     return (
//       <InvoiceTemplate loading={loading} error={error} invoice={invoice} onBack={() => navigate("/invoices")}>
//         <></>
//       </InvoiceTemplate>
//     );
//   }

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
//       <div className="lanson-invoice-wrapper" ref={invoiceRef}>
//         <style dangerouslySetInnerHTML={{__html: `
//           .lanson-invoice-wrapper {
//               width: 100%;
//               background-color: transparent;
//           }
//           .lanson-invoice-wrapper * {
//               box-sizing: border-box;
//               font-family: Arial, sans-serif; 
//               font-size: 11px;
//               color: #000;
//           }
//           .lanson-invoice-wrapper .page {
//               background: white;
//               width: 100%;
//               max-width: 794px;
//               min-height: 1123px; 
//               margin: 0 auto 20px auto;
//               /* This padding will now strictly be kept during PDF generation */
//               padding: 50px 60px; 
//               box-shadow: 0 4px 15px rgba(0,0,0,0.1);
//               position: relative;
//               page-break-after: always;
//               break-after: page;
//           }
          
//           .lanson-invoice-wrapper .logo-container {
//               display: flex;
//               justify-content: center;
//               margin-bottom: 30px; /* Restored spacing under logo */
//           }
//           .lanson-invoice-wrapper .logo-container img {
//               max-width: 200px;
//               height: auto;
//           }

//           .lanson-invoice-wrapper .invoice-title {
//               font-size: 22px;
//               font-weight: bold;
//               margin-bottom: 8px;
//           }
//           .lanson-invoice-wrapper .reg-info {
//               font-size: 10px;
//               line-height: 1.4;
//               margin-bottom: 25px; /* Restored spacing */
//           }

//           .lanson-invoice-wrapper .meta-container {
//               display: flex;
//               justify-content: space-between;
//               margin-bottom: 25px; /* Restored spacing */
//           }
//           .lanson-invoice-wrapper .meta-left { width: 55%; }
//           .lanson-invoice-wrapper .meta-right { width: 45%; }
          
//           .lanson-invoice-wrapper .meta-table {
//               width: 100%;
//               border-collapse: collapse;
//           }
//           .lanson-invoice-wrapper .meta-table td {
//               padding: 2.5px 0; /* Restored line height spacing for meta info */
//               vertical-align: top;
//           }
//           .lanson-invoice-wrapper .meta-table td:nth-child(1) { width: 130px; }
//           .lanson-invoice-wrapper .meta-table td:nth-child(2) { width: 15px; }

//           .lanson-invoice-wrapper .items-table {
//               width: 100%;
//               border-collapse: collapse;
//               margin-bottom: 15px;
//           }
//           .lanson-invoice-wrapper .items-table th {
//               border-top: 2px solid #000;
//               border-bottom: 2px solid #000;
//               padding: 8px 4px; /* Restored comfortable header padding */
//               text-align: left;
//               font-weight: bold;
//           }
//           .lanson-invoice-wrapper .items-table th.right, 
//           .lanson-invoice-wrapper .items-table td.right {
//               text-align: right;
//               width: 100px; 
//           }
//           .lanson-invoice-wrapper .items-table td {
//               padding: 5px 4px; /* THIS FIXES THE SQUEEZED ROWS */
//           }
          
//           .lanson-invoice-wrapper .items-table tbody tr:nth-child(even):not(.table-total-row) {
//               background-color: #f4f4f4;
//               -webkit-print-color-adjust: exact;
//               print-color-adjust: exact;
//           }

//           .lanson-invoice-wrapper .table-total-row td {
//               padding-top: 15px; /* Added proper space before total line */
//           }
//           .lanson-invoice-wrapper .table-total-label {
//               font-weight: bold;
//               padding-right: 20px;
//           }
//           .lanson-invoice-wrapper .amount-total-cell {
//               border-top: 1px solid #000;
//               padding-top: 8px !important;
//           }

//           .lanson-invoice-wrapper .bottom-right-section {
//               width: 400px;
//               margin-left: auto;
//               padding-right: 4px;
//           }

//           .lanson-invoice-wrapper .summary-table {
//               width: 100%;
//               border-collapse: collapse;
//               margin-bottom: 40px;
//           }
//           .lanson-invoice-wrapper .summary-table td {
//               padding: 4px 0; /* THIS FIXES SQUEEZED TOTALS */
//               text-align: right;
//           }
//           .lanson-invoice-wrapper .summary-table td:first-child {
//               font-weight: bold;
//               padding-right: 20px;
//           }
//           .lanson-invoice-wrapper .summary-table td:last-child {
//               width: 100px;
//           }

//           .lanson-invoice-wrapper .signature-text {
//               text-align: left;
//               margin-bottom: 60px;
//               line-height: 1.4;
//           }
//           .lanson-invoice-wrapper .signature-line {
//               border-top: 1px solid #000;
//               text-align: center;
//               padding-top: 5px;
//           }

//           .lanson-invoice-wrapper .footer-stamp {
//               position: absolute;
//               bottom: 50px;
//               left: 60px;
//               font-size: 9px;
//               line-height: 1.4;
//           }
//           .lanson-invoice-wrapper .footer-stamp strong {
//               font-size: 10px;
//               font-weight: bold;
//           }

//           @page { size: A4 portrait; margin: 0; }
//           @media print {
//               body, html { 
//                   background-color: #fff !important; 
//               }
//               button, nav, header, footer, .no-print { 
//                   display: none !important; 
//               }
//               .lanson-invoice-wrapper .page {
//                   margin: 0 !important;
//                   /* REMOVED PADDING OVERRIDES HERE SO IT KEEPS THE 50px 60px */
//                   box-shadow: none !important;
//                   border: none !important;
//                   height: auto !important;
//                   min-height: auto !important;
//                   page-break-after: always !important;
//                   page-break-inside: avoid !important;
//                   break-after: page !important;
//               }
//               .lanson-invoice-wrapper .footer-stamp {
//                   position: static;
//                   margin-top: 40px;
//               }
//           }
//         `}} />

//         {paginatedData.map((page, index) => (
//           <div className="page" key={`page-${index}`}>
            
//             <div className="logo-container">
//               <img src={logo} alt="Lanson Place Logo" />
//             </div>

//             <div className="invoice-title">Tax Invoice</div>
//             <div className="reg-info">
//               SST Reg No.: {invoice.sstRegNo}<br />
//               TTX Reg No.: {invoice.ttxRegNo}
//             </div>

//             <div className="meta-container">
//               <div className="meta-left">
//                 <table className="meta-table">
//                   <tbody>
//                     <tr>
//                       <td>Attention</td>
//                       <td>:</td>
//                       <td>{invoice.attention}</td>
//                     </tr>
//                     <tr>
//                       <td>Company</td>
//                       <td>:</td>
//                       <td>{invoice.company}</td>
//                     </tr>
//                     <tr>
//                       <td>Address</td>
//                       <td>:</td>
//                       <td>{invoice.address}</td>
//                     </tr>
//                     <tr>
//                       <td>Guest Name</td>
//                       <td>:</td>
//                       <td>{invoice.guestName}</td>
//                     </tr>
//                     <tr>
//                       <td>Confirmation No.</td>
//                       <td>:</td>
//                       <td>{invoice.confirmationNo}</td>
//                     </tr>
//                     <tr>
//                       <td>Room No.</td>
//                       <td>:</td>
//                       <td>{invoice.roomNo}</td>
//                     </tr>
//                     <tr>
//                       <td>CRS/OTA No.</td>
//                       <td>:</td>
//                       <td>{invoice.crsOtaNo}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//               <div className="meta-right">
//                 <table className="meta-table">
//                   <tbody>
//                     <tr>
//                       <td>Tax Invoice No.</td>
//                       <td>:</td>
//                       <td>{invoice.taxInvoiceNo}</td>
//                     </tr>
//                     <tr>
//                       <td>Arrival</td>
//                       <td>:</td>
//                       <td>{invoice.arrivalDate}</td>
//                     </tr>
//                     <tr>
//                       <td>Departure</td>
//                       <td>:</td>
//                       <td>{invoice.departureDate}</td>
//                     </tr>
//                     <tr>
//                       <td>Date Printed</td>
//                       <td>:</td>
//                       <td>{invoice.datePrinted}</td>
//                     </tr>
//                     <tr>
//                       <td>Cashier</td>
//                       <td>:</td>
//                       <td>
//                         {invoice.cashier.split(' ').slice(0, 3).join(' ')}<br />
//                         {invoice.cashier.split(' ').slice(3).join(' ')}
//                       </td>
//                     </tr>
//                     <tr>
//                       <td>Page No.</td>
//                       <td>:</td>
//                       <td>{page.pageNo}/{page.totalPages}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <table className="items-table">
//               <thead>
//                 <tr>
//                   <th style={{width:"18%"}}>Date</th>
//                   <th>Description</th>
//                   <th className="right" style={{width:"18%"}}>Amount</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {page.items.map((item, idx) => (
//                   <tr key={item.id || idx}>
//                     <td>{item.date}</td>
//                     <td>{item.desc}</td>
//                     <td className="right">{formatCurrency(item.amount)}</td>
//                   </tr>
//                 ))}
                
//                 {/* Inner Table Total */}
//                 {page.showTotals && (
//                   <tr className="table-total-row">
//                     <td></td>
//                     <td className="right table-total-label">Total</td>
//                     <td className="right amount-total-cell">
//                       0.00
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//             {/* Wrapper specifically groups the Totals and Signature Block */}
//             {page.showTotals && (
//               <div className="bottom-right-section">
                
//                 <table className="summary-table">
//                   <tbody>
//                     <tr>
//                       <td>Total Amount Payable Excluding Tax</td>
//                       <td>{formatCurrency(invoice.totals.totalPayableExcludingTax)}</td>
//                     </tr>
//                     <tr>
//                       <td>Service Tax</td>
//                       <td>{formatCurrency(invoice.totals.serviceTax)}</td>
//                     </tr>
//                     <tr>
//                       <td>Tourism Tax</td>
//                       <td>{formatCurrency(invoice.totals.tourismTax)}</td>
//                     </tr>
//                     <tr>
//                       <td>Total Amount Payable</td>
//                       <td>{formatCurrency(invoice.totals.totalAmountPayable)}</td>
//                     </tr>
//                     <tr>
//                       <td>Balance</td>
//                       <td>{formatCurrency(invoice.totals.balance)}</td>
//                     </tr>
//                   </tbody>
//                 </table>

//                 <div className="signature-box" style={{paddingLeft:"140px"}}>
//                   <div className="signature-text">
//                     Regardless of charge instruction, I agree to be held<br />
//                     personally liable for paying/reimbursing of the above<br />
//                     amounts.
//                   </div>
//                   <div className="signature-line">Signature</div>
//                 </div>

//               </div>
//             )}

//             <div className="footer-stamp">
//               <strong>Lanson Place Bukit Ceylon</strong><br />
//               address | 10, Jalan Ceylon Kuala Lumpur Malaysia 50200<br />
//               phone | +60 3-2725 8888<br />
//               fax | +60 3 2725 8899<br />
//               web | https://www.lansonplace.com/bukitceylon
//             </div>
            
//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default LansonPalaceInvoiceView;




// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// import logo from '../../../public/LPBC-logo.png';

// // ─────────────────────────────────────────────────────────────────────────────
// // FORMAT DATE  →  "03-MAR-2026"
// // ─────────────────────────────────────────────────────────────────────────────
// const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// const formatDate = (dateStr) => {
//   if (!dateStr) return "";
//   try {
//     // Works for "2026-03-03", "2026-03-03T00:00:00", "08-JAN-2026" (pass-through)
//     const d = new Date(dateStr);
//     if (isNaN(d.getTime())) return dateStr; // already formatted or invalid
//     const dd  = String(d.getDate()).padStart(2, '0');
//     const mmm = MONTHS[d.getMonth()];
//     const yyyy = d.getFullYear();
//     return `${dd}-${mmm}-${yyyy}`;
//   } catch {
//     return dateStr;
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // MAP API DATA → component shape
// // ─────────────────────────────────────────────────────────────────────────────
// const mapApiDataToInvoice = (data) => {
//   const transactions = [
//     ...(data.accommodationDetails || []).map(item => ({
//       id: `acc-${item.day}-${item.description}`,
//       date: formatDate(item.date),       // ← formatted
//       desc: item.description,
//       amount: item.amount,
//     })),
//     ...(data.otherServices || []).map((item, idx) => ({
//       id: `svc-${idx}`,
//       date: formatDate(item.date),       // ← formatted
//       desc: item.description,
//       amount: item.amount,
//     })),
//   ];

//   return {
//     referenceNo:     data.referenceNo   || "",
//     guestName:      data.guestName     || "",
//     attention:      data.guestName     || "",
//     company:        data.companyName   || "",
//     address:        data.address       || "",
//     confirmationNo: data.confNo        || "",
//     roomNo:         data.roomNo        || "",
//     crsOtaNo:       data.crsNo         || "",
//     taxInvoiceNo:   data.invoiceNo     || data.referenceNo || "",
//     arrivalDate:    formatDate(data.arrivalDate),    // ← formatted
//     departureDate:  formatDate(data.departureDate),  // ← formatted
//     datePrinted:    formatDate(data.invoiceDate),    // ← formatted
//     cashier:        data.cashierName   || "",
//     sstRegNo:       data.sstRegNo      || "",
//     ttxRegNo:       data.ttxRegNo      || "",
//     transactions,
//     totals: {
//       totalPayableExcludingTax: data.baseTaxableAmount || 0,
//       serviceTax:               data.totalSst8Percent  || 0,
//       tourismTax:               data.totalTourismTax   || 0,
//       totalAmountPayable:       data.grandTotalMyr     || 0,
//       balance:                  0,
//     },
//   };
// };

// const LansonPalaceInvoiceView = ({ invoiceData }) => {
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

//   const dummyData = {
//     guestName: "Mr. Shaban Mohamed Belgasem Ashur",
//     attention: "Mr Shaban Mohamed Belgasem Ashur",
//     company: "",
//     address: "Tripoli",
//     confirmationNo: "57775986-1",
//     roomNo: "703",
//     crsOtaNo: "",
//     taxInvoiceNo: "223801",
//     arrivalDate: "08-JAN-2026",
//     departureDate: "20-JAN-2026",
//     datePrinted: "20-JAN-2026",
//     cashier: "Lindsay Verlinie Anak Barnabas",
//     sstRegNo: "W10-1808-31039762",
//     ttxRegNo: "141-2017-10000377",
//     transactions: [
//       { id: '1', date: '18-JAN-2026', desc: 'Room Package', amount: 438.00 },
//       { id: '2', date: '18-JAN-2026', desc: 'Room - SST', amount: 35.04 },
//       { id: '3', date: '18-JAN-2026', desc: 'Tourism Tax', amount: 10.00 },
//       { id: '4', date: '19-JAN-2026', desc: 'Room Package', amount: 438.00 },
//       { id: '5', date: '19-JAN-2026', desc: 'Room - SST', amount: 35.04 },
//       { id: '6', date: '19-JAN-2026', desc: 'Tourism Tax', amount: 10.00 }
//     ],
//     totals: {
//       totalPayableExcludingTax: 5256.00,
//       serviceTax: 420.48,
//       tourismTax: 120.00,
//       totalAmountPayable: 5796.48,
//       balance: 0.00
//     }
//   };

//   useEffect(() => {
//     if (invoiceData) {
//       setInvoice(mapApiDataToInvoice(invoiceData));
//       setLoading(false);
//     } else {
//       fetchInvoiceData();
//     }
//   }, [invoiceData, invoiceId]);

//   useEffect(() => {
//     if (isPdfDownload && invoice && invoiceRef.current) {
//       const timer = setTimeout(async () => {
//         await handleDownloadPDF();
//         navigate("/invoices", { replace: true });
//       }, 800);
//       return () => clearTimeout(timer);
//     }
//   }, [isPdfDownload, invoice]);

//   const fetchInvoiceData = async () => {
//     try {
//       setLoading(true);
//       await new Promise(resolve => setTimeout(resolve, 500));
//       setInvoice(dummyData);
//     } catch (err) {
//       console.error("Error fetching invoice:", err);
//       setError("Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatCurrency = (val) => {
//     if (val === undefined || val === null || val === "") return "";
//     return parseFloat(val).toLocaleString('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });
//   };

//   // ── Pagination ────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!invoice?.transactions) return;

//     const tx = invoice.transactions;
//     const pages = [];
//     const MAX_ROWS_NORMAL_PAGE = 30;
//     const MAX_ROWS_WITH_FOOTER = 15;

//     if (tx.length === 0) {
//       pages.push({ items: [], showTotals: true });
//     } else {
//       for (let i = 0; i < tx.length; i += MAX_ROWS_NORMAL_PAGE) {
//         const chunk = tx.slice(i, i + MAX_ROWS_NORMAL_PAGE);
//         const isLastChunk = i + MAX_ROWS_NORMAL_PAGE >= tx.length;
//         if (isLastChunk) {
//           if (chunk.length > MAX_ROWS_WITH_FOOTER) {
//             pages.push({ items: chunk.slice(0, chunk.length - 2), showTotals: false });
//             pages.push({ items: chunk.slice(chunk.length - 2), showTotals: true });
//           } else {
//             pages.push({ items: chunk, showTotals: true });
//           }
//         } else {
//           pages.push({ items: chunk, showTotals: false });
//         }
//       }
//     }

//     const totalPages = pages.length;
//     pages.forEach((p, idx) => { p.pageNo = idx + 1; p.totalPages = totalPages; });
//     setPaginatedData(pages);
//   }, [invoice]);

//   // ── PDF Download ──────────────────────────────────────────────────────────
//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//     headStyles.forEach(s => { if (s.parentNode) s.parentNode.removeChild(s); });

//     const pageEls = invoiceRef.current.querySelectorAll('.lp-page');
//     pageEls.forEach(p => {
//       p.style.minHeight    = 'auto';
//       p.style.boxShadow    = 'none';
//       p.style.marginBottom = '0';
//     });

//     try {
//       const images = invoiceRef.current.querySelectorAll('img');
//       await Promise.all(Array.from(images).map(img => {
//         if (img.complete) return Promise.resolve();
//         return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
//       }));

//       await new Promise(resolve => setTimeout(resolve, 500));

//       const opt = {
//         margin: 0,
//         filename: `${invoice.referenceNo }.pdf`,
//         image: { type: 'jpeg', quality: 3 },
//         html2canvas: {
//           scale: 4,
//           useCORS: true,
//           letterRendering: true,
//           scrollY: 0,
//           windowWidth: 794,
//         },
//         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['css', 'legacy'] },
//       };

//       await html2pdf().set(opt).from(invoiceRef.current).save();
//       toast.success("PDF Downloaded Successfully");
//     } catch (err) {
//       console.error("PDF Error:", err);
//       toast.error("Failed to generate PDF");
//     } finally {
//       pageEls.forEach(p => {
//         p.style.minHeight    = '';
//         p.style.boxShadow    = '';
//         p.style.marginBottom = '';
//       });
//       headStyles.forEach(s => document.head.appendChild(s));
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   if (!invoice) {
//     return (
//       <InvoiceTemplate loading={loading} error={error} invoice={invoice} onBack={() => navigate("/invoices")}>
//         <></>
//       </InvoiceTemplate>
//     );
//   }

//   const cashierParts = (invoice.cashier || '').split(' ');
//   const cashierLine1 = cashierParts.slice(0, 3).join(' ');
//   const cashierLine2 = cashierParts.slice(3).join(' ');

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
//       <style>{`
//         @page { size: A4 portrait; margin: 0; }

//         .lp-wrapper { width: 100%; background-color: transparent; }
//         .lp-wrapper * {
//           box-sizing: border-box;
// font-family: Tahoma, Verdana, sans-serif;
//           font-size: 12px;
//           color: #000;
//         }

//         .lp-page {
//           background: white;
//           width: 100%;
//           max-width: 794px;
//           min-height: 1123px;
//           margin: 0 auto 20px auto;
//           padding: 50px 60px 40px 60px;
//           box-shadow: 0 4px 15px rgba(0,0,0,0.1);
//           display: flex;
//           flex-direction: column;
//         }
//         .lp-page:not(:last-child) { page-break-after: always; break-after: page; }
//         .lp-page:last-child        { page-break-after: avoid;  break-after: avoid; margin-bottom: 0; }

//         .lp-content { flex: 1; }

//         .lp-footer {
//           margin-top: auto;
//           padding-top: 0;
//           font-size: 10.5px;
//           line-height: 1.6;
//           color: #000;
//         }
//         .lp-footer strong { font-size: 10px; font-weight: bold; display: block; margin-bottom: 1px; }

//         .lp-logo-container { display: flex; justify-content: center; margin-bottom: 10px; }
//         .lp-logo-container img { max-width: 200px; height: auto; }

//         .lp-invoice-title { font-size: 22px; font-weight: bold;  }
//         .lp-reg-info { font-size: 10px; line-height: 1.4; margin-bottom: 12px; }

//         .lp-meta-container { display: flex; justify-content: space-between; margin-bottom: 15px; gap: 25px; }
//         .lp-meta-left  { width: 55%; }
//         .lp-meta-right { width: 45%; }

//         .lp-meta-table { width: 100%; border-collapse: collapse; }
//         .lp-meta-table td { padding: 0.5px 0; vertical-align: top; }
//         .lp-meta-table td:nth-child(1) { width: 130px; }
//         .lp-meta-table td:nth-child(2) { width: 15px; }

//         .lp-items-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
//         .lp-items-table th {
//           border-top: 2px solid #000;
//           border-bottom: 2px solid #000;
//           padding: 6px 4px;
//           text-align: left;
//           font-weight: bold;
//         }
//         .lp-items-table th.right,
//         .lp-items-table td.right { text-align: right; width: 100px; }
//         .lp-items-table td { padding: 0px 4px; }
//         .lp-items-table tbody tr:nth-child(even):not(.tbl-total-row) {
//           background-color: #f4f4f4;
//           -webkit-print-color-adjust: exact;
//           print-color-adjust: exact;
//         }

//         .tbl-total-row td  { padding-top: 9px; }
//         .tbl-total-label   { font-weight: bold; padding-right: 20px; }
//         .amount-total-cell { border-top: 1px solid #000; padding-top: 8px !important; }

//         .lp-bottom-right { width: 400px; margin-left: auto; padding-right: 4px; }

//         .lp-summary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
//         .lp-summary-table td              { text-align: right; padding: 1px 0; }
//         .lp-summary-table td:first-child  { font-weight: bold; padding-right: 20px; }
//         .lp-summary-table td:last-child   { width: 100px; }

//         .lp-sig-text { text-align: left; margin-bottom: 60px; line-height: 1.4; }
//         .lp-sig-line { border-top: 1px solid #000; text-align: center; padding-top: 5px; }

//         @media print {
//           body, html { background-color: #fff !important; }
//           button, nav, header, footer, .no-print { display: none !important; }
//           .lp-wrapper { background: none !important; }
//           .lp-page {
//             margin: 0 !important;
//             padding: 50px 60px 40px 60px !important;
//             box-shadow: none !important;
//             border: none !important;
//             width: 794px !important;
//             max-width: 794px !important;
//             min-height: 1123px !important;
//             display: flex !important;
//             flex-direction: column !important;
//           }
//           .lp-page:not(:last-child) { page-break-after: always !important; break-after: page !important; }
//           .lp-page:last-child        { page-break-after: avoid  !important; break-after: avoid !important; }
//         }
//       `}</style>

//       <div className="lp-wrapper" ref={invoiceRef}>
//         {paginatedData.map((page, index) => (
//           <div className="lp-page" key={`page-${index}`}>

//             <div className="lp-content">
//               <div className="lp-logo-container">
//                 <img src={logo} alt="Lanson Place Logo" />
//               </div>

//               <div className="lp-invoice-title">Tax Invoice</div>
//               <div className="lp-reg-info">
//                 SST Reg No.: {invoice.sstRegNo}<br />
//                 TTX Reg No.: {invoice.ttxRegNo}
//               </div>

//               <div className="lp-meta-container">
//                 <div className="lp-meta-left">
//                   <table className="lp-meta-table">
//                     <tbody>
//                       <tr><td>Attention</td><td>:</td><td>{invoice.attention}</td></tr>
//                       <tr><td>Company</td><td>:</td><td>{invoice.company}</td></tr>
//                       <tr><td>Address</td><td>:</td><td>{invoice.address}</td></tr>
//                       <tr><td>Guest Name</td><td>:</td><td>{invoice.guestName}</td></tr>
//                       <tr><td>Confirmation No.</td><td>:</td><td>{invoice.confirmationNo}</td></tr>
//                       <tr><td>Room No.</td><td>:</td><td>{invoice.roomNo}</td></tr>
//                       <tr><td>CRS/OTA No.</td><td>:</td><td>{invoice.crsOtaNo}</td></tr>
//                     </tbody>
//                   </table>
//                 </div>
//                 <div className="lp-meta-right">
//                   <table className="lp-meta-table">
//                     <tbody>
//                       <tr><td>Tax Invoice No.</td><td>:</td><td>{invoice.taxInvoiceNo}</td></tr>
//                       <tr><td>Arrival</td><td>:</td><td>{invoice.arrivalDate}</td></tr>
//                       <tr><td>Departure</td><td>:</td><td>{invoice.departureDate}</td></tr>
//                       <tr><td>Date Printed</td><td>:</td><td>{invoice.datePrinted}</td></tr>
//                       <tr>
//                         <td>Cashier</td><td>:</td>
//                         <td>
//                           {cashierLine1}
//                           {cashierLine2 && <><br />{cashierLine2}</>}
//                         </td>
//                       </tr>
//                       <tr><td>Page No.</td><td>:</td><td>{page.pageNo}/{page.totalPages}</td></tr>
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               <table className="lp-items-table">
//                 <thead>
//                   <tr>
//                     <th style={{width:"18%"}}>Date</th>
//                     <th>Description</th>
//                     <th className="right" style={{width:"18%"}}>Amount</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {page.items.map((item, idx) => (
//                     <tr key={item.id || idx}>
//                       <td>{item.date}</td>
//                       <td>{item.desc}</td>
//                       <td className="right">{formatCurrency(item.amount)}</td>
//                     </tr>
//                   ))}
//                   {page.showTotals && (
//                     <tr className="tbl-total-row">
//                       <td></td>
//                       <td className="right tbl-total-label">Total</td>
//                       <td className="right amount-total-cell">0.00</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>

//               {page.showTotals && (
//                 <div className="lp-bottom-right">
//                   <table className="lp-summary-table">
//                     <tbody>
//                       <tr>
//                         <td>Total Amount Payable Excluding Tax</td>
//                         <td>{formatCurrency(invoice.totals.totalPayableExcludingTax)}</td>
//                       </tr>
//                       <tr>
//                         <td>Service Tax</td>
//                         <td>{formatCurrency(invoice.totals.serviceTax)}</td>
//                       </tr>
//                       <tr>
//                         <td>Tourism Tax</td>
//                         <td>{formatCurrency(invoice.totals.tourismTax)}</td>
//                       </tr>
//                       <tr>
//                         <td>Total Amount Payable</td>
//                         <td>{formatCurrency(invoice.totals.totalAmountPayable)}</td>
//                       </tr>
//                       <tr>
//                         <td>Balance</td>
//                         <td>{formatCurrency(invoice.totals.balance)}</td>
//                       </tr>
//                     </tbody>
//                   </table>

//                   <div style={{paddingLeft:"123px"}}>
//                     <div className="lp-sig-text">
//                       Regardless of charge instruction, I agree to be held<br />
//                       personally liable for paying/reimbursing of the above<br />
//                       amounts.
//                     </div>
//                     <div className="lp-sig-line">Signature</div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Footer: plain left-aligned text at the bottom edge */}
//             <div className="lp-footer">
//               <strong>Lanson Place Bukit Ceylon</strong>
//               address | 10, Jalan Ceylon Kuala Lumpur Malaysia 50200<br />
//               phone | +60 3-2725 8888<br />
//               fax | +60 3 2725 8899<br />
//               web | https://www.lansonplace.com/bukitceylon
//             </div>

//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default LansonPalaceInvoiceView;




// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// import logo from '../../../public/LPBC-logo.png';

// // ─────────────────────────────────────────────────────────────────────────────
// // FORMAT DATE  →  "03-MAR-2026"
// // ─────────────────────────────────────────────────────────────────────────────
// const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// const formatDate = (dateStr) => {
//   if (!dateStr) return "";
//   try {
//     const d = new Date(dateStr);
//     if (isNaN(d.getTime())) return dateStr; 
//     const dd  = String(d.getDate()).padStart(2, '0');
//     const mmm = MONTHS[d.getMonth()];
//     const yyyy = d.getFullYear();
//     return `${dd}-${mmm}-${yyyy}`;
//   } catch {
//     return dateStr;
//   }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // MAP API DATA → component shape
// // ─────────────────────────────────────────────────────────────────────────────
// const mapApiDataToInvoice = (data) => {
//   const transactions = [
//     ...(data.accommodationDetails || []).map(item => ({
//       id: `acc-${item.day}-${item.description}`,
//       date: formatDate(item.date),
//       desc: item.description,
//       amount: item.amount,
//     })),
//     ...(data.otherServices || []).map((item, idx) => ({
//       id: `svc-${idx}`,
//       date: formatDate(item.date),
//       desc: item.description,
//       amount: item.amount,
//     })),
//   ];

//   return {
//     referenceNo:    data.referenceNo   || "",
//     guestName:      data.guestName     || "",
//     attention:      data.guestName     || "",
//     company:        data.companyName   || "",
//     address:        data.address       || "",
//     confirmationNo: data.confNo        || "",
//     roomNo:         data.roomNo        || "",
//     crsOtaNo:       data.crsNo         || "",
//     taxInvoiceNo:   data.invoiceNo     || data.referenceNo || "",
//     arrivalDate:    formatDate(data.arrivalDate),
//     departureDate:  formatDate(data.departureDate),
//     datePrinted:    formatDate(data.invoiceDate),
//     cashier:        data.cashierName   || "",
//     sstRegNo:       data.sstRegNo      || "",
//     ttxRegNo:       data.ttxRegNo      || "",
//     transactions,
//     totals: {
//       totalInUsd:                data.balanceUsd || 0,
//       totalPayableExcludingTax: data.baseTaxableAmount || 0,
//       serviceTax:               data.totalSst8Percent  || 0,
//       tourismTax:               data.totalTourismTax   || 0,
//       totalAmountPayable:       data.grandTotalMyr     || 0,
//       balance:                  0,
//     },
//   };
// };

// const LansonPalaceInvoiceView = ({ invoiceData }) => {
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

//   const dummyData = {
//     guestName: "Mr. Shaban Mohamed Belgasem Ashur",
//     attention: "Mr Shaban Mohamed Belgasem Ashur",
//     company: "",
//     address: "Tripoli",
//     confirmationNo: "57775986-1",
//     roomNo: "703",
//     crsOtaNo: "",
//     taxInvoiceNo: "223801",
//     arrivalDate: "08-JAN-2026",
//     departureDate: "20-JAN-2026",
//     datePrinted: "20-JAN-2026",
//     cashier: "Lindsay Verlinie Anak Barnabas",
//     sstRegNo: "W10-1808-31039762",
//     ttxRegNo: "141-2017-10000377",
//     transactions: [
//       { id: '1', date: '18-JAN-2026', desc: 'Room Package', amount: 438.00 },
//       { id: '2', date: '18-JAN-2026', desc: 'Room - SST', amount: 35.04 },
//       { id: '3', date: '18-JAN-2026', desc: 'Tourism Tax', amount: 10.00 },
//       { id: '4', date: '19-JAN-2026', desc: 'Room Package', amount: 438.00 },
//       { id: '5', date: '19-JAN-2026', desc: 'Room - SST', amount: 35.04 },
//       { id: '6', date: '19-JAN-2026', desc: 'Tourism Tax', amount: 10.00 }
//     ],
//     totals: {
//       totalPayableExcludingTax: 5256.00,
//       serviceTax: 420.48,
//       tourismTax: 120.00,
//       totalAmountPayable: 5796.48,
//       balance: 0.00
//     }
//   };

//   useEffect(() => {
//     if (invoiceData) {
//       setInvoice(mapApiDataToInvoice(invoiceData));
//       setLoading(false);
//     } else {
//       fetchInvoiceData();
//     }
//   }, [invoiceData, invoiceId]);

//   useEffect(() => {
//     if (isPdfDownload && invoice && invoiceRef.current) {
//       const timer = setTimeout(async () => {
//         await handleDownloadPDF();
//         navigate("/invoices", { replace: true });
//       }, 800);
//       return () => clearTimeout(timer);
//     }
//   }, [isPdfDownload, invoice]);

//   const fetchInvoiceData = async () => {
//     try {
//       setLoading(true);
//       await new Promise(resolve => setTimeout(resolve, 500));
//       setInvoice(dummyData);
//     } catch (err) {
//       console.error("Error fetching invoice:", err);
//       setError("Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatCurrency = (val) => {
//     if (val === undefined || val === null || val === "") return "";
//     return parseFloat(val).toLocaleString('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });
//   };

//   // ── Pagination ────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!invoice?.transactions) return;

//     const tx = invoice.transactions;
//     const pages = [];
//     const MAX_ROWS_NORMAL_PAGE = 30;
//     const MAX_ROWS_WITH_FOOTER = 15;

//     if (tx.length === 0) {
//       pages.push({ items: [], showTotals: true });
//     } else {
//       for (let i = 0; i < tx.length; i += MAX_ROWS_NORMAL_PAGE) {
//         const chunk = tx.slice(i, i + MAX_ROWS_NORMAL_PAGE);
//         const isLastChunk = i + MAX_ROWS_NORMAL_PAGE >= tx.length;
//         if (isLastChunk) {
//           if (chunk.length > MAX_ROWS_WITH_FOOTER) {
//             pages.push({ items: chunk.slice(0, chunk.length - 2), showTotals: false });
//             pages.push({ items: chunk.slice(chunk.length - 2), showTotals: true });
//           } else {
//             pages.push({ items: chunk, showTotals: true });
//           }
//         } else {
//           pages.push({ items: chunk, showTotals: false });
//         }
//       }
//     }

//     const totalPages = pages.length;
//     pages.forEach((p, idx) => { p.pageNo = idx + 1; p.totalPages = totalPages; });
//     setPaginatedData(pages);
//   }, [invoice]);

// const handleDownloadPDF = async () => {
//   if (!invoiceRef.current) return;
//   setPdfLoading(true);

//   // Strip ONLY styles containing oklch (Tailwind v4) — preserve component inline styles
//   const allStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//   const strippedStyles = allStyles.filter(el => {
//     if (el.tagName === 'LINK') return true;
//     if (el.tagName === 'STYLE') {
//       return el.textContent.includes('oklch') || el.textContent.includes('@layer');
//     }
//     return false;
//   });
//   strippedStyles.forEach(s => s.parentNode?.removeChild(s));

//   try {
//     const images = invoiceRef.current.querySelectorAll('img');
//     await Promise.all(Array.from(images).map(img => {
//       if (img.complete) return Promise.resolve();
//       return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
//     }));

//     await new Promise(resolve => setTimeout(resolve, 600));

//     // Get the actual rendered width of the invoice wrapper
//     const actualWidth = invoiceRef.current.scrollWidth;

//     const opt = {
//       margin: 0,
//       filename: `${invoice.referenceNo || 'Invoice'}.pdf`,
//       image: { type: 'jpeg', quality: 1.0 },
//       html2canvas: {
//         scale: window.devicePixelRatio || 2,
//         useCORS: true,
//         letterRendering: true,
//         scrollX: 0,
//         scrollY: 0,
//         x: 0,
//         y: 0,
//         windowWidth: actualWidth,
//         windowHeight: invoiceRef.current.scrollHeight,
//       },
//       jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
//       pagebreak: { mode: ['css', 'legacy'] }
//     };

//     await html2pdf().set(opt).from(invoiceRef.current).save();
//     toast.success("PDF Downloaded Successfully");
//   } catch (err) {
//     console.error("PDF Error:", err);
//     toast.error("Failed to generate PDF");
//   } finally {
//     strippedStyles.forEach(s => document.head.appendChild(s));
//     setPdfLoading(false);
//   }
// };

//   const handlePrint = () => window.print();

//   if (!invoice) {
//     return (
//       <InvoiceTemplate loading={loading} error={error} invoice={invoice} onBack={() => navigate("/invoices")}>
//         <></>
//       </InvoiceTemplate>
//     );
//   }

//   const cashierParts = (invoice.cashier || '').split(' ');
//   const cashierLine1 = cashierParts.slice(0, 3).join(' ');
//   const cashierLine2 = cashierParts.slice(3).join(' ');

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
//       <style>{`
//         @page { size: A4 portrait; margin: 0; }

//         .lp-wrapper { width: 100%; background-color: transparent; }
//         .lp-wrapper * {
//           box-sizing: border-box;
//           font-family: Tahoma, Verdana, sans-serif;
//           font-size: 12px;
//           color: #000;
//         }

//         /* STRICT A4 HEIGHT LOCK. Footer uses absolute positioning relative to this */
//         .lp-page {
//           background: white;
//           width: 794px;
//           height: 1122px; 
//           max-height: 1122px;
//           min-height: 1122px;
//           margin: 0 auto 20px auto;
//           padding: 50px 60px 40px 60px;
//           box-shadow: 0 4px 15px rgba(0,0,0,0.1);
//           position: relative; /* REQUIRED FOR ABSOLUTE FOOTER */
//           overflow: hidden;
//         }

//         /* STRIP SPACING ONLY FOR PDF EXPORT TO AVOID BLANK PAGES */
//         .pdf-export-mode .lp-page {
//           margin: 0 auto !important;
//           box-shadow: none !important;
//           page-break-after: always;
//           break-after: page;
//         }
//         .pdf-export-mode .lp-page:last-child {
//           page-break-after: auto !important;
//           break-after: auto !important;
//         }

//         /* GUARANTEED BOTTOM LEFT POSITIONING */
//         .lp-footer {
//           position: absolute;
//           bottom: 50px;
//           left: 60px;
//           font-size: 9px;
//           line-height: 1.4;
//           color: #000;
//         }
//         .lp-footer strong { 
//           font-size: 10px; 
//           font-weight: bold; 
//           display: block; 
//           margin-bottom: 1px; 
//         }

//         .lp-logo-container { display: flex; justify-content: center; margin-bottom: 35px; }
//         .lp-logo-container img { max-width: 200px; height: auto; }

//         .lp-invoice-title { font-size: 22px; font-weight: bold;  }
//         .lp-reg-info { font-size: 11px; line-height: 1.4; margin-bottom: 12px; }

//         .lp-meta-container { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 25px; }
//         .lp-meta-left  { width: 56%; }
//         .lp-meta-right { width: 45%;  padding-left: 33px;}

//         .lp-meta-table { width: 100%; border-collapse: collapse; }
//         .lp-meta-table td { padding: 0.5px 0; vertical-align: top; }
//         .lp-meta-table td:nth-child(1) { width: 130px; }
//         .lp-meta-table td:nth-child(2) { width: 15px; }

//         .lp-items-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
//         /* CHANGE THIS in your <style> block */
// .lp-items-table th {
//   border-top: 2px solid #000;
//   border-bottom: 2px solid #000;
//   padding: 6px 4px;        /* keep as-is */
//   text-align: left;
//   font-weight: bold;
//   height: 28px;            /* ADD THIS — fixes the compressed header height */
//   vertical-align: middle;  /* ADD THIS — centers text vertically */
//   line-height: 1.4;        /* ADD THIS */
// }
//         .lp-items-table th.right,
//         .lp-items-table td.right { text-align: right; width: 100px; }
//         .lp-items-table td { padding: 0px 4px; }
//         .lp-items-table tbody tr:nth-child(even):not(.tbl-total-row) {
//           background-color: #f4f4f4;
//           -webkit-print-color-adjust: exact;
//           print-color-adjust: exact;
//         }

//         .tbl-total-row td  { padding-top: 15px; }
//         .tbl-total-label   { font-weight: bold; padding-right: 20px; }
//         .amount-total-cell { border-top: 1px solid #000; padding-top: 8px !important; }

//         .lp-bottom-right { width: 400px; margin-left: auto; padding-right: 4px; }

//         .lp-summary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; margin-top 5px;}
//         .lp-summary-table td              { text-align: right; padding: 1px 0; }
//         .lp-summary-table td:first-child  { font-weight: bold; padding-right: 20px; }
//         .lp-summary-table td:last-child   { width: 100px; }

//         .lp-sig-text { text-align: left; margin-bottom: 60px; line-height: 1.4; }
//         .lp-sig-line { border-top: 1px solid #000; text-align: center; padding-top: 5px; }

//         @media print {
//           body, html { background-color: #fff !important; }
//           button, nav, header, footer, .no-print { display: none !important; }
//           .lp-wrapper { background: none !important; }
//           .lp-page {
//             margin: 0 !important;
//             padding: 50px 60px 40px 60px !important;
//             box-shadow: none !important;
//             border: none !important;
//             page-break-after: always !important;
//             break-after: page !important;
//           }
//           .lp-page:last-child { page-break-after: avoid !important; break-after: avoid !important; }
//         }
//       `}</style>

//       <div className={`lp-wrapper ${pdfLoading ? 'pdf-export-mode' : ''}`} ref={invoiceRef}>
//         {paginatedData.map((page, index) => (
//           <div className="lp-page" key={`page-${index}`}>

//             <div className="lp-logo-container">
//               <img src={logo} alt="Lanson Place Logo" />
//             </div>

//             <div className="lp-invoice-title">Tax Invoice</div>
//             <div className="lp-reg-info">
//               SST Reg No.: {invoice.sstRegNo}<br />
//               TTX Reg No.: {invoice.ttxRegNo}
//             </div>

//             <div className="lp-meta-container">
//               <div className="lp-meta-left">
//                 <table className="lp-meta-table">
//                   <tbody>
//                     <tr><td>Attention</td><td>:</td><td>{invoice.attention}</td></tr>
//                     <tr><td>Company</td><td>:</td><td>{invoice.company}</td></tr>
//                     <tr><td>Address</td><td>:</td><td>{invoice.address}</td></tr>
//                     <tr><td>Guest Name</td><td>:</td><td>{invoice.guestName}</td></tr>
//                     <tr><td>Confirmation No.</td><td>:</td><td>{invoice.confirmationNo}</td></tr>
//                     <tr><td>Room No.</td><td>:</td><td>{invoice.roomNo}</td></tr>
//                     <tr><td>CRS/OTA No.</td><td>:</td><td>{invoice.crsOtaNo}</td></tr>
//                   </tbody>
//                 </table>
//               </div>
//               <div className="lp-meta-right">
//                 <table className="lp-meta-table">
//                   <tbody>
//                     <tr><td>Tax Invoice No.</td><td>:</td><td>{invoice.taxInvoiceNo}</td></tr>
//                     <tr><td>Arrival</td><td>:</td><td>{invoice.arrivalDate}</td></tr>
//                     <tr><td>Departure</td><td>:</td><td>{invoice.departureDate}</td></tr>
//                     <tr><td>Date Printed</td><td>:</td><td>{invoice.datePrinted}</td></tr>
//                     <tr>
//                       <td>Cashier</td><td>:</td>
//                       <td>
//                         {cashierLine1}
//                         {cashierLine2 && <><br />{cashierLine2}</>}
//                       </td>
//                     </tr>
//                     <tr><td>Page No.</td><td>:</td><td>{page.pageNo}/{page.totalPages}</td></tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <table className="lp-items-table">
//               <thead>
//                 <tr>
//                   <th style={{width:"18%"}}>Date</th>
//                   <th>Description</th>
//                   <th className="right" style={{width:"18%"}}>Amount</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {page.items.map((item, idx) => (
//                   <tr key={item.id || idx}>
//                     <td>{item.date}</td>
//                     <td>{item.desc}</td>
//                     <td className="right">{formatCurrency(item.amount)}</td>
//                   </tr>
//                 ))}
//                 {page.showTotals && (
//                   <tr className="tbl-total-row">
//                     <td></td>
//                     <td className="right tbl-total-label">Total</td>
//                     <td className="right amount-total-cell">0.00</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//             {page.showTotals && (
//               <div className="lp-bottom-right">
//                 <table className="lp-summary-table">
//                   <tbody>
//                     <tr>
//                       <td>Total Amount Payable Excluding Tax</td>
//                       <td>{formatCurrency(invoice.totals.totalPayableExcludingTax)}</td>
//                     </tr>
//                     <tr>
//                       <td>Service Tax</td>
//                       <td>{formatCurrency(invoice.totals.serviceTax)}</td>
//                     </tr>
//                     <tr>
//                       <td>Tourism Tax</td>
//                       <td>{formatCurrency(invoice.totals.tourismTax)}</td>
//                     </tr>
//                     <tr>
//                       <td>Total Amount Payable</td>
//                       <td>{formatCurrency(invoice.totals.totalAmountPayable)}</td>
//                     </tr>
//                     <tr>
//                       <td>Total Amount USD</td>
//                       <td>{formatCurrency(invoice.totals.totalInUsd)}</td>
//                     </tr>
//                     <tr>
//                       <td>Balance</td>
//                       <td>{formatCurrency(invoice.totals.balance)}</td>
//                     </tr>
//                   </tbody>
//                 </table>

//                 <div style={{paddingLeft:"116px"}}>
//                   <div className="lp-sig-text">
//                     Regardless of charge instruction, I agree to be held<br />
//                     personally liable for paying/reimbursing of the above<br />
//                     amounts.
//                   </div>
//                   <div className="lp-sig-line">Signature</div>
//                 </div>
//               </div>
//             )}

//             {/* Absolute bottom left footer */}
//             <div className="lp-footer">
//               <strong>Lanson Place Bukit Ceylon</strong>
//               address | 10, Jalan Ceylon Kuala Lumpur Malaysia 50200<br />
//               phone | +60 3-2725 8888<br />
//               fax | +60 3 2725 8899<br />
//               web | https://www.lansonplace.com/bukitceylon
//             </div>

//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default LansonPalaceInvoiceView;




import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '../../../public/LPBC-logo.png';

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT DATE
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd  = String(d.getDate()).padStart(2, '0');
    const mmm = MONTHS[d.getMonth()];
    const yyyy = d.getFullYear();
    return `${dd}-${mmm}-${yyyy}`;
  } catch {
    return dateStr;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAP API DATA
// ─────────────────────────────────────────────────────────────────────────────
const mapApiDataToInvoice = (data) => {
  const transactions = [
    ...(data.accommodationDetails || []).map(item => ({
      id: `acc-${item.day}-${item.description}`,
      date: formatDate(item.date),
      desc: item.description,
      amount: item.amount,
    })),
    ...(data.otherServices || []).map((item, idx) => ({
      id: `svc-${idx}`,
      date: formatDate(item.date),
      desc: item.description,
      amount: item.amount,
    })),
  ];

  return {
    referenceNo:    data.referenceNo   || "",
    guestName:      data.guestName     || "",
    attention:      data.guestName     || "",
    company:        data.companyName   || "",
    address:        data.address       || "",
    confirmationNo: data.confNo        || "",
    roomNo:         data.roomNo        || "",
    crsOtaNo:       data.crsNo         || "",
    taxInvoiceNo:   data.invoiceNo     || data.referenceNo || "",
    arrivalDate:    formatDate(data.arrivalDate),
    departureDate:  formatDate(data.departureDate),
    datePrinted:    formatDate(data.invoiceDate),
    cashier:        data.cashierName   || "",
    sstRegNo:       data.sstRegNo      || "",
    ttxRegNo:       data.ttxRegNo      || "",
    transactions,
    totals: {
      totalInUsd:               data.balanceUsd          || 0,
      totalPayableExcludingTax: data.baseTaxableAmount   || 0,
      serviceTax:               data.totalSst8Percent    || 0,
      tourismTax:               data.totalTourismTax     || 0,
      totalAmountPayable:       data.grandTotalMyr       || 0,
      balance:                  0,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const LansonPalaceInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);

  const invoiceRef = useRef(null);
  const ROWS_PER_PAGE = 25;
  const isPdfDownload = location.pathname.includes("/download-pdf");

  const dummyData = {
    guestName: "Mr. Shaban Mohamed Belgasem Ashur",
    attention: "Mr Shaban Mohamed Belgasem Ashur",
    company: "",
    address: "Tripoli",
    confirmationNo: "57775986-1",
    roomNo: "703",
    crsOtaNo: "",
    taxInvoiceNo: "223801",
    arrivalDate: "08-JAN-2026",
    departureDate: "20-JAN-2026",
    datePrinted: "20-JAN-2026",
    cashier: "Lindsay Verlinie Anak Barnabas",
    sstRegNo: "W10-1808-31039762",
    ttxRegNo: "141-2017-10000377",
    transactions: [
      { id: '1', date: '18-JAN-2026', desc: 'Room Package', amount: 438.00 },
      { id: '2', date: '18-JAN-2026', desc: 'Room - SST', amount: 35.04 },
      { id: '3', date: '18-JAN-2026', desc: 'Tourism Tax', amount: 10.00 },
      { id: '4', date: '19-JAN-2026', desc: 'Room Package', amount: 438.00 },
      { id: '5', date: '19-JAN-2026', desc: 'Room - SST', amount: 35.04 },
      { id: '6', date: '19-JAN-2026', desc: 'Tourism Tax', amount: 10.00 }
    ],
    totals: {
      totalPayableExcludingTax: 5256.00,
      serviceTax: 420.48,
      tourismTax: 120.00,
      totalAmountPayable: 5796.48,
      balance: 0.00
    }
  };

  useEffect(() => {
    if (invoiceData) {
      setInvoice(mapApiDataToInvoice(invoiceData));
      setLoading(false);
    } else {
      fetchInvoiceData();
    }
  }, [invoiceData, invoiceId]);

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
      await new Promise(resolve => setTimeout(resolve, 500));
      setInvoice(dummyData);
    } catch (err) {
      console.error("Error fetching invoice:", err);
      setError("Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "") return "";
    return parseFloat(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // ── Pagination ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!invoice?.transactions) return;

    const tx = invoice.transactions;
    const pages = [];
    const MAX_ROWS_WITH_FOOTER = 15;

    if (tx.length === 0) {
      pages.push({ items: [], pageNo: 1, totalPages: 1, showTotals: true });
    } else {
      for (let i = 0; i < tx.length; i += ROWS_PER_PAGE) {
        const chunk = tx.slice(i, i + ROWS_PER_PAGE);
        const isLastChunk = i + ROWS_PER_PAGE >= tx.length;

        if (isLastChunk) {
          if (chunk.length > MAX_ROWS_WITH_FOOTER) {
            pages.push({ items: chunk.slice(0, chunk.length - 2), showTotals: false });
            pages.push({ items: chunk.slice(chunk.length - 2), showTotals: true });
          } else {
            pages.push({ items: chunk, showTotals: true });
          }
        } else {
          pages.push({ items: chunk, showTotals: false });
        }
      }
    }

    const totalPages = pages.length;
    pages.forEach((p, idx) => { p.pageNo = idx + 1; p.totalPages = totalPages; });
    setPaginatedData(pages);
  }, [invoice]);

  // ── PDF DOWNLOAD ─────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
      if (style.parentNode) style.parentNode.removeChild(style);
    });

    try {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin: 0,
        filename: `${invoice.referenceNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 3 },
        html2canvas: {
          scale: 4,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 794,
          onclone: (clonedDoc) => {
            clonedDoc.querySelectorAll('.page').forEach(p => {
              p.style.margin = '0';
              p.style.height = '1122px';
              p.style.minHeight = '1122px';
              p.style.maxHeight = '1122px';
              p.style.boxShadow = 'none';
            });
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      };

      await html2pdf().set(opt).from(invoiceRef.current).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      headStyles.forEach(style => { document.head.appendChild(style); });
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (!invoice) {
    return (
      <InvoiceTemplate loading={loading} error={error} invoice={invoice} onBack={() => navigate("/invoices")}>
        <></>
      </InvoiceTemplate>
    );
  }

  const cashierParts = (invoice.cashier || '').split(' ');
  const cashierLine1 = cashierParts.slice(0, 3).join(' ');
  const cashierLine2 = cashierParts.slice(3).join(' ');

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
      <div className="lanson-invoice-wrapper" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{__html: `
          .lanson-invoice-wrapper {
              width: 100%;
              background-color: transparent;
          }
          .lanson-invoice-wrapper * {
              box-sizing: border-box;
              font-family: Tahoma, Verdana, Arial, sans-serif;
              color: #000;
              font-size: 12px;
          }
          .page {
              width: 100%;
              max-width: 794px;
              height: 1122px;
              max-height: 1122px;
              min-height: 1122px;
              padding: 50px 60px 40px 60px;
              margin: 0 auto 20px auto;
              background: #fff;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              position: relative;
              overflow: hidden;
              line-height: 1.4;
              page-break-after: always;
              break-after: page;
          }
          .page:last-child {
              page-break-after: auto;
              break-after: auto;
          }
          .lp-logo-container {
              display: flex;
              justify-content: center;
              margin-bottom: 35px;
          }
          .lp-logo-container img {
              max-width: 200px;
              height: auto;
          }
          .lp-invoice-title {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 5px;
          }
          .lp-reg-info {
              font-size: 11px;
              line-height: 1.5;
              margin-bottom: 12px;
          }
          .lp-meta-container {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              gap: 25px;
          }
          .lp-meta-left  { width: 56%; }
          .lp-meta-right { width: 45%; padding-left: 33px; }
          .lp-meta-table { width: 100%; border-collapse: collapse; }
          .lp-meta-table td { padding: 3px 0; vertical-align: middle; }
          .lp-meta-table td:nth-child(1) { width: 130px; }
          .lp-meta-table td:nth-child(2) { width: 15px; }
          .lp-items-table {
              width: 100%;
              border-collapse: collapse;
              border-spacing: 0;
              margin-bottom: 10px;
          }
          .lp-items-table th {
              border-top: 2px solid #000 !important;
              border-bottom: 2px solid #000 !important;
              padding: 10px 8px !important;
              text-align: left;
              font-weight: bold;
              vertical-align: middle !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
          }
          .lp-items-table th.center { text-align: center; }
          .lp-items-table th.right,
          .lp-items-table td.right {
              text-align: right;
              width: 100px;
          }
          .lp-items-table td {
              padding: 6px 8px !important;
              vertical-align: middle !important;
          }
          .lp-items-table tbody tr:nth-child(even):not(.tbl-total-row) {
              background-color: #f4f4f4;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
          }
          .tbl-total-row td  { padding-top: 15px !important; }
          .tbl-total-label   { font-weight: bold; padding-right: 20px; }
          .amount-total-cell { border-top: 1px solid #000; padding-top: 8px !important; }
          .lp-bottom-right   { width: 400px; margin-left: auto; padding-right: 4px; }
          .lp-summary-table  { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .lp-summary-table td { text-align: right; padding: 3px 0; }
          .lp-summary-table td:first-child { font-weight: bold; padding-right: 20px; }
          .lp-summary-table td:last-child  { width: 100px; }
          .lp-sig-text { text-align: left; margin-bottom: 60px; line-height: 1.5; }
          .lp-sig-line { border-top: 1px solid #000; text-align: center; padding-top: 5px; }
          .lp-footer {
              position: absolute;
              bottom: 50px;
              left: 60px;
              font-size: 9px;
              line-height: 1.5;
          }
          .lp-footer strong {
              font-size: 10px;
              font-weight: bold;
              display: block;
              margin-bottom: 2px;
          }
          @page { size: A4 portrait; margin: 0; }
          @media print {
              body, html {
                  margin: 0 !important;
                  padding: 0 !important;
                  background-color: #fff !important;
              }
              button, nav, header, footer, .no-print {
                  display: none !important;
              }
              .lanson-invoice-wrapper {
                  padding: 0 !important;
                  margin: 0 !important;
                  background: none !important;
                  max-width: none !important;
              }
              .page {
                  margin: 0 !important;
                  padding: 50px 60px 40px 60px !important;
                  box-shadow: none !important;
                  border: none !important;
              }
          }
        `}} />

        {paginatedData.map((page, index) => (
          <div className="page" key={`page-${index}`}>
            <div className="lp-logo-container">
              <img src={logo} alt="Lanson Place Logo" crossOrigin="anonymous" />
            </div>

            <div className="lp-invoice-title">Tax Invoice</div>
            <div className="lp-reg-info">
              SST Reg No.: {invoice.sstRegNo}<br />
              TTX Reg No.: {invoice.ttxRegNo}
            </div>

            <div className="lp-meta-container">
              <div className="lp-meta-left">
                <table className="lp-meta-table">
                  <tbody>
                    <tr><td>Attention</td><td>:</td><td>{invoice.attention}</td></tr>
                    <tr><td>Company</td><td>:</td><td>{invoice.company}</td></tr>
                    <tr><td>Address</td><td>:</td><td>{invoice.address}</td></tr>
                    <tr><td>Guest Name</td><td>:</td><td>{invoice.guestName}</td></tr>
                    <tr><td>Confirmation No.</td><td>:</td><td>{invoice.confirmationNo}</td></tr>
                    <tr><td>Room No.</td><td>:</td><td>{invoice.roomNo}</td></tr>
                    <tr><td>CRS/OTA No.</td><td>:</td><td>{invoice.crsOtaNo}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="lp-meta-right">
                <table className="lp-meta-table">
                  <tbody>
                    <tr><td>Tax Invoice No.</td><td>:</td><td>{invoice.taxInvoiceNo}</td></tr>
                    <tr><td>Arrival</td><td>:</td><td>{invoice.arrivalDate}</td></tr>
                    <tr><td>Departure</td><td>:</td><td>{invoice.departureDate}</td></tr>
                    <tr><td>Date Printed</td><td>:</td><td>{invoice.datePrinted}</td></tr>
                    <tr>
                      <td style={{verticalAlign:"top"}}>Cashier</td><td style={{verticalAlign:"top"}}>:</td>
                      <td>
                        {cashierLine1}
                        {cashierLine2 && <><br />{cashierLine2}</>}
                      </td>
                    </tr>
                    <tr><td>Page No.</td><td>:</td><td>{page.pageNo}/{page.totalPages}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <table className="lp-items-table">
              <thead>
                <tr>
                  <th style={{width:"18%"}}>Date</th>
                  <th className="center">Description</th>
                  <th className="right" style={{width:"18%"}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td>{item.date}</td>
                    <td className="center">{item.desc}</td>
                    <td className="right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                {page.showTotals && (
                  <tr className="tbl-total-row">
                    <td></td>
                    <td className="right tbl-total-label">Total</td>
                    <td className="right amount-total-cell">0.00</td>
                  </tr>
                )}
              </tbody>
            </table>

            {page.showTotals && (
              <div className="lp-bottom-right">
                <table className="lp-summary-table">
                  <tbody>
                    <tr>
                      <td>Total Amount Payable Excluding Tax</td>
                      <td>{formatCurrency(invoice.totals.totalPayableExcludingTax)}</td>
                    </tr>
                    <tr>
                      <td>Service Tax</td>
                      <td>{formatCurrency(invoice.totals.serviceTax)}</td>
                    </tr>
                    <tr>
                      <td>Tourism Tax</td>
                      <td>{formatCurrency(invoice.totals.tourismTax)}</td>
                    </tr>
                    <tr>
                      <td>Total Amount Payable</td>
                      <td>{formatCurrency(invoice.totals.totalAmountPayable)}</td>
                    </tr>
                    <tr>
                      <td>Total Amount USD</td>
                      <td>{formatCurrency(invoice.totals.totalInUsd)}</td>
                    </tr>
                    <tr>
                      <td>Balance</td>
                      <td>{formatCurrency(invoice.totals.balance)}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{paddingLeft:"116px"}}>
                  <div className="lp-sig-text">
                    Regardless of charge instruction, I agree to be held<br />
                    personally liable for paying/reimbursing of the above<br />
                    amounts.
                  </div>
                  <div className="lp-sig-line">Signature</div>
                </div>
              </div>
            )}

            <div className="lp-footer">
              <strong>Lanson Place Bukit Ceylon</strong>
              address | 10, Jalan Ceylon Kuala Lumpur Malaysia 50200<br />
              phone | +60 3-2725 8888<br />
              fax | +60 3 2725 8899<br />
              web | https://www.lansonplace.com/bukitceylon
            </div>
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default LansonPalaceInvoiceView;