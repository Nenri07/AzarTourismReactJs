
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';
import { InvoiceTemplate } from '../../components';
import cairoInvoiceApi from '../../Api/cairoInvoice.api';
import logo from '../../../public/intercontinental-logo.png';

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
  } catch { return dateString; }
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || val === "") return "";
  return parseFloat(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// ── Transform ────────────────────────────────────────────────────────────────
const transformApiData = (raw) => {
  if (!raw) return null;

  const addressParts = raw.address ? raw.address.split(',') : [];
  const addressLine1 = raw.companyName || "";
  const addressLine2 = addressParts[0]?.trim() || "";
  const addressLine3 = addressParts.slice(1).join(',').trim();

  const allItems = [];
  let idCounter = 0;

  if (Array.isArray(raw.accommodationDetails)) {
    raw.accommodationDetails.forEach((acc) => {
      const date = formatDate(acc.date);
      const rawD = new Date(acc.date).getTime() || 0;
      const subDesc = (raw.usdAmount && raw.exchangeRate)
        ? `${formatCurrency(raw.usdAmount)} USD * ${raw.exchangeRate}`
        : "";
      const chargeAmount = acc.chargesEgp ?? acc.baseRate ?? 0;
      allItems.push({
        id: ++idCounter, date, rawDate: rawD, sortOrder: 0,
        desc: acc.description || "Accommodation",
        subDesc,
        charges: formatCurrency(chargeAmount),
        credits: "",
      });
    });
  }

  if (Array.isArray(raw.otherServices)) {
    raw.otherServices.forEach((svc) => {
      const date = formatDate(svc.date);
      const rawD = new Date(svc.date).getTime() || 0;
      allItems.push({
        id: ++idCounter, date, rawDate: rawD, sortOrder: 1,
        desc: svc.name || "Service",
        subDesc: "",
        charges: formatCurrency(svc.amount),
        credits: "",
      });
    });
  }

  allItems.sort((a, b) => a.rawDate - b.rawDate || a.sortOrder - b.sortOrder);
  const items = allItems.map(({ rawDate, sortOrder, ...item }) => item);
  const grandTotal = formatCurrency(raw.grandTotalEgp);

  return {
    guest: {
      name: (raw.guestName || "").toUpperCase(),
      ihgRewardsNo: raw.ihgRewardsNumber || "",
      companyAgent: raw.companyName || "",
      addressLine1, addressLine2, addressLine3,
    },
    info: {
      roomNumber:    raw.roomNo       || "",
      arrivalDate:   formatDate(raw.arrivalDate),
      departureDate: formatDate(raw.departureDate),
      cashier:       raw.cashierId    || raw.userId || "",
      date:          formatDate(raw.invoiceDate),
      invoiceNo:     raw.invoiceNo    || "",
      time:          raw.invoiceTime  || "",
      referenceNo:    raw.referenceNo|| "",
    },
    items,
    totals: {
      charges:    grandTotal,
      credits:    grandTotal,
      creditsUsd: raw.balanceUsd ? `${formatCurrency(raw.balanceUsd)} USD` : "",
    },
    footer: {
      vatRate:      formatCurrency(raw.vat14Percent),
      exchangeRate: raw.exchangeRate ? `1 USD = ${raw.exchangeRate} EGP.` : "",
    },
  };
};

// ── Pagination — uniform rows, footer is outside table so no need for different last-page count ──
const ROWS_PER_PAGE = 22;

// ── Component ────────────────────────────────────────────────────────────────
const IntercontinentalInvoiceView = ({ invoiceData }) => {
  const navigate      = useNavigate();
  const { invoiceId } = useParams();
  const location      = useLocation();
  const invoiceRef    = useRef(null);

  const [invoice,    setInvoice]    = useState(null);
  const [loading,    setLoading]    = useState(!invoiceData);
  const [error,      setError]      = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pages,      setPages]      = useState([]);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (invoiceData) {
      setInvoice(transformApiData(invoiceData));
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
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await cairoInvoiceApi.getInvoiceById(invoiceId);
      let rawData = response.data || response;
      if (rawData.data) { rawData = rawData.data; if (rawData.data) rawData = rawData.data; }
      setInvoice(transformApiData(rawData));
    } catch (err) {
      console.error("❌ Error fetching InterContinental invoice:", err);
      setError(err.message || "Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!invoice) return;
    const items  = invoice.items || [];
    const result = [];
    if (items.length === 0) {
      result.push({ items: [], pageNo: 1, totalPages: 1, isLast: true });
    } else {
      for (let i = 0; i < items.length; i += ROWS_PER_PAGE) {
        result.push({ items: items.slice(i, i + ROWS_PER_PAGE), pageNo: result.length + 1, isLast: false });
      }
      result[result.length - 1].isLast = true;
      result.forEach((p, i) => { p.pageNo = i + 1; p.totalPages = result.length; });
    }
    setPages(result);
  }, [invoice]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);
    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(s => s.parentNode && s.parentNode.removeChild(s));
    try {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      await new Promise(resolve => setTimeout(resolve, 500));
      const opt = {
        margin: 0,
        filename: `${invoice?.info?.referenceNo  }.pdf`,
        image:    { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, windowWidth: 794 },
        jsPDF:    { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css'] },
      };
      await html2pdf().set(opt).from(invoiceRef.current).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      headStyles.forEach(s => document.head.appendChild(s));
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (!invoice) {
    return (
      <InvoiceTemplate loading={loading} error={error} invoice={null} onBack={() => navigate("/invoices")}>
        <></>
      </InvoiceTemplate>
    );
  }

  // Shared colgroup widths used in both the data table and footer tables
  // so all columns are perfectly aligned
  const colGroup = (
    <colgroup>
      <col style={{ width: '14%' }} />
      <col style={{ width: '56%' }} />
      <col style={{ width: '15%' }} />
      <col style={{ width: '15%' }} />
    </colgroup>
  );

  return (
    <InvoiceTemplate
      loading={loading} error={error}
      invoice={{ referenceNo: invoice.info?.invoiceNo }}
      pdfLoading={pdfLoading}
      onDownloadPDF={handleDownloadPDF}
      onPrint={handlePrint}
      onBack={() => navigate("/invoices")}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .ic-wrapper {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: #e6e6e6;
            box-sizing: border-box;
            gap: 0;
        }
        .ic-page {
            width: 794px;
            height: 1122px;
            background: #fff;
            padding: 28px 17px 20px 17px;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #000;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        .ic-logo-section {
            display: flex;
            justify-content: center;
            margin-bottom: 10px;
        }
        .ic-logo-section img { max-height: 85px; width: auto; }
        .ic-info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            line-height: 1.4;
            flex-shrink: 0;
        }
        .ic-left-info  { width: 55%; }
        .ic-right-info { width: 50%; position: relative; }
        .ic-grid-left, .ic-grid-right { display: grid; row-gap: 6px; }
        .ic-grid-left  { grid-template-columns: 125px 1fr; }
        .ic-grid-right { grid-template-columns: 110px 1fr; }
        .ic-label { color: #000; }
        .ic-grid-right .ic-label { text-align: right; padding-right: 10px; }
        .ic-value           { font-weight: bold; }
        .ic-value.ic-normal { font-weight: normal; }
        .ic-floating-time { position: absolute; right: 80px; top: 85px; }
        .ic-invoice-title {
            font-weight: bold;
            margin-bottom: 4px;
            padding-left: 20px;
            flex-shrink: 0;
        }

        /* Table wrapper — grows to fill space between header and footer */
        .ic-table-wrapper {
            flex: 1;
            overflow: hidden;
        }

        /* Data table — fills the wrapper so column borders draw across the full space */
        table.ic-table {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .ic-table th, .ic-table td {
            vertical-align: top;
            padding: 5px 5px;
            box-sizing: border-box;
        }
        .ic-nb  { border-right: none !important; }
        .ic-col-date    { width: 14%; }
        .ic-col-desc    { width: 56%; }
        .ic-col-charges { width: 15%; }
        .ic-col-credits { width: 15%; }
        .ic-br { border-right:  1px solid #000 !important; }
        .ic-bt { border-top:    1px solid #000 !important; }
        .ic-bb { border-bottom: 1px solid #000 !important; }
        .ic-table thead th {
            border-top: 1px solid #000 !important;
            border-bottom: 1px solid #000 !important;
            border-right: none !important;
            font-weight: normal;
            text-align: left;
            padding: 7px 5px;
        }
        .ic-rr { border-right: 1px solid #000 !important; }
        .ic-desc-inner {
            display: flex;
            justify-content: space-between;
            padding-right: 120px;
        }

        /* Footer sits directly below the table wrapper — no gap */
        .ic-footer {
            flex-shrink: 0;
        }
        .ic-footer table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .ic-footer td {
            vertical-align: top;
            padding: 5px 5px;
            box-sizing: border-box;
            font-size: 11px;
        }
        .ic-total-label { font-weight: bold; }

        @page { size: A4 portrait; margin: 0; }
        @media print {
            body, html { margin: 0 !important; padding: 0 !important; background: #fff !important; }
            button, nav, header, footer, .no-print { display: none !important; }
            .ic-wrapper { padding: 0 !important; gap: 0 !important; background: none !important; }
            .ic-page {
                margin-bottom: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                padding: 8mm 12mm 6mm 12mm !important;
                page-break-after: always;
                overflow: hidden !important;
            }
            .ic-page:last-child { page-break-after: avoid; }
        }
      `}} />

      <div className="ic-wrapper" ref={invoiceRef}>
        {pages.map((page) => (
          <div className="ic-page" key={page.pageNo}>

            {/* ── LOGO ── */}
            <div className="ic-logo-section">
              <img src={logo} alt="InterContinental Logo" />
            </div>

            {/* ── GUEST / ROOM INFO ── */}
            <div className="ic-info-section">
              <div className="ic-left-info">
                <div className="ic-grid-left">
                  <div className="ic-label">Guest Name.</div>
                  <div className="ic-value">{invoice.guest.name}</div>
                  <div className="ic-label">IHG® Rewards No.:</div>
                  <div className="ic-value">{invoice.guest.ihgRewardsNo}</div>
                  <div className="ic-label">Address.</div>
                  <div className="ic-value ic-normal" style={{ lineHeight: 1.2 }}>
                    {invoice.guest.addressLine1}<br />
                    {invoice.guest.addressLine2}<br />
                    {invoice.guest.addressLine3}
                  </div>
                </div>
                <div className="ic-grid-left" style={{ marginTop: '10px' }}>
                  <div className="ic-label">Company/Agent:</div>
                  <div className="ic-value ic-normal">{invoice.guest.companyAgent}</div>
                </div>
              </div>

              <div className="ic-right-info">
                <div className="ic-grid-right">
                  <div className="ic-label">Room Number:</div>
                  <div className="ic-value">{invoice.info.roomNumber}</div>
                  <div className="ic-label">Arriva Date:</div>
                  <div className="ic-value ic-normal">{invoice.info.arrivalDate}</div>
                  <div className="ic-label">Departure Date:</div>
                  <div className="ic-value ic-normal">{invoice.info.departureDate}</div>
                  <div className="ic-label">Cashier:</div>
                  <div className="ic-value ic-normal">{invoice.info.cashier}</div>
                  <div className="ic-label">Date:</div>
                  <div className="ic-value ic-normal">{invoice.info.date}</div>
                  <div className="ic-label">Page No.:</div>
                  <div className="ic-value ic-normal">{page.pageNo} of {page.totalPages}</div>
                  <div className="ic-label">Invoice No.:</div>
                  <div className="ic-value ic-normal">{invoice.info.invoiceNo}</div>
                </div>
                <div className="ic-floating-time"> Time {invoice.info.time}</div>
              </div>
            </div>

            <div className="ic-invoice-title">INFORMATION INVOICE</div>

            {/* ── DATA TABLE — rows only, no footer inside ── */}
            <div className="ic-table-wrapper">
              <table className="ic-table">
                {colGroup}
                <thead>
                  <tr>
                    <th className="ic-br ic-nb" style={{ paddingLeft: '10px' }}>Date</th>
                    <th className="ic-br ic-nb" style={{ textAlign: 'center' }}>Descriptions</th>
                    <th className="ic-br ic-nb" style={{ textAlign: 'center' }}>Charges EGP.</th>
                    <th className="ic-nb"       style={{ textAlign: 'center' }}>Credits EGP.</th>
                  </tr>
                </thead>
                <tbody style={{ lineHeight: 1.5 }}>
                  {page.items.map(item => (
                    <tr key={item.id}>
                      <td className="ic-br">{item.date}</td>
                      <td className="ic-br">
                        {item.subDesc ? (
                          <div className="ic-desc-inner">
                            <span>{item.desc}</span>
                            <span>{item.subDesc}</span>
                          </div>
                        ) : item.desc}
                      </td>
                      <td className="ic-br" style={{ textAlign: 'right', paddingRight: '20px' }}>{item.charges}</td>
                      <td>{item.credits}</td>
                    </tr>
                  ))}
                  {/* Stretching spacer — fills remaining table height, draws column borders */}
                  <tr style={{ height: '100%' }}>
                    <td className="ic-br"></td>
                    <td className="ic-br"></td>
                    <td className="ic-br"></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── FOOTER — OUTSIDE the table, pinned to bottom by margin-top:auto ── */}
            <div className="ic-footer">

              {/* 1. Total row — same column widths as data table */}
              <table>
                {colGroup}
                <tbody>
                  <tr style={{ height: '46px' }}>
                    <td className="ic-bt ic-bb ic-br ic-total-label" style={{ textAlign: 'center', padding: '7px 5px', height: '46px', boxSizing: 'border-box' }}>Total</td>
                    <td className="ic-bt ic-bb ic-br" style={{ padding: '7px 5px', height: '46px', boxSizing: 'border-box' }}></td>
                    <td className="ic-bt ic-bb ic-br ic-total-label" style={{ textAlign: 'right', padding: '7px 20px 7px 5px', height: '46px', boxSizing: 'border-box' }}>
                      {page.isLast ? invoice.totals.charges : ''}
                    </td>
                    <td className="ic-bt ic-bb ic-total-label" style={{ textAlign: 'right', padding: '7px 23px 7px 5px', height: '46px', boxSizing: 'border-box' }}>
                      {page.isLast ? invoice.totals.credits : ''}
                      {/* Fixed height div — always present so row is same height on every page */}
                      <div style={{ marginTop: '6px', height: '13px', lineHeight: '13px' }}>
                        {page.isLast ? invoice.totals.creditsUsd : ''}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ height: '14px' }} />

              {/* 2. Approved by / Company / Account Receivable */}
              <table>
                <colgroup>
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '42%' }} />
                  <col style={{ width: '44%' }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td rowSpan="2" className="ic-bt ic-br ic-bb" style={{ verticalAlign: 'top', paddingTop: '8px' }}>Approved by</td>
                    <td className="ic-bt" style={{ height: '28px' }}></td>
                    <td className="ic-bt"></td>
                  </tr>
                  <tr>
                    <td className="ic-bt ic-bb ic-br" style={{ padding: '6px 5px' }}>Company / Travel Agency</td>
                    <td className="ic-bt ic-bb" style={{ padding: '6px 5px' }}>Account Receivable No..</td>
                  </tr>
                </tbody>
              </table>

              {/* 3. VAT Rate / Exchange Rate / Signature / Address */}
              <table>
                <colgroup>
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '35%' }} />
                  <col style={{ width: '35%' }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="ic-bb" style={{ padding: '5px', lineHeight: 1.6 }}>
                      Vat Rate = {page.isLast ? invoice.footer.vatRate : ''}<br />
                      Exchange Rate {page.isLast ? invoice.footer.exchangeRate : ''}
                    </td>
                    <td className="ic-bb" style={{ textAlign: 'center', padding: '5px' }}>Signature</td>
                    <td className="ic-bb" style={{ padding: '5px' }}>Address</td>
                  </tr>
                </tbody>
              </table>

            </div>{/* end ic-footer */}

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default IntercontinentalInvoiceView;