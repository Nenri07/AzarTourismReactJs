import { useEffect, useState } from "react";

const DynamicSummarySection = ({ config, formData, onStatusChange, onNoteChange }) => {
  const labelClass = "text-xs md:text-sm font-medium text-slate-600 mb-1.5 block";
  const selectClass = "w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white h-[42px]";

  const [calculatedValues, setCalculatedValues] = useState({});

  // ✅ FIX: Get status and note from formData props, not local state
  const currentStatus = formData.status || "pending";
  const currentNote = formData.note || "";

  console.log("📊 DynamicSummarySection - Current status:", currentStatus);
  console.log("📊 DynamicSummarySection - Current note:", currentNote);

  // ✅ Recalculate whenever formData changes
  useEffect(() => {
    console.log("🧮 Calculating summary with formData:", formData);
    
    const calculated = {};
    
    if (!config.final_calculations) {
      console.log("⚠️ No final_calculations in config");
      return;
    }

    // Calculate in order (so dependencies are available)
    const calculationOrder = Object.entries(config.final_calculations);
    
    calculationOrder.forEach(([key, formula]) => {
      try {
        console.log(`  📊 Calculating ${key}: ${formula}`);
        const result = evaluateFormula(formula, formData, calculated);
        calculated[key] = result;
        console.log(`    ✅ ${key} = ${result}`);
      } catch (error) {
        console.error(`    ❌ Error calculating ${key}:`, error);
        calculated[key] = 0;
      }
    });

    setCalculatedValues(calculated);
  }, [formData, config]);

  // ✅ FIXED: Better formula evaluator with proper field name handling
  const evaluateFormula = (formula, data, previousCalculations = {}) => {
    let expression = formula;
    
    console.log(`    → Original formula: ${formula}`);

    // STEP 1: Handle SUM(array.field) pattern - do this FIRST before field replacement
    const sumPattern = /SUM\(([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\)/g;
    expression = expression.replace(sumPattern, (match, path) => {
      const [arrayName, fieldName] = path.split('.');
      const array = data[arrayName];
      
      if (!Array.isArray(array) || array.length === 0) {
        console.log(`      SUM: ${arrayName} is not an array or is empty`);
        return '0';
      }
      
      const sum = array.reduce((total, item) => {
        const val = parseFloat(item[fieldName]) || 0;
        return total + val;
      }, 0);
      
      console.log(`      SUM(${path}) = ${sum} (from ${array.length} items)`);
      return sum.toString();
    });

    // STEP 2: Replace nested field references like "accommodation_details.total_per_night"
    const nestedFieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const nestedMatches = [...expression.matchAll(nestedFieldPattern)];
    
    nestedMatches.forEach(match => {
      const fullPath = match[1];
      const [objName, fieldName] = fullPath.split('.');
      
      let value = 0;
      if (data[objName] && data[objName][fieldName] !== undefined) {
        value = parseFloat(data[objName][fieldName]) || 0;
        console.log(`      ${fullPath} = ${value}`);
      } else {
        console.log(`      ${fullPath} NOT FOUND in data`);
      }
      
      expression = expression.replace(new RegExp(`\\b${fullPath.replace('.', '\\.')}\\b`, 'g'), value.toString());
    });

    // STEP 3: Replace simple field references (calculated values from previous steps)
    const simpleFieldPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    expression = expression.replace(simpleFieldPattern, (match) => {
      if (previousCalculations[match] !== undefined) {
        const value = previousCalculations[match];
        console.log(`      ${match} (from calculations) = ${value}`);
        return value.toString();
      }
      
      if (data[match] !== undefined) {
        const value = parseFloat(data[match]) || 0;
        console.log(`      ${match} = ${value}`);
        return value.toString();
      }
      
      if (['payments'].includes(match)) {
        return '0';
      }
      
      return match;
    });

    console.log(`    → After substitution: ${expression}`);

    // STEP 4: Evaluate the expression safely
    try {
      const cleanExpr = expression.replace(/[a-zA-Z_]+/g, '0');
      const result = Function(`"use strict"; return (${cleanExpr})`)();
      return isNaN(result) ? 0 : parseFloat(result.toFixed(2));
    } catch (e) {
      console.error(`      Evaluation error: ${e.message}`);
      console.error(`      Expression was: ${expression}`);
      return 0;
    }
  };

  // Find grand total key
  const grandTotalKeys = ['total_in_eur', 'total_including_vat_kdv_dahil', 'grand_total'];
  const grandTotalKey = Object.keys(calculatedValues).find(key => 
    grandTotalKeys.some(gtKey => key.includes(gtKey))
  ) || Object.keys(calculatedValues)[Object.keys(calculatedValues).length - 1];

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 border-b pb-2">
        Invoice Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Status and Note */}
        <div className="space-y-4">
          <div className="form-control">
            <label className={labelClass}>
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={currentStatus}
              onChange={(e) => {
                const newStatus = e.target.value;
                console.log("🎯 Status dropdown changed to:", newStatus);
                
                // ✅ FIX: Call the callback to update parent
                if (onStatusChange) {
                  onStatusChange(newStatus);
                } else {
                  console.error("❌ onStatusChange callback not provided!");
                }
              }}
              className={selectClass}
              required
            >
              <option value="" disabled>Select the status</option>
              <option value="ready">✅ Ready</option>
              <option value="pending">⏳ Pending</option>
            </select>
            
            {/* Current Status Indicator */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">Current:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                currentStatus === "ready" 
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-amber-100 text-amber-700 border border-amber-200"
              }`}>
                {currentStatus === "ready" ? "✅ Ready" : "⏳ Pending"}
              </span>
            </div>
          </div>

          <div className="form-control">
            <label className={labelClass}>Note</label>
            <textarea
              name="note"
              value={currentNote}
              onChange={(e) => {
                const newNote = e.target.value;
                console.log("📝 Note changed");
                
                // ✅ FIX: Call the callback to update parent
                if (onNoteChange) {
                  onNoteChange(newNote);
                } else {
                  console.error("❌ onNoteChange callback not provided!");
                }
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] min-h-[80px] bg-white resize-none"
              placeholder="Enter Note"
            />
          </div>

          {/* Debug Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
            <p className="font-semibold text-blue-800 mb-1">Debug Info:</p>
            <div className="text-blue-600 space-y-1">
              <div>Status: <span className="font-bold">{currentStatus}</span></div>
              <div>Accommodation: {formData.accommodation_details ? '✓' : '✗'}</div>
              {formData.accommodation_details && (
                <div className="ml-2 text-[10px]">
                  <div>• Total/Night: {formData.accommodation_details.total_per_night || '0'}</div>
                  <div>• VAT Total: {formData.accommodation_details.vat_total_nights || '0'}</div>
                  <div>• Acc Tax Total: {formData.accommodation_details.acc_tax_total_nights || '0'}</div>
                </div>
              )}
              <div>Other Services: {formData.other_services?.length || 0} items</div>
              <div>Calculations: {Object.keys(calculatedValues).length} values</div>
            </div>
          </div>
        </div>

        {/* Right: Calculations Summary */}
        <div className="bg-slate-50 p-5 rounded-lg space-y-3">
          {Object.keys(calculatedValues).length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Fill in accommodation details to see calculations
            </p>
          ) : (
            Object.entries(calculatedValues).map(([key, value]) => {
              const isGrandTotal = key === grandTotalKey;
              const displayName = key
                .split('_')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
              
              if (isGrandTotal) {
                return (
                  <div key={key} className="flex justify-between text-lg font-bold text-[#003d7a] pt-2 border-t-2 border-slate-300">
                    <span>{displayName}:</span>
                    <span>
                      {value.toFixed(2)} {config.currency}
                    </span>
                  </div>
                );
              }

              return (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-slate-600">{displayName}</span>
                  <span className="font-medium">
                    {value.toFixed(2)} {config.currency}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicSummarySection;
