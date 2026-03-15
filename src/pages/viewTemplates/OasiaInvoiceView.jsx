import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '../../../public/OASIA_Logo.png';

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
  } catch {
    return dateStr;
  }
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "0.00";
  return parseFloat(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const parseDateForSort = (dateStr) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const OasiaInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  // ─────────────────────────────────────────────────────────────────────────────
  // MAPPING API DATA TO VIEW SCHEMA & SORTING BY DATE
  // ─────────────────────────────────────────────────────────────────────────────
  const mapApiDataToInvoice = (data) => {
    if (!data) return null;

    const accommodationItems = (data.accommodationDetails || []).map((item, index) => ({
      id: `acc_${index}`,
      rawDate: parseDateForSort(item.date),
      date: formatDate(item.date),
      desc: item.description,
      charges: item.amount,
      credits: ""
    }));

    const serviceItems = (data.otherServices || []).map((item, index) => ({
      id: `ser_${index}`,
      rawDate: parseDateForSort(item.date),
      date: formatDate(item.date),
      desc: item.description,
      charges: item.amount,
      credits: ""
    }));

    // Combine and sort by date (oldest to newest)
    const allItems = [...accommodationItems, ...serviceItems].sort((a, b) => a.rawDate - b.rawDate);

    return {
      roomNo: data.roomNo || "",
      arrivalDate: formatDate(data.arrivalDate),
      departureDate: formatDate(data.departureDate),
      guestName: data.guestName || "",
      address: data.address || "",
      country: data.nationality || "",
      
      arNo: data.arNumber || "",
      taCode: data.groupCode || data.crsNo || "",
      company: data.companyName || "",
      accountContact: data.accountContact || "",
      
      sstRegNo: data.sstRegNo || "",
      ttxNo: data.ttxRegNo || "",
      invoiceNo: data.invoiceNo || "",
      folioNo: data.folioNo || "",
      confNo: data.confNo || "",
      cashierId: data.cashierName || "", 
      printDate: formatDate(data.invoiceDate),
      bookerName: data.bookerName || "",
      poNo: data.poNo || "",
      vesselName: data.vesselName || "",
      
      items: allItems,
      summary: {
        beforeTax: data.baseTaxableAmount || 0,
        nonTaxable: 0.00,
        sst6: 0.00,
        sst8: data.totalSst8Percent || 0,
        totalSst: data.totalSst8Percent || 0,
        tourismTax: data.totalTourismTax || 0,
        grandTotal: data.grandTotalMyr || 0,
        balance: data.grandTotalMyr || 0
      }
    };
  };

  useEffect(() => {
    if (invoiceData) {
      setInvoice(mapApiDataToInvoice(invoiceData));
      setLoading(false);
    }
  }, [invoiceData]);

  useEffect(() => {
    if (isPdfDownload && invoice && invoiceRef.current) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice, navigate]);

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGINATION LOGIC
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!invoice?.items) return;

    const tx = invoice.items;
    const pages = [];
    const MAX_ROWS_NORMAL_PAGE = 22; 

    if (tx.length === 0) {
      pages.push({ items: [], showTotals: true });
    } else {
      for (let i = 0; i < tx.length; i += MAX_ROWS_NORMAL_PAGE) {
        const chunk = tx.slice(i, i + MAX_ROWS_NORMAL_PAGE);
        const isLastChunk = i + MAX_ROWS_NORMAL_PAGE >= tx.length;
        pages.push({ items: chunk, showTotals: isLastChunk });
      }
    }

    const totalPages = pages.length;
    pages.forEach((p, idx) => {
      p.pageNo = idx + 1;
      p.totalPages = totalPages;
    });

    setPaginatedData(pages);
  }, [invoice]);

  // ─────────────────────────────────────────────────────────────────────────────
  // PDF DOWNLOAD
  // ─────────────────────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    // 1. Style Guard (Tailwind bypass)
    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
      style.parentNode.removeChild(style);
    });

    try {
      // 2. Image Loading Verification
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // 3. Layout settle delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = invoiceRef.current;
      const opt = {
        margin: 0,
        filename: `OASIA_${invoice.invoiceNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 3 },
        html2canvas: {
          scale: 4,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.page:last-child'] }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error("❌ PDF Error:", err);
      toast.error("PDF Error");
    } finally {
      // 4. Styles Restore
      headStyles.forEach(style => {
        document.head.appendChild(style);
      });
      setPdfLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <InvoiceTemplate
      loading={loading}
      invoice={invoice}
      pdfLoading={pdfLoading}
      onDownloadPDF={handleDownloadPDF}
      onPrint={() => window.print()}
      onBack={() => navigate("/invoices")}
    >
      <div className="oasia-invoice-wrapper" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{__html: `
          .oasia-invoice-wrapper { width: 100%; background-color: transparent; }
          .oasia-invoice-wrapper * { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 10px; line-height: 1.3; }
          .page {
              width: 100%; max-width: 794px; padding: 15mm 15mm; margin: 0 auto 20px auto;
              background: #fff; box-shadow: 0 0 10px rgba(0,0,0,0.1); box-sizing: border-box;
              page-break-after: always; break-after: page;
          }
          .page:last-child {
              page-break-after: avoid; break-after: avoid;
          }
          .oasia-logo-section { text-align: center; margin-bottom: 30px; display : flex; justify-content: center;}
          .oasia-logo-section img { width: 120px; height: auto; }
          .oasia-info-table { width: 100%; border-collapse: collapse; }
          .oasia-info-table td { padding: 1px 0; vertical-align: top; }
          .oasia-label { width: 110px; }
          .oasia-sep { width: 15px; text-align: center; }
          
          .oasia-main-content { margin-top: 15px; }
          .oasia-items-table { width: 100%; border-collapse: collapse; border-bottom: 1.5px solid #000; }
          .oasia-items-table thead th { 
              padding: 5px 0; 
              text-align: left; 
              border-top: 1.5px solid #000; 
              border-bottom: 1.5px solid #000; 
              font-weight: bold; 
          }
          .oasia-items-table tbody td { padding: 3px 0; }
          
          .text-right { text-align: right !important; }
          
          .oasia-bottom-section { margin-top: 10px; width: 100%; display: flex; justify-content: space-between; }
          .oasia-left-col { width: 45%; padding-right: 20px; display: flex; flex-direction: column; justify-content: space-between; }
          .oasia-right-col { width: 50%; border-bottom: 1px solid; padding-bottom: 20px;}
          
          .oasia-balance-row {
              display: flex; justify-content: space-between; align-items: center; 
              border-bottom: 1.5px solid #000; padding: 5px 0; margin-bottom: 10px;
          }
          
          .oasia-summary-header { text-align: center; font-weight: bold; margin-bottom: 5px; }
          .oasia-summary-details { width: 100%; border-collapse: collapse; }
          .oasia-summary-details td { padding: 2px 0; }
          
          .oasia-footer { text-align: center; margin-top: 40px; font-size: 9px; line-height: 1.4; }
          
          @media print { 
            .page { box-shadow: none; margin: 0; padding: 10mm; page-break-after: always; break-after: page; } 
            .page:last-child { page-break-after: avoid; break-after: avoid; }
            .no-print { display: none; } 
          }
        `}} />

        {paginatedData.map((page, index) => (
          <div
            className="page"
            key={index}
            style={index === paginatedData.length - 1 ? { pageBreakAfter: 'avoid', breakAfter: 'avoid' } : {}}
          >
            <div className="oasia-logo-section">
              <img src={logo} alt="OASIA Logo" />
            </div>

            <table style={{ width: '100%', marginBottom: '10px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%', verticalAlign: 'top' }}>
                    <div style={{ fontSize: '11px', marginBottom: '15px' }}>GUEST FOLIO</div>
                    
                    <table className="oasia-info-table">
                      <tbody>
                        <tr><td className="oasia-label">Room No.</td><td className="oasia-sep">:</td><td>{invoice.roomNo}</td></tr>
                        <tr><td className="oasia-label">Arrival</td><td className="oasia-sep">:</td><td>{invoice.arrivalDate}</td></tr>
                        <tr><td className="oasia-label">Departure</td><td className="oasia-sep">:</td><td>{invoice.departureDate}</td></tr>
                      </tbody>
                    </table>
                    
                    <div style={{ marginTop: '15px', marginBottom: '15px', minHeight: '30px' }}>
                      <div>{invoice.guestName}</div>
                      <div>{invoice.address}</div>
                      <div>{invoice.country}</div>
                    </div>
                    
                    <table className="oasia-info-table">
                      <tbody>
                        <tr><td className="oasia-label">AR No.</td><td className="oasia-sep">:</td><td>{invoice.arNo}</td></tr>
                        <tr><td className="oasia-label">Group / TA Code</td><td className="oasia-sep">:</td><td>{invoice.taCode}</td></tr>
                        <tr><td className="oasia-label">Company/Agent</td><td className="oasia-sep">:</td><td>{invoice.company}</td></tr>
                        <tr><td className="oasia-label">Account Contact</td><td className="oasia-sep">:</td><td>{invoice.accountContact}</td></tr>
                      </tbody>
                    </table>
                  </td>

                  <td style={{ width: '50%', verticalAlign: 'top' }}>
                    <table className="oasia-info-table">
                      <tbody>
                        <tr><td className="oasia-label">FOLIO</td><td></td><td></td></tr>
                        <tr><td className="oasia-label">SST Reg No.</td><td className="oasia-sep">:</td><td>{invoice.sstRegNo}</td></tr>
                        <tr><td className="oasia-label">TTX No.</td><td className="oasia-sep">:</td><td>{invoice.ttxNo}</td></tr>
                        <tr><td className="oasia-label">Page No.</td><td className="oasia-sep">:</td><td>{page.pageNo} of {page.totalPages}</td></tr>
                        <tr><td className="oasia-label">Invoice No.</td><td className="oasia-sep">:</td><td>{invoice.invoiceNo}</td></tr>
                        <tr><td className="oasia-label">e-Invoice / Folio No.</td><td className="oasia-sep">:</td><td>{invoice.folioNo}</td></tr>
                        <tr><td className="oasia-label">Conf. No.</td><td className="oasia-sep">:</td><td>{invoice.confNo}</td></tr>
                        
                        <tr style={{ height: '15px' }}><td colSpan="3"></td></tr>
                        
                        <tr><td className="oasia-label">Cashier ID.</td><td className="oasia-sep">:</td><td>{invoice.cashierId}</td></tr>
                        <tr><td className="oasia-label">Date</td><td className="oasia-sep">:</td><td>{invoice.printDate}</td></tr>
                        <tr><td className="oasia-label">Booker Name</td><td className="oasia-sep">:</td><td>{invoice.bookerName}</td></tr>
                        <tr><td className="oasia-label">Job/PO No.</td><td className="oasia-sep">:</td><td>{invoice.poNo}</td></tr>
                        <tr><td className="oasia-label">Vessel Name</td><td className="oasia-sep">:</td><td>{invoice.vesselName}</td></tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="oasia-main-content">
              <table className="oasia-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '18%' }}>Date</th>
                    <th style={{ width: '52%' }}>Description</th>
                    <th className="text-right" style={{ width: '15%' }}>Charges<br/>MYR</th>
                    <th className="text-right" style={{ width: '15%' }}>Credits<br/>MYR</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>{item.desc}</td>
                      <td className="text-right">{formatCurrency(item.charges)}</td>
                      <td className="text-right">{item.credits ? formatCurrency(item.credits) : ""}</td>
                    </tr>
                  ))}
                  {/* Empty spacer row at bottom before border */}
                  <tr style={{ height: '10px' }}><td colSpan="4"></td></tr>
                </tbody>
              </table>
              
              {page.showTotals && (
                <>
                  <div className="oasia-bottom-section">
                    <div className="oasia-left-col">
                      <div style={{ textAlign: 'justify', marginTop: '10px' }}>
                        I hereby agree to be jointly and severally liable with the
                        person, company or association as may be indicated on this
                        folio for all charges incurred on all accounts which I may
                        now or hereafter maintain within the hotel.
                      </div>
                      <div style={{ borderTop: '1px solid #000', width: '100%', paddingTop: '5px' }}>
                        Guest Signature
                      </div>
                    </div>

                    <div className="oasia-right-col">
                      <div className="oasia-balance-row">
                        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>Balance &nbsp;&nbsp; RM</div>
                        <div style={{ width: '80px', textAlign: 'right' }}>{formatCurrency(invoice.summary.balance)} MYR</div>
                      </div>

                      <div className="oasia-summary-header">
                        * * * * * * * * * * * * * &nbsp;&nbsp;&nbsp; SUMMARY &nbsp;&nbsp;&nbsp; * * * * * * * * * * * * *
                      </div>
                      <table className="oasia-summary-details">
                        <tbody>
                          <tr>
                            <td className="text-right">Total Amount Before Taxes</td>
                            <td className="text-right" style={{ width: '80px', fontWeight: 'bold' }}>{formatCurrency(invoice.summary.beforeTax)}</td>
                          </tr>
                          <tr>
                            <td className="text-right">Total Amount Non Taxable</td>
                            <td className="text-right" style={{ fontWeight: 'bold' }}>{formatCurrency(invoice.summary.nonTaxable)}</td>
                          </tr>
                          <tr>
                            <td className="text-right">Total Service Tax At 6%</td>
                            <td className="text-right" style={{ fontWeight: 'bold' }}>{formatCurrency(invoice.summary.sst6)}</td>
                          </tr>
                          <tr>
                            <td className="text-right">Total Service Tax At 8%</td>
                            <td className="text-right" style={{ fontWeight: 'bold' }}>{formatCurrency(invoice.summary.sst8)}</td>
                          </tr>
                          <tr>
                            <td className="text-right">Total SST</td>
                            <td className="text-right" style={{ fontWeight: 'bold' }}>{formatCurrency(invoice.summary.totalSst)}</td>
                          </tr>
                          <tr>
                            <td className="text-right">Tourism Tax (RM10/ Night)</td>
                            <td className="text-right" style={{ fontWeight: 'bold' }}>{formatCurrency(invoice.summary.tourismTax)}</td>
                          </tr>
                          <tr>
                            <td className="text-right">Total Amount With Taxes &nbsp;&nbsp; RM</td>
                            <td className="text-right" style={{ fontWeight: 'bold' }}>{formatCurrency(invoice.summary.grandTotal)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Full width border at the very bottom of the summary section */}
                  <div style={{ borderTop: '1.5px solid #000', width: '100%', marginTop: '5px' }}></div>
                </>
              )}
            </div>
            
            <div className="oasia-footer">
              Please pay promptly and indicate invoice number when making your payment to Pinehigh Development Sdn Bhd.<br/>
              Late payment penalty of 18.00% per annum will be levied on the outstanding balance from the due date to the date of receipt.<br/>
              Oasia Suites Kuala Lumpur by Far East Hospitality<br/>
              No 10, Lorong P Ramlee, Kuala Lumpur Malaysia 50250 Tel: +60 032726 6788 Fax: +60 032726 6733<br/>
              info.oskl@fareast.com.sg<br/>
              Company Reg. No.: 198901005729
            </div>
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};


export default OasiaInvoiceView;