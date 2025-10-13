import React, { useState, useEffect } from 'react';
import { CreditCard, User, Clock, CheckCircle, AlertTriangle, DollarSign, Search, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BillingQueue = () => {
  const [billings, setBillings] = useState([]);
  const [filteredBillings, setFilteredBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [insurances, setInsurances] = useState([]);
  
  // Clean payment form state
  const [paymentForm, setPaymentForm] = useState({
    type: 'CASH',
    amount: '',
    bankName: '',
    transNumber: '',
    insuranceId: '',
    notes: ''
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchBillings();
    fetchInsurances();
  }, []);

  useEffect(() => {
    filterBillings();
  }, [billings, searchTerm, statusFilter]);

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/billing');
      setBillings(response.data.billings || []);
    } catch (error) {
      toast.error('Failed to fetch billings');
      console.error('Error fetching billings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsurances = async () => {
    try {
      const response = await api.get('/billing/insurances');
      setInsurances(response.data.insurances || []);
    } catch (error) {
      console.error('Error fetching insurances:', error);
    }
  };

  const filterBillings = () => {
    let filtered = billings;

    if (searchTerm) {
      filtered = filtered.filter(billing => 
        billing.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        billing.patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        billing.patient.mobile?.includes(searchTerm) ||
        billing.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(billing => billing.status === statusFilter);
    }

    setFilteredBillings(filtered);
  };

  // Clean validation function
  const validatePaymentForm = () => {
    const errors = {};
    
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (paymentForm.type === 'INSURANCE' && !paymentForm.insuranceId) {
      errors.insuranceId = 'Please select an insurance provider';
    }
    
    if (paymentForm.type === 'BANK') {
      if (!paymentForm.bankName.trim()) {
        errors.bankName = 'Bank name is required for bank transfers';
      }
      if (!paymentForm.transNumber.trim()) {
        errors.transNumber = 'Transaction number is required for bank transfers';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    
    // Validate form
    if (!validatePaymentForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    try {
      // Prepare payment data - ensure all fields are properly formatted
      const paymentData = {
        billingId: selectedBilling.id,
        amount: Number(paymentForm.amount),
        type: paymentForm.type,
        bankName: paymentForm.bankName || null,
        transNumber: paymentForm.transNumber || null,
        insuranceId: paymentForm.insuranceId || null,
        notes: paymentForm.notes || null
      };
      
      await api.post('/billing/payments', paymentData);

      toast.success('Payment processed successfully!');
      setShowPaymentForm(false);
      setSelectedBilling(null);
      resetPaymentForm();
      fetchBillings();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Payment failed');
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      type: 'CASH',
      amount: '',
      bankName: '',
      transNumber: '',
      insuranceId: '',
      notes: ''
    });
    setFormErrors({});
  };

  const openPaymentForm = (billing) => {
    setSelectedBilling(billing);
    setPaymentForm({
      type: 'CASH',
      amount: billing.totalAmount.toString(),
      bankName: '',
      transNumber: '',
      insuranceId: '',
      notes: ''
    });
    setFormErrors({});
    setShowPaymentForm(true);
  };

  const deleteVisit = async (billing) => {
    if (!billing.visitId) {
      toast.error('No visit found for this billing');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete this visit?\n\n` +
      `Patient: ${billing.patient.name}\n` +
      `Visit ID: ${billing.visitId}\n\n` +
      `This will permanently delete the visit and all associated data. ` +
      `You can then create a new visit for this patient.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await api.delete(`/billing/visit/${billing.visitId}`);
      
      toast.success('Visit deleted successfully. You can now create a new visit for this patient.');
      fetchBillings(); // Refresh the list
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete visit');
      console.error('Delete visit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'PAID':
        return 'badge-success';
      case 'PENDING_INSURANCE':
        return 'badge-info';
      case 'EMERGENCY_PENDING':
        return 'badge-danger';
      default:
        return 'badge-gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'PAID':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING_INSURANCE':
        return <AlertTriangle className="h-4 w-4" />;
      case 'EMERGENCY_PENDING':
        return <AlertTriangle className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold text-gray-900">Billing Queue</h2>
          <p className="text-gray-600">Process payments and manage billing</p>
        </div>
        <div className="text-sm text-gray-500">
          {billings.filter(b => b.status === 'PENDING').length} pending payments
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name, ID, or phone number..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="PENDING_INSURANCE">Pending Insurance</option>
              <option value="EMERGENCY_PENDING">Emergency Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Billings List */}
      <div className="space-y-4">
        {filteredBillings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No billings found matching your criteria</p>
          </div>
        ) : (
          filteredBillings.map((billing) => (
            <div key={billing.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">{billing.patient.name}</h3>
                    <p className="text-sm text-gray-500">ID: {billing.patient.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${getStatusColor(billing.status)} flex items-center`}>
                    {getStatusIcon(billing.status)}
                    <span className="ml-1">{billing.status.replace(/_/g, ' ')}</span>
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(billing.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Billing Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Billing ID</p>
                  <p className="font-mono text-sm">{billing.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ETB {billing.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Services</p>
                  <p className="text-sm text-gray-900">
                    {billing.services?.length || 0} service(s)
                  </p>
                </div>
              </div>

              {/* Services List */}
              {billing.services && billing.services.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Services</h4>
                  <div className="space-y-1">
                    {billing.services.map((service, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{service.service?.name || 'Service'}</span>
                        <span className="font-medium">ETB {service.unitPrice?.toLocaleString() || '0'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {billing.status === 'PENDING' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => openPaymentForm(billing)}
                    className="btn btn-primary btn-sm flex items-center"
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Process Payment
                  </button>
                  <button
                    onClick={() => deleteVisit(billing)}
                    className="btn btn-outline btn-sm flex items-center text-red-600 hover:bg-red-50 hover:border-red-300"
                    title="Delete visit to allow recreation"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Visit
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedBilling && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Process Payment - {selectedBilling.patient.name}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Billing ID:</strong> {selectedBilling.id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Amount:</strong> ETB {selectedBilling.totalAmount.toLocaleString()}
                </p>
              </div>

              <form onSubmit={handlePayment} className="space-y-4">
                {/* Payment Method */}
                <div>
                  <label className="label">Payment Method *</label>
                  <select
                    className="input"
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value})}
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="INSURANCE">Insurance</option>
                    <option value="CHARITY">Charity</option>
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="label">Amount (ETB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`input ${formErrors.amount ? 'border-red-500' : ''}`}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    required
                  />
                  {formErrors.amount && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.amount}</p>
                  )}
                </div>

                {/* Bank Transfer Fields */}
                {paymentForm.type === 'BANK' && (
                  <>
                    <div>
                      <label className="label">Bank Name *</label>
                      <input
                        type="text"
                        className={`input ${formErrors.bankName ? 'border-red-500' : ''}`}
                        value={paymentForm.bankName}
                        onChange={(e) => setPaymentForm({...paymentForm, bankName: e.target.value})}
                        placeholder="Enter bank name"
                      />
                      {formErrors.bankName && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.bankName}</p>
                      )}
                    </div>
                    <div>
                      <label className="label">Transaction Number *</label>
                      <input
                        type="text"
                        className={`input ${formErrors.transNumber ? 'border-red-500' : ''}`}
                        value={paymentForm.transNumber}
                        onChange={(e) => setPaymentForm({...paymentForm, transNumber: e.target.value})}
                        placeholder="Enter transaction number"
                      />
                      {formErrors.transNumber && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.transNumber}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Insurance Selection */}
                {paymentForm.type === 'INSURANCE' && (
                  <div>
                    <label className="label">Insurance Provider *</label>
                    <select
                      className={`input ${formErrors.insuranceId ? 'border-red-500' : ''}`}
                      value={paymentForm.insuranceId}
                      onChange={(e) => setPaymentForm({...paymentForm, insuranceId: e.target.value})}
                      required
                    >
                      <option value="">Select Insurance Provider</option>
                      {insurances.map((insurance) => (
                        <option key={insurance.id} value={insurance.id}>
                          {insurance.name} ({insurance.code})
                        </option>
                      ))}
                    </select>
                    {formErrors.insuranceId && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.insuranceId}</p>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    placeholder="Optional notes about the payment"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setSelectedBilling(null);
                      resetPaymentForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    Process Payment
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

export default BillingQueue;