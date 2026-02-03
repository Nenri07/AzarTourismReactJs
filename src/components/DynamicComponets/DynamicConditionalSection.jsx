// import { Plus, X } from "lucide-react";


// import Input from "../Input";

// import DatePicker from "../DatePicker";

// const DynamicConditionalSection = ({ 
//   sectionKey, 
//   section, 
//   formData, 
//   onFieldChange,
//   setFormData 
// }) => {
//   const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";

//   // Handle multiple entries (like other_services)
//   if (section.multiple_entries) {
//     return (
//       <MultipleEntriesSection
//         sectionKey={sectionKey}
//         section={section}
//         formData={formData}
//         setFormData={setFormData}
//       />
//     );
//   }

//   // Single object section (accommodation, city_tax, stamp_tax)
//   return (
//     <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//       <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
//         {section.object_name?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
//       </h3>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
//         {section.fields?.map((field) => {
//           const fieldPath = `${sectionKey}.${field.field_id}`;
//           const value = formData[sectionKey]?.[field.field_id] || "";

//           return (
//             <div key={field.field_id} className="form-control">
//               <label className={labelClass}>
//                 {field.label}
//                 {field.required && <span className="text-red-500"> *</span>}
//                 {field.auto_calculated && <span className="text-blue-500 ml-1">(Auto)</span>}
//               </label>
              
//               {renderFieldInput(
//                 field,
//                 value,
//                 fieldPath,
//                 onFieldChange,
//                 field.auto_calculated
//               )}

//               {field.example && (
//                 <p className="text-xs text-slate-500 mt-1">
//                   Example: {field.example}
//                 </p>
//               )}
//             </div>
//           );
//         })}
//       </div>

//       {/* Show calculation info if exists */}
//       {section.calculation_rules && (
//         <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//           <p className="text-xs text-blue-700 font-medium mb-1">Calculations:</p>
//           <div className="text-xs text-blue-600 space-y-1">
//             {Object.entries(section.calculation_rules).map(([key, formula]) => (
//               <div key={key}>• {key} = {formula}</div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Helper: Render individual field input
// const renderFieldInput = (field, value, fieldPath, onFieldChange, isReadOnly) => {
//   const commonProps = {
//     name: field.field_id,
//     value: value,
//     onChange: (e) => onFieldChange(fieldPath, e.target.value),
//     placeholder: field.example || `Enter ${field.label}`,
//     required: field.required || false,
//     readOnly: isReadOnly,
//     className: isReadOnly ? "bg-slate-100 border-slate-300 text-slate-700 font-medium" : "",
//   };

//   if (field.fixed_value) {
//     return (
//       <Input
//         {...commonProps}
//         value={field.fixed_value}
//         readOnly
//         className="bg-slate-100 border-slate-300 text-slate-700 font-medium"
//       />
//     );
//   }

//   switch (field.data_type) {
//     case "date":
//       return <DatePicker {...commonProps} />;

//     case "integer":
//       return (
//         <Input
//           type="number"
//           step="1"
//           min="0"
//           {...commonProps}
//         />
//       );

//     case "decimal":
//       return (
//         <Input
//           type="number"
//           step="0.01"
//           min="0"
//           {...commonProps}
//         />
//       );

//     case "string":
//     default:
//       return (
//         <Input
//           type="text"
//           maxLength={field.max_length}
//           {...commonProps}
//         />
//       );
//   }
// };

// // Component for multiple entries (like other_services)
// const MultipleEntriesSection = ({ sectionKey, section, formData, setFormData }) => {
//   const entries = formData[sectionKey] || [];

//   const addEntry = () => {
//     const newEntry = { id: Date.now() };
    
//     // Initialize fields
//     section.fields?.forEach(field => {
//       newEntry[field.field_id] = field.fixed_value || "";
//     });

//     setFormData(prev => ({
//       ...prev,
//       [sectionKey]: [...(prev[sectionKey] || []), newEntry]
//     }));
//   };

//   const removeEntry = (id) => {
//     setFormData(prev => ({
//       ...prev,
//       [sectionKey]: prev[sectionKey].filter(entry => entry.id !== id)
//     }));
//   };

//   const updateEntry = (id, fieldId, value) => {
//     setFormData(prev => ({
//       ...prev,
//       [sectionKey]: prev[sectionKey].map(entry =>
//         entry.id === id ? { ...entry, [fieldId]: value } : entry
//       )
//     }));
//   };

//   const totalAmount = entries.reduce((sum, entry) => {
//     const amountField = section.fields?.find(f => f.data_type === "decimal");
//     if (amountField) {
//       return sum + (parseFloat(entry[amountField.field_id]) || 0);
//     }
//     return sum;
//   }, 0);

//   return (
//     <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//       <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2">
//         <h3 className="font-bold text-base md:text-lg text-slate-800">
//           {section.object_name?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
//         </h3>
//         {entries.length > 0 && (
//           <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//             {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
//           </span>
//         )}
//       </div>

//       {entries.length === 0 ? (
//         <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
//           <p className="text-slate-500 text-sm">No entries added yet</p>
//           <p className="text-xs text-slate-400 mt-1">
//             Click "Add Entry" to include items
//           </p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {/* Header */}
//           <div className="grid gap-3 px-2 text-xs font-medium text-slate-600" 
//                style={{ gridTemplateColumns: `repeat(${section.fields?.length || 1}, 1fr) auto` }}>
//             {section.fields?.map(field => (
//               <div key={field.field_id}>{field.label}</div>
//             ))}
//             <div></div>
//           </div>

//           {/* Rows */}
//           {entries.map((entry) => (
//             <div 
//               key={entry.id} 
//               className="grid gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
//               style={{ gridTemplateColumns: `repeat(${section.fields?.length || 1}, 1fr) auto` }}
//             >
//               {section.fields?.map(field => (
//                 <div key={field.field_id}>
//                   {renderFieldInput(
//                     field,
//                     entry[field.field_id] || "",
//                     field.field_id,
//                     (_, value) => updateEntry(entry.id, field.field_id, value),
//                     false
//                   )}
//                 </div>
//               ))}
              
//               <div className="flex items-center justify-center">
//                 <button
//                   onClick={() => removeEntry(entry.id)}
//                   className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
//                 >
//                   <X size={16} />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Total */}
//       {totalAmount > 0 && (
//         <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
//           <div className="flex justify-between items-center">
//             <span className="text-green-800 font-semibold">Total:</span>
//             <span className="text-green-800 font-bold text-lg">
//               {totalAmount.toFixed(2)} {formData.currency || ''}
//             </span>
//           </div>
//         </div>
//       )}

//       {/* Add Button */}
//       <button
//         onClick={addEntry}
//         className="mt-4 flex items-center justify-center gap-2 bg-[#002a5c] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#001a3c] transition-colors w-full"
//       >
//         <Plus size={16} />
//         Add Entry
//       </button>
//     </div>
//   );
// };

// export default DynamicConditionalSection;



// import { Plus, Trash2 } from "lucide-react";
// import { useEffect } from "react";

// const DynamicConditionalSection = ({ sectionKey, section, formData, onFieldChange, setFormData }) => {
//   const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
//   const readOnlyClass = "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600";

//   const sectionData = formData[sectionKey] || (section.multiple_entries ? [] : {});

//   // ✅ FIX: Auto-calculate Grand Aras accommodation fields when inputs change
//   useEffect(() => {
//     if (sectionKey === 'accommodation_details' && !section.multiple_entries) {
//       const eurAmount = parseFloat(sectionData.eur_amount) || 0;
//       const exchangeRate = parseFloat(sectionData.exchange_rate) || 0;
//       const totalNights = parseInt(sectionData.total_nights) || 0;

//       if (eurAmount > 0 && exchangeRate > 0) {
//         // a = EUR Amount × Exchange Rate
//         const roomAmountTry = eurAmount * exchangeRate;
        
//         // b = Total Nights × a
//         const totalRoomAllNights = roomAmountTry * totalNights;
        
//         // d = b ÷ 1.12
//         const taxableAmountRoom = totalRoomAllNights / 1.12;
        
//         // g = d × 0.10
//         const vat10Percent = taxableAmountRoom * 0.1;
        
//         // j = d × 0.02
//         const accommodationTax = taxableAmountRoom * 0.02;

//         // Update all calculated fields
//         const currentValues = {
//           room_amount_try: roomAmountTry.toFixed(2),
//           total_room_all_nights: totalRoomAllNights.toFixed(2),
//           taxable_amount_room: taxableAmountRoom.toFixed(2),
//           vat_10_percent: vat10Percent.toFixed(2),
//           accommodation_tax: accommodationTax.toFixed(2)
//         };

//         // Only update if values changed (prevent infinite loop)
//         const needsUpdate = 
//           sectionData.room_amount_try !== currentValues.room_amount_try ||
//           sectionData.total_room_all_nights !== currentValues.total_room_all_nights ||
//           sectionData.taxable_amount_room !== currentValues.taxable_amount_room ||
//           sectionData.vat_10_percent !== currentValues.vat_10_percent ||
//           sectionData.accommodation_tax !== currentValues.accommodation_tax;

//         if (needsUpdate) {
//           setFormData(prev => ({
//             ...prev,
//             [sectionKey]: {
//               ...prev[sectionKey],
//               ...currentValues
//             }
//           }));
//         }
//       }
//     }
//   }, [
//     sectionKey,
//     sectionData.eur_amount,
//     sectionData.exchange_rate,
//     sectionData.total_nights,
//     section.multiple_entries
//   ]);

//   // Handle adding a new entry (for multiple entries sections like other_services)
//   const handleAddEntry = () => {
//     const newEntry = {};
//     section.fields?.forEach(field => {
//       newEntry[field.field_id] = field.fixed_value || field.default || "";
//     });
//     newEntry.id = Date.now() + Math.random();

//     setFormData(prev => ({
//       ...prev,
//       [sectionKey]: [...(prev[sectionKey] || []), newEntry]
//     }));
//   };

//   // Handle removing an entry
//   const handleRemoveEntry = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       [sectionKey]: prev[sectionKey].filter((_, i) => i !== index)
//     }));
//   };

//   // Handle field change within an entry
//   const handleEntryFieldChange = (index, fieldId, value) => {
//     setFormData(prev => {
//       const newEntries = [...prev[sectionKey]];
//       newEntries[index] = {
//         ...newEntries[index],
//         [fieldId]: value
//       };

//       // ✅ Auto-calculate for services (20% VAT)
//       if (fieldId === 'gross_amount') {
//         const grossAmount = parseFloat(value) || 0;
//         if (grossAmount > 0) {
//           const taxableAmount = grossAmount / 1.2;
//           const vat20Percent = taxableAmount * 0.2;
          
//           newEntries[index].taxable_amount = taxableAmount.toFixed(2);
//           newEntries[index].vat_20_percent = vat20Percent.toFixed(2);
//         }
//       }

//       return {
//         ...prev,
//         [sectionKey]: newEntries
//       };
//     });
//   };

//   // Render field based on its type and properties
//   const renderField = (field, value, onChange, isInArray = false, entryIndex = null) => {
//     const fieldPath = isInArray 
//       ? `${sectionKey}[${entryIndex}].${field.field_id}`
//       : `${sectionKey}.${field.field_id}`;

//     const isReadOnly = field.auto_calculated || field.read_only;
//     const isRequired = field.required && !isReadOnly;

//     // Format display value for read-only fields
//     const displayValue = isReadOnly && value 
//       ? parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
//       : value;

//     return (
//       <div key={field.field_id} className={isInArray ? "" : "form-control"}>
//         <label className={labelClass}>
//           {field.label} {isRequired && <span className="text-red-500">*</span>}
//           {field.auto_calculated && <span className="text-blue-600 ml-1">(Auto)</span>}
//         </label>

//         {field.data_type === 'date' ? (
//           <input
//             type="date"
//             value={value || ''}
//             onChange={(e) => onChange(e.target.value)}
//             className={inputClass}
//             required={isRequired}
//             disabled={isReadOnly}
//           />
//         ) : field.data_type === 'integer' ? (
//           <input
//             type="number"
//             value={value || ''}
//             onChange={(e) => onChange(e.target.value)}
//             className={isReadOnly ? readOnlyClass : inputClass}
//             min={field.min_value}
//             max={field.max_value}
//             required={isRequired}
//             readOnly={isReadOnly}
//             disabled={isReadOnly}
//           />
//         ) : field.data_type === 'decimal' ? (
//           <input
//             type="number"
//             step="0.01"
//             value={value || ''}
//             onChange={(e) => onChange(e.target.value)}
//             className={isReadOnly ? readOnlyClass : inputClass}
//             required={isRequired}
//             readOnly={isReadOnly}
//             disabled={isReadOnly}
//             placeholder={field.example?.toString() || ''}
//           />
//         ) : (
//           <input
//             type="text"
//             value={value || ''}
//             onChange={(e) => onChange(e.target.value)}
//             className={isReadOnly ? readOnlyClass : inputClass}
//             maxLength={field.max_length}
//             required={isRequired}
//             readOnly={isReadOnly}
//             disabled={isReadOnly}
//             placeholder={field.example || ''}
//           />
//         )}

//         {field.help_text && (
//           <span className="text-xs text-slate-500 mt-1 block">{field.help_text}</span>
//         )}
        
//         {field.example && !field.help_text && (
//           <span className="text-xs text-slate-400 mt-1 block">Example: {field.example}</span>
//         )}
//       </div>
//     );
//   };

//   // Render calculation formulas info box
//   const renderCalculationInfo = () => {
//     if (!section.calculation_rules) return null;

//     return (
//       <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
//         <h4 className="text-sm font-semibold text-blue-800 mb-2">Calculations:</h4>
//         <ul className="text-xs text-blue-700 space-y-1">
//           {Object.entries(section.calculation_rules).map(([key, formula]) => (
//             <li key={key}>
//               • {key} = {formula}
//             </li>
//           ))}
//         </ul>
//       </div>
//     );
//   };

//   // MULTIPLE ENTRIES SECTION (like other_services)
//   if (section.multiple_entries) {
//     return (
//       <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//         <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2">
//           <div>
//             <h3 className="font-bold text-base md:text-lg text-slate-800">
//               {section.title}
//             </h3>
//             {section.description && (
//               <p className="text-xs text-slate-500 mt-1">{section.description}</p>
//             )}
//           </div>
//           <button
//             type="button"
//             onClick={handleAddEntry}
//             className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#003d7a] text-white rounded-lg hover:bg-[#002a5c] text-xs sm:text-sm font-medium transition-colors"
//             disabled={sectionData.length >= (section.max_entries || 999)}
//           >
//             <Plus size={16} />
//             Add {section.title.split(' ')[0]}
//           </button>
//         </div>

//         {sectionData.length === 0 ? (
//           <div className="text-center py-8 text-slate-500 text-sm">
//             No entries yet. Click "Add" to create one.
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {sectionData.map((entry, index) => (
//               <div
//                 key={entry.id || index}
//                 className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
//               >
//                 <div className="flex justify-between items-center mb-3">
//                   <h4 className="font-semibold text-slate-700 text-sm">
//                     Entry #{index + 1}
//                   </h4>
//                   <button
//                     type="button"
//                     onClick={() => handleRemoveEntry(index)}
//                     className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
//                     title="Remove this entry"
//                   >
//                     <Trash2 size={16} />
//                   </button>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {section.fields?.map(field =>
//                     renderField(
//                       field,
//                       entry[field.field_id],
//                       (value) => handleEntryFieldChange(index, field.field_id, value),
//                       true,
//                       index
//                     )
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {renderCalculationInfo()}
//       </div>
//     );
//   }

//   // SINGLE OBJECT SECTION (like accommodation_details)
//   return (
//     <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//       <div className="mb-4 md:mb-6 border-b pb-2">
//         <h3 className="font-bold text-base md:text-lg text-slate-800">
//           {section.title}
//         </h3>
//         {section.description && (
//           <p className="text-xs text-slate-500 mt-1">{section.description}</p>
//         )}
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {section.fields?.map(field =>
//           renderField(
//             field,
//             sectionData[field.field_id],
//             (value) => {
//               onFieldChange(`${sectionKey}.${field.field_id}`, value);
//             }
//           )
//         )}
//       </div>

//       {renderCalculationInfo()}
//     </div>
//   );
// };

// export default DynamicConditionalSection;


// import { Plus, Trash2 } from "lucide-react";
// import { useEffect } from "react";

// const DynamicConditionalSection = ({ sectionKey, section, formData, onFieldChange, setFormData }) => {
//   const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
//   const readOnlyClass = "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600";

//   const sectionData = formData[sectionKey] || (section.multiple_entries ? [] : {});

//   // ✅ FIX: Auto-calculate Grand Aras accommodation fields when inputs change
//   useEffect(() => {
//     if (sectionKey === 'accommodation_details' && !section.multiple_entries) {
//       const eurAmount = parseFloat(sectionData.eur_amount) || 0;
//       const exchangeRate = parseFloat(sectionData.exchange_rate) || 0;
//       const totalNights = parseInt(sectionData.total_nights) || 0;

//       if (eurAmount > 0 && exchangeRate > 0) {
//         // a = EUR Amount × Exchange Rate
//         const roomAmountTry = eurAmount * exchangeRate;
        
//         // b = Total Nights × a
//         const totalRoomAllNights = roomAmountTry * totalNights;
        
//         // d = b ÷ 1.12
//         const taxableAmountRoom = totalRoomAllNights / 1.12;
        
//         // g = d × 0.10
//         const vat10Percent = taxableAmountRoom * 0.1;
        
//         // j = d × 0.02
//         const accommodationTax = taxableAmountRoom * 0.02;

//         // Update all calculated fields
//         const currentValues = {
//           room_amount_try: roomAmountTry.toFixed(2),
//           total_room_all_nights: totalRoomAllNights.toFixed(2),
//           taxable_amount_room: taxableAmountRoom.toFixed(2),
//           vat_10_percent: vat10Percent.toFixed(2),
//           accommodation_tax: accommodationTax.toFixed(2)
//         };

//         // Only update if values changed (prevent infinite loop)
//         const needsUpdate = 
//           sectionData.room_amount_try !== currentValues.room_amount_try ||
//           sectionData.total_room_all_nights !== currentValues.total_room_all_nights ||
//           sectionData.taxable_amount_room !== currentValues.taxable_amount_room ||
//           sectionData.vat_10_percent !== currentValues.vat_10_percent ||
//           sectionData.accommodation_tax !== currentValues.accommodation_tax;

//         if (needsUpdate) {
//           setFormData(prev => ({
//             ...prev,
//             [sectionKey]: {
//               ...prev[sectionKey],
//               ...currentValues
//             }
//           }));
//         }
//       }
//     }
//   }, [
//     sectionKey,
//     sectionData.eur_amount,
//     sectionData.exchange_rate,
//     sectionData.total_nights,
//     section.multiple_entries
//   ]);

//   // Handle adding a new entry (for multiple entries sections like other_services)
//   const handleAddEntry = () => {
//     const newEntry = {};
//     section.fields?.forEach(field => {
//       newEntry[field.field_id] = field.fixed_value || field.default || "";
//     });
//     newEntry.id = Date.now() + Math.random();

//     setFormData(prev => ({
//       ...prev,
//       [sectionKey]: [...(prev[sectionKey] || []), newEntry]
//     }));
//   };

//   // Handle removing an entry
//   const handleRemoveEntry = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       [sectionKey]: prev[sectionKey].filter((_, i) => i !== index)
//     }));
//   };

//   // Handle field change within an entry
//   const handleEntryFieldChange = (index, fieldId, value) => {
//     setFormData(prev => {
//       const newEntries = [...prev[sectionKey]];
//       newEntries[index] = {
//         ...newEntries[index],
//         [fieldId]: value
//       };

//       // ✅ Auto-calculate for services (20% VAT)
//       if (fieldId === 'gross_amount') {
//         const grossAmount = parseFloat(value) || 0;
//         if (grossAmount > 0) {
//           const taxableAmount = grossAmount / 1.2;
//           const vat20Percent = taxableAmount * 0.2;
          
//           newEntries[index].taxable_amount = taxableAmount.toFixed(2);
//           newEntries[index].vat_20_percent = vat20Percent.toFixed(2);
//         }
//       }

//       return {
//         ...prev,
//         [sectionKey]: newEntries
//       };
//     });
//   };

//   // Render field based on its type and properties
//   const renderField = (field, value, onChange, isInArray = false, entryIndex = null) => {
//     const fieldPath = isInArray 
//       ? `${sectionKey}[${entryIndex}].${field.field_id}`
//       : `${sectionKey}.${field.field_id}`;

//     const isReadOnly = field.auto_calculated || field.read_only;
//     const isRequired = field.required && !isReadOnly;

//     // Format display value for read-only fields
//     const displayValue = isReadOnly && value 
//       ? parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
//       : value;

//     return (
//       <div key={field.field_id} className={isInArray ? "" : "form-control"}>
//         <label className={labelClass}>
//           {field.label} {isRequired && <span className="text-red-500">*</span>}
//           {field.auto_calculated && <span className="text-blue-600 ml-1">(Auto)</span>}
//         </label>

//         {field.data_type === 'date' ? (
//           <input
//             type="date"
//             value={value || ''}
//             onChange={(e) => onChange(e.target.value)}
//             className={inputClass}
//             required={isRequired}
//             disabled={isReadOnly}
//           />
//         ) : field.data_type === 'integer' ? (
//           <input
//             type="number"
//             value={value || ''}
//             onChange={(e) => onChange(e.target.value)}
//             className={isReadOnly ? readOnlyClass : inputClass}
//             min={field.min_value}
//             max={field.max_value}
//             required={isRequired}
//             readOnly={isReadOnly}
//             disabled={isReadOnly}
//           />
//         ) : field.data_type === 'decimal' ? (
//           <input
//             type="number"
//             step="0.01"
//             value={value || ''}
//             onChange={(e) => onChange(e.target.value)}
//             className={isReadOnly ? readOnlyClass : inputClass}
//             required={isRequired}
//             readOnly={isReadOnly}
//             disabled={isReadOnly}
//             placeholder={field.example?.toString() || ''}
//           />
//         ) : (
//           <input
//             type="text"
//             value={value || ''}
//             onChange={(e) => onChange(e.target.value)}
//             className={isReadOnly ? readOnlyClass : inputClass}
//             maxLength={field.max_length}
//             required={isRequired}
//             readOnly={isReadOnly}
//             disabled={isReadOnly}
//             placeholder={field.example || ''}
//           />
//         )}

//         {field.help_text && (
//           <span className="text-xs text-slate-500 mt-1 block">{field.help_text}</span>
//         )}
        
//         {field.example && !field.help_text && (
//           <span className="text-xs text-slate-400 mt-1 block">Example: {field.example}</span>
//         )}
//       </div>
//     );
//   };

//   // Render calculation formulas info box
//   const renderCalculationInfo = () => {
//     if (!section.calculation_rules) return null;

//     return (
//       <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
//         <h4 className="text-sm font-semibold text-blue-800 mb-2">Calculations:</h4>
//         <ul className="text-xs text-blue-700 space-y-1">
//           {Object.entries(section.calculation_rules).map(([key, formula]) => (
//             <li key={key}>
//               • {key} = {formula}
//             </li>
//           ))}
//         </ul>
//       </div>
//     );
//   };

//   // MULTIPLE ENTRIES SECTION (like other_services)
//   if (section.multiple_entries) {
//     return (
//       <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//         <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2">
//           <div>
//             <h3 className="font-bold text-base md:text-lg text-slate-800">
//               {section.title}
//             </h3>
//             {section.description && (
//               <p className="text-xs text-slate-500 mt-1">{section.description}</p>
//             )}
//           </div>
//           <button
//             type="button"
//             onClick={handleAddEntry}
//             className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#003d7a] text-white rounded-lg hover:bg-[#002a5c] text-xs sm:text-sm font-medium transition-colors"
//             disabled={sectionData.length >= (section.max_entries || 999)}
//           >
//             <Plus size={16} />
//             Add {section.title.split(' ')[0]}
//           </button>
//         </div>

//         {sectionData.length === 0 ? (
//           <div className="text-center py-8 text-slate-500 text-sm">
//             No entries yet. Click "Add" to create one.
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {sectionData.map((entry, index) => (
//               <div
//                 key={entry.id || index}
//                 className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
//               >
//                 <div className="flex justify-between items-center mb-3">
//                   <h4 className="font-semibold text-slate-700 text-sm">
//                     Entry #{index + 1}
//                   </h4>
//                   <button
//                     type="button"
//                     onClick={() => handleRemoveEntry(index)}
//                     className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
//                     title="Remove this entry"
//                   >
//                     <Trash2 size={16} />
//                   </button>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {section.fields?.map(field =>
//                     renderField(
//                       field,
//                       entry[field.field_id],
//                       (value) => handleEntryFieldChange(index, field.field_id, value),
//                       true,
//                       index
//                     )
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {renderCalculationInfo()}
//       </div>
//     );
//   }

//   // SINGLE OBJECT SECTION (like accommodation_details)
//   return (
//     <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//       <div className="mb-4 md:mb-6 border-b pb-2">
//         <h3 className="font-bold text-base md:text-lg text-slate-800">
//           {section.title}
//         </h3>
//         {section.description && (
//           <p className="text-xs text-slate-500 mt-1">{section.description}</p>
//         )}
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {section.fields?.map(field =>
//           renderField(
//             field,
//             sectionData[field.field_id],
//             (value) => {
//               onFieldChange(`${sectionKey}.${field.field_id}`, value);
//             }
//           )
//         )}
//       </div>

//       {renderCalculationInfo()}
//     </div>
//   );
// };

// export default DynamicConditionalSection;



// DynamicConditionalSection.jsx
// import { Plus, Trash2 } from "lucide-react";
// import { useEffect } from "react";

// const DynamicConditionalSection = ({
//   sectionKey,
//   section,
//   formData,
//   onFieldChange,
//   setFormData,
// }) => {
//   const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const inputClass =
//     "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
//   const readOnlyClass =
//     "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium";

//   const sectionData = formData[sectionKey] || (section.multiple_entries ? [] : {});

//   // ────────────────────────────────────────────────
//   // Auto-calculate fields based on calculation_rules from JSON
//   // ────────────────────────────────────────────────
//   useEffect(() => {
//     // Skip if no rules or multiple entries section
//     if (section.multiple_entries || !section.calculation_rules) return;

//     // Force deep comparison by stringifying the current section data
//     const current = { ...sectionData };

//     const rules = section.calculation_rules;
//     const updates = {};

//     // Run every rule
//     Object.entries(rules).forEach(([targetField, formula]) => {
//       let value = 0;
//       try {
//         let expr = formula;

//         // Replace field names with current values
//         Object.keys(current).forEach((key) => {
//           const regex = new RegExp(`\\b${key}\\b`, "g");
//           const val = current[key] ?? 0;
//           expr = expr.replace(regex, val);
//         });

//         // Clean expression and evaluate
//         expr = expr.replace(/\s+/g, "");
//         value = eval(expr);

//         if (!isNaN(value) && value !== null) {
//           const decimals = targetField.includes("exchange_rate") ? 4 : 2;
//           updates[targetField] = Number(value.toFixed(decimals));
//         }
//       } catch (err) {
//         console.warn(`Calculation failed for ${targetField} in ${sectionKey}:`, formula, err);
//       }
//     });

//     // Only apply updates if something actually changed
//     const hasChanges = Object.entries(updates).some(
//       ([k, v]) => String(current[k]) !== String(v)
//     );

//     if (hasChanges) {
//       console.log(`[AUTO-CALC ${sectionKey}] Applying updates:`, updates);

//       setFormData((prev) => ({
//         ...prev,
//         [sectionKey]: {
//           ...prev[sectionKey],
//           ...updates,
//         },
//       }));
//     }
//   }, [JSON.stringify(sectionData), section.calculation_rules, section.multiple_entries, setFormData, sectionKey]);

//   // ────────────────────────────────────────────────
//   // Multiple entries handling (e.g. other_services)
//   // ────────────────────────────────────────────────
//   const handleAddEntry = () => {
//     const newEntry = {};
//     section.fields?.forEach((field) => {
//       newEntry[field.field_id] = field.fixed_value || field.default || "";
//     });
//     newEntry.id = Date.now() + Math.random();

//     setFormData((prev) => ({
//       ...prev,
//       [sectionKey]: [...(prev[sectionKey] || []), newEntry],
//     }));
//   };

//   const handleRemoveEntry = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       [sectionKey]: prev[sectionKey].filter((_, i) => i !== index),
//     }));
//   };

//   const handleEntryFieldChange = (index, fieldId, value) => {
//     setFormData((prev) => {
//       const newEntries = [...(prev[sectionKey] || [])];
//       if (!newEntries[index]) newEntries[index] = {};

//       newEntries[index] = {
//         ...newEntries[index],
//         [fieldId]: value,
//       };

//       // Auto VAT 20% calculation for services
//       if (fieldId === "gross_amount" && sectionKey === "other_services") {
//         const gross = parseFloat(value) || 0;
//         if (gross > 0) {
//           const taxable = gross / 1.2;
//           const vat = taxable * 0.2;
//           newEntries[index].taxable_amount = Number(taxable.toFixed(2));
//           newEntries[index].vat_20_percent = Number(vat.toFixed(2));
//         } else {
//           newEntries[index].taxable_amount = 0;
//           newEntries[index].vat_20_percent = 0;
//         }
//       }

//       return { ...prev, [sectionKey]: newEntries };
//     });
//   };

//   // ────────────────────────────────────────────────
//   // Render single field
//   // ────────────────────────────────────────────────
//   const renderField = (field, value, onChange, isArray = false, idx = null) => {
//     const isReadOnly = field.auto_calculated || field.read_only;
//     const isRequired = field.required && !isReadOnly;

//     let inputProps = {
//       value: value ?? "",
//       onChange: (e) => onChange(e.target.value),
//       className: isReadOnly ? readOnlyClass : inputClass,
//       required: isRequired,
//       disabled: isReadOnly,
//       readOnly: isReadOnly,
//     };

//     if (field.data_type === "date") {
//       inputProps.type = "date";
//     } else if (field.data_type === "integer" || field.data_type === "decimal") {
//       inputProps.type = "number";
//       inputProps.step = field.data_type === "decimal" ? "0.0001" : "1";
//       inputProps.min = field.min_value ?? 0;
//       if (field.field_id.includes("exchange_rate")) {
//         inputProps.step = "0.0001";
//         inputProps.placeholder = "e.g. 36.5264";
//       }
//     } else {
//       inputProps.type = "text";
//       if (field.max_length) inputProps.maxLength = field.max_length;
//     }

//     return (
//       <div key={field.field_id} className={isArray ? "" : "form-control"}>
//         <label className={labelClass}>
//           {field.label}
//           {isRequired && <span className="text-red-500"> *</span>}
//           {field.auto_calculated && <span className="text-blue-600 ml-1">(Auto)</span>}
//         </label>

//         <input {...inputProps} />

//         {field.help_text && (
//           <span className="text-xs text-slate-500 mt-1 block">{field.help_text}</span>
//         )}
//       </div>
//     );
//   };

//   // ────────────────────────────────────────────────
//   // MULTIPLE ENTRIES LAYOUT
//   // ────────────────────────────────────────────────
//   if (section.multiple_entries) {
//     return (
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//         <div className="flex justify-between items-center mb-6 border-b pb-3">
//           <div>
//             <h3 className="font-bold text-lg text-slate-800">{section.title}</h3>
//             {section.description && (
//               <p className="text-sm text-slate-500 mt-1">{section.description}</p>
//             )}
//           </div>
//           <button
//             onClick={handleAddEntry}
//             className="flex items-center gap-2 bg-[#003d7a] text-white px-4 py-2 rounded-lg hover:bg-[#002a5c] text-sm font-medium"
//           >
//             <Plus size={16} /> Add Entry
//           </button>
//         </div>

//         {sectionData.length === 0 ? (
//           <div className="text-center py-10 text-slate-500 border-2 border-dashed rounded-lg">
//             No entries yet
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {sectionData.map((entry, index) => (
//               <div
//                 key={entry.id || index}
//                 className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative"
//               >
//                 <button
//                   onClick={() => handleRemoveEntry(index)}
//                   className="absolute top-2 right-2 text-red-500 hover:text-red-700"
//                 >
//                   <Trash2 size={16} />
//                 </button>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   {section.fields?.map((field) =>
//                     renderField(
//                       field,
//                       entry[field.field_id],
//                       (val) => handleEntryFieldChange(index, field.field_id, val),
//                       true,
//                       index
//                     )
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   }

//   // ────────────────────────────────────────────────
//   // SINGLE OBJECT LAYOUT (accommodation_details, etc.)
//   // ────────────────────────────────────────────────
//   return (
//     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//       <h3 className="font-bold text-lg text-slate-800 mb-5 border-b pb-2">
//         {section.title}
//       </h3>
//       {section.description && (
//         <p className="text-sm text-slate-500 mb-5">{section.description}</p>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//         {section.fields?.map((field) =>
//           renderField(
//             field,
//             sectionData[field.field_id],
//             (val) => onFieldChange(`${sectionKey}.${field.field_id}`, val)
//           )
//         )}
//       </div>
//     </div>
//   );
// };

// export default DynamicConditionalSection;





// DynamicConditionalSection.jsx perfect
// import { Plus, Trash2 } from "lucide-react";
// import { useEffect } from "react";
// import { detectHotelType, calculateAccommodation, calculateServices } from "../../utils/invoiceCalculations";

// const DynamicConditionalSection = ({
//   sectionKey,
//   section,
//   formData,
//   onFieldChange,
//   setFormData,
//   hotelConfig,
// }) => {
//   const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const inputClass =
//     "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
//   const readOnlyClass =
//     "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium";

//   const sectionData = formData[sectionKey] || (section.multiple_entries ? [] : {});
//   const hotelType = detectHotelType(hotelConfig);

//   // ────────────────────────────────────────────────
//   // CENTRALIZED AUTO-CALCULATIONS
//   // ────────────────────────────────────────────────
//   useEffect(() => {
//     // Handle accommodation_details calculations
//     if (sectionKey === 'accommodation_details' && !section.multiple_entries) {
//       const acc = formData.accommodation_details || {};
//       const eurAmount = parseFloat(acc.eur_amount) || 0;
//       const exchangeRate = parseFloat(acc.exchange_rate) || 0;
//       const totalNights = parseInt(acc.total_nights) || 0;
      
//       // Only calculate if we have the base values
//       if (eurAmount > 0 && exchangeRate > 0) {
//         const calculated = calculateAccommodation(formData, hotelType);
        
//         // Build update object based on hotel type
//         const updates = {};
        
//         if (hotelType === 'GRAND_ARAS') {
//           updates.room_amount_try = calculated.roomAmountTry.toFixed(2);
//           updates.total_room_all_nights = calculated.totalRoomAllNights.toFixed(2);
//           updates.taxable_amount_room = calculated.taxableAmount.toFixed(2);
//           updates.vat_10_percent = calculated.vat10Percent.toFixed(2);
//           updates.accommodation_tax = calculated.accommodationTax.toFixed(2);
//         } else {
//           // CVK
//           updates.taxable_amount = calculated.taxableAmount.toFixed(2);
//           updates.vat_10_percent = calculated.vat10Percent.toFixed(2);
//           updates.accommodation_tax = calculated.accommodationTax.toFixed(2);
//           updates.total_per_night = calculated.totalPerNight.toFixed(2);
//           updates.vat_total_nights = calculated.vatTotalNights.toFixed(2);
//           updates.acc_tax_total_nights = calculated.accTaxTotalNights.toFixed(2);
//         }
        
//         // Check if updates are needed
//         const hasChanges = Object.entries(updates).some(
//           ([k, v]) => String(acc[k]) !== String(v)
//         );
        
//         if (hasChanges) {
//           console.log(`[AUTO-CALC ${sectionKey}] Applying updates:`, updates);
          
//           setFormData((prev) => ({
//             ...prev,
//             accommodation_details: {
//               ...prev.accommodation_details,
//               ...updates,
//             },
//           }));
//         }
//       }
//     }
    
//     // Handle other_services calculations
//     if (sectionKey === 'other_services' && section.multiple_entries) {
//       const services = formData.other_services || [];
      
//       if (services.length > 0) {
//         const calculated = calculateServices(services);
        
//         // Check if any service needs updating
//         const hasChanges = calculated.services.some((calc, idx) => {
//           const original = services[idx];
//           return String(original?.taxable_amount) !== String(calc.taxable_amount) ||
//                  String(original?.vat_20_percent) !== String(calc.vat_20_percent);
//         });
        
//         if (hasChanges) {
//           console.log(`[AUTO-CALC ${sectionKey}] Updating services`);
          
//           setFormData((prev) => ({
//             ...prev,
//             other_services: calculated.services,
//           }));
//         }
//       }
//     }
//   }, [
//     sectionKey,
//     formData.accommodation_details?.eur_amount,
//     formData.accommodation_details?.exchange_rate,
//     formData.accommodation_details?.total_nights,
//     formData.other_services?.map(s => s.gross_amount).join(','),
//     hotelType,
//     section.multiple_entries,
//     setFormData
//   ]);

//   // ────────────────────────────────────────────────
//   // Multiple entries handling (e.g. other_services)
//   // ────────────────────────────────────────────────
//   const handleAddEntry = () => {
//     const newEntry = {};
//     section.fields?.forEach((field) => {
//       newEntry[field.field_id] = field.fixed_value || field.default || "";
//     });
//     newEntry.id = Date.now() + Math.random();

//     setFormData((prev) => ({
//       ...prev,
//       [sectionKey]: [...(prev[sectionKey] || []), newEntry],
//     }));
//   };

//   const handleRemoveEntry = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       [sectionKey]: prev[sectionKey].filter((_, i) => i !== index),
//     }));
//   };

//   const handleEntryFieldChange = (index, fieldId, value) => {
//     setFormData((prev) => {
//       const newEntries = [...(prev[sectionKey] || [])];
//       if (!newEntries[index]) newEntries[index] = {};

//       newEntries[index] = {
//         ...newEntries[index],
//         [fieldId]: value,
//       };

//       return { ...prev, [sectionKey]: newEntries };
//     });
//   };

//   // ────────────────────────────────────────────────
//   // Render single field
//   // ────────────────────────────────────────────────
//   const renderField = (field, value, onChange, isArray = false, idx = null) => {
//     const isReadOnly = field.auto_calculated || field.read_only;
//     const isRequired = field.required && !isReadOnly;

//     let inputProps = {
//       value: value ?? "",
//       onChange: (e) => onChange(e.target.value),
//       className: isReadOnly ? readOnlyClass : inputClass,
//       required: isRequired,
//       disabled: isReadOnly,
//       readOnly: isReadOnly,
//     };

//     if (field.data_type === "date") {
//       inputProps.type = "date";
//     } else if (field.data_type === "integer" || field.data_type === "decimal") {
//       inputProps.type = "number";
//       inputProps.step = field.data_type === "decimal" ? "0.01" : "1";
//       inputProps.min = field.min_value ?? 0;
//       if (field.field_id.includes("exchange_rate")) {
//         inputProps.step = "0.0001";
//         inputProps.placeholder = "e.g. 36.5264";
//       }
//     } else {
//       inputProps.type = "text";
//       if (field.max_length) inputProps.maxLength = field.max_length;
//     }

//     return (
//       <div key={field.field_id} className={isArray ? "" : "form-control"}>
//         <label className={labelClass}>
//           {field.label}
//           {isRequired && <span className="text-red-500"> *</span>}
//           {field.auto_calculated && <span className="text-blue-600 ml-1">(Auto)</span>}
//         </label>

//         <input {...inputProps} />

//         {field.help_text && (
//           <span className="text-xs text-slate-500 mt-1 block">{field.help_text}</span>
//         )}
//       </div>
//     );
//   };

//   // ────────────────────────────────────────────────
//   // MULTIPLE ENTRIES LAYOUT
//   // ────────────────────────────────────────────────
//   if (section.multiple_entries) {
//     return (
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//         <div className="flex justify-between items-center mb-6 border-b pb-3">
//           <div>
//             <h3 className="font-bold text-lg text-slate-800">{section.title}</h3>
//             {section.description && (
//               <p className="text-sm text-slate-500 mt-1">{section.description}</p>
//             )}
//           </div>
//           <button
//             onClick={handleAddEntry}
//             className="flex items-center gap-2 bg-[#003d7a] text-white px-4 py-2 rounded-lg hover:bg-[#002a5c] text-sm font-medium"
//           >
//             <Plus size={16} /> Add Entry
//           </button>
//         </div>

//         {sectionData.length === 0 ? (
//           <div className="text-center py-10 text-slate-500 border-2 border-dashed rounded-lg">
//             No entries yet
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {sectionData.map((entry, index) => (
//               <div
//                 key={entry.id || index}
//                 className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative"
//               >
//                 <button
//                   onClick={() => handleRemoveEntry(index)}
//                   className="absolute top-2 right-2 text-red-500 hover:text-red-700"
//                 >
//                   <Trash2 size={16} />
//                 </button>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   {section.fields?.map((field) =>
//                     renderField(
//                       field,
//                       entry[field.field_id],
//                       (val) => handleEntryFieldChange(index, field.field_id, val),
//                       true,
//                       index
//                     )
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   }

//   // ────────────────────────────────────────────────
//   // SINGLE OBJECT LAYOUT (accommodation_details, etc.)
//   // ────────────────────────────────────────────────
//   return (
//     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//       <h3 className="font-bold text-lg text-slate-800 mb-5 border-b pb-2">
//         {section.title}
//       </h3>
//       {section.description && (
//         <p className="text-sm text-slate-500 mb-5">{section.description}</p>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//         {section.fields?.map((field) =>
//           renderField(
//             field,
//             sectionData[field.field_id],
//             (val) => onFieldChange(`${sectionKey}.${field.field_id}`, val)
//           )
//         )}
//       </div>
//     </div>
//   );
// };

// export default DynamicConditionalSection;



// // DynamicConditionalSection.jsx
// import { Plus, Trash2 } from "lucide-react";
// import { useEffect } from "react";
// import { detectHotelType, calculateAccommodation, calculateServices } from "../../utils/invoiceCalculations";

// const DynamicConditionalSection = ({
//   sectionKey,
//   section,
//   formData,
//   onFieldChange,
//   setFormData,
//   hotelConfig,
// }) => {
//   const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const inputClass =
//     "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
//   const readOnlyClass =
//     "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium";

//   const sectionData = formData[sectionKey] || (section.multiple_entries ? [] : {});
//   const hotelType = detectHotelType(hotelConfig);

//   // ────────────────────────────────────────────────
//   // CENTRALIZED AUTO-CALCULATIONS
//   // ────────────────────────────────────────────────
//   useEffect(() => {
//     // Handle accommodation_details calculations
//     if (sectionKey === 'accommodation_details' && !section.multiple_entries) {
//       const acc = formData.accommodation_details || {};
//       const eurAmount = parseFloat(acc.eur_amount) || 0;
//       const exchangeRate = parseFloat(acc.exchange_rate) || 0;
//       const totalNights = parseInt(acc.total_nights) || 0;
      
//       // Only calculate if we have the base values
//       if (eurAmount > 0 && exchangeRate > 0) {
//         const calculated = calculateAccommodation(formData, hotelType);
        
//         // Build update object based on hotel type
//         const updates = {};
        
//         if (hotelType === 'GRAND_ARAS' || hotelType === 'TRYP') {
//           // Grand Aras & TRYP use same structure
//           updates.room_amount_try = calculated.roomAmountTry.toFixed(2);
//           updates.total_room_all_nights = calculated.totalRoomAllNights.toFixed(2);
//           updates.taxable_amount_room = calculated.taxableAmount.toFixed(2);
//           updates.vat_10_percent = calculated.vat10Percent.toFixed(2);
//           updates.accommodation_tax = calculated.accommodationTax.toFixed(2);
//         } else {
//           // CVK
//           updates.taxable_amount = calculated.taxableAmount.toFixed(2);
//           updates.vat_10_percent = calculated.vat10Percent.toFixed(2);
//           updates.accommodation_tax = calculated.accommodationTax.toFixed(2);
//           updates.total_per_night = calculated.totalPerNight.toFixed(2);
//           updates.vat_total_nights = calculated.vatTotalNights.toFixed(2);
//           updates.acc_tax_total_nights = calculated.accTaxTotalNights.toFixed(2);
//         }
        
//         // Check if updates are needed
//         const hasChanges = Object.entries(updates).some(
//           ([k, v]) => String(acc[k]) !== String(v)
//         );
        
//         if (hasChanges) {
//           console.log(`[AUTO-CALC ${sectionKey}] Applying updates:`, updates);
          
//           setFormData((prev) => ({
//             ...prev,
//             accommodation_details: {
//               ...prev.accommodation_details,
//               ...updates,
//             },
//           }));
//         }
//       }
//     }
    
//     // Handle other_services calculations
//     if (sectionKey === 'other_services' && section.multiple_entries) {
//       const services = formData.other_services || [];
      
//       if (services.length > 0) {
//         const calculated = calculateServices(services);
        
//         // Check if any service needs updating
//         const hasChanges = calculated.services.some((calc, idx) => {
//           const original = services[idx];
//           return String(original?.taxable_amount) !== String(calc.taxable_amount) ||
//                  String(original?.vat_20_percent) !== String(calc.vat_20_percent);
//         });
        
//         if (hasChanges) {
//           console.log(`[AUTO-CALC ${sectionKey}] Updating services`);
          
//           setFormData((prev) => ({
//             ...prev,
//             other_services: calculated.services,
//           }));
//         }
//       }
//     }
//   }, [
//     sectionKey,
//     formData.accommodation_details?.eur_amount,
//     formData.accommodation_details?.exchange_rate,
//     formData.accommodation_details?.total_nights,
//     formData.other_services?.map(s => s.gross_amount).join(','),
//     hotelType,
//     section.multiple_entries,
//     setFormData
//   ]);

//   // ────────────────────────────────────────────────
//   // Multiple entries handling (e.g. other_services)
//   // ────────────────────────────────────────────────
//   const handleAddEntry = () => {
//     const newEntry = {};
//     section.fields?.forEach((field) => {
//       newEntry[field.field_id] = field.fixed_value || field.default || "";
//     });
//     newEntry.id = Date.now() + Math.random();

//     setFormData((prev) => ({
//       ...prev,
//       [sectionKey]: [...(prev[sectionKey] || []), newEntry],
//     }));
//   };

//   const handleRemoveEntry = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       [sectionKey]: prev[sectionKey].filter((_, i) => i !== index),
//     }));
//   };

//   const handleEntryFieldChange = (index, fieldId, value) => {
//     setFormData((prev) => {
//       const newEntries = [...(prev[sectionKey] || [])];
//       if (!newEntries[index]) newEntries[index] = {};

//       newEntries[index] = {
//         ...newEntries[index],
//         [fieldId]: value,
//       };

//       return { ...prev, [sectionKey]: newEntries };
//     });
//   };

//   // ────────────────────────────────────────────────
//   // Render single field
//   // ────────────────────────────────────────────────
//   const renderField = (field, value, onChange, isArray = false, idx = null) => {
//     const isReadOnly = field.auto_calculated || field.read_only;
//     const isRequired = field.required && !isReadOnly;

//     let inputProps = {
//       value: value ?? "",
//       onChange: (e) => onChange(e.target.value),
//       className: isReadOnly ? readOnlyClass : inputClass,
//       required: isRequired,
//       disabled: isReadOnly,
//       readOnly: isReadOnly,
//     };

//     if (field.data_type === "date") {
//       inputProps.type = "date";
//     } else if (field.data_type === "integer" || field.data_type === "decimal") {
//       inputProps.type = "number";
//       inputProps.step = field.data_type === "decimal" ? "0.01" : "1";
//       inputProps.min = field.min_value ?? 0;
//       if (field.field_id.includes("exchange_rate")) {
//         inputProps.step = "0.0001";
//         inputProps.placeholder = "e.g. 36.5264";
//       }
//     } else {
//       inputProps.type = "text";
//       if (field.max_length) inputProps.maxLength = field.max_length;
//     }

//     return (
//       <div key={field.field_id} className={isArray ? "" : "form-control"}>
//         <label className={labelClass}>
//           {field.label}
//           {isRequired && <span className="text-red-500"> *</span>}
//           {field.auto_calculated && <span className="text-blue-600 ml-1">(Auto)</span>}
//         </label>

//         <input {...inputProps} />

//         {field.help_text && (
//           <span className="text-xs text-slate-500 mt-1 block">{field.help_text}</span>
//         )}
//       </div>
//     );
//   };

//   // ────────────────────────────────────────────────
//   // MULTIPLE ENTRIES LAYOUT
//   // ────────────────────────────────────────────────
//   if (section.multiple_entries) {
//     return (
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//         <div className="flex justify-between items-center mb-6 border-b pb-3">
//           <div>
//             <h3 className="font-bold text-lg text-slate-800">{section.title}</h3>
//             {section.description && (
//               <p className="text-sm text-slate-500 mt-1">{section.description}</p>
//             )}
//           </div>
//           <button
//             onClick={handleAddEntry}
//             className="flex items-center gap-2 bg-[#003d7a] text-white px-4 py-2 rounded-lg hover:bg-[#002a5c] text-sm font-medium"
//           >
//             <Plus size={16} /> Add Entry
//           </button>
//         </div>

//         {sectionData.length === 0 ? (
//           <div className="text-center py-10 text-slate-500 border-2 border-dashed rounded-lg">
//             No entries yet
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {sectionData.map((entry, index) => (
//               <div
//                 key={entry.id || index}
//                 className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative"
//               >
//                 <button
//                   onClick={() => handleRemoveEntry(index)}
//                   className="absolute top-2 right-2 text-red-500 hover:text-red-700"
//                 >
//                   <Trash2 size={16} />
//                 </button>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   {section.fields?.map((field) =>
//                     renderField(
//                       field,
//                       entry[field.field_id],
//                       (val) => handleEntryFieldChange(index, field.field_id, val),
//                       true,
//                       index
//                     )
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   }

//   // ────────────────────────────────────────────────
//   // SINGLE OBJECT LAYOUT (accommodation_details, etc.)
//   // ────────────────────────────────────────────────
//   return (
//     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
//       <h3 className="font-bold text-lg text-slate-800 mb-5 border-b pb-2">
//         {section.title}
//       </h3>
//       {section.description && (
//         <p className="text-sm text-slate-500 mb-5">{section.description}</p>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//         {section.fields?.map((field) =>
//           renderField(
//             field,
//             sectionData[field.field_id],
//             (val) => onFieldChange(`${sectionKey}.${field.field_id}`, val)
//           )
//         )}
//       </div>
//     </div>
//   );
// };

// export default DynamicConditionalSection;


import { Plus, Trash2, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
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
  const inputClass =
    "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white";
  const readOnlyClass =
    "w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 font-medium";

  const sectionData = formData[sectionKey] || (section.multiple_entries ? [] : {});
  const hotelType = detectHotelType(hotelConfig);

  // Get arrival and departure dates for date constraints
  const arrivalDate = formData.arrival_date || formData.arrivalDate;
  const departureDate = formData.departure_date || formData.departureDate;

  // State to track date validation errors per field
  const [dateErrors, setDateErrors] = useState({});

  // Calculate min and max dates for constraints
  const getMinDate = () => {
    if (!arrivalDate) return "";
    const date = new Date(arrivalDate);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    if (!departureDate) return "";
    const date = new Date(departureDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  // Validate date is within range
  const validateDate = (dateValue, fieldKey) => {
    if (!dateValue || !arrivalDate || !departureDate) {
      setDateErrors(prev => ({ ...prev, [fieldKey]: null }));
      return true;
    }

    const selectedDate = new Date(dateValue);
    const minDate = new Date(getMinDate());
    const maxDate = new Date(getMaxDate());

    if (selectedDate < minDate || selectedDate > maxDate) {
      setDateErrors(prev => ({
        ...prev,
        [fieldKey]: `Date must be between ${formatDisplayDate(minDate)} and ${formatDisplayDate(maxDate)}`
      }));
      return false;
    }

    setDateErrors(prev => ({ ...prev, [fieldKey]: null }));
    return true;
  };

  // AUTO-CALCULATIONS
  useEffect(() => {
    if (sectionKey === 'accommodation_details' && !section.multiple_entries) {
      const acc = formData.accommodation_details || {};
      const eurAmount = parseFloat(acc.eur_amount) || 0;
      const exchangeRate = parseFloat(acc.exchange_rate) || 0;
      const totalNights = parseInt(acc.total_nights) || 0;
      
      if (eurAmount > 0 && exchangeRate > 0) {
        const calculated = calculateAccommodation(formData, hotelType);
        
        const updates = {};
        
        if (hotelType === 'GRAND_ARAS' || hotelType === 'TRYP') {
          updates.room_amount_try = calculated.roomAmountTry.toFixed(2);
          updates.total_room_all_nights = calculated.totalRoomAllNights.toFixed(2);
          updates.taxable_amount_room = calculated.taxableAmount.toFixed(2);
          updates.vat_10_percent = calculated.vat10Percent.toFixed(2);
          updates.accommodation_tax = calculated.accommodationTax.toFixed(2);
        } else {
          updates.taxable_amount = calculated.taxableAmount.toFixed(2);
          updates.vat_10_percent = calculated.vat10Percent.toFixed(2);
          updates.accommodation_tax = calculated.accommodationTax.toFixed(2);
          updates.total_per_night = calculated.totalPerNight.toFixed(2);
          updates.vat_total_nights = calculated.vatTotalNights.toFixed(2);
          updates.acc_tax_total_nights = calculated.accTaxTotalNights.toFixed(2);
        }
        
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
          setFormData((prev) => ({
            ...prev,
            other_services: calculated.services,
          }));
        }
      }
    }
  }, [
    sectionKey,
    formData.accommodation_details?.eur_amount,
    formData.accommodation_details?.exchange_rate,
    formData.accommodation_details?.total_nights,
    formData.other_services?.map(s => s.gross_amount).join(','),
    hotelType,
    section.multiple_entries,
    setFormData
  ]);

  const handleAddEntry = () => {
    const newEntry = {};
    section.fields?.forEach((field) => {
      // Set default date as arrival date if available
      if (field.data_type === "date" && arrivalDate) {
        newEntry[field.field_id] = arrivalDate;
      } else {
        newEntry[field.field_id] = field.fixed_value || field.default || "";
      }
    });
    newEntry.id = Date.now() + Math.random();

    setFormData((prev) => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] || []), newEntry],
    }));
  };

  const handleRemoveEntry = (index) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_, i) => i !== index),
    }));
  };

  const handleEntryFieldChange = (index, fieldId, value) => {
    // Validate date if it's a date field
    if (sectionKey === "other_services" && fieldId === "service_date") {
      const fieldKey = `service_${index}_${fieldId}`;
      validateDate(value, fieldKey);
    }

    setFormData((prev) => {
      const newEntries = [...(prev[sectionKey] || [])];
      if (!newEntries[index]) newEntries[index] = {};

      newEntries[index] = {
        ...newEntries[index],
        [fieldId]: value,
      };

      return { ...prev, [sectionKey]: newEntries };
    });
  };

  // Helper function to format date for display
  const formatDisplayDate = (date) => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Render field with improved date picker
  const renderField = (field, value, onChange, isArray = false, idx = null) => {
    const isReadOnly = field.auto_calculated || field.read_only;
    const isRequired = field.required && !isReadOnly;
    const fieldKey = isArray ? `service_${idx}_${field.field_id}` : field.field_id;
    const dateErrorMessage = dateErrors[fieldKey];

    // For date fields in other services section
    if (field.data_type === "date" && sectionKey === "other_services" && isArray) {
      return (
        <div key={field.field_id} className="form-control">
          <label className={labelClass}>
            {field.label}
            {isRequired && <span className="text-red-500"> *</span>}
          </label>
          
          <DatePicker
            name={`${field.field_id}-${idx}`}
            value={value || ""}
            onChange={(dateValue) => {
              onChange(dateValue);
              validateDate(dateValue, fieldKey);
            }}
            minDate={getMinDate()}
            maxDate={getMaxDate()}
            placeholder="Select date between arrival and departure"
            required={isRequired}
            disabled={isReadOnly}
          />
          
          {dateErrorMessage && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              ⚠️ {dateErrorMessage}
            </p>
          )}
          
          {!dateErrorMessage && arrivalDate && departureDate && (
            <p className="text-xs text-slate-500 mt-1">
              Valid range: {formatDisplayDate(arrivalDate)} to {formatDisplayDate(departureDate)}
            </p>
          )}
          
          {field.help_text && (
            <span className="text-xs text-slate-500 mt-1 block">{field.help_text}</span>
          )}
        </div>
      );
    }

    // For regular input fields
    let inputProps = {
      value: value ?? "",
      onChange: (e) => {
        onChange(e.target.value);
        if (field.data_type === "date") {
          validateDate(e.target.value, fieldKey);
        }
      },
      className: isReadOnly ? readOnlyClass : inputClass,
      required: isRequired,
      disabled: isReadOnly,
      readOnly: isReadOnly,
    };

    if (field.data_type === "date") {
      inputProps.type = "date";
      // Add date constraints
      if (arrivalDate && departureDate) {
        inputProps.min = getMinDate();
        inputProps.max = getMaxDate();
      }
    } else if (field.data_type === "integer" || field.data_type === "decimal") {
      inputProps.type = "number";
      inputProps.step = field.data_type === "decimal" ? "0.01" : "1";
      inputProps.min = field.min_value ?? 0;
      if (field.field_id.includes("exchange_rate")) {
        inputProps.step = "0.0001";
        inputProps.placeholder = "e.g. 36.5264";
      }
    } else {
      inputProps.type = "text";
      if (field.max_length) inputProps.maxLength = field.max_length;
    }

    return (
      <div key={field.field_id} className={isArray ? "" : "form-control"}>
        <label className={labelClass}>
          {field.label}
          {isRequired && <span className="text-red-500"> *</span>}
          {field.auto_calculated && <span className="text-blue-600 ml-1">(Auto)</span>}
        </label>

        <input {...inputProps} />

        {dateErrorMessage && field.data_type === "date" && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            ⚠️ {dateErrorMessage}
          </p>
        )}

        {!dateErrorMessage && field.data_type === "date" && arrivalDate && departureDate && !isReadOnly && (
          <p className="text-xs text-slate-500 mt-1">
            Valid range: {formatDisplayDate(arrivalDate)} to {formatDisplayDate(departureDate)}
          </p>
        )}

        {field.help_text && (
          <span className="text-xs text-slate-500 mt-1 block">{field.help_text}</span>
        )}
      </div>
    );
  };

  // MULTIPLE ENTRIES LAYOUT
  if (section.multiple_entries) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{section.title}</h3>
            {section.description && (
              <p className="text-sm text-slate-500 mt-1">{section.description}</p>
            )}
            
            {/* Date constraint warning */}
            {sectionKey === "other_services" && arrivalDate && departureDate && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <Calendar className="inline mr-1" size={12} />
                Service dates must be between {formatDisplayDate(arrivalDate)} and {formatDisplayDate(departureDate)}
              </div>
            )}
          </div>
          <button
            onClick={handleAddEntry}
            className="flex items-center gap-2 bg-[#003d7a] text-white px-4 py-2 rounded-lg hover:bg-[#002a5c] text-sm font-medium"
          >
            <Plus size={16} /> Add Entry
          </button>
        </div>

        {sectionData.length === 0 ? (
          <div className="text-center py-10 text-slate-500 border-2 border-dashed rounded-lg">
            No entries yet
          </div>
        ) : (
          <div className="space-y-4">
            {sectionData.map((entry, index) => (
              <div
                key={entry.id || index}
                className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative"
              >
                <button
                  onClick={() => handleRemoveEntry(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {section.fields?.map((field) =>
                    renderField(
                      field,
                      entry[field.field_id],
                      (val) => handleEntryFieldChange(index, field.field_id, val),
                      true,
                      index
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // SINGLE OBJECT LAYOUT
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-lg text-slate-800 mb-5 border-b pb-2">
        {section.title}
      </h3>
      {section.description && (
        <p className="text-sm text-slate-500 mb-5">{section.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {section.fields?.map((field) =>
          renderField(
            field,
            sectionData[field.field_id],
            (val) => onFieldChange(`${sectionKey}.${field.field_id}`, val)
          )
        )}
      </div>
    </div>
  );
};

export default DynamicConditionalSection;