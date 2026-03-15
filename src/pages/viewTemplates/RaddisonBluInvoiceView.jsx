// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import cairoInvoiceApi from "../../Api/cairoInvoice.api";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// import logo from '../../../public/Raddison_blu-logo.png'; 

// const RaddisonBluInvoiceView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [paginatedData, setPaginatedData] = useState([]);
//   const invoiceRef = useRef(null);

//   const ROWS_PER_PAGE = 39;
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
        
//         transactions.push({ id: `acc_${index}`, date: formattedDate, rawDate: rawD, desc: item.description || "Bed and Breakfast", charges: item.baseRate || 0, credits: item.creditsEgp || "", type: 1 });
//         transactions.push({ id: `sc_${index}`, date: formattedDate, rawDate: rawD, desc: "12% Service Charge Rooms", charges: item.serviceCharge || 0, credits: "", type: 2 });
//         transactions.push({ id: `ct_${index}`, date: formattedDate, rawDate: rawD, desc: "1% City Tax Rooms", charges: item.cityTax || 0, credits: "", type: 3 });
//         transactions.push({ id: `vat_${index}`, date: formattedDate, rawDate: rawD, desc: "14% VAT Tax Rooms", charges: item.vat || 0, credits: "", type: 4 });
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
//           desc: service.name || "Laun: Washing",
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
//         return `${dd}.${mm}.${yy}`; 
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

//     const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//     headStyles.forEach(style => {
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

//       const element = invoiceRef.current;
//       const opt = {
//         margin: 0,
//         filename: `${invoice.referenceNo || 'Invoice'}.pdf`,
//         image: { type: 'jpeg', quality: 3 },
//         html2canvas: { 
//             scale: 4, 
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
//           .radisson-invoice-wrapper {
//               width: 100%;
//               background-color: transparent;
//           }
//           .radisson-invoice-wrapper * {
//               font-family: Arial, Helvetica, sans-serif;
//               color: #000;
//               font-size: 10.5px;
//           }
//           .page {
//               width: 100%;
//               max-width: 794px;
//               padding: 10mm 10mm;
//               margin: 0 auto 20px auto;
//               background: #fff;
//               box-shadow: 0 0 10px rgba(0,0,0,0.1);
//               box-sizing: border-box;
//               position: relative;
//               line-height: 1.4;
//           }
          
//           .logo-container {
//               display: flex;
//               justify-content: center;
//               width: 100%;
//           }
//           .logo-container img {
//               width: 250px; 
//               height: auto;
//           }
          
//           .bold { font-weight: bold; }
          
//           .guest-name { 
//               font-weight: bold; 
//               margin-bottom: 14px; 
//           }

//           .header-split {
//               display: flex;
//               justify-content: space-between;
//               align-items: flex-start;
//               margin-bottom: 15px;
//           }
//           .left-col { width: 50%; }
//           .right-col { 
//               width: 50%; 
//               display: flex;
//               justify-content: flex-end;
//           }
          
//           .grid-info-left {
//               display: grid;
//               grid-template-columns: 105px 10px auto; 
//               row-gap: 4px;
//               font-weight: bold;
//           }
          
//           .grid-info-right {
//               display: grid;
//               grid-template-columns: 85px 10px auto; 
//               row-gap: 3px;
//               text-align: left;
//               width: 100%;
//               max-width: 260px;
//               font-weight: bold;
//           }

//           .invoice-table {
//               width: 100%;
//               border-collapse: collapse;
//               border-spacing: 0;
//               margin-bottom: 15px;
//           }

//           .invoice-table thead th {
//               background-color: #000 !important;
//               color: #fff !important;
//               text-align: left;
//               padding: 0px 6px; 
//               font-weight: bold;
//               -webkit-print-color-adjust: exact !important;
//               print-color-adjust: exact !important;
//               color-adjust: exact !important;
//           }
          
//           .invoice-table tbody td {
//               font-size: 10px;
//               font-weight: 300 ;
//               padding: 2.5px 6px;
//               color:#000 !important;
//               border: none;
//               vertical-align: top;
//           }
          
//           /* EXACT GAP BELOW THE BLACK HEADER */
//           .invoice-table tbody tr:first-child td {
//               padding-top: 10px !important; 
//           }

//           .right-align {
//               text-align: right !important;
//           }
          
//           /* TOTAL ROW EXACT LINES */
//           .total-text-cell {
//               // padding: 6px 15px 4px 6px !important;
//               font-weight: bold !important;
//               font-size: 10.5px !important;
//               padding-top: 0px !important;
//           }
//           .total-num-cell {
//               border-top: 2px solid #000 !important;
//               border-bottom: 2px solid #000 !important;
//               font-size: 10.5px !important;
           
//               font-weight: bold !important;
           
//               padding: 10px 6px !important;
//                  padding-top: 0px !important;
//               font-weight: bold;
//           }

//           .totals-wrapper {
//               display: flex;
//               justify-content: flex-end;
//               width: 100%;
//               margin-top: 10px;
//           }

//           .totals-table {
//               width: 65%;
//               border-collapse: collapse;
//               font-weight: bold;
//           }

//           .totals-table td { 
//               padding: 2px 6px; 
//               vertical-align: top;
//               white-space: nowrap;
//           }

//           .footer-section {
//               margin-top: 50px;
//               display: flex;
//               flex-direction: column;
//               align-items: flex-start;
//           }
//           .signature-box {
//               width: 300px;
//               padding-top: 20px;
//           }
//           .thank-you-msg {
//               text-align: center;
//               margin-top: 60px;
//               width: 100%;
//           }

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
//                   max-width: none !important;
//               }
//                .page {
//                   margin: 0 !important;
//                   padding: 8mm 10mm !important;
//                   box-shadow: none !important;
//                   border: none !important;
//                   height: auto !important;
//               }
//           }
//         `}} />

//         {paginatedData.map((page, index) => (
//           <div className="page" key={index}>
            
//             <div className="logo-container">
//                <img src={logo} alt="Radisson BLU HOTEL, CAIRO HELIOPOLIS" />
//             </div>
            
//             <div className="guest-name">{invoice.guestName}</div>

//             {/* This flex container guarantees perfectly level alignment between Company & Room Details */}
//             <div className="header-split">
//               <div className="left-col">
//                 <div className="bold">{invoice.companyName}</div>
//                 <div className="bold">{addressLine1}</div>
//                 <div className="bold">{addressLine2}</div>
                
//                 <div className="bold" style={{marginTop: '5px', marginBottom: '3px'}}>INFORMATION INVOICE</div>
                
//                 <div className="grid-info-left">
//                   <div>Membership No</div><div>:</div><div>{invoice.membershipNo ? `${invoice.membershipNo}` : ""}</div>
//                   <div>A/R Number</div><div>:</div><div>{invoice.arNumber || ""}</div>
//                   <div>Group Code</div><div>:</div><div>{invoice.groupCode || ""}</div>
//                   <div>Company/Agent</div><div>:</div><div>{invoice.companyName || ""}</div>
//                 </div>
//               </div>

//               <div className="right-col">
//                 <div className="grid-info-right">
//                   <div>Room No.</div><div>:</div><div>{invoice.roomNo}</div>
//                   <div>Arrival</div><div>:</div><div>{invoice.formattedArrivalDate}</div>
//                   <div>Departure</div><div>:</div><div>{invoice.formattedDepartureDate} Time: {invoice.invoiceTime || "00:00"}</div>
//                   <div>Folio No</div><div>:</div><div>{invoice.folioNo || ""}</div>
//                   <div>Booking No.</div><div>:</div><div>{invoice.bookingNo}</div>
//                   <div>Page No.</div><div>:</div><div>Page {page.pageNo} of {page.totalPages}</div>
//                   <div>Cashier No.</div><div>:</div><div>{invoice.cashierId || ""}</div>
//                   <div>User ID</div><div>:</div><div>{invoice.userId || ""}</div>
//                   <div>Adults/Child</div><div>:</div><div>{invoice.paxAdult}/{invoice.paxChild}</div>
//                 </div>
//               </div>
//             </div>

//             <table className="invoice-table">
//               <thead>
//                 <tr>
//                   <th style={{ width: '10%', verticalAlign:"top"  }}>Date</th>
//                   <th style={{ width: '50%', verticalAlign:"top" }}>Description</th>
//                   <th className="right-align" style={{ width: '28%' }}>Charges<br />EGP</th>
//                   <th className="right-align" style={{ width: '12%' ,paddingRight:"10px"}}>Credits<br />EGP</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {page.items.map(item => (
//                   <tr key={item.id}>
//                     <td>{item.date}</td>
//                     <td>{item.desc}</td>
//                     <td className="right-align">{formatCurrency(item.charges)}</td>
//                     <td className="right-align">{item.credits ? formatCurrency(item.credits) : ""}</td>
//                   </tr>
//                 ))}

//                 {page.showTotals && (
//                   <tr>
//                     <td></td> 
//                     <td className="right-align total-text-cell">Total</td>
//                     {/* Borders only apply to these numeric cells */}
//                     <td className="right-align total-num-cell">{formatCurrency(invoice.grandTotalEgp)}</td>
//                     <td className="right-align total-num-cell">0.00</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//             {page.showTotals && (
//               <>
//                 <div className="totals-wrapper">
//                   <table className="totals-table">
//                     <tbody>
//                       <tr>
//                         <td className="right-align">Balance Due</td>
//                         <td className="right-align">{formatCurrency(invoice.grandTotalEgp)} EGP</td>
//                         <td className="right-align" >Balance Due</td>
//                         <td className="right-align">{formatCurrency(invoice.grandTotalEgp)} EGP</td>
//                       </tr>
//                       <tr>
//                         <td className="right-align">Net Amount</td>
//                         <td className="right-align">{formatCurrency(invoice.baseTaxableAmount)} EGP</td>
//                         <td></td>
//                         <td className="right-align">{formatCurrency(invoice.baseTaxableAmount)} EGP</td>
//                       </tr>
//                       <tr>
//                         <td className="right-align">12% Service Charge</td>
//                         <td className="right-align">{formatCurrency(invoice.serviceCharge)} EGP</td>
//                         <td></td>
//                         <td className="right-align">{formatCurrency(invoice.serviceCharge)} EGP</td>
//                       </tr>
//                       <tr>
//                         <td className="right-align">14% VAT</td>
//                         <td className="right-align">{formatCurrency(invoice.vat14Percent)} EGP</td>
//                         <td></td>
//                         <td className="right-align">{formatCurrency(invoice.vat14Percent)} EGP</td>
//                       </tr>
//                       <tr>
//                         <td className="right-align">1% City TAX</td>
//                         <td className="right-align">{formatCurrency(invoice.cityTax)} EGP</td>
//                         <td></td>
//                         <td className="right-align">{formatCurrency(invoice.cityTax)} EGP</td>
//                       </tr>
//                       <tr>
//                         <td className="right-align">Exch, Rate</td>
//                         <td className="right-align">{formatCurrency(invoice.exchangeRate)} USD</td>
//                         <td></td>
//                         <td className="right-align">{formatCurrency(invoice.exchangeRate)} USD</td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>
                
//                 <div className="footer-section">
//                    <div className="signature-box">Guest Signature: ...........................................</div>
//                    <div className="thank-you-msg">
//                        Thank you for choosing the {invoice.hotel || "Radisson Blu Hotel Cairo, Heliopolis"}
//                    </div>
//                 </div>
//               </>
//             )}
//           </div>
//         ))}
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default RaddisonBluInvoiceView;




import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '../../../public/Raddison_blu-logo.png'; 

const RaddisonBluInvoiceView = ({ invoiceData }) => {
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
        
        transactions.push({ id: `acc_${index}`, date: formattedDate, rawDate: rawD, desc: item.description || "Bed and Breakfast", charges: item.baseRate || 0, credits: item.creditsEgp || "", type: 1 });
        transactions.push({ id: `sc_${index}`, date: formattedDate, rawDate: rawD, desc: "12% Service Charge Rooms", charges: item.serviceCharge || 0, credits: "", type: 2 });
        transactions.push({ id: `ct_${index}`, date: formattedDate, rawDate: rawD, desc: "1% City Tax Rooms", charges: item.cityTax || 0, credits: "", type: 3 });
        transactions.push({ id: `vat_${index}`, date: formattedDate, rawDate: rawD, desc: "14% VAT Tax Rooms", charges: item.vat || 0, credits: "", type: 4 });
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
          desc: service.name || "Laun: Washing",
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
        return `${dd}.${mm}.${yy}`; 
    } catch { return dateString; }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "") return "";
    return parseFloat(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

 // ── Pagination ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!invoice?.transactions) return;

    const tx = invoice.transactions;
    const pages = [];

    const MAX_ROWS_NORMAL_PAGE = 34; // Max rows when there is NO footer
    const MAX_ROWS_WITH_FOOTER = 20; // Max rows when the footer MUST be drawn

    if (tx.length === 0) {
      pages.push({ items: [], showTotals: true });
    } else {
      for (let i = 0; i < tx.length; i += MAX_ROWS_NORMAL_PAGE) {
        const chunk = tx.slice(i, i + MAX_ROWS_NORMAL_PAGE);
        const isLastChunk = i + MAX_ROWS_NORMAL_PAGE >= tx.length;

        if (isLastChunk) {
          // We are on the last batch of items. Check if the footer fits.
          if (chunk.length > MAX_ROWS_WITH_FOOTER) {
            // The footer won't fit! 
            // Put ALL remaining rows on this page, but hide the footer.
            pages.push({ items: chunk, showTotals: false });
            // Push a completely empty page just for the totals/footer to sit on alone.
            pages.push({ items: [], showTotals: true });
          } else {
            // The footer fits comfortably on the same page!
            pages.push({ items: chunk, showTotals: true });
          }
        } else {
          // Not the last page, just push the items and hide the footer.
          pages.push({ items: chunk, showTotals: false });
        }
      }
    }

    // Assign dynamic page numbers and update the total page count
    const totalPages = pages.length;
    pages.forEach((p, idx) => {
      p.pageNo = idx + 1;
      p.totalPages = totalPages;
    });

    setPaginatedData(pages);
  }, [invoice]);
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
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
        filename: `${invoice.referenceNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 3 },
        html2canvas: { 
            scale: 4, 
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
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              font-size: 10.5px;
          }
          .page {
              width: 100%;
              max-width: 794px;
              padding: 10mm 10mm;
              margin: 0 auto 20px auto;
              background: #fff;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              box-sizing: border-box;
              position: relative;
              line-height: 1.4;
              page-break-after: always;
              break-after: page;
          }
          
          .logo-container {
              display: flex;
              justify-content: center;
              width: 100%;
          }
          .logo-container img {
              width: 250px; 
              height: auto;
          }
          
          .bold { font-weight: bold; }
          
          .guest-name { 
              font-weight: bold; 
              margin-bottom: 14px; 
              font-size: 11.5px ! important;
          }
.radisson-invoice-wrapper .header-split,
.radisson-invoice-wrapper .header-split * {
    font-size: 11.5px !important;
}
          .header-split {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
          }
          .left-col { width: 50%;  }
          .right-col { 
              width: 50%; 
              display: flex;
              justify-content: flex-end;
          }
          
          .grid-info-left {
              display: grid;
              grid-template-columns: 105px 10px auto; 
              row-gap: 4px;
              font-weight: bold;
          }
          
          .grid-info-right {
              display: grid;
              grid-template-columns: 85px 10px auto; 
              row-gap: 3px;
              text-align: left;
              width: 100%;
              max-width: 260px;
              font-weight: bold;
          }

          .invoice-table {
              width: 100%;
              border-collapse: collapse;
              border-spacing: 0;
              margin-bottom: 15px;
          }

          .invoice-table thead th {
              background-color: #000 !important;
              color: #fff !important;
              text-align: left;
              padding: 0px 6px; 
              font-weight: bold;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
          }
          
          .invoice-table tbody td {
              font-size: 10px;
              font-weight: 300 ;
              padding: 2.5px 6px;
              color:#000 !important;
              border: none;
              vertical-align: top;
          }
          
          /* EXACT GAP BELOW THE BLACK HEADER */
          .invoice-table tbody tr:first-child td {
              padding-top: 10px !important; 
          }

          .right-align {
              text-align: right !important;
          }
          
          /* TOTAL ROW EXACT LINES */
          .total-text-cell {
              // padding: 6px 15px 4px 6px !important;
              font-weight: bold !important;
              font-size: 10.5px !important;
              padding-top: 0px !important;
          }
          .total-num-cell {
              border-top: 2px solid #000 !important;
              border-bottom: 2px solid #000 !important;
              font-size: 10.5px !important;
           
              font-weight: bold !important;
           
              padding: 10px 6px !important;
                 padding-top: 0px !important;
              font-weight: bold;
          }

          .totals-wrapper {
              display: flex;
              justify-content: flex-end;
              width: 100%;
              margin-top: 10px;
          }

          .totals-table {
              width: 65%;
              border-collapse: collapse;
              font-weight: bold;
          }

          .totals-table td { 
              padding: 2px 6px; 
              vertical-align: top;
              white-space: nowrap;
          }

          .footer-section {
              margin-top: 50px;
              display: flex;
              flex-direction: column;
              align-items: flex-start;
          }
          .signature-box {
              width: 300px;
              padding-top: 20px;
          }
          .thank-you-msg {
              text-align: center;
              margin-top: 60px;
              width: 100%;
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
              .radisson-invoice-wrapper {
                  padding: 0 !important; 
                  margin: 0 !important;
                  background: none !important;
                  max-width: none !important;
              }
               .page {
                  margin: 0 !important;
                  padding: 8mm 10mm !important;
                  box-shadow: none !important;
                  border: none !important;
                  height: auto !important;
                  page-break-after: always !important;
                  page-break-inside: avoid !important;
                  break-after: page !important;
              }
          }
        `}} />

        {paginatedData.map((page, index) => (
          <div className="page" key={index}>
            
            <div className="logo-container">
               <img src={logo} alt="Radisson BLU HOTEL, CAIRO HELIOPOLIS" />
            </div>
            
            <div className="guest-name">{invoice.guestName}</div>

            {/* This flex container guarantees perfectly level alignment between Company & Room Details */}
            <div className="header-split">
              <div className="left-col">
                <div className="bold">{invoice.companyName}</div>
                <div className="bold">{addressLine1}</div>
                <div className="bold">{addressLine2}</div>
                
                <div className="bold" style={{marginTop: '5px', marginBottom: '3px'}}>INFORMATION INVOICE</div>
                
                <div className="grid-info-left">
                  <div>Membership No</div><div>:</div><div>{invoice.membershipNo ? `${invoice.membershipNo}` : ""}</div>
                  <div>A/R Number</div><div>:</div><div>{invoice.arNumber || ""}</div>
                  <div>Group Code</div><div>:</div><div>{invoice.groupCode || ""}</div>
                  <div>Company/Agent</div><div>:</div><div>{invoice.companyName || ""}</div>
                </div>
              </div>

              <div className="right-col">
                <div className="grid-info-right">
                  <div>Room No.</div><div>:</div><div>{invoice.roomNo}</div>
                  <div>Arrival</div><div>:</div><div>{invoice.formattedArrivalDate}</div>
                  <div>Departure</div><div>:</div><div>{invoice.formattedDepartureDate} Time: {invoice.invoiceTime || "00:00"}</div>
                  <div>Folio No</div><div>:</div><div>{invoice.folioNo || ""}</div>
                  <div>Booking No.</div><div>:</div><div>{invoice.bookingNo}</div>
                  <div>Page No.</div><div>:</div><div>Page {page.pageNo} of {page.totalPages}</div>
                  <div>Cashier No.</div><div>:</div><div>{invoice.cashierId || ""}</div>
                  <div>User ID</div><div>:</div><div>{invoice.userId || ""}</div>
                  <div>Adults/Child</div><div>:</div><div>{invoice.paxAdult}/{invoice.paxChild}</div>
                </div>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '10%', verticalAlign:"top"  }}>Date</th>
                  <th style={{ width: '50%', verticalAlign:"top" }}>Description</th>
                  <th className="right-align" style={{ width: '28%' }}>Charges<br />EGP</th>
                  <th className="right-align" style={{ width: '12%' ,paddingRight:"10px"}}>Credits<br />EGP</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.desc}</td>
                    <td className="right-align">{formatCurrency(item.charges)}</td>
                    <td className="right-align">{item.credits ? formatCurrency(item.credits) : ""}</td>
                  </tr>
                ))}

                {page.showTotals && (
                  <tr>
                    <td></td> 
                    <td className="right-align total-text-cell">Total</td>
                    {/* Borders only apply to these numeric cells */}
                    <td className="right-align total-num-cell">{formatCurrency(invoice.grandTotalEgp)}</td>
                    <td className="right-align total-num-cell">0.00</td>
                  </tr>
                )}
              </tbody>
            </table>

            {page.showTotals && (
              <>
                <div className="totals-wrapper">
                  <table className="totals-table">
                    <tbody>
                      <tr>
                        <td className="right-align">Balance Due</td>
                        <td className="right-align">{formatCurrency(invoice.grandTotalEgp)} EGP</td>
                        <td className="right-align" >Balance Due</td>
                        <td className="right-align">{formatCurrency(invoice.grandTotalEgp)} EGP</td>
                      </tr>
                      <tr>
                        <td className="right-align">Net Amount</td>
                        <td className="right-align">{formatCurrency(invoice.baseTaxableAmount)} EGP</td>
                        <td></td>
                        <td className="right-align">{formatCurrency(invoice.baseTaxableAmount)} EGP</td>
                      </tr>
                      <tr>
                        <td className="right-align">12% Service Charge</td>
                        <td className="right-align">{formatCurrency(invoice.serviceCharge)} EGP</td>
                        <td></td>
                        <td className="right-align">{formatCurrency(invoice.serviceCharge)} EGP</td>
                      </tr>
                      <tr>
                        <td className="right-align">14% VAT</td>
                        <td className="right-align">{formatCurrency(invoice.vat14Percent)} EGP</td>
                        <td></td>
                        <td className="right-align">{formatCurrency(invoice.vat14Percent)} EGP</td>
                      </tr>
                      <tr>
                        <td className="right-align">1% City TAX</td>
                        <td className="right-align">{formatCurrency(invoice.cityTax)} EGP</td>
                        <td></td>
                        <td className="right-align">{formatCurrency(invoice.cityTax)} EGP</td>
                      </tr>
                      <tr>
                        <td className="right-align">Exch, Rate</td>
                        <td className="right-align">{formatCurrency(invoice.exchangeRate)} USD</td>
                        <td></td>
                        <td className="right-align">{formatCurrency(invoice.exchangeRate)} USD</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="footer-section">
                   <div className="signature-box">Guest Signature: ...........................................</div>
                   <div className="thank-you-msg">
                       Thank you for choosing the {invoice.hotel || "Radisson Blu Hotel Cairo, Heliopolis"}
                   </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default RaddisonBluInvoiceView;