// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import cairoInvoiceApi from "../../Api/cairoInvoice.api";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// import logo from '/Novotel_Egypt_Logo.png?url';
// import footerLogo from '/NovotelEgypt-footer.png?url';

// const NovotelInvoiceViewEgypt = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [paginatedData, setPaginatedData] = useState([]);
//   const invoiceRef = useRef(null);

//   const ROWS_PER_PAGE = 15;
//   const isPdfDownload = location.pathname.includes("/download-pdf");

//   useEffect(() => {
//     if (invoiceData) {
//       let rawData = invoiceData;
//       if (rawData.data) rawData = rawData.data;
//       if (rawData.data) rawData = rawData.data;
      
//       setInvoice(transformInvoiceData(rawData));
//       setLoading(false);
//     } else if (invoiceId) {
//       fetchInvoiceData();
//     } else {
//       setLoading(false);
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
//     if (!data || Object.keys(data).length === 0) return null;

//     const transactions = [];
//     const exchangeRate = data.exchangeRate || 1;
    
//     if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
//       data.accommodationDetails.forEach((item, index) => {
//         const formattedDate = formatDate(item.date);
//         const rawD = new Date(item.date).getTime() || 0; 
        
//         const chargeAmt = item.chargesEgp || item.rate || item.baseRate || 0;
//         const creditAmt = item.creditsEgp || 0;

//         transactions.push({ 
//             id: `acc_${index}`, 
//             date: formattedDate, 
//             rawDate: rawD, 
//             desc: item.description || "Accommodation", 
//             charges: chargeAmt, 
//             credits: creditAmt, 
//             type: 1, 
//             exchangeRate 
//         });
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
//           desc: service.name || service.description || "Service",
//           charges: service.amount || service.chargesEgp || 0,
//           credits: service.creditsEgp || 0,
//           type: 5,
//           exchangeRate
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
//       exchangeRate,
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
//         return `${dd}.${mm}.${yy}`; 
//     } catch { return dateString; }
//   };

//   const formatCurrency = (val) => {
//     if (val === undefined || val === null || val === "" || isNaN(val)) return "0.00";
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

//     const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//     headStyles.forEach(style => {
//         if (style.parentNode) style.parentNode.removeChild(style);
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

//       const element = invoiceRef.current;
//       const opt = {
//         margin: 0,
//         filename: `${invoice.invoiceNo || invoice.referenceNo || 'Invoice'}.pdf`,
//         image: { type: 'jpeg', quality: 1.0 },
//         html2canvas: { 
//             scale: 3, 
//             useCORS: true, 
//             letterRendering: true,
//             scrollY: 0,
//             windowWidth: 794
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
//           document.head.appendChild(style);
//       });
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   if (loading) {
//     return (
//       <InvoiceTemplate loading={true} onBack={() => navigate("/invoices")}>
//         <div style={{ textAlign: 'center', padding: '50px' }}>Loading Invoice Data...</div>
//       </InvoiceTemplate>
//     );
//   }

//   if (!invoice) {
//       return (
//           <InvoiceTemplate loading={false} error={error || "No invoice data available"} onBack={() => navigate("/invoices")}>
//               <div style={{ textAlign: 'center', padding: '50px' }}>No invoice data found. Please check your data source.</div>
//           </InvoiceTemplate>
//       );
//   }

//   // Address Formatting
//   const addressParts = invoice.address ? invoice.address.split(',') : [];
//   const addressLines = addressParts.map(part => part.trim()).filter(part => part.length > 0);

//   // Totals calculations
//   const totalChargesEGP = invoice.grandTotalEgp || 0;
//   const totalCreditsEGP = invoice.totalCreditsEgp || 0;
//   const totalChargesUSD = invoice.usdAmount ? (invoice.usdAmount * invoice.nights) : (totalChargesEGP / invoice.exchangeRate);
//   const totalCreditsUSD = invoice.totalCreditsUsd || 0;

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
//       <div className="novotel-invoice-wrapper" ref={invoiceRef}>
//         <style dangerouslySetInnerHTML={{__html: `
//           .novotel-invoice-wrapper {
//               width: 100%;
//               background-color: #f5f5f5;
//               padding: 20px 0;
//           }
//           .novotel-invoice-wrapper * {
//               font-family: Arial, sans-serif;
//               color: #000;
//               box-sizing: border-box;
//           }
//           .page {
//               width: 210mm;
//               min-height: 297mm;
//               padding: 2mm 15mm;
//               margin: 0 auto 20px auto;
//               background: #fff;
//               box-shadow: 0 0 10px rgba(0,0,0,0.1);
//               position: relative;
//               font-size: 12px;
//               line-height: 1.3;
//           }
          
//           .logo-container {
//               display: flex;
//               justify-content: center;
//               width: 100%;
//               margin-bottom: 20px;
//           }
//           .logo-container img {
//           padding-left: 20px;
//              width: 110%;
//     max-width: 729px;
//     height: 106px;
//           }

//           .info-section {
//               display: flex;
//               justify-content: space-between;
//               margin-bottom: 25px;
//           }
//           .left-col {
//               width: 50%;
//               display: flex;
//               flex-direction: column;
//           }
//           .right-col {
//               width: 36%;
//           }
          
//           .address-block {
//               font-weight: bold;
//               margin-bottom: 12px;
//               line-height: 1.4;
//           }
//           .guest-name-block {
//               font-weight: bold;
//               margin-bottom: 15px;
//               font-size: 12px;
//           }
//           .invoice-copy-title {
//               font-weight: bold;
//               font-size: 13.5px;
//               margin-bottom: 15px;
//           }
          
//           .grid-info-left {
//               display: grid;
//               grid-template-columns: 105px 15px auto;
//               row-gap: 5px;
//               font-weight: bold;
//           }
          
//           .grid-info-right {
//               display: grid;
//               grid-template-columns: 90px 15px auto;
//               row-gap: 5px;
//               font-weight: bold;
//           }
          
//           .grid-spacer {
//               grid-column: span 3;
//               height: 12px;
//           }

//           .invoice-table {
//               width: 100%;
//               border-collapse: collapse;
//               margin-top: 10px;
//               margin-bottom: 5px;
//           }

//           .invoice-table thead th {
//               background-color: #000 !important;
//               color: #fff !important;
//               text-align: left;
//               padding: 5px 6px;
//               font-weight: bold;
//               font-size: 11.5px;
//               vertical-align: middle;
//               -webkit-print-color-adjust: exact !important;
//               print-color-adjust: exact !important;
//           }
          
//           .invoice-table tbody td {
//               padding: 6px 6px;
//               border: none;
//               font-size: 12px;
//               vertical-align: top;
//           }
          
//           .right-align {
//               text-align: right !important;
//           }

//           .grand-total-row td {
//               padding: 5px 6px !important;
//               font-weight: bold;
//               font-size: 12px;
//           }

//           .grand-total-row td.total-val {
//               border-top: 2px solid #000 !important;
//               border-bottom: 2px solid #000 !important;
//           }

//           .totals-area-wrapper {
//               display: flex;
//               justify-content: flex-end;
//               width: 100%;
//               margin-top: 20px;
//               padding-right: 188px;
//           }
//           .totals-table {
//               width: 290px;
//               border-collapse: collapse;
//               font-weight: bold;
//               font-size: 12px;
//           }
//           .totals-table td {
//               padding: 3.5px 4px;
//               vertical-align: middle;
//           }
//           .totals-table td.label-cell {
//               text-align: right;
//               width: 140px;
//           }
//           .totals-table td.value-cell {
//               text-align: right;
//               width: 100px;
//           }
//           .totals-table td.currency-cell {
//               text-align: left;
//               padding-left: 8px;
//               width: 50px;
//           }

//           /* Conditional Layout Footer Styles */
//           .footer-logo-fixed {
//               position: absolute;
//               bottom: 15mm;
//               right: 15mm;
//               display: flex;
//               justify-content: flex-end;
//           }
          
//           .footer-logo-inline {
//               width: 100%;
//               display: flex;
//               justify-content: flex-end;
//               margin-top: 20px; /* Precise 20px gap right below calculation table box */
//           }

//           .footer-logo-fixed img,
//           .footer-logo-inline img {
//               width: 115px; /* Upscaled dimensions for width & height presence */
//               height: auto;
//           }

//           @media print {
//               body, html {
//                   margin: 0 !important;
//                   padding: 0 !important;
//                   background-color: #fff !important;
//               }
//               .novotel-invoice-wrapper {
//                   padding: 0 !important;
//                   margin: 0 !important;
//                   background: none !important;
//               }
//               .page {
//                   margin: 0 !important;
//                   box-shadow: none !important;
//                   border: none !important;
//                   height: 297mm;
//                   page-break-after: always;
//               }
//           }
//         `}} />

//         {paginatedData.map((page, index) => (
//           <div className="page" key={index}>
//             {/* Header Brand Wordmark */}
//             <div className="logo-container">
//               <img src={logo} alt="NOVOTEL" />
//             </div>

//             {/* Meta Info Block Grid */}
//             <div className="info-section">
//               <div className="left-col">
//                 <div className="address-block">
//                   {invoice.companyName && <div>{invoice.companyName.toUpperCase()}</div>}
//                   {addressLines.map((line, i) => (
//                     <div key={i}>{line}</div>
//                   ))}
//                 </div>
                
//                 <div className="guest-name-block">
//                   {invoice.guestName || ""}
//                 </div>
                
//                 <div className="invoice-copy-title">COPY OF INVOICE'</div>
                
//                 <div className="grid-info-left">
//                   <div>Membership No</div><div>:</div><div>{invoice.membershipNo || ""}</div>
//                   <div>A/R Number</div><div>:</div><div>{invoice.arNumber || ""}</div>
//                   <div>Group Code</div><div>:</div><div>{invoice.groupCode || ""}</div>
//                   <div>Company/Agent</div><div>:</div><div>: {invoice.companyName || ""}</div>
//                 </div>
//               </div>

//               <div className="right-col">
//                 <div className="grid-info-right">
//                   <div>Room No.</div><div>:</div><div>{invoice.roomNo || ""}</div>
//                   <div>Arrival</div><div>:</div><div>{invoice.formattedArrivalDate || ""}</div>
//                   <div>Departure</div><div>:</div><div>{invoice.formattedDepartureDate || ""} {invoice.checkOutTime ? `Time: ${invoice.checkOutTime}` : ""}</div>
//                   <div>Page No.</div><div>:</div><div>{page.pageNo} of {page.totalPages}</div>
//                   <div>Folio No</div><div>:</div><div>{invoice.folioNo || ""}</div>
//                   <div>Conf. No.</div><div>:</div><div>{invoice.confNo || ""}</div>
                  
//                   {/* Matching the exact blank gap separator line visible in the layout image */}
//                   <div className="grid-spacer"></div>
                  
//                   <div>Cashier No.</div><div>:</div><div>{invoice.cashierId || "3757"}</div>
//                   <div>User ID</div><div>:</div><div>{invoice.userId || ""}</div>
//                   <div>Tax Card No.</div><div>:</div><div>{invoice.taxCardNo || ""}</div>
//                 </div>
//               </div>
//             </div>

//             {/* Standard Data Grid */}
//             <table className="invoice-table">
//               <thead>
//                 <tr>
//                   <th style={{ width: '12%' , verticalAlign: "top"}}>Date</th>
//                   <th style={{ width: '42%' , verticalAlign: "top"}}>Description</th>
//                   <th className="right-align" style={{ width: '11.5%' }}>Charges<br /><span style={{color : "white" ,fontWeight : "300"}}>EGP</span></th>
//                   <th className="right-align" style={{ width: '11.5%' }}>Credits<br /><span style={{color : "white" ,fontWeight : "300"}}>EGP</span></th>
//                   <th className="right-align" style={{ width: '11.5%' }}>Charges<br /><span style={{color : "white" ,fontWeight : "300"}}>USD</span></th>
//                   <th className="right-align" style={{ width: '11.5%' }}>Credits<br /><span style={{color : "white" ,fontWeight : "300"}}>USD</span></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {page.items.map(item => {
//                   const chargeUSD = item.charges ? (item.charges / item.exchangeRate) : 0;
//                   const creditUSD = item.credits ? (item.credits / item.exchangeRate) : 0;
                  
//                   return (
//                     <tr key={item.id}>
//                       <td>{item.date}</td>
//                       <td>{item.desc}</td>
//                       <td className="right-align">{formatCurrency(item.charges)}</td>
//                       <td className="right-align">{item.credits > 0 ? formatCurrency(item.credits) : ""}</td>
//                       <td className="right-align">{formatCurrency(chargeUSD)}</td>
//                       <td className="right-align">{item.credits > 0 ? formatCurrency(creditUSD) : "0.00"}</td>
//                     </tr>
//                   )
//                 })}

//                 {page.showTotals && (
//                   <tr className="grand-total-row">
//                     <td></td>
//                     <td style={{ textAlign: 'right', paddingRight: '15px' }}>Total</td>
//                     <td className="right-align total-val">{formatCurrency(totalChargesEGP)}</td>
//                     <td className="right-align total-val">{formatCurrency(totalCreditsEGP)}</td>
//                     <td className="right-align total-val">{formatCurrency(totalChargesUSD)}</td>
//                     <td className="right-align total-val">{formatCurrency(totalCreditsUSD)}</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//             {/* Bottom Breakdowns Box */}
//             {page.showTotals && (
//               <div className="totals-area-wrapper">
//                 <table className="totals-table">
//                   <tbody>
//                     <tr>
//                       <td className="label-cell">Balance Due</td>
//                       <td className="value-cell">0.00</td>
//                       <td className="currency-cell">EGP</td>
//                     </tr>
//                     <tr>
//                       <td className="label-cell">Total In USD</td>
//                       <td className="value-cell">{formatCurrency(totalChargesUSD)}</td>
//                       <td className="currency-cell">USD</td>
//                     </tr>
//                     <tr>
//                       <td className="label-cell">Exchange Rate</td>
//                       <td className="value-cell">{formatCurrency(invoice.exchangeRate)}</td>
//                       <td className="currency-cell">EGP</td>
//                     </tr>
//                     <tr>
//                       <td className="label-cell">Net Amount</td>
//                       <td className="value-cell">{formatCurrency(invoice.baseTaxableAmount)}</td>
//                       <td className="currency-cell">EGP</td>
//                     </tr>
//                     <tr>
//                       <td className="label-cell">12% Service Charge</td>
//                       <td className="value-cell">{formatCurrency(invoice.serviceCharge)}</td>
//                       <td className="currency-cell">EGP</td>
//                     </tr>
//                     <tr>
//                       <td className="label-cell">14% VAT</td>
//                       <td className="value-cell">{formatCurrency(invoice.vat14Percent)}</td>
//                       <td className="currency-cell">EGP</td>
//                     </tr>
//                     <tr>
//                       <td className="label-cell">1% City Tax</td>
//                       <td className="value-cell">{formatCurrency(invoice.cityTax)}</td>
//                       <td className="currency-cell">EGP</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             )}
            
//             {/* Conditional Layout Signature Block */}
//             <div className={page.showTotals ? "footer-logo-inline" : "footer-logo-fixed"}>
//               <img src={footerLogo} alt="Novotel Signature" />
//             </div>

//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default NovotelInvoiceViewEgypt;


import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/Novotel_Egypt_Logo.png?url';
import footerLogo from '/NovotelEgypt-footer.png?url';

const NovotelInvoiceViewEgypt = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const ROWS_PER_PAGE = 15;
  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (invoiceData) {
      let rawData = invoiceData;
      if (rawData.data) rawData = rawData.data;
      if (rawData.data) rawData = rawData.data;
      
      setInvoice(transformInvoiceData(rawData));
      setLoading(false);
    } else if (invoiceId) {
      fetchInvoiceData();
    } else {
      setLoading(false);
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
    if (!data || Object.keys(data).length === 0) return null;

    const transactions = [];
    const exchangeRate = data.exchangeRate || 1;
    
    if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
      data.accommodationDetails.forEach((item, index) => {
        const formattedDate = formatDate(item.date);
        const rawD = new Date(item.date).getTime() || 0; 
        
        const chargeAmt = item.chargesEgp || item.rate || item.baseRate || 0;
        const creditAmt = item.creditsEgp || 0;

        transactions.push({ 
            id: `acc_${index}`, 
            date: formattedDate, 
            rawDate: rawD, 
            desc: item.description || "Accommodation", 
            charges: chargeAmt, 
            credits: creditAmt, 
            type: 1, 
            exchangeRate 
        });
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
          desc: service.name || service.description || "Service",
          charges: service.amount || service.chargesEgp || 0,
          credits: service.creditsEgp || 0,
          type: 5,
          exchangeRate
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
      exchangeRate,
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
        return `${dd}.${mm}.${yy}`; 
    } catch { return dateString; }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "" || isNaN(val)) return "0.00";
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
          return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
          });
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      const element = invoiceRef.current;
      const opt = {
        margin: 0,
        filename: `${invoice.invoiceNo || invoice.referenceNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
            scale: 3, 
            useCORS: true, 
            letterRendering: true,
            scrollY: 0,
            windowWidth: 794
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
      headStyles.forEach(style => {
          document.head.appendChild(style);
      });
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <InvoiceTemplate loading={true} onBack={() => navigate("/invoices")}>
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading Invoice Data...</div>
      </InvoiceTemplate>
    );
  }

  if (!invoice) {
      return (
          <InvoiceTemplate loading={false} error={error || "No invoice data available"} onBack={() => navigate("/invoices")}>
              <div style={{ textAlign: 'center', padding: '50px' }}>No invoice data found. Please check your data source.</div>
          </InvoiceTemplate>
      );
  }

  // Address Formatting
  const addressParts = invoice.address ? invoice.address.split(',') : [];
  const addressLines = addressParts.map(part => part.trim()).filter(part => part.length > 0);

  // Totals calculations
  const totalChargesEGP = invoice.grandTotalEgp || 0;
  const totalCreditsEGP = invoice.totalCreditsEgp || 0;
  const totalChargesUSD = invoice.usdAmount ? (invoice.usdAmount * invoice.nights) : (totalChargesEGP / invoice.exchangeRate);
  const totalCreditsUSD = invoice.totalCreditsUsd || 0;

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
      <div className={`novotel-invoice-wrapper ${pdfLoading ? 'pdf-mode' : ''}`} ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{__html: `
          /* --- SCREEN STYLES --- */
          .novotel-invoice-wrapper {
              width: 100%;
              background-color: #f5f5f5;
              padding: 20px 0;
          }
          .novotel-invoice-wrapper * {
              font-family: Arial, sans-serif;
              color: #000;
              box-sizing: border-box;
          }
          .page {
              width: 210mm;
              min-height: 296mm;
              padding: 2mm 15mm;
              margin: 0 auto 20px auto;
              background: #fff;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              position: relative;
              font-size: 12px;
              line-height: 1.3;
          }

          /* --- PDF GENERATION STYLES --- */
          .novotel-invoice-wrapper.pdf-mode {
              background-color: transparent !important;
              padding: 0 !important;
              margin: 0 !important;
          }
          .novotel-invoice-wrapper.pdf-mode .page {
              margin: 0 auto !important;
              box-shadow: none !important;
              page-break-after: always;
          }
          /* This prevents html2pdf from injecting a blank page at the very end */
          .novotel-invoice-wrapper.pdf-mode .page:last-of-type {
              page-break-after: auto !important;
              min-height: auto !important; 
          }
          
          .logo-container {
              display: flex;
              justify-content: center;
              width: 100%;
              margin-bottom: 20px;
          }
          .logo-container img {
              padding-left: 20px;
              width: 110%;
              max-width: 729px;
              height: 106px;
          }

          .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
          }
          .left-col {
              width: 50%;
              display: flex;
              flex-direction: column;
          }
          .right-col {
              width: 36%;
          }
          
          .address-block {
              font-weight: bold;
              margin-bottom: 12px;
              line-height: 1.4;
          }
          .guest-name-block {
              font-weight: bold;
              margin-bottom: 15px;
              font-size: 12px;
          }
          .invoice-copy-title {
              font-weight: bold;
              font-size: 13.5px;
              margin-bottom: 15px;
          }
          
          .grid-info-left {
              display: grid;
              grid-template-columns: 105px 15px auto;
              row-gap: 5px;
              font-weight: bold;
          }
          
          .grid-info-right {
              display: grid;
              grid-template-columns: 90px 15px auto;
              row-gap: 5px;
              font-weight: bold;
          }
          
          .grid-spacer {
              grid-column: span 3;
              height: 12px;
          }

          .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              margin-bottom: 5px;
          }

          .invoice-table thead th {
              background-color: #000 !important;
              color: #fff !important;
              text-align: left;
              padding: 5px 6px;
              font-weight: bold;
              font-size: 11.5px;
              vertical-align: middle;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
          }
          
          .invoice-table tbody td {
              padding: 6px 6px;
              border: none;
              font-size: 12px;
              vertical-align: top;
          }
          
          .right-align {
              text-align: right !important;
          }

          .grand-total-row td {
              padding: 5px 6px !important;
              font-weight: bold;
              font-size: 12px;
          }

          .grand-total-row td.total-val {
              border-top: 2px solid #000 !important;
              border-bottom: 2px solid #000 !important;
          }

          .totals-area-wrapper {
              display: flex;
              justify-content: flex-end;
              width: 100%;
              margin-top: 20px;
              padding-right: 188px;
          }
          .totals-table {
              width: 290px;
              border-collapse: collapse;
              font-weight: bold;
              font-size: 12px;
          }
          .totals-table td {
              padding: 3.5px 4px;
              vertical-align: middle;
          }
          .totals-table td.label-cell {
              text-align: right;
              width: 140px;
          }
          .totals-table td.value-cell {
              text-align: right;
              width: 100px;
          }
          .totals-table td.currency-cell {
              text-align: left;
              padding-left: 8px;
              width: 50px;
          }

          .footer-logo-fixed {
              position: absolute;
              bottom: 15mm;
              right: 15mm;
              display: flex;
              justify-content: flex-end;
          }
          
          .footer-logo-inline {
              width: 100%;
              display: flex;
              justify-content: flex-end;
              margin-top: 20px; 
          }

          .footer-logo-fixed img,
          .footer-logo-inline img {
              width: 115px; 
              height: auto;
          }

          /* --- BROWSER PRINT ISOLATION (Ctrl+P) --- */
          @media print {
              @page {
                  size: A4 portrait;
                  margin: 0; 
              }
              html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background-color: #fff !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              
              /* Hide all external elements and UI wrappers */
              body * {
                  visibility: hidden;
              }
              /* Hard hide interactive elements so they don't consume empty layout space */
              button, nav, header, aside, footer, a, .no-print {
                  display: none !important;
              }
              
              /* Re-expose ONLY the invoice wrapper */
              .novotel-invoice-wrapper, .novotel-invoice-wrapper * {
                  visibility: visible !important;
              }
              
              /* Force wrapper to top left edge */
              .novotel-invoice-wrapper {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: transparent !important;
              }

              .page {
                  margin: 0 auto !important;
                  box-shadow: none !important;
                  border: none !important;
                  min-height: 296mm !important; /* Prevents 1px overflow */
                  page-break-after: always !important;
                  page-break-inside: avoid !important;
              }
              
              /* Kills the trailing blank page */
              .page:last-of-type {
                  page-break-after: auto !important;
              }
          }
        `}} />

        {paginatedData.map((page, index) => (
          <div className="page" key={index}>
            <div className="logo-container">
              <img src={logo} alt="NOVOTEL" />
            </div>

            <div className="info-section">
              <div className="left-col">
                <div className="address-block">
                  {invoice.companyName && <div>{invoice.companyName.toUpperCase()}</div>}
                  {addressLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
                
                <div className="guest-name-block">
                  {invoice.guestName || ""}
                </div>
                
                <div className="invoice-copy-title">COPY OF INVOICE'</div>
                
                <div className="grid-info-left">
                  <div>Membership No</div><div>:</div><div>{invoice.membershipNo || ""}</div>
                  <div>A/R Number</div><div>:</div><div>{invoice.arNumber || ""}</div>
                  <div>Group Code</div><div>:</div><div>{invoice.groupCode || ""}</div>
                  <div>Company/Agent</div><div>:</div><div> {invoice.companyName || ""}</div>
                </div>
              </div>

              <div className="right-col">
                <div className="grid-info-right">
                  <div>Room No.</div><div>:</div><div>{invoice.roomNo || ""}</div>
                  <div>Arrival</div><div>:</div><div>{invoice.formattedArrivalDate || ""}</div>
                  <div>Departure</div><div>:</div><div>{invoice.formattedDepartureDate || ""} {invoice.checkOutTime ? `Time: ${invoice.checkOutTime}` : ""}</div>
                  <div>Page No.</div><div>:</div><div>{page.pageNo} of {page.totalPages}</div>
                  <div>Folio No</div><div>:</div><div>{invoice.folioNo || ""}</div>
                  <div>Conf. No.</div><div>:</div><div>{invoice.confNo || ""}</div>
                  
                  <div className="grid-spacer"></div>
                  
                  <div>Cashier No.</div><div>:</div><div>{invoice.cashierId || "3757"}</div>
                  <div>User ID</div><div>:</div><div>{invoice.userId || ""}</div>
                  <div>Tax Card No.</div><div>:</div><div>{invoice.taxCardNo || ""}</div>
                </div>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' , verticalAlign: "top"}}>Date</th>
                  <th style={{ width: '42%' , verticalAlign: "top"}}>Description</th>
                  <th className="right-align" style={{ width: '11.5%' }}>Charges<br /><span style={{color : "white" ,fontWeight : "300"}}>EGP</span></th>
                  <th className="right-align" style={{ width: '11.5%' }}>Credits<br /><span style={{color : "white" ,fontWeight : "300"}}>EGP</span></th>
                  <th className="right-align" style={{ width: '11.5%' }}>Charges<br /><span style={{color : "white" ,fontWeight : "300"}}>USD</span></th>
                  <th className="right-align" style={{ width: '11.5%' }}>Credits<br /><span style={{color : "white" ,fontWeight : "300"}}>USD</span></th>
                </tr>
              </thead>
              <tbody>
                {page.items.map(item => {
                  const chargeUSD = item.charges ? (item.charges / item.exchangeRate) : 0;
                  const creditUSD = item.credits ? (item.credits / item.exchangeRate) : 0;
                  
                  return (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>{item.desc}</td>
                      <td className="right-align">{formatCurrency(item.charges)}</td>
                      <td className="right-align">{item.credits > 0 ? formatCurrency(item.credits) : ""}</td>
                      <td className="right-align">{formatCurrency(chargeUSD)}</td>
                      <td className="right-align">{item.credits > 0 ? formatCurrency(creditUSD) : "0.00"}</td>
                    </tr>
                  )
                })}

                {page.showTotals && (
                  <tr className="grand-total-row">
                    <td></td>
                    <td style={{ textAlign: 'right', paddingRight: '15px' }}>Total</td>
                    <td className="right-align total-val">{formatCurrency(totalChargesEGP)}</td>
                    <td className="right-align total-val">{formatCurrency(totalCreditsEGP)}</td>
                    <td className="right-align total-val">{formatCurrency(totalChargesUSD)}</td>
                    <td className="right-align total-val">{formatCurrency(totalCreditsUSD)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {page.showTotals && (
              <div className="totals-area-wrapper">
                <table className="totals-table">
                  <tbody>
                    <tr>
                      <td className="label-cell">Balance Due</td>
                      <td className="value-cell">0.00</td>
                      <td className="currency-cell">EGP</td>
                    </tr>
                    <tr>
                      <td className="label-cell">Total In USD</td>
                      <td className="value-cell">{formatCurrency(totalChargesUSD)}</td>
                      <td className="currency-cell">USD</td>
                    </tr>
                    <tr>
                      <td className="label-cell">Exchange Rate</td>
                      <td className="value-cell">{formatCurrency(invoice.exchangeRate)}</td>
                      <td className="currency-cell">EGP</td>
                    </tr>
                    <tr>
                      <td className="label-cell">Net Amount</td>
                      <td className="value-cell">{formatCurrency(invoice.baseTaxableAmount)}</td>
                      <td className="currency-cell">EGP</td>
                    </tr>
                    <tr>
                      <td className="label-cell">12% Service Charge</td>
                      <td className="value-cell">{formatCurrency(invoice.serviceCharge)}</td>
                      <td className="currency-cell">EGP</td>
                    </tr>
                    <tr>
                      <td className="label-cell">14% VAT</td>
                      <td className="value-cell">{formatCurrency(invoice.vat14Percent)}</td>
                      <td className="currency-cell">EGP</td>
                    </tr>
                    <tr>
                      <td className="label-cell">1% City Tax</td>
                      <td className="value-cell">{formatCurrency(invoice.cityTax)}</td>
                      <td className="currency-cell">EGP</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            <div className={page.showTotals ? "footer-logo-inline" : "footer-logo-fixed"}>
              <img src={footerLogo} alt="Novotel Signature" />
            </div>

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default NovotelInvoiceViewEgypt;