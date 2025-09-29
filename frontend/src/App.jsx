import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import PatientRegistration from './pages/patient/PatientRegistration';
import NurseDashboard from './pages/nurse/NurseDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import BillingDashboard from './pages/billing/BillingDashboard';
import PharmacyBillingDashboard from './pages/billing/PharmacyBillingDashboard';
import LabDashboard from './pages/lab/LabDashboard';
import RadiologyDashboard from './pages/radiology/RadiologyDashboard';
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import AppointmentsPage from './pages/appointments/AppointmentsPage';

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
        return '/doctor';
      case 'NURSE':
        return '/nurse';
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
              <AdminDashboard />
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
              <NurseDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/doctor/*" 
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/billing/*" 
          element={
            <ProtectedRoute allowedRoles={['BILLING_OFFICER']}>
              <BillingDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/pharmacy-billing/*" 
          element={
            <ProtectedRoute allowedRoles={['PHARMACY_BILLING_OFFICER', 'PHARMACIST']}>
              <PharmacyBillingDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/lab/*" 
          element={
            <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}>
              <LabDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/radiology/*" 
          element={
            <ProtectedRoute allowedRoles={['RADIOLOGIST']}>
              <RadiologyDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/pharmacy/*" 
          element={
            <ProtectedRoute allowedRoles={['PHARMACIST']}>
              <PharmacyDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/appointments/*" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}>
              <AppointmentsPage />
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
