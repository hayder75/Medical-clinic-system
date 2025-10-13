import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Heart, 
  Thermometer, 
  Scale, 
  Eye, 
  Clock, 
  Plus,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ContinuousVitals = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVitals, setPatientVitals] = useState([]);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Vitals form state
  const [vitalsForm, setVitalsForm] = useState({
    bloodPressure: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    tempUnit: 'C',
    heartRate: '',
    respirationRate: '',
    height: '',
    weight: '',
    oxygenSaturation: '',
    condition: '',
    notes: '',
    painScoreRest: '',
    painScoreMovement: '',
    sedationScore: '',
    gcsEyes: '',
    gcsVerbal: '',
    gcsMotor: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Search for patients
  const searchPatients = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await api.get(`/patients/search?query=${encodeURIComponent(searchQuery)}&type=name`);
      setSearchResults(response.data.patients || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Failed to search patients');
    } finally {
      setSearchLoading(false);
    }
  };

  // Select a patient
  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setSearchResults([]);
    await fetchPatientVitals(patient.id);
  };

  // Fetch vitals history for selected patient
  const fetchPatientVitals = async (patientId) => {
    try {
      setLoading(true);
      const response = await api.get(`/nurses/patient-vitals/${patientId}`);
      setPatientVitals(response.data.vitals || []);
    } catch (error) {
      console.error('Error fetching patient vitals:', error);
      toast.error('Failed to fetch vitals history');
    } finally {
      setLoading(false);
    }
  };

  // Record new vitals
  const recordVitals = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      const errors = {};
      if (!vitalsForm.bloodPressure && !vitalsForm.bloodPressureSystolic) {
        errors.bloodPressure = 'Blood pressure is required';
      }
      if (!vitalsForm.temperature) {
        errors.temperature = 'Temperature is required';
      }
      if (!vitalsForm.heartRate) {
        errors.heartRate = 'Heart rate is required';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const vitalsData = {
        patientId: selectedPatient.id,
        ...vitalsForm,
        // Convert string values to numbers where needed, but only if they have valid values
        temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : undefined,
        heartRate: vitalsForm.heartRate ? parseInt(vitalsForm.heartRate) : undefined,
        respirationRate: vitalsForm.respirationRate ? parseInt(vitalsForm.respirationRate) : undefined,
        height: vitalsForm.height ? parseFloat(vitalsForm.height) : undefined,
        weight: vitalsForm.weight ? parseFloat(vitalsForm.weight) : undefined,
        oxygenSaturation: vitalsForm.oxygenSaturation ? parseInt(vitalsForm.oxygenSaturation) : undefined,
        painScoreRest: vitalsForm.painScoreRest ? parseInt(vitalsForm.painScoreRest) : undefined,
        painScoreMovement: vitalsForm.painScoreMovement ? parseInt(vitalsForm.painScoreMovement) : undefined,
        sedationScore: vitalsForm.sedationScore ? parseInt(vitalsForm.sedationScore) : undefined,
        gcsEyes: vitalsForm.gcsEyes ? parseInt(vitalsForm.gcsEyes) : undefined,
        gcsVerbal: vitalsForm.gcsVerbal ? parseInt(vitalsForm.gcsVerbal) : undefined,
        gcsMotor: vitalsForm.gcsMotor ? parseInt(vitalsForm.gcsMotor) : undefined,
        bloodPressureSystolic: vitalsForm.bloodPressureSystolic ? parseInt(vitalsForm.bloodPressureSystolic) : undefined,
        bloodPressureDiastolic: vitalsForm.bloodPressureDiastolic ? parseInt(vitalsForm.bloodPressureDiastolic) : undefined
      };

      // Remove null/empty values to avoid validation issues
      Object.keys(vitalsData).forEach(key => {
        if (vitalsData[key] === null || vitalsData[key] === '' || vitalsData[key] === undefined) {
          delete vitalsData[key];
        }
      });

      console.log('Sending vitals data:', vitalsData);
      await api.post('/nurses/continuous-vitals', vitalsData);
      
      toast.success('Vitals recorded successfully');
      setShowVitalsForm(false);
      resetVitalsForm();
      await fetchPatientVitals(selectedPatient.id);
      
    } catch (error) {
      console.error('Error recording vitals:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to record vitals');
    } finally {
      setLoading(false);
    }
  };

  const resetVitalsForm = () => {
    setVitalsForm({
      bloodPressure: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      temperature: '',
      tempUnit: 'C',
      heartRate: '',
      respirationRate: '',
      height: '',
      weight: '',
      oxygenSaturation: '',
      condition: '',
      notes: '',
      painScoreRest: '',
      painScoreMovement: '',
      sedationScore: '',
      gcsEyes: '',
      gcsVerbal: '',
      gcsMotor: ''
    });
    setFormErrors({});
  };

  const getVitalStatus = (vital, value) => {
    if (!value) return 'normal';
    
    switch (vital) {
      case 'heartRate':
        return value < 60 || value > 100 ? 'warning' : 'normal';
      case 'temperature':
        return value < 36.1 || value > 37.2 ? 'warning' : 'normal';
      case 'oxygenSaturation':
        return value < 95 ? 'danger' : 'normal';
      case 'bloodPressureSystolic':
        return value < 90 || value > 140 ? 'warning' : 'normal';
      case 'bloodPressureDiastolic':
        return value < 60 || value > 90 ? 'warning' : 'normal';
      default:
        return 'normal';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'danger': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPatients();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Continuous Vitals Monitoring</h2>
          <p className="text-gray-600">Record and monitor patient vitals throughout their stay</p>
        </div>
        {selectedPatient && (
          <button
            onClick={() => setShowVitalsForm(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Vitals
          </button>
        )}
      </div>

      {/* Patient Search */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Patient</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name or ID..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Search Results */}
        {searchLoading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((patient) => (
              <div
                key={patient.id}
                onClick={() => selectPatient(patient)}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-500">ID: {patient.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Patient Info */}
      {selectedPatient && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <User className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedPatient.name}</h3>
                <p className="text-sm text-gray-500">ID: {selectedPatient.id}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedPatient(null);
                setPatientVitals([]);
                setShowVitalsForm(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Vitals History */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Vitals History</h4>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : patientVitals.length > 0 ? (
              <div className="space-y-3">
                {patientVitals.map((vital, index) => (
                  <div key={vital.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(vital.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Record #{patientVitals.length - index}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Heart Rate */}
                      {vital.heartRate && (
                        <div className={`p-3 rounded-lg ${getStatusColor(getVitalStatus('heartRate', vital.heartRate))}`}>
                          <div className="flex items-center">
                            <Heart className="h-4 w-4 mr-2" />
                            <div>
                              <p className="text-xs font-medium">Heart Rate</p>
                              <p className="text-sm font-semibold">{vital.heartRate} bpm</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Temperature */}
                      {vital.temperature && (
                        <div className={`p-3 rounded-lg ${getStatusColor(getVitalStatus('temperature', vital.temperature))}`}>
                          <div className="flex items-center">
                            <Thermometer className="h-4 w-4 mr-2" />
                            <div>
                              <p className="text-xs font-medium">Temperature</p>
                              <p className="text-sm font-semibold">{vital.temperature}°{vital.tempUnit}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Blood Pressure */}
                      {(vital.bloodPressure || (vital.bloodPressureSystolic && vital.bloodPressureDiastolic)) && (
                        <div className={`p-3 rounded-lg ${getStatusColor(getVitalStatus('bloodPressureSystolic', vital.bloodPressureSystolic))}`}>
                          <div className="flex items-center">
                            <Scale className="h-4 w-4 mr-2" />
                            <div>
                              <p className="text-xs font-medium">Blood Pressure</p>
                              <p className="text-sm font-semibold">
                                {vital.bloodPressure || `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`} mmHg
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Oxygen Saturation */}
                      {vital.oxygenSaturation && (
                        <div className={`p-3 rounded-lg ${getStatusColor(getVitalStatus('oxygenSaturation', vital.oxygenSaturation))}`}>
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            <div>
                              <p className="text-xs font-medium">Oxygen Sat</p>
                              <p className="text-sm font-semibold">{vital.oxygenSaturation}%</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {vital.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">
                          <strong>Notes:</strong> {vital.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No vitals recorded yet</p>
                <p className="text-xs">Click "Record Vitals" to add the first reading</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vitals Form Modal */}
      {showVitalsForm && selectedPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Record Vitals - {selectedPatient.name}
              </h3>
              
              <form onSubmit={(e) => { e.preventDefault(); recordVitals(); }} className="space-y-6">
                {/* Basic Vitals */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Blood Pressure *</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="120/80"
                        className="input flex-1"
                        value={vitalsForm.bloodPressure}
                        onChange={(e) => setVitalsForm({...vitalsForm, bloodPressure: e.target.value})}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Or enter separately below</p>
                  </div>

                  <div>
                    <label className="label">Temperature *</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="36.5"
                        className="input flex-1"
                        value={vitalsForm.temperature}
                        onChange={(e) => setVitalsForm({...vitalsForm, temperature: e.target.value})}
                      />
                      <select
                        className="input w-16"
                        value={vitalsForm.tempUnit}
                        onChange={(e) => setVitalsForm({...vitalsForm, tempUnit: e.target.value})}
                      >
                        <option value="C">°C</option>
                        <option value="F">°F</option>
                      </select>
                    </div>
                    {formErrors.temperature && <p className="text-red-500 text-xs mt-1">{formErrors.temperature}</p>}
                  </div>

                  <div>
                    <label className="label">Heart Rate *</label>
                    <input
                      type="number"
                      placeholder="72"
                      className="input"
                      value={vitalsForm.heartRate}
                      onChange={(e) => setVitalsForm({...vitalsForm, heartRate: e.target.value})}
                    />
                    {formErrors.heartRate && <p className="text-red-500 text-xs mt-1">{formErrors.heartRate}</p>}
                  </div>

                  <div>
                    <label className="label">Respiration Rate</label>
                    <input
                      type="number"
                      placeholder="16"
                      className="input"
                      value={vitalsForm.respirationRate}
                      onChange={(e) => setVitalsForm({...vitalsForm, respirationRate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="label">Oxygen Saturation</label>
                    <input
                      type="number"
                      placeholder="98"
                      className="input"
                      value={vitalsForm.oxygenSaturation}
                      onChange={(e) => setVitalsForm({...vitalsForm, oxygenSaturation: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="label">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="170"
                      className="input"
                      value={vitalsForm.height}
                      onChange={(e) => setVitalsForm({...vitalsForm, height: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="label">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="70"
                      className="input"
                      value={vitalsForm.weight}
                      onChange={(e) => setVitalsForm({...vitalsForm, weight: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="label">Condition</label>
                    <select
                      className="input"
                      value={vitalsForm.condition}
                      onChange={(e) => setVitalsForm({...vitalsForm, condition: e.target.value})}
                    >
                      <option value="">Select condition</option>
                      <option value="Stable">Stable</option>
                      <option value="Critical">Critical</option>
                      <option value="Improving">Improving</option>
                      <option value="Deteriorating">Deteriorating</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    placeholder="Additional observations or notes..."
                    className="input"
                    rows="3"
                    value={vitalsForm.notes}
                    onChange={(e) => setVitalsForm({...vitalsForm, notes: e.target.value})}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVitalsForm(false);
                      resetVitalsForm();
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Recording...' : 'Record Vitals'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContinuousVitals;
