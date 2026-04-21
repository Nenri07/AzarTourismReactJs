import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import invoiceApi from "../../Api/invoice.api"; 
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from "/marriot_london-logo.jfif";

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
      setInvoice(null);
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
      const response = await invoiceApi.getInvoiceById(invoiceId);
      
      let rawData = response.data || response;
      if (rawData.data) rawData = rawData.data;
      if (rawData.data) rawData = rawData.data;
      
      setInvoice(transformInvoiceData(rawData));
    } catch (err) {
      console.error("Error fetching Marriott invoice:", err);
      toast.error("Failed to load invoice from API.");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const transformInvoiceData = (data) => {
    if (!data) return null;

    const items = [];
    
    if (data.accommodationDetails && Array.isArray(data.accommodationDetails)) {
        data.accommodationDetails.forEach(item => {
            const charge = parseFloat(item.charges_gbp || item.chargesGbp || 0);
            const credit = parseFloat(item.credits_gbp || item.creditsGbp || 0);
            
            items.push({
                date: formatDate(item.date),
                rawDate: new Date(item.date),
                text: item.text || item.description || "",
                chargesGBP: charge ? formatCurrency(charge) : "",
                creditsGBP: credit ? formatCurrency(credit) : "",
                rawCredit: credit, 
                type: 'accommodation'
            });
        });
    }

    if (data.otherServices && Array.isArray(data.otherServices)) {
        data.otherServices.forEach(service => {
            const charge = parseFloat(service.charges_gbp || service.chargesGbp || service.amount || 0);
            const credit = parseFloat(service.credits_gbp || service.creditsGbp || 0);

            items.push({
                date: formatDate(service.date),
                rawDate: new Date(service.date),
                text: service.text || service.name || service.service_type || "",
                chargesGBP: charge ? formatCurrency(charge) : "",
                creditsGBP: credit ? formatCurrency(credit) : "",
                rawCredit: credit, 
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
      formattedInvoiceDate: formatDate(data.invoiceDate || data.taxDate),
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
    if (val === undefined || val === null || val === "" || isNaN(val)) return "";
    return parseFloat(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    if (invoice && invoice.items) {
      const pages = [];
      const items = invoice.items;
      
      const CHUNK_SIZE = 22; 
      const SAFE_CHUNK_FOR_FOOTER = 15; 
      const totalTx = items.length;

      let i = 0;
      let pageNum = 1;

      while (i < totalTx) {
          const remaining = totalTx - i;
          let take = CHUNK_SIZE;

          if (remaining <= CHUNK_SIZE) {
              if (remaining > SAFE_CHUNK_FOR_FOOTER) {
                  take = SAFE_CHUNK_FOR_FOOTER;
              } else {
                  take = remaining;
              }
          }

          pages.push({
              items: items.slice(i, i + take),
              pageNum: pageNum,
              isLast: false 
          });

          i += take;
          pageNum++;
      }

      if (pages.length === 0) {
          pages.push({ items: [], pageNum: 1, isLast: true });
      } else {
          pages[pages.length - 1].isLast = true;
      }
      
      setPaginatedData(pages);
    }
  }, [invoice]);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setPdfLoading(true);

    const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
    headStyles.forEach(style => {
        if (style.parentNode) style.parentNode.removeChild(style);
    });

    try {
      const element = invoiceRef.current;
      const opt = {
        margin: 0,
        filename: `${invoice?.referenceNo}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
            scale: 3, 
            useCORS: true, 
            scrollY: 0,
            letterRendering: true 
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
      headStyles.forEach(style => document.head.appendChild(style));
      setPdfLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return <InvoiceTemplate loading={loading} onBack={() => navigate("/invoices")}><></></InvoiceTemplate>;
  }

  if (!invoice) {
    return (
        <InvoiceTemplate loading={false} onBack={() => navigate("/invoices")}>
            <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Times New Roman", Times, serif' }}>
                <h2>No Invoice Data Available</h2>
            </div>
        </InvoiceTemplate>
    );
  }

  const totalCharges = invoice.totalAmountPayable || 0;
  const totalCredits = invoice.items.reduce((sum, item) => sum + (item.rawCredit || 0), 0);
  const netRevenue = invoice.taxableAmountExclVat || 0; 
  const vatAmount = invoice.vatAt20Percent || 0;
  const balanceDue = totalCharges - totalCredits;

  const safeStr = (str) => str || "";

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
            width: 210mm;
            height: 296mm; 
            padding: 15px 0px !important; 
            margin: 0 auto;
            background-color: #ffffff;
            position: relative; 
            display: flex;
            flex-direction: column;
            line-height: 1.3;
            overflow: hidden; 
          }

          .marriott-page:not(:last-child) {
            page-break-after: always;
          }
          
          @media print {
            @page { margin: 0; size: A4 portrait; }
            body * { visibility: hidden; }
            .marriott-invoice-wrapper, .marriott-invoice-wrapper * { visibility: visible; }
            .marriott-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
            body { background: none; margin: 0; padding: 0; }
            .marriott-page { 
              padding: 5mm 3mm !important; 
              margin: 0 !important; 
              box-shadow: none !important; 
              width: 210mm !important;
              height: 296mm !important; 
              page-break-after: always;
            }
            .marriott-page:last-child { page-break-after: avoid !important; }
          }

          .m-invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px; 
              font-size: 13px;
          }
          .m-invoice-table th {
              font-weight: normal; 
              padding: 13px 0px; 
              border-top: 1px solid #000; 
              border-bottom: 1px solid #000; 
              text-align: left;
          }
          .m-invoice-table td {
              padding: 5px 0px; 
              text-align: left;
              border: none;
          }
          .m-invoice-table th.right-align, .m-invoice-table td.right-align { 
              text-align: right; 
          }
          
          .table-bottom-border {
              border-top: 1px solid #000;
              margin-top: 5px;
          }

          .info-table {
              border-collapse: collapse;
              font-size: 14px;
          }
          .info-table td {
              padding-bottom: 2px;
              vertical-align: top;
          }
          .info-table .label-col {
              width: 110px; 
          }
          .info-table .colon-col {
              width: 15px; 
          }

          
          .info-tableLeft {
              border-collapse: collapse;
              font-size: 14px;
          }
          .info-tableLeft td {
              padding-bottom: 4px;
              vertical-align: top;
          }
          .info-tableLeft .label-col {
              width: 65px; 
          }
          .info-tableLeft .colon-col {
              width: 22px; 
          }
        `}} />

        {paginatedData.map((page, idx) => (
          <div key={idx} className="marriott-page">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 25px' }}>
                <div style={{ width: '45%' }}>
                    <img src={logo} alt="marriot park lane logo" style={{padding : "5px 0px 0px 10px" , width: "125px"}}/>
                    <div style={{ paddingTop: '65px' }}>
                        <div style={{ color: '#000066', fontSize: '14px', lineHeight: '1.2', fontWeight: 'bold' }}>
                            <div>{safeStr(invoice.companyName)}</div>
                            {invoice.address ? invoice.address.split(',').map((line, i) => (
                                <React.Fragment key={i}>{line.trim()}<br/></React.Fragment>
                            )) : ""}
                        </div>
                    </div>

                    <div style={{ marginTop: '85px' }}>
                        <div style={{ fontSize: '14px', marginBottom: '5px' , fontWeight: '600'}}>INFORMATION INVOICE</div>
                        <table className="info-tableLeft">
                            <tbody>
                                <tr>
                                    <td className="label-col">Conf. No.</td>
                                    <td className="colon-col">:</td>
                                    <td>{safeStr(invoice.confNo)}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">Date</td>
                                    <td className="colon-col">:</td>
                                    <td>{safeStr(invoice.formattedInvoiceDate)}</td>
                                </tr>
                                <tr>
                                    <td className="label-col" style={{ fontWeight: '600' }}>Folio No.</td>
                                    <td className="colon-col" style={{ fontWeight: '600' }}>:</td>
                                    <td>{safeStr(invoice.folioNo)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ 
                        marginTop: '13px', 
                        fontSize: '15px', 
                        fontFamily: 'Arial, Helvetica, sans-serif',
                        fontStyle: 'italic',
                        fontWeight: '600'
                    }}>
                        {safeStr(invoice.guestName)}
                    </div>
                </div>

                <div style={{ width: '35%' }}>
                    <div style={{ fontSize: '14px', lineHeight: '1.2' }}>
                        {safeStr(invoice.hotel)}<br/>
                        {invoice.hotelAddress ? invoice.hotelAddress.split(',').map((line, i) => (
                            <React.Fragment key={i}>{line.trim()}<br/></React.Fragment>
                        )) : (
                            <React.Fragment>
                                140 Park Lane<br/>
                                London W1K 7AA<br/>
                                Tel: + 44 20 7493 7000<br/>
                                Fax: + 44 20 7493 8333<br/>
                                www.LondonMarriottParkLane.co.uk
                            </React.Fragment>
                        )}
                    </div>

                    <div style={{ marginTop: '60px' }}>
                        <table className="info-table">
                            <tbody>
                                <tr>
                                    <td className="label-col">Room No.</td>
                                    <td className="colon-col">:</td>
                                    <td>{safeStr(invoice.roomNo)}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">Arrival</td>
                                    <td className="colon-col">:</td>
                                    <td>{safeStr(invoice.formattedArrivalDate)}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">Departure</td>
                                    <td className="colon-col">:</td>
                                    <td>{safeStr(invoice.formattedDepartureDate)}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">Page No.</td>
                                    <td className="colon-col">:</td>
                                    <td>{page.pageNum} of {paginatedData.length}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">Cashier No.</td>
                                    <td className="colon-col">:</td>
                                    <td>{safeStr(invoice.cashierId || invoice.cashierNo)}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">User ID</td>
                                    <td className="colon-col">:</td>
                                    <td>{safeStr(invoice.userId)}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">VAT No.</td>
                                    <td className="colon-col">:</td>
                                    <td>{safeStr(invoice.vatNo)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <table className="m-invoice-table" style={{ padding: '0 25px', display: 'table', width: 'calc(100% - 50px)', margin: '15px auto 0' }}>
                <thead>
                    <tr>
                        <th style={{ width: '10%' , fontWeight:"600"}}>Date</th>
                        <th style={{ width: '45%' , fontWeight:"600"}}>Text</th>
                        <th className="right-align" style={{ width: '20%', fontWeight:"600" }}>Charges GBP</th>
                        <th className="right-align" style={{ width: '15%' , fontWeight:"600"}}>Credits GBP</th>
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
                </tbody>
            </table>

            {/* Calculations precisely at the end of the table rows */}
            {page.isLast && (
              <div style={{ padding: '0 25px', width: '100%' }}>
                  <div className="table-bottom-border"></div>

                  <div style={{ display: 'flex', fontWeight: 'bold', padding: '2px 0', fontSize: '13px' }}>
                      <div style={{ width: '45%' }}></div>
                      <div style={{ width: '28%', paddingLeft: '35px', textAlign: 'left' }}>Total:</div>
                      <div style={{ width: '10%', textAlign: 'right', paddingRight: '15px' }}>{totalCharges ? formatCurrency(totalCharges) : "0.00"}</div>
                      <div style={{ width: '16%', textAlign: 'right' }}>{totalCredits ? formatCurrency(totalCredits) : "0.00"}</div>
                  </div>

                  <div style={{ display: 'flex' }}>
                      <div style={{ width: '45%' }}></div>
                      <div style={{ width: '55%', borderTop: '2px solid black' }}></div>
                  </div>

                  <div style={{ display: 'flex', fontWeight: 'bold', fontSize: '12px', marginTop: '8px' }}>
                      <div style={{ width: '45%' }}>
                          <div style={{ display: 'flex', marginBottom: '1px' }}>
                              <div style={{ width: '185px' }}>Balance Due</div>
                              <div style={{ width: '80px', textAlign: 'right' }}>{formatCurrency(balanceDue)}</div>
                              <div style={{ marginLeft: '10px' }}>GBP</div>
                          </div>
                          <div style={{ display: 'flex' }}>
                              <div style={{ width: '185px' }}>TAX VAT @ 20%</div>
                              <div style={{ width: '80px', textAlign: 'right' }}>{formatCurrency(vatAmount)}</div>
                              <div style={{ marginLeft: '10px' }}>GBP</div>
                          </div>
                      </div>

                      <div style={{ width: '55%', display: 'flex', justifyContent: 'center' }}>
                          <div style={{ display: 'flex', gap: '55px', flex: "1" }}>
                              <div style={{paddingLeft: "50px"}}>Net Revenue (20% VAT)</div>
                              <div style={{paddingLeft: '15px'}}>{formatCurrency(netRevenue)} GBP</div>
                          </div>
                      </div>
                  </div>
              </div>
            )}

            {/* Thank You pinned neatly at the bottom footer block */}
            {page.isLast && (
              <div style={{ marginTop: 'auto', width: '100%', padding: '0 25px 25px 25px' }}>
                  <div style={{ fontStyle: 'italic', fontSize: '13px' }}>
                      {invoice.companyName && invoice.hotel 
                          ? `On behalf of ${invoice.companyName}, thank you for choosing ${invoice.hotel}.` 
                          : ""}
                  </div>
              </div>
            )}

          </div>
        ))}
      </div>
    </InvoiceTemplate>
  );
};

export default MarriotInvoiceView;