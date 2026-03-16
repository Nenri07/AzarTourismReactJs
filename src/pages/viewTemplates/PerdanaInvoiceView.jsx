import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  } catch {
    return dateStr;
  }
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "0.00";
  return parseFloat(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const parseDateForSort = (dateStr) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const PerdanaInvoiceViewPage = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  const mapApiDataToInvoice = (data) => {
    if (!data) return null;

    const accommodationItems = (data.accommodationDetails || []).map((item, index) => ({
      id: `acc_${index}`,
      rawDate: parseDateForSort(item.date),
      date: formatDate(item.date),
      desc: item.description,
      ref: item.reference || "",
      charges: item.amount,
      credits: ""
    }));

    const serviceItems = (data.otherServices || []).map((item, index) => ({
      id: `ser_${index}`,
      rawDate: parseDateForSort(item.date),
      date: formatDate(item.date),
      desc: item.description,
      ref: item.reference || "",
      charges: item.amount,
      credits: ""
    }));

    const allItems = [...accommodationItems, ...serviceItems].sort((a, b) => a.rawDate - b.rawDate);

    return {
      guest: {
        name: data.guestName || "",
        company: data.companyName || "",
        address: data.address || ""
      },
      meta: {
        roomNo: data.roomNo || "",
        arrival: formatDate(data.arrivalDate),
        departure: formatDate(data.departureDate),
        pageNo: "", // Set during pagination
        invoiceNo: data.invoiceNo || "",
        confNo: data.confNo || "",
        cashierNo: data.cashierName || "",
        sstNo: data.sstRegNo || "",
        ttxNo: data.ttxRegNo || "",
        printedDateTime: formatDate(data.invoiceDate) + "/" + (data.invoiceTime || "")
      },
      items: allItems,
      summary: {
        total: data.grandTotalMyr || 0,
        totalBeforeTax: data.baseTaxableAmount || 0,
        serviceTax6: 0.00,
        serviceTax8: data.totalSst8Percent || 0,
        tourismTax: data.totalTourismTax || 0,
        balance: 0.00
      }
    };
  };

  useEffect(() => {
    if (invoiceData) {
      setInvoice(mapApiDataToInvoice(invoiceData));
      setLoading(false);
    }
  }, [invoiceData]);

  useEffect(() => {
    if (isPdfDownload && invoice && invoiceRef.current) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice, navigate]);

  useEffect(() => {
    if (!invoice?.items) return;

    const tx = invoice.items;
    const pages = [];
    const MAX_ROWS = 18; 

    if (tx.length === 0) {
      pages.push({ items: [], showTotals: true });
    } else {
      for (let i = 0; i < tx.length; i += MAX_ROWS) {
        const chunk = tx.slice(i, i + MAX_ROWS);
        const isLastChunk = i + MAX_ROWS >= tx.length;
        pages.push({ items: chunk, showTotals: isLastChunk });
      }
    }

    const totalPages = pages.length;
    pages.forEach((p, idx) => {
      p.pageNo = idx + 1;
      p.totalPages = totalPages;
    });

    setPaginatedData(pages);
  }, [invoice]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
      style.parentNode.removeChild(style);
    });

    try {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      const element = invoiceRef.current;
      const opt = {
        margin: 0,
        filename: `PERDANA_${invoice.meta.invoiceNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 3 },
        html2canvas: {
          scale: 4,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.a4-sheet:last-child'] }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error("❌ PDF Error:", err);
      toast.error("PDF Error");
    } finally {
      headStyles.forEach(style => {
        document.head.appendChild(style);
      });
      setPdfLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <InvoiceTemplate
      loading={loading}
      invoice={invoice}
      pdfLoading={pdfLoading}
      onDownloadPDF={handleDownloadPDF}
      onPrint={() => window.print()}
      onBack={() => navigate("/invoices")}
    >
      <div className="perdana-invoice-wrapper" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; background: #fff; }
            .perdana-invoice-wrapper { padding: 0; }
            .a4-sheet { box-shadow: none; border: none; margin: 0; page-break-after: always; break-after: page; }
            .a4-sheet:last-child { page-break-after: avoid; break-after: avoid; }
          }

          .perdana-invoice-wrapper {
            background-color: transparent;
            min-height: 100vh;
            padding: 40px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            font-family: 'Segoe UI', Arial, sans-serif;
          }

          .a4-sheet {
            background: #fff;
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 12mm;
            box-sizing: border-box;
            color: #1a1a1a;
            position: relative;
            margin-bottom: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
          }

          .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .guest-details { font-size: 11px; line-height: 1.4; width: 45%; }
          .guest-details strong { font-size: 13px; }

          .brand-box { text-align: center; width: 45%; }
          .brand-title { font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 0; }
          .brand-subtitle { font-size: 10px; letter-spacing: 1px; margin-bottom: 10px; }
          .invoice-type { font-size: 16px; font-weight: bold; margin-top: 15px; border-top: 2px solid #000; display: inline-block; padding-top: 5px; }

          .meta-container { display: flex; justify-content: space-between; margin-top: 10px; font-size: 11px; }
          .meta-table { width: 48%; border-collapse: collapse; }
          .meta-table td { padding: 2px 0; }
          .lbl { width: 120px; }

          .einvoice-tag { font-size: 10px; font-weight: bold; color: #555; margin-top: 15px; }

          .main-grid { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px; }
          .main-grid th { border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 10px 5px; text-align: left; }
          .main-grid td { padding: 6px 5px; border-bottom: 1px solid #f0f0f0; }
          .text-right { text-align: right; }

          .bottom-section { display: flex; justify-content: space-between; margin-top: 20px; font-size: 11px; }
          .legal-box { width: 55%; font-size: 9px; line-height: 1.4; font-style: italic; }
          
          .summary-table { width: 40%; border-collapse: collapse; }
          .summary-table td { padding: 3px 0; }
          .total-hr { border-top: 1.5px solid #000; font-weight: bold; }
          .balance-strip { background: #f8f9fa; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; font-weight: bold; padding: 5px 0; }

          .footer-info { margin-top: auto; border-top: 1px solid #ccc; padding-top: 15px; font-size: 9px; color: #666; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig-box { width: 200px; border-top: 1px solid #000; text-align: center; padding-top: 5px; margin-bottom: 10px; }
        `}} />

        {paginatedData.map((page, index) => (
          <div className="a4-sheet" key={index}>
            {/* Header Branding */}
            <div className="header-section">
              <div className="guest-details">
                <strong>{invoice.guest.name}</strong><br />
                {invoice.guest.company}<br />
                {invoice.guest.address}
              </div>
              <div className="brand-box">
                <h1 className="brand-title">PERDANA</h1>
                <div className="brand-subtitle">KUALA LUMPUR CITY CENTRE</div>
                <div className="invoice-type">INTERIM INVOICE</div>
              </div>
            </div>

            {/* Metadata Table */}
            <div className="meta-container">
              <table className="meta-table">
                <tbody>
                  <tr><td className="lbl">Room No.</td><td>: {invoice.meta.roomNo}</td></tr>
                  <tr><td className="lbl">Arrival</td><td>: {invoice.meta.arrival}</td></tr>
                  <tr><td className="lbl">Departure</td><td>: {invoice.meta.departure}</td></tr>
                  <tr><td className="lbl">Page No.</td><td>: {page.pageNo} of {page.totalPages}</td></tr>
                  <tr><td className="lbl">Invoice No.</td><td>: {invoice.meta.invoiceNo}</td></tr>
                </tbody>
              </table>
              <table className="meta-table">
                <tbody>
                  <tr><td className="lbl">Conf. No.</td><td>: {invoice.meta.confNo}</td></tr>
                  <tr><td className="lbl">Cashier No.</td><td>: {invoice.meta.cashierNo}</td></tr>
                  <tr><td className="lbl">SST No.</td><td>: {invoice.meta.sstNo}</td></tr>
                  <tr><td className="lbl">TTX No.</td><td>: {invoice.meta.ttxNo}</td></tr>
                  <tr><td className="lbl">Printed Date / Time</td><td>: {invoice.meta.printedDateTime}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="einvoice-tag">e-Invoice</div>

            {/* Transaction Grid */}
            <table className="main-grid">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Date</th>
                  <th style={{ width: '30%' }}>Description</th>
                  <th style={{ width: '30%' }}>Reference</th>
                  <th className="text-right">Charges (MYR)</th>
                  <th className="text-right">Credits (MYR)</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.date}</td>
                    <td>{item.desc}</td>
                    <td style={{ fontSize: '9px', color: '#555' }}>{item.ref}</td>
                    <td className="text-right">{item.charges ? formatCurrency(item.charges) : ""}</td>
                    <td className="text-right">{item.credits ? formatCurrency(item.credits) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {page.showTotals && (
              <div className="bottom-section">
                <div className="legal-box">
                  I agree that my liability for this bill is not waived and agree to be held personally liable in the event that the indicated person, company or association fails to pay any part of the full amount of these charges.
                </div>

                <table className="summary-table">
                  <tbody>
                    <tr><td>Total Before Taxes</td><td className="text-right">{formatCurrency(invoice.summary.totalBeforeTax)}</td></tr>
                    <tr><td>Service Tax 6%</td><td className="text-right">{formatCurrency(invoice.summary.serviceTax6)}</td></tr>
                    <tr><td>Service Tax 8%</td><td className="text-right">{formatCurrency(invoice.summary.serviceTax8)}</td></tr>
                    <tr><td>Tourism Tax (TTX)</td><td className="text-right">{formatCurrency(invoice.summary.tourismTax)}</td></tr>
                    <tr className="total-hr">
                      <td>Total (MYR)</td>
                      <td className="text-right">{formatCurrency(invoice.summary.total)}</td>
                    </tr>
                    <tr className="balance-strip">
                      <td>Balance</td>
                      <td className="text-right">MYR {formatCurrency(invoice.summary.balance)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="footer-info">
              <div style={{ maxWidth: '60%' }}>
                <strong>PERDANA KUALA LUMPUR CITY CENTRE</strong><br />
                Company Reg No.: 201801002141 (1264154-T)<br />
                No. 10 Jalan Binjai, 50450 Kuala Lumpur, Malaysia<br />
                T: 603 7490 3333 | E: reservations.pklcc@attanahotels.com
              </div>
              <div className="sig-box">
                Guest Signature
              </div>
            </div>
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default PerdanaInvoiceViewPage;