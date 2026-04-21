import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";

// Use the existing jpeg as requested by user context
import logo from '../../../public/adam-logo.jpeg'; 
import { upperCase } from 'lodash';

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
      items.push({ date: dateStr, desc: acc.description || "Package", subDesc: "", debit: acc.debitTnd, credit: acc.creditTnd });
      if (data.showPerNightTax && data.cityTaxPerNight) items.push({ date: dateStr, desc: "City tax", subDesc: "", debit: data.cityTaxPerNight, credit: "" });
    });
  }

  if (data.stampTaxTotal) {
    items.push({ date: formatDate(data.invoiceDate), desc: "Stamp Tax", subDesc: "", debit: data.stampTaxTotal, credit: "" });
  }

  const finalBalance = Number((data.grandTotalTnd || 0) + (data.cityTaxTotal || 0) + (data.stampTaxTotal || 0));

  return {
    meta: {
      date: formatDate(data.invoiceDate),
    },
    guest: {
      name: data.guestName,
      country: "Libya",
      companyName: data.companyName || "AZAR TOURISM SERVICES",
      companyCountry: "Tunisia",
      room: data.roomNo,
      pax: `Adults : ${data.adults || 4} /Chld : ${data.children || 1}`,
      rateCode: data.rateCode,
      arrival: formatDate(data.arrivalDate),
      departure: formatDate(data.departureDate),
      crsNo: data.confirmationNo,
      debtorNo: data.debtorNo,
      agent: data.companyName || "AZAR TOURISM SERVICES",
      invoiceNo: data.invoiceNo,
      folioNo: data.folioNo,
    },
    items,
    totals: {
      totalDebit: formatCurrency(finalBalance),
      totalCredit: formatCurrency(0),
      netAmount: formatCurrency(data.totalHorsTaxes || 6309.799),
      tva7: formatCurrency(data.vat7Pct || 446.103),
      fdcst1: formatCurrency(data.fdcst1Pct || 63.098),
      tva19: formatCurrency(0),
      cityTax: formatCurrency(data.cityTaxTotal),
      stampDuty: formatCurrency(data.stampTaxTotal || 1.000),
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
  const MAX_ROWS_NORMAL = 18; 
  const MAX_ROWS_WITH_TOTALS = 10; 

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

const AdamTunisInvoiceView = ({ invoiceData }) => {
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
        filename:    `ADAM_Invoice_${invoice.guest.room || 'Room'}.pdf`,
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
      font-size: 13px;
      color: #000;
      background: #f5f5f5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding-bottom: 20px;
    }

    .inv-page {
      width: 210mm;
      height: 296mm;
      padding: 8mm 8mm;
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

    .pdf-export-mode {
       background: #fff !important;
       padding: 0 !important;
    }
    .pdf-export-mode .inv-page {
       margin: 0 !important;
       box-shadow: none !important;
       border: none !important;
       height: 295mm !important;
       max-height: 295mm !important;
       overflow: hidden !important; 
    }

    .m-main-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; table-layout: fixed; font-size: 13px; }
    .m-main-table thead th { 
      padding: 12px 0; 
      text-align: left; 
      font-weight: normal; 
      font-style: italic;
      font-size: 13px;
      /* Simulate top and bottom borders with margins */
      background-image: 
        linear-gradient(to right, #000, #000), 
        linear-gradient(to right, #000, #000);
      background-repeat: no-repeat;
      background-size: 100% 2px, 100% 2px;
      background-position: top center, bottom center;
    }
    .m-main-table thead th:first-child { 
      padding-left: 20px; 
      background-size: calc(100% - 16px) 2px, calc(100% - 16px) 2px;
      background-position: top right, bottom right;
    }
    .m-main-table thead th:last-child { 
      padding-right: 30px; 
      background-size: calc(100% - 20px) 2px, calc(100% - 20px) 2px;
      background-position: top left, bottom left;
    }
    .m-main-table th.right-align { text-align: right; }
    .m-main-table td { padding: 0; vertical-align: top; }
    .m-main-table tbody tr:first-child td { padding-top: 6px; }
    .m-main-table tbody tr:last-child td { padding-bottom: 6px; }
    .m-main-table td.right-align { text-align: right; }

    .m-ending-footer { text-align: center; font-size: 13px; margin-top: auto; line-height: 1.4; }

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
    <div style={{ position: 'relative', width: '100%', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
        <img src={logo} alt="Adam Logo" style={{ width: '90px' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left Side */}
        <div style={{ width: '55%', fontSize: '13px', lineHeight: '1.2' }}>
          <strong style={{ textTransform: 'uppercase', display: 'block' }}>{invoice.guest.companyName}</strong>
          <strong style={{ display: 'block' }}>{invoice.guest.companyCountry}</strong>
          <div style={{ height: '48px' }}></div>
          <strong style={{ display: 'block' }}>{invoice.guest.name}</strong>
          <strong style={{ display: 'block' }}>{invoice.guest.country}</strong>
        </div>
        
        {/* Right Side */}
        <div style={{ width: '45%', fontSize: '13px', marginTop: '8px'}}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
               <col style={{ width: '22%' }} />
               <col style={{ width: '3%' }} />
               <col style={{ width: '40%' }} />
            </colgroup>
            <tbody style={{ lineHeight: '1.2'}}>
              <tr><td style={{padding: '1px 0'}}>Chambre / Room</td><td>:</td><td>{invoice.guest.room}</td></tr>
              <tr><td style={{padding: '1px 0'}}>Nb Pax</td><td></td><td>{invoice.guest.pax}</td></tr>
              <tr><td style={{padding: '1px 0'}}>Arrangement/R.Rate</td><td></td><td>{invoice.guest.rateCode}</td></tr>
              <tr><td style={{padding: '1px 0'}}>Arrivée / Arrival</td><td>:</td><td>{invoice.guest.arrival}</td></tr>
              <tr><td style={{padding: '1px 0'}}>Départ / Departure</td><td>:</td><td>{invoice.guest.departure}</td></tr>
              <tr><td style={{padding: '1px 0'}}>Confirmation</td><td>:</td><td>{invoice.guest.crsNo}</td></tr>
              <tr><td style={{padding: '1px 0'}}>N° Débiteur / A/R No</td><td>:</td><td>{invoice.guest.debtorNo}</td></tr>
              <tr><td colSpan="3" style={{ height: '14px' }}></td></tr>
              <tr><td style={{padding: '1px 0'}}>Agence/ Agent</td><td>:</td><td style={{textTransform: 'uppercase'}}>{invoice.guest.agent}</td></tr>
              <tr><td style={{padding: '1px 0'}}>Facture/Invoice</td><td>:</td><td>{invoice.guest.invoiceNo}</td></tr>
              <tr><td style={{padding: '1px 0'}}>Facture / Folio</td><td>:</td><td>{invoice.guest.folioNo}</td></tr>
              <tr><td style={{padding: '1px 0'}}>Page</td><td>:</td><td>{page.pageNo} de {page.totalPages}</td></tr>
              <tr><td style={{padding: '1px 0 0 0', fontSize: '13px'}}>FACTURE</td><td></td><td></td></tr>
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
                  <col style={{ width: '45%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th className="right-align">Débit TND</th>
                    <th className="right-align">Crédit TND</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((txn, index) => (
                    <React.Fragment key={index}>
                      <tr>
                        <td>{txn.date}</td>
                        <td>{txn.desc}</td>
                        <td className="right-align">{formatCurrency(txn.debit)}</td>
                        <td className="right-align"></td>
                      </tr>
                      {txn.subDesc && (
                        <tr>
                          <td></td>
                          <td colSpan="3" style={{ fontStyle: 'italic', paddingBottom: '10px' }}>
                            {txn.subDesc}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {page.isLastPage && (
                    <>
                      <tr>
                        <td colSpan="4" style={{ borderTop: '1px solid #000', paddingTop: '5px' }}></td>
                      </tr>
                      <tr>
                        <td></td>
                        <td style={{ padding: '4px 0' }}>Total</td>
                        <td className="right-align" style={{ padding: '4px 0' }}>{invoice.totals.totalDebit}</td>
                        <td className="right-align" style={{ padding: '4px 0' }}>{invoice.totals.totalCredit}</td>
                      </tr>
                      <tr>
                        <td colSpan="4" style={{ borderTop: '2px solid #000', marginBottom: '10px' }}></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {page.isLastPage && (
                <div style={{ display: 'flex', width: '100%', marginTop: '15px' }}>
                  
                  <div style={{ width: '45%', fontSize: '14px', lineHeight: '1.4' }}>
                    <strong><u>Détails Bancaire:</u></strong><br />
                    AMEN BANK<br />
                    Agence Mohamed V(Tunis)<br />
                    <strong><u>Compte en dinars :</u></strong><br />
                    RIB : 07 807 0081 101 115447 15
                  </div>
                  
                  <div style={{ width: '55%', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>Balance en TND :</span>
                      <span>{invoice.totals.balance}</span>
                    </div>
                    
                    <div style={{ height: '10px', backgroundColor: '#808080', width: '100%', marginBottom: '10px' }}></div>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                       <colgroup>
                         <col style={{ width: '50%' }} />
                         <col style={{ width: '5%' }} />
                         <col style={{ width: '45%' }} />
                       </colgroup>
                       <tbody>
                         <tr><td style={{padding: '2px 0'}}>Total Hors Taxes</td><td>:</td><td style={{ textAlign: 'right' }}>{invoice.totals.netAmount} TND</td></tr>
                         <tr><td style={{padding: '2px 0'}}>FDCST 1%</td><td>:</td><td style={{ textAlign: 'right' }}>{invoice.totals.fdcst1} TND</td></tr>
                         <tr><td style={{padding: '2px 0'}}>TVA 7%</td><td>:</td><td style={{ textAlign: 'right' }}>{invoice.totals.tva7} TND</td></tr>
                         <tr><td style={{padding: '2px 0'}}>Timbre Fiscal</td><td>:</td><td style={{ textAlign: 'right' }}>{invoice.totals.stampDuty} TND</td></tr>
                         <tr><td style={{padding: '2px 0'}}>TVA 19 %</td><td>:</td><td style={{ textAlign: 'right' }}>{invoice.totals.tva19} TND</td></tr>
                         <tr><td style={{padding: '2px 0'}}>Total TTC</td><td>:</td><td style={{ textAlign: 'right' }}>{invoice.totals.totalDebit} TND</td></tr>
                         <tr><td style={{padding: '2px 0'}}>Net a Payer</td><td>:</td><td style={{ textAlign: 'right' }}>{invoice.totals.balance} TND</td></tr>
                       </tbody>
                    </table>
                  </div>

                </div>
              )}

              <div style={{ flexGrow: 1 }} />

              {page.isLastPage && (
                <div className="m-ending-footer">
                  ADAM Hotel Suites<br />
                  Cité les Pins- Les Berges du Lac 2, 1053 Tunis - Tunisia<br />
                  T: +216 36 049 000 F: +216 36 048 000<br />
                  Email : Info@adamhotelsuites.com
                </div>
              )}

            </div>

            {pageIdx < paginatedData.length - 1 && <div className="html2pdf__page-break"></div>}

          </React.Fragment>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default AdamTunisInvoiceView;
