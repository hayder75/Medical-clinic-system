import React, { useState, useEffect } from 'react';
import { User, Search, FileText, Calendar, TestTube, Scan, Pill, Heart, Clock, CheckCircle, AlertTriangle, Download, Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PatientHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('visits');

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      // Search by patient name, ID, or visit ID
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
    fetchPatientHistory(patient.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'DISPENSED':
        return 'badge-success';
      case 'PENDING':
      case 'QUEUED':
        return 'badge-warning';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const getVisitStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'badge-success';
      case 'UNDER_DOCTOR_REVIEW':
      case 'AWAITING_RESULTS_REVIEW':
        return 'badge-warning';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatDateOnly = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient History</h2>
          <p className="text-gray-600">View complete patient medical history</p>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name, ID, or visit ID..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
              />
            </div>
          </div>
          <button
            onClick={searchPatients}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {patients.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search Results</h3>
          <div className="space-y-2">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handlePatientSelect(patient)}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-gray-500">ID: {patient.id}</p>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm">
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
          {/* Action Buttons */}
          <div className="card">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('patient-info')}
                className={`btn ${activeTab === 'patient-info' ? 'btn-primary' : 'btn-outline'}`}
              >
                <User className="h-4 w-4 mr-2" />
                Patient Information
              </button>
              <button
                onClick={() => setActiveTab('visits')}
                className={`btn ${activeTab === 'visits' ? 'btn-primary' : 'btn-outline'}`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Visit Details
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="card">
            {/* Patient Information Tab */}
            {activeTab === 'patient-info' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{patientHistory.patient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Patient ID</p>
                    <p className="font-medium font-mono">{patientHistory.patient.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">{formatDateOnly(patientHistory.patient.dob)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium capitalize">{patientHistory.patient.gender.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Blood Type</p>
                    <p className="font-medium">{patientHistory.patient.bloodType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mobile</p>
                    <p className="font-medium">{patientHistory.patient.mobile}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Visit Details Tab */}
            {activeTab === 'visits' && (
              <div className="p-6">
                <div className="space-y-6">
                  {patientHistory.visits?.map((visit) => (
                    <div key={visit.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">Visit #{visit.visitUid}</h4>
                          <p className="text-sm text-gray-500">{formatDate(visit.createdAt)}</p>
                          <p className="text-sm text-gray-500">Created by: {visit.createdBy?.fullname || 'System'}</p>
                        </div>
                        <span className={`badge ${getVisitStatusColor(visit.status)}`}>
                          {visit.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      {/* Visit Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {visit.diagnosis && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Diagnosis</p>
                            <p className="text-sm text-gray-900">{visit.diagnosis}</p>
                          </div>
                        )}
                        {visit.diagnosisDetails && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Details</p>
                            <p className="text-sm text-gray-900">{visit.diagnosisDetails}</p>
                          </div>
                        )}
                        {visit.instructions && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Instructions</p>
                            <p className="text-sm text-gray-900">{visit.instructions}</p>
                          </div>
                        )}
                        {visit.finalNotes && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Final Notes</p>
                            <p className="text-sm text-gray-900">{visit.finalNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Medications Section */}
                      {visit.medicationOrders && visit.medicationOrders.length > 0 && (
                        <div className="mb-6">
                          <h5 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                            <Pill className="h-4 w-4 mr-2 text-green-600" />
                            Medications ({visit.medicationOrders.length})
                          </h5>
                          <div className="space-y-3">
                            {visit.medicationOrders.map((order) => (
                              <div key={order.id} className="bg-green-50 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium text-gray-900">{order.name}</p>
                                    <p className="text-sm text-gray-500">
                                      {order.strength} - {order.dosageForm}
                                    </p>
                                  </div>
                                  <span className={`badge ${getStatusColor(order.status)}`}>
                                    {order.status}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-500">Additional Notes</p>
                                    <p className="text-sm text-gray-900">{order.additionalNotes}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lab Results Section */}
                      {visit.labResults && visit.labResults.length > 0 && (
                        <div className="mb-6">
                          <h5 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                            <TestTube className="h-4 w-4 mr-2 text-blue-600" />
                            Lab Results ({visit.labResults.length})
                          </h5>
                          <div className="space-y-3">
                            {visit.labResults.map((result) => (
                              <div key={result.id} className="bg-blue-50 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium text-gray-900">{result.testType?.name}</p>
                                    <p className="text-sm text-gray-500">{formatDate(result.createdAt)}</p>
                                  </div>
                                  <span className="badge badge-success">Completed</span>
                                </div>
                                
                                {/* Show detailed results if available */}
                                {result.detailedResults ? (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Detailed Results:</p>
                                    <div className="bg-white rounded-lg p-3">
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                        {Object.entries(result.detailedResults).map(([key, value]) => (
                                          <div key={key} className="flex justify-between">
                                            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                            <span className="text-gray-900 font-medium">{value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-500">Result</p>
                                    <p className="text-sm text-gray-900">{result.resultText}</p>
                                  </div>
                                )}
                                
                                {result.additionalNotes && (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-500">Notes</p>
                                    <p className="text-sm text-gray-900">{result.additionalNotes}</p>
                                  </div>
                                )}
                                
                                {result.verifiedBy && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    Verified by: {result.verifiedBy} | {formatDate(result.verifiedAt)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Radiology Results Section */}
                      {visit.radiologyResults && visit.radiologyResults.length > 0 && (
                        <div className="mb-6">
                          <h5 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                            <Scan className="h-4 w-4 mr-2 text-purple-600" />
                            Radiology Results ({visit.radiologyResults.length})
                          </h5>
                          <div className="space-y-3">
                            {visit.radiologyResults.map((result) => (
                              <div key={result.id} className="bg-purple-50 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium text-gray-900">{result.testType?.name}</p>
                                    <p className="text-sm text-gray-500">{formatDate(result.createdAt)}</p>
                                  </div>
                                  <span className="badge badge-success">Completed</span>
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm text-gray-500">Report</p>
                                  <p className="text-sm text-gray-900">{result.resultText}</p>
                                </div>
                                {result.additionalNotes && (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-500">Notes</p>
                                    <p className="text-sm text-gray-900">{result.additionalNotes}</p>
                                  </div>
                                )}
                                {result.attachments && result.attachments.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-500">Attachments</p>
                                    <div className="flex space-x-2 mt-1">
                                      {result.attachments.map((attachment) => (
                                        <button
                                          key={attachment.id}
                                          className="btn btn-sm btn-outline"
                                          onClick={() => window.open(attachment.url, '_blank')}
                                        >
                                          <Download className="h-4 w-4 mr-1" />
                                          {attachment.filename}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vitals for this visit */}
                      {visit.vitals && visit.vitals.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Vitals</h5>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left">Date</th>
                                  <th className="px-3 py-2 text-left">BP</th>
                                  <th className="px-3 py-2 text-left">Temp</th>
                                  <th className="px-3 py-2 text-left">HR</th>
                                  <th className="px-3 py-2 text-left">BMI</th>
                                  <th className="px-3 py-2 text-left">O2 Sat</th>
                                </tr>
                              </thead>
                              <tbody>
                                {visit.vitals.map((vital) => (
                                  <tr key={vital.id} className="border-t">
                                    <td className="px-3 py-2">{formatDateOnly(vital.createdAt)}</td>
                                    <td className="px-3 py-2">{vital.bloodPressure}</td>
                                    <td className="px-3 py-2">{vital.temperature}°C</td>
                                    <td className="px-3 py-2">{vital.heartRate} bpm</td>
                                    <td className="px-3 py-2">{vital.bmi}</td>
                                    <td className="px-3 py-2">{vital.oxygenSaturation}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;