import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/marriot_tunis-logo.png';

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

const numberToEnglishWords = (amount) => {
  const cleanAmount = String(amount).replace(/,/g, '');
  const num = parseFloat(cleanAmount);
  
  if (isNaN(num)) return "";
  if (num === 0) return "ZERO";

  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const convertThousands = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " HUNDRED" + (n % 100 !== 0 ? " " + convertThousands(n % 100) : "");
    return convertThousands(Math.floor(n / 1000)) + " THOUSAND" + (n % 1000 !== 0 ? " " + convertThousands(n % 1000) : "");
  };

  const [intPart, decPart] = Number(num).toFixed(3).split('.');
  let words = convertThousands(parseInt(intPart, 10)).trim();

  const decimalValue = parseInt(decPart, 10);
  if (decimalValue > 0) {
    words += " AND " + convertThousands(decimalValue).trim();
  }

  return words.replace(/\s+/g, ' ').trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// API → VIEW SCHEMA MAPPER
// ─────────────────────────────────────────────────────────────────────────────

const mapApiDataToInvoice = (data = {}) => {
  if (!data) return null;

  const items = [];
  const subDesc = `${data.companyName || ''} => ${data.guestName || ''} #${data.roomNo || ''}`;

  if (data.accommodationDetails && data.accommodationDetails.length > 0) {
    data.accommodationDetails.forEach((acc) => {
      const dateStr = formatDate(acc.date);
      items.push({ date: dateStr, desc: acc.description || "Package", subDesc, debit: acc.debitTnd, credit: acc.creditTnd });
      if (data.fdcst1Pct) items.push({ date: dateStr, desc: "FDCST 1%", subDesc, debit: (data.fdcst1Pct / data.nights), credit: "" });
      if (data.vat7Pct) items.push({ date: dateStr, desc: "VAT 7%", subDesc, debit: (data.vat7Pct / data.nights), credit: "" });
      if (data.showPerNightTax && data.cityTaxPerNight) items.push({ date: dateStr, desc: "City Tax", subDesc, debit: data.cityTaxPerNight, credit: "" });
    });
  }

  if (data.stampTaxTotal) {
    items.push({ date: formatDate(data.invoiceDate), desc: "Droit de Timbre", subDesc, debit: data.stampTaxTotal, credit: "" });
  }

  const finalBalance = Number((data.grandTotalTnd || 0) + (data.cityTaxTotal || 0) + (data.stampTaxTotal || 0));

  return {
    meta: {
      date: formatDate(data.invoiceDate),
      hotel: {
        name: data.hotel || "Tunis Marriott Hotel",
        address: data.hotelType === "TUNIS_MARRIOTT" ? "Boulevard Zohra Faiza Centre Urbain Nord, Tunis 1082" : data.address,
        mf: "MF / 1207158Z/A/M/000. RNE 1207158Z",
        rib: "RIB : 230 001000 00279 4002 89",
        iban: "IBAN : TN59230 001000 00279 4002 89",
        bic: "Code BIC : BTQITNTT",
      }
    },
    guest: {
      name: data.guestName,
      country: "Tunisia",
      room: data.roomNo,
      arrival: formatDate(data.arrivalDate),
      departure: formatDate(data.departureDate),
      cashierNo: data.cashierId,
      userId: data.userId,
      crsNo: data.confirmationNo
    },
    items,
    totals: {
      totalDebit: formatCurrency(finalBalance),
      totalCredit: formatCurrency(0),
      netAmount: formatCurrency(data.totalHorsTaxes),
      tva7: formatCurrency(data.vat7Pct),
      fdcst1: formatCurrency(data.fdcst1Pct),
      tva19: formatCurrency(0),
      cityTax: formatCurrency(data.cityTaxTotal),
      stampDuty: formatCurrency(data.stampTaxTotal),
      balance: formatCurrency(finalBalance),
      amountWords: numberToEnglishWords(finalBalance)
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

const buildPages = (items = []) => {
  if (items.length === 0) return [{ items: [], isLastPage: true, pageNo: 1, totalPages: 1 }];

  const pages = [];
  const MAX_ROWS_NORMAL = 15; 
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

const MarriottInvoiceView = ({ invoiceData }) => {
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
    }
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
        filename:    `Marriott_Invoice_${invoice.guest.room || 'Room'}.pdf`,
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
      font-family: "Times New Roman", Times, serif;
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
      padding: 10mm 10mm;
      margin: 20px auto;
      background: #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
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
       /* Restricted to exactly 295mm to prevent html2canvas subpixel overflow */
       height: 295mm !important;
       max-height: 295mm !important;
       overflow: hidden !important; 
       page-break-after: avoid !important; /* html2pdf__page-break handles splitting perfectly */
       page-break-inside: avoid !important;
    }

    .m-hotel-info { line-height: 1.3; font-size: 13px; }
    .m-hotel-info strong { font-weight: bold; }
    
    .m-guest-info { color: #000080; font-weight: bold; line-height: 1.4; font-size: 15px; }
    
    .m-room-details-table { border-collapse: collapse; font-size: 14px; }
    .m-room-details-table td { padding: 1px 0; vertical-align: top; }

    .m-main-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; table-layout: fixed; }
    .m-main-table thead th { 
      border-top: 2px solid #000; 
      border-bottom: 2px solid #000; 
      padding: 6px 0; 
      text-align: left; 
      font-weight: bold; 
    }
    .m-main-table th.right-align { text-align: right; }
    .m-main-table td { padding: 4px 0; vertical-align: top; }
    .m-main-table td.right-align { text-align: right; }
    .m-sub-row { font-style: italic; padding-bottom: 10px !important; padding-left: 15px !important; }

    .m-ending-footer { text-align: center; font-size: 12px; margin-top: auto; line-height: 1.3; }

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
    <div style={{ position: 'relative', width: '100%', marginBottom: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="m-hotel-info" style={{ width: '50%' }}>
          <strong>{invoice.meta.hotel.name}</strong><br />
           <span style={{fontSize: "11px"}}>{invoice.meta.hotel.address}</span><br />
          {invoice.meta.hotel.mf}<br />
          {invoice.meta.hotel.rib}<br />
          {invoice.meta.hotel.iban}<br />
          {invoice.meta.hotel.bic}
        </div>
        <div style={{ width: '50%', display: "flex", justifyContent: "flex-end" }}>
          <img src={invoice.meta.hotel.logoUrl || logo} alt="Marriott Tunis Logo" style={{ width: '100px' }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', width: '100%', marginTop: '-20px', marginBottom: '25px', fontWeight: 'bold', fontSize: '16px' }}>
        INFORMATION INVOICE
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="m-guest-info" style={{ width: '50%' }}>
          {invoice.guest.name}<br />
          {invoice.guest.country}
        </div>
        
        <div style={{ width: '45%' }}>
          <table className="m-room-details-table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '45%' }} />
            </colgroup>
            <tbody>
              <tr><td>N Chambre / Room No.</td><td>:</td><td>{invoice.guest.room}</td></tr>
              <tr><td>Date Arrivée / Arrival</td><td>:</td><td>{invoice.guest.arrival}</td></tr>
              <tr><td>Date Départ / Departure</td><td>:</td><td>{invoice.guest.departure}</td></tr>
              <tr><td>No de Page / Page No.</td><td>:</td><td>{page.pageNo} of {page.totalPages}</td></tr>
              <tr><td>Caissier / Cashier No.</td><td>:</td><td>{invoice.guest.cashierNo}</td></tr>
              <tr><td>Utilisateur / User ID</td><td>:</td><td>{invoice.guest.userId}</td></tr>
              <tr><td>CRS. No.</td><td>:</td><td>{invoice.guest.crsNo}</td></tr>
            </tbody>
          </table>

          <div style={{ height: '35px' }}></div>

          <table className="m-room-details-table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '45%' }} />
            </colgroup>
            <tbody>
              <tr><td style={{paddingLeft: "70px"}}>Facture No</td><td>:</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ width: '100%', textAlign: 'right', marginTop: '10px', fontSize: '14px', marginBottom: '10px' }}>
        {invoice.meta.date}
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
                  {/* 15 + 45 = 60% left | 20 + 20 = 40% right */}
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '45%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th className="right-align" style={{ paddingRight: '20px' }}>Débit / Charges<br />TND</th>
                    <th className="right-align" style={{paddingRight: "20px"}}>Crédit / Credits<br />TND</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((txn, index) => (
                    <React.Fragment key={index}>
                      <tr>
                        <td>{txn.date}</td>
                        <td>{txn.desc}</td>
                        <td className="right-align" style={{ paddingRight: '20px' }}>{formatCurrency(txn.debit)}</td>
                        <td className="right-align" style={{ paddingRight: '20px' }}>{formatCurrency(txn.credit)}</td>
                      </tr>
                      {txn.subDesc && (
                        <tr>
                          <td></td>
                          <td className="m-sub-row" colSpan="3">
                            {txn.subDesc}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {page.isLastPage && (
                    <tr>
                      <td style={{ border: 'none' }}></td>
                      <td className="right-align" style={{ padding: '1px 0', paddingRight: '100px' }}>Total:</td>
                      <td className="right-align" style={{ padding: '1px 0', paddingRight: '20px' }}>{invoice.totals.totalDebit}</td>
                      <td className="right-align" style={{ padding: '1px 0'}}>{invoice.totals.totalCredit}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {page.isLastPage && (
                <div style={{ display: 'flex', width: '100%' }}>
                  
                  <div style={{ width: '40%' , paddingTop: "20px"}}>
                    <table style={{ width: '280px', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <tbody>
                        <tr><td style={{ paddingBottom: '3px' }}>Total</td><td style={{ textAlign: 'right', paddingBottom: '3px' }}>{invoice.totals.totalDebit} TND</td></tr>
                        <tr><td style={{ paddingBottom: '3px' }}>Net Amount/HT</td><td style={{ textAlign: 'right', paddingBottom: '3px' }}>{invoice.totals.netAmount} TND</td></tr>
                        <tr><td style={{ paddingBottom: '3px' }}>TVA 7%</td><td style={{ textAlign: 'right', paddingBottom: '3px' }}>{invoice.totals.tva7} TND</td></tr>
                        <tr><td style={{ paddingBottom: '3px' }}>FDCST 1%</td><td style={{ textAlign: 'right', paddingBottom: '3px' }}>{invoice.totals.fdcst1} TND</td></tr>
                        <tr><td style={{ paddingBottom: '3px' }}>TVA 19%</td><td style={{ textAlign: 'right', paddingBottom: '3px' }}>{invoice.totals.tva19} TND</td></tr>
                        <tr><td style={{ paddingBottom: '3px' }}>TX Sejour/City TX</td><td style={{ textAlign: 'right', paddingBottom: '3px' }}>{invoice.totals.cityTax} TND</td></tr>
                        <tr><td style={{ paddingBottom: '3px' }}>Timbre/Stamp Duty</td><td style={{ textAlign: 'right', paddingBottom: '3px' }}>{invoice.totals.stampDuty} TND</td></tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div style={{ width: '60%' }}>
                    <div style={{ borderTop: '3px solid #000', width: '100%', marginBottom: '4px' }}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' , fontWeight: "600" ,paddingLeft:"81px", paddingRight: "20px"}}>
                      <span>Balance / Net à payer</span>
                      <span>{invoice.totals.balance} TND</span>
                    </div>
                    
                    <div style={{ marginTop: '10px', fontSize: '13px', textTransform: 'uppercase', lineHeight: '1.4', paddingRight: '10px' , paddingLeft: "81px"}}>
                      {invoice.totals.amountWords}
                    </div>
                  </div>

                </div>
              )}

              <div style={{ flexGrow: 1 }} />

              {page.isLastPage && (
                <div className="m-ending-footer">
                Tunis Marriott Hotel, Boulevard Zohra Faiza Centre Urbain Nord, Tunis 1082 <br />
                  tel. (216) 31 220 022 fax (216) 31 220 025<br />
                  www.Marriott.com
                </div>
              )}

            </div>

            {/* 🔥 Safe explicit page break ensuring no blank canvas fragments follow 🔥 */}
            {pageIdx < paginatedData.length - 1 && <div className="html2pdf__page-break"></div>}

          </React.Fragment>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default MarriottInvoiceView;