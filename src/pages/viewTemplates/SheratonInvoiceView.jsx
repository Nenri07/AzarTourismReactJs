

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/sheraton-logo.png?url';

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
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

const parseDateForSort = (dateStr) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

// ─────────────────────────────────────────────────────────────────────────────
// API → VIEW SCHEMA MAPPER
// ─────────────────────────────────────────────────────────────────────────────

const mapApiDataToInvoice = (data = {}) => {
  const ledgerItems = [];

  (data.accommodationDetails || []).forEach((acc, idx) => {
    const baseTimestamp = parseDateForSort(acc.date);
    ledgerItems.push({
      id: `acc_${acc.day || idx}`,
      rawDate: baseTimestamp,
      date: formatDate(acc.date),
      desc: acc.texte || "Accommodation",
      subRouteInfo: "",
      debit: acc.debitTnd || "",
      credit: acc.creditTnd || "",
    });

    if (data.showPerNightTax && data.cityTaxPerNight > 0) {
      ledgerItems.push({
        id: `citytax_${acc.day || idx}`,
        rawDate: baseTimestamp + 1,
        date: formatDate(acc.date),
        desc: "City Tax",
        subRouteInfo: `${data.guestName || ''} #${data.roomNo || ''}=>${data.companyName || ''} . #${data.roomNo || ''}`,
        debit: data.cityTaxPerNight,
        credit: "",
      });
    }
  });

  (data.otherServices || []).forEach((svc, idx) => {
    ledgerItems.push({
      id: `svc_${idx}`,
      rawDate: parseDateForSort(svc.date),
      date: formatDate(svc.date),
      desc: svc.name || "Other Service",
      subRouteInfo: "",
      debit: svc.amount || "",
      credit: "",
    });
  });

  if (data.stampTaxTotal > 0) {
    const finalDate = data.departureDate || data.invoiceDate;
    ledgerItems.push({
      id: "stamp_tax",
      rawDate: parseDateForSort(finalDate) + 2,
      date: formatDate(finalDate),
      desc: "Droit de Timbre",
      subRouteInfo: "",
      debit: data.stampTaxTotal,
      credit: "",
    });
  }

  const sortedItems = ledgerItems.sort((a, b) => a.rawDate - b.rawDate);

  const clientAddressLines = [];
  if (data.companyName) clientAddressLines.push(data.companyName);
  if (data.address) {
    data.address.split(',').map(s => s.trim()).forEach(s => clientAddressLines.push(s));
  } else {
    clientAddressLines.push("Azar Tourism Services", "Tripoli Tower Ground Floor Office no 50", "Tripoli, Libya");
  }

  const calculatedTotalDebit = sortedItems.reduce((acc, curr) => acc + (parseFloat(curr.debit) || 0), 0);
  const calculatedTotalCredit = sortedItems.reduce((acc, curr) => acc + (parseFloat(curr.credit) || 0), 0);

  return {
    referenceNo: data.refferenceNo || "",
    invoiceNo: data.invoiceNo || "",
    billingDate: formatDate(data.invoiceDate) || "",
    roomNo: data.roomNo || "",
    arrivalDate: formatDate(data.arrivalDate) || "",
    departureDate: formatDate(data.departureDate) || "",
    confirmationNo: data.confirmationNo || "",
    cashier: data.cashierName || data.cashierId || "",
    arAccount: data.arAccount || "",
    clientAddress: clientAddressLines,
    items: sortedItems,
    summary: {
      totalDebit: calculatedTotalDebit || data.grandTotalTnd || 0,
      totalCredit: calculatedTotalCredit || 0,
      balance: calculatedTotalDebit - calculatedTotalCredit,
    },
    taxBreakdown: {
      totalInUsd: data.balanceUsd || 0,
      exchangeRate: data.sellingRate || data.usdExchangeRate || 0,
      fdcst1: data.fdcst1Pct || 0,
      vat7: data.vat7Pct || 0,
      totalHorsTaxes: data.totalHorsTaxes || 0,
      servicesNonImposables: data.servicesNonImposables || 0,
      droitDeTimbre: data.stampTaxTotal || 0,
      totalTtc: data.totalTtc || data.grandTotalTnd || 0,
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

const buildPages = (items = []) => {
  const MAX_ROWS_NORMAL = 18;
  const TOTALS_ROW_EQUIVALENT = 9;

  if (items.length === 0) {
    return [{ items: [], showTotals: true, pageNo: 1, totalPages: 1 }];
  }

  const pages = [];
  let i = 0;

  while (i < items.length) {
    const remaining = items.length - i;
    const fitsWithTotals = remaining + TOTALS_ROW_EQUIVALENT <= MAX_ROWS_NORMAL;
    const fitsWithoutTotals = remaining <= MAX_ROWS_NORMAL;

    if (fitsWithTotals) {
      pages.push({ items: items.slice(i, i + remaining), showTotals: true });
      i += remaining;
    } else if (fitsWithoutTotals) {
      pages.push({ items: items.slice(i, i + remaining), showTotals: false });
      i += remaining;
      pages.push({ items: [], showTotals: true });
    } else {
      pages.push({ items: items.slice(i, i + MAX_ROWS_NORMAL), showTotals: false });
      i += MAX_ROWS_NORMAL;
    }
  }

  const total = pages.length;
  pages.forEach((p, idx) => { p.pageNo = idx + 1; p.totalPages = total; });
  return pages;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const SheratonInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    setInvoice(mapApiDataToInvoice(invoiceData || {}));
    setLoading(false);
  }, [invoiceData]);

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


 const sanitizeColorsForCanvas = (root) => {
  const COLOR_PROPS = [
    'color', 'backgroundColor', 'borderTopColor', 'borderRightColor',
    'borderBottomColor', 'borderLeftColor', 'outlineColor',
    'textDecorationColor', 'boxShadow',
  ];

  const all = [root, ...root.querySelectorAll('*')];

  all.forEach((el) => {
    const computed = window.getComputedStyle(el);
    const inline = {};

    COLOR_PROPS.forEach((prop) => {
      const val = computed[prop];
      if (val && val !== 'none') inline[prop] = val;
    });

    Object.assign(el.style, inline);

    const bgImage = computed.backgroundImage;
    if (bgImage && bgImage.includes('oklch')) {
      el.style.backgroundImage = 'none';
    }
  });
};

const handleDownloadPDF = async () => {
  if (!invoiceRef.current) return;
  setPdfLoading(true);

  const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
  headStyles.forEach(s => { if (s.parentNode) s.parentNode.removeChild(s); });

  const original = invoiceRef.current;
  const clone = original.cloneNode(true);
  clone.classList.add('pdf-export-mode');

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '794px';
  host.style.zIndex = '-1';
  host.style.overflow = 'visible';
  host.style.background = '#fff';
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    sanitizeColorsForCanvas(clone);

    const images = clone.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    }));

    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // ── Force an EXACT height instead of a measured one ─────────────────────
    // clone.scrollHeight can come back 1-2px over pages.length*1123 due to
    // sub-pixel font rendering or border rounding. That tiny overflow is
    // enough to push html2canvas's canvas past the last real page boundary,
    // producing one extra blank sliced page. Clipping to the exact expected
    // height removes the sliver entirely.
    const expectedPages = paginatedData.length;
    const exactHeight = expectedPages * 1123;
    clone.style.height = `${exactHeight}px`;
    clone.style.maxHeight = `${exactHeight}px`;
    clone.style.overflow = 'hidden';

    const opt = {
      margin: 0,
      filename: `${invoice.referenceNo || 'Invoice'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: exactHeight, // matches the clipped height exactly
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    // ── Safety net: if a blank trailing page still sneaks through, drop it ──
    await html2pdf()
      .set(opt)
      .from(clone)
      .toPdf()
      .get('pdf')
      .then((pdf) => {
        const actualPages = pdf.internal.getNumberOfPages();
        if (actualPages > expectedPages) {
          pdf.deletePage(actualPages);
        }
      })
      .save();

    toast.success("PDF Downloaded");
  } catch (err) {
    console.error("PDF Error:", err);
    toast.error("PDF generation failed");
  } finally {
    headStyles.forEach(s => document.head.appendChild(s));
    if (host.parentNode) document.body.removeChild(host);
    setPdfLoading(false);
  }
};
  if (!invoice) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // STYLES
  // Key PDF insight (same as Radisson):
  //   .pdf-export-mode .inv-page uses height:1123px (A4 in pixels at 96dpi),
  //   NOT min-height. And page-break-after:avoid (not always/unset).
  //   This means the CSS page processor fires exactly once at each 1123px
  //   boundary with NO duplicate break. Zero blank pages.
  //
  // Key Print insight:
  //   @media print uses visibility:hidden on body (not display:none) so
  //   React's #root stays in the layout tree. .invoice-box overrides to
  //   visibility:visible and is repositioned to top:0 left:0 via absolute.
  // ─────────────────────────────────────────────────────────────────────────
  const styles = `
    @page { size: A4; margin: 0mm; }
    * { box-sizing: border-box; }

    .invoice-box {
      width: 100%;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #000;
      background: #f5f5f5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding-bottom: 20px;
    }

    /* ── Screen: each page looks like a card ──────────────────────────────── */
    .inv-page {
      width: 794px;
      min-height: 1123px;
      padding: 8px 26px 18px 26px;
      margin: 20px auto;
      background: #fff;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      position: relative;
      page-break-after: always;
      break-after: page;
    }
    .inv-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
      margin-bottom: 0;
    }

    /* ── PDF export ───────────────────────────────────────────────────────────
       Strategy: pure canvas height slicing. pagebreak:{ mode:[] } disables
       ALL CSS and legacy processors — nothing interprets page-break-after or
       html2pdf__page-break divs. html2pdf simply slices the rendered canvas
       every 1123px (A4 height at 96dpi). Each .inv-page is exactly 1123px,
       so every slice boundary aligns with a page boundary → 0 blank pages.

       CRITICAL: the wrapper must have padding:0 and margin:0, and every
       .inv-page must have margin:0. Any extra pixel beyond N×1123px pushes
       total canvas height past the last slice boundary and generates a blank
       trailing page. overflow:hidden on each page prevents content from
       bleeding into the next slice.
    ────────────────────────────────────────────────────────────────────── */
    .pdf-export-mode {
      background: #fff !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .pdf-export-mode .inv-page {
      margin: 0 !important;
      box-shadow: none !important;
      border: none !important;
      height: 1123px !important;
      max-height: 1123px !important;
      min-height: unset !important;
      overflow: hidden !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
    }

    /* ── Invoice content styles ───────────────────────────────────────────── */

    .logo-container {
      text-align: center;
      margin-bottom: 25px;
    }
    .logo-container img { height: 50px; width: auto; display: inline-block; }

    .info-distribution {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .client-address {
      width: 77%;
      line-height: 1.4;
    }

    .hotel-meta-table {
      width: 35%;
      border-collapse: collapse;
    }
    .hotel-meta-table td {
      padding: 0px 0;
      vertical-align: top;
    }
    .hotel-meta-table td.label {
      font-weight: bold;
      width: 45%;
    }
    .hotel-meta-table td.value {
      text-align: left;
      width: 45%;
    }

    .account-heading-block {
      margin-bottom: 20px;
    }
    .account-id { margin-bottom: 8px; }
    .document-title {
    padding-left: 10px;
      font-weight: bold;
      font-size: 13px;
      letter-spacing: 0.2px;
    }

    .ledger-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5px;
    }
    .ledger-table th {
      font-weight: bold;
      padding: 6px 2px;
      text-align: left;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    .ledger-table td {
      padding: 4px 2px;
      vertical-align: top;
      font-size: 11.5px;
    }
    .text-right { text-align: right !important; }

    .sub-route-info {
      display: block;
      font-size: 11px;
      padding-left: 12px;
      margin-top: 1px;
    }

    .summary-wrapper {
      width: 100%;
      margin-top: 10px;
    }
  
    .total-display-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 2px;
      font-weight: normal;
    }
    .total-display-row .label-col { margin-left: 50%; }
    .total-values {
      display: flex;
      width: 30%;
      justify-content: space-between;
    }
    .full-divider-line {
      border-top: 1px solid #000;
margin-left: 50%;
      margin-top: 1px;
      margin-bottom: 1px;
    }
    .balance-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 2px;
    }
    .balance-row .label-col { margin-left: 50%; }
    .balance-row .value-col {
    padding-right: 20px;
      width: 30%;
      text-align: right;
    }

    .tax-breakdown-section {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    }
    .tax-container-box { width: 45%; }
    .tax-data-row {
      display: flex;
      justify-content: space-between;
      padding: 2.5px 0;
      font-weight: normal !important;
      font-size: 11.5px;
    }
         .tax-container-box2 { width: 45%; }
    .tax-data-row {
      display: flex;
      justify-content: space-between;
      padding: 2.5px 0;
      font-weight: normal !important;
      font-size: 11.5px;
    }

    .footer-separator {
    width: 75%;
    align-self: center;
      border-top: 1px solid #000;
      margin-top: auto;
      padding-top: 8px;
    }
    .hotel-identity-footer {
      text-align: center;
      font-size: 10px;
      line-height: 1.4;
    }
    .hotel-identity-footer .brand-name {
      font-weight: bold;
      font-size: 11px;
      margin-bottom: 1px;
    }

    /* ── Print: visibility trick keeps React's #root in the layout tree ──── */
    @media print {
      body * { visibility: hidden; }
      .invoice-box, .invoice-box * { visibility: visible; }
      .invoice-box {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        background: none !important;
      }
      .inv-page {
        box-shadow: none !important;
        margin: 0 !important;
        min-height: unset !important;
        height: 297mm !important;
        max-height: 297mm !important;
        overflow: hidden !important;
        page-break-after: always !important;
        break-after: page !important;
        padding: 8px 26px 18px 26px;
        width: 100%;
      }
      .inv-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  `;

  // ─── SUB-COMPONENTS ───────────────────────────────────────────────────────

  const PageHeader = ({ page }) => (
    <>
      <div className="logo-container">
        <img src={logo} alt="Sheraton Tunis Hotel Logo" />
      </div>

      <div className="info-distribution">
        <div className="client-address">
          {invoice.clientAddress.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>

        <table className="hotel-meta-table">
          <tbody>
            <tr><td className="label">Room No :</td><td className="value">{invoice.roomNo}</td></tr>
            <tr><td className="label">Arrival :</td><td className="value">{invoice.arrivalDate}</td></tr>
            <tr><td className="label">Departure :</td><td className="value">{invoice.departureDate}</td></tr>
            <tr><td className="label">Confirmation N°:</td><td className="value">{invoice.confirmationNo}</td></tr>
            <tr><td className="label">Page No.:</td><td className="value">{page.pageNo} of {page.totalPages}</td></tr>
            <tr><td className="label">Invoice No.:</td><td className="value">{invoice.invoiceNo}</td></tr>
            <tr><td className="label">Cashier :</td><td className="value">{invoice.cashier}</td></tr>
            <tr><td className="label">Date:</td><td className="value">{invoice.billingDate}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="account-heading-block">
        <div className="account-id">A/R Account : &nbsp;&nbsp; {invoice.arAccount}</div>
        <div className="document-title">INFORMATION INVOICE</div>
      </div>
    </>
  );

  const PageFooter = () => (
    <footer className="hotel-identity-footer">
      <div className="brand-name">Sheraton Tunis Hotel</div>
      <div>Avenue de la Ligue Arabe, 1080 Tunis Carthage Cedex, Tunisie, P.O.Box 345</div>
      <div></div>
      <div></div>
      <div style={{height: "30px"}}></div>
    </footer>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────

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
              <div style={{ flex: 1 }}>
                <PageHeader page={page} />

                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th style={{ width: "12%" , verticalAlign: "Top"}}>Date</th>
                      <th style={{ width: "58%", verticalAlign: "Top" }}>Texte</th>
                      <th style={{ width: "15%" }} className="text-right">Debit<br />TND</th>
                      <th style={{ width: "15%" }} className="text-right">Credits<br />TND</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.map((item, i) => (
                      <tr key={item.id || i}>
                        <td>{item.date}</td>
                        <td>
                          {item.desc}
                          {item.subRouteInfo && (
                            <span className="sub-route-info">{item.subRouteInfo}</span>
                          )}
                        </td>
                        <td className="text-right">{formatCurrency(item.debit)}</td>
                        <td className="text-right">{formatCurrency(item.credit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {page.showTotals && (
                  <>
                    <div className="summary-wrapper">
                      <div className="total-display-row">
                        <div className="label-col">Total</div>
                        <div className="total-values">
                          <div style={{ width: "50%", textAlign: "right" }}>{formatCurrency(invoice.summary.totalDebit)}</div>
                          <div style={{ width: "50%", textAlign: "right" }}>{formatCurrency(invoice.summary.totalCredit)}</div>
                        </div>
                      </div>
                      <div className="full-divider-line" />
                      <div className="balance-row">
                        <div className="label-col">Balance TND</div>
                        <div className="value-col">0.00 &nbsp;TND</div>
                      </div>
                    </div>

                    <div className="tax-breakdown-section">
                      
                        <div className="tax-container-box" style={{width: "35%" , display: "flex", flexDirection: "column", justifyContent: "flex-end"}}>
                        <div className="tax-data-row">
                          <span style={{width: "170px", textAlign:"left"}}>USD Exch. Rate :</span>
                          <span style={{width: "170px", textAlign:"right", paddingRight: "70px"}}>{formatCurrency(invoice.taxBreakdown.exchangeRate)}</span>
                        </div>
                        <div className="tax-data-row">
                          <span style={{width: "170px", textAlign:"left"}}>Total in USD :</span>
                          <span style={{width: "170px", textAlign:"right" , paddingRight: "70px"}}>{formatCurrency(invoice.taxBreakdown.totalInUsd)}</span>
                        </div>
                      </div>
                      <div className="tax-container-box">
                        <div className="tax-data-row">
                          <span style={{width: "170px", textAlign:"right"}}>FDCST 1%</span>
                          <span style={{width: "170px", textAlign:"right", paddingRight: "70px"}}>{formatCurrency(invoice.taxBreakdown.fdcst1)}</span>
                        </div>
                        <div className="tax-data-row">
                          <span style={{width: "170px", textAlign:"right"}}>7% VAT</span>
                          <span style={{width: "170px", textAlign:"right" , paddingRight: "70px"}}>{formatCurrency(invoice.taxBreakdown.vat7)}</span>
                        </div>
                        <div className="tax-data-row">
                          <span style={{width: "170px", textAlign:"right"}}>Total Hors Taxes</span>
                          <span style={{width: "170px", textAlign:"right" , paddingRight: "70px"}}>{formatCurrency(invoice.taxBreakdown.totalHorsTaxes)}</span>
                        </div>
                        <div className="tax-data-row">
                          <span style={{width: "170px", textAlign:"right"}}>SERVICES NON IMPOSABLES</span>
                          <span style={{width: "170px", textAlign:"right" , paddingRight: "70px"}}>{formatCurrency(invoice.taxBreakdown.servicesNonImposables)}</span>
                        </div>
                        <div className="tax-data-row">
                          <span style={{width: "170px", textAlign:"right"}}>Droit de timbre</span>
                          <span style={{width: "170px", textAlign:"right" , paddingRight: "70px"}}>{formatCurrency(invoice.taxBreakdown.droitDeTimbre)}</span>
                        </div>
                        <div className="tax-data-row">
                          <span style={{width: "170px", textAlign:"right"}}>Total TTC</span>
                          <span style={{width: "170px", textAlign:"right" , paddingRight: "70px"}}>{formatCurrency(invoice.taxBreakdown.totalTtc)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="footer-separator" />
              <PageFooter />
            </div>

          </React.Fragment>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default SheratonInvoiceView;