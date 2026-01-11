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

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      const response = await api.post('/admin/reports/export-excel', {
        period: selectedPeriod,
        revenueType,
        year: selectedYear,
        month: selectedMonth,
        dailyBreakdown
      });

      const link = document.createElement('a');
      link.href = `${window.location.protocol}//${window.location.hostname}:3000${response.data.filePath}`;
      link.download = response.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report exported to Excel');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel');
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      const response = await api.post('/admin/reports/export-pdf', {
        period: selectedPeriod,
        revenueType,
        year: selectedYear,
        month: selectedMonth,
        dailyBreakdown,
        revenueStats
      });

      const link = document.createElement('a');
      link.href = `${window.location.protocol}//${window.location.hostname}:3000${response.data.filePath}`;
      link.download = response.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report exported to PDF');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  // Print report
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    const revenueData = getRevenueData();
    const pendingData = getPendingData();

    // Filter out days with no data
    const daysWithData = dailyBreakdown.filter(day => {
      const medical = day.medical?.revenue || 0;
      const pharmacy = day.pharmacy?.revenue || 0;
      const combined = day.combined?.revenue || 0;
      return medical > 0 || pharmacy > 0 || combined > 0;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Report - ${revenueType.toUpperCase()}</title>
          <style>
            @media print {
              @page { 
                size: A4;
                margin: 15mm;
              }
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 10px;
              color: #333;
              line-height: 1.4;
            }
            .header { 
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 15px; 
              margin-bottom: 25px; 
              border-bottom: 2px solid #2563eb;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
            }
            .clinic-info {
              text-align: left;
            }
            .clinic-name { 
              font-size: 26px; 
              font-weight: 800; 
              margin: 0;
              color: #1e40af;
              letter-spacing: -0.5px;
            }
            .clinic-tagline {
              font-size: 12px;
              color: #64748b;
              margin: 0;
              font-style: italic;
            }
            .header-right {
              text-align: right;
            }
            .report-title { 
              font-size: 20px; 
              font-weight: 700; 
              margin: 0;
              color: #0f172a;
              text-transform: uppercase;
            }
            .report-info {
              font-size: 12px;
              color: #64748b;
              margin-top: 4px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-card {
              padding: 15px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              text-align: center;
            }
            .summary-label {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 18px;
              font-weight: 800;
              color: #1e293b;
            }
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
              text-transform: uppercase;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .data-table th, .data-table td {
              padding: 12px;
              border: 1px solid #e2e8f0;
              text-align: left;
            }
            .data-table th {
              background: #f1f5f9;
              font-size: 12px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
            }
            .data-table td {
              font-size: 13px;
            }
            .data-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .footer {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .signature-box {
              text-align: center;
            }
            .sign-line {
              width: 220px;
              border-top: 2px solid #0f172a;
              margin-bottom: 8px;
            }
            .sign-label {
              font-size: 11px;
              font-weight: 700;
              color: #475569;
            }
            .print-footer {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              margin-top: 40px;
              border-top: 1px solid #f1f5f9;
              padding-top: 15px;
            }
            .no-data {
              text-align: center;
              padding: 50px;
              background: #f8fafc;
              border: 2px dashed #e2e8f0;
              border-radius: 10px;
              color: #64748b;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <img src="/clinic-logo.jpg" alt="Clinic Logo" class="logo" onerror="this.style.display='none'">
              <div class="clinic-info">
                <h1 class="clinic-name">Selihom Medium Clinic</h1>
                <p class="clinic-tagline">Quality Healthcare You Can Trust</p>
              </div>
            </div>
            <div class="header-right">
              <h2 class="report-title">Financial Report</h2>
              <div class="report-info">
                Type: ${revenueType.toUpperCase()}<br>
                Period: ${selectedPeriod === 'daily' ? selectedDate : `${getMonthName(selectedMonth)} ${selectedYear}`}
              </div>
            </div>
          </div>

          <div class="section-title">Executive Summary</div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Total Revenue</div>
              <div class="summary-value" style="color: #166534;">${formatCurrency(revenueData.revenue)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Transactions</div>
              <div class="summary-value">${revenueData.transactions}</div>
            </div>
            ${pendingData ? `
              <div class="summary-card">
                <div class="summary-label">Pending Revenue</div>
                <div class="summary-value" style="color: #92400e;">${formatCurrency(pendingData.revenue)}</div>
              </div>
            ` : ''}
          </div>

          <div class="section-title">Detailed Breakdown</div>
          ${daysWithData.length > 0 ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Medical Revenue</th>
                  <th>Pharmacy Revenue</th>
                  <th>Total Daily Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${daysWithData.map(day => `
                  <tr>
                    <td>${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>${formatCurrency(day.medical?.revenue || 0)}</td>
                    <td>${formatCurrency(day.pharmacy?.revenue || 0)}</td>
                    <td style="font-weight: 700;">${formatCurrency(day.combined?.revenue || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="no-data">
              <p>No financial data available for the selected period.</p>
              <p>This may be because patient data was cleared or there are no transactions in this time range.</p>
            </div>
          `}

          <div class="footer">
            <div class="signature-box">
              <div class="sign-line"></div>
              <div class="sign-label">Prepared By (Admin)</div>
            </div>
            <div class="signature-box">
              <div class="sign-line"></div>
              <div class="sign-label">Authorized Signature & Stamp</div>
            </div>
          </div>

          <div class="print-footer">
            Selihom Medium Clinic - Financial Analytics Report - Generated on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Calendar className="h-4 w-4 inline mr-1" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-1" />
              Table
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportExcel} className="btn btn-secondary flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export Excel
            </button>
            <button onClick={handleExportPDF} className="btn btn-secondary flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Export PDF
            </button>
            <button onClick={handlePrintReport} className="btn btn-secondary flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Type Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setRevenueType('medical')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${revenueType === 'medical' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Medical
        </button>
        <button
          onClick={() => setRevenueType('pharmacy')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${revenueType === 'pharmacy' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Pharmacy
        </button>
        <button
          onClick={() => setRevenueType('combined')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${revenueType === 'combined' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      className={`relative p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${isSelected
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
                      <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-blue-900' : isToday ? 'text-blue-700' : 'text-gray-800'
                        }`}>
                        {day.day}
                      </div>

                      {/* Revenue amount */}
                      <div className={`text-xs ${revenueStyle.text} ${day.revenue > 0 ? '' : ''
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
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${selectedPeriod === period ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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