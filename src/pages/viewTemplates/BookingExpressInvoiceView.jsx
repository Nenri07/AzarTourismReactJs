import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
// import bookingExpressInvoiceApi from '../../Api/bookingExpressInvoice.api'; // ← TODO: real API k liye uncomment karo
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ TESTING MODE — Dummy Data
// ─────────────────────────────────────────────────────────────────────────────
const TEST_MODE = false;

const DUMMY_DATA = {
  invoiceNumber    : "BECAI26HTIN007897",
  invoiceDate      : "12-06-2026",
  supplierConfNo   : "BOKEMA062607904",
  folioNo          : "BECAI26FO011463",
  bookingDate      : "12-06-2026",
  bookingId        : "BECAI26HTBK011339",

  companyName      : "Azar Tourism Services",
  address          : "Tripoli City Center , Tripoli , Libya",
  phone            : "0021629174624",
  email            : "Info@azartourism.com",

  hotelName        : "Radisson Residences Vadistanbul",
  city             : "Istanbul - Turkey",

  checkInDate      : "2026-06-13",
  checkOutDate     : "2026-06-20",
  cancellationDate : "2026-06-09",

  currency         : "EUR",
  totalAmount      : 2695.00,

  roomDetails: [
    {
      roomName  : "1 Bedroom",
      guestName : "MRS HOUDA ELHADAD",
      noOfRooms : 1,
      nights    : 7,
      taxes     : 0.00,
      roomRate  : 2695.00,
    },
  ],
};

const BookingExpressInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [invoice, setInvoice]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const invoiceRef = useRef(null);
  const isPdfDownload = location.pathname.includes("/download-pdf");

  // ── 1. Data fetching / wiring ────────────────────────────────────────────
  useEffect(() => {
    if (TEST_MODE) {
      setInvoice(transformInvoiceData(DUMMY_DATA));
      setLoading(false);
    } else if (invoiceData) {
      setInvoice(transformInvoiceData(invoiceData));
      setLoading(false);
    } else if (invoiceId) {
      fetchInvoiceData();
    } else {
      setLoading(false);
    }
  }, [invoiceData, invoiceId]);

  // ── 2. Auto-download when path contains /download-pdf ───────────────────
  useEffect(() => {
    if (isPdfDownload && invoice && invoiceRef.current) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice]);

  // ── 3. API call ──────────────────────────────────────────────────────────
  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      // TODO: uncomment when API ready
      // const response = await bookingExpressInvoiceApi.getInvoiceById(invoiceId);
      // let rawData = response.data || response;
      // if (rawData.data) { rawData = rawData.data; if (rawData.data) rawData = rawData.data; }
      // setInvoice(transformInvoiceData(rawData));
    } catch (err) {
      console.error("Error fetching Booking Express invoice:", err);
      setError("Failed to load invoice data.");
      toast.error("Failed to load invoice from API.");
    } finally {
      setLoading(false);
    }
  };

  // ── 4. Transform: raw API → component state ──────────────────────────────
  const transformInvoiceData = (data) => {
    if (!data) return null;

    const roomDetails = data.roomDetails || data.room_details || [];
    const rooms = roomDetails.length > 0
      ? roomDetails
      : [
          {
            roomName    : data.roomName    || data.room_name    || data.description || "",
            guestName   : data.guestName   || data.guest_name   || "",
            noOfRooms   : data.noOfRooms   || data.no_of_rooms  || 1,
            nights      : data.nights      || data.no_of_nights || "",
            taxes       : data.taxes       || 0,
            roomRate    : data.grandTotal  || 0,
          },
        ];

    const totalAmount =
      data.totalAmount     ||
      data.total_amount    ||
      data.grandTotal      ||
      data.grand_total     ||
      rooms.reduce((s, r) => s + parseFloat(r.roomRate || 0), 0);

    const currency = data.currency || data.currencyCode || "EUR";

    return {
        refferenceNo    : data.refferenceNo     || data.refference_no    || data.referenceNo || "",
      invoiceNumber  : data.invoiceNumber   || data.invoice_number  || "",
      invoiceDate    : formatDisplayDate(data.invoiceDate || data.invoice_date || ""),
      supplierConfNo : data.supplierConfNo  || data.supplier_conf_no|| data.confNo || "",
      folioNo        : data.folioNo         || data.folio_no        || "",
      bookingDate    : formatDisplayDate(data.bookingDate || data.booking_date || ""),
      bookingId      : data.bookingId       || data.booking_id      || "",
      companyName    : data.companyName     || data.company_name    || "Azar Tourism Services",
      address        : data.address         || "Tripoli Tower Ground Floor, Office no 50, Tripoli, Libya",
      phone          : data.phone           || "0021629174624",
      email          : data.email           || "Info@azartourism.com",
      hotelName      : data.hotel_name_ref  || data.hotelName || data.hotel_name || data.hotel || "",
      city           : data.city            || "",
      checkInDate    : formatNiceDate(data.checkInDate  || data.check_in_date  || ""),
      checkOutDate   : formatNiceDate(data.checkOutDate || data.check_out_date || ""),
      cancellationDate: formatNiceDate(data.cancellationDate || data.cancellation_date || ""),
      rooms,
      totalAmount,
      currency,
    };
  };

  // ── 5. Date & Currency helpers ───────────────────────────────────────────
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    try {
      // Return as-is if it's already properly formatted (like in dummy data)
      if (dateString.includes('-') && dateString.split('-')[0].length === 2) return dateString; 
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch { return dateString; }
  };

  const formatNiceDate = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const dd = String(d.getDate()).padStart(2, '0');
      const mmm = d.toLocaleString('en-US', { month: 'short' });
      const yyyy = d.getFullYear();
      return `${dd} ${mmm} ${yyyy}`;
    } catch { return dateString; }
  };

const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "") return "0.00";
    
    // .toFixed(2) forces exactly 2 decimal places without any commas
    return parseFloat(val).toFixed(2); 
  };

  // ── 6. PDF Download ──────────────────────────────────────────────────────
  // ── 6. PDF Download ──────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    // 1. Target the grid and the rows
    const infoGrid = invoiceRef.current.querySelector('.be-info-grid');
    const infoRows = invoiceRef.current.querySelectorAll('.be-info-row');
    
    // Store original styles so we can revert them later
    const originalGridPadding = infoGrid ? infoGrid.style.paddingRight : '';
    const originalRowMargins = [];

    // Apply PDF-only styles
    if (infoGrid) {
      infoGrid.style.paddingRight = '25px'; // Your previous right padding
    }
    
    infoRows.forEach((row, index) => {
      originalRowMargins.push(row.style.marginBottom);
      // Increase the gap (margin-bottom) for all rows except the very last one
      if (index < infoRows.length - 1) {
        row.style.marginBottom = '8px'; // <--- INCREASE THIS VALUE to make the gap larger
      }
    });

    const headStyles = Array.from(
      document.head.querySelectorAll('link[rel="stylesheet"], style')
    );
    headStyles.forEach(s => s.parentNode && s.parentNode.removeChild(s));

    try {
      const opt = {
        margin   : 5,
        filename : `${invoice.refferenceNo || 'BookingExpress-Invoice'}.pdf`,
        image    : { type: 'jpeg', quality: 1 },
        html2canvas: {
          scale      : 4,
          useCORS    : true,
          letterRendering: true,
          scrollY    : 0,
          windowWidth: 794,
        },
        jsPDF      : { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      
      await html2pdf().set(opt).from(invoiceRef.current).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      // 2. Revert everything back to normal after PDF generation
      if (infoGrid) {
        infoGrid.style.paddingRight = originalGridPadding;
      }
      
      infoRows.forEach((row, index) => {
        row.style.marginBottom = originalRowMargins[index];
      });
      
      headStyles.forEach(s => document.head.appendChild(s));
      setPdfLoading(false);
    }
  };
  const handlePrint = () => window.print();

  // ── 7. Loading guard ─────────────────────────────────────────────────────
  if (loading || !invoice) {
    return (
      <InvoiceTemplate
        loading={loading}
        error={error}
        invoice={invoice}
        onBack={() => navigate("/invoices")}
      >
        <></>
      </InvoiceTemplate>
    );
  }

  // ── 8. Render ────────────────────────────────────────────────────────────
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
      <style dangerouslySetInnerHTML={{ __html: `
        .be-invoice-wrapper * {
          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;
        }

        .be-invoice-wrapper {
          display: flex;
          justify-content: center;
          padding: 20px 0;
          background: #f8f9fa;
        }

        /* Container exactly matching A4 dimensions and flex structure */
        .be-page {
          width: 794px;         /* Exact A4 width in pixels */
        //   min-height: 1123px;   /* Exact A4 height in pixels */
          background: #fff;
          border: 1px solid #c2c2c2;
          border-radius: 6px;
          overflow: hidden;
          font-size: 12px;
          color: #333;
          display: flex;
          flex-direction: column; /* Allows footer to be pushed to the bottom */
        }

        /* Banner */
        .be-header-blue {
          background-color: #185c89;
          color: #fff;
          text-align: center;
          padding: 2px 0;
          font-size: 15px;
          font-weight: bold;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Top Grid */
        .be-top-section {
          display: flex;
          justify-content: space-between;
          padding: 0px 5px;
          align-items: center;
        }
        .be-logo img {
          max-width: 215px;
          height: auto;
        }
    .be-info-grid {
    padding:10px 20px 10px 0px;
  padding-right: 20px;
  font-size: 12px;
  color: #555;
}
.be-info-row {
  display: flex;
  margin-bottom: 3px;
}
.be-info-row:last-child {
  margin-bottom: 0;
}
.be-info-label {
  width: 145px;
  font-weight: bold;
  color: #333;
  flex-shrink: 0;
}
.be-info-value {
  width: 135px;
}

        /* Customer Block */
        .be-customer {
          border-top: 1px solid #e3e0e0;
          border-bottom: 1px solid #e3e0e0;
          padding: 8px 10px;
        }
        .be-customer .to-label       { font-weight: bold; font-size: 12px; margin-bottom: 3px; color: #333; }
        .be-customer .company-name   { font-weight: bold; font-size: 12px; margin-bottom: 3px; color: #333; }
        .be-contact-row              { display: flex; align-items: center; font-size: 11px; color: #555; }
        .be-contact-row .bold        { font-weight: bold; color: #333; }
        .be-divider                  { height: 12px; width: 1px; background: #fff; margin: 0 12px; }

        /* Hotel Details */
        .be-hotel {
          background: #eeeeee;
          padding: 10px 10px;
          border-bottom: 1px solid #e3e0e0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .be-hotel div { margin-bottom: 4px; }
        .be-hotel div:last-child { margin-bottom: 0; }

        /* Dates Block */
        .be-dates {
          background: #cbc9c9;
          display: flex;
          border-bottom: 1px solid #e3e0e0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .be-date-box {
          flex: 1;
          display: flex;
          align-items: center;
          padding: 8px 20px 8px 10px;
          border-right: 1px solid #b2b2b2;
        }
        .be-date-box:last-child {
          border-right: none;
        }
        .be-date-icon {
          width: 30px;
          height: 30px;
          margin-right: 5px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .be-date-text        { display: flex; flex-direction: column; line-height:1.1;padding-top: 4px; }
        .be-date-label       { font-size: 12px; color: #666; font-weight: bold;  }
        .be-date-value       { font-size: 14.5px; font-weight: 500; color: #000; font-family: Arial, Helvetica, sans-serif;}

        /* Room Details Header */
        .be-room-header {
          padding: 15px 20px 10px;
          display: flex;
          align-items: center;
          background-color: #eeeeee;
        }
        .be-green-bar    { width: 6px; height: 16px; background: #2f7e77; margin-right: 10px; flex-shrink: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .be-room-title   { font-weight: bold; font-size: 12px; color: #555; white-space: nowrap; }
.be-line-extend  { flex-grow: 1; height: 0; border-top: 1px solid #ded5d5; margin-left: 80px; }
        /* Room Table */
        .be-table-wrap { padding: 0 20px 8px; flex-grow: 1; background: #eeeeee} /* Allows content area to fill available space */
        .be-table-box {
          border: 1px solid #e3e0e0;
          border-radius: 15px;
          padding: 8px 8px; /* Adds space inside the rounded box so lines don't touch the outer border */
          overflow: hidden; 
          background: #fff;
        }
        .be-table {
          width: 100%;
          border-collapse: collapse; 
          font-size: 11px;
          background: #fff;
        }
        .be-table th, .be-table td {
          padding: 5px 15px;
          text-align: center;
          color: #555;
          border-right: 1px solid #e3e0e0;
          border-bottom: 1px solid #e3e0e0;
        }
        .be-table th:first-child,
        .be-table td:first-child {
          text-align: left;
        }
        .be-table th:last-child,
        .be-table td:last-child {
          border-right: none;
        }
        .be-table th {
          font-weight: bold;
          color: #444;
        }
        
        .be-table-row td {
          border-bottom: 1px solid #ded5d5;
        }
        
        /* Total Row */
        .be-total-row td {
          border-bottom: none !important;
          text-align: right !important;
          padding: 15px 20px;
          font-size: 14px;
          font-weight: bold;
          color: #333;
        }

        /* Footer - Margin top auto pushes it completely to the bottom of the A4 min-height */
        .be-footer {
          border-top: 2px solid #d5d5d5;
          padding: 4px 20px 12px 4px;
          font-size: 11px;
          color: #777;
        //   margin-top: auto; 
          background: #fff;
        }

        /* Print/PDF specific fixes */
        /* Print/PDF specific fixes */
        @media print {
          @page { 
            margin: 0; 
            size: A4 portrait; 
          }
          
          /* Force the browser to print backgrounds */
          html, body { 
            background: #fff !important; 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body * { 
            visibility: hidden; 
          }
          
          /* Apply exact color printing to EVERY element inside the invoice */
          .be-invoice-wrapper, .be-invoice-wrapper * { 
            visibility: visible; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .be-invoice-wrapper {
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 7mm 5mm!important; 
            background: none;
            justify-content: center; 
          }
          
          .be-page {
            width: 794px !important; 
            border: 1px solid #c2c2c2 !important;
            border-radius: 6px !important; 
            margin: 0 auto !important;
            box-shadow: none !important;
          }
        }
      `}} />

      <div ref={invoiceRef} className="be-invoice-wrapper">
        <div className="be-page">

          {/* ── Header ── */}
          <div className="be-header-blue">INVOICE</div>

          {/* ── Top Info Section ── */}
          <div className="be-top-section">
            <div className="be-logo" style={{paddingBottom: '65px'}}>
              <img src="/BookingExpresslogo.png" alt="Booking Express" />
            </div>
            <div className="be-info-grid">
  <div className="be-info-row">
    <span className="be-info-label">Invoice Number:</span>
    <span className="be-info-value">{invoice.invoiceNumber}</span>
  </div>
  <div className="be-info-row">
    <span className="be-info-label">Invoice Date:</span>
    <span className="be-info-value">{invoice.invoiceDate}</span>
  </div>
  <div className="be-info-row">
    <span className="be-info-label">Supplier Conf. No:</span>
    <span className="be-info-value">{invoice.supplierConfNo}</span>
  </div>
  <div className="be-info-row">
    <span className="be-info-label">Folio No:</span>
    <span className="be-info-value">{invoice.folioNo}</span>
  </div>
  <div className="be-info-row">
    <span className="be-info-label">Booking Date:</span>
    <span className="be-info-value">{invoice.bookingDate}</span>
  </div>
  <div className="be-info-row">
    <span className="be-info-label">Booking ID:</span>
    <span className="be-info-value">{invoice.bookingId}</span>
  </div>
</div>
          </div>

          {/* ── Customer Block ── */}
          <div className="be-customer">
            <div className="to-label">TO,</div>
            <div className="company-name">{invoice.companyName}</div>
            <div className="be-contact-row">
              <span className="bold">Address:</span>&nbsp;{invoice.address}
              {invoice.phone && (
                <>
                  <span className="be-divider" />
                  <span className="bold">Phone:</span>&nbsp;{invoice.phone}
                </>
              )}
              {invoice.email && (
                <>
                  <span className="be-divider" style={{marginLeft:"90px"}} />
                  <span className="bold">Email:</span>&nbsp;{invoice.email}
                </>
              )}
            </div>
          </div>

          {/* ── Hotel Block ── */}
          <div className="be-hotel">
            <div>
              <span className="bold" style={{ fontWeight: 'bold', color: '#333' }}>Hotel Name:</span>&nbsp;
              {invoice.hotelName}
            </div>
            <div>
              <span className="bold" style={{ fontWeight: 'bold', color: '#333' }}>City:</span>&nbsp;
              {invoice.city}
            </div>
          </div>

          {/* ── Dates Block ── */}
          <div className="be-dates">
            <div className="be-date-box" style={{flex :"0.59"}}>
              <img src="/checkin.png" alt="Check-in" className="be-date-icon" />
              <div className="be-date-text">
                <span className="be-date-label">Check-in Date</span>
                <span className="be-date-value">{invoice.checkInDate}</span>
              </div>
            </div>
            <div className="be-date-box" style={{flex: "0.7"}}>
              <img src="/checkout.png" alt="Check-out" className="be-date-icon" />
              <div className="be-date-text">
                <span className="be-date-label">Check-Out Date</span>
                <span className="be-date-value">{invoice.checkOutDate}</span>
              </div>
            </div>
            <div className="be-date-box">
              <img src="/cancel.png" alt="Cancellation" className="be-date-icon" />
              <div className="be-date-text">
                <span className="be-date-label">Cancellation Date</span>
                <span className="be-date-value">{invoice.cancellationDate}</span>
              </div>
            </div>
          </div>

          {/* ── Room Details Header ── */}
          <div className="be-room-header">
            <div className="be-green-bar" />
            <div className="be-room-title">ROOM &amp; DETAILS</div>
            <div className="be-line-extend" />
          </div>

          {/* ── Room Table ── */}
          <div className="be-table-wrap">
            <div className="be-table-box">
              <table className="be-table">
                <thead>
                  <tr>
                    <th style={{paddingLeft: "2px", width:"24%"}}>Room Name</th>
                    <th style={{width:"18%", textAlign:"left", paddingLeft: "7px"}}>Guest Name</th>
                    <th style={{width: "14.5%", padding:"5px"}}>No. Of Rooms</th>
                    <th style={{width: "14.5%"}}>Night/s</th>
                    <th style={{textAlign: "right", paddingRight: "4px", width: "14.5%"}}>Taxes</th>
                    <th style={{textAlign: "right" ,paddingRight: "1px", width: "14.5%"}}>Room Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.rooms.map((room, idx) => (
                    <tr key={idx} className="be-table-row">
                      <td style={{paddingLeft: "2px"}}>{room.roomName   || room.room_name   || ""}</td>
                      <td style={{textAlign:"left", paddingLeft:"7px"}}>{room.guestName  || room.guest_name  || ""}</td>
                      <td>{room.noOfRooms  || room.no_of_rooms || 1}</td>
                      <td>{room.nights     || room.no_of_nights|| ""}</td>
                      <td style={{textAlign: "right", paddingRight: "4px"}}>{formatCurrency(room.taxes  ?? 0)}</td>
                      <td style={{textAlign: "right" ,paddingRight: "1px"}}>{formatCurrency(room.roomRate|| room.room_rate || 0)}</td>
                    </tr>
                  ))}
                  <tr className="be-total-row">
                    <td colSpan={6} style={{paddingTop: '5px', paddingRight: "2px"}}>
                      Total Amount:{invoice.currency} {formatCurrency(invoice.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="be-footer">System Generated Document</div>

        </div>
      </div>
    </InvoiceTemplate>
  );
};

export default BookingExpressInvoiceView;