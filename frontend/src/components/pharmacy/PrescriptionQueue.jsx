import React, { useState, useEffect } from 'react';
import { Pill, Clock, CheckCircle, AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PrescriptionQueue = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDispenseForm, setShowDispenseForm] = useState(false);
  const [dispenseData, setDispenseData] = useState({
    medications: []
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pharmacies/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to fetch prescription orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/pharmacies/orders/${selectedOrder.id}/dispense`, {
        medications: dispenseData.medications
      });

      toast.success('Medications dispensed successfully!');
      setShowDispenseForm(false);
      setSelectedOrder(null);
      setDispenseData({ medications: [] });
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to dispense medications');
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
        return <Pill className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold text-gray-900">Prescription Queue</h2>
          <p className="text-gray-600">Process medication prescriptions and dispense</p>
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
                  <Pill className="h-5 w-5 text-primary-600" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Medication</p>
                <p className="font-medium">{order.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dosage</p>
                <p className="font-medium">{order.strength} - {order.dosageForm}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium">{order.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Frequency</p>
                <p className="font-medium">{order.frequency}</p>
              </div>
            </div>

            {/* Instructions */}
            {order.instructions && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Instructions</p>
                <p className="text-sm">{order.instructions}</p>
              </div>
            )}

            {/* Actions */}
            {order.status === 'QUEUED' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setDispenseData({
                      medications: [{
                        medicationOrderId: order.id,
                        status: 'DISPENSED',
                        quantity: order.quantity,
                        notes: ''
                      }]
                    });
                    setShowDispenseForm(true);
                  }}
                  className="btn btn-primary btn-sm flex items-center"
                >
                  <Package className="h-4 w-4 mr-1" />
                  Dispense
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dispense Form Modal */}
      {showDispenseForm && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Dispense Medication - {selectedOrder.patient.name}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Medication:</strong> {selectedOrder.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Dosage:</strong> {selectedOrder.strength} - {selectedOrder.dosageForm}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Quantity:</strong> {selectedOrder.quantity}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Instructions:</strong> {selectedOrder.instructions || 'None'}
                </p>
              </div>

              <form onSubmit={handleDispense} className="space-y-4">
                <div>
                  <label className="label">Dispense Status</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="dispensed"
                        name="status"
                        value="DISPENSED"
                        checked={dispenseData.medications[0]?.status === 'DISPENSED'}
                        onChange={(e) => {
                          const newMeds = [...dispenseData.medications];
                          newMeds[0].status = e.target.value;
                          setDispenseData({...dispenseData, medications: newMeds});
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="dispensed" className="text-sm font-medium text-gray-700">
                        Dispensed
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="not_available"
                        name="status"
                        value="NOT_AVAILABLE"
                        checked={dispenseData.medications[0]?.status === 'NOT_AVAILABLE'}
                        onChange={(e) => {
                          const newMeds = [...dispenseData.medications];
                          newMeds[0].status = e.target.value;
                          setDispenseData({...dispenseData, medications: newMeds});
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="not_available" className="text-sm font-medium text-gray-700">
                        Not Available
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="partial"
                        name="status"
                        value="PARTIAL_DISPENSED"
                        checked={dispenseData.medications[0]?.status === 'PARTIAL_DISPENSED'}
                        onChange={(e) => {
                          const newMeds = [...dispenseData.medications];
                          newMeds[0].status = e.target.value;
                          setDispenseData({...dispenseData, medications: newMeds});
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="partial" className="text-sm font-medium text-gray-700">
                        Partially Dispensed
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Quantity Dispensed</label>
                  <input
                    type="number"
                    className="input"
                    value={dispenseData.medications[0]?.quantity || ''}
                    onChange={(e) => {
                      const newMeds = [...dispenseData.medications];
                      newMeds[0].quantity = parseInt(e.target.value);
                      setDispenseData({...dispenseData, medications: newMeds});
                    }}
                    min="0"
                    max={selectedOrder.quantity}
                  />
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows="3"
                    placeholder="Any notes about the dispensing..."
                    value={dispenseData.medications[0]?.notes || ''}
                    onChange={(e) => {
                      const newMeds = [...dispenseData.medications];
                      newMeds[0].notes = e.target.value;
                      setDispenseData({...dispenseData, medications: newMeds});
                    }}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDispenseForm(false);
                      setSelectedOrder(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Dispense Medication
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

export default PrescriptionQueue;
