import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, Users, CreditCard, ChevronLeft, ChevronRight, BarChart3, PieChart as PieChartIcon, DollarSign, Activity, Eye, EyeOff, Stethoscope } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Reports = () => {
  const navigate = useNavigate();
  const [revenueStats, setRevenueStats] = useState(null);
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('calendar');
  const [revenueType, setRevenueType] = useState('combined'); // medical, pharmacy, combined
  const [showPending, setShowPending] = useState(false);
  const [showDayPopup, setShowDayPopup] = useState(false);
  const [popupDayData, setPopupDayData] = useState(null);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchRevenueStats();
    fetchDailyBreakdown();
  }, [selectedPeriod, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchDailyBreakdown();
  }, [selectedMonth, selectedYear]);

  const fetchRevenueStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/reports/revenue-stats?period=${selectedPeriod}`);
      setRevenueStats(response.data);
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      toast.error('Failed to fetch revenue statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyBreakdown = async () => {
    try {
      const response = await api.get(`/admin/reports/daily-breakdown?year=${selectedYear}&month=${selectedMonth}`);
      setDailyBreakdown(response.data.dailyData || []);
    } catch (error) {
      console.error('Error fetching daily breakdown:', error);
    }
  };

  const getMonthName = (monthIndex) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };

  const handleDayClick = (day) => {
    const dayData = dailyBreakdown.find(d => d.date === day.date);
    setPopupDayData({ ...day, dayData });
    setShowDayPopup(true);
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // Generate calendar days for the selected month
  const generateCalendarDays = () => {
    const year = selectedYear;
    const month = selectedMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ key: `empty-${i}`, isEmpty: true });
    }
    
    // Add days of the month with revenue data
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = dailyBreakdown.find(d => d.date === dateStr);
      
      let revenue = 0;
      if (dayData) {
        revenue = dayData[revenueType].revenue || dayData.combined.revenue || 0;
      }
      
      days.push({
        key: `day-${day}`,
        day,
        date: dateStr,
        revenue,
        isEmpty: false
      });
    }
    
    return days;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  // Get revenue data based on selected type
  const getRevenueData = () => {
    if (!revenueStats) return { revenue: 0, transactions: 0 };
    
    switch (revenueType) {
      case 'medical':
        return {
          revenue: revenueStats.completed.medical.revenue,
          transactions: revenueStats.completed.medical.transactions,
          consultations: revenueStats.completed.medical.consultations,
          labTests: revenueStats.completed.medical.labTests,
          radiologyScans: revenueStats.completed.medical.radiologyScans,
          label: 'Medical'
        };
      case 'pharmacy':
        return {
          revenue: revenueStats.completed.pharmacy.revenue,
          transactions: revenueStats.completed.pharmacy.transactions,
          prescriptions: revenueStats.completed.pharmacy.prescriptions,
          medications: revenueStats.completed.pharmacy.medications,
          label: 'Pharmacy'
        };
      default: // combined
        return {
          revenue: revenueStats.completed.combined.totalRevenue,
          transactions: revenueStats.completed.combined.totalTransactions,
          label: 'Combined'
        };
    }
  };

  const getPendingData = () => {
    if (!revenueStats || !showPending) return null;
    
    switch (revenueType) {
      case 'medical':
        return {
          revenue: revenueStats.pending.medical.revenue,
          bills: revenueStats.pending.medical.bills
        };
      case 'pharmacy':
        return {
          revenue: revenueStats.pending.pharmacy.revenue,
          invoices: revenueStats.pending.pharmacy.invoices
        };
      default:
        return {
          revenue: revenueStats.pending.combined.totalRevenue,
          bills: revenueStats.pending.combined.totalBills
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!revenueStats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h3>
        <p className="text-gray-500">Unable to load revenue statistics.</p>
      </div>
    );
  }

  const revenueData = getRevenueData();
  const pendingData = getPendingData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Financial Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive financial insights and revenue tracking</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-1" />
              Calendar
            </button>
            <button
          onClick={() => setViewMode('table')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-1" />
          Table
        </button>
          </div>
          <button onClick={() => window.print()} className="btn btn-secondary flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Revenue Type Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setRevenueType('medical')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            revenueType === 'medical' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Medical
        </button>
        <button
          onClick={() => setRevenueType('pharmacy')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            revenueType === 'pharmacy' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pharmacy
        </button>
        <button
          onClick={() => setRevenueType('combined')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            revenueType === 'combined' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Combined
        </button>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{revenueType === 'combined' ? 'Total' : revenueType === 'medical' ? 'Medical' : 'Pharmacy'} Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(revenueData.revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">{revenueData.transactions} transactions</p>
            </div>
          </div>
        </div>

        {revenueType === 'medical' && (
          <>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Consultations</p>
                  <p className="text-2xl font-semibold text-gray-900">{revenueData.consultations || 0}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Lab Tests</p>
                  <p className="text-2xl font-semibold text-gray-900">{revenueData.labTests || 0}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-100">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Radiology</p>
                  <p className="text-2xl font-semibold text-gray-900">{revenueData.radiologyScans || 0}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {revenueType === 'pharmacy' && (
          <>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Prescriptions</p>
                  <p className="text-2xl font-semibold text-gray-900">{revenueData.prescriptions || 0}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Medications</p>
                  <p className="text-2xl font-semibold text-gray-900">{revenueData.medications || 0}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {revenueType === 'combined' && (
          <>
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Medical</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(revenueStats.completed.medical.revenue)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pharmacy</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(revenueStats.completed.pharmacy.revenue)}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pending Payments Toggle */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pending Payments</h3>
          <button
            onClick={() => setShowPending(!showPending)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {showPending ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPending ? 'Hide' : 'Show'} Pending
          </button>
        </div>

        {showPending && pendingData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pending {revenueType === 'combined' ? 'Total' : revenueType}</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingData.revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {pendingData.bills || pendingData.invoices || 0} {revenueType === 'pharmacy' ? 'invoices' : 'bills'}
              </p>
            </div>
            {revenueType === 'combined' && (
              <>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Pending Medical</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(revenueStats.pending.medical.revenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">{revenueStats.pending.medical.bills} bills</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Pending Pharmacy</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(revenueStats.pending.pharmacy.revenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">{revenueStats.pending.pharmacy.invoices} invoices</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-xl font-semibold text-gray-900">
                  {getMonthName(selectedMonth)} {selectedYear}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Monthly {revenueType === 'combined' ? 'Total' : revenueType} Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(revenueData.revenue)}
                </p>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-lg">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {generateCalendarDays().map((day) => {
                if (day.isEmpty) {
                  return <div key={day.key} className="p-3"></div>;
                }
                
                // Get today's date in local timezone (YYYY-MM-DD format)
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                
                const isToday = day.date === todayStr;
                const isSelected = day.date === selectedDate;
                const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;
                
                // Professional subtle revenue styling
                const getRevenueStyle = () => {
                  if (day.revenue === 0) return { text: 'text-gray-400', border: 'border-gray-200' };
                  if (day.revenue > 5000) return { text: 'text-green-700 font-semibold', border: 'border-green-400' };
                  if (day.revenue > 2000) return { text: 'text-green-600 font-medium', border: 'border-green-300' };
                  return { text: 'text-green-600', border: 'border-green-200' };
                };
                
                const revenueStyle = getRevenueStyle();
                
                return (
                  <div key={day.key} className="relative group">
                    <div
                      onClick={() => handleDayClick(day)}
                      className={`relative p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-400 shadow-md ring-2 ring-blue-100' 
                          : isToday 
                            ? 'bg-blue-50 border-blue-300 shadow-sm' 
                            : isWeekend
                              ? 'bg-gray-50 border-gray-200' 
                              : day.revenue > 0
                                ? `bg-white border-green-200 hover:border-green-300 hover:shadow-sm ${revenueStyle.border}`
                                : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {/* Date number */}
                      <div className={`text-sm font-semibold mb-1 ${
                        isSelected ? 'text-blue-900' : isToday ? 'text-blue-700' : 'text-gray-800'
                      }`}>
                        {day.day}
                      </div>
                      
                      {/* Revenue amount */}
                      <div className={`text-xs ${revenueStyle.text} ${
                        day.revenue > 0 ? '' : ''
                      }`}>
                        {day.revenue > 0 ? (
                          <span className="inline-flex items-center">
                            ETB {day.revenue.toLocaleString()}
                          </span>
                        ) : isToday ? (
                          <span className="text-blue-600 text-[10px] font-medium">Today</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </div>
                      
                      {/* Subtle bottom border for revenue days */}
                      {day.revenue > 0 && !isSelected && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 opacity-50"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Period Selection and Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Period Summary</h3>
        <div className="flex gap-2 mb-4">
          {['daily', 'weekly', 'monthly', 'yearly'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                selectedPeriod === period ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
        <div className="text-center text-gray-600">
          <p>Period: {selectedPeriod}</p>
          <p className="text-sm mt-1">
            {revenueStats.dateRange.start && new Date(revenueStats.dateRange.start).toLocaleDateString()} - {' '}
            {revenueStats.dateRange.end && new Date(revenueStats.dateRange.end).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Day Details Popup */}
      {showDayPopup && popupDayData && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" onClick={() => setShowDayPopup(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {new Date(popupDayData.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button 
                onClick={() => setShowDayPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            {popupDayData.dayData ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(popupDayData.dayData.combined.revenue)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Medical</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(popupDayData.dayData.medical.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">{popupDayData.dayData.medical.transactions} transactions</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Pharmacy</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {formatCurrency(popupDayData.dayData.pharmacy.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">{popupDayData.dayData.pharmacy.transactions} transactions</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No transactions recorded for this day</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;