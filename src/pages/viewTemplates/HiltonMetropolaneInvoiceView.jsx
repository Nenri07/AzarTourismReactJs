import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import invoiceApi from "../../Api/invoice.api"; 
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from "/Hilton_Metropole.png"

const HiltonMetropolaneInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (invoiceData) {
      setInvoice(transformInvoiceData(invoiceData));
      setLoading(false);
    } else if (invoiceId) {
      fetchInvoiceData();
    } else {
      setInvoice(null);
      setLoading(false);
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
      const response = await invoiceApi.getInvoiceById(invoiceId);
      
      let rawData = response.data || response;
      if (rawData.data) rawData = rawData.data;
      if (rawData.data) rawData = rawData.data;
      
      setInvoice(transformInvoiceData(rawData));
    } catch (err) {
      console.error("Error fetching Hilton invoice:", err);
      toast.error("Failed to load invoice from API.");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const transformInvoiceData = (data) => {
    if (!data) return null;

    const items = [];
    
    // 1. Map Accommodation Details
    if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
        data.accommodationDetails.forEach(item => {
            const charge = parseFloat(item.guest_charges || item.charges_gbp || item.chargesGbp || 0);
            const credit = parseFloat(item.credit || item.credits_gbp || item.creditsGbp || 0);
            
            items.push({
                date: formatDate(item.date),
                rawDate: new Date(item.date),
                text: item.description || item.text || "",
                id: item.id || item.cashierId || "",
                refNo: item.ref_no || "",
                chargesGBP: charge ? formatCurrency(charge) : "",
                creditsGBP: credit ? `-${formatCurrency(credit)}` : "", // Hilton format uses negative for credits
                rawCharge: charge,
                rawCredit: credit,
                type: 'accommodation'
            });
        });
    }

    // 2. Map Other Services
    if (data.otherServices && Array.isArray(data.otherServices)) {
        data.otherServices.forEach(service => {
            const charge = parseFloat(service.guest_charges || service.charges_gbp || service.chargesGbp || service.amount || 0);
            const credit = parseFloat(service.credit || service.credits_gbp || service.creditsGbp || 0);

            items.push({
                date: formatDate(service.date),
                rawDate: new Date(service.date),
                text: service.description || service.service_type || service.name || service.text || "",
                id: service.id || service.cashierId || "",
                refNo: service.ref_no || "",
                chargesGBP: charge ? formatCurrency(charge) : "",
                creditsGBP: credit ? `-${formatCurrency(credit)}` : "",
                rawCharge: charge,
                rawCredit: credit,
                type: 'service'
            });
        });
    }

    // 3. Sort chronologically
    items.sort((a, b) => {
      const timeDiff = a.rawDate.getTime() - b.rawDate.getTime();
      if (timeDiff !== 0) return timeDiff;
      if (a.type === 'accommodation' && b.type !== 'accommodation') return -1;
      if (a.type !== 'accommodation' && b.type === 'accommodation') return 1;
      return 0;
    });

    return {
      ...data,
      items,
      formattedInvoiceDate: formatDate(data.invoiceDate || data.taxDate),
      formattedArrivalDate: formatDate(data.arrivalDate),
      formattedDepartureDate: formatDate(data.departureDate),
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    } catch { return dateString; }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "" || isNaN(val)) return "";
    return `£${parseFloat(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  useEffect(() => {
    if (invoice && invoice.items) {
      const pages = [];
      const items = invoice.items;
      
      const CHUNK_SIZE = 20; 
      const totalTx = items.length;

      let i = 0;

      while (i < totalTx) {
          pages.push({
              items: items.slice(i, i + CHUNK_SIZE),
              isLastTransactionPage: (i + CHUNK_SIZE) >= totalTx
          });
          i += CHUNK_SIZE;
      }

      if (pages.length === 0) {
          pages.push({ items: [], isLastTransactionPage: true });
      }
      
      setPaginatedData(pages);
    }
  }, [invoice]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
        if (style.parentNode) style.parentNode.removeChild(style);
    });

    try {
      const element = invoiceRef.current;
      const opt = {
        margin: 0,
        filename: `${invoice?.referenceNo || 'Hilton_Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
            scale: 3, 
            useCORS: true, 
            scrollY: 0,
            letterRendering: true 
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
      headStyles.forEach(style => document.head.appendChild(style));
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return <InvoiceTemplate loading={loading} onBack={() => navigate("/invoices")}><></></InvoiceTemplate>;
  }

  if (!invoice) {
    return (
        <InvoiceTemplate loading={false} onBack={() => navigate("/invoices")}>
            <div style={{ padding: '50px', textAlign: 'center' }}>
                <h2>No Invoice Data Available</h2>
            </div>
        </InvoiceTemplate>
    );
  }

  const safeStr = (str) => str || "";
  const currentPrintDate = formatDate(new Date()) + " " + new Date().toLocaleTimeString('en-GB');

  // Calculations
  const totalCharges = invoice.items.reduce((sum, item) => sum + (item.rawCharge || 0), 0);
  const totalCredits = invoice.items.reduce((sum, item) => sum + (item.rawCredit || 0), 0);
  const balanceDue = totalCharges - totalCredits;

  const taxableAmount = invoice.taxableAmountExclVat || 0;
  const vatAmount = invoice.vatAt20Percent || 0;
  const zeroRated = invoice.zeroRatedAmount || 0;
  const nonTaxable = invoice.nonTaxableAmount || 0;
  const totalPayable = invoice.totalAmountPayable || balanceDue;

  // Reusable Top Header Block (Now only rendered on the first page)
  const HeaderBlock = () => (
    <div className="top-section-exact">
        <div className="guest-address-block">
            {safeStr(invoice.guestName)}<br/>
            {safeStr(invoice.companyName)}<br/>
            Tripoli Tower Ground Floor Office no 50<br/>
            Tripoli, Libya<br/>
        </div>

        <div className="room-details-block">
            <table className="header-data-table">
                <tbody>
                    <tr><td>Room Number</td><td>{safeStr(invoice.roomNo)}</td></tr>
                    <tr><td>Arrival Date</td><td>{safeStr(invoice.formattedArrivalDate)}</td></tr>
                    <tr><td>Departure Date</td><td>{safeStr(invoice.formattedDepartureDate)}</td></tr>
                    <tr><td>Adult/Child</td><td>{safeStr(invoice.adults || '1')}/{safeStr(invoice.children || '0')}</td></tr>
                    <tr><td>Room Rate</td><td>{invoice.roomRate ? formatCurrency(invoice.roomRate) : ""}</td></tr>
                    <tr><td>Rate Plan</td><td>{safeStr(invoice.ratePlan)}</td></tr>
                    <tr><td>AL:</td><td>{safeStr(invoice.al)}</td></tr>
                    <tr><td>Honors #</td><td>{safeStr(invoice.honorsNo)}</td></tr>
                    <tr><td>VAT #</td><td>{safeStr(invoice.vatNo || "329 1662 93")}</td></tr>
                    <tr><td>Folio No/Che</td><td>{safeStr(invoice.folioNo)}</td></tr>
                    <tr><td>Tax Date</td><td>{safeStr(invoice.formattedInvoiceDate)}</td></tr>
                </tbody>
            </table>
        </div>

        <div className="vat-left-block">
            VAT INVOICE:{safeStr(invoice.vatInvoiceNo || invoice.invoiceNo)}<br/>
            Confirmation Number: {safeStr(invoice.confNo)}
        </div>

        {/* <div className="vat-right-block">
            <table className="header-data-table">
                <tbody>
                    <tr><td>VAT #</td><td>{safeStr(invoice.vatNo || "329 1662 93")}</td></tr>
                    <tr><td>Folio No/Che</td><td>{safeStr(invoice.folioNo)}</td></tr>
                    <tr><td>Tax Date</td><td>{safeStr(invoice.formattedInvoiceDate)}</td></tr>
                </tbody>
            </table>
        </div> */}
    </div>
  );

  const FooterBlock = () => (
    <div className="hilton-footer">
        <div className="footer-hotel-name">HILTON LONDON METROPOLE</div>
        <div>225 Edgware Road | London | W2 1JU | United Kingdom</div>
        <div>T: +44 (0)207 402 4141 | F: +44 (0)207 724 8866 | E: reservations.londonmet@hilton.com</div>
        <div>hilton.com/londonmet</div>
        <div style={{ marginTop: '5px' }}>Managed by Hilton UK Manage Limited On behalf of HPREF METS LONDON LTD</div>
        <div>Registered Office | Hilton London Metropole | 225 Edgware Road | London</div>
        <div>England, W2 1JU</div>
        <div style={{ marginTop: '10px' }}>Incorporated in England and Wales with Registration No. 10951979 | VAT No. 329 1662 93</div>
        
        <div className="footer-blue-bar">
            <span>(H)</span>
            <span>AMERICAS &middot; EUROPE &middot; MIDDLE EAST &middot; AFRICA &middot; ASIA &middot; AUSTRALASIA</span>
        </div>
    </div>
  );

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
      <div ref={invoiceRef} className="hilton-invoice-wrapper">
        <style dangerouslySetInnerHTML={{__html: `
          .hilton-invoice-wrapper * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
          }
          
          .hilton-page {
              width: 210mm;
              height: 296mm; 
              background: white;
              margin: 0 auto;
              padding: 40px 50px;
              position: relative;
              display: flex;
              flex-direction: column;
              overflow: hidden; 
          }

          .hilton-page:not(:last-child) {
              page-break-after: always;
          }

          @media print {
              @page { margin: 0; size: A4 portrait; }
              body * { visibility: hidden; }
              .hilton-invoice-wrapper, .hilton-invoice-wrapper * { visibility: visible; }
              .hilton-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
              body { background: none; margin: 0; padding: 0; }
              .hilton-page { 
                  padding: 40px 50px !important; 
                  margin: 0 !important; 
                  box-shadow: none !important; 
                  width: 210mm !important;
                  height: 296mm !important; 
                  page-break-after: always;
              }
              .hilton-page:last-child { page-break-after: avoid !important; }
          }

          .header-logo {
              text-align: center;
              justify-content: center;
              display: flex;
              margin-bottom: 15px; /* Updated: Removed extra space below logo */
          }
          .header-logo img {
              height: 84px;
              object-fit: contain;
          }

          .top-section-exact {
              position: relative;
              height: 240px; /* Updated: Increased height to accommodate added spacing */
              margin-bottom: 15px; /* Updated: Added space below VAT block */
          }

          .guest-address-block {
              position: absolute;
              left: 12%; 
              top: 0;
              font-family: "Times New Roman", Times, serif; 
              font-size: 14px;
              line-height: 1.3; /* Updated: Removed space between lines */
          }

          .room-details-block {
              position: absolute;
              left: 58%; 
              top: 0;
          }

        

          .vat-left-block {
              position: absolute;
              left: 0; 
              top: 185px; /* Updated: Added space above VAT block */
              font-size: 11.5px;
              line-height: 1.7;
          }

          .vat-right-block {
              position: absolute;
              left: 58%; 
              top: 185px; /* Updated: Added space above VAT block */
          }

          .header-data-table {
              border-collapse: collapse;
              font-size: 11.5px;
          }
          .header-data-table td {
              padding: 2px 0;
              vertical-align: top;
          }
          .header-data-table td:first-child {
              width: 120px; 
          }

          .table-title {
              font-size: 11px;
              margin-bottom: 5px;
              text-transform: uppercase;
          }
          .main-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10.5px;
              margin-bottom: 5px;
          }
          .main-table thead {
              border: 1px solid #000;
             
          }
          .main-table th {
              text-align: center;
              padding: 2px 4px;
              font-weight: normal;
              border-right: 1px solid #000;
              text-transform: uppercase;
          }
          .main-table th:last-child { border-right: none; text-align: right; }
          /* Updated: Added nth-last-child(4) for REF NO column to be right aligned */
          .main-table th:nth-last-child(2), .main-table th:nth-last-child(3), .main-table th:nth-last-child(4) { text-align: right; }
          
          .main-table td {
              padding: 4px;
              vertical-align: top;
          }
          /* Updated: Added nth-last-child(4) for REF NO column data to be right aligned */
          .main-table td:nth-last-child(1), .main-table td:nth-last-child(2), .main-table td:nth-last-child(3), .main-table td:nth-last-child(4) {
              text-align: right;
          }

          .table-bottom-line {
              border-top: 1px solid #000;
              margin-top: 10px;
              padding-top: 5px;
          }
          .balance-container {
              display: flex;
              justify-content: space-between;
              font-size: 10.5px;
          }
          .balance-label { margin-left: 62%; } /* Updated: Shifted BALANCE to right side */

          .hilton-footer {
              margin-top: auto;
              text-align: center;
              font-size: 9px;
              color: #444;
              line-height: 1.4;
          }
          .footer-hotel-name {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 3px;
          }
          .footer-blue-bar {
              background-color: #1a365d !important;
              color: white !important;
              font-size: 7px;
              padding: 6px 0;
              margin-top: 15px;
              letter-spacing: 1px;
              display: flex;
              justify-content: center;
              align-items: center;
          }
          .footer-blue-bar span { margin: 0 5px; color: white !important; }

          .tax-summary-title { font-size: 11px; margin-bottom: 15px; }
          .tax-grid {
              display: grid;
              grid-template-columns: 200px 100px;
              font-size: 11px;
              line-height: 2;
         
          }
          .tax-grid > div:nth-child(even) { text-align: right; }
          
          .signature-line {
              font-size: 11px;
              margin-top: 30px;
          }
          .signature-line span {
              display: inline-block;
              border-bottom: 1px solid #000;
              width: 300px;
              margin-left: 5px;
          }
        `}} />

        {/* Transaction Pages */}
        {paginatedData.map((page, idx) => (
          <div key={`page-${idx}`} className="hilton-page">
            
            <div className="header-logo">
                <img src={logo} alt="Hilton London Metropole" onError={(e) => e.target.style.display = 'none'} />
            </div>

            {/* Render details ONLY on the first page */}
            {idx === 0 && <HeaderBlock />}

            <div className="table-title">HILTON LONDON METROPOLE {currentPrintDate}</div>
            
            <table className="main-table">
                <thead>
                    <tr>
                        <th style={{ width: '12%',textAlign:'left' }}>DATE</th>
                        <th style={{ width: '25%',textAlign:'left' }}>DESCRIPTION</th>
                        <th style={{ width: '10%' }}>ID</th>
                        <th style={{ width: '13%',textAlign:'center' }}>REF NO</th>
                        <th style={{ width: '15%' }}>GUEST CHARGES</th>
                        <th style={{ width: '12%',textAlign:'center'  }}>CREDIT</th>
                        <th style={{ width: '13%',textAlign:'center' }}>BALANCE</th>
                    </tr>
                </thead>
                <tbody>
                    {page.items.map((item, midx) => (
                        <tr key={midx}>
                            <td>{item.date}</td>
                            <td>{item.text}</td>
                            <td>{item.id}</td>
                            <td>{item.refNo}</td>
                            <td>{item.chargesGBP}</td>
                            <td>{item.creditsGBP}</td>
                            <td></td> {/* Hilton leaves individual row balances empty commonly */}
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {page.isLastTransactionPage && (
                <div className="table-bottom-line">
                    <div className="balance-container">
                        <div className="balance-label">BALANCE</div>
                        <div>{formatCurrency(balanceDue)}</div>
                    </div>
                </div>
            )}

            <FooterBlock />
          </div>
        ))}

        {/* Dedicated Tax Summary Page */}
        <div className="hilton-page">
            <div className="header-logo">
                <img src={logo} alt="Hilton London Metropole" onError={(e) => e.target.style.display = 'none'} />
            </div>

            <div className="tax-summary-title">TAX SUMMARY</div>
            
            <div className="tax-grid">
                <div>Taxable Amount (excl VAT)</div><div>{formatCurrency(taxableAmount)}</div>
                <div>Zero Rated Amount</div><div>{formatCurrency(zeroRated)}</div>
                <div>VAT AT 20%</div><div>{formatCurrency(vatAmount)}</div>
                <div>Non Taxable Amount</div><div>{formatCurrency(nonTaxable)}</div>
                <div>Total Amount Payable</div><div>{formatCurrency(totalPayable)}</div>
            </div>

            <div className="signature-line">
                Guest Signature <span></span>
            </div>

            <FooterBlock />
        </div>

      </div>
    </InvoiceTemplate>
  );
};

export default HiltonMetropolaneInvoiceView;