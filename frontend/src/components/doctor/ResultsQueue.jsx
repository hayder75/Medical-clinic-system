import React, { useState, useEffect } from 'react';
import { FileText, TestTube, Scan, CheckCircle, Clock, User, Calendar, Eye, AlertTriangle, Image, Download } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import EnhancedPrescription from './EnhancedPrescription';

// Component to display per-test radiology results
const RadiologyResultsDisplay = ({ batchOrder }) => {
  const [radiologyResults, setRadiologyResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRadiologyResults();
  }, [batchOrder.id]);

  const fetchRadiologyResults = async () => {
    try {
      const response = await api.get(`/radiologies/batch-orders/${batchOrder.id}/results`);
      setRadiologyResults(response.data.radiologyResults || []);
    } catch (error) {
      console.error('Error fetching radiology results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-3">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (radiologyResults.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-green-50">
        <div className="flex justify-between items-start mb-3">
          <h6 className="font-medium text-gray-900 text-lg">Radiology Tests</h6>
          <span className="badge badge-success">Completed</span>
        </div>
        
        {/* Main Report */}
        <div className="bg-white rounded-lg p-3 mb-3">
          <div className="text-sm text-gray-700 mb-2">
            <strong>Report:</strong> {batchOrder.result || 'No report provided'}
          </div>
          {batchOrder.additionalNotes && (
            <div className="text-sm text-gray-600">
              <strong>Notes:</strong> {batchOrder.additionalNotes}
            </div>
          )}
        </div>

        {/* Tests Performed */}
        {batchOrder.services && batchOrder.services.length > 0 && (
          <div className="bg-white rounded-lg p-3 mb-3">
            <div className="text-sm font-medium text-gray-900 mb-2">
              Tests Performed:
            </div>
            <div className="space-y-2">
              {batchOrder.services.map((service, serviceIndex) => (
                <div key={serviceIndex} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">
                    • {service.investigationType?.name || service.service?.name || 'Test'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {service.result || 'No individual result'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {batchOrder.attachments && batchOrder.attachments.length > 0 && (
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-2">
              Attached Images:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {batchOrder.attachments.map((file, fileIndex) => (
                <div key={fileIndex} className="relative group">
                  <img 
                    src={`http://localhost:3000/${file.path}`} 
                    alt="Radiology image" 
                    className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(`http://localhost:3000/${file.path}`, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center">
                    <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to view
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {radiologyResults.map((result, index) => (
        <div key={result.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <h6 className="font-medium text-gray-900 flex items-center">
              <Scan className="h-4 w-4 mr-2 text-blue-600" />
              {result.testType.name}
            </h6>
            <span className="badge badge-success">Completed</span>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              <strong>Result:</strong> {result.resultText || 'No result provided'}
            </div>
            
            {result.additionalNotes && (
              <div className="text-sm text-gray-600">
                <strong>Notes:</strong> {result.additionalNotes}
              </div>
            )}

            {result.attachments && result.attachments.length > 0 && (
              <div className="mt-3">
                <strong className="text-sm text-gray-700 block mb-2">Attached Images:</strong>
                <div className="grid grid-cols-2 gap-3">
                  {result.attachments.map((file, fileIndex) => (
                    <div key={fileIndex} className="relative group">
                      <img 
                        src={`http://localhost:3000/${file.fileUrl}`} 
                        alt="Radiology image" 
                        className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(`http://localhost:3000/${file.fileUrl}`, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to view full size
                        </span>
                      </div>
                      <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.fileName || 'Image'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ResultsQueue = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showResultsForm, setShowResultsForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [formData, setFormData] = useState({
    diagnosis: '',
    diagnosisDetails: '',
    instructions: '',
    medications: []
  });
  const [newMedicationOrder, setNewMedicationOrder] = useState({
    name: '',
    dosageForm: '',
    strength: '',
    quantity: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  useEffect(() => {
    fetchResultsQueue();
  }, []);

  const fetchResultsQueue = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors/results-queue');
      setVisits(response.data.queue || []);
    } catch (error) {
      toast.error('Failed to fetch results queue');
      console.error('Error fetching results queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitSelect = (visit) => {
    setSelectedVisit(visit);
    setShowResultsForm(true);
    setFormData({
      diagnosis: visit.diagnosis || '',
      diagnosisDetails: visit.diagnosisDetails || '',
      instructions: visit.instructions || '',
      medications: visit.medicationOrders || []
    });
  };

  const handleMedicationOrder = async (e) => {
    e.preventDefault();
    
    if (!newMedicationOrder.name || !newMedicationOrder.dosageForm || !newMedicationOrder.strength) {
      toast.error('Please fill in all required medication fields');
      return;
    }

    try {
      const orderPayload = {
        visitId: selectedVisit.id,
        patientId: selectedVisit.patient.id,
        name: newMedicationOrder.name,
        dosageForm: newMedicationOrder.dosageForm,
        strength: newMedicationOrder.strength,
        quantity: parseInt(newMedicationOrder.quantity) || 0,
        frequency: newMedicationOrder.frequency,
        duration: newMedicationOrder.duration,
        instructions: newMedicationOrder.instructions
      };

      await api.post('/doctors/medication-orders', orderPayload);
      toast.success('Medication order added successfully');
      
      setNewMedicationOrder({
        name: '',
        dosageForm: '',
        strength: '',
        quantity: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
      
      fetchResultsQueue();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create medication order');
    }
  };

  const handlePrescriptionSubmit = () => {
    setShowPrescriptionForm(false);
    fetchResultsQueue();
  };

  const handleCompleteVisit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/doctors/complete', {
        visitId: selectedVisit.id,
        diagnosis: formData.diagnosis,
        diagnosisDetails: formData.diagnosisDetails,
        instructions: formData.instructions
      });

      toast.success('Visit completed successfully!');
      setShowResultsForm(false);
      setSelectedVisit(null);
      fetchResultsQueue();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to complete visit');
    }
  };

  const getPriorityColor = (condition) => {
    switch (condition) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Stable':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!showResultsForm ? (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Results Queue</h2>
              <p className="text-gray-600">Patients with completed investigations ready for review</p>
            </div>
            <div className="text-sm text-gray-500">
              {visits.length} patients with results ready
            </div>
          </div>

          {/* Results List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visits.map((visit) => (
              <div 
                key={visit.id} 
                className="card cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-green-500"
                onClick={() => handleVisitSelect(visit)}
              >
                {/* Header with ID, Name, Type, Priority, Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs font-mono text-gray-500">#{visit.patient.id}</span>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(visit.vitals?.[0]?.condition || 'Unknown')}`}>
                        {visit.vitals?.[0]?.condition || 'Unknown'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{visit.patient.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{visit.patient.type?.toLowerCase() || 'Regular'}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col space-y-1">
                      {visit.resultLabels?.map((label, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          {label}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(visit.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="mb-3 p-2 bg-green-50 rounded">
                  <div className="text-sm text-green-800">
                    <span className="font-medium">Results Available:</span>
                    <div className="mt-1 space-y-1">
                      {visit.batchOrders?.some(order => order.type === 'LAB' && order.status === 'COMPLETED') && (
                        <div className="flex items-center text-xs">
                          <TestTube className="h-3 w-3 mr-1" />
                          Lab Results ({visit.batchOrders.filter(o => o.type === 'LAB' && o.status === 'COMPLETED').length})
                        </div>
                      )}
                      {visit.batchOrders?.some(order => order.type === 'RADIOLOGY' && order.status === 'COMPLETED') && (
                        <div className="flex items-center text-xs">
                          <Scan className="h-3 w-3 mr-1" />
                          Radiology Results ({visit.batchOrders.filter(o => o.type === 'RADIOLOGY' && o.status === 'COMPLETED').length})
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <button className="btn btn-primary btn-sm flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    Review Results
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Results Review Form */
        <div className="space-y-6">
          {/* Form Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Review Results - {selectedVisit.patient.name}
              </h2>
              <p className="text-gray-600">ID: {selectedVisit.patient.id} | Visit: {selectedVisit.visitUid}</p>
            </div>
            <button
              onClick={() => setShowResultsForm(false)}
              className="btn btn-outline btn-sm"
            >
              Back to Queue
            </button>
          </div>

          {/* Results Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lab Results */}
            {selectedVisit.batchOrders?.some(order => order.type === 'LAB' && order.status === 'COMPLETED') && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TestTube className="h-5 w-5 mr-2" />
                  Lab Results
                </h3>
                <div className="space-y-4">
                  {selectedVisit.batchOrders
                    .filter(order => order.type === 'LAB' && order.status === 'COMPLETED')
                    .map((order, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-blue-50">
                        <div className="flex justify-between items-start mb-3">
                          <h6 className="font-medium text-gray-900 text-lg">Lab Tests</h6>
                          <span className="badge badge-success">Completed</span>
                        </div>
                        
                        {/* Main Result */}
                        <div className="bg-white rounded-lg p-3 mb-3">
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Result:</strong> {order.result || 'No result provided'}
                          </div>
                          {order.additionalNotes && (
                            <div className="text-sm text-gray-600">
                              <strong>Notes:</strong> {order.additionalNotes}
                            </div>
                          )}
                        </div>

                        {/* Tests Performed */}
                        {order.services && order.services.length > 0 && (
                          <div className="bg-white rounded-lg p-3 mb-3">
                            <div className="text-sm font-medium text-gray-900 mb-2">
                              Tests Performed:
                            </div>
                            <div className="space-y-2">
                              {order.services.map((service, serviceIndex) => (
                                <div key={serviceIndex} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-700">
                                    • {service.investigationType?.name || service.service?.name || 'Test'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {service.result || 'No individual result'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Attachments */}
                        {order.attachments && order.attachments.length > 0 && (
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-900 mb-2">
                              Attached Files:
                            </div>
                            <div className="space-y-2">
                              {order.attachments.map((file, fileIndex) => (
                                <div key={fileIndex} className="flex items-center space-x-2">
                                  <div className="flex-shrink-0">
                                    {file.type?.startsWith('image/') ? (
                                      <img 
                                        src={`http://localhost:3000/${file.path}`} 
                                        alt="Lab result" 
                                        className="w-16 h-16 object-cover rounded border"
                                        onClick={() => window.open(`http://localhost:3000/${file.path}`, '_blank')}
                                        style={{ cursor: 'pointer' }}
                                      />
                                    ) : (
                                      <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-gray-500" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 truncate">
                                      {file.path.split('/').pop()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {file.type || 'Unknown type'}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => window.open(`http://localhost:3000/${file.path}`, '_blank')}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
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
              </div>
            )}

            {/* Radiology Results */}
            {selectedVisit.batchOrders?.some(order => order.type === 'RADIOLOGY' && order.status === 'COMPLETED') && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Scan className="h-5 w-5 mr-2" />
                  Radiology Results
                </h3>
                <div className="space-y-4">
                  {selectedVisit.batchOrders
                    .filter(order => order.type === 'RADIOLOGY' && order.status === 'COMPLETED')
                    .map((order, index) => (
                      <RadiologyResultsDisplay key={index} batchOrder={order} />
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Diagnosis and Treatment Form */}
          <form onSubmit={handleCompleteVisit} className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Final Diagnosis & Treatment
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Primary Diagnosis</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                    placeholder="Enter primary diagnosis"
                  />
                </div>
                <div>
                  <label className="label">Diagnosis Details</label>
                  <textarea
                    className="input"
                    rows="4"
                    value={formData.diagnosisDetails}
                    onChange={(e) => setFormData({...formData, diagnosisDetails: e.target.value})}
                    placeholder="Detailed diagnosis notes..."
                  />
                </div>
                <div>
                  <label className="label">Patient Instructions</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={formData.instructions}
                    onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                    placeholder="Instructions for patient..."
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Prescription */}
            {!showPrescriptionForm ? (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TestTube className="h-5 w-5 mr-2" />
                  Prescribe Medications
                </h3>
                
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Use the enhanced prescription system to search from the medication catalog or add custom medications.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => setShowPrescriptionForm(true)}
                    className="btn btn-primary"
                  >
                    Open Prescription System
                  </button>
                </div>

                {/* Existing Medication Orders */}
                {formData.medications && formData.medications.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-gray-900">Current Prescriptions:</h4>
                    {formData.medications.map((order, index) => (
                      <div key={index} className="p-2 bg-purple-50 rounded text-sm flex justify-between items-center">
                        <span className="font-medium">{order.name} - {order.dosageForm} {order.strength}</span>
                        <span className="text-gray-500">{order.frequency}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EnhancedPrescription
                visitId={selectedVisit.id}
                patientId={selectedVisit.patient.id}
                onPrescriptionSubmit={handlePrescriptionSubmit}
                onCancel={() => setShowPrescriptionForm(false)}
              />
            )}

            {/* Save Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowResultsForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Complete Visit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ResultsQueue;
