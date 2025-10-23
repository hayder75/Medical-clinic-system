import React, { useState, useEffect } from 'react';
import { Scan, Plus, X, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RadiologyOrdering = ({ visitId, patientId, onOrdersPlaced, existingOrders = [] }) => {
  const [radiologyTests, setRadiologyTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTests, setFetchingTests] = useState(true);

  useEffect(() => {
    fetchRadiologyTests();
  }, []);

  const fetchRadiologyTests = async () => {
    try {
      setFetchingTests(true);
      const response = await api.get('/doctors/investigation-types');
      const radiologyTests = response.data.investigationTypes.filter(
        test => test.category === 'RADIOLOGY'
      );
      setRadiologyTests(radiologyTests);
    } catch (error) {
      console.error('Error fetching radiology tests:', error);
      toast.error('Failed to fetch radiology tests');
    } finally {
      setFetchingTests(false);
    }
  };

  const toggleTestSelection = (test) => {
    // Check if this test is already ordered
    const isAlreadyOrdered = existingOrders.some(order => order.type?.id === test.id);
    if (isAlreadyOrdered) {
      toast.error('This test has already been ordered for this visit');
      return;
    }

    setSelectedTests(prev => {
      const isSelected = prev.some(selected => selected.id === test.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== test.id);
      } else {
        return [...prev, test];
      }
    });
  };

  const handleSubmitOrders = async () => {
    if (selectedTests.length === 0) {
      toast.error('Please select at least one radiology test');
      return;
    }

    setLoading(true);
    try {
      const batchOrderData = {
        visitId: parseInt(visitId),
        patientId,
        type: 'RADIOLOGY',
        instructions: instructions || 'Radiology tests ordered by doctor',
        services: selectedTests.map(test => ({
          serviceId: test.serviceId || test.id.toString(),
          investigationTypeId: test.id,
          instructions: instructions || `Radiology test: ${test.name}`
        }))
      };

      await api.post('/batch-orders/create', batchOrderData);

      toast.success(`${selectedTests.length} radiology test(s) ordered successfully`);
      
      // Reset form
      setSelectedTests([]);
      setInstructions('');
      
      if (onOrdersPlaced) {
        onOrdersPlaced();
      }
    } catch (error) {
      console.error('Error ordering radiology tests:', error);
      toast.error(error.response?.data?.error || 'Failed to order radiology tests');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingTests) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Scan className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Radiology Test Ordering</h3>
            <p className="text-sm text-gray-600">Select and order radiology tests</p>
          </div>
        </div>
        {selectedTests.length > 0 && (
          <div className="flex items-center space-x-2 text-sm font-medium text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{selectedTests.length} test(s) selected</span>
          </div>
        )}
      </div>

      {/* Available Radiology Tests */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Available Radiology Tests</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {radiologyTests.map((test) => {
            const isSelected = selectedTests.some(selected => selected.id === test.id);
            const isAlreadyOrdered = existingOrders.some(order => order.type?.id === test.id);
            return (
              <div
                key={test.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  isAlreadyOrdered 
                    ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed' 
                    : isSelected 
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => !isAlreadyOrdered && toggleTestSelection(test)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium text-gray-900">{test.name}</h5>
                      {isAlreadyOrdered && (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">Already Ordered</span>
                      )}
                      {isSelected && !isAlreadyOrdered && (
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="text-xs text-gray-500">
                        Code: {test.service?.code || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="ml-3">
                    {isSelected ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTestSelection(test);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTestSelection(test);
                        }}
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
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
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-3">Selected Radiology Tests</h4>
          <div className="space-y-2">
            {selectedTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between text-sm">
                <span className="text-purple-800">{test.name}</span>
                <span className="text-xs text-purple-600">{test.service?.code || 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions for Radiology Tests
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Add specific instructions for the radiology tests..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmitOrders}
          disabled={selectedTests.length === 0 || loading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Ordering...</span>
            </>
          ) : (
            <>
              <Scan className="h-4 w-4" />
              <span>Order {selectedTests.length} Radiology Test(s)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RadiologyOrdering;
