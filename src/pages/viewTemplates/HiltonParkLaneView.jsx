import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ukInvoiceApi from '../../Api/ukInvoice.api'; 
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import { calcVAT, parseNum } from '../../utils/invoiceCalculationsUK';

// No hardcoded dummy values - real data flows from API
const dummyInvoiceData = null;

const HiltonParkLaneView = ({ invoiceData }) => {
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
      console.error("Error fetching Hilton invoice:", err);
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
            text: (item.text || item.description || item.name || "").toUpperCase().includes("GUEST ROOM") 
                  ? "ROOM & BREAKFAST" 
                  : (item.text || item.description || item.name || "ROOM & BREAKFAST"),
            id: item.id || item.ref_id || data.accommodationRefId || "",
            refNo: item.refNo || item.ref_no || "",
            chargesGBP: item.chargesGbp || item.guest_charges || item.debit ? formatCurrency(item.chargesGbp || item.guest_charges || item.debit) : "",
            creditsGBP: item.creditsGbp || item.credit ? formatCurrency(item.creditsGbp || item.credit) : "",
            type: 'accommodation'
        });
    });

    // 2. Other Services
    const otherSvc = data.otherServices || data.other_services || [];
    otherSvc.forEach(svc => {
        items.push({
            date: formatDate(svc.date),
            rawDate: new Date(svc.date),
            text: svc.name || svc.text || svc.description || svc.service_name || "Service",
            id: svc.id || svc.ref_id || data.servicesRefId || "",
            refNo: svc.refNo || svc.ref_no || "",
            chargesGBP: svc.amount || svc.chargesGbp || svc.guest_charges || svc.total || svc.debit ? formatCurrency(svc.amount || svc.chargesGbp || svc.guest_charges || svc.total || svc.debit) : "",
            creditsGBP: svc.creditsGbp || svc.credit ? formatCurrency(svc.creditsGbp || svc.credit) : "",
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
      companyNames: "Azar Tourism Services",
      companyAddress: "P.O.BOX Number: 1254\nAlgeria Square\nBuilding Number 12 First Floor\nTripoli\nLibya",
      roomNo: data.roomNo || data.room_number || "",
      arrivalDate: data.arrivalDate || data.arrival_date || "",
      departureDate: data.departureDate || data.departure_date || "",
      adultChild: data.adultChild || (data.adults !== undefined ? `${data.adults}/${data.children || 0}` : ""),
      roomRate: data.roomRate || (data.gbpAmount ? formatCurrency(data.gbpAmount) : ""),
      ratePlan: data.ratePlan || data.rate_plan || "",
      honorsNo: data.honorsNo || data.honors_no || "",
      vatInvoice: data.vatInvoice || data.vatInvoiceNo || data.vat_invoice_no || "",
      confNo: data.confNo || data.conf_no || "",
      vatNo: data.vatNo || data.vat_no || "",
      folioNo: data.folioNo || data.folio_no || "",
      invoiceDate: data.invoiceDate || data.tax_date || new Date(),
      
      items,
      formattedInvoiceDate: formatDate(data.invoiceDate || data.tax_date || new Date()),
      formattedArrivalDate: formatDateWithTime(data.arrivalDate || data.arrival_date),
      formattedDepartureDate: formatDateWithTime(data.departureDate || data.departure_date),
      
      totalAmountPayable: data.totalAmountPayable || data.grand_total_gbp || data.grandTotalGbp || data.grandTotal || 0,
      taxableAmountExclVat: data.taxableAmountExclVat || data.total_net_excl_vat || calcVAT(data.totalAmountPayable || data.grand_total_gbp || data.grandTotalGbp || data.grandTotal || 0).net,
      vatAt20Percent: data.vatAt20Percent || data.total_vat_20 || calcVAT(data.totalAmountPayable || data.grand_total_gbp || data.grandTotalGbp || data.grandTotal || 0).vat,
      zeroRatedAmount: data.zeroRatedAmount || data.zero_rated || 0,
      nonTaxableAmount: data.nonTaxableAmount || data.non_taxable || 0,
      creditsTotal: data.creditsTotal || 0
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear());
        return `${dd}/${mm}/${yy}`;
    } catch { return dateString; }
  };

  const formatDateWithTime = (dateString) => {
    if (!dateString) return "";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear());
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        return `${dd}/${mm}/${yy}\u00A0\u00A0${hh}:${min}:${ss}`;
    } catch { return dateString; }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "") return "";
    return `£${parseFloat(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  useEffect(() => {
    if (invoice && invoice.items) {
      const pages = [];
      const items = invoice.items;
      const totalTx = items.length;

      // 20 items per page limit
      if (totalTx > 10) {
        const CHUNK_SIZE = 10;
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
        filename: `Hilton_Invoice_${invoice.confNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
            scale: 4, 
            useCORS: true, 
            letterRendering: true,
            scrollY: 0,
            windowWidth: 794 // Exact width of A4 at 96 DPI
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

  const totalCharges = invoice.totalAmountPayable || 0;
  const taxableAmount = invoice.taxableAmountExclVat || 0; 
  const vatAmount = invoice.vatAt20Percent || 0;
  const zeroRatedAmount = invoice.zeroRatedAmount || 0;
  const nonTaxableAmount = invoice.nonTaxableAmount || 0;
  const balanceDue = totalCharges - (invoice.creditsTotal || 0);

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
      <div ref={invoiceRef} className="hilton-invoice-wrapper">
        <style dangerouslySetInnerHTML={{__html: `
          .hilton-invoice-wrapper {
            overflow: hidden !important;
          }
          .hilton-invoice-wrapper * {
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            box-sizing: border-box;
          }
          
          .hilton-page {
            width: 210mm;
            height: 296mm; /* Exact A4 height to prevent misalignment */
            padding: 9mm 20mm 15mm 18mm !important; 
            margin: 0 auto;
            background-color: #ffffff;
            position: relative; 
            display: flex;
            flex-direction: column;
            line-height: 1.3;
            overflow: hidden; 
            box-sizing: border-box;
          }

          /* Precise page breaks */
          .hilton-page {
            page-break-inside: avoid;
            page-break-before: avoid;
          }
          .hilton-page:not(:last-child) {
            page-break-after: always;
          }
          .hilton-page:last-child {
            page-break-after: auto !important;
            margin-bottom: 0 !important;
          }
          
          @media print {
            @page { 
              margin: 0; 
              size: A4 portrait;
            }
            body * { visibility: hidden; }
            .hilton-invoice-wrapper, .hilton-invoice-wrapper * { visibility: visible; }
            .hilton-invoice-wrapper {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            body { background: none; margin: 0; padding: 0; }
            .hilton-page { 
              padding: 10mm 18mm !important; 
              margin: 0 !important; 
              box-shadow: none !important; 
              width: 100% !important;
              height: 297mm !important; 
              page-break-after: always;
            }
            .hilton-page:last-child {
              page-break-after: auto !important; 
            }
            .h-footer {
              bottom: 15mm !important;
              left: 20mm !important;
            }
          }

          .h-invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 0px;
              font-size: 11px;
          }

          .h-invoice-table th{
          padding: 2px 2px;
          text-align: left;
          }
          .h-invoice-table td {
              padding: 3px 5px;
              text-align: left;
          }
          .h-invoice-table th {
              font-weight: normal;
              border: 1px solid #000;
              text-transform: uppercase;
              text-align: center;
          }
          .h-invoice-table td.center-align { text-align: center; }

          .h-footer {
              position: absolute;
              bottom: 50px;
              left: 60px;
              font-size: 10px;
          }

          .bold-text {
            font-weight: bold;
          }
        `}} />

        {paginatedData.map((page, idx) => (
          <div key={idx} className="hilton-page">
            
            {/* Logo at Top Left/Center */}
            <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '3px' }}>
                <img src="/hiltonparklane-logo.png" alt="Hilton Park Lane" style={{ widht: '50px', objectFit: 'contain' }} />
            </div>

            {/* Split Top Layout */}
            <div style={{ fontSize: '11px', marginTop: '5px' }}>
                
                {/* Row 1: Guest Info & Dates */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '26px', margin: '0px 0px 0px 66px' }}>
                    {/* Left Column */}
                    <div style={{ width: '40%', paddingRight: '20px' }}>
                        <div style={{marginBottom: '4px'}}>{invoice.guestName}</div>
                        {invoice.companyNames && <div style={{marginBottom: '4px'}}>{invoice.companyNames}</div>}
                        {invoice.companyAddress && invoice.companyAddress.split('\n').map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                    </div>
                    {/* Right Column */}
                    <div style={{ width: '62%' }}>
                        <div style={{ display: 'flex', paddingBottom: '4px' }}>
                           <div style={{ width: '140px' }}>Room Number</div>
                           <div style={{ width: '130px'}}>{invoice.roomNo}</div>
                        </div>
                        <div style={{ display: 'flex', paddingBottom: '4px' }}>
                           <div style={{ width: '140px' }}>Arrival Date</div>
                           <div style={{ width: '130px'}}>{invoice.formattedArrivalDate}</div>
                        </div>
                        <div style={{ display: 'flex' }}>
                           <div style={{ width: '140px' }}>Departure Date</div>
                           <div style={{ width: '130px'}}>{invoice.formattedDepartureDate}</div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Rates & Honors */}
                <div style={{ display: 'flex', marginTop: '20px' }}>
                    <div style={{ width: '48%' }}></div>
                    <div style={{ width: '50%' }}>
                        <div style={{ display: 'flex', paddingBottom: '9px' }}>
                           <div style={{ width: '135px' }}>Adult/Child</div>
                           <div>{invoice.adultChild}</div>
                        </div>
                        <div style={{ display: 'flex', paddingBottom: '9px' }}>
                           <div style={{ width: '135px' }}>Room Rate</div>
                           <div>{invoice.roomRate}</div>
                        </div>
                        <div style={{ display: 'flex', paddingBottom: '9px' }}>
                           <div style={{ width: '135px' }}>Rate Plan</div>
                           <div>{invoice.ratePlan}</div>
                        </div>
                        <div style={{ display: 'flex', paddingBottom: '9px' }}>
                           <div style={{ width: '135px' }}>AL:</div>
                           <div></div>
                        </div>
                        <div style={{ display: 'flex' }}>
                           <div style={{ width: '135px' }}>Honors #</div>
                           <div>{invoice.honorsNo}</div>
                        </div>
                    </div>
                </div>

                {/* Row 3: VAT, Folio, Confirmation */}
                <div style={{ display: 'flex', marginTop: '9px' }}>
                    <div style={{ width: '48%', paddingRight: '20px' }}>
                        <div style={{ paddingBottom: '4px' }}>VAT INVOICE: {invoice.vatInvoice}</div>
                        <div>Confirmation Number: {invoice.confNo}</div>
                    </div>
                    <div style={{ width: '50%' }}>
                        <div style={{ display: 'flex', paddingBottom: '4px' }}>
                           <div style={{ width: '135px' }}>VAT #</div>
                           <div>{invoice.vatNo}</div>
                        </div>
                        <div style={{ display: 'flex', paddingBottom: '4px' }}>
                           <div style={{ width: '135px' }}>Folio No/Che</div>
                           <div>{invoice.folioNo}</div>
                        </div>
                        <div style={{ display: 'flex' }}>
                           <div style={{ width: '135px' }}>Tax Date</div>
                           <div>{invoice.formattedInvoiceDate}</div>
                        </div>
                    </div>
                </div>

                {/* Row 4: LONDON HILTON... */}
                <div style={{ marginTop: '10px', marginBottom: '6px' }}>
                    LONDON HILTON ON PARK LANE {invoice.formattedInvoiceDate} 12:43:46
                </div>

            </div>

            {/* Invoice Data Table */}
            <table className="h-invoice-table" style={{width: '90%'}}>
                <thead>
                    <tr>
                        <th style={{ width: '12%', textAlign: 'left', borderRight: 'none',verticalAlign: 'top' }}>DATE</th>
                        <th style={{ width: '13%', textAlign: 'left', borderRight: 'none',verticalAlign: 'top' }}>DESCRIPTION</th>
                        <th style={{ width: '12%', textAlign: 'center', borderRight: 'none',verticalAlign: 'top' }}>ID</th>
                        <th style={{ width: '12%', textAlign: 'center', borderRight: 'none',verticalAlign: 'top' }}>REF NO</th>
                        <th style={{ width: '16%', textAlign: 'center', borderRight: 'none',verticalAlign: 'top' }}>GUEST<br/>CHARGES</th>
                        <th style={{ width: '16%', textAlign: 'center', borderRight: 'none',verticalAlign: 'top' }}>CREDIT</th>
                        <th style={{ width: '13%', textAlign: 'center',verticalAlign: 'top' }}>BALANCE</th>
                    </tr>
                </thead>
                <tbody>
                    {page.items.map((item, midx) => (
                        <tr key={midx}>
                            <td style={{ paddingLeft: '2px', verticalAlign: 'top' }}>{item.date}</td>
                            <td style={{ paddingLeft: '2px', verticalAlign: 'top', lineHeight: '1.15' }}>{item.text}</td>
                            <td style={{verticalAlign: 'top'}}>{item.id}</td>
                            <td style={{verticalAlign: 'top', textAlign: 'right'}}>{item.refNo}</td>
                            <td className="right-align" style={{verticalAlign: 'top', textAlign: 'right'}}>{item.chargesGBP}</td>
                            <td className="right-align" style={{verticalAlign: 'top', textAlign: 'right'}}>{item.creditsGBP}</td>
                            <td style={{verticalAlign: 'top'}}></td>
                        </tr>
                    ))}
                    {page.items.length === 0 && (
                        <tr>
                            <td colSpan="7" style={{ visibility: 'hidden', padding: '10px' }}>Empty</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Totals & Summary - Only on the Last Page */}
            {page.isLast && (
              <div style={{width: '90%'}}>
                  <div style={{ borderTop: '1px solid #000', display: 'flex', paddingTop: '4px', paddingBottom: '4px', fontSize: '11px' }}>
                      <div style={{ width: '73%', textAlign: 'right', paddingRight: '6%' }}>BALANCE</div>
                      <div style={{ width: '28%', textAlign: 'right', paddingRight: '4px' }}>£0.00</div>
                  </div>
                  
                  <div style={{ marginTop: '30px', fontSize: '11px', lineHeight: '1.5' }}>
                      <div style={{ marginBottom: '8px' }}>TAX SUMMARY</div>
                      <div style={{ display: 'flex' }}>
                          <div style={{ width: '50%' }}>
                              <div style={{ display: 'flex', paddingBottom: '8px' }}>
                                  <div style={{ width: '150px' }}>Taxable Amount (excl VAT)</div>
                                  <div style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(taxableAmount)}</div>
                              </div>
                              <div style={{ display: 'flex', paddingBottom: '8px' }}>
                                  <div style={{ width: '150px' }}>Zero Rated Amount</div>
                                  <div style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(zeroRatedAmount)}</div>
                              </div>
                              <div style={{ display: 'flex', paddingBottom: '8px' }}>
                                  <div style={{ width: '150px' }}>VAT AT 20%</div>
                                  <div style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(vatAmount)}</div>
                              </div>
                              <div style={{ display: 'flex', paddingBottom: '8px' }}>
                                  <div style={{ width: '150px' }}>Non Taxable Amount</div>
                                  <div style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(nonTaxableAmount)}</div>
                              </div>
                              <div style={{ display: 'flex' }}>
                                  <div style={{ width: '150px' }}>Total Amount Payable</div>
                                  <div style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(totalCharges)}</div>
                              </div>
                          </div>
                      </div>
    
                      <div style={{ marginTop: '60px' }}>
                          <div style={{ marginBottom: '10px' }}>Guest Signature</div>
                          <div style={{ borderBottom: '1px solid #000', width: '290px' }}></div>
                      </div>
                  </div>
              </div>
            )}

            {/* Footer pinned strictly to the bottom */}
            {/* <div className="h-footer">
                LONDON HILTON ON PARK LANE {invoice.formattedInvoiceDate} {new Date().toLocaleTimeString('en-GB')}
            </div> */}

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default HiltonParkLaneView;
