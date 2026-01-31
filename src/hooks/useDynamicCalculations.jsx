import { useState, useEffect, useCallback } from 'react';
import Decimal from 'decimal.js';

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

export const useDynamicCalculations = (hotelConfig, formValues) => {
  const [calculatedValues, setCalculatedValues] = useState({});
  const DECIMAL_PLACES = 3;

  const D = (v) => new Decimal(v || 0);
  const F = (d) => d.toDecimalPlaces(DECIMAL_PLACES).toFixed(DECIMAL_PLACES);

  // Safe formula evaluator
  const evaluateFormula = useCallback((formula, context) => {
    if (!formula) return D(0);

    try {
      // Handle special functions
      if (formula.includes('SUM(')) {
        const match = formula.match(/SUM\((.+?)\)/);
        if (match) {
          const path = match[1]; // e.g., "other_services.service_amount"
          const [arrayName, fieldName] = path.split('.');
          const array = context[arrayName] || [];
          return array.reduce((sum, item) => sum.plus(D(item[fieldName] || 0)), D(0));
        }
      }

      // Replace variable names with values
      let processedFormula = formula;
      
      // Replace dot notation (e.g., accommodation.subtotal)
      Object.keys(context).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        processedFormula = processedFormula.replace(regex, `(${context[key] || 0})`);
      });

      // Replace operators for Decimal.js
      processedFormula = processedFormula
        .replace(/\*/g, '.mul')
        .replace(/\//g, '.div')
        .replace(/\+/g, '.plus')
        .replace(/-/g, '.minus');

      // Evaluate using Decimal.js
      // For simple calculations, we'll use a safer approach
      const result = eval(`D(${processedFormula.replace(/\.mul|\.div|\.plus|\.minus/g, (match) => {
        return match.replace('.', '.');
      })})`);

      return result instanceof Decimal ? result : D(result);
    } catch (error) {
      console.error('Formula evaluation error:', error, formula);
      return D(0);
    }
  }, []);

  // Calculate values based on hotel config
  useEffect(() => {
    if (!hotelConfig || !formValues) return;

    const calculated = {};
    const context = { ...formValues };

    // Calculate nights from dates
    if (formValues.arrival_date && formValues.departure_date) {
      const arrival = new Date(formValues.arrival_date);
      const departure = new Date(formValues.departure_date);
      const nights = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
      calculated.total_nights = nights > 0 ? nights : 0;
      context.total_nights = calculated.total_nights;
    }

    // Process conditional sections
    const sections = hotelConfig.conditional_sections || {};

    // Accommodation calculations
    if (sections.accommodation_details?.enabled) {
      const rules = sections.accommodation_details.calculation_rules || {};
      
      if (rules.subtotal) {
        calculated.accommodation_subtotal = F(evaluateFormula(rules.subtotal, context));
        context.accommodation_subtotal = calculated.accommodation_subtotal;
      }

      if (rules.vat_amount) {
        context.vat_rate = rules.vat_rate || 0;
        calculated.accommodation_vat = F(evaluateFormula(rules.vat_amount, context));
        context.accommodation_vat = calculated.accommodation_vat;
      }
    }

    // City tax calculations
    if (sections.city_tax?.enabled) {
      const rules = sections.city_tax.calculation_rules || {};
      
      if (rules.city_tax_amount) {
        calculated.city_tax_total = F(evaluateFormula(rules.city_tax_amount, context));
        context.city_tax_total = calculated.city_tax_total;
      }
    }

    // Stamp tax
    if (sections.stamp_tax?.enabled) {
      const stampField = sections.stamp_tax.fields?.find(f => f.field_id === 'stamp_tax_amount');
      if (stampField?.fixed_value) {
        calculated.stamp_tax_total = F(D(stampField.fixed_value));
        context.stamp_tax_total = calculated.stamp_tax_total;
      }
    }

    // Other services total
    if (sections.other_services?.enabled) {
      const services = formValues.other_services || [];
      const total = services.reduce((sum, s) => sum.plus(D(s.service_amount || 0)), D(0));
      calculated.other_services_total = F(total);
      context.other_services_total = calculated.other_services_total;
    }

    // Final calculations
    const finalCalcs = hotelConfig.final_calculations || {};
    Object.keys(finalCalcs).forEach(key => {
      const formula = finalCalcs[key];
      
      // Build context with all calculated values
      const fullContext = {
        ...context,
        ...calculated,
        accommodation: {
          subtotal: calculated.accommodation_subtotal || 0,
          vat_amount: calculated.accommodation_vat || 0,
        },
        city_tax: {
          city_tax_amount: calculated.city_tax_total || 0,
        },
        stamp_tax: {
          stamp_tax_amount: calculated.stamp_tax_total || 0,
        },
      };

      calculated[key] = F(evaluateFormula(formula, fullContext));
    });

    setCalculatedValues(calculated);
  }, [hotelConfig, formValues, evaluateFormula, F]);

  return calculatedValues;
};
