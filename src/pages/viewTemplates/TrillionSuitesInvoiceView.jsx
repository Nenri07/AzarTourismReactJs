import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/trillionsuit-logo.png';

const formatDateShort = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear());
    return `${dd}/${mm}/${yy}`;
  } catch {
    return dateStr;
  }
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr;
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return timeStr;
  }
}

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

const mapApiDataToInvoice = (data) => {
  if (!data) return null;

  const invoiceDate = data.invoiceDate || data.createdAt;

  const allItems = [
    ...(data.accommodationDetails || []).map((item, index) => ({
      id: `acc_${index}`,
      rawDate: parseDateForSort(item.date),
      priority: 2,
      date: formatDateShort(item.date),
      desc: item.description || "Room Charge",
      ref: item.reference || "", 
      charges: item.amount || 0,
      credits: 0
    })),
    ...(data.otherServices || []).map((item, index) => {
      const isCredit = item.amount < 0 || (item.name && item.name.toLowerCase().includes('refund')) || (item.description && item.description.toLowerCase().includes('refund'));
      const isPayment = (item.name && (item.name.toLowerCase().includes('card') || item.name.toLowerCase().includes('cash') || item.name.toLowerCase().includes('ledger') || item.name.toLowerCase().includes('visa') || item.name.toLowerCase().includes('master'))) || 
                       (item.description && (item.description.toLowerCase().includes('card') || item.description.toLowerCase().includes('cash') || item.description.toLowerCase().includes('ledger') || item.description.toLowerCase().includes('visa') || item.description.toLowerCase().includes('master')));

      return {
        id: `ser_${index}`,
        rawDate: parseDateForSort(item.date),
        priority: 1,
        date: formatDateShort(item.date),
        desc: item.description || item.name || "Service",
        ref: item.reference || "", 
        charges: (isPayment || isCredit) ? 0 : Math.abs(item.amount || 0),
        credits: (isPayment || isCredit) ? Math.abs(item.amount || 0) : 0,
        isPaymentOrCredit: (isPayment || isCredit)
      };
    })
  ].sort((a, b) => {
    if (a.rawDate !== b.rawDate) return a.rawDate - b.rawDate;
    return a.priority - b.priority;
  });

  // Filter out payments as per the instructions ("remove these rows at the end of total section")
  const visibleItems = allItems.filter(item => !item.isPaymentOrCredit);

  return {
    guest: {
      name: data.guestName || "",
      company: data.companyName || "",
      phone: data.guestPhone || data.hotelPhone || data.hotel_phone || "",
      email: data.guestEmail || data.hotelEmail || data.hotel_email || "",
      address: data.address || "",
      uuid: data.uuid || ""
    },
    meta: {
      roomNo: data.roomNo || "",
      arrival: formatDateShort(data.arrivalDate),
      departure: formatDateShort(data.departureDate),
      arrivalTime: data.arrival_time || data.arrivalTime || formatTime(data.arrivalDate) || "",
      departureTime: data.departure_time || data.departureTime || formatTime(data.departureDate) || "",
      invoiceNo: data.invoiceNo || "",
      bookingNo: data.confNo || data.bookingNo || "",
      cashierName: data.cashierName || "",
      date: formatDateShort(invoiceDate)
    },
    items: visibleItems,
    summary: {
      subTotal: data.baseTaxableAmount || 0,
      serviceTax8: data.totalSst8Percent || 0,
      serviceTax6: 0.00,
      tourismTax: data.totalTourismTax || 0,
      total: data.grandTotalMyr || 0 
    }
  };
};

const TrillionSuitesInvoiceView = ({ invoiceData }) => {
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
        filename: `TRILLION_SUITES_${invoice.meta.invoiceNo || 'Invoice'}.pdf`,
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
      <div className="ts-invoice-wrapper" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: a4; margin: 0; }
            body { margin: 0 !important; padding: 0 !important; }
            .ts-invoice-wrapper { padding: 0 !important; margin: 0 !important; background: none !important; }
            .letter-sheet { margin: 0 !important; box-shadow: none !important; border: none !important; width: 210mm !important; min-height: 296mm !important; }
            .letter-sheet:not(:last-child) { page-break-after: always !important; }
            .no-print { display: none !important; }
          }

          .ts-invoice-wrapper {
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
            padding: 12mm 2mm 10mm 2mm;
            box-sizing: border-box;
            color: #000;
            font-family: Arial, sans-serif;
            position: relative;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            font-size: 9pt;
          }

          /* Header */
          .ts-header { text-align: center; margin-bottom: 60px; position: relative;}
          .ts-logo { max-width: 160px; height: 40px; margin-bottom: 13px; }
          .ts-header .co-name { font-weight: bold; font-size: 10pt; }
          .ts-header .co-sub { font-size: 10pt; }
          
          .ts-invoice-block { text-align: center; margin-top: 15px; margin-bottom: 15px; }
          .ts-invoice-badge { font-weight: bold; font-size: 12pt; }
          
          .ts-invoice-meta { position: absolute; top: 190px; right: 42px; text-align: left; }
          .ts-inv-no { font-size: 10pt; margin-bottom: 12px; font-weight: bold; }
          .ts-inv-date { font-size: 10pt; }

          /* Guest Info */
          .ts-guest-section { margin: 0px 15px 20px 15px; font-size: 9pt; width: 100%; }
          .ts-guest-top { margin-bottom: 5px; }
          .ts-guest-name-label { margin-bottom: 6px; font-size: 10pt; color: #000; }
          .ts-guest-name-val { font-weight: bold; font-family: "Arial Bold", Arial, sans-serif; font-size: 10pt; text-transform: uppercase; }
          
          .ts-guest-bottom { display: flex; width: 100%; align-items: flex-start; }
          .ts-guest-col-left { width: 53%; }
          .ts-guest-col-mid { width: 47%; }
          
          .ts-g-row { display: flex; margin-bottom: 10px; align-items: flex-start; min-height: 18px; }
          // .ts-g-label { width: 115px; flex-shrink: 0; }
          .ts-g-val { flex: 1; padding-left: 2px;}

          /* Details Grid */
          .ts-details-grid { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 8pt; text-align: center; }
          .ts-details-grid thead { background-color: #f2f2f2; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .ts-details-grid th { padding: 6px 0px; font-weight: normal; color: #444; }
          .ts-details-grid td { padding: 0px 5px;}
          
          /* Main Table */
          .ts-main-table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 15px;}
          .ts-main-table thead { background-color: #f2f2f2; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .ts-main-table th { padding: 6px 0px; text-align: left; color: #444; font-weight: normal; border: none; }
          .ts-main-table td { line-height: 1.5; vertical-align: top; }
          .text-right { text-align: right !important; }
          .text-center { text-align: center !important; }
          
          /* Summary Area */
          .summary-area { align-self: flex-end; width: 35%; margin-right: 20px;}
          .summary-table { width: 100%; border-collapse: collapse; font-size: 8pt;}
        //   .summary-table td { padding: 4px; }
          .summary-table td.s-label { text-align: left; width: 60%; }
          .summary-table td.s-val { text-align: right; width: 40%; }
          .summary-table tr.s-total td { font-weight: bold; font-family: "Arial Bold", Arial, sans-serif; }
        `}} />

        {paginatedData.map((page, index) => (
          <div className="letter-sheet" key={index}>
            <div className="ts-header">
              <center><img src={logo} alt="Trillion Suites" className="ts-logo" /></center>
              <div className="co-name">SLG Bersatu Sdn Bhd (200501003501)</div>
              <div className="co-sub" style={{marginTop: '15px'}}>(SST Reg No: W10-1808-32001849)</div>
              <div className="co-sub">(TTX Reg No: 141-2018-10000029)</div>
              <div className="co-sub">(TIN No: C11787827080)</div>

              <div className="ts-invoice-block">
                <span className="ts-invoice-badge">INVOICE</span>
              </div>
              
              <div className="ts-invoice-meta">
                <div className="ts-inv-no">{invoice.meta.invoiceNo || ''}</div>
                <div className="ts-inv-date">Date: {invoice.meta.date}</div>
              </div>
            </div>

            <div className="ts-guest-section">
              <div className="ts-guest-top">
                <div className="ts-guest-name-label">Guest Name</div>
                <div className="ts-guest-name-val">{invoice.guest.name}</div>
              </div>
              
              <div className="ts-guest-bottom">
                <div className="ts-guest-col-left">
                  <div className="ts-g-row" style={{ visibility: 'hidden'}}>
                    <div className="ts-g-label">Placeholder</div>
                  </div>
                  <div className="ts-g-row">
                    <div className="ts-g-label">Company Name :</div>
                    <div className="ts-g-val">{invoice.guest.company}</div>
                  </div>
                  <div className="ts-g-row">
                    <div className="ts-g-label">Address :</div>
                    <div className="ts-g-val">{invoice.guest.address}</div>
                  </div>
                </div>
                
                <div className="ts-guest-col-mid">
                  <div className="ts-g-row">
                    <div className="ts-g-label">UUID :</div>
                    <div className="ts-g-val">{invoice.guest.uuid || ""}</div>
                  </div>
                  <div className="ts-g-row">
                    <div className="ts-g-label">Phone :</div>
                    <div className="ts-g-val">{invoice.guest.phone || ""}</div>
                  </div>
                  <div className="ts-g-row">
                    <div className="ts-g-label">Email :</div>
                    <div className="ts-g-val">{invoice.guest.email || ""}</div>
                  </div>
                </div>
              </div>
            </div>

            <table className="ts-details-grid">
              <thead>
                <tr>
                  <th style={{width: '125px'}}>Arrival Date</th>
                  <th style={{width: '130px'}}>Departure Date</th>
                  <th>Room No.</th>
                  <th>Booking No.</th>
                  <th style={{paddingLeft: '15px', paddingRight: '30px'}}>Cashier Name</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{letterSpacing: '0.7px'}}>{invoice.meta.arrival}</td>
                  <td style={{letterSpacing: '0.7px'}}>{invoice.meta.departure}</td>
                  <td rowSpan="2">{invoice.meta.roomNo}</td>
                  <td rowSpan="2">{invoice.meta.bookingNo}</td>
                  <td rowSpan="2">{invoice.meta.cashierName}</td>
                </tr>
                <tr>
                   <td>{invoice.meta.arrivalTime}</td>
                   <td>{invoice.meta.departureTime}</td>
                </tr>
              </tbody>
            </table>

            <table className="ts-main-table">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '20%', paddingLeft: '10px' }}>Date</th>
                  <th className="text-center" style={{ width: '42%' }}>Description</th>
                  <th className="text-center" style={{ width: '28%', paddingLeft: '30px' }}>Ref No.</th>
                  <th className="text-left" style={{ width: '10%', paddingRight: '0px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center' }}>{item.date}</td>
                    <td>{item.desc}</td>
                    <td className="text-center" style={{ paddingLeft: '30px' }}>{item.ref}</td>
                    <td className="text-right" style={{ paddingRight: '20px' }}>{item.charges ? formatCurrency(item.charges) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {page.isLast && (
               <div className="summary-area">
                  <table className="summary-table">
                    <tbody>
                      <tr>
                        <td className="s-label">Sub Total</td>
                        <td className="s-val">{formatCurrency(invoice.summary.subTotal)}</td>
                      </tr>
                      <tr>
                        <td className="s-label">SST8 (8%)</td>
                        <td className="s-val">{formatCurrency(invoice.summary.serviceTax8)}</td>
                      </tr>
                      <tr>
                        <td className="s-label">SST6 (6%)</td>
                        <td className="s-val">{formatCurrency(invoice.summary.serviceTax6)}</td>
                      </tr>
                      <tr>
                        <td className="s-label">Tourism Tax</td>
                        <td className="s-val">{formatCurrency(invoice.summary.tourismTax)}</td>
                      </tr>
                      <tr className="s-total">
                        <td className="s-label">TOTAL</td>
                        <td className="s-val">{formatCurrency(invoice.summary.total)}</td>
                      </tr>
                    </tbody>
                  </table>
               </div>
            )}

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default TrillionSuitesInvoiceView;
