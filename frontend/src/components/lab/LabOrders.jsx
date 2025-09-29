import React, { useState, useEffect } from 'react';
import { TestTube, Clock, CheckCircle, AlertTriangle, FileText, Upload } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LabOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showResultForm, setShowResultForm] = useState(false);
  const [resultData, setResultData] = useState({
    result: '',
    additionalNotes: '',
    attachments: []
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/labs/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      toast.error('Failed to fetch lab orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/labs/orders/${selectedOrder.id}/result`, {
        result: resultData.result,
        additionalNotes: resultData.additionalNotes,
        attachments: resultData.attachments
      });

      toast.success('Lab result submitted successfully!');
      setShowResultForm(false);
      setSelectedOrder(null);
      setResultData({
        result: '',
        additionalNotes: '',
        attachments: []
      });
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit result');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'UNPAID':
        return 'badge-warning';
      case 'QUEUED':
        return 'badge-info';
      case 'COMPLETED':
        return 'badge-success';
      default:
        return 'badge-gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'UNPAID':
        return <Clock className="h-4 w-4" />;
      case 'QUEUED':
        return <TestTube className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lab Orders</h2>
          <p className="text-gray-600">Process laboratory tests and upload results</p>
        </div>
        <div className="text-sm text-gray-500">
          {orders.filter(order => order.status === 'QUEUED').length} pending orders
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <TestTube className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">{order.patient.name}</h3>
                  <p className="text-sm text-gray-500">ID: {order.patient.id}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`badge ${getStatusColor(order.status)} flex items-center`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{order.status}</span>
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Test Type</p>
                <p className="font-medium">{order.type.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Service Code</p>
                <p className="font-mono text-sm">{order.type.service.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium">ETB {order.type.service.price.toLocaleString()}</p>
              </div>
            </div>

            {/* Instructions */}
            {order.instructions && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Instructions</p>
                <p className="text-sm">{order.instructions}</p>
              </div>
            )}

            {/* Result */}
            {order.result && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500">Result</p>
                <p className="text-sm">{order.result}</p>
                {order.additionalNotes && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Additional Notes</p>
                    <p className="text-sm">{order.additionalNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {order.status === 'QUEUED' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowResultForm(true);
                  }}
                  className="btn btn-primary btn-sm flex items-center"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Fill Result
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Result Form Modal */}
      {showResultForm && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Fill Lab Result - {selectedOrder.patient.name}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Test:</strong> {selectedOrder.type.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Patient:</strong> {selectedOrder.patient.name} ({selectedOrder.patient.id})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Instructions:</strong> {selectedOrder.instructions || 'None'}
                </p>
              </div>

              <form onSubmit={handleResultSubmit} className="space-y-4">
                <div>
                  <label className="label">Test Result *</label>
                  <textarea
                    className="input"
                    rows="6"
                    placeholder="Enter detailed test results..."
                    value={resultData.result}
                    onChange={(e) => setResultData({...resultData, result: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="label">Additional Notes</label>
                  <textarea
                    className="input"
                    rows="3"
                    placeholder="Any additional observations or notes..."
                    value={resultData.additionalNotes}
                    onChange={(e) => setResultData({...resultData, additionalNotes: e.target.value})}
                  />
                </div>

                <div>
                  <label className="label">Attachments (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">
                      Drag and drop files here, or click to select
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG files up to 10MB
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="btn btn-secondary btn-sm mt-2"
                    >
                      Choose Files
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResultForm(false);
                      setSelectedOrder(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Result
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabOrders;
