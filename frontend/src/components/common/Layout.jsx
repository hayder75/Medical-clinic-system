import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Bell,
  Settings,
  Home,
  Users,
  Stethoscope,
  Pill,
  FileText,
  Calendar,
  BarChart3,
  CreditCard,
  TestTube,
  Scan,
  ShoppingCart,
  CheckCircle
} from 'lucide-react';

const Layout = ({ children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (href) => {
    navigate(href);
    setSidebarOpen(false);
  };

  const isCurrentPage = (href) => {
    if (href === '/') {
      return location.pathname === '/' || location.pathname === '/admin' || location.pathname === '/nurse' || location.pathname === '/doctor';
    }
    return location.pathname.startsWith(href);
  };

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/', icon: Home },
    ];

    switch (user?.role) {
      case 'ADMIN':
        return [
          ...baseItems,
          { name: 'Staff Management', href: '/admin/staff', icon: Users },
          { name: 'Service Catalog', href: '/admin/services', icon: Settings },
          { name: 'Insurance Management', href: '/admin/insurances', icon: CreditCard },
          { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
          { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
          { name: 'Appointments', href: '/appointments', icon: Calendar },
        ];
      
      case 'DOCTOR':
        return [
          ...baseItems,
          { name: 'Patient Queue', href: '/doctor/queue', icon: Stethoscope },
          { name: 'Results Queue', href: '/doctor/results', icon: CheckCircle },
          { name: 'Patient History', href: '/doctor/history', icon: FileText },
          { name: 'Appointments', href: '/appointments', icon: Calendar },
        ];
      
      case 'NURSE':
        return [
          ...baseItems,
          { name: 'Triage Queue', href: '/nurse/queue', icon: Stethoscope },
          { name: 'Doctor Assignment', href: '/nurse/assign', icon: Users },
          { name: 'Daily Tasks', href: '/nurse/tasks', icon: Calendar },
        ];
      
      case 'BILLING_OFFICER':
        return [
          ...baseItems,
          { name: 'Billing Queue', href: '/billing/queue', icon: CreditCard },
          { name: 'Patient Registration', href: '/patient/register', icon: Users },
        ];
      
      case 'PHARMACY_BILLING_OFFICER':
      case 'PHARMACIST':
        return [
          ...baseItems,
          { name: 'Pharmacy Billing', href: '/pharmacy-billing/invoices', icon: CreditCard },
          { name: 'Prescription Queue', href: '/pharmacy/queue', icon: Pill },
          { name: 'Inventory', href: '/pharmacy/inventory', icon: ShoppingCart },
        ];
      
      case 'LAB_TECHNICIAN':
        return [
          ...baseItems,
          { name: 'Lab Orders', href: '/lab/orders', icon: TestTube },
        ];
      
      case 'RADIOLOGIST':
        return [
          ...baseItems,
          { name: 'Radiology Orders', href: '/radiology/orders', icon: Scan },
        ];
      
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <Stethoscope className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">MedClinic</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                isCurrentPage(item.href)
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isCurrentPage(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>
              
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{user?.name || user?.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-gray-500"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}
    </div>
  );
};

export default Layout;
