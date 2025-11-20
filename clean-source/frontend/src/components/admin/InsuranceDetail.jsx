import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  DollarSign,
  User,
  Calendar,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const InsuranceDetail = () => {
  const { insuranceId } = useParams();
  const navigate = useNavigate();
  const [insurance, setInsurance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totals, setTotals] = useState({});

  useEffect(() => {
    if (insuranceId) {
      fetchInsuranceDetails();
      fetchTransactions();
    }
  }, [insuranceId, statusFilter, currentPage]);

  const fetchInsuranceDetails = async () => {
    try {
      // Try to get detailed data first
      try {
        const response = await api.get(`/insurance/companies/${insuranceId}/transactions?page=1&limit=1`);
        setInsurance(response.data.insurance);
        setTotals(response.data.totals);
      } catch (detailedError) {
        console.log('Detailed API not available, using basic insurance data');
        // Fallback to basic insurance data
        const basicResponse = await api.get('/admin/insurances');
        const basicInsurance = basicResponse.data.insurances.find(i => i.id === insuranceId);
        if (basicInsurance) {
          setInsurance(basicInsurance);
          setTotals({
            totalAmount: 0,
            pendingAmount: 0,
            collectedAmount: 0,
            totalTransactions: 0
          });
        }
      }
    } catch (error) {
      toast.error('Failed to fetch insurance details');
      console.error('Error fetching insurance details:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      try {
        const response = await api.get(`/insurance/companies/${insuranceId}/transactions?status=${statusFilter}&page=${currentPage}&limit=20`);
        setTransactions(response.data.transactions);
        setTotalPages(response.data.pagination.totalPages);
      } catch (detailedError) {
        console.log('Detailed transactions API not available');
        // Show empty transactions for now
        setTransactions([]);
        setTotalPages(1);
      }
    } catch (error) {
      toast.error('Failed to fetch transactions');
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (transactionId, newStatus, claimNumber = null, transactionNumber = null) => {
    try {
      await api.put(`/insurance/transactions/${transactionId}/status`, {
        status: newStatus,
        claimNumber,
        transactionNumber
      });
      toast.success('Transaction status updated successfully');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to update transaction status');
      console.error('Error updating transaction status:', error);
    }
  };

  const generateReport = async () => {
    try {
      const response = await api.get(`/insurance/companies/${insuranceId}/report`);
      const report = response.data.report;
      
      // Create a simple text report
      let reportText = `Insurance Report for ${report.insurance.name}\n`;
      reportText += `Report Period: ${report.reportPeriod.startDate} to ${report.reportPeriod.endDate}\n`;
      reportText += `Generated: ${new Date(report.reportPeriod.generatedAt).toLocaleString()}\n\n`;
      reportText += `Summary:\n`;
      reportText += `Total Transactions: ${report.summary.totalTransactions}\n`;
      reportText += `Total Amount: ETB ${report.summary.totalAmount}\n\n`;
      reportText += `Transactions:\n`;
      
      report.transactions.forEach((transaction, index) => {
        reportText += `${index + 1}. Patient: ${transaction.patientName} (${transaction.patientId})\n`;
        reportText += `   Service: ${transaction.serviceName} (${transaction.serviceCode})\n`;
        reportText += `   Amount: ETB ${transaction.totalAmount}\n`;
        reportText += `   Status: ${transaction.status}\n`;
        reportText += `   Date: ${new Date(transaction.serviceDate).toLocaleDateString()}\n\n`;
      });

      // Create and download file
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.insurance.name}_Report_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Error generating report:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'SUBMITTED': return 'text-blue-600 bg-blue-100';
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'COLLECTED': return 'text-green-700 bg-green-200';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'SUBMITTED': return <FileText className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'COLLECTED': return <DollarSign className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading && !insurance) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!insurance) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Insurance company not found</p>
        <button onClick={() => navigate('/admin/insurances')} className="btn btn-primary mt-4">
          Back to Insurance Management
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/insurances')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{insurance.name}</h2>
            <p className="text-gray-600">Code: {insurance.code}</p>
          </div>
        </div>
        <button
          onClick={generateReport}
          className="btn btn-primary flex items-center"
        >
          <Download className="h-5 w-5 mr-2" />
          Generate Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">ETB {totals.totalAmount || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">ETB {totals.pendingAmount || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Collected</p>
              <p className="text-2xl font-bold text-gray-900">ETB {totals.collectedAmount || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{totals.totalTransactions || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Filter by status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="COLLECTED">Collected</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.patient.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.patient.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.serviceName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.serviceCode} • {transaction.serviceType}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ETB {transaction.totalAmount}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.quantity}x ETB {transaction.unitPrice}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      <span className="ml-1">{transaction.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.serviceDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {transaction.status === 'PENDING' && (
                        <button
                          onClick={() => updateTransactionStatus(transaction.id, 'SUBMITTED')}
                          className="text-blue-600 hover:text-blue-800"
                          title="Mark as Submitted"
                        >
                          Submit
                        </button>
                      )}
                      {transaction.status === 'SUBMITTED' && (
                        <button
                          onClick={() => updateTransactionStatus(transaction.id, 'APPROVED')}
                          className="text-green-600 hover:text-green-800"
                          title="Mark as Approved"
                        >
                          Approve
                        </button>
                      )}
                      {transaction.status === 'APPROVED' && (
                        <button
                          onClick={() => updateTransactionStatus(transaction.id, 'COLLECTED')}
                          className="text-green-700 hover:text-green-900"
                          title="Mark as Collected"
                        >
                          Collect
                        </button>
                      )}
                      {transaction.status !== 'COLLECTED' && transaction.status !== 'REJECTED' && (
                        <button
                          onClick={() => updateTransactionStatus(transaction.id, 'REJECTED')}
                          className="text-red-600 hover:text-red-800"
                          title="Mark as Rejected"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn btn-outline btn-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {transactions.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No transactions found</p>
        </div>
      )}
    </div>
  );
};

export default InsuranceDetail;
