import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/cheya-logo.png';

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
    const yyyy = String(d.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  } catch { return dateStr; }
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "0,00";
  return parseFloat(val).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
  const allItems = [];
  
  (data.accommodationDetails || []).forEach((night, idx) => {
    // FLAT STYLE OR ROOM RATES
    if (!night.hotelExpenses && !night.accommodationTax) {
      if (night.description || night.rate || night.amount || night.debit || night.credit) {
        let amt = parseFloat(night.rate || night.amount || night.debit || 0) - parseFloat(night.credit || 0);
        allItems.push({
          id: `flat_${idx}`,
          rawDate: parseDateForSort(night.date),
          date: formatDate(night.date),
          departman: night.departman || "Room Rates / Odalar - Room Rates / Odalar",
          desc: night.description || "ROOM",
          evrakNo: night.evrakNo || "",
          amount: amt
        });
      }
    }

    if (night.hotelExpenses) {
      const he = night.hotelExpenses;
      let amt = parseFloat(he.debit || he.amount || 0) - parseFloat(he.credit || 0);
      allItems.push({
        id: `he_${idx}`,
        rawDate: parseDateForSort(he.date || night.date),
        date: formatDate(he.date || night.date),
        departman: he.departman || "Room Rates / Odalar - Room Rates / Odalar",
        desc: he.description || "ROOM",
        evrakNo: he.evrakNo || "",
        amount: amt
      });
    }
    if (night.accommodationTax) {
      const at = night.accommodationTax;
      let amt = parseFloat(at.debit || at.amount || 0) - parseFloat(at.credit || 0);
      allItems.push({
        id: `at_${idx}`,
        rawDate: parseDateForSort(at.date || night.date),
        date: formatDate(at.date || night.date),
        departman: at.departman || "Accommodation Tax / Konaklama Vergisi",
        desc: at.description || "Tax",
        evrakNo: at.evrakNo || "",
        amount: amt
      });
    }
  });

  (data.otherServices || []).forEach((svc, i) => {
    let amt = parseFloat(svc.amount || 0) - parseFloat(svc.credit || 0);
    allItems.push({
      id: `svc_${i}`,
      rawDate: parseDateForSort(svc.date),
      date: formatDate(svc.date),
      departman: svc.departman || "Other Services",
      desc: svc.name || "Service",
      evrakNo: svc.evrakNo || "",
      amount: amt
    });
  });

  // Adding payments inline mapping exactly to 'Cash Payment / Kasa Nakit'
  if (data.payments && Array.isArray(data.payments)) {
    data.payments.forEach((pay, idx) => {
      let amt = -parseFloat(pay.amount || 0); // credits are negative
      allItems.push({
        id: `pay_${idx}`,
        rawDate: parseDateForSort(pay.date),
        date: formatDate(pay.date),
        departman: "Cash Payment / Kasa Nakit",
        desc: pay.description || "Checkout without close folio",
        evrakNo: pay.evrakNo || "",
        amount: amt
      });
    });
  }

  allItems.sort((a, b) => a.rawDate - b.rawDate);

  const grandTotal = parseFloat(data.grandTotal || 0);

  return {
    invoiceNo:    data.invoiceNo       || data.invoiceN || "", 
    billingDate:  formatDate(data.billingDate  || data.invoiceDate) || "",
    roomNo:       data.roomNo          || "",
    pax:          data.pax             || 0,
    guestName:    data.guestName       || "",
    checkInDate:  formatDate(data.arrivalDate)   || "",
    checkOutDate: formatDate(data.departureDate) || "",
    acenta:       data.party || data.agency || "AZAR TOURISM", 
    folioNo:      data.folioNo || data.invoiceNo || "",
    roomType:     data.roomCategory || data.roomType || "2 BEDROOM APT",
    voucher:      data.voucherNo       || data.reservation || "45216371",
    time:         data.time || "10:39", // specific time format matching PDF styling
    
    items: allItems,
    grandTotal: grandTotal,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

const buildPages = (items = []) => {
  if (items.length === 0) {
    return [{ items: [], showTotals: true, pageNo: 1, totalPages: 1 }];
  }
  
  const pages = [];
  const MAX_ROWS_NORMAL = 24;
  const MAX_ROWS_WITH_TOTALS = 22; 

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
      pages.push({
        items: [],
        showTotals: true
      });
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

const CheyaInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();

  const [invoice,        setInvoice]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const [paginatedData,  setPaginatedData]  = useState([]);
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

    try {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin:    0,
        filename:  `Cheya_Invoice_${invoice.invoiceNo || 'Invoice'}.pdf`,
        image:     { type: 'jpeg', quality: 1 },
        html2canvas: {
          scale:           4,
          useCORS:         true,
          letterRendering: true,
          scrollY:         0,
          windowWidth:     794,
        },
        jsPDF:     { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      };

      await html2pdf().set(opt).from(invoiceRef.current).save();
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("PDF generation failed");
    } finally {
      headStyles.forEach(style => document.head.appendChild(style));
      setPdfLoading(false);
    }
  };

  if (!invoice) return null;

  const styles = `
    @page { size: A4; margin: 0mm; }

    * { box-sizing: border-box; }

    .invoice-box {
      width: 100%;
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #000;
      background: transparent;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .inv-page {
      width: 100%;
      max-width: 794px;
      padding: 12mm 12mm 12mm 12mm;
      margin: 0 auto 24px auto;
      background: #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      page-break-after: always;
      break-after: page;
      position: relative;
    }
    .inv-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
      margin-bottom: 0;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    .logo-block {
      width: 25%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .logo-block img {
      max-width: 110px;
      margin-bottom: 6px;
    }
    .logo-block span {
      font-size: 10px;
      padding-left: 2px;
    }
    .header-center {
      width: 50%;
      text-align: center;
    }
    .header-title {
      font-size: 21px;
      font-weight: bold;
      margin-top: 30px;
    }
    .header-right {
      width: 25%;
      text-align: right;
      font-size: 12px;
      line-height: 1.4;
    }

    .hr-line {
      border-bottom: 1.5px solid #000;
      margin-bottom: 30px;
      margin-top: -5px;
    }

    .rez-title {
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .hr-line-thick {
      border-bottom: 1.5px solid #000;
      margin-bottom: 15px;
    }

    .guest-info-box {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      line-height: 1.5;
      margin-bottom: 25px;
    }
    .info-left {
      width: 60%;
    }
    .info-right {
      width: 40%;
    }
    .info-row {
      display: flex;
      align-items: stretch;
      margin-bottom: 4px;
    }
    .info-label {
      font-weight: bold;
    }
    .info-label.left { width: 85px; }
    .info-label.right { width: 90px; }
    .info-sep {
      width: 15px;
      text-align: center;
    }
    .info-val {
      flex: 1;
    }

    .cheya-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .cheya-table th {
      background-color: #E2E2E2;
      padding: 7px 4px;
      font-weight: bold;
      text-align: left;
    }
    .cheya-table th.text-right { text-align: right; }
    .cheya-table td {
      padding: 7px 4px;
      vertical-align: top;
      line-height: 1.4;
    }
    .text-right { text-align: right !important; }

    .cheya-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1.5px solid #000;
      padding-top: 8px;
      margin-top: 5px;
      font-size: 12px;
      font-weight: bold;
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

  const PageHeader = () => (
    <>
      <div className="header-top">
        <div className="logo-block">
          <img src={logo} alt="Cheya Logo" />
        </div>
        <div className="header-center">
          <div className="header-title">Oda Nolu Misafir Folyosu</div>
        </div>
        <div className="header-right">
          <div>{invoice.billingDate || "22.01.2026"}</div>
          <div>{invoice.time}</div>
        </div>
      </div>

      {/* <div className="hr-line"></div> */}

      <div className="rez-title">Rezervasyon Bilgi</div>
      <div className="hr-line-thick"></div>

      <div className="guest-info-box">
        <div className="info-left">
          <div className="info-row">
            <div className="info-label left">Acenta</div>
            <div className="info-sep">:</div>
            <div className="info-val">{invoice.acenta}</div>
          </div>
          <div className="info-row" style={{ alignItems: 'center' }}>
            <div className="info-label left">Folyo<br/>No</div>
            <div className="info-sep">:</div>
            <div className="info-val">{invoice.folioNo}</div>
          </div>
          <div className="info-row">
            <div className="info-label left">Oda No</div>
            <div className="info-sep">:</div>
            <div className="info-val">{invoice.roomNo}</div>
          </div>
          <div className="info-row">
            <div className="info-label left">Misafir</div>
            <div className="info-sep">:</div>
            <div className="info-val" style={{ whiteSpace: 'pre-wrap' }}>{invoice.guestName}</div>
          </div>
          <div className="info-row">
            <div className="info-label left">Kisi</div>
            <div className="info-sep">:</div>
            <div className="info-val">{invoice.pax}</div>
          </div>
        </div>

        <div className="info-right">
          <div className="info-row">
            <div className="info-label right">Oda Tipi</div>
            <div className="info-sep">:</div>
            <div className="info-val">{invoice.roomType}</div>
          </div>
          <div className="info-row">
            <div className="info-label right">Geliş</div>
            <div className="info-sep">:</div>
            <div className="info-val">{invoice.checkInDate}</div>
          </div>
          <div className="info-row">
            <div className="info-label right">Ayrılış</div>
            <div className="info-sep">:</div>
            <div className="info-val">{invoice.checkOutDate}</div>
          </div>
          <div className="info-row">
            <div className="info-label right">Voucher No</div>
            <div className="info-sep">:</div>
            <div className="info-val">{invoice.voucher}</div>
          </div>
        </div>
      </div>
    </>
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
          <div
            className="inv-page"
            key={pageIdx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '277mm',
            }}
          >
            {pageIdx === 0 && <PageHeader />}

            <table className="cheya-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Tarih</th>
                  <th style={{ width: '38%' }}>Departman</th>
                  <th style={{ width: '12%' }}>Evrak No</th>
                  <th style={{ width: '26%' }}>Notlar</th>
                  <th className="text-right" style={{ width: '12%' }}>Toplam TRY</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.date}</td>
                    <td>{item.departman}</td>
                    <td>{item.evrakNo}</td>
                    <td>{item.desc}</td>
                    <td className="text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ flex: 1 }}></div>

            {page.showTotals && (
              <div className="cheya-footer">
                <span>Toplam</span>
                <span>{formatCurrency(invoice.grandTotal)} TRY</span>
              </div>
            )}
            
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default CheyaInvoiceView;
