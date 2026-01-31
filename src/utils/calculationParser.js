/**
 * Safe calculation parser - NO eval()!
 * Handles: +, -, *, /, (), decimal numbers, field references, and functions like SUM()
 */

export class CalculationParser {
  constructor(formData) {
    this.formData = formData;
  }

  // Main parse function
  parse(expression) {
    try {
      if (!expression || typeof expression !== 'string') {
        return 0;
      }

      console.log('📊 Parsing expression:', expression);
      
      // Replace field references with actual values
      const resolved = this.resolveFieldReferences(expression);
      console.log('  → After field resolution:', resolved);
      
      // Handle special functions (SUM, AVG, etc.)
      const withFunctions = this.resolveFunctions(resolved);
      console.log('  → After function resolution:', withFunctions);
      
      // Parse and calculate
      const result = this.calculate(withFunctions);
      console.log('  ✅ Result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Calculation error for expression:', expression, error);
      return 0;
    }
  }

  // Resolve field references like "room_rate" or "accommodation.vat_amount"
  resolveFieldReferences(expression) {
    let result = expression;
    
    // Match field patterns: word.word or just word
    const fieldPattern = /([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/g;
    
    const matches = [...expression.matchAll(fieldPattern)];
    
    for (const match of matches) {
      const fieldPath = match[0];
      
      // Skip if it's a function name
      if (['SUM', 'AVG', 'MAX', 'MIN', 'COUNT'].includes(fieldPath)) {
        continue;
      }
      
      // Get value from formData
      const value = this.getValueByPath(fieldPath);
      
      console.log(`    Field "${fieldPath}" = ${value}`);
      
      // Replace in expression (use word boundaries to avoid partial replacements)
      result = result.replace(
        new RegExp(`\\b${fieldPath.replace(/\./g, '\\.')}\\b`, 'g'), 
        value
      );
    }
    
    return result;
  }

  // Get value from nested object path
  getValueByPath(path) {
    const parts = path.split('.');
    let value = this.formData;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return 0;
      }
      value = value[part];
    }
    
    // Convert to number
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  // Handle SUM, AVG, etc.
  resolveFunctions(expression) {
    let result = expression;
    
    // SUM(array.field) pattern
    const sumPattern = /SUM\(([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\)/g;
    
    result = result.replace(sumPattern, (match, path) => {
      const [arrayName, fieldName] = path.split('.');
      const array = this.formData[arrayName];
      
      if (!Array.isArray(array)) {
        console.log(`    SUM: "${arrayName}" is not an array`);
        return '0';
      }
      
      const sum = array.reduce((total, item) => {
        const val = parseFloat(item[fieldName]);
        return total + (isNaN(val) ? 0 : val);
      }, 0);
      
      console.log(`    SUM(${path}) = ${sum} (from ${array.length} items)`);
      
      return sum.toString();
    });

    // AVG(array.field) pattern
    const avgPattern = /AVG\(([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\)/g;
    
    result = result.replace(avgPattern, (match, path) => {
      const [arrayName, fieldName] = path.split('.');
      const array = this.formData[arrayName];
      
      if (!Array.isArray(array) || array.length === 0) {
        return '0';
      }
      
      const sum = array.reduce((total, item) => {
        const val = parseFloat(item[fieldName]);
        return total + (isNaN(val) ? 0 : val);
      }, 0);
      
      const avg = sum / array.length;
      console.log(`    AVG(${path}) = ${avg}`);
      
      return avg.toString();
    });

    // COUNT(array) pattern
    const countPattern = /COUNT\(([a-zA-Z_][a-zA-Z0-9_]*)\)/g;
    
    result = result.replace(countPattern, (match, arrayName) => {
      const array = this.formData[arrayName];
      
      if (!Array.isArray(array)) {
        return '0';
      }
      
      console.log(`    COUNT(${arrayName}) = ${array.length}`);
      return array.length.toString();
    });
    
    return result;
  }

  // Safe calculation without eval
  calculate(expression) {
    // Remove all whitespace
    const clean = expression.replace(/\s+/g, '');
    
    try {
      const result = this.parseExpression(clean);
      return parseFloat(result.toFixed(3)); // Round to 3 decimals
    } catch (error) {
      console.error('Parse error:', expression, error);
      return 0;
    }
  }

  // Recursive descent parser - Entry point
  parseExpression(expr) {
    return this.parseAddSub(expr, { pos: 0 });
  }

  // Parse addition and subtraction (lowest precedence)
  parseAddSub(expr, state) {
    let result = this.parseMulDiv(expr, state);
    
    while (state.pos < expr.length) {
      const char = expr[state.pos];
      
      if (char === '+') {
        state.pos++;
        result += this.parseMulDiv(expr, state);
      } else if (char === '-') {
        state.pos++;
        result -= this.parseMulDiv(expr, state);
      } else {
        break;
      }
    }
    
    return result;
  }

  // Parse multiplication and division (higher precedence)
  parseMulDiv(expr, state) {
    let result = this.parsePrimary(expr, state);
    
    while (state.pos < expr.length) {
      const char = expr[state.pos];
      
      if (char === '*') {
        state.pos++;
        result *= this.parsePrimary(expr, state);
      } else if (char === '/') {
        state.pos++;
        const divisor = this.parsePrimary(expr, state);
        result = divisor !== 0 ? result / divisor : 0;
      } else {
        break;
      }
    }
    
    return result;
  }

  // Parse primary expressions (numbers and parentheses)
  parsePrimary(expr, state) {
    // Skip whitespace
    while (state.pos < expr.length && expr[state.pos] === ' ') {
      state.pos++;
    }

    // Handle parentheses
    if (expr[state.pos] === '(') {
      state.pos++; // skip '('
      const result = this.parseAddSub(expr, state);
      state.pos++; // skip ')'
      return result;
    }
    
    // Handle negative numbers
    if (expr[state.pos] === '-') {
      state.pos++;
      return -this.parsePrimary(expr, state);
    }

    // Parse number
    let numStr = '';
    while (state.pos < expr.length) {
      const char = expr[state.pos];
      if ((char >= '0' && char <= '9') || char === '.') {
        numStr += char;
        state.pos++;
      } else {
        break;
      }
    }
    
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
  }
}

// Helper function for easy use
export const calculateExpression = (expression, formData) => {
  const parser = new CalculationParser(formData);
  return parser.parse(expression);
};

// Export default
export default CalculationParser;
