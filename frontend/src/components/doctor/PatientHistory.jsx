import React, { useState, useEffect } from 'react';
import { User, Search, FileText, Calendar, TestTube, Scan, Pill, Heart } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PatientHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      // In a real app, you'd have a search endpoint
      // For now, we'll simulate the search
      const response = await api.get(`/patients?search=${searchTerm}`);
      setPatients(response.data);
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
                placeholder="Search by patient name or ID..."
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
          {/* Patient Info */}
          <div className="card">
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
                <p className="font-medium">{new Date(patientHistory.patient.dob).toLocaleDateString()}</p>
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

          {/* Visits */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Visit History</h3>
            <div className="space-y-4">
              {patientHistory.visits?.map((visit) => (
                <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Visit #{visit.visitUid}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(visit.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="badge badge-info">
                      {visit.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  {visit.diagnosis && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-500">Diagnosis</p>
                      <p className="text-sm">{visit.diagnosis}</p>
                    </div>
                  )}
                  
                  {visit.diagnosisDetails && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-500">Details</p>
                      <p className="text-sm">{visit.diagnosisDetails}</p>
                    </div>
                  )}
                  
                  {visit.instructions && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-500">Instructions</p>
                      <p className="text-sm">{visit.instructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vitals History */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vitals History</h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>BP</th>
                    <th>Temp</th>
                    <th>HR</th>
                    <th>BMI</th>
                    <th>O2 Sat</th>
                    <th>Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {patientHistory.vitals?.map((vital) => (
                    <tr key={vital.id}>
                      <td>{new Date(vital.createdAt).toLocaleDateString()}</td>
                      <td>{vital.bloodPressure}</td>
                      <td>{vital.temperature}°C</td>
                      <td>{vital.heartRate} bpm</td>
                      <td>{vital.bmi}</td>
                      <td>{vital.oxygenSaturation}%</td>
                      <td>{vital.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lab Results */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lab Results</h3>
            <div className="space-y-4">
              {patientHistory.labOrders?.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{order.type.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="badge badge-success">Completed</span>
                  </div>
                  {order.result && (
                    <div>
                      <p className="text-sm text-gray-500">Result</p>
                      <p className="text-sm">{order.result}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Radiology Results */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Radiology Results</h3>
            <div className="space-y-4">
              {patientHistory.radiologyOrders?.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{order.type.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="badge badge-success">Completed</span>
                  </div>
                  {order.result && (
                    <div>
                      <p className="text-sm text-gray-500">Report</p>
                      <p className="text-sm">{order.result}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Medications */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Medications</h3>
            <div className="space-y-4">
              {patientHistory.medicationOrders?.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{order.name}</p>
                      <p className="text-sm text-gray-500">
                        {order.strength} - {order.dosageForm}
                      </p>
                    </div>
                    <span className="badge badge-success">Completed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Quantity</p>
                      <p>{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Frequency</p>
                      <p>{order.frequency}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p>{order.duration}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Instructions</p>
                      <p>{order.instructions}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
