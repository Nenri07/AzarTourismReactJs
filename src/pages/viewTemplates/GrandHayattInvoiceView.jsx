import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/Grand-hayat-logo.jpeg';

const GrandHayattInvoiceView = ({ invoiceData }) => {
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

  // --- DUMMY DATA PAYLOAD ---
  const dummyInvoiceData = {
    guestName: "Alasqaa, Salah",
    companyName: "Azar Tourism",
    address: "Algazyer Square Building No. 12, First Floor, Tripoli 1254, Libyan Arab Jamahiriya",
    roomNo: "3114",
    arrivalDate: "2026-01-29",
    departureDate: "2026-02-04",
    invoiceDate: "2026-02-11",
    invoiceTime: "13:43:27",
    folioNo: "103573",
    cashierId: "4373/FOSOO",
    hotelName: "Grand Hyatt Kuala Lumpur",
    totalDebit: 6075.60,
    totalCredit: 6075.60,
    baseTaxableAmount: 6075.60,
    serviceCharge: 0, 
    vat14Percent: 0,
    tourismTax: 0,
    accommodationDetails: [
      { date: "2026-01-29", baseRate: 928.33, serviceCharge: 74.27, tourismTax: 10.00 },
      { date: "2026-01-30", baseRate: 928.33, serviceCharge: 74.27, tourismTax: 10.00 },
      { date: "2026-01-31", baseRate: 928.33, serviceCharge: 74.27, tourismTax: 10.00 },
      { date: "2026-02-01", baseRate: 928.33, serviceCharge: 74.27, tourismTax: 10.00 },
      { date: "2026-02-02", baseRate: 928.33, serviceCharge: 74.27, tourismTax: 10.00 },
      { date: "2026-02-03", baseRate: 928.33, serviceCharge: 74.27, tourismTax: 10.00 },
    ],
    otherServices: [],
    payments: [
      { date: "2026-01-30", method: "Payment Link", reference: "Room Payment", amount: 6075.60 }
    ]
  };

  useEffect(() => {
    if (invoiceData) {
      setInvoice(transformInvoiceData(invoiceData));
      setLoading(false);
    } else {
      // Trigger dummy data fetch
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
      // Simulating a network request delay of 600ms
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Inject dummy data instead of API call
      setInvoice(transformInvoiceData(dummyInvoiceData));
    } catch (err) {
      console.error("Error fetching invoice:", err);
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
        const formattedDate = formatGrandHyattDate(item.date);
        const rawD = new Date(item.date).getTime() || 0; 
        
        transactions.push({ id: `acc_${index}`, date: formattedDate, rawDate: rawD, desc: item.description || "Accommodation", reference: "", debit: item.baseRate || 0, credit: "", type: 1 });
        if (item.serviceCharge) {
            transactions.push({ id: `sc_${index}`, date: formattedDate, rawDate: rawD, desc: "Accommodation Service Tax", reference: "", debit: item.serviceCharge || 0, credit: "", type: 2 });
        }
        if (item.cityTax || item.tourismTax) {
            transactions.push({ id: `tt_${index}`, date: formattedDate, rawDate: rawD, desc: "Tourism Tax", reference: "", debit: (item.cityTax || item.tourismTax) || 0, credit: "", type: 3 });
        }
      });
    }

    if (data.otherServices && Array.isArray(data.otherServices)) {
      data.otherServices.forEach((service, index) => {
        const formattedDate = formatGrandHyattDate(service.date);
        const rawD = new Date(service.date).getTime() || 0;

        transactions.push({
          id: `srv_${index}`,
          date: formattedDate,
          rawDate: rawD,
          desc: service.description || "Other Service",
          reference: service.reference || "",
          debit: service.amount || 0,
          credit: "",
          type: 4
        });
      });
    }

    if (data.payments && Array.isArray(data.payments)) {
        data.payments.forEach((payment, index) => {
          const formattedDate = formatGrandHyattDate(payment.date);
          const rawD = new Date(payment.date).getTime() || 0;
  
          transactions.push({
            id: `pay_${index}`,
            date: formattedDate,
            rawDate: rawD,
            desc: payment.method || "Payment Link",
            reference: payment.reference || "Room Payment",
            debit: "",
            credit: payment.amount || 0,
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
      formattedInvoiceDate: formatGrandHyattDate(data.invoiceDate || new Date()),
      formattedArrivalDate: formatGrandHyattDate(data.arrivalDate),
      formattedDepartureDate: formatGrandHyattDate(data.departureDate),
    };
  };

  const formatGrandHyattDate = (dateString) => {
    if (!dateString) return "";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const dd = String(d.getDate()).padStart(2, '0');
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const mmm = months[d.getMonth()];
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}-${mmm}-${yy}`; 
    } catch { return dateString; }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "") return "";
    return parseFloat(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    if (!invoice?.transactions) return;

    const tx = invoice.transactions;
    const pages = [];

    const MAX_ROWS_NORMAL_PAGE = 30; 
    const MAX_ROWS_WITH_FOOTER = 18; 

    if (tx.length === 0) {
      pages.push({ items: [], showTotals: true });
    } else {
      for (let i = 0; i < tx.length; i += MAX_ROWS_NORMAL_PAGE) {
        const chunk = tx.slice(i, i + MAX_ROWS_NORMAL_PAGE);
        const isLastChunk = i + MAX_ROWS_NORMAL_PAGE >= tx.length;

        if (isLastChunk) {
          if (chunk.length > MAX_ROWS_WITH_FOOTER) {
            const itemsForCurrentPage = chunk.slice(0, chunk.length - 1);
            const itemsForLastPage = [chunk[chunk.length - 1]];

            pages.push({ items: itemsForCurrentPage, showTotals: false });
            pages.push({ items: itemsForLastPage, showTotals: true });
          } else {
            pages.push({ items: chunk, showTotals: true });
          }
        } else {
          pages.push({ items: chunk, showTotals: false });
        }
      }
    }

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
        filename: `${invoice.referenceNo  }.pdf`,
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
  const addressLines = addressParts.map(part => part.trim()).filter(p => p);

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
      <div className="grand-hyatt-invoice-wrapper" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{__html: `
          .grand-hyatt-invoice-wrapper {
              width: 100%;
              background-color: transparent;
              display: flex;
              flex-direction: column;
              align-items: center;
          }
          .grand-hyatt-invoice-wrapper * {
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              box-sizing: border-box;
          }
          .page {
              width: 800px;
              padding: 20px 25px; 
              margin: 0 auto 20px auto;
              background-color: #fff;
              font-size: 11px;
              line-height: 1.3;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              position: relative;
              page-break-after: always;
              break-after: page;
          }
          
          .flex-row {
              display: flex;
              justify-content: space-between;
          }
          .left-col { width: 560px; }
          .right-col { width: 290px; }

          .logo-img {
              height: 67px; 
              width: auto;
              margin-top: 10px;
          }

          .hotel-info {
              font-size: 11.5px;
              line-height: 1.25;
              margin-top: 10px;
          }

          .invoice-title-row {
              margin-top: 30px;
              align-items: baseline;
          }
          .invoice-title {
              text-align: right;
              padding-right: 30px;
              font-size: 15px;
              text-transform: uppercase;
              letter-spacing: 0.2px;
          }
          .meta-text-block {
              margin-top: 30px;
              font-size: 13.0px;
          }
          .guest-name-row {
              display: flex;
              margin-top: 18px;
          }
          .guest-name-label { width: 190px; }
          
          .meta-table {
              width: 100%;
              border-collapse: collapse;
          }
          .meta-table td {
              padding: 1.5px 0;
              vertical-align: top;
          }
          .meta-table td:first-child { width: 143px; }

          .main-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 25px;
              font-size: 12.5px !important;
          }
          .main-table thead tr {
              background-color: #c0c0c0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
          }
          .main-table th {
              font-weight: normal;
              padding: 5px 6px;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
          }
          .main-table th.border-left { border-left: 1px solid #000; }
          .main-table th.border-right { border-right: 1px solid #000; }
          
          .main-table td {
              padding: 4px 6px;
              vertical-align: top;
          }
          .col-date { width: 14%; text-align: left; }
          .col-desc { width: 34%; text-align: left; }
          .col-ref { width: 22%; text-align: left; }
          .col-debit { width: 15%; text-align: right; }
          .col-credit { width: 15%; text-align: right; }
          
          .totals-row td {
              border-bottom: 1px solid #000;
              padding: 5px 6px;
          }

          .summary-wrapper {
              display: flex;
              justify-content: space-between;
              margin-top: 4px;
          }
          .hyatt-summary {
              width: 400px;
          }
          .hyatt-title {
              background-color: #c0c0c0 !important;
              padding: 3px 5px;
              margin-bottom: 4px;
              width: 310px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
          }
          
          .balance-table {
              border-collapse: collapse;
              float: right;
              font-size: 11px;
          }
          .balance-table td { padding: 1.5px 4px;  }
          .balance-label { text-align: right; width: 206px;}
          .balance-colon { text-align: center; }
          .balance-currency { width: 30px; text-align: left; }
          .balance-amount { text-align: right; width: 270px; }

          .legal-text {
              clear: both;
              margin-top: 50px;
              font-size: 10px;
              line-height: 1.35;
          }
          
          .signature-section {
              display: flex;
              justify-content: flex-start;
              margin-top: 60px;
          }
          .signature-box {
              display: flex;
              align-items: flex-end;
              width: 360px;
          }
          .sig-text {
              font-size: 11px;
              margin-right: 15px;
          }
          .sig-line {
              flex-grow: 1;
              border-bottom: 1px solid #000;
              height: 10px;
          }

          .footer-company {
              text-align: right;
              font-size: 8.5px;
              margin-top: 40px;
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
              .grand-hyatt-invoice-wrapper {
                  padding: 0 !important; 
                  margin: 0 !important;
                  background: none !important;
                  max-width: none !important;
              }
               .page {
                  margin: 0 !important;
                  padding: 2mm 5mm !important;
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
            
            <div className="flex-row">
                <div className="left-col">
                    <img src={logo} alt="Grand Hyatt Logo" className="logo-img" />
                </div>
               
            </div>

            <div className="flex-row invoice-title-row">
                <div className="left-col invoice-title" style={{flex:"1", textAlign:"center"}}>
                    INFORMATION TAX INVOICE
                </div>
            </div>

            <div className="flex-row meta-text-block">
                <div className="left-col">
                    {invoice.companyName}<br />
                    {addressLines.map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
                    
                    <div className="guest-name-row">
                        <div className="guest-name-label">Guest Name / Nama Tetamu</div>
                        <div>{invoice.guestName}</div>
                    </div>
                </div>
                <div className="right-col">
                    <table className="meta-table">
                        <tbody>
                            <tr><td>Room / Bilik</td><td>{invoice.roomNo}</td></tr>
                            <tr><td>Arrival / Ketibaan</td><td>{invoice.formattedArrivalDate}</td></tr>
                            <tr><td>Departure / Perlepasan</td><td>{invoice.formattedDepartureDate}</td></tr>
                            <tr><td>Cashier / Juruwang</td><td>{invoice.cashierName || ""}</td></tr>
                            <tr><td>Printed / Cetak</td><td>{invoice.formattedInvoiceDate} {invoice.invoiceTime || ""}</td></tr>
                            <tr><td>Page / Mukasurat</td><td>{page.pageNo} of {page.totalPages}</td></tr>
                            <tr><td>Invoice No / No Invois</td><td>{invoice.invoiceNo || ""}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <table className="main-table">
                <thead style={{fontSize:"11px"}}>
                    <tr>
                        <th className="col-date border-left">DATE / TARIKH</th>
                        <th className="col-desc">DESCRIPTION / DESKRIPSI</th>
                        <th className="col-ref">REFERENCE / RUJUKAN</th>
                        <th className="col-debit">DEBIT / DEBIT</th>
                        <th className="col-credit border-right">CREDIT / KREDIT</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colSpan="5" style={{ padding: '2px' }}></td></tr>
                    
                    {page.items.map(item => (
                        <tr key={item.id}>
                            <td>{item.date}</td>
                            <td>{item.desc}</td>
                            <td>{item.reference}</td>
                            <td className="col-debit">{formatCurrency(item.debit)}</td>
                            <td className="col-credit">{formatCurrency(item.credit)}</td>
                        </tr>
                    ))}
                    
                    {page.showTotals && (
                        <>
                            <tr><td colSpan="5" style={{ padding: '2px' }}></td></tr>
                            <tr  className="totals-row" style={{fontSize:"11.5px"}}>
                                <td colSpan="2"></td>
                                <td className="col-ref" style={{ textAlign: 'center', paddingLeft:"33px" }}>Total / Jumlah</td>
                                <td className="col-debit">{formatCurrency(invoice.grandTotalMyr )}</td>
                                <td className="col-credit">{formatCurrency(invoice.grandTotalMyr )}</td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>

            {page.showTotals && (
                <>
                    <div className="summary-wrapper">
                        <div className="hyatt-summary">
                            <div className="hyatt-title">World of Hyatt Stay Summary</div>
                            <div style={{ marginTop: '3px' }}>Membership: No Membership to be credited.</div><br />
                            <div>Join World of Hyatt today and start earning points<br />for stays, dining and more.<br />Visit worldofhyatt.com.</div><br />
                        </div>
                        
                        <div style={{ width: '340px' }}>
                            <table className="balance-table">
                                <tbody>
                                    <tr>
                                        <td className="balance-label">Balance</td>
                                        <td className="balance-colon">:</td>
                                        <td className="balance-currency">MYR</td>
                                        <td className="balance-amount">0.00</td>
                                    </tr>
                                    <tr>
                                        <td className="balance-label">Standard Rated</td>
                                        <td className="balance-colon">:</td>
                                        <td className="balance-currency">MYR</td>
                                        <td className="balance-amount">{formatCurrency(invoice.grandTotalMyr || invoice.grandTotalEgp)}</td>
                                        <td style={{width:"510px"}}></td>
                                    </tr>
                                    <tr>
                                        <td className="balance-label">SST 6%</td>
                                        <td className="balance-colon">:</td>
                                        <td className="balance-currency">MYR</td>
                                        <td className="balance-amount">{formatCurrency(invoice.baseTaxableAmount || 0)}</td>
                                    </tr>
                                    <tr>
                                        <td className="balance-label">SST 8%</td>
                                        <td className="balance-colon">:</td>
                                        <td className="balance-currency">MYR</td>
                                        <td className="balance-amount">{formatCurrency(invoice.totalSst8Percent || 0)}</td>
                                    </tr>
                                    <tr>
                                        <td className="balance-label">Tourism Tax</td>
                                        <td className="balance-colon">:</td>
                                        <td className="balance-currency">MYR</td>
                                        <td className="balance-amount">{formatCurrency(invoice.totalTourismTax || invoice.cityTax || 0)}</td>
                                    </tr>
                                     <tr>
                                        <td className="balance-label">Total Amount </td>
                                        <td className="balance-colon">:</td>
                                        <td className="balance-currency">USD</td>
                                        <td className="balance-amount">{formatCurrency(invoice.balanceUsd || invoice.cityTax || 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

              

                    <div className="signature-section">
                        <div className="signature-box">
                            <span className="sig-text">Signature / Tandatangan</span>
                            <span className="sig-line"></span>
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

export default GrandHayattInvoiceView;