"use client";

import { Plus, Trash2, Copy } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { calculateUKAccommodation, calcVAT } from "../../utils/invoiceCalculationsUK";
import DatePicker from "../DatePicker";

const UKConditionalSection = ({
  sectionKey,
  section,
  formData,
  onFieldChange,
  setFormData,
  hotelConfig,
}) => {
  const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
  const inputClass =
    "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#1a1a2e] bg-white";
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

  // ─────────────────────────────────────────────────────────────────
  // UK ACCOMMODATION CALCULATION EFFECT
  // gbp_amount / 1.2 = net, net * 0.2 = vat, gross = net + vat
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sectionKey === "accommodation_details" && !section.multiple_entries) {
      const acc = formData.accommodation_details || {};
      const gbpAmount = parseFloat(acc.gbp_amount || acc.room_rate || 0);

      if (gbpAmount > 0) {
        const { net, vat, gross } = calcVAT(gbpAmount);
        const calculated = calculateUKAccommodation(formData);

        const updates = {
          nightly_net_gbp: net.toFixed(2),
          nightly_vat_gbp: vat.toFixed(2),
          nightly_gross_gbp: gross.toFixed(2),
          total_room_net: calculated.totalRoomNet?.toFixed(2) || "0.00",
          total_room_vat: calculated.totalRoomVat?.toFixed(2) || "0.00",
          total_room_gross: calculated.totalRoomGross?.toFixed(2) || "0.00",
        };

        const hasChanges = Object.entries(updates).some(
          ([k, v]) => String(acc[k]) !== String(v)
        );
        if (hasChanges) {
          setFormData((prev) => ({
            ...prev,
            accommodation_details: {
              ...prev.accommodation_details,
              ...updates,
            },
          }));
        }
      }
    }
  }, [
    sectionKey,
    formData.accommodation_details?.gbp_amount,
    formData.accommodation_details?.total_nights,
    setFormData,
  ]);

  // ─────────────────────────────────────────────────────────────────
  // SERVICE ROW VAT CALCULATION
  // When gross_amount is entered for a service, auto-calc net+vat
  // ─────────────────────────────────────────────────────────────────
  const handleEntryFieldChange = (index, fieldId, value) => {
    setFormData((prev) => {
      const newEntries = [...(prev[sectionKey] || [])];
      newEntries[index] = { ...newEntries[index], [fieldId]: value };

      // Auto-calculate net/vat when gross_amount changes
      if (fieldId === "gross_amount" && sectionKey === "other_services") {
        const gross = parseFloat(value || 0);
        if (gross > 0) {
          const { net, vat } = calcVAT(gross);
          newEntries[index].net_amount = net.toFixed(2);
          newEntries[index].vat_amount = vat.toFixed(2);
        }
      }

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
          step={field.data_type === "decimal" ? "0.01" : "1"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={isReadOnly}
          className={isReadOnly ? readOnlyClass : inputClass}
          placeholder={field.placeholder || ""}
        />
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6 border-b pb-3">
        <h3 className="font-bold text-lg text-slate-800">{section.title}</h3>
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
                    f.data_type === "date" ? arrivalDate : f.default || "")
              );
              setFormData((prev) => ({
                ...prev,
                [sectionKey]: [...(prev[sectionKey] || []), newEntry],
              }));
            }}
            className="flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg hover:bg-[#0d0d1a] text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} /> Add {section.title.replace("Other ", "")} Entry
          </button>
        </div>
      )}
    </div>
  );
};

export default UKConditionalSection;