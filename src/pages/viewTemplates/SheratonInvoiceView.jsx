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

// TND uses 3 decimal places with comma thousands separators
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

  // 1. Process Accommodation Details
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

    // 2. Inject Per-Night City Tax if requested and available
    if (data.showPerNightTax && data.cityTaxPerNight > 0) {
      ledgerItems.push({
        id: `citytax_${acc.day || idx}`,
        rawDate: baseTimestamp + 1, // Slight offset to ensure it renders right after room rate
        date: formatDate(acc.date),
        desc: "City Tax",
        subRouteInfo: `${data.guestName || ''} #${data.roomNo || ''}=>${data.companyName || ''} . #${data.roomNo || ''}`,
        debit: data.cityTaxPerNight,
        credit: "",
      });
    }
  });

  // 3. Process Other Ancillary Services
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

  // 4. Append Stamp Tax (Droit de Timbre) at the end of the stay
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

  // Sort chronologically by execution timeline
  const sortedItems = ledgerItems.sort((a, b) => a.rawDate - b.rawDate);

  // Derive client visual block presentation lines
  const clientAddressLines = [];
  if (data.companyName) clientAddressLines.push(data.companyName);
  if (data.address) {
    const segments = data.address.split(',').map(s => s.trim());
    clientAddressLines.push(...segments);
  } else {
    clientAddressLines.push("Azar Tourism Services", "Tripoli, Libya");
  }

  const calculatedTotalDebit = sortedItems.reduce((acc, curr) => acc + (parseFloat(curr.debit) || 0), 0);
  const calculatedTotalCredit = sortedItems.reduce((acc, curr) => acc + (parseFloat(curr.credit) || 0), 0);

  return {
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
  if (items.length === 0) {
    return [{ items: [], showTotals: true, pageNo: 1, totalPages: 1 }];
  }

  const pages = [];
  const MAX_ROWS_NORMAL = 20;
  const MAX_ROWS_WITH_TOTALS = 11;

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

    pages.push({
      items: items.slice(i, i + take),
      showTotals: isLastPage,
    });
    i += take;

    if (i >= items.length && !isLastPage) {
      pages.push({ items: [], showTotals: true });
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

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => style.parentNode.removeChild(style));
    invoiceRef.current.classList.add('pdf-export-mode');

    try {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin: 0,
        filename: `Sheraton_Tunis_Invoice_${invoice.invoiceNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 4,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 794,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      };

      await html2pdf().set(opt).from(invoiceRef.current).save();
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("PDF generation failed");
    } finally {
      headStyles.forEach(style => document.head.appendChild(style));
      invoiceRef.current.classList.remove('pdf-export-mode');
      setPdfLoading(false);
    }
  };

  if (!invoice) return null;

  const styles = `
    @page { size: A4; margin: 0mm; }
    * { box-sizing: border-box; }

    .invoice-box {
      width: 100%;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #000;
      background: transparent;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .inv-page {
      width: 210mm;
      min-height: 297mm;
      padding: 2mm 7mm 5mm 7mm;
      margin: 0 auto 24px auto;
      background: #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .inv-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
      margin-bottom: 0;
    }

    .logo-container {
      text-align: center;
      margin-bottom: 25px;
    }
    .logo-container img { height: 50px; width: auto; display: inline-block; }

    .info-distribution {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }

    .client-address {
      width: 55%;
      line-height: 1.4;
    }

    .hotel-meta-table {
      width: 35%;
      border-collapse: collapse;
    }
    .hotel-meta-table td {
      padding: 1.5px 0;
      vertical-align: top;
    }
    .hotel-meta-table td.label {
      font-weight: bold;
      width: 45%;
    }
    .hotel-meta-table td.value {
      text-align: left;
      width: 55%;
    }

    .account-heading-block {
      margin-top: 10px;
      margin-bottom: 20px;
    }
    .account-id {
      margin-bottom: 8px;
    }
    .document-title {
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
      border-top: none !important;
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
    
    .total-line-top {
      border-top: 1px solid #000;
      margin-left: 50%;
    }
    
    .total-display-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 2px;
      font-weight: normal; 
    }
    .total-display-row .label-col {
      margin-left: 50%;
    }
    .total-values {
      display: flex;
      width: 30%;
      justify-content: space-between;
    }

    .full-divider-line {
      border-top: 1px solid #000;
      width: 100%;
      margin-top: 1px;
      margin-bottom: 1px;
    }

    .balance-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 2px;
    }
    .balance-row .label-col {
      margin-left: 50%;
    }
    .balance-row .value-col {
      width: 30%;
      text-align: right;
    }

    .tax-breakdown-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }
    .tax-container-box {
      width: 45%;
    }
    .tax-data-row {
      display: flex;
      justify-content: space-between;
      padding: 2.5px 0;
      font-weight: normal !important;
      font-size: 11.5px;
    }

    .footer-separator {
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

    @media print {
      .invoice-box { background: none !important; }
      .inv-page {
        box-shadow: none !important;
        margin: 0 0 !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .inv-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  `;

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
      <div>T 216 71 100 300 F 216 71 782 208 Email sheraton.tunis@sheratonhotels.com - MF:456095EPM000</div>
      <div>RIB/RIP National: 05 108 0000403090395 06 - IBAN: TN59 0510 8000 0403 0903 9506 - Code BIC: BTBKTNTT</div>
      <div>Marriott.com/TUNSI</div>
    </footer>
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
          <div className="inv-page" key={pageIdx}>
            
            <div style={{ flex: 1 }}>
              <PageHeader page={page} />

              <table className="ledger-table">
                <thead>
                  <tr>
                    <th style={{ width: "12%" }}>Date</th>
                    <th style={{ width: "58%" }}>Texte</th>
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
                    <div className="total-line-top"></div>
                    <div className="total-display-row">
                      <div className="label-col">Total</div>
                      <div className="total-values">
                        <div style={{ width: "50%", textAlign: "right" }}>{formatCurrency(invoice.summary.totalDebit)}</div>
                        <div style={{ width: "50%", textAlign: "right" }}>{formatCurrency(invoice.summary.totalCredit)}</div>
                      </div>
                    </div>
                    <div className="full-divider-line"></div>
                    <div className="balance-row">
                      <div className="label-col">Balance TND</div>
                      <div className="value-col">{formatCurrency(invoice.summary.balance)} &nbsp;TND</div>
                    </div>
                  </div>

                  <div className="tax-breakdown-section">
                    <div className="tax-container-box">
                      <div className="tax-data-row">
                        <span>FDCST 1%</span>
                        <span>{formatCurrency(invoice.taxBreakdown.fdcst1)}</span>
                      </div>
                      <div className="tax-data-row">
                        <span>7% VAT</span>
                        <span>{formatCurrency(invoice.taxBreakdown.vat7)}</span>
                      </div>
                      <div className="tax-data-row">
                        <span>Total Hors Taxes</span>
                        <span>{formatCurrency(invoice.taxBreakdown.totalHorsTaxes)}</span>
                      </div>
                      <div className="tax-data-row">
                        <span>SERVICES NON IMPOSABLES</span>
                        <span>{formatCurrency(invoice.taxBreakdown.servicesNonImposables)}</span>
                      </div>
                      <div className="tax-data-row">
                        <span>Droit de timbre</span>
                        <span>{formatCurrency(invoice.taxBreakdown.droitDeTimbre)}</span>
                      </div>
                      <div className="tax-data-row">
                        <span>Total TTC</span>
                        <span>{formatCurrency(invoice.taxBreakdown.totalTtc)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="footer-separator" />
            <PageFooter />
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default SheratonInvoiceView;