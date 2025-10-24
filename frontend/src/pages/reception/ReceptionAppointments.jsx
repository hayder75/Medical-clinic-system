import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  Filter, 
  X, 
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  MapPin
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ReceptionAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sendingToDoctor, setSendingToDoctor] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [doctorFilter, setDoctorFilter] = useState('ALL');
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, statusFilter, dateFilter, typeFilter, doctorFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/doctors');
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate).toDateString();
        return aptDate === filterDate;
      });
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(apt => apt.type === typeFilter);
    }

    // Doctor filter
    if (doctorFilter !== 'ALL') {
      filtered = filtered.filter(apt => apt.doctorId === doctorFilter);
    }

    setFilteredAppointments(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
      ARRIVED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
      NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCardStatusColor = (cardStatus) => {
    if (cardStatus === 'ACTIVE') return 'text-green-600';
    if (cardStatus === 'EXPIRED') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTypeColor = (type) => {
    if (type === 'CONSULTATION') return 'bg-blue-100 text-blue-800';
    if (type === 'FOLLOW_UP') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const sendToDoctor = async (appointmentId) => {
    if (!confirm('Send this appointment to doctor queue? This will create a visit and consultation billing.')) {
      return;
    }

    try {
      setSendingToDoctor(appointmentId);
      const response = await api.post(`/appointments/${appointmentId}/send-to-doctor`);
      
      toast.success('Appointment sent to doctor successfully!');
      fetchAppointments(); // Refresh the list
    } catch (error) {
      console.error('Error sending appointment to doctor:', error);
      toast.error(error.response?.data?.message || 'Failed to send appointment to doctor');
    } finally {
      setSendingToDoctor(null);
    }
  };

  const clearFilters = () => {
    setStatusFilter('ALL');
    setDateFilter('');
    setTypeFilter('ALL');
    setDoctorFilter('ALL');
  };

  const activeFilterCount = () => {
    let count = 0;
    if (statusFilter !== 'ALL') count++;
    if (dateFilter) count++;
    if (typeFilter !== 'ALL') count++;
    if (doctorFilter !== 'ALL') count++;
    return count;
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.fullname : 'Unknown Doctor';
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#0C0E0B' }}>All Appointments</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              Manage appointments and send patients to doctor queue
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilterModal(true)}
              className="px-4 py-2 rounded-lg border transition flex items-center space-x-2"
              style={{ 
                backgroundColor: 'white',
                borderColor: '#E5E7EB',
                color: '#0C0E0B'
              }}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount() > 0 && (
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: '#2e13d1', color: 'white' }}
                >
                  {activeFilterCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => {
                    const today = new Date().toDateString();
                    const aptDate = new Date(apt.appointmentDate).toDateString();
                    return aptDate === today && apt.status === 'SCHEDULED';
                  }).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => {
                    const today = new Date().toDateString();
                    const aptDate = new Date(apt.appointmentDate).toDateString();
                    return aptDate === today && apt.status === 'COMPLETED';
                  }).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center">
              <Send className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#2e13d1' }}></div>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div 
                key={appointment.id}
                className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition"
                style={{ borderColor: '#E5E7EB' }}
              >
                <div className="flex items-start justify-between">
                  {/* Left Section - Patient Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    <div 
                      className="h-12 w-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#EEF2FF' }}
                    >
                      <User className="h-6 w-6" style={{ color: '#2e13d1' }} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold" style={{ color: '#0C0E0B' }}>
                          {appointment.patient?.name}
                        </h3>
                        <span className="text-sm" style={{ color: '#6B7280' }}>
                          {appointment.patient?.id}
                        </span>
                        <CreditCard 
                          className={`h-4 w-4 ${getCardStatusColor(appointment.patient?.cardStatus)}`}
                          title={`Card ${appointment.patient?.cardStatus}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center space-x-2 text-sm" style={{ color: '#6B7280' }}>
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(appointment.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm" style={{ color: '#6B7280' }}>
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(appointment.appointmentTime)}</span>
                        </div>
                        {appointment.patient?.mobile && (
                          <div className="flex items-center space-x-2 text-sm" style={{ color: '#6B7280' }}>
                            <Phone className="h-4 w-4" />
                            <span>{appointment.patient.mobile}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm" style={{ color: '#6B7280' }}>
                          <MapPin className="h-4 w-4" />
                          <span>Dr. {getDoctorName(appointment.doctorId)}</span>
                        </div>
                      </div>

                      {appointment.reason && (
                        <div className="mb-3">
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Reason:</p>
                          <p className="text-sm" style={{ color: '#0C0E0B' }}>{appointment.reason}</p>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="mb-3">
                          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Notes:</p>
                          <p className="text-sm" style={{ color: '#0C0E0B' }}>{appointment.notes}</p>
                        </div>
                      )}

                      {appointment.lastDiagnosedByName && (
                        <div className="text-xs" style={{ color: '#6B7280' }}>
                          Last diagnosed by: <span className="font-medium">{appointment.lastDiagnosedByName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Section - Status & Actions */}
                  <div className="flex flex-col items-end space-y-3">
                    <div className="flex space-x-2">
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}
                      >
                        {appointment.status}
                      </span>
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(appointment.type)}`}
                      >
                        {appointment.type}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      {appointment.status === 'SCHEDULED' && (
                        <button
                          onClick={() => sendToDoctor(appointment.id)}
                          disabled={sendingToDoctor === appointment.id}
                          className="px-4 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 flex items-center space-x-2"
                          style={{ backgroundColor: '#2e13d1' }}
                        >
                          <Send className="h-4 w-4" />
                          <span>
                            {sendingToDoctor === appointment.id ? 'Sending...' : 'Send to Doctor'}
                          </span>
                        </button>
                      )}
                      
                      {appointment.status === 'IN_PROGRESS' && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>In Doctor Queue</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs" style={{ color: '#9CA3AF' }}>
                      Created by {appointment.createdBy?.fullname || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center" style={{ borderColor: '#E5E7EB' }}>
            <Calendar className="h-16 w-16 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: '#0C0E0B' }}>
              No appointments found
            </h3>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              {activeFilterCount() > 0 
                ? 'Try adjusting your filters or check back later'
                : 'No appointments have been scheduled yet'
              }
            </p>
            {activeFilterCount() > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-lg border transition"
                style={{ 
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB',
                  color: '#0C0E0B'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: '#0C0E0B' }}>Filter Appointments</h2>
                <button onClick={() => setShowFilterModal(false)}>
                  <X className="h-6 w-6" style={{ color: '#6B7280' }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="ARRIVED">Arrived</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="NO_SHOW">No Show</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <option value="ALL">All Types</option>
                    <option value="CONSULTATION">Consultation</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
                    Doctor
                  </label>
                  <select
                    value={doctorFilter}
                    onChange={(e) => setDoctorFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <option value="ALL">All Doctors</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.fullname}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border rounded-lg transition"
                  style={{ borderColor: '#E5E7EB', color: '#0C0E0B' }}
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-white transition"
                  style={{ backgroundColor: '#2e13d1' }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionAppointments;
