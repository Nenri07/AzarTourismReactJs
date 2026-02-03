
import { X, AlertCircle } from "lucide-react";
import { Input, DatePicker } from "./index.js";
import { useState } from "react";

const ServiceRow = ({
  service,
  onChange,
  onRemove,
  arrivalDate,
  departureDate,
}) => {
  const [dateError, setDateError] = useState("");

  const handleChange = (field, value) => {
    onChange(service.id, field, value);
  };

  // Format date as DD/MM/YYYY for error messages
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // ✅ UPDATED: Accept direct value from DatePicker
  const handleDateChange = (dateValue) => {
    setDateError(""); // Clear any previous error

    // If no range constraints set, just update state
    if (!arrivalDate || !departureDate) {
      handleChange("date", dateValue);
      return;
    }

    // Convert strings to timestamps for reliable comparison
    const selected = new Date(dateValue).setHours(0, 0, 0, 0);
    const arrival = new Date(arrivalDate).setHours(0, 0, 0, 0);
    const departure = new Date(departureDate).setHours(0, 0, 0, 0);

    // Check if date is within range
    if (selected >= arrival && selected <= departure) {
      handleChange("date", dateValue);
    } else {
      const arrivalFormatted = formatDateDisplay(arrivalDate);
      const departureFormatted = formatDateDisplay(departureDate);
      setDateError(
        `Must be between ${arrivalFormatted} - ${departureFormatted}`,
      );
      // We still update the state so the user sees what they picked, 
      // but the error remains visible.
      handleChange("date", dateValue);
    }
  };

  return (
    <div className="grid grid-cols-10 gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
      {/* Service Name */}
      <div className="col-span-4">
        <Input
          type="text"
          placeholder="Service name"
          value={service.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Date */}
      <div className="col-span-3">
        <DatePicker
          name="date"
          value={service.date || ""}
          // ✅ Pass the function directly; it now receives the string
          onChange={handleDateChange} 
          placeholder="DD/MM/YYYY"
          minDate={arrivalDate}
          maxDate={departureDate}
        />
        {/* Error message */}
        {dateError && (
          <div className="mt-1 flex items-center gap-1">
            <AlertCircle size={12} className="text-amber-600" />
            <span className="text-[10px] leading-tight text-amber-600">{dateError}</span>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="0.00"
          step="0.01"
          value={service.amount || ""}
          onChange={(e) => handleChange("amount", e.target.value)}
          className="text-sm text-right"
        />
      </div>

      {/* Remove Button */}
      <div className="col-span-1 flex items-center justify-center">
        <button
          onClick={() => onRemove(service.id)}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default ServiceRow;
