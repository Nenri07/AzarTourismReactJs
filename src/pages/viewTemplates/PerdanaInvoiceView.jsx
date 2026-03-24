import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/perdana-logo.png';

const formatDateShort = (dateStr) => {
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

// ─────────────────────────────────────────────────────────────────────────────
// DATA MAPPING LOGIC
// ─────────────────────────────────────────────────────────────────────────────
const mapApiDataToInvoice = (data) => {
  if (!data) return null;

  /* 
     Sort logic: 
     1. Primary sort by rawDate (chronological)
     2. Secondary sort by type: show services/payments (type 1) BEFORE room charges (type 2)
  */
  const allItems = [
    ...(data.accommodationDetails || []).map((item, index) => ({
      id: `acc_${index}`,
      rawDate: parseDateForSort(item.date),
      priority: 2, // Room charges come second on the same date
      date: formatDateShort(item.date),
      desc: item.description || "Room Charges",
      ref: item.reference || "",
      charges: item.amount || 0,
      credits: 0
    })),
    ...(data.otherServices || []).map((item, index) => {
      const isCredit = item.amount < 0 || (item.name && item.name.toLowerCase().includes('refund')) || (item.description && item.description.toLowerCase().includes('refund'));
      const isPayment = (item.name && (item.name.toLowerCase().includes('card') || item.name.toLowerCase().includes('cash'))) || 
                       (item.description && (item.description.toLowerCase().includes('card') || item.description.toLowerCase().includes('cash')));

      return {
        id: `ser_${index}`,
        rawDate: parseDateForSort(item.date),
        priority: 1, // Services/Payments come first on the same date
        date: formatDateShort(item.date),
        desc: item.description || item.name || "Service",
        ref: item.reference || "",
        charges: (isPayment || isCredit) ? 0 : Math.abs(item.amount || 0),
        credits: (isPayment || isCredit) ? Math.abs(item.amount || 0) : 0
      };
    })
  ].sort((a, b) => {
    if (a.rawDate !== b.rawDate) return a.rawDate - b.rawDate;
    return a.priority - b.priority;
  });

  const totalCharges = allItems.reduce((sum, item) => sum + (item.charges || 0), 0);
  const totalCredits = allItems.reduce((sum, item) => sum + (item.credits || 0), 0);

  return {
    guest: {
      name: data.guestName || "",
      company: data.companyName || "",
      /* Requested hardcoded address with line breaks for split */
      address: "Algeria Square Building\nNumber 12 First Floor, Tripoli\nLibyan Arab Jamahiriya"
    },
    meta: {
      roomNo: data.roomNo || "",
      arrival: formatDateShort(data.arrivalDate),
      departure: formatDateShort(data.departureDate),
      invoiceNo: data.invoiceNo || "",
      confNo: data.confNo || "",
      cashierNo: data.cashierName || "",
      sstNo: data.sstRegNo || "",
      ttxNo: data.ttxRegNo || "",
      printedDateTime: formatDateShort(data.invoiceDate) + " / " + (data.invoiceTime || "")
    },
    items: allItems,
    summary: {
      totalCharges,
      totalCredits,
      totalBeforeTax: data.baseTaxableAmount || 0,
      serviceTax6: 0.00,
      serviceTax8: data.totalSst8Percent || 0,
      tourismTax: data.totalTourismTax || 0,
      balance: data.balanceMyr || 0, // Ensuring MYR balance
      balanceUsd: data.balanceUsd
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const PerdanaInvoiceViewPage = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

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
  }, [isPdfDownload, invoice]);

  useEffect(() => {
    if (!invoice?.items) return;

    const transactions = invoice.items;
    const totalTx = transactions.length;
    const pages = [];

    const CHUNK_SIZE = 26; 

    if (totalTx > CHUNK_SIZE) {
      for (let i = 0; i < totalTx; i += CHUNK_SIZE) {
        pages.push({
          items: transactions.slice(i, i + CHUNK_SIZE),
          pageNum: pages.length + 1,
          isLast: i + CHUNK_SIZE >= totalTx
        });
      }
    } else if (totalTx >= 22) {
      pages.push({ items: transactions, pageNum: 1, isLast: false });
      pages.push({ items: [], pageNum: 2, isLast: true });
    } else {
      pages.push({ items: transactions, pageNum: 1, isLast: true });
    }
    
    if (pages.length === 0) {
      pages.push({ items: [], pageNum: 1, isLast: true });
    }
    
    const totalPages = pages.length;
    pages.forEach(p => p.totalPages = totalPages);
    
    setPaginatedData(pages);
  }, [invoice]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
      if (style.parentNode) style.parentNode.removeChild(style);
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
        pagebreak: { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("❌ PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      headStyles.forEach(style => document.head.appendChild(style));
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (!invoice) return null;

  return (
    <InvoiceTemplate
      loading={loading}
      invoice={invoice}
      pdfLoading={pdfLoading}
      onDownloadPDF={handleDownloadPDF}
      onPrint={handlePrint}
      onBack={() => navigate("/invoices")}
    >
      <div className="perdana-invoice-wrapper" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: a4; margin: 0; }
            body { margin: 0 !important; padding: 0 !important; }
            .perdana-invoice-wrapper { padding: 0 !important; margin: 0 !important; background: none !important; }
            .letter-sheet { margin: 0 !important; box-shadow: none !important; border: none !important; width: 210mm !important; min-height: 296mm !important; }
            .letter-sheet:not(:last-child) { page-break-after: always !important; }
            .no-print { display: none !important; }
            .no-print { display: none !important; }
          }

          .perdana-invoice-wrapper {
            background-color: #fff;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .letter-sheet {
            background: #fff;
            width: 210mm;
            min-height: 296mm;
            padding: 10mm 10mm 2mm 10mm;
            box-sizing: border-box;
            color: #000;
            font-family: Arial, sans-serif;
            position: relative;
            // margin: 0 auto 20px auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
          }

          .letter-sheet * {
            font-size: 9pt;
            line-height: 1.05;
          }

          /* Header Styling */
          .p-header { position: relative; width: 100%; height: 120px; }
          .p-logo { width: 123px; position: absolute; left: 50%; transform: translateX(-50%); top: -10px; }

          /* Top Info Blocks */
          .info-flex { display: flex; justify-content: space-between; margin-top: 15px; }
          
          .guest-block { width: 50%; font-family: "Arial Bold", Arial, sans-serif; font-weight: bold; }
          .guest-block strong { font-size: 9pt; }
          
          .meta-block { width: 45%; display: flex; flex-direction: column; align-items: flex-start; margin-left: 130px; pl-40px; }
          .meta-title { font-weight: bold; font-family: "Arial Bold", Arial, sans-serif; margin-bottom: 10px; font-size: 10pt; }
          .meta-table { width: 100%; border-collapse: collapse; }
          .meta-table td { padding: 0.8px 0; border: none; vertical-align: top; }
          .m-lbl { width: 132px; }
          .m-sep { width: 10px; text-align: center; }

          /* Sub Info */
          .sub-info-table { margin-bottom: 10px; border-collapse: collapse; }
          .sub-info-table td { padding: 1px 0; vertical-align: top; }

          /* Main Grid */
          .p-main-table { width: 100%; border-collapse: collapse; position: relative; }
          .p-main-table thead {border: 1px solid #000; background-color: #f2efef; -webkit-print-color-adjust: exact; print-color-adjust: exact;}
          .p-main-table th { font-family: "Arial Bold", Arial, sans-serif; font-weight: bold; padding: 6px 0; text-align: left; }
          .p-main-table td { padding: 4px 0; }
          .text-right { text-align: right !important; }

          /* Totals Row inside Table (For MYR charges/credits totals) */
          .total-separator-row td { border-top: 1.5px solid #000; padding-top: 6px; font-weight: bold; font-family: "Arial Bold", Arial, sans-serif; }

          /* Summary Box at the Bottom Right */
          .summary-area { align-self: flex-end; width: 60%; }
          .summary-table { width: 100%; border-collapse: collapse; }
          .summary-table td { padding: 3px 0; }
          .summary-table td:nth-child(1) { text-align: right; font-weight: bold; font-family: "Arial Bold", Arial, sans-serif; padding-right: 8px; width: 20%; }
          .summary-table td:nth-child(2) { text-align: right; width: 13%; font-family: Arial, sans-serif; padding-right: 8px }
          .summary-table td:nth-child(3) { text-align: right; width: 11%; }
          
          .balance-row { background-color: #e0e0e0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          /* Footer Sections */
          .legal-note { width: 66%; margin-top: 40px; text-align: justify; line-height: 1.2; padding-left: 5px; font-size: 7.8pt !important }

          .sig-box { width: 235px; align-self: flex-end; text-align: center; margin-top: 12px}
          .sig-line { border-top: 1px solid #000; padding-top: 3px; }

          .p-footer { margin-top: auto; padding-top: 15px; text-align: center; }
          .p-footer strong { font-weight: bold; font-family: "Arial Bold", Arial, sans-serif; font-size: 7.5pt !important; }
          .p-footer span { font-size: 7.5pt !important; }
        `}} />

        {paginatedData.map((page, index) => (
          <div className="letter-sheet" key={index}>
            <div className="p-header">
              <img src={logo} alt="Perdana" className="p-logo" />
            </div>

            <div className="info-flex">
              <div className="guest-block">
                <strong>{invoice.guest.name}</strong><br />
                {invoice.guest.company && <strong>{invoice.guest.company}<br /></strong>}
                {invoice.guest.address.split('\n').map((line, idx, arr) => (
                  <React.Fragment key={idx}>
                    <strong>{line}</strong>
                    {idx < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              <div className="meta-block">
                <div className="meta-title">INTERIM INVOICE</div>
                <table className="meta-table">
                  <tbody>
                    <tr><td className="m-lbl">Room No.</td><td className="m-sep">:</td><td>{invoice.meta.roomNo}</td></tr>
                    <tr><td className="m-lbl">Arrival</td><td className="m-sep">:</td><td>{invoice.meta.arrival}</td></tr>
                    <tr><td className="m-lbl">Departure</td><td className="m-sep">:</td><td>{invoice.meta.departure}</td></tr>
                    <tr><td className="m-lbl">Page No.</td><td className="m-sep">:</td><td>{page.pageNum} of {page.totalPages}</td></tr>
                    <tr><td className="m-lbl">Invoice No.</td><td className="m-sep">:</td><td>{invoice.meta.invoiceNo}</td></tr>
                    <tr><td className="m-lbl">Conf. No.</td><td className="m-sep">:</td><td>{invoice.meta.confNo}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <table className="sub-info-table" style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '105px' }}>Company Name</td>
                  <td style={{ width: '15px', textAlign: 'center' }}>:</td>
                  <td style={{ width: '319px' }}>{invoice.guest.company}</td>
                  <td style={{ width: '70px' }}>SST No</td>
                  <td style={{ width: '15px', textAlign: 'center' }}>:</td>
                  <td>{invoice.meta.sstNo}</td>
                </tr>
                <tr>
                  <td>Travel Agent</td>
                  <td style={{ textAlign: 'center' }}>:</td>
                  <td></td>
                  <td>TTX No</td>
                  <td style={{ textAlign: 'center' }}>:</td>
                  <td>{invoice.meta.ttxNo}</td>
                </tr>
                <tr>
                  <td>Guest Name</td>
                  <td style={{ textAlign: 'center' }}>:</td>
                  <td>{invoice.guest.name}</td>
                  <td style={{ width: '130px' }}>Printed Date / Time</td>
                  <td style={{ textAlign: 'center' }}>:</td>
                  <td>{invoice.meta.printedDateTime}</td>
                </tr>
              </tbody>
            </table>

            <table className="p-main-table">
              <thead>
                <tr>
                  <th style={{ width: '12.5%', paddingLeft: '10px' }}>Date</th>
                  <th style={{ width: '27.5%' }}>Description</th>
                  <th style={{ width: '31%' }}>Reference</th>
                  <th className="text-right" style={{ width: '13%' }}>Charges (MYR)</th>
                  <th className="text-right" style={{ width: '16%', paddingRight: '10px' }}>Credits (MYR)</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{paddingLeft: '10px'}}>{item.date}</td>
                    <td>{item.desc}</td>
                    <td>{item.ref}</td>
                    <td className="text-right">{item.charges ? formatCurrency(item.charges) : ""}</td>
                    <td className="text-right" style={{paddingRight: '10px'}}>{item.credits ? formatCurrency(item.credits) : ""}</td>
                  </tr>
                ))}
                
                <tr style={{ height: '5px' }}><td colSpan="5"></td></tr>

                {page.isLast && (
                  <tr className="total-separator-row">
                    <td></td>
                    <td></td>
                    <td className="text-right" style={{ paddingRight: '35px' }}>Total (MYR)</td>
                    <td className="text-right">{formatCurrency(invoice.summary.totalCharges)}</td>
                    <td className="text-right" style={{paddingRight: '10px'}}>{formatCurrency(invoice.summary.totalCredits)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {page.isLast && (
              <>
                <div className="summary-area">
                  <table className="summary-table">
                    <tbody>
                      <tr>
                        <td>Total Before Taxes</td>
                        <td>{formatCurrency(invoice.summary.totalBeforeTax)}</td>
                        <td style={{paddingRight: '10px'}}>MYR</td>
                      </tr>
                      <tr>
                        <td>Service Tax 6%</td>
                        <td>{formatCurrency(invoice.summary.serviceTax6)}</td>
                        <td style={{paddingRight: '10px'}}>MYR</td>
                      </tr>
                      <tr>
                        <td>Service Tax 8%</td>
                        <td>{formatCurrency(invoice.summary.serviceTax8)}</td>
                        <td style={{paddingRight: '10px'}}>MYR</td>
                      </tr>
                      <tr>
                        <td>Tourism Tax (TTX)</td>
                        <td>{formatCurrency(invoice.summary.tourismTax)}</td>
                        <td style={{paddingRight: '10px'}}>MYR</td>
                      </tr>
                      <tr>
                        <td>Total Amount USD</td>
                        <td>{formatCurrency(invoice.summary.balanceUsd)}</td>
                        <td style={{paddingRight: '10px'}}>USD</td>
                      </tr>
                      <tr className="balance-row">
                        <td>Balance</td>
                        <td>{formatCurrency(invoice.summary.balance)}</td>
                        <td style={{paddingRight: '10px'}}>MYR</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="legal-note">
                  I agree that my liability for this bill is not waived and agree to be held personally liable in the event that
                   the indicated person, company or association fails to pay any part of the full amount of these charges.
                </div>

                <div className="sig-box">
                  <div className="sig-line">Guest Signature</div>
                </div>
              </>
            )}

            <div className="p-footer">
              <strong>PERDANA KUALA LUMPUR CITY CENTRE</strong><br />
              <span>Company Reg No.: 201801002141 (1264154-T)</span><br />
              <span>No. 10 Jalan Binjai, 50450 Kuala Lumpur, Malaysia</span><br />
              <span>T: 603 7490 3333 | F: 603 74903388 | E: reservations.pklcc@attanahotels.com | W: perdana.attanahotels.com</span>
            </div>
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default PerdanaInvoiceViewPage;