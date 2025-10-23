import React, { useState, useEffect } from 'react';
import { 
  User, Search, FileText, Calendar, TestTube, Scan, Pill, Heart, Clock, 
  CheckCircle, AlertTriangle, Download, Eye, Circle, Stethoscope, 
  Activity, Image, Receipt, Users, ChevronDown, ChevronRight, 
  MapPin, Phone, Mail, Calendar as CalendarIcon, UserCheck
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DentalChartDisplay from '../common/DentalChartDisplay';
import ImageViewer from '../common/ImageViewer';

const ComprehensivePatientHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [imageViewerState, setImageViewerState] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0
  });

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/patients/search?query=${searchTerm}`);
      setPatients(response.data.patients || []);
    } catch (error) {
      toast.error('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHistory = async (patientId) => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors/patient-history/${patientId}`);
      setPatientHistory(response.data);
    } catch (error) {
      toast.error('Failed to fetch patient history');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSelectedVisitId(null);
    setExpandedSections({});
    fetchPatientHistory(patient.id);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedVisitId(null);
    setExpandedSections({});
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const openImageViewer = (images, currentIndex = 0) => {
    setImageViewerState({
      isOpen: true,
      images: images || [],
      currentIndex
    });
  };

  const closeImageViewer = () => {
    setImageViewerState({
      isOpen: false,
      images: [],
      currentIndex: 0
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'DISPENSED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'QUEUED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getVisitStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'UNDER_DOCTOR_REVIEW':
      case 'AWAITING_RESULTS_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatDateOnly = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  const renderVisitOverview = (visit) => {
    const hasVitals = visit.vitals && visit.vitals.length > 0;
    const hasLabResults = visit.labOrders && visit.labOrders.length > 0;
    const hasRadiologyResults = visit.radiologyOrders && visit.radiologyOrders.length > 0;
    const hasMedications = visit.medicationOrders && visit.medicationOrders.length > 0;
    const hasDentalRecords = visit.dentalRecords && visit.dentalRecords.length > 0;
    const hasNurseServices = visit.nurseServiceAssignments && visit.nurseServiceAssignments.length > 0;
    const hasDiagnosisNotes = visit.diagnosisNotes && visit.diagnosisNotes.length > 0;
    const hasAttachedImages = visit.attachedImages && visit.attachedImages.length > 0;

    return (
      <div className="space-y-6">
        {/* Visit Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Visit #{visit.visitUid}</h3>
              <p className="text-sm text-gray-600 mt-1">{formatDate(visit.createdAt)}</p>
              <p className="text-sm text-gray-600">Created by: {visit.createdBy?.fullname || 'System'}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVisitStatusColor(visit.status)}`}>
              {visit.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Vitals</p>
                <p className="text-lg font-semibold text-gray-900">{hasVitals ? '✓' : '✗'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <TestTube className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Lab Tests</p>
                <p className="text-lg font-semibold text-gray-900">{visit.labOrders?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Scan className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Radiology</p>
                <p className="text-lg font-semibold text-gray-900">{visit.radiologyOrders?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Pill className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Medications</p>
                <p className="text-lg font-semibold text-gray-900">{visit.medicationOrders?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis Section */}
        {visit.diagnosis && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Final Diagnosis
            </h4>
            <p className="text-blue-800 font-medium text-lg">{visit.diagnosis}</p>
            {visit.diagnosisDetails && (
              <div className="mt-4">
                <p className="text-sm font-medium text-blue-700 mb-2">Diagnosis Details</p>
                <p className="text-blue-600">{visit.diagnosisDetails}</p>
              </div>
            )}
            {visit.instructions && (
              <div className="mt-4">
                <p className="text-sm font-medium text-blue-700 mb-2">Patient Instructions</p>
                <p className="text-blue-600">{visit.instructions}</p>
              </div>
            )}
            {visit.finalNotes && (
              <div className="mt-4">
                <p className="text-sm font-medium text-blue-700 mb-2">Final Notes</p>
                <p className="text-blue-600">{visit.finalNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Detailed Sections */}
        <div className="space-y-4">
          {/* Vitals Section */}
          {hasVitals && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('vitals')}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Heart className="h-5 w-5 text-red-500 mr-3" />
                  <span className="font-medium text-gray-900">Vital Signs</span>
                  <span className="ml-2 text-sm text-gray-500">({visit.vitals.length} record{visit.vitals.length !== 1 ? 's' : ''})</span>
                </div>
                {expandedSections.vitals ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {expandedSections.vitals && (
                <div className="px-6 pb-4 space-y-4">
                  {visit.vitals.map((vital, index) => (
                    <div key={vital.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      {/* Header with Date/Time */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="font-semibold text-gray-900">
                            {formatDate(vital.createdAt)}
                          </span>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Record #{visit.vitals.length - index}
                        </span>
                      </div>

                      {/* Basic Vitals Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Blood Pressure</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {vital.bloodPressure || (vital.bloodPressureSystolic && vital.bloodPressureDiastolic 
                              ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}` 
                              : 'N/A')} mmHg
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Temperature</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {vital.temperature ? `${vital.temperature}°${vital.tempUnit || 'C'}` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Heart Rate</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {vital.heartRate ? `${vital.heartRate} bpm` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Respiration Rate</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {vital.respirationRate ? `${vital.respirationRate} /min` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">O2 Saturation</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Height</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {vital.height ? `${vital.height} cm` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Weight</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {vital.weight ? `${vital.weight} kg` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">BMI</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {vital.bmi ? vital.bmi.toFixed(1) : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Additional Vitals (if present) */}
                      {(vital.painScoreRest || vital.painScoreMovement || vital.sedationScore || 
                        vital.gcsEyes || vital.gcsVerbal || vital.gcsMotor) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Measurements</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {vital.painScoreRest && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">Pain Score (Rest)</p>
                                <p className="text-sm font-semibold">{vital.painScoreRest}/10</p>
                              </div>
                            )}
                            {vital.painScoreMovement && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">Pain Score (Movement)</p>
                                <p className="text-sm font-semibold">{vital.painScoreMovement}/10</p>
                              </div>
                            )}
                            {vital.sedationScore && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">Sedation Score</p>
                                <p className="text-sm font-semibold">{vital.sedationScore}</p>
                              </div>
                            )}
                            {(vital.gcsEyes || vital.gcsVerbal || vital.gcsMotor) && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">GCS Score</p>
                                <p className="text-sm font-semibold">
                                  E{vital.gcsEyes || '-'} V{vital.gcsVerbal || '-'} M{vital.gcsMotor || '-'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Chief Complaint & History */}
                      {(vital.chiefComplaint || vital.historyOfPresentIllness || vital.onsetOfSymptoms || 
                        vital.durationOfSymptoms || vital.severityOfSymptoms || vital.associatedSymptoms ||
                        vital.relievingFactors || vital.aggravatingFactors) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Chief Complaint & History</h4>
                          <div className="space-y-2">
                            {vital.chiefComplaint && (
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Chief Complaint</p>
                                <p className="text-sm text-gray-900">{vital.chiefComplaint}</p>
                              </div>
                            )}
                            {vital.historyOfPresentIllness && (
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">History of Present Illness</p>
                                <p className="text-sm text-gray-900">{vital.historyOfPresentIllness}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                              {vital.onsetOfSymptoms && (
                                <div className="bg-white p-2 rounded border border-gray-200">
                                  <p className="text-xs text-gray-500">Onset</p>
                                  <p className="text-sm text-gray-900">{vital.onsetOfSymptoms}</p>
                                </div>
                              )}
                              {vital.durationOfSymptoms && (
                                <div className="bg-white p-2 rounded border border-gray-200">
                                  <p className="text-xs text-gray-500">Duration</p>
                                  <p className="text-sm text-gray-900">{vital.durationOfSymptoms}</p>
                                </div>
                              )}
                              {vital.severityOfSymptoms && (
                                <div className="bg-white p-2 rounded border border-gray-200">
                                  <p className="text-xs text-gray-500">Severity</p>
                                  <p className="text-sm text-gray-900">{vital.severityOfSymptoms}</p>
                                </div>
                              )}
                              {vital.associatedSymptoms && (
                                <div className="bg-white p-2 rounded border border-gray-200">
                                  <p className="text-xs text-gray-500">Associated Symptoms</p>
                                  <p className="text-sm text-gray-900">{vital.associatedSymptoms}</p>
                                </div>
                              )}
                              {vital.relievingFactors && (
                                <div className="bg-white p-2 rounded border border-gray-200">
                                  <p className="text-xs text-gray-500">Relieving Factors</p>
                                  <p className="text-sm text-gray-900">{vital.relievingFactors}</p>
                                </div>
                              )}
                              {vital.aggravatingFactors && (
                                <div className="bg-white p-2 rounded border border-gray-200">
                                  <p className="text-xs text-gray-500">Aggravating Factors</p>
                                  <p className="text-sm text-gray-900">{vital.aggravatingFactors}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Physical Examination */}
                      {(vital.generalAppearance || vital.headAndNeck || vital.cardiovascularExam || 
                        vital.respiratoryExam || vital.abdominalExam || vital.extremities || 
                        vital.neurologicalExam) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Physical Examination</h4>
                          <div className="space-y-2">
                            {vital.generalAppearance && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">General Appearance</p>
                                <p className="text-sm text-gray-900">{vital.generalAppearance}</p>
                              </div>
                            )}
                            {vital.headAndNeck && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">Head & Neck</p>
                                <p className="text-sm text-gray-900">{vital.headAndNeck}</p>
                              </div>
                            )}
                            {vital.cardiovascularExam && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">Cardiovascular</p>
                                <p className="text-sm text-gray-900">{vital.cardiovascularExam}</p>
                              </div>
                            )}
                            {vital.respiratoryExam && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">Respiratory</p>
                                <p className="text-sm text-gray-900">{vital.respiratoryExam}</p>
                              </div>
                            )}
                            {vital.abdominalExam && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">Abdominal</p>
                                <p className="text-sm text-gray-900">{vital.abdominalExam}</p>
                              </div>
                            )}
                            {vital.extremities && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">Extremities</p>
                                <p className="text-sm text-gray-900">{vital.extremities}</p>
                              </div>
                            )}
                            {vital.neurologicalExam && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">Neurological</p>
                                <p className="text-sm text-gray-900">{vital.neurologicalExam}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Condition & Notes */}
                      {(vital.condition || vital.notes) && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Information</h4>
                          <div className="space-y-2">
                            {vital.condition && (
                              <div className="bg-white p-2 rounded border border-gray-200">
                                <p className="text-xs text-gray-500">Condition</p>
                                <p className="text-sm text-gray-900">{vital.condition}</p>
                              </div>
                            )}
                            {vital.notes && (
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Notes</p>
                                <p className="text-sm text-gray-900">{vital.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lab Results Section */}
          {hasLabResults && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('lab')}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <TestTube className="h-5 w-5 text-blue-500 mr-3" />
                  <span className="font-medium text-gray-900">Lab Results</span>
                  <span className="ml-2 text-sm text-gray-500">({visit.labOrders.length} test{visit.labOrders.length !== 1 ? 's' : ''})</span>
                </div>
                {expandedSections.lab ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {expandedSections.lab && (
                <div className="px-6 pb-4 space-y-4">
                  {visit.labOrders.map((order) => (
                    <div key={order.id} className="bg-blue-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{order.type?.name || 'Lab Test'}</p>
                          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      {order.result && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">{order.result}</p>
                        </div>
                      )}
                      {order.attachments && order.attachments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-500 mb-1">Attachments</p>
                          <div className="flex space-x-2">
                            {order.attachments.map((attachment) => (
                              <button
                                key={attachment.id}
                                className="text-blue-600 hover:text-blue-800 text-sm underline"
                                onClick={() => window.open(attachment.url, '_blank')}
                              >
                                {attachment.filename}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Radiology Results Section */}
          {hasRadiologyResults && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('radiology')}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Scan className="h-5 w-5 text-purple-500 mr-3" />
                  <span className="font-medium text-gray-900">Radiology Results</span>
                  <span className="ml-2 text-sm text-gray-500">({visit.radiologyOrders.length} test{visit.radiologyOrders.length !== 1 ? 's' : ''})</span>
                </div>
                {expandedSections.radiology ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {expandedSections.radiology && (
                <div className="px-6 pb-4 space-y-4">
                  {visit.radiologyOrders.map((order) => (
                    <div key={order.id} className="bg-purple-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{order.type?.name || 'Radiology Test'}</p>
                          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      {order.result && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">{order.result}</p>
                        </div>
                      )}
                      {order.attachments && order.attachments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-500 mb-1">Images</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {order.attachments.map((attachment) => (
                              <div key={attachment.id} className="relative">
                                <img
                                  src={attachment.url}
                                  alt={attachment.filename}
                                  className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                  onClick={() => openImageViewer([attachment], 0)}
                                />
                                <p className="text-xs text-gray-500 mt-1 truncate">{attachment.filename}</p>
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
          )}

          {/* Medications Section */}
          {hasMedications && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('medications')}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Pill className="h-5 w-5 text-green-500 mr-3" />
                  <span className="font-medium text-gray-900">Medications</span>
                  <span className="ml-2 text-sm text-gray-500">({visit.medicationOrders.length} medication{visit.medicationOrders.length !== 1 ? 's' : ''})</span>
                </div>
                {expandedSections.medications ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {expandedSections.medications && (
                <div className="px-6 pb-4 space-y-4">
                  {visit.medicationOrders.map((order) => (
                    <div key={order.id} className="bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{order.name}</p>
                          <p className="text-sm text-gray-500">{order.strength} - {order.dosageForm}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-gray-500">Quantity</p>
                          <p className="font-medium">{order.quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Frequency</p>
                          <p className="font-medium">{order.frequency || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duration</p>
                          <p className="font-medium">{order.duration || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Instructions</p>
                          <p className="font-medium">{order.instructions || 'N/A'}</p>
                        </div>
                      </div>
                      {order.additionalNotes && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-500">Additional Notes</p>
                          <p className="text-sm text-gray-900">{order.additionalNotes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nurse Services Section */}
          {hasNurseServices && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('nurseServices')}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-orange-500 mr-3" />
                  <span className="font-medium text-gray-900">Nurse Services</span>
                  <span className="ml-2 text-sm text-gray-500">({visit.nurseServiceAssignments.length} service{visit.nurseServiceAssignments.length !== 1 ? 's' : ''})</span>
                </div>
                {expandedSections.nurseServices ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {expandedSections.nurseServices && (
                <div className="px-6 pb-4 space-y-4">
                  {visit.nurseServiceAssignments.map((service) => (
                    <div key={service.id} className="bg-orange-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{service.service.name}</p>
                          <p className="text-sm text-gray-500">{service.service.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-gray-500">Assigned Nurse</p>
                          <p className="font-medium">{service.assignedNurse.fullname}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Assigned By</p>
                          <p className="font-medium">{service.assignedBy.fullname}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Price</p>
                          <p className="font-medium">{formatCurrency(service.service.price)}</p>
                        </div>
                      </div>
                      {service.notes && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-500">Notes</p>
                          <p className="text-sm text-gray-900">{service.notes}</p>
                        </div>
                      )}
                      {service.completedAt && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-500">Completed At</p>
                          <p className="text-sm text-gray-900">{formatDate(service.completedAt)}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Diagnosis Notes Section */}
          {hasDiagnosisNotes && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('diagnosisNotes')}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-indigo-500 mr-3" />
                  <span className="font-medium text-gray-900">Diagnosis Notes</span>
                  <span className="ml-2 text-sm text-gray-500">(12 fields)</span>
                </div>
                {expandedSections.diagnosisNotes ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {expandedSections.diagnosisNotes && (
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visit.diagnosisNotes.map((notes) => (
                      <div key={notes.id} className="space-y-4">
                        {notes.chiefComplaint && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Chief Complaint</p>
                            <p className="text-sm text-gray-900">{notes.chiefComplaint}</p>
                          </div>
                        )}
                        {notes.historyOfPresentIllness && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">History of Present Illness</p>
                            <p className="text-sm text-gray-900">{notes.historyOfPresentIllness}</p>
                          </div>
                        )}
                        {notes.pastMedicalHistory && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Past Medical History</p>
                            <p className="text-sm text-gray-900">{notes.pastMedicalHistory}</p>
                          </div>
                        )}
                        {notes.allergicHistory && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Allergic History</p>
                            <p className="text-sm text-gray-900">{notes.allergicHistory}</p>
                          </div>
                        )}
                        {notes.physicalExamination && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Physical Examination</p>
                            <p className="text-sm text-gray-900">{notes.physicalExamination}</p>
                          </div>
                        )}
                        {notes.investigationFindings && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Investigation Findings</p>
                            <p className="text-sm text-gray-900">{notes.investigationFindings}</p>
                          </div>
                        )}
                        {notes.assessmentAndDiagnosis && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Assessment and Diagnosis</p>
                            <p className="text-sm text-gray-900">{notes.assessmentAndDiagnosis}</p>
                          </div>
                        )}
                        {notes.treatmentPlan && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Treatment Plan</p>
                            <p className="text-sm text-gray-900">{notes.treatmentPlan}</p>
                          </div>
                        )}
                        {notes.treatmentGiven && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Treatment Given</p>
                            <p className="text-sm text-gray-900">{notes.treatmentGiven}</p>
                          </div>
                        )}
                        {notes.medicationIssued && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Medication Issued</p>
                            <p className="text-sm text-gray-900">{notes.medicationIssued}</p>
                          </div>
                        )}
                        {notes.additional && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Additional</p>
                            <p className="text-sm text-gray-900">{notes.additional}</p>
                          </div>
                        )}
                        {notes.prognosis && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Prognosis</p>
                            <p className="text-sm text-gray-900">{notes.prognosis}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dental Chart Section */}
          {hasDentalRecords && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('dental')}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Circle className="h-5 w-5 text-teal-500 mr-3" />
                  <span className="font-medium text-gray-900">Dental Chart</span>
                  <span className="ml-2 text-sm text-gray-500">({visit.dentalRecords.length} record{visit.dentalRecords.length !== 1 ? 's' : ''})</span>
                </div>
                {expandedSections.dental ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {expandedSections.dental && (
                <div className="px-6 pb-4">
                  <DentalChartDisplay 
                    patientId={selectedPatient.id}
                    visitId={visit.id}
                    showHistory={false}
                  />
                </div>
              )}
            </div>
          )}

          {/* Attached Images Section */}
          {hasAttachedImages && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('attachedImages')}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Image className="h-5 w-5 text-pink-500 mr-3" />
                  <span className="font-medium text-gray-900">Attached Images</span>
                  <span className="ml-2 text-sm text-gray-500">({visit.attachedImages.length} image{visit.attachedImages.length !== 1 ? 's' : ''})</span>
                </div>
                {expandedSections.attachedImages ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {expandedSections.attachedImages && (
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {visit.attachedImages.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={`http://localhost:3000/${image.filePath}`}
                          alt={image.fileName}
                          className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                          onClick={() => openImageViewer([image], 0)}
                        />
                        <p className="text-xs text-gray-500 mt-1 truncate">{image.fileName}</p>
                        <p className="text-xs text-gray-400">{formatDate(image.uploadedAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bills Section */}
          {visit.bills && visit.bills.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleSection('bills')}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Receipt className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="font-medium text-gray-900">Bills & Payments</span>
                  <span className="ml-2 text-sm text-gray-500">({visit.bills.length} bill{visit.bills.length !== 1 ? 's' : ''})</span>
                </div>
                {expandedSections.bills ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {expandedSections.bills && (
                <div className="px-6 pb-4 space-y-4">
                  {visit.bills.map((bill) => (
                    <div key={bill.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">Bill #{bill.id.slice(-8)}</p>
                          <p className="text-sm text-gray-500">{formatDate(bill.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(bill.total)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                            {bill.status}
                          </span>
                        </div>
                      </div>
                      {bill.services && bill.services.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-500 mb-2">Services</p>
                          <div className="space-y-1">
                            {bill.services.map((service, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">{service.service.name}</span>
                                <span className="text-gray-900">{formatCurrency(service.totalPrice)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {bill.payments && bill.payments.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-500 mb-2">Payments</p>
                          <div className="space-y-1">
                            {bill.payments.map((payment, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">{payment.type}</span>
                                <span className="text-gray-900">{formatCurrency(payment.amount)}</span>
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
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comprehensive Patient History</h2>
          <p className="text-gray-600">View complete patient medical history with all visit details</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name, ID, or visit ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
              />
            </div>
          </div>
          <button
            onClick={searchPatients}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {patients.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search Results</h3>
          <div className="space-y-2">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handlePatientSelect(patient)}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-500">ID: {patient.id}</p>
                    {patient.mobile && (
                      <p className="text-sm text-gray-500">Phone: {patient.mobile}</p>
                    )}
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  View History
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient History */}
      {selectedPatient && patientHistory && (
        <div className="space-y-6">
          {/* Patient Info Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{patientHistory.patient.name}</h3>
                  <p className="text-sm text-gray-600">Patient ID: {patientHistory.patient.id}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    {patientHistory.patient.dob && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDateOnly(patientHistory.patient.dob)}
                      </div>
                    )}
                    {patientHistory.patient.gender && (
                      <div className="flex items-center">
                        <UserCheck className="h-4 w-4 mr-1" />
                        {patientHistory.patient.gender}
                      </div>
                    )}
                    {patientHistory.patient.mobile && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {patientHistory.patient.mobile}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold text-blue-600">{patientHistory.visits?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Visit Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Visit to View Details
            </label>
            <select
              value={selectedVisitId || ''}
              onChange={(e) => setSelectedVisitId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a visit...</option>
              {patientHistory.visits?.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {visit.visitUid} - {formatDate(visit.createdAt)} ({visit.status.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Visit Details */}
          {selectedVisitId && patientHistory.visits && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {(() => {
                const visit = patientHistory.visits.find(v => v.id === selectedVisitId);
                if (!visit) return null;
                return renderVisitOverview(visit);
              })()}
            </div>
          )}

          {/* Empty State */}
          {!selectedVisitId && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Visit</h3>
              <p className="text-gray-500">Choose a visit from the dropdown above to view comprehensive details</p>
            </div>
          )}
        </div>
      )}

      {/* Image Viewer */}
      <ImageViewer
        isOpen={imageViewerState.isOpen}
        onClose={closeImageViewer}
        images={imageViewerState.images}
        currentIndex={imageViewerState.currentIndex}
      />
    </div>
  );
};

export default ComprehensivePatientHistory;
