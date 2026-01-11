import React, { useState, useEffect, useRef } from 'react';
import { FileText, Save, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DiagnosisNotes = ({ visitId, patientId, patientName, onSave }) => {
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

  const [expandedFields, setExpandedFields] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const contentEditableRefs = useRef({});

  // Auto-save logic: Debounced effect that saves notes when they change
  useEffect(() => {
    if (!hasUnsavedChanges || isInitialLoad) return;

    const saveTimer = setTimeout(async () => {
      try {
        console.log('[DEBUG-AUTO] Saving changes...');
        setIsSaving(true);
        await saveNotes();
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('[DEBUG-AUTO] Save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [notes, hasUnsavedChanges, isInitialLoad]);

  // Load existing notes when component mounts or visitId changes
  useEffect(() => {
    if (visitId) {
      console.log(`[DEBUG-LOAD] Initializing for visit ${visitId}`);
      loadExistingNotes();
    }
  }, [visitId]);

  // Special effect to update templates if patient name arrives after first render
  useEffect(() => {
    if (patientName && !isInitialLoad) {
      // Check if we are still using a generic "PATIENT" placeholder
      const isStillUsingPlaceholder = Object.values(notes).some(val => val.includes('PATIENT'));
      if (isStillUsingPlaceholder) {
        console.log('[DEBUG-NAME] Patient name arrived, updating templates...');
        applyTemplatesSilently();
      }
    }
  }, [patientName]);

  const loadExistingNotes = async () => {
    try {
      setIsSaving(true);
      const response = await api.get(`/doctors/visits/${visitId}/diagnosis-notes`);

      const serverNotes = response.data?.notes;
      const diagnosisFields = [
        'chiefComplaint', 'historyOfPresentIllness', 'pastMedicalHistory',
        'allergicHistory', 'physicalExamination', 'investigationFindings',
        'assessmentAndDiagnosis', 'treatmentPlan', 'treatmentGiven',
        'medicationIssued', 'additional', 'prognosis'
      ];

      const recordExists = serverNotes && (serverNotes.id || serverNotes.createdAt);
      const isRecordEmpty = !serverNotes || !diagnosisFields.some(field => serverNotes[field] && serverNotes[field].trim() !== '');

      if (recordExists && !isRecordEmpty) {
        const sanitizedNotes = diagnosisFields.reduce((acc, field) => {
          acc[field] = serverNotes[field] || '';
          return acc;
        }, {});
        setNotes(sanitizedNotes);
        setHasUnsavedChanges(false);
        setIsInitialLoad(false);
      } else {
        await applyTemplatesSilently();
      }
    } catch (error) {
      console.error('[DEBUG-LOAD] API Error:', error.message);
      await applyTemplatesSilently();
    } finally {
      setIsSaving(false);
    }
  };

  const applyTemplatesSilently = async () => {
    const newNotes = {};
    const fieldKeys = [
      'chiefComplaint', 'historyOfPresentIllness', 'pastMedicalHistory',
      'allergicHistory', 'physicalExamination', 'investigationFindings',
      'assessmentAndDiagnosis', 'treatmentPlan', 'treatmentGiven',
      'medicationIssued', 'additional', 'prognosis'
    ];

    fieldKeys.forEach(key => {
      newNotes[key] = getTemplate(key);
    });

    setNotes(newNotes);
    setHasUnsavedChanges(false);
    setIsInitialLoad(false);
    setExpandedFields({});

    try {
      await api.post(`/doctors/visits/${visitId}/diagnosis-notes`, {
        notes: newNotes
      });
    } catch (error) {
      console.error('[DEBUG-TPL] Persistence FAILED:', error);
    }
  };

  const getTemplate = (fieldKey) => {
    // Patient name will be displayed in bold using HTML
    const name = (patientName || 'PATIENT').toUpperCase();

    const templates = {
      chiefComplaint: `Patient ${name} presents with a primary complaint of: `,
      historyOfPresentIllness: `The clinical symptoms of ${name} started approximately [TIME] ago. The progression is described as: `,
      pastMedicalHistory: `${name} has a significant past medical history of: `,
      allergicHistory: `${name} has the following known allergies: `,
      physicalExamination: `On physical examination of ${name}, the following findings were observed: `,
      investigationFindings: `Detailed investigations for ${name} (Laboratory/Radiology) indicate: `,
      assessmentAndDiagnosis: `Clinical assessment of ${name} suggests a diagnosis of: `,
      treatmentPlan: `Management strategy for ${name} includes: `,
      treatmentGiven: `Initial treatment administered to ${name} during this visit: `,
      medicationIssued: `Past medications issued to ${name} include: `,
      additional: `Additional clinical notes for ${name}: `,
      prognosis: `The expected clinical outcome for ${name} is: `
    };
    return templates[fieldKey] || '';
  };

  // Convert plain text to HTML with bold patient name
  const formatTextWithBoldName = (text) => {
    if (!text || !patientName) return text || '';
    const name = patientName.toUpperCase();
    // Escape HTML in the text first
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Replace patient name with bold version
    const regex = new RegExp(`(${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapedText.replace(regex, '<strong>$1</strong>');
  };

  // Extract plain text from HTML contentEditable div
  const getPlainTextFromHtml = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const saveNotes = async () => {
    try {
      const response = await api.post(`/doctors/visits/${visitId}/diagnosis-notes`, {
        notes
      });
      if (onSave) onSave(response.data);
      return response.data;
    } catch (error) {
      console.error('[DEBUG-SAVE] Error:', error);
      throw error;
    }
  };

  const handleNoteChange = (field, value) => {
    setNotes(prev => ({ ...prev, [field]: value || '' }));
    setHasUnsavedChanges(true);
  };

  // Handle contentEditable input - extract plain text but don't reformat while typing
  const handleContentEditableInput = (field, e) => {
    const plainText = getPlainTextFromHtml(e.target.innerHTML);
    handleNoteChange(field, plainText);
    // Don't reformat while user is typing - we'll do that on blur
  };

  // Update contentEditable div when field is expanded
  const handleFieldExpand = (field) => {
    toggleFieldExpansion(field);
    // Set content after expansion animation
    setTimeout(() => {
      const ref = contentEditableRefs.current[field];
      if (ref) {
        const formattedHtml = formatTextWithBoldName(notes[field]);
        ref.innerHTML = formattedHtml || '<br>';
      }
    }, 50);
  };

  const toggleFieldExpansion = (field) => {
    setExpandedFields(prev => ({ ...prev, [field]: !prev[field] }));
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
    { key: 'medicationIssued', label: 'Past Medication Issued', placeholder: 'Medications prescribed and dispensed in previous visits...' },
    { key: 'additional', label: 'Additional Notes', placeholder: 'Any additional observations or notes...' },
    { key: 'prognosis', label: 'Prognosis', placeholder: 'Expected outcome and follow-up recommendations...' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6" style={{ color: '#2e13d1' }} />
          <div>
            <h3 className="text-xl font-semibold" style={{ color: '#0C0E0B' }}>
              Diagnosis & Notes
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {isSaving ? (
                <div className="flex items-center text-blue-600 text-xs animate-pulse">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-1.5"></div>
                  Saving updates...
                </div>
              ) : hasUnsavedChanges ? (
                <div className="flex items-center text-orange-500 text-xs">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></div>
                  Pending save
                </div>
              ) : (
                <div className="flex items-center text-green-600 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All changes saved
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {noteFields.map((field, index) => {
          const isExpanded = expandedFields[field.key];
          const value = notes[field.key];
          return (
            <div key={field.key} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => handleFieldExpand(field.key)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </span>
                  <label className="text-sm font-medium text-gray-700">{field.label}</label>
                </div>
                {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
              </button>

              {isExpanded && (
                <div className="p-4 bg-white">
                  <div
                    ref={(el) => { contentEditableRefs.current[field.key] = el; }}
                    contentEditable
                    onInput={(e) => handleContentEditableInput(field.key, e)}
                    onBlur={(e) => {
                      // Extract plain text and save
                      const plainText = getPlainTextFromHtml(e.target.innerHTML);
                      if (notes[field.key] !== plainText) {
                        handleNoteChange(field.key, plainText);
                      }
                      // Reformat with bold names after saving
                      const formattedHtml = formatTextWithBoldName(plainText);
                      e.target.innerHTML = formattedHtml || '<br>';
                    }}
                    data-placeholder={field.placeholder}
                    className="w-full resize-none border border-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm min-h-[150px] overflow-y-auto"
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}
                    suppressContentEditableWarning={true}
                  />
                  <style>{`
                    [contenteditable][data-placeholder]:empty:before {
                      content: attr(data-placeholder);
                      color: #9ca3af;
                      pointer-events: none;
                    }
                  `}</style>
                  <div className="mt-2 text-xs text-gray-500">{value ? `${value.length} characters` : 'Empty'}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DiagnosisNotes;
