




import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import logo from "/hilton_bosphorus-logo.png"; // Make sure to use the correct Hilton logo path

const HiltonIstanbulInvoiceViewPage = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);
  const ROWS_PER_PAGE = 25;

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (invoiceData) {
      setInvoice(transformInvoiceData(invoiceData));
      setLoading(false);
    } else if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceData, invoiceId]);

  useEffect(() => {
    if (isPdfDownload && invoice && invoiceRef.current) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice]);

  // ── FETCH FROM API ────────────────────────────────────────────────────────
  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await cairoInvoiceApi.getInvoiceById(invoiceId);

      let rawData = response.data || response;
      if (rawData.data) {
        rawData = rawData.data;
        if (rawData.data) {
          rawData = rawData.data;
        }
      }

      setInvoice(transformInvoiceData(rawData));
    } catch (err) {
      console.error("❌ Error fetching Hilton Istanbul invoice:", err);
      setError(err.message || "Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  // ── TRANSFORM API DATA → TEMPLATE SHAPE ──────────────────────────────────
  const transformInvoiceData = (data) => {
    if (!data) return null;

    const allRows = [];
    
    // Parse the starting reference/transaction ID from the backend using startingRefNo
    let currentTransactionId = parseInt(data.startingRefNo || '10000000', 10);
    if (isNaN(currentTransactionId)) currentTransactionId = 10000000;

    // 1. Gather Accommodation Rows
    if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
      data.accommodationDetails.forEach((item, index) => {
        const amount = item.rate || item.guestCharge || item.chargesEgp || 0;
        const currentIdStr = currentTransactionId.toString();
        
        const accCashierId = data.accommodationRefId || item.cashierId || data.cashierId || 'ADMO';
        
        allRows.push({
          _rawDate: new Date(item.date).getTime(),
          _sortOrder: 0,
          id: `acc_${index}`,
          date: formatDate(item.date),
          description: item.description || `GUEST ROOM`,
          cashierId: accCashierId,
          transactionId: currentIdStr,
          debit: formatCurrency(amount),
          credit: '',
          balance: '',
        });

        const taxAmount = amount * 0.12; 
        allRows.push({
          _rawDate: new Date(item.date).getTime(),
          _sortOrder: 1,
          id: `tax_${index}`,
          date: formatDate(item.date),
          description: 'TAXES',
          cashierId: accCashierId,
          transactionId: currentIdStr,
          debit: formatCurrency(taxAmount),
          credit: '',
          balance: '',
        });

        currentTransactionId++; 
      });
    }

    // 2. Gather Services Rows
    if (data.otherServices && Array.isArray(data.otherServices)) {
      data.otherServices.forEach((service, index) => {
        const srvCashierId = data.servicesRefId || service.cashierId || data.cashierId || 'ADMO';

        allRows.push({
          _rawDate: new Date(service.date).getTime(),
          _sortOrder: 2,
          id: `srv_${index}`,
          date: formatDate(service.date),
          description: service.name || 'EXTRA SERVICE',
          cashierId: srvCashierId,
          transactionId: currentTransactionId.toString(),
          debit: formatCurrency(service.amount || 0),
          credit: '',
          balance: '',
        });
        currentTransactionId++; 
      });
    }

    // 3. Sort chronologically
    allRows.sort((a, b) => {
      if (a._rawDate !== b._rawDate) return a._rawDate - b._rawDate;
      return a._sortOrder - b._sortOrder;
    });

    const totalDebit = allRows.reduce((sum, row) => sum + parseFloat(row.debit.replace(/,/g, '') || 0), 0);
    const totalCredit = allRows.reduce((sum, row) => sum + parseFloat(row.credit.replace(/,/g, '') || 0), 0);
    const balance = totalDebit - totalCredit;
    const balancceInEuro = formatCurrency(data.totalInEur || 0)

    const tourismBase = data.taxableAmount || 0;
    const tourismTax = data.accommodationTax || 0;
    
    const vat10Base = data.taxableAmount || 0;
    const vat10Amount = data.totalVat10 || 0;
    
    const vat20Base = data.totalServicesTaxable || 0;
    const vat20Amount = data.totalVat20 || 0;
    return {
      hotelContact: {
        name: data.hotel || 'HILTON ISTANBUL BOSPHORUS',
        addressLine1: 'CUMHURIYET CADDESI,HARBIYE',
        city: 'ISTANBUL , 34367',
        country: 'Turkiye',
        phone: 'TELEPHONE +902123156000 • FAX +902122404165',
        vat: data.vatNo || data.taxCardNo || '4810034727',
      },

      guestInfo: {
        guestName: (data.guestName || 'GUEST NAME').toUpperCase(),
        addressLine1: data.companyName || 'X',
        addressLine2: data.address || 'X',
        country: data.country || 'LIBYA',
        confirmationNumber: data.confNo || '3387511416',
        invoiceDateStr: `HILTON ISTANBUL BOSPHORUS ${formatDateLong(data.invoiceDate, data.invoiceTime)}`,
      },

      roomDetails: {
        roomNumber: data.roomNo || '648 /K1EC',
        arrivalDate: formatDate(data.arrivalDate) || '02/01/2026',
        departureDate: formatDate(data.departureDate) || '07/01/2026',
        adultChild: `${data.paxAdult || 1}/${data.paxChild || 0}`,
        roomRate: data.roomRate || '',
        ratePlan: data.ratePlan || 'COR18',
        frequentFlyer: data.frequentFlyer || '',
        hhonors: data.hiltonHonors || data.honorNo || '',
        folio: data.folioNo || '1162509 B',
        cashier: data.cashierId || 'SARA/SARA',
      },

      totals: {
        totalDebit: formatCurrency(totalDebit),
        totalCredit: formatCurrency(totalCredit),
        balance: formatCurrency(balance),
        totalEur: balancceInEuro,
     taxDetails: {
          // Tourism Tax (2%)
          tourismBase: formatCurrency(tourismBase),
          tourismVat: formatCurrency(tourismTax),
          tourismTotal: formatCurrency(tourismBase + tourismTax),
          
          // VAT (10%)
          vat10Base: formatCurrency(vat10Base),
          vat10Amount: formatCurrency(vat10Amount),
          vat10Total: formatCurrency(vat10Base + vat10Amount),
          
          // VAT (20%) - Other Services
          vat20Base: formatCurrency(vat20Base),
          vat20Amount: formatCurrency(vat20Amount),
          vat20Total: formatCurrency(vat20Base + vat20Amount),
        }
      },
      charges: allRows,
    };
  };

  // ── DATE FORMATTERS ───────────────────────────────────────────────────────
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch { return dateString; }
  };

  const formatDateLong = (dateString, timeString) => {
    if (!dateString) return '';
    return `${formatDate(dateString)} ${timeString || '11:40 AM'}`;
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === '') return '';
    return parseFloat(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ── PAGINATION ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (invoice && invoice.charges) {
      const pages = [];
      const totalTransactions = invoice.charges.length;

      for (let i = 0; i < totalTransactions; i += ROWS_PER_PAGE) {
        pages.push({
          charges: invoice.charges.slice(i, i + ROWS_PER_PAGE),
          pageNum: pages.length + 1,
          isLastPage: i + ROWS_PER_PAGE >= totalTransactions,
        });
      }

      if (pages.length === 0) {
        pages.push({ charges: [], pageNum: 1, isLastPage: true });
      }

      setPaginatedData(pages);
    }
  }, [invoice]);

  // ── PDF DOWNLOAD ──────────────────────────────────────────────────────────
// ── PDF DOWNLOAD ──────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    // Temporarily remove stylesheets that might cause print-media interference
    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => { style.parentNode?.removeChild(style); });

    try {
      // Ensure all images (like the Hilton logo) are fully loaded before capturing
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      await new Promise(resolve => setTimeout(resolve, 400));

      const opt = {
        margin: 0, 
        filename: `Hilton_Istanbul_${invoice.guestInfo.confirmationNumber || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: {
          scale: 2, 
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
          onclone: (clonedDoc) => {
            // 🔥 The magic fix: Force exact dimensions and padding on the cloned DOM
            // This prevents html2canvas from squeezing the layout or dropping margins
            
            const pages = clonedDoc.querySelectorAll('.invoice-page');
            pages.forEach(page => {
              page.style.width = '794px';
              page.style.minHeight = '1123px';
              page.style.margin = '0 auto';
              page.style.padding = '40px'; // Restores the exact whitespace you want
              page.style.boxSizing = 'border-box';
              page.style.background = '#fff';
              page.style.boxShadow = 'none';
            });

            // Ensure main container formatting doesn't restrict width
            if (clonedDoc.body) {
                clonedDoc.body.style.width = '794px';
                clonedDoc.body.style.margin = '0';
                clonedDoc.body.style.padding = '0';
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, 
        pagebreak: { mode: ['css', 'legacy'] },
      };

      await html2pdf().set(opt).from(invoiceRef.current).save();
      toast.success("PDF Downloaded Successfully");
    } catch (err) {
      console.error("❌ PDF Error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      // Restore the stylesheets for the web view
      headStyles.forEach(style => { 
        if (!style.parentNode) document.head.appendChild(style); 
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

  // ── RENDER ────────────────────────────────────────────────────────────────
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
      <div ref={invoiceRef}>
        <style>{`
          /* 🔥 EXACT PRINT & PDF RESET 🔥 */
          @page { 
            size: A4 portrait; 
            margin: 0 !important; /* Forces browsers to REMOVE default print headers (Dates, URLs, Jargon) */
          }
          
          body { 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          
        .invoice-page {
  font-family: Arial, sans-serif;
  font-size: 10px;
  color: #000;
  background-color: #fff;
  width: 794px;
  min-height: 1123px;
  margin: 0 auto;
  padding: 40px;
  box-sizing: border-box;
  position: relative;
  page-break-inside: avoid;
  page-break-after: always;
}

          .invoice-page:last-child {
            page-break-after: auto;
          }
            .change{
            padding-right: 40px !important ;
            }
            .change2{
            padding: 2px 10px !important ;
            }

          .header-container {
            display: flex;
            width: 100%;
          }

          .hotel-address-box {
            border: 1px solid #000;
            text-align: center;
            font-size: 10.5px;
            line-height: 1.4;
            width: 260px;
            margin-top: 20px;
          }
          
          .hotel-address-box p { margin: 0; }

          .right-info-table {
            border-collapse: collapse;
            font-size: 10.5px;
            width: 100%;
          }
          .right-info-table td {
            padding: 0.5px 0;
            vertical-align: top;
          }
          .right-info-table td:first-child { 
            width: 53%; 
          }

          .main-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 25px; 
            margin-top: 2px;
          }
          
        
          .main-table thead th { 
            border: 1.5px solid #000; 
            padding: 2px 4px; 
            font-weight: normal; 
            vertical-align: top;
          }
          
          .main-table tbody td { 
            padding: 2px 4px;
            line-height: 1.1;
            border: none; 
          }

          .main-table th.left-align,
          .main-table td.left-align { text-align: left; }
          
          .main-table th.center-align,
          .main-table td.center-align { text-align: right; }

          .main-table tfoot td {
             font-size: 10.5px;
             vertical-align: top;
          }

          .totals-padding-top {
             padding-top: 1px; 
          }

          .tax-table {
            width: 70%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-top: 30px;
          }
          .tax-table th, .tax-table td {
            padding: 1px 10px; 
            text-align: right;
            border: none;
            font-weight: normal;
          }
          .tax-table th:first-child, .tax-table td:first-child {
            text-align: left;
          }

          .signature-line {
            padding-left: 10px;        
          }

          .footer-section {
            position: absolute;
            bottom: 40px;
            left: 40px;
            right: 40px;
            display: flex;
            align-items: center;
          }

          /* Explicit Print Media Queries to block browser interference */
          @media print {
            body { background-color: #fff; }
            .invoice-page {
               box-shadow: none !important; 
               width: 794px !important;
               min-height: 1123px !important;
              //  padding: 20px !important;
            }
            .no-print { display: none !important; }
          }
        `}</style>

        {paginatedData.map((page, pageIdx) => (
          <div key={pageIdx} className="invoice-page">
            
            {/* TOP HEADER */}
            <div className="header-container">
              <div style={{ flex: 1 }}></div>
              <div style={{ flex: 1.2, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', paddingTop: '10px' }}>
                <img src={logo} alt="Hilton" style={{ width: '170px' }} />
              </div>
              <div style={{  display: 'flex', justifyContent: 'flex-end' }}>
                <div className="hotel-address-box">
                  <p>{invoice.hotelContact.name}</p>
                  <p>{invoice.hotelContact.addressLine1}</p>
                  <p>{invoice.hotelContact.city}</p>
                  <p>{invoice.hotelContact.country}</p>
                  <p>{invoice.hotelContact.phone}</p>
                  <p>Reservations</p>
                  <p>www.hilton.com or 1 800 HILTONS</p>
                </div>
              </div>
            </div>

            {/* GUEST & STAY INFO */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '45%', lineHeight: '1.2' }}>
               <div style={{ marginTop: '10px' }}>{invoice.guestInfo.guestName}</div>

                <div style={{ marginTop: '13px' }}>AZAR TOURISM SERVICES</div>
                <div style={{ marginTop: '16px' }}>ALGERIA SQUARE BUILDING NUMBER 12 </div>
                <div style={{ marginTop: '15px' }}>FIRST FLOOR</div>
                                <div> TRIPOLI</div>
                <div> LIBIYA.</div>

                <div style={{ marginTop: '16px' }}>*** INFORMATION BILL ***</div>

                <div style={{ marginTop: '5px' }}>Confirmation Number {invoice.guestInfo.confirmationNumber}</div>

              </div>

              <div style={{ width: '45%' }}>
                <table className="right-info-table">
                  <tbody>
                    <tr><td>Room Number</td><td>{invoice.roomDetails.roomNumber}</td></tr>
                    <tr><td>Arrival Date</td><td>{invoice.roomDetails.arrivalDate}</td></tr>
                    <tr><td>Departure Date</td><td>{invoice.roomDetails.departureDate}</td></tr>
                    <tr>
                      <td>RECEIPT-Number of Adults and<br/>Children</td>
                      <td>{invoice.roomDetails.adultChild}</td>
                    </tr>
                    <tr><td>Room Rate</td><td>{invoice.roomDetails.roomRate}</td></tr>
                    <tr><td>Rate Plan</td><td>{invoice.roomDetails.ratePlan}</td></tr>
                    <tr><td>Frequent Flyer</td><td>{invoice.roomDetails.frequentFlyer}</td></tr>
                    <tr><td>Hilton Honors</td><td>{invoice.roomDetails.hhonors}</td></tr>
                    <tr><td>Folio No./Check No.</td><td>{invoice.roomDetails.folio}</td></tr>
                    <tr><td>Cashier ID</td><td>{invoice.roomDetails.cashier}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            

            <div style={{ marginBottom: '2px' }}>
              {invoice.guestInfo.invoiceDateStr}
            </div>

            {/* MAIN TRANSACTIONS TABLE */}
            <table className="main-table">
              <thead>
                <tr>
                  <th className="left-align" style={{ width: '10%' }}>Date</th>
                  <th className="left-align" style={{ width: '38%' }}>Transaction Description</th>
                  <th className="left-align" style={{ width: '8%' }}>Cashier ID</th>
                  <th className="center-align" style={{ width: '10%', textAlign: 'center' }}>Transaction<br/>ID</th>
                  <th className="center-align" style={{ width: '10%', textAlign: 'center' }}>Debit</th>
                  <th className="center-align" style={{ width: '10%', textAlign: 'center' }}>Credit</th>
                  <th className="center-align" style={{ width: '10%', textAlign: 'center' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {page.charges.map((charge) => (
                  <tr key={charge.id}>
                    <td className="left-align">{charge.date}</td>
                    <td className="left-align">{charge.description}</td>
                    <td className="left-align">{charge.cashierId}</td>
                    <td className="center-align">{charge.transactionId}</td>
                    <td className="center-align">{charge.debit}</td>
                    <td className="center-align">{charge.credit}</td>
                    <td className="center-align">{charge.balance}</td>
                  </tr>
                ))}
              </tbody>
              
              {page.isLastPage && (
                <tfoot>
                  <tr>
                    <td colSpan="3" className="totals-padding-top"></td>
                    <td className="totals-padding-top" style={{ textAlign: 'right', paddingRight: '6px' }}>
                      Debit and<br/>Credit Totals
                    </td>
                    <td className="center-align totals-padding-top">
                      {invoice.totals.totalDebit}
                    </td>
                    <td className="center-align totals-padding-top">
                      {invoice.totals.totalCredit}
                    </td>
                    <td className="totals-padding-top"></td>
                  </tr>
                  
                  <tr>
                    <td colSpan="7" style={{ borderBottom: '1.5px solid #000', padding: 0, height: '4px' }}></td>
                  </tr>

                  <tr>
                    <td colSpan="3" style={{ paddingTop: '6px' }}></td>
                    <td style={{ textAlign: 'right', paddingRight: '13px', verticleAlign: 'middle' , paddingTop: "3px"}}>
                      Balance
                    </td>
                  
                    <td colSpan="2" ></td>
                    <td className="center-align" style={{paddingTop: "3px"}} >
                      {invoice.totals.balance} TL
                    </td>
                  
                  </tr>

                    <tr>
                    <td colSpan="3" ></td>
                  <td  colSpan="3"style={{ textAlign: 'left', paddingLeft: '23px', fontWeight: '600'}}>
                       Estimated Currency Total
                    </td>
                  
                    <td className="center-align" style={{fontWeight: "600"}} >
                      {invoice.totals.totalEur} EUR
                    </td>
                  
                  </tr>
                </tfoot>
              )}
            </table>

            {page.isLastPage && (
              <div>
                <table className="tax-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th className='change' style={{padding:"2px 10px !important"}}>Total Excluding VAT</th>
                      <th>VAT</th>
                      <th>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='change2'>Tourism Tax 2%</td>
                      <td className='change'>{invoice.totals.taxDetails.tourismBase}</td>
                      <td>{invoice.totals.taxDetails.tourismVat}</td>
                      <td>{invoice.totals.taxDetails.tourismTotal} TL</td>
                    </tr>
                    <tr>
                      <td className='change2'>VAT at 10%</td>
                      <td className='change'>{invoice.totals.taxDetails.vat10Base}</td>
                      <td>{invoice.totals.taxDetails.vat10Amount}</td>
                      <td>{invoice.totals.taxDetails.vat10Total} TL</td>
                    </tr>
                    <tr>
                      <td className='change2'>VAT at 20%</td>
                      <td className='change'>{invoice.totals.taxDetails.vat20Base}</td>
                      <td>{invoice.totals.taxDetails.vat20Amount}</td>
                      <td>{invoice.totals.taxDetails.vat20Total} TL</td>
                    </tr>
                    <tr>
                      <td className='change2'>Non Taxable Amount</td>
                      <td className='change'>0.00</td>
                      <td>0.00</td>
                      <td>0.00 TL</td>
                    </tr>
                    <tr>
                      <td className='change2'>Total Invoice Amount</td>
                      <td></td>
                      <td></td>
                      <td>{invoice.totals.balance} TL</td>
                    </tr>
                  </tbody>
                </table>

                <div className="signature-line" style={{padding: "2px 10px !important"}}> 
                  Guest Signature _______________________________________
                </div>
              </div>
            )}

            {/* FOOTER (Restructured to prevent absolute positioning overlap) */}
            <div className="footer-section">
              <div style={{ flex: 1, textAlign: 'left', fontSize: "9px" }}>
                Hotel VAT No., {invoice.hotelContact.vat},
              </div>
              <div style={{ flex: 1, textAlign: 'center', fontSize: "11px", fontWeight:"600" }}>
                Page:{page.pageNum}
              </div>
              <div style={{ flex: 1 }}></div>
            </div>
            
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default HiltonIstanbulInvoiceViewPage;
