import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Phone, 
  Calendar,
  Activity,
  FileText,
  Stethoscope,
  Pill,
  Scan,
  Eye,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  Camera,
  Upload,
  Printer,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ImageViewer from '../common/ImageViewer';
import DentalChartDisplay from '../common/DentalChartDisplay';
import PatientAttachedImagesSection from '../common/PatientAttachedImagesSection';
import DentalChart from '../dental/DentalChart';
import DentalPhotosSection from '../dental/DentalPhotosSection';
import DoctorServiceOrdering from './DoctorServiceOrdering';

const UnifiedQueue = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ total: 0, urgent: 0, results: 0, new: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImages, setCurrentImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dentalRecord, setDentalRecord] = useState(null);
  const dentalChartRef = useRef(null);
  const [showNurseServiceOrdering, setShowNurseServiceOrdering] = useState(false);
  
  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    vitals: true,
    chiefComplaint: true,
    history: false,
    physicalExam: false,
    assessment: true,
    orders: true,
    dental: true,
    beforePhotos: true,
    attachedImages: true,
    results: true
  });

  // Form data state
  const [formData, setFormData] = useState({
    // Chief Complaint & History
    chiefComplaint: '',
    historyOfPresentIllness: '',
    onsetOfSymptoms: '',
    durationOfSymptoms: '',
    severityOfSymptoms: '',
    associatedSymptoms: '',
    relievingFactors: '',
    aggravatingFactors: '',
    
    // Past Medical History
    pastMedicalHistory: '',
    currentMedications: '',
    knownAllergies: '',
    familyHistory: '',
    socialHistory: '',
    
    // Physical Examination
    generalAppearance: '',
    vitalSigns: '',
    headAndNeck: '',
    cardiovascularExam: '',
    respiratoryExam: '',
    abdominalExam: '',
    extremities: '',
    neurologicalExam: '',
    
    // Assessment & Plan
    primaryDiagnosis: '',
    secondaryDiagnosis: '',
    differentialDiagnosis: '',
    treatmentPlan: '',
    notes: ''
  });

  // Lab and Radiology ordering state
  const [selectedLabTests, setSelectedLabTests] = useState([]);
  const [selectedRadiologyTests, setSelectedRadiologyTests] = useState([]);
  const [labInstructions, setLabInstructions] = useState('');
  const [radiologyInstructions, setRadiologyInstructions] = useState('');
  const [labTestOptions, setLabTestOptions] = useState([]);
  const [radiologyTestOptions, setRadiologyTestOptions] = useState([]);
  const [alreadyOrderedLabTests, setAlreadyOrderedLabTests] = useState([]);
  const [alreadyOrderedRadiologyTests, setAlreadyOrderedRadiologyTests] = useState([]);

  // Medication ordering state
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [medicationOptions, setMedicationOptions] = useState([]);
  const [medicationSearch, setMedicationSearch] = useState('');

  useEffect(() => {
    fetchUnifiedQueue();
    fetchInvestigationTypes();
    fetchMedicationCatalog();
  }, []);

  const fetchUnifiedQueue = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors/unified-queue');
      if (response.data.success) {
        setQueue(response.data.queue);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching unified queue:', error);
      toast.error('Failed to fetch patient queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestigationTypes = async () => {
    try {
      const response = await api.get('/doctors/investigation-types');
      const types = response.data.investigationTypes || [];
      
      const labTypes = types.filter(type => type.category === 'LAB');
      const radiologyTypes = types.filter(type => type.category === 'RADIOLOGY');
      
      setLabTestOptions(labTypes);
      setRadiologyTestOptions(radiologyTypes);
    } catch (error) {
      console.error('Error fetching investigation types:', error);
      toast.error('Failed to load test options');
    }
  };

  const fetchMedicationCatalog = async () => {
    try {
      const response = await api.get('/medications/catalog');
      setMedicationOptions(response.data.medications || []);
    } catch (error) {
      console.error('Error fetching medication catalog:', error);
    }
  };

  const fetchDentalRecord = async (patientId, visitId) => {
    try {
      const response = await api.get(`/dental/records/${patientId}/${visitId}`);
      setDentalRecord(response.data.dentalRecord);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching dental record:', error);
      }
      setDentalRecord(null);
    }
  };

  const handlePatientSelect = (visit) => {
    // Navigate to consultation page instead of showing modal
    navigate(`/doctor/consultation/${visit.id}`);
  };

  const resetFormData = () => {
    setFormData({
      chiefComplaint: '',
      historyOfPresentIllness: '',
      onsetOfSymptoms: '',
      durationOfSymptoms: '',
      severityOfSymptoms: '',
      associatedSymptoms: '',
      relievingFactors: '',
      aggravatingFactors: '',
      pastMedicalHistory: '',
      currentMedications: '',
      knownAllergies: '',
      familyHistory: '',
      socialHistory: '',
      generalAppearance: '',
      vitalSigns: '',
      headAndNeck: '',
      cardiovascularExam: '',
      respiratoryExam: '',
      abdominalExam: '',
      extremities: '',
      neurologicalExam: '',
      primaryDiagnosis: '',
      secondaryDiagnosis: '',
      differentialDiagnosis: '',
      treatmentPlan: '',
      notes: ''
    });
    setSelectedLabTests([]);
    setSelectedRadiologyTests([]);
    setLabInstructions('');
    setRadiologyInstructions('');
    setSelectedMedications([]);
  };

  const checkAlreadyOrderedTests = async (visitId) => {
    try {
      const response = await api.get(`/doctors/order-status/${visitId}`);
      const { labTests, radiologyTests } = response.data;
      setAlreadyOrderedLabTests(labTests || []);
      setAlreadyOrderedRadiologyTests(radiologyTests || []);
    } catch (error) {
      console.error('Error checking ordered tests:', error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 1:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 2:
        return <CheckCircle className="w-5 h-5 text-yellow-500" />;
      case 3:
        return <Clock className="w-5 h-5" style={{ color: '#2e13d1' }} />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return 'border-l-red-500 bg-red-50';
      case 2:
        return 'border-l-yellow-500 bg-yellow-50';
      case 3:
        return 'border-l-4 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 1:
        return 'URGENT';
      case 2:
        return 'RESULTS READY';
      case 3:
        return 'NEW CONSULTATION';
      default:
        return 'PENDING';
    }
  };

  const getPriorityBorderStyle = (priority) => {
    switch (priority) {
      case 1:
        return { borderLeftColor: '#EA2E00', borderLeftWidth: '4px' };
      case 2:
        return { borderLeftColor: '#F59E0B', borderLeftWidth: '4px' };
      case 3:
        return { borderLeftColor: '#2e13d1', borderLeftWidth: '4px' };
      default:
        return { borderLeftColor: '#6B7280', borderLeftWidth: '4px' };
    }
  };

  // Handle lab test ordering
  const handleOrderLabTests = async () => {
    if (selectedLabTests.length === 0) {
      toast.error('Please select at least one lab test');
      return;
    }

    try {
      const batchOrderData = {
        visitId: selectedVisit.id,
        patientId: selectedVisit.patientId,
        type: 'LAB',
        instructions: labInstructions || 'Lab tests ordered by doctor',
        services: selectedLabTests.map(testId => ({
          serviceId: testId.toString(),
          instructions: labInstructions || `Lab test: ${testId}`
        }))
      };

      await api.post('/batch-orders/create', batchOrderData);

      toast.success('Lab tests ordered successfully');
      setSelectedLabTests([]);
      setLabInstructions('');
      checkAlreadyOrderedTests(selectedVisit.id);
      fetchUnifiedQueue();
    } catch (error) {
      console.error('Error ordering lab tests:', error);
      toast.error(error.response?.data?.message || 'Failed to order lab tests');
    }
  };

  // Handle radiology test ordering
  const handleOrderRadiologyTests = async () => {
    if (selectedRadiologyTests.length === 0) {
      toast.error('Please select at least one radiology test');
      return;
    }

    try {
      const batchOrderData = {
        visitId: selectedVisit.id,
        patientId: selectedVisit.patientId,
        type: 'RADIOLOGY',
        instructions: radiologyInstructions || 'Radiology tests ordered by doctor',
        services: selectedRadiologyTests.map(testId => ({
          serviceId: testId.toString(),
          instructions: radiologyInstructions || `Radiology test: ${testId}`
        }))
      };

      await api.post('/batch-orders/create', batchOrderData);

      toast.success('Radiology tests ordered successfully');
      setSelectedRadiologyTests([]);
      setRadiologyInstructions('');
      checkAlreadyOrderedTests(selectedVisit.id);
      fetchUnifiedQueue();
    } catch (error) {
      console.error('Error ordering radiology tests:', error);
      toast.error(error.response?.data?.message || 'Failed to order radiology tests');
    }
  };

  // Handle nurse service ordering
  const handleOrderNurseServices = async () => {
    setShowNurseServiceOrdering(true);
  };

  // Handle nurse service order completion
  const handleNurseServiceOrderPlaced = (orderData) => {
    toast.success('Nurse services ordered successfully!');
    setShowNurseServiceOrdering(false);
    fetchUnifiedQueue(); // Refresh the queue
  };

  // Handle medication ordering
  const handleAddMedication = (medication) => {
    const newMed = {
      medicationId: medication.id,
      name: medication.name,
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
    setSelectedMedications([...selectedMedications, newMed]);
    setMedicationSearch('');
  };

  const handleUpdateMedication = (index, field, value) => {
    const updated = [...selectedMedications];
    updated[index][field] = value;
    setSelectedMedications(updated);
  };

  const handleRemoveMedication = (index) => {
    const updated = selectedMedications.filter((_, i) => i !== index);
    setSelectedMedications(updated);
  };

  const handleOrderMedications = async () => {
    if (selectedMedications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    // Validate that all required fields are filled
    const incomplete = selectedMedications.some(med => 
      !med.dosage || !med.frequency || !med.duration
    );

    if (incomplete) {
      toast.error('Please fill in dosage, frequency, and duration for all medications');
      return;
    }

    try {
      await api.post('/doctors/medication-orders', {
        visitId: selectedVisit.id,
        patientId: selectedVisit.patientId,
        medications: selectedMedications
      });

      toast.success('Medications prescribed successfully');
      setSelectedMedications([]);
      fetchUnifiedQueue();
    } catch (error) {
      console.error('Error prescribing medications:', error);
      toast.error('Failed to prescribe medications');
    }
  };

  // Handle complete visit
  const handleCompleteVisit = async () => {
    try {
      // Save dental chart if dentist
      if (currentUser?.specialties?.includes('Dentist') && dentalChartRef.current) {
        const dentalData = dentalChartRef.current.getCurrentData();
        if (dentalData) {
          try {
            if (dentalRecord) {
              await api.put(`/dental/records/${dentalRecord.id}`, dentalData);
            } else {
              await api.post('/dental/records', {
                ...dentalData,
                visitId: selectedVisit.id,
                patientId: selectedVisit.patientId
              });
            }
          } catch (error) {
            console.error('Error saving dental chart:', error);
            toast.error('Failed to save dental chart');
            return;
          }
        }
      }

      // Complete visit
      await api.put(`/doctors/visits/${selectedVisit.id}/complete`, {
        diagnosis: formData.primaryDiagnosis,
        diagnosisDetails: formData.treatmentPlan,
        instructions: formData.notes
      });

      toast.success('Visit completed successfully');
      setSelectedVisit(null);
      fetchUnifiedQueue();
    } catch (error) {
      console.error('Error completing visit:', error);
      toast.error('Failed to complete visit');
    }
  };

  // Handle direct complete (no lab/radiology)
  const handleDirectComplete = async () => {
    try {
      await api.post(`/doctors/direct-complete/${selectedVisit.id}`);
      toast.success('Visit moved to results queue for medication prescription');
      setSelectedVisit(null);
      fetchUnifiedQueue();
    } catch (error) {
      console.error('Error moving to results queue:', error);
      toast.error('Failed to move visit to results queue');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#2e13d1' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold" style={{ color: '#2e13d1' }}>{stats.total}</p>
            </div>
            <User className="w-8 h-8" style={{ color: '#2e13d1' }} />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgent Cases</p>
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Results Ready</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.results}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Consultations</p>
              <p className="text-2xl font-bold" style={{ color: '#2e13d1' }}>{stats.new}</p>
            </div>
            <Stethoscope className="w-8 h-8" style={{ color: '#2e13d1' }} />
          </div>
        </div>
      </div>

      {/* Queue List and Patient Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Queue List */}
        <div className="lg:col-span-1">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold" style={{ color: '#0C0E0B' }}>
              Patient Queue ({stats.total})
            </h2>
          </div>
          
          {/* Patient List - Direct listing without container */}
          {queue.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Stethoscope className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No patients in queue</h3>
              <p className="text-gray-500">Patients will appear here when they're ready for consultation</p>
            </div>
          ) : (
            queue.map((visit, index) => (
              <div
                key={visit.id}
                onClick={() => handlePatientSelect(visit)}
                className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-in slide-in-from-left-4 fade-in mb-3 ${
                  selectedVisit?.id === visit.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                  {/* Patient Card */}
                  <div className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
                    visit.priority === 1 ? 'border-red-200 shadow-red-100' :
                    visit.priority === 2 ? 'border-yellow-200 shadow-yellow-100' :
                    'border-gray-200'
                  }`}>
                    {/* Priority Indicator Bar */}
                    <div 
                      className={`h-1 w-full ${
                        visit.priority === 1 ? 'bg-red-500 animate-pulse' :
                        visit.priority === 2 ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                    />
                    
                    {/* Card Content */}
                    <div className="p-4 bg-gradient-to-br from-white to-gray-50">
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            visit.priority === 1 ? 'bg-red-100' :
                            visit.priority === 2 ? 'bg-yellow-100' :
                            'bg-blue-100'
                          }`}>
                            <User className={`w-5 h-5 ${
                              visit.priority === 1 ? 'text-red-600' :
                              visit.priority === 2 ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg" style={{ color: '#0C0E0B' }}>
                              {visit.patient?.name}
                            </h3>
                            <p className="text-sm text-gray-500 font-mono">
                              #{visit.patient?.id}
                            </p>
                          </div>
                        </div>
                        
                        {/* Priority Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          visit.priority === 1 ? 'bg-red-100 text-red-700' :
                          visit.priority === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {getPriorityText(visit.priority)}
                        </div>
                      </div>

                      {/* Patient Info Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors duration-200">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          <span className="capitalize font-medium">{visit.patient?.type || 'Regular'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors duration-200">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="capitalize font-medium">{visit.patient?.gender || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors duration-200">
                          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                          <span className="font-medium">{visit.patient?.mobile || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors duration-200">
                          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                          <span className="font-medium">{visit.patient?.bloodType || 'Unknown'}</span>
                        </div>
                      </div>

                      {/* Status and Time */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 font-medium">
                            {new Date(visit.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {/* Visit Status */}
                        <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                          visit.status === 'WAITING_FOR_DOCTOR' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          visit.status === 'NURSE_SERVICES_COMPLETED' ? 'bg-green-100 text-green-700 border border-green-200' :
                          visit.status === 'UNDER_DOCTOR_REVIEW' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                          visit.status === 'AWAITING_RESULTS_REVIEW' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {visit.status.replace(/_/g, ' ')}
                        </div>
                      </div>

                      {/* Priority Reason */}
                      {visit.priorityReason && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-800 font-medium leading-relaxed">
                              {visit.priorityReason}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Selection Indicator */}
                      {selectedVisit?.id === visit.id && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
        </div>

        {/* Patient Details Panel */}
        <div className="lg:col-span-2">
          {selectedVisit && (
            <div className="space-y-4">
              {/* Patient Header */}
              <div className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#0C0E0B' }}>{selectedVisit.patient?.name}</h2>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                      <div><span className="font-medium">ID:</span> {selectedVisit.patient?.id}</div>
                      <div><span className="font-medium">Type:</span> {selectedVisit.patient?.type}</div>
                      <div><span className="font-medium">Phone:</span> {selectedVisit.patient?.mobile}</div>
                      <div><span className="font-medium">Gender:</span> {selectedVisit.patient?.gender}</div>
                      <div><span className="font-medium">DOB:</span> {new Date(selectedVisit.patient?.dob).toLocaleDateString()}</div>
                      <div><span className="font-medium">Blood Type:</span> {selectedVisit.patient?.bloodType}</div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${
                    selectedVisit.priority === 1 ? 'bg-red-100 text-red-700' :
                    selectedVisit.priority === 2 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {getPriorityText(selectedVisit.priority)}
                  </div>
                </div>
              </div>

              {/* Completed Services Section */}
              {selectedVisit.nurseServiceAssignments && selectedVisit.nurseServiceAssignments.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: '#0C0E0B' }}>
                    <Stethoscope className="h-5 w-5 mr-2 text-green-500" />
                    Completed Services
                  </h3>
                  <div className="space-y-3">
                    {selectedVisit.nurseServiceAssignments.map((service) => (
                      <div key={service.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-green-900">{service.service.name}</h4>
                            <p className="text-sm text-green-700">{service.service.description}</p>
                            {service.notes && (
                              <p className="text-sm text-green-600 mt-1 italic">"{service.notes}"</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm text-green-600">
                              Completed by: {service.assignedNurse.fullname}
                            </div>
                            <div className="text-xs text-green-500">
                              {new Date(service.completedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Patient Attached Images Section */}
              <div className="card p-4">
                <PatientAttachedImagesSection
                  visitId={selectedVisit.id}
                  patientId={selectedVisit.patient?.id}
                  title="Patient Attached Images"
                  canUpload={false}
                  onImageClick={(images, index) => {
                    setCurrentImages(images);
                    setCurrentImageIndex(index);
                    setShowImageViewer(true);
                  }}
                />
              </div>

              {/* Ordering Section */}
              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: '#0C0E0B' }}>
                  <TestTube className="h-5 w-5 mr-2 text-blue-500" />
                  Order Tests & Services
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Lab Tests Button */}
                  <button
                    onClick={handleOrderLabTests}
                    className="flex items-center justify-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="text-center">
                      <TestTube className="h-8 w-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-medium text-gray-900">Lab Tests</h4>
                      <p className="text-sm text-gray-500">Blood, urine, etc.</p>
                    </div>
                  </button>

                  {/* Radiology Button */}
                  <button
                    onClick={handleOrderRadiologyTests}
                    className="flex items-center justify-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors group"
                  >
                    <div className="text-center">
                      <Scan className="h-8 w-8 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-medium text-gray-900">Radiology</h4>
                      <p className="text-sm text-gray-500">X-ray, CT, MRI</p>
                    </div>
                  </button>

                  {/* Nurse Services Button */}
                  <button
                    onClick={handleOrderNurseServices}
                    className="flex items-center justify-center p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors group"
                  >
                    <div className="text-center">
                      <Stethoscope className="h-8 w-8 text-green-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-medium text-gray-900">Nurse Services</h4>
                      <p className="text-sm text-gray-500">Special treatments</p>
                    </div>
                  </button>
                </div>

                {/* Order Status */}
                {(alreadyOrderedLabTests.length > 0 || alreadyOrderedRadiologyTests.length > 0) && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Already Ordered:</h5>
                    <div className="space-y-1 text-sm text-blue-700">
                      {alreadyOrderedLabTests.length > 0 && (
                        <div>• Lab Tests: {alreadyOrderedLabTests.length} test(s)</div>
                      )}
                      {alreadyOrderedRadiologyTests.length > 0 && (
                        <div>• Radiology: {alreadyOrderedRadiologyTests.length} test(s)</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Main content will continue... */}
              <div className="text-center text-gray-500 py-8">
                [Other content sections to be implemented...]
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer */}
      {showImageViewer && (
        <ImageViewer
          images={currentImages}
          initialIndex={currentImageIndex}
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
        />
      )}

      {/* Nurse Service Ordering Modal */}
      {showNurseServiceOrdering && selectedVisit && (
        <DoctorServiceOrdering
          visit={selectedVisit}
          onClose={() => setShowNurseServiceOrdering(false)}
          onOrdersPlaced={handleNurseServiceOrderPlaced}
        />
      )}
    </div>
  );
};

export default UnifiedQueue;
