import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import logo from '../../../public/cvk-logo.jpeg';
import { Download, Printer, ArrowLeft, Loader2 } from "lucide-react";
import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
import toast from "react-hot-toast";

export default function CVKInvoiceView({ invoiceData }) {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (invoiceData) {
      console.log("✅ Using invoiceData prop:", invoiceData);
      const transformed = transformInvoiceData(invoiceData);
      console.log("✅ Transformed data:", transformed);
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
      
      // Handle nested structure
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
    console.log("🔄 Transforming data:", data);
    
    if (!data) {
      console.error("❌ No data to transform");
      return null;
    }

    const accommodationDetails = data.accommodationDetails || [];
    const otherServices = data.otherServices || [];
    
    const transactions = [];
    
    // Build transactions from accommodation details
    accommodationDetails.forEach((acc) => {
      transactions.push({
        description: "Accommodation Package",
        foreignAmount: `${(data.actualRate || 0).toFixed(2)} EUR / ${(data.exchangeRate || 0).toFixed(4)}`,
        date: formatDate(acc.date),
        debit: formatCurrency(acc.rate || 0),
        credit: ""
      });
      
      const vatAmount = (acc.rate || 0) * 0.1;
      transactions.push({
        description: "VAT %10",
        foreignAmount: "",
        date: formatDate(acc.date),
        debit: formatCurrency(vatAmount),
        credit: ""
      });
      
      const accTax = (acc.rate || 0) * 0.02;
      transactions.push({
        description: "Accommodation TAX",
        foreignAmount: "",
        date: formatDate(acc.date),
        debit: formatCurrency(accTax),
        credit: ""
      });
    });
    
    // Add other services
    otherServices.forEach(service => {
      transactions.push({
        description: service.name || "Service",
        foreignAmount: "",
        date: formatDate(service.date),
        debit: formatCurrency(service.amount || 0),
        credit: ""
      });
    });

    const totalAmount = parseFloat(data.subTotal || 0);
    const totalVAT = parseFloat(data.vatTotal || 0);
    const totalAccTax = (parseFloat(data.sellingRate || 0) * 0.02) * (data.nights || 0);
    const totalIncVat = parseFloat(data.grandTotal || 0);

    const transformed = {
      companyName: "Azar Tourism",
      companyAddress: "Algeria Square Building Number 12 First Floor, Tripoli, Libya.",
      companyCity: "1254 Tripoli Lebanon",
      vd: data.vd || "",
      vno: data.vNo || "",
      guestName: data.guestName || "Guest",
      roomNo: data.roomNo || "",
      folioNo: data.voucherNo || "",
      arrivalDate: formatDate(data.arrivalDate),
      departureDate: formatDate(data.departureDate),
      adults: String(data.paxAdult || 1),
      children: String(data.paxChild || 0),
      passportNo: data.passportNo || "",
      crsNo: data.confirmation || "",
      user: data.userId || "",
      cashNo: data.voucherNo || "",
      pageNo: data.batchNo || "1",
      invoiceDate: formatDate(data.invoiceDate),
      
      transactions: transactions,
      
      taxRate: "%10",
      taxBase: formatCurrency(totalAmount),
      taxAmount: formatCurrency(totalVAT),
      exchangeRate: `${(data.exchangeRate || 0).toFixed(4)} TRY`,
      totalInEUR: `${(totalIncVat / (data.exchangeRate || 1)).toFixed(2)} EUR`,
      totalAmount: formatCurrency(totalAmount),
      taxableAmount: formatCurrency(totalAmount),
      totalVAT: formatCurrency(totalVAT),
      totalAccTax: formatCurrency(totalAccTax),
      totalIncVat: formatCurrency(totalIncVat),
      directBilling: formatCurrency(-totalIncVat),
      balance: "0.00"
    };

    console.log("✅ Transformation complete:", transformed);
    return transformed;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return `${day}.${month}.${year}`;
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("PDF download feature coming soon!");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin text-slate-400 mx-auto mb-4" size={40} />
          <p className="text-slate-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-lg font-bold mb-4">Error</div>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-[#003d7a] text-white rounded hover:bg-[#002a5c]"
          >
            <ArrowLeft size={16} className="inline mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-slate-500 text-lg mb-4">No invoice data available</div>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-[#003d7a] text-white rounded hover:bg-[#002a5c]"
          >
            <ArrowLeft size={16} className="inline mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      <style>{`
        @page { 
          size: A4; 
          margin: 0; 
        }
        
        .invoice-document {
          font-family: Arial, sans-serif;
          font-size: 11px;
          font-weight:400;
          margin: 0;
          padding: 45px;
          color: #000;
          line-height: 1.2;
          background: white;
          max-width: 210mm;
          min-height: 297mm;
        }

        .header { margin-bottom: 25px; }
        .logo-box { margin-bottom: 15px; }
        .logo-img { max-width: 240px; height: auto; }
        .company-address { margin-bottom: 25px; font-size: 10.5px; }
        .meta-container { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .guest-name { margin: 10px 0; }
        .guest-grid {
          display: grid;
          grid-template-columns: 1.2fr 1.2fr 1fr 1.3fr 1fr;
          gap: 2px;
          margin-bottom: 25px;
          white-space: nowrap;
        }
        .main-table { width: 100%; border-collapse: collapse; border: 1px solid #000; }
        .main-table th { background-color: #ededed; border-bottom: 1px solid #000; padding: 4px 6px; font-weight: normal; text-align: left; }
        .main-table td { padding: 3px 6px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .desc-col { display: flex; justify-content: space-between; width: 100%; }
        .desc-val { margin-right: 60px; }
        .footer-container { display: flex; justify-content: space-between; margin-top: 20px; }
        .footer-left { width: 45%; }
        .footer-right { width: 38%; }
        .tax-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .tax-table th { background-color: #ededed; padding: 4px; font-weight: normal; }
        .tax-table td { padding: 4px; text-align: right; }
        .tax-table .text-center { text-align: center; }
        .exchange-rate { margin-top: 10px; }
        .exchange-row { display: flex; justify-content: space-between; padding-right: 30px; margin-bottom: 2px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .total-bold { font-weight: bold; padding-top: 8px; }
        .balance-box { margin-top: 15px; font-weight: bold; font-size: 11px; display: flex; justify-content: space-between; }

        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .invoice-document { padding: 30px; box-shadow: none; }
          .main-table th, .tax-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="max-w-[210mm] mx-auto">
        <div className="no-print flex justify-between mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center px-4 py-2 bg-black text-white border rounded hover:bg-gray-700"
          >
            <ArrowLeft size={16} className="mr-2" /> Back
          </button>

          <div className="space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50"
            >
              {pdfLoading ? (
                <>
                  <Loader2 size={16} className="inline mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={16} className="inline mr-2" /> Download PDF
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white border border-blue-700 text-blue-700 rounded hover:bg-blue-50"
            >
              <Printer size={16} className="inline mr-2" /> Print
            </button>
          </div>
        </div>

        <div className="invoice-document shadow-lg print:shadow-none">
          <div className="header">
            <div className="logo-box">
              <img 
                src={logo} 
                alt="CVK PARK BOSPHORUS HOTEL" 
                className="logo-img"
              />
            </div>
            
            <div className="company-address">
              {invoice.companyName}<br/>
              {invoice.companyAddress}<br/>
              {invoice.companyCity}
            </div>
            
            <div className="meta-container">
              <div>
                V.D. : {invoice.vd}<br/>
                V.No : {invoice.vno}
              </div>
              <div className="text-right">
                Date/Tarih : {invoice.invoiceDate}
              </div>
            </div>
            
            <div className="guest-name">{invoice.guestName}</div>
            
            <div className="guest-grid">
              <div>Room/Oda : {invoice.roomNo}</div>
              <div>Arrival/Giriş : {invoice.arrivalDate}</div>
              <div>Adult/Yetişkin : {invoice.adults}</div>
              <div>Passport No - TC No : {invoice.passportNo}</div>
              <div>User/Kullanıcı : {invoice.user}</div>
              
              <div>Folio No : {invoice.folioNo}</div>
              <div>Departure/Çıkış : {invoice.departureDate}</div>
              <div>Child/Çocuk : {invoice.children}</div>
              <div>Crs No/Voucher No : {invoice.crsNo}</div>
              <div>Csh No/Kasa No : {invoice.cashNo}</div>
              
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div>Page/Sayfa : {invoice.pageNo}</div>
            </div>
          </div>

          <table className="main-table">
            <thead>
              <tr>
                <th style={{width: "55%"}}>Açıklama/Description</th>
                <th className="text-center" style={{width: "15%"}}>Date/Tarih</th>
                <th className="text-right" style={{width: "15%"}}>Debit/Borç</th>
                <th className="text-right" style={{width: "15%"}}>Credit/Alacak</th>
              </tr>
            </thead>
            <tbody>
              {invoice.transactions.map((transaction, index) => (
                <tr key={index} style={(index + 1) % 3 === 0 ? {borderBottom: "0.5px solid #eee"} : {}}>
                  <td>
                    {transaction.foreignAmount ? (
                      <div className="desc-col">
                        <span>{transaction.description}</span>
                        <span className="desc-val">{transaction.foreignAmount}</span>
                      </div>
                    ) : (
                      transaction.description
                    )}
                  </td>
                  <td className="text-center">{transaction.date}</td>
                  <td className="text-right">{transaction.debit}</td>
                  <td className="text-right">{transaction.credit}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="footer-container">
            <div className="footer-left">
              <table className="tax-table">
                <thead>
                  <tr>
                    <th className="text-center">Tax Rate<br/>KDV Oranı</th>
                    <th>Tax Base<br/>KDV Matrahı</th>
                    <th>Tax Amount<br/>KDV Tutarı</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center">{invoice.taxRate}</td>
                    <td>{invoice.taxBase}</td>
                    <td>{invoice.taxAmount}</td>
                  </tr>
                </tbody>
              </table>
              
              <div className="exchange-rate">
                <div className="exchange-row">
                  <span>Room Check-in EUR Exch. Rate</span>
                  <span>{invoice.exchangeRate}</span>
                </div>
                <div className="exchange-row">
                  <span>Total in EUR: {invoice.totalInEUR}</span>
                  <span></span>
                </div>
              </div>
            </div>

            <div className="footer-right">
              <div className="totals-row">
                <span>Total Amount/Toplam Tutar</span>
                <span>{invoice.totalAmount}</span>
              </div>
              <div className="totals-row">
                <span>Taxable Amount/KDV Matrah</span>
                <span>{invoice.taxableAmount}</span>
              </div>
              <div className="totals-row">
                <span>Total VAT/Hesaplanan KDV</span>
                <span>{invoice.totalVAT}</span>
              </div>
              <div className="totals-row">
                <span>Total Acc Tax/Konaklama Vergisi</span>
                <span>{invoice.totalAccTax}</span>
              </div>
              <div className="totals-row total-bold">
                <span>Total Inc.Vat/KDV Dahil Tutar</span>
                <span>{invoice.totalIncVat}</span>
              </div>
              
              <div style={{marginTop: "15px"}}>
                <div className="totals-row">
                  <span>Payments/Ödemeler</span>
                  <span></span>
                </div>
                <div className="totals-row">
                  <span>Direct Billing/City Ledger</span>
                  <span>{invoice.directBilling}</span>
                </div>
              </div>

              <div className="balance-box">
                <span>Balance/Bakiye</span>
                <span>{invoice.balance}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
