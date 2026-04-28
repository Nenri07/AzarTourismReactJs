import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/fourseasontunis-logo.png'; 
import tunisiaInvoiceApi from '../../Api/tunisiainvoice.api';

// ─────────────────────────────────────────────────────────────────────────────
// PURE HELPERS  
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  } catch { return dateStr; }
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "";
  return parseFloat(val).toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// API → VIEW SCHEMA MAPPER
// ─────────────────────────────────────────────────────────────────────────────

const mapApiDataToInvoice = (data = {}) => {
  if (!data) return null;

  const allItems = [];
  
  // Helper to normalize dates for sorting
  const getNormalizedTime = (d) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

  // Accommodation
  if (data.accommodationDetails && data.accommodationDetails.length > 0) {
    const cityTaxPerNight = data.cityTaxTotal ? (Number(data.cityTaxTotal) / data.accommodationDetails.length) : 3.000;
    
    data.accommodationDetails.forEach((acc) => {
      const dateStr = formatDate(acc.date);
      const time = getNormalizedTime(acc.date);

      // Priority 1: Accommodation
      allItems.push({ 
        date: dateStr, 
        time: time,
        desc: acc.description || "Accommodation", 
        debit: acc.charges || acc.debitTnd, 
        credit: acc.credits || acc.creditTnd,
        priority: 1
      });
      
      // Priority 3: City Tax
      allItems.push({
        date: dateStr,
        time: time,
        desc: "City Tax",
        debit: cityTaxPerNight,
        credit: 0,
        priority: 3
      });
    });
  }

  // Other Services
  if (data.otherServices && data.otherServices.length > 0) {
    data.otherServices.forEach((svc) => {
      const svcDate = svc.date || data.invoiceDate;
      allItems.push({
        date: formatDate(svcDate),
        time: getNormalizedTime(svcDate),
        desc: svc.name,
        debit: svc.amount,
        credit: 0,
        priority: 2 // Priority 2: Extra Services
      });
    });
  }

  // Sort by Date then by Priority
  const items = allItems.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.priority - b.priority;
  });

  const finalBalance = Number(data.grandTotalTnd || 0);

  return {
    meta: {
      date: formatDate(data.invoiceDate),
    },
    guest: {
      name: data.guestName,
      companyName: data.companyNames || "Azar Tourism",
      companyAddress: data.addresss || "Algeria Square Building Number 12 First Floor\nTripoli\nLibya",
      room: data.roomNo,
      arrival: formatDate(data.arrivalDate),
      departure: formatDate(data.departureDate),
      crsNo: data.confirmationNo,
      invoiceNo: data.invoiceNo,
      folioNo: data.folioNo,
      cashierId: data.cashierId,
    },
    items,
    totals: {
      totalDebit: formatCurrency(finalBalance),
      totalCredit: formatCurrency(0),
      netAmount: formatCurrency(data.totalHorsTaxes || 11511.620),
      fdcst1: formatCurrency(data.fdcst1Pct || 109.233),
      tva7: formatCurrency(data.vat7Pct || 772.283),
      tva19: formatCurrency(data.vat19Pct || 111.764),
      cityTax: formatCurrency(data.cityTaxTotal || 6.000),
      stampDuty: formatCurrency(data.stampTaxTotal || 1.000),
      grossAmount: formatCurrency(finalBalance),
      balance: formatCurrency(finalBalance),
      balanceEur: data.balanceEur ? parseFloat(data.balanceEur).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : "3756.2",
      balanceUsd: data.balanceUsd ? parseFloat(data.balanceUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "4335.38"
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

const buildPages = (items = []) => {
  if (items.length === 0) return [{ items: [], isLastPage: true, pageNo: 1, totalPages: 1 }];

  const pages = [];
  const ROWS_PER_PAGE = 17;
  const SAME_PAGE_TOTALS_LIMIT = 5;

  for (let i = 0; i < items.length; i += ROWS_PER_PAGE) {
    const pageItems = items.slice(i, i + ROWS_PER_PAGE);
    const isLastChunk = (i + ROWS_PER_PAGE) >= items.length;
    
    if (isLastChunk) {
      if (pageItems.length <= SAME_PAGE_TOTALS_LIMIT) {
        // Last page has 8 or fewer rows -> include totals here
        pages.push({ items: pageItems, isLastPage: true });
      } else {
        // Last page has more than 8 rows -> break totals to a new page
        pages.push({ items: pageItems, isLastPage: false });
        pages.push({ items: [], isLastPage: true });
      }
    } else {
      // Not the last chunk
      pages.push({ items: pageItems, isLastPage: false });
    }
  }

  const total = pages.length;
  pages.forEach((p, idx) => {
    p.pageNo = idx + 1;
    p.totalPages = total;
  });
  return pages;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const FourSeasonTunisInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialData = invoiceData || location.state?.initialData;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (initialData) {
      setInvoice(mapApiDataToInvoice(initialData));
      setLoading(false);
    } else if (invoiceId) {
      fetchInvoiceData();
    } else {
      setLoading(false);
    }
  }, [initialData, invoiceId]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await tunisiaInvoiceApi.getInvoiceById(invoiceId);
      
      let rawData = response.data || response;
      if (rawData.data) {
        rawData = rawData.data;
      }
      
      setInvoice(mapApiDataToInvoice(rawData));
    } catch (err) {
      console.error("Error fetching Tunis invoice:", err);
      toast.error("Failed to load invoice from API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!invoice?.items) return;
    setPaginatedData(buildPages(invoice.items));
  }, [invoice]);

  useEffect(() => {
    if (isPdfDownload && invoice && invoiceRef.current) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice, navigate]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    // 1. Style Guard (Tailwind v4 Bypass)
    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
        const text = style.textContent || "";
        const href = style.href || "";
        
        // Match our custom font by name, filename, or @font-face indicator
        const isFont = text.includes('Times New Roman') || 
                       text.includes('@font-face') ||
                       href.includes('StaybridgeFont') ||
                       href.includes('fonts.googleapis.com');

        if (isFont) return; // Keep it

        // Remove other styles that might interfere with PDF (Tailwind v4 issues)
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    });

    const element = invoiceRef.current;
    
    element.classList.add('pdf-export-mode');

    try {
      const images = element.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin:      0,
        filename:    `FourSeasonTunis_Invoice_${invoice.guest.room || 'Room'}.pdf`,
        image:       { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 4, useCORS: true, letterRendering: true, scrollY: 0, windowWidth: 794 },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:   { mode: ['css', 'legacy'] },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("PDF generation failed");
    } finally {
      element.classList.remove('pdf-export-mode');
      // 5. Instant Recovery (Styles Restore)
      headStyles.forEach(style => {
          if (!style.parentNode) {
              document.head.appendChild(style);
          }
      });
      setPdfLoading(false);
    }
  };

  if (!invoice) return null;

  const styles = `
    @page { size: A4 portrait; margin: 0; font-family: "Times New Roman", Times, serif !important;
  }
    * { box-sizing: border-box; }

    .invoice-box {
      width: 100%;
      font-family: "Times New Roman", Times, serif !important;
      font-size: 14.5px;
      color: #000;
      background: #f5f5f5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding-bottom: 20px;
    }

    .inv-page {
      width: 210mm;
      height: 296mm;
      padding: 8mm 8mm 5mm 8mm;
      margin: 20px auto;
      background: #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden; 
      page-break-inside: avoid;
    }

    .inv-page:last-child {
      margin-bottom: 0;
    }

    .pdf-export-mode {
       background: #fff !important;
       padding: 0 !important;
       width: 210mm !important;
       margin: 0 auto !important;
    }
    .pdf-export-mode .inv-page {
       margin: 0 auto !important;
       box-shadow: none !important;
       border: none !important;
       height: 296mm !important;
       max-height: 296mm !important;
       overflow: hidden !important; 
    }

    .m-main-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; table-layout: fixed; font-size: 14.5px; }
    .m-main-table thead tr {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    .m-main-table thead th { 
      // padding: 2px 0; 
      line-height: 1.8;
      text-align: left; 
      font-weight: bold; 
      font-size: 14.5px;
    }
    .m-main-table th.right-align { text-align: right; }
    .m-main-table td { vertical-align: top; line-height: 1.5}
    .m-main-table tbody tr:first-child td { padding-top: 4px; }
    .m-main-table td.right-align { text-align: right; }

    .m-ending-footer { 
      text-align: center; 
      font-size: 11.5px; 
      margin-top: auto; 
      line-height: 1.3; 
      border-top: 1px solid #000; 
      width: 100%;
    }

    .signature-area {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-top: -20px;
    }
    .stamp-img {
      width: 160px;
      margin-left: 20px;
      opacity: 0.8;
      transform: rotate(-5deg);
    }

    /* Strict Browser Print Fixes */
    @media print {
      body * { visibility: hidden; }
      .invoice-box, .invoice-box * { visibility: visible; }
      .invoice-box { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: none !important; }
      .inv-page { box-shadow: none !important; margin: 0 !important; height: 297mm !important; border: none !important; page-break-after: always; }
      .inv-page:last-child { page-break-after: avoid; }
      .html2pdf__page-break { display: none !important; }
    }

  `;

  const PageHeader = ({ page }) => (
    <div style={{ position: 'relative', width: '100%', marginBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '55px' }}>
        <img src={logo} alt="Four Seasons Tunis Logo" style={{ width: '100px' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left Side */}
        <div style={{ width: '46%', fontSize: '14.5px', lineHeight: '1.4' }}>
          <div style={{ display: 'block', whiteSpace: 'pre-wrap' }}>{invoice.guest.companyName}</div>
          <div style={{ display: 'block', whiteSpace: 'pre-wrap' }}>{invoice.guest.companyAddress}</div>
          <div style={{ marginTop: '4px', fontFamily: 'times new roman' }}><strong>Invoice No: </strong><span style={{ marginLeft: '10px', fontWeight: 'bold' }}>{invoice.guest.invoiceNo}</span></div>
          <div style={{ marginTop: '1px', fontFamily: 'times new roman', fontWeight: 'bold' }}>INVOICE</div>
          <div style={{ marginTop: '4px' }}>
            <span style={{ fontStyle: 'italic' }}>Guest Name:</span> 
            <span style={{ marginLeft: '15px', fontStyle: 'italic' }}>{invoice.guest.name}</span>
          </div>
        </div>
        
        {/* Right Side */}
        <div style={{ width: '30%', fontSize: '14.5px' }}>
          <table style={{ width: '90%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
               <col style={{ width: '100%' }} />
               <col style={{ width: '55%' }} />
            </colgroup>
            <tbody style={{ lineHeight: '1.5'}}>
              <tr><td style={{padding: '0'}}>Room Number:</td><td>{invoice.guest.room}</td></tr>
              <tr><td style={{padding: '0'}}>Arrival Date:</td><td>{invoice.guest.arrival}</td></tr>
              <tr><td style={{padding: '0'}}>Departure Date:</td><td>{invoice.guest.departure}</td></tr>
              <tr><td style={{padding: '0'}}>Folio No :</td><td>{invoice.guest.folioNo}</td></tr>
              <tr><td style={{padding: '0'}}>Confirmation No :</td><td>{invoice.guest.crsNo}</td></tr>
              <tr><td style={{padding: '0'}}>Cashier ID :</td><td>{invoice.guest.cashierId}</td></tr>
              <tr><td style={{padding: '0'}}>Page No:</td><td>{page.pageNo} of {page.totalPages}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <InvoiceTemplate
      loading={loading}
      invoice={invoice}
      pdfLoading={pdfLoading}
      onDownloadPDF={handleDownloadPDF}
      onPrint={() => window.print()}
      onBack={() => navigate("/invoices")}
    >
      <div className="invoice-box" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{ __html: styles }} />

        {paginatedData.map((page, pageIdx) => (
          <React.Fragment key={pageIdx}>
            <div className="inv-page">
              
              <PageHeader page={page} />

              <table className="m-main-table">
                <colgroup>
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '53%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '17%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{paddingLeft: '12px', borderLeft: '1px solid black'}}>Date</th>
                    <th>Description</th>
                    <th className="right-align">Charges</th>
                    <th className="right-align" style={{paddingRight: '12px', borderRight: '1px solid black'}}>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((txn, index) => (
                    <tr key={index}>
                      <td style={{paddingLeft: '10px'}}>{txn.date}</td>
                      <td>{txn.desc}</td>
                      <td className="right-align">{formatCurrency(txn.debit)}</td>
                      <td className="right-align" style={{paddingRight: '10px'}}></td>
                    </tr>
                  ))}
                </tbody>
              </table>

               {page.isLastPage && (
                 <div style={{ fontSize: '14.5' }}>
                   {/* Table Footer: Total and Balance */}
                   <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '14.5px',  borderTop: '2px solid black'  }}>
                     <colgroup>
                       <col style={{ width: '31%' }} /> {/* Wide gap to the left */}
                       <col style={{ width: '17%' }} /> {/* Label "Total" / "Balance" */}
                       <col style={{ width: '23%' }} /> {/* Charges column */}
                       <col style={{ width: '5%' }} /> {/* Credits column */}
                     </colgroup>
                      <tbody>
                          {/* Total Row */}
                          <tr>
                            <td></td>
                            <td style={{ textAlign: 'left', fontWeight: 'bold', padding: '8px 0 8px 45px'}}>Total</td>
                            <td className="right-align" style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'center' }}>{invoice.totals.totalDebit}</td>
                            <td className="right-align" style={{ padding: '8px 12px 8px 0', fontWeight: 'bold', textAlign: 'right' }}>{invoice.totals.totalCredit || '0.000'}</td>
                          </tr>
                          {/* Line below Total (Partial width) */}
                          <tr>
                            <td></td>
                            <td colSpan="3" style={{ borderTop: '3px solid #000', height: '0', padding: '0' }}></td>
                          </tr>
                          {/* Balance Row */}
                          <tr>
                            <td></td>
                            <td style={{ textAlign: 'left', fontWeight: 'bold', padding: '8px 0 8px 45px' }}>Balance</td>
                            <td className="right-align" style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'center' }}>{invoice.totals.balance}</td>
                            <td></td>
                          </tr>
                      </tbody>
                   </table>
 
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
                      {/* Left Side: Tax Breakdown */}
                      <div style={{ width: '40%' }}>
                         <table style={{ width: '85%', borderCollapse: 'collapse', fontSize: '14px', lineHeight: '1.4' }}>
                            <colgroup>
                              <col style={{ width: '55%' }} />
                              <col style={{ width: '45%' }} />
                            </colgroup>
                            <tbody>
                              <tr><td>Net Amount</td><td style={{textAlign: 'left'}}>{invoice.totals.netAmount}</td></tr>
                              <tr><td>FDCST 1%</td><td style={{textAlign: 'left'}}>{invoice.totals.fdcst1}</td></tr>
                              <tr><td>VAT 7%</td><td style={{textAlign: 'left'}}>{invoice.totals.tva7}</td></tr>
                              <tr><td>Tax Stamp</td><td style={{textAlign: 'left'}}>{invoice.totals.stampDuty}</td></tr>
                              <tr><td>VAT 19%</td><td style={{textAlign: 'left'}}>{invoice.totals.tva19}</td></tr>
                              <tr><td>City Tax</td><td style={{textAlign: 'left'}}>{invoice.totals.cityTax}</td></tr>
                              <tr><td>Gross Amount</td><td style={{textAlign: 'left'}}>{invoice.totals.grossAmount}</td></tr>
                            </tbody>
                         </table>
                      </div>
 
                      {/* Right Side: Balances */}
                      <div style={{ width: '53%' }}>
                         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', lineHeight: '1.4', fontWeight: 'bold' }}>
                            <colgroup>
                              <col style={{ width: '35%' }} />
                              <col style={{ width: '40%' }} />
                               <col style={{ width: '25%' }} />
                            </colgroup>
                            <tbody>
                              <tr>
                                <td>Balance TND</td>
                                <td style={{textAlign: 'right'}}>{invoice.totals.balance} TND</td>
                              </tr>
                              {invoice.totals.balanceEur && (
                                <tr>
                                  <td>Balance EUR</td>
                                  <td style={{textAlign: 'right'}}>{invoice.totals.balanceEur} EUR</td>
                                </tr>
                              )}
                              {invoice.totals.balanceUsd && (
                                <tr>
                                  <td>Balance USD</td>
                                  <td style={{textAlign: 'right'}}>{invoice.totals.balanceUsd} USD</td>
                                </tr>
                              )}
                                <tr>
                                  <td></td>
                                  <td></td>
                                </tr>
                            </tbody>
                         </table>
                      </div>
                   </div>
 
                   {/* Bank Details Area */}
                   <div style={{ marginTop: '40px', lineHeight: '1.3', fontSize: '14px' }}>
                      Bank Detail:<br/>
                      Name of the Bank: BIAT<br/>
                      RIB: 08 003 0005110983222 22<br/>
                      IBAN: TN59 0800 3000 5110 9832 2222<br/>
                      SWFIT: BIATTNTT
                   </div>
                 </div>
               )}

               <div style={{ flexGrow: 1 }} />
 
               <div className="m-ending-footer">
                 Zone Touristique Cap Gammarth, Tunis La Marsa, 1057 Tunisia<br />
                 TEL: +216 31 26 00 00 www.fourseasons.com/tunis<br />
                 M F : 0898281/L/A/M/000, RC: B2450942004
               </div>

            </div>

            {pageIdx < paginatedData.length - 1 && <div className="html2pdf__page-break"></div>}

          </React.Fragment>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default FourSeasonTunisInvoiceView;
