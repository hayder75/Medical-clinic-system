import React, { useState, useEffect } from 'react';
import { Stethoscope, User, CheckCircle, Clock, DollarSign } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NurseServiceOrderingInterface = ({ visit, onOrdersPlaced }) => {
  const [services, setServices] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [pendingServices, setPendingServices] = useState([]);
  const [existingServices, setExistingServices] = useState([]);
  const [hasExistingOrders, setHasExistingOrders] = useState(false);

  useEffect(() => {
    fetchServicesAndNurses();
    fetchPendingServices();
  }, [visit?.id]);

  const fetchPendingServices = async () => {
    if (!visit?.id) return;
    
    try {
      // Get existing nurse service assignments from visit data
      const existingAssignments = visit?.nurseServiceAssignments || [];
      
      // Separate completed and pending services
      const completedServices = existingAssignments.filter(assignment => assignment.status === 'COMPLETED');
      const pendingServices = existingAssignments.filter(assignment => assignment.status === 'PENDING');
      
      setExistingServices(completedServices);
      setPendingServices(pendingServices);
      setHasExistingOrders(existingAssignments.length > 0);
      
    } catch (error) {
      console.error('Error fetching nurse services:', error);
    }
  };

  const fetchServicesAndNurses = async () => {
    try {
      setFetchingData(true);
      const [servicesResponse, nursesResponse] = await Promise.all([
        api.get('/nurses/services'),
        api.get('/nurses/nurses')
      ]);
      
      setServices(servicesResponse.data.services || []);
      setNurses(nursesResponse.data.nurses || []);
    } catch (error) {
      console.error('Error fetching services and nurses:', error);
      toast.error('Failed to fetch services and nurses');
    } finally {
      setFetchingData(false);
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

  const handleSubmitOrder = async () => {
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
      const orderData = {
        visitId: visit.id,
        patientId: visit.patient.id,
        serviceIds: selectedServices.map(s => s.id),
        assignedNurseId: selectedNurse,
        instructions: instructions || `Doctor ordered: ${selectedServices.map(s => s.name).join(', ')}`
      };

      await api.post('/doctors/service-orders', orderData);
      
      toast.success(`${selectedServices.length} service(s) ordered successfully!`);
      
      // Refresh pending services instead of clearing selection
      await fetchPendingServices();
      
      // Reset form
      setSelectedServices([]);
      setSelectedNurse('');
      setInstructions('');
      
      // Refresh data
      onOrdersPlaced();
    } catch (error) {
      console.error('Error ordering services:', error);
      toast.error(error.response?.data?.error || 'Failed to order services');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#2e13d1' }}></div>
        <span className="ml-2" style={{ color: '#6B7280' }}>Loading services...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Existing Services */}
      {hasExistingOrders && (
        <div className="space-y-4">
          {/* Completed Services */}
          {existingServices.length > 0 && (
            <div className="p-4 border rounded-lg" style={{ borderColor: '#10B981', backgroundColor: '#ECFDF5' }}>
              <h5 className="font-medium mb-3 flex items-center" style={{ color: '#065F46' }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed Services
              </h5>
              <div className="space-y-2">
                {existingServices.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#FFFFFF' }}>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="font-medium" style={{ color: '#0C0E0B' }}>{assignment.service.name}</span>
                      <span className="text-sm ml-2" style={{ color: '#6B7280' }}>
                        (Completed by: {assignment.assignedNurse.fullname})
                      </span>
                    </div>
                    <span className="font-medium" style={{ color: '#0C0E0B' }}>ETB {assignment.service.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Services */}
          {pendingServices.length > 0 && (
            <div className="p-4 border rounded-lg" style={{ borderColor: '#F59E0B', backgroundColor: '#FEF3C7' }}>
              <h5 className="font-medium mb-3 flex items-center" style={{ color: '#92400E' }}>
                <Clock className="h-4 w-4 mr-2" />
                Pending Services (Awaiting Nurse Completion)
              </h5>
              <div className="space-y-2">
                {pendingServices.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#FFFFFF' }}>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="font-medium" style={{ color: '#0C0E0B' }}>{assignment.service.name}</span>
                      <span className="text-sm ml-2" style={{ color: '#6B7280' }}>
                        (Assigned to: {assignment.assignedNurse.fullname})
                      </span>
                    </div>
                    <span className="font-medium" style={{ color: '#0C0E0B' }}>ETB {assignment.service.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <span className="font-semibold" style={{ color: '#92400E' }}>Total Pending:</span>
                <span className="text-lg font-bold" style={{ color: '#92400E' }}>
                  ETB {pendingServices.reduce((sum, s) => sum + s.service.price, 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Services Summary */}
      {selectedServices.length > 0 && (
        <div className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
          <h5 className="font-medium mb-3" style={{ color: '#0C0E0B' }}>Selected Services</h5>
          <div className="space-y-2">
            {selectedServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="font-medium" style={{ color: '#0C0E0B' }}>{service.name}</span>
                </div>
                <span className="font-medium" style={{ color: '#0C0E0B' }}>ETB {service.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t flex justify-between items-center">
            <span className="font-semibold" style={{ color: '#0C0E0B' }}>Total:</span>
            <span className="text-lg font-bold" style={{ color: '#2e13d1' }}>ETB {calculateTotal().toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Services List */}
      {!hasExistingOrders ? (
        <div>
          <h5 className="font-medium mb-3" style={{ color: '#0C0E0B' }}>Available Services</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((service) => {
              const isSelected = selectedServices.find(s => s.id === service.id);
              return (
                <div
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Stethoscope className="h-4 w-4 mr-2" style={{ color: isSelected ? '#059669' : '#6B7280' }} />
                        <h6 className="font-medium" style={{ color: '#0C0E0B' }}>{service.name}</h6>
                      </div>
                      <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{service.description}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-medium" style={{ color: '#0C0E0B' }}>ETB {service.price.toLocaleString()}</p>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="font-medium" style={{ color: '#0C0E0B' }}>
              Nurse services have already been ordered for this visit
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            You can view the status of existing orders above. Additional orders are not allowed.
          </p>
        </div>
      )}

      {/* Nurse Selection */}
      {!hasExistingOrders && (
        <div>
          <h5 className="font-medium mb-3" style={{ color: '#0C0E0B' }}>Assign Nurse</h5>
          <select
            value={selectedNurse}
            onChange={(e) => setSelectedNurse(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ borderColor: '#E5E7EB' }}
          >
            <option value="">Select a nurse...</option>
            {nurses.map((nurse) => (
              <option key={nurse.id} value={nurse.id}>
                {nurse.fullname} ({nurse.username})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Instructions */}
      {!hasExistingOrders && (
        <div>
          <h5 className="font-medium mb-3" style={{ color: '#0C0E0B' }}>Instructions (Optional)</h5>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Add specific instructions for the nurse..."
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ borderColor: '#E5E7EB' }}
            rows={3}
          />
        </div>
      )}

      {/* Submit Button */}
      {!hasExistingOrders && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmitOrder}
            disabled={loading || selectedServices.length === 0 || !selectedNurse}
            className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 ${
              loading || selectedServices.length === 0 || !selectedNurse
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'text-white hover:bg-green-700'
            }`}
            style={{ 
              backgroundColor: loading || selectedServices.length === 0 || !selectedNurse ? '#D1D5DB' : '#059669'
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Ordering...</span>
              </>
            ) : (
              <>
                <Stethoscope className="h-4 w-4" />
                <span>Order {selectedServices.length} Service{selectedServices.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default NurseServiceOrderingInterface;
