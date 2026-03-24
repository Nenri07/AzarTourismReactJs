import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
const logo = '/waldorfastoria-logo.png';
import cairoInvoiceApi from "../../Api/cairoInvoice.api";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";

const WaldorfAstoriaInvoiceView = ({ invoiceData }) => {
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
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPdfDownload, invoice]);

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
      console.error("Error fetching Egypt invoice:", err);
      setError("Failed to load invoice data");
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const transformInvoiceData = (data) => {
    if (!data) return null;

    const transactions = [];
    
    let lastRefNumber = Math.floor(1000000 + Math.random() * 9000000); // Generate a random 7 digit start

    if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
        data.accommodationDetails.forEach(item => {
            const extRate = data.exchangeRate ? data.exchangeRate.toFixed(2) : "0.00";
            
            // Generate single ref for this day's items
            const currentRefNumber = (lastRefNumber++).toString();

            if (item.baseRate !== undefined && item.serviceCharge !== undefined) {
                const usdRateString = data.exchangeRate && data.exchangeRate > 0 ? (item.baseRate / data.exchangeRate).toFixed(2) : "0.00";
                
                transactions.push({
                    date: formatDate(item.date),
                    rawDate: new Date(item.date),
                    text: item.description || "GUEST ROOM",
                    exchangeRate: `${usdRateString} USD * ${extRate}`,
                    charges: item.baseRate || 0,
                    credits: 0,
                    type: 'accommodation',
                    refNo: currentRefNumber
                });
                
                if (item.serviceCharge > 0) {
                    transactions.push({
                        date: formatDate(item.date),
                        rawDate: new Date(item.date),
                        text: "Service Charge Room",
                        exchangeRate: "",
                        charges: item.serviceCharge,
                        credits: 0,
                        type: 'accommodation',
                        refNo: currentRefNumber
                    });
                }
                
                if (item.vat > 0) {
                    transactions.push({
                        date: formatDate(item.date),
                        rawDate: new Date(item.date),
                        text: "VAT Room",
                        exchangeRate: "",
                        charges: item.vat,
                        credits: 0,
                        type: 'accommodation',
                        refNo: currentRefNumber
                    });
                }
                
                if (item.cityTax > 0) {
                    transactions.push({
                        date: formatDate(item.date),
                        rawDate: new Date(item.date),
                        text: "Municipality Tax Room",
                        exchangeRate: "",
                        charges: item.cityTax,
                        credits: 0,
                        type: 'accommodation',
                        refNo: currentRefNumber
                    });
                }
            } else {
                const usdRate = data.exchangeRate && data.exchangeRate > 0 ? (item.rate / data.exchangeRate).toFixed(2) : "0.00";
                transactions.push({
                    date: formatDate(item.date),
                    rawDate: new Date(item.date),
                    text: item.description || "GUEST ROOM",
                    exchangeRate: `${usdRate} USD * ${extRate}`,
                    charges: item.rate || 0,
                    credits: 0,
                    type: 'accommodation',
                    refNo: currentRefNumber
                });
            }
        });
    }

    if (data.otherServices && Array.isArray(data.otherServices)) {
        data.otherServices.forEach(service => {
            const currentRefNumber = (lastRefNumber++).toString();
            transactions.push({
                date: formatDate(service.date),
                rawDate: new Date(service.date),
                text: service.name || "Service",
                exchangeRate: "",
                charges: service.amount || 0,
                credits: 0,
                type: 'service',
                refNo: currentRefNumber
            });
        });
    }

    transactions.sort((a, b) => {
      const timeDiff = a.rawDate.getTime() - b.rawDate.getTime();
      if (timeDiff !== 0) return timeDiff;
      if (a.type === 'accommodation' && b.type !== 'accommodation') return -1;
      if (a.type !== 'accommodation' && b.type === 'accommodation') return 1;
      return 0;
    });

    return {
      ...data,
      transactions,
      formattedInvoiceDate: formatDate(data.invoiceDate),
      formattedArrivalDate: formatDate(data.arrivalDate),
      formattedDepartureDate: formatDate(data.departureDate),
    };
  };

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return "";
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear());
        
        if (includeTime) {
            const hh = String(d.getHours()).padStart(2, '0');
            const mns = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            return `${dd}/${mm}/${yy} ${hh}:${mns}:${ss}`;
        }
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
    if (invoice && invoice.transactions) {
      const pages = [];
      const transactions = invoice.transactions;
      const totalTx = transactions.length;

      if (totalTx > 28) {
        const CHUNK_SIZE = 28;
        for (let i = 0; i < totalTx; i += CHUNK_SIZE) {
          pages.push({
            items: transactions.slice(i, i + CHUNK_SIZE),
            pageNum: pages.length + 1,
            isLast: i + CHUNK_SIZE >= totalTx
          });
        }
      } else if (totalTx >= 24) {
        pages.push({
          items: transactions,
          pageNum: 1,
          isLast: false 
        });
        pages.push({
          items: [],
          pageNum: 2,
          isLast: true 
        });
      } else {
        pages.push({
          items: transactions,
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
        const text = style.textContent || "";
        const href = style.href || "";
        
        const isOurFont = text.includes('GOHQLJ+Times,New Roman') || 
                         text.includes('Times New Roman') ||
                         href.includes('StaybridgeFont');

        if (isOurFont) return; 

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
        filename: `${invoice.referenceNo}.pdf`,
        image: { type: 'jpeg', quality: 3 },
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
      <div ref={invoiceRef} className="wa-invoice-wrapper">
        <style>{`
          @page { size: A4; margin: 0mm; }
          .wa-invoice-wrapper * {
            font-family: Arial, Helvetica, sans-serif !important;
          }
          
          .wa-page {
            width: 210mm;
            min-height: 296mm;
            padding: 4mm 12mm 4mm 5mm;
            margin: 0 auto;
            background: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            box-sizing: border-box;
            color: #000;
            line-height: 1.25;
          }
          
          @media print {
            .wa-invoice-wrapper { padding: 0 !important; background: none !important; }
            .wa-page { margin: 0 !important; box-shadow: none !important; }
            .wa-page:not(:last-child) { page-break-after: always !important; }
            .no-print { display: none !important; }
          }
          
          .wa-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          .wa-table thead tr th {
            border: 1pt solid #000;
            padding: 3px 5px;
            font-weight: normal;
            text-align: center;
          }
          .wa-table tbody tr td {
            padding: 4px 5px;
            text-align: center;
            vertical-align: top;
          }
          .wa-table tbody tr:first-child td {
            padding-top: 10px;
          }
          .col-left { text-align: left !important; }
          .col-right { text-align: right !important; }
        `}</style>

        {paginatedData.map((page, idx) => (
          <div key={idx} className="wa-page">
            
            {/* Top Header & Guest Header Area */}
            <div style={{ position: 'relative', height: '135px' }}>
               {/* Logo */}
               <div style={{ position: 'absolute', top: '15px', width: '100%', textAlign: 'center' }}>
                   <img src={logo} alt="Waldorf Astoria" style={{ height: '70px', margin: '0 20px 0 0', display: 'inline-block' }}/>
               </div>
               
               {/* Right Address Box */}
               <div style={{ position: 'absolute', top: 0, right: 0, width: '290px' }}>
                  <div style={{ 
                      border: '1px solid #000', 
                      padding: '4px 6px', 
                      fontSize: '8.5pt', 
                      textAlign: 'center', 
                      lineHeight: '1.4' 
                  }}>
                      <div style={{ fontWeight: 'normal' }}>WALDORF ASTORIA CAIRO</div>
                      <div>EL-OROUBA, SHERATON</div>
                      <div>EL NOZHA 11736</div>
                      <div>Egypt</div>
                      <div>TELEPHONE +20226960000 <span style={{fontSize: '10px'}}> ◆</span>FAX +20226960000</div>
                      <div>Reservations</div>
                      <div>www.hilton.com or 1 800 HILTONS</div>
                  </div>
               </div>

               {/* Guest Name */}
              <div style={{ position: 'absolute', top: '80px', left: 0, fontSize: '9pt'}}>
                  <div style={{marginBottom: '15px'}}>{invoice.guestName}</div>
                <div style={{ fontWeight: 'normal', textTransform: 'uppercase' }}>{invoice.companyName || "AZAR TOURISM SERVICES"}</div>
                <div>Algeria Square Building Number 12 First</div>
                <div>Floor, Tripoli 1254 Tripoli</div>
                <div>Libya</div>
                <div style={{ fontSize: '9pt', marginTop: '63px', textTransform: 'uppercase' }}>
                WALDORF ASTORIA CAIRO {formatDate(invoice.invoiceDate, true)}</div>
               </div>
            </div>

            {/* Info Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', marginBottom: '4px', marginRight: '35px' }}>
              <div style={{ width: '45%', lineHeight: '1.5' }}>

              </div>

              <div style={{ width: '45%', lineHeight: '1.4' }}>
                <div style={{ display: 'flex' }}><span style={{ width: '195px' }}>Room No:</span> <span>{invoice.roomNo}</span></div>
                <div style={{ display: 'flex' }}><span style={{ width: '195px' }}>Arrival Date:</span> <span>{formatDate(invoice.arrivalDate, true)}</span></div>
                <div style={{ display: 'flex' }}><span style={{ width: '195px' }}>Departure Date:</span> <span>{formatDate(invoice.departureDate, true)}</span></div>
                <div style={{ display: 'flex' }}><span style={{ width: '195px' }}>Adult/Child:</span> <span>{invoice.paxAdult} / {invoice.paxChild}</span></div>
                <div style={{ display: 'flex' }}><span style={{ width: '195px' }}>ID:</span> <span>{invoice.userId}</span></div>
                <div style={{ display: 'flex' }}><span style={{ width: '195px' }}>VAT #:</span> <span>{invoice.vatNo || ""}</span></div>
                <div style={{ display: 'flex' }}><span style={{ width: '195px' }}>Folio No/Che:</span> <span>{invoice.folioNo || invoice.invoiceNo}</span></div>
              </div>
            </div>
            {/* Main Table */}
            <table className="wa-table">
              <thead>
                <tr>
                  <th className="col-left" style={{ width: '12%', paddingLeft: '4px' }}>DATE</th>
                  <th className="col-left" style={{ width: '19%', paddingLeft: '4px', borderLeft: 'none' }}>DESCRIPTION</th>
                  <th style={{ width: '18%', borderLeft: 'none' }}>RATE</th>
                  <th style={{ width: '10%', borderLeft: 'none' }}>Cashier ID:</th>
                  <th style={{ width: '10%', borderLeft: 'none' }}>REF NO</th>
                  <th style={{ width: '12%', borderLeft: 'none' }}>CHARGES</th>
                  <th style={{ width: '10%', borderLeft: 'none' }}>CREDIT</th>
                  <th style={{ width: '9%', borderLeft: 'none' }}>BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((it, midx) => (
                  <tr key={midx}>
                    <td className="col-left" style={{ paddingLeft: '5px' }}>{it.date}</td>
                    <td className="col-left whitespace-nowrap">{it.text}</td>
                    <td>{it.exchangeRate}</td>
                    <td>{invoice.cashierId || "MEZZ"}</td>
                    <td>{it.refNo}</td>
                    <td className="col-right">{formatCurrency(it.charges)}</td>
                    <td>{it.credits ? formatCurrency(it.credits) : ""}</td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Final Totals */}
            {page.isLast && (
              <>
                 <div style={{ borderTop: '2px solid #000', marginTop: '10px', marginBottom: '1px' }}></div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', padding: '0 5px' }}>
                    
                    <div style={{ width: '440px', lineHeight: '1.2' }}>
                        <div style={{ display: 'flex', marginBottom: '1px' }}>
                            <div style={{ width: '127px' }}></div>
                            <div style={{ width: '180px', textAlign: 'right', marginTop: '40px'}}>Total Excluding VAT</div>
                            <div style={{ width: '80px', textAlign: 'right', marginTop: '40px', marginLeft: '40px' }}>VAT</div>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <div style={{ width: '135px' }}>SVC Charge 12%</div>
                            <div style={{ width: '140px', textAlign: 'right', marginLeft: '30px' }}>{formatCurrency(invoice.baseTaxableAmount)}</div>
                            <div style={{ width: '80px', textAlign: 'right', marginLeft: '40px' }}>{formatCurrency(invoice.serviceCharge)}</div>
                        </div>
                        <div style={{ display: 'flex'}}>
                            <div style={{ width: '135px' }}>VAT 14%</div>
                            <div style={{ width: '140px', textAlign: 'right', marginLeft: '30px' }}>{formatCurrency(invoice.totalExVat)}</div>
                            <div style={{ width: '80px', textAlign: 'right', marginLeft: '40px' }}>{formatCurrency(invoice.vat14Percent)}</div>
                        </div>
                        <div style={{ display: 'flex'}}>
                            <div style={{ width: '135px' }}>Municipality Tax 1%</div>
                            <div style={{ width: '140px', textAlign: 'right', marginLeft: '30px' }}>{formatCurrency(invoice.munichTax1percent)}</div>
                            <div style={{ width: '80px', textAlign: 'right', marginLeft: '40px' }}>{formatCurrency(invoice.cityTax)}</div>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <div style={{ width: '135px' }}>Development Tax 12%</div>
                            {/* <div style={{ width: '140px', textAlign: 'right' }}>{formatCurrency(invoice.baseTaxableAmount)}</div> */}
                            {/* <div style={{ width: '80px', textAlign: 'right' }}>{formatCurrency(invoice.developmentTax || 0)}</div> */}
                        </div>
                    </div>

                    <div style={{ width: '240px', lineHeight: '1.4' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total EGP</span>
                            <span>{formatCurrency(invoice.grandTotalEgp)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total In USD</span>
                            <span>{formatCurrency(invoice.balanceUsd)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase' }}>
                            <span>BALANCE</span>
                            <span>EGP 0.00</span>
                        </div>
                    </div>

                 </div>
              </>
            )}

            {/* Pagination Footer */}
            <div style={{ position: 'absolute', bottom: '15mm', width: 'calc(100% - 24mm)', textAlign: 'center', fontSize: '9pt' }}>
              Page:{page.pageNum}
            </div>

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default WaldorfAstoriaInvoiceView;