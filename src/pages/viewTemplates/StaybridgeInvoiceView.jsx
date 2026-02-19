import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
const logo = '/staybridge-logo.png';
import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
import toast from "react-hot-toast";
import { InvoiceTemplate } from "../../components";
import html2pdf from 'html2pdf.js';

const StaybridgeInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);
  const ROWS_PER_PAGE = 38;

  const isPdfDownload = location.pathname.includes("/download-pdf");

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

  useEffect(() => {
    if (isPdfDownload && invoice && invoiceRef.current) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice]);

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

    const otherServices = data.otherServices || [];
    const transactions = [];

    const nights = data.nights || 1;
    const dailyRoomAmount = (data.total_room_all_nights || 0) / nights;

    for (let i = 0; i < nights; i++) {
        const currentDate = new Date(data.arrivalDate);
        currentDate.setDate(currentDate.getDate() + i);

        transactions.push({
            id: i + 1,
            description: "Room",
            rate: `${(data.actualRate || 0).toFixed(2)} EUR / ${(data.exchangeRate || 0).toFixed(5)}`,
            date: formatDate(currentDate),
            debit: dailyRoomAmount.toFixed(2),
            credit: null,
            sortDate: new Date(currentDate)
        });
    }

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

    transactions.sort((a, b) => a.sortDate - b.sortDate);
    transactions.forEach((txn, index) => { txn.id = index + 1; });

    const taxableAmountRoom = parseFloat(data.taxable_amount_room || data.taxable_amount || 0);
    const taxableAmountServices = otherServices.reduce((sum, s) => sum + parseFloat(s.taxable_amount || 0), 0);
    const totalTaxableAmount = taxableAmountRoom + taxableAmountServices;

    const vat10Percent = parseFloat(data.vat7 || data.vat_10_percent || data.vat1_10 || 0);
    const otherServicesVat = otherServices.reduce((sum, s) => sum + parseFloat(s.vat_20_percent || 0), 0);
    const totalVat = data.vatTotal || (vat10Percent + otherServicesVat);
    const accommodationTax = parseFloat(data.accommodation_tax || data.accommodationTaxTotal || 0);
    const grandTotal = parseFloat(data.grandTotal || 0);
    const exchangeRate = parseFloat(data.exchangeRate || 0);
    const totalEuro = exchangeRate > 0 ? (grandTotal / exchangeRate) : 0;

    return {
      meta: {
        refno: data.referenceNo || "",
        folio: data.folio_number || data.vNo || "",
        date: formatDate(data.invoiceDate),
        vatOffice: data.vd || "Alemdar",
        vatNo: data.vNo || "7810505191",
        company: {
          name: "Staybridge Suites Istanbul Umraniye",
          addressLine1: "Eksioglu Esas Is Merkezi Saray Mah. Dr. Fazıl Kucuk Cad.",
          addressLine2: "Cakmak Mah. No 64 Umraniye Istanbul",
          phone: "+90 216 290 70 00",
          azarBranding: {
              name: "AZAR TOURISM",
              subName: "Azar Tourism Services",
              address: "Algeria Square Building Number 12 First Floor, Tripoli, Libya"
          }
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
        passport: data.passportNo || data.confirmation || "",
        user: data.userId || " ",
        cashierNo: data.batchNo || data.cshNo || data.cashNo || "",
        voucherNo: data.voucherNo || "",
        crsNo: data.voucherNo || ""
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
      const year = String(date.getFullYear());
      return `${day}.${month}.${year}`;
    } catch { return dateString; }
  };

  const numberToTurkishWords = (amount) => {
    const rounded = Math.round(amount * 100) / 100;
    const lira = Math.floor(rounded);
    const kurus = Math.round((rounded - lira) * 100);
    return `Yalnız ${lira.toLocaleString('tr-TR')} Türk Lirası ${kurus} Kuruştur`;
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    if (invoice && invoice.transactions) {
      const pages = [];
      const totalTransactions = invoice.transactions.length;

      for (let i = 0; i < totalTransactions; i += ROWS_PER_PAGE) {
        pages.push({
          transactions: invoice.transactions.slice(i, i + ROWS_PER_PAGE),
          pageNum: pages.length + 1,
          isLastPage: i + ROWS_PER_PAGE >= totalTransactions
        });
      }

      if (pages.length === 0) {
        pages.push({
          transactions: [],
          pageNum: 1,
          isLastPage: true
        });
      }

      setPaginatedData(pages);
    }
  }, [invoice]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
      style.parentNode.removeChild(style);
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
        filename: `${invoice.meta.refno || 'Staybridge'}.pdf`,
        image: { type: 'jpeg', quality: 2 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("❌ PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      headStyles.forEach(style => {
        document.head.appendChild(style);
      });
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const InfoItem = ({ label, value, width = "70px" }) => (
    <div className="grid-item" style={{ display: 'flex', alignItems: 'flex-start', height: '11px' }}>
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
      <div ref={invoiceRef}>
        <style>{`
          @page { size: A4; margin: 0; }
          body { 
            margin: 0; 
            padding: 0; 
            font-family: "Times New Roman", Times, serif; 
            font-size: 11px; 
            color: #000;
          }

          .invoice-page {
            background-color: white;
            width: 100%;
            max-width: 794px;
            min-height: 297mm;
            margin: 0 auto;
            padding: 40px;
            position: relative;
            box-sizing: border-box;
            page-break-after: always;
          }

          .invoice-page:last-child {
            page-break-after: auto;
          }

          .header-section { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 20px; 
          }
          
          .company-details { 
            width: 60%;
          }
          
          .hotel-name { 
            font-weight: bold; 
            font-size: 14px; 
            margin-bottom: 4px;
          }
          
          .hotel-address { 
            font-size: 10px; 
            line-height: 1.2;
          }

          .logo-container { 
            text-align: right; 
            width: 35%; 
          }
          
          .logo-img { 
            max-width: 140px; 
            height: auto; 
          }

          .meta-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 2px;
            font-size: 11px;
          }

          .guest-info-section {
            margin-top: 15px;
            margin-bottom: 15px;
            border-top: 1px solid #000;
            padding-top: 10px;
          }

          .guest-name {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 8px;
            text-transform: uppercase;
          }

          .guest-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px 40px;
            margin-bottom: 15px;
          }

          .main-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          
          .main-table thead tr { 
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
          }
          
          .main-table th { 
            text-align: left; 
            padding: 6px 4px; 
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
          }
          
          .main-table td { 
            padding: 4px; 
            vertical-align: top;
            font-size: 11px;
          }

          .col-date { width: 15%; }
          .col-desc { width: 55%; }
          .col-debit { width: 15%; text-align: right !important; }
          .col-credit { width: 15%; text-align: right !important; }

          .footer-section { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 30px;
          }
          
          .footer-left { 
            width: 50%; 
          }
          
          .footer-right { 
            width: 40%; 
          }

          .tax-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px;
          }
          
          .tax-table th { 
            border-bottom: 1px solid #000; 
            text-align: right; 
            font-size: 9px;
            padding-bottom: 2px;
          }
          
          .tax-table td { 
            text-align: right; 
            padding: 2px 0;
            font-size: 10px;
          }

          .totals-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 4px; 
            font-size: 11px;
          }
          
          .total-label { font-weight: normal; }
          .total-value { font-weight: bold; }
          
          .balance-row { 
            margin-top: 10px;
            padding-top: 5px;
            border-top: 1px solid #000;
            font-weight: bold;
            font-size: 12px;
          }

          .azar-footer {
            position: absolute;
            bottom: 40px;
            left: 40px;
            right: 40px;
            font-size: 9px;
            text-align: center;
            border-top: 0.5px solid #ccc;
            padding-top: 5px;
            color: #666;
          }

          @media print {
            .invoice-page { padding: 40px; }
            .no-print { display: none !important; }
          }
        `}</style>

        {paginatedData.map((page, pageIdx) => (
          <div key={pageIdx} className="invoice-page">
            <div className="header-section">
              <div className="company-details">
                <div className="hotel-name">{invoice.meta.company.name}</div>
                <div className="hotel-address">
                  {invoice.meta.company.addressLine1}<br />
                  {invoice.meta.company.addressLine2}<br />
                  Tel: {invoice.meta.company.phone}<br />
                  Tax Office: {invoice.meta.vatOffice} | Tax No: {invoice.meta.vatNo}
                </div>
              </div>
              <div className="logo-container">
                <img src={invoice.meta.hotel.logoUrl} alt="Staybridge Logo" className="logo-img" />
              </div>
            </div>

            <div className="meta-row" style={{ marginTop: '20px' }}>
              <div style={{ fontWeight: 'bold' }}>Invoice</div>
              <div>Date: {invoice.meta.date}</div>
            </div>
            <div className="meta-row">
              <div>Folio No: {invoice.meta.folio}</div>
              <div>Ref No: {invoice.meta.refno}</div>
            </div>

            <div className="guest-info-section">
              <div className="guest-name">{invoice.guest.name}</div>
              <div className="guest-grid">
                <div>
                  <InfoItem label="Room" value={invoice.guest.room} />
                  <InfoItem label="Arrival" value={invoice.guest.arrival} />
                  <InfoItem label="Departure" value={invoice.guest.departure} />
                </div>
                <div>
                  <InfoItem label="Adult/Child" value={`${invoice.guest.adults} / ${invoice.guest.children}`} />
                  <InfoItem label="Voucher" value={invoice.guest.voucherNo} />
                  <InfoItem label="Page" value={`${page.pageNum} / ${paginatedData.length}`} />
                </div>
              </div>
            </div>

            <table className="main-table">
              <thead>
                <tr>
                  <th className="col-date">Date</th>
                  <th className="col-desc">Description</th>
                  <th className="col-debit">Debit</th>
                  <th className="col-credit">Credit</th>
                </tr>
              </thead>
              <tbody>
                {page.transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td className="col-date">{txn.date}</td>
                    <td className="col-desc">
                      {txn.description}
                      {txn.rate && <span style={{ fontSize: '9px', marginLeft: '10px', color: '#555' }}>({txn.rate})</span>}
                    </td>
                    <td className="col-debit">{txn.debit ? formatCurrency(txn.debit) : ''}</td>
                    <td className="col-credit">{txn.credit ? formatCurrency(txn.credit) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {page.isLastPage && (
              <div className="footer-section">
                <div className="footer-left">
                  <table className="tax-table">
                    <thead>
                      <tr>
                        <th>Tax Rate</th>
                        <th>Tax Base</th>
                        <th>Tax Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.totals.taxTable.map((tax, index) => (
                        <tr key={index}>
                          <td>{tax.rate}</td>
                          <td>{formatCurrency(tax.base)}</td>
                          <td>{formatCurrency(tax.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ fontSize: '10px', marginTop: '10px' }}>
                    <strong>Exchange Rate:</strong> 1 EUR = {invoice.totals.exchangeRates.eur.toFixed(5)} TRY
                  </div>
                  <div style={{ fontSize: '9px', marginTop: '5px', fontStyle: 'italic' }}>
                    {invoice.totals.textAmount}
                  </div>
                </div>

                <div className="footer-right">
                  <div className="totals-row">
                    <span className="total-label">Total Amount</span>
                    <span className="total-value">{formatCurrency(invoice.totals.summary.totalAmount)}</span>
                  </div>
                  <div className="totals-row">
                    <span className="total-label">Total VAT</span>
                    <span className="total-value">{formatCurrency(invoice.totals.summary.totalVat)}</span>
                  </div>
                  <div className="totals-row">
                    <span className="total-label">Accommodation Tax</span>
                    <span className="total-value">{formatCurrency(invoice.totals.summary.accTax)}</span>
                  </div>
                  <div className="totals-row" style={{ fontWeight: 'bold' }}>
                    <span className="total-label">Total Inc. VAT</span>
                    <span className="total-value">{formatCurrency(invoice.totals.summary.totalIncVat)}</span>
                  </div>
                  <div className="totals-row balance-row">
                    <span>Balance</span>
                    <span>{formatCurrency(invoice.totals.summary.balance)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="azar-footer">
              <strong>{invoice.meta.company.azarBranding.subName}</strong> - {invoice.meta.company.azarBranding.address}
            </div>
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default StaybridgeInvoiceView;
