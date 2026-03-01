import React, { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import Input from "../Input";
import DatePicker from "../DatePicker";

const DynamicFormSection = ({ title, fields, formData, onFieldChange }) => {
  const [openPicker, setOpenPicker] = useState(null); // Tracks which custom time picker is open
  const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";

  const renderField = (field) => {
    const value = formData[field.field_id] || "";
    
    // Common props for standard inputs
    const commonProps = {
      name: field.field_id,
      value: value,
      placeholder: field.example || `Enter ${field.label}`,
      required: field.required || false,
    };

    // Render based on data_type
    switch (field.data_type) {
      case "date":
        return (
          <DatePicker
            {...commonProps}
            onChange={(dateString) => onFieldChange(field.field_id, dateString)}
          />
        );

      case "integer":
        return (
          <Input
            type="number"
            step="1"
            min="0"
            {...commonProps}
            onChange={(e) => onFieldChange(field.field_id, e.target.value)}
          />
        );

      case "decimal":
        return (
          <Input
            type="number"
            step="0.01"
            min="0"
            {...commonProps}
            onChange={(e) => onFieldChange(field.field_id, e.target.value)}
          />
        );

      case "string":
      default:
        const isTimeField = field.field_id.includes("time");

        // 🟢 PREMIUM 24-HOUR TIME INPUT
        if (isTimeField) {
          const timeParts = value.split(":");
          const hh = timeParts[0] || "";
          const mm = timeParts[1] || "";
          const isOpen = openPicker === field.field_id;

          const handleTimeChange = (type, val) => {
            let cleanVal = val.replace(/\D/g, ''); 
            let newH = hh;
            let newM = mm;

            if (type === 'h') {
              if (parseInt(cleanVal) > 23) cleanVal = "23";
              newH = cleanVal;
              
              if (cleanVal.length === 2) {
                const minInput = document.getElementById(`min-${field.field_id}`);
                if (minInput) minInput.focus();
              }
            } else {
              if (parseInt(cleanVal) > 59) cleanVal = "59";
              newM = cleanVal;
            }

            if (!newH && !newM) {
              onFieldChange(field.field_id, "");
            } else {
              onFieldChange(field.field_id, `${newH}:${newM}`);
            }
          };

          const handleTimeBlur = () => {
            if (hh || mm) {
              let safeH = hh;
              let safeM = mm;

              if (safeH.length === 1) safeH = `0${safeH}`;
              if (safeH === "") safeH = "00";
              
              if (safeM.length === 1) safeM = `0${safeM}`;
              if (safeM === "") safeM = "00";

              onFieldChange(field.field_id, `${safeH}:${safeM}`);
            }
          };

          return (
            <div className="relative w-full">
              <div className="flex items-center w-full border border-slate-300 rounded-lg bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 h-[42px] px-3 shadow-sm transition-all">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="HH"
                  value={hh}
                  onChange={(e) => handleTimeChange('h', e.target.value)}
                  onBlur={handleTimeBlur}
                  maxLength={2}
                  className="w-9 h-full bg-transparent border-none outline-none text-center text-sm text-slate-700 font-medium placeholder-slate-300 focus:bg-slate-50 rounded"
                />
                
                <span className="text-slate-400 font-bold px-1 mb-0.5">:</span>
                
                <input
                  id={`min-${field.field_id}`}
                  type="text"
                  inputMode="numeric"
                  placeholder="MM"
                  value={mm}
                  onChange={(e) => handleTimeChange('m', e.target.value)}
                  onBlur={handleTimeBlur}
                  maxLength={2}
                  className="w-9 h-full bg-transparent border-none outline-none text-center text-sm text-slate-700 font-medium placeholder-slate-300 focus:bg-slate-50 rounded"
                />
                
                <div className="flex-1"></div>

                {/* CLOCK ICON BUTTON */}
                <div 
                  className="flex items-center justify-center w-8 h-full cursor-pointer hover:bg-slate-50 rounded transition-colors group"
                  onClick={() => setOpenPicker(isOpen ? null : field.field_id)}
                >
                  <Clock size={16} className={`transition-colors ${isOpen ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'}`} />
                </div>
              </div>

              {/* 🟢 CUSTOM 24-HOUR POPOVER */}
              {isOpen && (
                <>
                  {/* Invisible background overlay to detect clicks outside the picker */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setOpenPicker(null)} 
                  />
                  
                  {/* The Dropdown Menu */}
                  <div className="absolute right-0 top-[46px] w-44 bg-white border border-slate-200 shadow-xl rounded-lg z-50 flex h-56 overflow-hidden select-none">
                    
                    {/* CSS to hide ugly scrollbars inside the popup */}
                    <style>{`.hide-scroll::-webkit-scrollbar { display: none; } .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
                    
                    {/* Hours Column */}
                    <div className="flex-1 overflow-y-auto hide-scroll border-r border-slate-100">
                      <div className="sticky top-0 bg-slate-100/90 backdrop-blur-sm border-b border-slate-200 text-[11px] font-bold text-slate-500 text-center py-1.5 z-10">
                        HOUR
                      </div>
                      {Array.from({ length: 24 }).map((_, i) => {
                        const h = i.toString().padStart(2, '0');
                        const isSelected = hh === h;
                        return (
                          <div 
                            key={`h-${h}`}
                            className={`text-center py-2 cursor-pointer text-sm transition-colors ${isSelected ? 'bg-blue-500 text-white font-bold' : 'text-slate-700 hover:bg-blue-50'}`}
                            onClick={() => onFieldChange(field.field_id, `${h}:${mm || '00'}`)}
                          >
                            {h}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Minutes Column */}
                    <div className="flex-1 overflow-y-auto hide-scroll">
                      <div className="sticky top-0 bg-slate-100/90 backdrop-blur-sm border-b border-slate-200 text-[11px] font-bold text-slate-500 text-center py-1.5 z-10">
                        MIN
                      </div>
                      {Array.from({ length: 60 }).map((_, i) => {
                        const m = i.toString().padStart(2, '0');
                        const isSelected = mm === m;
                        return (
                          <div 
                            key={`m-${m}`}
                            className={`text-center py-2 cursor-pointer text-sm transition-colors ${isSelected ? 'bg-blue-500 text-white font-bold' : 'text-slate-700 hover:bg-blue-50'}`}
                            onClick={() => {
                              onFieldChange(field.field_id, `${hh || '00'}:${m}`);
                              setOpenPicker(null); // ✅ FIX: Auto-closes the popup when minute is clicked!
                            }}
                          >
                            {m}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        }

        // 🔵 STANDARD TEXT INPUT
        return (
          <Input
            type="text"
            maxLength={field.max_length}
            {...commonProps}
            onChange={(e) => onFieldChange(field.field_id, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
        {title}
      </h3>

      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-800 text-xs flex items-center gap-2">
            <span className="text-red-500">*</span> Fields marked with asterisk are required
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8 md:gap-y-5">
          {fields.map((field) => (
            <div key={field.field_id} className="form-control">
              <label className={labelClass}>
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              
              {renderField(field)}

              {/* Hide the example text if it's our new custom time input */}
              {field.example && !field.required && !field.field_id.includes("time") && (
                <p className="text-xs text-slate-500 mt-1">
                  Example: {field.example}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Auto-calculated fields info */}
        {formData.arrival_date && formData.departure_date && (
          <div className="mt-4 md:mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-semibold text-xs md:text-sm flex items-center gap-2">
              <Calendar size={16} />
              Date range selected: {formData.arrival_date} to {formData.departure_date}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicFormSection;