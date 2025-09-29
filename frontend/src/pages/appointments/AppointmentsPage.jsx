import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import AppointmentsCalendar from '../../components/appointments/AppointmentsCalendar';
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Plus,
  User
} from 'lucide-react';

const AppointmentsPage = () => {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    completedToday: 0,
    totalAppointments: 0,
    upcomingAppointments: 0
  });

  useEffect(() => {
    // Simulate loading stats
    setStats({
      todayAppointments: 8,
      completedToday: 5,
      totalAppointments: 34,
      upcomingAppointments: 12
    });
  }, []);

  const statCards = [
    {
      title: 'Today\'s Appointments',
      value: stats.todayAppointments,
      icon: Calendar,
      color: 'bg-blue-500',
      description: 'Scheduled for today'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'Appointments completed'
    },
    {
      title: 'Total Appointments',
      value: stats.totalAppointments,
      icon: Clock,
      color: 'bg-purple-500',
      description: 'All appointments this month'
    },
    {
      title: 'Upcoming',
      value: stats.upcomingAppointments,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      description: 'Scheduled for future'
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
                <Plus className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Schedule Appointment</p>
                  <p className="text-sm text-gray-500">Book new patient appointment</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <p className="font-medium">View Calendar</p>
                  <p className="text-sm text-gray-500">See all scheduled appointments</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <User className="h-5 w-5 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium">Patient Appointments</p>
                  <p className="text-sm text-gray-500">View patient appointment history</p>
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
                <span className="text-sm text-gray-600">Appointment completed - John Doe</span>
              </div>
              <span className="text-xs text-gray-400">5 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">New appointment scheduled</span>
              </div>
              <span className="text-xs text-gray-400">15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Appointment rescheduled</span>
              </div>
              <span className="text-xs text-gray-400">30 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Follow-up appointment created</span>
              </div>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Appointments" subtitle="Schedule and manage patient appointments">
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/calendar" element={<AppointmentsCalendar />} />
      </Routes>
    </Layout>
  );
};

export default AppointmentsPage;
