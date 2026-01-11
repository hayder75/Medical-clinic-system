import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, CheckCircle, Clock, DollarSign, AlertCircle, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DentalServiceOrdering = ({ visitId, patientId, onOrdersPlaced, existingOrders = [] }) => {
  const [dentalServices, setDentalServices] = useState([]);
  
  // Use sessionStorage key to persist selected services across refetches
  const storageKey = `dental-services-${visitId}`;
  
  // Load selected services from sessionStorage on mount
  const loadStoredServices = () => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading stored services:', error);
    }
    return { selectedServices: [], serviceQuantities: {}, instructions: '' };
  };
  
  const storedData = loadStoredServices();
  const [selectedServices, setSelectedServices] = useState(storedData.selectedServices || []);
  const [serviceQuantities, setServiceQuantities] = useState(storedData.serviceQuantities || {});
  const [serviceNotes, setServiceNotes] = useState(storedData.serviceNotes || {});
  const [instructions, setInstructions] = useState(storedData.instructions || '');
  const [loading, setLoading] = useState(false);
  const [fetchingServices, setFetchingServices] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Save to sessionStorage whenever selections change
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        selectedServices,
        serviceQuantities,
        serviceNotes,
        instructions
      }));
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  }, [selectedServices, serviceQuantities, serviceNotes, instructions, storageKey]);

  useEffect(() => {
    fetchDentalServices();
    // Load stored selections from sessionStorage
    const stored = loadStoredServices();
    if (stored.selectedServices.length > 0) {
      setSelectedServices(stored.selectedServices);
      setServiceQuantities(stored.serviceQuantities);
      setServiceNotes(stored.serviceNotes || {});
      setInstructions(stored.instructions);
    }
  }, []);

  const fetchDentalServices = async () => {
    try {
      setFetchingServices(true);
      const response = await api.get('/doctors/services?category=DENTAL');
      setDentalServices(response.data.services || []);
    } catch (error) {
      console.error('Error fetching dental services:', error);
      toast.error('Failed to fetch dental services');
    } finally {
      setFetchingServices(false);
    }
  };

  const handleServiceSelect = (service) => {
    // Check if already ordered
    const isAlreadyOrdered = existingOrders.some(order => 
      order.services?.some(s => s.serviceId === service.id)
    );
    
    if (isAlreadyOrdered) {
      toast.error('This service has already been ordered for this visit');
      return;
    }

    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        // Remove service and its quantity and notes
        const newQuantities = { ...serviceQuantities };
        const newNotes = { ...serviceNotes };
        delete newQuantities[service.id];
        delete newNotes[service.id];
        setServiceQuantities(newQuantities);
        setServiceNotes(newNotes);
        return prev.filter(s => s.id !== service.id);
      } else {
        // Add service with default quantity 1
        setServiceQuantities(prev => ({
          ...prev,
          [service.id]: 1
        }));
        return [...prev, service];
      }
    });
  };

  const updateQuantity = (serviceId, quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    setServiceQuantities(prev => ({
      ...prev,
      [serviceId]: qty
    }));
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => {
      const quantity = serviceQuantities[service.id] || 1;
      return total + (service.price * quantity);
    }, 0);
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one dental service');
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmOrder = async () => {
    try {
      setLoading(true);
      setShowConfirmModal(false);

      // Prepare services - expand quantities into multiple entries
      const services = [];
      selectedServices.forEach(service => {
        const quantity = serviceQuantities[service.id] || 1;
        const serviceNote = serviceNotes[service.id] || '';
        // Create one entry per unit
        for (let i = 0; i < quantity; i++) {
          services.push({
            serviceId: service.id,
            instructions: serviceNote || instructions || undefined
          });
        }
      });

      // Prepare request payload
      const payload = {
        visitId: parseInt(visitId),
        patientId: String(patientId),
        type: 'DENTAL',
        services: services
      };

      // Add instructions only if provided
      if (instructions && instructions.trim()) {
        payload.instructions = instructions.trim();
      }

      console.log('🔍 Sending batch order request:', JSON.stringify(payload, null, 2));

      // Create batch order
      const response = await api.post('/batch-orders/create', payload);

      toast.success('Dental services ordered successfully! Patient sent to billing.');
      
      // Reset form and clear sessionStorage
      setSelectedServices([]);
      setServiceQuantities({});
      setServiceNotes({});
      setInstructions('');
      setSearchQuery('');
      try {
        sessionStorage.removeItem(storageKey);
      } catch (error) {
        console.error('Error clearing sessionStorage:', error);
      }

      // Notify parent
      if (onOrdersPlaced) {
        await onOrdersPlaced();
      }
    } catch (error) {
      console.error('Error ordering dental services:', error);
      toast.error(error.response?.data?.error || 'Failed to order dental services');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = dentalServices.filter(service => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      service.code.toLowerCase().includes(query) ||
      (service.description && service.description.toLowerCase().includes(query))
    );
  });

  // Get ordered services for this visit
  const orderedServices = existingOrders
    .filter(order => order.type === 'DENTAL')
    .flatMap(order => order.services || [])
    .map(service => service.serviceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#0C0E0B' }}>Dental Services</h3>
          <p className="text-sm" style={{ color: '#6B7280' }}>Select dental procedures to perform</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#9CA3AF' }} />
        <input
          type="text"
          placeholder="Search dental services by name or code..."
          className="input pl-10 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Selected Services */}
      {selectedServices.length > 0 && (
        <div className="p-4 rounded-lg border" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
          <h4 className="font-medium mb-3" style={{ color: '#0C0E0B' }}>Selected Services</h4>
          <div className="space-y-3">
            {selectedServices.map(service => {
              const quantity = serviceQuantities[service.id] || 1;
              const totalPrice = service.price * quantity;
              return (
                <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-white border" style={{ borderColor: '#E5E7EB' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: '#0C0E0B' }}>{service.name}</span>
                      <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}>
                        {service.code}
                      </span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                      {service.unit || 'UNIT'} × {quantity} = {totalPrice.toFixed(2)} ETB
                    </p>
                    <div className="mt-2">
                      <label className="text-xs block mb-1" style={{ color: '#6B7280' }}>Notes (optional):</label>
                      <textarea
                        value={serviceNotes[service.id] || ''}
                        onChange={(e) => setServiceNotes(prev => ({ ...prev, [service.id]: e.target.value }))}
                        placeholder="Add notes for this service..."
                        className="w-full px-2 py-1 border rounded text-sm"
                        style={{ borderColor: '#D1D5DB', minHeight: '60px' }}
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm" style={{ color: '#6B7280' }}>Qty:</label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => updateQuantity(service.id, e.target.value)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                        style={{ borderColor: '#D1D5DB' }}
                      />
                    </div>
                    <button
                      onClick={() => handleServiceSelect(service)}
                      className="p-1 rounded hover:bg-red-50"
                      style={{ color: '#EA2E00' }}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold" style={{ color: '#0C0E0B' }}>Total:</span>
              <span className="text-xl font-bold" style={{ color: '#2e13d1' }}>
                {calculateTotal().toFixed(2)} ETB
              </span>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                style={{ backgroundColor: '#2e13d1', color: '#FFFFFF' }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Ordering...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Order Services
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      <div>
        <h4 className="font-medium mb-3" style={{ color: '#0C0E0B' }}>Available Services</h4>
        {fetchingServices ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: '#2e13d1' }}></div>
            <p style={{ color: '#6B7280' }}>Loading services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4" style={{ color: '#9CA3AF' }} />
            <p style={{ color: '#6B7280' }}>No dental services found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredServices.map(service => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              const isOrdered = orderedServices.includes(service.id);
              
              return (
                <div
                  key={service.id}
                  onClick={() => !isOrdered && handleServiceSelect(service)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    isOrdered 
                      ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                      : isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium" style={{ color: '#0C0E0B' }}>{service.name}</span>
                        {isOrdered && (
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                            Ordered
                          </span>
                        )}
                        {isSelected && !isOrdered && (
                          <CheckCircle className="h-5 w-5" style={{ color: '#2e13d1' }} />
                        )}
                      </div>
                      <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{service.code}</p>
                      {service.description && (
                        <p className="text-sm mb-2" style={{ color: '#6B7280' }}>{service.description}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="font-semibold" style={{ color: '#2e13d1' }}>
                          {service.price.toFixed(2)} ETB
                        </span>
                        {service.unit && service.unit !== 'UNIT' && (
                          <span className="text-xs" style={{ color: '#6B7280' }}>
                            per {service.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Instructions */}
      {selectedServices.length > 0 && (
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2" style={{ color: '#0C0E0B' }}>
            Instructions (Optional)
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            className="input w-full"
            placeholder="Add any special instructions for these procedures..."
          />
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Confirm Order</h3>
            <div className="mb-4">
              <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
                You are about to order the following dental services:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedServices.map(service => {
                  const quantity = serviceQuantities[service.id] || 1;
                  const totalPrice = service.price * quantity;
                  return (
                    <div key={service.id} className="p-2 rounded bg-gray-50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium" style={{ color: '#0C0E0B' }}>
                          {service.name}
                        </span>
                        <span className="text-sm" style={{ color: '#6B7280' }}>
                          {quantity} × {service.price.toFixed(2)} = {totalPrice.toFixed(2)} ETB
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between items-center" style={{ borderColor: '#E5E7EB' }}>
                <span className="font-semibold" style={{ color: '#0C0E0B' }}>Total:</span>
                <span className="text-lg font-bold" style={{ color: '#2e13d1' }}>
                  {calculateTotal().toFixed(2)} ETB
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: '#D1D5DB', color: '#6B7280' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmOrder}
                disabled={loading}
                className="px-4 py-2 rounded-lg font-medium"
                style={{ backgroundColor: '#2e13d1', color: '#FFFFFF' }}
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalServiceOrdering;

