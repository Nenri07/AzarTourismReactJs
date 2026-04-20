import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import DatePicker from "../DatePicker";
import {
  detectHotelTypeTunisia,
  HOTEL_CONFIGS_TUNISIA,
  calculateAccommodationTunisia,
} from "../../utils/InvoiceCalculationsTunisia";

/**
 * TunisiaConditionalSection
 *
 * Renders two sections:
 *   1. Accommodation Details  — fields differ by hotel type (TND vs EUR input)
 *   2. Other Services         — repeatable service entries
 */
const TunisiaConditionalSection = ({ formData, setFormData, hotelConfig, onFieldChange }) => {
  const labelClass    = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
  const inputClass    = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
  const readOnlyClass = "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium";

  const hotelType = detectHotelTypeTunisia(hotelConfig);
  const hCfg      = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;
  const isEurHotel = hCfg.inputCurrency === 'EUR';

  const acc = formData.accommodation_details || {};
  const services = formData.other_services || [];

  const arrivalDate   = formData.arrival_date || '';
  const departureDate = formData.departure_date || '';

  const [dateErrors, setDateErrors] = useState({});

  // ── Auto-calc: total_nights sync is done in parent via date useEffect ──

  // ── Auto-calc accommodation computed fields ──────────────────────────────
  useEffect(() => {
    const totalNights = parseInt(acc.total_nights) || 0;
    if (totalNights === 0) return;

    const calculated = calculateAccommodationTunisia(formData, hotelType);
    if (calculated.roomAmountTnd === 0) return;

    const updates = {};

    // For EUR hotels: show the computed net TND per night as readonly
    if (isEurHotel && calculated.roomAmountTnd > 0) {
      const netNightly = calculated.roomAmountTnd.toFixed(3);
      if (String(acc.room_amount_tnd_computed) !== String(netNightly)) {
        updates.room_amount_tnd_computed = netNightly;
      }
    }

    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({
        ...prev,
        accommodation_details: { ...prev.accommodation_details, ...updates },
      }));
    }
  }, [
    acc.eur_amount,
    acc.exchange_rate,
    acc.room_amount_tnd,
    acc.total_nights,
    hotelType,
  ]);

  const validateServiceDate = useCallback((val, key) => {
    if (!val || !arrivalDate || !departureDate) return;
    const sel = new Date(val).setHours(0, 0, 0, 0);
    const min = new Date(arrivalDate).setHours(0, 0, 0, 0);
    const max = new Date(departureDate).setHours(0, 0, 0, 0);
    if (sel < min || sel > max) {
      setDateErrors(prev => ({ ...prev, [key]: `Must be between ${arrivalDate.split('T')[0]} and ${departureDate.split('T')[0]}` }));
    } else {
      setDateErrors(prev => ({ ...prev, [key]: null }));
    }
  }, [arrivalDate, departureDate]);

  // ── Service CRUD ──────────────────────────────────────────────────────────
  const handleServiceChange = (index, field, value) => {
    setFormData(prev => {
      const next = [...(prev.other_services || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, other_services: next };
    });
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      other_services: [
        ...(prev.other_services || []),
        { id: Date.now() + Math.random(), service_name: '', service_date: arrivalDate, gross_amount: '' },
      ],
    }));
  };

  const duplicateService = (index) => {
    setFormData(prev => {
      const next = [...(prev.other_services || [])];
      next.splice(index + 1, 0, { ...next[index], id: Date.now() + Math.random() });
      return { ...prev, other_services: next };
    });
  };

  const deleteService = (index) => {
    setFormData(prev => ({
      ...prev,
      other_services: (prev.other_services || []).filter((_, i) => i !== index),
    }));
  };

  // ── Field helper ──────────────────────────────────────────────────────────
  const accField = (id, label, opts = {}) => {
    const { readOnly = false, type = 'text', step = '0.001', placeholder = '' } = opts;
    const value = acc[id] ?? '';
    return (
      <div key={id} className="form-control">
        <label className={labelClass}>{label}</label>
        <input
          type={type}
          step={step}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={e => !readOnly && onFieldChange(`accommodation_details.${id}`, e.target.value)}
          className={readOnly ? readOnlyClass : inputClass}
        />
      </div>
    );
  };

  return (
    <>
      {/* ── Accommodation Details ──────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="mb-6 border-b pb-3">
          <h3 className="font-bold text-lg text-slate-800">Accommodation Details</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isEurHotel
              ? "Enter amount in EUR + exchange rate (EUR→TND)"
              : "Enter nightly room amount in TND"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Total nights — always read-only (auto from dates) */}
          {accField('total_nights', 'Total Nights', { readOnly: true, type: 'number' })}

          {isEurHotel ? (
            <>
              {accField('eur_amount', 'Amount (EUR)', { type: 'number', step: '0.01', placeholder: 'e.g. 350' })}
              {accField('exchange_rate', 'EUR → TND Rate', { type: 'number', step: '0.00001', placeholder: 'e.g. 3.3310' })}
              {accField('exchange_usd_rate', 'TND → USD Rate', { type: 'number', step: '0.00001', placeholder: 'e.g. 3.3285' })}
              {/* Computed net TND per night (readonly display) */}
              {accField('room_amount_tnd_computed', 'Net Room Amount / Night (TND)', { readOnly: true, type: 'number' })}
            </>
          ) : (
            <>
              {accField('room_amount_tnd', 'Room Amount / Night (TND)', { type: 'number', step: '0.001', placeholder: 'e.g. 940' })}
              {accField('exchange_usd_rate', 'TND → USD Rate', { type: 'number', step: '0.00001', placeholder: 'e.g. 3.3285' })}
            </>
          )}

          {accField('city_tax_per_person', 'City Tax / Person / Night (TND)', { type: 'number', step: '1', placeholder: '3' })}
          {accField('stamp_tax', 'Stamp Tax (TND)', { type: 'number', step: '1', placeholder: '1' })}

          {/* Nb Persons (mirrors top-level nb_persons) */}
          <div className="form-control">
            <label className={labelClass}>Number of Persons</label>
            <input
              type="number"
              step="1"
              min="1"
              value={formData.nb_persons || 1}
              onChange={e => onFieldChange('nb_persons', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Other Services ─────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="mb-6 border-b pb-3">
          <h3 className="font-bold text-lg text-slate-800">Other Services</h3>
          <p className="text-xs text-slate-500 mt-1">
            Laundry, Restaurant, Spa, Retail, etc. — enter gross TND amount per entry
          </p>
        </div>

        <div className="space-y-4">
          {services.map((entry, index) => (
            <div key={entry.id || index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button onClick={() => duplicateService(index)} className="text-blue-500 hover:text-blue-700" title="Duplicate">
                  <Copy size={16} />
                </button>
                <button onClick={() => deleteService(index)} className="text-red-500 hover:text-red-700" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Service name */}
                <div className="form-control">
                  <label className={labelClass}>Service Name</label>
                  <input
                    type="text"
                    value={entry.service_name || ''}
                    onChange={e => handleServiceChange(index, 'service_name', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Laundry, Restaurant..."
                  />
                </div>

                {/* Service date */}
                <div className="form-control">
                  <label className={labelClass}>Date</label>
                  <DatePicker
                    value={entry.service_date || ''}
                    onChange={val => {
                      handleServiceChange(index, 'service_date', val);
                      validateServiceDate(val, `svc_${index}`);
                    }}
                    minDate={arrivalDate?.split('T')[0]}
                    maxDate={departureDate?.split('T')[0]}
                    placeholder="Select date"
                  />
                  {dateErrors[`svc_${index}`] && (
                    <p className="text-xs text-red-600 mt-1">⚠️ {dateErrors[`svc_${index}`]}</p>
                  )}
                </div>

                {/* Gross amount */}
                <div className="form-control">
                  <label className={labelClass}>Gross Amount (TND)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={entry.gross_amount || ''}
                    onChange={e => handleServiceChange(index, 'gross_amount', e.target.value)}
                    className={inputClass}
                    placeholder="0.000"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
          <button
            onClick={addService}
            className="flex items-center gap-2 bg-[#003d7a] text-white px-5 py-2.5 rounded-lg hover:bg-[#002a5c] text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} /> Add Service Entry
          </button>
        </div>
      </div>
    </>
  );
};

export default TunisiaConditionalSection;