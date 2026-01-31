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

  // Format date as DD/MM/YYYY
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle date change
  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setDateError(""); // Clear any previous error

    // If no dates set, just update
    if (!arrivalDate || !departureDate) {
      handleChange("date", dateValue);
      return;
    }

    const date = new Date(dateValue);
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);

    // Check if date is within range
    if (date >= arrival && date <= departure) {
      handleChange("date", dateValue);
    } else {
      // Show error in a better way
      const arrivalFormatted = formatDateDisplay(arrivalDate);
      const departureFormatted = formatDateDisplay(departureDate);
      setDateError(
        `Must be between ${arrivalFormatted} - ${departureFormatted}`,
      );
      // Don't update the invalid date
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
          onChange={handleDateChange}
          placeholder="DD/MM/YYYY"
        />
        {/* Error message - appears below date picker */}
        {dateError && (
          <div className="mt-1 flex items-center gap-1">
            <AlertCircle size={12} className="text-amber-600" />
            <span className="text-xs text-amber-600">{dateError}</span>
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
          className="text-sm"
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
