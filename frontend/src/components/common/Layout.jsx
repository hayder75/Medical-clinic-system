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
  CheckCircle,
  Activity
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
          { name: 'Patient History', href: '/doctor/history', icon: FileText },
          { name: 'Appointments', href: '/appointments', icon: Calendar },
        ];
      
      case 'NURSE':
        return [
          ...baseItems,
          { name: 'Triage Queue', href: '/nurse/queue', icon: Stethoscope },
          { name: 'Doctor Assignment', href: '/nurse/assign', icon: Users },
          { name: 'Daily Tasks', href: '/nurse/tasks', icon: Calendar },
          { name: 'Continuous Vitals', href: '/nurse/continuous-vitals', icon: Activity },
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
          { name: 'Walk-in Sales', href: '/pharmacy/walk-in-sales', icon: ShoppingCart },
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
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`} style={{ backgroundColor: '#10367D' }}>
        <div className="flex items-center justify-between h-16 px-4 border-b" style={{ borderColor: '#EA2E00' }}>
          <div className="flex items-center">
            <Stethoscope className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">MedClinic</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-white hover:bg-opacity-20 hover:bg-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full text-left transition-all duration-200 ${
                isCurrentPage(item.href)
                  ? 'text-white shadow-lg'
                  : 'text-gray-200 hover:text-white hover:bg-opacity-20 hover:bg-white'
              }`}
              style={{
                backgroundColor: isCurrentPage(item.href) ? '#EA2E00' : 'transparent'
              }}
            >
              <item.icon
                className={`mr-3 h-5 w-5 transition-colors ${
                  isCurrentPage(item.href) ? 'text-white' : 'text-gray-300 group-hover:text-white'
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
        <header className="shadow-lg border-b" style={{ backgroundColor: '#FFFFFF', borderColor: '#10367D' }}>
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md transition-colors"
                style={{ color: '#0C0E0B' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#10367D'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-semibold" style={{ color: '#0C0E0B' }}>{title}</h1>
                {subtitle && (
                  <p className="text-sm" style={{ color: '#10367D' }}>{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-md transition-colors" style={{ color: '#0C0E0B' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#10367D'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                <Bell className="h-6 w-6" />
              </button>
              
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10367D' }}>
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium" style={{ color: '#0C0E0B' }}>{user?.name || user?.username}</p>
                    <p className="text-xs" style={{ color: '#10367D' }}>{user?.role?.toLowerCase().replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-md transition-colors"
                    style={{ color: '#0C0E0B' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#EA2E00'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#FFFFFF' }}>
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
          <div className="absolute inset-0 opacity-75" style={{ backgroundColor: '#10367D' }}></div>
        </div>
      )}
    </div>
  );
};

export default Layout;
