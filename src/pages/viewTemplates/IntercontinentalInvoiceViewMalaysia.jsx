import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate } from "../../components";
import logo from '/InterContinental-logo.jpeg';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
    } catch { 
        return dateStr; 
    }
};

const formatCurrency = (val) => {
    if (val === null || val === undefined || val === "") return "0.00";
    return parseFloat(val).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const parseDateForSort = (dateStr) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
};

const IntercontinentalInvoiceViewMalaysia = ({ invoiceData }) => {
    const { invoiceId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const invoiceRef = useRef(null);

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [paginatedData, setPaginatedData] = useState([]);

    const isPdfDownload = location.pathname.includes("/download-pdf");

    // ─────────────────────────────────────────────────────────────────────────────
    // MAPPING API DATA
    // ─────────────────────────────────────────────────────────────────────────────
    const mapApiDataToInvoice = (data) => {
        if (!data) return null;

        const accommodationItems = (data.accommodationDetails || []).map((item, index) => ({
            id: `acc_${index}`,
            rawDate: parseDateForSort(item.date),
            date: item.date,
            desc: item.description,
            ref: item.reference || "",
            amount: item.amount
        }));

        const serviceItems = (data.otherServices || []).map((item, index) => ({
            id: `ser_${index}`,
            rawDate: parseDateForSort(item.date),
            date: item.date,
            desc: item.description,
            ref: item.reference || "",
            amount: item.amount
        }));

        const allItems = [...accommodationItems, ...serviceItems].sort((a, b) => a.rawDate - b.rawDate);

        return {
            guestName:     data.guestName     || "",
            address:       data.address       || "",
            country:       data.nationality   || "",
            invoiceNo:     data.invoiceNo     || "",
            roomNo:        data.roomNo        || "",
            arrivalDate:   data.arrivalDate,
            departureDate: data.departureDate,
            membershipNo:  data.membershipNo  || "",
            companyName:   data.companyName   || "",
            sstNo:         data.sstRegNo      || "",
            cashierName:   data.cashierName   || "",
            items: allItems,
            summary: {
                excludedTax: data.baseTaxableAmount || 0,
                serviceTax:  data.totalSst8Percent  || 0,
                tourismTax:  data.totalTourismTax   || 0,
                totalAmount: data.grandTotalMyr     || 0,
                totalAmountUsd: data.balanceUsd     || 0,
                balance:     0.00
            }
        };
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // LOAD INVOICE DATA — only from prop (like Oasia), no dummy fallback
    // ─────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (invoiceData) {
            setInvoice(mapApiDataToInvoice(invoiceData));
            setLoading(false);
        }
    }, [invoiceData]);

    // ─────────────────────────────────────────────────────────────────────────────
    // AUTOMATED PDF DOWNLOAD HOOK
    // ─────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isPdfDownload && invoice && invoiceRef.current) {
            const timer = setTimeout(async () => {
                await handleDownloadPDF();
                navigate("/invoices", { replace: true });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isPdfDownload, invoice, navigate]);

    // ─────────────────────────────────────────────────────────────────────────────
    // PAGINATION LOGIC
    // ─────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!invoice?.items) return;

        const tx = invoice.items;
        const pages = [];
        const MAX_ROWS_NORMAL_PAGE = 25;

        if (tx.length === 0) {
            pages.push({ items: [], showTotals: true });
        } else {
            for (let i = 0; i < tx.length; i += MAX_ROWS_NORMAL_PAGE) {
                const chunk = tx.slice(i, i + MAX_ROWS_NORMAL_PAGE);
                const isLastChunk = i + MAX_ROWS_NORMAL_PAGE >= tx.length;
                pages.push({ items: chunk, showTotals: isLastChunk });
            }
        }

        const totalPages = pages.length;
        pages.forEach((p, idx) => {
            p.pageNo = idx + 1;
            p.totalPages = totalPages;
            p.isLastPage = p.showTotals;
        });

        setPaginatedData(pages);
    }, [invoice]);

    // ─────────────────────────────────────────────────────────────────────────────
    // PDF GENERATION — Staybridge-style (style guard + restore)
    // ─────────────────────────────────────────────────────────────────────────────
    const handleDownloadPDF = async () => {
        if (!invoiceRef.current) return;
        setPdfLoading(true);

        // 1. Style Guard — collect all head styles
        const headStyles = Array.from(
            document.head.querySelectorAll('link[rel="stylesheet"], style')
        );

        // 2. Remove only non-essential styles (keep our inline invoice style)
        headStyles.forEach(style => {
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        });

        try {
            // 3. Wait for all images to load
            const images = invoiceRef.current.querySelectorAll('img');
            await Promise.all(
                Array.from(images).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                })
            );

            // 4. Layout settle delay
            await new Promise(resolve => setTimeout(resolve, 500));

            const element = invoiceRef.current;
            const opt = {
                margin: 0,
                filename: `IC_KualaLumpur_${invoice.invoiceNo || 'Invoice'}.pdf`,
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
            toast.success("Invoice Downloaded Successfully");
        } catch (err) {
            console.error("❌ PDF Error:", err);
            toast.error("Error generating PDF");
        } finally {
            // 5. Instant Recovery — restore all removed styles
            headStyles.forEach(style => {
                if (!style.parentNode) {
                    document.head.appendChild(style);
                }
            });
            setPdfLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // PRINT — Staybridge-style
    // ─────────────────────────────────────────────────────────────────────────────
    const handlePrint = () => window.print();

    if (!invoice) return null;

    return (
        <InvoiceTemplate
            loading={loading}
            invoice={invoice}
            pdfLoading={pdfLoading}
            onDownloadPDF={handleDownloadPDF}
            onPrint={handlePrint}
            onBack={() => navigate("/invoices")}
        >
            <div className="ic-main-wrapper" ref={invoiceRef}>
                <style dangerouslySetInnerHTML={{ __html: `
                    @page { size: A4; margin: 0mm; }

                    .ic-main-wrapper { 
                        width: 100%; 
                        background: #fff; 
                        font-family: Arial, Helvetica, sans-serif; 
                        color: #000; 
                        font-size: 12px;
                    }
                    .ic-sheet { 
                        width: 210mm; 
                        min-height: 296mm; 
                        padding: 30px 25px; 
                        margin: 0 auto; 
                        box-sizing: border-box; 
                        background: #fff; 
                        page-break-after: always; 
                        break-after: page;
                        position: relative; 
                        display: flex; 
                        flex-direction: column;
                    }
                    .ic-sheet:last-child {
                        page-break-after: avoid; 
                        break-after: avoid;
                    }
                    .header { text-align: center; margin-bottom: 30px; display: flex; justify-content: center;}
                    .logo-img { max-width: 170px; height: auto; }
                    
                    .top-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .guest-info { width: 45%; line-height: 1.3; }
                    .guest-info-address { max-width: 250px; line-height: 1.4; word-wrap: break-word; }
                    .invoice-title { width: 45%; text-align: left; padding-left: 20px; font-weight: bold; font-size: 12px; padding-top: 15px;}
                    
                    .details-container { display: flex; justify-content: space-between; margin-bottom: 30px; margin-top: 40px;}
                    .details-table { width: 100%; border-collapse: collapse; font-size: 12px;}
                    .details-table td { padding: 3px 0; vertical-align: top; border: none; }
                    detials-table2 { width: 100%; border-collapse: collapse; font-size: 12px;}
                    detials-table2 td { padding: 2px 0; vertical-align: top; border: none; }
                    .details-table2 .colon { width: 10px; text-align: center; }

                    .details-table .lbl { width: 95px; }
                    .details-table .colon { width: 10px; text-align: center; }
                    .left-details-wrapper { width: 48%; }
                    .right-details-wrapper { width: 40%; }
                    
                    .user-info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px;}
                    .user-info-row > div { flex: 1; }
                    .user-info-row > div:nth-child(1) { padding-left: 15%; }
                    .user-info-row > div:nth-child(2) { text-align: center; }
                    .user-info-row > div:nth-child(3) { text-align: right; padding-right: 10%; }
                    
                    .main-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 10px; 
                        flex-grow: 0;
                        font-size: 12px; 
                        table-layout: fixed;
                    }
                    .main-table th { 
                        background-color: #d1d1d1 !important; 
                        padding: 6px 10px; 
                        text-align: left; 
                        font-weight: normal; 
                        border: none;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .main-table th.right-align { text-align: right; padding-right: 48px; }
                    .main-table td { 
                        padding: 10px 10px;
                        vertical-align: top; 
                        border: none; 
                        line-height: 1.3;
                    }
                    .main-table td.right-align { text-align: right; padding-right: 48px; }
                    .main-table tr { height: auto !important; }

                    .ic-spacer { flex-grow: 1; }
                    
                    .totals-container { display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 30px; width: 100%; }
                    .totals-wrapper { width: 390px; } 
                    .balance-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .balance-label { text-align: right; }
                    .balance-value { text-align: right; padding-right: 48px; }
                    
                    .thick-line { border-top: 3px solid #000; width: 100%; margin-bottom: 11px; margin-top: 13px;}
                    
                    .totals-table { width: 80%; border-collapse: collapse; font-size: 12px; }
                    .totals-table td { padding: 2px 0px 2px 30px; border: none; }
                    .totals-table .label-col { text-align: right; }
                    .label-col2 { text-align: right; padding-left: 0px !important; }
                    .totals-table .val-col { text-align: left; padding-right: 15px; }
                    
                    .footer { text-align: center; font-size: 10px; line-height: 1.4; color: #000; margin-top: auto; padding-top: 20px; }

                    @media print {
                        body { background: none; }
                        .ic-main-wrapper { padding: 0 !important; background: none !important; }
                        .ic-sheet { 
                            margin: 0 auto !important; 
                            box-shadow: none !important; 
                            page-break-after: always !important; 
                            break-after: page !important; 
                        }
                        .ic-sheet:last-child { page-break-after: avoid !important; break-after: avoid !important; }
                        .no-print { display: none !important; }
                    }
                `}} />

                {paginatedData.map((page, index) => (
                    <div
                        className="ic-sheet"
                        key={index}
                        style={index === paginatedData.length - 1 ? { pageBreakAfter: 'avoid', breakAfter: 'avoid' } : {}}
                    >
                        {/* ── HEADER ── */}
                        <div className="header">
                            <img src={logo} alt="InterContinental Logo" className="logo-img" />
                        </div>

                        {/* ── GUEST INFO + TITLE ── */}
                        <div className="top-section">
                            <div className="guest-info">
                                <div>{invoice.guestName}</div>
                                {invoice.address && <div className="guest-info-address">{invoice.address}</div>}
                                {invoice.country && <div>{invoice.country}</div>}
                            </div>
                            <div className="invoice-title">
                                INFORMATION INVOICE
                            </div>
                        </div>

                        {/* ── DETAILS ── */}
                        <div className="details-container">
                            <div className="left-details-wrapper">
                                <table className="details-table">
                                    <tbody>
                                        <tr>
                                            <td className="lbl">Membership No.</td>
                                            <td className="colon">:</td>
                                            <td>{invoice.membershipNo}</td>
                                        </tr>
                                        <tr>
                                            <td className="lbl">Company Name</td>
                                            <td className="colon">:</td>
                                            <td>{invoice.companyName}</td>
                                        </tr>
                                        <tr>
                                            <td className="lbl">SST No.</td>
                                            <td className="colon">:</td>
                                            <td>{invoice.sstNo}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="right-details-wrapper">
                                <table className="details-table2">
                                    <tbody>
                                        <tr>
                                            <td className="lbl" style={{width: "110px"}}>Invoice No.</td>
                                            <td className="colon">:</td>
                                            <td>{invoice.invoiceNo}</td>
                                        </tr>
                                        <tr>
                                            <td className="lbl">Room Number</td>
                                            <td className="colon">:</td>
                                            <td>{invoice.roomNo}</td>
                                        </tr>
                                        <tr>
                                            <td className="lbl">Arrival Date</td>
                                            <td className="colon">:</td>
                                            <td>{formatDate(invoice.arrivalDate)}</td>
                                        </tr>
                                        <tr>
                                            <td className="lbl">Departure Date</td>
                                            <td className="colon">:</td>
                                            <td>{formatDate(invoice.departureDate)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── USER INFO ROW ── */}
                        <div className="user-info-row">
                            <div>Room No: {invoice.roomNo}</div>
                            <div>User: {invoice.cashierName}</div>
                            <div>Cashier No: &nbsp; {invoice.cashierName}</div>
                        </div>

                        {/* ── MAIN TABLE ── */}
                        <table className="main-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '12%' }}>Date</th>
                                    <th style={{ width: '43%' }}>Descriptions</th>
                                    <th style={{ width: '35%' }}>References</th>
                                    <th className="right-align" style={{ width: '15%' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {page.items.map((item, idx) => (
                                    <tr key={item.id || idx}>
                                        <td>{formatDate(item.date)}</td>
                                        <td style={{ whiteSpace: 'pre-line' }}>{item.desc}</td>
                                        <td style={{ whiteSpace: 'pre-line' }}>{item.ref}</td>
                                        <td className="right-align">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* ── SPACER ── */}
                        <div className="ic-spacer" />

                        {/* ── TOTALS (last page only) ── */}
                        {page.isLastPage && (
                            <div className="totals-container">
                                <div className="totals-wrapper">
                                    <div className="balance-row">
                                        <span className="balance-label" style={{ flex: "0.65" }}>Balance RM</span>
                                        <span className="balance-value">{formatCurrency(invoice.summary.balance)}</span>
                                    </div>
                                    <div className="thick-line"></div>
                                    <table className="totals-table">
                                        <tbody>
                                            <tr>
                                                <td className="label-col2">Total Amount Excluded Service Tax:</td>
                                                <td className="val-col">{formatCurrency(invoice.summary.excludedTax)}</td>
                                            </tr>
                                            <tr>
                                                <td className="label-col2">Service Tax:</td>
                                                <td className="val-col">{formatCurrency(invoice.summary.serviceTax)}</td>
                                            </tr>
                                            <tr>
                                                <td className="label-col2">TTX @ RM10.00 per Night:</td>
                                                <td className="val-col">{formatCurrency(invoice.summary.tourismTax)}</td>
                                            </tr>
                                            <tr>
                                                <td className="label-col2">Total Amount:</td>
                                                <td className="val-col">{formatCurrency(invoice.summary.totalAmount)}</td>
                                            </tr>
                                            <tr>
                                                <td className="label-col2"> Total USD:</td>
                                                <td className="val-col">{formatCurrency(invoice.summary.totalAmountUsd)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </InvoiceTemplate>
    );
};

export default IntercontinentalInvoiceViewMalaysia;