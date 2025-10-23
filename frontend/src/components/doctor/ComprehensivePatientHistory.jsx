import React, { useState, useEffect } from 'react';
import { 
  User, Search, FileText, Calendar, TestTube, Scan, Pill, Heart, Clock, 
  CheckCircle, AlertTriangle, Download, Eye, Circle, Stethoscope, 
  Activity, Image, Receipt, Users, ChevronDown, ChevronRight, 
  MapPin, Phone, Mail, Calendar as CalendarIcon, UserCheck, X, ArrowLeft
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
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [activeTab, setActiveTab] = useState('vitals');
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
      // Auto-select the first visit if available
      if (response.data?.visits && response.data.visits.length > 0) {
        setSelectedVisitId(response.data.visits[0].id);
      }
    } catch (error) {
      toast.error('Failed to fetch patient history');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSelectedVisitId(null);
    setActiveTab('vitals');
    setPatients([]); // Clear search results
    setSearchTerm(''); // Clear search term
    fetchPatientHistory(patient.id);
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setPatientHistory(null);
    setSelectedVisitId(null);
    setActiveTab('vitals');
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
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'QUEUED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getSelectedVisit = () => {
    if (!patientHistory?.visits || !selectedVisitId) return null;
    return patientHistory.visits.find(v => v.id === selectedVisitId);
  };

  const selectedVisit = getSelectedVisit();

  // Define tabs based on available data
  const tabs = selectedVisit ? [
    { id: 'vitals', label: 'Vitals & History', icon: Activity, show: true },
    { id: 'attachedImages', label: 'Attached Images', icon: Image, show: selectedVisit.attachedImages?.length > 0 },
    { id: 'gallery', label: 'Before & After Gallery', icon: Image, show: selectedVisit.galleryImages?.length > 0 },
    { id: 'labResults', label: 'Lab Orders', icon: TestTube, show: selectedVisit.labResults?.length > 0 },
    { id: 'radiologyResults', label: 'Radiology Orders', icon: Scan, show: selectedVisit.radiologyResults?.length > 0 },
    { id: 'medications', label: 'Medications', icon: Pill, show: selectedVisit.medications?.length > 0 },
    { id: 'diagnosisNotes', label: 'Diagnosis & Notes', icon: FileText, show: selectedVisit.diagnosisNotes?.length > 0 },
    { id: 'dentalChart', label: 'Dental Chart', icon: Stethoscope, show: selectedVisit.dentalRecords?.length > 0 },
    { id: 'bills', label: 'Bills & Payments', icon: Receipt, show: true }, // Always show bills tab
  ].filter(tab => tab.show) : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      
      {/* Search Section */}
      {!selectedPatient && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#0C0E0B' }}>
              Patient History Search
            </h2>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#6B7280' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPatients()}
                  placeholder="Search by name, ID, or phone number..."
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E5E7EB', focusRingColor: '#2e13d1' }}
                />
              </div>
              <button
                onClick={searchPatients}
                disabled={loading}
                className="px-6 py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: '#2e13d1' }}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {patients.length > 0 && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition hover:border-blue-500"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
                          <User className="h-5 w-5" style={{ color: '#2e13d1' }} />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: '#0C0E0B' }}>{patient.name}</p>
                          <p className="text-sm" style={{ color: '#6B7280' }}>{patient.id} • {patient.phone}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5" style={{ color: '#6B7280' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Selected View */}
      {selectedPatient && patientHistory && (
        <>
          {/* Header with Back Button */}
          <div className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <button
                onClick={clearPatientSelection}
                className="flex items-center space-x-2 text-sm hover:opacity-70 transition"
                style={{ color: '#6B7280' }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Search</span>
              </button>
            </div>
          </div>

          {/* Patient Info Banner */}
          <div className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center space-x-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: '#2e13d1' }}>
                  <User className="h-8 w-8" style={{ color: '#FFFFFF' }} />
                </div>
                <div className="flex-1 grid grid-cols-5 gap-4">
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
                    <p className="text-sm font-semibold" style={{ color: '#0C0E0B' }}>{patientHistory.patient.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedVisit?.status)}`}>
                      {selectedVisit?.status?.replace(/_/g, ' ') || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visit Selector Tabs */}
          <div className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <p className="text-xs font-medium mb-2" style={{ color: '#6B7280' }}>SELECT VISIT</p>
              <div className="flex overflow-x-auto space-x-2 pb-2">
                {patientHistory.visits?.map((visit) => (
                  <button
                    key={visit.id}
                    onClick={() => {
                      setSelectedVisitId(visit.id);
                      setActiveTab('vitals');
                    }}
                    className={`px-4 py-2 rounded-lg border transition whitespace-nowrap text-sm font-medium ${
                      selectedVisitId === visit.id
                        ? 'text-white'
                        : 'bg-white hover:border-gray-400'
                    }`}
                    style={{
                      backgroundColor: selectedVisitId === visit.id ? '#2e13d1' : 'white',
                      borderColor: selectedVisitId === visit.id ? '#2e13d1' : '#E5E7EB',
                      color: selectedVisitId === visit.id ? 'white' : '#0C0E0B'
                    }}
                  >
                    <div>{visit.visitUid}</div>
                    <div className={`text-xs ${selectedVisitId === visit.id ? 'text-white' : 'text-gray-500'}`}>
                      {new Date(visit.date).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          {selectedVisit && (
            <div className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-1 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                          isActive ? '' : 'hover:bg-gray-50'
                        }`}
                        style={{
                          borderColor: isActive ? '#2e13d1' : 'transparent',
                          color: isActive ? '#2e13d1' : '#6B7280'
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          {selectedVisit && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              
              {/* Vitals & History Tab */}
              {activeTab === 'vitals' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Vital Signs History</h3>
                  {selectedVisit.vitals && selectedVisit.vitals.length > 0 ? (
                    <div className="space-y-4">
                      {selectedVisit.vitals.map((vital, index) => (
                        <div key={vital.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium" style={{ color: '#0C0E0B' }}>Record #{index + 1}</h4>
                            <span className="text-sm" style={{ color: '#6B7280' }}>{formatDate(vital.createdAt)}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p style={{ color: '#6B7280' }}>Heart Rate</p>
                              <p className="font-semibold" style={{ color: '#0C0E0B' }}>{vital.heartRate} bpm</p>
                            </div>
                            <div>
                              <p style={{ color: '#6B7280' }}>Temperature</p>
                              <p className="font-semibold" style={{ color: '#0C0E0B' }}>{vital.temperature}°C</p>
                            </div>
                            <div>
                              <p style={{ color: '#6B7280' }}>Blood Pressure</p>
                              <p className="font-semibold" style={{ color: '#0C0E0B' }}>{vital.bloodPressure} mmHg</p>
                            </div>
                            <div>
                              <p style={{ color: '#6B7280' }}>Oxygen Sat</p>
                              <p className="font-semibold" style={{ color: '#0C0E0B' }}>{vital.oxygenSaturation}%</p>
                            </div>
                          </div>
                          {vital.chiefComplaint && (
                            <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                              <p style={{ color: '#6B7280' }} className="text-sm">Chief Complaint:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{vital.chiefComplaint}</p>
                            </div>
                          )}
                          {vital.physicalExamination && (
                            <div className="mt-2">
                              <p style={{ color: '#6B7280' }} className="text-sm">Physical Examination:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{vital.physicalExamination}</p>
                            </div>
                          )}
                          {vital.notes && (
                            <div className="mt-2">
                              <p style={{ color: '#6B7280' }} className="text-sm">Notes:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{vital.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#6B7280' }}>No vital signs recorded for this visit</p>
                  )}
                </div>
              )}

              {/* Attached Images Tab */}
              {activeTab === 'attachedImages' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Attached Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedVisit.attachedImages.map((image) => (
                      <div key={image.id}>
                        <img
                          src={`http://localhost:3000/${image.filePath}`}
                          alt={image.description || 'Attached image'}
                          className="w-full h-48 object-cover rounded border"
                          style={{ borderColor: '#E5E7EB' }}
                        />
                        <button
                          onClick={() => openImageViewer([image], 0)}
                          className="mt-2 w-full px-3 py-2 text-sm text-white rounded hover:opacity-90 transition flex items-center justify-center space-x-2"
                          style={{ backgroundColor: '#2e13d1' }}
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Image</span>
                        </button>
                        {image.description && (
                          <p className="text-xs mt-2" style={{ color: '#6B7280' }}>{image.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Before & After Gallery Tab */}
              {activeTab === 'gallery' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Before & After Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedVisit.galleryImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={`http://localhost:3000/${image.filePath}`}
                          alt={image.imageType}
                          className="w-full h-48 object-cover rounded border cursor-pointer hover:opacity-80 transition"
                          style={{ borderColor: '#E5E7EB' }}
                          onClick={() => openImageViewer([image], 0)}
                        />
                        <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded shadow ${
                          image.imageType === 'BEFORE' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                          {image.imageType}
                        </div>
                        <div className="mt-2">
                          <p className="text-xs" style={{ color: '#6B7280' }}>{image.uploadedBy.fullname}</p>
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>{formatDate(image.createdAt)}</p>
                          {image.description && (
                            <p className="text-xs mt-1 line-clamp-2" style={{ color: '#6B7280' }}>{image.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Results Tab */}
              {activeTab === 'labResults' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Lab Results</h3>
                  <div className="space-y-4">
                    {selectedVisit.labResults.map((result, index) => (
                      <div key={index} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium" style={{ color: '#0C0E0B' }}>{result.serviceName}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </div>
                        {result.results && result.results.length > 0 && (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead style={{ backgroundColor: '#F3F4F6' }}>
                                <tr>
                                  <th className="px-3 py-2 text-left" style={{ color: '#6B7280' }}>Test Name</th>
                                  <th className="px-3 py-2 text-left" style={{ color: '#6B7280' }}>Result</th>
                                  <th className="px-3 py-2 text-left" style={{ color: '#6B7280' }}>Reference Range</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.results.map((test, idx) => (
                                  <tr key={idx} className="border-t" style={{ borderColor: '#E5E7EB' }}>
                                    <td className="px-3 py-2" style={{ color: '#0C0E0B' }}>{test.testName}</td>
                                    <td className="px-3 py-2 font-semibold" style={{ color: '#0C0E0B' }}>{test.result} {test.unit}</td>
                                    <td className="px-3 py-2" style={{ color: '#6B7280' }}>{test.referenceRange}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {result.notes && (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                            <p style={{ color: '#6B7280' }} className="text-sm">Notes:</p>
                            <p className="text-sm" style={{ color: '#0C0E0B' }}>{result.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Radiology Results Tab */}
              {activeTab === 'radiologyResults' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Radiology Results</h3>
                  <div className="space-y-4">
                    {selectedVisit.radiologyResults.map((result, index) => (
                      <div key={index} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium" style={{ color: '#0C0E0B' }}>{result.serviceName}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </div>
                        {result.findings && (
                          <div className="mt-3">
                            <p style={{ color: '#6B7280' }} className="text-sm">Findings:</p>
                            <p className="text-sm" style={{ color: '#0C0E0B' }}>{result.findings}</p>
                          </div>
                        )}
                        {result.impression && (
                          <div className="mt-2">
                            <p style={{ color: '#6B7280' }} className="text-sm">Impression:</p>
                            <p className="text-sm" style={{ color: '#0C0E0B' }}>{result.impression}</p>
                          </div>
                        )}
                        {result.attachments && result.attachments.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {result.attachments.map((attachment, idx) => (
                              <div key={idx}>
                                <img
                                  src={`http://localhost:3000/${attachment.fileUrl}`}
                                  alt={`Radiology ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                                  style={{ borderColor: '#E5E7EB' }}
                                  onClick={() => openImageViewer(result.attachments, idx)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications Tab */}
              {activeTab === 'medications' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Medications</h3>
                  <div className="space-y-3">
                    {selectedVisit.medications.map((med) => (
                      <div key={med.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium" style={{ color: '#0C0E0B' }}>{med.medication.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(med.status)}`}>
                            {med.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span style={{ color: '#6B7280' }}>Dosage:</span> <span style={{ color: '#0C0E0B' }}>{med.dosage}</span>
                          </div>
                          <div>
                            <span style={{ color: '#6B7280' }}>Frequency:</span> <span style={{ color: '#0C0E0B' }}>{med.frequency}</span>
                          </div>
                          <div>
                            <span style={{ color: '#6B7280' }}>Duration:</span> <span style={{ color: '#0C0E0B' }}>{med.duration}</span>
                          </div>
                          <div>
                            <span style={{ color: '#6B7280' }}>Quantity:</span> <span style={{ color: '#0C0E0B' }}>{med.quantity}</span>
                          </div>
                        </div>
                        {med.instructions && (
                          <div className="mt-2 pt-2 border-t" style={{ borderColor: '#E5E7EB' }}>
                            <p style={{ color: '#6B7280' }} className="text-sm">Instructions:</p>
                            <p className="text-sm" style={{ color: '#0C0E0B' }}>{med.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnosis Notes Tab */}
              {activeTab === 'diagnosisNotes' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Diagnosis & Notes</h3>
                  <div className="space-y-3">
                    {selectedVisit.diagnosisNotes.map((note) => (
                      <div key={note.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{formatDate(note.createdAt)}</span>
                          <span className="text-sm font-medium" style={{ color: '#2e13d1' }}>
                            Dr. {note.doctor?.fullname || 'Unknown'}
                          </span>
                        </div>
                        {note.diagnosis && (
                          <div className="mb-2">
                            <p style={{ color: '#6B7280' }} className="text-sm font-medium">Diagnosis:</p>
                            <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.diagnosis}</p>
                          </div>
                        )}
                        {note.notes && (
                          <div>
                            <p style={{ color: '#6B7280' }} className="text-sm font-medium">Notes:</p>
                            <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dental Chart Tab */}
              {activeTab === 'dentalChart' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Dental Chart</h3>
                  <DentalChartDisplay 
                    patientId={patientHistory.patient.id} 
                    visitId={selectedVisit.id} 
                  />
                </div>
              )}

              {/* Bills & Payments Tab */}
              {activeTab === 'bills' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Bills & Payments</h3>
                  {selectedVisit.bills && selectedVisit.bills.length > 0 ? (
                    <div className="space-y-3">
                      {selectedVisit.bills.map((bill) => (
                        <div key={bill.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-sm" style={{ color: '#6B7280' }}>Bill ID: {bill.id.substring(0, 8)}...</p>
                              <p className="text-lg font-semibold" style={{ color: '#0C0E0B' }}>
                                ETB {bill.totalAmount?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bill.status)}`}>
                              {bill.status}
                            </span>
                          </div>
                          {bill.services && bill.services.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm mb-1" style={{ color: '#6B7280' }}>Services:</p>
                              <ul className="text-sm space-y-1">
                                {bill.services.map((service, idx) => {
                                  const price = service.price || service.service?.price || 0;
                                  return (
                                    <li key={idx} className="flex justify-between">
                                      <span style={{ color: '#0C0E0B' }}>{service.service?.name || 'Unknown Service'}</span>
                                      <span className="font-medium" style={{ color: '#0C0E0B' }}>
                                        ETB {Number(price).toFixed(2)}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                          {bill.paidAt && (
                            <div className="mt-2 pt-2 border-t text-sm" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                              Paid on: {formatDate(bill.paidAt)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#6B7280' }}>No billing records for this visit</p>
                  )}
                </div>
              )}

            </div>
          )}
        </>
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
