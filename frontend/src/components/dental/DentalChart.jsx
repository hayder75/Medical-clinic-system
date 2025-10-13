import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DentalChart = forwardRef(({ patientId, visitId, onSave, initialData = null }, ref) => {
  const [toothChart, setToothChart] = useState({});
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [painFlags, setPainFlags] = useState({});
  const [gumCondition, setGumCondition] = useState('');
  const [oralHygiene, setOralHygiene] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentTooth, setCurrentTooth] = useState(null);

  // FDI tooth numbering system (11-18, 21-28, 31-38, 41-48)
  const toothNumbers = [
    // Upper jaw (right to left)
    18, 17, 16, 15, 14, 13, 12, 11,
    21, 22, 23, 24, 25, 26, 27, 28,
    // Lower jaw (left to right)
    38, 37, 36, 35, 34, 33, 32, 31,
    41, 42, 43, 44, 45, 46, 47, 48
  ];

  const toothStatuses = {
    HEALTHY: { color: '#10B981', label: 'Healthy' },
    DECAY: { color: '#EF4444', label: 'Decay' },
    FILLED: { color: '#3B82F6', label: 'Filled' },
    ROOT_CANAL: { color: '#8B5CF6', label: 'Root Canal' },
    MISSING: { color: '#6B7280', label: 'Missing' },
    IMPACTED: { color: '#F59E0B', label: 'Impacted' },
    EXTRACTED: { color: '#DC2626', label: 'Extracted' }
  };

  const toothSurfaces = {
    11: ['Mesial', 'Distal', 'Buccal', 'Lingual', 'Occlusal'],
    12: ['Mesial', 'Distal', 'Buccal', 'Lingual', 'Occlusal'],
    13: ['Mesial', 'Distal', 'Buccal', 'Lingual', 'Occlusal'],
    14: ['Mesial', 'Distal', 'Buccal', 'Lingual', 'Occlusal'],
    15: ['Mesial', 'Distal', 'Buccal', 'Lingual', 'Occlusal'],
    16: ['Mesial', 'Distal', 'Buccal', 'Lingual', 'Occlusal'],
    17: ['Mesial', 'Distal', 'Buccal', 'Lingual', 'Occlusal'],
    18: ['Mesial', 'Distal', 'Buccal', 'Lingual', 'Occlusal'],
    // Add more tooth-specific surfaces as needed
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getCurrentData: () => ({
      toothChart,
      painFlags,
      gumCondition,
      oralHygiene,
      notes
    })
  }));

  useEffect(() => {
    if (initialData) {
      setToothChart(initialData.toothChart || {});
      setPainFlags(initialData.painFlags || {});
      setGumCondition(initialData.gumCondition || '');
      setOralHygiene(initialData.oralHygiene || '');
      setNotes(initialData.notes || '');
    } else {
      // Initialize empty chart
      const emptyChart = {};
      toothNumbers.forEach(tooth => {
        emptyChart[tooth] = {
          status: 'HEALTHY',
          notes: '',
          surfaces: []
        };
      });
      setToothChart(emptyChart);
    }
  }, [initialData]);

  const handleToothClick = (toothNumber) => {
    setCurrentTooth(toothNumber);
    setShowStatusModal(true);
  };

  const handleToothStatusChange = (toothNumber, status, notes = '', surfaces = []) => {
    setToothChart(prev => ({
      ...prev,
      [toothNumber]: {
        status,
        notes,
        surfaces
      }
    }));
    setShowStatusModal(false);
  };

  const handlePainFlagToggle = (toothNumber) => {
    setPainFlags(prev => ({
      ...prev,
      [toothNumber]: prev[toothNumber] ? null : { level: 5, type: 'sharp' }
    }));
  };

  const handleMultiSelect = (toothNumber) => {
    setSelectedTeeth(prev => {
      if (prev.includes(toothNumber)) {
        return prev.filter(t => t !== toothNumber);
      } else {
        return [...prev, toothNumber];
      }
    });
  };

  const handleBulkStatusChange = (status) => {
    selectedTeeth.forEach(toothNumber => {
      setToothChart(prev => ({
        ...prev,
        [toothNumber]: {
          ...prev[toothNumber],
          status
        }
      }));
    });
    setSelectedTeeth([]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const dentalData = {
        patientId,
        visitId: visitId ? parseInt(visitId) : undefined,
        toothChart,
        painFlags,
        gumCondition,
        oralHygiene,
        notes
      };

      const response = await api.post('/dental/records', dentalData);
      toast.success('Dental chart saved successfully');
      if (onSave) onSave(response.data.dentalRecord);
    } catch (error) {
      console.error('Error saving dental chart:', error);
      toast.error('Failed to save dental chart');
    } finally {
      setLoading(false);
    }
  };

  const renderTooth = (toothNumber) => {
    const toothData = toothChart[toothNumber] || { status: 'HEALTHY', notes: '', surfaces: [] };
    const status = toothData.status;
    const hasPain = painFlags[toothNumber];
    const isSelected = selectedTeeth.includes(toothNumber);

    return (
      <div
        key={toothNumber}
        className={`
          relative w-12 h-12 border-2 rounded-lg cursor-pointer transition-all duration-200
          ${isSelected ? 'border-blue-500 bg-blue-100' : 'border-gray-300 hover:border-gray-400'}
          ${hasPain ? 'ring-2 ring-red-400' : ''}
        `}
        style={{ backgroundColor: toothStatuses[status]?.color + '20' }}
        onClick={() => handleToothClick(toothNumber)}
        onContextMenu={(e) => {
          e.preventDefault();
          handlePainFlagToggle(toothNumber);
        }}
      >
        {/* Tooth number */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700">
          {toothNumber}
        </div>
        
        {/* Status indicator */}
        <div 
          className="w-full h-full rounded-lg flex items-center justify-center"
          style={{ backgroundColor: toothStatuses[status]?.color }}
        >
          <span className="text-white text-xs font-bold">
            {toothNumber.toString().slice(-1)}
          </span>
        </div>

        {/* Pain flag */}
        {hasPain && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">!</span>
          </div>
        )}

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          Tooth {toothNumber}: {toothStatuses[status]?.label}
          {toothData.notes && <div>Notes: {toothData.notes}</div>}
          {hasPain && <div>Pain Level: {hasPain.level}/10</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Dental Chart</h3>
        <div className="flex space-x-2">
          {selectedTeeth.length > 0 && (
            <div className="flex space-x-1">
              <button
                onClick={() => handleBulkStatusChange('DECAY')}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Mark Decay
              </button>
              <button
                onClick={() => handleBulkStatusChange('FILLED')}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Mark Filled
              </button>
              <button
                onClick={() => setSelectedTeeth([])}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
              >
                Clear Selection
              </button>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Chart'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Status Legend:</h4>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(toothStatuses).map(([status, config]) => (
            <div key={status} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: config.color }}
              ></div>
              <span className="text-sm text-gray-700">{config.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <p>• Click tooth to change status</p>
          <p>• Right-click to toggle pain flag</p>
          <p>• Ctrl+Click for multi-select</p>
        </div>
      </div>

      {/* Dental Chart */}
      <div className="space-y-16">
        {/* Upper jaw */}
        <div className="text-center">
          <h4 className="text-sm font-medium text-gray-700 mb-10">Upper Jaw</h4>
          <div className="flex justify-center space-x-1">
            {toothNumbers.slice(0, 16).map(renderTooth)}
          </div>
        </div>

        {/* Lower jaw */}
        <div className="text-center">
          <h4 className="text-sm font-medium text-gray-700 mb-10">Lower Jaw</h4>
          <div className="flex justify-center space-x-1">
            {toothNumbers.slice(16, 32).map(renderTooth)}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gum Condition
          </label>
          <select
            value={gumCondition}
            onChange={(e) => setGumCondition(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select condition</option>
            <option value="Healthy">Healthy</option>
            <option value="Gingivitis">Gingivitis</option>
            <option value="Periodontitis">Periodontitis</option>
            <option value="Receding">Receding</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Oral Hygiene
          </label>
          <select
            value={oralHygiene}
            onChange={(e) => setOralHygiene(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select hygiene level</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          General Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Additional dental notes..."
        />
      </div>

      {/* Tooth Status Modal */}
      {showStatusModal && (
        <ToothStatusModal
          toothNumber={currentTooth}
          currentData={toothChart[currentTooth]}
          onClose={() => setShowStatusModal(false)}
          onSave={handleToothStatusChange}
          surfaces={toothSurfaces[currentTooth] || []}
        />
      )}
    </div>
  );
});

// Tooth Status Modal Component
const ToothStatusModal = ({ toothNumber, currentData, onClose, onSave, surfaces }) => {
  const [status, setStatus] = useState(currentData?.status || 'HEALTHY');
  const [notes, setNotes] = useState(currentData?.notes || '');
  const [selectedSurfaces, setSelectedSurfaces] = useState(currentData?.surfaces || []);

  const handleSurfaceToggle = (surface) => {
    setSelectedSurfaces(prev => 
      prev.includes(surface) 
        ? prev.filter(s => s !== surface)
        : [...prev, surface]
    );
  };

  const handleSave = () => {
    onSave(toothNumber, status, notes, selectedSurfaces);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Tooth {toothNumber} Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="HEALTHY">Healthy</option>
              <option value="DECAY">Decay</option>
              <option value="FILLED">Filled</option>
              <option value="ROOT_CANAL">Root Canal</option>
              <option value="MISSING">Missing</option>
              <option value="IMPACTED">Impacted</option>
              <option value="EXTRACTED">Extracted</option>
            </select>
          </div>

          {surfaces.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Affected Surfaces
              </label>
              <div className="grid grid-cols-2 gap-2">
                {surfaces.map(surface => (
                  <label key={surface} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedSurfaces.includes(surface)}
                      onChange={() => handleSurfaceToggle(surface)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{surface}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes for this tooth..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default DentalChart;
