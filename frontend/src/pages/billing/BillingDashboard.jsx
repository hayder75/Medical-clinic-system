import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import BillingQueue from '../../components/billing/BillingQueue';
import { 
  CreditCard, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const BillingDashboard = () => {
  const [stats, setStats] = useState({
    pendingBillings: 0,
    totalRevenue: 0,
    paidToday: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    // Simulate loading stats
    setStats({
      pendingBillings: 23,
      totalRevenue: 45600,
      paidToday: 12400,
      pendingAmount: 8900
    });
  }, []);

  const statCards = [
    {
      title: 'Pending Billings',
      value: stats.pendingBillings,
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'Unpaid invoices'
    },
    {
      title: 'Total Revenue',
      value: `ETB ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      description: 'This month'
    },
    {
      title: 'Paid Today',
      value: `ETB ${stats.paidToday.toLocaleString()}`,
      icon: CheckCircle,
      color: 'bg-blue-500',
      description: 'Today\'s collections'
    },
    {
      title: 'Pending Amount',
      value: `ETB ${stats.pendingAmount.toLocaleString()}`,
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'Outstanding amount'
    }
  ];

  const DashboardOverview = () => (
    <div className="space-y-6">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Process Payment</p>
                  <p className="text-sm text-gray-500">Accept cash or card payment</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium">Register Patient</p>
                  <p className="text-sm text-gray-500">Add new patient to system</p>
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Payment received - ETB 500</span>
              </div>
              <span className="text-xs text-gray-400">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">New billing created - ETB 1,200</span>
              </div>
              <span className="text-xs text-gray-400">15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Payment pending - ETB 800</span>
              </div>
              <span className="text-xs text-gray-400">30 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Insurance claim processed</span>
              </div>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Billing Dashboard" subtitle="Payment processing and financial management">
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/queue" element={<BillingQueue />} />
      </Routes>
    </Layout>
  );
};

export default BillingDashboard;
