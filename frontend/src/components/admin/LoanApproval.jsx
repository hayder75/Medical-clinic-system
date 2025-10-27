import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Clock, CheckCircle, XCircle, AlertCircle, DollarSign } from 'lucide-react';

const LoanApproval = () => {
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingLoans();
  }, []);

  const fetchPendingLoans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/loans/pending');
      setPendingLoans(response.data.pendingLoans || []);
    } catch (error) {
      console.error('Error fetching pending loans:', error);
      toast.error('Failed to fetch pending loans');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loanId, requestedAmount) => {
    setActionLoading(loanId);
    
    // Prompt for approval amount
    const approvedAmount = prompt(
      `Approve amount (Requested: ETB ${requestedAmount.toLocaleString()}). Enter amount or press OK to approve requested amount:`,
      requestedAmount
    );

    if (approvedAmount === null) {
      setActionLoading(null);
      return;
    }

    const amount = parseFloat(approvedAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount');
      setActionLoading(null);
      return;
    }

    const notes = prompt('Add notes (optional):', '');

    try {
      await api.post(`/loans/review/${loanId}`, {
        action: 'approve',
        approvedAmount: amount,
        notes: notes || null
      });
      toast.success('Loan approved successfully');
      fetchPendingLoans();
    } catch (error) {
      console.error('Error approving loan:', error);
      toast.error(error.response?.data?.error || 'Failed to approve loan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (loanId) => {
    const notes = prompt('Reason for denial (optional):', '');

    try {
      setActionLoading(loanId);
      await api.post(`/loans/review/${loanId}`, {
        action: 'deny',
        notes: notes || null
      });
      toast.success('Loan denied');
      fetchPendingLoans();
    } catch (error) {
      console.error('Error denying loan:', error);
      toast.error(error.response?.data?.error || 'Failed to deny loan');
    } finally {
      setActionLoading(null);
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

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Loan Approval</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : pendingLoans.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No pending loan requests</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingLoans.map((loan) => (
              <div key={loan.id} className="bg-white rounded-lg shadow-md p-6">
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
                        <p className="text-sm text-gray-500">Requested On</p>
                        <p className="text-sm text-gray-900">{formatDate(loan.requestedAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact</p>
                        <p className="text-sm text-gray-900">{loan.staff.email}</p>
                        {loan.staff.phone && (
                          <p className="text-sm text-gray-500">{loan.staff.phone}</p>
                        )}
                      </div>
                    </div>
                    {loan.reason && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Reason</p>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{loan.reason}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(loan.id, loan.requestedAmount)}
                      disabled={actionLoading === loan.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleDeny(loan.id)}
                      disabled={actionLoading === loan.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanApproval;
