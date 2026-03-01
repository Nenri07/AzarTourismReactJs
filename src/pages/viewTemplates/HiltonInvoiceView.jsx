import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import logo from "../../../public/Hilton-logo.png";

const HiltonInvoiceViewPage = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(!invoiceData);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);
  const ROWS_PER_PAGE = 30;

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

      // Unwrap nested data same pattern as Radisson
      let rawData = response.data || response;
      if (rawData.data) {
        rawData = rawData.data;
        if (rawData.data) {
          rawData = rawData.data;
        }
      }

      setInvoice(transformInvoiceData(rawData));
    } catch (err) {
      console.error("❌ Error fetching Hilton invoice:", err);
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

    // Generate a random 5-letter uppercase string for other services (once per invoice)
    
    
    // 1. Gather Accommodation Rows
    if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
      data.accommodationDetails.forEach((item, index) => {
        const rateString   = String(item.rateLabel || '');
        const rateParts    = rateString.split(' * ');
        
        const rateVal      = rateParts[0] || (data.usdAmount ? `${formatCurrency(data.usdAmount)} USD` : '');
        const exchVal      = rateParts[1] 
                              ? `* ${rateParts[1]}` 
                              : (item.exchangeRateCol ? `* ${item.exchangeRateCol}` : (data.exchangeRate ? `* ${data.exchangeRate}` : ''));

        allRows.push({
          _rawDate:    new Date(item.date).getTime(),
          _sortOrder:  0, // accommodation rows sort before same-day services
          id:          `acc_${index}`,
          date:        formatDate(item.date),
          description: item.description || 'ACCOMMODATION',
          rate:        rateVal,
          exchangeRate: exchVal,
          refId:       data.accommodationRefId,
          guestCharge: formatCurrency(item.guestCharge || item.chargesEgp || 0),
          credit:      '',
          amount:      '',
        });
      });
    }

    // 2. Gather Services Rows
    if (data.otherServices && Array.isArray(data.otherServices)) {
      data.otherServices.forEach((service, index) => {
        allRows.push({
          _rawDate:    new Date(service.date).getTime(),
          _sortOrder:  1, // services after accommodation on same day
          id:          `srv_${index}`,
          date:        formatDate(service.date),
          description: service.name || 'Service',
          rate:        '',
          exchangeRate: '',
          refId:       data.servicesRefId, // <-- Uses the random 5-letter ID generated above
          guestCharge: formatCurrency(service.amount || 0),
          credit:      '',
          amount:      '',
        });
      });
    }

    // 3. Sort chronologically
    allRows.sort((a, b) => {
      if (a._rawDate !== b._rawDate) return a._rawDate - b._rawDate;
      return a._sortOrder - b._sortOrder;
    });

    // 4. Assign sequential Ref Numbers to the perfectly sorted array
    let currentRefNo = data.startingRefNo;
    const charges = allRows.map(({ _rawDate, _sortOrder, ...row }) => {
      // Force an unbroken ascending sequence for every single row
      row.refNo = (currentRefNo++).toString();
      return row;
    });

    // Extract dynamic address to replace hardcoded strings
    const addressParts = data.address ? data.address.split(',') : [];
    const addressLine1 = addressParts[0] ? addressParts[0].trim() : 'Algeria Square Building Number 12 First Floor,';
    const addressLine2 = addressParts.slice(1).join(',').trim() || 'Tripoli ,Libya';

    return {
      // Hotel header block
      hotelContact: {
        name:    data.hotel       || 'HILTON ZAMALEK RESIDENCE CAIRO',
        address: '24 Mohamed Mazhar St., Zamalek',
        city:    'Cairo, 11241, Egypt',
        phone:   'TELEPHONE +20227371202 • FAX +20227371202',
        vat:     data.vatNo       || data.taxCardNo || data.vatNumber || '',
      },

      // Left guest block
      guestInfo: {
        referenceNo:        data.referenceNo,
        company:            data.companyName        || 'Azar Tourism Services',
        addressLine1:       addressLine1, // Dynamic Address Part 1
        addressLine2:       addressLine2, // Dynamic Address Part 2
        city:               '',
        country:            '',
        invoiceCopy:        data.invoiceCopyNo      || data.invoiceNo || '', // Mapped from new JSON
        confirmationNumber: data.confNo             || '',
        guestName:          (data.guestName         || '').toUpperCase(),
        hotelDetails:       `${data.hotel || 'HILTON ZAMALEK RESIDENCE CAIRO'} ${formatDate(data.invoiceDate)} ${data.invoiceTime || ''}`,
      },

      // Right room block
      roomDetails: {
        roomNumber:    data.roomNo          || '',
        arrivalDate:   formatDateLong(data.arrivalDate, data.checkInTime),
        departureDate: formatDateLong(data.departureDate, data.checkOutTime),
        adultChild:    `${data.paxAdult || 1}/${data.paxChild || 0}`,
        cashier:       data.cashierId       || '',
        roomRate:      data.roomAmountEgp   ? formatCurrency(data.roomAmountEgp) : '', // Mapped
        ratePlan:      data.ratePlan        || data.customRef || '', // Mapped
        al:            data.aL              || data.al || '', // Mapped
        hhonors:       data.honorNo         || data.ihgRewardsNumber || '', // Mapped
        vat:           data.vatNo           || data.taxCardNo || '', // Mapped
        folio:         data.folioNo         || '',
      },

      // Totals
      totals: {
        totalEGP: formatCurrency(data.grandTotalEgp  || 0),
        totalUSD: formatCurrency(data.balanceUsd      || 0),
        balance:  '0.00',
      },

      charges,
    };
  };

  // ── DATE FORMATTERS ───────────────────────────────────────────────────────
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const dd   = String(d.getDate()).padStart(2, '0');
      const mm   = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch { return dateString; }
  };

  const formatDateLong = (dateString, timeString) => {
    if (!dateString) return '';
    return `${formatDate(dateString)} ${timeString || '00:00'}`;
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
          charges:    invoice.charges.slice(i, i + ROWS_PER_PAGE),
          pageNum:    pages.length + 1,
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

    const headStyles = Array.from(document.head.querySelectorAll('link[relstylesheet], style'));
    headStyles.forEach(style => { style.parentNode.removeChild(style); });

    try {
      const images = invoiceRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin: 0,
        filename: `${invoice.guestInfo.referenceNo }.pdf`,
        image: { type: 'jpeg', quality: 3 },
        html2canvas: {
          scale: 4,
          useCORS: true,
          letterRendering: true,
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
      headStyles.forEach(style => { document.head.appendChild(style); });
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
          @page { size: A4; margin: 6mm; }
          body { margin: 0; padding: 0; }
          
          .invoice-page {
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #000;
            background-color: #fff;
            width: 100%;
            max-width: 794px;
            min-height: 296mm;
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

          /* Top Information Area */
          .info-section {
            display: flex;
            width: 100%;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          
          .left-info {
            width: 55%; 
            line-height: 1.5;
          }
          .left-info p { margin: 0; }
          
          .right-info-wrapper {
            width: 45%; 
            display: flex;
            justify-content: flex-start; 
          }

          .spacing-top { margin-top: 70px !important; }
          .spacing-top-small { margin-top: 15px !important; }

          /* Right Information Table */
          .right-info-table {
            border-collapse: collapse;
            font-size: 11px;
            margin-right: 20px;
          }
          .right-info-table td {
            padding: 0 10px 2px 0;
            vertical-align: top;
          }
          .right-info-table td:first-child { width: 160px; }

          /* Main Data Table */
          .main-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
          .main-table thead { border: 1px solid #000; }
          thead { vertical-align: top; }
          .main-table thead th { border-right: 1px solid #000; padding: 3px 5px; text-align: center; font-weight: normal; }
          .main-table thead th:last-child { border-right: none; }
          .main-table thead th.left-align { text-align: left; }
          
          .main-table tbody td { padding: 2.5px 5px; text-align: center; border: none; }
          .main-table tbody td:nth-child(3) { text-align: right; padding-right: 2px; white-space: nowrap; }
          .main-table tbody td:nth-child(4) { text-align: left; padding-left: 2px; white-space: nowrap; }
          .main-table tbody td.left-align { text-align: left; }
          .main-table tbody td.right-align { text-align: right; }

          /* Totals Area */
          .totals-divider { border-top: 1px solid #000; margin-top: 5px; margin-bottom: 5px; height: 0; }
          .totals-table { float: right; border-collapse: collapse; font-size: 11px; width: 300px; }
          .totals-table td { padding: 3px 5px; }
          .totals-table td:last-child { text-align: right; }
          
          .clearfix::after { content: ""; clear: both; display: table; }

          @media print {
            .invoice-page { padding: 20px; box-shadow: none; min-height: auto; }
            .no-print { display: none !important; }
          }
        `}</style>

        {paginatedData.map((page, pageIdx) => (
          <div key={pageIdx} className="invoice-page" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
            
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: '20px', width: '100%' }}>
              
              <img 
                src={logo} 
                alt="Hilton Hotels & Resorts" 
                style={{ width: '160px', height: 'auto', objectFit: 'contain' }} 
              />
              
              <div style={{
                position: 'absolute',
                right: '0',
                top: '0',
                border: '1px solid #000',
                padding: '2px 6px 2px 2px',
                textAlign: 'center',
                fontSize: '11px',
                lineHeight: '1.6',
                color: '#000000',
                backgroundColor: '#ffffff'
              }}>
                <p style={{ margin: 0 }}>HILTON ZAMALEK RESIDENCE CAIRO</p>
                <p style={{ margin: 0 }}>24 MOHAMEDMAZHERSTREET, ZAMALEK</p>
                <p style={{ margin: 0 }}>CAIRO, 11241</p>
                <p style={{ margin: 0 }}>Egypt</p>
                <p style={{ margin: 0 }}>TELEPHONE +20227371202 • FAX +20227371202</p>
                <p style={{ margin: 0 }}>Reservations</p>
                <p style={{ margin: 0 }}>www.hilton.com or 1 800 HILTONS</p>
              </div>
            </div>

            <div className="info-section">
              <div className="left-info" style={{ color: '#000000' }}>
                <p>{invoice.guestInfo.company}</p>
                <p>{invoice.guestInfo.addressLine1}</p>
                <p>{invoice.guestInfo.addressLine2}</p>
                <p>{invoice.guestInfo.city}</p>
                <p>{invoice.guestInfo.country}</p>

                <p className="spacing-top">COPY OF INVOICE:{invoice.guestInfo.invoiceCopy}</p>

                <p className="spacing-top-small">Confirmation Number: {invoice.guestInfo.confirmationNumber}</p>
                <p>{invoice.guestInfo.guestName}</p>
                <p>{invoice.guestInfo.hotelDetails}</p>
              </div>

              <div className="right-info-wrapper" style={{ color: '#000000' }}>
                <table className="right-info-table">
                  <tbody>
                    <tr><td>Room Number</td><td>{invoice.roomDetails.roomNumber}</td></tr>
                    <tr><td>Arrival Date</td><td>{invoice.roomDetails.arrivalDate}</td></tr>
                    <tr><td>DepartureDate</td><td>{invoice.roomDetails.departureDate}</td></tr>
                    <tr><td>Adult/Child</td><td>{invoice.roomDetails.adultChild}</td></tr>
                    <tr><td>Cashier</td><td>{invoice.roomDetails.cashier}</td></tr>
                    <tr><td>RoomRate</td><td>{invoice.roomDetails.roomRate}</td></tr>
                    <tr><td>RatePlan</td><td>{invoice.roomDetails.ratePlan}</td></tr>
                    <tr><td>AL</td><td>{invoice.roomDetails.al}</td></tr>
                    <tr><td>Hhonors#</td><td>{invoice.roomDetails.hhonors}</td></tr>
                    <tr><td>VAT #</td><td>{invoice.roomDetails.vat}</td></tr>
                    <tr><td>Folio No/Che</td><td>{invoice.roomDetails.folio}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <table className="main-table" style={{ color: '#000000' }}>
              <thead>
                <tr>
                  <th className="left-align">DATE</th>
                  <th className="left-align">DESCRIPTION</th>
                  <th>Rate</th>
                  <th>Exchange<br />Rate</th>
                  <th>ID</th>
                  <th>REFNO</th>
                  <th>GUEST CHARGE</th>
                  <th>CREDIT</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {page.charges.map((charge) => (
                  <tr key={charge.id}>
                    <td className="left-align">{charge.date}</td>
                    <td className="left-align">{charge.description}</td>
                    <td>{charge.rate}</td>
                    <td>{charge.exchangeRate}</td>
                    <td>{charge.refId}</td>
                    <td>{charge.refNo}</td>
                    <td className="right-align">{charge.guestCharge}</td>
                    <td>{charge.credit}</td>
                    <td>{charge.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {page.isLastPage && (
              <>
                <div className="totals-divider"></div>
                <div className="clearfix" style={{ color: '#000000' }}>
                  <table className="totals-table">
                    <tbody>
                      <tr>
                        <td>**TOTAL**</td>
                        <td>EGP {invoice.totals.totalEGP}</td>
                      </tr>
                      <tr>
                        <td>**TOTAL IN USD**</td>
                        <td>USD {invoice.totals.totalUSD}</td>
                      </tr>
                      <tr>
                        <td>**BALANCE**</td>
                        <td>EGP {invoice.totals.balance}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default HiltonInvoiceViewPage;