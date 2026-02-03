// import React, { useState, useEffect } from 'react';
// import { useParams } from "react-router-dom";
// import { Download, Printer, ArrowLeft, Loader2 } from "lucide-react";
// import logo from '../../../public/TRYP-Logo.png';
// import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
// import toast from "react-hot-toast";

// const TRYPInvoiceView = ({ invoiceData }) => {
//   const { invoiceId } = useParams();
//   const [invoice, setInvoice] = useState(null);
//   const [loading, setLoading] = useState(!invoiceData);
//   const [error, setError] = useState(null);
//   const [pdfLoading, setPdfLoading] = useState(false);

//   useEffect(() => {
//     if (invoiceData) {
//       console.log("✅ Using invoiceData prop:", invoiceData);
//       const transformed = transformInvoiceData(invoiceData);
//       console.log("✅ Transformed TRYP data:", transformed);
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
//     console.log("🔄 Transforming TRYP data:", data);
    
//     if (!data) {
//       console.error("❌ No data to transform");
//       return null;
//     }

//     const accommodationDetails = data.accommodationDetails || [];
//     const otherServices = data.otherServices || [];
    
//     const transactions = [];
    
//     accommodationDetails.forEach((acc) => {
//       transactions.push({
//         id: transactions.length + 1,
//         description: "Package Rate",
//         rate: `${(data.actualRate || 0).toFixed(2)} EUR / ${(data.exchangeRate || 0).toFixed(5)}`,
//         date: formatDate(acc.date),
//         debit: acc.rate || 0,
//         credit: null,
//         details: null
//       });
//     });
    
//     otherServices.forEach(service => {
//       transactions.push({
//         id: transactions.length + 1,
//         description: service.name || "Service",
//         rate: "",
//         date: formatDate(service.date),
//         debit: service.amount || 0,
//         credit: null,
//         details: service.textField1 || null
//       });
//     });

//     const totalAmount = parseFloat(data.subTotal || 0);
//     const totalVAT = parseFloat(data.vatTotal || 0);
//     const totalAccTax = (parseFloat(data.sellingRate || 0) * 0.02) * (data.nights || 0);
//     const totalIncVat = parseFloat(data.grandTotal || 0);
//     const totalEuro = (data.actualRate || 0) * (data.nights || 0);

//     return {
//       meta: {
//         folio: data.voucherNo || "",
//         date: formatDate(data.invoiceDate),
//         vatOffice: "LIBYA",
//         vatNo: "2222222222",
//         company: {
//           name: "AZAR TOURISM SERVICES",
//           addressLine1: "ALGERIA SQUARE BUILDING NUMBER 12 FIRST FLOOR",
//           addressLine2: "TRIPOLI / LIBYA Libyan Arab Jamahiriya"
//         },
//         hotel: {
//           location: "İSTANBUL ŞİŞLİ",
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
//           usd: 38.6761,
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

//   if (loading) {
//     return (
//       <div className="h-screen flex items-center justify-center bg-gray-100">
//         <div className="text-center">
//           <Loader2 className="animate-spin text-slate-400 mx-auto mb-4" size={40} />
//           <p className="text-slate-600">Loading invoice...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
//         <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
//           <div className="text-red-500 text-lg font-bold mb-4">Error</div>
//           <p className="text-slate-600 mb-6">{error}</p>
//           <button
//             onClick={() => window.history.back()}
//             className="px-4 py-2 bg-[#003d7a] text-white rounded hover:bg-[#002a5c]"
//           >
//             <ArrowLeft size={16} className="inline mr-2" /> Go Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!invoice) {
//     return (
//       <div className="h-screen flex items-center justify-center bg-gray-100">
//         <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
//           <div className="text-slate-500 text-lg mb-4">No invoice data available</div>
//           <button
//             onClick={() => window.history.back()}
//             className="px-4 py-2 bg-[#003d7a] text-white rounded hover:bg-[#002a5c]"
//           >
//             <ArrowLeft size={16} className="inline mr-2" /> Go Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <style>{`
//         * { box-sizing: border-box; margin: 0; padding: 0; }
        
//         body { 
//           background-color: #f5f5f5; 
//           font-family: Arial, sans-serif; 
//           -webkit-print-color-adjust: exact;
//           print-color-adjust: exact;
//         }

//         .invoice-wrapper {
//           background-color: #f5f5f5;
//           padding: 20px;
//           display: flex;
//           justify-content: center;
//         }

//         .invoice-container {
//           background-color: white;
//           width: 210mm;
//           min-height: 297mm;
//           padding: 30px 35px;
//           box-shadow: 0 0 10px rgba(0,0,0,0.1);
//           font-size: 11px;
//           color: #000;
//         }

//         .header-row {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           margin-bottom: 35px;
//         }

//         .company-info {
//           flex: 1;
//           line-height: 1.3;
//         }

//         .company-name {
//           font-size: 11px;
//           font-weight: bold;
//           margin-bottom: 2px;
//         }

//         .company-address {
//           font-size: 11px;
//           font-weight: normal;
//         }

//         .logo-section {
//           width: 120px;
//           text-align: center;
//         }

//         .logo-image {
//           width: 68%;
//           height: auto;
//           display: block;
//           margin-bottom: 3px;
//         }

//         .location-text {
//           font-size: 10px;
//           text-transform: uppercase;
//           color: #666;
//           letter-spacing: 0.5px;
//         }

//         .meta-section {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 15px;
//         }

//         .meta-left {
//           display: flex;
//           flex-direction: column;
//           gap: 2px;
//         }

//         .meta-item {
//           font-size: 11px;
//           line-height: 1.3;
//         }

//         .guest-name {
//           font-size: 11px;
//           font-weight: bold;
//           margin-bottom: 12px;
//         }

//         .guest-details {
//           display: grid;
//           grid-template-columns: 0.7fr 1.1fr 0.9fr 1.5fr 1fr;
//           row-gap: 3px;
//           column-gap: 8px;
//           margin-bottom: 18px;
//           font-size: 10px;
//           line-height: 1.4;
//         }

//         .detail-item {
//           white-space: nowrap;
//           overflow: hidden;
//           text-overflow: ellipsis;
//         }

//         .transaction-table {
//           width: 100%;
//           border-collapse: collapse;
//           margin-bottom: 20px;
//           border: 1px solid #000;
//           font-size: 10px;
//         }

//         .transaction-table thead th {
//           background-color: #e6e6e6;
//           padding: 4px 6px;
//           text-align: left;
//           font-weight: normal;
//           font-size: 10px;
//         }

//         .transaction-table tbody td {
//           border-bottom: none;
//           padding: 3px 6px;
//           vertical-align: top;
//           font-size: 10px;
//         }

//         .transaction-table tbody td:last-child {
//           border-right: none;
//         }

//         .transaction-table tbody tr:last-child td {
//           border-bottom: 1px solid #000;
//         }

//         .desc-row {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//         }

//         .desc-details {
//           display: block;
//           font-size: 9px;
//           margin-top: 2px;
//           font-style: italic;
//           color: #333;
//         }

//         .text-right {
//           text-align: right;
//         }

//         .footer-section {
//           display: flex;
//           justify-content: space-between;
//           gap: 30px;
//         }

//         .footer-left {
//           flex: 1;
//         }

//         .footer-right {
//           width: 320px;
//         }

//         .tax-table {
//           width: 60%;
//           border-collapse: collapse;
//           margin-bottom: 15px;
//           font-size: 9px;
//         }

//         .tax-table th,
//         .tax-table td {
//           border: 1px solid #ccc;
//           padding: 2px 4px;
//           text-align: center;
//         }

//         .tax-table th {
//           background-color: #e6e6e6;
//           font-weight: normal;
//         }

//         .exchange-rates {
//           font-size: 10px;
//           line-height: 1.5;
//           margin-bottom: 12px;
//         }

//         .total-euro {
//           font-size: 10px;
//           margin-bottom: 12px;
//         }

//         .amount-in-words {
//           font-size: 10px;
//           line-height: 1.4;
//         }

//         .summary-line {
//           display: flex;
//           justify-content: space-between;
//           font-size: 10px;
//           margin-bottom: 2px;
//         }

//         .summary-line.spacer {
//           margin-top: 15px;
//         }

//         .summary-line.final {
//           margin-top: 15px;
//         }

//         .action-buttons {
//           display: flex;
//           justify-content: space-between;
//           margin-bottom: 20px;
//           padding: 0 20px;
//         }

//         .no-print {
//           display: block;
//         }

//         @media print {
//           body {
//             background-color: white;
//             margin: 0;
//           }

//           .invoice-wrapper {
//             background-color: white;
//             padding: 0;
//           }

//           .invoice-container {
//             width: 100%;
//             margin: 0;
//             padding: 30px;
//             box-shadow: none;
//           }

//           .transaction-table thead th {
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }

//           .tax-table th {
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }

//           .no-print {
//             display: none !important;
//           }
//         }
//       `}</style>

//       <div className="invoice-wrapper">
//         <div className="no-print action-buttons" style={{maxWidth: '210mm', width: '100%'}}>
//           <button
//             onClick={() => window.history.back()}
//             style={{
//               display: 'flex',
//               alignItems: 'center',
//               padding: '8px 16px',
//               backgroundColor: '#000',
//               color: 'white',
//               border: 'none',
//               borderRadius: '4px',
//               cursor: 'pointer'
//             }}
//           >
//             <ArrowLeft size={16} style={{marginRight: '8px'}} /> Back
//           </button>

//           <div style={{display: 'flex', gap: '8px'}}>
//             <button
//               onClick={handleDownloadPDF}
//               disabled={pdfLoading}
//               style={{
//                 padding: '8px 16px',
//                 backgroundColor: '#1d4ed8',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '4px',
//                 cursor: 'pointer',
//                 opacity: pdfLoading ? 0.5 : 1
//               }}
//             >
//               {pdfLoading ? (
//                 <>
//                   <Loader2 size={16} style={{display: 'inline', marginRight: '8px', animation: 'spin 1s linear infinite'}} />
//                   Generating...
//                 </>
//               ) : (
//                 <>
//                   <Download size={16} style={{display: 'inline', marginRight: '8px'}} /> Download PDF
//                 </>
//               )}
//             </button>
//             <button
//               onClick={handlePrint}
//               style={{
//                 padding: '8px 16px',
//                 backgroundColor: 'white',
//                 color: '#1d4ed8',
//                 border: '1px solid #1d4ed8',
//                 borderRadius: '4px',
//                 cursor: 'pointer'
//               }}
//             >
//               <Printer size={16} style={{display: 'inline', marginRight: '8px'}} /> Print
//             </button>
//           </div>
//         </div>

//         <div className="invoice-container">
          
//           <div className="header-row">
//             <div className="company-info">
//               <div className="company-name">{invoice.meta.company.name}</div>
//               <div className="company-address">{invoice.meta.company.addressLine1}</div>
//               <div className="company-address">{invoice.meta.company.addressLine2}</div>
//             </div>
//             <div className="logo-section">
//               <img src={invoice.meta.hotel.logoUrl} alt="TRYP by Wyndham" className="logo-image" />
//             </div>
//           </div>

//           <div className="meta-section">
//             <div className="meta-left">
//               <div className="meta-item">V.D. &nbsp; : &nbsp; {invoice.meta.vatOffice}</div>
//               <div className="meta-item">V. NO : &nbsp; {invoice.meta.vatNo}</div>
//             </div>
//             <div className="meta-item">Date/Tarih : &nbsp; {invoice.meta.date}</div>
//           </div>

//           <div className="guest-name">{invoice.guest.name}</div>

//           <div className="guest-details">
//             <div className="detail-item">Room/Oda : {invoice.guest.room}</div>
//             <div className="detail-item">Arrival/Giriş : {invoice.guest.arrival}</div>
//             <div className="detail-item">Adult/Yetişkin : {invoice.guest.adults}</div>
//             <div className="detail-item">Passport No - TC No : {invoice.guest.passport}</div>
//             <div className="detail-item">User/Kullanıcı : {invoice.guest.user}</div>

//             <div className="detail-item">Folio No : {invoice.meta.folio}</div>
//             <div className="detail-item">Departure/Çıkış : {invoice.guest.departure}</div>
//             <div className="detail-item">Child/Çocuk : {invoice.guest.children}</div>
//             <div className="detail-item">Crs No/Voucher No : </div>
//             <div className="detail-item">Csh No/Kasa No : {invoice.guest.cashierNo}</div>

//             <div></div>
//             <div></div>
//             <div></div>
//             <div></div>
//             <div className="detail-item">Page/Sayfa : 1</div>
//           </div>

//           <table className="transaction-table">
//             <thead>
//               <tr>
//                 <th style={{width: '55%'}}>Açıklama/Description</th>
//                 <th style={{width: '15%'}}>Date/Tarih</th>
//                 <th className="text-right" style={{width: '15%'}}>Debit/Borç</th>
//                 <th className="text-right" style={{width: '15%'}}>Credit/Alacak</th>
//               </tr>
//             </thead>
//             <tbody>
//               {invoice.transactions.map((txn) => (
//                 <tr key={txn.id}>
//                   <td>
//                     <div className="desc-row">
//                       <span>{txn.description}</span>
//                       <span>{txn.rate}</span>
//                     </div>
//                     {txn.details && <span className="desc-details">{txn.details}</span>}
//                   </td>
//                   <td>{txn.date}</td>
//                   <td className="text-right">
//                     {txn.debit ? txn.debit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
//                   </td>
//                   <td className="text-right">
//                     {txn.credit ? txn.credit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           <div className="footer-section">
            
//             <div className="footer-left">
//               <table className="tax-table">
//                 <thead>
//                   <tr>
//                     <th>Tax Rate<br/>KDV Oranı</th>
//                     <th>Tax Base<br/>KDV Matrahı</th>
//                     <th>Tax Amount<br/>KDV Tutarı</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td>{invoice.totals.taxRate}</td>
//                     <td>{invoice.totals.taxBase.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
//                     <td>{invoice.totals.taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
//                   </tr>
//                 </tbody>
//               </table>

//               <div className="exchange-rates">
//                 Room Check-in USD Exch. Rate &nbsp;&nbsp; {invoice.totals.exchangeRates.usd} TRY<br/>
//                 Room Check-in EUR Exch. Rate &nbsp;&nbsp; {invoice.totals.exchangeRates.eur.toFixed(5)} TRY
//               </div>

//               <div className="total-euro">
//                 Total in EUR : &nbsp;&nbsp; {invoice.totals.totalEuro.toFixed(2)} EUR
//               </div>

//               <div className="amount-in-words">
//                 {invoice.totals.textAmount}
//               </div>
//             </div>

//             <div className="footer-right">
//               <div className="summary-line">
//                 <span>Total Amount/Toplam Tutar</span>
//                 <span>{invoice.totals.summary.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//               </div>
//               <div className="summary-line">
//                 <span>Taxable Amount/KDV Matrah</span>
//                 <span>{invoice.totals.summary.taxableAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//               </div>
//               <div className="summary-line">
//                 <span>Total VAT/Hesaplanan KDV</span>
//                 <span>{invoice.totals.summary.totalVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//               </div>
//               <div className="summary-line">
//                 <span>Total Acc Tax/Konaklama Vergisi</span>
//                 <span>{invoice.totals.summary.accTax.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//               </div>
//               <div className="summary-line">
//                 <span>Total Inc. Vat/KDV Dahil Tutar</span>
//                 <span>{invoice.totals.summary.totalIncVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//               </div>

//               <div className="summary-line spacer">
//                 <span>Payments/Odemeler</span>
//                 <span></span>
//               </div>
//               <div className="summary-line">
//                 <span>Deposit Transfer at C/IN</span>
//                 <span>{invoice.totals.summary.deposit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
//               </div>

//               <div className="summary-line final">
//                 <span>Balance/Bakiye</span>
//                 <span>{invoice.totals.summary.balance.toFixed(2)}</span>
//               </div>
//             </div>
//           </div>

//         </div>
//       </div>
//     </>
//   );
// };

// export default TRYPInvoiceView;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import logo from '../../../public/TRYP-Logo.png';
import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
import toast from "react-hot-toast";
import { InvoiceTemplate } from "../../components";

const TRYPInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (invoiceData) {
      const transformed = transformInvoiceData(invoiceData);
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

    // --- Transaction Processing ---
    
    // 1. Accommodation Rows
    accommodationDetails.forEach((acc, index) => {
      transactions.push({
        id: `acc-${index}`,
        description: "Package Rate",
        // Format rate exactly like Grand Aras: EUR amount / Exchange Rate
        rate: `${(data.actualRate || 0).toFixed(2)} EUR / ${(data.exchangeRate || 0).toFixed(5)}`,
        date: formatDate(acc.date || data.arrivalDate),
        debit: acc.rate || 0,
        credit: null,
        sortDate: new Date(acc.date || data.arrivalDate) // Helper for sorting if needed
      });
    });

    // 2. Other Services
    otherServices.forEach((service, index) => {
      transactions.push({
        id: `svc-${index}`,
        description: service.name || service.service_name || "Service",
        rate: "", // Services usually don't show the rate breakdown in this column
        date: formatDate(service.date || service.service_date),
        debit: service.amount || service.gross_amount || 0,
        credit: null,
        sortDate: new Date(service.date || service.service_date)
      });
    });

    // --- Calculations (Preserved from TRYP Logic) ---
    
    // d = room taxable base
    const d = parseFloat(data.taxable_amount_room || data.taxableAmountRoom || 0);
    // e = sum of services taxable
    const e = otherServices.reduce((sum, s) => sum + parseFloat(s.taxable_amount || 0), 0);
    // f = d + e (KDV Matrahı)
    const f = d + e;
    // g = room VAT 10%
    const g = parseFloat(data.vat_10_percent || data.vatTotal || 0);
    // h = services VAT 20%
    const h = otherServices.reduce((sum, s) => sum + parseFloat(s.vat_20_percent || 0), 0);
    // i = total VAT
    const i = g + h;
    // j = acc tax = d * 0.02
    const j = Number((d * 0.02).toFixed(2));
    // k = total inc VAT
    const k = f + i + j;
    
    const exchangeRate = parseFloat(data.exchangeRate || data.exchange_rate || 0);
    const m = (exchangeRate > 0) ? Number((k / exchangeRate).toFixed(2)) : 0;

    return {
      meta: {
        folio: data.folio_number || data.voucherNo || "",
        date: formatDate(data.invoiceDate),
        vatOffice: "LIBYA",
        vatNo: "2222222222",
        company: {
          name: "Azar Tourism Services",
        addressLine1: "Algeria Square Building Number 12 First Floor, Tripoli, Libya, P.O.BOX Number: 1254",
          
        },
        hotel: { logoUrl: logo }
      },
      guest: {
        name: data.guestName || "Guest",
        room: data.roomNo || "",
        arrival: formatDate(data.arrivalDate),
        departure: formatDate(data.departureDate),
        adults: data.paxAdult || 1,
        children: data.paxChild || 0,
        passport: data.passportNo || "",
        user: data.userId || "",
        cashierNo: data.batchNo || "1",
        voucherNo: data.voucherNo || "", // Added to match Grand Aras fields
        crsNo: "" 
      },
      transactions,
      totals: {
        taxTable: [
          { rate: "%10", base: d, amount: g },
          { rate: "%20", base: e, amount: h }
        ].filter(tax => tax.base > 0 || tax.amount > 0),
        exchangeRates: { 
          usd: 38.6761, // specific hardcoded value from your example
          eur: exchangeRate 
        },
        totalEuro: m,
        summary: {
          totalAmount: k, // Check if this should be f or k based on label. Usually "Total Amount" before tax is f.
          // Grand Aras uses: totalAmount = totalTaxableAmount (f). Let's stick to your TRYP logic or Grand Aras?
          // Grand Aras: totalAmount = Taxable. TRYP: totalAmount = Grand Total.
          // I will use Grand Aras logic for the SUMMARY display to match the visual expectations if the labels are "Total Amount" vs "Inc VAT"
          
          // Re-mapping to match Grand Aras visual slots:
          totalAmount: f, // Matches "Total Amount" slot (usually taxable base)
          taxableAmount: f, // Matches "Taxable Amount" slot
          totalVat: i,
          accTax: j,
          totalIncVat: k,
          deposit: -k,
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

  // Helper component from Grand Aras
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
      {/* --- STYLES --- 
         Copied exactly from GrandArasInvoiceView to ensure identical look 
      */}
      <style>{`
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size:9.5px; }

        .tryp-invoice-container {
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
        /* Adjusted logo size slightly for TRYP shape if needed, but kept class same */
        .logo-img { max-width: 88px; height: auto; }

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
          .tryp-invoice-container { width: 100%; padding: 20px; box-shadow: none; }
          .main-table thead tr, .tax-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="tryp-invoice-container">
        <div className="header-section">
          <div className="company-details">
            <div className="company-sub">{invoice.meta.company.name}</div>
            <div>{invoice.meta.company.addressLine1}</div>
            <div>{invoice.meta.company.addressLine2}</div>
          </div>
          <div className="logo-container">
            <img src={invoice.meta.hotel.logoUrl} alt="Logo" className="logo-img" />
          </div>
        </div>

        <div className="meta-row">
          <div>V.D. &nbsp; : &nbsp; {invoice.meta.vatOffice}</div>
          <div style={{marginRight: "5px"}}>Date/Tarih : &nbsp; {invoice.meta.date}</div>
        </div>
        <div className="meta-row">
          <div>V. NO : &nbsp; {invoice.meta.vatNo}</div>
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
          <InfoItem label="Crs No/Voucher No" value={invoice.guest.voucherNo} width="110px" />
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
              {/* Added USD row as per original TRYP data */}
              
              Room Check-in EUR Exch. Rate &nbsp;&nbsp; {invoice.totals.exchangeRates.eur.toFixed(5)} TRY<br/>
              Total in EUR : &nbsp;&nbsp; {invoice.totals.totalEuro.toFixed(2)} EUR
            </div>
            
             <div className="amount-in-words">
              {invoice.totals.textAmount}
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

export default TRYPInvoiceView;