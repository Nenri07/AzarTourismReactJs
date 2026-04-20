import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ukInvoiceApi from '../../Api/ukInvoice.api'; 
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import { calcVAT, parseNum } from '../../utils/invoiceCalculationsUK';

// Real data flows from API
const dummyInvoiceData = null;

const FourSeasonParkLaneView = ({ invoiceData }) => {
  const { invoiceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [paginatedData, setPaginatedData] = useState([]);
  const invoiceRef = useRef(null);

  const isPdfDownload = location.pathname.includes("/download-pdf");

  useEffect(() => {
    if (invoiceData) {
      setInvoice(transformInvoiceData(invoiceData));
      setLoading(false);
    } else if (invoiceId) {
      fetchInvoiceData();
    } else {
      setLoading(false);
    }
  }, [invoiceData, invoiceId]);

  useEffect(() => {
    if (isPdfDownload && invoice && invoiceRef.current) {
      const timer = setTimeout(async () => {
        await handleDownloadPDF();
        navigate("/invoices", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await ukInvoiceApi.getInvoiceById(invoiceId);
      
      let rawData = response.data || response;
      if (rawData.data) {
        rawData = rawData.data;
        if (rawData.data) {
          rawData = rawData.data;
        }
      }
      
      setInvoice(transformInvoiceData(rawData));
    } catch (err) {
      console.error("Error fetching Four Seasons invoice:", err);
      setError("Failed to load invoice data.");
      toast.error("Failed to load invoice from API.");
    } finally {
      setLoading(false);
    }
  };

  const transformInvoiceData = (data) => {
    if (!data) return null;

    const items = [];
    
    // 1. Accommodation Details
    const accDetails = data.accommodationDetails || data.accommodation_details || [];
    accDetails.forEach(item => {
        items.push({
            date: formatDate(item.date),
            rawDate: new Date(item.date),
            text: (item.text || item.description || "").toUpperCase().includes("GUEST ROOM") 
                  ? "Accommodation" 
                  : (item.text || item.description || "Accommodation"),
            reference: item.reference || item.refNo || item.ref_no || "",
            debitGBP: item.chargesGbp || item.guest_charges || item.debit ? formatCurrency(item.chargesGbp || item.guest_charges || item.debit) : "",
            creditGBP: item.creditsGbp || item.credit ? formatCurrency(item.creditsGbp || item.credit) : "",
            type: 'accommodation'
        });
    });

    // 2. Other Services
    const otherSvc = data.otherServices || data.other_services || [];
    otherSvc.forEach(svc => {
        items.push({
            date: formatDate(svc.date),
            rawDate: new Date(svc.date),
            text: svc.name || svc.text || svc.service_name || "Service",
            reference: svc.reference || svc.refNo || svc.ref_no || "",
            debitGBP: svc.amount || svc.chargesGbp || svc.total || svc.debit ? formatCurrency(svc.amount || svc.chargesGbp || svc.total || svc.debit) : "",
            creditGBP: svc.creditsGbp || svc.credit ? formatCurrency(svc.creditsGbp || svc.credit) : "",
            type: 'service'
        });
    });

    items.sort((a, b) => {
      const timeDiff = a.rawDate.getTime() - b.rawDate.getTime();
      if (timeDiff !== 0) return timeDiff;
      if (a.type === 'accommodation' && b.type !== 'accommodation') return -1;
      if (a.type !== 'accommodation' && b.type === 'accommodation') return 1;
      return 0;
    });

    return {
      guestName: data.guestName || data.guest_name || "",
      companyNames: data.companyNames || data.company_name || "",
      companyAddress: "Algeria Square Building Number 12 First Floor\nTripoli Libya",
      roomNo: data.roomNo || data.room_number || "",
      arrivalDate: data.arrivalDate || data.arrival_date || "",
      departureDate: data.departureDate || data.departure_date || "",
      invoiceDate: data.invoiceDate || data.tax_date || new Date(),
      folioNo: data.folioNo || data.folio_no || "",
      cashierNo: data.cashierNo || data.cashier_no || "",
      vatNo: data.vatNo || data.vat_no || "",
      
      items,
      formattedInvoiceDate: formatDate(data.invoiceDate || data.tax_date || new Date()),
      formattedArrivalDate: formatDate(data.arrivalDate || data.arrival_date),
      formattedDepartureDate: formatDate(data.departureDate || data.departure_date),
      
      grandTotalGbp: data.grandTotalGbp || data.grand_total_gbp || data.totalAmountPayable || 0,
      creditsTotal: data.creditsTotal || data.credits_total || 0,
      totalAmountPayable: data.totalAmountPayable || data.grand_total_gbp || data.grandTotalGbp || 0,
      taxableAmountExclVat: data.taxableAmountExclVat || data.total_net_excl_vat || calcVAT(data.grandTotalGbp || data.grand_total_gbp || data.totalAmountPayable || 0).net,
      vatAt20Percent: data.vatAt20Percent || data.total_vat_20 || calcVAT(data.grandTotalGbp || data.grand_total_gbp || data.totalAmountPayable || 0).vat,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
    } catch { return dateString; }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "") return "";
    return parseFloat(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    if (invoice && invoice.items) {
      const pages = [];
      const items = invoice.items;
      const totalTx = items.length;

      if (totalTx <= 14) {
        if (totalTx >= 10) {
          // Special case: 10-14 items. Show all items + Total on page 1, VAT on page 2.
          pages.push({
            items: items,
            pageNum: 1,
            showTotal: true,
            showVat: false,
            isLastPage: false
          });
          pages.push({
            items: [],
            pageNum: 2,
            showTotal: false,
            showVat: true,
            isLastPage: true
          });
        } else {
          // Less than 10 items: All on one page
          pages.push({
            items: items,
            pageNum: 1,
            showTotal: true,
            showVat: true,
            isLastPage: true
          });
        }
      } else {
        // More than 14 items: Chunk into 15 items per page
        const CHUNK_SIZE = 14;
        for (let i = 0; i < totalTx; i += CHUNK_SIZE) {
          const isLastChunk = (i + CHUNK_SIZE) >= totalTx;
          pages.push({
            items: items.slice(i, i + CHUNK_SIZE),
            pageNum: pages.length + 1,
            showTotal: isLastChunk,
            showVat: isLastChunk,
            isLastPage: isLastChunk
          });
        }
      }
      
      setPaginatedData(pages);
    }
  }, [invoice]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
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
        filename: `Four_Seasons_Invoice_${invoice.folioNo || 'Invoice'}.pdf`,
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
          document.head.appendChild(style);
      });
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading || !invoice) {
    return (
      <InvoiceTemplate loading={loading} error={error} invoice={invoice} onBack={() => navigate("/invoices")}>
        <></>
      </InvoiceTemplate>
    );
  }

  const totalCharges = invoice.grandTotalGbp || 0;
  const totalCredits = invoice.creditsTotal || 0;
  const { net: netAmount, vat: vatAmount } = calcVAT(totalCharges);
  const balanceDue = totalCharges - totalCredits;

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
      <div ref={invoiceRef} className="fs-invoice-wrapper">
        <style dangerouslySetInnerHTML={{__html: `
          .fs-invoice-wrapper {
            overflow: hidden !important;
          }
          .fs-invoice-wrapper * {
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            box-sizing: border-box;
          }
          
          .fs-page {
            width: 210mm;
            min-height: 296mm; /* Full A4 height */
            padding: 5mm 5mm !important; 
            margin: 0 auto;
            background-color: #ffffff;
            position: relative; 
            display: flex;
            flex-direction: column;
            line-height: 1.4;
            overflow: hidden; 
          }

          .fs-page:not(:last-child) {
            page-break-after: always;
          }
          .fs-page:last-child {
            page-break-after: auto !important;
            margin-bottom: 0 !important;
          }
          
          @media print {
            @page { 
              margin: 0; 
              size: A4 portrait;
            }
            body * { visibility: hidden; }
            .fs-invoice-wrapper, .fs-invoice-wrapper * { visibility: visible; }
            .fs-invoice-wrapper {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            body { background: none; margin: 0; padding: 0; }
            .fs-page { 
              padding: 5mm 3mm !important; 
              margin: 0 !important; 
              box-shadow: none !important; 
              width: 100% !important;
              height: 297mm !important; 
              page-break-after: always;
            }
            .fs-page:last-child {
              page-break-after: auto !important; 
            }
            .fs-footer {
              bottom: 15mm !important;
              left: 0 !important;
              width: 100% !important;
            }
          }

          .fs-invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 13px;
          }
          .fs-invoice-table th {
              font-weight: bold;
              text-align: left;
              color: #222;
          }
          .fs-invoice-table td {
              padding: 8px 5px;
              text-align: left;
              vertical-align: top;
          }
          .fs-invoice-table th.right-align, .fs-invoice-table td.right-align { text-align: right; }

          .fs-footer {
              position: absolute;
              bottom: 30px;
              left: 40px;
              right: 40px;
              text-align: center;
              font-family: Arial, sans-serif;
              color: #000;
              letter-spacing: 0.5px;
          }
        `}} />

        {paginatedData.map((page, idx) => (
          <div key={idx} className="fs-page">
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <img src="/fourseasonparklane-logo.png" alt="Four Seasons Park Lane" style={{ width: '130px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', minHeight: '120px', paddingLeft: '30px' }}>
                <div style={{ width: '50%', fontWeight: 'bold' }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                        {invoice.guestName}<br/>
                        {invoice.companyAddress}
                    </div>
                </div>

                <div style={{ width: '33%' }}>
                    <div style={{ display: 'flex', marginBottom: '4px' }}>
                        <div style={{ width: '105px', fontWeight: 'bold' }}>Room No</div>
                        <div style={{ flex: 1, textAlign: 'left' }}>{invoice.roomNo}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '4px' }}>
                        <div style={{ width: '105px', fontWeight: 'bold' }}>Arrival</div>
                        <div style={{ flex: 1, textAlign: 'left' }}>{invoice.formattedArrivalDate}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '4px' }}>
                        <div style={{ width: '105px', fontWeight: 'bold' }}>Departure</div>
                        <div style={{ flex: 1, textAlign: 'left' }}>{invoice.formattedDepartureDate}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '4px' }}>
                        <div style={{ width: '105px', fontWeight: 'bold' }}>Folio No.</div>
                        <div style={{ flex: 1, textAlign: 'left' }}>{invoice.folioNo}</div>
                    </div>
                    <div style={{ display: 'flex', marginBottom: '4px' }}>
                        <div style={{ width: '105px', fontWeight: 'bold' }}>Cashier No.</div>
                        <div style={{ flex: 1, textAlign: 'left' }}>{invoice.cashierNo}</div>
                    </div>
                    <div style={{ display: 'flex', marginTop: '25px' }}>
                        <div style={{ width: '105px', fontWeight: 'bold' }}>Page No.</div>
                        <div style={{ flex: 1, textAlign: 'left' }}>{page.pageNum} of {paginatedData.length}</div>
                    </div>
                    <div style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
                        COPY OF INVOICE
                    </div>
                </div>
            </div>

            <table className="fs-invoice-table">
                <thead>
                    <tr><td colSpan="5" style={{ borderTop: '1px solid #000', padding: 0, height: '4px' }}></td></tr>
                    <tr style={{ backgroundColor: '#E4E4E4' }}>
                        <th style={{ width: '11%', padding: '6px 5px' }}>Date</th>
                        <th style={{ width: '28%', padding: '6px 5px' }}>Description</th>
                        <th style={{ width: '31%', padding: '6px 5px' }}>Reference</th>
                        <th className="right-align" style={{ width: '16%', padding: '6px 5px' }}>Debit £</th>
                        <th className="right-align" style={{ width: '16%', padding: '6px 5px' }}>Credit £</th>
                    </tr>
                    <tr><td colSpan="5" style={{ padding: 0, height: '4px' }}></td></tr>
                    <tr><td colSpan="5" style={{ borderBottom: '1px solid #000', padding: 0 }}></td></tr>
                    <tr><td colSpan="5" style={{ padding: 0, height: '6px' }}></td></tr>
                </thead>
                <tbody>
                    {page.items.map((item, midx) => (
                        <tr key={midx}>
                            <td>{item.date}</td>
                            <td>{item.text}</td>
                            <td>{item.reference}</td>
                            <td className="right-align">{item.debitGBP}</td>
                            <td className="right-align">{item.creditGBP}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {page.showTotal && (
              <div style={{ marginTop: '0px', fontSize: '11px' }}>
                <div style={{ width: '100%', borderTop: '1px solid #000' }}></div>
                
                <div style={{ display: 'flex' }}>
                  <div style={{ width: '55%' }}></div>
                  <div style={{ width: '45%', borderBottom: '2px solid #000', display: 'flex', padding: '3px 0' }}>
                    <div style={{ flex: 1, textAlign: 'right', paddingRight: '15px' }}>
                      Total <span style={{ fontWeight: 'bold' }}>£</span>
                    </div>
                    <div style={{ width: '54%', textAlign: 'right', paddingRight: '5px' }}>{formatCurrency(totalCharges)}</div>
                    <div style={{ width: '31.1%', textAlign: 'right'}}>{formatCurrency(totalCredits)}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', fontWeight: 'bold' }}>
                    <div style={{ width: '55%' }}></div>
                    <div style={{ width: '45%', display: 'flex', padding: '6px 0' }}>
                        <div style={{ flex: 1, textAlign: 'right', paddingRight: '15px' }}>Balance £</div>
                        <div style={{ width: '49%', textAlign: 'right', paddingRight: '5px' }}></div>
                        <div style={{ width: '31.1%', textAlign: 'right' }}>{formatCurrency(balanceDue)}</div>
                    </div>
                </div>
              </div>
            )}

            {page.showVat && (
              <div style={{ marginTop: '0px', fontSize: '11px' }}>
                <div style={{ display: 'flex', fontWeight: 'bold', marginTop: '2px', marginBottom: '15px', fontSize: '12px'}}>
                    <div style={{ width: '55%' }}></div>
                    <div style={{ width: '45%', textAlign: 'center' }}>
                        VAT Breakdown
                    </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <table style={{ width: '47%', borderCollapse: 'collapse', fontSize: '11px', marginRight: '10px' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', fontWeight: 'bold', width: '17%' }}></th>
                                <th style={{ textAlign: 'right', fontWeight: 'normal', color: '#444', width: '18%', paddingBottom: '1px' }}>Net Amount<br></br><span style={{ fontWeight: 'bold' }}>£</span></th>
                                <th style={{ textAlign: 'right', fontWeight: 'normal', color: '#444', width: '23%', paddingBottom: '1px' }}>VAT Amount<br></br><span style={{ fontWeight: 'bold' }}>£</span></th>
                                <th style={{ textAlign: 'right', fontWeight: 'normal', color: '#444', width: '23%', paddingBottom: '1px' }}>Gross Amount<br></br><span style={{ fontWeight: 'bold' }}>£</span></th>
                            </tr>
                        </thead>
                        <tbody>
                             <tr>
                                <td style={{ fontWeight: 'bold', padding: '2px 0', letterSpacing: '0.5px' }}>VAT 20 %</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(netAmount)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(vatAmount)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(totalCharges)}</td>
                            </tr>
                            <tr><td style={{ fontWeight: 'bold', padding: '2px 0', letterSpacing: '0.5px' }}>VAT 12.5 %</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                            <tr><td style={{ fontWeight: 'bold', padding: '2px 0', letterSpacing: '0.5px' }}>VAT 5 %</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                            <tr><td style={{ fontWeight: 'bold', padding: '2px 0', letterSpacing: '0.5px' }}>VAT 4 %</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                            <tr><td style={{ fontWeight: 'bold', padding: '2px 0', letterSpacing: '0.5px' }}>VAT 2.5 %</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                            <tr><td style={{ fontWeight: 'bold', padding: '2px 0', letterSpacing: '0.5px' }}>VAT 1 %</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                            <tr><td style={{ fontWeight: 'bold', padding: '2px 0', letterSpacing: '0.5px' }}>VAT 0 %</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                            <tr><td style={{ fontWeight: 'bold', padding: '2px 0', paddingBottom: '6px', letterSpacing: '0.5px' }}>VAT Exempt</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                             <tr>
                                <td style={{ fontWeight: 'bold', letterSpacing: '0.5px', paddingTop: '2px' }}>Total</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #777', paddingTop: '2px' }}>{formatCurrency(netAmount)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #777', paddingTop: '2px' }}>{formatCurrency(vatAmount)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #777', paddingTop: '2px' }}>{formatCurrency(totalCharges)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
              </div>
            )}

            <div className="fs-footer">
                <div style={{ fontWeight: 'bold', fontSize: '11px', lineHeight: '1.4' }}>
                    FOUR SEASONS HOTEL PARK LANE, HAMILTON PLACE, PARK LANE, LONDON W1J 7DR<br/>
                    TEL: 020 7499 0888 FAX: 020 7493 1895<br/>
                    www.fourseasons.com/london
                </div>
                <div style={{ fontWeight: 'normal', fontSize: '10.5px', marginTop: '2px' }}>
                    INN ON THE PARK (LONDON) LIMITED REGISTERED NO. 1859449 LONDON. REG VAT NO. 386385800
                </div>
            </div>

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default FourSeasonParkLaneView;
