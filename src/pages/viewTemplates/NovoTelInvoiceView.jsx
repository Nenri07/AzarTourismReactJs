// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import {InvoiceTemplate} from "../../components";
// import InvoiceApi from '../../Api/invoice.api';

// export default function NovotelInvoiceView({ invoiceData }) {
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);
//   const [paginatedData, setPaginatedData] = useState([]);
  
//   const { invoiceNumber } = useParams();
//   const navigate = useNavigate();
//   const invoiceId = invoiceNumber;

//   const LOGO_URL = "/novotel_logo.png";
//   const STAMP_URL = "/novotel_stemp.png";
//   const ROWS_PER_PAGE = 24;

//   useEffect(() => {
//     if (invoiceData) {
//       const transformed = transformApiData(invoiceData);
//       setInvoice(transformed);
//       setLoading(false);
//     } else if (invoiceId) {
//       fetchInvoiceData();
//     } else {
//       setError("No invoice identifier provided");
//       setLoading(false);
//     }
//   }, [invoiceData, invoiceId]);

//   const fetchInvoiceData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await InvoiceApi.getCompleteInvoice(invoiceId);
//       const data = response.data || response;

//       const transformedData = transformApiData(data);
//       setInvoice(transformedData);
//     } catch (err) {
//       console.error("Error fetching invoice:", err);
//       setError(err.message || "Failed to load invoice data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const transformApiData = (data) => {
//     const inv = data.invoice || {};
//     const lines = [];

//     const firstNightDate =
//       data.accommodation_details?.[0]?.date ||
//       inv.invoice_date ||
//       inv.arrival_date;
//     const stampTaxAmount = parseFloat(inv.stamp_tax_total) || 0;

//     const itemsByDate = {};

//     // Process accommodation details
//     data.accommodation_details?.forEach((d) => {
//       const date = d.date || inv.arrival_date;
//       if (!itemsByDate[date]) itemsByDate[date] = [];

//       itemsByDate[date].push({
//         date: formatDate(date),
//         description: d.description || "Hébergement",
//         debit: parseFloat(d.rate) || 0,
//         credit: 0,
//         order: 1,
//       });
//     });

//     // Process city tax details
//     data.city_tax_details?.forEach((d) => {
//       const date = d.date || inv.arrival_date;
//       if (!itemsByDate[date]) itemsByDate[date] = [];

//       itemsByDate[date].push({
//         date: formatDate(date),
//         description: d.description || "Taxe de séjour",
//         debit: parseFloat(d.amount) || 0,
//         credit: 0,
//         order: 2,
//       });
//     });

//     // Add stamp tax ONLY on the first night's date
//     if (stampTaxAmount > 0 && firstNightDate) {
//       if (!itemsByDate[firstNightDate]) itemsByDate[firstNightDate] = [];

//       itemsByDate[firstNightDate].push({
//         date: formatDate(firstNightDate),
//         description: "Droit de timbre",
//         debit: stampTaxAmount,
//         credit: 0,
//         order: 3,
//       });
//     }

//     // Process other services
//     data.other_services?.forEach((s) => {
//       const serviceDate = s.date || inv.invoice_date;
//       if (!itemsByDate[serviceDate]) itemsByDate[serviceDate] = [];

//       itemsByDate[serviceDate].push({
//         date: formatDate(serviceDate),
//         description: s.name || "Service",
//         debit: parseFloat(s.amount) || 0,
//         credit: 0,
//         order: 4,
//       });
//     });

//     // Flatten and sort
//     Object.keys(itemsByDate).forEach((date) => {
//       const dateItems = itemsByDate[date];
//       dateItems.sort((a, b) => a.order - b.order);
//       lines.push(...dateItems);
//     });

//     lines.sort((a, b) => {
//       if (!a.date || !b.date) return 0;
//       const convertDate = (dateStr) => {
//         const parts = dateStr.split("/");
//         if (parts.length !== 3) return 0;
//         return parseInt(parts[2] + parts[1] + parts[0]);
//       };
//       return convertDate(a.date) - convertDate(b.date);
//     });

//     const accommodationTotal =
//       data.accommodation_details?.reduce(
//         (sum, d) => sum + (parseFloat(d.rate) || 0),
//         0,
//       ) || 0;
//     const otherServicesTotal =
//       data.other_services?.reduce(
//         (sum, s) => sum + (parseFloat(s.amount) || 0),
//         0,
//       ) || 0;
//     const totalFromForm = accommodationTotal + otherServicesTotal;

//     const invoiceData = {
//       guestName: inv.guest_name || "Guest",
//       persons: (inv.pax_adult || 0) + (inv.pax_child || 0),
//       roomNo: inv.room_no || "N/A",
//       referenceNo: inv.reference_no,
//       arrival: formatDate(inv.arrival_date),
//       departure: formatDate(inv.departure_date),
//       issueDate: formatDate(inv.invoice_date),
//       companyName: inv.vd || "Azar Tourism Services",
//       companyAddress: "Algeria Square Building Number 12 First Floor, Tripoli, Libya.",
//       accountNo: inv.voucher_no || "ARZ2022TOU",
//       vatNo: inv.confirmation || "",
//       invoiceNo: inv.batch_no || "NOVO-13",
//       cashier: inv.passport_no || "8250",
//       currency: "TND",
//       exchangeRate: parseFloat(inv.exchange_rate) || 2.85,
//       lines: lines,
//       netTaxable: parseFloat(inv.sub_total || totalFromForm) || 0,
//       fdsct: parseFloat(inv.vat1_10 || 0),
//       vat7Total: parseFloat(inv.vat7 || 0),
//       cityTaxTotal: parseFloat(inv.city_tax_total) || 0,
//       stampTaxTotal: stampTaxAmount,
//       grossTotal: parseFloat(inv.grand_total || inv.grossTotal || 0),
//       subTotal: totalFromForm || 0,
//       vat1_10: parseFloat(inv.vat1_10 || 0),
//       vat7: parseFloat(inv.vat7 || 0),
//       vat20: 0,
//       grandTotal: parseFloat(inv.grand_total || inv.grossTotal || 0),
//     };

//     return invoiceData;
//   };

//   const formatDate = (dateStr) => {
//     if (!dateStr) return "";
//     try {
//       const date = new Date(dateStr);
//       if (isNaN(date.getTime())) return dateStr;
//       const d = String(date.getDate()).padStart(2, "0");
//       const m = String(date.getMonth() + 1).padStart(2, "0");
//       const y = String(date.getFullYear()).slice(-2);
//       return `${d}/${m}/${y}`;
//     } catch (e) {
//       console.error("Error formatting date:", dateStr, e);
//       return dateStr;
//     }
//   };

//   useEffect(() => {
//     if (invoice?.lines) {
//       const pages = [];
//       for (let i = 0; i < invoice.lines.length; i += ROWS_PER_PAGE) {
//         pages.push({
//           lines: invoice.lines.slice(i, i + ROWS_PER_PAGE),
//           pageNum: pages.length + 1,
//           isLastPage: i + ROWS_PER_PAGE >= invoice.lines.length,
//         });
//       }
//       if (pages.length === 0) {
//         pages.push({
//           lines: [],
//           pageNum: 1,
//           isLastPage: true,
//         });
//       }
//       setPaginatedData(pages);
//     }
//   }, [invoice]);

//   const handleDownloadPDF = async () => {
//     if (!invoice) {
//       alert("Invoice data not loaded");
//       return;
//     }

//     try {
//       setPdfLoading(true);

//       const payload = {
//         invoice: {
//           referenceNo: invoice.referenceNo,
//           guestName: invoice.guestName,
//           persons: invoice.persons,
//           roomNo: invoice.roomNo,
//           arrival: invoice.arrival,
//           departure: invoice.departure,
//           issueDate: invoice.issueDate,
//           companyName: invoice.companyName,
//           companyAddress: invoice.companyAddress,
//           accountNo: invoice.accountNo,
//           vatNo: invoice.vatNo,
//           invoiceNo: invoice.invoiceNo,
//           cashier: invoice.cashier,
//           currency: invoice.currency,
//           exchangeRate: invoice.exchangeRate,
//           lines: invoice.lines,
//           netTaxable: invoice.netTaxable,
//           fdsct: invoice.fdsct,
//           vat7Total: invoice.vat7Total,
//           cityTaxTotal: invoice.cityTaxTotal,
//           stampTaxTotal: invoice.stampTaxTotal,
//           grossTotal: invoice.grossTotal,
//         },
//         paginatedData: paginatedData.map((page) => ({
//           lines: page.lines,
//           pageNum: page.pageNum,
//           isLastPage: page.isLastPage,
//         })),
//       };

//       const pdfBlob = await InvoiceApi.downloadPdf(payload);

//       if (!(pdfBlob instanceof Blob)) {
//         throw new Error("Invalid PDF response");
//       }

//       const url = window.URL.createObjectURL(pdfBlob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `${invoice.referenceNo}.pdf`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("❌ PDF Error:", error.message);
//       alert("Failed to generate PDF");
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   const totalDebit = invoice?.lines.reduce((s, l) => s + (l.debit || 0), 0) || 0;
//   const totalCredit = invoice?.lines.reduce((s, l) => s + (l.credit || 0), 0) || 0;
//   const totalUSD = (totalDebit / (invoice?.exchangeRate || 2.85) || 0).toFixed(2);
//   const totalPages = paginatedData.length;

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
//         @page {
//           size: A4;
//           margin: 0;
//         }

//         body {
//           margin: 0;
//           padding: 0;
//           font-family: Arial, sans-serif;
//         }

//         .invoice-page {
//           position: relative;
//           padding: 12px 15px 35mm 15px;
//           background: white;
//           color: #000;
//           min-height: 297mm;
//           page-break-after: always;
//           font-size: 11px;
//           box-sizing: border-box;
//         }

//         .invoice-page:last-child {
//           page-break-after: auto;
//         }

//         .stamp-logo {
//           position: absolute;
//           right: 15px;
//           bottom: 10px;
//           width: 110px;
//           z-index: 100;
//         }

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

//       {paginatedData.map((pageData, pageIdx) => (
//         <div key={pageIdx} className="invoice-page shadow-lg print:shadow-none mb-4">
//           {/* Logo */}
//           <div className="text-center mb-4">
//             <img
//               src={LOGO_URL}
//               width="220"
//               alt="Novotel"
//               className="mx-auto mt-1.5 mb-1.5 h-15.5"
//             />
//           </div>

//           {/* Header - Two columns */}
//           <div
//             className="grid grid-cols-2 gap-4 mb-4"
//             style={{ fontSize: "11px", lineHeight: "1.4" }}
//           >
//             <div>
//               <div>Name : {invoice.guestName}</div>
//               <div>Person(s) : {invoice.persons}</div>
//               <div>Room No. : {invoice.roomNo}</div>
//               <div>Arrival : {invoice.arrival}</div>
//               <div>Departure : {invoice.departure}</div>
//               <div>Novotel Tunis Lac,</div>
//               <div>The {invoice.issueDate}</div>
//             </div>
//             <div>
//               <div>Company : {invoice.companyName}</div>
//               <div>Address : {invoice.companyAddress}</div>
//               <div className="mt-1">Account NO : {invoice.accountNo}</div>
//               <div>VAT No : {invoice.vatNo}</div>
//               <div>Invoice No: {invoice.invoiceNo}</div>
//               <div>Cashier : {invoice.cashier}</div>
//               <div>
//                 Pages : {pageData.pageNum} of {totalPages}
//               </div>
//             </div>
//           </div>

//           {/* Table */}
//           <table
//             className="w-full"
//             style={{ borderCollapse: "collapse", fontSize: "11px" }}
//           >
//             <thead>
//               <tr
//                 style={{
//                   backgroundColor: "#ebebeb",
//                   borderTop: "1px solid #000",
//                   borderBottom: "1px solid #000",
//                 }}
//               >
//                 <th className="text-left p-1" style={{ width: "15%" }}>
//                   Date
//                 </th>
//                 <th className="text-left p-1" style={{ width: "55%" }}>
//                   Description
//                 </th>
//                 <th className="text-right p-1" style={{ width: "15%" }}>
//                   Debits
//                   <br />
//                   {invoice.currency}
//                 </th>
//                 <th className="text-right p-1" style={{ width: "15%" }}>
//                   Credits
//                   <br />
//                   {invoice.currency}
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {pageData.lines.length > 0 ? (
//                 pageData.lines.map((line, i) => (
//                   <tr key={i}>
//                     <td className="p-1">{line.date}</td>
//                     <td className="p-1">{line.description}</td>
//                     <td className="text-right p-1">
//                       {Number(line.debit).toFixed(3)}
//                     </td>
//                     <td className="text-right p-1">
//                       {Number(line.credit).toFixed(3)}
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={4} className="text-center p-2">
//                     No invoice items found
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>

//           {/* Footer - Only on last page */}
//           {pageData.isLastPage && (
//             <div className="mt-6" style={{ fontSize: "10px" }}>
//               <div style={{ borderTop: "1px solid #000", paddingTop: "8px" }}>
//                 <div className="grid grid-cols-2 gap-4">
//                   {/* Left - USD */}
//                   <div
//                     style={{
//                       display: "flex",
//                       flexDirection: "column",
//                       justifyContent: "end",
//                     }}
//                   >
//                     <div
//                       className="flex justify-between"
//                       style={{ maxWidth: "200px" }}
//                     >
//                       <span>USD Exch. Rate:</span>
//                       <span>
//                         {(invoice.exchangeRate || 2.85).toFixed(2)}{" "}
//                         {invoice.currency}
//                       </span>
//                     </div>
//                     <div
//                       className="flex justify-between"
//                       style={{ maxWidth: "200px" }}
//                     >
//                       <span>Total in USD:</span>
//                       <span>{totalUSD} USD</span>
//                     </div>
//                   </div>

//                   {/* Right - Totals and taxes */}
//                   <div>
//                     <div className="flex justify-between border-b border-black pb-1 mb-1">
//                       <span style={{ marginLeft: "auto", marginRight: "80px" }}>
//                         Total
//                       </span>
//                       <span className="text-right" style={{ width: "80px" }}>
//                         {totalDebit.toFixed(3)}
//                       </span>
//                       <span className="text-right" style={{ width: "80px" }}>
//                         {totalCredit.toFixed(3)}
//                       </span>
//                     </div>
//                     <div className="flex justify-between mb-3">
//                       <span style={{ marginLeft: "auto", marginRight: "80px" }}>
//                         Balance
//                       </span>
//                       <span className="text-center" style={{ width: "160px" }}>
//                         {totalDebit.toFixed(3)} {invoice.currency}
//                       </span>
//                     </div>

//                     <div className="text-right" style={{ lineHeight: "1.6" }}>
//                       <div className="flex justify-between">
//                         <span>Net Taxable</span>
//                         <span>
//                           {Number(invoice.netTaxable || 0).toFixed(3)}{" "}
//                           {invoice.currency}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>FDCST 1 %</span>
//                         <span>
//                           {Number(invoice.fdsct || 0).toFixed(3)}{" "}
//                           {invoice.currency}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>VAT 7%</span>
//                         <span>
//                           {Number(invoice.vat7Total || 0).toFixed(3)}{" "}
//                           {invoice.currency}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>VAT 19%</span>
//                         <span>0.000 {invoice.currency}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>City Tax</span>
//                         <span>
//                           {Number(invoice.cityTaxTotal || 0).toFixed(3)}{" "}
//                           {invoice.currency}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Stamp Tax</span>
//                         <span>
//                           {Number(invoice.stampTaxTotal || 0).toFixed(3)}{" "}
//                           {invoice.currency}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Non Revenue</span>
//                         <span>0.000 {invoice.currency}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Paid Out</span>
//                         <span>0.000 {invoice.currency}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Total Gross</span>
//                         <span>
//                           {Number(invoice.grossTotal || 0).toFixed(3)}{" "}
//                           {invoice.currency}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Stamp logo - bottom-right corner on EVERY page */}
//           <img
//             src={STAMP_URL}
//             alt="Novotel Stamp"
//             className="stamp-logo h-15 mb-1.5 print-stamp"
//           />
//         </div>
//       ))}
//     </InvoiceTemplate>
//   );
// }

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { InvoiceTemplate } from "../../components";
import InvoiceApi from "../../Api/invoice.api";
import html2pdf from "html2pdf.js";

export default function NovotelInvoiceView({ invoiceData }) {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(!invoiceData);
    const [error, setError] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [paginatedData, setPaginatedData] = useState([]);
    const invoiceRef = useRef(null);

    const { invoiceNumber } = useParams();
    const navigate = useNavigate();
    const invoiceId = invoiceNumber;

    const LOGO_URL = "/novotel_logo.png";
    const STAMP_URL = "/novotel_stemp.png";
    const ROWS_PER_PAGE = 24;

    useEffect(() => {
        if (invoiceData) {
            const transformed = transformApiData(invoiceData);
            setInvoice(transformed);
            setLoading(false);
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

            const response = await InvoiceApi.getCompleteInvoice(invoiceId);
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

    const transformApiData = (data) => {
        const inv = data.invoice || {};
        const lines = [];

        const firstNightDate =
            data.accommodation_details?.[0]?.date ||
            inv.invoice_date ||
            inv.arrival_date;
        const stampTaxAmount = parseFloat(inv.stamp_tax_total) || 0;

        const itemsByDate = {};

        // Process accommodation details
        data.accommodation_details?.forEach((d) => {
            const date = d.date || inv.arrival_date;
            if (!itemsByDate[date]) itemsByDate[date] = [];

            itemsByDate[date].push({
                date: formatDate(date),
                description: d.description || "Hébergement",
                debit: parseFloat(d.rate) || 0,
                credit: 0,
                order: 1,
            });
        });

        // Process city tax details
        data.city_tax_details?.forEach((d) => {
            const date = d.date || inv.arrival_date;
            if (!itemsByDate[date]) itemsByDate[date] = [];

            itemsByDate[date].push({
                date: formatDate(date),
                description: d.description || "Taxe de séjour",
                debit: parseFloat(d.amount) || 0,
                credit: 0,
                order: 2,
            });
        });

        // Add stamp tax ONLY on the first night's date
        if (stampTaxAmount > 0 && firstNightDate) {
            if (!itemsByDate[firstNightDate]) itemsByDate[firstNightDate] = [];

            itemsByDate[firstNightDate].push({
                date: formatDate(firstNightDate),
                description: "Droit de timbre",
                debit: stampTaxAmount,
                credit: 0,
                order: 3,
            });
        }

        // Process other services
        data.other_services?.forEach((s) => {
            const serviceDate = s.date || inv.invoice_date;
            if (!itemsByDate[serviceDate]) itemsByDate[serviceDate] = [];

            itemsByDate[serviceDate].push({
                date: formatDate(serviceDate),
                description: s.name || "Service",
                debit: parseFloat(s.amount) || 0,
                credit: 0,
                order: 4,
            });
        });

        // Flatten and sort
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

        const accommodationTotal =
            data.accommodation_details?.reduce(
                (sum, d) => sum + (parseFloat(d.rate) || 0),
                0,
            ) || 0;
        const otherServicesTotal =
            data.other_services?.reduce(
                (sum, s) => sum + (parseFloat(s.amount) || 0),
                0,
            ) || 0;
        const totalFromForm = accommodationTotal + otherServicesTotal;

        const invoiceData = {
            guestName: inv.guest_name || "Guest",
            persons: (inv.pax_adult || 0) + (inv.pax_child || 0),
            roomNo: inv.room_no || "N/A",
            referenceNo: inv.reference_no,
            arrival: formatDate(inv.arrival_date),
            departure: formatDate(inv.departure_date),
            issueDate: formatDate(inv.invoice_date),
            companyName: inv.vd || "Azar Tourism Services",
            companyAddress: "Algeria Square Building Number 12 First Floor, Tripoli, Libya.",
            accountNo: inv.voucher_no || "ARZ2022TOU",
            vatNo: inv.confirmation || "",
            invoiceNo: inv.batch_no || "NOVO-13",
            cashier: inv.passport_no || "8250",
            currency: "TND",
            exchangeRate: parseFloat(inv.exchange_rate) || 2.85,
            lines: lines,
            netTaxable: parseFloat(inv.sub_total || totalFromForm) || 0,
            fdsct: parseFloat(inv.vat1_10 || 0),
            vat7Total: parseFloat(inv.vat7 || 0),
            cityTaxTotal: parseFloat(inv.city_tax_total) || 0,
            stampTaxTotal: stampTaxAmount,
            grossTotal: parseFloat(inv.grand_total || inv.grossTotal || 0),
            subTotal: totalFromForm || 0,
            vat1_10: parseFloat(inv.vat1_10 || 0),
            vat7: parseFloat(inv.vat7 || 0),
            vat20: 0,
            grandTotal: parseFloat(inv.grand_total || inv.grossTotal || 0),
        };

        return invoiceData;
    };

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
                pages.push({
                    lines: [],
                    pageNum: 1,
                    isLastPage: true,
                });
            }
            setPaginatedData(pages);
        }
    }, [invoice]);

    const handleDownloadPDF = async () => {
        if (!invoiceRef.current) return;

        const element = invoiceRef.current;
        const originalStyles = [];
        const head = document.head;
        const styleLinks = head.querySelectorAll('link[rel="stylesheet"], style');

        try {
            setPdfLoading(true);

            // 1. Style Guard (Tailwind v4 Bypass)
            styleLinks.forEach((link) => {
                originalStyles.push({
                    parent: head,
                    element: link,
                    nextSibling: link.nextSibling,
                });
                link.remove();
            });

            // 2. Image Loading Verification
            const images = element.querySelectorAll("img");
            await Promise.all(
                Array.from(images).map((img) => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                }),
            );

            // 3. Smart Pagination (PDF Options)
            const opt = {
                margin: 0,
                filename: `${invoice.referenceNo || "Invoice"}.pdf`,
                image: { type: "jpeg", quality: 3 },
                html2canvas: {
                    scale: 4,
                    useCORS: true,
                    letterRendering: true,
                    backgroundColor: "#ffffff",
                },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                pagebreak: { mode: ["css", "legacy"] },
            };

            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("❌ PDF Error:", error.message);
            alert("Failed to generate PDF");
        } finally {
            // 4. Instant Recovery (Styles Restore)
            originalStyles.forEach((item) => {
                item.parent.insertBefore(item.element, item.nextSibling);
            });
            setPdfLoading(false);
        }
    };

    const handlePrint = () => window.print();

    const totalDebit = invoice?.lines.reduce((s, l) => s + (l.debit || 0), 0) || 0;
    const totalCredit = invoice?.lines.reduce((s, l) => s + (l.credit || 0), 0) || 0;
    const totalUSD = (totalDebit / (invoice?.exchangeRate || 2.85) || 0).toFixed(2);
    const totalPages = paginatedData.length;

    // Early return if invoice is null - InvoiceTemplate will handle the loading/error states
    if (!invoice) {
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
          height: 296.5mm; /* Exact A4 height to prevent blank pages */
          width: 210mm;
          margin: 0 auto;
          page-break-after: always;
          font-size: 11px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .invoice-page:last-child {
          page-break-after: avoid;
        }

        .stamp-logo {
          position: absolute;
          right: 15px;
          bottom: 10px;
          width: 110px;
          z-index: 100;
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

            <div ref={invoiceRef}>
                {paginatedData.map((pageData, pageIdx) => (
                    <div key={pageIdx} className="invoice-page shadow-lg print:shadow-none mb-4">
                        {/* Logo */}
                        <div className="text-center mb-4">
                            <img
                                src={LOGO_URL}
                                width="220"
                                alt="Novotel"
                                className="mx-auto mt-1.5 mb-1.5 h-15.5"
                            />
                        </div>

                        {/* Header - Two columns */}
                        <div
                            className="grid grid-cols-2 gap-4 mb-4"
                            style={{ fontSize: "11px", lineHeight: "1.4" }}
                        >
                            <div>
                                <div>Name : {invoice.guestName}</div>
                                <div>Person(s) : {invoice.persons}</div>
                                <div>Room No. : {invoice.roomNo}</div>
                                <div>Arrival : {invoice.arrival}</div>
                                <div>Departure : {invoice.departure}</div>
                                <div>Novotel Tunis Lac,</div>
                                <div>The {invoice.issueDate}</div>
                            </div>
                            <div>
                                <div>Company : {invoice.companyName}</div>
                                <div>Address : {invoice.companyAddress}</div>
                                <div className="mt-1">Account NO : {invoice.accountNo}</div>
                                <div>VAT No : {invoice.vatNo}</div>
                                <div>Invoice No: {invoice.invoiceNo}</div>
                                <div>Cashier : {invoice.cashier}</div>
                                <div>
                                    Pages : {pageData.pageNum} of {totalPages}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <table
                            className="w-full"
                            style={{ borderCollapse: "collapse", fontSize: "11px" }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        backgroundColor: "#ebebeb",
                                        borderTop: "1px solid #000",
                                        borderBottom: "1px solid #000",
                                    }}
                                >
                                    <th className="text-left p-1" style={{ width: "15%" }}>
                                        Date
                                    </th>
                                    <th className="text-left p-1" style={{ width: "55%" }}>
                                        Description
                                    </th>
                                    <th className="text-right p-1" style={{ width: "15%" }}>
                                        Debits
                                        <br />
                                        {invoice.currency}
                                    </th>
                                    <th className="text-right p-1" style={{ width: "15%" }}>
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
                                            <td className="p-1">{line.date}</td>
                                            <td className="p-1">{line.description}</td>
                                            <td className="text-right p-1">
                                                {Number(line.debit).toFixed(3)}
                                            </td>
                                            <td className="text-right p-1">
                                                {Number(line.credit).toFixed(3)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center p-2">
                                            No invoice items found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Footer - Only on last page */}
                        {pageData.isLastPage && (
                            <div className="mt-6" style={{ fontSize: "10px" }}>
                                <div style={{ borderTop: "1px solid #000", paddingTop: "8px" }}>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Left - USD */}
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "end",
                                            }}
                                        >
                                            <div
                                                className="flex justify-between"
                                                style={{ maxWidth: "200px" }}
                                            >
                                                <span>USD Exch. Rate:</span>
                                                <span>
                                                    {(invoice.exchangeRate || 2.85).toFixed(2)}{" "}
                                                    {invoice.currency}
                                                </span>
                                            </div>
                                            <div
                                                className="flex justify-between"
                                                style={{ maxWidth: "200px" }}
                                            >
                                                <span>Total in USD:</span>
                                                <span>{totalUSD} USD</span>
                                            </div>
                                        </div>

                                        {/* Right - Totals and taxes */}
                                        <div>
                                            <div className="flex justify-between border-b border-black pb-1 mb-1">
                                                <span style={{ marginLeft: "auto", marginRight: "80px" }}>
                                                    Total
                                                </span>
                                                <span className="text-right" style={{ width: "80px" }}>
                                                    {totalDebit.toFixed(3)}
                                                </span>
                                                <span className="text-right" style={{ width: "80px" }}>
                                                    {totalCredit.toFixed(3)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between mb-3">
                                                <span style={{ marginLeft: "auto", marginRight: "80px" }}>
                                                    Balance
                                                </span>
                                                <span className="text-center" style={{ width: "160px" }}>
                                                    {totalDebit.toFixed(3)} {invoice.currency}
                                                </span>
                                            </div>

                                            <div className="text-right" style={{ lineHeight: "1.6" }}>
                                                <div className="flex justify-between">
                                                    <span>Net Taxable</span>
                                                    <span>
                                                        {Number(invoice.netTaxable || 0).toFixed(3)}{" "}
                                                        {invoice.currency}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>FDCST 1 %</span>
                                                    <span>
                                                        {Number(invoice.fdsct || 0).toFixed(3)}{" "}
                                                        {invoice.currency}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>VAT 7%</span>
                                                    <span>
                                                        {Number(invoice.vat7Total || 0).toFixed(3)}{" "}
                                                        {invoice.currency}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>VAT 19%</span>
                                                    <span>0.000 {invoice.currency}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>City Tax</span>
                                                    <span>
                                                        {Number(invoice.cityTaxTotal || 0).toFixed(3)}{" "}
                                                        {invoice.currency}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Stamp Tax</span>
                                                    <span>
                                                        {Number(invoice.stampTaxTotal || 0).toFixed(3)}{" "}
                                                        {invoice.currency}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Non Revenue</span>
                                                    <span>0.000 {invoice.currency}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Paid Out</span>
                                                    <span>0.000 {invoice.currency}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Total Gross</span>
                                                    <span>
                                                        {Number(invoice.grossTotal || 0).toFixed(3)}{" "}
                                                        {invoice.currency}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stamp logo - bottom-right corner on EVERY page */}
                        <img
                            src={STAMP_URL}
                            alt="Novotel Stamp"
                            className="stamp-logo h-15 mb-1.5 print-stamp"
                        />
                    </div>
                ))}
            </div>
        </InvoiceTemplate>
    );
}



