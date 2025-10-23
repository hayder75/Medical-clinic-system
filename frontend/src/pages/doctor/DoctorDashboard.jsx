import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import PatientQueue from '../../components/doctor/PatientQueue';
import PatientHistory from '../../components/doctor/PatientHistory';
import ComprehensivePatientHistory from '../../components/doctor/ComprehensivePatientHistory';
import ResultsQueue from '../../components/doctor/ResultsQueue';
import UnifiedQueue from '../../components/doctor/UnifiedQueue';
import MedicalCertificates from './MedicalCertificates';
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
      color: '#2e13d1',
      description: 'Patients waiting for consultation'
    },
    {
      title: 'Completed Today',
      value: stats.completedVisits,
      icon: CheckCircle,
      color: '#10B981',
      description: 'Visits completed today'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: FileText,
      color: '#F59E0B',
      description: 'Lab/radiology orders pending'
    },
    {
      title: 'Appointments',
      value: stats.todayAppointments,
      icon: Clock,
      color: '#EA2E00',
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
          <div key={index} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg shadow-sm" style={{ backgroundColor: stat.color }}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: '#2e13d1' }}>{stat.title}</p>
                <p className="text-2xl font-semibold" style={{ color: '#0C0E0B' }}>{stat.value}</p>
                <p className="text-xs" style={{ color: '#2e13d1' }}>{stat.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium mb-4" style={{ color: '#0C0E0B' }}>Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/doctor/queue')}
              className="w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md" 
              style={{ borderColor: '#2e13d1', backgroundColor: 'transparent' }} 
              onMouseEnter={(e) => e.target.style.backgroundColor = '#F8FAFC'} 
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <div className="flex items-center">
                <Stethoscope className="h-5 w-5 mr-3" style={{ color: '#2e13d1' }} />
                <div>
                  <p className="font-medium" style={{ color: '#0C0E0B' }}>Patient Queue</p>
                  <p className="text-sm" style={{ color: '#2e13d1' }}>View unified patient queue with priority</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => navigate('/doctor/history')}
              className="w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{ borderColor: '#2e13d1', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#F8FAFC'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-3" style={{ color: '#2e13d1' }} />
                <div>
                  <p className="font-medium" style={{ color: '#0C0E0B' }}>Comprehensive Patient History</p>
                  <p className="text-sm" style={{ color: '#2e13d1' }}>Complete visit details with all data</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md" style={{ borderColor: '#2e13d1', backgroundColor: 'transparent' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#F8FAFC'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3" style={{ color: '#EA2E00' }} />
                <div>
                  <p className="font-medium" style={{ color: '#0C0E0B' }}>Schedule Appointment</p>
                  <p className="text-sm" style={{ color: '#2e13d1' }}>Book follow-up appointments</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium mb-4" style={{ color: '#0C0E0B' }}>Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full mr-3" style={{ backgroundColor: '#10B981' }}></div>
                <span className="text-sm" style={{ color: '#0C0E0B' }}>Completed visit for John Doe</span>
              </div>
              <span className="text-xs" style={{ color: '#2e13d1' }}>5 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full mr-3" style={{ backgroundColor: '#2e13d1' }}></div>
                <span className="text-sm" style={{ color: '#0C0E0B' }}>Ordered lab tests for Patient #123</span>
              </div>
              <span className="text-xs" style={{ color: '#2e13d1' }}>15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full mr-3" style={{ backgroundColor: '#F59E0B' }}></div>
                <span className="text-sm" style={{ color: '#0C0E0B' }}>New patient assigned</span>
              </div>
              <span className="text-xs" style={{ color: '#2e13d1' }}>30 minutes ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full mr-3" style={{ backgroundColor: '#EA2E00' }}></div>
                <span className="text-sm" style={{ color: '#0C0E0B' }}>Emergency appointment scheduled</span>
              </div>
              <span className="text-xs" style={{ color: '#2e13d1' }}>1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <Routes>
      <Route path="/" element={<DashboardOverview />} />
      <Route path="/queue" element={<UnifiedQueue />} />
      <Route path="/legacy-queue" element={<PatientQueue />} />
      <Route path="/legacy-results" element={<ResultsQueue />} />
      <Route path="/history" element={<ComprehensivePatientHistory />} />
      <Route path="/legacy-history" element={<PatientHistory />} />
      <Route path="/medical-certificates" element={<MedicalCertificates />} />
    </Routes>
  );
};

export default DoctorDashboard;
