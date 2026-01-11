import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import PrescriptionQueue from '../../components/pharmacy/PrescriptionQueue';
import Inventory from '../../components/pharmacy/Inventory';
import WalkInSales from '../../components/pharmacy/WalkInSales';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Pill, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
  Package,
  Store
} from 'lucide-react';

const PharmacyDashboard = () => {
  const [stats, setStats] = useState({
    pendingPrescriptions: 0,
    dispensedToday: 0,
    totalMedications: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pharmacies/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching pharmacy dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Pending Prescriptions',
      value: stats.pendingPrescriptions,
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'Prescriptions waiting for dispensing'
    },
    {
      title: 'Dispensed Today',
      value: stats.dispensedToday,
      icon: CheckCircle,
      color: 'bg-green-500',
      description: 'Medications dispensed today'
    },
    {
      title: 'Total Medications',
      value: stats.totalMedications,
      icon: Pill,
      color: 'bg-blue-500',
      description: 'Medications in inventory'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'Medications running low'
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
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  )}
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
              <button 
                onClick={() => navigate('/pharmacy/queue')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Pill className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium">Dispense Medication</p>
                    <p className="text-sm text-gray-500">Process prescription orders</p>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => navigate('/pharmacy/inventory')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <p className="font-medium">Check Inventory</p>
                    <p className="text-sm text-gray-500">View medication stock levels</p>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => navigate('/pharmacy/walk-in-sales')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Store className="h-5 w-5 text-orange-500 mr-3" />
                  <div>
                    <p className="font-medium">Walk-In Sales</p>
                    <p className="text-sm text-gray-500">Sell medications to walk-in customers</p>
                  </div>
                </div>
              </button>
              <button 
                onClick={() => navigate('/pharmacy/inventory')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <ShoppingCart className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <p className="font-medium">Add Medication</p>
                    <p className="text-sm text-gray-500">Register new medications</p>
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
                  <span className="text-sm text-gray-600">Paracetamol dispensed</span>
                </div>
                <span className="text-xs text-gray-400">2 minutes ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">New prescription received</span>
                </div>
                <span className="text-xs text-gray-400">15 minutes ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Medication not available</span>
                </div>
                <span className="text-xs text-gray-400">30 minutes ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Low stock alert - Aspirin</span>
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
    <Routes>
      <Route path="/" element={<DashboardOverview />} />
      <Route path="/queue" element={<PrescriptionQueue />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/walk-in-sales" element={<WalkInSales />} />
    </Routes>
  );
};

export default PharmacyDashboard;
