import { Plus, Trash2, Copy } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import DatePicker from "../DatePicker";
import {
  detectHotelTypeTunisia,
  HOTEL_CONFIGS_TUNISIA,
  calculateAccommodationTunisia,
} from "../../utils/InvoiceCalculationsTunisia";

const TunisiaConditionalSection = ({
  sectionKey,
  section,
  formData,
  onFieldChange,
  setFormData,
  hotelConfig,
}) => {
  const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
  const inputClass =
    "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
  const readOnlyClass =
    "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium";

  const sectionData =
    formData[sectionKey] || (section.multiple_entries ? [] : {});
  const arrivalDate = formData.arrival_date || formData.arrivalDate;
  const departureDate = formData.departure_date || formData.departureDate;
  const [dateErrors, setDateErrors] = useState({});

  const getMinDate = () => (arrivalDate ? arrivalDate.split("T")[0] : "");
  const getMaxDate = () => (departureDate ? departureDate.split("T")[0] : "");

  const validateDate = useCallback(
    (dateValue, fieldKey) => {
      if (!dateValue || !arrivalDate || !departureDate) return true;
      const selected = new Date(dateValue).setHours(0, 0, 0, 0);
      const min = new Date(arrivalDate).setHours(0, 0, 0, 0);
      const max = new Date(departureDate).setHours(0, 0, 0, 0);
      if (selected < min || selected > max) {
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

  // ── Tunisia Accommodation Auto-Calculations ──
  useEffect(() => {
  if (sectionKey !== "accommodation_details" || section.multiple_entries) return;

  const hotelType = detectHotelTypeTunisia(hotelConfig);
  const calc = calculateAccommodationTunisia(formData, hotelType);
  const acc = formData.accommodation_details || {};

  const knownComputed = {
    room_amount_tnd: calc.displayRoomAmountTnd > 0 ? (calc.displayRoomAmountTnd) : "",
    exchange_usd_rate: calc.exchangeRate > 0 ? (calc.exchangeRate) : "",   // ← ADD THIS LINE
  };

  const updates = {};
  (section.fields || []).forEach((f) => {
    if (f.auto_calculated && f.field_id in knownComputed) {
      const newVal = knownComputed[f.field_id];
      if (String(acc[f.field_id] ?? "") !== String(newVal)) {
        updates[f.field_id] = newVal;
      }
    }
  });

  if (Object.keys(updates).length > 0) {
    setFormData((prev) => ({
      ...prev,
      accommodation_details: { ...prev.accommodation_details, ...updates },
    }));
  }
}, [
  sectionKey,
  section.multiple_entries,
  JSON.stringify((section.fields || []).filter((f) => f.auto_calculated).map((f) => f.field_id)),
  formData.accommodation_details?.eur_amount,
  formData.accommodation_details?.usd_amount,
  formData.accommodation_details?.selling_rate,
  formData.accommodation_details?.room_amount_tnd,
  formData.accommodation_details?.exchange_rate,
  formData.accommodation_details?.total_nights,
  formData.nb_adults,
  formData.nb_children,
  setFormData,
]);

  // ── Service Entry Change Handler ──
  const handleEntryFieldChange = (index, fieldId, value) => {
    setFormData((prev) => {
      const newEntries = [...(prev[sectionKey] || [])];
      newEntries[index] = { ...newEntries[index], [fieldId]: value };
      return { ...prev, [sectionKey]: newEntries };
    });
  };

  const handleDuplicateEntry = (index) => {
    setFormData((prev) => {
      const newEntries = [...(prev[sectionKey] || [])];
      const duplicate = {
        ...newEntries[index],
        id: Date.now() + Math.random(),
      };
      newEntries.splice(index + 1, 0, duplicate);
      return { ...prev, [sectionKey]: newEntries };
    });
  };

  const handleDeleteEntry = (index) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_, i) => i !== index),
    }));
  };

  const renderField = (field, value, onChange, isArray = false, idx = null) => {
    const isReadOnly = field.auto_calculated || field.read_only;
    const isRequired = field.required && !isReadOnly;
    const fieldKey = isArray
      ? `${sectionKey}_${idx}_${field.field_id}`
      : field.field_id;

    if (field.data_type === "date") {
      return (
        <div key={field.field_id} className="form-control">
          <label className={labelClass}>
            {field.label}{" "}
            {isRequired && <span className="text-red-500">*</span>}
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
            <p className="text-xs text-red-600 mt-1">
              ⚠️ {dateErrors[fieldKey]}
            </p>
          )}
        </div>
      );
    }

    return (
      <div key={field.field_id} className="form-control">
        <label className={labelClass}>
          {field.label}{" "}
          {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          type={
            field.data_type === "integer" || field.data_type === "decimal"
              ? "number"
              : "text"
          }
          step={field.data_type === "decimal" ? "0.001" : "1"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          readOnly={isReadOnly}
          disabled={isReadOnly}
          className={isReadOnly ? readOnlyClass : inputClass}
          placeholder={field.placeholder || field.default_value || ""}
        />
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6 border-b pb-3">
        <h3 className="font-bold text-lg text-slate-800">{section.title}</h3>
        {section.description && (
          <p className="text-xs text-slate-500 mt-1">{section.description}</p>
        )}
      </div>

      <div
        className={
          section.multiple_entries
            ? "space-y-4"
            : "grid grid-cols-1 md:grid-cols-3 gap-5"
        }
      >
        {section.multiple_entries ? (
          sectionData.map((entry, index) => (
            <div
              key={entry.id || index}
              className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative"
            >
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button
                  onClick={() => handleDuplicateEntry(index)}
                  className="text-blue-500 hover:text-blue-700"
                  title="Duplicate"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleDeleteEntry(index)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          ))
        ) : (
          section.fields?.map((f) =>
            renderField(
              f,
              sectionData[f.field_id],
              (val) => onFieldChange(`${sectionKey}.${f.field_id}`, val)
            )
          )
        )}
      </div>

      {section.multiple_entries && (
        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
          <button
            onClick={() => {
              const newEntry = { id: Date.now() + Math.random() };
              section.fields?.forEach(
                (f) =>
                  (newEntry[f.field_id] =
                    f.data_type === "date" ? arrivalDate : f.default_value || "")
              );
              setFormData((prev) => ({
                ...prev,
                [sectionKey]: [...(prev[sectionKey] || []), newEntry],
              }));
            }}
            className="flex items-center gap-2 bg-[#003d7a] text-white px-5 py-2.5 rounded-lg hover:bg-[#002a5c] text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} /> Add {section.title.replace("Other ", "")} Entry
          </button>
        </div>
      )}
    </div>
  );
};

export default TunisiaConditionalSection;





// import { useEffect, useState, useCallback } from "react";
// import { Plus, Trash2, Copy } from "lucide-react";
// import DatePicker from "../DatePicker";
// import {
//   detectHotelTypeTunisia,
//   HOTEL_CONFIGS_TUNISIA,
//   calculateAccommodationTunisia,
// } from "../../utils/InvoiceCalculationsTunisia";

// /**
//  * TunisiaConditionalSection
//  *
//  * Renders two sections:
//  *   1. Accommodation Details  — fields differ by hotel type (TND vs EUR input)
//  *      - EUR hotels (Four Seasons, Marriott): EUR amount × EUR→TND rate, /1.0807 net
//  *      - TND hotels (Novotel, Adam, Radisson, Concorde, Movenpick, Le Corail, Sheraton):
//  *        Exchange Rate × Selling Rate = New Room Rate (matches original Novotel form)
//  *   2. Other Services         — repeatable service entries
//  */
// const TunisiaConditionalSection = ({ formData, setFormData, hotelConfig, onFieldChange }) => {
//   const labelClass    = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const inputClass    = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
//   const readOnlyClass = "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium";

//   const hotelType = detectHotelTypeTunisia(hotelConfig);
//   const hCfg      = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;
//   const isEurHotel = hCfg.inputCurrency === 'EUR';

//   const acc = formData.accommodation_details || {};
//   const services = formData.other_services || [];

//   const arrivalDate   = formData.arrival_date || '';
//   const departureDate = formData.departure_date || '';

//   const [dateErrors, setDateErrors] = useState({});

//   // ── Auto-calc: total_nights sync is done in parent via date useEffect ──

//   // ── Auto-calc accommodation computed fields ──────────────────────────────
//   // For BOTH input modes, the nightly TND rate is derived, never typed directly:
//   //   EUR hotels: (eur_amount × exchange_rate) / 1.0807
//   //   TND hotels: exchange_rate × selling_rate   (matches original Novotel form)
//   useEffect(() => {
//     const totalNights = parseInt(acc.total_nights) || 0;
//     if (totalNights === 0) return;

//     const calculated = calculateAccommodationTunisia(formData, hotelType);
//     const computedStr = calculated.roomAmountTnd > 0 ? calculated.roomAmountTnd.toFixed(3) : '';

//     if (String(acc.room_amount_tnd_computed || '') !== String(computedStr)) {
//       setFormData(prev => ({
//         ...prev,
//         accommodation_details: {
//           ...prev.accommodation_details,
//           room_amount_tnd_computed: computedStr,
//         },
//       }));
//     }
//   }, [
//     acc.eur_amount,
//     acc.exchange_rate,
//     acc.selling_rate,
//     acc.total_nights,
//     hotelType,
//   ]);

//   const validateServiceDate = useCallback((val, key) => {
//     if (!val || !arrivalDate || !departureDate) return;
//     const sel = new Date(val).setHours(0, 0, 0, 0);
//     const min = new Date(arrivalDate).setHours(0, 0, 0, 0);
//     const max = new Date(departureDate).setHours(0, 0, 0, 0);
//     if (sel < min || sel > max) {
//       setDateErrors(prev => ({ ...prev, [key]: `Must be between ${arrivalDate.split('T')[0]} and ${departureDate.split('T')[0]}` }));
//     } else {
//       setDateErrors(prev => ({ ...prev, [key]: null }));
//     }
//   }, [arrivalDate, departureDate]);

//   // ── Service CRUD ──────────────────────────────────────────────────────────
//   const handleServiceChange = (index, field, value) => {
//     setFormData(prev => {
//       const next = [...(prev.other_services || [])];
//       next[index] = { ...next[index], [field]: value };
//       return { ...prev, other_services: next };
//     });
//   };

//   const addService = () => {
//     setFormData(prev => ({
//       ...prev,
//       other_services: [
//         ...(prev.other_services || []),
//         { id: Date.now() + Math.random(), service_name: '', service_date: arrivalDate, gross_amount: '' },
//       ],
//     }));
//   };

//   const duplicateService = (index) => {
//     setFormData(prev => {
//       const next = [...(prev.other_services || [])];
//       next.splice(index + 1, 0, { ...next[index], id: Date.now() + Math.random() });
//       return { ...prev, other_services: next };
//     });
//   };

//   const deleteService = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       other_services: (prev.other_services || []).filter((_, i) => i !== index),
//     }));
//   };

//   // ── Field helper ──────────────────────────────────────────────────────────
//   const accField = (id, label, opts = {}) => {
//     const { readOnly = false, type = 'text', step = '0.001', placeholder = '' } = opts;
//     const value = acc[id] ?? '';
//     return (
//       <div key={id} className="form-control">
//         <label className={labelClass}>{label}</label>
//         <input
//           type={type}
//           step={step}
//           value={value}
//           readOnly={readOnly}
//           placeholder={placeholder}
//           onChange={e => !readOnly && onFieldChange(`accommodation_details.${id}`, e.target.value)}
//           className={readOnly ? readOnlyClass : inputClass}
//         />
//       </div>
//     );
//   };

//   return (
//     <>
//       {/* ── Accommodation Details ──────────────────────────────────────────── */}
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//         <div className="mb-6 border-b pb-3">
//           <h3 className="font-bold text-lg text-slate-800">Accommodation Details</h3>
//           <p className="text-xs text-slate-500 mt-1">
//             {isEurHotel
//               ? "Enter amount in EUR + exchange rate (EUR→TND)"
//               : "Enter Exchange Rate × Selling Rate — matches the standard nightly rate calculation"}
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//           {/* Total nights — always read-only (auto from dates) */}
//           {accField('total_nights', 'Total Nights', { readOnly: true, type: 'number' })}

//           {isEurHotel ? (
//             <>
//               {accField('eur_amount', 'Amount (EUR)', { type: 'number', step: '0.01', placeholder: 'e.g. 350' })}
//               {accField('exchange_rate', 'EUR → TND Rate', { type: 'number', step: '0.00001', placeholder: 'e.g. 3.3310' })}
//               {accField('exchange_usd_rate', 'TND → USD Rate', { type: 'number', step: '0.00001', placeholder: 'e.g. 3.3285' })}
//               {/* Computed net TND per night (readonly display) */}
//               {accField('room_amount_tnd_computed', 'Net Room Amount / Night (TND)', { readOnly: true, type: 'number' })}
//             </>
//           ) : (
//             <>
//               {/* Matches original Novotel form: Exchange Rate × Selling Rate = New Room Rate */}
//               {accField('exchange_rate', 'Exchange Rate', { type: 'number', step: '0.001', placeholder: 'e.g. 3.33' })}
//               {accField('selling_rate', 'Selling Rate', { type: 'number', step: '0.01', placeholder: 'e.g. 456' })}
//               {accField('room_amount_tnd_computed', 'New Room Rate (Calculated, TND)', { readOnly: true, type: 'number' })}
//               {accField('exchange_usd_rate', 'TND → USD Rate', { type: 'number', step: '0.00001', placeholder: 'e.g. 3.3285' })}
//             </>
//           )}

//           {accField('city_tax_per_person', 'City Tax / Person / Night (TND)', { type: 'number', step: '1', placeholder: '3' })}
//           {accField('stamp_tax', 'Stamp Tax (TND)', { type: 'number', step: '1', placeholder: '1' })}

//           {/* Nb Persons (mirrors top-level nb_persons) */}
//           <div className="form-control">
//             <label className={labelClass}>Number of Persons</label>
//             <input
//               type="number"
//               step="1"
//               min="1"
//               value={formData.nb_persons || 1}
//               onChange={e => onFieldChange('nb_persons', e.target.value)}
//               className={inputClass}
//             />
//           </div>
//         </div>
//       </div>

//       {/* ── Other Services ─────────────────────────────────────────────────── */}
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//         <div className="mb-6 border-b pb-3">
//           <h3 className="font-bold text-lg text-slate-800">Other Services</h3>
//           <p className="text-xs text-slate-500 mt-1">
//             Laundry, Restaurant, Spa, Retail, etc. — enter gross TND amount per entry
//           </p>
//         </div>

//         <div className="space-y-4">
//           {services.map((entry, index) => (
//             <div key={entry.id || index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
//               <div className="absolute top-2 right-2 flex items-center gap-1">
//                 <button onClick={() => duplicateService(index)} className="text-blue-500 hover:text-blue-700" title="Duplicate">
//                   <Copy size={16} />
//                 </button>
//                 <button onClick={() => deleteService(index)} className="text-red-500 hover:text-red-700" title="Delete">
//                   <Trash2 size={16} />
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 {/* Service name */}
//                 <div className="form-control">
//                   <label className={labelClass}>Service Name</label>
//                   <input
//                     type="text"
//                     value={entry.service_name || ''}
//                     onChange={e => handleServiceChange(index, 'service_name', e.target.value)}
//                     className={inputClass}
//                     placeholder="e.g. Laundry, Restaurant..."
//                   />
//                 </div>

//                 {/* Service date */}
//                 <div className="form-control">
//                   <label className={labelClass}>Date</label>
//                   <DatePicker
//                     value={entry.service_date || ''}
//                     onChange={val => {
//                       handleServiceChange(index, 'service_date', val);
//                       validateServiceDate(val, `svc_${index}`);
//                     }}
//                     minDate={arrivalDate?.split('T')[0]}
//                     maxDate={departureDate?.split('T')[0]}
//                     placeholder="Select date"
//                   />
//                   {dateErrors[`svc_${index}`] && (
//                     <p className="text-xs text-red-600 mt-1">⚠️ {dateErrors[`svc_${index}`]}</p>
//                   )}
//                 </div>

//                 {/* Gross amount */}
//                 <div className="form-control">
//                   <label className={labelClass}>Gross Amount (TND)</label>
//                   <input
//                     type="number"
//                     step="0.001"
//                     value={entry.gross_amount || ''}
//                     onChange={e => handleServiceChange(index, 'gross_amount', e.target.value)}
//                     className={inputClass}
//                     placeholder="0.000"
//                   />
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
//           <button
//             onClick={addService}
//             className="flex items-center gap-2 bg-[#003d7a] text-white px-5 py-2.5 rounded-lg hover:bg-[#002a5c] text-sm font-medium transition-colors shadow-sm"
//           >
//             <Plus size={16} /> Add Service Entry
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };

// export default TunisiaConditionalSection;



// import { useEffect, useState, useCallback } from "react";
// import { Plus, Trash2, Copy } from "lucide-react";
// import DatePicker from "../DatePicker";
// import {
//   detectHotelTypeTunisia,
//   HOTEL_CONFIGS_TUNISIA,
//   calculateAccommodationTunisia,
// } from "../../utils/InvoiceCalculationsTunisia";

// /**
//  * TunisiaConditionalSection
//  *
//  * Renders two sections:
//  *   1. Accommodation Details  — fields differ by hotel type (TND vs EUR input)
//  *      - EUR hotels (Four Seasons, Marriott): EUR amount × EUR→TND rate, /1.0807 net
//  *      - TND hotels (Novotel, Adam, Radisson, Concorde, Movenpick, Le Corail, Sheraton):
//  *        Exchange Rate × Selling Rate = New Room Rate (matches original Novotel form)
//  *   2. Other Services         — repeatable service entries
//  */
// const TunisiaConditionalSection = ({ formData, setFormData, hotelConfig, onFieldChange }) => {
//   const labelClass    = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const inputClass    = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
//   const readOnlyClass = "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium";

//   const hotelType = detectHotelTypeTunisia(hotelConfig);
//   const hCfg      = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;
//   const isEurHotel = hCfg.inputCurrency === 'EUR';

//   const acc = formData.accommodation_details || {};
//   const services = formData.other_services || [];

//   const arrivalDate   = formData.arrival_date || '';
//   const departureDate = formData.departure_date || '';

//   const [dateErrors, setDateErrors] = useState({});

//   // ── Live room rate calculation ────────────────────────────────────────────
//   // Computed directly at render time from current formData — NOT stored in
//   // state, NOT behind a useEffect. This guarantees it can never lag, race,
//   // or go blank: it's always exactly exchangeRate × sellingRate (or the EUR
//   // net formula) for whatever is currently typed, recalculated every render.
//   const liveAccCalc = calculateAccommodationTunisia(formData, hotelType);
//   const computedRoomRateDisplay =
//     liveAccCalc.roomAmountTnd > 0 ? liveAccCalc.roomAmountTnd.toFixed(3) : '';

//   // ── Auto-calc: nb_persons = nb_adults + nb_children ──────────────────────
//   // Adults/children are entered once in Invoice Information — this section
//   // must never ask for the total again. Keeps BOTH the top-level
//   // formData.nb_persons and the nested accommodation_details.nb_persons in
//   // sync, since calculateAccommodationTunisia reads the nested one first
//   // and falls back to the top-level one.
//   useEffect(() => {
//     const adults = parseInt(formData.nb_adults) || 0;
//     const children = parseInt(formData.nb_children) || 0;
//     const total = adults + children || 1;

//     const currentTopLevel = parseInt(formData.nb_persons) || 0;
//     const currentNested = parseInt(acc.nb_persons) || 0;

//     if (currentTopLevel !== total || currentNested !== total) {
//       setFormData(prev => ({
//         ...prev,
//         nb_persons: total,
//         accommodation_details: { ...prev.accommodation_details, nb_persons: total },
//       }));
//     }
//   }, [formData.nb_adults, formData.nb_children]);

//   const validateServiceDate = useCallback((val, key) => {
//     if (!val || !arrivalDate || !departureDate) return;
//     const sel = new Date(val).setHours(0, 0, 0, 0);
//     const min = new Date(arrivalDate).setHours(0, 0, 0, 0);
//     const max = new Date(departureDate).setHours(0, 0, 0, 0);
//     if (sel < min || sel > max) {
//       setDateErrors(prev => ({ ...prev, [key]: `Must be between ${arrivalDate.split('T')[0]} and ${departureDate.split('T')[0]}` }));
//     } else {
//       setDateErrors(prev => ({ ...prev, [key]: null }));
//     }
//   }, [arrivalDate, departureDate]);

//   // ── Service CRUD ──────────────────────────────────────────────────────────
//   const handleServiceChange = (index, field, value) => {
//     setFormData(prev => {
//       const next = [...(prev.other_services || [])];
//       next[index] = { ...next[index], [field]: value };
//       return { ...prev, other_services: next };
//     });
//   };

//   const addService = () => {
//     setFormData(prev => ({
//       ...prev,
//       other_services: [
//         ...(prev.other_services || []),
//         { id: Date.now() + Math.random(), service_name: '', service_date: arrivalDate, gross_amount: '' },
//       ],
//     }));
//   };

//   const duplicateService = (index) => {
//     setFormData(prev => {
//       const next = [...(prev.other_services || [])];
//       next.splice(index + 1, 0, { ...next[index], id: Date.now() + Math.random() });
//       return { ...prev, other_services: next };
//     });
//   };

//   const deleteService = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       other_services: (prev.other_services || []).filter((_, i) => i !== index),
//     }));
//   };

//   // ── Field helper ──────────────────────────────────────────────────────────
//   const accField = (id, label, opts = {}) => {
//     const { readOnly = false, type = 'text', step = '0.001', placeholder = '' } = opts;
//     const value = acc[id] ?? '';
//     return (
//       <div key={id} className="form-control">
//         <label className={labelClass}>{label}</label>
//         <input
//           type={type}
//           step={step}
//           value={value}
//           readOnly={readOnly}
//           placeholder={placeholder}
//           onChange={e => !readOnly && onFieldChange(`accommodation_details.${id}`, e.target.value)}
//           className={readOnly ? readOnlyClass : inputClass}
//         />
//       </div>
//     );
//   };

//   return (
//     <>
//       {/* ── Accommodation Details ──────────────────────────────────────────── */}
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//         <div className="mb-6 border-b pb-3">
//           <h3 className="font-bold text-lg text-slate-800">Accommodation Details</h3>
//           <p className="text-xs text-slate-500 mt-1">
//             {isEurHotel
//               ? "Enter amount in EUR + exchange rate (EUR→TND)"
//               : "Enter Exchange Rate × Selling Rate — matches the standard nightly rate calculation"}
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//           {/* Total nights — always read-only (auto from dates) */}
//           {accField('total_nights', 'Total Nights', { readOnly: true, type: 'number' })}

//           {isEurHotel ? (
//             <>
//               {accField('eur_amount', 'Amount (EUR)', { type: 'number', step: '0.01', placeholder: 'e.g. 350' })}
//               {accField('exchange_rate', 'EUR → TND Rate', { type: 'number', step: '0.00001', placeholder: 'e.g. 3.3310' })}
//               {accField('exchange_usd_rate', 'TND → USD Rate', { type: 'number', step: '0.00001', placeholder: 'e.g. 3.3285' })}
//               {/* Live-computed, not read from state — see liveAccCalc above */}
//               <div className="form-control">
//                 <label className={labelClass}>Net Room Amount / Night (TND)</label>
//                 <input type="number" value={computedRoomRateDisplay} readOnly className={readOnlyClass} />
//               </div>
//             </>
//           ) : (
//             <>
//               {/* Matches original Novotel form: Exchange Rate × Selling Rate = New Room Rate */}
//               {accField('exchange_rate', 'Exchange Rate', { type: 'number', step: '0.001', placeholder: 'e.g. 3.33' })}
//               {accField('selling_rate', 'Selling Rate', { type: 'number', step: '0.01', placeholder: 'e.g. 456' })}
//               {/* Live-computed, not read from state — see liveAccCalc above.
//                   456 × 3.33 = 3.33 × 456: which box holds which number does
//                   not change this value, only that both are filled in. */}
//               <div className="form-control">
//                 <label className={labelClass}>New Room Rate (Calculated, TND)</label>
//                 <input type="number" value={computedRoomRateDisplay} readOnly className={readOnlyClass} />
//               </div>
//               {accField('exchange_usd_rate', 'TND → USD Rate', { type: 'number', step: '0.00001', placeholder: 'e.g. 3.3285' })}
//             </>
//           )}

//           {accField('city_tax_per_person', 'City Tax / Person / Night (TND)', { type: 'number', step: '1', placeholder: '3' })}
//           {accField('stamp_tax', 'Stamp Tax (TND)', { type: 'number', step: '1', placeholder: '1' })}

//           {/* Nb Persons — auto-derived from Adults + Children, never typed here */}
//           <div className="form-control">
//             <label className={labelClass}>Number of Persons (Auto)</label>
//             <input
//               type="number"
//               value={(parseInt(formData.nb_adults) || 0) + (parseInt(formData.nb_children) || 0) || 1}
//               readOnly
//               className={readOnlyClass}
//             />
//             <p className="text-xs text-slate-500 mt-1">Adults + Children from Invoice Information</p>
//           </div>
//         </div>
//       </div>

//       {/* ── Other Services ─────────────────────────────────────────────────── */}
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//         <div className="mb-6 border-b pb-3">
//           <h3 className="font-bold text-lg text-slate-800">Other Services</h3>
//           <p className="text-xs text-slate-500 mt-1">
//             Laundry, Restaurant, Spa, Retail, etc. — enter gross TND amount per entry
//           </p>
//         </div>

//         <div className="space-y-4">
//           {services.map((entry, index) => (
//             <div key={entry.id || index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
//               <div className="absolute top-2 right-2 flex items-center gap-1">
//                 <button onClick={() => duplicateService(index)} className="text-blue-500 hover:text-blue-700" title="Duplicate">
//                   <Copy size={16} />
//                 </button>
//                 <button onClick={() => deleteService(index)} className="text-red-500 hover:text-red-700" title="Delete">
//                   <Trash2 size={16} />
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 {/* Service name */}
//                 <div className="form-control">
//                   <label className={labelClass}>Service Name</label>
//                   <input
//                     type="text"
//                     value={entry.service_name || ''}
//                     onChange={e => handleServiceChange(index, 'service_name', e.target.value)}
//                     className={inputClass}
//                     placeholder="e.g. Laundry, Restaurant..."
//                   />
//                 </div>

//                 {/* Service date */}
//                 <div className="form-control">
//                   <label className={labelClass}>Date</label>
//                   <DatePicker
//                     value={entry.service_date || ''}
//                     onChange={val => {
//                       handleServiceChange(index, 'service_date', val);
//                       validateServiceDate(val, `svc_${index}`);
//                     }}
//                     minDate={arrivalDate?.split('T')[0]}
//                     maxDate={departureDate?.split('T')[0]}
//                     placeholder="Select date"
//                   />
//                   {dateErrors[`svc_${index}`] && (
//                     <p className="text-xs text-red-600 mt-1">⚠️ {dateErrors[`svc_${index}`]}</p>
//                   )}
//                 </div>

//                 {/* Gross amount */}
//                 <div className="form-control">
//                   <label className={labelClass}>Gross Amount (TND)</label>
//                   <input
//                     type="number"
//                     step="0.001"
//                     value={entry.gross_amount || ''}
//                     onChange={e => handleServiceChange(index, 'gross_amount', e.target.value)}
//                     className={inputClass}
//                     placeholder="0.000"
//                   />
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
//           <button
//             onClick={addService}
//             className="flex items-center gap-2 bg-[#003d7a] text-white px-5 py-2.5 rounded-lg hover:bg-[#002a5c] text-sm font-medium transition-colors shadow-sm"
//           >
//             <Plus size={16} /> Add Service Entry
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };

// export default TunisiaConditionalSection;


// import { useEffect, useState, useCallback } from "react";
// import { Plus, Trash2, Copy } from "lucide-react";
// import DatePicker from "../DatePicker";
// import {
//   detectHotelTypeTunisia,
//   HOTEL_CONFIGS_TUNISIA,
//   calculateAccommodationTunisia,
// } from "../../utils/InvoiceCalculationsTunisia";

// const TunisiaConditionalSection = ({ formData, setFormData, hotelConfig, onFieldChange }) => {
//   const labelClass    = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const inputClass    = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
//   const readOnlyClass = "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium";

//   const hotelType = detectHotelTypeTunisia(hotelConfig);
//   const hCfg      = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;

//   const acc = formData.accommodation_details || {};
//   const services = formData.other_services || [];

//   const arrivalDate   = formData.arrival_date || '';
//   const departureDate = formData.departure_date || '';

//   const [dateErrors, setDateErrors] = useState({});

//   // Live room rate — computed at render time, never lags or races
//   const liveAccCalc = calculateAccommodationTunisia(formData, hotelType);
//   const computedRoomRateDisplay =
//     liveAccCalc.roomAmountTnd > 0 ? liveAccCalc.roomAmountTnd.toFixed(3) : '';

//   // nb_persons = nb_adults + nb_children, kept in sync
//   useEffect(() => {
//     const adults = parseInt(formData.nb_adults) || 0;
//     const children = parseInt(formData.nb_children) || 0;
//     const total = adults + children || 1;

//     const currentTopLevel = parseInt(formData.nb_persons) || 0;
//     const currentNested = parseInt(acc.nb_persons) || 0;

//     if (currentTopLevel !== total || currentNested !== total) {
//       setFormData(prev => ({
//         ...prev,
//         nb_persons: total,
//         accommodation_details: { ...prev.accommodation_details, nb_persons: total },
//       }));
//     }
//   }, [formData.nb_adults, formData.nb_children]);

//   const validateServiceDate = useCallback((val, key) => {
//     if (!val || !arrivalDate || !departureDate) return;
//     const sel = new Date(val).setHours(0, 0, 0, 0);
//     const min = new Date(arrivalDate).setHours(0, 0, 0, 0);
//     const max = new Date(departureDate).setHours(0, 0, 0, 0);
//     if (sel < min || sel > max) {
//       setDateErrors(prev => ({ ...prev, [key]: `Must be between ${arrivalDate.split('T')[0]} and ${departureDate.split('T')[0]}` }));
//     } else {
//       setDateErrors(prev => ({ ...prev, [key]: null }));
//     }
//   }, [arrivalDate, departureDate]);

//   const handleServiceChange = (index, field, value) => {
//     setFormData(prev => {
//       const next = [...(prev.other_services || [])];
//       next[index] = { ...next[index], [field]: value };
//       return { ...prev, other_services: next };
//     });
//   };

//   const addService = () => {
//     setFormData(prev => ({
//       ...prev,
//       other_services: [
//         ...(prev.other_services || []),
//         {
//           id: Date.now() + Math.random(),
//           service_name: '',
//           service_date: arrivalDate,
//           gross_amount: '',
//           quantity: 1,
//           description: '',
//           code: '',
//         },
//       ],
//     }));
//   };

//   const duplicateService = (index) => {
//     setFormData(prev => {
//       const next = [...(prev.other_services || [])];
//       next.splice(index + 1, 0, { ...next[index], id: Date.now() + Math.random() });
//       return { ...prev, other_services: next };
//     });
//   };

//   const deleteService = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       other_services: (prev.other_services || []).filter((_, i) => i !== index),
//     }));
//   };

//   const accField = (id, label, opts = {}) => {
//     const { readOnly = false, type = 'text', step = '0.001', placeholder = '' } = opts;
//     const value = acc[id] ?? '';
//     return (
//       <div key={id} className="form-control">
//         <label className={labelClass}>{label}</label>
//         <input
//           type={type}
//           step={step}
//           value={value}
//           readOnly={readOnly}
//           placeholder={placeholder}
//           onChange={e => !readOnly && onFieldChange(`accommodation_details.${id}`, e.target.value)}
//           className={readOnly ? readOnlyClass : inputClass}
//         />
//       </div>
//     );
//   };

//   // Renders one field straight from hCfg.accommodationFields — no hotel-type
//   // branching lives here. Change the field lists in the calc file, not here.
//   const renderConfigField = (field) => {
//     if (field.computed) {
//       return (
//         <div key={field.id} className="form-control">
//           <label className={labelClass}>{field.label}</label>
//           <input type={field.type} value={computedRoomRateDisplay} readOnly className={readOnlyClass} />
//         </div>
//       );
//     }
//     return accField(field.id, field.label, {
//       type: field.type,
//       step: field.step,
//       placeholder: field.placeholder,
//     });
//   };

//   return (
//     <>
//       {/* ── Accommodation Details ────────────────────────────────────────── */}
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//         <div className="mb-6 border-b pb-3">
//           <h3 className="font-bold text-lg text-slate-800">Accommodation Details</h3>
//           <p className="text-xs text-slate-500 mt-1">{hCfg.accommodationHint}</p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//           {accField('total_nights', 'Total Nights', { readOnly: true, type: 'number' })}

//           {hCfg.accommodationFields.map(renderConfigField)}

//           {accField('city_tax_per_person', 'City Tax / Person / Night (TND)', { type: 'number', step: '1', placeholder: '3' })}
//           {accField('stamp_tax', 'Stamp Tax (TND)', { type: 'number', step: '1', placeholder: '1' })}

//           <div className="form-control">
//             <label className={labelClass}>Number of Persons (Auto)</label>
//             <input
//               type="number"
//               value={(parseInt(formData.nb_adults) || 0) + (parseInt(formData.nb_children) || 0) || 1}
//               readOnly
//               className={readOnlyClass}
//             />
//             <p className="text-xs text-slate-500 mt-1">Adults + Children from Invoice Information</p>
//           </div>
//         </div>
//       </div>

//       {/* ── Other Services ───────────────────────────────────────────────── */}
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//         <div className="mb-6 border-b pb-3">
//           <h3 className="font-bold text-lg text-slate-800">Other Services</h3>
//           <p className="text-xs text-slate-500 mt-1">
//             Laundry, Restaurant, Spa, Retail, etc. — enter gross TND amount per entry
//           </p>
//         </div>

//         <div className="space-y-4">
//           {services.map((entry, index) => (
//             <div key={entry.id || index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
//               <div className="absolute top-2 right-2 flex items-center gap-1">
//                 <button onClick={() => duplicateService(index)} className="text-blue-500 hover:text-blue-700" title="Duplicate">
//                   <Copy size={16} />
//                 </button>
//                 <button onClick={() => deleteService(index)} className="text-red-500 hover:text-red-700" title="Delete">
//                   <Trash2 size={16} />
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="form-control">
//                   <label className={labelClass}>Service Name</label>
//                   <input
//                     type="text"
//                     value={entry.service_name || ''}
//                     onChange={e => handleServiceChange(index, 'service_name', e.target.value)}
//                     className={inputClass}
//                     placeholder="e.g. Laundry, Restaurant..."
//                   />
//                 </div>

//                 <div className="form-control">
//                   <label className={labelClass}>Code</label>
//                   <input
//                     type="text"
//                     value={entry.code || ''}
//                     onChange={e => handleServiceChange(index, 'code', e.target.value)}
//                     className={inputClass}
//                     placeholder="e.g. SVC-001"
//                   />
//                 </div>

//                 <div className="form-control">
//                   <label className={labelClass}>Quantity</label>
//                   <input
//                     type="number"
//                     step="1"
//                     min="1"
//                     value={entry.quantity ?? 1}
//                     onChange={e => handleServiceChange(index, 'quantity', e.target.value)}
//                     className={inputClass}
//                   />
//                 </div>

//                 <div className="form-control md:col-span-2">
//                   <label className={labelClass}>Description</label>
//                   <input
//                     type="text"
//                     value={entry.description || ''}
//                     onChange={e => handleServiceChange(index, 'description', e.target.value)}
//                     className={inputClass}
//                     placeholder="Optional details"
//                   />
//                 </div>

//                 <div className="form-control">
//                   <label className={labelClass}>Date</label>
//                   <DatePicker
//                     value={entry.service_date || ''}
//                     onChange={val => {
//                       handleServiceChange(index, 'service_date', val);
//                       validateServiceDate(val, `svc_${index}`);
//                     }}
//                     minDate={arrivalDate?.split('T')[0]}
//                     maxDate={departureDate?.split('T')[0]}
//                     placeholder="Select date"
//                   />
//                   {dateErrors[`svc_${index}`] && (
//                     <p className="text-xs text-red-600 mt-1">⚠️ {dateErrors[`svc_${index}`]}</p>
//                   )}
//                 </div>

//                 <div className="form-control">
//                   <label className={labelClass}>Gross Amount (TND)</label>
//                   <input
//                     type="number"
//                     step="0.001"
//                     value={entry.gross_amount || ''}
//                     onChange={e => handleServiceChange(index, 'gross_amount', e.target.value)}
//                     className={inputClass}
//                     placeholder="0.000"
//                   />
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
//           <button
//             onClick={addService}
//             className="flex items-center gap-2 bg-[#003d7a] text-white px-5 py-2.5 rounded-lg hover:bg-[#002a5c] text-sm font-medium transition-colors shadow-sm"
//           >
//             <Plus size={16} /> Add Service Entry
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };

// export default TunisiaConditionalSection;