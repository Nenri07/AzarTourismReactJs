import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/concorde-logo.jpeg?url'; 
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
    return `${dd}.${mm}.${yy}`;
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
    const cityTaxPerNight = data.cityTaxTotal ? (Number(data.cityTaxTotal) / data.accommodationDetails.length) : 0.000;
    
    data.accommodationDetails.forEach((acc) => {
      const dateStr = formatDate(acc.date);
      const time = getNormalizedTime(acc.date);

      allItems.push({ 
        date: dateStr, 
        time: time,
        desc: acc.description || "accommodation", 
        debit: acc.charges || acc.debitTnd, 
        credit: acc.credits || acc.creditTnd,
        subDesc: acc.subDescription || `  ${data.guestName} #${data.roomNo}=>AZAR TOURISM  #${data.folioNo}`,
        priority: 1
      });
      
      if (cityTaxPerNight > 0) {
        allItems.push({
          date: dateStr,
          time: time,
          desc: "Taxe de Séjour",
          debit: cityTaxPerNight,
          credit: 0,
          priority: 3
        });
      }
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
        subDesc: `Room# ${data.roomNo} : CHECK# ${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}   ${data.guestName} #${data.roomNo}=>AZAR TOURISM  #${data.folioNo}`,
        priority: 2
      });
    });
  }

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
      companyName: data.companyNames || "AZAR TOURISM",
      country: "Tunisia",
      room: data.roomNo,
      arrival: formatDate(data.arrivalDate),
      departure: formatDate(data.departureDate),
      crsNo: data.confirmationNo,
      invoiceNo: data.invoiceNo,
      folioNo: data.folioNo,
      cashierId: data.cashierId,
      cashierName: data.cashierName,
      pax: data.pax
    },
    items,
    totals: {
      totalDebit: formatCurrency(finalBalance),
      totalCredit: formatCurrency(0),
      netAmount: formatCurrency(data.totalHorsTaxes || 1349.126),
      fdcst1: formatCurrency(data.fdcst1Pct || 13.491),
      tva7: formatCurrency(data.vat7Pct || 95.383),
      tva19: formatCurrency(data.vat19Pct || 0.000),
      cityTax: formatCurrency(data.cityTaxTotal || 0.000),
      stampDuty: formatCurrency(data.stampTaxTotal || 0.000),
      grossAmount: formatCurrency(finalBalance),
      balance: formatCurrency(finalBalance)
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

const buildPages = (items = []) => {
  if (items.length === 0) return [{ items: [], isLastPage: true, pageNo: 1, totalPages: 1 }];

  const pages = [];
  const ROWS_PER_PAGE = 12;
  const SAME_PAGE_TOTALS_LIMIT = 6;

  for (let i = 0; i < items.length; i += ROWS_PER_PAGE) {
    const pageItems = items.slice(i, i + ROWS_PER_PAGE);
    const isLastChunk = (i + ROWS_PER_PAGE) >= items.length;
    
    if (isLastChunk) {
      if (pageItems.length <= SAME_PAGE_TOTALS_LIMIT) {
        pages.push({ items: pageItems, isLastPage: true });
      } else {
        pages.push({ items: pageItems, isLastPage: false });
        pages.push({ items: [], isLastPage: true });
      }
    } else {
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

const ConsordeTunisInvoiceView = ({ invoiceData }) => {
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

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
        const text = style.textContent || "";
        const href = style.href || "";
        
        const isFont = text.includes('Tahoma') || text.includes('Arial') || 
                       text.includes('@font-face') ||
                       href.includes('fonts.googleapis.com');

        if (isFont) return;

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
        filename:    `ConcordeTunis_Invoice_${invoice.guest.room || 'Room'}.pdf`,
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
    @page { size: A4 portrait; margin: 0; font-family: Tahoma, Arial, sans-serif !important; }
    * { box-sizing: border-box; }

    .invoice-box {
      width: 100%;
      font-family: Arial, sans-serif !important;
      font-size: 14px;
      color: #000;
      background: #f5f5f5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding-bottom: 20px;
    }

    .inv-page {
      width: 210mm;
      height: 296mm;
      padding: 8mm 15mm 10mm 8mm;
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

    .m-main-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; table-layout: fixed; font-size: 14px; font-family: Arial, sans-serif; }
    .m-main-table thead { border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; }
    .m-main-table thead th { 
      padding: 4px 0; 
      text-align: left; 
      font-weight: normal; 
      font-style: italic;
      font-size: 14px;
    }
    .m-main-table th.right-align { text-align: right; }
    .m-main-table td { vertical-align: top; line-height: 1.2; }
    .m-main-table td.right-align { text-align: right; }
    .m-main-table tbody tr:first-child td { padding-top: 6px; }

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
    <div style={{ position: 'relative', width: '100%', marginBottom: '90px', fontFamily: 'Tahoma, sans-serif' }}>
      <div style={{ position: 'absolute', top: '-10px', left: '0', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <img src={logo} alt="Concorde Tunis Logo" style={{ height: '80px', objectFit: 'contain' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '105px' }}>
        {/* Left Side */}
        <div style={{ width: '55%', fontSize: '14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
               <col style={{ width: '40%' }} />
               <col style={{ width: '60%' }} />
            </colgroup>
            <tbody style={{ lineHeight: '1.6' }}>
              <tr>
                <td style={{padding: '0'}}>Facture &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/ Folio: &nbsp;</td>
                <td style={{padding: '0'}}></td>
              </tr>
              <tr>
                <td style={{padding: '0'}}>Chambre/ Room: &nbsp;</td>
                <td style={{padding: '0'}}>{invoice.guest.room}</td>
              </tr>
              <tr>
                <td style={{padding: '0'}}>Arrivée / Arrival: &nbsp;</td>
                <td style={{padding: '0'}}>{invoice.guest.arrival}</td>
              </tr>
              <tr>
                <td style={{padding: '0'}}>Départ / Departure:&nbsp;</td>
                <td style={{padding: '0'}}>{invoice.guest.departure}</td>
              </tr>
              <tr>
                <td style={{padding: '0'}}>Nº Pers. / Nº Pax: &nbsp;</td>
                <td style={{padding: '0'}}>{invoice.guest.pax} &nbsp;&nbsp;&nbsp;/ {invoice.guest.pax}</td>
              </tr>
              <tr>
                <td style={{padding: '0'}}>Page / Page: &nbsp;&nbsp;&nbsp;&nbsp;</td>
                <td style={{padding: '0'}}>{page.pageNo} de {page.totalPages}</td>
              </tr>
              <tr>
                <td style={{padding: '0'}}>Caisse / Cashier :</td>
                <td style={{padding: '0'}}>{invoice.guest.cashierId} &nbsp;&nbsp;&nbsp;/ {invoice.guest.cashierName}</td>
              </tr>
              <tr>
                <td style={{padding: '0'}}>Date / Date: &nbsp;&nbsp;&nbsp;&nbsp;</td>
                <td style={{padding: '0'}}>{invoice.meta.date}</td>
              </tr>
              <tr>
                <td style={{padding: '0'}}>Nº Reserva/Reser.Nº:&nbsp;</td>
                <td style={{padding: '0'}}>{invoice.guest.crsNo}</td>
              </tr>
              <tr>
                <td style={{padding: '0'}}>Guest / Client :</td>
                <td style={{padding: '0'}}>{invoice.guest.companyName}</td>
              </tr>
              <tr>
                <td style={{padding: '0'}}></td>
                <td style={{padding: '0'}}>{invoice.guest.country}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Right Side */}
        <div style={{ width: '38%', fontSize: '14px', display: 'flex', flexDirection: 'column', paddingTop: '0px' }}>
          <div style={{ marginBottom: '106px' }}>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.2' }}>{invoice.guest.companyName}</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.2' }}>{invoice.guest.country}</div>
          </div>
          <div>
             <span>TAX ID:</span>
          </div>
          <div style={{ marginTop: '10px' }}>
             <strong style={{ fontSize: '14px', textTransform: 'uppercase' }}>INFORMATION INVOICE</strong>
          </div>
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
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '52%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '18%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ fontStyle: 'italic', fontWeight: 'normal', fontFamily: 'Arial', paddingLeft: '25px' }}>Date</th>
                    <th style={{ fontStyle: 'italic', fontWeight: 'normal', fontFamily: 'Arial', paddingLeft: '25px' }}>Description</th>
                    <th className="right-align" style={{ fontStyle: 'italic', fontWeight: 'normal', fontFamily: 'Arial' }}>Débit TND</th>
                    <th className="right-align" style={{ fontStyle: 'italic', fontWeight: 'normal', fontFamily: 'Arial', paddingRight: '10px' }}>Crédit TND</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((txn, index) => (
                    <React.Fragment key={index}>
                      <tr>
                        <td style={{ paddingLeft: '5px' }}>{txn.date}</td>
                        <td style={{lineHieght: '1.1'}}>{txn.desc}</td>
                        <td className="right-align">{formatCurrency(txn.debit)}</td>
                        <td className="right-align" style={{ paddingRight: '5px' }}>{txn.credit > 0 ? formatCurrency(txn.credit) : ''}</td>
                      </tr>
                      {txn.subDesc && (
                        <tr>
                          <td></td>
                          <td colSpan="3" style={{ paddingBottom: '5px', fontSize: '14px', lineHeight: '1.1' }}>{txn.subDesc}</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

               {page.isLastPage && (
                 <div style={{ fontSize: '14px', fontFamily: 'Arial', marginTop: '10px', borderTop: '1px solid black' }}>
                   
                   <table style={{ width: '63%', marginLeft: '37%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '14px' }}>
                     <colgroup>
                       <col style={{ width: '42%' }} />
                       <col style={{ width: '25%' }} />
                       <col style={{ width: '7%' }} />
                     </colgroup>
                      <tbody>
                          <tr>
                            <td style={{ padding: '6px 0 12px 0' }}>Total</td>
                            <td className="right-align" style={{ padding: '6px 0 12px 0' }}>{invoice.totals.totalDebit}</td>
                            <td className="right-align" style={{ padding: '6px 5px 12px 0' }}>{invoice.totals.totalCredit || '0.000'}</td>
                          </tr>
                          <tr style={{ borderTop: '3px solid #000' }}>
                            <td style={{ paddingTop: '6px' }}>Balance en TND :</td>
                            <td className="right-align" style={{ paddingTop: '6px' }}>{invoice.totals.balance}</td>
                            <td></td>
                          </tr>
                          <tr>
                            <td colSpan="3" style={{ padding: '0' }}>
                               <div style={{ height: '14px', backgroundColor: '#555', marginTop: '8px', marginBottom: '8px' }}></div>
                            </td>
                          </tr>
                      </tbody>
                   </table>

                   <table style={{ width: '45%', marginLeft: '37%', borderCollapse: 'collapse', fontSize: '14px', lineHeight: '1.1' }}>
                      <colgroup>
                        <col style={{ width: '32%' }} />
                        <col style={{ width: '1%' }} />
                        <col style={{ width: '55%' }} />
                      </colgroup>
                      <tbody>
                        <tr><td>Total Hors Taxes</td><td style={{textAlign: 'center'}}>:</td><td style={{paddingRight: '50px',  textAlign: 'right' }}>{invoice.totals.netAmount} TND</td></tr>
                        <tr><td>FDCST 1%</td><td style={{textAlign: 'center'}}>:</td><td style={{paddingRight: '50px',  textAlign: 'right' }}>{invoice.totals.fdcst1} TND</td></tr>
                        <tr><td>TVA 7%</td><td style={{textAlign: 'center'}}>:</td><td style={{paddingRight: '50px',  textAlign: 'right' }}>{invoice.totals.tva7} TND</td></tr>
                        <tr><td>Timbre Fiscal</td><td style={{textAlign: 'center'}}>:</td><td style={{paddingRight: '50px',  textAlign: 'right' }}>{invoice.totals.stampDuty} TND</td></tr>
                        <tr><td>TVA 19 %</td><td style={{textAlign: 'center'}}>:</td><td style={{paddingRight: '50px',  textAlign: 'right' }}>{invoice.totals.tva19} TND</td></tr>
                        <tr><td>Taxe de Séjour</td><td style={{textAlign: 'center'}}>:</td><td style={{paddingRight: '50px',  textAlign: 'right' }}>{invoice.totals.cityTax} TND</td></tr>
                        <tr><td style={{ paddingTop: '5px' }}>Total TTC</td><td style={{textAlign: 'center', paddingTop: '5px'}}>:</td><td style={{paddingRight: '50px', paddingTop: '5px', textAlign: 'right' }}>{invoice.totals.grossAmount} TND</td></tr>
                        <tr><td>Net a Payer</td><td style={{textAlign: 'center'}}>:</td><td style={{paddingRight: '50px',  textAlign: 'right' }}>{invoice.totals.balance} TND</td></tr>
                      </tbody>
                   </table>
                 </div>
               )}

               <div style={{ flexGrow: 1 }} />
 
               <div className="m-ending-footer" style={{ borderTop: 'none', textAlign: 'center', fontSize: '12px', fontFamily: 'Tahoma', marginTop: 'auto', lineHieght: '1.2' }}>
                 Hôtel Concorde Les Berges du Lac - RIB : 10112107105061978820<br />
                 STE Touristique et Hoteliere El Hammam Boulevard Mohamed Bouazizi 1080 | Tunis<br />
                 Tax ID : 0020078KA M000
               </div>

            </div>

            {pageIdx < paginatedData.length - 1 && <div className="html2pdf__page-break"></div>}

          </React.Fragment>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default ConsordeTunisInvoiceView;
