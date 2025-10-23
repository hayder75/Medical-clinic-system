import React, { useState, useEffect, useRef } from 'react';
import { FileText, Save, Expand, Minimize, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DiagnosisNotes = ({ visitId, patientId, onSave }) => {
  const [notes, setNotes] = useState({
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    allergicHistory: '',
    physicalExamination: '',
    investigationFindings: '',
    assessmentAndDiagnosis: '',
    treatmentPlan: '',
    treatmentGiven: '',
    medicationIssued: '',
    additional: '',
    prognosis: ''
  });

  // Debug logging (can be removed in production)
  console.log('🔍 Component initialized with notes:', notes);

  const [expandedFields, setExpandedFields] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load existing notes when component mounts
  useEffect(() => {
    loadExistingNotes();
  }, [visitId]);

  const loadExistingNotes = async () => {
    try {
      const response = await api.get(`/doctors/visits/${visitId}/diagnosis-notes`);

      if (response.data.notes) {
        // Only include actual diagnosis note fields (exclude metadata)
        const diagnosisFields = [
          'chiefComplaint', 'historyOfPresentIllness', 'pastMedicalHistory',
          'allergicHistory', 'physicalExamination', 'investigationFindings',
          'assessmentAndDiagnosis', 'treatmentPlan', 'treatmentGiven',
          'medicationIssued', 'additional', 'prognosis'
        ];
        
        const sanitizedNotes = diagnosisFields.reduce((acc, field) => {
          acc[field] = response.data.notes[field] || '';
          return acc;
        }, {});
        
        setNotes(prev => ({
          ...prev,
          ...sanitizedNotes
        }));
        console.log('✅ Loaded existing diagnosis notes');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('No existing notes found, starting fresh');
      } else {
        console.error('Failed to load existing notes:', error.response?.status || error.message);
      }
    }
  };


  const saveNotes = async () => {
    try {
      const response = await api.post(`/doctors/visits/${visitId}/diagnosis-notes`, {
        notes
      });

      if (onSave) {
        onSave(response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  };

  const handleManualSave = async () => {
    try {
      setIsSaving(true);
      await saveNotes();
      setHasUnsavedChanges(false);
      toast.success('Notes saved successfully');
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNoteChange = (field, value) => {
    // Ensure value is always a string
    const safeValue = value || '';
    
    setNotes(prev => ({
      ...prev,
      [field]: safeValue
    }));
    setHasUnsavedChanges(true);
  };

  const toggleFieldExpansion = (field) => {
    setExpandedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getTextAreaHeight = (value, isExpanded) => {
    const baseHeight = 200; // Default size is now what was previously "expanded"
    const expandedHeight = 300; // Expand button makes it even larger
    const autoHeight = Math.max(baseHeight, Math.min(400, value.split('\n').length * 25 + 30));
    
    return isExpanded ? Math.max(expandedHeight, autoHeight) : Math.min(baseHeight, autoHeight);
  };

  const noteFields = [
    { key: 'chiefComplaint', label: 'Chief Complaint', placeholder: 'Enter the main reason for the visit...' },
    { key: 'historyOfPresentIllness', label: 'History of Present Illness', placeholder: 'Describe the progression and details of the current condition...' },
    { key: 'pastMedicalHistory', label: 'Past Medical History', placeholder: 'Previous medical conditions, surgeries, hospitalizations...' },
    { key: 'allergicHistory', label: 'Allergic History', placeholder: 'Known allergies to medications, foods, or other substances...' },
    { key: 'physicalExamination', label: 'Physical Examination', placeholder: 'Findings from physical examination...' },
    { key: 'investigationFindings', label: 'Investigation Findings', placeholder: 'Results from lab tests, radiology, and other investigations...' },
    { key: 'assessmentAndDiagnosis', label: 'Assessment and Diagnosis', placeholder: 'Clinical assessment and final diagnosis...' },
    { key: 'treatmentPlan', label: 'Treatment Plan', placeholder: 'Planned treatment approach and management strategy...' },
    { key: 'treatmentGiven', label: 'Treatment Given', placeholder: 'Treatments administered during this visit...' },
    { key: 'medicationIssued', label: 'Medication Issued', placeholder: 'Medications prescribed and dispensed...' },
    { key: 'additional', label: 'Additional Notes', placeholder: 'Any additional observations or notes...' },
    { key: 'prognosis', label: 'Prognosis', placeholder: 'Expected outcome and follow-up recommendations...' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6" style={{ color: '#2e13d1' }} />
          <h3 className="text-xl font-semibold" style={{ color: '#0C0E0B' }}>
            Diagnosis & Notes
          </h3>
        </div>
        
        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-600 flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              Unsaved changes
            </span>
          )}
          
          {isSaving && (
            <span className="text-sm text-blue-600 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              Saving...
            </span>
          )}
          
          <button
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {noteFields.map((field, index) => {
          const isExpanded = expandedFields[field.key];
          const value = notes[field.key];
          const height = getTextAreaHeight(value, isExpanded);

          return (
            <div key={field.key} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                    {index + 1}
                  </span>
                  {field.label}
                </label>
                
                <button
                  onClick={() => toggleFieldExpansion(field.key)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={isExpanded ? 'Minimize' : 'Expand'}
                >
                  {isExpanded ? (
                    <Minimize className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Expand className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>

              <textarea
                value={value}
                onChange={(e) => handleNoteChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full resize-none border border-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                style={{
                  height: `${height}px`,
                  minHeight: '200px',
                  maxHeight: isExpanded ? '400px' : '300px'
                }}
                onInput={(e) => {
                  // Auto-resize based on content
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.max(200, Math.min(isExpanded ? 400 : 300, e.target.scrollHeight))}px`;
                }}
              />
              
              {value && (
                <div className="mt-2 text-xs text-gray-500">
                  {value.length} characters
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Click "Save" to save your notes to the patient's medical history
          </div>
          <div className="flex items-center space-x-4">
            <span>Total characters: {Object.values(notes).join('').length}</span>
            <span>Fields filled: {Object.values(notes).filter(note => note && note.trim()).length}/12</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisNotes;
