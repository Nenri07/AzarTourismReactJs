import { Plus, X } from "lucide-react";


import Input from "../Input";

import DatePicker from "../DatePicker";

const DynamicConditionalSection = ({ 
  sectionKey, 
  section, 
  formData, 
  onFieldChange,
  setFormData 
}) => {
  const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";

  // Handle multiple entries (like other_services)
  if (section.multiple_entries) {
    return (
      <MultipleEntriesSection
        sectionKey={sectionKey}
        section={section}
        formData={formData}
        setFormData={setFormData}
      />
    );
  }

  // Single object section (accommodation, city_tax, stamp_tax)
  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
        {section.object_name?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {section.fields?.map((field) => {
          const fieldPath = `${sectionKey}.${field.field_id}`;
          const value = formData[sectionKey]?.[field.field_id] || "";

          return (
            <div key={field.field_id} className="form-control">
              <label className={labelClass}>
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
                {field.auto_calculated && <span className="text-blue-500 ml-1">(Auto)</span>}
              </label>
              
              {renderFieldInput(
                field,
                value,
                fieldPath,
                onFieldChange,
                field.auto_calculated
              )}

              {field.example && (
                <p className="text-xs text-slate-500 mt-1">
                  Example: {field.example}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Show calculation info if exists */}
      {section.calculation_rules && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 font-medium mb-1">Calculations:</p>
          <div className="text-xs text-blue-600 space-y-1">
            {Object.entries(section.calculation_rules).map(([key, formula]) => (
              <div key={key}>• {key} = {formula}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: Render individual field input
const renderFieldInput = (field, value, fieldPath, onFieldChange, isReadOnly) => {
  const commonProps = {
    name: field.field_id,
    value: value,
    onChange: (e) => onFieldChange(fieldPath, e.target.value),
    placeholder: field.example || `Enter ${field.label}`,
    required: field.required || false,
    readOnly: isReadOnly,
    className: isReadOnly ? "bg-slate-100 border-slate-300 text-slate-700 font-medium" : "",
  };

  if (field.fixed_value) {
    return (
      <Input
        {...commonProps}
        value={field.fixed_value}
        readOnly
        className="bg-slate-100 border-slate-300 text-slate-700 font-medium"
      />
    );
  }

  switch (field.data_type) {
    case "date":
      return <DatePicker {...commonProps} />;

    case "integer":
      return (
        <Input
          type="number"
          step="1"
          min="0"
          {...commonProps}
        />
      );

    case "decimal":
      return (
        <Input
          type="number"
          step="0.01"
          min="0"
          {...commonProps}
        />
      );

    case "string":
    default:
      return (
        <Input
          type="text"
          maxLength={field.max_length}
          {...commonProps}
        />
      );
  }
};

// Component for multiple entries (like other_services)
const MultipleEntriesSection = ({ sectionKey, section, formData, setFormData }) => {
  const entries = formData[sectionKey] || [];

  const addEntry = () => {
    const newEntry = { id: Date.now() };
    
    // Initialize fields
    section.fields?.forEach(field => {
      newEntry[field.field_id] = field.fixed_value || "";
    });

    setFormData(prev => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] || []), newEntry]
    }));
  };

  const removeEntry = (id) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter(entry => entry.id !== id)
    }));
  };

  const updateEntry = (id, fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map(entry =>
        entry.id === id ? { ...entry, [fieldId]: value } : entry
      )
    }));
  };

  const totalAmount = entries.reduce((sum, entry) => {
    const amountField = section.fields?.find(f => f.data_type === "decimal");
    if (amountField) {
      return sum + (parseFloat(entry[amountField.field_id]) || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2">
        <h3 className="font-bold text-base md:text-lg text-slate-800">
          {section.object_name?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </h3>
        {entries.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-slate-500 text-sm">No entries added yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Click "Add Entry" to include items
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <div className="grid gap-3 px-2 text-xs font-medium text-slate-600" 
               style={{ gridTemplateColumns: `repeat(${section.fields?.length || 1}, 1fr) auto` }}>
            {section.fields?.map(field => (
              <div key={field.field_id}>{field.label}</div>
            ))}
            <div></div>
          </div>

          {/* Rows */}
          {entries.map((entry) => (
            <div 
              key={entry.id} 
              className="grid gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
              style={{ gridTemplateColumns: `repeat(${section.fields?.length || 1}, 1fr) auto` }}
            >
              {section.fields?.map(field => (
                <div key={field.field_id}>
                  {renderFieldInput(
                    field,
                    entry[field.field_id] || "",
                    field.field_id,
                    (_, value) => updateEntry(entry.id, field.field_id, value),
                    false
                  )}
                </div>
              ))}
              
              <div className="flex items-center justify-center">
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      {totalAmount > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-green-800 font-semibold">Total:</span>
            <span className="text-green-800 font-bold text-lg">
              {totalAmount.toFixed(2)} {formData.currency || ''}
            </span>
          </div>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={addEntry}
        className="mt-4 flex items-center justify-center gap-2 bg-[#002a5c] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#001a3c] transition-colors w-full"
      >
        <Plus size={16} />
        Add Entry
      </button>
    </div>
  );
};

export default DynamicConditionalSection;
