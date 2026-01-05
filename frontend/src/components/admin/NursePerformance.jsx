import React, { useState, useEffect } from 'react';
import { UserCheck, TrendingUp, Users, DollarSign, Eye, ChevronLeft, ChevronRight, Calendar, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NursePerformance = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNurseStats();
  }, [selectedPeriod]);

  useEffect(() => {
    if (selectedNurse) {
      fetchNurseDailyBreakdown(selectedNurse.nurseId);
    }
  }, [selectedMonth, selectedYear]);

  const fetchNurseStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/reports/nurse-performance?period=${selectedPeriod}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching nurse performance stats:', error);
      toast.error('Failed to fetch nurse performance statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (nurse) => {
    setSelectedNurse(nurse);
    setShowDetailsModal(true);
    fetchNurseDailyBreakdown(nurse.nurseId);
  };

  const fetchNurseDailyBreakdown = async (nurseId) => {
    try {
      const response = await api.get(`/admin/reports/nurse-daily-breakdown?nurseId=${nurseId}&year=${selectedYear}&month=${selectedMonth}`);
      setDailyBreakdown(response.data.dailyData || []);
    } catch (error) {
      console.error('Error fetching nurse daily breakdown:', error);
    }
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setSearchQuery(''); // Clear search when selecting a new day
  };
  
  // Filter patients based on search query
  const filteredPatients = selectedDay?.details?.filter(patient => 
    patient.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getMonthName = (monthIndex) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
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

  // Generate calendar days
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
      
      days.push({
        key: `day-${day}`,
        day,
        date: dateStr,
        triageCount: dayData?.triageCount || 0,
        servicesOrdered: dayData?.servicesOrdered || 0,
        revenue: dayData?.revenue || 0,
        patients: dayData?.patients || 0,
        details: dayData?.details || [],
        isEmpty: false
      });
    }
    
    return days;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nurse Performance</h1>
          <p className="text-gray-600 mt-1">Track nurse activities, services ordered, and triage counts</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Triages</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.summary.totalTriages}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Services Ordered</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.summary.totalServicesOrdered}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.summary.totalRevenue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg per Nurse</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.summary.avgPerNurse)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Top Performer */}
      {stats.summary.topPerformer && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Top Performer</p>
              <p className="text-xl font-bold text-blue-900 mt-1">{stats.summary.topPerformer.nurseName}</p>
              <p className="text-sm text-blue-700 mt-1">
                {formatCurrency(stats.summary.topPerformer.totalRevenue)} from {stats.summary.topPerformer.totalServicesOrdered} services
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-500" />
          </div>
        </div>
      )}

      {/* Nurses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Nurse Performance Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nurse Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Triages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Services Ordered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patients Served
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg per Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.nurses.map((nurse, index) => (
                <tr key={nurse.nurseId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{nurse.nurseName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{nurse.triageCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{nurse.totalServicesOrdered}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">{formatCurrency(nurse.totalRevenue)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{nurse.totalPatients}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(nurse.avgPerPatient)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(nurse)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedNurse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedNurse.nurseName} - Daily Breakdown
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDay(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-semibold">
                  {getMonthName(selectedMonth)} {selectedYear}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Calendar */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {generateCalendarDays().map((day, index) => (
                  <div
                    key={day.key || index}
                    className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                      day.isEmpty
                        ? 'bg-transparent border-transparent'
                        : selectedDay?.date === day.date
                        ? 'bg-blue-100 border-blue-500'
                        : day.revenue > 0 || day.servicesOrdered > 0 || day.triageCount > 0
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => !day.isEmpty && handleDayClick(day)}
                  >
                    {!day.isEmpty && (
                      <>
                        <div className="text-sm font-medium text-gray-900">{day.day}</div>
                        {day.triageCount > 0 && (
                          <div className="text-xs text-blue-600 mt-1">T: {day.triageCount}</div>
                        )}
                        {day.servicesOrdered > 0 && (
                          <div className="text-xs text-green-600 mt-1">S: {day.servicesOrdered}</div>
                        )}
                        {day.revenue > 0 && (
                          <div className="text-xs text-yellow-600 mt-1 font-semibold">
                            {formatCurrency(day.revenue)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Day Details */}
              {selectedDay && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      Details for {formatDate(selectedDay.date)}
                    </h3>
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-600">Triages</p>
                      <p className="text-xl font-bold text-blue-900">{selectedDay.triageCount}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-600">Services Ordered</p>
                      <p className="text-xl font-bold text-green-900">{selectedDay.servicesOrdered}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-yellow-600">Revenue</p>
                      <p className="text-xl font-bold text-yellow-900">{formatCurrency(selectedDay.revenue)}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-purple-600">Patients</p>
                      <p className="text-xl font-bold text-purple-900">{selectedDay.patients}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPatients.length > 0 ? (
                          filteredPatients.map((patient, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {patient.patientName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {patient.serviceName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {patient.serviceCategory}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(patient.amount)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {patient.isWaived ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    Waived
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    Paid
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                              No services found for this day
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NursePerformance;

