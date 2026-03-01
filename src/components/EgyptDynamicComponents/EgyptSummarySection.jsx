import { useEffect, useState } from "react";
import { calculateFinalSummary, detectHotelType } from "../../utils/invoiceCalculationsEgypt";

const EgyptSummarySection = ({ config, formData = {}, onStatusChange, onNoteChange }) => {
  const [calculatedValues, setCalculatedValues] = useState({});
  const [localStatus, setLocalStatus] = useState(formData?.status || "pending");
  const [localNote, setLocalNote] = useState(formData?.note || "");
  
  const hotelType = detectHotelType(config);

  useEffect(() => {
    // FIXED: Passed hotelType here so the Summary knows to divide for Staybridge!
    const summary = calculateFinalSummary(formData, hotelType);
    setCalculatedValues(summary);
  }, [
    formData.accommodation_details?.usd_amount,
    formData.accommodation_details?.exchange_rate,
    formData.accommodation_details?.total_nights,
    formData.other_services?.map(s => s.gross_amount).join(','),
    hotelType
  ]);

  const displayFields = [
    { key: 'total_taxable_amount', label: 'Total Base Taxable (EGP)' },
    { key: 'total_service_charge', label: 'Service Charge (12%)' },
    { key: 'total_city_tax', label: 'City Tax (1%)' },
    { key: 'total_vat_14', label: 'VAT (14%)', divider: true },
    { key: 'grand_total_egp', label: 'Balance EGP', isGrand: true },
    { key: 'balance_usd', label: 'Balance USD', currency: 'USD' },
  ];

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2">
        <h3 className="font-bold text-base md:text-lg text-slate-800">Invoice Summary</h3>
        <span className="px-2 py-1 bg-[#003d7a] text-white text-xs rounded">Egypt Mode</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status <span className="text-red-500">*</span></label>
            <select value={localStatus} onChange={(e) => { setLocalStatus(e.target.value); onStatusChange?.(e.target.value); }} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a]">
              <option value="pending">Pending</option>
              <option value="ready">Ready</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Note</label>
            <textarea value={localNote} onChange={(e) => { setLocalNote(e.target.value); onNoteChange?.(e.target.value); }} rows={4} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a]" placeholder="Internal notes..." />
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-xl space-y-2">
          {Object.keys(calculatedValues).length === 0 ? (
            <div className="text-center py-10 text-slate-500">Fill in accommodation to see summary</div>
          ) : (
            <>
              {displayFields.map((field, index) => {
                const value = calculatedValues[field.key];
                if (value === 0 && !field.isGrand && !field.key.includes('balance_usd')) return null;
                const currency = field.currency || config?.currency || 'EGP';
                
                return (
                  <div key={field.key}>
                    {field.divider && index > 0 && <div className="border-t border-slate-300 my-2"></div>}
                    <div className={`flex justify-between items-center py-1.5 ${field.isGrand ? "border-t-2 border-slate-300 pt-3 mt-3 font-bold text-lg" : ""}`}>
                      <span className={field.isGrand ? "text-[#003d7a]" : "text-slate-700 text-sm"}>{field.label}</span>
                      <span className={field.isGrand ? "text-[#003d7a] font-bold" : "text-slate-800 font-medium"}>
                        {Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
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

export default EgyptSummarySection;