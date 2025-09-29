import React, { useState, useEffect } from 'react';
import { Pill, CreditCard, Clock, CheckCircle, AlertTriangle, User } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PharmacyInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDispenseForm, setShowDispenseForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    type: 'CASH',
    amount: '',
    bankName: '',
    transNumber: '',
    notes: ''
  });
  const [dispenseData, setDispenseData] = useState({
    medications: []
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pharmacy-billing/invoices');
      setInvoices(response.data);
    } catch (error) {
      toast.error('Failed to fetch pharmacy invoices');
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pharmacy-billing/payments', {
        invoiceId: selectedInvoice.id,
        amount: parseFloat(paymentData.amount),
        type: paymentData.type,
        bankName: paymentData.bankName || null,
        transNumber: paymentData.transNumber || null,
        notes: paymentData.notes || null
      });

      toast.success('Payment processed successfully!');
      setShowPaymentForm(false);
      setSelectedInvoice(null);
      setPaymentData({
        type: 'CASH',
        amount: '',
        bankName: '',
        transNumber: '',
        notes: ''
      });
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment failed');
    }
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/pharmacy-billing/dispense', {
        invoiceId: selectedInvoice.id,
        medications: dispenseData.medications
      });

      toast.success('Medications dispensed successfully!');
      setShowDispenseForm(false);
      setSelectedInvoice(null);
      setDispenseData({ medications: [] });
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Dispensing failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'UNPAID':
        return 'badge-warning';
      case 'PAID':
        return 'badge-success';
      case 'DISPENSED':
        return 'badge-info';
      default:
        return 'badge-gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'UNPAID':
        return <Clock className="h-4 w-4" />;
      case 'PAID':
        return <CheckCircle className="h-4 w-4" />;
      case 'DISPENSED':
        return <Pill className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold text-gray-900">Pharmacy Invoices</h2>
          <p className="text-gray-600">Process pharmacy payments and dispense medications</p>
        </div>
        <div className="text-sm text-gray-500">
          {invoices.filter(inv => inv.status === 'UNPAID').length} pending invoices
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-gray-900">{invoice.patient.name}</h3>
                  <p className="text-sm text-gray-500">ID: {invoice.patient.id}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`badge ${getStatusColor(invoice.status)} flex items-center`}>
                  {getStatusIcon(invoice.status)}
                  <span className="ml-1">{invoice.status}</span>
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(invoice.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Invoice ID</p>
                <p className="font-mono text-sm">{invoice.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  ETB {invoice.total.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Medications</p>
                <p className="text-sm text-gray-900">
                  {invoice.medications?.length || 0} medication(s)
                </p>
              </div>
            </div>

            {/* Medications List */}
            {invoice.medications && invoice.medications.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Medications</h4>
                <div className="space-y-1">
                  {invoice.medications.map((med, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {med.name} - {med.strength} ({med.dosageForm})
                      </span>
                      <span className="font-medium">Qty: {med.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              {invoice.status === 'UNPAID' && (
                <button
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setPaymentData({
                      ...paymentData,
                      amount: invoice.total.toString()
                    });
                    setShowPaymentForm(true);
                  }}
                  className="btn btn-primary btn-sm flex items-center"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Process Payment
                </button>
              )}
              
              {invoice.status === 'PAID' && (
                <button
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setDispenseData({
                      medications: invoice.medications?.map(med => ({
                        medicationOrderId: med.id,
                        status: 'DISPENSED',
                        quantity: med.quantity,
                        notes: ''
                      })) || []
                    });
                    setShowDispenseForm(true);
                  }}
                  className="btn btn-success btn-sm flex items-center"
                >
                  <Pill className="h-4 w-4 mr-1" />
                  Dispense Medications
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Process Payment - {selectedInvoice.patient.name}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Invoice ID:</strong> {selectedInvoice.id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Amount:</strong> ETB {selectedInvoice.total.toLocaleString()}
                </p>
              </div>

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="label">Payment Method *</label>
                  <select
                    className="input"
                    value={paymentData.type}
                    onChange={(e) => setPaymentData({...paymentData, type: e.target.value})}
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>

                <div>
                  <label className="label">Amount (ETB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                    required
                  />
                </div>

                {paymentData.type === 'BANK' && (
                  <>
                    <div>
                      <label className="label">Bank Name</label>
                      <input
                        type="text"
                        className="input"
                        value={paymentData.bankName}
                        onChange={(e) => setPaymentData({...paymentData, bankName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="label">Transaction Number</label>
                      <input
                        type="text"
                        className="input"
                        value={paymentData.transNumber}
                        onChange={(e) => setPaymentData({...paymentData, transNumber: e.target.value})}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setSelectedInvoice(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Process Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dispense Form Modal */}
      {showDispenseForm && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Dispense Medications - {selectedInvoice.patient.name}
              </h3>
              
              <form onSubmit={handleDispense} className="space-y-4">
                <div>
                  <label className="label">Medications to Dispense</label>
                  <div className="space-y-2">
                    {dispenseData.medications.map((med, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={med.status === 'DISPENSED'}
                          onChange={(e) => {
                            const newMeds = [...dispenseData.medications];
                            newMeds[index].status = e.target.checked ? 'DISPENSED' : 'NOT_AVAILABLE';
                            setDispenseData({...dispenseData, medications: newMeds});
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm">
                          {selectedInvoice.medications[index]?.name} - {selectedInvoice.medications[index]?.strength}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDispenseForm(false);
                      setSelectedInvoice(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Dispense Medications
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

export default PharmacyInvoices;
