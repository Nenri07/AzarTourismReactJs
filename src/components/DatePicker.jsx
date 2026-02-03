

import React, { useState, useRef, useEffect, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { Calendar } from "lucide-react";
import "react-day-picker/dist/style.css";

const DatePicker = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  disabled = false,
  name,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Memoize date objects to prevent "Invalid Date" errors on re-render
  const selectedDate = useMemo(() => 
    value ? new Date(value + "T00:00:00") : undefined, 
  [value]);

  const minDateObj = useMemo(() => 
    minDate ? new Date(minDate + "T00:00:00") : undefined, 
  [minDate]);

  const maxDateObj = useMemo(() => 
    maxDate ? new Date(maxDate + "T00:00:00") : undefined, 
  [maxDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateForInput = (date) => {
    if (!date || isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSelect = (date) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      
      // ✅ RETURN STRING DIRECTLY (No fake event object)
      onChange(formattedDate);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          readOnly
          disabled={disabled}
          value={formatDateForInput(selectedDate)}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <Calendar
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[100] mt-2 bg-white border border-slate-300 rounded-lg shadow-xl p-4 left-0">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={[
              ...(minDateObj ? [{ before: minDateObj }] : []),
              ...(maxDateObj ? [{ after: maxDateObj }] : []),
            ]}
            defaultMonth={selectedDate || new Date()}
            modifiersClassNames={{
              selected: "bg-[#003d7a] text-white font-bold",
              today: "bg-slate-100 font-semibold",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DatePicker;
