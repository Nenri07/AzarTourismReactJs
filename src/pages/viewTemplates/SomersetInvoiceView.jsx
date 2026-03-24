import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";

// Try to load somerset logo if it exists, otherwise use a generic placeholder or standard src
import logo from '/somerset-logo.png';

const formatDateSomerset = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mm = months[d.getMonth()];
    const yyyy = d.getFullYear();
    return `${dd} ${mm} ${yyyy}`;
  } catch {
    return dateStr;
  }
};

const formatDateShortSomerset = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mm = months[d.getMonth()];
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
  } catch {
    return dateStr;
  }
};

const formatTimeSomerset = (timeStr) => {
  if (!timeStr) return "";
  return timeStr.substring(0, 5); // Return only HH:MM
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
      priority: 2,
      date: formatDateSomerset(item.date),
      shortDate: formatDateShortSomerset(item.date),
      room: data.roomNo || "",
      desc: item.description || "Daily Apartment Rental (SR)",
      amount: item.amount || 0
    })),
    ...(data.otherServices || []).map((item, index) => {
      const isCredit = item.amount < 0 || (item.name && item.name.toLowerCase().includes('refund')) || (item.description && item.description.toLowerCase().includes('refund'));
      const isPayment = (item.name && (item.name.toLowerCase().includes('card') || item.name.toLowerCase().includes('cash'))) || 
                       (item.description && (item.description.toLowerCase().includes('card') || item.description.toLowerCase().includes('cash')));
      
      let finalAmount = item.amount;
      if (isPayment || isCredit) {
         finalAmount = -Math.abs(item.amount || 0);
      } else {
         finalAmount = Math.abs(item.amount || 0);
      }

      return {
        id: `ser_${index}`,
        rawDate: parseDateForSort(item.date),
        priority: 1,
        date: formatDateSomerset(item.date),
        shortDate: formatDateShortSomerset(item.date),
        room: data.roomNo || "",
        desc: item.description || item.name || "Service",
        amount: finalAmount
      };
    })
  ].sort((a, b) => {
    if (a.rawDate !== b.rawDate) return a.rawDate - b.rawDate;
    return a.priority - b.priority;
  });

  // Consolidate values
  const totalAmount = allItems.filter(i => i.amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const paymentAmount = allItems.filter(i => i.amount < 0).reduce((sum, item) => sum + item.amount, 0);

  return {
    guest: {
      name: data.guestName || "",
      company: data.companyName || "",
      address: "Algeria Square Building Number 12 First Floor\nTripoli\nLibya",
      attention: "",
    },
    meta: {
      roomNo: data.roomNo || "",
      roomType: data.roomType || data.room_type || "",
      arrival: formatDateSomerset(data.arrivalDate),
      departure: formatDateSomerset(data.departureDate),
      reservation: data.confNo || "",
      regnNo: data.companyRegNo || data.company_reg_no || "",
      sstNo: data.sstRegNo || data.sst_reg_no || "",
      ttxNo: data.ttxRegNo || data.ttx_reg_no || "",
      invoiceNo: data.invoiceNo || "",
      arNo: data.arNumber || "",
      poRefNo: data.poNo || "",
      thirdPartyNo: data.thirdPartyNo || data.third_party_no || "",
      printedDateTime: formatDateSomerset(data.invoiceDate) + " " + formatTimeSomerset(data.invoiceTime),
      cashier: data.cashierName || data.cashier_name || data.cashierId || ""
    },
    items: allItems,
    summary: {
      subTotalBeforeSST: data.baseTaxableAmount || 0,
      serviceTax8: data.totalSst8Percent || 0,
      tourismTax: data.totalTourismTax || 0,
      totalAmount: totalAmount,
      payment: paymentAmount,
      balance: data.balanceMyr || 0,
      balanceUsd: data.balanceUsd
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const SomersetInvoiceViewPage = ({ invoiceData }) => {
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
        filename: `SOMERSET_${invoice.meta.invoiceNo || 'Invoice'}.pdf`,
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
      <div className="somerset-invoice-wrapper" ref={invoiceRef}>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: a4; margin: 0; }
            body { margin: 0 !important; padding: 0 !important; }
            .somerset-invoice-wrapper { padding: 0 !important; margin: 0 !important; background: none !important; }
            .letter-sheet { margin: 0 !important; box-shadow: none !important; border: none !important; width: 210mm !important; min-height: 296mm !important; }
            .letter-sheet:not(:last-child) { page-break-after: always !important; }
            .no-print { display: none !important; }
          }

          .somerset-invoice-wrapper {
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
            padding: 13mm 16mm;
            box-sizing: border-box;
            color: #000;
            font-family: Arial, sans-serif;
            position: relative;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            font-size: 8.5pt;
          }

          .letter-sheet * {
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.25;
          }

          /* Header Styling */
          .s-header-logo { width: 100%; display: flex; justify-content: center; align-items: center; text-align: center; margin-bottom: 45px; margin-top: 30px;}
          .s-logo-img { width: 120px; }
          .s-title { text-align: center; font-weight: bold; font-size: 13pt; font-family: "Arial Bold", Arial, sans-serif; margin-bottom: 25px; letter-spacing: 0.5px; }

          /* Two-column layout */
          .s-info-row { display: flex; justify-content: space-between; gap: 160px; margin-bottom: 35px; }
          .s-col-left { width: 48%; }
          .s-col-right { width: 45%; }
          
          .s-info-grid { display: grid; grid-template-columns: 105px 1fr; row-gap: 2px; }
          .s-label { font-weight: bold; font-family: "Arial Bold", Arial, sans-serif; }
          .s-val { display: flex; width: 120px; white-space: nowrap;}
          .s-val-sep { margin-right: 5px; }

          /* Main Auto-width Table Layout */
          .s-table-container { width: 100%; }
          .s-main-table { width: 100%; border-collapse: collapse; }
          .s-main-table thead th { 
            font-weight: bold; 
            font-family: "Arial Bold", Arial, sans-serif; 
            padding: 6px 3px; 
            text-align: left; 
            border: 1px solid #000;
            border-bottom: 2px solid #000;
            text-transform: uppercase;
            font-size: 8.5pt;
          }
          .s-main-table th.col-amount, .s-main-table td.col-amount { text-align: right; }
          .s-main-table td { padding: 1.5px 2px; font-size: 8.5pt; vertical-align: top;}
          .s-main-table tbody tr:first-child td { padding-top: 6px !important; }
          .col-date { width: 14%; !important; }
          .col-room { width: 15%; }
          .col-desc { width: 51%; }
          .col-amount { width: 20%; !important; }

          /* Header Borders */
        //   .s-main-table thead th { border-right: 1px solid #000;}
        //   .s-main-table thead th:last-child { border-right: none; border-left: 1px solid #000; }

          /* Totals block */
          .s-totals-container { display: flex; justify-content: flex-end; width: 100%; margin-bottom: 30px; }
          .s-totals-table { width: 37%; border-collapse: collapse; border-top: 1px solid #000; border-bottom: 1px solid #000; }
          .s-totals-table td { padding: 2px 3px; font-size: 8.5pt; }
          .s-totals-label { text-align: left; }
          .s-totals-val { text-align: right; }
          
          /* Separation blocks */
        //   .s-enquiry { font-size: 7.5pt; text-transform: uppercase; text-align: left; padding: 10px 0; border-top: 1px dashed #ddd; border-bottom: 1px dashed #ddd; margin-bottom: 15px; }
        //   .s-bank-note { font-size: 7.5pt; margin-bottom: 15px; text-align: left; }
          
        //   .s-bank-details { margin-bottom: 20px; }
        //   .s-bank-title { text-decoration: underline; font-size: 8pt; margin-bottom: 5px; }
        //   .s-bank-grid-container { display: flex; justify-content: space-between; font-size: 7.5pt; }
        //   .s-bank-grid { display: grid; grid-template-columns: 80px 1fr; row-gap: 2px; }
        //   .s-bank-grid .b-lbl { }
        //   .s-bank-grid .b-val { font-weight: bold; font-family: "Arial Bold", Arial, sans-serif; display: flex;}
          
          /* Signatures and strict box */
        //   .s-sig-container { display: flex; justify-content: space-between; align-items: stretch; margin-top: 15px; margin-bottom: 15px; }
        //   .s-computer-gen { font-size: 7.5pt; margin-bottom: 5px; }
          
        //   .s-liability-wrapper { border: 2.5px solid #000; padding: 12px; display: flex; justify-content: space-between; border-radius: 2px;}
        //   .s-liability-text { width: 68%; font-family: "Arial Bold", Arial, sans-serif; font-weight: bold; font-size: 7.5pt; text-transform: uppercase; text-align: justify; }
        //   .s-sig-block { width: 30%; display: flex; align-items: center; justify-content: flex-end; font-family: "Arial Bold", Arial, sans-serif; font-weight: bold;}
          
          /* Footer */
          .s-footer { margin-top: auto; text-align: center; font-size: 7pt; line-height: 1.3; }
          .s-footer .f-reg { font-family: Arial, sans-serif; font-weight: bold;}
          .s-footer .f-sub { font-family: Arial, sans-serif; font-weight: normal; font-size: 7.5pt;}
          .s-footer .f-contact { font-family: Arial, sans-serif; font-weight: normal; display: inline-block; white-space: nowrap; font-size: 7.5pt; }
          .s-footer-bottom { font-family: Arial, sans-serif; font-weight: bold; font-size: 7.5pt; margin-top: 6px;}
        `}} />

        {paginatedData.map((page, index) => (
          <div className="letter-sheet" key={index}>
            <div className="s-header-logo">
              {/* Optional fallback if logo image missing: can be text or actual logo */}
              <img src={logo} alt="Somerset Kuala Lumpur" className="s-logo-img" 
                   onError={(e) => { e.target.style.display='none'; } } />
            </div>
            
            <div className="s-title">INVOICE</div>

            <div className="s-info-row">
              <div className="s-col-left">
                <div className="s-info-grid">
                  <span className="s-label">Company</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.guest.company}</span>
                  
                  <span className="s-label">Address</span>
                  <span className="s-val"><span className="s-val-sep">:</span>
                    <div>
                      {invoice.guest.address.split('\n').map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                  </span>
                  
                  <span className="s-label">Attention</span>
                  <span className="s-val"><span className="s-val-sep"></span>{invoice.guest.attention}</span>
                  
                  <span className="s-label">Room</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.roomNo}</span>
                  
                  <span className="s-label">Room Type</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.roomType}</span>
                  
                  <span className="s-label">Arrival</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.arrival}</span>
                  
                  <span className="s-label">Departure</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.departure}</span>
                  
                  <span className="s-label">Guest</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.guest.name}</span>
                </div>
              </div>
              
              <div className="s-col-right">
                <div className="s-info-grid" style={{gridTemplateColumns: '100px 1fr'}}>
                  <span className="s-label">Reservation</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.reservation}</span>
                  
                  <span className="s-label">Regn No.</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.regnNo}</span>
                  
                  <span className="s-label">SST Regn. No.</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.sstNo}</span>
                  
                  <span className="s-label">TTx Regn. No.</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.ttxNo}</span>
                  
                  <span className="s-label">Invoice No.</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.invoiceNo}</span>
                  
                  <span className="s-label">A/R No.</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.arNo}</span>
                  
                  <span className="s-label">PO/Ref No.</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.poRefNo}</span>
                  
                  <span className="s-label">3rd Party No.</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.thirdPartyNo}</span>
                  
                  <span className="s-label">Print Date/Time</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.printedDateTime}</span>
                  
                  <span className="s-label">Cashier</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{invoice.meta.cashier}</span>
                  
                  <span className="s-label">Page</span>
                  <span className="s-val"><span className="s-val-sep">:</span>{page.pageNum}</span>
                </div>
              </div>
            </div>

            <div className="s-table-container">
              <table className="s-main-table">
                <thead>
                  <tr>
                    <th className="col-date" style={{ borderRight: 'none' }}>DATE</th>
                    <th className="col-room" style={{ borderRight: 'none' }}>Room</th>
                    <th className="col-desc" style={{ borderRight: 'none' }}>DESCRIPTION</th>
                    <th className="col-amount" style={{ borderLeft: 'none' }}>AMOUNT (MYR)</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((item, idx) => {
                    // const showDateAndRoom = idx === 0 || page.items[idx-1].rawDate !== item.rawDate;
                    return (
                      <tr key={idx}>
                        {/* <td className="col-date">{showDateAndRoom ? item.date : ''}</td>
                        <td className="col-room">{showDateAndRoom ? item.room : ''}</td> */}
                        <td className='col-date'>{item.date}</td>
                        <td className='col-room'>{item.room}</td>
                        <td className="col-desc">
                          {item.priority === 2 
                            ? `${item.desc} - (${item.shortDate}).` 
                            : item.desc
                          }
                        </td>
                        <td className="col-amount">{formatCurrency(item.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {page.isLast && (
              <>
                <div className="s-totals-container">
                  <table className="s-totals-table">
                    <tbody>
                      <tr>
                        <td className="s-totals-label">Sub-Total Before SST</td>
                        <td className="s-totals-val">{formatCurrency(invoice.summary.subTotalBeforeSST)}</td>
                      </tr>
                      <tr>
                        <td className="s-totals-label">Sales Service Tax 8%</td>
                        <td className="s-totals-val">{formatCurrency(invoice.summary.serviceTax8)}</td>
                      </tr>
                      <tr>
                        <td className="s-totals-label">Tourism Tax</td>
                        <td className="s-totals-val">{formatCurrency(invoice.summary.tourismTax)}</td>
                      </tr>
                      <tr>
                        <td className="s-totals-label">Total Amount</td>
                        <td className="s-totals-val">{formatCurrency(invoice.summary.totalAmount)}</td>
                      </tr>
                      <tr style={{borderBottom: "1px solid #000"}}>
                        <td className="s-totals-label">Total Amount USD</td>
                        <td className="s-totals-val">{formatCurrency(invoice.summary.balanceUsd)}</td>
                      </tr>
                      <tr>
                        <td className="s-totals-label">Payment</td>
                        <td className="s-totals-val">{formatCurrency(invoice.summary.payment)}</td>
                      </tr>
                      <tr>
                        <td className="s-totals-label">Balance</td>
                        <td className="s-totals-val">{formatCurrency(invoice.summary.balance)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* <div className="s-enquiry">
                  FOR BILL ENQUIRIES, PLEASE CALL: (60 3) 2718 6701 OR EMAIL US AT: enquiry.myKLbilling@the-ascott.com.<br/>
                  PAYMENTS CAN BE MADE BY CASH, CHEQUE OR MAJOR CREDIT CARDS OR TELEGRAPHIC TRANSFER,<br/>
                  MADE PAYABLE TO: SOMERSET AMPANG (MALAYSIA) SDN BHD
                </div>

                <div className="s-bank-note">
                  Please do not pay to any bank accounts that the beneficially name differs from the Company's/Property's name and immediately contact<br/>
                  the authorised person for verification and confirmation upon receipt of any instruction to change of bank accounts.
                </div>

                <div className="s-bank-details">
                  <div className="s-bank-title">Bank Details</div>
                  <div className="s-bank-grid-container">
                    <div className="s-bank-grid">
                      <span className="b-lbl">Bank Name</span><span className="b-val"><span className="s-val-sep">:</span>CIMB Bank Berhad</span>
                      <span className="b-lbl">Account</span><span className="b-val"><span className="s-val-sep">:</span>8007240590</span>
                      <span className="b-lbl">Bank Code</span><span className="b-val"><span className="s-val-sep">:</span>Not Applicable</span>
                      <span className="b-lbl">Holder's Name</span><span className="b-val"><span className="s-val-sep">:</span>SOMERSET AMPANG (MALAYSIA) SDN BHD</span>
                    </div>
                    <div className="s-bank-grid" style={{width: '45%'}}>
                      <span className="b-lbl">Branch Code</span><span className="b-val"><span className="s-val-sep">:</span>NOT APPLICABLE</span>
                      <span className="b-lbl">SWIFT Code</span><span className="b-val"><span className="s-val-sep">:</span>CIBBMYKL</span>
                      <span className="b-lbl">Bank Address</span><span className="b-val"><span className="s-val-sep">:</span><div>Lot C04-C05 Concourse Level, Petronas<br/>Tower 3, Suria KLCC, Jalan Ampang, 50088<br/>Kuala Lumpur</div></span>
                    </div>
                  </div>
                </div> */}

                {/* <div className="s-computer-gen">This Invoice is computer generated. No signature required.</div>

                <div className="s-liability-wrapper">
                  <div className="s-liability-text">
                    I ACCEPT THAT MY LIABILITY FOR THIS BILL IS NOT WAIVED AND AGREE TO<br/>
                    BE HELD PERSONALLY LIABLE IN THE EVENT THAT THE INDICATED PERSON<br/>
                    COMPANY OR ASSOCIATION FAILS TO PAY FOR ANY PART OF THE FULL<br/>
                    AMOUNT OF THESE CHARGES
                  </div>
                  <div className="s-sig-block">
                    SIGNATURE: _______________________
                  </div>
                </div> */}
              </>
            )}

            <div className="s-footer">
              <div className="f-reg"><span>Registered Company: SOMERSET AMPANG (MALAYSIA) SDN BHD</span></div>
              <div className="f-sub"><span>C/o: Somerset Kuala Lumpur<br/>187 Jalan Ampang, Taman U Thant Kuala Lumpur 50450</span></div>
              <div className="f-contact">
                <span style={{fontStyle: 'italic'}}>Tel.:</span> (60 3) 2723 8888 - <span style={{fontStyle: 'italic'}}>Fax:</span> (60 3) 2723 8999 - <span style={{fontStyle: 'italic'}}>Email:</span> frontoffice.sakl@the-ascott.com - <span style={{fontStyle: 'italic'}}>Website:</span> https://www.discoverasr.com
              </div>
              <div className="s-footer-bottom">
                Somerset Kuala Lumpur | Tax Invoice # {invoice.meta.invoiceNo} | Page {page.pageNum}/{page.totalPages}
              </div>
            </div>
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default SomersetInvoiceViewPage;