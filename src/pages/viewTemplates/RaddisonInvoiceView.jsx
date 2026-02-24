// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import cairoInvoiceApi from "../../Api/cairoInvoice.api";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// import logo from '../../../public/raddison-logo.png'; 

// const RaddisonInvoiceView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [paginatedData, setPaginatedData] = useState([]);
//   const invoiceRef = useRef(null);

//   const ROWS_PER_PAGE = 19;
//   const isPdfDownload = location.pathname.includes("/download-pdf");

//   useEffect(() => {
//     if (invoiceData) {
//       setInvoice(transformInvoiceData(invoiceData));
//       setLoading(false);
//     } else if (invoiceId) {
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
//       const response = await cairoInvoiceApi.getInvoiceById(invoiceId);
      
//       let rawData = response.data || response;
//       if (rawData.data) {
//         rawData = rawData.data;
//         if (rawData.data) {
//           rawData = rawData.data;
//         }
//       }
      
//       setInvoice(transformInvoiceData(rawData));
//     } catch (err) {
//       console.error("Error fetching Egypt invoice:", err);
//       setError("Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const transformInvoiceData = (data) => {
//     if (!data) return null;

//     const transactions = [];
    
//     if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
//       data.accommodationDetails.forEach((item, index) => {
//         const formattedDate = formatDate(item.date);
//         const rawD = new Date(item.date).getTime() || 0; 
        
//         transactions.push({ id: `acc_${index}`, date: formattedDate, rawDate: rawD, desc: "Accommodation", charges: item.baseRate || 0, credits: "", type: 1 });
//         transactions.push({ id: `sc_${index}`, date: formattedDate, rawDate: rawD, desc: "12% Service Charge", charges: item.serviceCharge || 0, credits: "", type: 2 });
//         transactions.push({ id: `vat_${index}`, date: formattedDate, rawDate: rawD, desc: "14% VAT", charges: item.vat || 0, credits: "", type: 3 });
//         transactions.push({ id: `ct_${index}`, date: formattedDate, rawDate: rawD, desc: "1% City Tax", charges: item.cityTax || 0, credits: "", type: 4 });
//       });
//     }

//     if (data.otherServices && Array.isArray(data.otherServices)) {
//       data.otherServices.forEach((service, index) => {
//         const formattedDate = formatDate(service.date);
//         const rawD = new Date(service.date).getTime() || 0;

//         transactions.push({
//           id: `srv_${index}`,
//           date: formattedDate,
//           rawDate: rawD,
//           desc: service.name || "Service",
//           charges: service.amount || 0,
//           credits: "",
//           type: 5
//         });
//       });
//     }

//     transactions.sort((a, b) => {
//       const timeDiff = a.rawDate - b.rawDate;
//       if (timeDiff !== 0) return timeDiff;
//       return a.type - b.type;
//     });

//     return {
//       ...data,
//       transactions,
//       formattedInvoiceDate: formatDate(data.invoiceDate),
//       formattedArrivalDate: formatDate(data.arrivalDate),
//       formattedDepartureDate: formatDate(data.departureDate),
//     };
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

//   useEffect(() => {
//     if (invoice && invoice.transactions) {
//       const pages = [];
//       const totalTx = invoice.transactions.length;
      
//       if (totalTx === 0) {
//           pages.push({ items: [], pageNo: 1, totalPages: 1, showTotals: true });
//       } else {
//           const totalPages = Math.ceil(totalTx / ROWS_PER_PAGE);
//           for (let i = 0; i < totalTx; i += ROWS_PER_PAGE) {
//             pages.push({
//               items: invoice.transactions.slice(i, i + ROWS_PER_PAGE),
//               pageNo: Math.floor(i / ROWS_PER_PAGE) + 1,
//               totalPages: totalPages,
//               showTotals: (i + ROWS_PER_PAGE) >= totalTx 
//             });
//           }
//       }
      
//       setPaginatedData(pages);
//     }
//   }, [invoice, ROWS_PER_PAGE]);

//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const element = invoiceRef.current;
    
//     // Add class to fix PDF spacing and alignment issues
//     element.classList.add('pdf-print-mode');

//     const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//     headStyles.forEach(style => {
//         const text = style.textContent || "";
//         const href = style.href || "";
        
//         const isOurFont = text.includes('GOHQLJ+Times,New Roman') || 
//                           text.includes('Times New Roman') ||
//                           href.includes('StaybridgeFont');

//         if (isOurFont) return; 

//         if (style.parentNode) {
//             style.parentNode.removeChild(style);
//         }
//     });

//     try {
//       const images = invoiceRef.current.querySelectorAll('img');
//       await Promise.all(Array.from(images).map(img => {
//           if (img.complete) return Promise.resolve();
//           return new Promise(resolve => {
//               img.onload = resolve;
//               img.onerror = resolve;
//           });
//       }));

//       await new Promise(resolve => setTimeout(resolve, 500));

//       const opt = {
//         margin: 0,
//         filename: `${invoice.referenceNo || 'Radisson'}.`,
//         image: { type: 'jpeg', quality: 1 },
//         html2canvas: { 
//             scale: 2, 
//             useCORS: true, 
//             letterRendering: true,
//             scrollY: 0,
//             x: 0,
//             y: 0
//         },
//         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['css', 'legacy'] }
//       };
      
//       await html2pdf().set(opt).from(element).save();
//       toast.success("PDF Downloaded Successfully");
//     } catch (err) {
//       console.error("PDF Error:", err);
//       toast.error("Failed to generate PDF");
//     } finally {
//       // Revert screen back to normal
//       element.classList.remove('pdf-print-mode');
      
//       headStyles.forEach(style => {
//           if (!style.parentNode) {
//               document.head.appendChild(style);
//           }
//       });
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   if (!invoice) {
//       return (
//           <InvoiceTemplate loading={loading} error={error} invoice={invoice} onBack={() => navigate("/invoices")}>
//               <></>
//           </InvoiceTemplate>
//       );
//   }

//   const addressParts = invoice.address ? invoice.address.split(',') : [];
//   const addressLine1 = addressParts[0] ? addressParts[0].trim() : "";
//   const addressLine2 = addressParts.slice(1).join(',').trim();

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
//       {/* Wrapper to isolate the centering from the PDF target element */}
//       <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
//         <div className="radisson-invoice-wrapper" ref={invoiceRef}>
//           <style dangerouslySetInnerHTML={{__html: `
//             .radisson-invoice-wrapper {
//                 width: 210mm;
//                 background-color: transparent;
//             }
//             .radisson-invoice-wrapper * {
//                 font-family: Arial, sans-serif;
//                 color: #000;
//             }
//             .page {
//                 width: 210mm;
//                 min-height: 296mm;
//                 padding: 12mm 15mm;
//                 margin: 0 0 20px 0;
//                 background: #fff;
//                 box-shadow: 0 0 10px rgba(0,0,0,0.1);
//                 box-sizing: border-box;
//                 position: relative;
//                 font-size: 11px;
//                 line-height: 1.3;
//             }
            
//             .logo-container {
//                 display: flex;
//                 justify-content: center;
//                 align-items: center;
//                 width: 100%;
//                 margin-bottom: 40px;
//             }
//             .logo-container img {
//                 width: 200px; 
//                 height: auto;
//             }
//             .info-section {
//                 display: flex;
//                 justify-content: space-between;
//                 margin-bottom: 30px;
//             }
//             .left-col, .right-col {
//                 width: 48%;
//             }
//             .bold { font-weight: bold; }
//             .mb-10 { margin-bottom: 10px; }
//             .mb-20 { margin-bottom: 20px; }
            
//             .grid-info-left {
//                 display: grid;
//                 grid-template-columns: 130px 15px auto;
//                 row-gap: 4px;
//             }
//             .grid-info-right {
//                 display: grid;
//                 grid-template-columns: 100px 15px auto;
//                 row-gap: 4px;
//                 font-weight: bold;
//             }
//             .invoice-table {
//                 width: 100%;
//                 border-collapse: collapse;
//                 margin-bottom: 20px;
//             }
//             .invoice-table thead th {
//                 background-color: #000 !important;
//                 color: #fff !important;
//                 text-align: left;
//                 padding: 6px 8px;
//                 font-weight: normal;
//                 vertical-align: top;
//                 -webkit-print-color-adjust: exact !important;
//                 print-color-adjust: exact !important;
//                 color-adjust: exact !important;
//                 border-left: 1px solid #555 !important;
//             }
//             .invoice-table thead th:first-child {
//                 border-left: none !important;
//             }
//             .invoice-table tbody td {
//                 padding: 8px 8px;
//                 border: none;
//                 vertical-align: top;
//             }
//             .right-align {
//                 text-align: right !important;
//             }
//             .grand-total-row td {
//                 padding: 0 !important;
//                 border: none !important;
//             }
//             .total-cell-border {
//                 border-top: 1px solid #000;
//                 border-bottom: 1px solid #000;
//                 padding: 10px 8px; 
//                 font-weight: bold;
//                 box-sizing: border-box;
//             }
//             .total-label-border {
//                 display: block;
//                 margin-left: auto; 
//                 width: 100px; 
//                 border-top: 1px solid #000;
//                 border-bottom: 1px solid #000;
//                 padding: 10px 8px;
//                 font-weight: bold;
//                 text-align: right;
//                 box-sizing: border-box;
//             }
//             .totals-container {
//                 display: flex;
//                 justify-content: flex-end;
//                 margin-top: 20px;
//                 padding-right: 140px; 
//             }
//             .totals-table {
//                 width: 280px;
//                 border-collapse: collapse;
//                 font-weight: bold;
//             }
//             .totals-table td { padding: 4px 0; }
//             .totals-table .amount { text-align: left; }
            
//             /* =========================================
//                FIX: EXACT PDF DOWNLOAD ALIGNMENT OVERRIDES
//                ========================================= */
//             .pdf-print-mode {
//                 position: absolute !important;
//                 left: 0 !important;
//                 top: 0 !important;
//                 margin: 0 !important;
//                 z-index: 9999;
//             }
//             .pdf-print-mode .page {
//                 margin: 0 !important;
//                 box-shadow: none !important;
//                 border: none !important;
//                 height: auto !important;
//                 min-height: auto !important;
//                 page-break-after: always !important;
//                 page-break-inside: avoid !important;
//             }
//             .pdf-print-mode .page:last-child {
//                 page-break-after: avoid !important;
//             }

//             /* General Browser Print Rules */
//             @page { size: A4 portrait; margin: 0; }
//             @media print {
//                 body, html { 
//                     margin: 0 !important; 
//                     padding: 0 !important; 
//                     background-color: #fff !important; 
//                 }
//                 button, nav, header, footer, .no-print { 
//                     display: none !important; 
//                 }
//                 .radisson-invoice-wrapper {
//                     padding: 0 !important; 
//                     margin: 0 !important;
//                     background: none !important;
//                     width: 210mm !important;
//                 }
//                 .page {
//                     margin: 0 !important;
//                     padding: 10mm 15mm !important;
//                     box-shadow: none !important;
//                     border: none !important;
//                     height: auto !important;
//                     min-height: auto !important;
//                     page-break-after: always !important;
//                     page-break-inside: avoid !important;
//                 }
//                 .page:last-child {
//                     page-break-after: avoid !important;
//                 }
//             }
//           `}} />

//           {paginatedData.map((page, index) => (
//             <div className="page" key={index}>
//               <div className="logo-container">
//                 <img src={logo} alt={invoice.hotel} />
//               </div>

//               <div className="info-section">
//                 <div className="left-col">
//                   <div className="bold mb-10">{invoice.guestName}</div>
//                   <div className="bold mb-20">
//                     {invoice.companyName}<br />
//                     {addressLine1}<br />
//                     {addressLine2}<br />
//                   </div>
//                   <div className="bold mb-10">INFORMATION INVOICE</div>
                  
//                   <div className="grid-info-left mb-20">
//                     <div className="bold">Membership No</div><div className="bold">:</div><div className="bold">{invoice.membershipNo || ""}</div>
//                     <div className="bold">A/R Number</div><div className="bold">:</div><div className="bold">{invoice.arNumber || ""}</div>
//                     <div className="bold">Group Code</div><div className="bold">:</div><div className="bold">{invoice.groupCode || ""}</div>
//                     <div className="bold">Company/Agent</div><div className="bold">:</div><div className="bold">{invoice.companyName || ""}</div>
//                   </div>

//                   <div className="bold">{invoice.formattedInvoiceDate}</div>
//                 </div>

//                 <div className="right-col">
//                   <div className="grid-info-right">
//                     <div>Room No.</div><div>:</div><div>{invoice.roomNo || ""}</div>
//                     <div>Arrival</div><div>:</div><div>{invoice.formattedArrivalDate}</div>
                    
//                     <div>Departure</div><div>:</div><div>{invoice.formattedDepartureDate} {invoice.invoiceTime ? invoice.invoiceTime : ""}</div>
                    
//                     <div>Page No.</div><div>:</div><div>{page.pageNo} of {page.totalPages}</div>
//                     <div>Folio No</div><div>:</div><div>{invoice.folioNo || ""}</div>
//                     <div>Conf. No.</div><div>:</div><div>{invoice.confNo || ""}</div>
//                     <div>Adult / Child</div><div>:</div><div>{invoice.paxAdult}/{invoice.paxChild}</div>
                    
//                     <div>User ID</div><div>:</div><div>{invoice.userId || invoice.cashierId || ""}</div>
//                     <div>Tax Card No.</div><div>:</div><div>{invoice.taxCardNo || ""}</div>
//                     <div>Invoice No.</div><div>:</div><div>{invoice.invoiceNo || ""}</div>
//                     <div>Custom Ref.</div><div>:</div><div>{invoice.customRef || ""}</div>
//                   </div>
//                 </div>
//               </div>

//               <table className="invoice-table">
//                 <thead>
//                   <tr>
//                     <th style={{ width: '15%' }}>Date</th>
//                     <th style={{ width: '35%' }}>Description</th>
//                     <th className="right-align" style={{ width: '12.5%' }}>Charges<br />EGP</th>
//                     <th className="right-align" style={{ width: '12.5%' }}>Credits<br />EGP</th>
//                     <th className="right-align" style={{ width: '12.5%' }}>Charges<br />EGP</th>
//                     <th className="right-align" style={{ width: '12.5%' }}>Credits<br />EGP</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {page.items.map(item => (
//                     <tr key={item.id}>
//                       <td>{item.date}</td>
//                       <td>{item.desc}</td>
//                       <td className="right-align">{formatCurrency(item.charges)}</td>
//                       <td className="right-align">{item.credits}</td>
//                       <td className="right-align">{formatCurrency(item.charges)}</td>
//                       <td className="right-align">0.00</td>
//                     </tr>
//                   ))}

//                   {page.showTotals && (
//                     <tr className="grand-total-row">
//                       <td></td> 
//                       <td>
//                         <div className="total-label-border">Total</div>
//                       </td>
//                       <td>
//                         <div className="total-cell-border right-align">{formatCurrency(invoice.grandTotalEgp)}</div>
//                       </td>
//                       <td>
//                         <div className="total-cell-border right-align">0.00</div>
//                       </td>
//                       <td>
//                         <div className="total-cell-border right-align">{formatCurrency(invoice.grandTotalEgp)}</div>
//                       </td>
//                       <td>
//                         <div className="total-cell-border right-align">0.00</div>
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>

//               {page.showTotals && (
//                 <div className="totals-container">
//                   <table className="totals-table">
//                     <tbody>
//                       <tr>
//                         <td>Balance Due</td>
//                         <td className="amount">0.00</td>
//                       </tr>
//                       <tr>
//                         <td>Total In USD</td>
//                         <td className="amount">{formatCurrency(invoice.balanceUsd)}</td>
//                       </tr>
//                       <tr>
//                         <td>Net Amount</td>
//                         <td className="amount">{formatCurrency(invoice.baseTaxableAmount)}</td>
//                       </tr>
//                       <tr>
//                         <td>12% Service Charge</td>
//                         <td className="amount">{formatCurrency(invoice.serviceCharge)}</td>
//                       </tr>
//                       <tr>
//                         <td>14% VAT</td>
//                         <td className="amount">{formatCurrency(invoice.vat14Percent)}</td>
//                       </tr>
//                       <tr>
//                         <td>1% City Tax</td>
//                         <td className="amount">{formatCurrency(invoice.cityTax)}</td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default RaddisonInvoiceView;



import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '../../../public/raddison-logo.png'; 

const RaddisonInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const ROWS_PER_PAGE = 18;
  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (invoiceData) {
      setInvoice(transformInvoiceData(invoiceData));
      setLoading(false);
    } else if (invoiceId) {
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
      const response = await cairoInvoiceApi.getInvoiceById(invoiceId);
      
      let rawData = response.data || response;
      if (rawData.data) {
        rawData = rawData.data;
        if (rawData.data) {
          rawData = rawData.data;
        }
      }
      
      setInvoice(transformInvoiceData(rawData));
    } catch (err) {
      console.error("Error fetching Egypt invoice:", err);
      setError("Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const transformInvoiceData = (data) => {
    if (!data) return null;

    const transactions = [];
    
    if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
      data.accommodationDetails.forEach((item, index) => {
        const formattedDate = formatDate(item.date);
        const rawD = new Date(item.date).getTime() || 0; 
        
        transactions.push({ id: `acc_${index}`, date: formattedDate, rawDate: rawD, desc: "Accommodation", charges: item.baseRate || 0, credits: "", type: 1 });
        transactions.push({ id: `sc_${index}`, date: formattedDate, rawDate: rawD, desc: "12% Service Charge", charges: item.serviceCharge || 0, credits: "", type: 2 });
        transactions.push({ id: `vat_${index}`, date: formattedDate, rawDate: rawD, desc: "14% VAT", charges: item.vat || 0, credits: "", type: 3 });
        transactions.push({ id: `ct_${index}`, date: formattedDate, rawDate: rawD, desc: "1% City Tax", charges: item.cityTax || 0, credits: "", type: 4 });
      });
    }

    if (data.otherServices && Array.isArray(data.otherServices)) {
      data.otherServices.forEach((service, index) => {
        const formattedDate = formatDate(service.date);
        const rawD = new Date(service.date).getTime() || 0;

        transactions.push({
          id: `srv_${index}`,
          date: formattedDate,
          rawDate: rawD,
          desc: service.name || "Service",
          charges: service.amount || 0,
          credits: "",
          type: 5
        });
      });
    }

    transactions.sort((a, b) => {
      const timeDiff = a.rawDate - b.rawDate;
      if (timeDiff !== 0) return timeDiff;
      return a.type - b.type;
    });

    return {
      ...data,
      transactions,
      formattedInvoiceDate: formatDate(data.invoiceDate),
      formattedArrivalDate: formatDate(data.arrivalDate),
      formattedDepartureDate: formatDate(data.departureDate),
    };
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

  useEffect(() => {
    if (invoice && invoice.transactions) {
      const pages = [];
      const totalTx = invoice.transactions.length;
      
      if (totalTx === 0) {
          pages.push({ items: [], pageNo: 1, totalPages: 1, showTotals: true });
      } else {
          const totalPages = Math.ceil(totalTx / ROWS_PER_PAGE);
          for (let i = 0; i < totalTx; i += ROWS_PER_PAGE) {
            pages.push({
              items: invoice.transactions.slice(i, i + ROWS_PER_PAGE),
              pageNo: Math.floor(i / ROWS_PER_PAGE) + 1,
              totalPages: totalPages,
              showTotals: (i + ROWS_PER_PAGE) >= totalTx 
            });
          }
      }
      
      setPaginatedData(pages);
    }
  }, [invoice, ROWS_PER_PAGE]);

  // EXACT MATCH TO GRAND ARAS PDF LOGIC
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    // 1. Style Guard: Remove CSS files to avoid crashes
    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    });

    try {
      // 2. Image Loading Verification
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
          });
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      const element = invoiceRef.current;
      const opt = {
        margin: 0,
        filename: `${invoice.referenceNo }.pdf`,
        image: { type: 'jpeg', quality: 3 },
        html2canvas: { 
            scale: 4, 
            useCORS: true, 
            letterRendering: true,
            scrollY: 0,
            windowWidth: 794 // THIS PREVENTS THE RIGHT-SHIFT ISSUE
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all'] }
 
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      // 3. Instant Recovery (Styles Restore)
      headStyles.forEach(style => {
          document.head.appendChild(style);
      });
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

  const addressParts = invoice.address ? invoice.address.split(',') : [];
  const addressLine1 = addressParts[0] ? addressParts[0].trim() : "";
  const addressLine2 = addressParts.slice(1).join(',').trim();

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
      <div className="radisson-invoice-wrapper" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{__html: `
          .radisson-invoice-wrapper {
              width: 100%;
              background-color: transparent;
          }
          .radisson-invoice-wrapper * {
              font-family: Arial, sans-serif;
              color: #000;
          }
          .page {
    width: 100%;
    max-width: 794px;
    padding: 12mm 15mm;
    margin: 0 auto 20px auto;
    background: #fff;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    box-sizing: border-box;
    position: relative;
    font-size: 11px;
    line-height: 1.3;
}
          
          .logo-container {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
              margin-bottom: 40px;
          }
          .logo-container img {
              width: 200px; 
              height: auto;
          }
          .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
          }
          .left-col, .right-col {
              width: 48%;
          }
          .bold { font-weight: bold; }
          .mb-10 { margin-bottom: 10px; }
          .mb-20 { margin-bottom: 20px; }
          
         .grid-info-left {
              display: grid;
              /* Changed from: 130px 15px auto */
              grid-template-columns: 120px 10px auto; 
              row-gap: 4px;
          }
          
          .grid-info-right {
              display: grid;
              /* Changed from: 100px 15px auto */
              grid-template-columns: 92px 12px auto; 
              row-gap: 4px;
              font-weight: bold;
              justify-content: right;
              padding-right: 46px;
          }
          .invoice-table {
              width: 100%;
              border-collapse: collapse;
              border-spacing: 0; /* Ensures no native gaps */
              margin-bottom: 20px;
          }

          .invoice-table thead th {
              background-color: #000 !important;
              color: #fff !important;
              text-align: left;
              padding: 6px 8px;
              font-weight: normal;
              vertical-align: top;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              
              /* THE FIX: Fill the subpixel gaps with black */
              border: 1px solid #000 !important; 
              outline: 1px solid #000 !important; 
          }
          
          .invoice-table tbody td {
              padding: 8px 8px;
              border: none;
              vertical-align: top;
          }
          .right-align {
              text-align: right !important;
          }
          .grand-total-row td {
              padding: 0 !important;
              border: none !important;
          }
          .total-cell-border {
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 10px 8px; 
              font-weight: bold;
              box-sizing: border-box;
          }
          .total-label-border {
              display: block;
              margin-left: auto; 
              width: 100px; 
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 10px 8px;
              font-weight: bold;
              text-align: right;
              box-sizing: border-box;
          }
          .totals-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
              padding-right: 140px; 
          }
          .totals-table {
              width: 280px;
              border-collapse: collapse;
              font-weight: bold;
          }
          .totals-table td { padding: 4px 0; }
          .totals-table .amount { text-align: left; }
          
          /* Browser Print Rules */
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
              .radisson-invoice-wrapper {
                  padding: 0 !important; 
                  margin: 0 !important;
                  background: none !important;
                  max-width: none !important;
              }
               .page {
    margin: 0 !important;
    padding: 10mm 15mm !important;
    box-shadow: none !important;
    border: none !important;
    height: auto !important;
}
          }
        `}} />

        {paginatedData.map((page, index) => (
          <div className="page" key={index}>
            <div className="logo-container">
              <img src={logo} alt={invoice.hotel} />
            </div>

            <div className="info-section">
              <div className="left-col">
                <div className="bold mb-10">{invoice.guestName}</div>
                <div className="bold mb-20">
                  {invoice.companyName}<br />
                  {addressLine1}<br />
                  {addressLine2}<br />
                </div>
                <div className="bold mb-10">INFORMATION INVOICE</div>
                
                <div className="grid-info-left mb-20">
                  <div className="bold">Membership No</div><div className="bold">:</div><div className="bold">{invoice.membershipNo || ""}</div>
                  <div className="bold">A/R Number</div><div className="bold">:</div><div className="bold">{invoice.arNumber || ""}</div>
                  <div className="bold">Group Code</div><div className="bold">:</div><div className="bold">{invoice.groupCode || ""}</div>
                  <div className="bold">Company/Agent</div><div className="bold">:</div><div className="bold">{invoice.companyName || ""}</div>
                </div>

                <div className="bold">{invoice.formattedInvoiceDate}</div>
              </div>

              <div className="right-col">
                <div className="grid-info-right">
                  <div>Room No.</div><div>:</div><div>{invoice.roomNo || ""}</div>
                  <div>Arrival</div><div>:</div><div>{invoice.formattedArrivalDate}</div>
                  
                  <div>Departure</div><div>:</div><div>{invoice.formattedDepartureDate} Time: {invoice.invoiceTime ? invoice.invoiceTime : ""}</div>
                  
                  <div>Page No.</div><div>:</div><div>{page.pageNo} of {page.totalPages}</div>
                  <div>Folio No</div><div>:</div><div>{invoice.folioNo || ""}</div>
                  <div>Conf. No.</div><div>:</div><div>{invoice.confNo || ""}</div>
                  <div>Adult / Child</div><div>:</div><div>{invoice.paxAdult}/{invoice.paxChild}</div>
                  
                  <div>User ID</div><div>:</div><div>{invoice.userId || invoice.cashierId || ""}</div>
                  <div>Tax Card No.</div><div>:</div><div>{invoice.taxCardNo || ""}</div>
                  <div>Invoice No. <br/>Custom Ref.</div><div>:</div><div>{invoice.invoiceNo || ""}</div>

                </div>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Date</th>
                  <th style={{ width: '35%' }}>Description</th>
                  <th className="right-align" style={{ width: '12.5%' }}>Charges<br />EGP</th>
                  <th className="right-align" style={{ width: '12.5%' }}>Credits<br />EGP</th>
                  <th className="right-align" style={{ width: '12.5%' }}>Charges<br />EGP</th>
                  <th className="right-align" style={{ width: '12.5%' }}>Credits<br />EGP</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.desc}</td>
                    <td className="right-align">{formatCurrency(item.charges)}</td>
                    <td className="right-align">{item.credits}</td>
                    <td className="right-align">{formatCurrency(item.charges)}</td>
                    <td className="right-align">0.00</td>
                  </tr>
                ))}

                {page.showTotals && (
                  <tr className="grand-total-row">
                    <td></td> 
                    <td>
                      <div className="total-label-border">Total</div>
                    </td>
                    <td>
                      <div className="total-cell-border right-align">{formatCurrency(invoice.grandTotalEgp)}</div>
                    </td>
                    <td>
                      <div className="total-cell-border right-align">0.00</div>
                    </td>
                    <td>
                      <div className="total-cell-border right-align">{formatCurrency(invoice.grandTotalEgp)}</div>
                    </td>
                    <td>
                      <div className="total-cell-border right-align">0.00</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {page.showTotals && (
              <div className="totals-container">
                <table className="totals-table">
                  <tbody>
                    <tr>
                      <td>Balance Due</td>
                      <td className="amount">0.00</td>
                    </tr>
                    <tr>
                      <td>Total In USD</td>
                      <td className="amount">{formatCurrency(invoice.balanceUsd)}</td>
                    </tr>
                    <tr>
                      <td>Net Amount</td>
                      <td className="amount">{formatCurrency(invoice.baseTaxableAmount)}</td>
                    </tr>
                    <tr>
                      <td>12% Service Charge</td>
                      <td className="amount">{formatCurrency(invoice.serviceCharge)}</td>
                    </tr>
                    <tr>
                      <td>14% VAT</td>
                      <td className="amount">{formatCurrency(invoice.vat14Percent)}</td>
                    </tr>
                    <tr>
                      <td>1% City Tax</td>
                      <td className="amount">{formatCurrency(invoice.cityTax)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default RaddisonInvoiceView;


// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import cairoInvoiceApi from "../../Api/cairoInvoice.api";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// import logo from '../../../public/raddison-logo.png'; 

// const RaddisonInvoiceView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [paginatedData, setPaginatedData] = useState([]);
//   const invoiceRef = useRef(null);

//   const ROWS_PER_PAGE = 19;
//   const isPdfDownload = location.pathname.includes("/download-pdf");

//   useEffect(() => {
//     if (invoiceData) {
//       setInvoice(transformInvoiceData(invoiceData));
//       setLoading(false);
//     } else if (invoiceId) {
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
//       const response = await cairoInvoiceApi.getInvoiceById(invoiceId);
      
//       let rawData = response.data || response;
//       if (rawData.data) {
//         rawData = rawData.data;
//         if (rawData.data) {
//           rawData = rawData.data;
//         }
//       }
      
//       setInvoice(transformInvoiceData(rawData));
//     } catch (err) {
//       console.error("Error fetching Egypt invoice:", err);
//       setError("Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const transformInvoiceData = (data) => {
//     if (!data) return null;

//     const transactions = [];
    
//     if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
//       data.accommodationDetails.forEach((item, index) => {
//         const formattedDate = formatDate(item.date);
//         const rawD = new Date(item.date).getTime() || 0; 
        
//         transactions.push({ id: `acc_${index}`, date: formattedDate, rawDate: rawD, desc: "Accommodation", charges: item.baseRate || 0, credits: "", type: 1 });
//         transactions.push({ id: `sc_${index}`, date: formattedDate, rawDate: rawD, desc: "12% Service Charge", charges: item.serviceCharge || 0, credits: "", type: 2 });
//         transactions.push({ id: `vat_${index}`, date: formattedDate, rawDate: rawD, desc: "14% VAT", charges: item.vat || 0, credits: "", type: 3 });
//         transactions.push({ id: `ct_${index}`, date: formattedDate, rawDate: rawD, desc: "1% City Tax", charges: item.cityTax || 0, credits: "", type: 4 });
//       });
//     }

//     if (data.otherServices && Array.isArray(data.otherServices)) {
//       data.otherServices.forEach((service, index) => {
//         const formattedDate = formatDate(service.date);
//         const rawD = new Date(service.date).getTime() || 0;

//         transactions.push({
//           id: `srv_${index}`,
//           date: formattedDate,
//           rawDate: rawD,
//           desc: service.name || "Service",
//           charges: service.amount || 0,
//           credits: "",
//           type: 5
//         });
//       });
//     }

//     transactions.sort((a, b) => {
//       const timeDiff = a.rawDate - b.rawDate;
//       if (timeDiff !== 0) return timeDiff;
//       return a.type - b.type;
//     });

//     return {
//       ...data,
//       transactions,
//       formattedInvoiceDate: formatDate(data.invoiceDate),
//       formattedArrivalDate: formatDate(data.arrivalDate),
//       formattedDepartureDate: formatDate(data.departureDate),
//     };
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

//   useEffect(() => {
//     if (invoice && invoice.transactions) {
//       const pages = [];
//       const totalTx = invoice.transactions.length;
      
//       if (totalTx === 0) {
//           pages.push({ items: [], pageNo: 1, totalPages: 1, showTotals: true });
//       } else {
//           const totalPages = Math.ceil(totalTx / ROWS_PER_PAGE);
//           for (let i = 0; i < totalTx; i += ROWS_PER_PAGE) {
//             pages.push({
//               items: invoice.transactions.slice(i, i + ROWS_PER_PAGE),
//               pageNo: Math.floor(i / ROWS_PER_PAGE) + 1,
//               totalPages: totalPages,
//               showTotals: (i + ROWS_PER_PAGE) >= totalTx 
//             });
//           }
//       }
      
//       setPaginatedData(pages);
//     }
//   }, [invoice, ROWS_PER_PAGE]);

//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const element = invoiceRef.current;
    
//     // ADDED: Apply strict PDF mode class right before generation
//     element.classList.add('pdf-print-mode');

//     const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//     headStyles.forEach(style => {
//         const text = style.textContent || "";
//         const href = style.href || "";
        
//         const isOurFont = text.includes('GOHQLJ+Times,New Roman') || 
//                           text.includes('Times New Roman') ||
//                           href.includes('StaybridgeFont');

//         if (isOurFont) return; 

//         if (style.parentNode) {
//             style.parentNode.removeChild(style);
//         }
//     });

//     try {
//       const images = invoiceRef.current.querySelectorAll('img');
//       await Promise.all(Array.from(images).map(img => {
//           if (img.complete) return Promise.resolve();
//           return new Promise(resolve => {
//               img.onload = resolve;
//               img.onerror = resolve;
//           });
//       }));

//       await new Promise(resolve => setTimeout(resolve, 500));

//       const opt = {
//         margin: 0,
//         filename: `${invoice.referenceNo }.pdf`,
//         image: { type: 'jpeg', quality: 1 },
//         html2canvas: { 
//             scale: 2, 
//             useCORS: true, 
//             letterRendering: true,
//             scrollY: 0,
//             windowWidth: 794
//         },
//         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
//         pagebreak: { mode: ['css', 'legacy'] }
//       };
      
//       await html2pdf().set(opt).from(element).save();
//       toast.success("PDF Downloaded Successfully");
//     } catch (err) {
//       console.error("PDF Error:", err);
//       toast.error("Failed to generate PDF");
//     } finally {
//       // ALWAYS remove the class after generation so the web view returns to normal
//       element.classList.remove('pdf-print-mode');
      
//       headStyles.forEach(style => {
//           if (!style.parentNode) {
//               document.head.appendChild(style);
//           }
//       });
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   if (!invoice) {
//       return (
//           <InvoiceTemplate loading={loading} error={error} invoice={invoice} onBack={() => navigate("/invoices")}>
//               <></>
//           </InvoiceTemplate>
//       );
//   }

//   const addressParts = invoice.address ? invoice.address.split(',') : [];
//   const addressLine1 = addressParts[0] ? addressParts[0].trim() : "";
//   const addressLine2 = addressParts.slice(1).join(',').trim();

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
//       <div className="radisson-invoice-wrapper" ref={invoiceRef}>
//         <style dangerouslySetInnerHTML={{__html: `
//           .radisson-invoice-wrapper * {
//               font-family: Arial, sans-serif;
//               color: #000;
//           }
//           .page {
//               width: 210mm;
//               min-height: 296mm;
//               padding: 12mm 12mm;
//               margin: 0 auto 20px auto;
//               background: #fff;
//               box-shadow: 0 0 10px rgba(0,0,0,0.1);
//               box-sizing: border-box;
//               position: relative;
//               font-size: 11px;
//               line-height: 1.3;
//           }
          
//           .logo-container {
//               display: flex;
//               justify-content: center;
//               align-items: center;
//               width: 100%;
//               margin-bottom: 40px;
//           }
//           .logo-container img {
//               width: 200px; 
//               height: auto;
//           }
//           .info-section {
//               display: flex;
//               justify-content: space-between;
//               margin-bottom: 30px;
//           }
//           .left-col, .right-col {
//               width: 48%;
//           }
//           .bold { font-weight: bold; }
//           .mb-10 { margin-bottom: 10px; }
//           .mb-20 { margin-bottom: 20px; }
          
//           .grid-info-left {
//               display: grid;
//               grid-template-columns: 130px 15px auto;
//               row-gap: 4px;
//           }
//           .grid-info-right {
//               display: grid;
//               grid-template-columns: 100px 15px auto;
//               row-gap: 4px;
//               font-weight: bold;
//           }
//           .invoice-table {
//               width: 100%;
//               border-collapse: collapse;
//               margin-bottom: 20px;
//           }
//           .invoice-table thead th {
//               background-color: #000 !important;
//               color: #fff !important;
//               text-align: left;
//               padding: 6px 8px;
//               font-weight: normal;
//               vertical-align: top;
//               -webkit-print-color-adjust: exact !important;
//               print-color-adjust: exact !important;
//               color-adjust: exact !important;
//               border-left: 1px solid #555 !important;
//           }
//           .invoice-table thead th:first-child {
//               border-left: none !important;
//           }
//           .invoice-table tbody td {
//               padding: 8px 8px;
//               border: none;
//               vertical-align: top;
//           }
//           .right-align {
//               text-align: right !important;
//           }
//           .grand-total-row td {
//               padding: 0 !important;
//               border: none !important;
//           }
//           .total-cell-border {
//               border-top: 1px solid #000;
//               border-bottom: 1px solid #000;
//               padding: 10px 8px; 
//               font-weight: bold;
//               box-sizing: border-box;
//           }
//           .total-label-border {
//               display: block;
//               margin-left: auto; 
//               width: 100px; 
//               border-top: 1px solid #000;
//               border-bottom: 1px solid #000;
//               padding: 10px 8px;
//               font-weight: bold;
//               text-align: right;
//               box-sizing: border-box;
//           }
//           .totals-container {
//               display: flex;
//               justify-content: flex-end;
//               margin-top: 20px;
//               padding-right: 140px; 
//           }
//           .totals-table {
//               width: 280px;
//               border-collapse: collapse;
//               font-weight: bold;
//           }
//           .totals-table td { padding: 4px 0; }
//           .totals-table .amount { text-align: left; }
          
//           /* =========================================
//              FIX: EXACT PDF DOWNLOAD OVERRIDES
//              ========================================= */
//           .pdf-print-mode .page {
//               margin: 0 !important;
//               box-shadow: none !important;
//               border: none !important;
//               /* Strips the fixed height so pages don't overflow the A4 boundaries */
//               height: auto !important;
//               min-height: auto !important;
//               page-break-after: always !important;
//               page-break-inside: avoid !important;
//           }
//           .pdf-print-mode .page:last-child {
//               page-break-after: avoid !important;
//           }

//           /* General Browser Print Rules */
//           @page { size: A4 portrait; margin: 0; }
//           @media print {
//               body, html { 
//                   margin: 0 !important; 
//                   padding: 0 !important; 
//                   background-color: #fff !important; 
//               }
//               button, nav, header, footer, .no-print { 
//                   display: none !important; 
//               }
//               .radisson-invoice-wrapper {
//                   padding: 0 !important; 
//                   margin: 0 !important;
//                   background: none !important;
//               }
//               .page {
//                   margin: 0 !important;
//                   padding: 10mm 15mm !important;
//                   box-shadow: none !important;
//                   border: none !important;
//                   height: auto !important;
//                   min-height: auto !important;
//                   page-break-after: always !important;
//                   page-break-inside: avoid !important;
//               }
//               .page:last-child {
//                   page-break-after: avoid !important;
//               }
//           }
//         `}} />

//         {paginatedData.map((page, index) => (
//           <div className="page" key={index}>
//             <div className="logo-container">
//               <img src={logo} alt={invoice.hotel} />
//             </div>

//             <div className="info-section">
//               <div className="left-col">
//                 <div className="bold mb-10">{invoice.guestName}</div>
//                 <div className="bold mb-20">
//                   {invoice.companyName}<br />
//                   {addressLine1}<br />
//                   {addressLine2}<br />
//                 </div>
//                 <div className="bold mb-10">INFORMATION INVOICE</div>
                
//                 <div className="grid-info-left mb-20">
//                   <div className="bold">Membership No</div><div className="bold">:</div><div className="bold">{invoice.membershipNo || ""}</div>
//                   <div className="bold">A/R Number</div><div className="bold">:</div><div className="bold">{invoice.arNumber || ""}</div>
//                   <div className="bold">Group Code</div><div className="bold">:</div><div className="bold">{invoice.groupCode || ""}</div>
//                   <div className="bold">Company/Agent</div><div className="bold">:</div><div className="bold">{invoice.companyName || ""}</div>
//                 </div>

//                 <div className="bold">{invoice.formattedInvoiceDate}</div>
//               </div>

//               <div className="right-col">
//                 <div className="grid-info-right">
//                   <div>Room No.</div><div>:</div><div>{invoice.roomNo || ""}</div>
//                   <div>Arrival</div><div>:</div><div>{invoice.formattedArrivalDate}</div>
                  
//                   <div>Departure</div><div>:</div><div>{invoice.formattedDepartureDate} {invoice.invoiceTime ? invoice.invoiceTime : ""}</div>
                  
//                   <div>Page No.</div><div>:</div><div>{page.pageNo} of {page.totalPages}</div>
//                   <div>Folio No</div><div>:</div><div>{invoice.folioNo || ""}</div>
//                   <div>Conf. No.</div><div>:</div><div>{invoice.confNo || ""}</div>
//                   <div>Adult / Child</div><div>:</div><div>{invoice.paxAdult}/{invoice.paxChild}</div>
                  
//                   <div>User ID</div><div>:</div><div>{invoice.userId || invoice.cashierId || ""}</div>
//                   <div>Tax Card No.</div><div>:</div><div>{invoice.taxCardNo || ""}</div>
//                   <div>Invoice No.</div><div>:</div><div>{invoice.invoiceNo || ""}</div>
//                   <div>Custom Ref.</div><div>:</div><div>{invoice.customRef || ""}</div>
//                 </div>
//               </div>
//             </div>

//             <table className="invoice-table">
//               <thead>
//                 <tr>
//                   <th style={{ width: '15%' }}>Date</th>
//                   <th style={{ width: '35%' }}>Description</th>
//                   <th className="right-align" style={{ width: '12.5%' }}>Charges<br />EGP</th>
//                   <th className="right-align" style={{ width: '12.5%' }}>Credits<br />EGP</th>
//                   <th className="right-align" style={{ width: '12.5%' }}>Charges<br />EGP</th>
//                   <th className="right-align" style={{ width: '12.5%' }}>Credits<br />EGP</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {page.items.map(item => (
//                   <tr key={item.id}>
//                     <td>{item.date}</td>
//                     <td>{item.desc}</td>
//                     <td className="right-align">{formatCurrency(item.charges)}</td>
//                     <td className="right-align">{item.credits}</td>
//                     <td className="right-align">{formatCurrency(item.charges)}</td>
//                     <td className="right-align">0.00</td>
//                   </tr>
//                 ))}

//                 {page.showTotals && (
//                   <tr className="grand-total-row">
//                     <td></td> 
//                     <td>
//                       <div className="total-label-border">Total</div>
//                     </td>
//                     <td>
//                       <div className="total-cell-border right-align">{formatCurrency(invoice.grandTotalEgp)}</div>
//                     </td>
//                     <td>
//                       <div className="total-cell-border right-align">0.00</div>
//                     </td>
//                     <td>
//                       <div className="total-cell-border right-align">{formatCurrency(invoice.grandTotalEgp)}</div>
//                     </td>
//                     <td>
//                       <div className="total-cell-border right-align">0.00</div>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//             {page.showTotals && (
//               <div className="totals-container">
//                 <table className="totals-table">
//                   <tbody>
//                     <tr>
//                       <td>Balance Due</td>
//                       <td className="amount">0.00</td>
//                     </tr>
//                     <tr>
//                       <td>Total In USD</td>
//                       <td className="amount">{formatCurrency(invoice.balanceUsd)}</td>
//                     </tr>
//                     <tr>
//                       <td>Net Amount</td>
//                       <td className="amount">{formatCurrency(invoice.baseTaxableAmount)}</td>
//                     </tr>
//                     <tr>
//                       <td>12% Service Charge</td>
//                       <td className="amount">{formatCurrency(invoice.serviceCharge)}</td>
//                     </tr>
//                     <tr>
//                       <td>14% VAT</td>
//                       <td className="amount">{formatCurrency(invoice.vat14Percent)}</td>
//                     </tr>
//                     <tr>
//                       <td>1% City Tax</td>
//                       <td className="amount">{formatCurrency(invoice.cityTax)}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default RaddisonInvoiceView;