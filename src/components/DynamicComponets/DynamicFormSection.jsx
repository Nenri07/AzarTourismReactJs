
import { Calendar } from "lucide-react";
import Input from "../Input";
import DatePicker from "../DatePicker";

const DynamicFormSection = ({ title, fields, formData, onFieldChange }) => {
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
            // ✅ Fix: DatePicker sends the string directly, not an event object
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
            // ✅ Standard inputs use e.target.value
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
              {field.example && !field.required && (
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
