// import { useState, useEffect, useCallback } from 'react';
// import Decimal from 'decimal.js';

// Decimal.set({
//   precision: 20,
//   rounding: Decimal.ROUND_HALF_UP,
// });

// export const useDynamicCalculations = (hotelConfig, formValues) => {
//   const [calculatedValues, setCalculatedValues] = useState({});
//   const DECIMAL_PLACES = 3;

//   const D = (v) => new Decimal(v || 0);
//   const F = (d) => d.toDecimalPlaces(DECIMAL_PLACES).toFixed(DECIMAL_PLACES);

//   console.log("this is amount is EUR",);
  
//   // Safe formula evaluator
//   const evaluateFormula = useCallback((formula, context) => {
//     if (!formula) return D(0);

//     try {
//       // Handle special functions
//       if (formula.includes('SUM(')) {
//         const match = formula.match(/SUM\((.+?)\)/);
//         if (match) {
//           const path = match[1]; // e.g., "other_services.service_amount"
//           const [arrayName, fieldName] = path.split('.');
//           const array = context[arrayName] || [];
//           return array.reduce((sum, item) => sum.plus(D(item[fieldName] || 0)), D(0));
//         }
//       }

//       // Replace variable names with values
//       let processedFormula = formula;
      
//       // Replace dot notation (e.g., accommodation.subtotal)
//       Object.keys(context).forEach(key => {
//         const regex = new RegExp(`\\b${key}\\b`, 'g');
//         processedFormula = processedFormula.replace(regex, `(${context[key] || 0})`);
//       });

//       // Replace operators for Decimal.js
//       processedFormula = processedFormula
//         .replace(/\*/g, '.mul')
//         .replace(/\//g, '.div')
//         .replace(/\+/g, '.plus')
//         .replace(/-/g, '.minus');

//       // Evaluate using Decimal.js
//       // For simple calculations, we'll use a safer approach
//       const result = eval(`D(${processedFormula.replace(/\.mul|\.div|\.plus|\.minus/g, (match) => {
//         return match.replace('.', '.');
//       })})`);

//       return result instanceof Decimal ? result : D(result);
//     } catch (error) {
//       console.error('Formula evaluation error:', error, formula);
//       return D(0);
//     }
//   }, []);

//   // Calculate values based on hotel config
//   useEffect(() => {
//     if (!hotelConfig || !formValues) return;

//     const calculated = {};
//     const context = { ...formValues };

//     // Calculate nights from dates
//     if (formValues.arrival_date && formValues.departure_date) {
//       const arrival = new Date(formValues.arrival_date);
//       const departure = new Date(formValues.departure_date);
//       const nights = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
//       calculated.total_nights = nights > 0 ? nights : 0;
//       context.total_nights = calculated.total_nights;
//     }

//     // Process conditional sections
//     const sections = hotelConfig.conditional_sections || {};
//     console.log("this is form values------------------------",formValues);
//     console.log("this is sections------------------------",sections);

//     // Accommodation calculations
//     if (sections.accommodation_details?.enabled) {
//       const rules = sections.accommodation_details.calculation_rules || {};

      
      
//       if (rules.subtotal) {
//         calculated.accommodation_subtotal = F(evaluateFormula(rules.subtotal, context));
//         context.accommodation_subtotal = calculated.accommodation_subtotal;
//       }

//       if (rules.vat_amount) {
//         context.vat_rate = rules.vat_rate || 0;
//         calculated.accommodation_vat = F(evaluateFormula(rules.vat_amount, context));
//         context.accommodation_vat = calculated.accommodation_vat;
//       }
//     }

//     // City tax calculations
//     if (sections.city_tax?.enabled) {
//       const rules = sections.city_tax.calculation_rules || {};
      
//       if (rules.city_tax_amount) {
//         calculated.city_tax_total = F(evaluateFormula(rules.city_tax_amount, context));
//         context.city_tax_total = calculated.city_tax_total;
//       }
//     }

//     // Stamp tax
//     if (sections.stamp_tax?.enabled) {
//       const stampField = sections.stamp_tax.fields?.find(f => f.field_id === 'stamp_tax_amount');
//       if (stampField?.fixed_value) {
//         calculated.stamp_tax_total = F(D(stampField.fixed_value));
//         context.stamp_tax_total = calculated.stamp_tax_total;
//       }
//     }

//     // Other services total
//     if (sections.other_services?.enabled) {
//       const services = formValues.other_services || [];
//       const total = services.reduce((sum, s) => sum.plus(D(s.service_amount || 0)), D(0));
//       calculated.other_services_total = F(total);
//       context.other_services_total = calculated.other_services_total;
//     }

//     // Final calculations
//     const finalCalcs = hotelConfig.final_calculations || {};
//     Object.keys(finalCalcs).forEach(key => {
//       const formula = finalCalcs[key];
      
//       // Build context with all calculated values
//       const fullContext = {
//         ...context,
//         ...calculated,
//         accommodation: {
//           subtotal: calculated.accommodation_subtotal || 0,
//           vat_amount: calculated.accommodation_vat || 0,
//         },
//         city_tax: {
//           city_tax_amount: calculated.city_tax_total || 0,
//         },
//         stamp_tax: {
//           stamp_tax_amount: calculated.stamp_tax_total || 0,
//         },
//       };

//       calculated[key] = F(evaluateFormula(formula, fullContext));
//     });

//     setCalculatedValues(calculated);
//   }, [hotelConfig, formValues, evaluateFormula, F]);

//   return calculatedValues;
// };




// useDynamicCalculations.js final
// import { useState, useEffect, useCallback } from 'react';
// import Decimal from 'decimal.js';
// import { 
//   detectHotelType, 
//   calculateAccommodation, 
//   calculateServices, 
//   calculateFinalSummary 
// } from './invoiceCalculations';

// Decimal.set({
//   precision: 20,
//   rounding: Decimal.ROUND_HALF_UP,
// });

// /**
//  * Custom hook for dynamic invoice calculations
//  * Integrates with centralized calculation system
//  */
// export const useDynamicCalculations = (hotelConfig, formValues) => {
//   const [calculatedValues, setCalculatedValues] = useState({});
//   const DECIMAL_PLACES = 3;

//   const D = (v) => new Decimal(v || 0);
//   const F = (d) => d.toDecimalPlaces(DECIMAL_PLACES).toFixed(DECIMAL_PLACES);

//   // Calculate values based on hotel config
//   useEffect(() => {
//     if (!hotelConfig || !formValues) {
//       console.log('[useDynamicCalculations] Missing config or form values');
//       return;
//     }

//     console.log('[useDynamicCalculations] Starting calculations', {
//       hotel: hotelConfig.hotel_name,
//       formValues
//     });

//     try {
//       // Detect hotel type
//       const hotelType = detectHotelType(hotelConfig);
//       console.log('[useDynamicCalculations] Hotel type:', hotelType);

//       // Initialize calculated object
//       const calculated = {};

//       // Calculate nights from dates (universal for all hotels)
//       if (formValues.arrival_date && formValues.departure_date) {
//         const arrival = new Date(formValues.arrival_date);
//         const departure = new Date(formValues.departure_date);
//         const nights = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
//         calculated.total_nights = nights > 0 ? nights : 0;
//       }

//       // Get accommodation calculations from centralized system
//       const accCalc = calculateAccommodation(formValues, hotelType);
      
//       // Map accommodation calculations to hook format
//       if (hotelType === 'GRAND_ARAS') {
//         // Grand Aras specific mappings
//         calculated.eur_amount = F(D(accCalc.eurAmount));
//         calculated.exchange_rate = accCalc.exchangeRate.toFixed(4); // 4 decimals for exchange rate
//         calculated.room_amount_try = F(D(accCalc.roomAmountTry));
//         calculated.total_room_all_nights = F(D(accCalc.totalRoomAllNights));
//         calculated.taxable_amount_room = F(D(accCalc.taxableAmount));
//         calculated.vat_10_percent = F(D(accCalc.vat10Percent));
//         calculated.accommodation_tax = F(D(accCalc.accommodationTax));
        
//         // For compatibility
//         calculated.accommodation_subtotal = F(D(accCalc.totalRoomAllNights));
//         calculated.accommodation_vat = F(D(accCalc.vat10Percent));
//       } else {
//         // CVK specific mappings
//         calculated.eur_amount = F(D(accCalc.eurAmount));
//         calculated.exchange_rate = accCalc.exchangeRate.toFixed(4);
//         calculated.taxable_amount = F(D(accCalc.taxableAmount));
//         calculated.vat_10_percent = F(D(accCalc.vat10Percent));
//         calculated.accommodation_tax = F(D(accCalc.accommodationTax));
//         calculated.total_per_night = F(D(accCalc.totalPerNight));
//         calculated.vat_total_nights = F(D(accCalc.vatTotalNights));
//         calculated.acc_tax_total_nights = F(D(accCalc.accTaxTotalNights));
        
//         // For compatibility
//         calculated.accommodation_subtotal = F(D(accCalc.totalPerNight));
//         calculated.accommodation_vat = F(D(accCalc.vatTotalNights));
//       }

//       // Get services calculations from centralized system
//       const servicesCalc = calculateServices(formValues.other_services || []);
      
//       calculated.other_services_total = F(D(servicesCalc.totalGross));
//       calculated.other_services_taxable = F(D(servicesCalc.totalTaxable));
//       calculated.other_services_vat = F(D(servicesCalc.totalVat20));

//       // Get final summary from centralized system
//       const summary = calculateFinalSummary(formValues, hotelType);
      
//       // Map summary to hook format
//       Object.entries(summary).forEach(([key, value]) => {
//         calculated[key] = F(D(value));
//       });

//       // Additional calculated fields for compatibility
//       calculated.subtotal = calculated.total_amount || calculated.accommodation_subtotal || '0.000';
//       calculated.vat_total = calculated.total_vat || calculated.total_vat_10 || '0.000';
//       calculated.grand_total = calculated.grand_total || calculated.total_including_vat_kdv_dahil || '0.000';

//       console.log('[useDynamicCalculations] Calculated values:', calculated);
      
//       setCalculatedValues(calculated);
//     } catch (error) {
//       console.error('[useDynamicCalculations] Calculation error:', error);
//       setCalculatedValues({});
//     }
//   }, [hotelConfig, formValues, F, D]);

//   return calculatedValues;
// };

// /**
//  * Hook to get individual field calculations
//  * Useful for real-time field updates
//  */
// export const useFieldCalculation = (hotelConfig, formValues, fieldId) => {
//   const allCalculations = useDynamicCalculations(hotelConfig, formValues);
//   return allCalculations[fieldId] || null;
// };

// /**
//  * Hook to check if calculations are complete
//  */
// export const useCalculationStatus = (hotelConfig, formValues) => {
//   const [status, setStatus] = useState({
//     isComplete: false,
//     missingFields: [],
//     hasErrors: false
//   });

//   useEffect(() => {
//     if (!hotelConfig || !formValues) {
//       setStatus({
//         isComplete: false,
//         missingFields: ['hotel_config', 'form_values'],
//         hasErrors: false
//       });
//       return;
//     }

//     const missing = [];
    
//     // Check required fields
//     if (!formValues.arrival_date) missing.push('arrival_date');
//     if (!formValues.departure_date) missing.push('departure_date');
//     if (!formValues.guest_name) missing.push('guest_name');
    
//     // Check accommodation details
//     const acc = formValues.accommodation_details || {};
//     if (!acc.eur_amount || parseFloat(acc.eur_amount) === 0) missing.push('eur_amount');
//     if (!acc.exchange_rate || parseFloat(acc.exchange_rate) === 0) missing.push('exchange_rate');
    
//     setStatus({
//       isComplete: missing.length === 0,
//       missingFields: missing,
//       hasErrors: false
//     });
//   }, [hotelConfig, formValues]);

//   return status;
// };

// export default useDynamicCalculations;



// useDynamicCalculations.js
import { useState, useEffect, useCallback } from 'react';
import Decimal from 'decimal.js';
import { 
  detectHotelType, 
  calculateAccommodation, 
  calculateServices, 
  calculateFinalSummary 
} from './invoiceCalculations';

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

/**
 * Custom hook for dynamic invoice calculations
 * Integrates with centralized calculation system
 */
export const useDynamicCalculations = (hotelConfig, formValues) => {
  const [calculatedValues, setCalculatedValues] = useState({});
  const DECIMAL_PLACES = 3;

  const D = (v) => new Decimal(v || 0);
  const F = (d) => d.toDecimalPlaces(DECIMAL_PLACES).toFixed(DECIMAL_PLACES);

  // Calculate values based on hotel config
  useEffect(() => {
    if (!hotelConfig || !formValues) {
      console.log('[useDynamicCalculations] Missing config or form values');
      return;
    }

    console.log('[useDynamicCalculations] Starting calculations', {
      hotel: hotelConfig.hotel_name,
      formValues
    });

    try {
      // Detect hotel type
      const hotelType = detectHotelType(hotelConfig);
      console.log('[useDynamicCalculations] Hotel type:', hotelType);

      // Initialize calculated object
      const calculated = {};

      // Calculate nights from dates (universal for all hotels)
      if (formValues.arrival_date && formValues.departure_date) {
        const arrival = new Date(formValues.arrival_date);
        const departure = new Date(formValues.departure_date);
        const nights = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
        calculated.total_nights = nights > 0 ? nights : 0;
      }

      // Get accommodation calculations from centralized system
      const accCalc = calculateAccommodation(formValues, hotelType);
      
      // Map accommodation calculations to hook format
      if (hotelType === 'GRAND_ARAS' || hotelType === 'TRYP') {
        // Grand Aras & TRYP specific mappings (same structure)
        calculated.eur_amount = F(D(accCalc.eurAmount));
        calculated.exchange_rate = accCalc.exchangeRate.toFixed(4); // 4 decimals for exchange rate
        calculated.room_amount_try = F(D(accCalc.roomAmountTry));
        calculated.total_room_all_nights = F(D(accCalc.totalRoomAllNights));
        calculated.taxable_amount_room = F(D(accCalc.taxableAmount));
        calculated.vat_10_percent = F(D(accCalc.vat10Percent));
        calculated.accommodation_tax = F(D(accCalc.accommodationTax));
        
        // For compatibility
        calculated.accommodation_subtotal = F(D(accCalc.totalRoomAllNights));
        calculated.accommodation_vat = F(D(accCalc.vat10Percent));
      } else {
        // CVK specific mappings
        calculated.eur_amount = F(D(accCalc.eurAmount));
        calculated.exchange_rate = accCalc.exchangeRate.toFixed(4);
        calculated.taxable_amount = F(D(accCalc.taxableAmount));
        calculated.vat_10_percent = F(D(accCalc.vat10Percent));
        calculated.accommodation_tax = F(D(accCalc.accommodationTax));
        calculated.total_per_night = F(D(accCalc.totalPerNight));
        calculated.vat_total_nights = F(D(accCalc.vatTotalNights));
        calculated.acc_tax_total_nights = F(D(accCalc.accTaxTotalNights));
        
        // For compatibility
        calculated.accommodation_subtotal = F(D(accCalc.totalPerNight));
        calculated.accommodation_vat = F(D(accCalc.vatTotalNights));
      }

      // Get services calculations from centralized system
      const servicesCalc = calculateServices(formValues.other_services || []);
      
      calculated.other_services_total = F(D(servicesCalc.totalGross));
      calculated.other_services_taxable = F(D(servicesCalc.totalTaxable));
      calculated.other_services_vat = F(D(servicesCalc.totalVat20));

      // Get final summary from centralized system
      const summary = calculateFinalSummary(formValues, hotelType);
      
      // Map summary to hook format
      Object.entries(summary).forEach(([key, value]) => {
        calculated[key] = F(D(value));
      });

      // Additional calculated fields for compatibility
      calculated.subtotal = calculated.total_amount || calculated.accommodation_subtotal || '0.000';
      calculated.vat_total = calculated.total_vat || calculated.total_vat_10 || '0.000';
      calculated.grand_total = calculated.grand_total || calculated.total_including_vat_kdv_dahil || '0.000';

      console.log('[useDynamicCalculations] Calculated values:', calculated);
      
      setCalculatedValues(calculated);
    } catch (error) {
      console.error('[useDynamicCalculations] Calculation error:', error);
      setCalculatedValues({});
    }
  }, [hotelConfig, formValues, F, D]);

  return calculatedValues;
};

/**
 * Hook to get individual field calculations
 * Useful for real-time field updates
 */
export const useFieldCalculation = (hotelConfig, formValues, fieldId) => {
  const allCalculations = useDynamicCalculations(hotelConfig, formValues);
  return allCalculations[fieldId] || null;
};

/**
 * Hook to check if calculations are complete
 */
export const useCalculationStatus = (hotelConfig, formValues) => {
  const [status, setStatus] = useState({
    isComplete: false,
    missingFields: [],
    hasErrors: false
  });

  useEffect(() => {
    if (!hotelConfig || !formValues) {
      setStatus({
        isComplete: false,
        missingFields: ['hotel_config', 'form_values'],
        hasErrors: false
      });
      return;
    }

    const missing = [];
    
    // Check required fields
    if (!formValues.arrival_date) missing.push('arrival_date');
    if (!formValues.departure_date) missing.push('departure_date');
    if (!formValues.guest_name) missing.push('guest_name');
    
    // Check accommodation details
    const acc = formValues.accommodation_details || {};
    if (!acc.eur_amount || parseFloat(acc.eur_amount) === 0) missing.push('eur_amount');
    if (!acc.exchange_rate || parseFloat(acc.exchange_rate) === 0) missing.push('exchange_rate');
    
    setStatus({
      isComplete: missing.length === 0,
      missingFields: missing,
      hasErrors: false
    });
  }, [hotelConfig, formValues]);

  return status;
};

export default useDynamicCalculations;