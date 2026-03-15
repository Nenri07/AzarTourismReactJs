// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import cairoInvoiceApi from "../../Api/cairoInvoice.api";
// import toast from "react-hot-toast";
// import html2pdf from 'html2pdf.js';
// import { InvoiceTemplate } from "../../components";
// import logo from "../../../public/dusit_thani-logo.png"; 

// const DusitThaniInvoiceView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const invoiceRef = useRef(null);

//   const isPdfDownload = location.pathname.includes("/download-pdf");

//   const formatDate = (dateStr) => {
//     if (!dateStr) return "";
//     const d = new Date(dateStr);
//     if (isNaN(d.getTime())) return dateStr;
//     const dd = String(d.getDate()).padStart(2, '0');
//     const mm = String(d.getMonth() + 1).padStart(2, '0');
//     const yy = String(d.getFullYear()).slice(-2);
//     return `${dd}/${mm}/${yy}`;
//   };

//   const formatCurrency = (val) => {
//     if (val === undefined || val === null || val === "") return "0.00";
//     return parseFloat(val).toLocaleString('en-US', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     });
//   };

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
//       console.error("Error fetching Dusit Thani invoice:", err);
//       setError("Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const transformInvoiceData = (data) => {
//     if (!data) return null;

//     let allTransactions = [];
    
//     const accommodations = data.accommodationDetails || [];
//     accommodations.forEach(item => {
//         allTransactions.push({
//             rawDate: new Date(item.date),
//             date: formatDate(item.date),
//             text: item.description || "Accommodation Charge Bed only",
//             debit: item.chargesEgp || item.rate || 0,
//             credit: item.creditsEgp || 0
//         });
//     });

//     const services = data.otherServices || [];
//     services.forEach(item => {
//         allTransactions.push({
//             rawDate: new Date(item.date),
//             date: formatDate(item.date),
//             text: item.name || item.description || "Service",
//             debit: item.amount || 0,
//             credit: 0
//         });
//     });

//     allTransactions.sort((a, b) => a.rawDate - b.rawDate);

//     const pages = [];
//     const CHUNK_SIZE = 24;
//     for (let i = 0; i < allTransactions.length; i += CHUNK_SIZE) {
//         pages.push({
//             items: allTransactions.slice(i, i + CHUNK_SIZE),
//             pageNum: pages.length + 1,
//             isLast: i + CHUNK_SIZE >= allTransactions.length
//         });
//     }
    
//     if (pages.length === 0) {
//         pages.push({ items: [], pageNum: 1, isLast: true });
//     }

//     const exRate = data.exchangeRate || 47.59;
//     const totalDebit = data.grandTotalEgp || data.totalInclVat || allTransactions.reduce((sum, t) => sum + t.debit, 0);
//     const totalCredit = allTransactions.reduce((sum, t) => sum + t.credit, 0);
//     const balanceEgp = 0.00;
//     const totalUsd = data.balanceUsd || data.usdAmount || (totalDebit / exRate);

//     return {
//       ...data,
//       guestName: data.guestName || "",
//       companyName: data.companyName || "",
//       address: data.address || "",
//       roomNo: data.roomNo || "",
//       confNo: data.confNo || "",
//       crsNo: data.crsNo || "",
//       folioNo: data.folioNo || "",
//       invoiceNo: data.invoiceNo || "",
//       arrivalDate: formatDate(data.arrivalDate),
//       departureDate: formatDate(data.departureDate),
//       printedBy: data.printedBy || data.userId || "MADLY",
//       memberNo: data.membershipNo || data.memberNo || "",
//       arNumber: data.arNumber || "",
//       pages,
//       totalDebitStr: formatCurrency(totalDebit),
//       totalCreditStr: formatCurrency(totalCredit > 0 ? totalCredit : totalDebit), 
//       balanceEgpStr: formatCurrency(balanceEgp), 
//       totalUsdStr: formatCurrency(totalUsd),
//       exchangeRateStr: formatCurrency(exRate),
//     };
//   };

//   const handleDownloadPDF = async () => {
//     if (!invoiceRef.current) return;
//     setPdfLoading(true);

//     const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//     headStyles.forEach(style => {
//         const text = style.textContent || "";
//         const href = style.href || "";
        
//         const isPreserved = text.includes('Dusit') || 
//                             text.includes('dt-') ||
//                             href.includes('dusit') || 
//                             text.includes('Arial');

//         if (isPreserved) return; 

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
//         filename: `DusitThani_Invoice_${invoice?.confNo || 'Invoice'}.pdf`,
//         image: { type: 'jpeg', quality: 1 },
//         html2canvas: { 
//             scale: 4, 
//             useCORS: true, 
//             allowTaint: true,
//             backgroundColor: '#ffffff',
//             letterRendering: true,
//             scrollY: 0,
//             windowWidth: 850 
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
//         /* --- General Wrapper --- */
//         .dt-invoice-wrapper {
//             background-color: #fff;
//             min-height: 100vh;
//             display: flex;
//             flex-direction: column;
//             align-items: center;
//         }
        
//         .dt-invoice-wrapper * {
//             font-family: Arial, Helvetica, sans-serif;
//             color: #000;
//             box-sizing: border-box;
//         }

//         .dt-container {
//             width: 100%;
//             max-width: 850px;
//             margin: 0 auto;
//             padding: 20px;
//             background-color: #fff;
//             position: relative;
//         }

//         /* --- PRINT ISOLATION FIX --- */
//         @media print {
//             @page {
//                 size: A4 portrait;
//                 margin: 0 !important; /* Forces 0 margins on default browser print */
//             }
//             html, body {
//                 margin: 0 !important;
//                 padding: 0 !important;
//                 background-color: #fff !important;
//             }
//             body * {
//                 visibility: hidden;
//             }
//             .dt-invoice-wrapper, .dt-invoice-wrapper * {
//                 visibility: visible;
//             }
//             .dt-invoice-wrapper {
//                 position: absolute;
//                 left: 0;
//                 top: 0;
//                 width: 100%;
//                 margin: 0;
//                 padding: 0;
//                 min-height: auto !important; /* Prevents 100vh from pushing a blank extra page */
//             }
//             .dt-container { 
//                 // padding: 15mm 10mm !important; /* Re-apply slight padding inside the page so text doesn't touch the absolute physical edge of the paper */
//                 margin: 0 auto !important; 
//                 box-shadow: none !important; 
//                 max-width: 100% !important; 
//                 page-break-inside: avoid;
//             }
//         }

//         /* --- Pagination Break --- */
//         .dt-page-break {
//             page-break-after: always;
//         }

//         /* --- Invoice Styles --- */
//         .dt-header {
//             text-align: center;
//             margin-bottom: 30px;
//         }

//         .dt-logo-container {
//             width: 180px;
//             height: 45px;
//             margin: 0 auto;
//             display: flex;
//             justify-content: center;
//             align-items: center;
//             background-color: #ffffff;
//         }

//         .dt-logo-img {
//             width: 100%;
//             height: 100%;
//             object-fit: contain;
//         }
        
//         .dt-hotel-name {
//             font-size: 9px;
//             color: #555;
//             letter-spacing: 1px;
//             margin-top: 6px;
//             text-transform: uppercase;
//         }
        
//         .dt-guest-info {
//             line-height: 1.3;
//             margin-bottom: 20px;
//             font-size: 14px;
//         }

//         .dt-thin-line { border-top: 1px solid #000; }

//         .dt-invoice-title {
//             font-weight: bold;
//             font-size: 14px;
//             margin: 12px 0 15px 0;
//         }
//         .dt-info-table {
//             width: 100%;
//             border-collapse: collapse;
//             margin-bottom: 25px;
//             font-size: 14px;
//         }
//         .dt-info-table td {
//             padding: 2.5px 0;
//             vertical-align: top;
//         }
//         .dt-info-table .dt-label { width: 100px; }
//         .dt-info-table .dt-colon { width: 15px; }
//         .dt-info-table .dt-val-left { width: 160px; }
//         .dt-info-table .dt-crs-col { width: 140px; }
//         .dt-info-table .dt-label-right { width: 110px; }
//         .dt-info-table .dt-val-right { width: auto; }

//         .dt-main-table {
//             width: 100%;
//             border-collapse: collapse;
//             margin-bottom: 0;
//             font-size: 11px;
//         }
//         .dt-main-table th {
//             font-weight: bold;
//             text-align: left;
//         }
//         .dt-main-table .dt-header-top th {
//             border-top: 1px solid #000;
//             padding-top: 8px;
//             padding-bottom: 4px;
//         }
//         .dt-main-table .dt-header-bottom th {
//             border-bottom: 1px solid #000;
//             padding-bottom: 8px;
//             padding-top: 2px;
//         }
//         .dt-main-table td {
//             padding: 8px 0; 
//             vertical-align: top;
//         }
        
//         .dt-col-date { width: 10%; }
//         .dt-col-text { width: 52%; }
//         .dt-col-debit { width: 19%; text-align: right !important; }
//         .dt-col-credit { width: 15%; text-align: right !important; padding-right: 35px; }

//         .dt-totals-wrapper {
//             border-top: 1px solid #000;
//             margin-top: 5px;
//             padding-top: 12px;
//             display: flex;
//             font-weight: bold;
//             font-size: 14px;
//         }
//         .dt-total-label { width: 64%; text-align: center; padding-left: 35px; }
//         .dt-total-debit-val { width: 21%; text-align: right; }
//         .dt-total-credit-val { width: 11%; text-align: right; }

//         .dt-thick-line-container {
//             display: flex;
//             justify-content: flex-end;
//             margin-top: 10px;
//             margin-bottom: 15px;
//         }
//         .dt-thick-line {
//             width: 55%;
//             border-top: 3px solid #000;
//         }

//         .dt-summary-wrapper {
//             display: flex;
//             justify-content: flex-end;
//         }
//         .dt-summary-box {
//             width: 25%;
//             font-weight: bold;
//             font-size: 12px;
//             padding-right: 26px;
//         }
//         .dt-summary-row {
//             display: flex;
//             justify-content: space-between;
//             padding: 3px 0;
//         }
//       `}</style>

//       <div className="dt-invoice-wrapper" ref={invoiceRef}>
        
//         {/* Iterate over Chunked Pages */}
//         {invoice.pages.map((page, index) => (
//             <div 
//                 key={index} 
               
//                 className={`dt-container ${index < invoice.pages.length - 1 ? 'dt-page-break' : ''}`}
//             >
                
//                 {/* Header Block */}
//                 <div className="dt-header">
//                     <div>
//                         <div className="dt-logo-container">
//                             <img src={logo} alt="Dusit Thani Logo" className="dt-logo-img" />
//                         </div>
                        
//                     </div>
//                 </div>

//                 {/* Guest Block */}
//                 <div className="dt-guest-info">
//                     <strong>{invoice.guestName}</strong><br />
//                     {invoice.companyName && <>{invoice.companyName}<br /></>}
//                     {invoice.address.split('\n').map((line, i) => (
//                         <React.Fragment key={i}>
//                             {line}<br />
//                         </React.Fragment>
//                     ))}
//                 </div>

//                 <div className="dt-thin-line"></div>

//                 {/* Info Metadata Block */}
//                 <div className="dt-invoice-title">INFORMATION INVOICE</div>
//                 <table className="dt-info-table">
//                     <tbody>
//                         <tr>
//                             <td className="dt-label">Room No.</td><td className="dt-colon">:</td><td className="dt-val-left">{invoice.roomNo}</td>
//                             <td className="dt-crs-col"></td>
//                             <td className="dt-label-right">Arrival Date</td><td className="dt-colon">:</td><td className="dt-val-right">{invoice.arrivalDate}</td>
//                         </tr>
//                         <tr>
//                             <td className="dt-label">Conf. No.</td><td className="dt-colon">:</td><td className="dt-val-left">{invoice.confNo}</td>
//                             <td className="dt-crs-col">CRS No. &nbsp;&nbsp;: {invoice.crsNo}</td>
//                             <td className="dt-label-right">Departure Date</td><td className="dt-colon">:</td><td className="dt-val-right">{invoice.departureDate}</td>
//                         </tr>
//                         <tr>
//                             <td className="dt-label">Company /Agent</td><td className="dt-colon">:</td><td className="dt-val-left">{invoice.companyName}</td>
//                             <td className="dt-crs-col"></td>
//                             <td className="dt-label-right">Page No.</td><td className="dt-colon">:</td><td className="dt-val-right">{page.pageNum} of {invoice.pages.length}</td>
//                         </tr>
//                         <tr>
//                             <td className="dt-label">Folio No.</td><td className="dt-colon">:</td><td className="dt-val-left">{invoice.folioNo}</td>
//                             <td className="dt-crs-col"></td>
//                             <td className="dt-label-right">Printed By</td><td className="dt-colon">:</td><td className="dt-val-right">{invoice.printedBy}</td>
//                         </tr>
//                         <tr>
//                             <td className="dt-label">Invoice No.</td><td className="dt-colon">:</td><td className="dt-val-left">{invoice.invoiceNo}</td>
//                             <td className="dt-crs-col"></td>
//                             <td className="dt-label-right">Member No.</td><td className="dt-colon">:</td><td className="dt-val-right">{invoice.memberNo}</td>
//                         </tr>
//                         <tr>
//                             <td colSpan="4"></td>
//                             <td className="dt-label-right">A/R Number</td><td className="dt-colon">:</td><td className="dt-val-right">{invoice.arNumber}</td>
//                         </tr>
//                     </tbody>
//                 </table>

//                 {/* Main Content Table (Limited to 24 rows max per map loop) */}
//                 <table className="dt-main-table">
//                     <thead>
//                         <tr className="dt-header-top">
//                             <th className="dt-col-date">Date</th>
//                             <th className="dt-col-text">Text</th>
//                             <th className="dt-col-debit">Debit</th>
//                             <th className="dt-col-credit">Credit</th>
//                         </tr>
//                         <tr className="dt-header-bottom">
//                             <th></th>
//                             <th></th>
//                             <th className="dt-col-debit">EGP</th>
//                             <th className="dt-col-credit">EGP</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {page.items.map((it, idx) => (
//                             <tr key={idx}>
//                                 <td>{it.date}</td>
//                                 <td>{it.text}</td>
//                                 <td className="dt-col-debit">{formatCurrency(it.debit)}</td>
//                                 <td className="dt-col-credit" style={{paddingRight:"35px"}}>{it.credit > 0 ? formatCurrency(it.credit) : "0.00"}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>

//                 {/* Footer Outputs ONLY on the last chunk/page */}
//                 {page.isLast && (
//                     <>
//                         <div className="dt-totals-wrapper">
//                             <div className="dt-total-label">Total</div>
//                             <div className="dt-total-debit-val">{invoice.totalDebitStr}</div>
//                             <div className="dt-total-credit-val">{invoice.totalCreditStr}</div>
//                         </div>

//                         <div className="dt-thick-line-container">
//                             <div className="dt-thick-line"></div>
//                         </div>

//                         <div className="dt-summary-wrapper">
//                             <div className="dt-summary-box">
//                                 <div className="dt-summary-row">
//                                     <span>Balance EGP</span>
//                                     <span>{invoice.balanceEgpStr}</span>
//                                 </div>
//                                 <div className="dt-summary-row">
//                                     <span>Total In USD</span>
//                                     <span>{invoice.totalUsdStr}</span>
//                                 </div>
//                                 <div className="dt-summary-row">
//                                     <span>Exchange Rate</span>
//                                     <span>{invoice.exchangeRateStr}</span>
//                                 </div>
//                             </div>
//                         </div>
//                     </>
//                 )}

//             </div>
//         ))}
        
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default DusitThaniInvoiceView;


import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from "../../../public/dusit_thani-logo.png"; 

const DusitThaniInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "") return "0.00";
    return parseFloat(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

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
      console.error("Error fetching Dusit Thani invoice:", err);
      setError("Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const transformInvoiceData = (data) => {
    if (!data) return null;

    let allTransactions = [];
    
    const accommodations = data.accommodationDetails || [];
    accommodations.forEach(item => {
        allTransactions.push({
            rawDate: new Date(item.date),
            date: formatDate(item.date),
            text: item.description || "Accommodation Charge Bed only",
            debit: item.chargesEgp || item.rate || 0,
            credit: item.creditsEgp || 0
        });
    });

    const services = data.otherServices || [];
    services.forEach(item => {
        allTransactions.push({
            rawDate: new Date(item.date),
            date: formatDate(item.date),
            text: item.name || item.description || "Service",
            debit: item.amount || 0,
            credit: 0
        });
    });

    allTransactions.sort((a, b) => a.rawDate - b.rawDate);

    const pages = [];
    const CHUNK_SIZE = 24;
    for (let i = 0; i < allTransactions.length; i += CHUNK_SIZE) {
        pages.push({
            items: allTransactions.slice(i, i + CHUNK_SIZE),
            pageNum: pages.length + 1,
            isLast: i + CHUNK_SIZE >= allTransactions.length
        });
    }
    
    if (pages.length === 0) {
        pages.push({ items: [], pageNum: 1, isLast: true });
    }

    const exRate = data.exchangeRate || 47.59;
    const totalDebit = data.grandTotalEgp || data.totalInclVat || allTransactions.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = allTransactions.reduce((sum, t) => sum + t.credit, 0);
    const balanceEgp = 0.00;
    const totalUsd = data.balanceUsd || data.usdAmount || (totalDebit / exRate);

    return {
      ...data,
      guestName: data.guestName || "",
      companyName: data.companyName || "",
      address: data.address || "",
      roomNo: data.roomNo || "",
      confNo: data.confNo || "",
      crsNo: data.crsNo || "",
      folioNo: data.folioNo || "",
      invoiceNo: data.invoiceNo || "",
      arrivalDate: formatDate(data.arrivalDate),
      departureDate: formatDate(data.departureDate),
      printedBy: data.printedBy || data.userId || "MADLY",
      memberNo: data.membershipNo || data.memberNo || "",
      arNumber: data.arNumber || "",
      pages,
      totalDebitStr: formatCurrency(totalDebit),
      totalCreditStr: formatCurrency(totalCredit > 0 ? totalCredit : totalDebit), 
      balanceEgpStr: formatCurrency(balanceEgp), 
      totalUsdStr: formatCurrency(totalUsd),
      exchangeRateStr: formatCurrency(exRate),
    };
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
        const text = style.textContent || "";
        const href = style.href || "";
        
        const isPreserved = text.includes('Dusit') || 
                            text.includes('dt-') ||
                            href.includes('dusit') || 
                            text.includes('Arial');

        if (isPreserved) return; 

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
        filename: `DusitThani_Invoice_${invoice?.confNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
            scale: 4, 
            useCORS: true, 
            allowTaint: true,
            backgroundColor: '#ffffff',
            letterRendering: true,
            scrollY: 0,
            windowWidth: 850 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      headStyles.forEach(style => {
          if (!style.parentNode) {
              document.head.appendChild(style);
          }
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
      <style>{`
        /* --- General Wrapper --- */
        .dt-invoice-wrapper {
            background-color: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .dt-invoice-wrapper * {
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            box-sizing: border-box;
        }

        .dt-container {
            width: 100%;
            max-width: 850px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            position: relative;
        }

        /* --- PRINT ISOLATION FIX --- */
        @media print {
            @page {
                size: A4 portrait;
                margin: 0 !important; /* Forces 0 margins on default browser print */
            }
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                background-color: #fff !important;
            }
            body * {
                visibility: hidden;
            }
            .dt-invoice-wrapper, .dt-invoice-wrapper * {
                visibility: visible;
            }
            .dt-invoice-wrapper {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                min-height: auto !important; /* Prevents 100vh from pushing a blank extra page */
            }
            .dt-container { 
                // padding: 15mm 10mm !important; /* Re-apply slight padding inside the page so text doesn't touch the absolute physical edge of the paper */
                margin: 0 auto !important; 
                box-shadow: none !important; 
                max-width: 100% !important; 
                page-break-inside: avoid;
            }
        }

        /* --- Pagination Break --- */
        .dt-page-break {
            page-break-after: always;
        }

        /* --- Invoice Styles --- */
        .dt-header {
            text-align: center;
            margin-bottom: 30px;
        }

        .dt-logo-container {
            width: 180px;
            height: 45px;
            margin: 0 auto;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #ffffff;
        }

        .dt-logo-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .dt-hotel-name {
            font-size: 9px;
            color: #555;
            letter-spacing: 1px;
            margin-top: 6px;
            text-transform: uppercase;
        }
        
        .dt-guest-info {
            line-height: 1.3;
            margin-bottom: 10px;
            font-size: 14px;
        }

        .dt-thin-line { border-top: 1px solid #000; }

        .dt-invoice-title {
            font-weight: bold;
            font-size: 15px;
            margin: 5px 0 10px 0;
        }
        
        /* New Metadata Layout */
        .dt-metadata-container {
            width: 100%;
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .dt-metadata-left, .dt-metadata-right {
            width: 48%;
            display: flex;
            flex-direction: column;
            gap: 2px;
           
        }
            .dt-metadata-right{
             padding-top:7px;
             padding-left:115px;
            gap: 3px !important;

            }

        .dt-meta-row {
            display: flex;
            align-items: flex-start;
            width: 100%;
        }

        .dt-meta-label {
            width: 120px;
            font-weight: normal;
            display: inline-block;
        }

        .dt-meta-colon {
            width: 15px;
            display: inline-block;
            text-align: center;
        }

        .dt-meta-value {
            flex-grow: 1;
            font-weight: normal;
            word-break: break-all;
        }

        .dt-meta-extra {
            margin-left: 20px;
            font-weight: normal;
            white-space: nowrap;
        }

        .dt-main-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0;
            font-size: 11px;
        }
        .dt-main-table th {
            font-weight: bold;
            text-align: left;
        }
        .dt-main-table .dt-header-top th {
            border-top: 1px solid #000;
            padding-top: 8px;
            padding-bottom: 4px;
        }
        .dt-main-table .dt-header-bottom th {
            border-bottom: 1px solid #000;
            padding-bottom: 8px;
            padding-top: 2px;
        }
        .dt-main-table td {
            padding: 8px 0; 
            vertical-align: top;
        }
        
        .dt-col-date { width: 10%; }
        .dt-col-text { width: 52%; }
        .dt-col-debit { width: 19%; text-align: right !important; }
        .dt-col-credit { width: 15%; text-align: right !important; padding-right: 35px; }

        .dt-totals-wrapper {
            border-top: 1px solid #000;
            margin-top: 5px;
            padding-top: 12px;
            display: flex;
            font-weight: bold;
            font-size: 14px;
        }
        .dt-total-label { width: 64%; text-align: center; padding-left: 35px; }
        .dt-total-debit-val { width: 21%; text-align: right; }
        .dt-total-credit-val { width: 11%; text-align: right; }

        .dt-thick-line-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
            margin-bottom: 15px;
        }
        .dt-thick-line {
            width: 55%;
            border-top: 3px solid #000;
        }

        .dt-summary-wrapper {
            display: flex;
            justify-content: flex-end;
        }
        .dt-summary-box {
            width: 30%;
            font-weight: bold;
            font-size: 12px;
            padding-right: 26px;
        }
        .dt-summary-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
        }
      `}</style>

      <div className="dt-invoice-wrapper" ref={invoiceRef}>
        
        {/* Iterate over Chunked Pages */}
        {invoice.pages.map((page, index) => (
            <div 
                key={index} 
               
                className={`dt-container ${index < invoice.pages.length - 1 ? 'dt-page-break' : ''}`}
            >
                
                {/* Header Block */}
                <div className="dt-header">
                    <div>
                        <div className="dt-logo-container">
                            <img src={logo} alt="Dusit Thani Logo" className="dt-logo-img" />
                        </div>
                        
                    </div>
                </div>

                {/* Guest Block */}
                <div className="dt-guest-info">
                    {invoice.guestName}<br />
                    {invoice.companyName && <>{invoice.companyName}<br /></>}
                    {invoice.address.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}<br />
                        </React.Fragment>
                    ))}
                </div>

                <div className="dt-thin-line"></div>

                {/* Info Metadata Block */}
                
                <div className="dt-metadata-container">
                    <div className="dt-metadata-left">
                        <div className="dt-invoice-title">INFORMATION INVOICE</div>
                        <div className="dt-meta-row"><span className="dt-meta-label">Room No.</span><span className="dt-meta-colon">:</span><span className="dt-meta-value">{invoice.roomNo}</span></div>
                        <div className="dt-meta-row"><span className="dt-meta-label">Conf. No.</span><span className="dt-meta-colon">:</span><span className="dt-meta-value">{invoice.confNo}</span><span className="dt-meta-extra">CRS No. : {invoice.crsNo}</span></div>
                        <div className="dt-meta-row"><span className="dt-meta-label">Company /Agent</span><span className="dt-meta-colon">:</span><span className="dt-meta-value">{invoice.companyName}</span></div>
                        <div className="dt-meta-row"><span className="dt-meta-label">Folio No.</span><span className="dt-meta-colon">:</span><span className="dt-meta-value">{invoice.folioNo}</span></div>
                        <div className="dt-meta-row"><span className="dt-meta-label">Invoice No.</span><span className="dt-meta-colon">:</span><span className="dt-meta-value">{invoice.invoiceNo}</span></div>
                    </div>
                    <div className="dt-metadata-right">
                        <div className="dt-meta-row"><span className="dt-meta-label">Arrival Date</span><span className="dt-meta-colon">:</span><span className="dt-meta-value">{invoice.arrivalDate}</span></div>
                        <div className="dt-meta-row"><span className="dt-meta-label">Departure Date</span><span className="dt-meta-colon">:</span><span className="dt-meta-value">{invoice.departureDate}</span></div>
                        <div className="dt-meta-row"><span className="dt-meta-label">Page No.</span><span className="dt-meta-colon">:</span><span className="dt-meta-value">{page.pageNum} of {invoice.pages.length}</span></div>
                        <div className="dt-meta-row"><span className="dt-meta-label">Printed By</span><span className="dt-meta-colon">:</span><span className="dt-meta-value">{invoice.printedBy}</span></div>
                        <div className="dt-meta-row"><span className="dt-meta-label">Member No.</span><span className="dt-meta-colon">:</span><span className="dt-meta-value">{invoice.memberNo}</span></div>
                        <div className="dt-meta-row"><span className="dt-meta-label">A/R Number</span><span className="dt-meta-colon">:</span><span className="dt-meta-value">{invoice.arNumber}</span></div>
                    </div>
                </div>

                {/* Main Content Table (Limited to 24 rows max per map loop) */}
                <table className="dt-main-table">
                    <thead>
                        <tr className="dt-header-top">
                            <th className="dt-col-date">Date</th>
                            <th className="dt-col-text">Text</th>
                            <th className="dt-col-debit">Debit</th>
                            <th className="dt-col-credit">Credit</th>
                        </tr>
                        <tr className="dt-header-bottom">
                            <th></th>
                            <th></th>
                            <th className="dt-col-debit">EGP</th>
                            <th className="dt-col-credit">EGP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {page.items.map((it, idx) => (
                            <tr key={idx}>
                                <td>{it.date}</td>
                                <td>{it.text}</td>
                                <td className="dt-col-debit">{formatCurrency(it.debit)}</td>
                                <td className="dt-col-credit" style={{paddingRight:"35px"}}>{it.credit > 0 ? formatCurrency(it.credit) : "0.00"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer Outputs ONLY on the last chunk/page */}
                {page.isLast && (
                    <>
                        <div className="dt-totals-wrapper">
                            <div className="dt-total-label">Total</div>
                            <div className="dt-total-debit-val">{invoice.totalDebitStr}</div>
                            <div className="dt-total-credit-val">{invoice.totalCreditStr}</div>
                        </div>

                        <div className="dt-thick-line-container">
                            <div className="dt-thick-line"></div>
                        </div>

                        <div className="dt-summary-wrapper">
                            <div className="dt-summary-box">
                                <div className="dt-summary-row">
                                    <span>Balance EGP</span>
                                    <span>{invoice.balanceEgpStr}</span>
                                </div>
                                <div className="dt-summary-row">
                                    <span>Total In USD</span>
                                    <span>{invoice.totalUsdStr}</span>
                                </div>
                                <div className="dt-summary-row">
                                    <span>Exchange Rate</span>
                                    <span>{invoice.exchangeRateStr}</span>
                                </div>
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

export default DusitThaniInvoiceView;