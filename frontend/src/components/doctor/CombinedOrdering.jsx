import React, { useState } from 'react';
import { TestTube, Scan, X, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CombinedOrdering = ({ visit, onClose, onOrdersPlaced }) => {
  const [selectedLabTests, setSelectedLabTests] = useState([]);
  const [selectedRadiologyTests, setSelectedRadiologyTests] = useState([]);
  const [labInstructions, setLabInstructions] = useState('');
  const [radiologyInstructions, setRadiologyInstructions] = useState('');
  const [loading, setLoading] = useState(false);

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

  const toggleLabTest = (test) => {
    setSelectedLabTests(prev => 
      prev.find(t => t.id === test.id) 
        ? prev.filter(t => t.id !== test.id)
        : [...prev, test]
    );
  };

  const toggleRadiologyTest = (test) => {
    setSelectedRadiologyTests(prev => 
      prev.find(t => t.id === test.id) 
        ? prev.filter(t => t.id !== test.id)
        : [...prev, test]
    );
  };

  const calculateTotal = () => {
    const labTotal = selectedLabTests.reduce((sum, test) => sum + test.price, 0);
    const radiologyTotal = selectedRadiologyTests.reduce((sum, test) => sum + test.price, 0);
    return labTotal + radiologyTotal;
  };

  const handleSubmit = async () => {
    if (selectedLabTests.length === 0 && selectedRadiologyTests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }

    setLoading(true);
    try {
      const promises = [];

      // Submit lab orders if any selected
      if (selectedLabTests.length > 0) {
        const labOrderData = {
          visitId: visit.id,
          patientId: visit.patient.id,
          orders: selectedLabTests.map(test => ({
            typeId: test.id,
            instructions: labInstructions || 'Lab test ordered by doctor'
          }))
        };
        promises.push(api.post('/doctors/lab-orders/multiple', labOrderData));
      }

      // Submit radiology orders if any selected
      if (selectedRadiologyTests.length > 0) {
        const radiologyOrderData = {
          visitId: visit.id,
          patientId: visit.patient.id,
          orders: selectedRadiologyTests.map(test => ({
            typeId: test.id,
            instructions: radiologyInstructions || 'Radiology test ordered by doctor'
          }))
        };
        promises.push(api.post('/doctors/radiology-orders/multiple', radiologyOrderData));
      }

      // Wait for all orders to be submitted
      await Promise.all(promises);

      toast.success('All orders placed successfully!');
      onOrdersPlaced();
      onClose();
    } catch (error) {
      console.error('Error placing orders:', error);
      toast.error('Failed to place orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Order Lab & Radiology Tests
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {visit.patient.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {visit.patient.name} - {visit.patient.id}
                </p>
                <p className="text-sm text-gray-500">
                  Visit: {visit.visitUid}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lab Tests Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <TestTube className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Lab Tests</h3>
                <span className="text-sm text-gray-500">
                  ({selectedLabTests.length} selected)
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {labTestOptions.map((test) => (
                  <label
                    key={test.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLabTests.some(t => t.id === test.id)}
                      onChange={() => toggleLabTest(test)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {test.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ETB {test.price}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lab Instructions
                </label>
                <textarea
                  value={labInstructions}
                  onChange={(e) => setLabInstructions(e.target.value)}
                  placeholder="Special instructions for lab tests..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Radiology Tests Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Scan className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Radiology Tests</h3>
                <span className="text-sm text-gray-500">
                  ({selectedRadiologyTests.length} selected)
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {radiologyTestOptions.map((test) => (
                  <label
                    key={test.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRadiologyTests.some(t => t.id === test.id)}
                      onChange={() => toggleRadiologyTest(test)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {test.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ETB {test.price}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radiology Instructions
                </label>
                <textarea
                  value={radiologyInstructions}
                  onChange={(e) => setRadiologyInstructions(e.target.value)}
                  placeholder="Special instructions for radiology tests..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Order Summary</h4>
                <p className="text-sm text-gray-600">
                  {selectedLabTests.length} lab test(s) • {selectedRadiologyTests.length} radiology test(s)
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  ETB {calculateTotal().toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total cost</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (selectedLabTests.length === 0 && selectedRadiologyTests.length === 0)}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Placing Orders...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Place All Orders</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedOrdering;
