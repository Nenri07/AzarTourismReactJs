import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from "/mandarin-logo.jpeg?url";
import invoiceApi from "../../Api/invoice.api"; 

// ─────────────────────────────────────────────────────────────────────────────
// PURE HELPERS  
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mmm = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return `${dd}-${mmm}-${d.getFullYear()}`;
  } catch { return dateStr; }
};

const formatCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "0.00";
  return parseFloat(val).toLocaleString('en-US', {
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
  const items = [];
  
  const allTransactions = [
    ...(data.accommodationDetails || []),
    ...(data.otherServices || [])
  ];

  allTransactions.forEach((trans, idx) => {
    items.push({
      id: `trans_${idx}`,
      rawDate: parseDateForSort(trans.date),
      date: formatDate(trans.date),
      desc: trans.description || trans.service_type || "",
      netAmount: trans.net || 0,
      vatAmount: trans.vat_amount || 0,
      total: trans.total || 0,
    });
  });

  items.sort((a, b) => a.rawDate - b.rawDate);
  
  const payments = data.payments || [];
  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalAmount = data.totalAmountPayable || items.reduce((sum, item) => sum + item.total, 0);
  const balance = totalAmount - totalPayments;

  const taxSummary = {
    vat20Net: data.taxableAmountExclVat || 0,
    vat20Amount: data.vatAt20Percent || 0,
    vat20Total: (data.taxableAmountExclVat || 0) + (data.vatAt20Percent || 0),
    vat0Net: data.zeroRatedAmount || 0,
    vat0Amount: 0,
    vat0Total: data.zeroRatedAmount || 0,
    serviceCharge: data.serviceCharge || 0,
    grandTotal: data.totalAmountPayable || 0,
  };

  return {
    invoiceNo: data.invoiceNo || "",
    invoiceDate: formatDate(data.invoiceDate) || "",
    reference: data.referenceNo || data.reservationNo || "",
    arrival: formatDate(data.arrivalDate) || "",
    departure: formatDate(data.departureDate) || "",
    room: data.roomNo || "",
    cashierName: data.cashierName || "",
    
    guestName: data.guestName || "",
    companyName: data.companyName || "",
    phone: data.guestPhone || "",
    email: data.guestEmail || "",
    poBox: data.poBox || "",
    address: data.address || "",
    addressLine2: data.addressLine2 || "",
    taxId: data.vatNo || "",
    
    items: items,
    payments: payments,
    
    totalNet: data.taxableAmountExclVat || 0,
    totalVat: data.vatAt20Percent || 0,
    totalAmount: totalAmount,
    totalPayments: totalPayments,
    balance: balance,
    
    taxSummary: taxSummary,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC PAGINATION (Calculations stay on same page if space permits)
// ─────────────────────────────────────────────────────────────────────────────

const buildPages = (items = [], payments = []) => {
  const REGULAR_PAGE_MAX = 22; // Max rows if the page DOES NOT have totals
  const LAST_PAGE_MAX_WITH_TOTALS = 10; // Max rows if the page DOES have totals
  
  if (items.length === 0) {
    return [{ items: [], showTotals: true, pageNo: 1, totalPages: 1 }];
  }
  
  const pages = [];
  let currentIdx = 0;

  while (currentIdx < items.length) {
    const remaining = items.length - currentIdx;

    if (remaining <= LAST_PAGE_MAX_WITH_TOTALS) {
      // It fits on the page WITH the totals/tax summary
      pages.push({
        items: items.slice(currentIdx, currentIdx + remaining),
        showTotals: true,
      });
      currentIdx += remaining;
    } else if (remaining <= REGULAR_PAGE_MAX) {
      // It fits on a regular page, but the totals WOULD NOT fit
      pages.push({
        items: items.slice(currentIdx, currentIdx + remaining),
        showTotals: false,
      });
      currentIdx += remaining;
      // Add an extra empty page just for the totals
      pages.push({
        items: [],
        showTotals: true,
      });
    } else {
      // Take up a full regular page and continue the loop
      pages.push({
        items: items.slice(currentIdx, currentIdx + REGULAR_PAGE_MAX),
        showTotals: false,
      });
      currentIdx += REGULAR_PAGE_MAX;
    }
  }
  
  const total = pages.length;
  pages.forEach((p, idx) => { 
    p.pageNo = idx + 1; 
    p.totalPages = total;
  });
  
  return pages;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const MandarinInvoiceView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (invoiceData) {
      setInvoice(mapApiDataToInvoice(invoiceData));
      setLoading(false);
    } else if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceData, invoiceId]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await invoiceApi.getInvoiceById(invoiceId); 
      
      let rawData = response.data || response;
      if (rawData.data) {
        rawData = rawData.data;
        if (rawData.data) {
          rawData = rawData.data;
        }
      }
      
      setInvoice(mapApiDataToInvoice(rawData));
    } catch (err) {
      console.error("Error fetching Mandarin invoice:", err);
      setError("Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!invoice?.items) return;
    setPaginatedData(buildPages(invoice.items, invoice.payments));
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
    headStyles.forEach(style => {
        const text = style.textContent || "";
        const href = style.href || "";
        const isPreserved = text.includes('Mandarin') || href.includes('mandarin') || text.includes('a4-page');
        if (isPreserved) return;
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
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
        filename: `Mandarin_Invoice_${invoice.invoiceNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
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
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      headStyles.forEach(style => {
          if (!style.parentNode) {
              document.head.appendChild(style);
          }
      });
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (!invoice) {
      return (
          <InvoiceTemplate loading={loading} error={error} invoice={invoice} onBack={() => navigate("/invoices")}>
              <></>
          </InvoiceTemplate>
      );
  }

  const PageHeader = ({ page }) => (
    <>
      <div className="header">
        <div className="title">Tax Invoice</div>
        <div className="logo-container">
          <img src={logo} alt="Mandarin Oriental" />       
        </div>
      </div>

      <div className="info-section">
        <div className="customer-info">
          <strong>{invoice.guestName}</strong>
          {invoice.companyName && <strong>{invoice.companyName}</strong>}
          {invoice.phone && <strong>{invoice.phone}</strong>}
          {invoice.email && <strong>{invoice.email}</strong>}
          {invoice.poBox && <strong>{invoice.poBox}</strong>}
          {invoice.address && <strong>{invoice.address}</strong>}
          {invoice.addressLine2 && <strong>{invoice.addressLine2}</strong>}
          <br />
          <table>
            <tbody>
              {invoice.taxId && (
                <tr>
                  <td style={{ fontWeight: 'bold', paddingRight: '20px' }}>Tax Id</td>
                  <td>{invoice.taxId}</td>
                </tr>
              )}
              <tr>
                <td style={{ fontWeight: 'bold', paddingRight: '20px' }}>Name</td>
                <td>{invoice.guestName}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="invoice-details">
          <table>
            <tbody>
              <tr><td>Invoice</td><td>{invoice.invoiceNo}</td></tr>
              <tr><td>Invoice Date</td><td>{invoice.invoiceDate}</td></tr>
              <tr><td>Page</td><td>{page.pageNo}</td></tr>
              <tr><td>Reference</td><td>{invoice.reference}</td></tr>
              <tr><td>Arrival</td><td>{invoice.arrival}</td></tr>
              <tr><td>Departure</td><td>{invoice.departure}</td></tr>
              <tr><td>Room</td><td>{invoice.room}</td></tr>
              <tr><td>Cashier Name</td><td>{invoice.cashierName}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const PageFooter = () => (
    <div className="footer">
      HB Hotels Management Ltd<br />
      Mandarin Oriental Mayfair, London<br />
      22 Hanover Square, London W1S1JP, United Kingdom<br />
      Telephone +44 (0) 20 7889 8888<br />
      www.mandarinoriental.com<br />
      Company Registration Number: 13738237 &nbsp;&nbsp;&nbsp; Company VAT Number: 430 0945 28
    </div>
  );

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
        @page { size: A4; margin: 0mm; }

        .mandarin-invoice-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          overflow: hidden;
        }

        .mandarin-invoice-wrapper * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: #000;
        }

        .a4-page {
          width: 210mm;
          min-height: 297mm;
          background: white;
          margin: 0 0 20px 0; 
          padding: 40px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          position: relative;
          page-break-after: always;
          break-after: page;
        }

        .a4-page:last-child {
          page-break-after: avoid;
          break-after: avoid;
          margin-bottom: 0;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 50px;
        }

        .header .title {
          font-size: 16px;
          font-weight: bold;
          margin-top: 10px;
        }

        .header .logo-container img {
          width: 160px;
          margin-bottom: 5px;
        }

        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          line-height: 1.4;
        }

        .customer-info strong {
          display: block;
        }

        .invoice-details table {
          width: 100%;
          border-collapse: collapse;
        }

        .invoice-details td {
          padding: 1px 10px 1px 0;
          vertical-align: top;
        }

        .invoice-details td:first-child {
          font-weight: bold;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        .invoice-table th, .invoice-table td {
          padding: 6px 0;
          text-align: right;
        }

        .invoice-table th {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          font-weight: bold;
        }

        .invoice-table th:first-child, .invoice-table td:first-child {
          text-align: left;
          width: 15%;
        }

        .invoice-table th:nth-child(2), .invoice-table td:nth-child(2) {
          text-align: left;
          width: 40%;
        }

        .total-row td {
          border-bottom: 2px solid #000;
          font-weight: bold;
          padding-top: 10px;
          padding-bottom: 10px;
        }

        .charges-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
          font-weight: bold;
          line-height: 1.5;
          margin-bottom: 30px;
        }

        .charges-table td {
          padding-left: 20px;
          text-align: right;
        }

        .summary-table {
          margin-top: 10px;
          margin-bottom: 30px;
        }

        .summary-table th:first-child, .summary-table td:first-child {
          width: 25%;
        }

        .summary-table th:nth-child(2), .summary-table td:nth-child(2) {
          width: 15%;
          text-align: left;
        }

        .summary-total-row td {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          font-weight: bold;
        }

        .final-total-row td {
          border-top: 1px solid #000;
          border-bottom: 2px solid #000;
          font-weight: bold;
        }

        .footer {
          position: absolute;
          bottom: 40px;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 9px;
          line-height: 1.4;
        }

        @media print {
          .mandarin-invoice-wrapper { padding: 0 !important; background: none !important; }
          .a4-page { 
            margin: 0 !important; 
            padding: 20px;
            box-shadow: none !important; 
            page-break-after: always;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="mandarin-invoice-wrapper" ref={invoiceRef}>
        {paginatedData.map((page, pageIdx) => (
          <div className="a4-page" key={pageIdx}>
            {/* The standard Header block applied to every page */}
            <PageHeader page={page} />

            {/* Main items table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Net</th>
                  <th>VAT<br />Amount</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Check for empty rows in case an empty page is forced just for the totals */}
                {page.items.length > 0 ? (
                  page.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.date}</td>
                      <td>{item.desc}</td>
                      <td>{formatCurrency(item.netAmount)}</td>
                      <td>{formatCurrency(item.vatAmount)}</td>
                      <td>{formatCurrency(item.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '10px 0', fontStyle: 'italic' }}>
                      (Continued on next page)
                    </td>
                  </tr>
                )}
                
                {page.showTotals && (
                  <>
                    {/* Render Payments within the table */}
                    {invoice.payments.map((payment, idx) => (
                      <tr key={`payment_${idx}`}>
                        <td>{formatDate(payment.date) || invoice.invoiceDate}</td>
                        <td>{payment.description || payment.method || "Payment"}</td>
                        <td>0.00</td>
                        <td>0.00</td>
                        <td>({formatCurrency(payment.amount)})</td>
                      </tr>
                    ))}
                    
                    {/* Render standard item totals */}
                    <tr className="total-row">
                      <td>Total</td>
                      <td></td>
                      <td>{formatCurrency(invoice.totalNet)}</td>
                      <td>{formatCurrency(invoice.totalVat)}</td>
                      <td>{formatCurrency(invoice.balance)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* If there's enough space, append calculations here immediately */}
            {page.showTotals && (
              <>
                <div className="charges-section">
                  <table className="charges-table">
                    <tbody>
                      <tr>
                        <td></td>
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>GBP</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Charges</td>
                        <td>{formatCurrency(invoice.totalAmount)}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Payments</td>
                        <td>({formatCurrency(invoice.totalPayments)})</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Balance</td>
                        <td>{formatCurrency(invoice.balance)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <table className="invoice-table summary-table" style={{ width: '70%' }}>
                  <thead>
                    <tr>
                      <th>Tax Summary</th>
                      <th>Amt / Pct</th>
                      <th>Net</th>
                      <th>VAT Amount</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>VAT 20%</td>
                      <td>20.00%</td>
                      <td>{formatCurrency(invoice.taxSummary.vat20Net)}</td>
                      <td>{formatCurrency(invoice.taxSummary.vat20Amount)}</td>
                      <td>{formatCurrency(invoice.taxSummary.vat20Total)}</td>
                    </tr>
                    <tr>
                      <td>VAT 0%</td>
                      <td>0.00%</td>
                      <td>0.00</td>
                      <td>0.00</td>
                      <td>0.00</td>
                    </tr>
                    <tr className="summary-total-row">
                      <td>Total Tax</td>
                      <td></td>
                      <td>{formatCurrency(invoice.taxSummary.vat20Net)}</td>
                      <td>{formatCurrency(invoice.taxSummary.vat20Amount)}</td>
                      <td>{formatCurrency(invoice.taxSummary.vat20Total)}</td>
                    </tr>
                    <tr>
                      <td>Service Charge</td>
                      <td></td>
                      <td>({formatCurrency(Math.abs(invoice.taxSummary.serviceCharge))})</td>
                      <td></td>
                      <td>({formatCurrency(Math.abs(invoice.taxSummary.serviceCharge))})</td>
                    </tr>
                    <tr className="final-total-row">
                      <td>Total</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td>{formatCurrency(invoice.taxSummary.grandTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* Footers sit at the bottom of every page */}
            <PageFooter />
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default MandarinInvoiceView;