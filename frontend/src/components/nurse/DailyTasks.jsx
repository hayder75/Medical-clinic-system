import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Pill, 
  User, 
  Stethoscope,
  FileText,
  ChevronRight,
  Eye,
  MessageSquare
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ContinuousInfusionProgress from './ContinuousInfusionProgress';

const DailyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks from the unified endpoint
      const response = await api.get('/nurses/today-tasks');
      const allTasks = response.data.tasks || [];
      
      // Tasks are now grouped by patient, no need to map
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const getOrderTypeBadge = (orderType, assignedByRole) => {
    if (orderType === 'DOCTOR_ORDERED' || assignedByRole === 'DOCTOR') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Stethoscope className="h-3 w-3 mr-1" />
          Doctor Ordered
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <User className="h-3 w-3 mr-1" />
        Triage Ordered
      </span>
    );
  };

  const handleCompleteService = async () => {
    if (!selectedTask) return;
    
    try {
      // Check if this is a continuous infusion task
      if (selectedTask.type === 'continuousInfusion') {
        // For continuous infusions, show info message
        toast.success('Continuous infusion services remain active for daily tracking. Use the daily progress tracker to mark individual doses.');
        setShowTaskDetails(false);
        setSelectedTask(null);
        setCompletionNotes('');
        return;
      }

      // For regular nurse services, complete all pending services
      const pendingServices = selectedTask.services.filter(service => service.status === 'PENDING');
      
      if (pendingServices.length === 0) {
        toast.success('No pending services to complete');
        return;
      }

      // Complete each regular service
      for (const service of pendingServices) {
        await api.post('/nurses/complete-service', {
          assignmentId: service.id,
          notes: completionNotes
        });
      }

      toast.success(`${pendingServices.length} service(s) completed successfully!`);
      setShowTaskDetails(false);
      setSelectedTask(null);
      setCompletionNotes('');
      fetchTasks(); // Refresh the list
    } catch (error) {
      console.error('Error completing service:', error);
      toast.error('Failed to complete service');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS': return <AlertTriangle className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Tasks</h1>
            <p className="text-gray-600 mt-1">Manage your assigned nurse services</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
          <p className="text-gray-500">You don't have any nurse service tasks assigned for today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div
              key={`${task.patientId}-${task.visitId}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedTask(task);
                setShowTaskDetails(true);
              }}
            >
              <div className="p-6">
                {/* Task Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{task.patientName}</h3>
                      <p className="text-sm text-gray-500">${task.totalAmount}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.isFullyPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    {task.isFullyPaid ? 'PAID' : 'PARTIAL'}
                  </div>
                </div>

                {/* Services List */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{task.services.length} service(s)</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {task.services.map(service => service.serviceName).join(', ')}
                  </div>
                </div>

                {/* Patient Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{task.patientName}</span>
                    </div>
                    {getOrderTypeBadge(task.orderType, task.assignedByRole)}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Visit: {task.visitUid}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Assigned by: {task.assignedBy}</span>
                  </div>
                </div>

                {/* Notes */}
                {task.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-700">{task.notes}</p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {formatDate(task.createdAt)}
                  </span>
                  <div className="flex items-center space-x-1 text-blue-600 text-sm font-medium">
                    <span>View Details</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedTask.patientName}</h2>
                    <p className="text-gray-600">${selectedTask.totalAmount} - {selectedTask.services.length} service(s)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTaskDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Patient Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedTask.patientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Visit ID:</span>
                    <span className="ml-2 font-medium">{selectedTask.visitUid}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Assigned by:</span>
                    <span className="ml-2 font-medium">{selectedTask.assignedBy}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTask.isFullyPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedTask.isFullyPaid ? 'PAID' : 'PARTIAL'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payments:</span>
                    <span className="ml-2 font-medium">${selectedTask.totalPayments} / ${selectedTask.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Service Details</h3>
                <div className="space-y-3">
                  {selectedTask.services.map((service, index) => (
                    <div key={service.id} className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{service.serviceName}</h4>
                        <span className="text-sm font-medium text-blue-600">${service.servicePrice}</span>
                      </div>
                      <p className="text-sm text-gray-600">{service.serviceDescription}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {service.status}
                        </span>
                        {service.notes && (
                          <span className="text-xs text-gray-500">Notes: {service.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continuous Infusion Progress */}
              {selectedTask.type === 'continuousInfusion' && selectedTask.services.some(service => 
                service.serviceName.includes('Continuous Infusion')
              ) && (
                <div className="mb-6">
                  <ContinuousInfusionProgress
                    infusion={selectedTask.services.find(service => 
                      service.serviceName.includes('Continuous Infusion')
                    )?.medicationOrder?.continuousInfusion}
                    onUpdate={fetchTasks}
                    visitId={selectedTask.visitId}
                    patientId={selectedTask.patientId}
                  />
                </div>
              )}

              {/* Assignment Notes */}
              {selectedTask.notes && (
                <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Assignment Notes</h3>
                  <p className="text-sm text-gray-700">{selectedTask.notes}</p>
                </div>
              )}

              {/* Completion Form */}
              {selectedTask.services.some(service => service.status === 'PENDING') && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Complete Services</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Completion Notes
                    </label>
                    <textarea
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Add notes about the service completion..."
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowTaskDetails(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCompleteService}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        {selectedTask?.type === 'continuousInfusion' 
                          ? 'View Daily Tracker' 
                          : 'Complete All Services'
                        }
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Completed Status */}
              {selectedTask.services.every(service => service.status === 'COMPLETED') && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">All Services Completed</span>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    All nurse services for this patient have been completed successfully.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTasks;