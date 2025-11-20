import React, { useState, useEffect } from 'react';
import { TestTube, Plus, X, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LabOrdering = ({ visitId, patientId, onOrdersPlaced, existingOrders = [] }) => {
  const [labTests, setLabTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTests, setFetchingTests] = useState(true);

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      setFetchingTests(true);
      const response = await api.get('/doctors/services?category=LAB');
      setLabTests(response.data.services || []);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      toast.error('Failed to fetch lab tests');
    } finally {
      setFetchingTests(false);
    }
  };

  const handleTestSelect = (test) => {
    setSelectedTests(prev => {
      const exists = prev.find(t => t.id === test.id);
      if (exists) {
        return prev.filter(t => t.id !== test.id);
      } else {
        return [...prev, test];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedTests.length === 0) {
      toast.error('Please select at least one lab test');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        visitId: parseInt(visitId),
        patientId: patientId.toString(),
        type: 'LAB',
        services: selectedTests.map(test => ({
          serviceId: test.id.toString(),
          instructions: `Lab test: ${test.name}`
        })),
        instructions: instructions
      };

      const response = await api.post('/batch-orders/create', orderData);
      
      toast.success('Lab orders placed successfully');
      
      if (onOrdersPlaced) {
        onOrdersPlaced(response.data.batchOrder);
      }
      
      // Reset form
      setSelectedTests([]);
      setInstructions('');
      
    } catch (error) {
      console.error('Error placing lab orders:', error);
      toast.error(error.response?.data?.error || 'Failed to place lab orders');
    } finally {
      setLoading(false);
    }
  };

  const getTestStatus = (testId) => {
    const existingOrder = existingOrders.find(order => 
      order.services.some(service => service.serviceId === testId)
    );
    
    if (existingOrder) {
      const service = existingOrder.services.find(service => service.serviceId === testId);
      return service?.status || 'PENDING';
    }
    return null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'QUEUED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'IN_PROGRESS':
      case 'QUEUED':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (fetchingTests) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading lab tests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Lab Tests */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-gray-900">Available Lab Tests</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {labTests.map((test) => {
            const status = getTestStatus(test.id);
            const isSelected = selectedTests.some(t => t.id === test.id);
            const isExisting = status !== null;
            
            return (
              <div
                key={test.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-primary-500 bg-primary-50' 
                    : isExisting
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
                }`}
                onClick={() => !isExisting && handleTestSelect(test)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TestTube className="w-5 h-5 text-primary-600" />
                    <div>
                      <h5 className="font-medium text-gray-900">{test.name}</h5>
                      <p className="text-sm text-gray-600">{test.description}</p>
                      <p className="text-sm font-medium text-primary-600">
                        {test.price} ETB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isExisting && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span>{status}</span>
                      </span>
                    )}
                    
                    {isSelected && !isExisting && (
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Tests Summary */}
      {selectedTests.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Selected Lab Tests ({selectedTests.length})</h4>
          <div className="space-y-2">
            {selectedTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between bg-white rounded p-2">
                <span className="text-sm font-medium">{test.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-primary-600 font-medium">{test.price} ETB</span>
                  <button
                    onClick={() => handleTestSelect(test)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-900">Total:</span>
              <span className="font-bold text-primary-600">
                {selectedTests.reduce((sum, test) => sum + test.price, 0)} ETB
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions (Optional)
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Add any specific instructions for the lab tests..."
        />
      </div>

      {/* Submit Button */}
      {selectedTests.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Placing Orders...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Place Lab Orders</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default LabOrdering;
