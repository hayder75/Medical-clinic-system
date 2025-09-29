import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import StaffManagement from '../../components/admin/StaffManagement';
import ServiceCatalog from '../../components/admin/ServiceCatalog';
import AuditLogs from '../../components/admin/AuditLogs';
import Reports from '../../components/admin/Reports';
import InsuranceManagement from '../../components/admin/InsuranceManagement';
import { 
  Users, 
  Stethoscope, 
  CreditCard, 
  TestTube, 
  Pill, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalNurses: 0,
    pendingBillings: 0,
    pendingLabOrders: 0,
    pendingRadiologyOrders: 0,
    pharmacyQueue: 0,
    todayAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading stats - in real app, fetch from API
    setTimeout(() => {
      setStats({
        totalPatients: 1247,
        totalDoctors: 12,
        totalNurses: 18,
        pendingBillings: 23,
        pendingLabOrders: 8,
        pendingRadiologyOrders: 5,
        pharmacyQueue: 15,
        todayAppointments: 34
      });
      setLoading(false);
    }, 1000);
  }, []);

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Doctors',
      value: stats.totalDoctors,
      icon: Stethoscope,
      color: 'bg-green-500',
      change: '+2',
      changeType: 'positive'
    },
    {
      title: 'Active Nurses',
      value: stats.totalNurses,
      icon: Users,
      color: 'bg-purple-500',
      change: '+1',
      changeType: 'positive'
    },
    {
      title: 'Pending Billings',
      value: stats.pendingBillings,
      icon: CreditCard,
      color: 'bg-yellow-500',
      change: '-5',
      changeType: 'negative'
    },
    {
      title: 'Lab Orders',
      value: stats.pendingLabOrders,
      icon: TestTube,
      color: 'bg-indigo-500',
      change: '+3',
      changeType: 'positive'
    },
    {
      title: 'Radiology Orders',
      value: stats.pendingRadiologyOrders,
      icon: TestTube,
      color: 'bg-pink-500',
      change: '+1',
      changeType: 'positive'
    },
    {
      title: 'Pharmacy Queue',
      value: stats.pharmacyQueue,
      icon: Pill,
      color: 'bg-red-500',
      change: '+7',
      changeType: 'positive'
    },
    {
      title: 'Today\'s Appointments',
      value: stats.todayAppointments,
      icon: Calendar,
      color: 'bg-teal-500',
      change: '+4',
      changeType: 'positive'
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
                <p className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} from last week
                </p>
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
                <Users className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Add New Staff Member</p>
                  <p className="text-sm text-gray-500">Create doctor, nurse, or technician account</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Stethoscope className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium">Register New Patient</p>
                  <p className="text-sm text-gray-500">Add patient to the system</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium">View Pending Billings</p>
                  <p className="text-sm text-gray-500">Review unpaid invoices</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
              <div>
                <p className="font-medium text-yellow-800">Low Inventory Alert</p>
                <p className="text-sm text-yellow-600">5 medications running low</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <p className="font-medium text-red-800">Emergency Patient</p>
                <p className="text-sm text-red-600">Patient in critical condition</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <p className="font-medium text-green-800">System Health</p>
                <p className="text-sm text-green-600">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Dr. Smith completed patient visit</span>
            </div>
            <span className="text-xs text-gray-400">2 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">New patient registered</span>
            </div>
            <span className="text-xs text-gray-400">5 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Lab result uploaded</span>
            </div>
            <span className="text-xs text-gray-400">10 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">Medication dispensed</span>
            </div>
            <span className="text-xs text-gray-400">15 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Admin Dashboard" subtitle="System overview and management">
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/staff" element={<StaffManagement />} />
        <Route path="/services" element={<ServiceCatalog />} />
        <Route path="/insurances" element={<InsuranceManagement />} />
        <Route path="/audit" element={<AuditLogs />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Layout>
  );
};

export default AdminDashboard;
