// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from "react-router-dom";
// import logo from '../../../public/grandaras-logo.png';
// import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
// import toast from "react-hot-toast";
// import {InvoiceTemplate} from "../../components";

// const GrandArasInvoiceView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const navigate = useNavigate();
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);

//   useEffect(() => {
//     if (invoiceData) {
//       console.log("✅ Using invoiceData prop:", invoiceData);
//       const transformed = transformInvoiceData(invoiceData);
//       console.log("✅ Transformed Grand Aras data:", transformed);
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
//       const response = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      
//       let data = response.data || response;
      
//       if (data.data && typeof data.data === 'object') {
//         data = data.data;
//         if (data.data && typeof data.data === 'object') {
//           data = data.data;
//         }
//       }
      
//       const transformed = transformInvoiceData(data);
//       setInvoice(transformed);
//     } catch (err) {
//       console.error("❌ Error fetching invoice:", err);
//       setError(err.message || "Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const transformInvoiceData = (data) => {
//     console.log("🔄 Transforming Grand Aras data:", data);
    
//     if (!data) {
//       console.error("❌ No data to transform");
//       return null;
//     }

//     const accommodationDetails = data.accommodationDetails || [];
//     const otherServices = data.otherServices || [];
    
//     const transactions = [];
    
//     // Add deposit transfer first if exists
//     const totalIncVat = parseFloat(data.grandTotal || 0);
//     if (totalIncVat > 0) {
//       transactions.push({
//         id: transactions.length + 1,
//         description: "Deposit Transfer at C/IN",
//         rate: "",
//         date: formatDate(data.arrivalDate),
//         debit: null,
//         credit: totalIncVat
//       });
//     }
    
//     // Build transactions from accommodation details
//     accommodationDetails.forEach((acc) => {
//       transactions.push({
//         id: transactions.length + 1,
//         description: "Room",
//         rate: `${(data.actualRate || 0).toFixed(2)} EUR / ${(data.exchangeRate || 0).toFixed(5)}`,
//         date: formatDate(acc.date),
//         debit: acc.rate || 0,
//         credit: null
//       });
//     });
    
//     // Add other services
//     otherServices.forEach(service => {
//       transactions.push({
//         id: transactions.length + 1,
//         description: service.name || "Service",
//         rate: "",
//         date: formatDate(service.date),
//         debit: service.amount || 0,
//         credit: null
//       });
//     });

//     const totalAmount = parseFloat(data.subTotal || 0);
//     const totalVAT = parseFloat(data.vatTotal || 0);
//     const totalAccTax = (parseFloat(data.sellingRate || 0) * 0.02) * (data.nights || 0);
//     const totalEuro = (data.actualRate || 0) * (data.nights || 0);

//     return {
//       meta: {
//         folio: data.voucherNo || "",
//         date: formatDate(data.invoiceDate),
//         vatOffice: "",
//         vatNo: "2222222222",
//         company: {
//           name: "AZAR TOURISM",
//           subName: "Azar Tourism Services",
//           addressLine1: "Algeria Square Building Number 12 First Floor, Tripoli, Libya, P.O.BOX Number: 1254",
//           addressLine2: "Tripoli Libya,",
//           addressLine3: "Tripoli, Libyan Arab Jamahiriya"
//         },
//         hotel: {
//           logoUrl: logo
//         }
//       },
//       guest: {
//         name: data.guestName || "Guest",
//         room: data.roomNo || "",
//         arrival: formatDate(data.arrivalDate),
//         departure: formatDate(data.departureDate),
//         adults: data.paxAdult || 1,
//         children: data.paxChild || 0,
//         passport: data.passportNo || "",
//         user: data.userId || "",
//         cashierNo: data.batchNo || "1"
//       },
//       transactions: transactions,
//       totals: {
//         taxRate: "%10",
//         taxBase: totalAmount,
//         taxAmount: totalVAT,
//         exchangeRates: {
//           usd: 35.2892,
//           eur: data.exchangeRate || 0
//         },
//         totalEuro: totalEuro,
//         textAmount: numberToTurkishWords(totalIncVat),
//         summary: {
//           totalAmount: totalAmount,
//           taxableAmount: totalAmount,
//           totalVat: totalVAT,
//           accTax: totalAccTax,
//           totalIncVat: totalIncVat,
//           deposit: -totalIncVat,
//           balance: 0.00
//         }
//       }
//     };
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "";
//     try {
//       const date = new Date(dateString);
//       const day = String(date.getDate()).padStart(2, '0');
//       const month = String(date.getMonth() + 1).padStart(2, '0');
//       const year = String(date.getFullYear()).slice(-2);
//       return `${day}.${month}.${year}`;
//     } catch {
//       return dateString;
//     }
//   };

//   const numberToTurkishWords = (amount) => {
//     const rounded = Math.round(amount * 100) / 100;
//     const lira = Math.floor(rounded);
//     const kurus = Math.round((rounded - lira) * 100);
    
//     return `Yalnız ${lira.toLocaleString('tr-TR')} Türk Lirası ${kurus} Kuruştur`;
//   };

//   const handleDownloadPDF = async () => {
//     setPdfLoading(true);
//     try {
//       await new Promise(resolve => setTimeout(resolve, 1000));
//       toast.success("PDF download feature coming soon!");
//     } catch (error) {
//       toast.error("Failed to generate PDF");
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   // Early return if invoice is null - InvoiceTemplate will handle the loading/error states
//   if (!invoice) {
//     return (
//       <InvoiceTemplate
//         loading={loading}
//         error={error}
//         invoice={invoice}
//         pdfLoading={pdfLoading}
//         onDownloadPDF={handleDownloadPDF}
//         onPrint={handlePrint}
//         onBack={() => navigate("/invoices")}
//       >
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

//         .grandaras-invoice {
//           background-color: white;
//           width: 100%;
//           max-width: 850px;
//           margin: 0 auto;
//           padding: 40px 50px;
//           font-size: 11px;
//           color: #000;
//           box-shadow: 0 0 10px rgba(0,0,0,0.1);
//         }

//         .header-section {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 40px;
//         }

//         .company-details {
//         display: flex;
//         flex-direction: column;
//         justify-content: center;
//           width: 60%;
//           line-height: 1.3;
//         }

//         .company-name {
//           font-weight: normal;
//           font-size: 12px;
//           text-transform: uppercase;
//         }

//         .company-sub {
//           font-size: 11px;
//         }

//         .logo-container {
//           text-align: right;
//           width: 30%;
//         }

//         .logo-img {
//           max-width: 125px;
//           height: auto;
//         }

//         .meta-row {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 5px;
//           font-size: 11px;
//         }

//         .guest-name {
//           margin-top: 4px;
//           margin-bottom: 3px;
//           font-size: 12px;
//         }

//         .info-grid {
//           display: grid;
//           grid-template-columns: 0.8fr 1.2fr 1fr 1.8fr 1.2fr;
//           gap: 2px 10px;
//           margin-bottom: 10px;
//           font-size: 11px;
//         }

//         .grid-item {
//           white-space: nowrap;
//         }

//         .main-table {
//           width: 100%;
//           border-collapse: collapse;
//           margin-bottom: 20px;
//           border: 1px solid #000;
//         }

//         .main-table thead tr {
//           background-color: #f0f0f0;
//           border-bottom: 1px solid #000;
//         }

//         .main-table th {
//           text-align: left;
//           padding: 4px 6px;
//           font-weight: normal;
//           font-size: 11px;
//         }

//         .main-table td {
//           padding: 4px 6px;
//           vertical-align: top;
//           font-size: 11px;
//         }

//         .col-desc { width: 50%; }
//         .col-date { width: 15%; }
//         .col-debit { width: 15%; text-align: right; }
//         .col-credit { width: 15%; text-align: right; }

//         .desc-with-rate {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }

//         .rate-value {
//           padding-right: 20px;
//         }

//         .text-right {
//           text-align: right;
//         }

//         .footer-section {
//           display: flex;
//           justify-content: space-between;
//           margin-top: 20px;
//         }

//         .footer-left {
//           width: 45%;
//         }

//         .footer-right {
//           width: 45%;
//           text-align: right;
//         }

//         .tax-table {
//           width: 90%;
//           border-collapse: collapse;
//           margin-bottom: 15px;
//           font-size: 10px;
//         }

//         .tax-table th {
//           background-color: #f0f0f0;
//           text-align: center;
//           padding: 3px;
//           font-weight: normal;
//         }

//         .tax-table td {
//           text-align: center;
//           padding: 3px;
//         }

//         .exchange-info {
//           line-height: 1.4;
//           margin-bottom: 15px;
//           font-size: 11px;
//         }

        

//         .totals-row {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 3px;
//           font-size: 11px;
//         }

//         .payment-header {
//           margin-top: 15px;
//           margin-bottom: 3px;
//           text-align: left;
//         }

//         .balance-row {
//           margin-top: 15px;
//           font-weight: bold;
//         }

//         @media print {
//           body {
//             background-color: white;
//             margin: 0;
//           }

//           .grandaras-invoice {
//             width: 100%;
//             margin: 0;
//             padding: 20px;
//             box-shadow: none;
//           }

//           .main-table thead tr {
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }

//           .tax-table th {
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }
//         }
//       `}</style>

//       <div className="grandaras-invoice">
//         <div className="header-section">
//           <div className="company-details">
//            <div className="company-sub">Azar Tourism</div>
//             <div>Algeria Square Building Number 12 First Floor, Tripoli, Libya.</div>
//           </div>
//           <div className="logo-container">
//             <img src={invoice.meta.hotel.logoUrl} alt="Grand Aras Hotel" className="logo-img" />
//           </div>
//         </div>

//         <div className="meta-row">
//           <div>V.D. &nbsp; : &nbsp; {invoice.meta.vatOffice}</div>
//           <div>Date/Tarih : &nbsp; {invoice.meta.date}</div>
//         </div>
//         <div className="meta-row">
//           <div>V. NO : &nbsp; {invoice.meta.vatNo}</div>
//           <div></div>
//         </div>

//         <div className="guest-name">{invoice.guest.name}</div>

//         <div className="info-grid">
//           <div className="grid-item">Room/Oda : {invoice.guest.room}</div>
//           <div className="grid-item">Arrival/Giriş &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {invoice.guest.arrival}</div>
//           <div className="grid-item">Adult/Yetişkin : {invoice.guest.adults}</div>
//           <div className="grid-item">Passport No - TC No : {invoice.guest.passport}</div>
//           <div className="grid-item">User/Kullanıcı &nbsp;&nbsp;&nbsp;: {invoice.guest.user}</div>

//           <div className="grid-item">Folio No &nbsp;&nbsp;: {invoice.meta.folio}</div>
//           <div className="grid-item">Departure/Çıkış &nbsp;&nbsp;: {invoice.guest.departure}</div>
//           <div className="grid-item">Child/Çocuk &nbsp;&nbsp;&nbsp;: {invoice.guest.children}</div>
//           <div className="grid-item">Crs No/Voucher No &nbsp;:</div>
//           <div className="grid-item">Csh No/Kasa No : {invoice.guest.cashierNo}</div>

//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item">Page/Sayfa &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: 1</div>
//         </div>

//         <table className="main-table">
//           <thead>
//             <tr>
//               <th className="col-desc">Açıklama/Description</th>
//               <th className="col-date">Date/Tarih</th>
//               <th className="col-debit">Debit/Borç</th>
//               <th className="col-credit">Credit/Alacak</th>
//             </tr>
//           </thead>
//           <tbody>
//             {invoice.transactions.map((txn) => (
//               <tr key={txn.id}>
//                 <td>
//                   {txn.rate ? (
//                     <div className="desc-with-rate">
//                       <span>{txn.description}</span>
//                       <span className="rate-value">{txn.rate}</span>
//                     </div>
//                   ) : (
//                     txn.description
//                   )}
//                 </td>
//                 <td>{txn.date}</td>
//                 <td className="text-right">
//                   {txn.debit ? txn.debit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
//                 </td>
//                 <td className="text-right">
//                   {txn.credit ? txn.credit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         <div className="footer-section">
//           <div className="footer-left">
//             <table className="tax-table">
//               <thead>
//                 <tr>
//                   <th>Tax Rate<br/>KDV Oranı</th>
//                   <th>Tax Base<br/>KDV Matrahı</th>
//                   <th>Tax Amount<br/>KDV Tutarı</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                   <td>{invoice.totals.taxRate}</td>
//                   <td>{invoice.totals.taxBase.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
//                   <td>{invoice.totals.taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
//                 </tr>
//               </tbody>
//             </table>

//             <div className="exchange-info">
//               Room Check-in EUR Exch. Rate &nbsp;&nbsp; {invoice.totals.exchangeRates.eur.toFixed(4)} TRY<br/>
//               Total in EUR : &nbsp;&nbsp; {invoice.totals.totalEuro.toFixed(2)} EUR
//             </div>

            
//           </div>

//           <div className="footer-right">
//             <div className="totals-row">
//               <span>Total Amount/Toplam Tutar</span>
//               <span>{invoice.totals.summary.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Taxable Amount/KDV Matrahı</span>
//               <span>{invoice.totals.summary.taxableAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total VAT/Hesaplanan KDV</span>
//               <span>{invoice.totals.summary.totalVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total Acc Tax/Konaklama Vergisi</span>
//               <span>{invoice.totals.summary.accTax.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total Inc.Vat/KDV Dahil Tutar</span>
//               <span>{invoice.totals.summary.totalIncVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>

//             <div className="payment-header">Payments/Ödemeler</div>
//             <div className="totals-row">
//               <span>Deposit Transfer at C/IN</span>
//               <span>{invoice.totals.summary.deposit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>

//             <div className="totals-row balance-row">
//               <span>Balance/Bakiye</span>
//               <span>{invoice.totals.summary.balance.toFixed(2)}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default GrandArasInvoiceView;





// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from "react-router-dom";
// import logo from '../../../public/grandaras-logo.png';
// import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
// import toast from "react-hot-toast";
// import { InvoiceTemplate } from "../../components";

// const GrandArasInvoiceView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const navigate = useNavigate();
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);

//   useEffect(() => {
//     if (invoiceData) {
//       console.log("✅ Using invoiceData prop:", invoiceData);
//       const transformed = transformInvoiceData(invoiceData);
//       console.log("✅ Transformed Grand Aras data:", transformed);
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
//       const response = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      
//       let data = response.data || response;
      
//       if (data.data && typeof data.data === 'object') {
//         data = data.data;
//         if (data.data && typeof data.data === 'object') {
//           data = data.data;
//         }
//       }
      
//       const transformed = transformInvoiceData(data);
//       setInvoice(transformed);
//     } catch (err) {
//       console.error("❌ Error fetching invoice:", err);
//       setError(err.message || "Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const transformInvoiceData = (data) => {
//     console.log("🔄 Transforming Grand Aras data:", data);
    
//     if (!data) {
//       console.error("❌ No data to transform");
//       return null;
//     }

//     const accommodationDetails = data.accommodationDetails || [];
//     const otherServices = data.otherServices || [];
    
//     const transactions = [];
    
//     // NO Deposit row anymore - removed as requested
    
//     // Room charges
//     accommodationDetails.forEach((acc) => {
//       transactions.push({
//         id: transactions.length + 1,
//         description: "Room",
//         rate: `${(data.actualRate || 0).toFixed(2)} EUR / ${(data.exchangeRate || 0).toFixed(5)}`,
//         date: formatDate(acc.date || data.arrivalDate),
//         debit: acc.rate || 0,
//         credit: null
//       });
//     });
    
//     // Other services
//     otherServices.forEach(service => {
//       transactions.push({
//         id: transactions.length + 1,
//         description: service.name || service.service_name || "Service",
//         rate: "",
//         date: formatDate(service.date || service.service_date),
//         debit: service.amount || service.gross_amount || 0,
//         credit: null
//       });
//     });

//     // ────────────────────────────────────────────────
//     // FIXED CALCULATIONS - match edit form
//     // ────────────────────────────────────────────────

//     // d = room taxable base
//     const d = parseFloat(
//       data.taxable_amount_room ||
//       data.taxableAmountRoom ||
//       0
//     );

//     // e = sum of services taxable
//     const e = otherServices.reduce((sum, s) => sum + parseFloat(s.taxable_amount || 0), 0);

//     // f = d + e (taxable total) - this will now appear
//     const f = d + e;

//     // g = room VAT 10%
//     const g = parseFloat(data.vat_10_percent || data.vatTotal || 0);

//     // h = services VAT 20%
//     const h = otherServices.reduce((sum, s) => sum + parseFloat(s.vat_20_percent || 0), 0);

//     // i = total VAT = g + h
//     const i = g + h;

//     // j = acc tax = d * 0.02
//     const j = Number((d * 0.02).toFixed(2));

//     // k = total inc VAT = f + i + j
//     const k = f + i + j;

//     // exchange rate
//     const exchangeRate = parseFloat(data.exchangeRate || data.exchange_rate || 0);

//     // m = total in EUR = k / exchangeRate
//     const m = (exchangeRate > 0) ? Number((k / exchangeRate).toFixed(2)) : 0;

//     return {
//       meta: {
//         folio: data.voucherNo || data.folio_number || "",
//         date: formatDate(data.invoiceDate || data.invoice_date),
//         vatOffice: "",
//         vatNo: "2222222222",
//         company: {
//           name: "AZAR TOURISM",
//           subName: "Azar Tourism Services",
//           addressLine1: "Algeria Square Building Number 12 First Floor, Tripoli, Libya, P.O.BOX Number: 1254",
//           addressLine2: "Tripoli Libya,",
//           addressLine3: "Tripoli, Libyan Arab Jamahiriya"
//         },
//         hotel: {
//           logoUrl: logo
//         }
//       },
//       guest: {
//         name: data.guestName || "Guest",
//         room: data.roomNo || "",
//         arrival: formatDate(data.arrivalDate),
//         departure: formatDate(data.departureDate),
//         adults: data.paxAdult || 1,
//         children: data.paxChild || 0,
//         passport: data.passportNo || "",
//         user: data.userId || "",
//         cashierNo: data.batchNo || "1"
//       },
//       transactions,
//       totals: {
//         taxTable: [
//           {
//             rate: "%10",
//             base: d,
//             amount: g
//           },
//           ...(otherServices.length > 0 ? [{
//             rate: "%20",
//             base: e,
//             amount: h
//           }] : [])
//         ],
//         exchangeRates: {
//           usd: 35.2892,
//           eur: exchangeRate
//         },
//         totalEuro: m,
//         textAmount: numberToTurkishWords(k),
//         summary: {
//           totalAmount: k,
//           taxableAmount: f,           // now appears correctly
//           totalVat: i,
//           accTax: j,
//           totalIncVat: k,
//           deposit: -k,
//           balance: 0.00
//         }
//       }
//     };
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "";
//     try {
//       const date = new Date(dateString);
//       const day = String(date.getDate()).padStart(2, '0');
//       const month = String(date.getMonth() + 1).padStart(2, '0');
//       const year = String(date.getFullYear()).slice(-2);
//       return `${day}.${month}.${year}`;
//     } catch {
//       return dateString;
//     }
//   };

//   const numberToTurkishWords = (amount) => {
//     const rounded = Math.round(amount * 100) / 100;
//     const lira = Math.floor(rounded);
//     const kurus = Math.round((rounded - lira) * 100);
    
//     return `Yalnız ${lira.toLocaleString('tr-TR')} Türk Lirası ${kurus} Kuruştur`;
//   };

//   const handleDownloadPDF = async () => {
//     setPdfLoading(true);
//     try {
//       await new Promise(resolve => setTimeout(resolve, 1000));
//       toast.success("PDF download feature coming soon!");
//     } catch (error) {
//       toast.error("Failed to generate PDF");
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   if (!invoice) {
//     return (
//       <InvoiceTemplate
//         loading={loading}
//         error={error}
//         invoice={invoice}
//         pdfLoading={pdfLoading}
//         onDownloadPDF={handleDownloadPDF}
//         onPrint={handlePrint}
//         onBack={() => navigate("/invoices")}
//       >
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

//         .grandaras-invoice {
//           background-color: white;
//           width: 100%;
//           max-width: 850px;
//           margin: 0 auto;
//           padding: 40px 50px;
//           font-size: 11px;
//           color: #000;
//           box-shadow: 0 0 10px rgba(0,0,0,0.1);
//         }

//         .header-section {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 10px;
//         }

//         .company-details {
//         display: flex;
//         flex-direction: column;
//         justify-content: center;
//           width: 60%;
//           line-height: 1.3;
//         }

//         .company-name {
//           font-weight: normal;
//           font-size: 12px;
//           text-transform: uppercase;
//         }

//         .company-sub {
//           font-size: 11px;
//         }

//         .logo-container {
//           text-align: right;
//           width: 30%;
//         }

//         .logo-img {
//           max-width: 125px;
//           height: auto;
//         }

//         .meta-row {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 5px;
//           font-size: 11px;
//         }

//         .guest-name {
//           margin-top: 4px;
//           margin-bottom: 3px;
//           font-size: 12px;
//         }

//         .info-grid {
//           display: grid;
//           grid-template-columns: 0.8fr 1.2fr 1fr 1.8fr 1.2fr;
//           gap: 2px 10px;
//           margin-bottom: 2px;
//           font-size: 11px;
//         }

//         .grid-item {
//           white-space: nowrap;
//         }

//         .main-table {
//           width: 100%;
//           border-collapse: collapse;
//           margin-bottom: 20px;
//           border: 1px solid #000;
//         }

//         .main-table thead tr {
//           background-color: #f0f0f0;
//           border-bottom: 1px solid #000;
//         }

//         .main-table th {
//           text-align: left;
//           padding: 4px 6px;
//           font-weight: normal;
//           font-size: 11px;
//         }

//         .main-table td {
//           padding: 4px 6px;
//           vertical-align: top;
//           font-size: 11px;
//         }

//         .col-desc { width: 62%; }
//         .col-date { width: 15%; }
//        .col-debit {
   
//     margin-right: 125px;
//     text-align: left;
//     justify-content: end;
//     padding-right: 20px; /* Yahan apni required padding dein */
// }
//         .col-credit { 
//         display:flex;
//         justify-content:end;
         
//         text-align: right;
//          }

//         .desc-with-rate {
//           display: flex;
//          column-gap:182px;
//           align-items: center;
//         }

//         .rate-value {
//           padding-right: 20px;
//         }

//         .text-right {
//           text-align: right;
//         }

//         .footer-section {
//           display: flex;
//           justify-content: space-between;
//           margin-top: 20px;
//         }

//         .footer-left {
//           width: 45%;
//         }

//         .footer-right {
//           width: 45%;
//           text-align: right;
//           margin-top:-10px;
//         }

//         .tax-table {
//           width: 90%;
//           border-collapse: collapse;
//           margin-bottom: 15px;
//           font-size: 10px;
//           margin-top:-10px;
//         }

//         .tax-table th {
//           background-color: #f0f0f0;
//           text-align: center;
//           font-weight: normal;
//         }

//         .tax-table td {
//           text-align: center;
          
//         }

//         .exchange-info {
//           line-height: 1.4;
//           margin-bottom: 15px;
//           font-size: 11px;
//         }

//         .totals-row {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 3px;
//           font-size: 11px;
//         }

//         .payment-header {
//           margin-top: 15px;
//           margin-bottom: 3px;
//           text-align: left;
//         }

//         .balance-row {
//           margin-top: 15px;
//           font-weight: bold;
//         }

//         @media print {
//           body {
//             background-color: white;
//             margin: 0;
//           }

//           .grandaras-invoice {
//             width: 100%;
//             margin: 0;
//             padding: 20px;
//             box-shadow: none;
//           }
//             .innercol-debit{
//             }

//           .main-table thead tr {
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }

//           .tax-table th {
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }
//         }
//       `}</style>

//       <div className="grandaras-invoice">
//         <div className="header-section">
//           <div className="company-details">
//            <div className="company-sub">Azar Tourism Services</div>
//             <div>Algeria Square Building Number 12 First Floor, Tripoli, Libya.</div>
//           </div>
//           <div className="logo-container">
//             <img src={invoice.meta.hotel.logoUrl} alt="Grand Aras Hotel" className="logo-img" />
//           </div>
//         </div>

//         <div className="meta-row">
//           <div>V.D. &nbsp; : &nbsp; {invoice.meta.vatOffice}</div>
//           <div>Date/Tarih : &nbsp; {invoice.meta.date}</div>
//         </div>
//         <div className="meta-row">
//           <div>V. NO : &nbsp; {invoice.meta.vatNo}</div>
//           <div></div>
//         </div>

//         <div className="guest-name">{invoice.guest.name}</div>

//         <div className="info-grid">
//           <div className="grid-item">Room/Oda : {invoice.guest.room}</div>
//           <div className="grid-item">Arrival/Giriş &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {invoice.guest.arrival}</div>
//           <div className="grid-item">Adult/Yetişkin : {invoice.guest.adults}</div>
//           <div className="grid-item">Passport No - TC No : {invoice.guest.passport}</div>
//           <div className="grid-item">User/Kullanıcı &nbsp;&nbsp;&nbsp;: {invoice.guest.user}</div>

//           <div className="grid-item">Folio No &nbsp;&nbsp;: {invoice.meta.folio}</div>
//           <div className="grid-item">Departure/Çıkış &nbsp;&nbsp;: {invoice.guest.departure}</div>
//           <div className="grid-item">Child/Çocuk &nbsp;&nbsp;&nbsp;: {invoice.guest.children}</div>
//           <div className="grid-item">Crs No/Voucher No &nbsp;:</div>
//           <div className="grid-item">Csh No/Kasa No : {invoice.guest.cashierNo}</div>

//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item">Page/Sayfa &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: 1</div>
//         </div>

//         <table className="main-table">
//           <thead>
//             <tr>
//               <th className="col-desc">Açıklama/Description</th>
//               <th className="col-date">Date/Tarih</th>
//               <th className="col-debit"><span className='innercol-debit'>Debit/Borç</span></th>
//               <th className="col-credit">Credit/Alacak</th>
//             </tr>
//           </thead>
//           <tbody>
//             {invoice.transactions.map((txn) => (
//               <tr key={txn.id}>
//                 <td>
//                   {txn.rate ? (
//                     <div className="desc-with-rate">
//                       <span>{txn.description}</span>
//                       <span className="rate-value">{txn.rate}</span>
//                     </div>
//                   ) : (
//                     txn.description
//                   )}
//                 </td>
//                 <td>{txn.date}</td>
//                 <td >
//                   {txn.debit ? txn.debit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
//                 </td>
//                 <td >
//                   {txn.credit ? txn.credit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         <div className="footer-section">
//           <div className="footer-left">
//             <table className="tax-table">
//               <thead>
//                 <tr>
//                   <th>Tax Rate<br/>KDV Oranı</th>
//                   <th>Tax Base<br/>KDV Matrahı</th>
//                   <th>Tax Amount<br/>KDV Tutarı</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {invoice.totals.taxTable.map((tax, index) => (
//                   <tr key={index}>
//                     <td>{tax.rate}</td>
//                     <td>{tax.base.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
//                     <td>{tax.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>

//             <div className="exchange-info">
//               Room Check-in EUR Exch. Rate &nbsp;&nbsp; {invoice.totals.exchangeRates.eur.toFixed(4)} TRY<br/>
//               Total in EUR : &nbsp;&nbsp; {invoice.totals.totalEuro.toFixed(2)} EUR
//             </div>
//           </div>

//           <div className="footer-right">
//             <div className="totals-row">
//               <span>Total Amount/Toplam Tutar</span>
//               <span>{invoice.totals.summary.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Taxable Amount/KDV Matrahı</span>
//               <span>{invoice.totals.summary.taxableAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total VAT/Hesaplanan KDV</span>
//               <span>{invoice.totals.summary.totalVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total Acc Tax/Konaklama Vergisi</span>
//               <span>{invoice.totals.summary.accTax.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total Inc.Vat/KDV Dahil Tutar</span>
//               <span>{invoice.totals.summary.totalIncVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>

//             <div className="payment-header">Payments/Ödemeler</div>
//             <div className="totals-row">
//               <span>Deposit Transfer at C/IN</span>
//               <span>{invoice.totals.summary.deposit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>

//             <div className="totals-row balance-row">
//               <span>Balance/Bakiye</span>
//               <span>{invoice.totals.summary.balance.toFixed(2)}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default GrandArasInvoiceView;






import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import logo from '../../../public/grandaras-logo.png';
import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
import toast from "react-hot-toast";
import { InvoiceTemplate } from "../../components";

const GrandArasInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (invoiceData) {
      const transformed = transformInvoiceData(invoiceData);
      console.log("this is Transformed Data", transformed);
      
      
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
      const response = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      let data = response.data || response;
      if (data.data && typeof data.data === 'object') {
        data = data.data;
        if (data.data && typeof data.data === 'object') {
          data = data.data;
        }
      }
      const transformed = transformInvoiceData(data);
      console.log("this is all data", transformed);
      
      setInvoice(transformed);
    } catch (err) {
      console.error("❌ Error fetching invoice:", err);
      setError(err.message || "Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

const transformInvoiceData = (data) => {
  if (!data) return null;

  const accommodationDetails = data.accommodationDetails || [];
  const otherServices = data.otherServices || [];
  const transactions = [];

  console.log("📊 Original accommodationDetails:", accommodationDetails);
  console.log("📊 Original otherServices:", otherServices);

  // Calculate daily room amount based on total_room_all_nights / nights
  const nights = data.nights || 13;
  const dailyRoomAmount = (data.total_room_all_nights || 0) / nights;

  console.log("📊 Nights:", nights, "Daily room amount:", dailyRoomAmount);

  // Create room transactions for each night
  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(data.arrivalDate);
    currentDate.setDate(currentDate.getDate() + i);
    
    transactions.push({
      id: i + 1,
      description: "Room",
      rate: `${(data.actualRate || 220).toFixed(2)} EUR / ${(data.exchangeRate || 48.7707).toFixed(5)}`,
      date: formatDate(currentDate),
      debit: dailyRoomAmount.toFixed(2),
      credit: null,
      sortDate: new Date(currentDate)
    });
  }

  // Add other services with their dates
  let serviceId = transactions.length + 1;
  otherServices.forEach(service => {
    const serviceDate = service.date || service.service_date || data.arrivalDate;
    transactions.push({
      id: serviceId++,
      description: service.name || service.service_name || "Service",
      rate: "",
      date: formatDate(serviceDate),
      debit: service.amount || service.gross_amount || 0,
      credit: null,
      sortDate: new Date(serviceDate)
    });
  });

  // Sort ALL transactions by date
  transactions.sort((a, b) => a.sortDate - b.sortDate);

  // Reassign IDs based on sorted order
  transactions.forEach((txn, index) => {
    txn.id = index + 1;
  });

  // Calculate totals from actual data
  const taxableAmountRoom = parseFloat(data.taxable_amount_room || data.taxable_amount || 124539.42);
  const taxableAmountServices = otherServices.reduce((sum, s) => sum + parseFloat(s.taxable_amount || 0), 0);
  const totalTaxableAmount = taxableAmountRoom + taxableAmountServices;
  
  const vat10Percent = parseFloat(data.vat7 || data.vat_10_percent || data.vat1_10 || 12453.94);
  const vat20Percent = parseFloat(data.vat20 || 850);
  const otherServicesVat = otherServices.reduce((sum, s) => sum + parseFloat(s.vat_20_percent || 0), 0);
  const totalVat = vat10Percent + vat20Percent + otherServicesVat;
  
  const accommodationTax = parseFloat(data.accommodation_tax || data.accommodationTaxTotal || 2490.79);
  const grandTotal = parseFloat(data.grandTotal || 144584.15);
  const exchangeRate = parseFloat(data.exchangeRate || 48.7707);
  const totalEuro = exchangeRate > 0 ? (grandTotal / exchangeRate) : 0;

  console.log("📊 Calculated totals:", {
    taxableAmountRoom,
    taxableAmountServices,
    totalTaxableAmount,
    vat10Percent,
    vat20Percent,
    totalVat,
    accommodationTax,
    grandTotal,
    exchangeRate,
    totalEuro
  });

  return {
    meta: {
      folio: data.folio_number || data.vNo || "9090",
      date: formatDate(data.invoiceDate),
      vatOffice: data.vd || "70000000",
      vatNo: data.vNo || "22-4340",
      company: {
        name: "AZAR TOURISM",
        subName: "Azar Tourism Services",
        addressLine1: "Algeria Square Building Number 12 First Floor, Tripoli, Libya, P.O.BOX Number: 1254",
       
      },
      hotel: { logoUrl: logo }
    },
    guest: {
      name: data.guestName || "Muhammad Haris Javaid",
      room: data.roomNo || "100",
      arrival: formatDate(data.arrivalDate),
      departure: formatDate(data.departureDate),
      adults: data.paxAdult || 1,
      children: data.paxChild || 0,
      passport: data.passportNo || data.confirmation || "AB456789",
      user: data.userId || "Azar",
      cashierNo: data.batchNo || data.cshNo || data.cashNo || "7737",
      voucherNo: data.voucherNo || "22-4340",
      crsNo: data.voucherNo || "22-4340"
    },
    transactions,
    totals: {
      taxTable: [
        { rate: "%10", base: taxableAmountRoom, amount: vat10Percent },
        { rate: "%20", base: taxableAmountServices, amount: otherServicesVat }
      ].filter(tax => tax.base > 0 || tax.amount > 0),
      exchangeRates: { eur: exchangeRate },
      totalEuro: totalEuro,
      textAmount: numberToTurkishWords(grandTotal),
      summary: {
        totalAmount: totalTaxableAmount,
        taxableAmount: totalTaxableAmount,
        totalVat: totalVat,
        accTax: accommodationTax,
        totalIncVat: grandTotal,
        deposit: -grandTotal,
        balance: 0.00
      }
    }
  };
};

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return `${day}.${month}.${year}`;
    } catch { return dateString; }
  };

  const numberToTurkishWords = (amount) => {
    const rounded = Math.round(amount * 100) / 100;
    const lira = Math.floor(rounded);
    const kurus = Math.round((rounded - lira) * 100);
    return `Yalnız ${lira.toLocaleString('tr-TR')} Türk Lirası ${kurus} Kuruştur`;
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("PDF download feature coming soon!");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally { setPdfLoading(false); }
  };

  const handlePrint = () => window.print();

  // Helper component to ensure colons align perfectly
  // width prop determines how wide the label area is before the colon
  const InfoItem = ({ label, value, width = "65px" }) => (
    <div className="grid-item" style={{ display: 'flex', alignItems: 'flex-start' }}>
      <div style={{ 
        width: width, 
        minWidth: width,
        display: 'flex', 
        justifyContent: 'space-between', 
        marginRight: '6px' 
      }}>
        <span>{label}</span>
        <span>:</span>
      </div>
      <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </div>
  );

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
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size:9.5px; }

        .grandaras-invoice {
          background-color: white;
          width: 100%;
          max-width: 850px;
          margin: 0 auto;
          padding: 40px 50px;
          color: #000;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        .header-section { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .company-details { display: flex; flex-direction: column; justify-content: center; width: 60%; line-height: 1.3; }
        .company-name { font-weight: normal; text-transform: uppercase; }
        .logo-container { text-align: right; width: 30%; }
        .logo-img { max-width: 110px; height: auto; }

        .meta-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .guest-name { margin-top: 4px; margin-bottom: 3px;  }

        .info-grid {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr 1fr 1.8fr 1.2fr;
          gap: 2px 10px;
          margin-bottom: 5px;
        }

        .grid-item { white-space: nowrap; }

        .main-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #000; }
        .main-table thead tr { background-color: #f0f0f0; }
        .main-table th { text-align: left; padding: 4px 6px; font-weight: normal; }
        .main-table td { padding: 4px 6px; vertical-align: top; }

        .col-desc { width: 62%; }
        .col-date { width: 15%; }
        .col-debit { margin-right: 125px; text-align: left; justify-content: end; padding-right: 20px; }
        .col-credit { display: flex; justify-content: end; text-align: right; }
        .desc-with-rate { display: flex; column-gap: 182px; align-items: center; }
        .rate-value { padding-right: 20px; }

        .footer-section { display: flex; justify-content: space-between; margin-top: 20px; }
        .footer-left { width: 45%; }
        .footer-right { width: 45%; text-align: right; margin-top: -10px; }

        .tax-table { width: 90%; border-collapse: collapse; margin-bottom: 15px; margin-top: -10px; }
        .tax-table th { background-color: #f0f0f0; text-align: center; font-weight: normal; }
        .tax-table td { text-align: center; }

        .exchange-info { line-height: 1.4; margin-bottom: 15px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .payment-header { margin-top: 15px; margin-bottom: 3px; text-align: left; }
        .balance-row { margin-top: 15px; font-weight: bold; }

        @media print {
          .grandaras-invoice { width: 100%; padding: 20px; box-shadow: none; }
          .main-table thead tr, .tax-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="grandaras-invoice">
        <div className="header-section">
          <div className="company-details">
            <div className="company-sub">Azar Tourism Services</div>
            <div>Algeria Square Building Number 12 First Floor, Tripoli, Libya.</div>
          </div>
          <div className="logo-container">
            <img src={invoice.meta.hotel.logoUrl} alt="Logo" className="logo-img" />
          </div>
        </div>

        <div className="meta-row">
          <div>V.D. &nbsp; : &nbsp; {invoice.meta.vatOffice || '70000000'}</div>
          <div>Date/Tarih : &nbsp; {invoice.meta.date}</div>
        </div>
        <div className="meta-row">
          <div>V. NO : &nbsp; {invoice.meta.vatNo || '22-4340'}</div>
          <div></div>
        </div>

        <div className="guest-name">{invoice.guest.name}</div>

        <div className="info-grid">
          {/* Row 1 */}
          <InfoItem label="Room/Oda" value={invoice.guest.room} width="65px" />
          <InfoItem label="Arrival/Giriş" value={invoice.guest.arrival} width="75px" />
          <InfoItem label="Adult/Yetişkin" value={invoice.guest.adults} width="75px" />
          <InfoItem label="Passport No - TC No" value={invoice.guest.passport} width="110px" />
          <InfoItem label="User/Kullanıcı" value={invoice.guest.user} width="85px" />

          {/* Row 2 */}
          <InfoItem label="Folio No" value={invoice.meta.folio} width="65px" />
          <InfoItem label="Departure/Çıkış" value={invoice.guest.departure} width="75px" />
          <InfoItem label="Child/Çocuk" value={invoice.guest.children} width="75px" />
          <InfoItem label="Crs No/Voucher No" value={invoice.guest.voucherNo || invoice.guest.crsNo || ''} width="110px" />
          <InfoItem label="Csh No/Kasa No" value={invoice.guest.cashierNo} width="85px" />

          {/* Row 3 - Page Number */}
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <InfoItem label="Page/Sayfa" value="1" width="85px" />
        </div>

        <table className="main-table">
          <thead>
            <tr>
              <th className="col-desc">Açıklama/Description</th>
              <th className="col-date">Date/Tarih</th>
              <th className="col-debit"><span className='innercol-debit'>Debit/Borç</span></th>
              <th className="col-credit">Credit/Alacak</th>
            </tr>
          </thead>
          <tbody>
            {invoice.transactions.map((txn) => (
              <tr key={txn.id}>
                <td>
                  {txn.rate ? (
                    <div className="desc-with-rate">
                      <span>{txn.description}</span>
                      <span className="rate-value">{txn.rate}</span>
                    </div>
                  ) : (
                    txn.description
                  )}
                </td>
                <td>{txn.date}</td>
                <td>{txn.debit ? txn.debit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}</td>
                <td>{txn.credit ? txn.credit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="footer-section">
          <div className="footer-left">
            <table className="tax-table">
              <thead>
                <tr>
                  <th>Tax Rate<br/>KDV Oranı</th>
                  <th>Tax Base<br/>KDV Matrahı</th>
                  <th>Tax Amount<br/>KDV Tutarı</th>
                </tr>
              </thead>
              <tbody>
                {invoice.totals.taxTable.map((tax, index) => (
                  <tr key={index}>
                    <td>{tax.rate}</td>
                    <td>{tax.base.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td>{tax.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="exchange-info">
              Room Check-in EUR Exch. Rate &nbsp;&nbsp; {invoice.totals.exchangeRates.eur.toFixed(4)} TRY<br/>
              Total in EUR : &nbsp;&nbsp; {invoice.totals.totalEuro.toFixed(2)} EUR
            </div>
            
           
          </div>

          <div className="footer-right">
            <div className="totals-row"><span>Total Amount/Toplam Tutar</span><span>{invoice.totals.summary.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
            <div className="totals-row"><span>Taxable Amount/KDV Matrahı</span><span>{invoice.totals.summary.taxableAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
            <div className="totals-row"><span>Total VAT/Hesaplanan KDV</span><span>{invoice.totals.summary.totalVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
            <div className="totals-row"><span>Total Acc Tax/Konaklama Vergisi</span><span>{invoice.totals.summary.accTax.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
            <div className="totals-row"><span>Total Inc.Vat/KDV Dahil Tutar</span><span>{invoice.totals.summary.totalIncVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
            
            <div className="payment-header">Payments/Ödemeler</div>
            <div className="totals-row"><span>Deposit Transfer at C/IN</span><span>{invoice.totals.summary.deposit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
            
            <div className="totals-row balance-row"><span>Balance/Bakiye</span><span>{invoice.totals.summary.balance.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </InvoiceTemplate>
  );
};

export default GrandArasInvoiceView;






// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from "react-router-dom";
// import logo from '../../../public/grandaras-logo.png';
// import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
// import toast from "react-hot-toast";
// import { InvoiceTemplate } from "../../components";

// const GrandArasInvoiceView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const navigate = useNavigate();
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);

//   useEffect(() => {
//     if (invoiceData) {
//       console.log("✅ Using invoiceData prop:", invoiceData);
//       const transformed = transformInvoiceData(invoiceData);
//       console.log("✅ Transformed Grand Aras data:", transformed);
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
//       const response = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      
//       let data = response.data || response;
      
//       if (data.data && typeof data.data === 'object') {
//         data = data.data;
//         if (data.data && typeof data.data === 'object') {
//           data = data.data;
//         }
//       }
      
//       const transformed = transformInvoiceData(data);
//       setInvoice(transformed);
//     } catch (err) {
//       console.error("❌ Error fetching invoice:", err);
//       setError(err.message || "Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const transformInvoiceData = (data) => {
//     console.log("🔄 Transforming Grand Aras data:", data);
    
//     if (!data) {
//       console.error("❌ No data to transform");
//       return null;
//     }

//     const accommodationDetails = data.accommodationDetails || [];
//     const otherServices = data.otherServices || [];
    
//     const transactions = [];
    
//     // Keep your original deposit row
//     const totalIncVat = parseFloat(data.grandTotal || data.totalIncVat || 0);
//     if (totalIncVat > 0) {
//       transactions.push({
//         id: transactions.length + 1,
//         description: "Deposit Transfer at C/IN",
//         rate: "",
//         date: formatDate(data.arrivalDate || data.arrival_date),
//         debit: null,
//         credit: totalIncVat
//       });
//     }
    
//     // Room charges (your original logic)
//     accommodationDetails.forEach((acc) => {
//       transactions.push({
//         id: transactions.length + 1,
//         description: "Room",
//         rate: `${(data.actualRate || 0).toFixed(2)} EUR / ${(data.exchangeRate || 0).toFixed(5)}`,
//         date: formatDate(acc.date || data.arrivalDate),
//         debit: acc.rate || 0,
//         credit: null
//       });
//     });
    
//     // Other services (your original)
//     otherServices.forEach(service => {
//       transactions.push({
//         id: transactions.length + 1,
//         description: service.name || service.service_name || "Service",
//         rate: "",
//         date: formatDate(service.date || service.service_date),
//         debit: service.amount || service.gross_amount || 0,
//         credit: null
//       });
//     });

//     // ────────────────────────────────────────────────
//     // FIXED CALCULATIONS – use saved values from form/backend
//     // ────────────────────────────────────────────────
    
//     // Prefer saved correct values (from edit form)
//     const taxableAmount = parseFloat(data.taxableAmount || data.taxable_amount_kdv_matrah || 0); // ← d + e
//     const totalVat = parseFloat(data.totalVat || data.total_vat || data.vatTotal || 0);           // ← g + h
//     const accTax = parseFloat(data.accTax || data.total_accommodation_tax || data.accommodationTaxTotal || 0);
//     const grandTotal = parseFloat(data.grandTotal || data.totalIncVat || 0);                     // ← k
//     const totalInEur = parseFloat(data.totalInEur || 0);                                         // ← m

//     // Safe fallback only if saved values are missing
//     const fallbackTaxable = 
//       parseFloat(data.taxable_amount_room || 0) + 
//       otherServices.reduce((sum, s) => sum + parseFloat(s.taxable_amount || 0), 0);

//     const finalTaxable = taxableAmount > 0 ? taxableAmount : fallbackTaxable;

//     // Your original other services breakdown (for tax table)
//     const otherServicesTotal = otherServices.reduce((sum, service) => sum + (service.gross_amount || service.amount || 0), 0);
//     const laundryBase = otherServicesTotal > 0 ? otherServicesTotal / 1.2 : 0;
//     const laundryVat20 = otherServicesTotal - laundryBase;
//     const hasOtherServices = otherServicesTotal > 0;

//     return {
//       meta: {
//         folio: data.voucherNo || data.folio_number || "",
//         date: formatDate(data.invoiceDate || data.invoice_date),
//         vatOffice: "",
//         vatNo: "2222222222",
//         company: {
//           name: "AZAR TOURISM",
//           subName: "Azar Tourism Services",
//           addressLine1: "Algeria Square Building Number 12 First Floor, Tripoli, Libya, P.O.BOX Number: 1254",
//           addressLine2: "Tripoli Libya,",
//           addressLine3: "Tripoli, Libyan Arab Jamahiriya"
//         },
//         hotel: {
//           logoUrl: logo
//         }
//       },
//       guest: {
//         name: data.guestName || data.guest_name || "Guest",
//         room: data.roomNo || data.room_number || "",
//         arrival: formatDate(data.arrivalDate || data.arrival_date),
//         departure: formatDate(data.departureDate || data.departure_date),
//         adults: data.paxAdult || data.adults || 1,
//         children: data.paxChild || data.children || 0,
//         passport: data.passportNo || data.passport_no || "",
//         user: data.userId || data.user_code || "",
//         cashierNo: data.batchNo || data.cash_no || "1"
//       },
//       transactions,
//       totals: {
//         taxTable: [
//           {
//             rate: "%10",
//             base: parseFloat(data.taxable_amount_room || 0), // d
//             amount: parseFloat(data.vat_10_percent || data.vatTotal || 0) // g
//           },
//           ...(hasOtherServices ? [{
//             rate: "%20",
//             base: otherServices.reduce((sum, s) => sum + parseFloat(s.taxable_amount || 0), 0), // e sum
//             amount: otherServices.reduce((sum, s) => sum + parseFloat(s.vat_20_percent || 0), 0) // h sum
//           }] : [])
//         ],
//         exchangeRates: {
//           usd: 35.2892,
//           eur: parseFloat(data.exchangeRate || data.exchange_rate || 0)
//         },
//         totalEuro: totalInEur,
//         textAmount: numberToTurkishWords(grandTotal),
//         summary: {
//           totalAmount: parseFloat(data.totalAmount || grandTotal || 0),
//           taxableAmount: finalTaxable,              // ← now correct d + e
//           totalVat: totalVat,                       // ← g + h
//           accTax: accTax,                           // ← j
//           totalIncVat: grandTotal,                  // ← k
//           deposit: -grandTotal,
//           balance: 0.00
//         }
//       }
//     };
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "";
//     try {
//       const date = new Date(dateString);
//       const day = String(date.getDate()).padStart(2, '0');
//       const month = String(date.getMonth() + 1).padStart(2, '0');
//       const year = String(date.getFullYear()).slice(-2);
//       return `${day}.${month}.${year}`;
//     } catch {
//       return dateString;
//     }
//   };

//   const numberToTurkishWords = (amount) => {
//     const rounded = Math.round(amount * 100) / 100;
//     const lira = Math.floor(rounded);
//     const kurus = Math.round((rounded - lira) * 100);
//     return `Yalnız ${lira.toLocaleString('tr-TR')} Türk Lirası ${kurus} Kuruştur`;
//   };

//   const handleDownloadPDF = async () => {
//     setPdfLoading(true);
//     try {
//       await new Promise(resolve => setTimeout(resolve, 1000));
//       toast.success("PDF download feature coming soon!");
//     } catch (error) {
//       toast.error("Failed to generate PDF");
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   if (!invoice) {
//     return (
//       <InvoiceTemplate
//         loading={loading}
//         error={error}
//         invoice={invoice}
//         pdfLoading={pdfLoading}
//         onDownloadPDF={handleDownloadPDF}
//         onPrint={handlePrint}
//         onBack={() => navigate("/invoices")}
//       >
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
//       {/* Your original <style> block – unchanged */}
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

//         .grandaras-invoice {
//           background-color: white;
//           width: 100%;
//           max-width: 850px;
//           margin: 0 auto;
//           padding: 40px 50px;
//           font-size: 11px;
//           color: #000;
//           box-shadow: 0 0 10px rgba(0,0,0,0.1);
//         }

//         .header-section {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 10px;
//         }

//         .company-details {
//           display: flex;
//           flex-direction: column;
//           justify-content: center;
//           width: 60%;
//           line-height: 1.3;
//         }

//         .company-name {
//           font-weight: normal;
//           font-size: 12px;
//           text-transform: uppercase;
//         }

//         .company-sub {
//           font-size: 11px;
//         }

//         .logo-container {
//           text-align: right;
//           width: 30%;
//         }

//         .logo-img {
//           max-width: 125px;
//           height: auto;
//         }

//         .meta-row {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 5px;
//           font-size: 11px;
//         }

//         .guest-name {
//           margin-top: 4px;
//           margin-bottom: 3px;
//           font-size: 12px;
//         }

//         .info-grid {
//           display: grid;
//           grid-template-columns: 0.8fr 1.2fr 1fr 1.8fr 1.2fr;
//           gap: 2px 10px;
//           margin-bottom: 2px;
//           font-size: 11px;
//         }

//         .grid-item {
//           white-space: nowrap;
//         }

//         .main-table {
//           width: 100%;
//           border-collapse: collapse;
//           margin-bottom: 20px;
//           border: 1px solid #000;
//         }

//         .main-table thead tr {
//           background-color: #f0f0f0;
//           border-bottom: 1px solid #000;
//         }

//         .main-table th {
//           text-align: left;
//           padding: 4px 6px;
//           font-weight: normal;
//           font-size: 11px;
//         }

//         .main-table td {
//           padding: 4px 6px;
//           vertical-align: top;
//           font-size: 11px;
//         }

//         .col-desc { width: 50%; }
//         .col-date { width: 15%; }
//         .col-debit { width: 15%; text-align: right; }
//         .col-credit { width: 15%; text-align: right; }

//         .desc-with-rate {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }

//         .rate-value {
//           padding-right: 20px;
//         }

//         .text-right {
//           text-align: right;
//         }

//         .footer-section {
//           display: flex;
//           justify-content: space-between;
//           margin-top: 20px;
//         }

//         .footer-left {
//           width: 45%;
//         }

//         .footer-right {
//           width: 45%;
//           text-align: right;
//         }

//         .tax-table {
//           width: 90%;
//           border-collapse: collapse;
//           margin-bottom: 15px;
//           font-size: 10px;
//         }

//         .tax-table th {
//           background-color: #f0f0f0;
//           text-align: center;
//           padding: 3px;
//           font-weight: normal;
//         }

//         .tax-table td {
//           text-align: center;
//           padding: 3px;
//         }

//         .exchange-info {
//           line-height: 1.4;
//           margin-bottom: 15px;
//           font-size: 11px;
//         }

//         .totals-row {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 3px;
//           font-size: 11px;
//         }

//         .payment-header {
//           margin-top: 15px;
//           margin-bottom: 3px;
//           text-align: left;
//         }

//         .balance-row {
//           margin-top: 15px;
//           font-weight: bold;
//         }

//         @media print {
//           body {
//             background-color: white;
//             margin: 0;
//           }

//           .grandaras-invoice {
//             width: 100%;
//             margin: 0;
//             padding: 20px;
//             box-shadow: none;
//           }

//           .main-table thead tr {
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }

//           .tax-table th {
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }
//         }
//       `}</style>

//       <div className="grandaras-invoice">
//         <div className="header-section">
//           <div className="company-details">
//             <div className="company-sub">Azar Tourism Services</div>
//             <div>Algeria Square Building Number 12 First Floor, Tripoli, Libya.</div>
//           </div>
//           <div className="logo-container">
//             <img src={invoice.meta.hotel.logoUrl} alt="Grand Aras Hotel" className="logo-img" />
//           </div>
//         </div>

//         <div className="meta-row">
//           <div>V.D.  :  {invoice.meta.vatOffice}</div>
//           <div>Date/Tarih :  {invoice.meta.date}</div>
//         </div>
//         <div className="meta-row">
//           <div>V. NO :  {invoice.meta.vatNo}</div>
//           <div></div>
//         </div>

//         <div className="guest-name">{invoice.guest.name}</div>

//         <div className="info-grid">
//           <div className="grid-item">Room/Oda : {invoice.guest.room}</div>
//           <div className="grid-item">Arrival/Giriş : {invoice.guest.arrival}</div>
//           <div className="grid-item">Adult/Yetişkin : {invoice.guest.adults}</div>
//           <div className="grid-item">Passport No - TC No : {invoice.guest.passport}</div>
//           <div className="grid-item">User/Kullanıcı : {invoice.guest.user}</div>

//           <div className="grid-item">Folio No : {invoice.meta.folio}</div>
//           <div className="grid-item">Departure/Çıkış : {invoice.guest.departure}</div>
//           <div className="grid-item">Child/Çocuk : {invoice.guest.children}</div>
//           <div className="grid-item">Crs No/Voucher No :</div>
//           <div className="grid-item">Csh No/Kasa No : {invoice.guest.cashierNo}</div>

//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item">Page/Sayfa : 1</div>
//         </div>

//         <table className="main-table">
//           <thead>
//             <tr>
//               <th className="col-desc">Açıklama/Description</th>
//               <th className="col-date">Date/Tarih</th>
//               <th className="col-debit">Debit/Borç</th>
//               <th className="col-credit">Credit/Alacak</th>
//             </tr>
//           </thead>
//           <tbody>
//             {invoice.transactions.map((txn) => (
//               <tr key={txn.id}>
//                 <td>
//                   {txn.rate ? (
//                     <div className="desc-with-rate">
//                       <span>{txn.description}</span>
//                       <span className="rate-value">{txn.rate}</span>
//                     </div>
//                   ) : (
//                     txn.description
//                   )}
//                 </td>
//                 <td>{txn.date}</td>
//                 <td>
//                   {txn.debit ? txn.debit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
//                 </td>
//                 <td>
//                   {txn.credit ? txn.credit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         <div className="footer-section">
//           <div className="footer-left">
//             <table className="tax-table">
//               <thead>
//                 <tr>
//                   <th>Tax Rate<br/>KDV Oranı</th>
//                   <th>Tax Base<br/>KDV Matrahı</th>
//                   <th>Tax Amount<br/>KDV Tutarı</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {invoice.totals.taxTable.map((tax, index) => (
//                   <tr key={index}>
//                     <td>{tax.rate}</td>
//                     <td>{tax.base.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
//                     <td>{tax.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>

//             <div className="exchange-info">
//               Room Check-in EUR Exch. Rate  {invoice.totals.exchangeRates.eur.toFixed(4)} TRY<br/>
//               Total in EUR :  {invoice.totals.totalEuro.toFixed(2)} EUR
//             </div>
//           </div>

//           <div className="footer-right">
//             <div className="totals-row">
//               <span>Total Amount/Toplam Tutar</span>
//               <span>{invoice.totals.summary.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Taxable Amount/KDV Matrahı</span>
//               <span>{invoice.totals.summary.taxableAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total VAT/Hesaplanan KDV</span>
//               <span>{invoice.totals.summary.totalVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total Acc Tax/Konaklama Vergisi</span>
//               <span>{invoice.totals.summary.accTax.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total Inc.Vat/KDV Dahil Tutar</span>
//               <span>{invoice.totals.summary.totalIncVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>

//             <div className="payment-header">Payments/Ödemeler</div>
//             <div className="totals-row">
//               <span>Deposit Transfer at C/IN</span>
//               <span>{invoice.totals.summary.deposit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>

//             <div className="totals-row balance-row">
//               <span>Balance/Bakiye</span>
//               <span>{invoice.totals.summary.balance.toFixed(2)}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default GrandArasInvoiceView;


// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from "react-router-dom";
// import logo from '../../../public/grandaras-logo.png';
// import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
// import toast from "react-hot-toast";
// import {InvoiceTemplate} from "../../components";

// const GrandArasInvoiceView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const navigate = useNavigate();
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);

//   useEffect(() => {
//     if (invoiceData) {
//       console.log("✅ Using invoiceData prop:", invoiceData);
//       const transformed = transformInvoiceData(invoiceData);
//       console.log("✅ Transformed Grand Aras data:", transformed);
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
//       const response = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      
//       let data = response.data || response;
      
//       if (data.data && typeof data.data === 'object') {
//         data = data.data;
//         if (data.data && typeof data.data === 'object') {
//           data = data.data;
//         }
//       }
      
//       const transformed = transformInvoiceData(data);
//       setInvoice(transformed);
//     } catch (err) {
//       console.error("❌ Error fetching invoice:", err);
//       setError(err.message || "Failed to load invoice data");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const transformInvoiceData = (data) => {
//     console.log("🔄 Transforming Grand Aras data:", data);
    
//     if (!data) {
//       console.error("❌ No data to transform");
//       return null;
//     }

//     const accommodationDetails = data.accommodationDetails || [];
//     const otherServices = data.otherServices || [];
    
//     const transactions = [];
    
//     // Add deposit transfer first if exists
//     const totalIncVat = parseFloat(data.grandTotal || 0);
//     if (totalIncVat > 0) {
//       transactions.push({
//         id: transactions.length + 1,
//         description: "Deposit Transfer at C/IN",
//         rate: "",
//         date: formatDate(data.arrivalDate),
//         debit: null,
//         credit: totalIncVat
//       });
//     }
    
//     // Build transactions from accommodation details
//     accommodationDetails.forEach((acc) => {
//       transactions.push({
//         id: transactions.length + 1,
//         description: "Room",
//         rate: `${(data.actualRate || 0).toFixed(2)} EUR / ${(data.exchangeRate || 0).toFixed(5)}`,
//         date: formatDate(acc.date),
//         debit: acc.rate || 0,
//         credit: null
//       });
//     });
    
//     // Add other services
//     otherServices.forEach(service => {
//       transactions.push({
//         id: transactions.length + 1,
//         description: service.name || "Service",
//         rate: "",
//         date: formatDate(service.date),
//         debit: service.amount || 0,
//         credit: null
//       });
//     });

//     // Calculate laundry/other services tax breakdown (20% VAT)
//     const otherServicesTotal = otherServices.reduce((sum, service) => sum + (service.amount || 0), 0);
//     const laundryBase = otherServicesTotal > 0 ? otherServicesTotal / 1.2 : 0;
//     const laundryVat20 = otherServicesTotal - laundryBase;
//     const hasOtherServices = otherServicesTotal > 0;

//     // Calculate totals
//     const accommodationSubTotal = parseFloat(data.subTotal || 0);
//     const accommodationVat = parseFloat(data.vatTotal || 0);
    
//     const totalAmount = accommodationSubTotal + (hasOtherServices ? laundryBase : 0);
//     const totalVAT = accommodationVat + (hasOtherServices ? laundryVat20 : 0);
    
//     const totalAccTax = (parseFloat(data.sellingRate || 0) * 0.02) * (data.nights || 0);
//     const totalEuro = (data.actualRate || 0) * (data.nights || 0);

//     return {
//       meta: {
//         folio: data.voucherNo || "",
//         date: formatDate(data.invoiceDate),
//         vatOffice: "",
//         vatNo: "2222222222",
//         company: {
//           name: "AZAR TOURISM",
//           subName: "Azar Tourism Services",
//           addressLine1: "Algeria Square Building Number 12 First Floor, Tripoli, Libya, P.O.BOX Number: 1254",
//           addressLine2: "Tripoli Libya,",
//           addressLine3: "Tripoli, Libyan Arab Jamahiriya"
//         },
//         hotel: {
//           logoUrl: logo
//         }
//       },
//       guest: {
//         name: data.guestName || "Guest",
//         room: data.roomNo || "",
//         arrival: formatDate(data.arrivalDate),
//         departure: formatDate(data.departureDate),
//         adults: data.paxAdult || 1,
//         children: data.paxChild || 0,
//         passport: data.passportNo || "",
//         user: data.userId || "",
//         cashierNo: data.batchNo || "1"
//       },
//       transactions: transactions,
//       totals: {
//         taxTable: [
//           {
//             rate: "%10",
//             base: accommodationSubTotal,
//             amount: accommodationVat
//           },
//           ...(hasOtherServices ? [{
//             rate: "%20",
//             base: laundryBase,
//             amount: laundryVat20
//           }] : [])
//         ],
//         totalBase: totalAmount,
//         totalVatAmount: totalVAT,
//         exchangeRates: {
//           usd: 35.2892,
//           eur: data.exchangeRate || 0
//         },
//         totalEuro: totalEuro,
//         textAmount: numberToTurkishWords(totalIncVat),
//         summary: {
//           totalAmount: accommodationSubTotal + otherServicesTotal,
//           taxableAmount: totalAmount,
//           totalVat: totalVAT,
//           accTax: totalAccTax,
//           totalIncVat: totalIncVat,
//           deposit: -totalIncVat,
//           balance: 0.00
//         }
//       }
//     };
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "";
//     try {
//       const date = new Date(dateString);
//       const day = String(date.getDate()).padStart(2, '0');
//       const month = String(date.getMonth() + 1).padStart(2, '0');
//       const year = String(date.getFullYear()).slice(-2);
//       return `${day}.${month}.${year}`;
//     } catch {
//       return dateString;
//     }
//   };

//   const numberToTurkishWords = (amount) => {
//     const rounded = Math.round(amount * 100) / 100;
//     const lira = Math.floor(rounded);
//     const kurus = Math.round((rounded - lira) * 100);
    
//     return `Yalnız ${lira.toLocaleString('tr-TR')} Türk Lirası ${kurus} Kuruştur`;
//   };

//   const handleDownloadPDF = async () => {
//     setPdfLoading(true);
//     try {
//       await new Promise(resolve => setTimeout(resolve, 1000));
//       toast.success("PDF download feature coming soon!");
//     } catch (error) {
//       toast.error("Failed to generate PDF");
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   const handlePrint = () => window.print();

//   if (!invoice) {
//     return (
//       <InvoiceTemplate
//         loading={loading}
//         error={error}
//         invoice={invoice}
//         pdfLoading={pdfLoading}
//         onDownloadPDF={handleDownloadPDF}
//         onPrint={handlePrint}
//         onBack={() => navigate("/invoices")}
//       >
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

//         .grandaras-invoice {
//           background-color: white;
//           width: 100%;
//           max-width: 850px;
//           margin: 0 auto;
//           padding: 40px 50px;
//           font-size: 11px;
//           color: #000;
//           box-shadow: 0 0 10px rgba(0,0,0,0.1);
//         }

//         .header-section {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 10px;
//         }

//         .company-details {
//         display: flex;
//         flex-direction: column;
//         justify-content: center;
//           width: 60%;
//           line-height: 1.3;
//         }

//         .company-name {
//           font-weight: normal;
//           font-size: 12px;
//           text-transform: uppercase;
//         }

//         .company-sub {
//           font-size: 11px;
//         }

//         .logo-container {
//           text-align: right;
//           width: 30%;
//         }

//         .logo-img {
//           max-width: 125px;
//           height: auto;
//         }

//         .meta-row {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 5px;
//           font-size: 11px;
//         }

//         .guest-name {
//           margin-top: 4px;
//           margin-bottom: 3px;
//           font-size: 12px;
//         }

//         .info-grid {
//           display: grid;
//           grid-template-columns: 0.8fr 1.2fr 1fr 1.8fr 1.2fr;
//           gap: 2px 10px;
//           margin-bottom: 2px;
//           font-size: 11px;
//         }

//         .grid-item {
//           white-space: nowrap;
//         }

//         .main-table {
//           width: 100%;
//           border-collapse: collapse;
//           margin-bottom: 20px;
//           border: 1px solid #000;
//         }

//         .main-table thead tr {
//           background-color: #f0f0f0;
//           border-bottom: 1px solid #000;
//         }

//         .main-table th {
//           text-align: left;
//           padding: 4px 6px;
//           font-weight: normal;
//           font-size: 11px;
//         }

//         .main-table td {
//           padding: 4px 6px;
//           vertical-align: top;
//           font-size: 11px;
//         }

//         .col-desc { width: 50%; }
//         .col-date { width: 15%; }
//         .col-debit { width: 15%; text-align: right; }
//         .col-credit { width: 15%; text-align: right; }

//         .desc-with-rate {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }

//         .rate-value {
//           padding-right: 20px;
//         }

//         .text-right {
//           text-align: right;
//         }

//         .footer-section {
//           display: flex;
//           justify-content: space-between;
//           margin-top: 20px;
//         }

//         .footer-left {
//           width: 45%;
//         }

//         .footer-right {
//           width: 45%;
//           text-align: right;
//         }

//         .tax-table {
//           width: 90%;
//           border-collapse: collapse;
//           margin-bottom: 15px;
//           font-size: 10px;
//         }

//         .tax-table th {
//           background-color: #f0f0f0;
//           text-align: center;
//           padding: 3px;
//           font-weight: normal;
//         }

//         .tax-table td {
//           text-align: center;
//           padding: 3px;
//         }

//         .exchange-info {
//           line-height: 1.4;
//           margin-bottom: 15px;
//           font-size: 11px;
//         }

//         .totals-row {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 3px;
//           font-size: 11px;
//         }

//         .payment-header {
//           margin-top: 15px;
//           margin-bottom: 3px;
//           text-align: left;
//         }

//         .balance-row {
//           margin-top: 15px;
//           font-weight: bold;
//         }

//         @media print {
//           body {
//             background-color: white;
//             margin: 0;
//           }

//           .grandaras-invoice {
//             width: 100%;
//             margin: 0;
//             padding: 20px;
//             box-shadow: none;
//           }

//           .main-table thead tr {
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }

//           .tax-table th {
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }
//         }
//       `}</style>

//       <div className="grandaras-invoice">
//         <div className="header-section">
//           <div className="company-details">
//            <div className="company-sub">Azar Tourism Services</div>
//             <div>Algeria Square Building Number 12 First Floor, Tripoli, Libya.</div>
//           </div>
//           <div className="logo-container">
//             <img src={invoice.meta.hotel.logoUrl} alt="Grand Aras Hotel" className="logo-img" />
//           </div>
//         </div>

//         <div className="meta-row">
//           <div>V.D. &nbsp; : &nbsp; {invoice.meta.vatOffice}</div>
//           <div>Date/Tarih : &nbsp; {invoice.meta.date}</div>
//         </div>
//         <div className="meta-row">
//           <div>V. NO : &nbsp; {invoice.meta.vatNo}</div>
//           <div></div>
//         </div>

//         <div className="guest-name">{invoice.guest.name}</div>

//         <div className="info-grid">
//           <div className="grid-item">Room/Oda : {invoice.guest.room}</div>
//           <div className="grid-item">Arrival/Giriş &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {invoice.guest.arrival}</div>
//           <div className="grid-item">Adult/Yetişkin : {invoice.guest.adults}</div>
//           <div className="grid-item">Passport No - TC No : {invoice.guest.passport}</div>
//           <div className="grid-item">User/Kullanıcı &nbsp;&nbsp;&nbsp;: {invoice.guest.user}</div>

//           <div className="grid-item">Folio No &nbsp;&nbsp;: {invoice.meta.folio}</div>
//           <div className="grid-item">Departure/Çıkış &nbsp;&nbsp;: {invoice.guest.departure}</div>
//           <div className="grid-item">Child/Çocuk &nbsp;&nbsp;&nbsp;: {invoice.guest.children}</div>
//           <div className="grid-item">Crs No/Voucher No &nbsp;:</div>
//           <div className="grid-item">Csh No/Kasa No : {invoice.guest.cashierNo}</div>

//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item"></div>
//           <div className="grid-item">Page/Sayfa &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: 1</div>
//         </div>

//         <table className="main-table">
//           <thead>
//             <tr>
//               <th className="col-desc">Açıklama/Description</th>
//               <th className="col-date">Date/Tarih</th>
//               <th className="col-debit">Debit/Borç</th>
//               <th className="col-credit">Credit/Alacak</th>
//             </tr>
//           </thead>
//           <tbody>
//             {invoice.transactions.map((txn) => (
//               <tr key={txn.id}>
//                 <td>
//                   {txn.rate ? (
//                     <div className="desc-with-rate">
//                       <span>{txn.description}</span>
//                       <span className="rate-value">{txn.rate}</span>
//                     </div>
//                   ) : (
//                     txn.description
//                   )}
//                 </td>
//                 <td>{txn.date}</td>
//                 <td >
//                   {txn.debit ? txn.debit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
//                 </td>
//                 <td >
//                   {txn.credit ? txn.credit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         <div className="footer-section">
//           <div className="footer-left">
//             <table className="tax-table">
//               <thead>
//                 <tr>
//                   <th>Tax Rate<br/>KDV Oranı</th>
//                   <th>Tax Base<br/>KDV Matrahı</th>
//                   <th>Tax Amount<br/>KDV Tutarı</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {invoice.totals.taxTable.map((tax, index) => (
//                   <tr key={index}>
//                     <td>{tax.rate}</td>
//                     <td>{tax.base.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
//                     <td>{tax.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>

//             <div className="exchange-info">
//               Room Check-in EUR Exch. Rate &nbsp;&nbsp; {invoice.totals.exchangeRates.eur.toFixed(4)} TRY<br/>
//               Total in EUR : &nbsp;&nbsp; {invoice.totals.totalEuro.toFixed(2)} EUR
//             </div>
//           </div>

//           <div className="footer-right">
//             <div className="totals-row">
//               <span>Total Amount/Toplam Tutar</span>
//               <span>{invoice.totals.summary.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Taxable Amount/KDV Matrahı</span>
//               <span>{invoice.totals.summary.taxableAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total VAT/Hesaplanan KDV</span>
//               <span>{invoice.totals.summary.totalVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total Acc Tax/Konaklama Vergisi</span>
//               <span>{invoice.totals.summary.accTax.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>
//             <div className="totals-row">
//               <span>Total Inc.Vat/KDV Dahil Tutar</span>
//               <span>{invoice.totals.summary.totalIncVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>

//             <div className="payment-header">Payments/Ödemeler</div>
//             <div className="totals-row">
//               <span>Deposit Transfer at C/IN</span>
//               <span>{invoice.totals.summary.deposit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//             </div>

//             <div className="totals-row balance-row">
//               <span>Balance/Bakiye</span>
//               <span>{invoice.totals.summary.balance.toFixed(2)}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </InvoiceTemplate>
//   );
// };

// export default GrandArasInvoiceView;