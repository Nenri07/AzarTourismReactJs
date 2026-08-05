import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components"; // Adjust path as needed

// Update the path to your actual logo

import logo from '/Movenpick-logo.png'; 

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
    const yy = String(d.getFullYear());
    return `${dd}.${mm}.${yy}`; // Using full year to match Movenpick HTML
  } catch { return dateStr; }
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "";
  return parseFloat(val).toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

const formatCurrencyUsd = (val) => {
  if (val === null || val === undefined || val === "") return "";
  return parseFloat(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// API → VIEW SCHEMA MAPPER
// ─────────────────────────────────────────────────────────────────────────────

// const mapApiDataToInvoice = (data = {}) => {
//   if (!data) return null;

//   const items = [];
  
//   if (data.accommodationDetails && data.accommodationDetails.length > 0) {
//     data.accommodationDetails.forEach((acc) => {
//       const dateStr = formatDate(acc.date);
//       items.push({ 
//         date: dateStr, 
//         desc: acc.description || "Accommodation", 
//         qty: 1,
//         debit1: acc.debitTnd, 
//         credit1: "", 
//         debit2: acc.debitTnd, 
//         credit2: 0 
//       });
//       // Movenpick includes taxes as line items in the example HTML
//       if (data.showPerNightTax && data.cityTaxPerNight) {
//         items.push({ date: dateStr, desc: "City Tax", qty: 1, debit1: data.cityTaxPerNight, credit1: "", debit2: data.cityTaxPerNight, credit2: 0 });
//       }
//     });
//   }

//   // Example: Mapping overall stamp fee as a line item if needed based on Movenpick layout
//   if (data.stampTaxTotal) {
//     items.push({ date: formatDate(data.invoiceDate), desc: "Stamp Fee", qty: 1, debit1: data.stampTaxTotal, credit1: "", debit2: data.stampTaxTotal, credit2: 0 });
//   }

//   const finalBalance = Number((data.grandTotalTnd || 0) + (data.cityTaxTotal || 0) + (data.stampTaxTotal || 0));

//   return {
//     meta: {
//       date: formatDate(data.invoiceDate),
//       invoiceNo: data.referenceNo || "53900",
//       cashier: data.cashierId || "9622",
//       userId: data.userId || "HB4I1-AADIOU",
//       vatNo: data.vatNo || "1275809 RAM 00/0",
//       hotelName: data.hotel || "Mövenpick Hotel Du Lac Tunis",
//     },
//     guest: {
//       name: data.guestName,
//       company: data.companyName || "Azar Company",
//       address1: "Algeria Square Building Number 12",
//       address2: "First Floor, Tripoli, Libya.",
//       room: data.roomNo,
//       arrival: formatDate(data.arrivalDate),
//       departure: formatDate(data.departureDate),
//       reservationNo: data.confirmationNo || "508322904",
//       membershipNo: data.membershipNo || ""
//     },
//     items,
//     totals: {
//       totalDebit: formatCurrency(finalBalance),
//       totalCredit: formatCurrency(0),
//       netAmount: formatCurrency(data.totalHorsTaxes || 967.564),
//       fdcst1: formatCurrency(data.fdcst1Pct || 10.517),
//       tva7: formatCurrency(data.vat7Pct || 73.619),
//       cityTax: formatCurrency(data.cityTaxTotal || 3.000),
//       stampDuty: formatCurrency(data.stampTaxTotal || 1.000),
//       totalGross: formatCurrency(finalBalance),
//       balance: formatCurrency(finalBalance),
//       exchangeRate: formatCurrency(data.sellingRate || 0.000),
//       totalInEur: formatCurrency(data.balanceUsd || 0.000)
//     }
//   };
// };



const mapApiDataToInvoice = (data = {}) => {
  if (!data) return null;

  const items = [];

  // Find the earliest accommodation date, so Stamp Fee can be anchored to day 1
  const firstDate = data.accommodationDetails && data.accommodationDetails.length > 0
    ? data.accommodationDetails[0].date
    : data.invoiceDate;

  if (data.accommodationDetails && data.accommodationDetails.length > 0) {
    data.accommodationDetails.forEach((acc) => {
      const dateStr = formatDate(acc.date);

      // Accommodation row
      items.push({
        date: dateStr,
        rawDate: acc.date,
        desc: acc.description || "Accommodation",
        qty: 1,
        debit1: acc.debitTnd,
        credit1: "",
        debit2: acc.debitTnd,
        credit2: 0,
        sortOrder: 0
      });

      // City Tax row — match by same date from cityTaxDetails
      const cityTaxForDay = data.cityTaxDetails?.find((t) => t.date === acc.date);
      if (cityTaxForDay) {
        items.push({
          date: dateStr,
          rawDate: acc.date,
          desc: "City Tax",
          qty: 1,
          debit1: cityTaxForDay.amount,
          credit1: "",
          debit2: cityTaxForDay.amount,
          credit2: 0,
          sortOrder: 1
        });
      }

      // Stamp Fee — only on the first day, right after that day's City Tax
      if (acc.date === firstDate && data.stampTaxTotal) {
        items.push({
          date: dateStr,
          rawDate: acc.date,
          desc: "Stamp Fee",
          qty: 1,
          debit1: data.stampTaxTotal,
          credit1: "",
          debit2: data.stampTaxTotal,
          credit2: 0,
          sortOrder: 3
        });
      }
    });
  }

  // Extra/other services
  if (data.otherServices && data.otherServices.length > 0) {
    data.otherServices.forEach((service) => {
      items.push({
        date: formatDate(service.date),
        rawDate: service.date,
        desc: service.name,
        qty: 1,
        debit1: service.amount,
        credit1: "",
        debit2: service.amount,
        credit2: 0,
        sortOrder: 2
      });
    });
  }

  // Sort date-wise; same-date ties keep Accommodation -> City Tax -> Stamp Fee -> Service order
  items.sort((a, b) => {
    const dateDiff = new Date(a.rawDate) - new Date(b.rawDate);
    if (dateDiff !== 0) return dateDiff;
    return a.sortOrder - b.sortOrder;
  });


  return {
    meta: {
      date: formatDate(data.invoiceDate),
      invoiceNo: data.invoiceNo ||"",
      cashier: data.cashierId || "",
      userId: data.userId || "",
      vatNo: data.vatNo || "",
      hotelName: data.hotel || "Mövenpick Hotel Du Lac Tunis",
    },
    guest: {
      name: data.guestName,
      company: data.companyName || "Azar Company",
      address1: "Tripoli Tower Ground Floor Office no 50",
      address2: "Tripoli, Libya.",
      room: data.roomNo,
      arrival: formatDate(data.arrivalDate),
      departure: formatDate(data.departureDate),
      reservationNo: data.confirmationNo || "",
      membershipNo: data.membershipNo || ""
    },
    items,
    totals: {
      totalDebit: formatCurrency(data.totalTtc || 0.000),
      totalCredit: formatCurrency(0),
      netAmount: formatCurrency(data.totalHorsTaxes || 0.000),
      fdcst1: formatCurrency(data.fdcst1Pct || 0.000),
      tva7: formatCurrency(data.vat7Pct || 0.000),
      cityTax: formatCurrency(data.cityTaxTotal || 0.000),
      stampDuty: formatCurrency(data.stampTaxTotal || 0.000),
      totalGross: formatCurrency(data.totalTtc || 0.000),
      balance: formatCurrency(data.totalTtc || 0.000),
      exchangeRate: formatCurrencyUsd(data.exchangeRate || 0),
      totalInEur: formatCurrencyUsd(data.balanceUsd || 0)
    }
  };
};
// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────────

const buildPages = (items = []) => {
  if (items.length === 0) return [{ items: [], isLastPage: true, pageNo: 1, totalPages: 1 }];

  const pages = [];
  const MAX_ROWS_NORMAL = 32; 
  const MAX_ROWS_WITH_TOTALS = 16; 

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

    pages.push({ items: items.slice(i, i + take), isLastPage: isLastPage });
    i += take;

    if (i >= items.length && !isLastPage) {
      pages.push({ items: [], isLastPage: true });
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

const MovenpickInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialData = invoiceData || location.state?.initialData;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (initialData) {
      setInvoice(mapApiDataToInvoice(initialData));
      setLoading(false);
    } else {
      // Mock data for testing exact layout if no API data is passed
      setInvoice(mapApiDataToInvoice({
         guestName: "Mr. FARAJ MILAD B BATTOR ABANI", roomNo: "450", 
         arrivalDate: "2026-04-19", departureDate: "2026-04-20", invoiceDate: "2026-04-27",
         accommodationDetails: [{ date: "2026-04-19", description: "Accommodation", debitTnd: 986.700 }]
      }));
      setLoading(false);
    }
  }, [initialData]);

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

    const element = invoiceRef.current;
    
    // Temporarily add class to strip margins and shadows before generating PDF
    element.classList.add('pdf-export-mode');

    try {
      const images = element.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin:      0,
        filename:    `Movenpick_${invoice.meta.invoiceNo}.pdf`,
        image:       { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 4, useCORS: true, letterRendering: true, scrollY: 0, windowWidth: 794 },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:   { mode: ['css', 'legacy'] },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("PDF generation failed");
    } finally {
      // Clean up the temporary class
      element.classList.remove('pdf-export-mode');
      headStyles.forEach(style => document.head.appendChild(style));
      setPdfLoading(false);
    }
  };

  if (!invoice) return null;

  const styles = `
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }

    .invoice-box {
      width: 100%;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      color: #333;
      background: #f5f5f5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding-bottom: 20px;
    }

    .inv-page {
      width: 210mm;
      min-height: 297mm;
      padding: 40px 40px;
      margin: 20px auto;
      background: #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden; 
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
    }

    .inv-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
      margin-bottom: 0;
    }

    /* 🔥 PDF EXPORT OVERRIDES (Fixes Blank Pages) 🔥 */
    .pdf-export-mode {
       background: #fff !important;
       padding: 0 !important;
    }
    .pdf-export-mode .inv-page {
       margin: 0 !important;
       box-shadow: none !important;
       border: none !important;
       height: 295mm !important;
       max-height: 295mm !important;
       overflow: hidden !important; 
       page-break-after: avoid !important;
       page-break-inside: avoid !important;
    }

    /* Movenpick Specific Styles */
    .header { margin-bottom: 30px; justify-content: left; display: flex;}
    .logo { width: 250px; margin-bottom: 5px; }
    .address-section { line-height: 1.4; margin-bottom: 45px; }
    .invoice-title { font-size: 14px; font-weight: normal; margin-bottom: 20px; text-transform: uppercase; }
    
    .meta-data { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .meta-group { width: 60%; }
    .meta-group:last-child { width: 35%; }
    .meta-row { display: flex; }
    .meta-label { width: 145px; flex-shrink: 0; }
    .meta-labelR{ width: 70px; flex-shrink: 0; }
    .meta-value { white-space: nowrap; }

    .line-items { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
    .line-items th {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 0.2px 4px;
      text-align: left;
      font-weight: bold;
    }
    .line-items td { padding: 1px 25px 1px 4px; vertical-align: top; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; }

    .balance-section { margin-top: 15px; display: flex; justify-content: flex-end; }
    .balance-box { display: flex; width: 425px; font-weight: bold; }

    .tax-summary { margin-top: 8px; float: right; width: 362px; }
    .tax-row { display: flex; justify-content: flex-end; line-height: 1.3; }
    .tax-label {
  flex: 1;
  text-align: left;
}

.tax-container{
display: flex;
justify-content: center;
padding-left: 145px;
}

.tax-value {
  width: 111px;         /* fixed width so both value columns sit tight together */
  text-align: right;
}

    .currency-info { line-height: 1.5; }

    @media print {
      body * { visibility: hidden; }
      .invoice-box, .invoice-box * { visibility: visible; }
      .invoice-box { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: none !important; }
      .inv-page { box-shadow: none !important; margin: 0 !important; height: 297mm !important; border: none !important; page-break-after: always; padding: 20px 40px; }
      .inv-page:last-child { page-break-after: avoid; }
      .html2pdf__page-break { display: none !important; }
    }
  `;

  const PageHeader = ({ page }) => (
    <>
      <div className="header">
        <img src={logo} alt="Mövenpick Logo" className="logo" />
      </div>

      <div className="address-section">
        {invoice.guest.company}<br />
        {invoice.guest.address1}<br />
        {invoice.guest.address2}<br />
        {invoice.guest.country}
      </div>

      <div className="invoice-title">COPY OF INVOICE</div>

      <div className="meta-data">
        <div className="meta-group">
          <div className="meta-row"><span className="meta-label">Invoice No.</span><span className="meta-value">{invoice.meta.invoiceNo}</span></div>
          <div className="meta-row"><span className="meta-label">Arrival</span><span className="meta-value">{invoice.guest.arrival}</span></div>
          <div className="meta-row"><span className="meta-label">Departure</span><span className="meta-value">{invoice.guest.departure}</span></div>
          <div className="meta-row"><span className="meta-label">Room No.</span><span className="meta-value">{invoice.guest.room}</span></div>
          <div className="meta-row"><span className="meta-label">Reservation No.</span><span className="meta-value">{invoice.guest.reservationNo}</span></div>
          <div className="meta-row"><span className="meta-label">Membership No.</span><span className="meta-value">{invoice.guest.membershipNo}</span></div>
          <div className="meta-row"><span className="meta-label">Guest Name</span><span className="meta-value">{invoice.guest.name}</span></div>
        </div>
        <div className="meta-group">
          <div className="meta-row" style={{justifyContent: "flex-start"}}><span className="meta-labelR" style={{textAlign: "left"}}>Date</span><span className="meta-value" style={{textAlign: "right", width: "135px"}}>{invoice.meta.date}</span></div>
          <div className="meta-row" style={{justifyContent: "flex-start"}}><span className="meta-labelR"  style={{textAlign: "left"}}>Cashier</span><span className="meta-value" style={{textAlign: "right", width: "135px"}}>{invoice.meta.cashier}</span></div>
          <div className="meta-row" style={{justifyContent: "flex-start"}}><span className="meta-labelR"  style={{textAlign: "left"}}>User ID</span><span className="meta-value" style={{textAlign: "right", width: "135px"}}>{invoice.meta.userId}</span></div>
          <div className="meta-row" style={{justifyContent: "flex-start"}}><span className="meta-labelR"  style={{textAlign: "left"}}>Page(s)</span><span className="meta-value" style={{textAlign: "right", width: "135px"}}>{page.pageNo} of {page.totalPages}</span></div>
          <div className="meta-row" style={{justifyContent: "flex-start"}}><span className="meta-labelR"  style={{textAlign: "left"}}>VAT No.</span><span className="meta-value" style={{textAlign: "right", width: "135px"}}>{invoice.meta.vatNo}</span></div>
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
          <React.Fragment key={pageIdx}>
            <div className="inv-page">
              
              <PageHeader page={page} />

              <table className="line-items">
                <thead>
                  <tr>
                    <th width="10.5%">Date</th>
                    <th width="31%">Description</th>
                    <th width="10%" style={{paddingLeft:"20px"}}>Qty.</th>
                    <th width="12%" className="text-right">Debit TND</th>
                    <th width="12%" className="text-right">Credit TND</th>
                    <th width="12%" className="text-right">Debit TND</th>
                    <th width="12%" className="text-right" style={{textAlign:"right", paddingRight: "4px"}}>Credit TND</th>
                  </tr>
                </thead>
                <tbody style={{lineHeight: "1.3"}}>
                  {page.items.map((txn, index) => (
                    <tr key={index}>
                      <td>{txn.date}</td>
                      <td>{txn.desc}</td>
                      <td style={{ paddingLeft: "17px" }}>{txn.qty}</td>
                      <td className="text-right">{formatCurrency(txn.debit1)}</td>
                      <td className="text-right">{txn.credit1 !== "" ? formatCurrency(txn.credit1) : ""}</td>
                      <td className="text-right">{formatCurrency(txn.debit2)}</td>
                      <td className="text-right" style={{paddingRight:"4px"}}>{txn.credit2 !== "" ? formatCurrency(txn.credit2) : "0.000"}</td>
                    </tr>
                  ))}

                  {page.isLastPage && (
                    <tr className="total-row">
                      <td colSpan="2" style={{ textAlign: 'center', paddingRight: "0px" , paddingLeft: "85px"}}>Total</td>
                      <td></td>
                      <td className="text-right">{invoice.totals.totalDebit}</td>
                      <td className="text-right">{invoice.totals.totalCredit}</td>
                      <td className="text-right">{invoice.totals.totalDebit}</td>
                      <td className="text-right"style={{textAlign:"right", paddingRight:"4px"}}>{invoice.totals.totalCredit}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {page.isLastPage && (
                <>
                  <div className="balance-section">
                    <div className="balance-box">
                      <div style={{ flex: 0 ,paddingRight: "37px"}}>Balance</div>
                      <div style={{ flex: 1 , paddingRight: "150px"}} className="text-right">{invoice.totals.balance}&nbsp;&nbsp;&nbsp; TND</div>
                      <div style={{ flex: 1 }} className="text-right"></div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginTop: '10px', fontStyle: 'italic', paddingRight: "45px"}}>
                    1 TND = 1 TND
                  </div>
                  <div className='tax-container'>
                  <div className="tax-summary">
                    <div className="tax-row">
                      <span className="tax-label" style={{fontWeight: "bold"}}>NET Taxable</span>
                      <span className="tax-value" style={{fontWeight: "bold"}}>{invoice.totals.netAmount} TND</span>
                      <span className="tax-value" style={{fontWeight: "bold"}}>{invoice.totals.netAmount} TND</span>
                    </div>
                    <div className="tax-row">
                      <span className="tax-label">FDCST 1%</span>
                      <span className="tax-value">{invoice.totals.fdcst1}</span>
                                            <span className="tax-value">{invoice.totals.fdcst1}</span>

                    </div>
                    <div className="tax-row">
                      <span className="tax-label">VAT 7%</span>
                      <span className="tax-value">{invoice.totals.tva7}</span>
                                            <span className="tax-value">{invoice.totals.tva7}</span>

                    </div>
                    <div className="tax-row">
                      <span className="tax-label">City Tax</span>
                      <span className="tax-value">{invoice.totals.cityTax}</span>
                                            <span className="tax-value">{invoice.totals.cityTax}</span>

                    </div>
                    <div className="tax-row">
                      <span className="tax-label">Stamp Fees</span>
                      <span className="tax-value">{invoice.totals.stampDuty}</span>
                                            <span className="tax-value">{invoice.totals.stampDuty}</span>

                    </div>
                    <div className="tax-row">
                      <span className="tax-label" style={{fontWeight: "bold"}}>Total Gross</span>
                      <span className="tax-value" style={{fontWeight: "bold"}}>{invoice.totals.totalGross}</span>
                                            <span className="tax-value" style={{fontWeight: "bold"}}>{invoice.totals.totalGross}</span>

                    </div>
                  </div>
                  </div>

                  <div className="currency-info">
                    EUR Exch. Rate: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {invoice.totals.exchangeRate} TND<br />
                    Total in EUR: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {invoice.totals.totalInEur} EUR
                  </div>
                </>
              )}

              <div style={{ flexGrow: 1 }} />
            </div>

            {/* Safe explicit page break ensuring no blank canvas fragments follow */}
            {pageIdx < paginatedData.length - 1 && <div className="html2pdf__page-break"></div>}

          </React.Fragment>
        ))}
      </div>
    </InvoiceTemplate>
  );
};
export default MovenpickInvoiceView;
