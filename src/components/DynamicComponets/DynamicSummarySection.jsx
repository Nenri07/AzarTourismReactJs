// import { useEffect, useState } from "react";

// const DynamicSummarySection = ({ config, formData, onStatusChange, onNoteChange }) => {
//   const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const selectClass = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white h-[42px]";

//   const [calculatedValues, setCalculatedValues] = useState({});

//   // ✅ FIX: Get status and note from formData props, not local state
//   const currentStatus = formData.status || "pending";
//   const currentNote = formData.note || "";

//   console.log("📊 DynamicSummarySection - Current status:", currentStatus);
//   console.log("📊 DynamicSummarySection - Current note:", currentNote);

//   // ✅ Recalculate whenever formData changes
//   useEffect(() => {
//     console.log("🧮 Calculating summary with formData:", formData);
    
//     const calculated = {};
    
//     if (!config.final_calculations) {
//       console.log("⚠️ No final_calculations in config");
//       return;
//     }

//     // Calculate in order (so dependencies are available)
//     const calculationOrder = Object.entries(config.final_calculations);
    
//     calculationOrder.forEach(([key, formula]) => {
//       try {
//         console.log(`  📊 Calculating ${key}: ${formula}`);
//         const result = evaluateFormula(formula, formData, calculated);
//         calculated[key] = result;
//         console.log(`    ✅ ${key} = ${result}`);
//       } catch (error) {
//         console.error(`    ❌ Error calculating ${key}:`, error);
//         calculated[key] = 0;
//       }
//     });

//     setCalculatedValues(calculated);
//   }, [formData, config]);

//   // ✅ FIXED: Better formula evaluator with proper field name handling
//   const evaluateFormula = (formula, data, previousCalculations = {}) => {
//     let expression = formula;
    
//     console.log(`    → Original formula: ${formula}`);

//     // STEP 1: Handle SUM(array.field) pattern - do this FIRST before field replacement
//     const sumPattern = /SUM\(([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\)/g;
//     expression = expression.replace(sumPattern, (match, path) => {
//       const [arrayName, fieldName] = path.split('.');
//       const array = data[arrayName];
      
//       if (!Array.isArray(array) || array.length === 0) {
//         console.log(`      SUM: ${arrayName} is not an array or is empty`);
//         return '0';
//       }
      
//       const sum = array.reduce((total, item) => {
//         const val = parseFloat(item[fieldName]) || 0;
//         return total + val;
//       }, 0);
      
//       console.log(`      SUM(${path}) = ${sum} (from ${array.length} items)`);
//       return sum.toString();
//     });

//     // STEP 2: Replace nested field references like "accommodation_details.total_per_night"
//     const nestedFieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\b/g;
//     const nestedMatches = [...expression.matchAll(nestedFieldPattern)];
    
//     nestedMatches.forEach(match => {
//       const fullPath = match[1];
//       const [objName, fieldName] = fullPath.split('.');
      
//       let value = 0;
//       if (data[objName] && data[objName][fieldName] !== undefined) {
//         value = parseFloat(data[objName][fieldName]) || 0;
//         console.log(`      ${fullPath} = ${value}`);
//       } else {
//         console.log(`      ${fullPath} NOT FOUND in data`);
//       }
      
//       expression = expression.replace(new RegExp(`\\b${fullPath.replace('.', '\\.')}\\b`, 'g'), value.toString());
//     });

//     // STEP 3: Replace simple field references (calculated values from previous steps)
//     const simpleFieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
//     expression = expression.replace(simpleFieldPattern, (match) => {
//       if (previousCalculations[match] !== undefined) {
//         const value = previousCalculations[match];
//         console.log(`      ${match} (from calculations) = ${value}`);
//         return value.toString();
//       }
      
//       if (data[match] !== undefined) {
//         const value = parseFloat(data[match]) || 0;
//         console.log(`      ${match} = ${value}`);
//         return value.toString();
//       }
      
//       if (['payments'].includes(match)) {
//         return '0';
//       }
      
//       return match;
//     });

//     console.log(`    → After substitution: ${expression}`);

//     // STEP 4: Evaluate the expression safely
//     try {
//       const cleanExpr = expression.replace(/[a-zA-Z_]+/g, '0');
//       const result = Function(`"use strict"; return (${cleanExpr})`)();
//       return isNaN(result) ? 0 : parseFloat(result.toFixed(2));
//     } catch (e) {
//       console.error(`      Evaluation error: ${e.message}`);
//       console.error(`      Expression was: ${expression}`);
//       return 0;
//     }
//   };

//   // Find grand total key
//   const grandTotalKeys = ['total_in_eur', 'total_including_vat_kdv_dahil', 'grand_total'];
//   const grandTotalKey = Object.keys(calculatedValues).find(key => 
//     grandTotalKeys.some(gtKey => key.includes(gtKey))
//   ) || Object.keys(calculatedValues)[Object.keys(calculatedValues).length - 1];

//   return (
//     <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//       <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
//         Invoice Summary
//       </h3>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         {/* Left: Status and Note */}
//         <div className="space-y-4">
//           <div className="form-control">
//             <label className={labelClass}>
//               Status <span className="text-red-500">*</span>
//             </label>
//             <select
//               name="status"
//               value={currentStatus}
//               onChange={(e) => {
//                 const newStatus = e.target.value;
//                 console.log("🎯 Status dropdown changed to:", newStatus);
                
//                 // ✅ FIX: Call the callback to update parent
//                 if (onStatusChange) {
//                   onStatusChange(newStatus);
//                 } else {
//                   console.error("❌ onStatusChange callback not provided!");
//                 }
//               }}
//               className={selectClass}
//               required
//             >
//               <option value="" disabled>Select the status</option>
//               <option value="ready">✅ Ready</option>
//               <option value="pending">⏳ Pending</option>
//             </select>
            
//             {/* Current Status Indicator */}
//             <div className="mt-2 flex items-center gap-2">
//               <span className="text-xs text-slate-500">Current:</span>
//               <span className={`px-2 py-1 rounded-full text-xs font-bold ${
//                 currentStatus === "ready" 
//                   ? "bg-green-100 text-green-700 border border-green-200"
//                   : "bg-amber-100 text-amber-700 border border-amber-200"
//               }`}>
//                 {currentStatus === "ready" ? "✅ Ready" : "⏳ Pending"}
//               </span>
//             </div>
//           </div>

//           <div className="form-control">
//             <label className={labelClass}>Note</label>
//             <textarea
//               name="note"
//               value={currentNote}
//               onChange={(e) => {
//                 const newNote = e.target.value;
//                 console.log("📝 Note changed");
                
//                 // ✅ FIX: Call the callback to update parent
//                 if (onNoteChange) {
//                   onNoteChange(newNote);
//                 } else {
//                   console.error("❌ onNoteChange callback not provided!");
//                 }
//               }}
//               className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] min-h-[80px] bg-white resize-none"
//               placeholder="Enter Note"
//             />
//           </div>

//           {/* Debug Info */}
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
//             <p className="font-semibold text-blue-800 mb-1">Debug Info:</p>
//             <div className="text-blue-600 space-y-1">
//               <div>Status: <span className="font-bold">{currentStatus}</span></div>
//               <div>Accommodation: {formData.accommodation_details ? '✓' : '✗'}</div>
//               {formData.accommodation_details && (
//                 <div className="ml-2 text-[10px]">
//                   <div>• Total/Night: {formData.accommodation_details.total_per_night || '0'}</div>
//                   <div>• VAT Total: {formData.accommodation_details.vat_total_nights || '0'}</div>
//                   <div>• Acc Tax Total: {formData.accommodation_details.acc_tax_total_nights || '0'}</div>
//                 </div>
//               )}
//               <div>Other Services: {formData.other_services?.length || 0} items</div>
//               <div>Calculations: {Object.keys(calculatedValues).length} values</div>
//             </div>
//           </div>
//         </div>

//         {/* Right: Calculations Summary */}
//         <div className="bg-slate-50 p-5 rounded-lg space-y-3">
//           {Object.keys(calculatedValues).length === 0 ? (
//             <p className="text-sm text-slate-500 text-center py-4">
//               Fill in accommodation details to see calculations
//             </p>
//           ) : (
//             Object.entries(calculatedValues).map(([key, value]) => {
//               const isGrandTotal = key === grandTotalKey;
//               const displayName = key
//                 .split('_')
//                 .map(w => w.charAt(0).toUpperCase() + w.slice(1))
//                 .join(' ');
              
//               if (isGrandTotal) {
//                 return (
//                   <div key={key} className="flex justify-between text-lg font-bold text-[#003d7a] pt-2 border-t-2 border-slate-300">
//                     <span>{displayName}:</span>
//                     <span>
//                       {value.toFixed(2)} {config.currency}
//                     </span>
//                   </div>
//                 );
//               }

//               return (
//                 <div key={key} className="flex justify-between text-sm">
//                   <span className="text-slate-600">{displayName}</span>
//                   <span className="font-medium">
//                     {value.toFixed(2)} {config.currency}
//                   </span>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DynamicSummarySection;




// import { useEffect, useState } from "react";
// import Decimal from 'decimal.js';

// Decimal.set({
//   precision: 20,
//   rounding: Decimal.ROUND_HALF_UP,
// });

// const DynamicSummarySection = ({ config, formData, onStatusChange, onNoteChange }) => {
//   const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const selectClass = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white h-[42px]";

//   const [calculatedValues, setCalculatedValues] = useState({});

//   const D = (v) => new Decimal(v || 0);
//   const F = (d, decimals = 2) => d.toDecimalPlaces(decimals).toNumber();

//   const currentStatus = formData.status || "pending";
//   const currentNote = formData.note || "";

//   console.log("📊 DynamicSummarySection - Current status:", currentStatus);
//   console.log("📊 DynamicSummarySection - Current note:", currentNote);
//   console.log("📊 DynamicSummarySection - FormData:", formData);

//   // ✅ Recalculate whenever formData changes
//   useEffect(() => {
//     console.log("🧮 Calculating summary with formData:", formData);
    
//     const calculated = {};
    
//     if (!config.final_calculations) {
//       console.log("⚠️ No final_calculations in config");
//       return;
//     }

//     // Build comprehensive context
//     const context = { ...formData };

//     // Calculate in order (so dependencies are available)
//     const calculationOrder = Object.entries(config.final_calculations);
    
//     calculationOrder.forEach(([key, calcConfig]) => {
//       try {
//         // Handle both string formulas and config objects
//         const formula = typeof calcConfig === 'string' ? calcConfig : calcConfig.calculation;
        
//         console.log(`  📊 Calculating ${key}: ${formula}`);
//         const result = evaluateFormula(formula, context, calculated);
//         calculated[key] = result;
//         context[key] = result; // Add to context for next calculations
//         console.log(`    ✅ ${key} = ${result}`);
//       } catch (error) {
//         console.error(`    ❌ Error calculating ${key}:`, error);
//         calculated[key] = 0;
//       }
//     });

//     setCalculatedValues(calculated);
//   }, [formData, config]);

//   // ✅ IMPROVED: Better formula evaluator with Decimal.js precision
//   const evaluateFormula = (formula, data, previousCalculations = {}) => {
//     let expression = formula;
    
//     console.log(`    → Original formula: ${formula}`);

//     try {
//       // STEP 1: Handle SUM(array.field) pattern
//       const sumPattern = /SUM\(([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\)/g;
//       expression = expression.replace(sumPattern, (match, path) => {
//         const [arrayName, fieldName] = path.split('.');
//         const array = data[arrayName];
        
//         if (!Array.isArray(array) || array.length === 0) {
//           console.log(`      SUM: ${arrayName} is not an array or is empty`);
//           return '0';
//         }
        
//         const sum = F(array.reduce((total, item) => 
//           total.plus(D(item[fieldName] || 0)), D(0)
//         ));
        
//         console.log(`      SUM(${path}) = ${sum} (from ${array.length} items)`);
//         return sum.toString();
//       });

//       // STEP 2: Replace nested object references like "accommodation_details.taxable_amount_room"
//       const nestedFieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\b/g;
//       const nestedMatches = [...expression.matchAll(nestedFieldPattern)];
      
//       nestedMatches.forEach(match => {
//         const fullPath = match[1];
//         const [objName, fieldName] = fullPath.split('.');
        
//         let value = 0;
//         if (data[objName] && data[objName][fieldName] !== undefined) {
//           value = parseFloat(data[objName][fieldName]) || 0;
//           console.log(`      ${fullPath} = ${value}`);
//         } else {
//           console.log(`      ${fullPath} NOT FOUND in data`);
//         }
        
//         expression = expression.replace(new RegExp(`\\b${fullPath.replace('.', '\\.')}\\b`, 'g'), value.toString());
//       });

//       // STEP 3: Replace simple field references
//       const simpleFieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
//       expression = expression.replace(simpleFieldPattern, (match) => {
//         // Check previously calculated values first
//         if (previousCalculations[match] !== undefined) {
//           const value = previousCalculations[match];
//           console.log(`      ${match} (from calculations) = ${value}`);
//           return value.toString();
//         }
        
//         // Check form data
//         if (data[match] !== undefined) {
//           const value = parseFloat(data[match]) || 0;
//           console.log(`      ${match} (from data) = ${value}`);
//           return value.toString();
//         }
        
//         // Known safe keywords
//         if (['SUM', 'payments'].includes(match)) {
//           return '0';
//         }
        
//         return match;
//       });

//       console.log(`    → After substitution: ${expression}`);

//       // STEP 4: Evaluate using Decimal.js for precision
//       const cleanExpr = expression.replace(/[a-zA-Z_]+/g, '0');
      
//       // Use Decimal.js for calculation
//       const tokens = cleanExpr.match(/(\d+\.?\d*|\+|\-|\*|\/|\(|\))/g);
//       if (!tokens) return 0;
      
//       // Simple expression evaluator with Decimal.js
//       const result = Function(`
//         const D = (v) => new (require('decimal.js'))(v || 0);
//         return ${cleanExpr};
//       `)();
      
//       return isNaN(result) ? 0 : parseFloat(result.toFixed(2));
//     } catch (e) {
//       console.error(`      Evaluation error: ${e.message}`);
//       console.error(`      Expression was: ${expression}`);
//       return 0;
//     }
//   };

//   // Find grand total key
//   const grandTotalKeys = ['grand_total', 'total_in_eur', 'total_including_vat_kdv_dahil'];
//   const grandTotalKey = Object.keys(calculatedValues).find(key => 
//     grandTotalKeys.some(gtKey => key.includes(gtKey))
//   ) || Object.keys(calculatedValues)[Object.keys(calculatedValues).length - 1];

//   // Format display name
//   const formatDisplayName = (key) => {
//     return key
//       .split('_')
//       .map(w => w.charAt(0).toUpperCase() + w.slice(1))
//       .join(' ');
//   };

//   return (
//     <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//       <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
//         Invoice Summary
//       </h3>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         {/* Left: Status and Note */}
//         <div className="space-y-4">
//           <div className="form-control">
//             <label className={labelClass}>
//               Status <span className="text-red-500">*</span>
//             </label>
//             <select
//               name="status"
//               value={currentStatus}
//               onChange={(e) => {
//                 const newStatus = e.target.value;
//                 console.log("🎯 Status dropdown changed to:", newStatus);
                
//                 if (onStatusChange) {
//                   onStatusChange(newStatus);
//                 } else {
//                   console.error("❌ onStatusChange callback not provided!");
//                 }
//               }}
//               className={selectClass}
//               required
//             >
//               <option value="" disabled>Select the status</option>
//               <option value="ready">✅ Ready</option>
//               <option value="pending">⏳ Pending</option>
//             </select>
            
//             {/* Current Status Indicator */}
//             <div className="mt-2 flex items-center gap-2">
//               <span className="text-xs text-slate-500">Current:</span>
//               <span className={`px-2 py-1 rounded-full text-xs font-bold ${
//                 currentStatus === "ready" 
//                   ? "bg-green-100 text-green-700 border border-green-200"
//                   : "bg-amber-100 text-amber-700 border border-amber-200"
//               }`}>
//                 {currentStatus === "ready" ? "✅ Ready" : "⏳ Pending"}
//               </span>
//             </div>
//           </div>

//           <div className="form-control">
//             <label className={labelClass}>Note</label>
//             <textarea
//               name="note"
//               value={currentNote}
//               onChange={(e) => {
//                 const newNote = e.target.value;
//                 console.log("📝 Note changed");
                
//                 if (onNoteChange) {
//                   onNoteChange(newNote);
//                 } else {
//                   console.error("❌ onNoteChange callback not provided!");
//                 }
//               }}
//               className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] min-h-[80px] bg-white resize-none"
//               placeholder="Enter Note"
//             />
//           </div>

//           {/* Debug Info */}
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
//             <p className="font-semibold text-blue-800 mb-1">Debug Info:</p>
//             <div className="text-blue-600 space-y-1">
//               <div>Status: <span className="font-bold">{currentStatus}</span></div>
//               <div>Accommodation: {formData.accommodation_details ? '✓' : '✗'}</div>
//               {formData.accommodation_details && (
//                 <div className="ml-2 text-[10px]">
//                   <div>• EUR Amount: {formData.accommodation_details.eur_amount || '0'}</div>
//                   <div>• Exchange Rate: {formData.accommodation_details.exchange_rate || '0'}</div>
//                   <div>• Total Nights: {formData.accommodation_details.total_nights || '0'}</div>
//                   <div>• Taxable (Room): {formData.accommodation_details.taxable_amount_room || '0'}</div>
//                 </div>
//               )}
//               <div>Other Services: {formData.other_services?.length || 0} items</div>
//               <div>Calculations: {Object.keys(calculatedValues).length} values</div>
//             </div>
//           </div>
//         </div>

//         {/* Right: Calculations Summary */}
//         <div className="bg-slate-50 p-5 rounded-lg space-y-3">
//           {Object.keys(calculatedValues).length === 0 ? (
//             <p className="text-sm text-slate-500 text-center py-4">
//               Fill in accommodation details to see calculations
//             </p>
//           ) : (
//             Object.entries(calculatedValues).map(([key, value]) => {
//               const isGrandTotal = key === grandTotalKey;
//               const displayName = formatDisplayName(key);
              
//               // Special handling for EUR totals
//               const isEurTotal = key.includes('eur');
//               const currency = isEurTotal ? 'EUR' : (config.currency || 'TRY');
              
//               if (isGrandTotal) {
//                 return (
//                   <div key={key} className="flex justify-between text-lg font-bold text-[#003d7a] pt-2 border-t-2 border-slate-300">
//                     <span>{displayName}:</span>
//                     <span>
//                       {value.toFixed(2)} {currency}
//                     </span>
//                   </div>
//                 );
//               }

//               return (
//                 <div key={key} className={`flex justify-between text-sm ${isEurTotal ? 'text-green-700 font-semibold' : ''}`}>
//                   <span className="text-slate-600">{displayName}</span>
//                   <span className="font-medium">
//                     {value.toFixed(2)} {currency}
//                   </span>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DynamicSummarySection;


// import { useEffect, useState } from "react";

// const DynamicSummarySection = ({ config, formData, onStatusChange, onNoteChange }) => {
//   const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const selectClass = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white h-[42px]";

//   const [calculatedValues, setCalculatedValues] = useState({});

//   const currentStatus = formData.status || "pending";
//   const currentNote = formData.note || "";

//   console.log("📊 DynamicSummarySection - Current status:", currentStatus);
//   console.log("📊 DynamicSummarySection - Current note:", currentNote);
//   console.log("📊 DynamicSummarySection - FormData:", formData);

//   // ✅ FIX: Recalculate whenever formData changes
//   useEffect(() => {
//     console.log("🧮 Calculating summary with formData:", formData);
    
//     const calculated = {};
    
//     if (!config.final_calculations) {
//       console.log("⚠️ No final_calculations in config");
//       return;
//     }

//     // ✅ CRITICAL FIX: Build context with proper nested object handling
//     const context = {
//       ...formData,
//       // Flatten accommodation_details for easier access
//       ...(formData.accommodation_details || {})
//     };

//     console.log("📋 Calculation context:", context);

//     // Calculate in order (dependencies matter!)
//     const calculationOrder = Object.entries(config.final_calculations);
    
//     calculationOrder.forEach(([key, calcConfig]) => {
//       try {
//         const formula = typeof calcConfig === 'string' ? calcConfig : calcConfig.calculation;
        
//         console.log(`  📊 Calculating ${key}: ${formula}`);
//         const result = evaluateFormula(formula, context, calculated);
//         calculated[key] = result;
//         context[key] = result; // Add to context for next calculations
//         console.log(`    ✅ ${key} = ${result}`);
//       } catch (error) {
//         console.error(`    ❌ Error calculating ${key}:`, error);
//         calculated[key] = 0;
//       }
//     });

//     console.log("✅ All calculations complete:", calculated);
//     setCalculatedValues(calculated);
//   }, [formData, config]);

//   // ✅ IMPROVED: Safe formula evaluator with better error handling
//   const evaluateFormula = (formula, data, previousCalculations = {}) => {
//     let expression = formula;
    
//     console.log(`    → Original formula: ${formula}`);

//     try {
//       // STEP 1: Handle SUM(array.field) pattern
//       const sumPattern = /SUM\(([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\)/g;
//       expression = expression.replace(sumPattern, (match, path) => {
//         const [arrayName, fieldName] = path.split('.');
//         const array = data[arrayName];
        
//         if (!Array.isArray(array) || array.length === 0) {
//           console.log(`      SUM: ${arrayName} is empty or not an array`);
//           return '0';
//         }
        
//         const sum = array.reduce((total, item) => {
//           const value = parseFloat(item[fieldName]) || 0;
//           return total + value;
//         }, 0);
        
//         console.log(`      SUM(${path}) = ${sum.toFixed(2)} (from ${array.length} items)`);
//         return sum.toFixed(2);
//       });

//       // STEP 2: Replace nested object references like "accommodation_details.taxable_amount_room"
//       const nestedFieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\b/g;
//       const nestedMatches = [...expression.matchAll(nestedFieldPattern)];
      
//       nestedMatches.forEach(match => {
//         const fullPath = match[1];
//         const [objName, fieldName] = fullPath.split('.');
        
//         let value = 0;
        
//         // ✅ CRITICAL: Try multiple lookup strategies
//         if (data[objName] && data[objName][fieldName] !== undefined) {
//           // Strategy 1: Direct nested lookup
//           value = parseFloat(data[objName][fieldName]) || 0;
//           console.log(`      ${fullPath} (nested) = ${value}`);
//         } else if (data[fieldName] !== undefined) {
//           // Strategy 2: Flattened lookup (from context)
//           value = parseFloat(data[fieldName]) || 0;
//           console.log(`      ${fullPath} (flattened) = ${value}`);
//         } else {
//           console.log(`      ${fullPath} NOT FOUND in data`);
//         }
        
//         expression = expression.replace(
//           new RegExp(`\\b${fullPath.replace('.', '\\.')}\\b`, 'g'), 
//           value.toString()
//         );
//       });

//       // STEP 3: Replace simple field references
//       const simpleFieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
//       expression = expression.replace(simpleFieldPattern, (match) => {
//         // Check previously calculated values first
//         if (previousCalculations[match] !== undefined) {
//           const value = previousCalculations[match];
//           console.log(`      ${match} (from calculations) = ${value}`);
//           return value.toString();
//         }
        
//         // Check form data
//         if (data[match] !== undefined) {
//           const value = parseFloat(data[match]) || 0;
//           console.log(`      ${match} (from data) = ${value}`);
//           return value.toString();
//         }
        
//         // Skip known safe keywords
//         if (['SUM', 'payments'].includes(match)) {
//           return '0';
//         }
        
//         return match;
//       });

//       console.log(`    → After substitution: ${expression}`);

//       // STEP 4: Safe evaluation
//       const cleanExpr = expression.replace(/[a-zA-Z_]+/g, '0');
      
//       // ✅ Use Function constructor for safe math evaluation
//       const result = new Function(`return ${cleanExpr}`)();
      
//       const finalValue = isNaN(result) ? 0 : parseFloat(result.toFixed(2));
//       console.log(`    → Final result: ${finalValue}`);
      
//       return finalValue;
      
//     } catch (e) {
//       console.error(`      Evaluation error: ${e.message}`);
//       console.error(`      Expression was: ${expression}`);
//       return 0;
//     }
//   };

//   // Find grand total key
//   const grandTotalKeys = ['grand_total', 'total_in_eur', 'total_including_vat_kdv_dahil'];
//   const grandTotalKey = Object.keys(calculatedValues).find(key => 
//     grandTotalKeys.some(gtKey => key.includes(gtKey))
//   ) || Object.keys(calculatedValues)[Object.keys(calculatedValues).length - 1];

//   // Format display name
//   const formatDisplayName = (key) => {
//     return key
//       .split('_')
//       .map(w => w.charAt(0).toUpperCase() + w.slice(1))
//       .join(' ');
//   };

//   return (
//     <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//       <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
//         Invoice Summary
//       </h3>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         {/* Left: Status and Note */}
//         <div className="space-y-4">
//           <div className="form-control">
//             <label className={labelClass}>
//               Status <span className="text-red-500">*</span>
//             </label>
//             <select
//               name="status"
//               value={currentStatus}
//               onChange={(e) => {
//                 const newStatus = e.target.value;
//                 console.log("🎯 Status dropdown changed to:", newStatus);
                
//                 if (onStatusChange) {
//                   onStatusChange(newStatus);
//                 } else {
//                   console.error("❌ onStatusChange callback not provided!");
//                 }
//               }}
//               className={selectClass}
//               required
//             >
//               <option value="" disabled>Select the status</option>
//               <option value="ready">✅ Ready</option>
//               <option value="pending">⏳ Pending</option>
//             </select>
            
//             {/* Current Status Indicator */}
//             <div className="mt-2 flex items-center gap-2">
//               <span className="text-xs text-slate-500">Current:</span>
//               <span className={`px-2 py-1 rounded-full text-xs font-bold ${
//                 currentStatus === "ready" 
//                   ? "bg-green-100 text-green-700 border border-green-200"
//                   : "bg-amber-100 text-amber-700 border border-amber-200"
//               }`}>
//                 {currentStatus === "ready" ? "✅ Ready" : "⏳ Pending"}
//               </span>
//             </div>
//           </div>

//           <div className="form-control">
//             <label className={labelClass}>Note</label>
//             <textarea
//               name="note"
//               value={currentNote}
//               onChange={(e) => {
//                 const newNote = e.target.value;
//                 console.log("📝 Note changed");
                
//                 if (onNoteChange) {
//                   onNoteChange(newNote);
//                 } else {
//                   console.error("❌ onNoteChange callback not provided!");
//                 }
//               }}
//               className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] min-h-[80px] bg-white resize-none"
//               placeholder="Enter Note"
//             />
//           </div>

//           {/* Debug Info */}
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
//             <p className="font-semibold text-blue-800 mb-1">Debug Info:</p>
//             <div className="text-blue-600 space-y-1">
//               <div>Status: <span className="font-bold">{currentStatus}</span></div>
//               <div>Accommodation: {formData.accommodation_details ? '✓' : '✗'}</div>
//               {formData.accommodation_details && (
//                 <div className="ml-2 text-[10px]">
//                   <div>• EUR Amount: {formData.accommodation_details.eur_amount || '0'}</div>
//                   <div>• Exchange Rate: {formData.accommodation_details.exchange_rate || '0'}</div>
//                   <div>• Total Nights: {formData.accommodation_details.total_nights || '0'}</div>
//                   <div>• Taxable (Room): {formData.accommodation_details.taxable_amount_room || 'N/A'}</div>
//                   <div>• VAT 10%: {formData.accommodation_details.vat_10_percent || 'N/A'}</div>
//                   <div>• Acc Tax: {formData.accommodation_details.accommodation_tax || 'N/A'}</div>
//                 </div>
//               )}
//               <div>Other Services: {formData.other_services?.length || 0} items</div>
//               <div>Calculations: {Object.keys(calculatedValues).length} values</div>
//             </div>
//           </div>
//         </div>

//         {/* Right: Calculations Summary */}
//         <div className="bg-slate-50 p-5 rounded-lg space-y-3">
//           {Object.keys(calculatedValues).length === 0 ? (
//             <p className="text-sm text-slate-500 text-center py-4">
//               Fill in accommodation details to see calculations
//             </p>
//           ) : (
//             Object.entries(calculatedValues).map(([key, value]) => {
//               const isGrandTotal = key === grandTotalKey;
//               const displayName = formatDisplayName(key);
              
//               // Special handling for EUR totals
//               const isEurTotal = key.includes('eur');
//               const currency = isEurTotal ? 'EUR' : (config.currency || 'TRY');
              
//               if (isGrandTotal) {
//                 return (
//                   <div key={key} className="flex justify-between text-lg font-bold text-[#003d7a] pt-2 border-t-2 border-slate-300">
//                     <span>{displayName}:</span>
//                     <span>
//                       {value.toFixed(2)} {currency}
//                     </span>
//                   </div>
//                 );
//               }

//               return (
//                 <div key={key} className={`flex justify-between text-sm ${isEurTotal ? 'text-green-700 font-semibold' : ''}`}>
//                   <span className="text-slate-600">{displayName}</span>
//                   <span className="font-medium">
//                     {value.toFixed(2)} {currency}
//                   </span>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DynamicSummarySection;




// 'use client';

// import { useEffect, useState } from "react";

// const DynamicSummarySection = ({ config, formData = {}, onStatusChange, onNoteChange }) => {
//   const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
//   const selectClass = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white h-[42px]";

//   const [calculatedValues, setCalculatedValues] = useState({});
//   const [localStatus, setLocalStatus] = useState(formData?.status || "pending");
//   const [localNote, setLocalNote] = useState(formData?.note || "");

//   const currentStatus = localStatus;
//   const currentNote = localNote;

//   console.log("📊 DynamicSummarySection - Current status:", currentStatus);
//   console.log("📊 DynamicSummarySection - Current note:", currentNote);
//   console.log("📊 DynamicSummarySection - FormData:", formData);

//   // ✅ FIX: Recalculate whenever formData changes
//   useEffect(() => {
//     console.log("🧮 Calculating summary with formData:", formData);
    
//     const calculated = {};
    
//     if (!config.final_calculations) {
//       console.log("⚠️ No final_calculations in config");
//       return;
//     }

//     // ✅ CRITICAL FIX: Build context with proper nested object handling
//     // Keep nested structure intact, don't flatten
//     const context = {
//       ...formData,
//       // Explicitly include accommodation_details as nested object
//       accommodation_details: formData.accommodation_details || {},
//       other_services: formData.other_services || [],
//       city_tax: formData.city_tax || {},
//       stamp_tax: formData.stamp_tax || {}
//     };

//     console.log("📋 Calculation context:", context);
//     console.log("📋 Accommodation Details in context:", context.accommodation_details);

//     // Calculate in order (dependencies matter!)
//     const calculationOrder = Object.entries(config.final_calculations);
    
//     calculationOrder.forEach(([key, calcConfig]) => {
//       try {
//         const formula = typeof calcConfig === 'string' ? calcConfig : calcConfig.calculation;
        
//         console.log(`  📊 Calculating ${key}: ${formula}`);
//         const result = evaluateFormula(formula, context, calculated);
//         calculated[key] = result;
//         context[key] = result; // Add to context for next calculations
//         console.log(`    ✅ ${key} = ${result}`);
//       } catch (error) {
//         console.error(`    ❌ Error calculating ${key}:`, error);
//         calculated[key] = 0;
//       }
//     });

//     console.log("✅ All calculations complete:", calculated);
//     setCalculatedValues(calculated);
//   }, [formData, config]);

//   // ✅ IMPROVED: Safe formula evaluator with better error handling
//   const evaluateFormula = (formula, data, previousCalculations = {}) => {
//     let expression = formula;
    
//     console.log(`    → Original formula: ${formula}`);

//     try {
//       // STEP 1: Handle SUM(array.field) pattern
//       const sumPattern = /SUM\(([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\)/g;
//       expression = expression.replace(sumPattern, (match, path) => {
//         const [arrayName, fieldName] = path.split('.');
//         const array = data[arrayName];
        
//         if (!Array.isArray(array) || array.length === 0) {
//           console.log(`      SUM: ${arrayName} is empty or not an array`);
//           return '0';
//         }
        
//         const sum = array.reduce((total, item) => {
//           const value = parseFloat(item[fieldName]) || 0;
//           return total + value;
//         }, 0);
        
//         console.log(`      SUM(${path}) = ${sum.toFixed(2)} (from ${array.length} items)`);
//         return sum.toFixed(2);
//       });

//       // STEP 2: Replace nested object references like "accommodation_details.taxable_amount_room"
//       const nestedFieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\b/g;
//       const nestedMatches = [...expression.matchAll(nestedFieldPattern)];
      
//       nestedMatches.forEach(match => {
//         const fullPath = match[1];
//         const [objName, fieldName] = fullPath.split('.');
        
//         let value = 0;
        
//         // ✅ CRITICAL FIX: Try multiple lookup strategies with proper nested access
//         if (data[objName] && typeof data[objName] === 'object' && data[objName][fieldName] !== undefined) {
//           // Strategy 1: Direct nested lookup
//           value = parseFloat(data[objName][fieldName]) || 0;
//           console.log(`      ${fullPath} (nested) = ${value}`);
//         } else if (data[fieldName] !== undefined) {
//           // Strategy 2: Flattened lookup (from context)
//           value = parseFloat(data[fieldName]) || 0;
//           console.log(`      ${fullPath} (flattened) = ${value}`);
//         } else {
//           console.log(`      ${fullPath} NOT FOUND - checking all accommodation fields...`);
//           // Strategy 3: Search within accommodation_details more broadly
//           if (objName === 'accommodation_details' && data.accommodation_details) {
//             const accDetails = data.accommodation_details;
//             console.log(`        Available in accommodation_details:`, Object.keys(accDetails));
//             if (accDetails[fieldName] !== undefined) {
//               value = parseFloat(accDetails[fieldName]) || 0;
//               console.log(`      ${fullPath} (found in accommodation) = ${value}`);
//             }
//           }
//         }
        
//         expression = expression.replace(
//           new RegExp(`\\b${fullPath.replace(/\./g, '\\.')}\\b`, 'g'), 
//           `(${value})`
//         );
//       });

//       // STEP 3: Replace simple field references
//       const simpleFieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
//       expression = expression.replace(simpleFieldPattern, (match) => {
//         // Skip if already in parentheses or is a number
//         if (match.match(/^\d/) || expression.includes(`(${match})`)) {
//           return match;
//         }
        
//         // Check previously calculated values first
//         if (previousCalculations[match] !== undefined) {
//           const value = parseFloat(previousCalculations[match]) || 0;
//           console.log(`      ${match} (from calculations) = ${value}`);
//           return `(${value})`;
//         }
        
//         // Check form data
//         if (data[match] !== undefined) {
//           const value = parseFloat(data[match]) || 0;
//           console.log(`      ${match} (from data) = ${value}`);
//           return `(${value})`;
//         }
        
//         // Skip known safe keywords
//         if (['SUM', 'payments', 'accommodation', 'other_services', 'city_tax', 'stamp_tax'].includes(match)) {
//           return match;
//         }
        
//         return `(0)`;
//       });

//       console.log(`    → After substitution: ${expression}`);

//       // STEP 4: Safe evaluation using eval with strict number context
//       try {
//         // Replace SUM with 0 for final evaluation
//         const finalExpr = expression.replace(/SUM/g, '0');
        
//         // ✅ Use Function constructor for safe math evaluation
//         const result = new Function(`return ${finalExpr}`)();
        
//         const finalValue = isNaN(result) ? 0 : parseFloat(result.toFixed(2));
//         console.log(`    → Final result: ${finalValue}`);
        
//         return finalValue;
//       } catch (evalError) {
//         console.error(`      Final evaluation error:`, evalError.message);
//         console.error(`      Trying to evaluate: ${expression}`);
//         return 0;
//       }
      
//     } catch (e) {
//       console.error(`      Evaluation error: ${e.message}`);
//       console.error(`      Expression was: ${expression}`);
//       return 0;
//     }
//   };

//   // Find grand total key
//   const grandTotalKeys = ['grand_total', 'total_in_eur', 'total_including_vat_kdv_dahil'];
//   const grandTotalKey = Object.keys(calculatedValues).find(key => 
//     grandTotalKeys.some(gtKey => key.includes(gtKey))
//   ) || Object.keys(calculatedValues)[Object.keys(calculatedValues).length - 1];

//   // Format display name
//   const formatDisplayName = (key) => {
//     return key
//       .split('_')
//       .map(w => w.charAt(0).toUpperCase() + w.slice(1))
//       .join(' ');
//   };

//   return (
//     <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//       <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
//         Invoice Summary
//       </h3>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         {/* Left: Status and Note */}
//         <div className="space-y-4">
//           <div className="form-control">
//             <label className={labelClass}>
//               Status <span className="text-red-500">*</span>
//             </label>
//             <select
//               name="status"
//               value={currentStatus}
//               onChange={(e) => {
//                 const newStatus = e.target.value;
//                 console.log("🎯 Status dropdown changed to:", newStatus);
//                 setLocalStatus(newStatus);
                
//                 if (onStatusChange) {
//                   onStatusChange(newStatus);
//                 }
//               }}
//               className={selectClass}
//               required
//             >
//               <option value="" disabled>Select the status</option>
//               <option value="ready">✅ Ready</option>
//               <option value="pending">⏳ Pending</option>
//             </select>
            
//             {/* Current Status Indicator */}
//             <div className="mt-2 flex items-center gap-2">
//               <span className="text-xs text-slate-500">Current:</span>
//               <span className={`px-2 py-1 rounded-full text-xs font-bold ${
//                 currentStatus === "ready" 
//                   ? "bg-green-100 text-green-700 border border-green-200"
//                   : "bg-amber-100 text-amber-700 border border-amber-200"
//               }`}>
//                 {currentStatus === "ready" ? "✅ Ready" : "⏳ Pending"}
//               </span>
//             </div>
//           </div>

//           <div className="form-control">
//             <label className={labelClass}>Note</label>
//             <textarea
//               name="note"
//               value={currentNote}
//               onChange={(e) => {
//                 const newNote = e.target.value;
//                 console.log("📝 Note changed");
//                 setLocalNote(newNote);
                
//                 if (onNoteChange) {
//                   onNoteChange(newNote);
//                 }
//               }}
//               className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] min-h-[80px] bg-white resize-none"
//               placeholder="Enter Note"
//             />
//           </div>

//           {/* Debug Info */}
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
//             <p className="font-semibold text-blue-800 mb-1">Debug Info:</p>
//             <div className="text-blue-600 space-y-1">
//               <div>Status: <span className="font-bold">{currentStatus}</span></div>
//               <div>Accommodation: {formData.accommodation_details ? '✓' : '✗'}</div>
//               {formData.accommodation_details && (
//                 <div className="ml-2 text-[10px]">
//                   <div>• EUR Amount: {formData.accommodation_details.eur_amount || '0'}</div>
//                   <div>• Exchange Rate: {formData.accommodation_details.exchange_rate || '0'}</div>
//                   <div>• Total Nights: {formData.accommodation_details.total_nights || '0'}</div>
//                   <div>• Taxable (Room): {formData.accommodation_details.taxable_amount_room || 'N/A'}</div>
//                   <div>• VAT 10%: {formData.accommodation_details.vat_10_percent || 'N/A'}</div>
//                   <div>• Acc Tax: {formData.accommodation_details.accommodation_tax || 'N/A'}</div>
//                 </div>
//               )}
//               <div>Other Services: {formData.other_services?.length || 0} items</div>
//               <div>Calculations: {Object.keys(calculatedValues).length} values</div>
//             </div>
//           </div>
//         </div>

//         {/* Right: Calculations Summary */}
//         <div className="bg-slate-50 p-5 rounded-lg space-y-3">
//           {Object.keys(calculatedValues).length === 0 ? (
//             <p className="text-sm text-slate-500 text-center py-4">
//               Fill in accommodation details to see calculations
//             </p>
//           ) : (
//             Object.entries(calculatedValues).map(([key, value]) => {
//               const isGrandTotal = key === grandTotalKey;
//               const displayName = formatDisplayName(key);
              
//               // Special handling for EUR totals
//               const isEurTotal = key.includes('eur');
//               const currency = isEurTotal ? 'EUR' : (config.currency || 'TRY');
              
//               if (isGrandTotal) {
//                 return (
//                   <div key={key} className="flex justify-between text-lg font-bold text-[#003d7a] pt-2 border-t-2 border-slate-300">
//                     <span>{displayName}:</span>
//                     <span>
//                       {value.toFixed(2)} {currency}
//                     </span>
//                   </div>
//                 );
//               }

//               return (
//                 <div key={key} className={`flex justify-between text-sm ${isEurTotal ? 'text-green-700 font-semibold' : ''}`}>
//                   <span className="text-slate-600">{displayName}</span>
//                   <span className="font-medium">
//                     {value.toFixed(2)} {currency}
//                   </span>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DynamicSummarySection;


// DynamicSummarySection.jsx lastly used

// import { useEffect, useState } from "react";

// const DynamicSummarySection = ({ config, formData = {}, onStatusChange, onNoteChange }) => {
//   const [calculatedValues, setCalculatedValues] = useState({});
//   const [localStatus, setLocalStatus] = useState(formData?.status || "pending");
//   const [localNote, setLocalNote] = useState(formData?.note || "");

//   useEffect(() => {
//     if (!config?.final_calculations) {
//       console.warn("No final_calculations found in config");
//       return;
//     }

//     // Build safe context – make sure nested objects exist
//     const context = {
//       ...formData,
//       accommodation_details: formData.accommodation_details || {},
//       other_services: Array.isArray(formData.other_services) ? formData.other_services : [],
//       city_tax: formData.city_tax || {},
//       stamp_tax: formData.stamp_tax || {},
//     };

//     console.log("[SUMMARY DEBUG] Context:", {
//       hasAccommodation: !!context.accommodation_details,
//       vat10: context.accommodation_details?.vat_10_percent,
//       vat20Sum: context.other_services?.reduce((s, e) => s + (parseFloat(e.vat_20_percent) || 0), 0),
//       exchangeRate: context.accommodation_details?.exchange_rate,
//       servicesCount: context.other_services?.length || 0,
//     });

//     const calculated = {};

//     // Enforced order – must calculate base values first
//     const orderedKeys = [
//       "total_taxable_amount_room",
//       "total_laundry_amount",
//       "total_taxable_amount",
//       "total_vat_10",
//       "total_vat_20",
//       "total_vat",
//       "total_accommodation_tax",
//       "grand_total",
//       "total_in_eur",
//       // CVK keys – add if you want them always evaluated
//       "total_amount",
//       "total_including_vat_kdv_dahil",
//       "total_vat_hesaplanan_kdv",
//       "taxable_amount_kdv_matrah",
//     ];

//     orderedKeys.forEach((key) => {
//       const calcConfig = config.final_calculations[key];
//       if (!calcConfig) return;

//       const formula = typeof calcConfig === "string" ? calcConfig : calcConfig.calculation;
//       if (!formula) return;

//       let expr = formula.trim();

//       // 1. Replace SUM(…) first
//       expr = expr.replace(/SUM\s*\(\s*([^)]+)\s*\)/gi, (match, path) => {
//         const [arrName, fieldName] = path.split(".").map(s => s.trim());
//         const arr = Array.isArray(context[arrName]) ? context[arrName] : [];
//         const sum = arr.reduce((total, item) => {
//           return total + (parseFloat(item?.[fieldName]) || 0);
//         }, 0);
//         return sum.toString();
//       });

//       // 2. Replace nested paths (accommodation_details.xxx)
//       expr = expr.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, obj, field) => {
//         const value = context[obj]?.[field];
//         return value != null ? parseFloat(value) : "0";
//       });

//       // 3. Replace previously calculated values and simple variables
//       expr = expr.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
//         if (["SUM"].includes(match)) return match;
//         const val = calculated[match] ?? context[match];
//         return val != null ? parseFloat(val) : "0";
//       });

//       // 4. Clean up expression
//       expr = expr.replace(/\s+/g, "");

//       console.log(`[SUMMARY CALC] ${key} ← ${formula} → ${expr}`);

//       try {
//         // Safe evaluation
//         const fn = new Function(`return ${expr}`);
//         const result = fn();
//         const final = isNaN(result) ? 0 : Number(result.toFixed(2));
//         calculated[key] = final;
//         context[key] = final; // allow chaining
//       } catch (err) {
//         console.error(`[SUMMARY ERROR] ${key} = ${formula}`, {
//           expr,
//           error: err.message,
//         });
//         calculated[key] = 0;
//       }
//     });

//     console.log("[SUMMARY DEBUG] Final calculated values:", calculated);
//     setCalculatedValues(calculated);
//   }, [formData, config]);

//   const getLabel = (key) => {
//     const cfg = config?.final_calculations?.[key];
//     return cfg?.label || key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
//   };

//   const isGrandTotalKey = (key) =>
//     ["grand_total", "total_including_vat", "kdv_dahil", "grandTotal"].some(t => key.toLowerCase().includes(t));

//   return (
//     <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//       <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
//         Invoice Summary
//       </h3>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         {/* Left: Status & Note */}
//         <div className="space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1.5">
//               Status <span className="text-red-500">*</span>
//             </label>
//             <select
//               value={localStatus}
//               onChange={(e) => {
//                 setLocalStatus(e.target.value);
//                 onStatusChange?.(e.target.value);
//               }}
//               className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a]"
//             >
//               <option value="pending">Pending</option>
//               <option value="ready">Ready</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1.5">Note</label>
//             <textarea
//               value={localNote}
//               onChange={(e) => {
//                 setLocalNote(e.target.value);
//                 onNoteChange?.(e.target.value);
//               }}
//               rows={4}
//               className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a]"
//               placeholder="Internal notes..."
//             />
//           </div>
//         </div>

//         {/* Right: Calculations */}
//         <div className="bg-slate-50 p-5 rounded-xl space-y-3">
//           {Object.keys(calculatedValues).length === 0 ? (
//             <div className="text-center py-10 text-slate-500">
//               Fill in accommodation and services to see summary
//             </div>
//           ) : (
//             Object.entries(calculatedValues)
//               .filter(([key]) => calculatedValues[key] !== 0 || key.includes("grand") || key.includes("total")) // show even if 0 for important ones
//               .map(([key, value]) => {
//                 const label = getLabel(key);
//                 const isGrand = isGrandTotalKey(key);
//                 const currency = key.toLowerCase().includes("eur") ? "EUR" : (config.currency || "TRY");

//                 return (
//                   <div
//                     key={key}
//                     className={`flex justify-between items-center py-1.5 ${
//                       isGrand ? "border-t-2 border-slate-300 pt-4 mt-2 font-bold text-lg" : ""
//                     }`}
//                   >
//                     <span className={isGrand ? "text-[#003d7a]" : "text-slate-700"}>{label}</span>
//                     <span className={isGrand ? "text-[#003d7a] font-bold" : ""}>
//                       {Number(value).toLocaleString("en-US", {
//                         minimumFractionDigits: 2,
//                         maximumFractionDigits: 2,
//                       })}{" "}
//                       {currency}
//                     </span>
//                   </div>
//                 );
//               })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DynamicSummarySection;




// DynamicSummarySection.jsx final
// import { useEffect, useState } from "react";
// import { detectHotelType, calculateFinalSummary } from "../../utils/invoiceCalculations";

// const DynamicSummarySection = ({ config, formData = {}, onStatusChange, onNoteChange }) => {
//   const [calculatedValues, setCalculatedValues] = useState({});
//   const [localStatus, setLocalStatus] = useState(formData?.status || "pending");
//   const [localNote, setLocalNote] = useState(formData?.note || "");
  
//   const hotelType = detectHotelType(config);
//   const isGrandAras = hotelType === 'GRAND_ARAS';

//   useEffect(() => {
//     // Use centralized calculation
//     const summary = calculateFinalSummary(formData, hotelType);
    
//     console.log("[SUMMARY] Calculated values:", {
//       hotelType,
//       summary,
//       formData: {
//         accommodation: formData.accommodation_details,
//         services: formData.other_services
//       }
//     });
    
//     setCalculatedValues(summary);
//   }, [
//     formData.accommodation_details?.eur_amount,
//     formData.accommodation_details?.exchange_rate,
//     formData.accommodation_details?.total_nights,
//     formData.other_services?.map(s => s.gross_amount).join(','),
//     hotelType
//   ]);

//   // Define which fields to display for each hotel type
//   const getDisplayFields = () => {
//     if (isGrandAras) {
//       return [
//         { key: 'total_taxable_amount_room', label: 'Total Taxable (Room) - d' },
//         { key: 'total_laundry_amount', label: 'Total Laundry Amount (Gross) - c' },
//         { key: 'total_laundry_taxable', label: 'Total Laundry (Taxable) - e' },
//         { key: 'total_taxable_amount', label: 'Total Taxable Amount - f', divider: true },
//         { key: 'total_vat_10', label: 'Total VAT 10% (Room) - g' },
//         { key: 'total_vat_20', label: 'Total VAT 20% (Services) - h' },
//         { key: 'total_vat', label: 'Total VAT - i', divider: true },
//         { key: 'total_accommodation_tax', label: 'Accommodation Tax - j' },
//         { key: 'grand_total', label: 'Total Including VAT - k', isGrand: true },
//         { key: 'total_in_eur', label: 'Total in EUR - m', currency: 'EUR' },
//       ];
//     } else {
//       // CVK
//       return [
//         { key: 'total_amount', label: 'Total Amount' },
//         { key: 'total_vat_10', label: 'Total VAT 10%' },
//         { key: 'total_vat_20', label: 'Total VAT 20%' },
//         { key: 'total_acc_tax', label: 'Accommodation Tax', divider: true },
//         { key: 'total_including_vat_kdv_dahil', label: 'Total Including VAT (KDV Dahil)', isGrand: true },
//         { key: 'total_in_eur', label: 'Total in EUR', currency: 'EUR' },
//         { key: 'total_vat_hesaplanan_kdv', label: 'Total VAT (Hesaplanan KDV)' },
//         { key: 'taxable_amount_kdv_matrah', label: 'Taxable Amount (KDV Matrah)' },
//       ];
//     }
//   };

//   const displayFields = getDisplayFields();

//   return (
//     <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
//       <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2">
//         <h3 className="font-bold text-base md:text-lg text-slate-800">
//           Invoice Summary
//         </h3>
//         {isGrandAras && (
//           <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
//             Grand Aras Mode
//           </span>
//         )}
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         {/* Left: Status & Note */}
//         <div className="space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1.5">
//               Status <span className="text-red-500">*</span>
//             </label>
//             <select
//               value={localStatus}
//               onChange={(e) => {
//                 setLocalStatus(e.target.value);
//                 onStatusChange?.(e.target.value);
//               }}
//               className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a]"
//             >
//               <option value="pending">Pending</option>
//               <option value="ready">Ready</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-slate-700 mb-1.5">Note</label>
//             <textarea
//               value={localNote}
//               onChange={(e) => {
//                 setLocalNote(e.target.value);
//                 onNoteChange?.(e.target.value);
//               }}
//               rows={4}
//               className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a]"
//               placeholder="Internal notes..."
//             />
//           </div>
//         </div>

//         {/* Right: Calculations */}
//         <div className="bg-slate-50 p-5 rounded-xl space-y-2">
//           {Object.keys(calculatedValues).length === 0 ? (
//             <div className="text-center py-10 text-slate-500">
//               Fill in accommodation and services to see summary
//             </div>
//           ) : (
//             <>
//               {displayFields.map((field, index) => {
//                 const value = calculatedValues[field.key];
                
//                 // Skip if value is 0 and it's not a grand total or required field
//                 if (value === 0 && !field.isGrand && !field.key.includes('total_in_eur')) {
//                   return null;
//                 }
                
//                 const currency = field.currency || config.currency || 'TRY';
                
//                 return (
//                   <div key={field.key}>
//                     {field.divider && index > 0 && (
//                       <div className="border-t border-slate-300 my-2"></div>
//                     )}
                    
//                     <div
//                       className={`flex justify-between items-center py-1.5 ${
//                         field.isGrand ? "border-t-2 border-slate-300 pt-3 mt-3 font-bold text-lg" : ""
//                       }`}
//                     >
//                       <span className={field.isGrand ? "text-[#003d7a]" : "text-slate-700 text-sm"}>
//                         {field.label}
//                       </span>
//                       <span className={field.isGrand ? "text-[#003d7a] font-bold" : "text-slate-800 font-medium"}>
//                         {Number(value || 0).toLocaleString("en-US", {
//                           minimumFractionDigits: 2,
//                           maximumFractionDigits: 2,
//                         })}{" "}
//                         {currency}
//                       </span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DynamicSummarySection;



// DynamicSummarySection.jsx
import { useEffect, useState } from "react";
import { detectHotelType, calculateFinalSummary } from "../../utils/invoiceCalculations";

const DynamicSummarySection = ({ config, formData = {}, onStatusChange, onNoteChange }) => {
  const [calculatedValues, setCalculatedValues] = useState({});
  const [localStatus, setLocalStatus] = useState(formData?.status || "pending");
  const [localNote, setLocalNote] = useState(formData?.note || "");
  
  const hotelType = detectHotelType(config);
  const isTrypOrGrandAras = hotelType === 'GRAND_ARAS' || hotelType === 'TRYP';

  useEffect(() => {
    // Use centralized calculation
    const summary = calculateFinalSummary(formData, hotelType);
    
    console.log("[SUMMARY] Calculated values:", {
      hotelType,
      summary,
      formData: {
        accommodation: formData.accommodation_details,
        services: formData.other_services
      }
    });
    
    setCalculatedValues(summary);
  }, [
    formData.accommodation_details?.eur_amount,
    formData.accommodation_details?.exchange_rate,
    formData.accommodation_details?.total_nights,
    formData.other_services?.map(s => s.gross_amount).join(','),
    hotelType
  ]);

  // Define which fields to display for each hotel type
  const getDisplayFields = () => {
    if (isTrypOrGrandAras) {
      // Grand Aras & TRYP use same display
      return [
        { key: 'total_taxable_amount_room', label: 'Total Taxable (Room) - d' },
        { key: 'total_laundry_amount', label: 'Total Laundry Amount (Gross) - c' },
        { key: 'total_laundry_taxable', label: 'Total Laundry (Taxable) - e' },
        { key: 'total_taxable_amount', label: 'Total Taxable Amount - f', divider: true },
        { key: 'total_vat_10', label: 'Total VAT 10% (Room) - g' },
        { key: 'total_vat_20', label: 'Total VAT 20% (Services) - h' },
        { key: 'total_vat', label: 'Total VAT - i', divider: true },
        { key: 'total_accommodation_tax', label: 'Accommodation Tax - j' },
        { key: 'grand_total', label: 'Total Including VAT - k', isGrand: true },
        { key: 'total_in_eur', label: 'Total in EUR - m', currency: 'EUR' },
      ];
    } else {
      // CVK
      return [
        { key: 'total_amount', label: 'Total Amount' },
        { key: 'total_vat_10', label: 'Total VAT 10%' },
        { key: 'total_vat_20', label: 'Total VAT 20%' },
        { key: 'total_acc_tax', label: 'Accommodation Tax', divider: true },
        { key: 'total_including_vat_kdv_dahil', label: 'Total Including VAT (KDV Dahil)', isGrand: true },
        { key: 'total_in_eur', label: 'Total in EUR', currency: 'EUR' },
        { key: 'total_vat_hesaplanan_kdv', label: 'Total VAT (Hesaplanan KDV)' },
        { key: 'taxable_amount_kdv_matrah', label: 'Taxable Amount (KDV Matrah)' },
      ];
    }
  };

  const displayFields = getDisplayFields();

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4 md:mb-6 border-b pb-2">
        <h3 className="font-bold text-base md:text-lg text-slate-800">
          Invoice Summary
        </h3>
        {isTrypOrGrandAras && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
            {hotelType === 'TRYP' ? 'TRYP Mode' : 'Grand Aras Mode'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Status & Note */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={localStatus}
              onChange={(e) => {
                setLocalStatus(e.target.value);
                onStatusChange?.(e.target.value);
              }}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a]"
            >
              <option value="pending">Pending</option>
              <option value="ready">Ready</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Note</label>
            <textarea
              value={localNote}
              onChange={(e) => {
                setLocalNote(e.target.value);
                onNoteChange?.(e.target.value);
              }}
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a]"
              placeholder="Internal notes..."
            />
          </div>
        </div>

        {/* Right: Calculations */}
        <div className="bg-slate-50 p-5 rounded-xl space-y-2">
          {Object.keys(calculatedValues).length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              Fill in accommodation and services to see summary
            </div>
          ) : (
            <>
              {displayFields.map((field, index) => {
                const value = calculatedValues[field.key];
                
                // Skip if value is 0 and it's not a grand total or required field
                if (value === 0 && !field.isGrand && !field.key.includes('total_in_eur')) {
                  return null;
                }
                
                const currency = field.currency || config.currency || 'TRY';
                
                return (
                  <div key={field.key}>
                    {field.divider && index > 0 && (
                      <div className="border-t border-slate-300 my-2"></div>
                    )}
                    
                    <div
                      className={`flex justify-between items-center py-1.5 ${
                        field.isGrand ? "border-t-2 border-slate-300 pt-3 mt-3 font-bold text-lg" : ""
                      }`}
                    >
                      <span className={field.isGrand ? "text-[#003d7a]" : "text-slate-700 text-sm"}>
                        {field.label}
                      </span>
                      <span className={field.isGrand ? "text-[#003d7a] font-bold" : "text-slate-800 font-medium"}>
                        {Number(value || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {currency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicSummarySection;