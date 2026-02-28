import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
const logo = '/holiday_logo.png';
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";

const HolidayInvoiceView = ({ invoiceData }) => {
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
            transactions.push({
                date: formatDate(item.date),
                rawDate: new Date(item.date),
                description: item.description || "Accommodation",
                reference: item.reference || (item.id ? item.id.toString() : ""),
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
                description: service.name || "Service",
                reference: service.reference || "",
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

      // Using the Staybridge pagination logic
      if (totalTx > 15) {
        const CHUNK_SIZE = 15;
        for (let i = 0; i < totalTx; i += CHUNK_SIZE) {
          pages.push({
            items: transactions.slice(i, i + CHUNK_SIZE),
            pageNum: pages.length + 1,
            isLast: i + CHUNK_SIZE >= totalTx
          });
        }
      } else if (totalTx >= 14) {
        pages.push({
          items: transactions,
          pageNum: 1,
          isLast: false
        });
        pages.push({
          items: [],
          pageNum: 2,
          isLast: true
        });
      } else {
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

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
        const text = style.textContent || "";
        const href = style.href || "";
        const isPreserved = text.includes('HolidayInn') || href.includes('holiday');
        if (isPreserved) return;
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
        filename: `HolidayInn_Invoice_${invoice.invoiceNo || 'Invoice'}.pdf`,
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
          .holiday-invoice-wrapper {
            overflow: hidden;
          }
          .holiday-invoice-wrapper * {
            font-family: sans-serif;
            box-sizing: border-box;
            color: #000;
          }
          
          .hi-page {
            width: 210mm;
            min-height: 295mm;
            padding: 12mm;
            margin: 0 auto;
            background: #fff;
            position: relative;
            box-sizing: border-box;
            line-height: 1.3;
            display: flex;
            flex-direction: column;
          }
          
          @media print {
            .holiday-invoice-wrapper { padding: 0 !important; background: none !important; }
            .hi-page { margin: 0 !important; box-shadow: none !important; }
            .hi-page:not(:last-child) { page-break-after: always !important; }
            .no-print { display: none !important; }
          }

          .hi-header {
            text-align: center;
          }
          
          .hi-logo-img {
            width: 180px;
            display: block;
            margin: 0 auto 10px;
          }
          
          .hi-title {
            font-size: 28pt;
            font-weight: 700;
            text-transform: uppercase;
            margin-top: 15px;
            text-align: center;
          }

          .hi-section-header {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 8px 0;
            margin: 10px 0;
            font-weight: bold;
            font-size: 10pt;
            text-transform: uppercase;
          }

          .hi-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 100px;
            font-size: 9pt;
          }

          .hi-info-row {
            display: grid;
            grid-template-columns: 160px 1fr;
          }

          .hi-label {
            font-weight: bold;
          }

          .hi-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-top: 10px;
          }

          .hi-table thead th {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 10px 0;
            text-align: left;
            font-weight: bold;
          }

          .hi-table tbody td {
            padding: 10px 0;
            vertical-align: top;
          }

          .hi-table .text-right {
            text-align: right;
          }

          .hi-reference {
            display: block;
            font-size: 8pt;
            margin-top: 2px;
            color: #333;
          }

          .hi-totals-section {
            width: 100%;
            padding-top: 10px;
            margin-bottom: 40px;
          }

          .hi-totals-flex {
            display: flex;
            justify-content: flex-end;
          }

          .hi-totals-grid {
            display: grid;
            grid-template-columns: 220px 110px;
            font-size: 9.5pt;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .hi-page-info { text-align: center; font-size: 8pt; margin-top: 10px; }
        `}</style>

      <div ref={invoiceRef} className="holiday-invoice-wrapper">
        {paginatedData.map((page, idx) => (
          <div key={idx} className="hi-page">
            <div className="hi-header">
              <img src={logo} alt="Holiday Inn Logo" className="hi-logo-img" />
              <div className="hi-title">YOUR STAY</div>
            </div>

            <div className="hi-section-header">INVOICE INFORMATION</div>

            <div className="hi-info-grid">
              <div>
                <div className="hi-info-row">
                  <span className="hi-label">Guest Name</span>
                  <span>{invoice.guestName}</span>
                </div>
                <div className="hi-info-row">
                  <span className="hi-label">Confirmation No.</span>
                  <span>{invoice.confNo || ""}</span>
                </div>
                <div className="hi-info-row">
                  <span className="hi-label">Cashier</span>
                  <span>{invoice.cashierId || invoice.cashier || ""}</span>
                </div>
                <div className="hi-info-row" style={{ height: "15px" }}>
                  <span className="hi-label"></span>
                  <span></span>
                </div>
                <div className="hi-info-row">
                  <span className="hi-label">IHG One Rewards No.</span>
                  <span>{invoice.ihgRewardsNumber || ""}</span>
                </div>
                <div className="hi-info-row">
                  <span className="hi-label">Charge to</span>
                  <span>{invoice.companyName || "AZAR Tourism"}</span>
                </div>
              </div>

              <div>
                <div className="hi-info-row">
                  <span className="hi-label">Print Date</span>
                  <span>{invoice.formattedInvoiceDate}</span>
                </div>
                <div className="hi-info-row">
                  <span className="hi-label">Room No.</span>
                  <span>{invoice.roomNo}</span>
                </div>
                <div className="hi-info-row">
                  <span className="hi-label">Arrival</span>
                  <span>{invoice.formattedArrivalDate}</span>
                </div>
                <div className="hi-info-row">
                  <span className="hi-label">Departure</span>
                  <span>{invoice.formattedDepartureDate}</span>
                </div>
                <div className="hi-info-row">
                  <span className="hi-label">Page</span>
                  <span>{page.pageNum} of {paginatedData.length}</span>
                </div>
                <div className="hi-info-row">
                  <span className="hi-label">Invoice No.</span>
                  <span>{invoice.invoiceNo}</span>
                </div>
              </div>
            </div>

            <table className="hi-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Date</th>
                  <th style={{ width: '40%' }}>Description</th>
                  <th className="text-right" style={{ width: '20%' }}>Charges</th>
                  <th className="text-right" style={{ width: '40%' }}>Credits</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((it, midx) => (
                  <tr key={midx}>
                    <td>{it.date}</td>
                    <td>
                        {it.description}
                        {it.reference && <span className="hi-reference">{it.reference}</span>}
                    </td>
                    <td className="text-right">{it.charges > 0 ? formatCurrency(it.charges) : ""}</td>
                    <td className="text-right">{it.credits > 0 ? formatCurrency(it.credits) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {page.isLast && (
              <div className="hi-totals-section">
                <div className="hi-totals-flex">
                  <div className="hi-totals-grid">
                    <span className="hi-label">Total Balance EGP</span>
                    <span className="text-left">{formatCurrency(invoice.grandTotalEgp)}</span>
                    
                    <span className="hi-label">Total Balance USD</span>
                    <span className="text-left">{formatCurrency(invoice.balanceUsd)}</span>
                    
                    <span className="hi-label" style={{marginTop: '10px'}}>Total excl. VAT</span>
                    <span className="text-left" style={{marginTop: '10px'}}>{formatCurrency(invoice.baseTaxableAmount)}</span>
                    
                    <span className="hi-label">VAT Amount</span>
                    <span className="text-left">{formatCurrency(invoice.vat14Percent)}</span>
                    
                    <span className="hi-label" style={{marginTop: '10px'}}>Total incl. VAT</span>
                    <span className="text-left" style={{marginTop: '10px'}}>{formatCurrency((invoice.baseTaxableAmount || 0) + (invoice.vat14Percent || 0))}</span>
                    <span className="hi-label">Exchange Rate 1 USD</span>
                    <span className="text-left">{invoice.exchangeRate}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="hi-page-info">{page.pageNum} of {paginatedData.length}</div>
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default HolidayInvoiceView;