import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import LabQueue from '../../components/lab/LabQueue';
import { 
  TestTube, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';

const LabDashboard = () => {
  const [stats, setStats] = useState({
    pendingOrders: 0,
    completedToday: 0,
    totalTests: 0,
    urgentOrders: 0
  });

  useEffect(() => {
    // Simulate loading stats
    setStats({
      pendingOrders: 8,
      completedToday: 15,
      totalTests: 23,
      urgentOrders: 2
    });
  }, []);

  const statCards = [
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'Orders waiting for processing'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'Tests completed today'
    },
    {
      title: 'Total Tests',
      value: stats.totalTests,
      icon: TestTube,
      color: 'bg-blue-500',
      description: 'All tests this month'
    },
    {
      title: 'Urgent Orders',
      value: stats.urgentOrders,
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'High priority orders'
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
                <TestTube className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Process Order</p>
                  <p className="text-sm text-gray-500">Start processing lab test</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium">Upload Results</p>
                  <p className="text-sm text-gray-500">Upload test results and files</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <p className="font-medium">Urgent Orders</p>
                  <p className="text-sm text-gray-500">View high priority tests</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">CBC test completed</span>
              </div>
              <span className="text-xs text-gray-400">5 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">New blood test order</span>
              </div>
              <span className="text-xs text-gray-400">15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Urgent test requested</span>
              </div>
              <span className="text-xs text-gray-400">30 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Results uploaded</span>
              </div>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Lab Dashboard" subtitle="Laboratory test processing and results management">
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/orders" element={<LabQueue />} />
      </Routes>
    </Layout>
  );
};

export default LabDashboard;
