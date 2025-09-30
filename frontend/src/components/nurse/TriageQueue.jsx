import React, { useState, useEffect } from 'react';
import { Stethoscope, User, Clock, AlertTriangle, CheckCircle, UserPlus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TriageQueue = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [vitalsData, setVitalsData] = useState({
    // Basic Vitals
    bloodPressure: '',
    temperature: '',
    heartRate: '',
    height: '',
    weight: '',
    oxygenSaturation: '',
    condition: '',
    notes: '',
    
    // Chief Complaint & History (Optional)
    chiefComplaint: '',
    historyOfPresentIllness: '',
    onsetOfSymptoms: '',
    durationOfSymptoms: '',
    severityOfSymptoms: '',
    associatedSymptoms: '',
    relievingFactors: '',
    aggravatingFactors: '',
    
    // Physical Examination (Optional)
    generalAppearance: '',
    headAndNeck: '',
    cardiovascularExam: '',
    respiratoryExam: '',
    abdominalExam: '',
    extremities: '',
    neurologicalExam: ''
  });

  const specialties = [
    { value: 'ALL', label: 'All Specialties' },
    { value: 'General Doctor', label: 'General Doctor/General Practitioner' },
    { value: 'Dentist', label: 'Dentist (Dental Specialist)' },
    { value: 'Ophthalmologist', label: 'Ophthalmologist (Eye Doctor)' },
    { value: 'Radiologist', label: 'Radiologist (Imaging Specialist)' },
    { value: 'Orthodontist', label: 'Orthodontist (Teeth Alignment)' },
    { value: 'Periodontist', label: 'Periodontist (Gum Specialist)' },
    { value: 'Endodontist', label: 'Endodontist (Root Canal Specialist)' },
    { value: 'Cardiologist', label: 'Cardiologist (Heart Specialist)' }
  ];

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/nurses/queue');
      setPatients(response.data.queue || []); // Fix: extract queue array from response
    } catch (error) {
      toast.error('Failed to fetch patients');
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/nurses/doctors');
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleVitalsSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctor) {
      toast.error('Please select a doctor to assign');
      return;
    }

    try {
      // Record vitals
      await api.post('/nurses/vitals', {
        patientId: selectedPatient.patient.id,
        visitId: selectedPatient.id,
        ...vitalsData,
        height: parseFloat(vitalsData.height),
        weight: parseFloat(vitalsData.weight),
        temperature: parseFloat(vitalsData.temperature),
        heartRate: parseInt(vitalsData.heartRate),
        oxygenSaturation: parseInt(vitalsData.oxygenSaturation)
      });

      // Assign doctor and create consultation billing
      await api.post('/nurses/assignments', {
        patientId: selectedPatient.patient.id,
        visitId: selectedPatient.id,
        doctorId: selectedDoctor
      });

      toast.success('Vitals recorded and doctor assigned successfully!');
      setShowVitalsForm(false);
      setSelectedPatient(null);
      setSelectedDoctor('');
      setSpecialtyFilter('ALL');
      setVitalsData({
        // Basic Vitals
        bloodPressure: '',
        temperature: '',
        heartRate: '',
        height: '',
        weight: '',
        oxygenSaturation: '',
        condition: '',
        notes: '',
        
        // Chief Complaint & History (Optional)
        chiefComplaint: '',
        historyOfPresentIllness: '',
        onsetOfSymptoms: '',
        durationOfSymptoms: '',
        severityOfSymptoms: '',
        associatedSymptoms: '',
        relievingFactors: '',
        aggravatingFactors: '',
        
        // Physical Examination (Optional)
        generalAppearance: '',
        headAndNeck: '',
        cardiovascularExam: '',
        respiratoryExam: '',
        abdominalExam: '',
        extremities: '',
        neurologicalExam: ''
      });
      fetchPatients();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record vitals and assign doctor');
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    if (specialtyFilter === 'ALL') return true;
    return doctor.specialties?.includes(specialtyFilter);
  });

  const calculateBMI = (height, weight) => {
    if (!height || !weight) return 0;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getPriorityColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      case 'stable':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Triage Queue</h2>
          <p className="text-gray-600">Record patient vitals and assign doctors</p>
        </div>
        <div className="text-sm text-gray-500">
          {patients.length} patients waiting
        </div>
      </div>

      {/* Patients List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {patients.map((visit) => (
          <div key={visit.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">{visit.patient.name}</h3>
                  <p className="text-sm text-gray-500">ID: {visit.patient.id}</p>
                </div>
              </div>
              <span className="badge badge-warning">Waiting</span>
            </div>

            <div className="space-y-2 mb-4">
              {visit.patient.dob && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Age:</span>
                  <span className="font-medium">
                    {new Date().getFullYear() - new Date(visit.patient.dob).getFullYear()} years
                  </span>
                </div>
              )}
              {visit.patient.gender && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gender:</span>
                  <span className="font-medium capitalize">{visit.patient.gender.toLowerCase()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type:</span>
                <span className="font-medium capitalize">{visit.patient.type?.toLowerCase() || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone:</span>
                <span className="font-medium">{visit.patient.mobile || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Arrival Time:</span>
                <span className="font-medium">
                  {new Date(visit.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedPatient(visit);
                  setShowVitalsForm(true);
                }}
                className="btn btn-primary btn-sm flex items-center"
              >
                <Stethoscope className="h-4 w-4 mr-1" />
                Record Vitals
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vitals Form Modal */}
      {showVitalsForm && selectedPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Record Vitals - {selectedPatient.patient.name}
              </h3>
              
              <form onSubmit={handleVitalsSubmit} className="space-y-6">
                {/* Vitals Section */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2" />
                    Record Vitals
                  </h4>
                </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Blood Pressure</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="120/80"
                      value={vitalsData.bloodPressure}
                      onChange={(e) => setVitalsData({...vitalsData, bloodPressure: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="label">Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      placeholder="36.5"
                      value={vitalsData.temperature}
                      onChange={(e) => setVitalsData({...vitalsData, temperature: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="label">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="72"
                      value={vitalsData.heartRate}
                      onChange={(e) => setVitalsData({...vitalsData, heartRate: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="label">Height (cm)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="175"
                      value={vitalsData.height}
                      onChange={(e) => setVitalsData({...vitalsData, height: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="label">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      placeholder="70"
                      value={vitalsData.weight}
                      onChange={(e) => setVitalsData({...vitalsData, weight: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="label">Oxygen Saturation (%)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="98"
                      value={vitalsData.oxygenSaturation}
                      onChange={(e) => setVitalsData({...vitalsData, oxygenSaturation: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Condition</label>
                  <select
                    className="input"
                    value={vitalsData.condition}
                    onChange={(e) => setVitalsData({...vitalsData, condition: e.target.value})}
                  >
                    <option value="">Select Condition</option>
                    <option value="Critical">Critical</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Stable">Stable</option>
                    <option value="Good">Good</option>
                  </select>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows="3"
                    placeholder="Additional observations..."
                    value={vitalsData.notes}
                    onChange={(e) => setVitalsData({...vitalsData, notes: e.target.value})}
                  />
                </div>

                {vitalsData.height && vitalsData.weight && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>BMI:</strong> {calculateBMI(vitalsData.height, vitalsData.weight)}
                    </p>
                  </div>
                )}

                {/* Chief Complaint & History Section (Optional) */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Chief Complaint & History (Optional)
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Chief Complaint</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Primary reason for visit (e.g., chest pain, headache, fever)"
                        value={vitalsData.chiefComplaint}
                        onChange={(e) => setVitalsData({...vitalsData, chiefComplaint: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="label">History of Present Illness</label>
                      <textarea
                        className="input"
                        rows="3"
                        placeholder="Detailed description of current symptoms, when they started, how they've progressed"
                        value={vitalsData.historyOfPresentIllness}
                        onChange={(e) => setVitalsData({...vitalsData, historyOfPresentIllness: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Onset of Symptoms</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g., Sudden, Gradual, After trauma"
                          value={vitalsData.onsetOfSymptoms}
                          onChange={(e) => setVitalsData({...vitalsData, onsetOfSymptoms: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="label">Duration</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g., 2 hours, 3 days, 1 week"
                          value={vitalsData.durationOfSymptoms}
                          onChange={(e) => setVitalsData({...vitalsData, durationOfSymptoms: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Severity (1-10 scale)</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g., 7/10, Moderate, Severe"
                          value={vitalsData.severityOfSymptoms}
                          onChange={(e) => setVitalsData({...vitalsData, severityOfSymptoms: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="label">Associated Symptoms</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g., nausea, dizziness, shortness of breath"
                          value={vitalsData.associatedSymptoms}
                          onChange={(e) => setVitalsData({...vitalsData, associatedSymptoms: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Relieving Factors</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g., rest, medication, position"
                          value={vitalsData.relievingFactors}
                          onChange={(e) => setVitalsData({...vitalsData, relievingFactors: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="label">Aggravating Factors</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g., movement, stress, certain foods"
                          value={vitalsData.aggravatingFactors}
                          onChange={(e) => setVitalsData({...vitalsData, aggravatingFactors: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Physical Examination Section (Optional) */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Physical Examination (Optional)
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">General Appearance</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Overall appearance, distress level, alertness, cooperation"
                        value={vitalsData.generalAppearance}
                        onChange={(e) => setVitalsData({...vitalsData, generalAppearance: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Head & Neck</label>
                        <textarea
                          className="input"
                          rows="2"
                          placeholder="Eyes, ears, nose, throat, lymph nodes"
                          value={vitalsData.headAndNeck}
                          onChange={(e) => setVitalsData({...vitalsData, headAndNeck: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="label">Cardiovascular</label>
                        <textarea
                          className="input"
                          rows="2"
                          placeholder="Heart sounds, murmurs, pulses, JVD"
                          value={vitalsData.cardiovascularExam}
                          onChange={(e) => setVitalsData({...vitalsData, cardiovascularExam: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Respiratory</label>
                        <textarea
                          className="input"
                          rows="2"
                          placeholder="Lung sounds, chest expansion, percussion"
                          value={vitalsData.respiratoryExam}
                          onChange={(e) => setVitalsData({...vitalsData, respiratoryExam: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="label">Abdomen</label>
                        <textarea
                          className="input"
                          rows="2"
                          placeholder="Inspection, palpation, percussion, auscultation"
                          value={vitalsData.abdominalExam}
                          onChange={(e) => setVitalsData({...vitalsData, abdominalExam: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Extremities</label>
                        <textarea
                          className="input"
                          rows="2"
                          placeholder="Edema, pulses, range of motion, deformities"
                          value={vitalsData.extremities}
                          onChange={(e) => setVitalsData({...vitalsData, extremities: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="label">Neurological</label>
                        <textarea
                          className="input"
                          rows="2"
                          placeholder="Mental status, cranial nerves, motor, sensory, reflexes"
                          value={vitalsData.neurologicalExam}
                          onChange={(e) => setVitalsData({...vitalsData, neurologicalExam: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Doctor Assignment Section */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Assign Doctor
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Filter by Specialty</label>
                      <div className="flex flex-wrap gap-2">
                        {specialties.map(spec => (
                          <button
                            key={spec.value}
                            type="button"
                            onClick={() => setSpecialtyFilter(spec.value)}
                            className={`btn btn-sm ${specialtyFilter === spec.value ? 'btn-primary' : 'btn-outline'}`}
                          >
                            {spec.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="label">Select Doctor *</label>
                      <select
                        className="input"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        required
                      >
                        <option value="">Select a Doctor</option>
                        {filteredDoctors.map(doctor => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.fullname} ({doctor.specialties?.join(', ') || 'N/A'}) - ETB {doctor.consultationFee || 'N/A'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVitalsForm(false);
                      setSelectedPatient(null);
                      setSelectedDoctor('');
                      setSpecialtyFilter('ALL');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Record Vitals & Assign Doctor
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

export default TriageQueue;
