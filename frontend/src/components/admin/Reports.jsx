import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, Users, CreditCard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Reports = () => {
  const [reports, setReports] = useState({
    daily: null,
    weekly: null,
    revenue: null
  });
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod, dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [dailyRes, weeklyRes, revenueRes] = await Promise.all([
        api.get('/admin/reports/daily'),
        api.get('/admin/reports/weekly'),
        api.get('/admin/reports/revenue')
      ]);
      
      setReports({
        daily: dailyRes.data,
        weekly: weeklyRes.data,
        revenue: revenueRes.data
      });
    } catch (error) {
      toast.error('Failed to fetch reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  const getRevenueChartData = () => {
    if (!reports.revenue?.revenueTrends) return [];
    
    return reports.revenue.revenueTrends.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      revenue: item.totalRevenue
    }));
  };

  const getServiceDistributionData = () => {
    if (!reports.revenue?.serviceDistribution) return [];
    
    return reports.revenue.serviceDistribution.map((item, index) => ({
      name: item.serviceName,
      value: item.totalRevenue,
      color: COLORS[index % COLORS.length]
    }));
  };

  const getDailyStats = () => {
    if (!reports.daily) return null;
    
    return [
      {
        title: 'Total Revenue',
        value: formatCurrency(reports.daily.totalRevenue || 0),
        icon: CreditCard,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        title: 'Patients Served',
        value: reports.daily.patientsServed || 0,
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Completed Visits',
        value: reports.daily.completedVisits || 0,
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      {
        title: 'Pending Orders',
        value: reports.daily.pendingOrders ? 
          Object.values(reports.daily.pendingOrders).reduce((sum, count) => sum + count, 0) : 0,
        icon: Calendar,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
      }
    ];
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
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">System performance and financial reports</p>
        </div>
        <div className="flex space-x-3">
          <select
            className="input"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="daily">Daily Report</option>
            <option value="weekly">Weekly Report</option>
            <option value="revenue">Revenue Report</option>
          </select>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary flex items-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Daily Stats */}
      {selectedPeriod === 'daily' && reports.daily && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getDailyStats().map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Chart */}
      {selectedPeriod === 'revenue' && reports.revenue && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getRevenueChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Service Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getServiceDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getServiceDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Report */}
      {selectedPeriod === 'weekly' && reports.weekly && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">
                {formatCurrency(reports.weekly.totalRevenue || 0)}
              </p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {reports.weekly.patientsServed || 0}
              </p>
              <p className="text-sm text-gray-500">Patients Served</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {reports.weekly.completedVisits || 0}
              </p>
              <p className="text-sm text-gray-500">Completed Visits</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Tables */}
      {reports.revenue && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Services by Revenue</h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Revenue</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.revenue.serviceDistribution?.map((service, index) => (
                    <tr key={index}>
                      <td className="font-medium">{service.serviceName}</td>
                      <td>{formatCurrency(service.totalRevenue)}</td>
                      <td>{service.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Count</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.revenue.paymentMethods?.map((method, index) => (
                    <tr key={index}>
                      <td className="font-medium capitalize">{method.method}</td>
                      <td>{method.count}</td>
                      <td>{formatCurrency(method.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
