import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const LoanDisbursement = () => {
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disbursing, setDisbursing] = useState(null);

  useEffect(() => {
    fetchApprovedLoans();
    // Refresh every 30 seconds
    const interval = setInterval(fetchApprovedLoans, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchApprovedLoans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/loans/approved');
      setApprovedLoans(response.data.approvedLoans || []);
    } catch (error) {
      console.error('Error fetching approved loans:', error);
      toast.error('Failed to fetch approved loans');
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

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Loan Disbursement</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : approvedLoans.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-400 mb-4" />
            <p className="text-gray-600 text-lg">No loans awaiting disbursement</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {approvedLoans.map((loan) => (
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
    </div>
  );
};

export default LoanDisbursement;

