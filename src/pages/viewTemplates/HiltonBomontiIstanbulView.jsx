
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import logo from "/Hilton-logo.png";

const HiltonBomontiIstanbulView = ({ invoiceData }) => {
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
      console.error("❌ Error fetching Hilton Bomonti invoice:", err);
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
    
    let currentTransactionId = parseInt(data.startingRefNo || '11500131', 10);
    if (isNaN(currentTransactionId)) currentTransactionId = 11500131;

    if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
      data.accommodationDetails.forEach((item, index) => {
        const amount = item.rate || item.guestCharge || item.chargesEgp || 0;
        const currentIdStr = currentTransactionId.toString();
        
        const accCashierId = data.accommodationRefId || item.cashierId || data.cashierId || 'BUTE';
        
        allRows.push({
          _rawDate: new Date(item.date).getTime(),
          _sortOrder: 0,
          id: `acc_${index}`,
          date: formatDate(item.date),
          description: item.description || `GUEST ROOM ( ${formatCurrency(amount)} EUR * 53.01 )`,
          cashierId: accCashierId,
          transactionId: currentIdStr,
          debit: formatCurrency(amount * 53.01),
          credit: '',
          balance: '',
        });

        const taxAmount = (amount * 53.01) * 0.10; 
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

    if (data.otherServices && Array.isArray(data.otherServices)) {
      data.otherServices.forEach((service, index) => {
        const srvCashierId = data.servicesRefId || service.cashierId || data.cashierId || 'BUBU';

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

    allRows.sort((a, b) => {
      if (a._rawDate !== b._rawDate) return a._rawDate - b._rawDate;
      return a._sortOrder - b._sortOrder;
    });

    const totalDebit = allRows.reduce((sum, row) => sum + parseFloat(row.debit.replace(/,/g, '') || 0), 0);
    const totalCredit = allRows.reduce((sum, row) => sum + parseFloat(row.credit.replace(/,/g, '') || 0), 0);
    const balance = totalDebit - totalCredit;
    const balancceInEuro = formatCurrency(data.totalInEur || 0);

    const tourismBase = data.taxableAmount || 0;
    const tourismTax = data.accommodationTax || 0;
    const vat10Base = data.taxableAmount || 0;
    const vat10Amount = data.totalVat10 || 0;

    return {
      refferenceNo: data.referenceNo,
      hotelContact: {
        name:  'HILTON ISTANBUL BOMONTI HOTEL &\nCONFERENCE CENTER',
        addressLine1: 'SILAHSOR CADDESI.NO. 42 BOMONTI SISLI',
        city: 'ISTANBUL . 343810',
        country: 'Turkiye',
        phone: 'TELEPHONE +902123753000 • FAX +902123753001',
        vat: data.vatNo || data.taxCardNo || '',
      },

      guestInfo: {
        guestName: (data.guestName || 'SALEM AHMED MOH TURKY').toUpperCase(),
        addressLine1: data.companyName || 'AZAR TOURISM SERVICES',
        addressLine2: data.address || 'Tripoli Tower Ground Floor Office no 50',
        city: data.city || 'Tripoli',
        country: data.country || 'Libya',
        poBox: data.poBox || '1254',
        landLine: data.landLine || '021 3330005 | 021 3330026',
        confirmationNumber: data.confNo || '3482969389',
        invoiceDateStr: `HILTON ISTANBUL BOMONTI HOTEL & CONFERENCE CENTER`,
      },

      roomDetails: {
        roomNumber: data.roomNo || '2437 /K1ES',
        arrivalDate: formatDate(data.arrivalDate) || '20/06/2026',
        departureDate: formatDate(data.departureDate) || '24/06/2026',
        adultChild: `${data.paxAdult || 1}/${data.paxChild || 0}`,
        roomRate: data.roomRate || '200.00 EUR',
        ratePlan: data.ratePlan || 'COR509',
        frequentFlyer: data.frequentFlyer || '',
        hhonors: data.hiltonHonors || data.honorNo || '',
        folio: data.folioNo || '1218016 B',
        cashier: data.cashierId || 'AFCA/AFIFE',
      },

      totals: {
        totalDebit: formatCurrency(totalDebit),
        totalCredit: formatCurrency(totalCredit),
        balance: formatCurrency(balance),
        totalEur: balancceInEuro,
        taxDetails: {
          tourismBase: formatCurrency(tourismBase),
          tourismVat: formatCurrency(tourismTax),
          tourismTotal: formatCurrency(tourismBase + tourismTax),
          vat10Base: formatCurrency(vat10Base),
          vat10Amount: formatCurrency(vat10Amount),
          vat10Total: formatCurrency(vat10Base + vat10Amount),
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
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => { style.parentNode?.removeChild(style); });

    invoiceRef.current.classList.add('pdf-export-mode');

    try {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      await new Promise(resolve => setTimeout(resolve, 400));

      const opt = {
        margin: 0, 
        filename: `${invoice.refferenceNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: {
          scale: 2, 
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
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
      invoiceRef.current?.classList.remove('pdf-export-mode');
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
      {/* FULL-SCREEN SOLID BACKDROP FOR CLEAN TRANSITION */}
      {pdfLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #111111',
            borderRadius: '50%',
            width: '35px',
            height: '35px',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ marginTop: '16px', fontSize: '13px', color: '#111', fontWeight: '500' }}>
            Preparing your PDF download...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <div ref={invoiceRef}>
        <style>{`
          @page { 
            size: A4 portrait; 
            margin: 0 !important;
          }
          
          body { 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          
          .invoice-page {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            color: #000;
            background-color: #fff;
            width: 794px;
            height: 1123px;
            margin: 0 auto;
            padding: 50px 45px 50px 20px;
            box-sizing: border-box;
            position: relative;
            page-break-inside: avoid;
            page-break-after: always;
          }

          .invoice-page:last-child {
            page-break-after: auto;
          }

          .pdf-export-mode .invoice-page {
            height: 1123px !important;
            max-height: 1123px !important;
            overflow: hidden !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          .header-container {
            display: flex;
            width: 100%;
            justify-content: space-between;
            align-items: flex-start;
          }

          .hotel-address-box {
            border: 1px solid #000;
            text-align: center;
            font-size: 13.5px;
            line-height: 1.3;
            width: 340px;
            padding: 2px 8px 2px 2px;
          }
          
          .hotel-address-box p { 
            margin: 0; 
            white-space: pre-line;
          }

          .guest-info-section {
            width: 82%;
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            line-height: 1.6;
            font-size: 9.5px !important;
          }

          .right-info-table {
            border-collapse: collapse;
            width: 250px;
          }
          
          .right-info-table td {
            padding: 1px 0;
            vertical-align: top;
          }
          .right-info-table td:first-child { 
            width: 65%; 
          }

          .main-table { 
            width: 82%; 
            border-collapse: collapse; 
            margin-top: 2px;
            font-size: 8.5px !important;
          }
          
          .main-table thead th { 
            border: 1px solid #000; 
            padding: 2px 5px 6px 5px; 
            font-weight: normal; 
            vertical-align: middle;
            font-size: 9px;
          }
          
          .main-table tbody td { 
            padding: 3px 5px;
            line-height: 1.3;
            border: none; 
          }

          .main-table th.left-align,
          .main-table td.left-align { text-align: left; }
          
          .main-table th.center-align,
          .main-table td.center-align { text-align: center; }

          .main-table th.right-align,
          .main-table td.right-align { text-align: right; }

          .tax-table {
            width: 400px;
            border-collapse: collapse;
            font-size: 9px;
            margin-top: 40px;
          }
          .tax-table th, .tax-table td {
            padding: 3px 10px; 
            text-align: right;
            border: none;
            font-weight: normal;
          }
          .tax-table th:first-child, .tax-table td:first-child {
            text-align: left;
            padding-left: 0;
            width: 130px;
          }

          .signature-line {
            margin-top: 40px;
            font-size: 9px;
          }

          @media print {
            body { background-color: #fff; }
            .invoice-page {
               box-shadow: none !important; 
               width: 794px !important;
               height: 1123px !important;
            }
            .no-print { display: none !important; }
          }
        `}</style>

        {paginatedData.map((page, pageIdx) => (
          <div key={pageIdx} className="invoice-page">
            
            {/* TOP HEADER */}
            <div className="header-container">
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <img src={logo} alt="Hilton" style={{ width: '190px', marginTop: '10px' }} />
              </div>
              <div className="hotel-address-box">
                <p>{invoice.hotelContact.name}</p>
                <p style={{ marginTop: '10px' }}>{invoice.hotelContact.addressLine1}</p>
                <p>{invoice.hotelContact.city}</p>
                <p>{invoice.hotelContact.country}</p>
                <p style={{ marginTop: '8px' }}>{invoice.hotelContact.phone}</p>
                <p>Reservations</p>
                <p>www.hilton.com or 1 800 HILTONS</p>
              </div>
            </div>

            {/* GUEST & STAY INFO */}
            <div className="guest-info-section">
              <div style={{ width: '50%', paddingTop: '25px' }}>
                <div>{invoice.guestInfo.addressLine1}</div>
                <div>{invoice.guestInfo.addressLine2}</div>
                <div>{invoice.guestInfo.city}, {invoice.guestInfo.country}</div>
                <div>P.O.BOX Number: {invoice.guestInfo.poBox}</div>
                <div style={{ marginBottom: '20px' }}>Land Line: {invoice.guestInfo.landLine}</div>
                
                <div>** INVOICE **</div>
                <div>Confirmation Number {invoice.guestInfo.confirmationNumber}</div>
                <div style={{ marginTop: '5px' }}>{invoice.guestInfo.guestName}</div>
              </div>

              <div>
                <table className="right-info-table">
                  <tbody>
                    <tr><td>Room Number</td><td>{invoice.roomDetails.roomNumber}</td></tr>
                    <tr><td>Arrival Date</td><td>{invoice.roomDetails.arrivalDate}</td></tr>
                    <tr><td>Departure Date</td><td>{invoice.roomDetails.departureDate}</td></tr>
                    <tr>
                      <td>Number of Adults and Children</td>
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

            <div style={{ marginBottom: '4px', marginTop: '30px', textTransform: 'uppercase' }}>
              {invoice.guestInfo.invoiceDateStr}
            </div>

            {/* MAIN TRANSACTIONS TABLE */}
            <table className="main-table">
              <thead>
                <tr>
                  <th className="left-align" style={{ width: '12%' }}>Date</th>
                  <th className="left-align" style={{ width: '31%' }}>Transaction Description</th>
                  <th className="left-align" style={{ width: '10%', textAlign: 'center' }}>Cashier ID</th>
                  <th className="left-align" style={{ width: '13%', textAlign: 'center' }}>Transaction ID</th>
                  <th className="right-align" style={{ width: '14%', textAlign: 'center' }}>Debit</th>
                  <th className="right-align" style={{ width: '12%', textAlign: 'center' }}>Credit</th>
                  <th className="right-align" style={{ width: '10%', textAlign: 'center' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {page.charges.map((charge) => (
                  <tr key={charge.id}>
                    <td className="left-align">{charge.date}</td>
                    <td className="left-align">{charge.description}</td>
                    <td className="left-align">{charge.cashierId}</td>
                    <td className="left-align" style={{ textAlign: 'right' }}>{charge.transactionId}</td>
                    <td className="right-align" style={{paddingRight: "2px"}}>{charge.debit}</td>
                    <td className="right-align">{charge.credit}</td>
                    <td className="right-align">{charge.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          {/* TOTALS & BALANCES SECTION */}
            {page.isLastPage && (
              <div style={{ marginTop: '2px', width: '81%', fontSize: '8.5px' }}>
                <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '12%' }}></td>
                      <td style={{ width: '33%' }}></td>
                      <td style={{ width: '10%' }}></td>
                      <td style={{ width: '15%', textAlign: 'right', paddingRight: '23px' }}>
                        Debit and<br />Credit Totals
                      </td>
                      <td style={{ width: '10%', textAlign: 'right', verticalAlign: 'top'}}>
                        {invoice.totals.totalDebit}
                      </td>
                      <td style={{ width: '8%', textAlign: 'right', verticalAlign: 'bottom' }}>
                        {invoice.totals.totalCredit}
                      </td>
                      <td style={{ width: '10%' }}></td>
                    </tr>
                    
                    {/* Continuous solid line across all columns */}
                    <tr>
                      <td colSpan="7" style={{ padding: '2px 0' }}>
                        <div style={{ width: '100%', borderTop: '2px solid black' }}></div>
                      </td>
                    </tr>

                    {/* 1. Balance Row */}
                    <tr>
                      <td colSpan="3"></td>
                      <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '23px', whiteSpace: 'nowrap' }}>
                        Balance
                      </td>
                      <td colSpan="2"></td>
                      <td style={{ textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {invoice.totals.balance} TL
                      </td>
                    </tr>

                    {/* 2. Patches Row (Aligned over the dots gap and the value) */}
                    {/* <tr> */}
                      {/* <td colSpan="3" style={{ verticalAlign: 'middle', padding: '1px 0' }}>
                        <div style={{ display: 'flex', gap: '30px' }}>
                          <div style={{ width: '70px', borderTop: '2px solid black' }}></div>
                          <div style={{ width: '70px', borderTop: '2px solid black' }}></div>
                        </div>
                      </td> */}
                      {/* Empty cell matching the width of the Balance/Currency labels column */}
                      {/* <td></td> */}
                      {/* Right line extending across the gap and the amount column */}
                      {/* <td colSpan="3" style={{ padding: '1px 0' }}>
                        <div style={{ width: '88px', borderTop: '2px solid black', marginRight: 'auto' , marginLeft: "-19px"}}></div>
                      </td> */}
                    {/* </tr> */}

                    {/* 3. Estimated Currency Row */}
                    <tr>
                      <td colSpan="3"></td>
                      <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '23px', whiteSpace: 'nowrap' }}>
                        Estimated Currency Total
                      </td>
                      <td colSpan="2"></td>
                      <td style={{ textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {invoice.totals.totalEur} EUR
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {page.isLastPage && (
              <div>
                <table className="tax-table" style={{ width: '390px', marginTop: '30px', borderCollapse: 'collapse', fontSize: '9px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', width: '160px', padding: '2px 0' }}></th>
                      <th style={{ textAlign: 'right', width: '120px', padding: '2px 0' }}>Total Excluding VAT</th>
                      <th style={{ textAlign: 'right', width: '100px', padding: '2px 0' }}>VAT</th>
                      <th style={{ textAlign: 'right', width: '120px', padding: '2px 0' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left', padding: '2px 0' }}>Tourism TAX 1%</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>{invoice.totals.taxDetails.tourismBase}</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>{invoice.totals.taxDetails.tourismVat}</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>{invoice.totals.taxDetails.tourismTotal} TL</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', padding: '2px 0' }}>VAT at %10</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>{invoice.totals.taxDetails.vat10Base}</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>{invoice.totals.taxDetails.vat10Amount}</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>{invoice.totals.taxDetails.vat10Total} TL</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', padding: '2px 0' }}>Non Taxable Amount</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>0.00</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>0.00</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>0.00 TL</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', padding: '2px 0' }}>Total Invoice Amount</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}></td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}></td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>{invoice.totals.balance} TL</td>
                    </tr>
                  </tbody>
                </table>

                <div className="signature-line" style={{ marginTop: '30px', fontSize: '9px' }}>
                  Guest Signature <span style={{ display: 'inline-block', width: '250px', borderBottom: '1px solid black', margin: '0 0 -2px 5px' }}></span>
                </div>
              </div>
            )}

            {/* DYNAMIC PAGE NUMBER FOOTER */}
            <div style={{
              position: 'absolute',
              bottom: '25px',
              left: '0',
              width: '100%',
              textAlign: 'center',
              fontSize: '8.5px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Page:{page.pageNum}
            </div>
            
          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default HiltonBomontiIstanbulView;