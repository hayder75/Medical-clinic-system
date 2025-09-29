import React, { useState, useEffect } from 'react';
import { Stethoscope, User, Clock, FileText, TestTube, Scan, Pill, CheckCircle, Eye, Printer, History, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PatientQueue = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    vitals: true,
    diagnosis: false,
    orders: false,
    results: false,
    medications: false,
    appointments: false
  });
  const [formData, setFormData] = useState({
    diagnosis: '',
    diagnosisDetails: '',
    instructions: '',
    labOrders: [],
    radiologyOrders: [],
    medicationOrders: []
  });
  const [newLabOrder, setNewLabOrder] = useState({
    typeId: '',
    instructions: ''
  });
  const [newRadiologyOrder, setNewRadiologyOrder] = useState({
    typeId: '',
    instructions: ''
  });
  const [selectedLabTests, setSelectedLabTests] = useState([]); // Multiple lab test selection
  const [selectedRadiologyTests, setSelectedRadiologyTests] = useState([]); // Multiple radiology test selection
  const [labInstructions, setLabInstructions] = useState(''); // Instructions for all lab tests
  const [radiologyInstructions, setRadiologyInstructions] = useState(''); // Instructions for all radiology tests
  const [labOrdered, setLabOrdered] = useState(false); // Track if lab orders have been placed
  const [radiologyOrdered, setRadiologyOrdered] = useState(false); // Track if radiology orders have been placed
  
  // Lab test options
  const labTestOptions = [
    { id: 19, name: 'CBC (Complete Blood Count)', price: 150 },
    { id: 20, name: 'Blood Sugar (Fasting)', price: 100 },
    { id: 21, name: 'Lipid Profile', price: 200 },
    { id: 22, name: 'Liver Function Test', price: 180 },
    { id: 23, name: 'Kidney Function Test', price: 160 },
    { id: 24, name: 'Thyroid Function Test', price: 250 },
    { id: 25, name: 'Urinalysis', price: 80 },
    { id: 26, name: 'Stool Analysis', price: 120 }
  ];

  // Radiology test options
  const radiologyTestOptions = [
    { id: 27, name: 'Chest X-Ray', price: 200 },
    { id: 28, name: 'Abdominal X-Ray', price: 180 },
    { id: 29, name: 'CT Scan - Head', price: 800 },
    { id: 30, name: 'CT Scan - Chest', price: 1000 },
    { id: 31, name: 'MRI - Brain', price: 1200 },
    { id: 32, name: 'Ultrasound - Abdomen', price: 300 },
    { id: 33, name: 'Ultrasound - Pelvis', price: 250 },
    { id: 34, name: 'ECG', price: 150 }
  ];

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
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors/queue');
      setVisits(response.data.queue || []); // Fix: extract queue array from response
    } catch (error) {
      toast.error('Failed to fetch patient queue');
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (visit) => {
    setSelectedVisit(visit);
    setShowPatientForm(true);
    // Reset form data for new patient
    setFormData({
      diagnosis: visit.diagnosis || '',
      diagnosisDetails: visit.diagnosisDetails || '',
      instructions: visit.instructions || '',
      labOrders: visit.labOrders || [],
      radiologyOrders: visit.radiologyOrders || [],
      medicationOrders: visit.medicationOrders || []
    });
    // Reset order states
    setLabOrdered(false);
    setRadiologyOrdered(false);
    setSelectedLabTests([]);
    setSelectedRadiologyTests([]);
    setLabInstructions('');
    setRadiologyInstructions('');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update diagnosis and instructions
      await api.put(`/doctors/visits/${selectedVisit.id}`, {
        diagnosis: formData.diagnosis,
        diagnosisDetails: formData.diagnosisDetails,
        instructions: formData.instructions
      });
      toast.success('Patient information updated successfully');
      fetchVisits();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update patient information');
    }
  };

  const handlePrint = () => {
    // TODO: Implement PDF generation
    toast.success('Print functionality coming soon');
  };

  const handleViewHistory = () => {
    // TODO: Implement history modal
    toast.success('History view coming soon');
  };

  const handleAddLabOrder = async (e) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    
    if (!newLabOrder.typeId) {
      toast.error('Please select a lab test type');
      return;
    }

    try {
      const orderPayload = {
        visitId: selectedVisit.id,
        patientId: selectedVisit.patient.id,
        typeId: parseInt(newLabOrder.typeId), // Convert to number
        instructions: newLabOrder.instructions || ''
      };

      await api.post('/doctors/lab-orders', orderPayload);
      toast.success('Lab order added successfully');
      
      // Reset form
      setNewLabOrder({ typeId: '', instructions: '' });
      
      // Refresh the visit data
      fetchVisits();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create lab order');
    }
  };

  const handleAddMultipleLabOrders = async (e) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    
    if (selectedLabTests.length === 0) {
      toast.error('Please select at least one lab test');
      return;
    }

    try {
      const orders = selectedLabTests.map(testId => ({
        typeId: testId,
        instructions: labInstructions || ''
      }));

      const orderPayload = {
        visitId: selectedVisit.id,
        patientId: selectedVisit.patient.id,
        orders
      };

      await api.post('/doctors/lab-orders/multiple', orderPayload);
      toast.success(`${selectedLabTests.length} lab order(s) added successfully`);
      
      // Reset form and set ordered state
      setSelectedLabTests([]);
      setLabInstructions('');
      setLabOrdered(true);
      
      // Refresh the visit data
      fetchVisits();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create lab orders');
    }
  };

  const handleLabTestToggle = (testId) => {
    setSelectedLabTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleRadiologyTestToggle = (testId) => {
    setSelectedRadiologyTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleAddMultipleRadiologyOrders = async (e) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    
    if (selectedRadiologyTests.length === 0) {
      toast.error('Please select at least one radiology test');
      return;
    }

    try {
      const orders = selectedRadiologyTests.map(testId => ({
        typeId: testId,
        instructions: radiologyInstructions || ''
      }));

      const orderPayload = {
        visitId: selectedVisit.id,
        patientId: selectedVisit.patient.id,
        orders
      };

      await api.post('/doctors/radiology-orders/multiple', orderPayload);
      toast.success(`${selectedRadiologyTests.length} radiology order(s) added successfully`);
      
      // Reset form and set ordered state
      setSelectedRadiologyTests([]);
      setRadiologyInstructions('');
      setRadiologyOrdered(true);
      
      // Refresh the visit data
      fetchVisits();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create radiology orders');
    }
  };

  const handleAddRadiologyOrder = async (e) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    
    if (!newRadiologyOrder.typeId) {
      toast.error('Please select a radiology procedure');
      return;
    }

    try {
      const orderPayload = {
        visitId: selectedVisit.id,
        patientId: selectedVisit.patient.id,
        typeId: parseInt(newRadiologyOrder.typeId), // Convert to number
        instructions: newRadiologyOrder.instructions || ''
      };

      await api.post('/doctors/radiology-orders', orderPayload);
      toast.success('Radiology order added successfully');
      
      // Reset form
      setNewRadiologyOrder({ typeId: '', instructions: '' });
      
      // Refresh the visit data
      fetchVisits();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create radiology order');
    }
  };

  const handleAddMedicationOrder = async (e) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    
    if (!newMedicationOrder.name || !newMedicationOrder.dosageForm || !newMedicationOrder.strength) {
      toast.error('Please fill in all required medication fields');
      return;
    }

    // Check if medication ordering is allowed based on investigation completion
    const hasLabOrders = selectedVisit.labOrders && selectedVisit.labOrders.length > 0;
    const hasRadiologyOrders = selectedVisit.radiologyOrders && selectedVisit.radiologyOrders.length > 0;
    
    if (hasLabOrders || hasRadiologyOrders) {
      // Check if all investigations are completed
      const allLabCompleted = !hasLabOrders || selectedVisit.labOrders.every(order => 
        order.status === 'COMPLETED' || order.batchOrder?.status === 'COMPLETED'
      );
      const allRadiologyCompleted = !hasRadiologyOrders || selectedVisit.radiologyOrders.every(order => 
        order.status === 'COMPLETED' || order.batchOrder?.status === 'COMPLETED'
      );
      
      if (!allLabCompleted || !allRadiologyCompleted) {
        toast.error('Cannot order medication until all pending lab and radiology results are submitted.');
        return;
      }
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
      
      // Reset form
      setNewMedicationOrder({
        name: '',
        dosageForm: '',
        strength: '',
        quantity: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
      
      // Refresh the visit data
      fetchVisits();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create medication order');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING_FOR_DOCTOR':
        return 'badge-warning';
      case 'IN_PROGRESS':
        return 'badge-primary';
      case 'COMPLETED':
        return 'badge-success';
      default:
        return 'badge-secondary';
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
      {!showPatientForm ? (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Patient Queue</h2>
              <p className="text-gray-600">Select a patient to begin examination</p>
            </div>
            <div className="text-sm text-gray-500">
              {visits.length} patients in queue
            </div>
          </div>

          {/* Patients List - Minimal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visits.map((visit) => (
              <div 
                key={visit.id} 
                className="card cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-primary-500"
                onClick={() => handlePatientSelect(visit)}
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
                    <span className={`badge ${getStatusColor(visit.status)}`}>
                      {visit.status.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(visit.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Billing Status - Keep this as requested */}
                {visit.bills && visit.bills.length > 0 && (
                  <div className="mb-3 p-2 bg-blue-50 rounded">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-blue-800">Billing Status</span>
                      <div className="flex space-x-2">
                        {visit.bills.map((bill) => (
                          <span key={bill.id} className={`text-xs px-2 py-1 rounded ${
                            bill.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                            bill.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {bill.status} - ETB {bill.totalAmount}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Vitals Summary */}
                {visit.vitals && visit.vitals.length > 0 && (
                  <div className="mb-3 text-xs text-gray-600">
                    <span className="font-medium">Vitals:</span> 
                    BP {visit.vitals[0].bloodPressure} | 
                    Temp {visit.vitals[0].temperature}°C | 
                    HR {visit.vitals[0].heartRate} bpm
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end">
                  <button className="btn btn-primary btn-sm flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    View Form
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Detailed Patient Form View */
        <div className="space-y-6">
          {/* Form Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Patient Examination - {selectedVisit.patient.name}
              </h2>
              <p className="text-gray-600">ID: {selectedVisit.patient.id} | Visit: {selectedVisit.visitUid}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrint}
                className="btn btn-secondary btn-sm flex items-center"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </button>
              <button
                onClick={handleViewHistory}
                className="btn btn-secondary btn-sm flex items-center"
              >
                <History className="h-4 w-4 mr-1" />
                History
              </button>
              <button
                onClick={() => setShowPatientForm(false)}
                className="btn btn-outline btn-sm"
              >
                Back to Queue
              </button>
            </div>
          </div>

          {/* Patient Form */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Vitals Section */}
            <div className="card">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('vitals')}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Vitals & Assessment
                </h3>
                {expandedSections.vitals ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
              {expandedSections.vitals && selectedVisit.vitals && selectedVisit.vitals.length > 0 && (
                <div className="mt-4 space-y-4">
                  {/* Primary Vitals */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Blood Pressure</p>
                      <p className="font-semibold">{selectedVisit.vitals[0].bloodPressure || 'N/A'}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Temperature</p>
                      <p className="font-semibold">{selectedVisit.vitals[0].temperature ? `${selectedVisit.vitals[0].temperature}°C` : 'N/A'}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Heart Rate</p>
                      <p className="font-semibold">{selectedVisit.vitals[0].heartRate ? `${selectedVisit.vitals[0].heartRate} bpm` : 'N/A'}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">BMI</p>
                      <p className="font-semibold">{selectedVisit.vitals[0].bmi ? selectedVisit.vitals[0].bmi.toFixed(1) : 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Additional Vitals */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-sm text-gray-600">Height</p>
                      <p className="font-semibold">{selectedVisit.vitals[0].height ? `${selectedVisit.vitals[0].height} cm` : 'N/A'}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-sm text-gray-600">Weight</p>
                      <p className="font-semibold">{selectedVisit.vitals[0].weight ? `${selectedVisit.vitals[0].weight} kg` : 'N/A'}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-sm text-gray-600">Oxygen Saturation</p>
                      <p className="font-semibold">{selectedVisit.vitals[0].oxygenSaturation ? `${selectedVisit.vitals[0].oxygenSaturation}%` : 'N/A'}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-sm text-gray-600">Respiration Rate</p>
                      <p className="font-semibold">{selectedVisit.vitals[0].respirationRate ? `${selectedVisit.vitals[0].respirationRate} bpm` : 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Condition and Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm text-gray-600">Condition</p>
                      <p className="font-semibold text-green-800">{selectedVisit.vitals[0].condition || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded">
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="font-semibold text-yellow-800">{selectedVisit.vitals[0].notes || 'No notes'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Diagnosis Section */}
            <div className="card">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('diagnosis')}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Diagnosis & Treatment
                </h3>
                {expandedSections.diagnosis ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
              {expandedSections.diagnosis && (
                <div className="mt-4 space-y-4">
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
              )}
            </div>

            {/* Orders Section */}
            <div className="card">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('orders')}
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TestTube className="h-5 w-5 mr-2" />
                  Orders & Prescriptions
                </h3>
                {expandedSections.orders ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
              {expandedSections.orders && (
                <div className="mt-4 space-y-6">
                  {/* Lab and Radiology Orders - Side by Side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Lab Orders Section */}
                    <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                      <TestTube className="h-4 w-4 mr-2" />
                      Lab Orders
                    </h5>
                    
                    {/* Multiple Lab Test Selection */}
                    <div className="mb-4">
                      <label className="label">Select Lab Tests (Multiple Selection)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                        {labTestOptions.map((test) => (
                          <label key={test.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedLabTests.includes(test.id)}
                              onChange={() => handleLabTestToggle(test.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">
                              {test.name} - ETB {test.price}
                            </span>
                          </label>
                        ))}
                      </div>
                      
                      {selectedLabTests.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <p className="text-sm font-medium text-blue-800">
                            Selected: {selectedLabTests.length} test(s) - 
                            Total: ETB {selectedLabTests.reduce((sum, testId) => {
                              const test = labTestOptions.find(t => t.id === testId);
                              return sum + (test ? test.price : 0);
                            }, 0)}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3">
                        <label className="label">Instructions for all selected tests</label>
                        <textarea
                          className="input"
                          rows="2"
                          placeholder="Special instructions for all selected lab tests..."
                          value={labInstructions}
                          onChange={(e) => setLabInstructions(e.target.value)}
                        />
                      </div>
                      
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleAddMultipleLabOrders}
                          className={`btn btn-sm ${labOrdered ? 'btn-secondary' : 'btn-primary'}`}
                          disabled={selectedLabTests.length === 0 || labOrdered}
                        >
                          {labOrdered ? 'Lab Orders Sent ✓' : `Add ${selectedLabTests.length} Lab Order(s)`}
                        </button>
                      </div>
                    </div>
                    
                    {/* Existing Lab Orders */}
                    {selectedVisit.labOrders && selectedVisit.labOrders.length > 0 && (
                      <div className="space-y-2">
                        {selectedVisit.labOrders.map((order, index) => (
                          <div key={index} className="p-2 bg-blue-50 rounded text-sm flex justify-between items-center">
                            <span className="font-medium">{order.type?.name || 'Lab Test'}</span>
                            <span className="text-gray-500">{order.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    </div>

                    {/* Radiology Orders Section */}
                    <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                      <Scan className="h-4 w-4 mr-2" />
                      Radiology Orders
                    </h5>
                    
                    {/* Multiple Radiology Test Selection */}
                    <div className="mb-4">
                      <label className="label">Select Radiology Tests (Multiple Selection)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                        {radiologyTestOptions.map((test) => (
                          <label key={test.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedRadiologyTests.includes(test.id)}
                              onChange={() => handleRadiologyTestToggle(test.id)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm">
                              {test.name} - ETB {test.price}
                            </span>
                          </label>
                        ))}
                      </div>
                      
                      {selectedRadiologyTests.length > 0 && (
                        <div className="mt-3 p-3 bg-green-50 rounded">
                          <p className="text-sm font-medium text-green-800">
                            Selected: {selectedRadiologyTests.length} test(s) - 
                            Total: ETB {selectedRadiologyTests.reduce((sum, testId) => {
                              const test = radiologyTestOptions.find(t => t.id === testId);
                              return sum + (test ? test.price : 0);
                            }, 0)}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3">
                        <label className="label">Instructions for all selected tests</label>
                        <textarea
                          className="input"
                          rows="2"
                          placeholder="Special instructions for all selected radiology tests..."
                          value={radiologyInstructions}
                          onChange={(e) => setRadiologyInstructions(e.target.value)}
                        />
                      </div>
                      
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleAddMultipleRadiologyOrders}
                          className={`btn btn-sm ${radiologyOrdered ? 'btn-secondary' : 'btn-primary'}`}
                          disabled={selectedRadiologyTests.length === 0 || radiologyOrdered}
                        >
                          {radiologyOrdered ? 'Radiology Orders Sent ✓' : `Add ${selectedRadiologyTests.length} Radiology Order(s)`}
                        </button>
                      </div>
                    </div>
                    
                    {/* Existing Radiology Orders */}
                    {selectedVisit.radiologyOrders && selectedVisit.radiologyOrders.length > 0 && (
                      <div className="space-y-2">
                        {selectedVisit.radiologyOrders.map((order, index) => (
                          <div key={index} className="p-2 bg-green-50 rounded text-sm flex justify-between items-center">
                            <span className="font-medium">{order.type?.name || 'Radiology'}</span>
                            <span className="text-gray-500">{order.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Medication Orders Section */}
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                      <Pill className="h-4 w-4 mr-2" />
                      Medication Orders
                      {/* Show restriction warning if investigations are pending */}
                      {(() => {
                        const hasLabOrders = selectedVisit.labOrders && selectedVisit.labOrders.length > 0;
                        const hasRadiologyOrders = selectedVisit.radiologyOrders && selectedVisit.radiologyOrders.length > 0;
                        
                        if (hasLabOrders || hasRadiologyOrders) {
                          const allLabCompleted = !hasLabOrders || selectedVisit.labOrders.every(order => 
                            order.status === 'COMPLETED' || order.batchOrder?.status === 'COMPLETED'
                          );
                          const allRadiologyCompleted = !hasRadiologyOrders || selectedVisit.radiologyOrders.every(order => 
                            order.status === 'COMPLETED' || order.batchOrder?.status === 'COMPLETED'
                          );
                          
                          if (!allLabCompleted || !allRadiologyCompleted) {
                            return (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                Pending Results
                              </span>
                            );
                          }
                        }
                        return null;
                      })()}
                    </h5>
                    
                    {/* Add Medication Order Form */}
                    {(() => {
                      const hasLabOrders = selectedVisit.labOrders && selectedVisit.labOrders.length > 0;
                      const hasRadiologyOrders = selectedVisit.radiologyOrders && selectedVisit.radiologyOrders.length > 0;
                      
                      const allLabCompleted = !hasLabOrders || selectedVisit.labOrders.every(order => 
                        order.status === 'COMPLETED' || order.batchOrder?.status === 'COMPLETED'
                      );
                      const allRadiologyCompleted = !hasRadiologyOrders || selectedVisit.radiologyOrders.every(order => 
                        order.status === 'COMPLETED' || order.batchOrder?.status === 'COMPLETED'
                      );
                      
                      const isRestricted = (hasLabOrders || hasRadiologyOrders) && (!allLabCompleted || !allRadiologyCompleted);
                      
                      return (
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 ${isRestricted ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div>
                            <input
                              type="text"
                              className="input"
                              placeholder="Medication Name"
                              value={newMedicationOrder.name}
                              onChange={(e) => setNewMedicationOrder({...newMedicationOrder, name: e.target.value})}
                              disabled={isRestricted}
                            />
                          </div>
                          <div>
                            <select
                              className="input"
                              value={newMedicationOrder.dosageForm}
                              onChange={(e) => setNewMedicationOrder({...newMedicationOrder, dosageForm: e.target.value})}
                              disabled={isRestricted}
                            >
                              <option value="">Form</option>
                              <option value="TABLETS">Tablets</option>
                              <option value="CAPSULES">Capsules</option>
                              <option value="INJECTION">Injection</option>
                              <option value="SYRUP">Syrup</option>
                            </select>
                          </div>
                          <div>
                            <input
                              type="text"
                              className="input"
                              placeholder="Strength (e.g., 500mg)"
                              value={newMedicationOrder.strength}
                              onChange={(e) => setNewMedicationOrder({...newMedicationOrder, strength: e.target.value})}
                              disabled={isRestricted}
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={handleAddMedicationOrder}
                              className="btn btn-primary btn-sm w-full"
                              disabled={isRestricted}
                            >
                              Add Medication
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Additional fields for medication */}
                    {(() => {
                      const hasLabOrders = selectedVisit.labOrders && selectedVisit.labOrders.length > 0;
                      const hasRadiologyOrders = selectedVisit.radiologyOrders && selectedVisit.radiologyOrders.length > 0;
                      
                      const allLabCompleted = !hasLabOrders || selectedVisit.labOrders.every(order => 
                        order.status === 'COMPLETED' || order.batchOrder?.status === 'COMPLETED'
                      );
                      const allRadiologyCompleted = !hasRadiologyOrders || selectedVisit.radiologyOrders.every(order => 
                        order.status === 'COMPLETED' || order.batchOrder?.status === 'COMPLETED'
                      );
                      
                      const isRestricted = (hasLabOrders || hasRadiologyOrders) && (!allLabCompleted || !allRadiologyCompleted);
                      
                      return (
                        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 ${isRestricted ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div>
                            <input
                              type="number"
                              className="input"
                              placeholder="Quantity"
                              value={newMedicationOrder.quantity}
                              onChange={(e) => setNewMedicationOrder({...newMedicationOrder, quantity: e.target.value})}
                              disabled={isRestricted}
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              className="input"
                              placeholder="Frequency (e.g., Twice daily)"
                              value={newMedicationOrder.frequency}
                              onChange={(e) => setNewMedicationOrder({...newMedicationOrder, frequency: e.target.value})}
                              disabled={isRestricted}
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              className="input"
                              placeholder="Duration (e.g., 7 days)"
                              value={newMedicationOrder.duration}
                              onChange={(e) => setNewMedicationOrder({...newMedicationOrder, duration: e.target.value})}
                              disabled={isRestricted}
                            />
                          </div>
                        </div>
                      );
                    })()}
                    
                    {(() => {
                      const hasLabOrders = selectedVisit.labOrders && selectedVisit.labOrders.length > 0;
                      const hasRadiologyOrders = selectedVisit.radiologyOrders && selectedVisit.radiologyOrders.length > 0;
                      
                      const allLabCompleted = !hasLabOrders || selectedVisit.labOrders.every(order => 
                        order.status === 'COMPLETED' || order.batchOrder?.status === 'COMPLETED'
                      );
                      const allRadiologyCompleted = !hasRadiologyOrders || selectedVisit.radiologyOrders.every(order => 
                        order.status === 'COMPLETED' || order.batchOrder?.status === 'COMPLETED'
                      );
                      
                      const isRestricted = (hasLabOrders || hasRadiologyOrders) && (!allLabCompleted || !allRadiologyCompleted);
                      
                      return (
                        <div className={`mb-4 ${isRestricted ? 'opacity-50 pointer-events-none' : ''}`}>
                          <textarea
                            className="input"
                            rows="2"
                            placeholder="Instructions for taking the medication"
                            value={newMedicationOrder.instructions}
                            onChange={(e) => setNewMedicationOrder({...newMedicationOrder, instructions: e.target.value})}
                            disabled={isRestricted}
                          />
                        </div>
                      );
                    })()}
                    
                    {/* Existing Medication Orders */}
                    {selectedVisit.medicationOrders && selectedVisit.medicationOrders.length > 0 && (
                      <div className="space-y-2">
                        {selectedVisit.medicationOrders.map((order, index) => (
                          <div key={index} className="p-2 bg-purple-50 rounded text-sm flex justify-between items-center">
                            <span className="font-medium">{order.name} - {order.dosageForm} {order.strength}</span>
                            <span className="text-gray-500">{order.frequency}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Results Section */}
              <div className="border rounded-lg p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('results')}
                >
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Lab & Radiology Results
                  </h3>
                  {expandedSections.results ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
                {expandedSections.results && (
                  <div className="mt-4 space-y-6">
                    {/* Lab Results */}
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                        <TestTube className="h-4 w-4 mr-2" />
                        Lab Results
                      </h5>
                      {selectedVisit.labOrders && selectedVisit.labOrders.length > 0 ? (
                        <div className="space-y-4">
                          {selectedVisit.labOrders.map((order, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <h6 className="font-medium text-gray-900">{order.type?.name || 'Lab Test'}</h6>
                                <span className={`badge ${
                                  order.batchOrder?.status === 'COMPLETED' ? 'badge-success' : 
                                  order.batchOrder?.status === 'QUEUED' ? 'badge-info' : 'badge-warning'
                                }`}>
                                  {order.batchOrder?.status || order.status}
                                </span>
                              </div>
                              {order.batchOrder?.status === 'COMPLETED' && (
                                <div className="mt-2 space-y-2">
                                  <div className="text-sm text-gray-700">
                                    <strong>Result:</strong> {order.batchOrder.result || 'No result provided'}
                                  </div>
                                  {order.batchOrder.additionalNotes && (
                                    <div className="text-sm text-gray-600">
                                      <strong>Notes:</strong> {order.batchOrder.additionalNotes}
                                    </div>
                                  )}
                                  {order.batchOrder.attachments && order.batchOrder.attachments.length > 0 && (
                                    <div className="text-sm">
                                      <strong>Attachments:</strong>
                                      <div className="mt-1 space-y-1">
                                        {order.batchOrder.attachments.map((file, fileIndex) => (
                                          <a 
                                            key={fileIndex}
                                            href={file.path} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline"
                                          >
                                            {file.originalName || `Attachment ${fileIndex + 1}`}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No lab results available</p>
                      )}
                    </div>

                    {/* Radiology Results */}
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-gray-700 mb-3 flex items-center">
                        <Scan className="h-4 w-4 mr-2" />
                        Radiology Results
                      </h5>
                      {selectedVisit.radiologyOrders && selectedVisit.radiologyOrders.length > 0 ? (
                        <div className="space-y-4">
                          {selectedVisit.radiologyOrders.map((order, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <h6 className="font-medium text-gray-900">{order.type?.name || 'Radiology Test'}</h6>
                                <span className={`badge ${
                                  order.batchOrder?.status === 'COMPLETED' ? 'badge-success' : 
                                  order.batchOrder?.status === 'QUEUED' ? 'badge-info' : 'badge-warning'
                                }`}>
                                  {order.batchOrder?.status || order.status}
                                </span>
                              </div>
                              {order.batchOrder?.status === 'COMPLETED' && (
                                <div className="mt-2 space-y-2">
                                  <div className="text-sm text-gray-700">
                                    <strong>Report:</strong> {order.batchOrder.result || 'No report provided'}
                                  </div>
                                  {order.batchOrder.additionalNotes && (
                                    <div className="text-sm text-gray-600">
                                      <strong>Notes:</strong> {order.batchOrder.additionalNotes}
                                    </div>
                                  )}
                                  {order.batchOrder.attachments && order.batchOrder.attachments.length > 0 && (
                                    <div className="text-sm">
                                      <strong>Images:</strong>
                                      <div className="mt-1 space-y-1">
                                        {order.batchOrder.attachments.map((file, fileIndex) => (
                                          <a 
                                            key={fileIndex}
                                            href={file.path} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline"
                                          >
                                            {file.originalName || `Image ${fileIndex + 1}`}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No radiology results available</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPatientForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Save & Continue
              </button>
            </div>
          </form>
        </div>
      )}


    </div>
  );
};

export default PatientQueue;
