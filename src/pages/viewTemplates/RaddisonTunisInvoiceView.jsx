import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";

// Update the path to your actual logo
import logo from '../../../public/Raddison_Tunis-logo.jpeg';

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
    const yy = String(d.getFullYear());
    return `${dd}/${mm}/${yy}`; // Radisson uses DD/MM/YYYY format
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

  const items = [];

  // MAPPING ACCOMMODATION / SERVICES
  if (data.accommodationDetails && data.accommodationDetails.length > 0) {
    data.accommodationDetails.forEach((acc) => {
      items.push({
        isMainStay: true, // Custom flag to render the underlined sub-text for stay
        prestation: acc.description || "BED AND BREAKFAST",
        stayDates: `STAY FROM ${formatDate(data.arrivalDate)} TO ${formatDate(data.departureDate)}`,
        guestName: data.guestName || "",
        qty: 1,
        days: data.nights || 5,
        pu: acc.debitTnd / (data.nights || 5), // Calculate per unit
        total: acc.debitTnd,
      });
    });
  }

  // Example for extra items like LAUNDRY
  if (data.extraServices && data.extraServices.length > 0) {
    data.extraServices.forEach((extra) => {
      items.push({
        isMainStay: false,
        prestation: extra.description || "LAUBDRY",
        qty: extra.qty || 1,
        days: extra.days || 1,
        pu: extra.unitPrice,
        total: extra.total,
      });
    });
  }

  // Default fallback if no data provided for exact visual match testing
  if (items.length === 0) {
    items.push({
      isMainStay: true,
      prestation: "BED AND BREAKFAST",
      stayDates: "STAY FROM 12/02/2026 TO 17/02/2026",
      guestName: "ABOUBAKER OMAR MOHAMED MILAD",
      qty: 1,
      days: 5,
      pu: 725.000,
      total: 3625.000,
    });



    items.push({
      isMainStay: false,
      prestation: "LAUBDRY",
      qty: 1,
      days: 1,
      pu: 124.000,
      total: 124.000,
    });
  }

  const finalBalance = Number((data.grandTotalTnd || 3802.000));

  return {
    meta: {
      date: formatDate(data.invoiceDate) || "17/02/2026",
      factureNo: data.referenceNo || "ANV6A02713",
    },
    guest: {
      companyCode: data.companyCode || "3000178582",
      companyName: data.companyName || "AZAR TOURISM",
      address1: data.address1 || "ALGERIA SQUARE BUILDING NUMBER 12",
      address2: data.address2 || "FIRST FLOOR 12/1 1254 TRIPOLI LIBYA",
    },
    hotel: {
      matriculeFiscal: data.vatNo || "12894 PAM 000"
    },
    items,
    totals: {
      totalHorsTaxe: formatCurrency(data.totalHorsTaxes || 3469.048),
      fdcst: formatCurrency(data.fdcst1Pct || 34.690),
      tva7: formatCurrency(data.vat7Pct || 245.262),
      totalroom:formatCurrency(data.totalRoomGrossTnd || 0),
      PuAmount:formatCurrency(data.roomAmountTnd || 0),
      taxeSejour: formatCurrency(data.cityTaxTotal || 51.000),
      timbre: formatCurrency(data.stampTaxTotal || 2.000),
      totalTtc: formatCurrency(finalBalance),
      cash: formatCurrency(data.paidAmount || 3802.000),
      aPayer: formatCurrency(data.balanceDue || 0.000)
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

const buildPages = (items = []) => {
  if (items.length === 0) return [{ items: [], isLastPage: true, pageNo: 1, totalPages: 1 }];

  const pages = [];
  const MAX_ROWS_NORMAL = 12; 
  const MAX_ROWS_WITH_TOTALS = 6; 

  for (let i = 0; i < items.length;) {
    const remaining = items.length - i;
    let take = 0;
    let isLastPage = false;

    if (remaining <= MAX_ROWS_WITH_TOTALS) {
      take = remaining;
      isLastPage = true;
    } else if (remaining <= MAX_ROWS_NORMAL && remaining > MAX_ROWS_WITH_TOTALS) {
      take = remaining;
      isLastPage = false;
    } else {
      take = MAX_ROWS_NORMAL;
    }

    pages.push({ items: items.slice(i, i + take), isLastPage: isLastPage });
    i += take;

    if (i >= items.length && !isLastPage) {
      pages.push({ items: [], isLastPage: true });
      break;
    }
  }

  const total = pages.length;
  pages.forEach((p, idx) => { p.pageNo = idx + 1; p.totalPages = total; });
  return pages;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const RadissonTunisInvoiceView = ({ invoiceData }) => {
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
    // If no initialData is passed, it uses the hardcoded fallback mapped in mapApiDataToInvoice
    setInvoice(mapApiDataToInvoice(initialData));
    setLoading(false);
  }, [initialData]);

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
    headStyles.forEach(style => style.parentNode.removeChild(style));

    const element = invoiceRef.current;
    
    // 🔥 Temporarily add class to strip margins and shadows before generating PDF 🔥
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
        filename:    `${invoice.meta.factureNo}.pdf`,
        image:       { type: 'jpeg', quality: 3 },
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
      // Clean up the temporary class
      element.classList.remove('pdf-export-mode');
      headStyles.forEach(style => document.head.appendChild(style));
      setPdfLoading(false);
    }
  };

  if (!invoice) return null;

  const styles = `
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }

    .invoice-box {
      width: 100%;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #000;
      background: #f5f5f5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding-bottom: 20px;
    }

    .inv-page {
      width: 794px; /* Exact A4 width at 96 DPI */
      min-height: 1123px; /* Exact A4 height */
      padding: 50px 45px;
      margin: 20px auto;
      background: #fff;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden; 
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
    }

    .inv-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
      margin-bottom: 0;
    }

    /* 🔥 PDF EXPORT OVERRIDES (Fixes Blank Pages) 🔥 */
    .pdf-export-mode {
       background: #fff !important;
       padding: 0 !important;
    }
    .pdf-export-mode .inv-page {
       margin: 0 !important;
       box-shadow: none !important;
       border: none !important;
       height: 1123px !important;
       max-height: 1123px !important;
       overflow: hidden !important; 
       page-break-after: avoid !important;
       page-break-inside: avoid !important;
    }

    /* Radisson Exact Styling */
    .logo-section { text-align: center; margin-bottom: 30px;     justify-content: center;     display: flex }
    .logo-section img { width: 480px; }

    .header-info { position: relative; height: 35px; font-weight: bold; font-size: 11px; margin-bottom: 15px; }
    .header-info .date { position: absolute; left: 0; top: 0; }
    .header-info .facture { position: absolute; left: 50%; transform: translateX(-40%); top: 15px; }

    .boxes-container { display: flex; justify-content: space-between; margin-bottom: 46px; }
    
    .box { border: 4px double #000; padding: 15px 10px; text-align: center; display: flex; flex-direction: column; justify-content: center; }
    .box-left { width: 46%; height: 131px; font-weight: bold; }
    .box-left .title { font-size: 13px; margin-bottom: 8px; }
    .box-left .address { font-size: 11px; line-height: 1.4; text-transform: uppercase;}
    
    .box-right { width: 46%; height: 131px; font-weight: bold; font-size: 10px; line-height: 1.8; }

    .table-container { width: 100%; margin-bottom: 10px; }
.main-table{
  width: 100%;
}
    .col-prestation { width: 384px; }
    .col-qte { width: 40px; }
    .col-nb { width: 80px; }
    .col-pu { width: 110px; }
    .col-total { width: 110px; }

 
    

    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .valign-bottom { vertical-align: bottom; }
    .underline { text-decoration: underline; }

    .totals-container { display: flex; justify-content: flex-end; }
    .main-table{ width: 100%; border: 2px solid  #000; border-collapse: separate; }
    .totals-table { width: 45%; border: 2px solid  #000; border-collapse: separate; }
    .col-tot-label { width: 110px; }
    .col-tot-val { width: 110px; }
    .totals-table td { border: 2px double #000; padding: 3px 6px; font-weight: bold; font-size: 11px; border-collapse: separate; }

    .main-table td { border: 2px double #000; padding: 3px 6px; font-weight: bold; font-size: 11px; border-collapse: separate; }
.main-table th { border: 2px double #000; padding: 3px 6px; font-weight: bold; font-size: 11px; border-collapse: separate; }

    .stamp-container { position: absolute; bottom: 120px; left: 55%; transform: translateX(-50%); pointer-events: none; opacity: 0.7; }

    /* Strict Browser Print Fixes */
    @media print {
      body * { visibility: hidden; }
      .invoice-box, .invoice-box * { visibility: visible; }
      .invoice-box { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: none !important; }
      .inv-page { box-shadow: none !important; margin: 0 !important; border: none !important; page-break-after: always; padding: 20px; width: 100%; }
      .inv-page:last-child { page-break-after: avoid; }
      .html2pdf__page-break { display: none !important; }
    }
  `;

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
              
              <div className="logo-section">
                <img src={logo} alt="Radisson Blu Logo" />
              </div>

              <div className="header-info">
                <div className="date">DATE:{invoice.meta.date}</div>
                <div className="facture">FACTURE N°{invoice.meta.factureNo}</div>
              </div>

              <div className="boxes-container">
                <div className="box box-left">
                  <div className="title">({invoice.guest.companyCode}){invoice.guest.companyName}</div>
                  <div className="address">
                    {invoice.guest.address1}<br />
                    {invoice.guest.address2}
                  </div>
                </div>
                
                <div className="box box-right">
                  STC RADISSON BLU<br />
                  HOTEL & CONVENTION<br />
                  TUNIS CENTER<br /><br />
                  MATRICULE FISCAL: {invoice.hotel.matriculeFiscal}
                </div>
              </div>

             <div className="table-container">
  <table className="main-table">
    <colgroup>
      <col className="col-prestation" />
      <col className="col-qte" />
      <col className="col-nb" />
      <col className="col-pu" />
      <col className="col-total" />
    </colgroup>

    <thead>
      <tr>
        <th className="text-left" style={{ paddingLeft: '30px' }}>PRESTATION</th>
        <th className="text-center">QTE</th>
        <th className="text-center">NB JOURS</th>
        <th className="text-center">PU</th>
        <th className="text-center">TOTAL</th>
      </tr>
    </thead>

    <tbody>
      {page.items.length > 0 && (
        (() => {
          const item = page.items[0]; 
   
          // ✅ sirf first item use hoga

          return (
            <tr>
              <td className={`text-left ${item.isMainStay ? 'valign-bottom' : ''}`}>
                <>
                  <span className="underline">{item.stayDates}</span><br />
                  <span className="underline">{item.guestName}</span><br />
                  {item.prestation}
                </>
              </td>

              <td className="text-center">{item.qty}</td>
              <td className="text-center">{item.days}</td>
              <td className="text-right">{formatCurrency(invoice.totals.PuAmount)}</td>
              <td className="text-right">{(invoice.totals.totalroom)}</td>
            </tr>
          );
        })()
      )}
    </tbody>
  </table>
</div>
              {page.isLastPage && (
                <>
                  <div className="totals-container">
                    <table className="totals-table">
                      <colgroup>
                        <col className="col-tot-label" />
                        <col className="col-tot-val" />
                      </colgroup>
                      <tbody>
                        <tr><td className="text-left">TOTAL HORS TAXE</td><td className="text-right">{invoice.totals.totalHorsTaxe}</td></tr>
                        <tr><td className="text-left">FDCST</td><td className="text-right">{invoice.totals.fdcst}</td></tr>
                        <tr><td className="text-left">TVA 7%</td><td className="text-right">{invoice.totals.tva7}</td></tr>
                        <tr><td className="text-left">TAXE SEJOUR</td><td className="text-right">{invoice.totals.taxeSejour}</td></tr>
                        <tr><td className="text-left">TIMBRE</td><td className="text-right">{invoice.totals.timbre}</td></tr>
                        <tr><td className="text-left">TOTAL TTC</td><td className="text-right">{invoice.totals.totalTtc}</td></tr>
                        {/* <tr><td className="text-left">CASH</td><td className="text-right">{invoice.totals.cash}</td></tr> */}
                        <tr><td className="text-left">A PAYER</td><td className="text-right">{invoice.totals.totalTtc}</td></tr>
                      </tbody>
                    </table>
                  </div>

                
                </>
              )}

              <div style={{ flexGrow: 1 }} />
            </div>

            {/* 🔥 Safe explicit page break ensuring no blank canvas fragments follow 🔥 */}
            {pageIdx < paginatedData.length - 1 && <div className="html2pdf__page-break"></div>}

          </React.Fragment>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default RadissonTunisInvoiceView;