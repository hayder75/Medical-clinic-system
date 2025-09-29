import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import RadiologyOrders from '../../components/radiology/RadiologyOrders';
import { 
  Scan, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  FileText,
  Image
} from 'lucide-react';

const RadiologyDashboard = () => {
  const [stats, setStats] = useState({
    pendingOrders: 0,
    completedToday: 0,
    totalScans: 0,
    urgentOrders: 0
  });

  useEffect(() => {
    // Simulate loading stats
    setStats({
      pendingOrders: 5,
      completedToday: 8,
      totalScans: 13,
      urgentOrders: 1
    });
  }, []);

  const statCards = [
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'Scans waiting for processing'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'Scans completed today'
    },
    {
      title: 'Total Scans',
      value: stats.totalScans,
      icon: Scan,
      color: 'bg-blue-500',
      description: 'All scans this month'
    },
    {
      title: 'Urgent Orders',
      value: stats.urgentOrders,
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'High priority scans'
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
                <Scan className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Process Order</p>
                  <p className="text-sm text-gray-500">Start processing radiology scan</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Image className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium">Upload Images</p>
                  <p className="text-sm text-gray-500">Upload scan images and reports</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium">Write Report</p>
                  <p className="text-sm text-gray-500">Create radiology report</p>
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
                <span className="text-sm text-gray-600">Chest X-Ray completed</span>
              </div>
              <span className="text-xs text-gray-400">5 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">New CT scan order</span>
              </div>
              <span className="text-xs text-gray-400">15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">MRI scan in progress</span>
              </div>
              <span className="text-xs text-gray-400">30 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Report uploaded</span>
              </div>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Radiology Dashboard" subtitle="Radiology scan processing and image management">
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/orders" element={<RadiologyOrders />} />
      </Routes>
    </Layout>
  );
};

export default RadiologyDashboard;
