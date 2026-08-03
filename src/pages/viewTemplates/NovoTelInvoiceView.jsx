



import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { InvoiceTemplate, NovotelInvoiceHeader, NovotelInvoiceFooter } from "../../components";
import tunisiaInvoiceApi from "../../Api/tunisiainvoice.api";
import html2pdf from "html2pdf.js";
import toast from "react-hot-toast";

export default function NovotelInvoiceView({ invoiceData }) {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(!invoiceData);
    const [error, setError] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [paginatedData, setPaginatedData] = useState([]);
    const invoiceRef = useRef(null);

    const location = useLocation();
    const { novoid, invoiceNumber } = useParams();
    const navigate = useNavigate();
    const invoiceId = novoid || invoiceNumber;

    const LOGO_URL = "/novotel_logo.png";
    const STAMP_URL = "/novotel_stemp.png";
    const ROWS_PER_PAGE = 28;

    const isPdfDownload = location.pathname.includes("/nvdownload-pdf");

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (invoiceData) {
            try {
                const transformed = transformApiData(invoiceData);
                setInvoice(transformed);
            } catch (err) {
                console.error("Error transforming invoice data:", err);
                setError(err.message || "Failed to parse invoice data");
            } finally {
                setLoading(false);
            }
        } else if (invoiceId) {
            fetchInvoiceData();
        } else {
            setError("No invoice identifier provided");
            setLoading(false);
        }
    }, [invoiceData, invoiceId]);

    const fetchInvoiceData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await tunisiaInvoiceApi.getInvoiceById(invoiceId);
            const data = response.data || response;

            const transformedData = transformApiData(data);
            setInvoice(transformedData);
        } catch (err) {
            console.error("Error fetching invoice:", err);
            setError(err.message || "Failed to load invoice data");
        } finally {
            setLoading(false);
        }
    };

    // ── Date formatter ────────────────────────────────────────────────────────
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

    // ── Transform: real Tunisia flat schema -> table lines, grouped by date ────
    // Order within a day: accommodation (1) -> city tax (2) -> stamp tax (3) -> other services (4)
    // This mirrors the original InvoiceViewPage row-building logic exactly,
    // just pointed at the actual saved field names (accommodationDetails,
    // cityTaxDetails, stampTaxDetails, otherServices - all flat, no nesting).
    const transformApiData = (data) => {
       if (!data) return null;

    const lines = [];
    const itemsByDate = {};

    const pushItem = (date, item) => {
        if (!date) return;
        if (!itemsByDate[date]) itemsByDate[date] = [];
        itemsByDate[date].push(item);
    };

    // 1. Accommodation rows
    (data.accommodationDetails || []).forEach((d) => {
        pushItem(d.date, {
            date: formatDate(d.date),
            description: d.description || "Hébergement",
            debit: parseFloat(d.debitTnd ?? d.rate) || 0,
            credit: parseFloat(d.creditTnd) || 0,
            order: 1,
        });
    });

    // 2. City tax rows - one per night, always shown
    (data.cityTaxDetails || []).forEach((d) => {
        pushItem(d.date, {
            date: formatDate(d.date),
            description: d.description || "Taxe de séjour",
            debit: parseFloat(d.amount) || 0,
            credit: 0,
            order: 2,
        });
    });

    // 3. Laundry (otherServices) - each on its own date
    (data.otherServices || []).forEach((s) => {
        pushItem(s.date || data.invoiceDate, {
            date: formatDate(s.date || data.invoiceDate),
            description: s.name || "Laundry",
            debit: parseFloat(s.amount) || 0,
            credit: 0,
            order: 3,
        });
    });

    // 4. Stamp tax - one-time row, first night only
    const firstNightDate = data.accommodationDetails?.[0]?.date || data.arrivalDate;
    (data.stampTaxDetails || []).forEach((d) => {
        pushItem(d.date || firstNightDate, {
            date: formatDate(d.date || firstNightDate),
            description: d.description || "Droit de timbre",
            debit: parseFloat(d.amount) || 0,
            credit: 0,
            order: 4,
        });
    });

    // Flatten: sort within each date by order, then across dates chronologically
    Object.keys(itemsByDate).forEach((date) => {
        const dateItems = itemsByDate[date];
        dateItems.sort((a, b) => a.order - b.order);
        lines.push(...dateItems);
    });

    lines.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        const convertDate = (dateStr) => {
            const parts = dateStr.split("/");
            if (parts.length !== 3) return 0;
            return parseInt(parts[2] + parts[1] + parts[0]);
        };
        return convertDate(a.date) - convertDate(b.date);
    });


        const persons =
            data.nbPersons || (data.adults || 0) + (data.children || 0) || "";

        return {
            guestName: data.guestName || "Guest",
            persons,
            roomNo: data.roomNo || "",
            referenceNo: data.refferenceNo || data.invoiceNo || "",
            arrival: formatDate(data.arrivalDate),
            departure: formatDate(data.departureDate),
            issueDate: formatDate(data.invoiceDate),

            // Company / billing info - real field names from the saved schema
            companyName: data.companyName || "Azar Tourism Services",
            companyAddress: "Tripoli Tower Ground Floor Office no 50, Tripoli, Libya.",
            accountNo: data.arAccount || "",
            vatNo: data.vatNo || "",
            invoiceNo: data.invoiceNo || "",
            cashier: data.cashierName || data.cashierId || "",

            currency: "TND",
            // TND-direct hotels convert to USD via exchangeUsdRate (not the EUR rate)
            exchangeRate: parseFloat(data.exchangeUsdRate) || 0,
            lines,

            // Tax breakdown - already correctly separated by the backend, no re-deriving
            netTaxable: parseFloat(data.totalHorsTaxes) || 0,
            fdsct: parseFloat(data.fdcst1Pct) || 0,
            vat7Total: parseFloat(data.vat7Pct) || 0,
            cityTaxTotal: parseFloat(data.cityTaxTotal) || 0,
            stampTaxTotal: parseFloat(data.stampTaxTotal) || 0,
            // grandTotalTnd is now the single source of truth - accommodation + city tax
            // + stamp tax + services, added exactly once. Matches sum of all line items.
            grossTotal: parseFloat(data.grandTotalTnd) || 0,
            // Backend-calculated USD balance, preferred over re-deriving on the frontend
            balanceUsd: parseFloat(data.balanceUsd) || 0,
        };
    };

    // ── Auto PDF download (when routed via /nvdownload-pdf) ─────────────────────
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
                await new Promise((res) => setTimeout(res, 300));
                if (cancelled) return;
                await handleDownloadPDF();
                if (!cancelled) navigate("/invoices", { replace: true });
            } catch (e) {
                console.error("Auto PDF failed:", e);
            }
        };

        autoDownload();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPdfDownload, invoice, paginatedData]);

    // ── Pagination ────────────────────────────────────────────────────────────
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
            if (pages.length === 0) {
                pages.push({ lines: [], pageNum: 1, isLastPage: true });
            }
            setPaginatedData(pages);
        }
    }, [invoice]);

    // ── PDF export ────────────────────────────────────────────────────────────
    const handleDownloadPDF = async () => {
        if (!invoiceRef.current) return;
        setPdfLoading(true);

        const headStyles = Array.from(
            document.head.querySelectorAll('link[rel="stylesheet"], style')
        );
        headStyles.forEach((style) => {
            if (style.parentNode) style.parentNode.removeChild(style);
        });

        try {
            const images = invoiceRef.current.querySelectorAll("img");
            await Promise.all(
                Array.from(images).map((img) => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                })
            );

            await new Promise((resolve) => setTimeout(resolve, 500));

            const element = invoiceRef.current;
           const opt = {
      margin: 0,
      filename: `${invoice.referenceNo|| "Invoice"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 794,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      
      // Update this line to strict CSS mode to respect your 'page-break-after' rule
      pagebreak: { mode: "css" }, 
  };

            await html2pdf().set(opt).from(element).save();
            toast.success("PDF Downloaded Successfully");
        } catch (error) {
            console.error("❌ PDF Error:", error.message);
            toast.error("Failed to generate PDF");
        } finally {
            headStyles.forEach((style) => document.head.appendChild(style));
            setPdfLoading(false);
        }
    };

    const handlePrint = () => window.print();

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalDebit = invoice?.lines?.reduce((s, l) => s + (l.debit || 0), 0) || 0;
    const totalCredit = invoice?.lines?.reduce((s, l) => s + (l.credit || 0), 0) || 0;
    // Prefer the backend-calculated USD balance; fall back to a manual conversion
    // only if it's missing, guarding against divide-by-zero.
    const totalUSD = invoice?.balanceUsd
        ? invoice.balanceUsd.toFixed(2)
        : (totalDebit / (invoice?.exchangeRate || 1)).toFixed(2);
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
            {invoice && (
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
min-height: 295mm;
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
    margin-bottom: 3px;
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

                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "11px",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            backgroundColor: "#ebebeb",
                                            borderTop: "1px solid #000",
                                            borderBottom: "1px solid #000",
                                            lineHeight:"1.1"
                                        }}
                                    >
                                        <th style={{ textAlign: "left", padding: "1px 4px", width: "10%", verticalAlign: "top"}}>
                                            Date
                                        </th>
                                        <th style={{ textAlign: "left", padding: "1px 4px", width: "55%",verticalAlign: "top" }}>
                                            Description
                                        </th>
                                        <th style={{ textAlign: "right", padding: "1px 4px", width: "11%" }}>
                                            Debits
                                            <br />
                                            <span style={{fontWeight: "normal"}}>{invoice.currency}</span>
                                        </th>
                                        <th style={{ textAlign: "right", padding: "1px 4px", width: "15%" }}>
                                            Credits
                                            <br />
                                            <span style={{fontWeight: "normal"}}>{invoice.currency}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody style={{lineHeight:"1.1"}}>
    {pageData.lines.length > 0 ? (
        pageData.lines.map((line, i) => (
            <tr key={i}>
                <td style={{ 
                    padding: "1px", 
                    paddingTop: i === 0 ? "14px" : "1px" 
                }}>
                    {line.date}
                </td>
                
                <td style={{ 
                    padding: "1px", 
                    paddingTop: i === 0 ? "14px" : "1px" 
                }}>
                    {line.description}
                </td>
                
                <td style={{ 
                    textAlign: "right", 
                    padding: "1px", 
                    paddingTop: i === 0 ? "14px" : "1px" 
                }}>
                    {Number(line.debit).toFixed(3)}
                </td>
                
                <td style={{ 
                    textAlign: "right", 
                    padding: "2px", 
                    paddingTop: i === 0 ? "14px" : "2px" 
                }}>
                    {Number(line.credit).toFixed(3)}
                </td>
            </tr>
        ))
    ) : (
        <tr>
            <td colSpan={4} style={{ textAlign: "center", padding: "8px" }}>
                No invoice items found
            </td>
        </tr>
    )}
</tbody>
                            </table>

                            {pageData.isLastPage && (
                                <NovotelInvoiceFooter
                                    invoice={invoice}
                                    totalDebit={totalDebit}
                                    totalCredit={totalCredit}
                                    totalUSD={totalUSD}
                                />
                            )}

                            <img
                                src={STAMP_URL}
                                alt="Novotel Stamp"
                                className="stamp-logo"
                                style={{
                                    position: "absolute",
                                    right: "20px",
                                    bottom: "15px",
                                    width: "110px",
                                    height: "60px",
                                    marginBottom: "6px",
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </InvoiceTemplate>
    );
}