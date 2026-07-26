// import { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { InvoiceTemplate } from "../../components";
// import InvoiceApi from "../../Api/invoice.api";
// import tunisiaInvoiceApi from "../../Api/tunisiainvoice.api";
// import html2pdf from "html2pdf.js";

// export default function NovotelInvoiceView({ invoiceData }) {
//     const [invoice, setInvoice] = useState(null);
//     const [loading, setLoading] = useState(!invoiceData);
//     const [error, setError] = useState(null);
//     const [pdfLoading, setPdfLoading] = useState(false);
//     const [paginatedData, setPaginatedData] = useState([]);
//     const invoiceRef = useRef(null);

//     const { invoiceNumber } = useParams();
//     const navigate = useNavigate();
//     const invoiceId = invoiceNumber;

//     const LOGO_URL = "/novotel_logo.png";
//     const STAMP_URL = "/novotel_stemp.png";
//     const ROWS_PER_PAGE = 24;

//     useEffect(() => {
//         if (invoiceData) {
//             try {
//                 const transformed = transformApiData(invoiceData);
//                 setInvoice(transformed);
//             } catch (err) {
//                 console.error("Error transforming invoice data:", err);
//                 setError(err.message || "Failed to parse invoice data");
//             } finally {
//                 setLoading(false);
//             }
//         } else if (invoiceId) {
//             fetchInvoiceData();
//         } else {
//             setError("No invoice identifier provided");
//             setLoading(false);
//         }
//     }, [invoiceData, invoiceId]);

//     const fetchInvoiceData = async () => {
//         try {
//             setLoading(true);
//             setError(null);

//             const response = await tunisiaInvoiceApi.getInvoiceById(invoiceId);
//             const data = response.data || response;

//             const transformedData = transformApiData(data);
//             setInvoice(transformedData);
//         } catch (err) {
//             console.error("Error fetching invoice:", err);
//             setError(err.message || "Failed to load invoice data");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const transformApiData = (data) => {
//         if (!data) return null;

//         const formatDate = (dateStr) => {
//             if (!dateStr) return "";
//             try {
//                 const d = new Date(dateStr);
//                 if (isNaN(d.getTime())) return dateStr;
//                 const dd = String(d.getDate()).padStart(2, '0');
//                 const mm = String(d.getMonth() + 1).padStart(2, '0');
//                 const yy = String(d.getFullYear()).slice(-2);
//                 return `${dd}/${mm}/${yy}`;
//             } catch { return dateStr; }
//         };

//         const lines = [];

//         if (data.accommodationDetails && data.accommodationDetails.length > 0) {
//             data.accommodationDetails.forEach((acc) => {
//                 const dateStr = formatDate(acc.date);
//                 lines.push({ 
//                     date: dateStr, 
//                     description: acc.description || "Package", 
//                     debit: parseFloat(acc.debitTnd) || 0, 
//                     credit: parseFloat(acc.creditTnd) || 0 
//                 });
//                 if (data.showPerNightTax && data.cityTaxPerNight) {
//                     lines.push({ 
//                         date: dateStr, 
//                         description: "City tax", 
//                         debit: parseFloat(data.cityTaxPerNight) || 0, 
//                         credit: 0 
//                     });
//                 }
//             });
//         }

//         if (data.stampTaxTotal) {
//             lines.push({ 
//                 date: formatDate(data.invoiceDate), 
//                 description: "Stamp Tax", 
//                 debit: parseFloat(data.stampTaxTotal) || 0, 
//                 credit: 0 
//             });
//         }

//         const finalBalance = Number((data.grandTotalTnd || 0) + (data.cityTaxTotal || 0) + (data.stampTaxTotal || 0));

//         const invoiceData = {
//             guestName: data.guestName || "",
//             persons: data.adults||data.children ? `Adults: ${data.adults} / Child: ${data.children}` : "",
//             roomNo: data.roomNo||"",
//             referenceNo: data.invoiceNo||"",
//             arrival: formatDate(data.arrivalDate),
//             departure: formatDate(data.departureDate),
//             issueDate: formatDate(data.invoiceDate || data.created_at),
//             companyName: data.companyName || "AZAR TOURISM SERVICES",
//             companyAddress: data.companyAddress || "Algeria Square Building Tripoli Libyan",
//             accountNo: data.accountNo||"",
//             vatNo: data.vatNo||"",
//             invoiceNo: data.invoiceNo||"",
//             cashier: data.cashier||"",
//             currency: "TND",
//             exchangeRate: 2.85,
//             lines: lines,
//             netTaxable: parseFloat(data.totalHorsTaxes || 0),
//             fdsct: parseFloat(data.fdcst1Pct || 0),
//             vat7Total: parseFloat(data.vat7Pct || 0),
//             cityTaxTotal: parseFloat(data.cityTaxTotal || 0),
//             stampTaxTotal: parseFloat(data.stampTaxTotal || 1.000),
//             grossTotal: finalBalance,
//         };

//         return invoiceData;
//     };

//     const formatDate = (dateStr) => {
//         if (!dateStr) return "";
//         try {
//             const date = new Date(dateStr);
//             if (isNaN(date.getTime())) return dateStr;
//             const d = String(date.getDate()).padStart(2, "0");
//             const m = String(date.getMonth() + 1).padStart(2, "0");
//             const y = String(date.getFullYear()).slice(-2);
//             return `${d}/${m}/${y}`;
//         } catch (e) {
//             console.error("Error formatting date:", dateStr, e);
//             return dateStr;
//         }
//     };

//     useEffect(() => {
//         if (invoice?.lines) {
//             const pages = [];
//             for (let i = 0; i < invoice.lines.length; i += ROWS_PER_PAGE) {
//                 pages.push({
//                     lines: invoice.lines.slice(i, i + ROWS_PER_PAGE),
//                     pageNum: pages.length + 1,
//                     isLastPage: i + ROWS_PER_PAGE >= invoice.lines.length,
//                 });
//             }
//             if (pages.length === 0) {
//                 pages.push({
//                     lines: [],
//                     pageNum: 1,
//                     isLastPage: true,
//                 });
//             }
//             setPaginatedData(pages);
//         }
//     }, [invoice]);

//     const handleDownloadPDF = async () => {
//         if (!invoiceRef.current) return;
//         setPdfLoading(true);

//         const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
//         headStyles.forEach(style => {
//             if (style.parentNode) {
//                 style.parentNode.removeChild(style);
//             }
//         });

//         const element = invoiceRef.current;
//         element.classList.add('pdf-export-mode');

//         try {
//             // 2. Image Loading Verification
//             const images = element.querySelectorAll("img");
//             await Promise.all(
//                 Array.from(images).map((img) => {
//                     if (img.complete) return Promise.resolve();
//                     return new Promise((resolve) => {
//                         img.onload = resolve;
//                         img.onerror = resolve;
//                     });
//                 }),
//             );

//             // Small delay to ensure layout is settled
//             await new Promise(resolve => setTimeout(resolve, 500));

//             // 3. Smart Pagination (PDF Options)
//             const opt = {
//                 margin: 0,
//                 filename: `Novotel_invoice_${invoice.invoiceNo || invoice.referenceNo || "N/A"}.pdf`,
//                 image: { type: "jpeg", quality: 1 },
//                 html2canvas: {
//                     scale: 4,
//                     useCORS: true,
//                     letterRendering: true,
//                     scrollY: 0,
//                     windowWidth: 794
//                 },
//                 jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
//                 pagebreak: { mode: ["css", "legacy"] },
//             };

//             await html2pdf().set(opt).from(element).save();
//         } catch (error) {
//             console.error("❌ PDF Error:", error.message);
//             alert("Failed to generate PDF");
//         } finally {
//             element.classList.remove('pdf-export-mode');
//             headStyles.forEach(style => document.head.appendChild(style));
//             setPdfLoading(false);
//         }
//     };

//     const handlePrint = () => window.print();

//     const totalDebit = invoice?.lines.reduce((s, l) => s + (l.debit || 0), 0) || 0;
//     const totalCredit = invoice?.lines.reduce((s, l) => s + (l.credit || 0), 0) || 0;
//     const totalUSD = (totalDebit / (invoice?.exchangeRate || 2.85) || 0).toFixed(2);
//     const totalPages = paginatedData.length;

//     // Early return if invoice is null - InvoiceTemplate will handle the loading/error states
//     if (!invoice) {
//         return (
//             <InvoiceTemplate
//                 loading={loading}
//                 error={error}
//                 invoice={invoice}
//                 pdfLoading={pdfLoading}
//                 onDownloadPDF={handleDownloadPDF}
//                 onPrint={handlePrint}
//                 onBack={() => navigate("/invoices")}
//             >
//                 <></>
//             </InvoiceTemplate>
//         );
//     }

//     return (
//         <InvoiceTemplate
//             loading={loading}
//             error={error}
//             invoice={invoice}
//             pdfLoading={pdfLoading}
//             onDownloadPDF={handleDownloadPDF}
//             onPrint={handlePrint}
//             onBack={() => navigate("/invoices")}
//         >
//             <style>{`
//         @page {
//           size: A4;
//           margin: 0;
//         }

//         body {
//           margin: 0;
//           padding: 0;
//           font-family: Arial, sans-serif;
//         }

//         .pdf-export-mode {
//           background: #fff !important;
//           padding: 0 !important;
//           width: 210mm !important;
//           margin: 0 auto !important;
//         }

//         .pdf-export-mode * {
//           box-sizing: border-box;
//         }

//         .invoice-page {
//           position: relative;
//           padding: 12px 15px 35mm 15px;
//           background: white;
//           color: #000;
//           height: 296.5mm; /* Exact A4 height to prevent blank pages */
//           width: 210mm;
//           margin: 0 auto;
//           page-break-after: always;
//           font-size: 11px;
//           box-sizing: border-box;
//           overflow: hidden;
//         }

//         .pdf-export-mode .invoice-page {
//           margin: 0 auto !important;
//           box-shadow: none !important;
//           border: none !important;
//           height: 296.5mm !important;
//           max-height: 296.5mm !important;
//         }

//         .invoice-page:last-child {
//           page-break-after: avoid;
//         }

//         /* Novotel logo styling - keeps the height at 64px but forces squeezed width */
//         .novotel-logo-squeezed {
//           display: block;
//           margin-left: auto;
//           margin-right: auto;
//           height: 64px !important;
//           width: 145px !important;  /* Controls how narrow it gets. Adjust this lower if you want it even more squeezed */
//           object-fit: fill !important; /* Forces physical image squeeze without cropping */
//         }

//         .stamp-logo {
//           position: absolute;
//           right: 15px;
//           bottom: 10px;
//           width: 110px;
//           z-index: 100;
//         }

//         /* Essential Layout classes for PDF export */
//         .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
//         .flex { display: flex; }
//         .justify-between { justify-content: space-between; }
//         .flex-col { flex-direction: column; }
//         .text-right { text-align: right;     padding-right: 11px; }
//         .text-left p-1 {text-align: left;   vertical-align: top; }
//         .text-center { text-align: center; }
//         .w-full { width: 100%; }
//         .mb-4 { margin-bottom: 2rem; }
//         .mt-6 { margin-top: 1.5rem; }
//         .border-b { border-bottom: 1px solid #000; }
//         .pb-1 { padding-bottom: 0rem; }
//         .mb-1 { margin-bottom: 0.25rem; }
//         .mb-3 { margin-bottom: 0.75rem; }

//         @media print {
//           body {
//             margin: 0;
//             padding: 0;
//             background: white;
//           }

//           .no-print {
//             display: none !important;
//           }

//           .invoice-page {
//             margin: 0;
//             border: 0;
//             padding: 12px 15px 35mm 15px;
//           }
//         }
//       `}</style>

//             <div ref={invoiceRef}>
//                 {paginatedData.map((pageData, pageIdx) => (
//                     <div key={pageIdx} className="invoice-page shadow-lg print:shadow-none mb-4">
//                         {/* Squeezed Logo Container */}
//                         <div className="text-center mb-4">
//                             <img
//                                 src={LOGO_URL}
//                                 alt="Novotel"
//                                 className="novotel-logo-squeezed mt-1.5 mb-1.5"
//                             />
//                         </div>

//                         {/* Header - Two columns */}
//                         <div
//                             className="grid-2 mb-4"
//                             style={{ fontSize: "12px", lineHeight: "1.4" }}
//                         >
//                             <div>
//                                 <div>Name : {invoice.guestName}</div>
//                                 <div>Person(s) : {invoice.persons}</div>
//                                 <div>Room No. : {invoice.roomNo}</div>
//                                 <div>Arrival : {invoice.arrival}</div>
//                                 <div>Departure : {invoice.departure}</div>
//                                 <div>Novotel Tunis Lac,</div>
//                                 <div>The {invoice.issueDate}</div>
//                             </div>
//                             <div>
//                                 <div style={{textTransform: 'uppercase'}}>Company : {invoice.companyName}</div>
//                                 <div>Address : {invoice.companyAddress}</div>
//                                 <div style={{height: '8px'}}></div>
//                                 <div className="mt-1">Account NO : {invoice.accountNo}</div>
//                                 <div>VAT No : {invoice.vatNo}</div>
//                                 <div>Invoice No: {invoice.invoiceNo}</div>
//                                 <div>Cashier : {invoice.cashier}</div>
//                                 <div>
//                                     Pages : {pageData.pageNum} of {totalPages}
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Table */}
//                         <table
//                             className="w-full"
//                             style={{ borderCollapse: "collapse", fontSize: "11px" }}
//                         >
//                             <thead style={{lineHeight: '1.5'}}>
//                                 <tr
//                                     style={{
//                                         backgroundColor: "#ebebeb",
//                                         borderTop: "1px solid #000",
//                                         borderBottom: "1px solid #000",
//                                     }}
//                                 >
//                                     <th className="text-left p-1" style={{ width: "11%"  ,  verticalAlign: "top" ,  textAlign: "left", }}>
//                                         Date
//                                     </th>
//                                     <th className="text-left p-1" style={{ width: "55%" , verticalAlign: "top" , textAlign: "left",}}>
//                                         Description
//                                     </th>
//                                     <th className="text-right p-1" style={{ width: "15%" }}>
//                                         Debits
//                                         <br />
//                                         {invoice.currency}
//                                     </th>
//                                     <th className="text-right p-1" style={{ width: "12%" }}>
//                                         Credits
//                                         <br />
//                                         {invoice.currency}
//                                     </th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {pageData.lines.length > 0 ? (
//                                     pageData.lines.map((line, i) => (
//                                         <tr key={i}>
//                                             <td className="p-0" style={{lineHeight: '1.8'}}>{line.date}</td>
//                                             <td className="p-0" style={{lineHeight: '1.8'}}>{line.description}</td>
//                                             <td className="text-right p-0" style={{lineHeight: '1.8'}}>
//                                                 {Number(line.debit).toFixed(3)}
//                                             </td>
//                                             <td className="text-right p-0" style={{lineHeight: '1.8'}}>
//                                                 {Number(line.credit).toFixed(3)}
//                                             </td>
//                                         </tr>
//                                     ))
//                                 ) : (
//                                     <tr>
//                                         <td colSpan={4} className="text-center p-2">
//                                             No invoice items found
//                                         </td>
//                                     </tr>
//                                 )}
//                             </tbody>
//                         </table>

//                         {/* Footer - Only on last page */}
//                         {pageData.isLastPage && (
//                             <div className="mt-6" style={{ fontSize: "10px" }}>
//                                 <div style={{ borderTop: "1px solid #000", paddingTop: "2px" }}>
//                                     <div className="grid-2">
//                                         {/* Left - USD */}
//                                         <div
//                                             className="flex flex-col"
//                                             style={{
//                                                 justifyContent: "end",
//                                             }}
//                                         >
//                                             <div
//                                                 className="flex justify-between"
//                                                 style={{ maxWidth: "200px" }}
//                                             >
//                                                 <span>USD Exch. Rate:</span>
//                                                 <span>
//                                                     {(invoice.exchangeRate || 2.85).toFixed(2)}{" "}
//                                                     {invoice.currency}
//                                                 </span>
//                                             </div>
//                                             <div
//                                                 className="flex justify-between"
//                                                 style={{ maxWidth: "200px" }}
//                                             >
//                                                 <span>Total in USD:</span>
//                                                 <span>{totalUSD} USD</span>
//                                             </div>
//                                         </div>

//                                         {/* Right - Totals and taxes */}
//                                         <div>
//                                             <div className="flex justify-between border-b border-black pb-1 mb-1">
//                                                 <span style={{ marginLeft: "auto", marginRight: "170px" , fontSize:"12px"}}>
//                                                     Total
//                                                 </span>
//                                                 <span className="text-right" style={{ width: "80px" }}>
//                                                     {totalDebit.toFixed(3)}
//                                                 </span>
//                                                 <span className="text-right" style={{ width: "103px" }}>
//                                                     {totalCredit.toFixed(3)}
//                                                 </span>
//                                             </div>
//                                             <div className="flex justify-between mb-3">
//                                                 <span style={{ marginLeft: "auto" ,fontSize: "12px", paddingRight: "15px"}}>
//                                                     Balance
//                                                 </span>
//                                                 <span className="text-center" style={{ width: "330px" ,fontSize: "12px" ,textAlign:"left",paddingLeft:"50px"}}>
//                                                     {totalDebit.toFixed(3)} {invoice.currency}
//                                                 </span>
//                                             </div>

//                                             <div className="text-right"   style={{ lineHeight: "1.4",     width: "240px",      marginLeft: "auto" , alignContent:""}}>

//                                                 <div className="flex justify-between" style={{textAlign:"left"}}>
//                                                     <span>Net Taxable</span>
//                                                     <span>
//                                                         {Number(invoice.netTaxable || 0).toFixed(3)}{" "}
//                                                         {invoice.currency}
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex justify-between">
//                                                     <span>FDCST 1 %</span>
//                                                     <span>
//                                                         {Number(invoice.fdsct || 0).toFixed(3)}{" "}
//                                                         {invoice.currency}
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex justify-between">
//                                                     <span>VAT 7%</span>
//                                                     <span>
//                                                         {Number(invoice.vat7Total || 0).toFixed(3)}{" "}
//                                                         {invoice.currency}
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex justify-between">
//                                                     <span>VAT 19%</span>
//                                                     <span>0.000 {invoice.currency}</span>
//                                                 </div>
//                                                 <div className="flex justify-between">
//                                                     <span>City Tax</span>
//                                                     <span>
//                                                         {Number(invoice.cityTaxTotal || 0).toFixed(3)}{" "}
//                                                         {invoice.currency}
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex justify-between">
//                                                     <span>Stamp Tax</span>
//                                                     <span>
//                                                         {Number(invoice.stampTaxTotal || 0).toFixed(3)}{" "}
//                                                         {invoice.currency}
//                                                     </span>
//                                                 </div>
//                                                 <div className="flex justify-between">
//                                                     <span>Non Revenue</span>
//                                                     <span>0.000 {invoice.currency}</span>
//                                                 </div>
//                                                 <div className="flex justify-between">
//                                                     <span>Paid Out</span>
//                                                     <span>0.000 {invoice.currency}</span>
//                                                 </div>
//                                                 <div className="flex justify-between">
//                                                     <span>Total Gross</span>
//                                                     <span>
//                                                         {Number(invoice.grossTotal || 0).toFixed(3)}{" "}
//                                                         {invoice.currency}
//                                                     </span>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Stamp logo - bottom-right corner on EVERY page */}
//                         <img
//                             src={STAMP_URL}
//                             alt="Novotel Stamp"
//                             className="stamp-logo h-15 mb-1.5 print-stamp"
//                         />
//                     </div>
//                 ))}
//             </div>
//         </InvoiceTemplate>
//     );
// }




import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { InvoiceTemplate, NovotelInvoiceHeader, NovotelInvoiceFooter } from "../../components";
import tunisiaInvoiceApi from "../../Api/tunisiainvoice.api";
import html2pdf from "html2pdf.js";
import toast from "react-hot-toast";

export default function NovotelInvoiceView({ invoiceData }) {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(!invoiceData);
    const [error, setError] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [paginatedData, setPaginatedData] = useState([]);
    const invoiceRef = useRef(null);

    const location = useLocation();
    const { novoid, invoiceNumber } = useParams();
    const navigate = useNavigate();
    const invoiceId = novoid || invoiceNumber;

    const LOGO_URL = "/novotel_logo.png";
    const STAMP_URL = "/novotel_stemp.png";
    const ROWS_PER_PAGE = 28;

    const isPdfDownload = location.pathname.includes("/nvdownload-pdf");

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (invoiceData) {
            try {
                const transformed = transformApiData(invoiceData);
                setInvoice(transformed);
            } catch (err) {
                console.error("Error transforming invoice data:", err);
                setError(err.message || "Failed to parse invoice data");
            } finally {
                setLoading(false);
            }
        } else if (invoiceId) {
            fetchInvoiceData();
        } else {
            setError("No invoice identifier provided");
            setLoading(false);
        }
    }, [invoiceData, invoiceId]);

    const fetchInvoiceData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await tunisiaInvoiceApi.getInvoiceById(invoiceId);
            const data = response.data || response;

            const transformedData = transformApiData(data);
            setInvoice(transformedData);
        } catch (err) {
            console.error("Error fetching invoice:", err);
            setError(err.message || "Failed to load invoice data");
        } finally {
            setLoading(false);
        }
    };

    // ── Date formatter ────────────────────────────────────────────────────────
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const d = String(date.getDate()).padStart(2, "0");
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const y = String(date.getFullYear()).slice(-2);
            return `${d}/${m}/${y}`;
        } catch (e) {
            console.error("Error formatting date:", dateStr, e);
            return dateStr;
        }
    };

    // ── Transform: real Tunisia flat schema -> table lines, grouped by date ────
    // Order within a day: accommodation (1) -> city tax (2) -> stamp tax (3) -> other services (4)
    // This mirrors the original InvoiceViewPage row-building logic exactly,
    // just pointed at the actual saved field names (accommodationDetails,
    // cityTaxDetails, stampTaxDetails, otherServices - all flat, no nesting).
    const transformApiData = (data) => {
        if (!data) return null;

        const lines = [];
        const itemsByDate = {};

        const pushItem = (date, item) => {
            if (!date) return;
            if (!itemsByDate[date]) itemsByDate[date] = [];
            itemsByDate[date].push(item);
        };

        // 1. Accommodation rows
        (data.accommodationDetails || []).forEach((d) => {
            pushItem(d.date, {
                date: formatDate(d.date),
                description: d.description || "Hébergement",
                debit: parseFloat(d.debitTnd ?? d.rate) || 0,
                credit: parseFloat(d.creditTnd) || 0,
                order: 1,
            });
        });

        // 2. City tax rows - one per night, always shown (now itemized by backend)
        (data.cityTaxDetails || []).forEach((d) => {
            pushItem(d.date, {
                date: formatDate(d.date),
                description: d.description || "Taxe de séjour",
                debit: parseFloat(d.amount) || 0,
                credit: 0,
                order: 2,
            });
        });

        // 3. Stamp tax - one-time row, first night
        const firstNightDate = data.accommodationDetails?.[0]?.date || data.arrivalDate;
        (data.stampTaxDetails || []).forEach((d) => {
            pushItem(d.date || firstNightDate, {
                date: formatDate(d.date || firstNightDate),
                description: d.description || "Droit de timbre",
                debit: parseFloat(d.amount) || 0,
                credit: 0,
                order: 3,
            });
        });

        // 4. Other services - each on its own date
        (data.otherServices || []).forEach((s) => {
            pushItem(s.date || data.invoiceDate, {
                date: formatDate(s.date || data.invoiceDate),
                description: s.name || "Service",
                debit: parseFloat(s.amount) || 0,
                credit: 0,
                order: 4,
            });
        });

        // Flatten: sort within each date by order, then across dates chronologically
        Object.keys(itemsByDate).forEach((date) => {
            const dateItems = itemsByDate[date];
            dateItems.sort((a, b) => a.order - b.order);
            lines.push(...dateItems);
        });

        lines.sort((a, b) => {
            if (!a.date || !b.date) return 0;
            const convertDate = (dateStr) => {
                const parts = dateStr.split("/");
                if (parts.length !== 3) return 0;
                return parseInt(parts[2] + parts[1] + parts[0]);
            };
            return convertDate(a.date) - convertDate(b.date);
        });

        const persons =
            data.nbPersons || (data.adults || 0) + (data.children || 0) || "";

        return {
            guestName: data.guestName || "Guest",
            persons,
            roomNo: data.roomNo || "",
            referenceNo: data.refferenceNo || data.invoiceNo || "",
            arrival: formatDate(data.arrivalDate),
            departure: formatDate(data.departureDate),
            issueDate: formatDate(data.invoiceDate),

            // Company / billing info - real field names from the saved schema
            companyName: data.companyName || "Azar Tourism Services",
            companyAddress: "Tripoli Tower Ground Floor Office no 50, Tripoli, Libya.",
            accountNo: data.arAccount || "",
            vatNo: data.vatNo || "",
            invoiceNo: data.invoiceNo || "",
            cashier: data.cashierName || data.cashierId || "",

            currency: "TND",
            // TND-direct hotels convert to USD via exchangeUsdRate (not the EUR rate)
            exchangeRate: parseFloat(data.exchangeUsdRate) || 0,
            lines,

            // Tax breakdown - already correctly separated by the backend, no re-deriving
            netTaxable: parseFloat(data.totalHorsTaxes) || 0,
            fdsct: parseFloat(data.fdcst1Pct) || 0,
            vat7Total: parseFloat(data.vat7Pct) || 0,
            cityTaxTotal: parseFloat(data.cityTaxTotal) || 0,
            stampTaxTotal: parseFloat(data.stampTaxTotal) || 0,
            // grandTotalTnd is now the single source of truth - accommodation + city tax
            // + stamp tax + services, added exactly once. Matches sum of all line items.
            grossTotal: parseFloat(data.grandTotalTnd) || 0,
            // Backend-calculated USD balance, preferred over re-deriving on the frontend
            balanceUsd: parseFloat(data.balanceUsd) || 0,
        };
    };

    // ── Auto PDF download (when routed via /nvdownload-pdf) ─────────────────────
    useEffect(() => {
        if (
            !isPdfDownload ||
            !invoice ||
            !Array.isArray(paginatedData) ||
            paginatedData.length === 0
        ) {
            return;
        }

        let cancelled = false;

        const autoDownload = async () => {
            try {
                await new Promise((res) => setTimeout(res, 300));
                if (cancelled) return;
                await handleDownloadPDF();
                if (!cancelled) navigate("/invoices", { replace: true });
            } catch (e) {
                console.error("Auto PDF failed:", e);
            }
        };

        autoDownload();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPdfDownload, invoice, paginatedData]);

    // ── Pagination ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (invoice?.lines) {
            const pages = [];
            for (let i = 0; i < invoice.lines.length; i += ROWS_PER_PAGE) {
                pages.push({
                    lines: invoice.lines.slice(i, i + ROWS_PER_PAGE),
                    pageNum: pages.length + 1,
                    isLastPage: i + ROWS_PER_PAGE >= invoice.lines.length,
                });
            }
            if (pages.length === 0) {
                pages.push({ lines: [], pageNum: 1, isLastPage: true });
            }
            setPaginatedData(pages);
        }
    }, [invoice]);

    // ── PDF export ────────────────────────────────────────────────────────────
    const handleDownloadPDF = async () => {
        if (!invoiceRef.current) return;
        setPdfLoading(true);

        const headStyles = Array.from(
            document.head.querySelectorAll('link[rel="stylesheet"], style')
        );
        headStyles.forEach((style) => {
            if (style.parentNode) style.parentNode.removeChild(style);
        });

        try {
            const images = invoiceRef.current.querySelectorAll("img");
            await Promise.all(
                Array.from(images).map((img) => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                })
            );

            await new Promise((resolve) => setTimeout(resolve, 500));

            const element = invoiceRef.current;
           const opt = {
      margin: 0,
      filename: `${invoice.referenceNo|| "Invoice"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 794,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      
      // Update this line to strict CSS mode to respect your 'page-break-after' rule
      pagebreak: { mode: "css" }, 
  };

            await html2pdf().set(opt).from(element).save();
            toast.success("PDF Downloaded Successfully");
        } catch (error) {
            console.error("❌ PDF Error:", error.message);
            toast.error("Failed to generate PDF");
        } finally {
            headStyles.forEach((style) => document.head.appendChild(style));
            setPdfLoading(false);
        }
    };

    const handlePrint = () => window.print();

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalDebit = invoice?.lines?.reduce((s, l) => s + (l.debit || 0), 0) || 0;
    const totalCredit = invoice?.lines?.reduce((s, l) => s + (l.credit || 0), 0) || 0;
    // Prefer the backend-calculated USD balance; fall back to a manual conversion
    // only if it's missing, guarding against divide-by-zero.
    const totalUSD = invoice?.balanceUsd
        ? invoice.balanceUsd.toFixed(2)
        : (totalDebit / (invoice?.exchangeRate || 1)).toFixed(2);
    const totalPages = paginatedData.length;

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
            {invoice && (
                <div ref={invoiceRef}>
                    <style>{`
  @page {
    size: A4;
    margin: 0;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
  }

  .invoice-page {
    position: relative;
    padding: 12px 15px 35mm 15px;
    background: white;
    color: #000;
min-height: 295mm;
    page-break-after: always;
    font-size: 11px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    max-width: 794px;
    margin: 0 auto;
  }

  .invoice-page:last-child {
    page-break-after: auto;
  }

  .stamp-logo {
    position: absolute;
    right: 20px;
    bottom: 15px;
    width: 110px;
    pointer-events: none;
  }

  table {
    margin-bottom: 10px;
  }

  @media print {
    body {
      margin: 0;
      padding: 0;
      background: white;
    }

    .no-print {
      display: none !important;
    }

    .invoice-page {
      margin: 0;
      border: 0;
      padding: 12px 15px 35mm 15px;
    }
  }
`}</style>

                    {paginatedData.map((pageData, pageIdx) => (
                        <div key={pageIdx} className="invoice-page">
                            <NovotelInvoiceHeader
                                logoUrl={LOGO_URL}
                                invoice={invoice}
                                pageNum={pageData.pageNum}
                                totalPages={totalPages}
                            />

                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "11px",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            backgroundColor: "#ebebeb",
                                            borderTop: "1px solid #000",
                                            borderBottom: "1px solid #000",
                                        }}
                                    >
                                        <th style={{ textAlign: "left", padding: "4px", width: "15%" }}>
                                            Date
                                        </th>
                                        <th style={{ textAlign: "left", padding: "4px", width: "55%" }}>
                                            Description
                                        </th>
                                        <th style={{ textAlign: "right", padding: "4px", width: "15%" }}>
                                            Debits
                                            <br />
                                            {invoice.currency}
                                        </th>
                                        <th style={{ textAlign: "right", padding: "4px", width: "15%" }}>
                                            Credits
                                            <br />
                                            {invoice.currency}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageData.lines.length > 0 ? (
                                        pageData.lines.map((line, i) => (
                                            <tr key={i}>
                                                <td style={{ padding: "4px" }}>{line.date}</td>
                                                <td style={{ padding: "4px" }}>{line.description}</td>
                                                <td style={{ textAlign: "right", padding: "4px" }}>
                                                    {Number(line.debit).toFixed(3)}
                                                </td>
                                                <td style={{ textAlign: "right", padding: "4px" }}>
                                                    {Number(line.credit).toFixed(3)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: "center", padding: "8px" }}>
                                                No invoice items found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {pageData.isLastPage && (
                                <NovotelInvoiceFooter
                                    invoice={invoice}
                                    totalDebit={totalDebit}
                                    totalCredit={totalCredit}
                                    totalUSD={totalUSD}
                                />
                            )}

                            <img
                                src={STAMP_URL}
                                alt="Novotel Stamp"
                                className="stamp-logo"
                                style={{
                                    position: "absolute",
                                    right: "20px",
                                    bottom: "15px",
                                    width: "110px",
                                    height: "60px",
                                    marginBottom: "6px",
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </InvoiceTemplate>
    );
}