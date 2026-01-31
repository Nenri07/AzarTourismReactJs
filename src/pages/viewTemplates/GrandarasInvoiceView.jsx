import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { Download, Printer, ArrowLeft, Loader2 } from "lucide-react";
import logo from '../../../public/grandaras-logo.png';
import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
import toast from "react-hot-toast";

const GrandArasInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (invoiceData) {
      console.log("✅ Using invoiceData prop:", invoiceData);
      const transformed = transformInvoiceData(invoiceData);
      console.log("✅ Transformed Grand Aras data:", transformed);
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
    console.log("🔄 Transforming Grand Aras data:", data);
    
    if (!data) {
      console.error("❌ No data to transform");
      return null;
    }

    const accommodationDetails = data.accommodationDetails || [];
    const otherServices = data.otherServices || [];
    
    const transactions = [];
    
    // Add deposit transfer first if exists
    const totalIncVat = parseFloat(data.grandTotal || 0);
    if (totalIncVat > 0) {
      transactions.push({
        id: transactions.length + 1,
        description: "Deposit Transfer at C/IN",
        rate: "",
        date: formatDate(data.arrivalDate),
        debit: null,
        credit: totalIncVat
      });
    }
    
    // Build transactions from accommodation details
    accommodationDetails.forEach((acc) => {
      transactions.push({
        id: transactions.length + 1,
        description: "Room",
        rate: `${(data.actualRate || 0).toFixed(2)} EUR / ${(data.exchangeRate || 0).toFixed(5)}`,
        date: formatDate(acc.date),
        debit: acc.rate || 0,
        credit: null
      });
    });
    
    // Add other services
    otherServices.forEach(service => {
      transactions.push({
        id: transactions.length + 1,
        description: service.name || "Service",
        rate: "",
        date: formatDate(service.date),
        debit: service.amount || 0,
        credit: null
      });
    });

    const totalAmount = parseFloat(data.subTotal || 0);
    const totalVAT = parseFloat(data.vatTotal || 0);
    const totalAccTax = (parseFloat(data.sellingRate || 0) * 0.02) * (data.nights || 0);
    const totalEuro = (data.actualRate || 0) * (data.nights || 0);

    return {
      meta: {
        folio: data.voucherNo || "",
        date: formatDate(data.invoiceDate),
        vatOffice: "",
        vatNo: "2222222222",
        company: {
          name: "AZAR TOURISM",
          subName: "Azar Tourism Services",
          addressLine1: "Algeria Square Building Number 12 First Floor, Tripoli, Libya, P.O.BOX Number: 1254",
          addressLine2: "Tripoli Libya,",
          addressLine3: "Tripoli, Libyan Arab Jamahiriya"
        },
        hotel: {
          logoUrl: logo
        }
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
        cashierNo: data.batchNo || "1"
      },
      transactions: transactions,
      totals: {
        taxRate: "%10",
        taxBase: totalAmount,
        taxAmount: totalVAT,
        exchangeRates: {
          usd: 35.2892,
          eur: data.exchangeRate || 0
        },
        totalEuro: totalEuro,
        textAmount: numberToTurkishWords(totalIncVat),
        summary: {
          totalAmount: totalAmount,
          taxableAmount: totalAmount,
          totalVat: totalVAT,
          accTax: totalAccTax,
          totalIncVat: totalIncVat,
          deposit: -totalIncVat,
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
    } catch {
      return dateString;
    }
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
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
          background-color: #525659; 
          font-family: Arial, sans-serif; 
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .invoice-wrapper {
          background-color: #525659;
          padding: 20px;
          display: flex;
          justify-content: center;
        }

        .invoice-container {
          background-color: white;
          width: 850px;
          min-height: 1100px;
          padding: 40px 50px;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
          font-size: 11px;
          color: #000;
          position: relative;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }

        .company-details {
          width: 60%;
          line-height: 1.3;
        }

        .company-name {
          font-weight: normal;
          font-size: 12px;
          text-transform: uppercase;
        }

        .company-sub {
          font-size: 11px;
        }

        .logo-container {
          text-align: right;
          width: 30%;
        }

        .logo-img {
          max-width: 125px;
          height: auto;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 11px;
        }

        .guest-name {
          margin-top: 10px;
          margin-bottom: 15px;
          font-size: 12px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr 1fr 1.8fr 1.2fr;
          row-gap: 3px;
          margin-bottom: 20px;
          font-size: 11px;
        }

        .grid-item {
          white-space: nowrap;
        }

        .main-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border: 1px solid #000;
        }

        .main-table thead tr {
          background-color: #f0f0f0;
          border-bottom: 1px solid #000;
        }

        .main-table th {
          text-align: left;
          padding: 4px 6px;
          font-weight: normal;
          font-size: 11px;
        }

        .main-table td {
          padding: 4px 6px;
          vertical-align: top;
          font-size: 11px;
        }

        .col-desc { width: 50%; }
        .col-date { width: 15%; }
        .col-debit { width: 15%; text-align: right; }
        .col-credit { width: 15%; text-align: right; }

        .desc-with-rate {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .rate-value {
          padding-right: 20px;
        }

        .text-right {
          text-align: right;
        }

        .footer-section {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }

        .footer-left {
          width: 45%;
        }

        .footer-right {
          width: 45%;
          text-align: right;
        }

        .tax-table {
          width: 90%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 10px;
        }

        .tax-table th {
          background-color: #f0f0f0;
          text-align: center;
          padding: 3px;
          font-weight: normal;
        }

        .tax-table td {
          text-align: center;
          padding: 3px;
        }

        .exchange-info {
          line-height: 1.4;
          margin-bottom: 15px;
          font-size: 11px;
        }

        .text-amount {
          font-size: 11px;
          margin-top: 10px;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 11px;
        }

        .payment-header {
          margin-top: 15px;
          margin-bottom: 3px;
          text-align: left;
        }

        .balance-row {
          margin-top: 15px;
          font-weight: bold;
        }

        .action-buttons {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 0 20px;
        }

        .no-print {
          display: block;
        }

        @media print {
          body {
            background-color: white;
            margin: 0;
          }

          .invoice-wrapper {
            background-color: white;
            padding: 0;
          }

          .invoice-container {
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
          }

          .main-table thead tr {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .tax-table th {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="invoice-wrapper">
        <div className="no-print action-buttons" style={{maxWidth: '850px', width: '100%'}}>
          <button
            onClick={() => window.history.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} style={{marginRight: '8px'}} /> Back
          </button>

          <div style={{display: 'flex', gap: '8px'}}>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1d4ed8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: pdfLoading ? 0.5 : 1
              }}
            >
              {pdfLoading ? (
                <>
                  <Loader2 size={16} style={{display: 'inline', marginRight: '8px', animation: 'spin 1s linear infinite'}} />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={16} style={{display: 'inline', marginRight: '8px'}} /> Download PDF
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#1d4ed8',
                border: '1px solid #1d4ed8',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <Printer size={16} style={{display: 'inline', marginRight: '8px'}} /> Print
            </button>
          </div>
        </div>

        <div className="invoice-container">
          
          <div className="header-section">
            <div className="company-details">
              <div className="company-name">{invoice.meta.company.name}</div>
              <div className="company-sub">{invoice.meta.company.subName}</div>
              <div>{invoice.meta.company.addressLine1}</div>
              <div>{invoice.meta.company.addressLine2}</div>
              <div>{invoice.meta.company.addressLine3}</div>
            </div>
            <div className="logo-container">
              <img src={invoice.meta.hotel.logoUrl} alt="Grand Aras Hotel" className="logo-img" />
            </div>
          </div>

          <div className="meta-row">
            <div>V.D. &nbsp; : &nbsp; {invoice.meta.vatOffice}</div>
            <div>Date/Tarih : &nbsp; {invoice.meta.date}</div>
          </div>
          <div className="meta-row">
            <div>V. NO : &nbsp; {invoice.meta.vatNo}</div>
            <div></div>
          </div>

          <div className="guest-name">{invoice.guest.name}</div>

          <div className="info-grid">
            <div className="grid-item">Room/Oda : {invoice.guest.room}</div>
            <div className="grid-item">Arrival/Giriş &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {invoice.guest.arrival}</div>
            <div className="grid-item">Adult/Yetişkin : {invoice.guest.adults}</div>
            <div className="grid-item">Passport No - TC No : {invoice.guest.passport}</div>
            <div className="grid-item">User/Kullanıcı &nbsp;&nbsp;&nbsp;: {invoice.guest.user}</div>

            <div className="grid-item">Folio No &nbsp;&nbsp;: {invoice.meta.folio}</div>
            <div className="grid-item">Departure/Çıkış &nbsp;&nbsp;: {invoice.guest.departure}</div>
            <div className="grid-item">Child/Çocuk &nbsp;&nbsp;&nbsp;: {invoice.guest.children}</div>
            <div className="grid-item">Crs No/Voucher No &nbsp;:</div>
            <div className="grid-item">Csh No/Kasa No : {invoice.guest.cashierNo}</div>

            <div className="grid-item"></div>
            <div className="grid-item"></div>
            <div className="grid-item"></div>
            <div className="grid-item"></div>
            <div className="grid-item">Page/Sayfa &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: 1</div>
          </div>

          <table className="main-table">
            <thead>
              <tr>
                <th className="col-desc">Açıklama/Description</th>
                <th className="col-date">Date/Tarih</th>
                <th className="col-debit">Debit/Borç</th>
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
                  <td className="text-right">
                    {txn.debit ? txn.debit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
                  </td>
                  <td className="text-right">
                    {txn.credit ? txn.credit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ''}
                  </td>
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
                  <tr>
                    <td>{invoice.totals.taxRate}</td>
                    <td>{invoice.totals.taxBase.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td>{invoice.totals.taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                </tbody>
              </table>

              <div className="exchange-info">
                Room Check-in USD Exch. Rate &nbsp;&nbsp; {invoice.totals.exchangeRates.usd.toFixed(4)} TRY<br/>
                Room Check-in EUR Exch. Rate &nbsp;&nbsp; {invoice.totals.exchangeRates.eur.toFixed(4)} TRY<br/>
                Total in EUR : &nbsp;&nbsp; {invoice.totals.totalEuro.toFixed(2)} EUR
              </div>

              <div className="text-amount">
                {invoice.totals.textAmount}
              </div>
            </div>

            <div className="footer-right">
              <div className="totals-row">
                <span>Total Amount/Toplam Tutar</span>
                <span>{invoice.totals.summary.totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="totals-row">
                <span>Taxable Amount/KDV Matrahı</span>
                <span>{invoice.totals.summary.taxableAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="totals-row">
                <span>Total VAT/Hesaplanan KDV</span>
                <span>{invoice.totals.summary.totalVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="totals-row">
                <span>Total Acc Tax/Konaklama Vergisi</span>
                <span>{invoice.totals.summary.accTax.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="totals-row">
                <span>Total Inc.Vat/KDV Dahil Tutar</span>
                <span>{invoice.totals.summary.totalIncVat.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>

              <div className="payment-header">Payments/Ödemeler</div>
              <div className="totals-row">
                <span>Deposit Transfer at C/IN</span>
                <span>{invoice.totals.summary.deposit.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>

              <div className="totals-row balance-row">
                <span>Balance/Bakiye</span>
                <span>{invoice.totals.summary.balance.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default GrandArasInvoiceView;