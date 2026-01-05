import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, Image, Smile, Scan, Stethoscope, Pill, FileText, ArrowLeft, Save, User, TestTube, Eye, Download, Clock, CheckCircle, AlertTriangle, Package } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import DentalChart from '../../components/dental/DentalChart';
import DiagnosisNotes from '../../components/doctor/DiagnosisNotes';
import ImageViewer from '../../components/common/ImageViewer';
import DoctorServiceOrdering from '../../components/doctor/DoctorServiceOrdering';
import NurseServiceOrderingInterface from '../../components/doctor/NurseServiceOrderingInterface';
import LabOrdering from '../../components/doctor/LabOrdering';
import RadiologyOrdering from '../../components/doctor/RadiologyOrdering';
import MedicationOrdering from '../../components/doctor/MedicationOrdering';
import DentalServiceOrdering from '../../components/doctor/DentalServiceOrdering';
import EmergencyDrugOrdering from '../../components/doctor/EmergencyDrugOrdering';
import MaterialNeedsOrdering from '../../components/nurse/MaterialNeedsOrdering';
import Layout from '../../components/common/Layout';

const PatientConsultationPage = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [visit, setVisit] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [activeTab, setActiveTab] = useState('vitals');
  const [dentalRecord, setDentalRecord] = useState(null);
  const dentalChartRef = useRef(null);

  // Patient History state
  const [patientHistory, setPatientHistory] = useState(null);
  const [patientHistoryLoading, setPatientHistoryLoading] = useState(false);
  const [selectedHistoryVisitId, setSelectedHistoryVisitId] = useState(null);
  const [historyTab, setHistoryTab] = useState('visits');

  // Triage form state
  const [triageForm, setTriageForm] = useState({
    bloodPressure: '',
    temperature: '',
    heartRate: '',
    height: '',
    weight: '',
    oxygenSaturation: '',
    condition: '',
    notes: ''
  });
  const [recordingTriage, setRecordingTriage] = useState(false);

  // ImageViewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Complete Visit state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingVisit, setCompletingVisit] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    needsAppointment: false,
    appointmentDate: '',
    appointmentTime: '',
    appointmentNotes: ''
  });

  // Debug: track component renders and hook calls
  console.debug('[Consultation] Component render - visitId:', visitId, 'currentUser:', currentUser?.username, 'authLoading:', authLoading, 'activeTab:', activeTab);

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <Layout title="Loading..." subtitle="Please wait">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#2e13d1' }}></div>
            <p style={{ color: '#6B7280' }}>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    navigate('/login');
    return null;
  }

  // Check if current user is a dental specialist - memoize this calculation
  const isDentalSpecialist = useMemo(() => {
    const result = currentUser?.specialties?.includes('Dentist') || false;
    console.debug('[Consultation] isDentalSpecialist calculated:', result, 'from specialties:', currentUser?.specialties);
    return result;
  }, [currentUser]);

  // Memoize tabs array to prevent recreation on every render
  // Order: triage → vitals → patient-history → images → dental chart → dental services (only for dentists) → diagnosis notes → medication → emergency drugs → material needs → lab → radiology → nurse services
  const tabs = useMemo(() => {
    const tabsArray = [
      { id: 'triage', label: 'Triage', icon: Stethoscope },
      { id: 'vitals', label: 'Vitals & History', icon: Activity },
      { id: 'patient-history', label: 'Patient History', icon: User },
      { id: 'images', label: 'Attached Images', icon: Image },
      ...(isDentalSpecialist ? [{ id: 'dental', label: 'Dental Chart', icon: Smile }] : []),
      ...(isDentalSpecialist ? [{ id: 'dental-services', label: 'Dental Services', icon: Smile }] : []), // Only show for dental specialists
      { id: 'notes', label: 'Diagnosis Notes', icon: FileText },
      { id: 'medications', label: 'Medications', icon: Pill },
      { id: 'emergency-drugs', label: 'Emergency Drugs', icon: AlertTriangle },
      { id: 'material-needs', label: 'Material Needs', icon: Package },
      { id: 'lab', label: 'Lab Orders', icon: TestTube },
      { id: 'radiology', label: 'Radiology Orders', icon: Scan },
      { id: 'nurse-services', label: 'Nurse Services', icon: Stethoscope }
    ];
    console.debug('[Consultation] tabs array created:', tabsArray.map(t => t.id));
    return tabsArray;
  }, [isDentalSpecialist]);

  // Debug: track tab changes and visit load
  useEffect(() => {
    console.debug('[Consultation] useEffect 1 - visitId:', visitId, 'activeTab:', activeTab);
  }, [visitId, activeTab]);

  useEffect(() => {
    console.debug('[Consultation] useEffect 2 - fetchVisitData called for visitId:', visitId);
    fetchVisitData();
  }, [visitId]);

  // If current activeTab is not available for this user, switch to the first available tab
  useEffect(() => {
    console.debug('[Consultation] useEffect 3 - tab validation - currentUser:', currentUser?.username, 'activeTab:', activeTab, 'tabs:', tabs.map(t => t.id));

    // Always call this effect, but only act when we have the necessary data
    if (currentUser && tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
      console.debug('[Consultation] Switching activeTab from', activeTab, 'to', tabs[0].id);
      setActiveTab(tabs[0].id);
    }
  }, [currentUser, activeTab, tabs]);

  // Pre-fill triage form when triage tab is clicked (only then, not on page load)
  useEffect(() => {
    if (activeTab === 'triage' && vitals) {
      // Pre-fill form with existing vitals for editing
      setTriageForm({
        bloodPressure: vitals.bloodPressure || '',
        temperature: vitals.temperature ? vitals.temperature.toString() : '',
        heartRate: vitals.heartRate ? vitals.heartRate.toString() : '',
        height: vitals.height ? vitals.height.toString() : '',
        weight: vitals.weight ? vitals.weight.toString() : '',
        oxygenSaturation: vitals.oxygenSaturation || vitals.spo2 ? (vitals.oxygenSaturation || vitals.spo2).toString() : '',
        condition: vitals.condition || '',
        notes: vitals.notes || ''
      });
    } else if (activeTab === 'triage' && !vitals) {
      // Reset form if no vitals exist
      setTriageForm({
        bloodPressure: '',
        temperature: '',
        heartRate: '',
        height: '',
        weight: '',
        oxygenSaturation: '',
        condition: '',
        notes: ''
      });
    }
  }, [activeTab, vitals]);

  // Fetch patient history when patient-history tab is clicked
  useEffect(() => {
    if (activeTab === 'patient-history' && visit?.patient?.id && !patientHistory) {
      fetchPatientHistory(visit.patient.id);
    }
  }, [activeTab, visit?.patient?.id]);

  const fetchPatientHistory = async (patientId) => {
    try {
      setPatientHistoryLoading(true);
      const response = await api.get(`/doctors/patient-history/${patientId}`);
      setPatientHistory(response.data);
      // Auto-select the first visit if available
      if (response.data?.visits && response.data.visits.length > 0) {
        setSelectedHistoryVisitId(response.data.visits[0].id);
      }
    } catch (error) {
      console.error('Error fetching patient history:', error);
      toast.error('Failed to fetch patient history');
    } finally {
      setPatientHistoryLoading(false);
    }
  };

  const fetchVisitData = async () => {
    try {
      console.debug('[Consultation] fetchVisitData called for visitId:', visitId);
      setLoading(true);

      // Fetch visit details using dedicated endpoint
      const response = await api.get(`/doctors/visits/${visitId}`);

      console.debug('[Consultation] Visit data fetched:', response.data?.id, 'Patient:', response.data?.patient?.name);

      if (!response.data) {
        toast.error('Visit not found');
        navigate('/doctor/dashboard');
        return;
      }

      setVisit(response.data);

      // Set vitals from the visit data (already included)
      if (response.data.vitals && response.data.vitals.length > 0) {
        const latestVitals = response.data.vitals[0]; // Most recent vitals
        setVitals(latestVitals);
      } else {
        setVitals(null);
      }

      // Don't auto-fill triage form here - let user fill it manually when they click the triage tab
      // The form will be pre-filled when the triage tab is clicked (see useEffect for activeTab === 'triage')

      // Fetch dental record if user is a dentist
      if (currentUser?.specialties?.includes('Dentist')) {
        try {
          const dentalResponse = await api.get(`/dental/records/${response.data.patientId}/${visitId}`);
          setDentalRecord(dentalResponse.data.dentalRecord);
        } catch (error) {
          if (error.response?.status === 404) {
            // No dental record exists yet, this is normal - don't show error
            setDentalRecord(null);
          } else {
            console.error('Error fetching dental record:', error);
            // Don't show error toast for dental records as 404 is expected
          }
        }
      }

    } catch (error) {
      console.error('Error fetching visit data:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 404) {
        toast.error('Visit not found');
        navigate('/doctor/dashboard');
      } else if (error.response?.status === 403) {
        toast.error('Access denied to this visit');
        navigate('/doctor/dashboard');
      } else {
        toast.error('Failed to load patient data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDentalChartSave = (savedRecord) => {
    setDentalRecord(savedRecord);
    toast.success('Dental chart saved successfully');
  };

  const handleOrdersPlaced = async () => {
    // Refresh visit data to show new orders
    await fetchVisitData();
  };

  const handleTriageSubmit = async (e) => {
    e.preventDefault();

    if (recordingTriage) return;
    setRecordingTriage(true);

    try {
      const vitalsPayload = {
        visitId: parseInt(visitId),
        patientId: visit?.patient?.id
      };

      // Only add vitals fields if they have values
      if (triageForm.bloodPressure) vitalsPayload.bloodPressure = triageForm.bloodPressure;
      if (triageForm.temperature) vitalsPayload.temperature = parseFloat(triageForm.temperature);
      if (triageForm.heartRate) vitalsPayload.heartRate = parseInt(triageForm.heartRate);
      if (triageForm.height) vitalsPayload.height = parseFloat(triageForm.height);
      if (triageForm.weight) vitalsPayload.weight = parseFloat(triageForm.weight);
      if (triageForm.oxygenSaturation) vitalsPayload.oxygenSaturation = parseInt(triageForm.oxygenSaturation);
      if (triageForm.condition) vitalsPayload.condition = triageForm.condition;
      if (triageForm.notes) vitalsPayload.notes = triageForm.notes;

      await api.post('/nurses/vitals', vitalsPayload);
      toast.success('Triage vitals recorded successfully');

      // Refresh visit data to show updated vitals (this will pre-fill the form with saved values for editing)
      await fetchVisitData();

      // Switch to vitals tab to view recorded data
      setActiveTab('vitals');
    } catch (error) {
      console.error('Error recording triage vitals:', error);
      toast.error(error.response?.data?.error || 'Failed to record triage vitals');
    } finally {
      setRecordingTriage(false);
    }
  };

  // Check for pending lab/radiology orders - MUST be before any conditional returns
  // Complete button is enabled when:
  // - No orders exist at all
  // - Orders are completed/verified (have results)
  // - Orders were cancelled
  // - Visit status is IN_DOCTOR_QUEUE (patient is back in doctor's queue after results)
  // Complete button is disabled when:
  // - Orders are pending (UNPAID, PAID, QUEUED, IN_PROGRESS) AND status is NOT IN_DOCTOR_QUEUE
  // Note: Doctor can complete visit even without ordering medications
  // IMPORTANT: When status is IN_DOCTOR_QUEUE, always allow completion regardless of pending orders
  // This is because the patient is back in the doctor's queue after results came back
  const hasPendingOrders = useMemo(() => {
    if (!visit) return false;

    // If visit status is IN_DOCTOR_QUEUE, always allow completion
    // This means patient is back in doctor's queue after results came back
    if (visit.status === 'IN_DOCTOR_QUEUE') {
      return false; // Button enabled
    }

    // Check batch orders (new system) - check both order status AND individual service statuses
    // A batch order might be COMPLETED but still have services that are pending
    const pendingBatchLabOrders = (visit.batchOrders || []).filter(order => {
      if (order.type !== 'LAB') return false;
      // Check if batch order itself is pending
      if (['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS'].includes(order.status)) {
        return true;
      }
      // Check if any service within the batch order is still pending
      const hasPendingServices = (order.services || []).some(service =>
        ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS'].includes(service.status)
      );
      return hasPendingServices;
    });

    const pendingBatchRadiologyOrders = (visit.batchOrders || []).filter(order => {
      if (order.type !== 'RADIOLOGY') return false;
      // Check if batch order itself is pending
      if (['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS'].includes(order.status)) {
        return true;
      }
      // Check if any service within the batch order is still pending
      const hasPendingServices = (order.services || []).some(service =>
        ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS'].includes(service.status)
      );
      return hasPendingServices;
    });

    // Check legacy lab orders - only pending statuses block completion
    const pendingLabOrders = (visit.labOrders || []).filter(order =>
      ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS'].includes(order.status)
    );

    // Check legacy radiology orders - only pending statuses block completion
    const pendingRadiologyOrders = (visit.radiologyOrders || []).filter(order =>
      ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS'].includes(order.status)
    );

    // Check new lab test orders system - only pending statuses block completion
    const pendingLabTestOrders = (visit.labTestOrders || []).filter(order =>
      ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS'].includes(order.status)
    );

    // If any orders are pending, disable complete button
    // If orders are COMPLETED, VERIFIED, or CANCELLED, they don't block completion
    return pendingBatchLabOrders.length > 0 ||
      pendingBatchRadiologyOrders.length > 0 ||
      pendingLabOrders.length > 0 ||
      pendingRadiologyOrders.length > 0 ||
      pendingLabTestOrders.length > 0;
  }, [visit]);

  const handleBackToQueue = () => {
    navigate('/doctor/queue');
  };

  // Complete Visit Functions
  const handleCompleteVisit = () => {
    setShowCompleteModal(true);
  };

  const handleCompleteFormChange = (field, value) => {
    setCompleteForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitCompleteVisit = async () => {
    try {
      setCompletingVisit(true);

      const payload = {
        visitId: parseInt(visitId),
        diagnosis: '', // Will be extracted from diagnosis notes
        diagnosisDetails: '', // Will be extracted from diagnosis notes
        instructions: '', // Will be extracted from diagnosis notes
        finalNotes: '', // Will be extracted from diagnosis notes
        needsAppointment: completeForm.needsAppointment,
        appointmentDate: completeForm.appointmentDate,
        appointmentTime: completeForm.appointmentTime,
        appointmentNotes: completeForm.appointmentNotes
      };

      console.log('🔍 Completing visit with payload:', payload);

      const response = await api.post('/doctors/complete', payload);

      toast.success('Visit completed successfully! All data has been saved to patient history.');

      // Close modal and navigate back to queue
      setShowCompleteModal(false);
      navigate('/doctor/queue');

    } catch (error) {
      console.error('❌ Error completing visit:', error);
      toast.error(error.response?.data?.error || 'Failed to complete visit');
    } finally {
      setCompletingVisit(false);
    }
  };

  // Function to open ImageViewer
  const openImageViewer = (images, startIndex = 0) => {
    console.debug('[ImageViewer] Opening viewer with images:', images.length, 'startIndex:', startIndex);
    console.debug('[ImageViewer] Images data:', images);

    if (!images || images.length === 0) {
      console.warn('[ImageViewer] No images provided');
      return;
    }

    setImageViewerImages(images);
    setImageViewerIndex(startIndex);
    setImageViewerOpen(true);

    console.debug('[ImageViewer] Viewer opened successfully');
  };

  const closeImageViewer = () => {
    console.debug('[ImageViewer] Closing viewer');
    setImageViewerOpen(false);
    setImageViewerImages([]);
    setImageViewerIndex(0);
  };

  if (loading) {
    return (
      <Layout title="Loading..." subtitle="Loading patient data">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#2e13d1' }}></div>
            <p className="mt-4" style={{ color: '#0C0E0B' }}>Loading patient data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!visit) {
    return (
      <Layout title="Visit Not Found" subtitle="Visit could not be loaded">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p style={{ color: '#EA2E00' }}>Visit not found</p>
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="mt-4 px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#2e13d1', color: '#FFFFFF' }}
            >
              Back to Queue
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Patient Consultation - ${visit?.visitUid || visit?.id || 'Loading...'}`} subtitle="Diagnose and treat patient">
      <div className="space-y-3 w-full">
        {/* Patient Info Banner with Action Buttons - Horizontal Layout */}
        <div className="border-b py-3" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0" style={{ backgroundColor: '#2e13d1' }}>
                <User className="h-7 w-7" style={{ color: '#FFFFFF' }} />
              </div>
              <div className="flex items-center gap-6 flex-1 min-w-0 overflow-x-auto">
                <div className="flex-shrink-0">
                  <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Patient Name</p>
                  <p className="text-sm font-semibold whitespace-nowrap" style={{ color: '#0C0E0B' }}>{visit.patient?.name || 'N/A'}</p>
                </div>
                <div className="flex-shrink-0">
                  <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Age / Gender</p>
                  <p className="text-sm font-semibold whitespace-nowrap" style={{ color: '#0C0E0B' }}>
                    {visit.patient?.dob ? new Date().getFullYear() - new Date(visit.patient.dob).getFullYear() : 'N/A'} /
                    {visit.patient?.gender || 'N/A'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Blood Type</p>
                  <p className="text-sm font-semibold whitespace-nowrap" style={{ color: '#0C0E0B' }}>{visit.patient?.bloodType || 'N/A'}</p>
                </div>
                <div className="flex-shrink-0">
                  <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Mobile</p>
                  <p className="text-sm font-semibold whitespace-nowrap" style={{ color: '#0C0E0B' }}>{visit.patient?.mobile || 'N/A'}</p>
                </div>
                <div className="flex-shrink-0">
                  <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: visit.status === 'AWAITING_RESULTS_REVIEW' ? '#FEF3C7' : '#DBEAFE',
                        color: visit.status === 'AWAITING_RESULTS_REVIEW' ? '#92400E' : '#1E40AF'
                      }}
                    >
                      {visit.status?.replace(/_/g, ' ')}
                    </span>
                    {visit.status === 'IN_DOCTOR_QUEUE' && visit?.batchOrders?.some(order =>
                      order.type === 'DENTAL' && order.status === 'PAID'
                    ) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                          Back from Billing
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleBackToQueue}
                className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-base whitespace-nowrap"
                style={{ backgroundColor: '#2e13d1', color: '#FFFFFF' }}
              >
                <ArrowLeft className="inline-block mr-2 h-4 w-4" />
                Back to Queue
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-base whitespace-nowrap ${hasPendingOrders ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                style={{
                  backgroundColor: hasPendingOrders ? '#9CA3AF' : '#EA2E00',
                  color: '#FFFFFF'
                }}
                onClick={handleCompleteVisit}
                disabled={hasPendingOrders}
                title={hasPendingOrders ? 'Cannot complete visit with pending lab or radiology orders' : 'Complete this visit'}
              >
                Complete Visit
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
          <div>
            <div className="flex flex-wrap gap-1.5 py-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                // Define distinct colors for each tab
                const tabColors = {
                  'triage': { bg: '#FEF3C7', activeBg: '#FDE68A', text: '#92400E', border: '#F59E0B' },
                  'vitals': { bg: '#EFF6FF', activeBg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
                  'images': { bg: '#F0FDF4', activeBg: '#DCFCE7', text: '#166534', border: '#22C55E' },
                  'dental': { bg: '#FEF3C7', activeBg: '#FDE68A', text: '#92400E', border: '#F59E0B' },
                  'dental-services': { bg: '#FEF3C7', activeBg: '#FDE68A', text: '#92400E', border: '#F59E0B' },
                  'notes': { bg: '#F3E8FF', activeBg: '#E9D5FF', text: '#6B21A8', border: '#A855F7' },
                  'medications': { bg: '#FCE7F3', activeBg: '#FBCFE8', text: '#9F1239', border: '#EC4899' },
                  'emergency-drugs': { bg: '#FEE2E2', activeBg: '#FECACA', text: '#991B1B', border: '#EF4444' },
                  'material-needs': { bg: '#FEF3C7', activeBg: '#FDE68A', text: '#92400E', border: '#F59E0B' },
                  'lab': { bg: '#E0F2FE', activeBg: '#BAE6FD', text: '#0C4A6E', border: '#0EA5E9' },
                  'radiology': { bg: '#FFF1F2', activeBg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
                  'nurse-services': { bg: '#F0F9FF', activeBg: '#DBEAFE', text: '#1E3A8A', border: '#3B82F6' }
                };

                const colors = tabColors[tab.id] || { bg: '#F9FAFB', activeBg: '#F3F4F6', text: '#6B7280', border: '#9CA3AF' };

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 border-b-2 font-medium text-sm transition-all rounded-t-lg flex-1 ${isActive ? 'shadow-sm' : 'hover:opacity-90'
                      }`}
                    style={{
                      borderColor: isActive ? colors.border : 'transparent',
                      backgroundColor: isActive ? colors.activeBg : colors.bg,
                      color: isActive ? colors.text : colors.text,
                      borderBottomWidth: isActive ? '3px' : '2px',
                      opacity: isActive ? 1 : 0.8,
                      minWidth: 0
                    }}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="border p-4" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
          {activeTab === 'triage' && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Record Triage Vitals</h3>
              <form onSubmit={handleTriageSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      value={triageForm.bloodPressure}
                      onChange={(e) => setTriageForm({ ...triageForm, bloodPressure: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 120/80"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={triageForm.temperature}
                      onChange={(e) => setTriageForm({ ...triageForm, temperature: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 36.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={triageForm.heartRate}
                      onChange={(e) => setTriageForm({ ...triageForm, heartRate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 72"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={triageForm.weight}
                      onChange={(e) => setTriageForm({ ...triageForm, weight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={triageForm.height}
                      onChange={(e) => setTriageForm({ ...triageForm, height: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 175"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                      Oxygen Saturation (%)
                    </label>
                    <input
                      type="number"
                      value={triageForm.oxygenSaturation}
                      onChange={(e) => setTriageForm({ ...triageForm, oxygenSaturation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 98"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                    Condition
                  </label>
                  <input
                    type="text"
                    value={triageForm.condition}
                    onChange={(e) => setTriageForm({ ...triageForm, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Stable, Critical, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                    Notes
                  </label>
                  <textarea
                    value={triageForm.notes}
                    onChange={(e) => setTriageForm({ ...triageForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('vitals')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={recordingTriage}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recordingTriage}
                    className="px-4 py-2 rounded-md font-medium text-white transition-colors"
                    style={{
                      backgroundColor: recordingTriage ? '#9CA3AF' : '#2e13d1',
                      cursor: recordingTriage ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {recordingTriage ? 'Recording...' : 'Record Vitals'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'vitals' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold" style={{ color: '#0C0E0B' }}>Vitals & History</h3>
                {!vitals && visit && (
                  <button
                    onClick={() => setActiveTab('triage')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Stethoscope className="h-4 w-4" />
                    <span>Record Triage</span>
                  </button>
                )}
              </div>
              {vitals ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Blood Pressure</p>
                    <p className="text-xl font-semibold mt-1" style={{ color: '#0C0E0B' }}>
                      {vitals.bloodPressure || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Temperature</p>
                    <p className="text-xl font-semibold mt-1" style={{ color: '#0C0E0B' }}>
                      {vitals.temperature ? `${vitals.temperature}°C` : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Heart Rate</p>
                    <p className="text-xl font-semibold mt-1" style={{ color: '#0C0E0B' }}>
                      {vitals.heartRate ? `${vitals.heartRate} bpm` : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Weight</p>
                    <p className="text-xl font-semibold mt-1" style={{ color: '#0C0E0B' }}>
                      {vitals.weight ? `${vitals.weight} kg` : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Height</p>
                    <p className="text-xl font-semibold mt-1" style={{ color: '#0C0E0B' }}>
                      {vitals.height ? `${vitals.height} cm` : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>SpO2</p>
                    <p className="text-xl font-semibold mt-1" style={{ color: '#0C0E0B' }}>
                      {vitals.spo2 ? `${vitals.spo2}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#6B7280' }}>No vitals recorded for this visit</p>
                  <button
                    onClick={() => setActiveTab('triage')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Stethoscope className="h-4 w-4" />
                    <span>Record Triage</span>
                  </button>
                </div>
              )}

              {vitals && (
                <>
                  {/* Chief Complaint & History */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2" style={{ color: '#0C0E0B' }}>Chief Complaint & History</h4>
                    <div className="space-y-3">
                      {vitals.chiefComplaint && (
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Chief Complaint:</p>
                          <p className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#0C0E0B' }}>
                            {vitals.chiefComplaint}
                          </p>
                        </div>
                      )}
                      {vitals.historyOfPresentIllness && (
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>History of Present Illness:</p>
                          <p className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#0C0E0B' }}>
                            {vitals.historyOfPresentIllness}
                          </p>
                        </div>
                      )}
                      {vitals.onsetOfSymptoms && (
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Onset of Symptoms:</p>
                          <p className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#0C0E0B' }}>
                            {vitals.onsetOfSymptoms}
                          </p>
                        </div>
                      )}
                      {vitals.durationOfSymptoms && (
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Duration of Symptoms:</p>
                          <p className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#0C0E0B' }}>
                            {vitals.durationOfSymptoms}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Physical Examination */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2" style={{ color: '#0C0E0B' }}>Physical Examination</h4>
                    <div className="space-y-3">
                      {vitals.generalAppearance && (
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>General Appearance:</p>
                          <p className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#0C0E0B' }}>
                            {vitals.generalAppearance}
                          </p>
                        </div>
                      )}
                      {vitals.headAndNeck && (
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Head & Neck:</p>
                          <p className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#0C0E0B' }}>
                            {vitals.headAndNeck}
                          </p>
                        </div>
                      )}
                      {vitals.cardiovascularExam && (
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Cardiovascular:</p>
                          <p className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#0C0E0B' }}>
                            {vitals.cardiovascularExam}
                          </p>
                        </div>
                      )}
                      {vitals.respiratoryExam && (
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Respiratory:</p>
                          <p className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#0C0E0B' }}>
                            {vitals.respiratoryExam}
                          </p>
                        </div>
                      )}
                      {vitals.abdominalExam && (
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Abdominal:</p>
                          <p className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#0C0E0B' }}>
                            {vitals.abdominalExam}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nurse Notes */}
                  {vitals.notes && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-2" style={{ color: '#0C0E0B' }}>Nurse Notes</h4>
                      <p className="p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', color: '#0C0E0B' }}>
                        {vitals.notes}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'patient-history' && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Patient History</h3>
              {patientHistoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#2e13d1' }}></div>
                    <p style={{ color: '#6B7280' }}>Loading patient history...</p>
                  </div>
                </div>
              ) : patientHistory ? (
                <div className="space-y-6">
                  {/* Patient Info */}
                  <div className="p-4 rounded-lg border" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Patient Name</p>
                        <p className="text-sm font-semibold" style={{ color: '#0C0E0B' }}>{patientHistory.patient.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Age / Gender</p>
                        <p className="text-sm font-semibold" style={{ color: '#0C0E0B' }}>
                          {patientHistory.patient.age || 'N/A'} / {patientHistory.patient.gender || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Blood Type</p>
                        <p className="text-sm font-semibold" style={{ color: '#0C0E0B' }}>{patientHistory.patient.bloodType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Mobile</p>
                        <p className="text-sm font-semibold" style={{ color: '#0C0E0B' }}>{patientHistory.patient.phone || patientHistory.patient.mobile || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Visit List */}
                  {patientHistory.visits && patientHistory.visits.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold" style={{ color: '#0C0E0B' }}>Past Visits ({patientHistory.visits.length})</h4>
                      <div className="space-y-3">
                        {patientHistory.visits.map((visitItem) => (
                          <div
                            key={visitItem.id}
                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedHistoryVisitId === visitItem.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            onClick={() => setSelectedHistoryVisitId(visitItem.id)}
                            style={{ backgroundColor: selectedHistoryVisitId === visitItem.id ? '#EFF6FF' : '#FFFFFF' }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <p className="font-semibold" style={{ color: '#0C0E0B' }}>{visitItem.visitUid}</p>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${visitItem.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    visitItem.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {visitItem.status?.replace(/_/g, ' ') || 'N/A'}
                                  </span>
                                </div>
                                <p className="text-sm" style={{ color: '#6B7280' }}>
                                  {new Date(visitItem.date || visitItem.createdAt).toLocaleDateString()} {new Date(visitItem.date || visitItem.createdAt).toLocaleTimeString()}
                                </p>
                                {visitItem.diagnosis && (
                                  <p className="text-sm mt-1" style={{ color: '#0C0E0B' }}>
                                    <span className="font-medium">Diagnosis:</span> {visitItem.diagnosis}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Selected Visit Details */}
                      {selectedHistoryVisitId && (() => {
                        const selectedVisit = patientHistory.visits.find(v => v.id === selectedHistoryVisitId);
                        if (!selectedVisit) return null;

                        return (
                          <div className="mt-6 p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
                            <h4 className="text-md font-semibold mb-4" style={{ color: '#0C0E0B' }}>Visit Details</h4>

                            {/* Medications */}
                            {selectedVisit.medicationOrders && selectedVisit.medicationOrders.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-semibold mb-2" style={{ color: '#0C0E0B' }}>Medications ({selectedVisit.medicationOrders.length})</h5>
                                <div className="space-y-2">
                                  {selectedVisit.medicationOrders.map((med) => (
                                    <div key={med.id} className="p-3 border rounded" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                                      <p className="font-medium" style={{ color: '#0C0E0B' }}>{med.name}</p>
                                      <p className="text-sm" style={{ color: '#6B7280' }}>
                                        {med.dosageForm} {med.strength} - {med.quantity} {med.frequency} for {med.duration}
                                      </p>
                                      {med.route && <p className="text-xs" style={{ color: '#6B7280' }}>Route: {med.route}</p>}
                                      {med.instructions && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{med.instructions}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Lab Orders */}
                            {selectedVisit.labOrders && selectedVisit.labOrders.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-semibold mb-2" style={{ color: '#0C0E0B' }}>Lab Orders ({selectedVisit.labOrders.length})</h5>
                                <div className="space-y-2">
                                  {selectedVisit.labOrders.map((order) => (
                                    <div key={order.id} className="p-3 border rounded" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                                      <p className="font-medium" style={{ color: '#0C0E0B' }}>{order.type?.name || 'Lab Test'}</p>
                                      <p className="text-xs" style={{ color: '#6B7280' }}>Status: {order.status}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Radiology Orders */}
                            {selectedVisit.radiologyOrders && selectedVisit.radiologyOrders.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-semibold mb-2" style={{ color: '#0C0E0B' }}>Radiology Orders ({selectedVisit.radiologyOrders.length})</h5>
                                <div className="space-y-2">
                                  {selectedVisit.radiologyOrders.map((order) => (
                                    <div key={order.id} className="p-3 border rounded" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                                      <p className="font-medium" style={{ color: '#0C0E0B' }}>{order.type?.name || 'Radiology Test'}</p>
                                      <p className="text-xs" style={{ color: '#6B7280' }}>Status: {order.status}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(!selectedVisit.medicationOrders || selectedVisit.medicationOrders.length === 0) &&
                              (!selectedVisit.labOrders || selectedVisit.labOrders.length === 0) &&
                              (!selectedVisit.radiologyOrders || selectedVisit.radiologyOrders.length === 0) && (
                                <p className="text-sm" style={{ color: '#6B7280' }}>No orders found for this visit</p>
                              )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
                      <p style={{ color: '#6B7280' }}>No past history found for this patient</p>
                      <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>This appears to be the patient's first visit</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
                  <p style={{ color: '#6B7280' }}>No patient history available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'images' && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Patient Attached Images</h3>
              {visit?.attachedImages && visit.attachedImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {visit.attachedImages.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="w-full h-48 bg-gray-200 rounded-lg border-2 border-gray-200 overflow-hidden">
                        <img
                          src={getImageUrl(image.filePath)}
                          alt={image.description || 'Medical image'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image load error:', image.filePath);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        {/* Fallback for broken images */}
                        <div className="hidden w-full h-full flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <Image className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-xs">Image not available</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-800 truncate" title={image.fileName}>
                          {image.fileName}
                        </p>
                        {image.description && (
                          <p className="text-xs text-gray-600 truncate" title={image.description}>
                            {image.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(image.uploadedAt).toLocaleDateString()}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const allImages = visit.attachedImages.map(img => ({
                              filePath: getImageUrl(img.filePath),
                              fileName: img.fileName,
                              description: img.description
                            }));
                            openImageViewer(allImages, index);
                          }}
                          className="mt-2 w-full px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Image
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Image className="h-12 w-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
                  <p style={{ color: '#6B7280' }}>No images attached to this visit</p>
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>Images uploaded by billing staff will appear here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dental' && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Dental Chart</h3>

              {currentUser?.specialties?.includes('Dentist') ? (
                <div>
                  {dentalRecord ? (
                    <div className="mb-4 p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium" style={{ color: '#0C0E0B' }}>Existing Dental Record</p>
                          <p className="text-sm" style={{ color: '#6B7280' }}>
                            Created: {new Date(dentalRecord.createdAt).toLocaleDateString()}
                          </p>
                          {dentalRecord.doctor && (
                            <p className="text-sm" style={{ color: '#6B7280' }}>
                              By: Dr. {dentalRecord.doctor.fullname}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setDentalRecord(null)}
                          className="px-3 py-1 text-sm rounded"
                          style={{ backgroundColor: '#EA2E00', color: '#FFFFFF' }}
                        >
                          Edit Chart
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 p-4 border-2 border-dashed rounded-lg" style={{ borderColor: '#D1D5DB' }}>
                      <div className="text-center">
                        <Smile className="h-8 w-8 mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                        <p style={{ color: '#6B7280' }}>No dental chart created yet</p>
                        <p className="text-sm" style={{ color: '#9CA3AF' }}>Create a new dental chart for this visit</p>
                      </div>
                    </div>
                  )}

                  <DentalChart
                    ref={dentalChartRef}
                    patientId={visit?.patientId}
                    visitId={visitId}
                    onSave={handleDentalChartSave}
                    initialData={dentalRecord}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Smile className="h-12 w-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
                  <p style={{ color: '#6B7280' }}>Dental chart is only available to dentists</p>
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>
                    This feature is restricted to doctors with dental specialty
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dental-services' && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Dental Services</h3>

              {/* Show ordered dental services with completion status */}
              {(() => {
                const dentalOrders = visit?.batchOrders?.filter(order => order.type === 'DENTAL') || [];
                const hasDentalOrders = dentalOrders.length > 0;

                return hasDentalOrders ? (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3" style={{ color: '#0C0E0B' }}>Ordered Dental Procedures</h4>
                    <div className="space-y-4">
                      {dentalOrders.map((order) => (
                        <div key={order.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium" style={{ color: '#0C0E0B' }}>
                                Order #{order.id}
                              </p>
                              <p className="text-sm" style={{ color: '#6B7280' }}>
                                Status: <span className="font-medium">{order.status}</span>
                              </p>
                              <p className="text-sm" style={{ color: '#6B7280' }}>
                                Created: {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              order.status === 'UNPAID' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>Procedures:</p>
                            <div className="space-y-2">
                              {order.services?.map((service, index) => {
                                // Check if this procedure is completed
                                const isCompleted = service.dentalProcedureCompletion !== null;

                                return (
                                  <div key={index} className={`p-3 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium" style={{ color: '#0C0E0B' }}>
                                            {service.service.name}
                                          </span>
                                          {isCompleted && (
                                            <CheckCircle className="h-5 w-5" style={{ color: '#059669' }} />
                                          )}
                                        </div>
                                        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                                          {service.service.code} • {service.service.price.toFixed(2)} ETB
                                        </p>
                                        {service.instructions && (
                                          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                                            Instructions: {service.instructions}
                                          </p>
                                        )}
                                        {isCompleted && service.dentalProcedureCompletion && (
                                          <div className="mt-2 p-2 rounded bg-green-100">
                                            <p className="text-xs font-medium" style={{ color: '#059669' }}>
                                              Completed: {new Date(service.dentalProcedureCompletion.completedAt).toLocaleString()}
                                            </p>
                                            {service.dentalProcedureCompletion.notes && (
                                              <p className="text-xs mt-1" style={{ color: '#047857' }}>
                                                Notes: {service.dentalProcedureCompletion.notes}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      {order.status === 'PAID' && !isCompleted && (
                                        <button
                                          onClick={async () => {
                                            try {
                                              await api.post('/dental/procedures/complete', {
                                                batchOrderServiceId: service.id,
                                                notes: ''
                                              });
                                              toast.success('Procedure marked as completed');
                                              await fetchVisitData();
                                            } catch (error) {
                                              console.error('Error completing procedure:', error);
                                              toast.error(error.response?.data?.error || 'Failed to complete procedure');
                                            }
                                          }}
                                          className="px-3 py-1.5 rounded-lg text-sm font-medium"
                                          style={{ backgroundColor: '#2e13d1', color: '#FFFFFF' }}
                                        >
                                          Mark Complete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {order.instructions && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-1" style={{ color: '#0C0E0B' }}>Order Instructions:</p>
                              <p className="text-sm" style={{ color: '#6B7280' }}>{order.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Order New Dental Services */}
              <div className={visit?.batchOrders?.some(o => o.type === 'DENTAL') ? 'border-t pt-6' : ''} style={{ borderColor: '#E5E7EB' }}>
                <DentalServiceOrdering
                  visitId={visitId}
                  patientId={visit?.patient?.id}
                  onOrdersPlaced={handleOrdersPlaced}
                  existingOrders={visit?.batchOrders?.filter(o => o.type === 'DENTAL') || []}
                />
              </div>
            </div>
          )}

          {activeTab === 'lab' && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Lab Orders & Results</h3>

              {/* Lab Results Section - Show results when available */}
              {(() => {
                // Check old system (batchOrders)
                const labBatchOrders = visit?.batchOrders?.filter(order => order.type === 'LAB') || [];
                const hasOldLabOrders = labBatchOrders.length > 0;
                const hasOldLabResults = labBatchOrders.some(order =>
                  (order.labResults && order.labResults.length > 0) ||
                  (order.detailedResults && order.detailedResults.length > 0)
                );

                // Check new system (labTestOrders)
                const labTestOrders = visit?.labTestOrders || [];
                const hasNewLabOrders = labTestOrders.length > 0;
                const hasNewLabResults = labTestOrders.some(order =>
                  order.results && order.results.length > 0
                );

                const hasLabOrders = hasOldLabOrders || hasNewLabOrders;
                const hasLabResults = hasOldLabResults || hasNewLabResults;

                return hasLabResults ? (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 text-green-600" style={{ color: '#059669' }}>
                      📊 Lab Results Available
                    </h4>
                    <div className="space-y-4">
                      {labBatchOrders.map((batchOrder) => (
                        (batchOrder.labResults && batchOrder.labResults.length > 0) ||
                        (batchOrder.detailedResults && batchOrder.detailedResults.length > 0)
                      ) && (
                          <div key={batchOrder.id} className="p-4 border rounded-lg border-green-200 bg-green-50">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-medium text-green-800">
                                  Order #{batchOrder.id} - Lab Results
                                </p>
                                <p className="text-sm text-green-600">
                                  Completed: {new Date(batchOrder.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-200 rounded-full">
                                COMPLETED
                              </span>
                            </div>

                            {/* Show detailed lab results */}
                            {batchOrder.detailedResults && batchOrder.detailedResults.length > 0 && (
                              <div className="space-y-4 mb-4">
                                {batchOrder.detailedResults.map((detailedResult, index) => (
                                  <div key={detailedResult.id || index} className="p-4 bg-white rounded border">
                                    <div className="flex justify-between items-start mb-3">
                                      <h5 className="font-medium text-gray-800">
                                        {detailedResult.template?.name || `Lab Test ${index + 1}`}
                                      </h5>
                                      <div className="text-right">
                                        <span className="text-xs text-gray-500">
                                          {new Date(detailedResult.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="mt-1">
                                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${detailedResult.status === 'COMPLETED'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {detailedResult.status}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Display lab values in a professional format */}
                                    {detailedResult.results && (
                                      <div className="mb-3">
                                        <h6 className="text-sm font-medium text-gray-700 mb-2">Test Results:</h6>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                          {Object.entries(detailedResult.results).map(([key, value]) => (
                                            <div key={key} className="p-2 bg-gray-50 rounded text-sm">
                                              <div className="font-medium text-gray-800 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                              </div>
                                              <div className="text-gray-600">{value}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {detailedResult.additionalNotes && (
                                      <div className="mb-2">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes:</p>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                          {detailedResult.additionalNotes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Show regular lab results if any */}
                            {batchOrder.labResults && batchOrder.labResults.length > 0 && (
                              <div className="space-y-3">
                                {batchOrder.labResults.map((result, index) => (
                                  <div key={result.id || index} className="p-3 bg-white rounded border">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-gray-800">
                                        {result.testType?.name || `Test ${index + 1}`}
                                      </h5>
                                      <span className="text-xs text-gray-500">
                                        {new Date(result.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>

                                    {result.resultText && (
                                      <div className="mb-2">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Result:</p>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                          {result.resultText}
                                        </p>
                                      </div>
                                    )}

                                    {result.additionalNotes && (
                                      <div className="mb-2">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                          {result.additionalNotes}
                                        </p>
                                      </div>
                                    )}

                                    {result.attachments && result.attachments.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                          {result.attachments.map((attachment, attIndex) => (
                                            <div key={attIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                              <FileText className="h-4 w-4 text-blue-500" />
                                              <span className="text-xs text-gray-600 truncate">
                                                {attachment.fileName || `File ${attIndex + 1}`}
                                              </span>
                                              <button
                                                onClick={() => window.open(getImageUrl(attachment.fileUrl), '_blank')}
                                                className="text-blue-500 hover:text-blue-700 text-xs"
                                              >
                                                View
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* New Lab Test Orders (New System) */}
                    {hasNewLabResults && (
                      <div className="mt-6 space-y-4">
                        {labTestOrders
                          .filter(order => order.results && order.results.length > 0)
                          .map((order) => {
                            const latestResult = order.results[0];
                            return (
                              <div key={order.id} className="p-4 border rounded-lg border-green-200 bg-green-50">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <p className="font-medium text-green-800">
                                      {order.labTest.name}
                                    </p>
                                    <p className="text-sm text-green-600">
                                      Completed: {new Date(latestResult.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-200 rounded-full">
                                    COMPLETED
                                  </span>
                                </div>

                                {/* Display results with field labels */}
                                {order.labTest.resultFields && order.labTest.resultFields.length > 0 && latestResult.results && (
                                  <div className="mb-3">
                                    <h6 className="text-sm font-medium text-gray-700 mb-2">Test Results:</h6>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      {order.labTest.resultFields.map((field) => {
                                        const fieldValue = latestResult.results[field.fieldName];
                                        if (fieldValue === undefined || fieldValue === null || fieldValue === '') return null;

                                        return (
                                          <div key={field.id} className="p-2 bg-white rounded text-sm">
                                            <div className="font-medium text-gray-800">
                                              {field.label}
                                            </div>
                                            <div className="text-gray-600">{fieldValue} {field.unit || ''}</div>
                                            {field.normalRange && (
                                              <div className="text-xs text-gray-500 mt-1">Normal: {field.normalRange}</div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {latestResult.additionalNotes && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes:</p>
                                    <p className="text-sm text-gray-600 bg-white p-2 rounded">
                                      {latestResult.additionalNotes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                ) : hasLabOrders ? (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 text-gray-600" style={{ color: '#6B7280' }}>
                      ⏳ Lab Orders Pending Results
                    </h4>
                    <div className="space-y-3">
                      {labBatchOrders.map((batchOrder) => (
                        <div key={batchOrder.id} className="p-4 border rounded-lg border-gray-200 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">
                                Order #{batchOrder.id}
                              </p>
                              <p className="text-sm text-gray-600">
                                Status: <span className="font-medium">{batchOrder.status}</span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Created: {new Date(batchOrder.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded-full">
                              {batchOrder.status}
                            </span>
                          </div>

                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2 text-gray-800">Tests Ordered:</p>
                            {batchOrder.services?.map((service, index) => (
                              <div key={index} className="text-sm mb-1 text-gray-700">
                                • {service.investigationType?.name}
                              </div>
                            ))}
                          </div>

                          {batchOrder.instructions && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-1 text-gray-800">Instructions:</p>
                              <p className="text-sm text-gray-700">{batchOrder.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Show pending new lab test orders */}
                      {labTestOrders
                        .filter(order => !order.results || order.results.length === 0)
                        .map((order) => (
                          <div key={order.id} className="p-4 border rounded-lg border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800">
                                  {order.labTest.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Status: <span className="font-medium">{order.status}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  Created: {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded-full">
                                {order.status}
                              </span>
                            </div>

                            {order.instructions && (
                              <div className="mt-3">
                                <p className="text-sm font-medium mb-1 text-gray-800">Instructions:</p>
                                <p className="text-sm text-gray-700">{order.instructions}</p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 mb-6">
                    <TestTube className="h-12 w-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
                    <p style={{ color: '#6B7280' }}>No lab orders for this visit</p>
                  </div>
                );
              })()}

              {/* Lab Ordering Interface */}
              <div className="border-t pt-6" style={{ borderColor: '#E5E7EB' }}>
                <LabOrdering
                  visitId={visitId}
                  patientId={visit?.patient?.id}
                  onOrdersPlaced={handleOrdersPlaced}
                  existingOrders={visit?.batchOrders?.filter(order => order.type === 'LAB') || []}
                />
              </div>
            </div>
          )}

          {activeTab === 'radiology' && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Radiology Orders & Results</h3>

              {/* Radiology Results Section - Show results when available */}
              {(() => {
                const radiologyBatchOrders = visit?.batchOrders?.filter(order => order.type === 'RADIOLOGY') || [];
                const hasRadiologyOrders = radiologyBatchOrders.length > 0;
                const hasRadiologyResults = radiologyBatchOrders.some(order => order.radiologyResults && order.radiologyResults.length > 0);

                return hasRadiologyResults ? (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 text-green-600" style={{ color: '#059669' }}>
                      📊 Radiology Results Available
                    </h4>
                    <div className="space-y-4">
                      {radiologyBatchOrders.map((batchOrder) => (
                        batchOrder.radiologyResults && batchOrder.radiologyResults.length > 0 && (
                          <div key={batchOrder.id} className="p-4 border rounded-lg border-green-200 bg-green-50">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-medium text-green-800">
                                  Order #{batchOrder.id} - Radiology Results
                                </p>
                                <p className="text-sm text-green-600">
                                  Completed: {new Date(batchOrder.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-200 rounded-full">
                                COMPLETED
                              </span>
                            </div>

                            <div className="space-y-3">
                              {batchOrder.radiologyResults.map((result, index) => (
                                <div key={result.id || index} className="p-3 bg-white rounded border">
                                  <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-medium text-gray-800">
                                      {result.testType?.name || `Test ${index + 1}`}
                                    </h5>
                                    <span className="text-xs text-gray-500">
                                      {new Date(result.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>

                                  {result.resultText && (
                                    <div className="mb-2">
                                      <p className="text-sm font-medium text-gray-700 mb-1">Result:</p>
                                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                        {result.resultText}
                                      </p>
                                    </div>
                                  )}

                                  {result.additionalNotes && (
                                    <div className="mb-2">
                                      <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                        {result.additionalNotes}
                                      </p>
                                    </div>
                                  )}

                                  {result.attachments && result.attachments.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-2">Images & Reports:</p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {result.attachments.map((attachment, attIndex) => (
                                          <div key={attIndex} className="relative group">
                                            <div
                                              className="cursor-pointer p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
                                              onClick={() => {
                                                console.debug('[ImageClick] Image clicked, preparing ImageViewer data');
                                                const allImages = result.attachments.map(att => ({
                                                  fileUrl: getImageUrl(att.fileUrl),
                                                  fileName: att.fileName
                                                }));
                                                console.debug('[ImageClick] Mapped images:', allImages);
                                                openImageViewer(allImages, attIndex);
                                              }}
                                            >
                                              <div className="flex items-center space-x-2 mb-2">
                                                <Scan className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-medium text-gray-800 truncate">
                                                  {attachment.fileName || `File ${attIndex + 1}`}
                                                </span>
                                              </div>
                                              <div className="text-xs text-gray-500 mb-2">
                                                {attachment.fileType || 'Unknown type'}
                                              </div>

                                              {/* Show image preview */}
                                              <div className="relative w-full h-32 bg-gray-200 rounded overflow-hidden">
                                                <img
                                                  src={getImageUrl(attachment.fileUrl)}
                                                  alt={attachment.fileName || `Image ${attIndex + 1}`}
                                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                  onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                  }}
                                                />
                                                <div className="hidden absolute inset-0 bg-gray-300 flex items-center justify-center">
                                                  <Scan className="h-8 w-8 text-gray-500" />
                                                </div>
                                              </div>

                                              <div className="mt-2 flex space-x-2">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.debug('[ViewButton] View button clicked');
                                                    const allImages = result.attachments.map(att => ({
                                                      fileUrl: att.fileUrl,
                                                      fileName: att.fileName
                                                    }));
                                                    console.debug('[ViewButton] Mapped images:', allImages);
                                                    openImageViewer(allImages, attIndex);
                                                  }}
                                                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                                >
                                                  <Eye className="h-3 w-3 inline mr-1" />
                                                  View
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const link = document.createElement('a');
                                                    link.href = getImageUrl(attachment.fileUrl);
                                                    link.download = attachment.fileName || 'download';
                                                    link.click();
                                                  }}
                                                  className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                                                >
                                                  <Download className="h-3 w-3 inline mr-1" />
                                                  Download
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                ) : hasRadiologyOrders ? (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 text-gray-600" style={{ color: '#6B7280' }}>
                      ⏳ Radiology Orders Pending Results
                    </h4>
                    <div className="space-y-3">
                      {radiologyBatchOrders.map((batchOrder) => (
                        <div key={batchOrder.id} className="p-4 border rounded-lg border-gray-200 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">
                                Order #{batchOrder.id}
                              </p>
                              <p className="text-sm text-gray-600">
                                Status: <span className="font-medium">{batchOrder.status}</span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Created: {new Date(batchOrder.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded-full">
                              {batchOrder.status}
                            </span>
                          </div>

                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2 text-gray-800">Tests Ordered:</p>
                            {batchOrder.services?.map((service, index) => (
                              <div key={index} className="text-sm mb-1 text-gray-700">
                                • {service.investigationType?.name}
                              </div>
                            ))}
                          </div>

                          {batchOrder.instructions && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-1 text-gray-800">Instructions:</p>
                              <p className="text-sm text-gray-700">{batchOrder.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 mb-6">
                    <Scan className="h-12 w-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
                    <p style={{ color: '#6B7280' }}>No radiology orders for this visit</p>
                  </div>
                );
              })()}

              {/* Radiology Ordering Interface */}
              <div className="border-t pt-6" style={{ borderColor: '#E5E7EB' }}>
                <RadiologyOrdering
                  visitId={visitId}
                  patientId={visit?.patient?.id}
                  onOrdersPlaced={handleOrdersPlaced}
                  existingOrders={visit?.batchOrders?.filter(order => order.type === 'RADIOLOGY') || []}
                />
              </div>
            </div>
          )}

          {activeTab === 'nurse-services' && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Nurse Services</h3>

              {/* Completed Nurse Services */}
              {visit?.nurseServiceAssignments && visit.nurseServiceAssignments.length > 0 ? (
                <div className="mb-6">
                  <h4 className="font-medium mb-3" style={{ color: '#0C0E0B' }}>Completed Services</h4>
                  <div className="space-y-3">
                    {visit.nurseServiceAssignments.map((assignment) => (
                      <div key={assignment.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium" style={{ color: '#0C0E0B' }}>
                              {assignment.service.name}
                            </h5>
                            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                              {assignment.service.description}
                            </p>
                            {assignment.notes && (
                              <p className="text-sm mt-2 p-2 rounded" style={{ backgroundColor: '#E5E7EB', color: '#0C0E0B' }}>
                                <strong>Nurse Notes:</strong> {assignment.notes}
                              </p>
                            )}
                            <div className="flex items-center mt-2 text-xs" style={{ color: '#6B7280' }}>
                              <span>Assigned to: {assignment.assignedNurse.fullname}</span>
                              <span className="mx-2">•</span>
                              <span>Completed: {new Date(assignment.completedAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                            <p className="text-sm font-medium mt-1" style={{ color: '#0C0E0B' }}>
                              ETB {assignment.service.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: '#6B7280' }}>
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No nurse services completed yet</p>
                </div>
              )}

              {/* Order New Nurse Services - List Interface */}
              <div className="mt-6">
                <h4 className="font-medium mb-3" style={{ color: '#0C0E0B' }}>Order New Services</h4>
                <NurseServiceOrderingInterface visit={visit} onOrdersPlaced={handleOrdersPlaced} />
              </div>
            </div>
          )}

          {activeTab === 'medications' && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Medications</h3>

              {/* Check if dental procedures need to be completed first */}
              {(() => {
                const dentalOrders = visit?.batchOrders?.filter(order => order.type === 'DENTAL' && order.status === 'PAID') || [];
                const unpaidDentalServices = dentalOrders.flatMap(order =>
                  order.services?.filter(service => !service.dentalProcedureCompletion) || []
                );
                const hasIncompleteDentalProcedures = unpaidDentalServices.length > 0;

                return hasIncompleteDentalProcedures ? (
                  <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: '#D97706' }} />
                      <div>
                        <p className="font-medium" style={{ color: '#92400E' }}>
                          Complete Dental Procedures First
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#78350F' }}>
                          Please complete all ordered dental procedures before prescribing medications.
                          {unpaidDentalServices.length} procedure{unpaidDentalServices.length > 1 ? 's' : ''} pending completion.
                        </p>
                        <button
                          onClick={() => setActiveTab('dental-services')}
                          className="mt-3 px-4 py-2 rounded-lg text-sm font-medium"
                          style={{ backgroundColor: '#2e13d1', color: '#FFFFFF' }}
                        >
                          Go to Dental Services
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Existing Medication Orders */}
              {visit?.medicationOrders && visit.medicationOrders.length > 0 ? (
                <div className="mb-6">
                  <h4 className="font-medium mb-3" style={{ color: '#0C0E0B' }}>Prescribed Medications</h4>
                  <div className="space-y-3">
                    {visit.medicationOrders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium" style={{ color: '#0C0E0B' }}>{order.name}</p>
                            <p className="text-sm" style={{ color: '#6B7280' }}>
                              {order.strength} • {order.dosageForm}
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium" style={{ color: '#0C0E0B' }}>Quantity:</span>
                                <span className="ml-2" style={{ color: '#6B7280' }}>{order.quantity}</span>
                              </div>
                              <div>
                                <span className="font-medium" style={{ color: '#0C0E0B' }}>Frequency:</span>
                                <span className="ml-2" style={{ color: '#6B7280' }}>{order.frequency}</span>
                              </div>
                              <div>
                                <span className="font-medium" style={{ color: '#0C0E0B' }}>Duration:</span>
                                <span className="ml-2" style={{ color: '#6B7280' }}>{order.duration}</span>
                              </div>
                              <div>
                                <span className="font-medium" style={{ color: '#0C0E0B' }}>Category:</span>
                                <span className="ml-2" style={{ color: '#6B7280' }}>{order.category || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Continuous Infusion Details */}
                            {order.continuousInfusion && (
                              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center mb-2">
                                  <Clock className="h-4 w-4 text-purple-600 mr-2" />
                                  <span className="font-medium text-purple-800">Continuous Infusion</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-purple-700">Duration:</span>
                                    <span className="ml-2 text-purple-600">{order.continuousInfusion.days} days</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-purple-700">Daily Dose:</span>
                                    <span className="ml-2 text-purple-600">{order.continuousInfusion.dailyDose}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-purple-700">Frequency:</span>
                                    <span className="ml-2 text-purple-600">{order.continuousInfusion.frequency}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-purple-700">Status:</span>
                                    <span className="ml-2 text-purple-600">{order.continuousInfusion.status}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            {order.instructions && (
                              <div className="mt-3">
                                <p className="text-sm font-medium mb-1" style={{ color: '#0C0E0B' }}>Instructions:</p>
                                <p className="text-sm" style={{ color: '#6B7280' }}>{order.instructions}</p>
                              </div>
                            )}
                            {order.additionalNotes && (
                              <div className="mt-2">
                                <p className="text-sm font-medium mb-1" style={{ color: '#0C0E0B' }}>Additional Notes:</p>
                                <p className="text-sm" style={{ color: '#6B7280' }}>{order.additionalNotes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 mb-6">
                  <Pill className="h-12 w-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
                  <p style={{ color: '#6B7280' }}>No medications prescribed for this visit</p>
                </div>
              )}

              {/* Medication Prescription Interface */}
              <div className="border-t pt-6" style={{ borderColor: '#E5E7EB' }}>
                <MedicationOrdering
                  visitId={visitId}
                  patientId={visit?.patient?.id}
                  patient={visit?.patient}
                  doctor={currentUser}
                  onOrdersPlaced={handleOrdersPlaced}
                  existingOrders={visit?.medicationOrders || []}
                />
              </div>
            </div>
          )}

          {activeTab === 'emergency-drugs' && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Emergency Drugs</h3>
              <EmergencyDrugOrdering
                visit={visit}
                onOrdersPlaced={handleOrdersPlaced}
              />
            </div>
          )}

          {activeTab === 'material-needs' && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Material Needs</h3>
              <MaterialNeedsOrdering
                visit={visit}
                onOrdersPlaced={handleOrdersPlaced}
              />
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <DiagnosisNotes
                visitId={visitId}
                patientId={visit?.patient?.id}
                patientName={visit?.patient?.name}
                onSave={(result) => {
                  console.log('Diagnosis notes auto-saved:', result);
                  // Auto-save managed by component UI
                }}
              />
            </div>
          )}
        </div>

        {/* ImageViewer Modal */}
        <ImageViewer
          isOpen={imageViewerOpen}
          onClose={closeImageViewer}
          images={imageViewerImages}
          currentIndex={imageViewerIndex}
        />

        {/* Complete Visit Modal */}
        {showCompleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold" style={{ color: '#2e13d1' }}>
                  Complete Visit
                </h2>
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Visit Completion Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Completing Visit
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>All diagnosis details, instructions, and notes have been captured in the Diagnosis & Notes section.</p>
                        <p className="mt-1">This will save all visit data to the patient's medical history.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Follow-up Appointment */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={completeForm.needsAppointment}
                      onChange={(e) => handleCompleteFormChange('needsAppointment', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium" style={{ color: '#2e13d1' }}>
                      Schedule follow-up appointment
                    </span>
                  </label>
                </div>

                {/* Appointment Details */}
                {completeForm.needsAppointment && (
                  <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#2e13d1' }}>
                          Appointment Date *
                        </label>
                        <input
                          type="date"
                          value={completeForm.appointmentDate}
                          onChange={(e) => handleCompleteFormChange('appointmentDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min={new Date().toISOString().split('T')[0]}
                          required={completeForm.needsAppointment}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#2e13d1' }}>
                          Appointment Time *
                        </label>
                        <input
                          type="time"
                          value={completeForm.appointmentTime}
                          onChange={(e) => handleCompleteFormChange('appointmentTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={completeForm.needsAppointment}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#2e13d1' }}>
                        Appointment Notes
                      </label>
                      <textarea
                        value={completeForm.appointmentNotes}
                        onChange={(e) => handleCompleteFormChange('appointmentNotes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Notes for the follow-up appointment"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={completingVisit}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCompleteVisit}
                  disabled={completingVisit || (completeForm.needsAppointment && (!completeForm.appointmentDate || !completeForm.appointmentTime))}
                  className="px-4 py-2 rounded-md font-medium text-white transition-colors"
                  style={{
                    backgroundColor: completingVisit ? '#9CA3AF' : '#EA2E00',
                    cursor: completingVisit || (completeForm.needsAppointment && (!completeForm.appointmentDate || !completeForm.appointmentTime)) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {completingVisit ? 'Completing...' : 'Complete Visit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Viewer */}
        <ImageViewer
          isOpen={imageViewerOpen}
          onClose={closeImageViewer}
          images={imageViewerImages}
          currentIndex={imageViewerIndex}
        />
      </div>
    </Layout>
  );
};

export default PatientConsultationPage;

