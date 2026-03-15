import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";

import "../../assets/fonts/StaybridgeFont.css";

const FourSeasonsInvoiceView = ({ invoiceData }) => {
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
                text: item.text || item.description || "Room Accommodation",
                chargesEGP: formatCurrency(item.chargesEgp ?? item.rate ?? 0),
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
                chargesEGP: formatCurrency(service.amount || 0),
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
        return `${dd}/${mm}/${yy}`; // Four Seasons format
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

      // ROWS_PER_PAGE for layout
      if (totalTx > 24) {
        const CHUNK_SIZE = 24;
        for (let i = 0; i < totalTx; i += CHUNK_SIZE) {
          pages.push({
            items: items.slice(i, i + CHUNK_SIZE),
            pageNum: pages.length + 1,
            isLast: i + CHUNK_SIZE >= totalTx
          });
        }
      } else if (totalTx >= 20) {
        pages.push({
          items: items,
          pageNum: 1,
          isLast: false // Hide totals
        });
        pages.push({
          items: [],
          pageNum: 2,
          isLast: true // Show totals
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
        const isOurFont = text.includes('GOHQLJ+Times,New Roman') || 
                         text.includes('Times New Roman') ||
                         href.includes('StaybridgeFont');
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
        filename: `Four_Seasons_Invoice_${invoice.invoiceNo || 'Invoice'}.pdf`,
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
      <div ref={invoiceRef} className="fs-invoice-wrapper">
        <style>{`
          @page { size: A4; margin: 0; }
          .fs-invoice-wrapper * {
            font-family: "GOHQLJ+Times,New Roman", "Times New Roman", Times, serif !important;
            color: #000;
          }
          
          .fs-page {
            width: 210mm;
            min-height: 296mm;
            padding: 2mm 8mm;
            margin: 0 auto;
            background: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            line-height: 1.25;
          }
          
          @media print {
            .fs-invoice-wrapper { padding: 0 !important; background: none !important; }
            .fs-page { padding: 15mm 15mm !important; margin: 0 !important; box-shadow: none !important; border: none; }
            .fs-page:not(:last-child) { page-break-after: always !important; }
          }

          .branding { text-align: center; margin-bottom: 6mm; }
          .brand-logo { width: 300px; height: auto; margin: 0 auto; display: block; }

          .info-section { display: flex; justify-content: space-between; gap: 10mm; margin: 0 2mm 2mm 10mm; font-size: 10pt; }
          
          .left-info { width: 45%; line-height: 1.4; }
          .company-name { font-weight: 700; font-family: "Times New Roman", Times, serif !important; }
          .invoice-title { margin-top: 8mm;}

          .right-info { width: 40%; }
          .meta-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
          .meta-table td { padding: 2px 0; vertical-align: top; }
          .label-cell { width: 140px; }

          .main-table { width: 100%; border-collapse: collapse; font-size: 10pt;}
          .main-table thead tr { border-top: 1pt solid #000; border-bottom: 1pt solid #000; }
          .main-table th { padding: 0px 2px; text-align: left; font-weight: normal; vertical-align: top; }
          .main-table td { padding: 3px 4px; vertical-align: top; }
          .text-right { text-align: right !important; }
          .text-center { text-align: center !important; }
          
          .total-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 5px; }
          .total-table td { padding: 7px 18px; vertical-align: top; }
        `}</style>

        {paginatedData.map((page, idx) => (
          <div key={idx} className="fs-page">
            
            {/* Hotel Branding */}
            <div className="branding">
              <img src="/fourseason-logo.png" alt="Four Seasons" className="brand-logo" />
            </div>

            {/* Guest and Information */}
            <div className="info-section">
              <div className="left-info">
                <div style={{ paddingBottom: '10px' }}>{invoice.guestName}</div>
                <div className="company-name">{invoice.companyNames || "Azar Tourism Services"}</div>
                <div style={{ maxWidth: '280px' }}>
                  {invoice.companyAddress ? invoice.companyAddress : (
                    <>
                      Algeria Square Building Number 12 First<br />
                      Floor, Tripoli 1254 Tripoli<br />
                      Libya
                    </>
                  )}
                </div>
                <div className="invoice-title">INFORMATION INVOICE</div>
              </div>

              <div className="right-info">
                <table className="meta-table">
                  <tbody>
                    <tr><td className="label-cell">Room No.:</td><td>{invoice.roomNo}</td></tr>
                    <tr><td className="label-cell">Arrival:</td><td>{invoice.formattedArrivalDate}</td></tr>
                    <tr><td className="label-cell">Departure:</td><td>{invoice.formattedDepartureDate}</td></tr>
                    <tr><td className="label-cell">No of Guests:</td><td>{invoice.noOfGuests}</td></tr>
                    <tr><td className="label-cell">Package:</td><td>{invoice.package}</td></tr>
                    <tr><td className="label-cell">Folio No.:</td><td>{invoice.folioNo}</td></tr>
                    <tr><td className="label-cell">Invoice No.:</td><td>{invoice.invoiceNo}</td></tr>
                    <tr><td className="label-cell">Cashier:</td><td>{invoice.cashierName || invoice.cashierId}</td></tr>
                    <tr><td className="label-cell">Check Out Time:</td><td>{invoice.invoiceTime}</td></tr>
                    <tr><td className="label-cell">Date:</td><td>{invoice.formattedInvoiceDate}</td></tr>
                    <tr><td className="label-cell">Page No.:</td><td>{page.pageNum} of {paginatedData.length}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transaction Table */}
            <table className="main-table">
              <thead>
                <tr>
                  <th style={{ width: '13%' }}>Date</th>
                  <th style={{ width: '50%' }}>Text</th>
                  <th className="text-right" style={{ width: '20%' }}>Charges<br/>EGP</th>
                  <th className="text-right" style={{ width: '18%', paddingRight: '18px' }}>Credits<br/>EGP</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((item, midx) => (
                  <tr key={midx}>
                    <td>{item.date}</td>
                    <td>{item.text}</td>
                    <td className="text-right">{item.chargesEGP}</td>
                    <td className="text-right">{item.creditsEGP}</td>
                  </tr>
                ))}
                {page.items.length === 0 && (
                  <tr>
                    {/* <td colSpan="4" style={{ visibility: 'hidden' }}>&nbsp;</td> */}
                    <td colSpan="4" style={{ visibility: 'hidden' }}></td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Footer Totals */}
            {page.isLast && (
              <>
              {page.items.length > 0 && (
                <div style={{ height: '4px', borderTop: '1px solid #000' }}></div>
              )}
                <table className="total-table">
                  <tbody>
                    <tr>
                      <td style={{ width: '10%' }}></td>
                      <td style={{ width: '30%', textAlign: 'center' }}>Total</td>
                    <td style={{ width: '20%', paddingRight: '20px' }} className="text-right">{formatCurrency(invoice.grandTotalEgp)}</td>
                    <td style={{ width: '25%' }} className="text-right">{formatCurrency(invoice.creditsTotal || invoice.grandTotalEgp)}</td>
                  </tr>
                  <tr>
                    <td style={{ width: '35%' }}></td>
                    <td colSpan="3" style={{ borderTop: '1pt solid #000', padding: '0' }}>
                      <table style={{ width: '80%', marginLeft: 'auto', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '30%', padding: '5px 0px 0px 0px' }}>Balance EGP</td>
                            <td style={{ width: '10%', padding: '5px 28px 0px 0' }} className="text-right">{formatCurrency(invoice.grandTotalEgp - (invoice.creditsTotal || 0))}</td>
                            <td style={{ width: '16%', fontSize: '8.5pt', padding: 0, lineHeight: '1.1' }} rowSpan="2">
                              Exchanges Rates of<br/>
                              Current Date<br/>
                              {invoice.exchangeRate ? invoice.exchangeRate.toFixed(2) : "48.17"}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '6px 0px 0px 0px' }}>Total In USD</td>
                            <td className="text-right" style={{ padding: '6px 28px 0px 0' }}>{formatCurrency(invoice.balanceUsd)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              </>
            )}
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default FourSeasonsInvoiceView;