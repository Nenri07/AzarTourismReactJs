import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
const logo = '/fairmont-logo.png';
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";

const FairmontInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(0);
  const invoiceRef = useRef(null);
  
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
    const exRate = data.exchangeRate || 1;
    setExchangeRate(exRate);
    
    let totalEgpCharges = 0;
    let totalEgpCredits = 0;
    let totalUsdCharges = 0;
    let totalUsdCredits = 0;

    // Handle both plural/singular and camel/snake case
    const accList = data.accommodationDetails || data.accommodation_details || data.accommodations || [];
    if (Array.isArray(accList)) {
        accList.forEach(item => {
            const egpCharges = item.rate || item.amount || 0;
            const usdCharges = exRate > 0 ? egpCharges / exRate : 0;
            totalEgpCharges += egpCharges;
            totalUsdCharges += usdCharges;
            transactions.push({
                date: formatDate(item.date),
                rawDate: new Date(item.date),
                description: item.description || "Accommodation on BB basis",
                chargesEGP: egpCharges,
                creditsEGP: 0,
                chargesUSD: usdCharges,
                creditsUSD: 0,
                type: 'accommodation'
            });
        });
    }

    const servicesList = data.otherServices || data.other_services || [];
    if (Array.isArray(servicesList)) {
        servicesList.forEach(service => {
            const egpCharges = service.amount || service.rate || 0;
            const usdCharges = exRate > 0 ? egpCharges / exRate : 0;
            totalEgpCharges += egpCharges;
            totalUsdCharges += usdCharges;
            transactions.push({
                date: formatDate(service.date),
                rawDate: new Date(service.date),
                description: service.name || service.description || "Service",
                chargesEGP: egpCharges,
                creditsEGP: 0,
                chargesUSD: usdCharges,
                creditsUSD: 0,
                type: 'service'
            });
        });
    }

    // Sort by date. If dates are the same, accommodation (night) comes first.
    transactions.sort((a, b) => {
      const timeA = a.rawDate instanceof Date && !isNaN(a.rawDate) ? a.rawDate.getTime() : 0;
      const timeB = b.rawDate instanceof Date && !isNaN(b.rawDate) ? b.rawDate.getTime() : 0;
      const timeDiff = timeA - timeB;
      if (timeDiff !== 0) return timeDiff;
      if (a.type === 'accommodation' && b.type !== 'accommodation') return -1;
      if (a.type !== 'accommodation' && b.type === 'accommodation') return 1;
      return 0;
    });

    return {
      ...data,
      transactions,
      totalEgpCharges,
      totalEgpCredits,
      totalUsdCharges,
      totalUsdCredits,
      formattedInvoiceDate: formatDate(data.invoiceDate || new Date().toISOString()),
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
        return `${dd}-${mm}-${yy}`;
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

      if (totalTx > 22) {
        // If greater than 22 rows, break the page (chunk size 19)
        const CHUNK_SIZE = 22;
        for (let i = 0; i < totalTx; i += CHUNK_SIZE) {
          pages.push({
            items: transactions.slice(i, i + CHUNK_SIZE),
            pageNum: pages.length + 1,
            isLast: i + CHUNK_SIZE >= totalTx
          });
        }
      } else if (totalTx >= 18) {
        // If 18 to 22 rows, show all rows on page 1 and shift totals to page 2
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
        // Less than 18 rows, show everything on one page
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

    // 1. Style Guard (Tailwind v4 Bypass) - Match Staybridge logic
    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
        const text = style.textContent || "";
        const href = style.href || "";
        
        // Match Fairmont styles/fonts for preservation
        const isPreserved = text.includes('Fairmont') || 
                           text.includes('fm-') ||
                           href.includes('fairmont') || 
                           text.includes('Arial');

        if (isPreserved) return; // Keep it

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
        filename: `Fairmont_Invoice_${invoice.invoiceNo || 'Fairmont'}.pdf`,
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
      // Restore Styles
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
      <style>{`
          @page { size: A4; margin: 0mm; }
          .fairmont-invoice-wrapper {
            overflow: hidden;
            background-color: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .fairmont-invoice-wrapper * {
            font-family: Arial, Helvetica, sans-serif;
            box-sizing: border-box;
            color: #000;
          }
          
          .fm-page {
            width: 210mm;
            min-height: 295mm;
            padding: 0mm 10mm 0mm 10mm;
            margin: 0 auto;
            background: #fff;
            position: relative;
            box-sizing: border-box;
            line-height: 1.3;
            display: flex;
            flex-direction: column;
          }
          
          @media print {
            .fairmont-invoice-wrapper { padding: 0 !important; background: none !important; }
            .fm-page { margin: 0 !important; box-shadow: none !important; }
            .fm-page:not(:last-child) { page-break-after: always !important; }
            .no-print { display: none !important; }
          }

          .fm-header {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .fm-logo-img {
            width: 200px;
            height: 100px;
            display: block;
            margin: 0 auto;
          }
          
          .fm-top-section {
            display: flex;
            justify-content: space-between;
            gap: 65px;
            margin-bottom: 12px;
            font-size: 11px;
            padding: 0px 4px;
          }

          .fm-guest-details {
            width: 55%;
            font-weight: bold;
          }

          .fm-meta-details {
            width: 40%;
            font-weight: bold;
          }

          .fm-info-table, .fm-meta-table {
            border-collapse: collapse;
            width: 100%;
          }

          .fm-info-table td, .fm-meta-table td {
            padding: 1.5px 0;
            vertical-align: top;
          }

          .fm-info-table td:first-child { width: 102px; }
          .fm-meta-table td:first-child { width: 95px; }

          .fm-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 10px;
          }

          .fm-table thead th {
             background-color: #000;
             color: #fff;
             font-size: 11px;
             font-weight: bold;
             padding: 1px 4px;
             text-align: right;
             vertical-align: top;
             border: 1px solid #000;
             -webkit-print-color-adjust: exact !important;
             print-color-adjust: exact !important;
          }

          .fm-table thead th:first-child, .fm-table thead th:nth-child(2) {
            text-align: left;
          }

          .fm-table tbody td {
            padding: 6px 6px;
            vertical-align: top;
            text-align: right;
          }

          .fm-table tbody td:first-child, .fm-table tbody td:nth-child(2) {
            text-align: left;
          }

          .fm-total-row td {
            font-weight: bold;
            padding: 8px 4px;
          }
          .fm-total-row td:nth-child(3),
          .fm-total-row td:nth-child(4),
          .fm-total-row td:nth-child(5),
          .fm-total-row td:nth-child(6) {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
          }

          .fm-summary-section {
            width: 100%;
            margin-top: 20px;
            font-size: 11px;
            font-weight: bold;
          }

          .fm-summary-table {
            width: auto;
            margin-left: auto;
            border-collapse: collapse;
          }

          .fm-summary-table td {
            padding: 2px 4px;
            text-align: right;
          }

          .fm-label-col { width: 130px; }
          .fm-val-col { width: 100px; }
          .fm-exch-label { width: 120px; padding-left: 30px; }
          .fm-exch-val { width: 60px; text-align: right !important; }

          .fm-footer {
            margin-top: auto;
            font-size: 11px;
            color: #000;
          }

        `}</style>

      <div ref={invoiceRef} className="fairmont-invoice-wrapper">
        {paginatedData.map((page, idx) => (
          <div key={idx} className="fm-page">
            <div className="fm-header">
              <img src={logo} alt="Fairmont Logo" className="fm-logo-img" />
            </div>

            <div className="fm-top-section">
              <div className="fm-guest-details">
                {invoice.guestName}<br />
                {invoice.companyName || "Azar Tourism"}<br />
                Algeria Square Building Number 12 First Floor,<br />
                Tripoli, Libya<br /><br />
                <table className="fm-info-table">
                  <tbody>
                    <tr><td colSpan="2" style={{ paddingBottom: '5px' }}>COPY OF INVOICE</td></tr>
                    <tr><td>Membership No</td><td>: {invoice.membershipNo || ""}</td></tr>
                    <tr><td>A/R Number</td><td>: {invoice.arNumber || ""}</td></tr>
                    <tr><td>Group Code</td><td>: {invoice.groupCode || ""}</td></tr>
                    <tr><td>Company/Agent</td><td>: {invoice.companyName || "Azar Tourism"}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="fm-meta-details">
                <table className="fm-meta-table">
                  <tbody>
                    <tr><td>Room No.</td><td>: {invoice.roomNo}</td></tr>
                    <tr><td>Arrival</td><td>: {invoice.formattedArrivalDate}</td></tr>
                    <tr><td>Departure</td><td>: {invoice.formattedDepartureDate}</td></tr>
                    <tr><td>Page No.</td><td>: {page.pageNum} of {paginatedData.length}</td></tr>
                    <tr><td>Folio No</td><td>: {invoice.folioNo || ""}</td></tr>
                    <tr><td>Conf. No.</td><td>: {invoice.confNo || ""}</td></tr>
                    <tr><td>Cashier No.</td><td>: {invoice.cashierId || invoice.cashier || ""}</td></tr>
                    <tr><td>User ID</td><td>: {invoice.userId || ""}</td></tr>
                    <tr><td>Tax Card No.</td><td>: {invoice.taxCardNo || ""}</td></tr>
                    <tr><td>Invoice Nu</td><td>: {invoice.invoiceNo}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <table className="fm-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Date</th>
                  <th style={{ width: '40%' }}>Description</th>
                  <th style={{ width: '12%' }}>Charges <br /><span style={{ color: "#fff", fontWeight: "normal", whiteSpace: "nowrap" }}>EGP  </span></th>
                  <th style={{ width: '13%' }}>Credits <br /><span style={{ color: "#fff", fontWeight: "normal", whiteSpace: "nowrap" }}>EGP</span></th>
                  <th style={{ width: '13%' }}>Charges <br /><span style={{ color: "#fff", fontWeight: "normal", whiteSpace: "nowrap" }}>USD</span></th>
                  <th style={{ width: '13%' }}>Credits <br /><span style={{ color: "#fff", fontWeight: "normal", whiteSpace: "nowrap" }}>USD</span></th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((it, midx) => (
                  <tr key={midx}>
                    <td>{it.date}</td>
                    <td>{it.description}</td>
                    <td>{formatCurrency(it.chargesEGP)}</td>
                    <td>{it.creditsEGP > 0 ? formatCurrency(it.creditsEGP) : ""}</td>
                    <td>{formatCurrency(it.chargesUSD)}</td>
                    <td>{it.creditsUSD > 0 ? formatCurrency(it.creditsUSD) : "0.00"}</td>
                  </tr>
                ))}
                {page.isLast && (
                  <tr className="fm-total-row">
                    <td></td>
                    <td style={{ textAlign: 'right' }}>Total</td>
                    <td>{formatCurrency(invoice.totalEgpCharges)}</td>
                    <td>{formatCurrency(invoice.totalEgpCredits || invoice.totalEgpCharges)}</td>
                    <td>{formatCurrency(invoice.totalUsdCharges)}</td>
                    <td>{formatCurrency(invoice.totalUsdCredits || invoice.totalUsdCharges)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {page.isLast && (
              <div className="fm-summary-section">
                <table className="fm-summary-table">
                  <tbody>
                    <tr>
                      <td className="fm-label-col">Balance Due</td>
                      <td className="fm-val-col">0.00</td>
                      <td className="fm-label-col">Balance Due</td>
                      <td className="fm-val-col" style={{paddingRight: '70px', width: '138px'}}>0.00 USD</td>
                    </tr>
                    <tr>
                      <td className="fm-label-col">Net Amount</td>
                      <td className="fm-val-col">{formatCurrency(invoice.baseTaxableAmount)}</td>
                      <td colSpan="2"></td>
                    </tr>
                    <tr>
                      <td className="fm-label-col">12% Service Charge</td>
                      <td className="fm-val-col">{formatCurrency(invoice.serviceCharge)}</td>
                      <td colSpan="2"></td>
                    </tr>
                    <tr>
                      <td className="fm-label-col">14% VAT</td>
                      <td className="fm-val-col">{formatCurrency(invoice.vat14Percent)}</td>
                      <td colSpan="2"></td>
                    </tr>
                    <tr>
                      <td className="fm-label-col">1% City Tax</td>
                      <td className="fm-val-col">{formatCurrency(invoice.cityTax)}</td>
                      <td colSpan="2"></td>
                    </tr>
                    <tr className="fm-exch-row">
                      <td className="fm-exch-label">Exch Rate</td>
                      <td className="fm-exch-val">{exchangeRate.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="fm-footer">
              Fairmont Nile City Hotel Cairo<br />
              Nile City Towers – 2005 B<br />
              Corniche El Nil, Ramlet Beaulac<br />
              Cairo , Egypt
            </div>

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default FairmontInvoiceView;