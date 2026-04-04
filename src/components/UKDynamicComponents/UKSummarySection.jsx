"use client";

import { useEffect, useState } from "react";
import { calculateUKFinalSummary } from "../../utils/invoiceCalculationsUK";

const UKSummarySection = ({ config, formData = {}, onStatusChange, onNoteChange }) => {
  const [calculatedValues, setCalculatedValues] = useState({});
  const [localStatus, setLocalStatus] = useState(formData?.status || "pending");
  const [localNote, setLocalNote] = useState(formData?.note || "");

  useEffect(() => {
    const summary = calculateUKFinalSummary(formData);
    setCalculatedValues(summary);
  }, [
    formData.accommodation_details?.gbp_amount,
    formData.accommodation_details?.total_nights,
    formData.other_services?.map((s) => s.gross_amount).join(","),
  ]);

  const displayFields = [
    { key: "total_net_excl_vat", label: "Taxable Amount (excl VAT)" },
    { key: "zero_rated", label: "Zero Rated Amount" },
    { key: "total_vat_20", label: "VAT AT 20%", divider: true },
    { key: "non_taxable", label: "Non Taxable Amount" },
    { key: "grand_total_gbp", label: "Total Amount Payable", isGrand: true },
  ];

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2">
        <h3 className="font-bold text-base md:text-lg text-slate-800">Invoice Summary</h3>
        <span className="px-2 py-1 bg-[#1a1a2e] text-white text-xs rounded">UK Mode</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Status + Note */}
        <div className="space-y-6">
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
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#1a1a2e] focus:ring-1 focus:ring-[#1a1a2e]"
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
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#1a1a2e] focus:ring-1 focus:ring-[#1a1a2e]"
              placeholder="Internal notes..."
            />
          </div>
        </div>

        {/* Right: Tax Summary */}
        <div className="bg-slate-50 p-5 rounded-xl space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Tax Summary
          </div>
          {Object.keys(calculatedValues).length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              Fill in accommodation to see summary
            </div>
          ) : (
            <>
              {displayFields.map((field) => {
                const value = calculatedValues[field.key];

                // Hide zero values unless grand total
                if ((value === 0 || value === undefined) && !field.isGrand) return null;

                return (
                  <div key={field.key}>
                    {field.divider && (
                      <div className="border-t border-slate-300 my-2"></div>
                    )}
                    <div
                      className={`flex justify-between items-center py-1.5 ${
                        field.isGrand
                          ? "border-t-2 border-slate-400 pt-3 mt-3 font-bold text-lg"
                          : ""
                      }`}
                    >
                      <span
                        className={
                          field.isGrand ? "text-[#1a1a2e]" : "text-slate-700 text-sm"
                        }
                      >
                        {field.label}
                      </span>
                      <span
                        className={
                          field.isGrand
                            ? "text-[#1a1a2e] font-bold"
                            : "text-slate-800 font-medium"
                        }
                      >
                        £
                        {Number(value || 0).toLocaleString("en-GB", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UKSummarySection;