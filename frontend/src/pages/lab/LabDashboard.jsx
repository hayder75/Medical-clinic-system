import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import EnhancedLabQueue from '../../components/lab/EnhancedLabQueue';
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
      description: 'All lab tests'
    },
    {
      title: 'Urgent Orders',
      value: stats.urgentOrders,
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'High priority orders'
    }
  ];

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <TestTube className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Lab Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage laboratory tests and results</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${card.color} text-white mr-4`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{card.description}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <Routes>
          <Route path="/" element={<EnhancedLabQueue />} />
          <Route path="/queue" element={<EnhancedLabQueue />} />
        </Routes>
      </div>
    </Layout>
  );
};

export default LabDashboard;