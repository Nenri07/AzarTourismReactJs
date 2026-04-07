import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components"; // Adjust path as needed
import logo from "/park_plaza-logo.jpg"

// Change this path to your actual logo path or import it

const ParkPlazaInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (invoiceData) {
      setInvoice(invoiceData);
      setLoading(false);
    } else {
      fetchDummyInvoiceData();
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

  // Dummy data simulation - Replace this logic with your actual API call later
  const fetchDummyInvoiceData = async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const dummyData = {
        guestName: "Alhade, Alhadad",
        accountNo: "PPWA00224",
        roomNo: "0621",
        arrivalDate: "31/01/26",
        departureDate: "07/02/26",
        resNo: "281765081",
        pageNo: "1 of 1",
        invoiceNo: "",
        folioNo: "537461",
        date: "07/02/26",
        items: [
          { date: "31/01/26", text: <>iLink Visa<br/>ILINK_PPWA_281765081 |<br/>NG9K3LB2X7S7RCG3</>, chgExclVat: "0.00", vat: "0.00", chgGbp: "", cred: "300.00", isTopPad: true },
          { date: "31/01/26", text: "Bed and Breakfast", chgExclVat: "185.31", vat: "37.06", chgGbp: "222.37", cred: "" },
          { date: "01/02/26", text: "Bed and Breakfast", chgExclVat: "133.11", vat: "26.62", chgGbp: "159.73", cred: "" },
          { date: "02/02/26", text: "Bed and Breakfast", chgExclVat: "133.11", vat: "26.62", chgGbp: "159.73", cred: "" },
          { date: "03/02/26", text: "Bed and Breakfast", chgExclVat: "162.48", vat: "32.49", chgGbp: "194.97", cred: "" },
          { date: "04/02/26", text: "Bed and Breakfast", chgExclVat: "211.41", vat: "42.28", chgGbp: "253.69", cred: "" },
          { date: "05/02/26", text: "Laundry/Valet", chgExclVat: "118.30", vat: "23.66", chgGbp: "141.96", cred: "" },
          { date: "05/02/26", text: "Bed and Breakfast", chgExclVat: "133.11", vat: "26.62", chgGbp: "159.73", cred: "" },
          { date: "06/02/26", text: "Bed and Breakfast", chgExclVat: "133.11", vat: "26.62", chgGbp: "159.73", cred: "" },
          { date: "07/02/26", text: <>Mastercard cardholder present<br/>XXXXXXXXXXXX8188 XX/XX</>, chgExclVat: "0.00", vat: "0.00", chgGbp: "", cred: "1,151.91" }
        ],
        totals: {
          chgGbp: "1,451.91",
          cred: "1,451.91",
          balance: "0.00 GBP"
        },
        vatSummary: {
          exclVat: "1,209.93",
          vatPercent: "20%",
          vatAmount: "241.99",
          inclVat: "1,451.91"
        },
        transactions: {
          id: "50813454",
          approvalCode: "605800",
          approvalAmount: "1,151.91",
          cardNo: "XXXXXXXXXXXX8188",
          expiry: "XX/XX",
          transAmount: "1,151.91"
        }
      };
      
      setInvoice(dummyData);
    } catch (err) {
      console.error("Error fetching invoice:", err);
      setError("Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    // Temporarily disable conflicting global styles for exact matching
    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
      const text = style.textContent || "";
      // Keep any fonts if needed, otherwise disable to prevent layout shifts
      if (text.includes('Times New Roman') || text.includes('Arial')) return;
      if (style.parentNode && style.id !== 'park-plaza-styles') {
        style.parentNode.removeChild(style);
      }
    });

    try {
      // Ensure all images are loaded before printing
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
        filename: `Park_Plaza_Invoice_${invoice.folioNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 1 }, // High quality
        html2canvas: { 
            scale: 3, 
            useCORS: true, 
            letterRendering: true,
            scrollY: 0,
            windowWidth: 850 // Match exactly the fixed width of the container
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      // Restore styles
      headStyles.forEach(style => {
          if (!style.parentNode) {
              document.head.appendChild(style);
          }
      });
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (!invoice && !loading) {
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
      {/* Wrapper to scope styles and capture for PDF */}
      <div className="park-plaza-wrapper">
        <style id="park-plaza-styles">{`
          .park-plaza-wrapper {
              display: flex;
              justify-content: center;
              font-family: Arial, Helvetica, sans-serif;
              background-color: #e6e6e6;
              padding: 20px;
          }
          
          @media print {
            .park-plaza-wrapper {
               background-color: #fff !important;
               padding: 0 !important;
            }
            .invoice-container {
               box-shadow: none !important;
               width: 100% !important;
               padding: 20px !important;
            }
          }

          .invoice-container {
              width: 850px;
              background-color: #fff;
              padding: 60px 60px 80px 60px;
              box-sizing: border-box;
              color: #000;
              font-size: 14px;
              position: relative;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .invoice-title {
              position: absolute;
              top: 100px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 15px;
              letter-spacing: 0.3px;
          }
          .logo {
              position: absolute;
              top: 30px;
              right: 60px;
              width: 150px;
          }
          .billing-address {
              margin-top: 120px;
              line-height: 1.35;
          }
          .middle-section {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
          }
          .guest-name {
              margin-top: 65px;
          }
          .meta-table {
              width: 270px;
              border-collapse: collapse;
          }
          .meta-table td {
              padding: 2.5px 0;
              vertical-align: top;
          }
          .meta-table td:first-child {
              width: 110px;
          }
          .account-no {
              margin-top: 25px;
              margin-bottom: 20px;
          }
          .line-items {
              width: 100%;
              border-collapse: collapse;
          }
          .line-items th {
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 10px 0 6px 0;
              font-weight: normal;
              vertical-align: bottom;
          }
          .line-items td {
              padding: 3px 0;
              vertical-align: top;
          }
          .th-date { text-align: left; width: 11%; padding-left: 10px !important; }
          .th-text { text-align: left; width: 38%; }
          .th-chg-ex { text-align: center; width: 12%; }
          .th-vat { text-align: center; width: 11%; }
          .th-chg-gbp { text-align: center; width: 14%; }
          .th-cred { text-align: right; width: 14%; }
          
          .td-date { padding-left: 10px !important; }
          .td-num-right { text-align: right; }
          .pr-chg-ex { padding-right: 15px !important; }
          .pr-vat { padding-right: 25px !important; }
          .pr-chg-gbp { padding-right: 20px !important; }
          
          .pad-top { padding-top: 15px !important; }
          
          .totals-row td {
              padding-top: 10px !important;
              padding-bottom: 12px !important;
          }
          
          .vat-summary {
              width: 530px;
              border-collapse: collapse;
              margin-top: 50px;
          }
          .vat-summary th {
              padding: 8px 0;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              font-weight: normal;
          }
          .vat-summary td {
              padding: 8px 0;
          }
              
          .bottom-layout {
              display: flex;
              width: 100%;
          }
          .col-left {
              width: 53%;
          }
          .col-right {
              width: 47%;
              padding-left: 15px; 
              box-sizing: border-box;
          }

          .transaction-details {
              margin-top: 30px;
              font-size: 12.5px;
          }
          .trans-table {
              border-collapse: collapse;
          }
          .col-left .trans-table { width: 250px; }
          .col-right .trans-table { width: 300px; }
          
          .trans-table td {
              padding: 2.5px 0;
          }

          .footer {
              margin-top: 80px;
              font-size: 10px;
              line-height: 1.4;
          }
        `}</style>

        {invoice && (
          <div className="invoice-container" ref={invoiceRef}>
            <div className="invoice-title">COPY OF INVOICE</div>
            <img src={logo} alt="Park Plaza London Waterloo" className="logo" />
            
            <div className="billing-address">
                AGODA COMPANY PTE LTD<br/>
                30 Cecil Street, #19-08<br/>
                Prudential Tower<br/>
                049712 Singapore<br/>
                Singapore
            </div>
            
            <div className="middle-section">
                <div className="guest-name">{invoice.guestName}</div>
                <table className="meta-table">
                  <tbody>
                    <tr><td>Room No.:</td><td>{invoice.roomNo}</td></tr>
                    <tr><td>Arrival:</td><td>{invoice.arrivalDate}</td></tr>
                    <tr><td>Departure:</td><td>{invoice.departureDate}</td></tr>
                    <tr><td>Res. No.:</td><td>{invoice.resNo}</td></tr>
                    <tr><td>Page No.:</td><td>{invoice.pageNo}</td></tr>
                    <tr><td>Invoice No.:</td><td>{invoice.invoiceNo}</td></tr>
                    <tr><td>Folio No.:</td><td>{invoice.folioNo}</td></tr>
                    <tr><td>Date:</td><td>{invoice.date}</td></tr>
                  </tbody>
                </table>
            </div>
            
            <div className="account-no">Account No.: {invoice.accountNo}</div>
            
            <table className="line-items">
                <thead>
                    <tr>
                        <th className="th-date">Date</th>
                        <th className="th-text">Text</th>
                        <th className="th-chg-ex">Charges<br/>Excl. VAT</th>
                        <th className="th-vat">VAT<br/>Amount</th>
                        <th className="th-chg-gbp">Charges (GBP)</th>
                        <th className="th-cred">Credits (GBP)</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx}>
                          <td className={`td-date ${item.isTopPad ? 'pad-top' : ''}`}>{item.date}</td>
                          <td className={item.isTopPad ? 'pad-top' : ''}>{item.text}</td>
                          <td className={`td-num-right pr-chg-ex ${item.isTopPad ? 'pad-top' : ''}`}>{item.chgExclVat}</td>
                          <td className={`td-num-right pr-vat ${item.isTopPad ? 'pad-top' : ''}`}>{item.vat}</td>
                          <td className={`td-num-right pr-chg-gbp ${item.isTopPad ? 'pad-top' : ''}`}>{item.chgGbp}</td>
                          <td className={`td-num-right ${item.isTopPad ? 'pad-top' : ''}`}>{item.cred}</td>
                      </tr>
                    ))}
                    
                    <tr>
                        <td colSpan="6" style={{ height: '40px' }}></td>
                    </tr>
                    
                    <tr className="totals-row">
                        <td colSpan="4" style={{ textAlign: 'right', paddingRight: '45px' }}>Total</td>
                        <td className="td-num-right pr-chg-gbp">{invoice.totals.chgGbp}</td>
                        <td className="td-num-right">{invoice.totals.cred}</td>
                    </tr>
                    <tr>
                        <td colSpan="4" style={{ textAlign: 'right', paddingRight: '45px', verticalAlign: 'middle' }}>Balance Due</td>
                        <td colSpan="2" style={{ borderTop: '1px solid #000', borderBottom: '2.5px solid #000', textAlign: 'center', padding: '8px 0' }}>{invoice.totals.balance}</td>
                    </tr>
                </tbody>
            </table>
            
            <table className="vat-summary">
                <thead>
                    <tr>
                        <th style={{ width: '35%', textAlign: 'left' }}>Charges Excl. VAT</th>
                        <th style={{ width: '35%', textAlign: 'left' }}>VAT Amount</th>
                        <th style={{ textAlign: 'right', width: '30%' }}>Total VAT Incl.</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ textAlign: 'right', paddingRight: '65px' }}>{invoice.vatSummary.exclVat}</td>
                        <td>VAT {invoice.vatSummary.vatPercent} <span style={{ float: 'right', paddingRight: '55px' }}>{invoice.vatSummary.vatAmount}</span></td>
                        <td style={{ textAlign: 'right' }}>{invoice.vatSummary.inclVat}</td>
                    </tr>
                </tbody>
            </table>
            
            <div className="bottom-layout transaction-details">
                <div className="col-left">
                    <table className="trans-table">
                      <tbody>
                        <tr><td style={{ width: '130px' }}>Transaction ID</td><td>{invoice.transactions.id}</td></tr>
                        <tr><td>Approval Code</td><td>{invoice.transactions.approvalCode}</td></tr>
                        <tr><td>Approval Amount</td><td>{invoice.transactions.approvalAmount}</td></tr>
                      </tbody>
                    </table>
                </div>
                <div className="col-right">
                    <table className="trans-table">
                      <tbody>
                        <tr><td style={{ width: '140px' }}>Credit Card #</td><td>{invoice.transactions.cardNo}</td></tr>
                        <tr><td>Credit Card Expiry</td><td>{invoice.transactions.expiry}</td></tr>
                        <tr><td>Transaction Amount</td><td>{invoice.transactions.transAmount}</td></tr>
                      </tbody>
                    </table>
                </div>
            </div>
            
            <div className="bottom-layout footer">
                <div className="col-left">
                    Waterloo Hotel Operator Limited<br/>
                    Registration No.: 09558390<br/>
                    VAT No.: 0224686592<br/>
                    Santander Uk plc<br/>
                    Sort Code: 09-02-22<br/>
                    Account No.: 10570395<br/>
                    SWIFT: ABBYGB2L<br/>
                    IBAN: GB59ABBY09022210570395
                </div>
                <div className="col-right">
                    Park Plaza London Waterloo<br/>
                    6 Hercules Rd<br/>
                    SE1 7DU LONDON<br/>
                    United Kingdom<br/>
                    T: + 44 (0) 333 400 6128<br/>
                    F: + 44 (0) 333 400 6129<br/>
                    E: resppwa@pphe.com<br/>
                    www.parkplaza.com
                </div>
            </div>
          </div>
        )}
      </div>
    </InvoiceTemplate>
  );
};

export default ParkPlazaInvoiceView;