// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// // Adjust the path to your logo as needed based on your folder structure
// import logo from '../../../public/radisson_blu_turkey-logo.png';

// const formatDate = (dateStr) => {
//   if (!dateStr) return "";
//   try {
//     const d = new Date(dateStr);
//     if (isNaN(d.getTime())) return dateStr;
//     const dd = String(d.getDate()).padStart(2, '0');
//     const mm = String(d.getMonth() + 1).padStart(2, '0');
//     const yy = String(d.getFullYear());
//     return `${dd}.${mm}.${yy}`; // Changed to DD.MM.YYYY to match Radisson format
//   } catch {
//     return dateStr;
//   }
// };

// const formatCurrency = (val) => {
//   if (val === null || val === undefined || val === "") return "0,00";
//   // Radisson uses European number formatting (dot for thousands, comma for decimals)
//   // For simplicity in React, using standard locale string, you can adjust locale 'tr-TR' to match exact dots/commas
//   return parseFloat(val).toLocaleString('tr-TR', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2
//   });
// };

// const parseDateForSort = (dateStr) => {
//   if (!dateStr) return 0;
//   const d = new Date(dateStr);
//   return isNaN(d.getTime()) ? 0 : d.getTime();
// };

// const RadissonHerbyeInvoiceView= ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [paginatedData, setPaginatedData] = useState([]);
//   const invoiceRef = useRef(null);

//   const isPdfDownload = location.pathname.includes("/download-pdf");

//   // ─────────────────────────────────────────────────────────────────────────────
//   // MAPPING API DATA TO VIEW SCHEMA & SORTING BY DATE
//   // ─────────────────────────────────────────────────────────────────────────────
  
//   // Defaulting data to an empty object {} if no API data is passed
//   const mapApiDataToInvoice = (data = {}) => {

//     const accommodationItems = (data.accommodationDetails || []).map((item, index) => ({
//       id: `acc_${index}`,
//       rawDate: parseDateForSort(item.date),
//       date: formatDate(item.date),
//       desc: item.description || "Accommodation",
//       qty: item.qty || 1,
//       netUnitPrice: item.amount,
//       netAmount: item.amount,
//       tax: "10%", // Adjust based on your API
//       taxAmt: (item.amount * 0.1), // Example calc
//       debit: (item.amount * 1.1),
//       credit: ""
//     }));

//     const serviceItems = (data.otherServices || []).map((item, index) => ({
//       id: `ser_${index}`,
//       rawDate: parseDateForSort(item.date),
//       date: formatDate(item.date),
//       desc: item.description,
//       qty: item.qty || 1,
//       netUnitPrice: item.amount,
//       netAmount: item.amount,
//       tax: "10%",
//       taxAmt: (item.amount * 0.1),
//       debit: (item.amount * 1.1),
//       credit: ""
//     }));

//     // Combine and sort by date (oldest to newest)
//     const allItems = [...accommodationItems, ...serviceItems].sort((a, b) => a.rawDate - b.rawDate);

//     // If API data is empty, we provide fallback dummy data to match the screenshot exactly
//     if (allItems.length === 0) {
//       allItems.push(
//         { id: '1', date: '', desc: 'Otel Harcamaları / Hotel Expenses', qty: 1, netUnitPrice: 96847.64, netAmount: 96847.64, tax: '10%', taxAmt: 9684.76, debit: 106532.40, credit: '' },
//         { id: '2', date: '20.01.2026', desc: 'Accommodation Tax', qty: 4, netUnitPrice: 161.41, netAmount: 645.64, tax: '0%', taxAmt: 0.00, debit: 645.64, credit: '' },
//         { id: '3', date: '21.01.2026', desc: 'Accommodation Tax', qty: 4, netUnitPrice: 161.41, netAmount: 645.64, tax: '0%', taxAmt: 0.00, debit: 645.64, credit: '' },
//         { id: '4', date: '22.01.2026', desc: 'Accommodation Tax', qty: 4, netUnitPrice: 161.41, netAmount: 645.64, tax: '0%', taxAmt: 0.00, debit: 645.64, credit: '' },
//         { id: '5', date: '23.01.2026', desc: 'Foreign Curr. Transact Gains/Losses TAX0', qty: 1, netUnitPrice: 0.05, netAmount: 0.05, tax: '0%', taxAmt: 0.00, debit: 0.05, credit: '' }
//       );
//     }

//     return {
//       invoiceNo: data.invoiceNo || "ANA6A01946",
//       billingDate: formatDate(data.invoiceDate) || "23.01.2026",
//       roomNo: data.roomNo || "0218",
//       pax: data.pax || "1",
//       guestName: data.guestName || "GIUMA MOHAMED MAHFOUDE\nALI",
//       checkInDate: formatDate(data.arrivalDate) || "20.01.2026",
//       checkOutDate: formatDate(data.departureDate) || "23.01.2026",
      
//       party: data.party || "3000178582",
//       branch: data.branch || "45216371",
//       reservation: data.reservation || "3B8FP2L1",
//       voucher: data.voucher || "3B8FP2L1",
      
//       items: allItems,
//       summary: {
//         subtotal: data.baseTaxableAmount || 106532.45,
//         accommodationTax: data.totalTourismTax || 1936.92, // Mapped to Acc Tax
//         grandTotal: data.grandTotalMyr || 108469.37,
//         balance: data.balance || 0.00
//       }
//     };
//   };

//   useEffect(() => {
//     // We now pass invoiceData OR an empty object if invoiceData is null/undefined
//     // This forces mapApiDataToInvoice to generate the dummy fallback data
//     setInvoice(mapApiDataToInvoice(invoiceData || {}));
//     setLoading(false);
//   }, [invoiceData]);

//   useEffect(() => {
//     if (isPdfDownload && invoice && invoiceRef.current) {
//       const timer = setTimeout(async () => {
//         await handleDownloadPDF();
//         navigate("/invoices", { replace: true });
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [isPdfDownload, invoice, navigate]);

//   // ─────────────────────────────────────────────────────────────────────────────
//   // PAGINATION LOGIC
//   // ─────────────────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!invoice?.items) return;

//     const tx = invoice.items;
//     const pages = [];
//     const MAX_ROWS_NORMAL_PAGE = 15; // Adjusted for this layout

//     if (tx.length === 0) {
//       pages.push({ items: [], showTotals: true });
//     } else {
//       for (let i = 0; i < tx.length; i += MAX_ROWS_NORMAL_PAGE) {
//         const chunk = tx.slice(i, i + MAX_ROWS_NORMAL_PAGE);
//         const isLastChunk = i + MAX_ROWS_NORMAL_PAGE >= tx.length;
//         pages.push({ items: chunk, showTotals: isLastChunk });
//       }
//     }

//     const totalPages = pages.length;
//     pages.forEach((p, idx) => {
//       p.pageNo = idx + 1;
//       p.totalPages = totalPages;
//     });

//     setPaginatedData(pages);
//   }, [invoice]);

//   // ─────────────────────────────────────────────────────────────────────────────
//   // PDF DOWNLOAD
//   // ─────────────────────────────────────────────────────────────────────────────
//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//     headStyles.forEach(style => {
//       style.parentNode.removeChild(style);
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
//         filename: `Radisson_Invoice_${invoice.invoiceNo || 'Invoice'}.pdf`,
//         image: { type: 'jpeg', quality: 1 },
//         html2canvas: {
//           scale: 3,
//           useCORS: true,
//           letterRendering: true,
//           scrollY: 0,
//           windowWidth: 794
//         },
//         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['css', 'legacy'], avoid: ['.page:last-child'] }
//       };

//       await html2pdf().set(opt).from(element).save();
//       toast.success("PDF Downloaded");
//     } catch (err) {
//       console.error("❌ PDF Error:", err);
//       toast.error("PDF Error");
//     } finally {
//       headStyles.forEach(style => {
//         document.head.appendChild(style);
//       });
//       setPdfLoading(false);
//     }
//   };

//   // If still loading or calculating, show nothing or a loader
//   if (!invoice) return null;

//   return (
//     <InvoiceTemplate
//       loading={loading}
//       invoice={invoice}
//       pdfLoading={pdfLoading}
//       onDownloadPDF={handleDownloadPDF}
//       onPrint={() => window.print()}
//       onBack={() => navigate("/invoices")}
//     >
//       <div className="invoice-box" ref={invoiceRef}>
//         <style dangerouslySetInnerHTML={{__html: `
//           @page { size: A4; margin: 0mm; }
//           .invoice-box { width: 100%; font-family: Arial, sans-serif; font-size: 9px; color: #000; background-color: transparent; }
          
//           .page {
//               width: 100%; max-width: 794px; padding: 10mm 10mm 2mm 10mm; margin: 0 auto 20px auto;
//               background: #fff; box-shadow: 0 0 10px rgba(0,0,0,0.1); box-sizing: border-box;
//               page-break-after: always; break-after: page; position: relative;
//           }
//           .page:last-child {
//               page-break-after: avoid; break-after: avoid;
//           }

//           .logo-container { display:flex; justify-content: center; margin-bottom: 50px; }
//           .logo-container img { max-width: 190px; }
//           .top-section { display: flex; justify-content: space-between; margin-bottom: 70px;  font-size: 8px;}
//           .address-block p { }
//           .address-block .bold { font-weight: bold; }
//           .address-block .inline-info { display: flex; gap: 20px; }
//           .copy-text { font-weight: bold; font-size: 9px; margin-top: 50px; margin-right: 180px; }
          
//           /* General Table Styling */
//           table { width: 100%; border-collapse: collapse; }
//           th, td { padding: 5px 2px; vertical-align: top; }
//           .text-right { text-align: right !important; }
//           .text-center { text-align: center !important; }
          
//           /* Headers for Guest and Items Tables */
//           .guest-table th, .items-table th { text-align: left; font-weight: bold; font-style: italic; font-size: 8px;}
//           .guest-table th span, .items-table th span { text-decoration: underline; }
//           .guest-table { }
//           .guest-table td { padding-bottom: 15px; }
//           .items-table { margin-bottom: 20px; }

//           /* Subtotals */
//           .summary-wrapper { display: flex; justify-content: flex-end; margin-bottom: 25px; }
//           .summary-table { width: 58%; }
//           .summary-table td { padding: 4px 0; }

//           /* Payment Method */
//           .payment-wrapper { display: flex; justify-content: flex-end; margin-bottom: 30px; }
//           .payment-block { width: 62%; }
//           .payment-title { font-weight: bold; font-style: italic; }
//           .payment-row { display: flex; justify-content: space-between; padding: 6px 0; }
//           .payment-line { border-bottom: 1px solid #000; margin: 2px 0; }

//           /* Tax Info Table */
//           .tax-table { width: 80%;  }
//           .tax-table th { font-weight: bold; font-style: italic; padding-bottom: 5px; }
//           .tax-line-header { border-bottom: 1px solid #000; }
//           .tax-line-footer { border-bottom: 1px solid #000; }
//           .tax-table td { padding: 2px 2px; }
//           .tax-total-row td { padding-top: 10px; }

//           /* Signature & Notes */
//           .signature-block { margin-bottom: 28px; display: flex; align-items: flex-end; }
//           .sig-text { margin-right: 105px; }
//           .sig-line { border-bottom: 1px solid #000; width: 100px; display: inline-block; }
//           .notes-block { margin-bottom: 60px; }

//           /* Footer Text */
//           .bottom-footer { font-size: 8px; line-height: 1.5; color: #000; }
//           .bottom-footer p { margin: 1px 0; }

//           @media print { 
//             .invoice-box { background: none !important; }
//             .page { box-shadow: none !important; margin: 0 auto !important; page-break-after: always !important; break-after: page !important; } 
//             .page:last-child { page-break-after: avoid !important; break-after: avoid !important; }
//             .no-print { display: none !important; } 
//           }
//         `}} />

//         {paginatedData.map((page, index) => (
//           <div 
//             className="page" 
//             key={index}
//             style={index === paginatedData.length - 1 ? { pageBreakAfter: 'avoid', breakAfter: 'avoid' } : {}}
//           >
//             {/* Logo */}
//             <div className="logo-container">
//                 <img src={logo} alt="Radisson Blu Logo" />
//             </div>

//             {/* Top Address Section */}
//             <div className="top-section">
//                 <div className="address-block">
//                     <p style={{ fontStyle: 'italic', fontWeight: 'bold', textDecoration: 'underline' }}>Fiscal Information</p>
//                     <p>/</p>
//                     <p>AZAR TOURISM</p>
//                     <p>ALGERIA SQUARE BUILDING NUMBER 12 FIRST FLOOR 12/1</p>
//                     <p>1254</p>
//                     <p>TRIPOLI - Libya</p>
//                     <div className="inline-info">
//                         <p><span className="bold">Party</span> {invoice.party}</p>
//                         <p><span className="bold">Branch</span> {invoice.branch}</p>
//                     </div>
//                     <div className="inline-info">
//                         <p><span className="bold">Reservation</span> {invoice.reservation}</p>
//                         <p><span className="bold">Voucher</span> {invoice.voucher}</p>
//                     </div>
//                 </div>
//                 <div className="copy-text">
//                     Copy
//                 </div>
//             </div>

//             {/* Guest Table */}
//             <table className="guest-table">
//               <thead>
//                 <tr>
//                     <th><span>Invoice N</span></th>
//                     <th><span>Billing Date</span></th>
//                     <th><span>Room</span></th>
//                     <th><span>PAX</span></th>
//                     <th><span>Main Guest Name</span></th>
//                     <th><span>Check in Date</span></th>
//                     <th><span>Check out Date</span></th>
//                     <th><span>Page</span></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                     <td>{invoice.invoiceNo}</td>
//                     <td>{invoice.billingDate}</td>
//                     <td>{invoice.roomNo}</td>
//                     <td>{invoice.pax}</td>
//                     {/* Preserving the line break requested for the guest name */}
//                     <td style={{ whiteSpace: 'pre-wrap' }}>{invoice.guestName}</td>
//                     <td>{invoice.checkInDate}</td>
//                     <td>{invoice.checkOutDate}</td>
//                     <td>{page.pageNo}/{page.totalPages}</td>
//                 </tr>
//               </tbody>
//             </table>

//             {/* Items Table */}
//             <table className="items-table">
//               <thead>
//                 <tr>
//                     <th style={{ width: '70px' }}></th>
//                     <th><span>Item</span></th>
//                     <th className="text-center"><span>Qty</span></th>
//                     <th className="text-right"><span>Net Unit Price</span></th>
//                     <th className="text-right"><span>Net Amount</span></th>
//                     <th className="text-right"><span>Tax</span></th>
//                     <th className="text-right"><span>Tax Amt</span></th>
//                     <th className="text-right"><span>Debit</span></th>
//                     <th className="text-right"><span>Credit</span></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {page.items.map((item, i) => (
//                   <tr key={item.id || i}>
//                       <td>{item.date}</td>
//                       <td>{item.desc}</td>
//                       <td className="text-center">{item.qty}</td>
//                       <td className="text-right">{formatCurrency(item.netUnitPrice)}</td>
//                       <td className="text-right">{formatCurrency(item.netAmount)}</td>
//                       <td className="text-right">{item.tax}</td>
//                       <td className="text-right">{formatCurrency(item.taxAmt)}</td>
//                       <td className="text-right">{item.debit ? formatCurrency(item.debit) : ""}</td>
//                       <td className="text-right">{item.credit ? formatCurrency(item.credit) : ""}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>

//             {/* Print Totals, Payment Method, and Tax info ONLY on the last page */}
//             {page.showTotals && (
//               <>
//                 <div className="summary-wrapper">
//                     <table className="summary-table">
//                       <tbody>
//                         <tr>
//                             <td style={{ textAlign: 'left' }}>Subtotal</td>
//                             <td className="text-right">{formatCurrency(invoice.summary.subtotal)}</td>
//                         </tr>
//                         <tr>
//                             <td style={{ textAlign: 'left'}}>Accommodation Tax</td>
//                             <td className="text-right">{formatCurrency(invoice.summary.accommodationTax)}</td>
//                         </tr>
//                         <tr>
//                             <td style={{ textAlign: 'left' }}>Total</td>
//                             <td className="text-right">{formatCurrency(invoice.summary.grandTotal)}</td>
//                         </tr>
//                       </tbody>
//                     </table>
//                 </div>

//                 <div className="payment-wrapper">
//                     <div className="payment-block">
//                         <div className="payment-title">Payment Method</div>
                        
//                         <div className="payment-row" style={{marginBottom:"15px"}}>
//                             <span>PREPAYMENT W/O INVOI</span>
//                             <span>{formatCurrency(invoice.summary.grandTotal)} TRY</span>
//                         </div>
                        
//                         <div className="payment-line"></div>
                        
//                         <div className="payment-row">
//                             <span>Balance due</span>
//                             <span>{formatCurrency(invoice.summary.balance)} TRY</span>
//                         </div>
//                     </div>
//                 </div>
//                 <div style={{display:"flex", justifyContent:"flex-end"}}>
//                 {/* Hardcoded exactly matching original HTML layout for taxes, but mapped total variables where possible */}
//                 <table className="tax-table">
//                     <thead>
//                         <tr>
//                             <th style={{ textAlign: 'left', width: '20%',paddingBottom:"0px " }}>Tax info</th>
//                             <th className="text-center" style={{paddingBottom:"0px " }}>Tax</th>
//                             <th className="text-right" style={{paddingBottom:"0px " }}>Net Amount</th>
//                             <th className="text-right" style={{paddingBottom:"0px " }}>Tax Amt</th>
//                             <th className="text-right" style={{paddingBottom:"0px " }}>Total Debit</th>
//                             <th className="text-right" style={{paddingBottom:"0px " }}>Total Credit</th>
//                         </tr>
//                         <tr><td colSpan="6" className="tax-line-header" style={{ padding: 0 }}></td></tr>
//                     </thead>
//                     <tbody>
//                         <tr>
//                             <td>VAT</td>
//                             <td className="text-center">0%</td>
//                             <td className="text-right">0,05</td>
//                             <td className="text-right">0,00</td>
//                             <td className="text-right">0,05</td>
//                             <td></td>
//                         </tr>
//                         <tr>
//                             <td>VAT</td>
//                             <td className="text-center">10%</td>
//                             <td className="text-right">96.847,64</td>
//                             <td className="text-right">9.684,76</td>
//                             <td className="text-right">106.532,40</td>
//                             <td></td>
//                         </tr>
//                         <tr >
//                             <td style={{ paddingBottom:"15px"}}>Accommodation Tax</td>
//                             <td className="text-center">0%</td>
//                             <td className="text-right">1.936,92</td>
//                             <td className="text-right">0,00</td>
//                             <td className="text-right">1.936,92</td>
//                             <td></td>
//                         </tr>
//                         <tr><td colSpan="6" className="tax-line-footer" style={{ padding: 0 }}></td></tr>
                        
//                         <tr className="tax-total-row">
//                             <td style={{ fontWeight: 'bold' }}>Total</td>
//                             <td></td>
//                             <td className="text-right">98.784,61</td>
//                             <td className="text-right">9.684,76</td>
//                             <td className="text-right">{formatCurrency(invoice.summary.grandTotal)} <strong>TRY</strong></td>
//                             <td></td>
//                         </tr>
//                     </tbody>
//                 </table>
//                </div>
//                 <div className="signature-block">
//                     <span className="sig-text">Signature</span>
//                     <span className="sig-line"></span>
//                 </div>

//                 <div className="notes-block">
//                     ABOVE PRICES INCLUDE 10% SERVICE CHARGE, 7% MUNICIPALITY FEES & 5% VAT
//                 </div>

//                 <div className="bottom-footer">
//                     <p>Radisson Blu Hotel Istanbul, Sisli</p>
//                     <p>19 MAYIS CAD. NO 2, Turkey, Istanbul, Istanbul, 34360 Istanbul, Turkey</p>
//                     <p>T: +90 (212) 3750000 | info.sisli.istanbul@radissonblu.com</p>
//                     <p>https://www.radissonhotels.com/en-us/hotels/radisson-blu-istanbul-sisli</p>
//                     <p>Sisli Otelcilik Isletmeleri AS 19 Mayis Mh. 19 Mayis Cd. No:2/1 Sisli Istanbul Mecidiyeköy VD: 8140482439</p>
//                     <p>Şekerbank TRY TR12 0005 9020 1013 0201 0050 23</p>
//                     <p>Şekerbank EUR TR46 0005 9020 1013 0201 0051 87</p>
//                     <p>Şekerbank USD TR73 0005 9020 1013 0201 0051 86</p>
//                 </div>
//               </>
//             )}
//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default RadissonHerbyeInvoiceView



///2nd bes perfect
// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// import logo from '../../../public/radisson_blu_turkey-logo.png';

// // ─────────────────────────────────────────────────────────────────────────────
// // PURE HELPERS  (no side-effects, safe to call anywhere)
// // ─────────────────────────────────────────────────────────────────────────────

// const formatDate = (dateStr) => {
//   if (!dateStr) return "";
//   try {
//     const d = new Date(dateStr);
//     if (isNaN(d.getTime())) return dateStr;
//     const dd = String(d.getDate()).padStart(2, '0');
//     const mm = String(d.getMonth() + 1).padStart(2, '0');
//     return `${dd}.${mm}.${d.getFullYear()}`;
//   } catch { return dateStr; }
// };

// // Turkish locale: dot thousands separator, comma decimal  e.g. 6.701,05
// const formatCurrency = (val) => {
//   if (val === null || val === undefined || val === "") return "0,00";
//   return parseFloat(val).toLocaleString('tr-TR', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
// };

// const parseDateForSort = (dateStr) => {
//   if (!dateStr) return 0;
//   const d = new Date(dateStr);
//   return isNaN(d.getTime()) ? 0 : d.getTime();
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // API → VIEW SCHEMA MAPPER
// // Reads the exact field names that come from the backend (document index 9).
// // ─────────────────────────────────────────────────────────────────────────────

// const mapApiDataToInvoice = (data = {}) => {

//   // ── 1. Build line items from accommodationDetails ─────────────────────────
//   //
//   // Each element of accommodationDetails contains TWO sub-rows:
//   //   hotelExpenses   → Otel Harcamaları / Hotel Expenses  (10% VAT)
//   //   accommodationTax → Accommodation Tax                 (0% VAT, per PAX)
//   //
//   const accItems = [];
//   (data.accommodationDetails || []).forEach((night) => {
//     const he = night.hotelExpenses;
//     const at = night.accommodationTax;

//     if (he) {
//       accItems.push({
//         id:           `he_${night.day}`,
//         rawDate:      parseDateForSort(he.date),
//         date:         formatDate(he.date),
//         desc:         he.description,
//         qty:          he.qty,
//         netUnitPrice: he.netUnitPrice,
//         netAmount:    he.netAmount,
//         tax:          he.tax,
//         taxAmt:       he.taxAmount,
//         debit:        he.debit,
//         credit:       he.credit || "",
//       });
//     }

//     if (at) {
//       accItems.push({
//         id:           `at_${night.day}`,
//         rawDate:      parseDateForSort(at.date),
//         date:         formatDate(at.date),
//         desc:         at.description,
//         qty:          at.qty,
//         netUnitPrice: at.netUnitPrice,
//         netAmount:    at.netAmount,
//         tax:          at.tax,
//         taxAmt:       at.taxAmount,
//         debit:        at.debit,
//         credit:       at.credit || "",
//       });
//     }
//   });

//   // ── 2. Build line items from otherServices ────────────────────────────────
//   //
//   // Backend field names: name, date, amount, taxable_amount, vat_20_percent
//   //
//   const serviceItems = (data.otherServices || []).map((svc, i) => ({
//     id:           `svc_${i}`,
//     rawDate:      parseDateForSort(svc.date),
//     date:         formatDate(svc.date),
//     desc:         svc.name,
//     qty:          1,
//     netUnitPrice: svc.taxable_amount,   // net (excl. VAT)
//     netAmount:    svc.taxable_amount,
//     tax:          "20%",
//     taxAmt:       svc.vat_20_percent,
//     debit:        svc.amount,           // gross (incl. VAT)
//     credit:       "",
//   }));

//   // ── 3. Combine and sort by date (oldest → newest) ─────────────────────────
//   const allItems = [...accItems, ...serviceItems].sort(
//     (a, b) => a.rawDate - b.rawDate
//   );

//   // ── 4. Summary totals — from top-level backend fields ────────────────────
//   //
//   // taxableAmount      = total net amount (room)          → "Subtotal" net column
//   // totalAccTax        = accommodation tax 2%             → "Accommodation Tax" row
//   // grandTotal         = total incl all VAT + acc tax     → "Total" row
//   // totalInEur         = grand total in EUR               (shown in payment block)
//   // totalVat10         = VAT 10% on room
//   // totalVat20         = VAT 20% on services
//   // totalServicesGross = gross services total
//   // totalServicesTaxable = taxable services total
//   //
//   const taxableRoom     = data.taxableAmount        || 0;   // d  (room net)
//   const totalAccTax     = data.totalAccTax          || 0;   // j
//   const grandTotal      = data.grandTotal           || 0;   // k
//   const totalVat10      = data.totalVat10           || 0;   // g
//   const totalVat20      = data.totalVat20           || 0;   // h
//   const totalSvcGross   = data.totalServicesGross   || 0;   // c
//   const totalSvcTaxable = data.totalServicesTaxable || 0;   // e
//   const totalRoomGross  = data.totalRoomAllNights   || 0;   // b

//   // Tax info table rows — derived from backend values
//   // Row 1: VAT 0% = accommodation tax rows
//   // Row 2: VAT 10% = room charges
//   // Row 3: VAT 20% = services (only if present)
//   // Row Acc Tax: accommodation tax total
//   const taxRows = [];

//   if (totalAccTax > 0) {
//     taxRows.push({
//       label:     "Accommodation Tax",
//       taxRate:   "0%",
//       netAmount: totalAccTax,
//       taxAmt:    0,
//       debit:     totalAccTax,
//     });
//   }

//   if (taxableRoom > 0) {
//     taxRows.push({
//       label:     "VAT",
//       taxRate:   "10%",
//       netAmount: taxableRoom,
//       taxAmt:    totalVat10,
//       debit:     taxableRoom + totalVat10,
//     });
//   }

//   if (totalSvcTaxable > 0) {
//     taxRows.push({
//       label:     "VAT",
//       taxRate:   "20%",
//       netAmount: totalSvcTaxable,
//       taxAmt:    totalVat20,
//       debit:     totalSvcGross,
//     });
//   }

//   // Totals row
//   const taxTotalNetAmount = taxableRoom + totalAccTax + totalSvcTaxable;
//   const taxTotalTaxAmt    = totalVat10 + totalVat20;

//   return {
//     // Header fields
//     invoiceNo:    data.invoiceN        || "",
//     billingDate:  formatDate(data.billingDate  || data.invoiceDate) || "",
//     roomNo:       data.roomNo          || "",
//     pax:          data.pax             || 1,
//     guestName:    data.guestName       || "",
//     checkInDate:  formatDate(data.arrivalDate)   || "",
//     checkOutDate: formatDate(data.departureDate) || "",

//     // Address block
//     party:       data.party       || "",
//     branch:      data.branch      || "",
//     reservation: data.reservation || "",
//     voucher:     data.voucherNo   || data.reservation || "",

//     // Line items
//     items: allItems,

//     // Summary panel (right side)
//     summary: {
//       subtotal:         totalRoomGross,   // b — total room all nights (gross)
//       accommodationTax: totalAccTax,      // j
//       grandTotal:       grandTotal,       // k
//       balance:          0,
//     },

//     // Tax info table
//     taxRows,
//     taxTotalNetAmount,
//     taxTotalTaxAmt,
//     grandTotal,
//   };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // PAGINATION
// // Splits items across pages; every page gets header + footer.
// // ─────────────────────────────────────────────────────────────────────────────
// const MAX_ROWS_PER_PAGE = 24;

// const buildPages = (items = []) => {
//   if (items.length === 0) {
//     return [{ items: [], showTotals: true, pageNo: 1, totalPages: 1 }];
//   }
//   const pages = [];
//   for (let i = 0; i < items.length; i += MAX_ROWS_PER_PAGE) {
//     pages.push({
//       items:      items.slice(i, i + MAX_ROWS_PER_PAGE),
//       showTotals: i + MAX_ROWS_PER_PAGE >= items.length,
//     });
//   }
//   const total = pages.length;
//   pages.forEach((p, idx) => { p.pageNo = idx + 1; p.totalPages = total; });
//   return pages;
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────

// const RadissonHerbyeInvoiceView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const location      = useLocation();
//   const navigate      = useNavigate();

//   const [invoice,        setInvoice]        = useState(null);
//   const [loading,        setLoading]        = useState(true);
//   const [pdfLoading,     setPdfLoading]     = useState(false);
//   const [paginatedData,  setPaginatedData]  = useState([]);
//   const invoiceRef = useRef(null);

//   const isPdfDownload = location.pathname.includes("/download-pdf");

//   // ── Load ────────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     setInvoice(mapApiDataToInvoice(invoiceData || {}));
//     setLoading(false);
//   }, [invoiceData]);

//   // ── Paginate ────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!invoice?.items) return;
//     setPaginatedData(buildPages(invoice.items));
//   }, [invoice]);

//   // ── Auto-download PDF if on /download-pdf route ─────────────────────────
//   useEffect(() => {
//     if (isPdfDownload && invoice && invoiceRef.current) {
//       const timer = setTimeout(async () => {
//         await handleDownloadPDF();
//         navigate("/invoices", { replace: true });
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [isPdfDownload, invoice, navigate]);

//   // ── PDF ─────────────────────────────────────────────────────────────────────
//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     try {
//       const images = invoiceRef.current.querySelectorAll('img');
//       await Promise.all(Array.from(images).map(img => {
//         if (img.complete) return Promise.resolve();
//         return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
//       }));
//       await new Promise(resolve => setTimeout(resolve, 500));

//       const opt = {
//         margin:    0,
//         filename:  `Radisson_Invoice_${invoice.invoiceNo || 'Invoice'}.pdf`,
//         image:     { type: 'jpeg', quality: 1 },
//         html2canvas: {
//           scale:         3,
//           useCORS:       true,
//           letterRendering: true,
//           scrollY:       0,
//           windowWidth:   794,
//           // Force consistent font rendering — no OS-level font substitution
//           logging:       false,
//         },
//         jsPDF:     { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['css', 'legacy'], avoid: ['.avoid-break'] },
//       };

//       await html2pdf().set(opt).from(invoiceRef.current).save();
//       toast.success("PDF Downloaded");
//     } catch (err) {
//       console.error("PDF Error:", err);
//       toast.error("PDF generation failed");
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   if (!invoice) return null;

//   // ─────────────────────────────────────────────────────────────────────────
//   // STYLES  — identical between screen view AND PDF capture.
//   // Key fixes vs original:
//   //   • Removed margin-bottom: 50px / 70px from logo / top-section
//   //     (was causing extra whitespace in PDF).
//   //   • Font stack pinned to Arial only (no fallback that changes rendering).
//   //   • Page padding reduced slightly so content fits A4 without clipping.
//   //   • Header + footer repeat on every page (moved inside page loop).
//   // ─────────────────────────────────────────────────────────────────────────
//   const styles = `
//     @page { size: A4; margin: 0mm; }

//     * { box-sizing: border-box; }

//     .invoice-box {
//       width: 100%;
//       font-family: Arial, sans-serif;
//       font-size: 9px;
//       color: #000;
//       background: transparent;
//       -webkit-print-color-adjust: exact;
//       print-color-adjust: exact;
//     }

//     /* ── Single A4 page wrapper ── */
//     .inv-page {
//       width: 100%;
//       max-width: 794px;
//       padding: 8mm 10mm 6mm 10mm;
//       margin: 0 auto 24px auto;
//       background: #fff;
//       box-shadow: 0 0 10px rgba(0,0,0,0.1);
//       page-break-after: always;
//       break-after: page;
//       position: relative;
//     }
//     .inv-page:last-child {
//       page-break-after: avoid;
//       break-after: avoid;
//       margin-bottom: 0;
//     }

//     /* ── Logo — no bottom gap ── */
//     .logo-container {
//       display: flex;
//       justify-content: center;
//       margin-bottom: 20px;
//     }
//     .logo-container img { max-width: 190px; margin-bottom: 37px; }

//     /* ── Address + "Copy" row ── */
//     .top-section {
//       display: flex;
//       justify-content: space-between;
//       margin-bottom: 60px;
//       font-size: 8px;
//     }
//     .address-block p { margin: 0; line-height: 1.45; }
//     .address-block .bold { font-weight: bold; }
//     .address-block .inline-info { display: flex; gap: 20px; }
//     .copy-text { font-weight: bold; font-size: 9px; margin-top: 30px; margin-right: 275px; }

//     /* ── General table reset ── */
//     table { width: 100%; border-collapse: collapse; }
//     th, td { padding: 4px 2px; vertical-align: top; }
//     .text-right  { text-align: right  !important; }
//     .text-center { text-align: center !important; }

//     /* ── Guest header table ── */
//     .guest-table th {
//       text-align: left;
//       font-weight: bold;
//       font-style: italic;
//       font-size: 8px;
//     }
//     .guest-table th span { text-decoration: underline; }
//     .guest-table td { padding-bottom: 30px; }

//     /* ── Line items table ── */
//     .items-table th {
//       text-align: left;
//       font-weight: bold;
//       font-style: italic;
//       font-size: 8px;
//     }
//     .items-table th span { text-decoration: underline; }
//     .items-table { margin-bottom: 16px; }
//     .items-table tbody tr td { line-height: 1.4; }

//     /* ── Summary (subtotal block) ── */
//     .summary-wrapper { display: flex; justify-content: flex-end; margin-bottom: 16px; }
//     .summary-table { width: 58%; }
//     .summary-table td { padding: 3px 0; }

//     /* ── Payment method ── */
//     .payment-wrapper { display: flex; justify-content: flex-end; margin-bottom: 20px; }
//     .payment-block   { width: 62%; }
//     .payment-title   { font-weight: bold; font-style: italic; }
//     .payment-row     { display: flex; justify-content: space-between; padding: 5px 0; }
//     .payment-line    { border-bottom: 1px solid #000; margin: 2px 0; }

//     /* ── Tax info table ── */
//     .tax-wrapper { display: flex; justify-content: flex-end; }
//     .tax-table   { width: 80%; }
//     .tax-table th {
//       font-weight: bold;
//       font-style: italic;
//       font-size: 8px;
//       padding-bottom: 0;
//     }
//     .tax-line-header, .tax-line-footer { border-bottom: 1px solid #000; padding: 0 !important; }
//     .tax-table td { padding: 2px 2px; }
//     .tax-total-row td { padding-top: 8px; }

//     /* ── Signature ── */
//     .signature-block {
//       margin-bottom: 20px;
//       display: flex;
//       align-items: flex-end;
//     }
//     .sig-text { margin-right: 105px; }
//     .sig-line { border-bottom: 1px solid #000; width: 100px; display: inline-block; }

//     /* ── Notes ── */
//     .notes-block { margin-bottom: 40px; }

//     /* ── Footer text ── */
//     .bottom-footer { font-size: 8px; line-height: 1.5; color: #000; }
//     .bottom-footer p { margin: 1px 0; }

//     /* ── Print overrides ── */
//     @media print {
//       .invoice-box { background: none !important; }
//       .inv-page {
//         box-shadow: none !important;
//         margin: 0 auto !important;
//         page-break-after: always !important;
//         break-after: page !important;
//       }
//       .inv-page:last-child {
//         page-break-after: avoid !important;
//         break-after: avoid !important;
//       }
//       .no-print { display: none !important; }
//     }
//   `;

//   // ── Shared header rendered at top of EVERY page ──────────────────────────
//   const PageHeader = ({ page }) => (
//     <>
//       <div className="logo-container">
//         <img src={logo} alt="Radisson Logo" />
//       </div>

//       <div className="top-section">
//         <div className="address-block">
//           <p style={{ fontStyle: 'italic', fontWeight: 'bold', textDecoration: 'underline' }}>
//             Fiscal Information
//           </p>
//           <p>/</p>
//           <p>AZAR TOURISM</p>
//           <p>ALGERIA SQUARE BUILDING NUMBER 12 FIRST FLOOR 12/1</p>
//           <p>1254</p>
//           <p>TRIPOLI - Libya</p>
//           <div className="inline-info">
//             <p><span className="bold">Party</span> {invoice.party}</p>
//             <p><span className="bold">Branch</span> {invoice.branch}</p>
//           </div>
//           <div className="inline-info">
//             <p><span className="bold">Reservation</span> {invoice.reservation}</p>
//             <p><span className="bold">Voucher</span> {invoice.voucher}</p>
//           </div>
//         </div>
//         <div className="copy-text">Copy</div>
//       </div>

//       <table className="guest-table">
//         <thead>
//           <tr>
//             <th><span>Invoice N</span></th>
//             <th><span>Billing Date</span></th>
//             <th><span>Room</span></th>
//             <th><span>PAX</span></th>
//             <th><span>Main Guest Name</span></th>
//             <th><span>Check in Date</span></th>
//             <th><span>Check out Date</span></th>
//             <th><span>Page</span></th>
//           </tr>
//         </thead>
//         <tbody>
//           <tr>
//             <td>{invoice.invoiceNo}</td>
//             <td>{invoice.billingDate}</td>
//             <td>{invoice.roomNo}</td>
//             <td>{invoice.pax}</td>
//             <td style={{ whiteSpace: 'pre-wrap' }}>{invoice.guestName}</td>
//             <td>{invoice.checkInDate}</td>
//             <td>{invoice.checkOutDate}</td>
//             <td>{page.pageNo}/{page.totalPages}</td>
//           </tr>
//         </tbody>
//       </table>
//     </>
//   );

//   // ── Footer rendered at bottom of EVERY page ───────────────────────────────
//   const PageFooter = () => (
//     <div className="bottom-footer" style={{ marginTop: 'auto', paddingTop: '10px' }}>
//       <p>Radisson Hotel Istanbul Harbiye</p>
//       <p>Cumhuriyet Caddesi No: 8 Harbiye, 34367 Istanbul, Turkey</p>
//       <p>T: +90 (212) 3686868 | info.harbiye.istanbul@radissonhotels.com</p>
//       <p>https://www.radissonhotels.com/en-us/hotels/radisson-istanbul-harbiye</p>
//       <p>Harbiye Otelcilik ve Turizm A.S. — VD: Mecidiyeköy 8140462491</p>
//       <p>Şekerbank TRY TR12 0005 9020 1013 0201 0050 23</p>
//       <p>Şekerbank EUR TR46 0005 9020 1013 0201 0051 87</p>
//       <p>Şekerbank USD TR73 0005 9020 1013 0201 0051 86</p>
//     </div>
//   );

//   // ─────────────────────────────────────────────────────────────────────────
//   // RENDER
//   // ─────────────────────────────────────────────────────────────────────────
//   return (
//     <InvoiceTemplate
//       loading={loading}
//       invoice={invoice}
//       pdfLoading={pdfLoading}
//       onDownloadPDF={handleDownloadPDF}
//       onPrint={() => window.print()}
//       onBack={() => navigate("/invoices")}
//     >
//       <div className="invoice-box" ref={invoiceRef}>
//         <style dangerouslySetInnerHTML={{ __html: styles }} />

//         {paginatedData.map((page, pageIdx) => (
//           <div
//             className="inv-page"
//             key={pageIdx}
//             style={{
//               display: 'flex',
//               flexDirection: 'column',
//               minHeight: '277mm',           // A4 height minus margins
//             }}
//           >
//             {/* ── Header (logo + address + guest row) — every page ── */}
//             <PageHeader page={page} />

//             {/* ── Line items ── */}
//             <table className="items-table">
//               <thead>
//                 <tr>
//                   <th style={{ width: '70px' }}></th>
//                   <th><span>Item</span></th>
//                   <th className="text-center"><span>Qty</span></th>
//                   <th className="text-right"><span>Net Unit Price</span></th>
//                   <th className="text-right"><span>Net Amount</span></th>
//                   <th className="text-right"><span>Tax</span></th>
//                   <th className="text-right"><span>Tax Amt</span></th>
//                   <th className="text-right"><span>Debit</span></th>
//                   <th className="text-right"><span>Credit</span></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {page.items.map((item, i) => (
//                   <tr key={item.id || i}>
//                     <td>{item.date}</td>
//                     <td>{item.desc}</td>
//                     <td className="text-center">{item.qty}</td>
//                     <td className="text-right">{formatCurrency(item.netUnitPrice)}</td>
//                     <td className="text-right">{formatCurrency(item.netAmount)}</td>
//                     <td className="text-right">{item.tax}</td>
//                     <td className="text-right">{formatCurrency(item.taxAmt)}</td>
//                     <td className="text-right">{item.debit !== "" ? formatCurrency(item.debit) : ""}</td>
//                     <td className="text-right">{item.credit !== "" ? formatCurrency(item.credit) : ""}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>

//             {/* ── Totals block — last page only ── */}
//             {page.showTotals && (
//               <>
//                 {/* Subtotal / Accommodation Tax / Total */}
//                 <div className="summary-wrapper">
//                   <table className="summary-table">
//                     <tbody>
//                       <tr>
//                         <td style={{ textAlign: 'left' }}>Subtotal</td>
//                         <td className="text-right">{formatCurrency(invoice.summary.subtotal)}</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: 'left' }}>Accommodation Tax</td>
//                         <td className="text-right">{formatCurrency(invoice.summary.accommodationTax)}</td>
//                       </tr>
//                       <tr>
//                         <td style={{ textAlign: 'left' }}>Total</td>
//                         <td className="text-right">{formatCurrency(invoice.summary.grandTotal)}</td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>

//                 {/* Payment Method */}
//                 <div className="payment-wrapper">
//                   <div className="payment-block">
//                     <div className="payment-title">Payment Method</div>
//                     <div className="payment-row" style={{ marginBottom: '12px' }}>
//                       <span>PREPAYMENT W/O INVOI</span>
//                       <span>{formatCurrency(invoice.summary.grandTotal)} TRY</span>
//                     </div>
//                     <div className="payment-line" />
//                     <div className="payment-row">
//                       <span>Balance due</span>
//                       <span>{formatCurrency(invoice.summary.balance)} TRY</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Tax info table — computed from real API values */}
//                 <div className="tax-wrapper">
//                   <table className="tax-table">
//                     <thead>
//                       <tr>
//                         <th style={{ textAlign: 'left', width: '20%' }}>Tax info</th>
//                         <th className="text-center">Tax</th>
//                         <th className="text-right">Net Amount</th>
//                         <th className="text-right">Tax Amt</th>
//                         <th className="text-right">Total Debit</th>
//                         <th className="text-right">Total Credit</th>
//                       </tr>
//                       <tr><td colSpan="6" className="tax-line-header" /></tr>
//                     </thead>
//                     <tbody>
//                       {invoice.taxRows.map((row, i) => (
//                         <tr key={i} style={ i === invoice.taxRows.length - 1 ? { paddingBottom: '12px' } : {}}>
//                           <td style={ i === invoice.taxRows.length - 1 ? { paddingBottom: '12px' } : {}}>{row.label}</td>
//                           <td className="text-center">{row.taxRate}</td>
//                           <td className="text-right">{formatCurrency(row.netAmount)}</td>
//                           <td className="text-right">{formatCurrency(row.taxAmt)}</td>
//                           <td className="text-right">{formatCurrency(row.debit)}</td>
//                           <td></td>
//                         </tr>
//                       ))}
//                       <tr><td colSpan="6" className="tax-line-footer" /></tr>
//                       <tr className="tax-total-row">
//                         <td style={{ fontWeight: 'bold' }}>Total</td>
//                         <td></td>
//                         <td className="text-right">{formatCurrency(invoice.taxTotalNetAmount)}</td>
//                         <td className="text-right">{formatCurrency(invoice.taxTotalTaxAmt)}</td>
//                         <td className="text-right">
//                           {formatCurrency(invoice.grandTotal)} <strong>TRY</strong>
//                         </td>
//                         <td></td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>

//                 {/* Signature */}
//                 <div className="signature-block" style={{ marginTop: '16px' }}>
//                   <span className="sig-text">Signature</span>
//                   <span className="sig-line" />
//                 </div>

//                 {/* Notes */}
//                 <div className="notes-block">
//                   ABOVE PRICES INCLUDE 10% VAT &amp; 2% ACCOMMODATION TAX
//                 </div>
//               </>
//             )}

//             {/* ── Footer — every page ── */}
//             <PageFooter />
//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default RadissonHerbyeInvoiceView;

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '../../../public/radisson_blu_turkey-logo.png';

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