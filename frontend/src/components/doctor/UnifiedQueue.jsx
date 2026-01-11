import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Calendar,
  Stethoscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import ImageViewer from '../common/ImageViewer';
import DoctorServiceOrdering from './DoctorServiceOrdering';

const UnifiedQueue = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ urgent: 0, results: 0, new: 0, total: 0, sent: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImages, setCurrentImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showNurseServiceOrdering, setShowNurseServiceOrdering] = useState(false);
  const [queueFilter, setQueueFilter] = useState('main'); // 'main', 'sent', or 'triage'
  const [triageQueue, setTriageQueue] = useState([]);
  const [triageStats, setTriageStats] = useState({ total: 0, waiting: 0, triaged: 0 });

  useEffect(() => {
    // Always fetch unified queue first to get persistent stats for all queues
    if (queueFilter !== 'triage') {
      fetchUnifiedQueue();
    }
    
    // If on triage tab, also fetch triage queue for display
    if (queueFilter === 'triage') {
      fetchTriageQueue();
    }
  }, [queueFilter]);

  const fetchUnifiedQueue = async () => {
    try {
      setLoading(true);
      // Fetch with the appropriate filter based on current tab
      // For 'sent' tab, we need to fetch with filter=sent to get sent-status visits
      // For 'main' tab, fetch with filter=main
      const filterParam = queueFilter === 'sent' ? 'sent' : 'main';
      const response = await api.get(`/doctors/unified-queue?filter=${filterParam}`);
      if (response.data.success) {
        let filteredQueue = response.data.queue;
        
        // CRITICAL: Frontend-side safety filter to ensure correct queue display
        // Only show visits with sent statuses in the "sent" queue
        const sentStatuses = ['SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH', 'NURSE_SERVICES_ORDERED'];
        
        // Always update stats first (these are persistent counts for all queues)
        setStats(response.data.stats);
        
        // Additional client-side safety filter (backend should already filter correctly, but this is a safety net)
        if (queueFilter === 'sent') {
          // Filter out any visits that don't have sent statuses
          filteredQueue = filteredQueue.filter(visit => {
            const isSent = sentStatuses.includes(visit.status);
            if (!isSent) {
              console.warn(`⚠️ Frontend: Filtering out visit ${visit.id} with status "${visit.status}" from sent queue`);
            }
            return isSent;
          });
        } else if (queueFilter === 'main') {
          // Filter out any visits with sent statuses from main queue
          filteredQueue = filteredQueue.filter(visit => {
            const isNotSent = !sentStatuses.includes(visit.status);
            if (!isNotSent) {
              console.warn(`⚠️ Frontend: Filtering out visit ${visit.id} with status "${visit.status}" from main queue`);
            }
            return isNotSent;
          });
        }
        
        setQueue(filteredQueue);
      }
    } catch (error) {
      console.error('Error fetching unified queue:', error);
      toast.error('Failed to fetch patient queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchTriageQueue = async () => {
    try {
      setLoading(true);
      // First fetch unified queue to get all persistent stats (mainQueue, sentQueue, triageQueue)
      const unifiedResponse = await api.get('/doctors/unified-queue?filter=main');
      if (unifiedResponse.data.success) {
        // Update stats with unified queue stats (includes all queue counts)
        setStats(unifiedResponse.data.stats);
      }
      
      // Then fetch triage queue for display
      const response = await api.get('/doctors/triage-queue');
      if (response.data.success) {
        setTriageQueue(response.data.queue);
        setTriageStats(response.data.stats);
        setQueue(response.data.queue); // Use same queue state for display
        // Keep the unified stats (mainQueue, sentQueue, triageQueue are already set)
        // Only update display-specific stats
        setStats(prev => ({
          ...prev,
          total: response.data.stats.total,
          new: response.data.stats.waiting,
          awaiting: response.data.stats.triaged
        }));
      }
    } catch (error) {
      console.error('Error fetching triage queue:', error);
      toast.error('Failed to fetch triage queue');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (visit) => {
    // Navigate to consultation page instead of showing modal
    navigate(`/doctor/consultation/${visit.id}`);
  };

  const handleNurseServiceOrderPlaced = () => {
    setShowNurseServiceOrdering(false);
    fetchUnifiedQueue();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#2e13d1' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setQueueFilter('main')}
          className={`px-6 py-3 font-medium text-base rounded-lg transition-all shadow-sm ${
            queueFilter === 'main'
              ? 'shadow-md transform scale-105'
              : 'hover:opacity-90 hover:shadow-md'
          }`}
          style={{
            backgroundColor: queueFilter === 'main' ? '#DBEAFE' : '#EFF6FF',
            color: queueFilter === 'main' ? '#1E40AF' : '#3B82F6',
            border: queueFilter === 'main' ? '2px solid #3B82F6' : '2px solid #BFDBFE'
          }}
        >
          Main Queue ({stats.mainQueue !== undefined ? stats.mainQueue : (queueFilter === 'main' ? (stats.total - (stats.sent || 0)) : stats.total)})
        </button>
        <button
          onClick={() => setQueueFilter('sent')}
          className={`px-6 py-3 font-medium text-base rounded-lg transition-all shadow-sm ${
            queueFilter === 'sent'
              ? 'shadow-md transform scale-105'
              : 'hover:opacity-90 hover:shadow-md'
          }`}
          style={{
            backgroundColor: queueFilter === 'sent' ? '#FDE68A' : '#FEF3C7',
            color: queueFilter === 'sent' ? '#92400E' : '#D97706',
            border: queueFilter === 'sent' ? '2px solid #F59E0B' : '2px solid #FCD34D'
          }}
        >
          Sent to Lab/Radiology/Nurse ({stats.sentQueue !== undefined ? stats.sentQueue : (stats.sent || 0)})
        </button>
        <button
          onClick={() => setQueueFilter('triage')}
          className={`px-6 py-3 font-medium text-base rounded-lg transition-all shadow-sm ${
            queueFilter === 'triage'
              ? 'shadow-md transform scale-105'
              : 'hover:opacity-90 hover:shadow-md'
          }`}
          style={{
            backgroundColor: queueFilter === 'triage' ? '#D1FAE5' : '#ECFDF5',
            color: queueFilter === 'triage' ? '#065F46' : '#059669',
            border: queueFilter === 'triage' ? '2px solid #10B981' : '2px solid #A7F3D0'
          }}
        >
          Triage ({stats.triageQueue !== undefined ? stats.triageQueue : (queueFilter === 'triage' ? (triageStats.total || stats.total) : (triageStats.total || 0))})
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Urgent</p>
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

        {queueFilter === 'sent' && (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sent Patients</p>
                <p className="text-2xl font-bold text-orange-600">{stats.sent || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        )}
      </div>

      {/* Queue List and Patient Details */}
      <div className="space-y-6">
        {/* Patient Queue List */}
        <div>
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold" style={{ color: '#0C0E0B' }}>
              {queueFilter === 'main' ? 'Main Patient Queue' : 
               queueFilter === 'sent' ? 'Sent to Lab/Radiology/Nurse' : 
               'Triage Queue'} ({stats.total})
            </h2>
            {queueFilter === 'sent' && (
              <p className="text-sm text-gray-600 mt-1">
                Patients who have been sent to lab, radiology, or nurse services. They will return to the main queue when services are completed.
              </p>
            )}
            {queueFilter === 'triage' && (
              <p className="text-sm text-gray-600 mt-1">
                Patients waiting for triage or already triaged. You can perform triage by clicking on a patient and using the Triage tab in the consultation page.
              </p>
            )}
          </div>
          
          {/* Patient List - Grid layout */}
          {queue.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Stethoscope className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No patients in queue</h3>
              <p className="text-gray-500">Patients will appear here when they're ready for consultation</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {queue.map((visit, index) => (
                <div
                  key={visit.id}
                  onClick={() => handlePatientSelect(visit)}
                  className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-in slide-in-from-left-4 fade-in ${
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
                          visit.status === 'IN_DOCTOR_QUEUE' ? 'bg-green-100 text-green-700 border border-green-200' :
                          visit.status === 'UNDER_DOCTOR_REVIEW' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                          visit.status === 'AWAITING_RESULTS_REVIEW' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {visit.status.replace(/_/g, ' ')}
                        </div>
                      </div>

                      {/* Appointment Label */}
                      {visit.appointmentLabel && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              APPOINTMENT: {visit.appointmentLabel.type}
                            </span>
                          </div>
                          {visit.appointmentLabel.reason && (
                            <p className="text-xs text-blue-600 mt-1">
                              {visit.appointmentLabel.reason}
                            </p>
                          )}
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
              ))}
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