import React, { useState, useEffect } from 'react';
import { Stethoscope, Users, X, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DoctorServiceOrdering = ({ visit, onClose, onOrdersPlaced }) => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [nurses, setNurses] = useState([]);

  useEffect(() => {
    fetchServices();
    fetchNurses();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/nurses/services');
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to fetch services');
    }
  };

  const fetchNurses = async () => {
    try {
      const response = await api.get('/nurses');
      setNurses(response.data.nurses || []);
    } catch (error) {
      console.error('Error fetching nurses:', error);
      toast.error('Failed to fetch nurses');
    }
  };

  const toggleService = (service) => {
    setSelectedServices(prev => 
      prev.find(s => s.id === service.id) 
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  const calculateTotal = () => {
    return selectedServices.reduce((sum, service) => sum + service.price, 0);
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    if (!selectedNurse) {
      toast.error('Please select a nurse');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/doctors/service-orders', {
        visitId: visit.id,
        patientId: visit.patient.id,
        serviceIds: selectedServices.map(s => s.id),
        assignedNurseId: selectedNurse,
        instructions: instructions.trim() || undefined
      });

      toast.success('Nurse services ordered successfully!');
      onOrdersPlaced(response.data);
      onClose();
    } catch (error) {
      console.error('Error creating service orders:', error);
      toast.error(error.response?.data?.error || 'Failed to create service orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Stethoscope className="h-6 w-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Order Custom Services</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Patient Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Patient Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Name:</span>
              <span className="ml-2 text-blue-800">{visit.patient?.name}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">ID:</span>
              <span className="ml-2 text-blue-800">{visit.patient?.id}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Visit:</span>
              <span className="ml-2 text-blue-800">{visit.visitUid}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Status:</span>
              <span className="ml-2 text-blue-800">{visit.status}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Stethoscope className="h-5 w-5 mr-2 text-green-500" />
              Available Services
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedServices.find(s => s.id === service.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <p className="text-sm text-gray-500">{service.description}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        ETB {service.price.toLocaleString()}
                      </span>
                      {selectedServices.find(s => s.id === service.id) && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {services.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Stethoscope className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No services available</p>
              </div>
            )}
          </div>

          {/* Nurse Selection & Instructions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-500" />
              Assignment Details
            </h3>

            {/* Nurse Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Nurse *
              </label>
              <select
                value={selectedNurse}
                onChange={(e) => setSelectedNurse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a nurse</option>
                {nurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.fullname} ({nurse.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Instructions */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter specific instructions for the nurse..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
              
              {selectedServices.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {selectedServices.map((service) => (
                    <div key={service.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{service.name}</span>
                      <span className="font-medium">ETB {service.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3">No services selected</p>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between font-medium text-lg">
                  <span>Total:</span>
                  <span className="text-green-600">ETB {calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedServices.length === 0 || !selectedNurse}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Orders...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Service Orders
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Service Order Process:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Patient will be sent to billing to pay for selected services</li>
                <li>After payment, services will appear in the assigned nurse's daily tasks</li>
                <li>Nurse will complete services and add completion notes</li>
                <li>Patient will return to doctor queue with completed services and notes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorServiceOrdering;


