import React, { useState, useEffect } from 'react';
import { TestTube, AlertTriangle, CheckCircle, Save, Eye, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DynamicLabForm = ({ labOrderId, template, onSubmit, onClose, initialData = {}, isDraft = false }) => {
  const [formData, setFormData] = useState({});
  const [warnings, setWarnings] = useState({});
  const [loading, setLoading] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    // Initialize form data with empty values for all fields
    const initialFormData = {};
    template.fields.forEach(field => {
      initialFormData[field.name] = initialData[field.name] || '';
    });
    setFormData(initialFormData);
  }, [template.id]); // Only depend on template.id to avoid infinite loops

  const validateField = (field, value) => {
    const fieldWarnings = [];

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      fieldWarnings.push(`${field.label} is required`);
    }

    // Validate number fields
    if (field.type === 'number' && value !== undefined && value !== null && value !== '') {
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        fieldWarnings.push(`${field.label} must be a valid number`);
      } else {
        if (field.min !== undefined && numValue < field.min) {
          fieldWarnings.push(`Value (${numValue}) is below normal range (${field.min}-${field.max})`);
        }
        if (field.max !== undefined && numValue > field.max) {
          fieldWarnings.push(`Value (${numValue}) is above normal range (${field.min}-${field.max})`);
        }
      }
    }

    // Validate select fields
    if (field.type === 'select' && field.options && value && !field.options.includes(value)) {
      fieldWarnings.push(`Must be one of: ${field.options.join(', ')}`);
    }

    return fieldWarnings;
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field.name]: value }));
    
    // Validate field and update warnings
    const fieldWarnings = validateField(field, value);
    setWarnings(prev => ({
      ...prev,
      [field.name]: fieldWarnings
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check for any validation errors
      const hasErrors = Object.values(warnings).some(warningArray => warningArray.length > 0);
      const hasRequiredErrors = template.fields.some(field => 
        field.required && (!formData[field.name] || formData[field.name] === '')
      );

      if (hasRequiredErrors) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Show warning if there are validation warnings but allow submission
      if (hasErrors) {
        const confirmSubmit = window.confirm(
          'Some values are outside normal ranges. Are you sure you want to submit these results?'
        );
        if (!confirmSubmit) {
          setLoading(false);
          return;
        }
      }

      const resultData = {
        labOrderId: parseInt(labOrderId),
        templateId: template.id,
        results: formData,
        additionalNotes: additionalNotes
      };

      if (isDraft) {
        // For draft mode, just call onSubmit with the data
        if (onSubmit) {
          onSubmit(resultData);
        }
        toast.success('Draft saved successfully!');
      } else {
        // For final submission
        await api.post('/labs/results/detailed', resultData);
        toast.success('Lab results submitted successfully!');
        
        if (onSubmit) {
          onSubmit(resultData);
        }
      }
      
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error submitting lab results:', error);
      toast.error(error.response?.data?.error || 'Failed to submit lab results');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field, index) => {
    const value = formData[field.name] || '';
    const fieldWarnings = warnings[field.name] || [];

    return (
      <div key={`${field.name}-${index}`} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {field.unit && <span className="text-gray-500 ml-1">({field.unit})</span>}
        </label>
        
        {field.normalRange && (
          <p className="text-xs text-gray-500 mb-2">Normal range: {field.normalRange}</p>
        )}

        {field.type === 'number' ? (
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step || 0.1}
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldWarnings.length > 0 ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            autoComplete="off"
          />
        ) : field.type === 'select' ? (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldWarnings.length > 0 ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select {field.label}</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldWarnings.length > 0 ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            autoComplete="off"
          />
        )}

        {fieldWarnings.length > 0 && (
          <div className="mt-1 flex items-center text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4 mr-1" />
            <span>{fieldWarnings[0]}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TestTube className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">{template.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {template.description && (
        <p className="text-gray-600 mb-6">{template.description}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {template.fields.map((field, index) => renderField(field, index))}
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional observations or notes..."
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isDraft ? 'Saving...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isDraft ? 'Save Draft' : 'Submit Results'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DynamicLabForm;
