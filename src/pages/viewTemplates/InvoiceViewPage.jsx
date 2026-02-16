import { useEffect, useState, useRef } from "react";
import { Download, Printer, ArrowLeft, Loader2 } from "lucide-react";
import InvoiceApi from "../../Api/invoice.api";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import html2pdf from 'html2pdf.js';
import { InvoiceTemplate ,NovotelInvoiceFooter,NovotelInvoiceHeader} from "../../components";
import toast from "react-hot-toast";


export default function InvoiceViewPage() {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const [error, setError] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [paginatedData, setPaginatedData] = useState([]);
    const invoiceRef = useRef(null);
    const { novoid } = useParams();
    const navigate = useNavigate();
    const invoiceId = novoid;

    const LOGO_URL = "/novotel_logo.png";
    const STAMP_URL = "/novotel_stemp.png";
    const ROWS_PER_PAGE = 24;

    const isPdfDownload = location.pathname.includes("/nvdownload-pdf");

    useEffect(() => {
        if (!invoiceId) return;
        fetchInvoiceData();
    }, [invoiceId]);


    const fetchInvoiceData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await InvoiceApi.getCompleteInvoice(invoiceId);
            const data = response.data || response;


            // Transform API data to match our format
            const transformedData = transformApiData(data);

            setInvoice(transformedData);
        } catch (err) {
            console.error("Error fetching invoice:", err);
            setError(err.message || "Failed to load invoice data");
        } finally {
            setLoading(false);
        }
    };


    const transformApiData = (data) => {
        const inv = data.invoice || {};
        const lines = [];

        // Get the first night's date
        const firstNightDate =
            data.accommodation_details?.[0]?.date ||
            inv.invoice_date ||
            inv.arrival_date;
        const stampTaxAmount = parseFloat(inv.stamp_tax_total) || 0;

        // Group items by date
        const itemsByDate = {};

        // Process accommodation details
        data.accommodation_details?.forEach((d, index) => {
            const date = d.date || inv.arrival_date;
            if (!itemsByDate[date]) itemsByDate[date] = [];

            itemsByDate[date].push({
                date: formatDate(date),
                description: d.description || "Hébergement",
                debit: parseFloat(d.rate) || 0,
                credit: 0,
                order: 1, // First in sequence for each day
            });
        });

        // Process city tax details
        data.city_tax_details?.forEach((d, index) => {
            const date = d.date || inv.arrival_date;
            if (!itemsByDate[date]) itemsByDate[date] = [];

            itemsByDate[date].push({
                date: formatDate(date),
                description: d.description || "Taxe de séjour",
                debit: parseFloat(d.amount) || 0,
                credit: 0,
                order: 2, // Second in sequence for each day
            });
        });

        // Add stamp tax ONLY on the first night's date
        if (stampTaxAmount > 0 && firstNightDate) {
            if (!itemsByDate[firstNightDate]) itemsByDate[firstNightDate] = [];

            itemsByDate[firstNightDate].push({
                date: formatDate(firstNightDate),
                description: "Droit de timbre",
                debit: stampTaxAmount,
                credit: 0,
                order: 3, // Third in sequence (only on first day)
            });
        }

        // Process other services (laundry, etc.) - each on their own date
        data.other_services?.forEach((s) => {
            const serviceDate = s.date || inv.invoice_date;
            if (!itemsByDate[serviceDate]) itemsByDate[serviceDate] = [];

            itemsByDate[serviceDate].push({
                date: formatDate(serviceDate),
                description: s.name || "Service",
                debit: parseFloat(s.amount) || 0,
                credit: 0,
                order: 4, // Fourth in sequence for that date
            });
        });

        // Flatten and sort: by date, then by order within each date
        Object.keys(itemsByDate).forEach((date) => {
            const dateItems = itemsByDate[date];

            // Sort items within this date by order
            dateItems.sort((a, b) => a.order - b.order);

            // Add to lines
            lines.push(...dateItems);
        });

        // Sort all lines by date
        lines.sort((a, b) => {
            if (!a.date || !b.date) return 0;

            // Convert DD/MM/YY to YYMMDD for comparison
            const convertDate = (dateStr) => {
                const parts = dateStr.split("/");
                if (parts.length !== 3) return 0;
                return parseInt(parts[2] + parts[1] + parts[0]);
            };

            return convertDate(a.date) - convertDate(b.date);
        });

        // Calculate totals
        const accommodationTotal =
            data.accommodation_details?.reduce(
                (sum, d) => sum + (parseFloat(d.rate) || 0),
                0,
            ) || 0;
        const otherServicesTotal =
            data.other_services?.reduce(
                (sum, s) => sum + (parseFloat(s.amount) || 0),
                0,
            ) || 0;
        const totalFromForm = accommodationTotal + otherServicesTotal;

        // Extract invoice data from API response
        const invoiceData = {
            // Guest info
            guestName: inv.guest_name || "Guest",
            persons: (inv.pax_adult || 0) + (inv.pax_child || 0),
            roomNo: inv.room_no || "N/A",
            referenceNo: inv.reference_no,
            arrival: formatDate(inv.arrival_date),
            departure: formatDate(inv.departure_date),
            issueDate: formatDate(inv.invoice_date),

            // Company info
            companyName: inv.vd || "Azar Tourism Services",
            companyAddress: "Algeria Square Building Number 12 First Floor, Tripoli, Libya.",
            accountNo: inv.voucher_no || "ARZ2022TOU",
            vatNo: inv.confirmation || "",
            invoiceNo: inv.batch_no || "NOVO-13",
            cashier: inv.passport_no || "8250",

            // Financial info
            currency: "TND",
            exchangeRate: parseFloat(inv.exchange_rate) || 2.85,
            lines: lines,

            // Tax calculations
            netTaxable: parseFloat(inv.sub_total || totalFromForm) || 0,
            fdsct: parseFloat(inv.vat1_10 || 0),
            vat7Total: parseFloat(inv.vat7 || 0),
            cityTaxTotal: parseFloat(inv.city_tax_total) || 0,
            stampTaxTotal: stampTaxAmount,
            grossTotal: parseFloat(inv.grand_total || inv.grossTotal || 0),

            // Other totals
            subTotal: totalFromForm || 0,
            vat1_10: parseFloat(inv.vat1_10 || 0),
            vat7: parseFloat(inv.vat7 || 0),
            vat20: 0,
            grandTotal: parseFloat(inv.grand_total || inv.grossTotal || 0),
        };

        return invoiceData;
    };


    useEffect(() => {
        if (
            !isPdfDownload ||
            !invoice ||
            !Array.isArray(paginatedData) ||
            paginatedData.length === 0
        ) {
            return;
        }

        let cancelled = false;

        const autoDownload = async () => {
            try {
                // Small delay to ensure final render stability (important for prod)
                await new Promise((res) => setTimeout(res, 300));

                if (cancelled) return;

                await handleDownloadPDF();

                if (!cancelled) {
                    navigate("/invoices", { replace: true });
                }
            } catch (e) {
                console.error("Auto PDF failed:", e);
            }
        };

        autoDownload();

        return () => {
            cancelled = true;
        };
    }, [isPdfDownload, invoice, paginatedData, navigate]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const d = String(date.getDate()).padStart(2, "0");
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const y = String(date.getFullYear()).slice(-2);
            return `${d}/${m}/${y}`;
        } catch (e) {
            console.error("Error formatting date:", dateStr, e);
            return dateStr;
        }
    };

    useEffect(() => {
        if (invoice?.lines) {
            const pages = [];
            for (let i = 0; i < invoice.lines.length; i += ROWS_PER_PAGE) {
                pages.push({
                    lines: invoice.lines.slice(i, i + ROWS_PER_PAGE),
                    pageNum: pages.length + 1,
                    isLastPage: i + ROWS_PER_PAGE >= invoice.lines.length,
                });
            }
            // If no lines, still create one page
            if (pages.length === 0) {
                pages.push({
                    lines: [],
                    pageNum: 1,
                    isLastPage: true,
                });
            }

            setPaginatedData(pages);
        }
    }, [invoice]);

    const getBase64ImageFromUrl = async (imageUrl) => {
        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn("Image load failed:", imageUrl, e);
            return null;
        }
    };



    const handleDownloadPDF = async () => {
        if (!invoiceRef.current) return;
        setPdfLoading(true);

        // 1. Style Guard (Tailwind v4 Bypass)
        // Save and temporarily remove CSS files to avoid oklch crash
        const headStyles = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
        headStyles.forEach(style => {
            style.parentNode.removeChild(style);
        });

        try {
            // 3. Image Loading Verification
            const images = invoiceRef.current.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            // Small delay to ensure layout is settled
            await new Promise(resolve => setTimeout(resolve, 500));

            // 2 & 4. Targeting and Smart Pagination
            const element = invoiceRef.current;
            const opt = {
                margin: 0,
                filename: `${invoice.referenceNo || "Invoice"}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    scrollY: 0,
                    windowWidth: 794
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'] }
            };

            // Generate PDF
            await html2pdf().set(opt).from(element).save();
            toast.success("PDF Downloaded Successfully");
        } catch (error) {
            console.error("❌ PDF Error:", error.message);
            toast.error("Failed to generate PDF");
        } finally {
            // 5. Instant Recovery (Styles Restore)
            headStyles.forEach(style => {
                document.head.appendChild(style);
            });
            setPdfLoading(false);
        }
    };
    const handlePrint = () => window.print();

    const totalDebit = invoice?.lines?.reduce((s, l) => s + (l.debit || 0), 0) || 0;
    const totalCredit = invoice?.lines?.reduce((s, l) => s + (l.credit || 0), 0) || 0;
    const totalUSD = (totalDebit / (invoice?.exchangeRate || 2.85) || 0).toFixed(2);
    const totalPages = paginatedData.length;

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
  @page {
    size: A4;
    margin: 0;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
  }

  .invoice-page {
    position: relative;
    padding: 12px 15px 35mm 15px; 
    background: white;
    color: #000;
    min-height: 296mm;
    page-break-after: always;
    font-size: 11px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    max-width: 794px;
    margin: 0 auto;
  }

  .invoice-page:last-child {
    page-break-after: auto;
  }

  .stamp-logo {
    position: absolute;
    right: 20px;
    bottom: 15px;
    width: 110px;
    pointer-events: none;
  }

  table {
    margin-bottom: 10px;
  }

  @media print {
    body { 
      margin: 0; 
      padding: 0; 
      background: white;
    }
    
    .no-print { 
      display: none !important; 
    }
    
    .invoice-page { 
      margin: 0; 
      border: 0;
      padding: 12px 15px 35mm 15px;
    }
  }
`}</style>

                {paginatedData.map((pageData, pageIdx) => (
                    <div key={pageIdx} className="invoice-page">
                        <NovotelInvoiceHeader
                            logoUrl={LOGO_URL}
                            invoice={invoice}
                            pageNum={pageData.pageNum}
                            totalPages={totalPages}
                        />

                        {/* Table */}
                        <table
                            style={{ 
                                width: '100%', 
                                borderCollapse: 'collapse', 
                                fontSize: '11px' 
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        backgroundColor: "#ebebeb",
                                        borderTop: "1px solid #000",
                                        borderBottom: "1px solid #000",
                                    }}
                                >
                                    <th style={{ textAlign: 'left', padding: '4px', width: "15%" }}>
                                        Date
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '4px', width: "55%" }}>
                                        Description
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '4px', width: "15%" }}>
                                        Debits
                                        <br />
                                        {invoice.currency}
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '4px', width: "15%" }}>
                                        Credits
                                        <br />
                                        {invoice.currency}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageData.lines.length > 0 ? (
                                    pageData.lines.map((line, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '4px' }}>{line.date}</td>
                                            <td style={{ padding: '4px' }}>{line.description}</td>
                                            <td style={{ textAlign: 'right', padding: '4px' }}>
                                                {Number(line.debit).toFixed(3)}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '4px' }}>
                                                {Number(line.credit).toFixed(3)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '8px' }}>
                                            No invoice items found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Footer - Only on last page */}
                        {pageData.isLastPage && (
                            <NovotelInvoiceFooter
                                invoice={invoice}
                                totalDebit={totalDebit}
                                totalCredit={totalCredit}
                                totalUSD={totalUSD}
                            />
                        )}

                        {/* Stamp logo - bottom-right corner on EVERY page */}
                        <img
                            src={STAMP_URL}
                            alt="Novotel Stamp"
                            className="stamp-logo"
                            style={{ 
                                position: 'absolute',
                                right: '20px',
                                bottom: '15px',
                                width: '110px',
                                height: '60px',
                                marginBottom: '6px'
                            }}
                        />
                    </div>
                ))}
            </div>
        </InvoiceTemplate>
    );
}
