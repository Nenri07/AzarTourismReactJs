import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/pullman-logo.png';
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

const PullmanInvoiceViewPage = ({ invoiceData }) => {
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

    // Separate accommodation and other services
    const accommodationItems = (data.accommodationDetails || []).map((item, index) => ({
      id: `acc_${index}`,
      type: 'acc',
      rawDate: parseDateForSort(item.date),
      date: formatDate(item.date),
      desc: item.description || "Room Charge",
      ref: item.reference || "",
      debit: item.amount,
      credit: ""
    }));

    const serviceItems = (data.otherServices || []).map((item, index) => ({
      id: `ser_${index}`,
      type: 'ser',
      rawDate: parseDateForSort(item.date),
      date: formatDate(item.date),
      desc: item.description,
      ref: item.reference || "",
      debit: item.amount,
      credit: ""
    }));

    // Check for payments/deposits to show as credits
    const paymentItems = [];
    if (data.status === 'paid' || data.balance_usd === 0) {
       // Logic to show a balancing credit if applicable, like in the screenshot "OpN"
    }

    const allItems = [...accommodationItems, ...serviceItems, ...paymentItems].sort((a, b) => {
      if (a.rawDate !== b.rawDate) return a.rawDate - b.rawDate;
      const priorities = { ser: 0, acc: 1, pay: 2 };
      return priorities[a.type] - priorities[b.type];
    });

    return {
      guest: {
        company: data.companyName || "AZAR TOURISM & SERVICES",
        addressLines: [
          "Algeria Square Building",
          "Number 12 First Floor",
          "Libyan Arab Jamahiriya"
        ],
        guestName: data.guestName,
        arNumber: data.arNumber
      },
      meta: {
        title: "COPY OF INVOICE",
        date: formatDate(data.invoiceDate) + " / " + (data.invoiceTime),
        membershipNo: data.membershipNo,
        arrival: formatDate(data.arrivalDate),
        departure: formatDate(data.departureDate),
        roomNo: data.roomNo,
        persons: `Adults ${data.paxAdult || 0} / Child ${data.paxChild || 0}`,
        invoiceNo: data.invoiceNo,
        folioNo: data.folioNo,
        confNo: data.confNo,
        pageNo: "1 of 1", // Updated in pagination
        cashierNo: data.cashierId,
        nationality: data.nationality
      },
      items: allItems,
      summary: {
        taxable: data.baseTaxableAmount || 0,
        nonTaxable: 0.00,
        st6: 0.00,
        st8: data.totalSst8Percent || 0,
        tourismTax: data.totalTourismTax || 0,
        totalWithTaxes: data.grandTotalMyr || 0,
        balanceDue: 0.00, // Assuming paid/balanced for this view like in screenshot
        balanceUsd: data.balanceUsd
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
    const MAX_ROWS = 15; 

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
        filename: `PULLMAN_${invoice.meta.invoiceNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 3 },
        html2canvas: {
          scale: 4,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
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
      <div className="pullman-invoice-wrapper" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0 !important; padding: 0 !important; background: #fff; color: #000; !important; }
            .pullman-invoice-wrapper { padding: 0 !important; margin: 0 !important; height: auto !important; background: none !important; }
            .a4-page { margin: 0 !important; box-shadow: none !important; border: none !important; width: 210mm !important; height: 296mm !important; overflow: hidden !important; }
            .a4-page:not(:last-child) { page-break-after: always !important; }
            .no-print { display: none !important; }
          }

          .pullman-invoice-wrapper {
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            font-family: "Arial", sans-serif;
          }

          .pullman-invoice-wrapper * {
            box-sizing: border-box;
          }

          .a4-page {
            background: #fff;
            width: 210mm;
            height: 296mm;
            overflow: hidden;
            padding: 8mm 12mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            position: relative;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            font-size: 9pt;
          }

          .header-main {
            display: flex;
            justify-content: center;
            margin-top: 40px;
            margin-bottom: 35px;
            position: relative;
          }

          .pullman-logo-img {
            width: 200px;
          }

          .all-logo-section {
            position: absolute;
            right: 50px;
            top: 5px;
            text-align: right;
            font-size: 6pt;
            letter-spacing: 0.5px;
            font-weight: bold;
          }

          .all-logo-top {
            font-size: 8pt;
            font-weight: normal;
            margin-bottom: 10px;
          }

          .info-block {
            display: flex;
            justify-content: center;
            gap: 145px;
            font-size: 9pt;
            margin-bottom: 15px;
          }

          .guest-info {
            width: 50%;
            line-height: 1.2;
            margin-top: 30px;
          }

          .meta-info {
            width: 42%;
          }

          .meta-title {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 4px;
          }

          .meta-row {
            display: flex;
            line-height: 1.2;
            margin-bottom: 1px;
          }

          .meta-label { width: 100px; }
          .meta-colon { width: 12px; }
          .meta-value { flex: 1; }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          .items-table tbody tr:first-child td {
            padding-top: 10px;
          }

          .items-table thead {
            border: 1px solid #000;
          }

          .items-table th {
            border: none;
            padding: 2px 2px;
            line-height: 1.6;
            text-align: left;
            font-weight: bold;
          }

          .items-table td {
            padding: 0px 2px;
            line-height: 1.25;
            vertical-align: top;
          }
          
          .text-right { text-align: right; }

          .balance-due-row {
            border-top: 1pt solid #000;
            border-bottom: 1pt solid #000;
            font-weight: bold;
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
            padding: 3px 8px 2px 0px;
            line-height: 1.6;
            font-size: 9pt;
          }

          .balance-label { margin-right: 85px; }

          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin: 15px 8px 0px 0px;
            font-size: 9pt;
          }

          .summary-table { width: 300px}
          .summary-row { display: flex; justify-content: space-between;  margin-bottom: 2px; text-align: right; padding-left: 22px; line-height: 1.5; }
          .summary-row span{ width: 200px;}
          .summary-row.total { font-weight: bold; margin-top: 2px; }

          .legal-signature-section {
            margin-top: 30px;
            display: flex;
            justify-content: end;
            gap: 110px;
            font-size: 8pt;
            line-height: 1.3;
          }

          // .legal-text { width: 48%; text-align: justify;}
          .signature-area { width: 30%; text-align: center; margin-top: 35px; font-size: 8.5pt; margin-right: 40px;}
          .sig-line { border-top: 0.5pt solid #000; margin-bottom: 4px; }

          .footer-section {
            margin-top: auto;
            text-align: center;
            font-size: 7pt;
            color: #333;
            border-top: 0.5pt solid #eee;
            padding-top: 10px;
          }

          .footer-bold {
            font-weight: bold;
            font-size: 8pt;
            color: #000;
            margin-bottom: 2px;
          }
        `}} />

        {paginatedData.map((page, index) => (
          <div className="a4-page" key={index}>
            <div className="header-main">
              <img src={logo} alt="Pullman" className="pullman-logo-img" />
              {/* <div className="all-logo-section">
                <div className="all-logo-top">MEMBER OF ALL</div>
                <div style={{textAlign: 'center'}}>THE LIMITLESS</div>
                <div style={{textAlign: 'center'}}>HOTEL LOYALTY PROGRAMME</div>
              </div> */}
            </div>

            <div className="info-block">
              <div className="guest-info">
                <div style={{textTransform: 'uppercase' }}>{invoice.guest.company}</div>
                {invoice.guest.addressLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                <div style={{ marginTop: '12px' }}>{invoice.guest.guestName}</div>
                <div style={{ marginTop: '8px' }}>AR Number: {invoice.guest.arNumber}</div>
              </div>
              
              <div className="meta-info">
                <div className="meta-title">COPY OF INVOICE</div>
                <div className="meta-row"><div className="meta-label">Date</div><div className="meta-colon">:</div><div className="meta-value">{invoice.meta.date}</div></div>
                <div className="meta-row"><div className="meta-label">Membership</div><div className="meta-colon">:</div><div className="meta-value">{invoice.meta.membershipNo}</div></div>
                <div className="meta-row"><div className="meta-label">Arrival</div><div className="meta-colon">:</div><div className="meta-value">{invoice.meta.arrival}</div></div>
                <div className="meta-row"><div className="meta-label">Departure</div><div className="meta-colon">:</div><div className="meta-value">{invoice.meta.departure}</div></div>
                <div className="meta-row"><div className="meta-label">Room No.</div><div className="meta-colon">:</div><div className="meta-value">{invoice.meta.roomNo}</div></div>
                <div className="meta-row"><div className="meta-label">No. Person</div><div className="meta-colon">:</div><div className="meta-value">{invoice.meta.persons}</div></div>
                <div className="meta-row"><div className="meta-label">Invoice No.</div><div className="meta-colon">:</div><div className="meta-value">{invoice.meta.invoiceNo}</div></div>
                <div className="meta-row"><div className="meta-label">Folio No.</div><div className="meta-colon">:</div><div className="meta-value">{invoice.meta.folioNo}</div></div>
                <div className="meta-row"><div className="meta-label">Conf. No.</div><div className="meta-colon">:</div><div className="meta-value">{invoice.meta.confNo}</div></div>
                <div className="meta-row"><div className="meta-label">Page No.</div><div className="meta-colon">:</div><div className="meta-value">{page.pageNo} of {page.totalPages}</div></div>
                <div className="meta-row"><div className="meta-label">Cashier No.</div><div className="meta-colon">:</div><div className="meta-value">{invoice.meta.cashierNo}</div></div>
                <div className="meta-row"><div className="meta-label">Nationality</div><div className="meta-colon">:</div><div className="meta-value">{invoice.meta.nationality}</div></div>
              </div>
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '12%', paddingLeft: '10px' }}>DATE</th>
                  <th style={{ width: '26%' }}>DESCRIPTION</th>
                  <th style={{ width: '26%' }}>REFERENCE</th>
                  <th className="text-right" style={{ width: '14%', textAlign: 'right' }}>DEBIT</th>
                  <th className="text-right" style={{ width: '20%', textAlign: 'right', paddingRight: '10px' }}>CREDIT</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{paddingLeft: '10px'}}>{item.date}</td>
                    <td>{item.desc}</td>
                    <td>{item.ref}</td>
                    <td className="text-right">{item.debit ? formatCurrency(item.debit) : ""}</td>
                    <td className="text-right" style={{paddingRight: '10px'}}>{item.credit ? formatCurrency(item.credit) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {page.showTotals && (
              <>
                <div className="balance-due-row">
                  <div className="balance-label">Balance Due</div>
                  <div>MYR {formatCurrency(invoice.summary.balanceDue)}</div>
                </div>

                <div className="summary-section">
                  <div className="summary-table">
                    <div className="summary-row"><span>Total Taxable Charges</span><span>{formatCurrency(invoice.summary.taxable)}</span></div>
                    <div className="summary-row"><span>Non-Taxable Charges</span><span>{formatCurrency(invoice.summary.nonTaxable)}</span></div>
                    <div className="summary-row"><span>ST 6%</span><span>{formatCurrency(invoice.summary.st6)}</span></div>
                    <div className="summary-row"><span>ST 8%</span><span>{formatCurrency(invoice.summary.st8)}</span></div>
                    <div className="summary-row"><span>Tourism Tax</span><span>{formatCurrency(invoice.summary.tourismTax)}</span></div>
                    <div className="summary-row"><span>Total Charges with Taxes</span><span>{formatCurrency(invoice.summary.totalWithTaxes)}</span></div>
                    <div className="summary-row"><span>Total Amount USD</span><span>{formatCurrency(invoice.summary.balanceUsd)}</span></div>
                  </div>
                </div>

                <div className="legal-signature-section">
                  {/* <div className="legal-text">
                    I agree that my liability for this bill is not waived and agree to be held personally liable in the event that the indicated person, company, or association fails to pay for any part or the full amount of these charges.
                  </div> */}
                  <div className="signature-area">
                    <div className="sig-line"></div>
                    <div>Guest Signature</div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default PullmanInvoiceViewPage;