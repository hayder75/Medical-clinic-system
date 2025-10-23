import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/common/Layout';

// Import pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import PatientRegistration from './pages/patient/PatientRegistration';
import NurseDashboard from './pages/nurse/NurseDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientConsultationPage from './pages/doctor/PatientConsultationPage';
import BillingDashboard from './pages/billing/BillingDashboard';
import PharmacyBillingDashboard from './pages/billing/PharmacyBillingDashboard';
import EmergencyBilling from './pages/billing/EmergencyBilling';
import DailyCashManagement from './pages/billing/DailyCashManagement';
import DoctorQueueManagement from './pages/billing/DoctorQueueManagement';
import RadiologyDashboard from './pages/radiology/RadiologyDashboard';
import LabDashboard from './pages/lab/LabDashboard';
import LabOrders from './pages/lab/LabOrders';
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import ReceptionPatientRegistration from './pages/reception/ReceptionPatientRegistration';
import PatientManagement from './pages/reception/PatientManagement';
import PreRegistration from './pages/reception/PreRegistration';
import ReceptionDoctorQueueManagement from './pages/reception/DoctorQueueManagement';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

// Main App Routes
const AppRoutes = () => {
  const { user } = useAuth();

  const getDefaultRoute = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'ADMIN':
        return '/admin';
      case 'DOCTOR':
        return '/doctor/dashboard';
      case 'NURSE':
        return '/nurse';
      case 'RECEPTIONIST':
        return '/reception';
      case 'BILLING_OFFICER':
        return '/billing';
      case 'PHARMACY_BILLING_OFFICER':
        return '/pharmacy-billing';
      case 'PHARMACIST':
        return '/pharmacy';
      case 'LAB_TECHNICIAN':
        return '/lab';
      case 'RADIOLOGIST':
        return '/radiology';
      default:
        return '/login';
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Layout title="Admin Dashboard" subtitle="System overview and management">
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/patient/*" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'BILLING_OFFICER']}>
              <PatientRegistration />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/nurse/*" 
          element={
            <ProtectedRoute allowedRoles={['NURSE']}>
              <Layout title="Nurse Dashboard" subtitle="Patient triage and daily tasks">
                <NurseDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reception" 
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
              <Layout title="Reception Dashboard" subtitle="Patient registration and card management">
                <ReceptionDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reception/register" 
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
              <Layout title="Patient Registration & Visit Creation" subtitle="Register new patients or create visits for existing patients">
                <ReceptionPatientRegistration />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reception/patients" 
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
              <Layout title="Patient Card Management" subtitle="Manage patient card status, activation, and billing">
                <PatientManagement />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        
        <Route 
          path="/reception/pre-registration" 
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
              <Layout title="Pre-Registration" subtitle="Handle phone call registrations and appointments">
                <PreRegistration />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reception/doctor-queue" 
          element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
              <Layout title="Doctor Queue Management" subtitle="Monitor doctor availability and patient assignments">
                <ReceptionDoctorQueueManagement />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/doctor/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <Layout title="Doctor Dashboard" subtitle="Patient consultation and medical orders">
                <DoctorDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/doctor/consultation/:visitId" 
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <PatientConsultationPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/doctor/*" 
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <Layout title="Doctor Dashboard" subtitle="Patient consultation and medical orders">
                <DoctorDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/billing/*" 
          element={
            <ProtectedRoute allowedRoles={['BILLING_OFFICER']}>
              <Layout title="Billing Dashboard" subtitle="Payment processing and financial management">
                <BillingDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/emergency-billing" 
          element={
            <ProtectedRoute allowedRoles={['BILLING_OFFICER', 'ADMIN']}>
              <Layout title="Emergency Billing" subtitle="Manage emergency patients and their running billing totals">
                <EmergencyBilling />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/cash-management" 
          element={
            <ProtectedRoute allowedRoles={['BILLING_OFFICER', 'ADMIN']}>
              <Layout title="Daily Cash Management" subtitle="Track daily cash flow, expenses, and bank deposits">
                <DailyCashManagement />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/doctor-queue" 
          element={
            <ProtectedRoute allowedRoles={['BILLING_OFFICER', 'RECEPTIONIST', 'ADMIN']}>
              <Layout title="Doctor Queue Management" subtitle="Real-time doctor availability and patient guidance">
                <DoctorQueueManagement />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/pharmacy-billing/*" 
          element={
            <ProtectedRoute allowedRoles={['PHARMACY_BILLING_OFFICER', 'PHARMACIST']}>
              <Layout title="Pharmacy Billing Dashboard" subtitle="Pharmacy payment processing and medication dispensing">
                <PharmacyBillingDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        
        <Route 
          path="/radiology/*" 
          element={
            <ProtectedRoute allowedRoles={['RADIOLOGIST']}>
              <Layout title="Radiology Dashboard" subtitle="Radiology scan processing and image management">
                <RadiologyDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/lab" 
          element={
            <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}>
              <Layout title="Lab Dashboard" subtitle="Laboratory test processing and result management">
                <LabDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/lab/orders" 
          element={
            <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}>
              <Layout title="Lab Orders" subtitle="View and manage laboratory test orders">
                <LabOrders />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/pharmacy/*" 
          element={
            <ProtectedRoute allowedRoles={['PHARMACIST']}>
              <Layout title="Pharmacy Dashboard" subtitle="Medication dispensing and inventory management">
                <PharmacyDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/appointments/*" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
              <Layout title="Appointments" subtitle="Schedule and manage patient appointments">
                <AppointmentsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        
        {/* 404 Route */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600">Page not found</p>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <div className="App">
        <AppRoutes />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  );
};

export default App;
