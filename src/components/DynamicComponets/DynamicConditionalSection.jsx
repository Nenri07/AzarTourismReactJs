
import { Plus, Trash2, Calendar } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { detectHotelType, calculateAccommodation, calculateServices } from "../../utils/invoiceCalculations";
import DatePicker from "../DatePicker";

const DynamicConditionalSection = ({
  sectionKey,
  section,
  formData,
  onFieldChange,
  setFormData,
  hotelConfig,
}) => {
  const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
  const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
  const readOnlyClass = "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium";

  const sectionData = formData[sectionKey] || (section.multiple_entries ? [] : {});
  const hotelType = detectHotelType(hotelConfig);

  const arrivalDate = formData.arrival_date || formData.arrivalDate;
  const departureDate = formData.departure_date || formData.departureDate;

  const [dateErrors, setDateErrors] = useState({});

  const getMinDate = () => {
    if (!arrivalDate) return "";
    return arrivalDate.split('T')[0];
  };

  const getMaxDate = () => {
    if (!departureDate) return "";
    return departureDate.split('T')[0];
  };

  const validateDate = useCallback((dateValue, fieldKey) => {
    if (!dateValue || !arrivalDate || !departureDate) {
      setDateErrors(prev => ({ ...prev, [fieldKey]: null }));
      return true;
    }

    const selected = new Date(dateValue).getTime();
    const min = new Date(arrivalDate).getTime();
    const max = new Date(departureDate).getTime();

    if (selected < min || selected > max) {
      setDateErrors(prev => ({
        ...prev,
        [fieldKey]: `Must be between ${formatDisplayDate(arrivalDate)} and ${formatDisplayDate(departureDate)}`
      }));
      return false;
    }

    setDateErrors(prev => ({ ...prev, [fieldKey]: null }));
    return true;
  }, [arrivalDate, departureDate]);

  // Calculations Effect - Keeping your logic intact
  useEffect(() => {
    if (sectionKey === 'accommodation_details' && !section.multiple_entries) {
      const acc = formData.accommodation_details || {};
      if (acc.eur_amount > 0 && acc.exchange_rate > 0) {
        const calculated = calculateAccommodation(formData, hotelType);
        const updates = hotelType === 'GRAND_ARAS' || hotelType === 'TRYP' 
          ? {
              room_amount_try: calculated.roomAmountTry.toFixed(2),
              total_room_all_nights: calculated.totalRoomAllNights.toFixed(2),
              taxable_amount_room: calculated.taxableAmount.toFixed(2),
              vat_10_percent: calculated.vat10Percent.toFixed(2),
              accommodation_tax: calculated.accommodationTax.toFixed(2),
            }
          : {
              taxable_amount: calculated.taxableAmount.toFixed(2),
              vat_10_percent: calculated.vat10Percent.toFixed(2),
              accommodation_tax: calculated.accommodationTax.toFixed(2),
              total_per_night: calculated.totalPerNight.toFixed(2),
              vat_total_nights: calculated.vatTotalNights.toFixed(2),
              acc_tax_total_nights: calculated.accTaxTotalNights.toFixed(2),
            };

        const hasChanges = Object.entries(updates).some(([k, v]) => String(acc[k]) !== String(v));
        if (hasChanges) {
          setFormData(prev => ({
            ...prev,
            accommodation_details: { ...prev.accommodation_details, ...updates },
          }));
        }
      }
    }
    
    if (sectionKey === 'other_services' && section.multiple_entries) {
      const services = formData.other_services || [];
      if (services.length > 0) {
        const calculated = calculateServices(services);
        const hasChanges = calculated.services.some((calc, idx) => {
          const original = services[idx];
          return String(original?.taxable_amount) !== String(calc.taxable_amount) ||
                 String(original?.vat_20_percent) !== String(calc.vat_20_percent);
        });
        if (hasChanges) {
          setFormData(prev => ({ ...prev, other_services: calculated.services }));
        }
      }
    }
  }, [sectionKey, formData.accommodation_details?.eur_amount, formData.accommodation_details?.exchange_rate, formData.other_services?.map(s => s.gross_amount).join(','), hotelType, section.multiple_entries, setFormData]);

  const handleEntryFieldChange = (index, fieldId, value) => {
    setFormData(prev => {
      const newEntries = [...(prev[sectionKey] || [])];
      newEntries[index] = { ...newEntries[index], [fieldId]: value };
      return { ...prev, [sectionKey]: newEntries };
    });
  };

  function formatDisplayDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB');
  }

  const renderField = (field, value, onChange, isArray = false, idx = null) => {
    const isReadOnly = field.auto_calculated || field.read_only;
    const isRequired = field.required && !isReadOnly;
    const fieldKey = isArray ? `${sectionKey}_${idx}_${field.field_id}` : field.field_id;
    const dateErrorMessage = dateErrors[fieldKey];

    if (field.data_type === "date") {
      return (
        <div key={field.field_id} className="form-control">
          <label className={labelClass}>
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <DatePicker
            value={value || ""}
            onChange={(val) => {
              onChange(val); // Receive clean string
              validateDate(val, fieldKey);
            }}
            minDate={getMinDate()}
            maxDate={getMaxDate()}
            disabled={isReadOnly}
            required={isRequired}
            placeholder="Select date"
          />
          {dateErrorMessage && <p className="text-xs text-red-600 mt-1">⚠️ {dateErrorMessage}</p>}
        </div>
      );
    }

    return (
      <div key={field.field_id} className="form-control">
        <label className={labelClass}>
          {field.label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          type={field.data_type === "integer" || field.data_type === "decimal" ? "number" : "text"}
          step={field.data_type === "decimal" ? "0.01" : "1"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={isReadOnly}
          className={isReadOnly ? readOnlyClass : inputClass}
        />
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h3 className="font-bold text-lg text-slate-800">{section.title}</h3>
        {section.multiple_entries && (
          <button onClick={() => {
            const newEntry = { id: Date.now() + Math.random() };
            section.fields?.forEach(f => newEntry[f.field_id] = f.data_type === "date" ? arrivalDate : (f.default || ""));
            setFormData(prev => ({ ...prev, [sectionKey]: [...(prev[sectionKey] || []), newEntry] }));
          }} className="flex items-center gap-2 bg-[#003d7a] text-white px-4 py-2 rounded-lg hover:bg-[#002a5c] text-sm font-medium">
            <Plus size={16} /> Add Entry
          </button>
        )}
      </div>

      <div className={section.multiple_entries ? "space-y-4" : "grid grid-cols-1 md:grid-cols-3 gap-5"}>
        {section.multiple_entries ? (
          sectionData.map((entry, index) => (
            <div key={entry.id || index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
              <button onClick={() => setFormData(prev => ({ ...prev, [sectionKey]: prev[sectionKey].filter((_, i) => i !== index) }))} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                <Trash2 size={16} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {section.fields?.map(f => renderField(f, entry[f.field_id], (val) => handleEntryFieldChange(index, f.field_id, val), true, index))}
              </div>
            </div>
          ))
        ) : (
          section.fields?.map(f => renderField(f, sectionData[f.field_id], (val) => onFieldChange(`${sectionKey}.${f.field_id}`, val)))
        )}
      </div>
    </div>
  );
};

export default DynamicConditionalSection;
