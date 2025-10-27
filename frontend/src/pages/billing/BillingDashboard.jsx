import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import BillingQueue from '../../components/billing/BillingQueue';
import PreRegistration from './PreRegistration';
import LoanDisbursement from '../../components/billing/LoanDisbursement';
import { 
  CreditCard, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  PhoneCall,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BillingDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    pendingBillings: 0,
    pendingAmount: 0,
    byType: {
      CASH: { count: 0, amount: 0 },
      BANK: { count: 0, amount: 0 },
      INSURANCE: { count: 0, amount: 0 },
      CHARITY: { count: 0, amount: 0 }
    }
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedPeriod]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/billing/dashboard-stats?period=${selectedPeriod}`);
      const data = response.data;
      
      setStats(data.stats);
      setRecentTransactions(data.recentTransactions);
      setDateRange(data.dateRange);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `ETB ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'CASH': return 'bg-green-100 text-green-700';
      case 'BANK': return 'bg-blue-100 text-blue-700';
      case 'INSURANCE': return 'bg-purple-100 text-purple-700';
      case 'CHARITY': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentTypeIcon = (type) => {
    switch (type) {
      case 'CASH': return '💰';
      case 'BANK': return '🏦';
      case 'INSURANCE': return '🛡️';
      case 'CHARITY': return '❤️';
      default: return '💳';
    }
  };

  const periodOptions = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'yearly', label: 'This Year' }
  ];

  const statCards = [
    {
      title: 'Total Collected',
      value: formatCurrency(stats.totalAmount),
      icon: DollarSign,
      color: 'bg-green-500',
      description: `${stats.totalCount} payments ${selectedPeriod === 'daily' ? 'today' : `this ${selectedPeriod.slice(0, -2)}`}`
    },
    {
      title: 'Pending Billings',
      value: stats.pendingBillings,
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'Unpaid invoices'
    },
    {
      title: 'Pending Amount',
      value: formatCurrency(stats.pendingAmount),
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'Outstanding amount'
    },
    {
      title: 'Cash Payments',
      value: formatCurrency(stats.byType.CASH.amount),
      icon: CheckCircle,
      color: 'bg-blue-500',
      description: `${stats.byType.CASH.count} transactions`
    }
  ];

  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Billing Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {dateRange.start && dateRange.end && (
                `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`
              )}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={fetchDashboardStats}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            Payment Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byType).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getPaymentTypeIcon(type)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{type}</p>
                    <p className="text-sm text-gray-500">{data.count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(data.amount)}</p>
                  <p className="text-xs text-gray-500">
                    {stats.totalAmount > 0 ? `${((data.amount / stats.totalAmount) * 100).toFixed(1)}%` : '0%'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-green-500" />
            Recent Transactions
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{getPaymentTypeIcon(transaction.type)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.patientName}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.type}
                        {transaction.bankName && ` • ${transaction.bankName}`}
                        {transaction.insuranceName && ` • ${transaction.insuranceName}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(transaction.amount)}</p>
                    <p className="text-xs text-gray-400">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No transactions found</p>
                <p className="text-xs">Payments will appear here as they are processed</p>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/billing/queue')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Process Payment</p>
                  <p className="text-sm text-gray-500">Accept cash or card payment</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => navigate('/patient-registration')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium">Register Patient</p>
                  <p className="text-sm text-gray-500">Add new patient to system</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => navigate('/billing/pre-registration')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <PhoneCall className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Pre-Registration</p>
                  <p className="text-sm text-gray-500">Manage call-ahead queue</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium">View Reports</p>
                  <p className="text-sm text-gray-500">Financial reports and analytics</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/billing/queue')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Process Payments</p>
                  <p className="text-sm text-gray-500">Handle pending billings</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => navigate('/billing/pre-registration')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <PhoneCall className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium">Pre-Registration</p>
                  <p className="text-sm text-gray-500">Virtual patient queue</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => navigate('/patient/register')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium">Register Patient</p>
                  <p className="text-sm text-gray-500">New patient registration</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => navigate('/doctor-queue')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-orange-500 mr-3" />
                <div>
                  <p className="font-medium">Doctor Queue Management</p>
                  <p className="text-sm text-gray-500">Monitor doctor workload</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Payment System</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Database</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Last Backup</span>
              </div>
              <span className="text-xs text-gray-400">Today 2:00 AM</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Insurance Integration</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<DashboardOverview />} />
      <Route path="/queue" element={<BillingQueue />} />
      <Route path="/pre-registration" element={<PreRegistration />} />
      <Route path="/loan-disbursement" element={<LoanDisbursement />} />
    </Routes>
  );
};

export default BillingDashboard;
