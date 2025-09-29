import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import PatientQueue from '../../components/doctor/PatientQueue';
import PatientHistory from '../../components/doctor/PatientHistory';
import ResultsQueue from '../../components/doctor/ResultsQueue';
import { 
  Stethoscope, 
  FileText, 
  Users,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    waitingPatients: 0,
    completedVisits: 0,
    pendingOrders: 0,
    todayAppointments: 0
  });

  useEffect(() => {
    // Simulate loading stats
    setStats({
      waitingPatients: 5,
      completedVisits: 12,
      pendingOrders: 8,
      todayAppointments: 6
    });
  }, []);

  const statCards = [
    {
      title: 'Waiting Patients',
      value: stats.waitingPatients,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Patients waiting for consultation'
    },
    {
      title: 'Completed Today',
      value: stats.completedVisits,
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'Visits completed today'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: FileText,
      color: 'bg-yellow-500',
      description: 'Lab/radiology orders pending'
    },
    {
      title: 'Appointments',
      value: stats.todayAppointments,
      icon: Clock,
      color: 'bg-purple-500',
      description: 'Scheduled appointments today'
    }
  ];

  const DashboardOverview = () => {
    const navigate = useNavigate();
    
    return (
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
                <Stethoscope className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Review Patient</p>
                  <p className="text-sm text-gray-500">Start consultation with next patient</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => navigate('/doctor/results')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium">Review Results</p>
                  <p className="text-sm text-gray-500">Review completed investigations</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium">View Patient History</p>
                  <p className="text-sm text-gray-500">Access complete patient records</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium">Schedule Appointment</p>
                  <p className="text-sm text-gray-500">Book follow-up appointments</p>
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
                <span className="text-sm text-gray-600">Completed visit for John Doe</span>
              </div>
              <span className="text-xs text-gray-400">5 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Ordered lab tests for Patient #123</span>
              </div>
              <span className="text-xs text-gray-400">15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">New patient assigned</span>
              </div>
              <span className="text-xs text-gray-400">30 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Appointment scheduled for tomorrow</span>
              </div>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <Layout title="Doctor Dashboard" subtitle="Patient consultation and medical orders">
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/queue" element={<PatientQueue />} />
        <Route path="/results" element={<ResultsQueue />} />
        <Route path="/history" element={<PatientHistory />} />
      </Routes>
    </Layout>
  );
};

export default DoctorDashboard;
