import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
// Replace with your actual API path if different
import ukInvoiceApi from '../../Api/ukInvoice.api'; 
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import { calcVAT, parseNum } from '../../utils/invoiceCalculationsUK';

// Real data flows from API
const dummyInvoiceData = null;

const HyattRegencyView = ({ invoiceData }) => {
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
      console.error("Error fetching Hyatt Regency invoice:", err);
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
            description: "Accommodation" || item.description || item.text,
            reference: item.reference || item.refNo || item.ref_no || "",
            debit: item.chargesGbp || item.guest_charges || item.debit ? formatCurrency(item.chargesGbp || item.guest_charges || item.debit) : "",
            credit: item.creditsGbp || item.credit ? formatCurrency(item.creditsGbp || item.credit) : "",
            type: 'accommodation'
        });
    });

    // 2. Other Services
    const otherSvc = data.otherServices || data.other_services || [];
    otherSvc.forEach(svc => {
        items.push({
            date: formatDate(svc.date),
            rawDate: new Date(svc.date),
            description: svc.name || svc.text || svc.service_name || "Service",
            reference: svc.reference || svc.refNo || svc.ref_no || "",
            debit: svc.amount || svc.chargesGbp || svc.guest_charges || svc.total || svc.debit ? formatCurrency(svc.amount || svc.chargesGbp || svc.guest_charges || svc.total || svc.debit) : "",
            credit: svc.creditsGbp || svc.credit ? formatCurrency(svc.creditsGbp || svc.credit) : "",
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
      companyNames: "Azar Tourism Services" || data.companyNames || data.company_name || "",
      companyAddress: data.companyAddress || data.address || "",
      roomNo: data.roomNo || data.room_number || "",
      arrivalDate: data.arrivalDate || data.arrival_date || "",
      departureDate: data.departureDate || data.departure_date || "",
      invoiceDate: data.invoiceDate || data.tax_date || new Date(),
      cashierNo: data.cashierNo || data.cashier_no || "",
      vatNo: data.vatNo || data.vat_no,
      confNo: data.confNo || data.conf_no || "",
      
      items,
      formattedInvoiceDate: formatUpperDate(data.invoiceDate || data.tax_date || new Date()),
      formattedArrivalDate: `${formatUpperDate(data.arrivalDate || data.arrival_date)}\u00A0${data.arrivalTime || data.arrival_time || ""}`,
      formattedDepartureDate: `${formatUpperDate(data.departureDate || data.departure_date)}\u00A0${data.departureTime || data.departure_time || ""}`,
      
      grandTotalGbp: data.grandTotalGbp || data.grand_total_gbp || data.totalAmountPayable || 0,
      creditsTotal: data.creditsTotal || data.credits_total || 0,
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
        return `${dd}-${mm}-${yy}`;
    } catch { return dateString; }
  };

  const formatUpperDate = (dateString) => {
    if (!dateString) return "";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const dd = String(d.getDate()).padStart(2, '0');
        const mmm = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd} ${mmm} ${yy}`;
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

      // 18 items per page limit
      if (totalTx > 18) {
        const CHUNK_SIZE = 18;
        for (let i = 0; i < totalTx; i += CHUNK_SIZE) {
          pages.push({
            items: items.slice(i, i + CHUNK_SIZE),
            pageNum: pages.length + 1,
            isLast: i + CHUNK_SIZE >= totalTx
          });
        }
      } else {
        pages.push({
          items: items,
          pageNum: 1,
          isLast: true
        });
      }
      
      if (pages.length === 0) {
        pages.push({ items: [], pageNum: 1, isLast: true });
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
      const element = invoiceRef.current;
      const opt = {
        margin: 0,
        filename: `Hyatt_Regency_Invoice_${invoice.confNo || 'Invoice'}.pdf`,
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
  const { net: netRevenue, vat: vatAmount } = calcVAT(totalCharges);
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
      <div ref={invoiceRef} className="hyatt-invoice-wrapper">
        <style dangerouslySetInnerHTML={{__html: `
          .hyatt-invoice-wrapper * {
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            box-sizing: border-box;
          }
          
          .hyatt-page {
            width: 210mm;
            min-height: 295mm;
            padding: 2mm 7mm 5mm 4mm;
            margin: 0 auto;
            background-color: #ffffff;
            position: relative; 
            display: flex;
            flex-direction: column;
            line-height: 1.5;
            font-size: 11.5px;
            overflow: hidden; /* Prevents invisible pixel overflow */
          }

          /* Force page break for everything except the last page */
          .hyatt-page:not(:last-child) {
            page-break-after: always;
          }
          
          @media print {
            @page { 
              margin: 0; 
              size: A4 portrait;
            }
            body * { visibility: hidden; }
            .hyatt-invoice-wrapper, .hyatt-invoice-wrapper * { visibility: visible; }
            .hyatt-invoice-wrapper {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            body { background: none; margin: 0; padding: 0; }
            .hyatt-page { 
              padding: 15mm 15mm !important; 
              margin: 0 !important; 
              box-shadow: none !important; 
              width: 100% !important;
              height: 296mm !important; 
              page-break-after: always;
            }
            .hyatt-page:last-child {
              page-break-after: avoid !important; 
            }
          }

          /* Invoice Table Area */
          .h-invoice-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11.5px;
          }
          .h-invoice-table th, .h-invoice-table td {
              padding: 6px 6px;
              text-align: left;
              vertical-align: top;
          }
          .h-invoice-table th {
              background-color: #d3d3d3;
              font-weight: normal;
              padding: 8px 6px;
              font-size: 12px;
          }
          .h-invoice-table th.right-align, .h-invoice-table td.right-align { text-align: right; }
          .h-invoice-table td.center-align { text-align: center; }

          .h-header-left {
             font-size: 11.5px;
             line-height: 1.4;
          }
        `}} />

        {paginatedData.map((page, idx) => (
          <div key={idx} className="hyatt-page">
            
            {/* Top Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '130px', marginBottom: '20px' }}>
                {/* Left Top - Logo */}
                <div style={{ width: '50%' }}>
                    <img src="/hyattregency-logo.png" alt="Hyatt Regency" style={{ width: '150px', height: 'auto', marginTop: '0px', marginLeft: '15px' }} />
                </div>

                {/* Right Top - Address */}
                <div className="h-header-left" style={{ width: '41%' }}>
                    <div>HYATT REGENCY LONDON - THE</div>
                    <div>CHURCHILL</div>
                    <div>30 Portman Square</div>
                    <div>London, W1H 7BH, United Kingdom</div>
                    <div>Tel: 44 20 7486 5800 Fax: 44 20 7486 1255</div>
                    <div>E: london.churchill@hyatt.com</div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {/* Left Middle - Guest Info */}
                <div style={{ width: '41%' }}>
                    <div>{invoice.guestName || invoice.companyNames}</div>
                    {invoice.companyNames && invoice.guestName && (<div>{invoice.companyNames}</div>)}
                    {invoice.companyAddress && invoice.companyAddress.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                    ))}
                </div>

                {/* Right Middle - Invoice Details */}
                <div style={{ width: '24%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                        <tbody>
                            {[
                                { label: 'Room No.', val: invoice.roomNo },
                                { label: 'Arrival', val: invoice.formattedArrivalDate },
                                { label: 'Departure', val: invoice.formattedDepartureDate },
                                { label: 'Page No.', val: `${page.pageNum} of ${paginatedData.length}` },
                                { label: 'Date', val: invoice.formattedInvoiceDate },
                                { label: 'Cashier No', val: invoice.cashierNo },
                            ].map((row, i) => (
                                <tr key={i}>
                                    <td style={{ paddingBottom: '3px', width: '65px' }}>{row.label}</td>
                                    <td style={{ paddingBottom: '3px', width: '20px' }}>:</td>
                                    <td style={{ paddingBottom: '3px', textAlign: 'left' }}>{row.val}</td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan="3" style={{ padding: '8px 0' }}></td>
                            </tr>
                            <tr>
                                <td style={{ paddingBottom: '2px' }}>VAT Reg No</td>
                                <td style={{ paddingBottom: '2px' }}>:</td>
                                <td style={{ paddingBottom: '2px', textAlign: 'left' }}>{invoice.vatNo}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Title */}
                    <div style={{ textAlign: 'right', marginTop: '20px', marginBottom: '4px', fontSize: '11.5px' }}>
                        INFORMATION INVOICE
                    </div>
                </div>
            </div>

            {/* Invoice Data Table */}
            <table className="h-invoice-table">
                <thead>
                    <tr>
                        <th style={{ width: '12%' }}>DATE</th>
                        <th style={{ width: '31%' }}>DESCRIPTION</th>
                        <th style={{ width: '33%' }}>REFERENCE</th>
                        <th className="right-align" style={{ width: '12.5%' }}>DEBIT</th>
                        <th className="right-align" style={{ width: '12%', paddingRight: '14px' }}>CREDIT</th>
                    </tr>
                </thead>
                <tbody>
                    {page.items.map((item, midx) => (
                        <tr key={midx}>
                            <td>{item.date}</td>
                            <td>{item.description}</td>
                            <td>{item.reference}</td>
                            <td className="right-align">{item.debit}</td>
                            <td className="right-align">{item.credit}</td>
                        </tr>
                    ))}
                    {page.items.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ visibility: 'hidden', padding: '10px' }}>Empty</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Totals & Summary - Only on the Last Page */}
            {page.isLast && (
              <div style={{ marginTop: '30px' }}>
                
                {/* Thick Top Line */}
                <div style={{ borderTop: '2px solid black', width: '100%', marginBottom: '15px' }}></div>
                
                {/* First Row of Total */}
                <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <div style={{ width: '34%' , marginLeft: '10px'}}>
                    <div style={{ backgroundColor: '#e0e0e0', padding: '2px 0px', fontWeight: 'normal' }}>World of Hyatt Summary</div>
                  </div>
                  <div style={{ width: '38%', textAlign: 'center', paddingRight: '25px' }}>Total</div>
                  <div style={{ width: '16%', textAlign: 'right', padding: '4px 6px' }}>{formatCurrency(totalCharges)}</div>
                  <div style={{ width: '10%', textAlign: 'right', padding: '4px 0px' }}>{formatCurrency(totalCredits)}</div>
                </div>

                <div style={{ display: 'flex', width: '100%', marginTop: '10px' }}>
                  <div style={{ width: '42%' }}></div>
                  <div style={{ width: '58%', borderTop: '2px solid black' }}></div>
                </div>

                <div style={{ display: 'flex', width: '100%', marginTop: '2px' }}>
                  {/* Left Bottom Section - Membership & Bank */}
                  <div style={{ width: '40%', fontSize: '11.5px', lineHeight: '1.4' }}>
                     <div style={{ marginBottom: '50px', marginTop: '7px', marginLeft: '6px' }}>
                         <div>No Membership to be credited.</div>
                         <div style={{ marginTop: '15px' }}>Join World of Hyatt today and start earning points for</div>
                         <div>stays, dining and more.</div>
                         <div>Visit worldofhyatt.com.</div>
                     </div>
                     
                     {/* <div style={{ marginTop: '20px', marginLeft: '6px' }}>
                        <div>Churchill Group Ltd</div>
                        <div>Barclays Bank plc</div>
                        <div>Account Number: 10121746, Sort Code: 20 65 82</div>
                        <div>Swift: BARCGB22</div>
                        <div>IBAN: GB03 BARC 2065 8210 1217 46</div>
                     </div> */}
                  </div>

                  {/* Right Bottom Section - VAT Breakdown & Balance */}
                  <div style={{ width: '60%' }}>
                    
                    <div style={{ display: 'flex', width: '100%' }}>
                       <div style={{ width: '60%', paddingLeft: '85px' }}>Net @ 20.0%</div>
                       <div style={{ width: '21%', textAlign: 'right', paddingRight: '3px' }}>{formatCurrency(netRevenue)}</div>
                       <div style={{ width: '17%', textAlign: 'right', paddingRight: '2px' }}>GBP</div>
                    </div>
                    {[
                      { label: 'Net @ 12.5%', val: '0.00' },
                      { label: 'Net @ 5.0%', val: '0.00' },
                      { label: 'Net @ 4.0%', val: '0.00' },
                      { label: 'Net @ 2.5%', val: '0.00' },
                      { label: 'Net @ 1.0%', val: '0.00' },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', width: '100%' }}>
                         <div style={{ width: '60%', paddingLeft: '85px' }}>{row.label}</div>
                         <div style={{ width: '21%', textAlign: 'right', paddingRight: '3px' }}>{row.val}</div>
                         <div style={{ width: '17%', textAlign: 'right', paddingRight: '2px' }}>GBP</div>
                      </div>
                    ))}
                    
                    <div style={{ display: 'flex', width: '100%', marginBottom: '8px' }}>
                       <div style={{ width: '60%', paddingLeft: '85px' }}>VAT 20.0%</div>
                       <div style={{ width: '21%', textAlign: 'right', paddingRight: '3px' }}>{formatCurrency(vatAmount)}</div>
                       <div style={{ width: '17%', textAlign: 'right', paddingRight: '2px' }}>GBP</div>
                    </div>

                    {[
                      { label: 'VAT 12.5%', val: '0.00' },
                      { label: 'VAT 5.0%', val: '0.00' },
                      { label: 'VAT 4%', val: '0.00' },
                      { label: 'VAT 2.5%', val: '0.00' },
                      { label: 'VAT 1.0%', val: '0.00' },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', width: '100%' }}>
                         <div style={{ width: '60%', paddingLeft: '85px' }}>{row.label}</div>
                         <div style={{ width: '21%', textAlign: 'right', paddingRight: '3px' }}>{row.val}</div>
                         <div style={{ width: '17%', textAlign: 'right', paddingRight: '2px' }}>GBP</div>
                      </div>
                    ))}

                    <div style={{ display: 'flex', width: '100%', marginTop: '8px' }}>
                       <div style={{ width: '60%', paddingLeft: '85px' }}>Non Vatable</div>
                       <div style={{ width: '21%', textAlign: 'right', paddingRight: '3px' }}>0.00</div>
                       <div style={{ width: '17%', textAlign: 'right', paddingRight: '2px' }}>GBP</div>
                    </div>

                    <div style={{ display: 'flex', width: '100%'}}>
                       <div style={{ width: '60%', paddingLeft: '85px' }}>Total Net Amount</div>
                       <div style={{ width: '21%', textAlign: 'right', paddingRight: '3px' }}>{formatCurrency(netRevenue)}</div>
                       <div style={{ width: '17%', textAlign: 'right', paddingRight: '2px' }}>GBP</div>
                    </div>
                    <div style={{ display: 'flex', width: '100%' }}>
                       <div style={{ width: '60%', paddingLeft: '85px' }}>Total VAT</div>
                       <div style={{ width: '21%', textAlign: 'right', paddingRight: '3px' }}>{formatCurrency(vatAmount)}</div>
                       <div style={{ width: '17%', textAlign: 'right', paddingRight: '2px' }}>GBP</div>
                    </div>
                    <div style={{ display: 'flex', width: '100%' }}>
                       <div style={{ width: '60%', paddingLeft: '85px' }}>Amount incl. Vat GBP</div>
                       <div style={{ width: '21%', textAlign: 'right', paddingRight: '3px' }}>{formatCurrency(totalCharges)}</div>
                       <div style={{ width: '17%', textAlign: 'right', paddingRight: '2px' }}>GBP</div>
                    </div>
                    <div style={{ display: 'flex', width: '100%', padding: '2px 0' }}>
                       <div style={{ width: '60%', paddingLeft: '85px' }}>Balance</div>
                       <div style={{ width: '21%', textAlign: 'right', paddingRight: '3px' }}>{formatCurrency(balanceDue)}</div>
                       <div style={{ width: '17%', textAlign: 'right', paddingRight: '2px' }}>GBP</div>
                    </div>

                  </div>
                </div>

                {/* Footer Agreement Text */}
                <div style={{ marginTop: '12px', fontSize: '11.5px', lineHeight: '1.4', paddingLeft: '6px' }}>
                   The undersigned agrees that his liability for this bill is not waived and agrees to be held personally liable in the event that the indicated<br/>
                   person, company or association fails to pay for any part or the full amount of these charges. Please refer to privacy.hyatt.com for the Hyatt<br/>
                   Global Privacy Policy.
                </div>
                
                <div style={{ marginTop: '15px', marginLeft: '6px', fontSize: '11.5px' }}>
                   Signature: _________________________________
                </div>
              </div>
            )}

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default HyattRegencyView;
