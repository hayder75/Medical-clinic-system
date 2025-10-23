import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  UserPlus,
  ChevronDown,
  ChevronRight,
  Heart,
  Thermometer,
  Activity,
  Eye,
  FileText,
  ClipboardList
} from 'lucide-react';
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
  
  // Nurse service states
  const [nurseServices, setNurseServices] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [selectedNurseServices, setSelectedNurseServices] = useState([]); // Changed to array
  const [selectedNurse, setSelectedNurse] = useState('');
  const [nurseServiceNotes, setNurseServiceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Section states for collapsible interface
  const [expandedSections, setExpandedSections] = useState({
    vitals: true,        // Always start with vitals expanded
    complaint: false,
    examination: false,
    nurseService: false,
    assignment: false
  });
  
  // Section completion tracking
  const [sectionCompletion, setSectionCompletion] = useState({
    vitals: false,
    complaint: false,
    examination: false,
    nurseService: false,
    assignment: false
  });
  
  const [vitalsData, setVitalsData] = useState({
    // Basic Vitals
    bloodPressure: '',
    temperature: '',
    heartRate: '',
    height: '',
    weight: '',
    oxygenSaturation: '',
    bloodType: '',
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
    { value: 'General Doctor', label: 'General Doctor' },
    { value: 'Dentist', label: 'Dentist' },
    { value: 'Ophthalmologist', label: 'Ophthalmologist' },
    { value: 'Radiologist', label: 'Radiologist' },
    { value: 'Orthodontist', label: 'Orthodontist' },
    { value: 'Periodontist', label: 'Periodontist' },
    { value: 'Endodontist', label: 'Endodontist' },
    { value: 'Cardiologist', label: 'Cardiologist' }
  ];

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchNurseServices();
    fetchNurses();
  }, []);

  // Initialize blood type when patient is selected
  useEffect(() => {
    if (selectedPatient?.bloodType) {
      setVitalsData(prev => ({
        ...prev,
        bloodType: selectedPatient.bloodType
      }));
    }
  }, [selectedPatient]);

  // Check section completion whenever vitalsData changes
  useEffect(() => {
    checkSectionCompletion();
  }, [vitalsData, selectedDoctor, selectedNurseServices, selectedNurse]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/nurses/queue');
      setPatients(response.data.queue || []);
    } catch (error) {
      toast.error('Failed to fetch patients');
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/doctors/queue-status');
      const doctorsData = response.data.doctors || [];
      setDoctors(doctorsData);
      
      // Auto-suggest the least busy doctor (silently, no popup)
      if (doctorsData.length > 0 && !selectedDoctor) {
        const leastBusyDoctor = doctorsData[0]; // Already sorted by workload
        setSelectedDoctor(leastBusyDoctor.id);
        // Removed toast notification for auto-selection
      }
    } catch (error) {
      toast.error('Failed to fetch doctors');
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchNurseServices = async () => {
    try {
      const response = await api.get('/nurses/services');
      setNurseServices(response.data.services || []);
    } catch (error) {
      toast.error('Failed to fetch nurse services');
      console.error('Error fetching nurse services:', error);
    }
  };

  const fetchNurses = async () => {
    try {
      const response = await api.get('/nurses/nurses');
      setNurses(response.data.nurses || []);
    } catch (error) {
      toast.error('Failed to fetch nurses');
      console.error('Error fetching nurses:', error);
    }
  };

  const checkSectionCompletion = () => {
    const completion = {
      vitals: true, // Always true - vitals are now optional
      complaint: !!(vitalsData.chiefComplaint || vitalsData.historyOfPresentIllness),
      examination: !!(vitalsData.generalAppearance || vitalsData.cardiovascularExam || vitalsData.respiratoryExam),
      nurseService: selectedNurseServices.length > 0, // Don't require nurse selection - will auto-select current nurse
      assignment: !!selectedDoctor
    };
    setSectionCompletion(completion);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const calculateBMI = (height, weight) => {
    if (!height || !weight) return 'N/A';
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedNurseServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleVitalsSubmit = async (e) => {
    e.preventDefault();
    
    // Check if either doctor assignment or nurse service is completed
    if (!sectionCompletion.assignment && !sectionCompletion.nurseService) {
      toast.error('Please either assign a doctor or select a nurse service');
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);

    try {
      // Build vitals payload with only fields that have values
      const vitalsPayload = {
        visitId: selectedPatient.id,
        patientId: selectedPatient.patient.id
      };

      // Only add vitals fields if they have values
      if (vitalsData.bloodPressure) vitalsPayload.bloodPressure = vitalsData.bloodPressure;
      if (vitalsData.temperature) vitalsPayload.temperature = parseFloat(vitalsData.temperature);
      if (vitalsData.heartRate) vitalsPayload.heartRate = parseInt(vitalsData.heartRate);
      if (vitalsData.height) vitalsPayload.height = parseFloat(vitalsData.height);
      if (vitalsData.weight) vitalsPayload.weight = parseFloat(vitalsData.weight);
      if (vitalsData.oxygenSaturation) vitalsPayload.oxygenSaturation = parseInt(vitalsData.oxygenSaturation);
      if (vitalsData.condition) vitalsPayload.condition = vitalsData.condition;
      if (vitalsData.notes) vitalsPayload.notes = vitalsData.notes;
      
      // Optional complaint fields
      if (vitalsData.chiefComplaint) vitalsPayload.chiefComplaint = vitalsData.chiefComplaint;
      if (vitalsData.historyOfPresentIllness) vitalsPayload.historyOfPresentIllness = vitalsData.historyOfPresentIllness;
      if (vitalsData.onsetOfSymptoms) vitalsPayload.onsetOfSymptoms = vitalsData.onsetOfSymptoms;
      if (vitalsData.durationOfSymptoms) vitalsPayload.durationOfSymptoms = vitalsData.durationOfSymptoms;
      if (vitalsData.severityOfSymptoms) vitalsPayload.severityOfSymptoms = vitalsData.severityOfSymptoms;
      if (vitalsData.associatedSymptoms) vitalsPayload.associatedSymptoms = vitalsData.associatedSymptoms;
      if (vitalsData.relievingFactors) vitalsPayload.relievingFactors = vitalsData.relievingFactors;
      if (vitalsData.aggravatingFactors) vitalsPayload.aggravatingFactors = vitalsData.aggravatingFactors;
      
      // Optional examination fields
      if (vitalsData.generalAppearance) vitalsPayload.generalAppearance = vitalsData.generalAppearance;
      if (vitalsData.headAndNeck) vitalsPayload.headAndNeck = vitalsData.headAndNeck;
      if (vitalsData.cardiovascularExam) vitalsPayload.cardiovascularExam = vitalsData.cardiovascularExam;
      if (vitalsData.respiratoryExam) vitalsPayload.respiratoryExam = vitalsData.respiratoryExam;
      if (vitalsData.abdominalExam) vitalsPayload.abdominalExam = vitalsData.abdominalExam;
      if (vitalsData.extremities) vitalsPayload.extremities = vitalsData.extremities;
      if (vitalsData.neurologicalExam) vitalsPayload.neurologicalExam = vitalsData.neurologicalExam;

      // Always record vitals to trigger triaging (even with minimal data)
      // This ensures the visit status becomes TRIAGED
      await api.post('/nurses/vitals', vitalsPayload);
      
      // Handle assignment based on what was selected
      // Auto-select current nurse if nurse services are selected but no nurse is chosen
      let assignedNurseId = selectedNurse;
      if (sectionCompletion.nurseService && (!selectedNurse || selectedNurse === '')) {
        // Get current user info and use their ID as the assigned nurse
        const currentUser = JSON.parse(localStorage.getItem('user'));
        assignedNurseId = currentUser?.id;
        if (assignedNurseId) {
          setSelectedNurse(assignedNurseId);
        }
      }

      // Use combined endpoint if both nurse services and doctor are selected
      if (sectionCompletion.nurseService && sectionCompletion.assignment) {
        const payload = {
          visitId: selectedPatient.id,
          patientId: selectedPatient.patient.id,
          serviceIds: selectedNurseServices,
          doctorId: selectedDoctor,
          notes: nurseServiceNotes
        };
        
        // Only include assignedNurseId if it's valid
        if (assignedNurseId && assignedNurseId !== '') {
          payload.assignedNurseId = assignedNurseId;
        }
        
        await api.post('/nurses/assign-combined', payload);
        toast.success('Patient processed with both nurse services and doctor assignment');
      } else if (sectionCompletion.nurseService) {
        // Handle nurse services assignment only
        const payload = {
          visitId: selectedPatient.id,
          patientId: selectedPatient.patient.id,
          serviceIds: selectedNurseServices,
          notes: nurseServiceNotes
        };
        
        // Only include assignedNurseId if it's valid
        if (assignedNurseId && assignedNurseId !== '') {
          payload.assignedNurseId = assignedNurseId;
        }
        
        await api.post('/nurses/assign-nurse-services', payload);
        toast.success(`${selectedNurseServices.length} nurse service(s) assigned successfully`);
      } else if (sectionCompletion.assignment) {
        // Handle doctor assignment only
        await api.post('/nurses/assignments', {
          visitId: selectedPatient.id,
          patientId: selectedPatient.patient.id,
          doctorId: selectedDoctor
        });
        toast.success('Doctor assigned successfully');
      }
      setShowVitalsForm(false);
      setSelectedPatient(null);
      setSelectedDoctor('');
      setSelectedNurseServices([]);
      setSelectedNurse('');
      setNurseServiceNotes('');
      
      // Reset form
      setVitalsData({
        bloodPressure: '',
        temperature: '',
        heartRate: '',
        height: '',
        weight: '',
        oxygenSaturation: '',
        bloodType: '',
        condition: '',
        notes: '',
        chiefComplaint: '',
        historyOfPresentIllness: '',
        onsetOfSymptoms: '',
        durationOfSymptoms: '',
        severityOfSymptoms: '',
        associatedSymptoms: '',
        relievingFactors: '',
        aggravatingFactors: '',
        generalAppearance: '',
        headAndNeck: '',
        cardiovascularExam: '',
        respiratoryExam: '',
        abdominalExam: '',
        extremities: '',
        neurologicalExam: ''
      });
      
      // Reset sections
      setExpandedSections({
        vitals: true,
        complaint: false,
        examination: false,
        assignment: false
      });
      
      fetchPatients();
    } catch (error) {
      console.error('Error in triage process:', error);
      toast.error(`Triage failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionHeader = ({ section, title, icon: Icon, isCompleted, isExpanded, onToggle }) => (
    <div 
      className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-200 ${
        isCompleted 
          ? 'bg-green-50 border-green-200 hover:bg-green-100' 
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      } border rounded-lg`}
      onClick={() => onToggle(section)}
    >
      <div className="flex items-center">
        <Icon className={`h-5 w-5 mr-3 ${isCompleted ? 'text-green-600' : 'text-gray-600'}`} />
        <h3 className={`text-lg font-medium ${isCompleted ? 'text-green-800' : 'text-gray-800'}`}>
          {title}
        </h3>
        {isCompleted && (
          <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
        )}
      </div>
      <div className="flex items-center">
        {isCompleted && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">
            Completed
          </span>
        )}
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500" />
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Triage Queue</h2>
          <p className="text-gray-600">Record patient vitals (optional) and assign doctors</p>
        </div>
        <div className="text-sm text-gray-500">
          {patients.length} patients waiting
        </div>
      </div>

      {/* Patients List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {patients.length > 0 ? (
          patients.map((visit) => (
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
          ))
        ) : (
          <div className="col-span-2">
            <div className="card text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients waiting</h3>
              <p className="text-gray-500">All patients have been triaged or there are no new arrivals.</p>
            </div>
          </div>
        )}
      </div>

      {/* Improved Sectioned Vitals Form Modal */}
      {showVitalsForm && selectedPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Patient Assessment - {selectedPatient.patient.name}
                </h3>
                <button
                  onClick={() => setShowVitalsForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleVitalsSubmit} className="space-y-4">
                
                {/* 1. Record Vitals Section */}
                <div className="border border-gray-200 rounded-lg">
                  <SectionHeader
                    section="vitals"
                    title="Record Vitals (Optional)"
                    icon={Stethoscope}
                    isCompleted={sectionCompletion.vitals}
                    isExpanded={expandedSections.vitals}
                    onToggle={toggleSection}
                  />
                  
                  {expandedSections.vitals && (
                    <div className="p-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Blood Pressure *</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="120/80"
                            value={vitalsData.bloodPressure}
                            onChange={(e) => setVitalsData({...vitalsData, bloodPressure: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="label">Temperature (°C) *</label>
                          <input
                            type="number"
                            step="0.1"
                            className="input"
                            placeholder="36.5"
                            value={vitalsData.temperature}
                            onChange={(e) => setVitalsData({...vitalsData, temperature: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="label">Heart Rate (bpm) *</label>
                          <input
                            type="number"
                            className="input"
                            placeholder="72"
                            value={vitalsData.heartRate}
                            onChange={(e) => setVitalsData({...vitalsData, heartRate: e.target.value})}
                            required
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
                        
                        <div>
                          <label className="label">Blood Type *</label>
                          <select
                            className="input"
                            value={vitalsData.bloodType}
                            onChange={(e) => setVitalsData({...vitalsData, bloodType: e.target.value})}
                            required
                            disabled={selectedPatient?.bloodType && vitalsData.bloodType === ''}
                          >
                            <option value="">Select Blood Type</option>
                            <option value="A_PLUS">A+</option>
                            <option value="A_MINUS">A-</option>
                            <option value="B_PLUS">B+</option>
                            <option value="B_MINUS">B-</option>
                            <option value="AB_PLUS">AB+</option>
                            <option value="AB_MINUS">AB-</option>
                            <option value="O_PLUS">O+</option>
                            <option value="O_MINUS">O-</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            💡 Check the patient's ID card for blood type. This information will be permanently saved and cannot be changed later.
                          </p>
                          {selectedPatient?.bloodType && (
                            <p className="text-xs text-green-600 mt-1">
                              ✅ Patient's blood type is already recorded: {selectedPatient.bloodType.replace('_', '')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="label">Condition *</label>
                        <select
                          className="input"
                          value={vitalsData.condition}
                          onChange={(e) => setVitalsData({...vitalsData, condition: e.target.value})}
                          required
                        >
                          <option value="">Select Condition</option>
                          <option value="Critical">Critical</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Stable">Stable</option>
                          <option value="Good">Good</option>
                        </select>
                      </div>

                      <div className="mt-4">
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
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>BMI:</strong> {calculateBMI(vitalsData.height, vitalsData.weight)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Chief Complaint & History Section */}
                <div className="border border-gray-200 rounded-lg">
                  <SectionHeader
                    section="complaint"
                    title="Chief Complaint & History (Optional)"
                    icon={FileText}
                    isCompleted={sectionCompletion.complaint}
                    isExpanded={expandedSections.complaint}
                    onToggle={toggleSection}
                  />
                  
                  {expandedSections.complaint && (
                    <div className="p-6 border-t border-gray-200">
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
                  )}
                </div>

                {/* 3. Physical Examination Section */}
                <div className="border border-gray-200 rounded-lg">
                  <SectionHeader
                    section="examination"
                    title="Physical Examination (Optional)"
                    icon={ClipboardList}
                    isCompleted={sectionCompletion.examination}
                    isExpanded={expandedSections.examination}
                    onToggle={toggleSection}
                  />
                  
                  {expandedSections.examination && (
                    <div className="p-6 border-t border-gray-200">
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
                  )}
                </div>

                {/* 4. Nurse Service Section */}
                <div className="border border-gray-200 rounded-lg">
                  <SectionHeader
                    section="nurseService"
                    title="Nurse Service (Optional)"
                    icon={Stethoscope}
                    isCompleted={sectionCompletion.nurseService}
                    isExpanded={expandedSections.nurseService}
                    onToggle={toggleSection}
                  />
                  
                  {expandedSections.nurseService && (
                    <div className="p-6 border-t border-gray-200">
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Select a nurse service if the patient needs a service that can be provided by a nurse without requiring a doctor consultation.
                          </p>
                        </div>

                        <div>
                          <label className="label">Select Nurse Services</label>
                          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                            {nurseServices.map(service => (
                              <label key={service.id} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedNurseServices.includes(service.id)}
                                  onChange={() => handleServiceToggle(service.id)}
                                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {service.name} - ${service.price}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {service.code} - {service.description}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                          {selectedNurseServices.length > 0 && (
                            <p className="text-sm text-gray-600 mt-2">
                              Selected {selectedNurseServices.length} service(s)
                            </p>
                          )}
                        </div>

                        {selectedNurseServices.length > 0 && (
                          <div>
                            <label className="label">Assign to Nurse</label>
                            <select
                              className="input"
                              value={selectedNurse}
                              onChange={(e) => setSelectedNurse(e.target.value)}
                            >
                              <option value="">Auto-assign to current nurse</option>
                              {nurses.map(nurse => (
                                <option key={nurse.id} value={nurse.id}>
                                  {nurse.fullname} ({nurse.username})
                                </option>
                              ))}
                            </select>
                            {!selectedNurse && (
                              <p className="text-sm text-gray-600 mt-1">
                                If no nurse is selected, the current nurse will be automatically assigned
                              </p>
                            )}
                          </div>
                        )}

                        {selectedNurseServices.length > 0 && selectedNurse && (
                          <div>
                            <label className="label">Service Notes (Optional)</label>
                            <textarea
                              className="input"
                              rows={3}
                              value={nurseServiceNotes}
                              onChange={(e) => setNurseServiceNotes(e.target.value)}
                              placeholder="Any specific instructions or notes for this service..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Doctor Assignment Section */}
                <div className="border border-gray-200 rounded-lg">
                  <SectionHeader
                    section="assignment"
                    title="Assign Doctor"
                    icon={UserPlus}
                    isCompleted={sectionCompletion.assignment}
                    isExpanded={expandedSections.assignment}
                    onToggle={toggleSection}
                  />
                  
                  {expandedSections.assignment && (
                    <div className="p-6 border-t border-gray-200">
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

                        {/* Doctor Workload Overview */}
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                            <Activity className="h-4 w-4 mr-1" />
                            Doctor Workload Status - {specialtyFilter === 'ALL' ? 'All Specialties' : specialtyFilter}
                          </h4>
                          <div className="grid grid-cols-1 gap-2 text-xs max-h-32 overflow-y-auto">
                            {doctors
                              .filter(doctor => 
                                specialtyFilter === 'ALL' || 
                                doctor.specialties?.some(spec => spec.includes(specialtyFilter))
                              )
                              .map(doctor => (
                                <div key={doctor.id} className="flex items-center justify-between p-1 hover:bg-blue-100 rounded">
                                  <div className="flex items-center">
                                    <span className="text-blue-700 truncate font-medium">{doctor.fullname}</span>
                                    {doctor.specialties && doctor.specialties.length > 0 && (
                                      <span className="ml-2 text-blue-600 text-xs">
                                        ({doctor.specialties.join(', ')})
                                      </span>
                                    )}
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    doctor.totalWorkload === 0 
                                      ? 'bg-green-100 text-green-700' 
                                      : doctor.totalWorkload <= 2
                                      ? 'bg-blue-100 text-blue-700'
                                      : doctor.totalWorkload <= 5
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {doctor.totalWorkload} patients
                                  </span>
                                </div>
                              ))}
                            {doctors.filter(doctor => 
                              specialtyFilter === 'ALL' || 
                              doctor.specialties?.some(spec => spec.includes(specialtyFilter))
                            ).length === 0 && (
                              <div className="text-center text-blue-600 py-2">
                                No doctors found for {specialtyFilter}
                              </div>
                            )}
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
                            <option value="">Choose a doctor</option>
                            {doctors
                              .filter(doctor => 
                                specialtyFilter === 'ALL' || 
                                doctor.specialties?.some(spec => spec.includes(specialtyFilter))
                              )
                              .map(doctor => (
                                <option key={doctor.id} value={doctor.id}>
                                  {doctor.fullname} - {doctor.specialties?.join(', ') || 'General'} 
                                  {doctor.totalWorkload > 0 ? ` (${doctor.totalWorkload} patients)` : ' (Available)'}
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Progress Summary</h4>
                  <div className="flex space-x-4 text-sm">
                    <span className={`flex items-center ${sectionCompletion.vitals ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Vitals (Optional)
                    </span>
                    <span className={`flex items-center ${sectionCompletion.complaint ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complaint
                    </span>
                    <span className={`flex items-center ${sectionCompletion.examination ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Examination
                    </span>
                    <span className={`flex items-center ${sectionCompletion.nurseService ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Nurse Service
                    </span>
                    <span className={`flex items-center ${sectionCompletion.assignment ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Assignment
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowVitalsForm(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn ${
                      (sectionCompletion.assignment || sectionCompletion.nurseService) && !isSubmitting
                        ? 'btn-primary' 
                        : 'btn-disabled'
                    }`}
                    disabled={(!sectionCompletion.assignment && !sectionCompletion.nurseService) || isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Complete Triage'}
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