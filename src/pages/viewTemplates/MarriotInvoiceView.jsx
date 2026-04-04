import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
// Replace with your actual API path if different
import ukInvoiceApi from '../../Api/ukInvoice.api'; 
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";

// Dummy data fallback perfectly matching the Marriott format
const dummyInvoiceData = {
  guestName: "Elmghairbi, Ahmed",
  companyNames: "AZAR TOURISM",
  companyAddress: "Libya\nLibya\nLibyan Arab Jamahiriya",
  confNo: "199650950",
  invoiceDate: "2026-03-12T00:00:00.000Z",
  folioNo: "",
  roomNo: "244",
  arrivalDate: "2026-03-09T00:00:00.000Z",
  departureDate: "2026-03-12T00:00:00.000Z",
  cashierNo: "103099",
  userId: "APOEUR-ATSIM842",
  vatNo: "GB882156411",
  accommodationDetails: [
    { date: "2026-03-09T00:00:00.000Z", text: "Room Accommodation", chargesGbp: 495.00 },
    { date: "2026-03-09T00:00:00.000Z", text: "Deposit Transfer at C/I", chargesGbp: null, creditsGbp: 1485.00 },
    { date: "2026-03-10T00:00:00.000Z", text: "Room Accommodation", chargesGbp: 495.00 },
    { date: "2026-03-11T00:00:00.000Z", text: "Room Accommodation", chargesGbp: 495.00 },
  ],
  otherServices: [],
  grandTotalGbp: 1485.00,
  creditsTotal: 1485.00
};

const MarriotInvoiceView = ({ invoiceData }) => {
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
      setInvoice(transformInvoiceData(dummyInvoiceData));
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
      console.error("Error fetching Marriott invoice:", err);
      setError("Failed to load invoice data. Displaying sample data.");
      toast.error("Failed to load invoice from API. Using dummy data.");
      setInvoice(transformInvoiceData(dummyInvoiceData));
    } finally {
      setLoading(false);
    }
  };

  const transformInvoiceData = (data) => {
    if (!data) return null;

    const items = [];
    
    if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
        data.accommodationDetails.forEach(item => {
            items.push({
                date: formatDate(item.date),
                rawDate: new Date(item.date),
                text: item.text || item.description || "Room Accommodation",
                chargesGBP: item.chargesGbp ? formatCurrency(item.chargesGbp) : "",
                creditsGBP: item.creditsGbp ? formatCurrency(item.creditsGbp) : "",
                type: 'accommodation'
            });
        });
    }

    if (data.otherServices && Array.isArray(data.otherServices)) {
        data.otherServices.forEach(service => {
            items.push({
                date: formatDate(service.date),
                rawDate: new Date(service.date),
                text: service.name || service.text || "Service",
                chargesGBP: service.amount || service.chargesGbp ? formatCurrency(service.amount || service.chargesGbp) : "",
                creditsGBP: service.creditsGbp ? formatCurrency(service.creditsGbp) : "",
                type: 'service'
            });
        });
    }

    items.sort((a, b) => {
      const timeDiff = a.rawDate.getTime() - b.rawDate.getTime();
      if (timeDiff !== 0) return timeDiff;
      if (a.type === 'accommodation' && b.type !== 'accommodation') return -1;
      if (a.type !== 'accommodation' && b.type === 'accommodation') return 1;
      return 0;
    });

    return {
      ...data,
      items,
      formattedInvoiceDate: formatDate(data.invoiceDate || new Date()),
      formattedArrivalDate: formatDate(data.arrivalDate),
      formattedDepartureDate: formatDate(data.departureDate),
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

      // 20 items per page limit
      if (totalTx > 20) {
        const CHUNK_SIZE = 20;
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
        filename: `Marriott_Invoice_${invoice.confNo || 'Invoice'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
            scale: 4, 
            useCORS: true, 
            letterRendering: true,
            scrollY: 0,
            windowWidth: 794 // Exact width of A4 at 96 DPI
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        // Use CSS page breaks properly instead of avoid-all to prevent height overflow bugs
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
  const netRevenue = totalCharges / 1.2; 
  const vatAmount = totalCharges - netRevenue;
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
      <div ref={invoiceRef} className="marriott-invoice-wrapper">
        <style dangerouslySetInnerHTML={{__html: `
          .marriott-invoice-wrapper * {
            font-family: "Times New Roman", Times, serif;
            color: #000;
            box-sizing: border-box;
          }
          
          .marriott-page {
            width: 794px; /* Exact A4 Width */
            height: 1122px; /* Exactly 1px shorter than A4 to explicitly prevent extra PDF page */
            padding: 50px !important;
            margin: 0 auto;
            background-color: #ffffff;
            position: relative; 
            display: flex;
            flex-direction: column;
            line-height: 1.3;
            overflow: hidden; /* Prevents invisible pixel overflow */
          }

          /* Force page break for everything except the last page */
          .marriott-page:not(:last-child) {
            page-break-after: always;
          }
          
          @media print {
            @page { 
              margin: 0; 
              size: A4 portrait;
            }
            body * { visibility: hidden; }
            .marriott-invoice-wrapper, .marriott-invoice-wrapper * { visibility: visible; }
            .marriott-invoice-wrapper {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            body { background: none; margin: 0; padding: 0; }
            .marriott-page { 
              padding: 15mm !important; /* Forces strict left/right padding during print */
              margin: 0 !important; 
              box-shadow: none !important; 
              width: 100% !important;
              height: 296mm !important; /* 1mm shorter than paper to stop trailing blank page */
              page-break-after: always;
            }
            .marriott-page:last-child {
              page-break-after: avoid !important; /* Absolutely no extra page at end */
            }
            /* Adjust footer relative to the physical print padding */
            .m-footer {
              bottom: 15mm !important;
              left: 15mm !important;
            }
          }

          /* Invoice Table Area */
          .m-invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 40px;
              font-size: 15px;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
          }
          .m-invoice-table th, .m-invoice-table td {
              padding: 8px 5px;
              text-align: left;
          }
          .m-invoice-table th {
              font-weight: bold;
              padding: 10px 5px;
              border-bottom: 1px solid #000;
          }
          .m-invoice-table th.right-align, .m-invoice-table td.right-align { text-align: right; }

          /* Footer absolute positioned to guarantee bottom placement */
          .m-footer {
              position: absolute;
              bottom: 50px;
              left: 50px;
              font-style: italic;
              font-size: 14px;
          }
        `}} />

        {paginatedData.map((page, idx) => (
          <div key={idx} className="marriott-page">
            
            {/* Split Top Layout */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                
                {/* Left Column */}
                <div style={{ width: '45%' }}>
                    <div style={{ marginTop: '80px', color: '#000080', fontWeight: 'bold', fontSize: '16px', lineHeight: '1.2' }}>
                        {invoice.companyNames}<br/>
                        {invoice.companyAddress && invoice.companyAddress.split('\n').map((line, i) => (
                            <React.Fragment key={i}>{line}<br/></React.Fragment>
                        ))}
                    </div>

                    <div style={{ marginTop: '60px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '15px' }}>INFORMATION INVOICE</div>
                        <table style={{ borderCollapse: 'collapse', fontSize: '16px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '100px', paddingBottom: '4px' }}>Conf. No.</td>
                                    <td style={{ width: '20px', paddingBottom: '4px' }}>:</td>
                                    <td style={{ paddingBottom: '4px' }}>{invoice.confNo}</td>
                                </tr>
                                <tr>
                                    <td style={{ paddingBottom: '4px' }}>Date</td>
                                    <td style={{ paddingBottom: '4px' }}>:</td>
                                    <td style={{ paddingBottom: '4px' }}>{invoice.formattedInvoiceDate}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 'bold' }}>Folio No.</td>
                                    <td style={{ fontWeight: 'bold' }}>:</td>
                                    <td style={{ fontWeight: 'bold' }}>{invoice.folioNo}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '30px', fontWeight: 'bold', fontStyle: 'italic', fontSize: '18px' }}>
                        {invoice.guestName}
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ width: '45%' }}>
                    <div style={{ fontSize: '16px', lineHeight: '1.2' }}>
                        London Marriott Hotel Park Lane<br/>
                        140 Park Lane<br/>
                        London W1K 7AA<br/>
                        Tel: + 44 20 7493 7000<br/>
                        Fax: + 44 20 7493 8333<br/>
                        www.LondonMarriottParkLane.co.uk
                    </div>

                    <div style={{ marginTop: '90px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '16px' }}>
                            <tbody>
                                {[
                                    { label: 'Room No.', val: invoice.roomNo },
                                    { label: 'Arrival', val: invoice.formattedArrivalDate },
                                    { label: 'Departure', val: invoice.formattedDepartureDate },
                                    { label: 'Page No.', val: `${page.pageNum} of ${paginatedData.length}` },
                                    { label: 'Cashier No.', val: invoice.cashierNo },
                                    { label: 'User ID', val: invoice.userId },
                                    { label: 'VAT No.', val: invoice.vatNo },
                                ].map((row, i) => (
                                    <tr key={i}>
                                        <td style={{ width: '120px', paddingBottom: '4px' }}>{row.label}</td>
                                        <td style={{ width: '20px', paddingBottom: '4px' }}>:</td>
                                        <td style={{ paddingBottom: '4px' }}>{row.val}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Invoice Data Table */}
            <table className="m-invoice-table">
                <thead>
                    <tr>
                        <th style={{ width: '15%' }}>Date</th>
                        <th style={{ width: '45%' }}>Text</th>
                        <th className="right-align" style={{ width: '20%' }}>Charges GBP</th>
                        <th className="right-align" style={{ width: '20%' }}>Credits GBP</th>
                    </tr>
                </thead>
                <tbody>
                    {page.items.map((item, midx) => (
                        <tr key={midx}>
                            <td>{item.date}</td>
                            <td>{item.text}</td>
                            <td className="right-align">{item.chargesGBP}</td>
                            <td className="right-align">{item.creditsGBP}</td>
                        </tr>
                    ))}
                    {page.items.length === 0 && (
                        <tr>
                            <td colSpan="4" style={{ visibility: 'hidden', padding: '10px' }}>Empty</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Totals & Summary - Only on the Last Page */}
            {page.isLast && (
              <>
                {/* Total Text Aligned with Table Columns -> 60% + 20% + 20% = 100% */}
                <div style={{ display: 'flex', marginTop: '5px', paddingTop: '5px', paddingBottom: '3px', fontWeight: 'bold', fontSize: '15px' }}>
                    <div style={{ width: '60%', textAlign: 'right', paddingRight: '20px' }}>Total:</div>
                    <div style={{ width: '20%', textAlign: 'right', paddingRight: '5px' }}>{formatCurrency(totalCharges)}</div>
                    <div style={{ width: '20%', textAlign: 'right', paddingRight: '5px' }}>{formatCurrency(totalCredits)}</div>
                </div>

                {/* Thick partial bottom border */}
                <div style={{ display: 'flex' }}>
                    <div style={{ width: '40%' }}></div>
                    <div style={{ width: '60%', borderTop: '3px solid #000' }}></div>
                </div>

                {/* FIXED WIDTH MATH: Exactly 100% (40 + 20 + 20 + 20) */}
                <div style={{ display: 'flex', width: '100%', marginTop: '10px', fontSize: '13px' }}>
                    
                    {/* Block 1 (40%): Balance Due & Tax */}
                    <div style={{ width: '40%', display: 'flex' }}>
                        <div style={{ width: '130px', fontWeight: 'bold' }}>
                            <div style={{ paddingBottom: '4px' }}>Balance Due</div>
                            <div>TAX VAT @ 20%</div>
                        </div>
                        <div style={{ width: '120px', textAlign: 'right', fontWeight: 'bold' }}>
                            <div style={{ paddingBottom: '4px' }}>
                                <span style={{ marginRight: '10px' }}>{formatCurrency(balanceDue)}</span> GBP
                            </div>
                            <div>
                                <span style={{ marginRight: '10px' }}>{formatCurrency(vatAmount)}</span> GBP
                            </div>
                        </div>
                    </div>

                    {/* Block 2 (20%): Net Revenue Label */}
                    <div style={{ width: '52%', textAlign: 'right', paddingRight: '40px', fontWeight: 'bold' }}>
                        Net Revenue (20% VAT)
                    </div>

                    {/* Block 3 (20%): Net Revenue Value (Strictly under "Charges GBP") */}
                    <div style={{ width: '40%', textAlign: 'right', paddingRight: '5px', fontWeight: 'bold' }}>
                        <span style={{ marginRight: '5px' }}>{formatCurrency(netRevenue)}</span> GBP
                    </div>

                    {/* Block 4 (20%): Empty space (Strictly under "Credits GBP") */}
                    <div style={{ width: '20%' }}></div>
                </div>
              </>
            )}

            {/* Footer pinned strictly to the bottom */}
            <div className="m-footer">
                On behalf of {invoice.companyNames || "AZAR TOURISM"}, thank you for choosing London Marriott Hotel Park Lane.
            </div>

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default MarriotInvoiceView;