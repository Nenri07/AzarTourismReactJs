import { useEffect, useState } from "react";
import {
  calculateFinalSummary,
  calculateAccommodation,
  detectHotelType,
  parseNum,
} from "../../utils/invoiceCalculationsTurkey";

// ─────────────────────────────────────────────────────────────────────────────
// TurkeySummarySection
//
// Displays the live-calculated invoice summary for ALL Turkey V2 hotels.
//
// Layout:
//   Left  — Status selector + Note textarea
//   Right — Calculation breakdown panel
//
// For Radisson hotels (isRadisson: true) an additional collapsible per-night
// table is shown below the summary panel, showing the two-row breakdown
// (Otel Harcamaları 10% + Accommodation Tax 0%) for every night.
// ─────────────────────────────────────────────────────────────────────────────

const TurkeySummarySection = ({
  config,
  formData = {},
  onStatusChange,
  onNoteChange,
}) => {
  const [summary,      setSummary]      = useState({});
  const [accCalc,      setAccCalc]      = useState(null);
  const [localStatus,  setLocalStatus]  = useState(formData?.status || "pending");
  const [localNote,    setLocalNote]    = useState(formData?.note   || "");
  const [showNightly,  setShowNightly]  = useState(false);

  const hotelType = detectHotelType(config);
  const isRadisson = ["RADISSON_HARBIYE", "RADISSON_COLLECTION", "RADISSON_BLU_SISLI"].includes(hotelType);

  // Keep local state in sync if parent resets formData (e.g. on load)
  useEffect(() => {
    setLocalStatus(formData?.status || "pending");
  }, [formData?.status]);

  useEffect(() => {
    setLocalNote(formData?.note || "");
  }, [formData?.note]);

  // Recalculate whenever any relevant input changes
  useEffect(() => {
    const s  = calculateFinalSummary(formData, hotelType);
    const ac = calculateAccommodation(formData, hotelType);
    setSummary(s);
    setAccCalc(ac);
  }, [
    formData.accommodation_details?.eur_amount,
    formData.accommodation_details?.exchange_rate,
    formData.accommodation_details?.total_nights,
    formData.arrival_date,
    formData.pax,
    formData.adults,
    // Stringify services to detect row-level changes without deep compare
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (formData.other_services || []).map((s) => `${s.gross_amount}`).join(","),
    hotelType,
  ]);

  // ── Formatting helpers ─────────────────────────────────────────────────────

  const fmt = (val, decimals = 2) =>
    Number(val || 0).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const currency = config?.currency || "TRY";

  const hasData =
    parseFloat(formData.accommodation_details?.eur_amount    || 0) > 0 &&
    parseFloat(formData.accommodation_details?.exchange_rate || 0) > 0;

  // ── Summary rows definition ────────────────────────────────────────────────
  //
  // Maps directly to the calculateFinalSummary() return keys.
  //
  const summaryRows = [
    {
      label:   "Total Room (All Nights)",
      key:     "total_room_all_nights",
      indent:  false,
    },
    {
      label:   "Taxable Amount (Room) — d",
      key:     "total_taxable_amount_room",
      indent:  true,
    },
    {
      label:   "VAT 10% (Room) — g",
      key:     "total_vat_10",
      indent:  true,
    },
    {
      label:   "Accommodation Tax 2% — j",
      key:     "total_accommodation_tax",
      indent:  true,
    },
    // Services block — only shown when there are services
    {
      label:   "Other Services (Gross)",
      key:     "total_laundry_amount",
      indent:  false,
      hideIfZero: true,
    },
    {
      label:   "Services Taxable — e",
      key:     "total_laundry_taxable",
      indent:  true,
      hideIfZero: true,
    },
    {
      label:   "VAT 20% (Services) — h",
      key:     "total_vat_20",
      indent:  true,
      hideIfZero: true,
    },
    {
      label:   "Total Taxable — f",
      key:     "total_taxable_amount",
      indent:  false,
      divider: true,
    },
    {
      label:   "Total VAT — i",
      key:     "total_vat",
      indent:  false,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">

      {/* Header */}
      <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-3">
        <h3 className="font-bold text-base md:text-lg text-slate-800">Invoice Summary</h3>
        <div className="flex items-center gap-2">
          {isRadisson && (
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wide">
              Radisson Mode
            </span>
          )}
          <span className="px-2 py-1 bg-[#003d7a] text-white text-[10px] font-bold rounded uppercase tracking-wide">
            Turkey
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ── Left: Status + Note ───────────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={localStatus}
              onChange={(e) => {
                setLocalStatus(e.target.value);
                onStatusChange?.(e.target.value);
              }}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a] text-sm transition-colors"
            >
              <option value="pending">Pending</option>
              <option value="ready">Ready</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Note</label>
            <textarea
              value={localNote}
              onChange={(e) => {
                setLocalNote(e.target.value);
                onNoteChange?.(e.target.value);
              }}
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a] text-sm resize-none transition-colors"
              placeholder="Internal notes…"
            />
          </div>

          {/* Hotel / nights info pill */}
          {hasData && accCalc && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1 border border-slate-100">
              <div className="flex justify-between">
                <span>Hotel type</span>
                <span className="font-semibold text-slate-700">{hotelType.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span>Nights</span>
                <span className="font-semibold text-slate-700">{accCalc.totalNights}</span>
              </div>
              <div className="flex justify-between">
                <span>PAX</span>
                <span className="font-semibold text-slate-700">{accCalc.pax}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate per night</span>
                <span className="font-semibold text-slate-700">
                  {fmt(accCalc.eurAmount)} EUR × {fmt(accCalc.exchangeRate, 5)} = {fmt(accCalc.roomAmountTry)} {currency}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Calculation panel ──────────────────────────────────── */}
        <div className="bg-slate-50 p-5 rounded-xl space-y-1 border border-slate-100">
          {!hasData ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Fill in EUR Amount and Exchange Rate to see the summary.
            </div>
          ) : (
            <>
              {/* Breakdown rows */}
              {summaryRows.map((row) => {
                const val = summary[row.key] || 0;
                if (row.hideIfZero && val === 0) return null;

                return (
                  <div key={row.key}>
                    {row.divider && (
                      <div className="border-t border-slate-300 my-2" />
                    )}
                    <div
                      className={`flex justify-between items-center py-1.5 ${
                        row.indent ? "pl-4" : ""
                      }`}
                    >
                      <span className="text-slate-600 text-sm">{row.label}</span>
                      <span className="text-slate-800 font-medium text-sm tabular-nums">
                        {fmt(val)} {currency}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Grand total */}
              <div className="border-t-2 border-slate-400 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#003d7a] text-base">
                    Grand Total — k
                  </span>
                  <span className="font-bold text-[#003d7a] text-lg tabular-nums">
                    {fmt(summary.grand_total)} {currency}
                  </span>
                </div>

                {/* EUR equivalent */}
                {summary.total_in_eur > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-slate-500 text-xs">Grand Total EUR — m</span>
                    <span className="text-slate-600 font-semibold text-sm tabular-nums">
                      {fmt(summary.total_in_eur)} EUR
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Radisson: per-night breakdown table ───────────────────────────── */}
      {isRadisson && hasData && accCalc?.radissonNightRows?.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={() => setShowNightly((p) => !p)}
            className="flex items-center gap-2 text-sm font-semibold text-[#003d7a] hover:text-[#002a5c] transition-colors mb-3"
          >
            <span
              className={`inline-block transition-transform duration-200 ${
                showNightly ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
            {showNightly ? "Hide" : "Show"} per-night breakdown (
            {accCalc.radissonNightRows.length} night
            {accCalc.radissonNightRows.length !== 1 ? "s" : ""})
          </button>

          {showNightly && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#003d7a] text-white">
                    <th className="px-3 py-2 text-left font-semibold">Date</th>
                    <th className="px-3 py-2 text-left font-semibold">Description</th>
                    <th className="px-3 py-2 text-right font-semibold">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold">Net Unit</th>
                    <th className="px-3 py-2 text-right font-semibold">Net Amt</th>
                    <th className="px-3 py-2 text-right font-semibold">Tax</th>
                    <th className="px-3 py-2 text-right font-semibold">Tax Amt</th>
                    <th className="px-3 py-2 text-right font-semibold">Debit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accCalc.radissonNightRows.map((night, i) => {
                    const he  = night.hotelExpenses;
                    const at  = night.accommodationTax;
                    const bg  = i % 2 === 0 ? "bg-white" : "bg-slate-50";

                    return (
                      <>
                        {/* Row 1: Hotel Expenses */}
                        <tr key={`he-${i}`} className={bg}>
                          <td className="px-3 py-2 text-slate-600">{he.date}</td>
                          <td className="px-3 py-2 text-slate-700 font-medium">
                            {he.description}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600">{he.qty}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(he.netUnitPrice)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(he.netAmount)}</td>
                          <td className="px-3 py-2 text-right">
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                              {he.tax}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(he.taxAmount)}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-800">
                            {fmt(he.debit)}
                          </td>
                        </tr>

                        {/* Row 2: Accommodation Tax */}
                        <tr key={`at-${i}`} className={bg}>
                          <td className="px-3 py-2 text-slate-500" />
                          <td className="px-3 py-2 text-slate-500 italic">{at.description}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{at.qty}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-500">{fmt(at.netUnitPrice)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-500">{fmt(at.netAmount)}</td>
                          <td className="px-3 py-2 text-right">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">
                              {at.tax}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-500">{fmt(at.taxAmount)}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-600">
                            {fmt(at.debit)}
                          </td>
                        </tr>
                      </>
                    );
                  })}
                </tbody>

                {/* Nightly totals footer */}
                <tfoot>
                  <tr className="bg-[#f0f4f8] font-semibold border-t-2 border-slate-300">
                    <td colSpan={4} className="px-3 py-2 text-slate-700 text-xs">
                      Totals ({accCalc.totalNights} nights)
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs">
                      {fmt(accCalc.taxableAmount)}
                    </td>
                    <td />
                    <td className="px-3 py-2 text-right tabular-nums text-xs">
                      {fmt(accCalc.vat10Percent)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs text-[#003d7a]">
                      {fmt(summary.grand_total)} {currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TurkeySummarySection;