import { useEffect, useState } from "react";
import {
  calculateFinalSummaryTunisia,
  detectHotelTypeTunisia,
  HOTEL_CONFIGS_TUNISIA,
} from "../../utils/InvoiceCalculationsTunisia";

const TunisiaSummarySection = ({ config, formData = {}, summary: externalSummary, onStatusChange, onNoteChange }) => {
  const [localStatus, setLocalStatus] = useState(formData?.status || "pending");
  const [localNote,   setLocalNote]   = useState(formData?.note   || "");

  const hotelType = detectHotelTypeTunisia(config);
  const hCfg      = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;
  const isEurHotel = hCfg.inputCurrency === 'EUR';

  const cv = externalSummary || {};

  const fmt = (v, decimals = 3) =>
    Number(v || 0).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // Standard rows always shown
  const rows = [
    { key: 'total_hors_taxes', label: 'Total Hors Taxes (Net Taxable)',  decimals: 3 },
    { key: 'fdcst_1pct',       label: 'FDCST 1%',                        decimals: 3 },
    { key: 'vat_7pct',         label: 'VAT 7%',                          decimals: 3, divider: true },
    { key: 'city_tax_total',   label: 'City Tax',                        decimals: 3 },
    { key: 'stamp_tax',        label: 'Stamp Tax (Timbre)',               decimals: 3 },
    { key: 'grand_total_tnd',  label: 'Total TTC / Balance TND',         decimals: 3, isGrand: true },
    { key: 'balance_usd',      label: 'Balance USD',                     decimals: 2, currency: 'USD' },
    ...(isEurHotel ? [{ key: 'balance_eur', label: 'Balance EUR', decimals: 2, currency: 'EUR' }] : []),
  ];

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2">
        <h3 className="font-bold text-base md:text-lg text-slate-800">Invoice Summary</h3>
        <span className="px-2 py-1 bg-[#003d7a] text-white text-xs rounded">Tunisia Mode</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: status + note */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={localStatus}
              onChange={e => { setLocalStatus(e.target.value); onStatusChange?.(e.target.value); }}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a]"
            >
              <option value="pending">Pending</option>
              <option value="ready">Ready</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Note</label>
            <textarea
              value={localNote}
              onChange={e => { setLocalNote(e.target.value); onNoteChange?.(e.target.value); }}
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a]"
              placeholder="Internal notes..."
            />
          </div>
        </div>

        {/* Right: calculated summary */}
        <div className="bg-slate-50 p-5 rounded-xl space-y-2">
          {!cv.grand_total_tnd ? (
            <div className="text-center py-10 text-slate-500">
              Fill in accommodation details to see summary
            </div>
          ) : (
            rows.map((row, idx) => {
              const value = cv[row.key];
              if (!value && !row.isGrand && row.key !== 'balance_usd' && row.key !== 'balance_eur') return null;
              const currency = row.currency || 'TND';
              return (
                <div key={row.key}>
                  {row.divider && idx > 0 && <div className="border-t border-slate-300 my-2" />}
                  <div className={`flex justify-between items-center py-1.5 ${row.isGrand ? "border-t-2 border-slate-300 pt-3 mt-3 font-bold text-lg" : ""}`}>
                    <span className={row.isGrand ? "text-[#003d7a]" : "text-slate-700 text-sm"}>
                      {row.label}
                    </span>
                    <span className={row.isGrand ? "text-[#003d7a] font-bold" : "text-slate-800 font-medium"}>
                      {fmt(value, row.decimals)} {currency}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TunisiaSummarySection;