import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
const logo = '/ritz-logo.png';
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";

const RitzCarltonInvoiceView = ({ invoiceData }) => {
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

    const items = [];
    
    if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
        data.accommodationDetails.forEach(item => {
            items.push({
                date: formatDate(item.date),
                rawDate: new Date(item.date),
                text: item.text || item.description || "Accommodation",
                detail: item.detail || `${(data.usdAmount || 0).toFixed(2)} USD x ${(data.exchangeRate || 0).toFixed(2)}`,
                debitsEGP: formatCurrency(item.debitsEgp ?? item.rate ?? 0),
                creditsEGP: item.creditsEgp ? formatCurrency(item.creditsEgp) : "",
                type: 'accommodation'
            });
        });
    }

    if (data.otherServices && Array.isArray(data.otherServices)) {
        data.otherServices.forEach(service => {
            items.push({
                date: formatDate(service.date),
                rawDate: new Date(service.date),
                text: service.name || "Service",
                detail: "",
                debitsEGP: formatCurrency(service.amount || 0),
                creditsEGP: "",
                type: 'service'
            });
        });
    }

    // Sort by date.
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
    if (invoice && invoice.items) {
      const pages = [];
      const items = invoice.items;
      const totalTx = items.length;

      // Adjusted ROWS_PER_PAGE for Ritz layout
      if (totalTx > 18) {
        const CHUNK_SIZE = 18;
        for (let i = 0; i < totalTx; i += CHUNK_SIZE) {
          pages.push({
            items: items.slice(i, i + CHUNK_SIZE),
            pageNum: pages.length + 1,
            isLast: i + CHUNK_SIZE >= totalTx
          });
        }
      } else if (totalTx >= 17) {
        pages.push({
          items: items,
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
          items: items,
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
        const isOurFont = text.includes('Times New Roman');
        if (isOurFont) return;
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
        filename: `Ritz_Carlton_Invoice_${invoice.invoiceNo || 'Invoice'}.pdf`,
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
      <div ref={invoiceRef} className="ritz-invoice-view-wrapper">
        <style>{`
          @page { size: A4; margin: 0; }
          .ritz-invoice-view-wrapper * {
            font-family: "Sans-serif" !important;
            color: #000;
            line-height: 1.15;
          }
          
          .ritz-page {
            width: 210mm;
            min-height: 296mm;
            padding: 4mm 6mm;
            margin: 0 auto;
            background: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            box-sizing: border-box;
          }
          
          @media print {
            .ritz-invoice-view-wrapper { padding: 0 !important; background: none !important; }
            .ritz-page { margin: 0 !important; box-shadow: none !important; border: none; }
            .ritz-page:not(:last-child) { page-break-after: always !important; }
          }

          .ritz-logo-container {
            text-align: center;
            margin-bottom: 2mm;
          }
          
          .ritz-logo-img {
            width: 240px;
            display: inline-block;
          }

          .ritz-header {
            display: flex;
            justify-content: space-between;
            font-size: 11pt;
            // padding: 0 5mm;
            margin-bottom: 4mm;
          }

          .ritz-guest-info {
            width: 55%;
          }

          .ritz-meta-info {
            width: 35%;
          }

          .ritz-info-table {
            width: 100%;
            border-collapse: collapse;
          }

          .ritz-info-table td {
            padding: 3px 0;
            vertical-align: top;
          }

          .ritz-label-left { width: 135px; }
          .ritz-label-right { width: 125px; }
          .ritz-colon { width: 25px; text-align: center; }

          .ritz-title {
            font-weight: bold;
            margin-top: 4mm;
            margin-bottom: 2mm;
            font-size: 11pt;
          }

          .ritz-main-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5pt;
          }

          .ritz-main-table thead th {
            border-top: 1.5pt solid #000;
            border-bottom: 1.5pt solid #000;
            padding: 8px 4px;
            text-align: left;
            font-weight: bold;
            vertical-align: top;
          }

          .ritz-main-table tbody td {
            padding: 8px 4px;
            vertical-align: top;
          }

          .text-right { text-align: right; }
          .text-center { text-align: center; }

          .ritz-total-line {
            border-top: 2pt solid #000;
            font-weight: bold;
            display: flex;
            justify-content: end;
            padding: 8px 4px;
            font-size: 11pt;
          }

          .ritz-final-summary-area {
            margin-top: 1mm;
            display: flex;
            justify-content: flex-end;
          }

          .ritz-summary-box {
            border-top: 3pt solid #000;
            width: 446px;
          }

          .ritz-balance-row {
            padding: 5px 105px;
            padding-right: 110px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            font-size: 11pt;
          }

          .ritz-usd-row {
            padding: 5px 105px;
            padding-right: 110px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            font-size: 11pt;
          }
        `}</style>

        {paginatedData.map((page, idx) => (
          <div key={idx} className="ritz-page">
            {/* Logo and Brand */}
            <div className="ritz-logo-container">
              <img src={logo} alt="The Nile Ritz-Carlton Cairo" className="ritz-logo-img h-18" />
            </div>

            {/* Header Section */}
            <div className="ritz-header">
              <div className="ritz-guest-info">
                <div style={{ marginBottom: "8px" }}>{invoice.guestName}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Azar Tourism Services</div>
                  <div>Algeria Square Building Number 12,</div>
                  <div>First Floor, Tripoli, Libya</div>
                </div>

                <div className="ritz-title">INFORMATION INVOICE</div>
                <table className="ritz-info-table">
                  <tbody>
                    <tr><td className="ritz-label-left
                    ">C/O Time</td><td className="ritz-colon">:</td><td>{invoice.invoiceTime}</td></tr>
                    <tr><td className="ritz-label-left
                    ">A/R Number</td><td className="ritz-colon">:</td><td>{invoice.arNumber || ""}</td></tr>
                    <tr><td className="ritz-label-left">Membership No</td><td className="ritz-colon">:</td>{invoice.membershipNo ? invoice.membershipNo : ""}<td></td></tr>
                  </tbody>
                </table>
                <div style={{ display: 'flex', marginTop: '4mm' }}>
                  <div className="ritz-label-left">Company Name</div>
                  <div className="ritz-colon">:</div>
                  <div style={{ textTransform: "uppercase"}}>{invoice.companyName || "AZAR TOURISM SERVICES"}</div>
                </div>
              </div>

              <div className="ritz-meta-info">
                <table className="ritz-info-table">
                  <tbody>
                    <tr><td className="ritz-label-right">Room No.</td><td className="ritz-colon">:</td><td>{invoice.roomNo}</td></tr>
                    <tr><td className="ritz-label-right">Arrival</td><td className="ritz-colon">:</td><td>{invoice.formattedArrivalDate}</td></tr>
                    <tr><td className="ritz-label-right">Departure</td><td className="ritz-colon">:</td><td>{invoice.formattedDepartureDate}</td></tr>
                    <tr><td className="ritz-label-right">Page No.</td><td className="ritz-colon">:</td><td>{page.pageNum} of {paginatedData.length}</td></tr>
                    <tr><td className="ritz-label-right">Folio No.</td><td className="ritz-colon">:</td><td>{invoice.folioNo}</td></tr>
                    <tr><td className="ritz-label-right">Invoice No.</td><td className="ritz-colon">:</td><td>{invoice.invoiceNo}</td></tr>
                    <tr><td className="ritz-label-right">Conf. No.</td><td className="ritz-colon">:</td><td>{invoice.confNo}</td></tr>
                    <tr><td className="ritz-label-right">Cashier No.</td><td className="ritz-colon">:</td><td>{invoice.cashierId}</td></tr>
                    <tr><td className="ritz-label-right">Cashier</td><td className="ritz-colon">:</td><td>{invoice.cashierName}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Content Table */}
            <table className="ritz-main-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Date</th>
                  <th style={{ width: '24%' }}>Text</th>
                  <th style={{ width: '36%' }}></th>
                  <th style={{ width: '17%' }} className="text-center">
                    <div style={{width: 'fit-content', margin: '0 auto'}}>Debits</div>
                    <div style={{ paddingTop: '5px', width: 'fit-content', margin: '0 0 0 38px'}}>EGP</div>
                  </th>
                  <th style={{ width: '15%' }} className="text-center">
                    <div>Credits</div>
                    <div style={{ paddingTop: '5px', width: 'fit-content', margin: '0 0 0 0px'}}>EGP</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((item, midx) => (
                  <tr key={midx}>
                    <td>{item.date}</td>
                    <td>{item.text}</td>
                    <td className="text-center">{item.detail}</td>
                    <td className="text-center">{item.debitsEGP}</td>
                    <td className="text-right">{item.creditsEGP}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary Section */}
            {page.isLast && (
              <div style={{ marginTop: '2mm' }}>
                <div className="ritz-total-line">
                  <div style={{ width: '38%', textAlign: 'right' }}>Total</div>
                  <div style={{ width: '40%' }}></div>
                  <div className="text-center" style={{ width: '20%' }}>{formatCurrency(invoice.grandTotalEgp)}</div>
                  <div className="text-right" style={{ width: 'fit-content' }}>{formatCurrency(invoice.grandTotalEgp)}</div>
                </div>

                <div className="ritz-final-summary-area">
                  <div className="ritz-summary-box">
                    <div className="ritz-balance-row">
                      <span>Balance EGP</span>
                      <span>0.00</span>
                    </div>
                    <div className="ritz-usd-row">
                      <span>Total In USD</span>
                      <span>{formatCurrency(invoice.balanceUsd)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </InvoiceTemplate>
  );
};

export default RitzCarltonInvoiceView;