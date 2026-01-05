import React, { useState, useEffect } from 'react';
import { AlertTriangle, Pill, CheckCircle, Clock, Search } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EmergencyDrugOrdering = ({ visit, onOrdersPlaced }) => {
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [existingOrders, setExistingOrders] = useState([]);

  useEffect(() => {
    fetchServices();
    fetchExistingOrders();
  }, [visit?.id]);

  const fetchServices = async () => {
    try {
      setFetchingData(true);
      // Fetch all services and filter for EMERGENCY_DRUG category - use doctors endpoint
      const response = await api.get('/doctors/services?category=EMERGENCY_DRUG');
      const emergencyDrugs = (response.data.services || []).filter(
        service => service.category === 'EMERGENCY_DRUG' && service.isActive
      );
      setServices(emergencyDrugs);
    } catch (error) {
      console.error('Error fetching emergency drugs:', error);
      toast.error('Failed to fetch emergency drugs');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchExistingOrders = async () => {
    if (!visit?.id) return;
    
    try {
      const response = await api.get(`/emergency/drugs?visitId=${visit.id}`);
      setExistingOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching existing orders:', error);
    }
  };

  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        const newQuantities = { ...quantities };
        delete newQuantities[service.id];
        setQuantities(newQuantities);
        return prev.filter(s => s.id !== service.id);
      } else {
        setQuantities({ ...quantities, [service.id]: 1 });
        return [...prev, service];
      }
    });
  };

  const updateQuantity = (serviceId, quantity) => {
    setQuantities({ ...quantities, [serviceId]: Math.max(1, parseInt(quantity) || 1) });
  };

  const calculateTotal = () => {
    return selectedServices.reduce((sum, service) => {
      const qty = quantities[service.id] || 1;
      return sum + (service.price * qty);
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one emergency drug');
      return;
    }

    setLoading(true);
    try {
      // Create orders for each selected service
      const orders = [];
      for (const service of selectedServices) {
        const qty = quantities[service.id] || 1;
        const orderData = {
          visitId: visit?.id || null,
          patientId: visit?.patient?.id,
          serviceId: service.id,
          quantity: qty,
          instructions,
          notes
        };

        const response = await api.post('/emergency/drugs', orderData);
        orders.push(response.data);
      }

      toast.success(`${orders.length} emergency drug order(s) created successfully!`);
      
      // Clear form
      setSelectedServices([]);
      setQuantities({});
      setInstructions('');
      setNotes('');
      
      // Refresh existing orders
      await fetchExistingOrders();
      
      if (onOrdersPlaced) {
        onOrdersPlaced();
      }
    } catch (error) {
      console.error('Error creating emergency drug orders:', error);
      toast.error(error.response?.data?.error || 'Failed to create emergency drug orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Existing Orders */}
      {existingOrders.length > 0 && (
        <div>
          <h4 className="font-medium mb-3" style={{ color: '#0C0E0B' }}>Existing Emergency Drug Orders</h4>
          <div className="space-y-2">
            {existingOrders.map((order) => (
              <div key={order.id} className="p-3 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium" style={{ color: '#0C0E0B' }}>{order.service.name}</h5>
                    <p className="text-sm" style={{ color: '#6B7280' }}>
                      Quantity: {order.quantity} • {order.service.price * order.quantity} Birr
                    </p>
                    {order.instructions && (
                      <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{order.instructions}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    order.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order New Emergency Drugs */}
      <div className="border-t pt-6" style={{ borderColor: '#E5E7EB' }}>
        <h4 className="font-medium mb-4" style={{ color: '#0C0E0B' }}>Order Emergency Drugs</h4>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search emergency drugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Services List */}
        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto mb-4">
          {filteredServices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No emergency drugs found matching your search' : 'No emergency drugs available'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredServices.map((service) => {
                const isSelected = selectedServices.find(s => s.id === service.id);
                return (
                  <div
                    key={service.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => toggleService(service)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleService(service)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">{service.name}</h3>
                            {service.code && (
                              <p className="text-sm text-gray-500">Code: {service.code}</p>
                            )}
                            {service.description && (
                              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-semibold text-gray-900">{service.price?.toFixed(2)} Birr</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 ml-7">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={quantities[service.id] || 1}
                          onChange={(e) => updateQuantity(service.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Services Summary */}
        {selectedServices.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-900 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Selected Emergency Drugs ({selectedServices.length})
            </h3>
            <div className="space-y-1">
              {selectedServices.map((service) => {
                const qty = quantities[service.id] || 1;
                return (
                  <div key={service.id} className="flex justify-between text-sm">
                    <span className="text-red-800">{service.name} x{qty}</span>
                    <span className="font-medium text-red-900">{(service.price * qty).toFixed(2)} Birr</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-red-300 flex justify-between items-center">
              <span className="font-semibold text-red-900">Total:</span>
              <span className="text-xl font-bold text-red-900">{calculateTotal().toFixed(2)} Birr</span>
            </div>
          </div>
        )}

        {/* Instructions and Notes */}
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Instructions for administration..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitOrder}
          disabled={loading || selectedServices.length === 0}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Orders...
            </>
          ) : (
            <>
              <Pill className="h-4 w-4 mr-2" />
              Create Emergency Drug Orders
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EmergencyDrugOrdering;

