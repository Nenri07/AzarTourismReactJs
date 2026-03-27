import { Plus, Trash2, Copy } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {
  parseNum,
  detectHotelType,
} from "../../utils/invoiceCalculationsTurkey";
import DatePicker from "../DatePicker";

// ─────────────────────────────────────────────────────────────────────────────
// TurkeyConditionalSection
//
// Handles TWO kinds of sections driven by hotelConfig.conditional_sections:
//
//   1. accommodation_details  (multiple_entries: false)
//      – EUR Amount + Exchange Rate → auto-calculates all read-only fields
//        using the V2 formulas (a/b/d/g/j) in real time.
//      – Total Nights is always read-only (auto-calculated from dates in the
//        parent form).
//
//   2. other_services  (multiple_entries: true)
//      – Free-form rows: service_name, service_date, gross_amount.
//      – gross_amount → auto-calculates taxable_amount (÷1.20) and
//        vat_20_percent (×0.20) per row in real time.
//      – Rows can be added, duplicated, or deleted.
// ─────────────────────────────────────────────────────────────────────────────

const TurkeyConditionalSection = ({
  sectionKey,
  section,
  formData,
  onFieldChange,
  setFormData,
  hotelConfig,
}) => {
  const labelClass    = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
  const inputClass    = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white transition-colors";
  const readOnlyClass = "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium cursor-not-allowed";

  const sectionData  = formData[sectionKey] || (section.multiple_entries ? [] : {});
  const arrivalDate  = formData.arrival_date  || formData.arrivalDate  || "";
  const departureDate= formData.departure_date|| formData.departureDate|| "";

  const [dateErrors, setDateErrors] = useState({});

  const hotelType = detectHotelType(hotelConfig);

  // ── Date validation helpers ────────────────────────────────────────────────
  const getMinDate = () => (arrivalDate  ? arrivalDate.split("T")[0]  : "");
  const getMaxDate = () => (departureDate? departureDate.split("T")[0]: "");

  const validateDate = useCallback(
    (dateValue, fieldKey) => {
      if (!dateValue || !arrivalDate || !departureDate) return true;
      const sel = new Date(dateValue).setHours(0, 0, 0, 0);
      const min = new Date(arrivalDate).setHours(0, 0, 0, 0);
      const max = new Date(departureDate).setHours(0, 0, 0, 0);
      if (sel < min || sel > max) {
        setDateErrors((prev) => ({
          ...prev,
          [fieldKey]: `Must be between ${arrivalDate.split("T")[0]} and ${departureDate.split("T")[0]}`,
        }));
        return false;
      }
      setDateErrors((prev) => ({ ...prev, [fieldKey]: null }));
      return true;
    },
    [arrivalDate, departureDate]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // AUTO-CALCULATE: Accommodation Details (single object)
  // Mirrors turkeyInvoiceCalculationsV2 formulas: a → b → d → g → j
  // Runs whenever eur_amount, exchange_rate, or total_nights change.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sectionKey !== "accommodation_details" || section.multiple_entries) return;

    const acc          = formData.accommodation_details || {};
    const eurAmount    = parseFloat(acc.eur_amount    || 0);
    const exchangeRate = parseFloat(acc.exchange_rate || 0);
    const totalNights  = parseInt(acc.total_nights)   || 0;

    if (eurAmount === 0 || exchangeRate === 0) {
      // Clear stale computed values
      const cleared = {
        room_amount_try:       "",
        total_room_all_nights: "",
        taxable_amount_room:   "",
        vat_10_percent:        "",
        accommodation_tax:     "",
      };
      const hasAny = Object.keys(cleared).some((k) => acc[k] !== "");
      if (hasAny) {
        setFormData((prev) => ({
          ...prev,
          accommodation_details: { ...prev.accommodation_details, ...cleared },
        }));
      }
      return;
    }

    // a = EUR × rate  (per night, gross TRY)
    const roomAmountTry      = parseNum(eurAmount * exchangeRate);
    // b = a × nights  (total gross TRY)
    const totalRoomAllNights = parseNum(roomAmountTry * totalNights);
    // d = b ÷ 1.12    (taxable base)
    const taxableAmountRoom  = parseNum(totalRoomAllNights / 1.12);
    // g = d × 0.10    (VAT 10%)
    const vat10Percent       = parseNum(taxableAmountRoom * 0.10);
    // j = d × 0.02    (Accommodation Tax 2%)
    const accommodationTax   = parseNum(taxableAmountRoom * 0.02);

    const updates = {
      room_amount_try:       roomAmountTry,
      total_room_all_nights: totalRoomAllNights,
      taxable_amount_room:   taxableAmountRoom,
      vat_10_percent:        vat10Percent,
      accommodation_tax:     accommodationTax,
    };

    // Only write if something actually changed (avoid infinite loop)
    const hasChanges = Object.entries(updates).some(
      ([k, v]) => String(acc[k]) !== String(v)
    );
    if (hasChanges) {
      setFormData((prev) => ({
        ...prev,
        accommodation_details: { ...prev.accommodation_details, ...updates },
      }));
    }
  }, [
    sectionKey,
    section.multiple_entries,
    formData.accommodation_details?.eur_amount,
    formData.accommodation_details?.exchange_rate,
    formData.accommodation_details?.total_nights,
    setFormData,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // AUTO-CALCULATE: Other Services rows (multiple entries)
  // gross_amount → taxable_amount (÷1.20), vat_20_percent (×0.20)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sectionKey !== "other_services" || !section.multiple_entries) return;

    const services = formData.other_services || [];
    if (services.length === 0) return;

    let changed = false;
    const updated = services.map((svc) => {
      const gross = parseFloat(svc.gross_amount || 0);
      if (gross === 0) {
        const wasZero =
          (svc.taxable_amount === 0 || svc.taxable_amount === "") &&
          (svc.vat_20_percent === 0 || svc.vat_20_percent === "");
        if (!wasZero) changed = true;
        return { ...svc, taxable_amount: 0, vat_20_percent: 0 };
      }
      const taxable = parseNum(gross / 1.2);
      const vat20   = parseNum(taxable * 0.2);
      if (
        String(svc.taxable_amount) !== String(taxable) ||
        String(svc.vat_20_percent) !== String(vat20)
      ) {
        changed = true;
      }
      return { ...svc, taxable_amount: taxable, vat_20_percent: vat20 };
    });

    if (changed) {
      setFormData((prev) => ({ ...prev, other_services: updated }));
    }
  }, [
    sectionKey,
    section.multiple_entries,
    // Stringify gross amounts to detect changes without deep comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (formData.other_services || []).map((s) => s.gross_amount).join(","),
    setFormData,
  ]);

  // ── Multiple-entry helpers ─────────────────────────────────────────────────

  const handleEntryFieldChange = (index, fieldId, value) => {
    setFormData((prev) => {
      const entries = [...(prev[sectionKey] || [])];
      entries[index] = { ...entries[index], [fieldId]: value };
      return { ...prev, [sectionKey]: entries };
    });
  };

  const handleDuplicateEntry = (index) => {
    setFormData((prev) => {
      const entries = [...(prev[sectionKey] || [])];
      const dupe    = { ...entries[index], id: Date.now() + Math.random() };
      entries.splice(index + 1, 0, dupe);
      return { ...prev, [sectionKey]: entries };
    });
  };

  const handleDeleteEntry = (index) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_, i) => i !== index),
    }));
  };

  const handleAddEntry = () => {
    const newEntry = { id: Date.now() + Math.random() };
    section.fields?.forEach((f) => {
      newEntry[f.field_id] = f.data_type === "date" ? (arrivalDate || "") : (f.default || "");
    });
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] || []), newEntry],
    }));
  };

  // ── Field renderer ─────────────────────────────────────────────────────────

  const renderField = (field, value, onChange, isArray = false, idx = null) => {
    const isReadOnly = field.auto_calculated || field.read_only;
    const isRequired = field.required && !isReadOnly;
    const fieldKey   = isArray
      ? `${sectionKey}_${idx}_${field.field_id}`
      : field.field_id;

    if (field.data_type === "date") {
      return (
        <div key={field.field_id} className="form-control">
          <label className={labelClass}>
            {field.label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <DatePicker
            value={value || ""}
            onChange={(val) => {
              onChange(val);
              validateDate(val, fieldKey);
            }}
            minDate={getMinDate()}
            maxDate={getMaxDate()}
            disabled={isReadOnly}
            required={isRequired}
            placeholder="Select date"
          />
          {dateErrors[fieldKey] && (
            <p className="text-xs text-red-600 mt-1">⚠️ {dateErrors[fieldKey]}</p>
          )}
        </div>
      );
    }

    const inputType =
      field.data_type === "integer" || field.data_type === "decimal"
        ? "number"
        : "text";
    const step = field.data_type === "decimal" ? "0.00001" : "1";

    // For read-only computed fields show a nicely formatted value
    const displayValue =
      isReadOnly && value !== "" && value !== undefined && !isNaN(Number(value))
        ? Number(value).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 5,
          })
        : value ?? "";

    return (
      <div key={field.field_id} className="form-control">
        <label className={labelClass}>
          {field.label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
          {isReadOnly && (
            <span className="ml-1 text-[10px] text-slate-400 font-normal normal-case">
              (auto)
            </span>
          )}
        </label>

        {isReadOnly ? (
          // Read-only display — shows formatted value, never editable
          <div className={readOnlyClass}>
            {displayValue !== "" ? displayValue : (
              <span className="text-slate-400 italic text-xs">calculated…</span>
            )}
          </div>
        ) : (
          <input
            type={inputType}
            step={step}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
            placeholder={field.example !== undefined ? String(field.example) : ""}
            className={inputClass}
          />
        )}

        {field.help_text && !isReadOnly && (
          <p className="text-[10px] text-slate-400 mt-1">{field.help_text}</p>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      {/* Section header */}
      <div className="mb-6 border-b pb-3">
        <h3 className="font-bold text-lg text-slate-800">{section.title}</h3>
        {section.description && (
          <p className="text-sm text-slate-500 mt-1">{section.description}</p>
        )}
      </div>

      {/* Fields */}
      {section.multiple_entries ? (
        /* ── Multiple-entry mode (other_services) ── */
        <div className="space-y-4">
          {(sectionData.length === 0) && (
            <p className="text-sm text-slate-400 text-center py-6">
              No entries yet. Click "Add" below to add the first one.
            </p>
          )}

          {sectionData.map((entry, index) => (
            <div
              key={entry.id || index}
              className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative"
            >
              {/* Row actions */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDuplicateEntry(index)}
                  className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Duplicate row"
                >
                  <Copy size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEntry(index)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete row"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-14">
                {section.fields?.map((f) =>
                  renderField(
                    f,
                    entry[f.field_id],
                    (val) => handleEntryFieldChange(index, f.field_id, val),
                    true,
                    index
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Single-object mode (accommodation_details) ── */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {section.fields?.map((f) =>
            renderField(
              f,
              sectionData[f.field_id],
              (val) => onFieldChange(`${sectionKey}.${f.field_id}`, val)
            )
          )}
        </div>
      )}

      {/* Add button for multiple-entry sections */}
      {section.multiple_entries && (
        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleAddEntry}
            className="flex items-center gap-2 bg-[#003d7a] text-white px-5 py-2.5 rounded-lg hover:bg-[#002a5c] text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add {section.title.replace("Other ", "")} Entry
          </button>
        </div>
      )}
    </div>
  );
};

export default TurkeyConditionalSection;