/**
 * Extract default values from lab test result fields based on normalRange and field type
 * This allows forms to be pre-filled with typical/average values
 */

import { parseNormalRange } from './normalRangeParser';

/**
 * Get default value for a lab test result field
 * @param {Object} field - LabTestResultField object with fieldType, normalRange, options, etc.
 * @returns {string|number|null} - Default value for the field
 */
export const getDefaultValueForField = (field) => {
  if (!field) return null;

  const { fieldType, normalRange, options } = field;

  switch (fieldType) {
    case 'number':
      // For number fields, extract midpoint from normalRange if available
      if (normalRange) {
        const parsed = parseNormalRange(normalRange);
        
        if (parsed.operator === 'range' && parsed.min !== null && parsed.max !== null) {
          // Calculate midpoint of the range
          const midpoint = (parsed.min + parsed.max) / 2;
          // Round to 1 decimal place for cleaner display
          return parseFloat(midpoint.toFixed(1));
        } else if (parsed.operator === '>' && parsed.min !== null) {
          // For ">value", use a value slightly above the minimum
          return parseFloat((parsed.min * 1.1).toFixed(1));
        } else if (parsed.operator === '>=' && parsed.min !== null) {
          // For ">=value", use a value slightly above the minimum
          return parseFloat((parsed.min * 1.1).toFixed(1));
        } else if (parsed.operator === '<' && parsed.max !== null) {
          // For "<value", use a value slightly below the maximum
          return parseFloat((parsed.max * 0.9).toFixed(1));
        } else if (parsed.operator === '<=' && parsed.max !== null) {
          // For "<=value", use a value slightly below the maximum
          return parseFloat((parsed.max * 0.9).toFixed(1));
        } else if (parsed.min !== null && parsed.max !== null && parsed.operator === 'approx') {
          // For approximate values, use the midpoint
          const midpoint = (parsed.min + parsed.max) / 2;
          return parseFloat(midpoint.toFixed(1));
        }
      }
      // No normalRange or couldn't parse - return null (no default)
      return null;

    case 'select':
    case 'binary':
      // For select/binary fields, use first option if available
      if (options) {
        let optionsList = [];
        if (typeof options === 'string') {
          try {
            optionsList = JSON.parse(options);
          } catch (e) {
            console.error('Error parsing options:', e);
            return null;
          }
        } else if (Array.isArray(options)) {
          optionsList = options;
        }
        
        if (optionsList.length > 0) {
          // For binary fields, prefer "Negative" as default, otherwise first option
          if (fieldType === 'binary') {
            const negativeIndex = optionsList.findIndex(opt => 
              typeof opt === 'string' && opt.toLowerCase().includes('negative')
            );
            return negativeIndex >= 0 ? optionsList[negativeIndex] : optionsList[0];
          }
          return optionsList[0];
        }
      }
      return null;

    case 'text':
    case 'textarea':
      // Text fields don't have meaningful defaults
      return null;

    default:
      return null;
  }
};

/**
 * Generate default results object for a lab test based on its resultFields
 * @param {Array} resultFields - Array of LabTestResultField objects
 * @returns {Object} - Object with fieldName as keys and default values as values
 */
export const generateDefaultResults = (resultFields) => {
  if (!resultFields || !Array.isArray(resultFields)) {
    return {};
  }

  const defaults = {};
  resultFields.forEach(field => {
    const defaultValue = getDefaultValueForField(field);
    if (defaultValue !== null && defaultValue !== undefined) {
      defaults[field.fieldName] = defaultValue;
    }
  });

  return defaults;
};


