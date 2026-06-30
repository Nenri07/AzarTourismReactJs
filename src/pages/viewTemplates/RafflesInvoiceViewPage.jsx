

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import logo from '/raffles-logo.png?url';
import turkeyInvoiceApi from "../../Api/turkeyInvoice.api";
import toast from "react-hot-toast";
import { InvoiceTemplate } from "../../components";
import html2pdf from 'html2pdf.js';

// --- Turkish amount-to-words helpers ---------------------------------------
// The backend doesn't send a written-out (words) version of the total, so it's
// generated here from the numeric grandTotal instead of being hardcoded.

function numberToTurkishWords(num) {
  if (num === 0) return "Sıfır";

  const ones = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
  const tens = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Seksen", "Doksan"];
  const scales = ["", "Bin", "Milyon", "Milyar", "Trilyon"];

  function threeDigitsToWords(n) {
    let result = "";
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;

    if (h > 0) {
      if (h > 1) result += ones[h] + " ";
      result += "Yüz ";
    }
    if (t > 0) result += tens[t] + " ";
    if (o > 0) result += ones[o] + " ";

    return result.trim();
  }

  const groups = [];
  let n = Math.floor(num);
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  let result = "";
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group === 0) continue;

    const scale = scales[i];

    // "bin" drops "bir" (1000 -> "Bin", not "Bir Bin"). Milyon/Milyar keep it.
    if (i === 1 && group === 1) {
      result += "Bin ";
    } else {
      result += threeDigitsToWords(group) + (scale ? " " + scale : "") + " ";
    }
  }

  return result.replace(/\s+/g, " ").trim();
}

function amountToTurkishLiraText(amount) {
  const safeAmount = Math.round((Math.abs(Number(amount) || 0) + Number.EPSILON) * 100) / 100;
  let lira = Math.floor(safeAmount);
  let kurus = Math.round((safeAmount - lira) * 100);

  if (kurus >= 100) {
    kurus -= 100;
    lira += 1;
  }

  const liraWords = numberToTurkishWords(lira);

  if (kurus === 0) {
    return `Yalnız ${liraWords} Türk Lirasıdır`;
  }

  const kurusWords = numberToTurkishWords(kurus);
  return `Yalnız ${liraWords} Türk Lirası ${kurusWords} Kuruştur`;
}

export default function RafflesInvoiceViewPage({ invoiceData }) {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const invoiceRef = useRef(null);
  const ROWS_PER_PAGE = 25;

  const isPdfDownload = location.pathname.includes("/download-pdf");

  const transformInvoiceData = (inputData) => {
    console.log("🔄 Transforming data:", inputData);
    if (!inputData) {
      console.error("❌ No data to transform");
      return null;
    }

    let data = inputData;
    while (data && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      data = data.data;
    }

    const transactions = [];

    // Helper to get consistent timestamp for date sorting
    const getTimestamp = (dateString) => {
      if (!dateString) return 0;
      const parsedDate = new Date(dateString);
      return isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
    };

    (data.accommodationDetails || []).forEach((detail) => {
      const transTimestamp = getTimestamp(detail.date);

      if (detail.hotelExpenses) {
        transactions.push({
          description: detail.hotelExpenses.description || "Otel Harcamaları / Hotel Expenses",
          date: formatDate(detail.date),
          timestamp: transTimestamp,
          debit: detail.hotelExpenses.debit != null ? formatCurrency(detail.hotelExpenses.debit) : "",
          credit: "",
        });
        if (detail.accommodationTax) {
          transactions.push({
            description: detail.accommodationTax.description || "Accommodation Tax",
            date: formatDate(detail.date),
            timestamp: transTimestamp,
            debit: detail.accommodationTax.debit != null ? formatCurrency(detail.accommodationTax.debit) : "",
            credit: "",
          });
        }
      } else {
        transactions.push({
          description: detail.description || "Hébergement / Accommodation",
          date: formatDate(detail.date),
          timestamp: transTimestamp,
          debit: detail.rate != null ? formatCurrency(detail.rate) : "",
          credit: "",
        });
      }
    });

    (data.otherServices || []).forEach((svc) => {
      const svcDate = svc.date || svc.service_date;
      transactions.push({
        description: svc.name || svc.service_name || "Service",
        date: formatDate(svcDate),
        timestamp: getTimestamp(svcDate),
        debit: svc.taxable_amount != null ? formatCurrency(svc.taxable_amount) : "",
        credit: "",
      });
    });

    // Sort transactions by date (chronological order)
    transactions.sort((a, b) => a.timestamp - b.timestamp);

    const taxTableRows = [];

    const totalRoomBase = parseFloat(data.totalRoomAllNights || data.total_per_night) || 0;
    const totalVat10 = parseFloat(data.totalVat10 || data.vat_total_nights) || 0;

    if (totalRoomBase > 0) {
      taxTableRows.push({
        rate: "%10",
        base: formatCurrency(totalRoomBase),
        amount: formatCurrency(totalVat10),
      });
    }

    const totalServicesTaxable = parseFloat(data.totalServicesTaxable) ||
      (data.otherServices || []).reduce((sum, s) => sum + (parseFloat(s.taxable_amount) || 0), 0);
    const totalVat20 = parseFloat(data.totalVat20) ||
      (data.otherServices || []).reduce((sum, s) => sum + (parseFloat(s.vat_20_percent) || 0), 0);

    if (totalServicesTaxable > 0) {
      taxTableRows.push({
        rate: "%20",
        base: formatCurrency(totalServicesTaxable),
        amount: formatCurrency(totalVat20),
      });
    }

    const accTaxTotalNights = parseFloat(data.totalAccTax || data.acc_tax_total_nights || data.accommodationTax) || 0;
    // if (accTaxTotalNights > 0) {
    //   taxTableRows.push({
    //     rate: "%2 Konaklama",
    //     base: formatCurrency(totalRoomBase),
    //     amount: formatCurrency(accTaxTotalNights),
    //   });
    // }

    const builtTaxTable = taxTableRows.length > 0
      ? taxTableRows
      : [{ rate: "%10", base: "0.00", amount: "0.00" }];

    const grandTotal = parseFloat(data.grandTotal) || 0;

    // Prevent formatting from truncating the exact exchange rate decimals
    const exactExchangeRate = data.exchangeRate || "";
    const exRateNum = parseFloat(exactExchangeRate) || 0;

    const computedEur = exRateNum > 0 ? grandTotal / exRateNum : 0;
    const finalEur = parseFloat(data.totalInEur) || computedEur;

    const displayCompanyName = data.companyName && data.companyName !== data.referenceNo
      ? data.companyName
      : "Azar Tourism";

    return {
      companyName: displayCompanyName,
      referenceNo: data.referenceNo || "",
      companyAddress: data.companyAddress || "Algeria Square Building Number 12 First Floor",
      companyCityAndCountry: data.companyCityAndCountry || "Tripoli, Libya",
      companyCountry: data.companyCountry || "Libya",
      taxOfficeNo: data.taxOfficeNo || `${data.vd || "999"} - ${data.vNo || "009988"}`,
      guestName: data.guestName || "",
      invoiceDate: formatDate(data.invoiceDate || data.billingDate || ""),
      arrivalDate: formatDate(data.arrivalDate || ""),
      departureDate: formatDate(data.departureDate || ""),
      roomNo: data.roomNo || data.odaNo || "",
      adults: String(data.paxAdult || data.pax || 1),
      children: String(data.paxChild || 0),
      cashNo: data.batchNo || "",
      cashier: data.cashierNo || data.cashierId || "",
      confNo: data.confNo || data.confirmationNo || "",
      folioNo: data.folioNo || data.folioNumber || data.folio_number || "",
      user: data.userId || "",
      tcKimlikNo: data.tcKimlikNo || data.passportNo || "",
      transactions,
      taxTable: builtTaxTable,
      balance: `${formatCurrency(grandTotal)} TRL`,
      totalInEUR: formatCurrency(finalEur),
      writtenTotalText: data.writtenTotalText || amountToTurkishLiraText(grandTotal),
      exchangeRate: exactExchangeRate ? `${exactExchangeRate} TRL` : "",
    };
  };

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      const transformed = transformInvoiceData(response);
      setInvoice(transformed);
    } catch (err) {
      console.error("❌ Error fetching invoice:", err);
      setError(err.message || "Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceData) {
      const transformed = transformInvoiceData(invoiceData);
      setInvoice(transformed);
      setLoading(false);
    } else if (invoiceId) {
      fetchInvoiceData();
    } else {
      setError("No invoice identifier provided");
      setLoading(false);
    }
  }, [invoiceData, invoiceId]);

  useEffect(() => {
    if (isPdfDownload && invoice) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice]);

  const paginatedData = useMemo(() => {
    if (!invoice || !invoice.transactions) return [];
    const pages = [];
    const totalTransactions = invoice.transactions.length;

    for (let i = 0; i < totalTransactions; i += ROWS_PER_PAGE) {
      pages.push({
        transactions: invoice.transactions.slice(i, i + ROWS_PER_PAGE),
        pageNum: pages.length + 1,
        isLastPage: i + ROWS_PER_PAGE >= totalTransactions,
      });
    }

    if (pages.length === 0) {
      pages.push({ transactions: [], pageNum: 1, isLastPage: true });
    }
    return pages;
  }, [invoice]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, '0');
      const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      return `${day} ${months[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // PDF capture must visually match the @media print rules exactly (same
  // left/right padding as the view, tight row spacing). html2canvas renders
  // the live screen DOM, so it does NOT pick up @media print styles on its
  // own - a temporary <style> with capture-mode rules is injected right
  // before capture, then removed afterwards, mirroring the @media print block.
  const PDF_CAPTURE_STYLE_ID = "raffles-pdf-capture-overrides";


const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
            import('html2canvas'),
            import('jspdf')
        ]);

        invoiceRef.current.classList.add('pdf-export-mode');

        const canvas = await html2canvas(invoiceRef.current, {
            scale: 1.4, 
            useCORS: true,
            backgroundColor: '#ffffff',
         onclone: (clonedDoc) => {
    const style = clonedDoc.createElement('style');
    style.innerHTML = `
        * { color: #000000 !important; border-color: #000000 !important; background-color: transparent !important; }
        #invoice-wrapper { background-color: #ffffff !important; }
        .meta-container { font-size: 14px !important; }
    `;
    clonedDoc.head.appendChild(style);

    // Direct inline overrides — guaranteed to win over the "*" reset above
    // and over the original component stylesheet, no specificity guesswork.

    // Main table header — vertical-center text in each <th>
    clonedDoc.querySelectorAll('#line-items th').forEach((th) => {
        th.style.setProperty('vertical-align', 'middle', 'important');
        th.style.setProperty('border-top', '1px solid #000', 'important');
        th.style.setProperty('border-bottom', '1px solid #000', 'important');
        th.style.setProperty('padding', '2px 0 5px 0', 'important');
        th.style.setProperty('text-align', 'left', 'important');
        th.style.setProperty('font-weight', 'normal', 'important');
        th.style.setProperty('box-sizing', 'border-box', 'important');
    });

    // Tax table header — gray block has to actually sit behind the
    // two-line text, vertically centered, with matching black text
    clonedDoc.querySelectorAll('#tax-table th').forEach((th) => {
        th.style.setProperty('background-color', '#e6e6e6', 'important');
        th.style.setProperty('color', '#000000', 'important');
        th.style.setProperty('padding', '4px 8px', 'important');
        th.style.setProperty('font-weight', 'normal', 'important');
        th.style.setProperty('text-align', 'right', 'important');
        th.style.setProperty('line-height', '1.2', 'important');
        th.style.setProperty('vertical-align', 'middle', 'important');
    });

    clonedDoc.querySelectorAll('#tax-table td').forEach((td) => {
        td.style.setProperty('padding', '3px 8px 0 8px', 'important');
        td.style.setProperty('text-align', 'right', 'important');
        td.style.setProperty('vertical-align', 'middle', 'important');
    });

    // Exchange-rate footer line — lock to bold 13px
    clonedDoc.querySelectorAll('.exchange-rate-row').forEach((el) => {
        el.style.setProperty('font-size', '13px', 'important');
        el.style.setProperty('font-weight', '700', 'important');
        el.style.setProperty('letter-spacing', '0.2px', 'important');
    });

    // Balance/Toplam block — was being pushed down 20px, pull it back in
    // line with the on-screen spacing instead
    clonedDoc.querySelectorAll('.tax-balance-wrapper').forEach((el) => {
        el.style.setProperty('margin-top', '3px', 'important');
        el.style.setProperty('padding-top', '2px', 'important');
    });
}
        });

        invoiceRef.current.classList.remove('pdf-export-mode');

        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const pdf = new jsPDF('p', 'mm', 'legal');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const ratio = canvas.height / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfWidth * ratio);
        pdf.save(`${invoice.referenceNo}.pdf`);

    } catch (err) {
        console.error("PDF Export Critical Error:", err);
        if (invoiceRef.current) {
            invoiceRef.current.classList.remove('pdf-export-mode');
        }
        alert("PDF failed. Please try again.");
    }
};
  const handlePrint = () => window.print();

  if (!invoice) {
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
        <></>
      </InvoiceTemplate>
    );
  }

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
      <style>{`
        @page { size: A4 portrait; margin: 0; }

      .pdf-export-mode {
        color: #000000 !important;
        background-color: #ffffff !important;
    }
    .pdf-export-mode * {
        color: #000000 !important;
        border-color: #000000 !important;
        background-color: transparent !important;
    }

        .invoice-wrapper {
          background-color: #fff;
          width: 850px;
          margin: 0 auto;
          color: #000;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .invoice-page {
          background-color: white;
          width: 100%;
          /* Removed min-height to prevent pushing an extra page in PDF */
          padding: 40px 40px 40px 25px;
          box-sizing: border-box;
          position: relative;
          page-break-inside: avoid;
        }

        /* Apply page break ONLY if it is not the last page */
        .invoice-page:not(:last-child) {
          page-break-after: always;
        }

        .header-top { position: relative; height: 120px; }

        .address-block {
          position: absolute;
          top: 20px;
          left: 0;
          line-height: 1.3;
          max-width: 350px;
        }

        .logo-block {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }

        .logo-block img { width: 120px; height: auto; padding-top: 20px;}

        .header-sub {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          line-height: 1.5;
        }

        .guest-info { width: 50%;}
        .date-info  { width: 50%; padding-left: 50px; }

        .meta-container {
          display: grid;
          grid-template-columns: 22% 25% 31% 22%;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 13px;
          width: 100%;
        }

        .meta-col { display: flex; flex-direction: column; line-height: 1.6; }

        .meta-row {
          display: flex;
          align-items: flex-start;
        }

        .meta-label      { width: 100px; flex-shrink: 0; }
        .meta-labelend    { width: 70px; flex-shrink: 0; }

        .meta-label-wide { width: 95px; flex-shrink: 0; }

        .meta-value {
          flex: 1;
          min-width: 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-all;
        }

        /* table-layout: fixed needs box-sizing: border-box on every cell so
           any future border/padding tweaks can't push column widths past
           100% of the table and clip the last column off the page. */
        .line-items {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          box-sizing: border-box;
        }

        .line-items th {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 2px 0 5px 0;
          text-align: left;
          font-weight: normal;
          box-sizing: border-box;
        }

        .line-items td {
        line-height: 1;
          /* View/screen row gap. Was 0.5px (effectively none); bumped to give
             each row visible breathing room on screen. */
          padding: 3px 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
          box-sizing: border-box;
        }

        .col-desc               { width: 45%; }
        .col-date               { width: 25%; }
        .col-debit               { width: 15%; }
        /* A couple of percent narrower + an explicit right-side safety pad so the
           right-aligned credit value can never round past the table's own edge
           at scale 2 during PDF capture. */
        .col-credit              { width: 13%; padding-right: 2%; box-sizing: border-box; }

        .tax-balance-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-top: 1px solid #000;
          padding-top: 2px;
          margin-top: 3px;
          width: 100%;
        }

        .tax-table {
          border-collapse: collapse;
          font-size: 11px;
          width: auto;
        }

        .tax-table th {
          background-color: #e6e6e6;
          padding: 0px 8px;
          font-weight: normal;
          text-align: right;
          line-height: 1.2;
        }

        .tax-table td {
          padding: 3px 8px 0 8px;
          text-align: right;
        }

        .balance-line {
          display: flex;
          justify-content: space-between;
          width: 65%;
          font-size: 14px;
          padding-top: 3px;
        }

        .balance-label {
          padding-left: 40px;
        }

        .balance-value {
          text-align: right;
        }

        .footer {
          margin-top: 45px;
          line-height: 1.4;
          display: block;
        }

        .footer-row {
          font-size: 14px;
          margin-bottom: 2px;
        }

        .footer-spacer {
          height: 20px;
        }

        .exchange-rate-row {
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.2px;
        }

        /* --- PERFECT CENTERING FOR PRINT --- */
        @media print {
          html, body {
            width: 100%;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center; /* Forces horizontal centering */
            background-color: white;
          }

          .invoice-wrapper {
            width: 100%;
            max-width: 850px; /* Allows it to scale down to fit the A4 width perfectly */
            margin: 0 auto !important;
          }

          .invoice-page {
            /* Same left/right padding as the on-screen view (40px), kept on
               the page box itself rather than spread across individual
               children. Padding here is what actually narrows the box that
               .line-items (width: 100%) measures against - applying it to
               children instead leaves the table's own right edge flush with
               the page edge and clips the last column. Top/bottom padding
               is reduced from the screen's 40px since printers already clip
               near the physical paper edge. */
            padding: 16px 40px 16px 25px;
            box-sizing: border-box;
            box-shadow: none;
            min-height: auto;
          }

          .line-items td {
       
            /* Decreased again per latest request - main transactions table
               only, .tax-table td is untouched and keeps its own padding. */
            padding: 2px 0;
          }

          .no-print { display: none !important; }
          .tax-table th {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div id="invoice-wrapper" ref={invoiceRef} className="invoice-wrapper">
        {paginatedData.map((page, pageIdx) => (
          <div key={pageIdx} className="invoice-page">

            <div className="header-top">
              <div className="address-block">
                {invoice.companyName}<br />
                {invoice.companyAddress}<br />
                {invoice.companyCityAndCountry}<br />
                {invoice.companyCountry}
              </div>
              <div className="logo-block">
                <img src={logo} alt="Raffles Istanbul" />
              </div>
            </div>

            <div className="header-sub">
              <div className="guest-info">
                TaxOfc./V.D. - Tax no/ V.No. : {invoice.taxOfficeNo}<br />
                &nbsp;{invoice.guestName}
              </div>
              <div className="date-info">
                {invoice.invoiceDate}
              </div>
            </div>

            <div className="meta-container">
              <div className="meta-col">
                <div className="meta-row">
                  <div className="meta-label">Room/Oda</div>
                  <div className="meta-value">: {invoice.roomNo}</div>
                </div>
                <div className="meta-row">
                  <div className="meta-label">Adult/Yetişkin</div>
                  <div className="meta-value">: {invoice.adults}</div>
                </div>
                <div className="meta-row">
                  <div className="meta-label">Csh No/Kasa No</div>
                  <div className="meta-value">: {invoice.cashNo}</div>
                </div>
              </div>

              <div className="meta-col">
                <div className="meta-row">
                  <div className="meta-label">Arrival/Giriş</div>
                  <div className="meta-value">: {invoice.arrivalDate}</div>
                </div>
                <div className="meta-row">
                  <div className="meta-label">Child/Çocuk</div>
                  <div className="meta-value">: {invoice.children}</div>
                </div>
                <div className="meta-row">
                  <div className="meta-label">Cashier/Kasiyer</div>
                  <div className="meta-value">: {invoice.cashier}</div>
                </div>
              </div>

              <div className="meta-col">
                <div className="meta-row">
                  <div className="meta-label-wide">Departure/Çıkış</div>
                  <div className="meta-value">: {invoice.departureDate}</div>
                </div>
                <div className="meta-row">
                  <div className="meta-label-wide">TcKimlikNo</div>
                  <div className="meta-value">: {invoice.tcKimlikNo}</div>
                </div>
                <div className="meta-row">
                  <div className="meta-label-wide">User/Kullanıcı</div>
                  <div className="meta-value">: {invoice.user}</div>
                </div>
              </div>

              <div className="meta-col">
                <div className="meta-row">
                  <div className="meta-labelend">Conf No</div>
                  <div className="meta-value">: {invoice.confNo}</div>
                </div>
                <div className="meta-row">
                  <div className="meta-labelend">Folio</div>
                  <div className="meta-value">: {invoice.folioNo}</div>
                </div>
                <div className="meta-row">
                  <div className="meta-labelend">Page/Sayfa</div>
                  <div className="meta-value">: {page.pageNum}</div>
                </div>
              </div>
            </div>

            <table className="line-items" id="line-items">
              <thead style={{verticalAlign:"top"}}>
                <tr>
                  <th className="col-desc">Açıklama/Description</th>
                  <th className="col-date" style={{paddingLeft: "15px"}}>Date/Tarih</th>
                  <th className="col-debit" style={{paddingLeft: "15px"}}>Debit/Borç</th>
                  <th className="col-credit" style={{textAlign: "right"}}>Credit/Alacak</th>
                </tr>
              </thead>
              <tbody>
                {page.transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="col-desc">{transaction.description}</td>
                    <td className="col-date" style={{paddingLeft: "15px"}}>{transaction.date}</td>
                    <td className="col-debit" style={{paddingLeft: "15px"}}>{transaction.debit}</td>
                    <td className="col-credit" style={{textAlign: "right"}}>{transaction.credit}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {page.isLastPage && (
              <>
                <div className="tax-balance-wrapper">

                  <table className="tax-table" id="tax-table">
                    <thead>
                      <tr>
                        <th>Tax Rate<br />KDV Oranı</th>
                        <th>Tax Base<br />KDV Matrahı</th>
                        <th>Tax Amount<br />KDV Tutarı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.taxTable.map((tax, index) => (
                        <tr key={index}>
                          <td>{tax.rate}</td>
                          <td>{tax.base}</td>
                          <td>{tax.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="balance-line">
                    <span className="balance-label">Balance/Toplam &nbsp;:</span>
                    <span className="balance-value">0.00</span>
                  </div>

                </div>

                <div className="footer">
                  <div className="footer-row">
                    EUR Toplam / Total in EUR &nbsp;{invoice.totalInEUR}
                  </div>
                  <div className="footer-row">
                    {invoice.writtenTotalText}
                  </div>

                  <div className="footer-spacer"></div>

                  <div className="exchange-rate-row">
                    Room Check-in Exch. Rate ( EUR ) : &nbsp;&nbsp;{invoice.exchangeRate}
                  </div>
                </div>
              </>
            )}

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
}