
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/LPBC-logo.png';

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT DATE
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd  = String(d.getDate()).padStart(2, '0');
    const mmm = MONTHS[d.getMonth()];
    const yyyy = d.getFullYear();
    return `${dd}-${mmm}-${yyyy}`;
  } catch {
    return dateStr;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAP API DATA
// ─────────────────────────────────────────────────────────────────────────────
const mapApiDataToInvoice = (data) => {
  const rawTransactions = [
    ...(data.accommodationDetails || []).map((item, idx) => ({
      id: `acc-${idx}`,
      rawDate: new Date(item.date).getTime() || 0,
      date: formatDate(item.date),
      desc: item.description || item.name || item.text || "",
      amount: item.amount || item.debit || 0,
    })),
    ...(data.otherServices || []).map((item, idx) => ({
      id: `svc-${idx}`,
      rawDate: new Date(item.date).getTime() || 0,
      date: formatDate(item.date),
      desc: item.description || item.name || item.text || item.service_name || "",
      amount: item.amount || item.debit || 0,
    })),
  ];

  // Sort all transactions by date ascending (same as Egypt/Tolip pattern)
  rawTransactions.sort((a, b) => a.rawDate - b.rawDate);
  const transactions = rawTransactions;

  return {
    referenceNo:    data.referenceNo   || "",
    guestName:      data.guestName     || "",
    attention:      data.guestName     || "",
    company:        data.companyName   || "",
    address:        data.address       || "",
    confirmationNo: data.confNo        || "",
    roomNo:         data.roomNo        || "",
    crsOtaNo:       data.crsNo         || "",
    taxInvoiceNo:   data.invoiceNo     || data.referenceNo || "",
    arrivalDate:    formatDate(data.arrivalDate),
    departureDate:  formatDate(data.departureDate),
    datePrinted:    formatDate(data.invoiceDate),
    cashier:        data.cashierName   || "",
    sstRegNo:       data.sstRegNo      || "",
    ttxRegNo:       data.ttxRegNo      || "",
    transactions,
    totals: {
      totalInUsd:               data.balanceUsd          || 0,
      totalPayableExcludingTax: data.baseTaxableAmount   || 0,
      serviceTax:               data.totalSst8Percent    || 0,
      tourismTax:               data.totalTourismTax     || 0,
      totalAmountPayable:       data.grandTotalMyr       || 0,
      balance:                  0,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const LansonPalaceInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);

  const invoiceRef = useRef(null);
  const ROWS_PER_PAGE = 30;
  const isPdfDownload = location.pathname.includes("/download-pdf");

  const dummyData = {
    guestName: "Mr. Shaban Mohamed Belgasem Ashur",
    attention: "Mr Shaban Mohamed Belgasem Ashur",
    company: "",
    address: "Tripoli",
    confirmationNo: "57775986-1",
    roomNo: "703",
    crsOtaNo: "",
    taxInvoiceNo: "223801",
    arrivalDate: "08-JAN-2026",
    departureDate: "20-JAN-2026",
    datePrinted: "20-JAN-2026",
    cashier: "Lindsay Verlinie Anak Barnabas",
    sstRegNo: "W10-1808-31039762",
    ttxRegNo: "141-2017-10000377",
    transactions: [
      { id: '1', date: '18-JAN-2026', desc: 'Room Package', amount: 438.00 },
      { id: '2', date: '18-JAN-2026', desc: 'Room - SST', amount: 35.04 },
      { id: '3', date: '18-JAN-2026', desc: 'Tourism Tax', amount: 10.00 },
      { id: '4', date: '19-JAN-2026', desc: 'Room Package', amount: 438.00 },
      { id: '5', date: '19-JAN-2026', desc: 'Room - SST', amount: 35.04 },
      { id: '6', date: '19-JAN-2026', desc: 'Tourism Tax', amount: 10.00 }
    ],
    totals: {
      totalPayableExcludingTax: 5256.00,
      serviceTax: 420.48,
      tourismTax: 120.00,
      totalAmountPayable: 5796.48,
      balance: 0.00
    }
  };

  useEffect(() => {
    if (invoiceData) {
      setInvoice(mapApiDataToInvoice(invoiceData));
      setLoading(false);
    } else {
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
      await new Promise(resolve => setTimeout(resolve, 500));
      setInvoice(dummyData);
    } catch (err) {
      console.error("Error fetching invoice:", err);
      setError("Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "") return "";
    return parseFloat(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // ── Pagination ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!invoice?.transactions) return;

    const tx = invoice.transactions;
    const pages = [];

    // Max rows that comfortably fit when the totals footer IS shown on the same page.
    // The footer block (summary table + signature + lp-footer) is ~220px tall.
    // At ~22px per row that leaves room for ~15 rows safely.
    const MAX_ROWS_WITH_FOOTER = 15;

    // Max rows when no footer is needed (full page of rows only).
    const MAX_ROWS_NORMAL_PAGE = ROWS_PER_PAGE; // 30

    if (tx.length === 0) {
      pages.push({ items: [], pageNo: 1, totalPages: 1, showTotals: true });
    } else {
      let i = 0;
      while (i < tx.length) {
        const remaining = tx.length - i;
        const isLastBatch = remaining <= MAX_ROWS_NORMAL_PAGE;

        if (isLastBatch) {
          if (remaining > MAX_ROWS_WITH_FOOTER) {
            // Last batch is too big to share a page with the footer.
            // Split: put rows on this page without footer, footer gets its own empty page.
            pages.push({ items: tx.slice(i, i + remaining), showTotals: false });
            pages.push({ items: [], showTotals: true });
          } else {
            // Rows + footer fit together.
            pages.push({ items: tx.slice(i, i + remaining), showTotals: true });
          }
          i += remaining;
        } else {
          // Not the last batch — fill a full page, no footer.
          pages.push({ items: tx.slice(i, i + MAX_ROWS_NORMAL_PAGE), showTotals: false });
          i += MAX_ROWS_NORMAL_PAGE;
        }
      }
    }

    const totalPages = pages.length;
    pages.forEach((p, idx) => { p.pageNo = idx + 1; p.totalPages = totalPages; });
    setPaginatedData(pages);
  }, [invoice]);

  // PDF DOWNLOAD
  // 1. Strips all stylesheets (Tailwind oklch crash fix — same pattern as GrandAras/Tolip)
  // 2. Renders each .page div individually into its own PDF page (no blank pages)
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    // Strip all stylesheets so html2canvas never sees oklch() or other unsupported colors
    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
      if (style.parentNode) style.parentNode.removeChild(style);
    });

    try {
      // Wait for images
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      await new Promise(resolve => setTimeout(resolve, 500));

      const pageEls = invoiceRef.current.querySelectorAll('.page');
      if (!pageEls.length) return;

      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      for (let i = 0; i < pageEls.length; i++) {
        const el = pageEls[i];

        // Strip margin & shadow so canvas captures exactly the page content
        const prevMargin = el.style.margin;
        const prevShadow = el.style.boxShadow;
        el.style.margin = '0';
        el.style.boxShadow = 'none';

        const canvas = await html2canvas(el, {
          scale: 4,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          width: 794,
          windowWidth: 794,
        });

        el.style.margin = prevMargin;
        el.style.boxShadow = prevShadow;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      pdf.save(`${invoice.referenceNo || 'Invoice'}.pdf`);
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      // Always restore stylesheets
      headStyles.forEach(style => { document.head.appendChild(style); });
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

  const cashierParts = (invoice.cashier || '').split(' ');
  const cashierLine1 = cashierParts.slice(0, 3).join(' ');
  const cashierLine2 = cashierParts.slice(3).join(' ');

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
      <div className="lanson-invoice-wrapper" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{__html: `
          .lanson-invoice-wrapper {
              width: 794px;
              margin: 0 auto;
              background-color: transparent;
          }
          .lanson-invoice-wrapper * {
              box-sizing: border-box;
              font-family: Tahoma, Verdana, Arial, sans-serif;
              color: #000;
              font-size: 12px;
          }

          /* ─── PAGE: fixed A4 size, flex column, NO overflow:hidden ─── */
          .page {
              width: 100%;
              height: 1122px;
              padding: 50px 60px 40px 60px;
              margin: 0 0 20px 0;
              background: #fff;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              line-height: 1.4;
              page-break-after: always;
              break-after: page;

              /* Flex column: body grows, footer is pinned to bottom */
              display: flex;
              flex-direction: column;
              /* NO overflow:hidden — that was hiding the footer */
          }
          .page:last-child {
              page-break-after: auto;
              break-after: auto;
          }

          /*
           * lp-page-body fills all space above the footer.
           * max-height = page height (1122) - top padding (50) - bottom padding (40) - footer height (~60)
           * This hard cap ensures rows can NEVER push into footer territory.
           */
          .lp-page-body {
              flex: 1 1 auto;
              max-height: 972px;   /* 1122 - 50 - 40 - 60 */
              overflow: hidden;    /* clips rows if they somehow exceed — footer is safe */
          }

          .lp-logo-container {
              display: flex;
              justify-content: center;
              margin-bottom: 35px;
          }
          .lp-logo-container img {
              max-width: 200px;
              height: auto;
          }
          .lp-invoice-title {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 5px;
          }
          .lp-reg-info {
              font-size: 11px;
              line-height: 1.5;
              margin-bottom: 12px;
          }
          .lp-meta-container {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              gap: 25px;
          }
          .lp-meta-left  { width: 56%; }
          .lp-meta-right { width: 45%; padding-left: 33px; }
          .lp-meta-table { width: 100%; border-collapse: collapse; }
          .lp-meta-table td { padding: 1px 0; vertical-align: middle; }
          .lp-meta-table td:nth-child(1) { width: 97px; }
          .lp-meta-table td:nth-child(2) { width: 15px; }
          .lp-items-table {
              width: 100%;
              border-collapse: collapse;
              border-spacing: 0;
              margin-bottom: 10px;
          }
          .lp-items-table th {
              border-top: 2px solid #000 !important;
              border-bottom: 2px solid #000 !important;
              padding: 10px 8px !important;
              text-align: left;
              font-weight: bold;
              vertical-align: middle !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
          }
          .lp-items-table th.center { text-align: left; }
          .lp-items-table th.right,
          .lp-items-table td.right {
              text-align: right;
              width: 100px;
          }
          .lp-items-table td {
              padding: 1px 8px !important;
              vertical-align: middle !important;
          }
          .lp-items-table tbody tr:nth-child(even):not(.tbl-total-row) {
              background-color: #f4f4f4;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
          }
          .tbl-total-row td  { padding-top: 23px !important; }
          .tbl-total-label   { font-weight: bold; padding-right: 20px; }
          .amount-total-cell { border-top: 1px solid #000; padding-top: 8px !important; }
          .lp-bottom-right   { width: 400px; margin-left: auto; padding-right: 4px; }
          .lp-summary-table  { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .lp-summary-table td { text-align: right; padding: 1.5px 0; }
          .lp-summary-table td:first-child { font-weight: bold; padding-right: 20px; }
          .lp-summary-table td:last-child  { width: 100px; }
          .lp-sig-text { text-align: left; margin-bottom: 60px; line-height: 1.5; }
          .lp-sig-line { border-top: 1px solid #000; text-align: center; padding-top: 5px; }

          /* ─── FOOTER: always the last flex item, never overlaps rows ─── */
          .lp-footer {
              flex-shrink: 0;            /* never compress                         */
              margin-top: auto;          /* push to bottom within remaining space  */
              padding-top: 10px;
              font-size: 9px;
              line-height: 1.5;
          }
          .lp-footer strong {
              font-size: 10px;
              font-weight: bold;
              display: block;
              margin-bottom: 2px;
          }

          @page { size: A4 portrait; margin: 0; }
          @media print {
              body, html {
                  margin: 0 !important;
                  padding: 0 !important;
                  background-color: #fff !important;
              }
              button, nav, header, footer, .no-print {
                  display: none !important;
              }
              .lanson-invoice-wrapper {
                  padding: 0 !important;
                  margin: 0 !important;
                  background: none !important;
                  max-width: none !important;
              }
              .page {
                  margin: 0 !important;
                  padding: 50px 60px 40px 60px !important;
                  box-shadow: none !important;
                  border: none !important;
              }
          }
        `}} />

        {paginatedData.map((page, index) => (
          <div className="page" key={`page-${index}`}>

            {/* ── All content above the footer lives in lp-page-body ── */}
            <div className="lp-page-body">
              <div className="lp-logo-container">
                <img src={logo} alt="Lanson Place Logo" crossOrigin="anonymous" />
              </div>

              <div className="lp-invoice-title">Tax Invoice</div>
              <div className="lp-reg-info">
                SST Reg No.: {invoice.sstRegNo}<br />
                TTX Reg No.: {invoice.ttxRegNo}
              </div>

              <div className="lp-meta-container">
                <div className="lp-meta-left">
                  <table className="lp-meta-table">
                    <tbody>
                      <tr><td>Attention</td><td>:</td><td>{invoice.attention}</td></tr>
                      <tr><td>Company</td><td>:</td><td>{invoice.company}</td></tr>
                      <tr><td>Address</td><td>:</td><td>{invoice.address}</td></tr>
                      <tr><td>Guest Name</td><td>:</td><td>{invoice.guestName}</td></tr>
                      <tr><td>Confirmation No.</td><td>:</td><td>{invoice.confirmationNo}</td></tr>
                      <tr><td>Room No.</td><td>:</td><td>{invoice.roomNo}</td></tr>
                      <tr><td>CRS/OTA No.</td><td>:</td><td>{invoice.crsOtaNo}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="lp-meta-right">
                  <table className="lp-meta-table">
                    <tbody>
                      <tr><td>Tax Invoice No.</td><td>:</td><td>{invoice.taxInvoiceNo}</td></tr>
                      <tr><td>Arrival</td><td>:</td><td>{invoice.arrivalDate}</td></tr>
                      <tr><td>Departure</td><td>:</td><td>{invoice.departureDate}</td></tr>
                      <tr><td>Date Printed</td><td>:</td><td>{invoice.datePrinted}</td></tr>
                      <tr>
                        <td style={{verticalAlign:"top"}}>Cashier</td><td style={{verticalAlign:"top"}}>:</td>
                        <td>
                          {cashierLine1}
                          {cashierLine2 && <><br />{cashierLine2}</>}
                        </td>
                      </tr>
                      <tr ><td style={{paddingTop:"17px"}}>Page No.</td><td style={{verticalAlign:"bottom"}}>:</td><td style={{verticalAlign:"bottom"}}>{page.pageNo}/{page.totalPages}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <table className="lp-items-table">
                <thead>
                  <tr>
                    <th style={{width:"18%"}}>Date</th>
                    <th className="center">Description</th>
                    <th className="right" style={{width:"18%"}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{item.date}</td>
                      <td className="center">{item.desc}</td>
                      <td className="right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  {/* Spacer row: when page has no items, prevent Total border merging with header */}
                  {page.showTotals && page.items.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ height: '30px', borderBottom: 'none' }}></td>
                    </tr>
                  )}
                  {page.showTotals && (
                    <tr className="tbl-total-row">
                      <td></td>
                      <td className="right tbl-total-label">Total</td>
                      <td className="right amount-total-cell">0.00</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {page.showTotals && (
                <div className="lp-bottom-right">
                  <table className="lp-summary-table">
                    <tbody>
                      <tr>
                        <td>Total Amount Payable Excluding Tax</td>
                        <td>{formatCurrency(invoice.totals.totalPayableExcludingTax)}</td>
                      </tr>
                      <tr>
                        <td>Service Tax</td>
                        <td>{formatCurrency(invoice.totals.serviceTax)}</td>
                      </tr>
                      <tr>
                        <td>Tourism Tax</td>
                        <td>{formatCurrency(invoice.totals.tourismTax)}</td>
                      </tr>
                      <tr>
                        <td>Total Amount Payable</td>
                        <td>{formatCurrency(invoice.totals.totalAmountPayable)}</td>
                      </tr>
                      <tr>
                        <td>Total Amount USD</td>
                        <td>{formatCurrency(invoice.totals.totalInUsd)}</td>
                      </tr>
                      <tr>
                        <td>Balance</td>
                        <td>{formatCurrency(invoice.totals.balance)}</td>
                      </tr>
                    </tbody>
                  </table>

                </div>
              )}
            </div>
            {/* ── End lp-page-body ── */}

            {/* ── Footer: always at the bottom, never overlaps rows ── */}
            <div className="lp-footer">
              <strong>Lanson Place Bukit Ceylon</strong>
              address | 10, Jalan Ceylon Kuala Lumpur Malaysia 50200<br />
              phone | +60 3-2725 8888<br />
              fax | +60 3 2725 8899<br />
              web | https://www.lansonplace.com/bukitceylon
            </div>

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default LansonPalaceInvoiceView;