import React, { useState, forwardRef, useImperativeHandle, useMemo, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Save, X, Eye, EyeOff, Zap } from 'lucide-react';

// FDI tooth numbering system - defined outside component to prevent re-creation
const TOOTH_NUMBERS = [
  // Upper jaw (right to left) - Patient's perspective
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  // Lower jaw (left to right) - Patient's perspective  
  38, 37, 36, 35, 34, 33, 32, 31,
  41, 42, 43, 44, 45, 46, 47, 48
];

const TOOTH_STATUSES = {
  HEALTHY: { color: '#10B981', label: 'Healthy', glow: '#10B98120' },
  DECAY: { color: '#EF4444', label: 'Decay', glow: '#EF444420' },
  FILLED: { color: '#3B82F6', label: 'Filled', glow: '#3B82F620' },
  ROOT_CANAL: { color: '#8B5CF6', label: 'Root Canal', glow: '#8B5CF620' },
  MISSING: { color: '#6B7280', label: 'Missing', glow: '#6B728020' },
  IMPACTED: { color: '#F59E0B', label: 'Impacted', glow: '#F59E0B20' },
  EXTRACTED: { color: '#DC2626', label: 'Extracted', glow: '#DC262620' }
};

// Clean Tooth Component
const ToothComponent = ({ toothNumber, status, hasPain, notes, onClick, isUpper, position }) => {
  const statusConfig = TOOTH_STATUSES[status];
  const isCentral = position === 7 || position === 8; // Central incisors
  
  return (
    <div className="relative group">
      <div
        className="relative cursor-pointer transition-all duration-300 transform hover:scale-110"
        onClick={onClick}
        style={{
          width: isCentral ? '50px' : '40px',
          height: isCentral ? '50px' : '40px',
        }}
      >
        {/* Tooth Shape - Clean rounded rectangle */}
        <div
          className="w-full h-full rounded-lg border-2 flex items-center justify-center relative overflow-hidden shadow-sm hover:shadow-md"
          style={{
            backgroundColor: statusConfig.color,
            borderColor: hasPain ? '#EF4444' : '#E5E7EB',
            background: `linear-gradient(135deg, ${statusConfig.color} 0%, ${statusConfig.color}CC 100%)`
          }}
        >
          {/* Tooth Number */}
          <span 
            className="font-bold text-white drop-shadow-sm"
            style={{ fontSize: isCentral ? '14px' : '12px' }}
          >
            {toothNumber}
          </span>
          
          {/* Pain Indicator */}
          {hasPain && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
              <Zap className="w-2 h-2 text-white" />
            </div>
          )}
          
          {/* Hover Effect */}
          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-white"></div>
        </div>
        
        {/* Clean Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-20 pointer-events-none shadow-lg">
          <div className="font-semibold">Tooth {toothNumber}</div>
          <div className="text-gray-300">{statusConfig.label}</div>
          {notes && <div className="text-gray-400 mt-1 max-w-xs truncate">{notes}</div>}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
};

const DentalChart = forwardRef(({ patientId, visitId, onSave, initialData }, ref) => {
  // Create stable initial state that never changes
  const initialToothChart = useMemo(() => {
    const chart = {};
    TOOTH_NUMBERS.forEach(tooth => {
      chart[tooth] = {
        status: 'HEALTHY',
        notes: '',
        surfaces: []
      };
    });
    return chart;
  }, []);

  const [toothChart, setToothChart] = useState(initialToothChart);
  const [painFlags, setPainFlags] = useState({});
  const [gumCondition, setGumCondition] = useState('');
  const [oralHygiene, setOralHygiene] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentTooth, setCurrentTooth] = useState(null);

  // Load existing dental record data when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log('🔍 Loading existing dental record data:', initialData);
      
      // Load tooth chart data
      if (initialData.toothChart) {
        console.log('📊 Loading tooth chart data:', Object.keys(initialData.toothChart).length, 'teeth');
        setToothChart(prev => ({
          ...prev,
          ...initialData.toothChart
        }));
      }
      
      // Load other dental data
      if (initialData.painFlags) {
        console.log('📊 Loading pain flags:', Object.keys(initialData.painFlags).length, 'teeth');
        setPainFlags(initialData.painFlags);
      }
      if (initialData.gumCondition) {
        console.log('📊 Loading gum condition:', initialData.gumCondition);
        setGumCondition(initialData.gumCondition);
      }
      if (initialData.oralHygiene) {
        console.log('📊 Loading oral hygiene:', initialData.oralHygiene);
        setOralHygiene(initialData.oralHygiene);
      }
      if (initialData.notes) {
        console.log('📊 Loading notes:', initialData.notes);
        setNotes(initialData.notes);
      }
      
      console.log('✅ Dental record data loaded successfully');
    } else {
      console.log('ℹ️ No initial data provided, using default values');
    }
  }, [initialData]);

  // Debug: trace renders and key state changes
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[DentalChart] render', { visitId, patientId, chartKeys: Object.keys(toothChart).length });
  });
  
  useEffect(() => {
    if (showStatusModal) {
      // eslint-disable-next-line no-console
      console.debug('[DentalChart] open status modal for tooth', currentTooth);
    }
  }, [showStatusModal, currentTooth]);

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

  const handleToothClick = (toothNumber) => {
    // eslint-disable-next-line no-console
    console.debug('[DentalChart] click tooth', toothNumber);
    setCurrentTooth(toothNumber);
    setShowStatusModal(true);
  };

  const handleStatusChange = (status) => {
    if (!currentTooth) return;
    // eslint-disable-next-line no-console
    console.debug('[DentalChart] status change', { currentTooth, status });
    
    setToothChart(prev => ({
      ...prev,
      [currentTooth]: {
        ...prev[currentTooth],
        status
      }
    }));
    setShowStatusModal(false);
  };

  const handleNotesChange = (toothNumber, notes) => {
    setToothChart(prev => ({
      ...prev,
      [toothNumber]: {
        ...prev[toothNumber],
        notes
      }
    }));
  };

  const handlePainFlagToggle = (toothNumber) => {
    // eslint-disable-next-line no-console
    console.debug('[DentalChart] toggle pain', toothNumber);
    setPainFlags(prev => ({
      ...prev,
      [toothNumber]: !prev[toothNumber]
    }));
  };

  const handleSave = async () => {
    // eslint-disable-next-line no-console
    console.debug('[DentalChart] save', { patientId, visitId });
    setLoading(true);
    try {
      const dentalData = {
        patientId,
        visitId: parseInt(visitId), // Convert string to number
        toothChart,
        painFlags,
        gumCondition,
        oralHygiene,
        notes
      };

      const response = await api.post('/dental/records', dentalData);
      toast.success('Dental chart saved successfully!');
      onSave(response.data.dentalRecord);
    } catch (error) {
      console.error('Error saving dental chart:', error);
      toast.error('Failed to save dental chart.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Clean Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">🦷</span>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-800">Digital Dental Chart</h4>
              <p className="text-sm text-gray-600">Interactive FDI Tooth Mapping System</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{loading ? 'Saving...' : 'Save Chart'}</span>
          </button>
        </div>
      </div>

      {/* Clean Legend */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4">
          {Object.entries(TOOTH_STATUSES).map(([key, { color, label, glow }]) => (
            <div key={key} className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white border border-gray-200">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
          ))}
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white border border-gray-200">
            <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Pain Flag</span>
          </div>
        </div>
      </div>

      {/* Clean Dental Chart */}
      <div className="p-8">
        <div className="relative max-w-4xl mx-auto">
          {/* Upper Jaw */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h5 className="text-lg font-semibold text-gray-700">Maxillary Arch (Upper Jaw)</h5>
              <div className="w-24 h-px mx-auto mt-2 bg-gray-300"></div>
            </div>
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {TOOTH_NUMBERS.slice(0, 16).map((toothNumber, index) => (
                  <ToothComponent
                    key={toothNumber}
                    toothNumber={toothNumber}
                    status={toothChart[toothNumber]?.status || 'HEALTHY'}
                    hasPain={painFlags[toothNumber]}
                    notes={toothChart[toothNumber]?.notes || ''}
                    onClick={() => handleToothClick(toothNumber)}
                    isUpper={true}
                    position={index}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Central Divider */}
          <div className="flex justify-center mb-8">
            <div className="w-px h-8 bg-gray-300"></div>
          </div>

          {/* Lower Jaw */}
          <div>
            <div className="text-center mb-6">
              <h5 className="text-lg font-semibold text-gray-700">Mandibular Arch (Lower Jaw)</h5>
              <div className="w-24 h-px mx-auto mt-2 bg-gray-300"></div>
            </div>
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {TOOTH_NUMBERS.slice(16, 32).map((toothNumber, index) => (
                  <ToothComponent
                    key={toothNumber}
                    toothNumber={toothNumber}
                    status={toothChart[toothNumber]?.status || 'HEALTHY'}
                    hasPain={painFlags[toothNumber]}
                    notes={toothChart[toothNumber]?.notes || ''}
                    onClick={() => handleToothClick(toothNumber)}
                    isUpper={false}
                    position={index}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && currentTooth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Update Tooth {currentTooth}
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TOOTH_STATUSES).map(([key, { color, label }]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className="p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105"
                      style={{
                        borderColor: toothChart[currentTooth]?.status === key ? color : '#E5E7EB',
                        backgroundColor: toothChart[currentTooth]?.status === key ? `${color}20` : '#FFFFFF'
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={toothChart[currentTooth]?.notes || ''}
                  onChange={(e) => handleNotesChange(currentTooth, e.target.value)}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add notes for this tooth..."
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`pain-flag-${currentTooth}`}
                  checked={!!painFlags[currentTooth]}
                  onChange={() => handlePainFlagToggle(currentTooth)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor={`pain-flag-${currentTooth}`} className="text-sm font-medium text-gray-700">
                  Mark as painful
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Dental Notes */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <h5 className="font-semibold mb-4 text-gray-800">General Oral Health Assessment</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gum Condition</label>
            <select
              value={gumCondition}
              onChange={(e) => setGumCondition(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
            >
              <option value="">Select condition</option>
              <option value="healthy">Healthy</option>
              <option value="gingivitis">Gingivitis</option>
              <option value="periodontitis">Periodontitis</option>
              <option value="recession">Recession</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Oral Hygiene</label>
            <select
              value={oralHygiene}
              onChange={(e) => setOralHygiene(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
            >
              <option value="">Select hygiene level</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 resize-none"
            placeholder="Add general dental notes and observations..."
          />
        </div>
      </div>
    </div>
  );
});

export default DentalChart;