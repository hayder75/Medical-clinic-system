import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Loans = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('request');
  
  // Request form state
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  
  // My loans state
  const [myLoans, setMyLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(true);
  
  // Approved loans (for billing officer)
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [disbursing, setDisbursing] = useState(null);

  useEffect(() => {
    fetchMyLoans();
    if (user?.role === 'BILLING_OFFICER') {
      fetchApprovedLoans();
    }
  }, [user]);

  const fetchMyLoans = async () => {
    try {
      setLoadingLoans(true);
      const response = await api.get('/loans/my-requests');
      setMyLoans(response.data.loans || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error('Failed to fetch loan requests');
    } finally {
      setLoadingLoans(false);
    }
  };

  const fetchApprovedLoans = async () => {
    try {
      setLoadingApproved(true);
      const response = await api.get('/loans/approved');
      setApprovedLoans(response.data.approvedLoans || []);
    } catch (error) {
      console.error('Error fetching approved loans:', error);
      toast.error('Failed to fetch approved loans');
    } finally {
      setLoadingApproved(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      await api.post('/loans/request', {
        amount: parseFloat(amount),
        reason: reason || null
      });
      toast.success('Loan request submitted successfully');
      setAmount('');
      setReason('');
      fetchMyLoans();
    } catch (error) {
      console.error('Error requesting loan:', error);
      toast.error(error.response?.data?.error || 'Failed to submit loan request');
    } finally {
      setLoading(false);
    }
  };

  const handleDisburse = async (loanId, staffName, amount) => {
    if (!confirm(`Confirm disbursement of ${amount.toLocaleString()} ETB to ${staffName}?`)) {
      return;
    }

    try {
      setDisbursing(loanId);
      await api.post(`/loans/disburse/${loanId}`);
      toast.success('Loan disbursed successfully');
      fetchApprovedLoans();
      fetchMyLoans(); // Refresh my loans in case the billing officer also has requests
    } catch (error) {
      console.error('Error disbursing loan:', error);
      toast.error(error.response?.data?.error || 'Failed to disburse loan');
    } finally {
      setDisbursing(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      APPROVED: { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Approved' },
      DENIED: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Denied' },
      GIVEN: { icon: DollarSign, color: 'bg-green-100 text-green-800', label: 'Disbursed' },
      REPAID: { icon: CheckCircle, color: 'bg-purple-100 text-purple-800', label: 'Repaid' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const isBillingOfficer = user?.role === 'BILLING_OFFICER';

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Loans Management</h1>

        {/* Tabs */}
        <div className="flex gap-2 border-b mb-6">
          <button
            onClick={() => setActiveTab('request')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'request'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            Request Loan
          </button>
          {isBillingOfficer && (
            <button
              onClick={() => setActiveTab('disbursement')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'disbursement'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign className="inline h-4 w-4 mr-2" />
              Disbursement
            </button>
          )}
        </div>

        {/* Request Loan Tab */}
        {activeTab === 'request' && (
          <div className="space-y-6">
            {/* Request Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Loan Request</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (ETB) *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter amount"
                    required
                    min="1"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Provide a reason for the loan request"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </div>

            {/* My Loans */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Loan Requests</h2>
              {loadingLoans ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : myLoans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No loan requests yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {myLoans.map((loan) => (
                        <tr key={loan.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(loan.requestedAmount)}
                              </div>
                              {loan.approvedAmount && loan.approvedAmount !== loan.requestedAmount && (
                                <div className="text-sm text-blue-600">
                                  Approved: {formatCurrency(loan.approvedAmount)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(loan.requestedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(loan.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disbursement Tab */}
        {activeTab === 'disbursement' && isBillingOfficer && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {loadingApproved ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : approvedLoans.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 mx-auto text-green-400 mb-4" />
                <p className="text-gray-600 text-lg">No loans awaiting disbursement</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {approvedLoans.map((loan) => (
                  <div key={loan.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{loan.staff.fullname}</h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                            {loan.staff.role}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Requested Amount</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(loan.requestedAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Approved Amount</p>
                            <p className="text-lg font-semibold text-green-600">{formatCurrency(loan.approvedAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Approved On</p>
                            <p className="text-sm text-gray-900">{formatDate(loan.approvedAt)}</p>
                            <p className="text-xs text-gray-500">By {loan.reviewedBy?.fullname}</p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDisburse(loan.id, loan.staff.fullname, loan.approvedAmount)}
                        disabled={disbursing === loan.id}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
                      >
                        <DollarSign className="h-5 w-5" />
                        {disbursing === loan.id ? 'Disbursing...' : 'Disburse'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Loans;
