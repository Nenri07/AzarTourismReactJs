import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
const logo = '/staybridge_logo.png';
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import "../../assets/fonts/StaybridgeFont.css";

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
  
  // Pagination logic handled in useEffect based on total transactions

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (invoiceData) {
      setInvoice(transformInvoiceData(invoiceData));
      setLoading(false);
    } else if (invoiceId) {
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
      const response = await cairoInvoiceApi.getInvoiceById(invoiceId);
      
      let rawData = response.data || response;
      if (rawData.data) {
        rawData = rawData.data;
        if (rawData.data) {
          rawData = rawData.data;
        }
      }
      
      setInvoice(transformInvoiceData(rawData));
    } catch (err) {
      console.error("Error fetching Egypt invoice:", err);
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
        data.accommodationDetails.forEach(item => {
            // Match the format USD / .XXXXXXX as seen in the image
            // const exchangeFactor = data.exchangeRate ? data.exchangeRate.toString() : "0";
            // const formattedFactor = exchangeFactor.startsWith('0.') ? exchangeFactor.substring(1) : exchangeFactor;
            
            transactions.push({
                date: formatDate(item.date),
                rawDate: new Date(item.date),
                text: item.description || "Accommodation",
                exchangeRate: `${(data.usdAmount || 0).toFixed(0)} USD / ${data.exchangeRate.toFixed(7)}`,
                charges: item.rate || 0,
                credits: 0,
                type: 'accommodation'
            });
        });
    }

    if (data.otherServices && Array.isArray(data.otherServices)) {
        data.otherServices.forEach(service => {
            transactions.push({
                date: formatDate(service.date),
                rawDate: new Date(service.date),
                text: service.name || "Service",
                exchangeRate: "",
                charges: service.amount || 0,
                credits: 0,
                type: 'service'
            });
        });
    }

    // Sort by date. If dates are the same, accommodation (night) comes first.
    transactions.sort((a, b) => {
      const timeDiff = a.rawDate.getTime() - b.rawDate.getTime();
      if (timeDiff !== 0) return timeDiff;
      if (a.type === 'accommodation' && b.type !== 'accommodation') return -1;
      if (a.type !== 'accommodation' && b.type === 'accommodation') return 1;
      return 0;
    });

    return {
      ...data,
      transactions,
      formattedInvoiceDate: formatDate(data.invoiceDate),
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
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}-${mm}-${yy}`; // Hyphens as per reference image
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
    if (invoice && invoice.transactions) {
      const pages = [];
      const transactions = invoice.transactions;
      const totalTx = transactions.length;

      if (totalTx > 19) {
        // If greater than 19 rows, break the page (chunk size 19)
        const CHUNK_SIZE = 19;
        for (let i = 0; i < totalTx; i += CHUNK_SIZE) {
          pages.push({
            items: transactions.slice(i, i + CHUNK_SIZE),
            pageNum: pages.length + 1,
            isLast: i + CHUNK_SIZE >= totalTx
          });
        }
      } else if (totalTx >= 15) {
        // If 14 to 19 rows, show all rows on page 1 and shift totals to page 2
        pages.push({
          items: transactions,
          pageNum: 1,
          isLast: false // Hide totals on page 1
        });
        pages.push({
          items: [],
          pageNum: 2,
          isLast: true // Show totals on page 2
        });
      } else {
        // Less than 14 rows, show everything on one page
        pages.push({
          items: transactions,
          pageNum: 1,
          isLast: true
        });
      }
      
      if (pages.length === 0) {
        pages.push({ items: [], pageNum: 1, isLast: true });
      }
      
      setPaginatedData(pages);
    }
  }, [invoice]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    // 1. Style Guard (Tailwind v4 Bypass) - Match Turkey Invoice View Logic
    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
        const text = style.textContent || "";
        const href = style.href || "";
        
        // Match our custom font by name or filename
        const isOurFont = text.includes('GOHQLJ+Times,New Roman') || 
                         text.includes('Times New Roman') ||
                         href.includes('StaybridgeFont');

        if (isOurFont) return; // Keep it

        // Remove other styles that might interfere with PDF (Tailwind v4 issues)
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    });

    try {
      // Image Verification
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
        filename: `Staybridge_Invoice_${invoice.invoiceNo || 'Staybridge'}.pdf`,
        image: { type: 'jpeg', quality: 3 },
        html2canvas: { 
            scale: 4, 
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
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      // 5. Instant Recovery (Styles Restore)
      headStyles.forEach(style => {
          if (!style.parentNode) {
              document.head.appendChild(style);
          }
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
      <div ref={invoiceRef} className="staybridge-invoice-wrapper">
        <style>{`
          @page { size: A4; margin: 0mm; }
          .staybridge-invoice-wrapper * {
            font-family: "GOHQLJ+Times,New Roman", "Times New Roman", Times, serif !important;
          }
          
          .sb-page {
            width: 210mm;
            min-height: 296mm;
            padding: 6mm;
            margin: 0 auto;
            background: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            box-sizing: border-box;
            color: #000;
            line-height: 1.25;
          }
          
          @media print {
            .staybridge-invoice-wrapper { padding: 0 !important; background: none !important; }
            .sb-page { margin: 0 !important; box-shadow: none !important; }
            .sb-page:not(:last-child) { page-break-after: always !important; }
            .no-print { display: none !important; }
          }

          .sb-logo-container {
            position: absolute;
            top: 2mm;
            right: 6mm;
          }
          
          .sb-logo-img {
            width: 175px;
            display: block;
          }
          
          .sb-header-title {
            font-size: 11pt;
            margin-top: 25mm;
            margin-bottom: 10px;
            font-weight: normal;
          }
          

          .sb-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            column-gap: 75px;
            margin-bottom: 20px;
            font-size: 9pt;
          }
          
          .sb-info-row {
            display: flex;
            margin-bottom: 7px;
            width: fit-content;
          }
          
          .sb-label {
            width: 100px;
            flex-shrink: 0;
            width: 100%
            white-space: nowrap;
          }
          
          .sb-value {
            flex: 1;
          }

          .sb-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
          }
          
          .sb-table thead th {
            border-top: 1pt solid #000;
            border-bottom: 1pt solid #000;
            padding: 10px 4px;
            text-align: left;
            font-weight: normal;
          }
          
          .sb-table tbody td {
            padding: 6px 4px;
            vertical-align: top;
          }
          
          .th-date{
            text-align: left;
            width: 95px;
          }

          .th-text{
            text-align: left;
            min-width: 220px;
            white-space: nowrap;
          }

          .th-rate{
            text-align: center !important;
            min-width: 200px;
            white-space: nowrap;
          }

          .th-charges{
            text-align: center !important;
            // min-width: 100px;
            margin-right: 50px;
            white-space: nowrap;
          }

          .th-dummy{
            text-align: center !important;
            min-width: 25px;
          }

          .th-egp1{
            text-align: center !important;
            width: 40px;
          }

          .th-credits{
            text-align: center !important;
            width: 40px;
          }

          .th-egp2{
            text-align: right !important;
            width: 60px;
          }

          .sb-summary-divider {
            border-top: 1pt solid #000;
            margin-top: 2mm;
            margin-bottom: 7mm;
          }

          .sb-total-row {
            display: flex;
            justify-content: space-between;
            height: 14px;
            padding-right: 4px;
            font-size: 10pt;
          }

          .sb-summary-section {
            margin-top: 7mm;
            display: flex;
            justify-content: flex-end;
            font-size: 10pt;
          }
          
          .sb-summary-left {
            padding-top: 15px;
            width: 37%;
            font-size: 10pt;
          }
          
          .sb-summary-right {
            padding-top: 15px;
            align-items: end;
            width: 55%;
            font-size: 10pt;
          }
          
          .sb-summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }

          .sb-balance-label {
            width: 100px;
          }
          
          .sb-footer {
            position: absolute;
            bottom: 10mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            line-height: 1.4;
          }

          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .w-80 { width: 80px; }
          .w-100 { width: 100px; }
          .w-120 { width: 120px; }
          .w-150 { width: 150px; }
          .w-40 { width: 40px; }
        `}</style>

        {paginatedData.map((page, idx) => (
          <div key={idx} className="sb-page">
            {/* Logo */}
            <div className="sb-logo-container">
              <img src={logo} alt="Staybridge Logo" className="sb-logo-img" />
            </div>

            {/* Header Title */}
            <div className="sb-header-title">INFORMATION INVOICE</div>

            {/* Information Grid */}
            <div className="sb-grid">
              <div className="space-y-1">
                <div className="sb-info-row">
                  <span className="sb-label">Guest Name:</span>
                  <span className="sb-value">{invoice.guestName}</span>
                </div>
                <div className="sb-info-row">
                  <span className="sb-label">Address:</span>
                  <span className="sb-value"><p>Algeria Square Building Number 12 First Floor,</p><p>Tripoli, Libya</p></span>
                </div>
                <div className="sb-info-row" style={{ marginTop: '10mm' }}>
                  <span className="sb-label">Company Name:</span>
                  <span className="sb-value">{invoice.companyName}</span>
                </div>
                <div className="sb-info-row">
                  <span className="sb-label">A/R Number:</span>
                  <span className="sb-value">{invoice.arNumber}</span>
                </div>
                <div className="sb-info-row" style={{ marginTop: '10mm', whiteSpace: 'nowrap' }}>
                  <span className="sb-label">IHG Rewards Number:</span>
                  <span className="sb-value" style={{ marginLeft: '32px' }}>{invoice.ihgRewardsNumber}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="sb-info-row h-5">
                  <span className="sb-label"></span>
                  <span className="sb-value"></span>
                </div>
                <div className="sb-info-row">
                  <span className="sb-label">Room No.:</span>
                  <span className="sb-value">{invoice.roomNo}</span>
                </div>
                <div className="sb-info-row">
                  <span className="sb-label">Arrival:</span>
                  <span className="sb-value">{invoice.formattedArrivalDate}</span>
                </div>
                <div className="sb-info-row">
                  <span className="sb-label">Departure:</span>
                  <span className="sb-value">{invoice.formattedDepartureDate}</span>
                </div>
                <div className="sb-info-row">
                  <span className="sb-label">Cashier:</span>
                  <span className="sb-value">{invoice.cashierId}</span>
                </div>
                
                <div className="sb-info-row" style={{ marginTop: '10mm' }}>
                  <span className="sb-label">Date:</span>
                  <span className="sb-value w-100">{invoice.formattedInvoiceDate}</span>
                  <span className="sb-label" style={{ width: '40px', marginLeft: '15mm' }}>Time:</span>
                  <span className="sb-value">{invoice.invoiceTime}</span>
                </div>
                <div className="sb-info-row">
                  <span className="sb-label">Page No.:</span>
                  <span className="sb-value">{page.pageNum} of {paginatedData.length}</span>
                </div>
                <div className="sb-info-row" style={{ marginTop: '5mm' }}>
                  <span className="sb-label">Invoice No.:</span>
                  <span className="sb-value">{invoice.invoiceNo}</span>
                </div>
              </div>
            </div>

            {/* Main Table */}
            <table className="sb-table">
              <thead>
                <tr>
                  <th className="th-date">Date</th>
                  <th className="th-text">Text</th>
                  <th className="th-rate">Exchange Rate</th>
                  <th className="th-charges">Charges</th>
                  <th className="th-dummy"></th>
                  <th className="th-egp1">EGP</th>
                  <th className="th-credits">Credits</th>
                  <th className="th-egp2">EGP</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((it, midx) => (
                  <tr key={midx}>
                    <td>{it.date}</td>
                    <td>{it.text}</td>
                    <td style={{textAlign: 'center'}}>{it.exchangeRate}</td>
                    <td style={{textAlign: 'right'}}>{formatCurrency(it.charges)}</td>
                    <td style={{textAlign: 'center'}}>{it.charges ? "" : ""}</td>
                    <td style={{textAlign: 'center'}}>{it.credits ? "" : ""}</td>
                    <td style={{textAlign: 'right'}}>{it.credits ? "" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Final Totals */}
            {page.isLast && (
              <>
                <div className="sb-summary-divider"></div>
                <div className="sb-total-row">
                    <div style={{ width: '100px', marginLeft: '45%' }}>Total</div>
                    <div className="text-right w-120" style={{ marginRight: '25px' }}>{formatCurrency(invoice.grandTotalEgp)}</div>
                    <div className="text-right w-80" style={{ marginRight: '60px' }}>0.00</div>
                </div>

                <div className="sb-summary-section">
                  <div className="sb-summary-left" style={{display: 'flex', gap: '18px', paddingRight: '10px'}}>
                    <span>Exchanges Rates of Current Date</span>
                    <span>{invoice.exchangeRate.toFixed(7)}</span>
                  </div>
                  <div className="sb-summary-right" style={{borderTop: '1px solid black'}}>
                    <div style={{display: 'flex', gap: '80px', marginBottom: '16px'}}>
                        <span>Balance EGP</span>
                        <span className="w-120 text-right">{formatCurrency(invoice.grandTotalEgp)}</span>
                    </div>
                    <div style={{display: 'flex', gap: '80px', marginBottom: '16px'}}>
                        <span>Total in USD</span>
                        <span className="w-120 text-right">{formatCurrency(invoice.balanceUsd)}</span>
                    </div>

                    <div style={{ marginTop: '5mm' }}>
                          <div className="sb-summary-row">
                            <span style={{ width: '120px' }}>Net Amount :</span>
                            <span className="sb-value">{formatCurrency(invoice.baseTaxableAmount)}</span>
                        </div>
                        <div className="sb-summary-row">
                            <span style={{ width: '120px' }}>Vat 14% :</span>
                            <span className="sb-value">{formatCurrency(invoice.vat14Percent)}</span>
                        </div>
                        <div className="sb-summary-row">
                            <span style={{ width: '120px' }}>Service Charge :</span>
                            <span className="sb-value">{formatCurrency(invoice.serviceCharge)}</span>
                        </div>
                        <div className="sb-summary-row">
                            <span style={{ width: '120px' }}>City Tax :</span>
                            <span className="sb-value">{formatCurrency(invoice.cityTax)}</span>
                        </div>
                    </div>
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

export default StaybridgeInvoiceView;