import React, { useState, useEffect } from 'react';
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
  TestTube,
  Scan,
  Eye,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ImageViewer from '../common/ImageViewer';
import DentalChartDisplay from '../common/DentalChartDisplay';
import PatientAttachedImagesSection from '../common/PatientAttachedImagesSection';

const UnifiedQueue = () => {
  const { user: currentUser } = useAuth();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ total: 0, urgent: 0, results: 0, new: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImages, setCurrentImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    fetchUnifiedQueue();
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
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (visit) => {
    setSelectedVisit(visit);
    setExpandedSections({});
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPriorityIcon = (priority, queueType) => {
    switch (priority) {
      case 1:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 2:
        return <CheckCircle className="w-5 h-5 text-yellow-500" />;
      case 3:
        return <Clock className="w-5 h-5 text-blue-500" />;
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
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityText = (priority, queueType) => {
    switch (priority) {
      case 1:
        return 'URGENT';
      case 2:
        return 'RESULTS READY';
      case 3:
        return 'NEW CONSULTATION';
      default:
        return 'UNKNOWN';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleImageClick = (images, index) => {
    setCurrentImages(images);
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  const handleCompleteVisit = async () => {
    if (!selectedVisit) return;
    
    try {
      await api.put(`/doctors/visits/${selectedVisit.id}`, {
        status: 'COMPLETED',
        diagnosis: selectedVisit.diagnosis || '',
        treatment: selectedVisit.treatment || '',
        notes: selectedVisit.notes || ''
      });
      
      // Refresh queue
      await fetchUnifiedQueue();
      setSelectedVisit(null);
    } catch (error) {
      console.error('Error completing visit:', error);
    }
  };

  const handleDirectComplete = async () => {
    if (!selectedVisit) return;
    
    try {
      await api.post('/doctors/direct-complete', {
        visitId: selectedVisit.id
      });
      
      // Refresh queue
      await fetchUnifiedQueue();
      setSelectedVisit(null);
    } catch (error) {
      console.error('Error completing visit directly:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Urgent Cases</p>
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Results Ready</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.results}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">New Consultations</p>
              <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <div className="flex items-center">
            <User className="w-8 h-8 text-gray-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Queue</p>
              <p className="text-2xl font-bold text-gray-600">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Patient Queue</h3>
          <p className="text-sm text-gray-600">Patients are ordered by priority: Urgent → Results → New Consultations</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {queue.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No patients in queue</p>
            </div>
          ) : (
            queue.map((visit, index) => (
              <div
                key={visit.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${getPriorityColor(visit.priority)}`}
                onClick={() => handlePatientSelect(visit)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(visit.priority, visit.queueType)}
                      <span className="text-sm font-medium text-gray-900">
                        #{index + 1}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {visit.patient.name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {calculateAge(visit.patient.dob)} years
                        </span>
                        <span className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {visit.patient.mobile}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTime(visit.priorityTimestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      visit.priority === 1 ? 'bg-red-100 text-red-800' :
                      visit.priority === 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {getPriorityText(visit.priority, visit.queueType)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {visit.priorityReason}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Patient Details Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedVisit.patient.name}
                  </h2>
                  <p className="text-gray-600">
                    {getPriorityText(selectedVisit.priority, selectedVisit.queueType)} • 
                    Visit #{selectedVisit.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Age:</span> {calculateAge(selectedVisit.patient.dob)} years</p>
                    <p><span className="font-medium">Gender:</span> {selectedVisit.patient.gender}</p>
                    <p><span className="font-medium">Blood Type:</span> {selectedVisit.patient.bloodType || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedVisit.patient.mobile}</p>
                    <p><span className="font-medium">Email:</span> {selectedVisit.patient.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Visit Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Status:</span> {selectedVisit.status}</p>
                    <p><span className="font-medium">Priority:</span> {getPriorityText(selectedVisit.priority, selectedVisit.queueType)}</p>
                    <p><span className="font-medium">Arrival Time:</span> {formatTime(selectedVisit.createdAt)}</p>
                    <p><span className="font-medium">Queue Type:</span> {selectedVisit.queueType}</p>
                  </div>
                </div>
              </div>

              {/* Collapsible Sections */}
              <div className="space-y-4">
                {/* Vitals */}
                {selectedVisit.vitals && selectedVisit.vitals.length > 0 && (
                  <div className="border rounded-lg">
                    <button
                      onClick={() => toggleSection('vitals')}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-blue-500" />
                        <span className="font-medium">Vital Signs</span>
                      </div>
                      {expandedSections.vitals ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {expandedSections.vitals && (
                      <div className="p-4 border-t bg-gray-50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {selectedVisit.vitals[0].bloodPressure && (
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Blood Pressure</p>
                              <p className="font-semibold">{selectedVisit.vitals[0].bloodPressure}</p>
                            </div>
                          )}
                          {selectedVisit.vitals[0].temperature && (
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Temperature</p>
                              <p className="font-semibold">{selectedVisit.vitals[0].temperature}°C</p>
                            </div>
                          )}
                          {selectedVisit.vitals[0].heartRate && (
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Heart Rate</p>
                              <p className="font-semibold">{selectedVisit.vitals[0].heartRate} bpm</p>
                            </div>
                          )}
                          {selectedVisit.vitals[0].oxygenSaturation && (
                            <div className="text-center">
                              <p className="text-sm text-gray-600">Oxygen Saturation</p>
                              <p className="font-semibold">{selectedVisit.vitals[0].oxygenSaturation}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Patient Attached Images */}
                <PatientAttachedImagesSection
                  visitId={selectedVisit.id}
                  patientId={selectedVisit.patient.id}
                  showImageViewer={showImageViewer}
                  setShowImageViewer={setShowImageViewer}
                  currentImages={currentImages}
                  setCurrentImages={setCurrentImages}
                  currentImageIndex={currentImageIndex}
                  setCurrentImageIndex={setCurrentImageIndex}
                  onImageClick={handleImageClick}
                />

                {/* Lab Results */}
                {selectedVisit.labOrders && selectedVisit.labOrders.length > 0 && (
                  <div className="border rounded-lg">
                    <button
                      onClick={() => toggleSection('labResults')}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <TestTube className="w-5 h-5 mr-2 text-green-500" />
                        <span className="font-medium">Lab Results ({selectedVisit.labOrders.length})</span>
                      </div>
                      {expandedSections.labResults ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {expandedSections.labResults && (
                      <div className="p-4 border-t bg-gray-50">
                        {selectedVisit.labOrders.map((order, index) => (
                          <div key={index} className="mb-4 p-3 bg-white rounded border">
                            <h4 className="font-medium">{order.type.name}</h4>
                            {order.labResults && order.labResults.length > 0 ? (
                              <div className="mt-2">
                                {order.labResults.map((result, resultIndex) => (
                                  <div key={resultIndex} className="text-sm text-gray-600">
                                    <p>Result: {result.result}</p>
                                    <p>Status: {result.status}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 mt-2">No results available</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Radiology Results */}
                {selectedVisit.radiologyOrders && selectedVisit.radiologyOrders.length > 0 && (
                  <div className="border rounded-lg">
                    <button
                      onClick={() => toggleSection('radiologyResults')}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <Scan className="w-5 h-5 mr-2 text-purple-500" />
                        <span className="font-medium">Radiology Results ({selectedVisit.radiologyOrders.length})</span>
                      </div>
                      {expandedSections.radiologyResults ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {expandedSections.radiologyResults && (
                      <div className="p-4 border-t bg-gray-50">
                        {selectedVisit.radiologyOrders.map((order, index) => (
                          <div key={index} className="mb-4 p-3 bg-white rounded border">
                            <h4 className="font-medium">{order.type.name}</h4>
                            {order.radiologyResults && order.radiologyResults.length > 0 ? (
                              <div className="mt-2">
                                {order.radiologyResults.map((result, resultIndex) => (
                                  <div key={resultIndex} className="text-sm text-gray-600">
                                    <p>Result: {result.result}</p>
                                    <p>Status: {result.status}</p>
                                    {result.attachments && result.attachments.length > 0 && (
                                      <div className="mt-2">
                                        <p className="font-medium">Images:</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                          {result.attachments.map((attachment, attachIndex) => (
                                            <img
                                              key={attachIndex}
                                              src={`http://localhost:3000/${attachment.filePath}`}
                                              alt={`Radiology result ${attachIndex + 1}`}
                                              className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-75"
                                              onClick={() => handleImageClick(
                                                result.attachments.map(att => ({
                                                  fileUrl: `http://localhost:3000/${att.filePath}`,
                                                  fileName: att.fileName
                                                })),
                                                attachIndex
                                              )}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 mt-2">No results available</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Dental Chart (for dentists only) */}
                {currentUser?.specialties?.includes('Dentist') && (
                  <div className="border rounded-lg">
                    <button
                      onClick={() => toggleSection('dentalChart')}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <Stethoscope className="w-5 h-5 mr-2 text-teal-500" />
                        <span className="font-medium">Dental Chart</span>
                      </div>
                      {expandedSections.dentalChart ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {expandedSections.dentalChart && (
                      <div className="p-4 border-t bg-gray-50">
                        <DentalChartDisplay
                          patientId={selectedVisit.patient.id}
                          visitId={selectedVisit.id}
                          showHistory={false}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
                
                {selectedVisit.queueType === 'RESULTS_READY' ? (
                  <button
                    onClick={handleCompleteVisit}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Complete Visit
                  </button>
                ) : (
                  <button
                    onClick={handleDirectComplete}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Complete Consultation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {showImageViewer && (
        <ImageViewer
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          images={currentImages}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
        />
      )}
    </div>
  );
};

export default UnifiedQueue;

