import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Download, Printer, Calendar } from 'lucide-react';
import api from '../../services/api';
import { getServerUrl } from '../../utils/imageUrl';

const DailyCashManagement = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Patient receipts for transactions tab
  const [patientReceipts, setPatientReceipts] = useState([]);
  const [loadingPatientReceipts, setLoadingPatientReceipts] = useState(false);
  
  // Form states (kept for deposits and expenses tabs)
  const [depositForm, setDepositForm] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    transactionNumber: '',
    notes: ''
  });
  
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'OFFICE_SUPPLIES',
    description: '',
    vendor: ''
  });

  useEffect(() => {
    fetchCurrentSession();
    if (activeTab === 'transactions') {
      fetchPatientReceipts();
    }
  }, [activeTab, selectedDate]);

  const fetchCurrentSession = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cash-management/current-session');
      setSession(response.data.session);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to fetch current session');
    } finally {
      setLoading(false);
    }
  };


  const handleAddDeposit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/cash-management/add-deposit', {
        ...depositForm,
        amount: parseFloat(depositForm.amount)
      });
      
      toast.success('Bank deposit recorded successfully');
      setDepositForm({
        amount: '',
        bankName: '',
        accountNumber: '',
        transactionNumber: '',
        notes: ''
      });
      fetchCurrentSession();
    } catch (error) {
      console.error('Error adding deposit:', error);
      toast.error(error.response?.data?.error || 'Failed to record deposit');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/cash-management/add-expense', {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });
      
      toast.success('Expense recorded successfully');
      setExpenseForm({
        amount: '',
        category: 'OFFICE_SUPPLIES',
        description: '',
        vendor: ''
      });
      fetchCurrentSession();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error(error.response?.data?.error || 'Failed to record expense');
    }
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Filter transactions by selected date
  const filteredTransactions = useMemo(() => {
    if (!session || !session.transactions) return [];
    if (!selectedDate) return session.transactions;
    
    const filterDate = new Date(selectedDate);
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return session.transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= filterDate && transactionDate < nextDay;
    });
  }, [session, selectedDate]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    // Create CSV content (Excel can open CSV)
    const headers = ['Date & Time', 'Description', 'Type', 'Payment Method', 'Patient', 'Amount'];
    const rows = filteredTransactions.map(t => [
      new Date(t.createdAt).toLocaleString(),
      t.description,
      t.type.replace('_', ' '),
      t.paymentMethod,
      t.patient ? t.patient.name : '-',
      `${t.type === 'PAYMENT_RECEIVED' ? '+' : '-'}${formatCurrency(t.amount)}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${selectedDate || 'all'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transactions exported to Excel');
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    try {
      const response = await api.post('/cash-management/export-transactions-pdf', {
        transactions: filteredTransactions,
        date: selectedDate || new Date().toISOString().split('T')[0]
      });
      
      const link = document.createElement('a');
      link.href = `${getServerUrl()}${response.data.filePath}`;
      link.download = response.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  // Fetch patient receipts
  const fetchPatientReceipts = async () => {
    try {
      setLoadingPatientReceipts(true);
      const dateParam = selectedDate || new Date().toISOString().split('T')[0];
      const response = await api.get(`/cash-management/patient-receipts?date=${dateParam}`);
      if (response.data.success) {
        setPatientReceipts(response.data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching patient receipts:', error);
      toast.error('Failed to fetch patient receipts');
    } finally {
      setLoadingPatientReceipts(false);
    }
  };

  // Print individual receipt for a single patient
  const printPatientReceipt = (patientData) => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const { patient, services, totalAmount } = patientData;

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transaction Receipt</title>
          <style>
            @media print {
              @page { 
                size: A4;
                margin: 3mm;
              }
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
              .receipt-page {
                page-break-after: always;
                page-break-inside: avoid;
              }
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0;
              color: #000;
              background: white;
            }
            .receipt-page {
              padding: 5mm;
              font-size: 11px;
              min-height: 50mm;
              margin-bottom: 2mm;
              width: 50%;
              float: left;
              background: white;
              border: none;
            }
            .header { 
              text-align: left; 
              padding-bottom: 3px; 
              margin-bottom: 3px; 
            }
            .clinic-name { 
              font-size: 16px; 
              font-weight: bold; 
              margin-bottom: 3px; 
              color: #000;
            }
            .receipt-title { 
              font-size: 14px; 
              font-weight: bold; 
              margin: 3px 0; 
              color: #000;
            }
            .receipt-info {
              font-size: 11px;
              color: #000;
              margin-top: 3px;
            }
            .patient-name {
              font-size: 12px;
              font-weight: bold;
              margin: 5px 0;
            }
            .services-section {
              margin: 5px 0;
            }
            .services-section h3 {
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 3px;
              color: #000;
            }
            .service-item { 
              margin-bottom: 3px; 
              padding: 0; 
              font-size: 10px;
            }
            .service-row {
              display: flex;
              justify-content: flex-start;
              gap: 8px;
            }
            .total-section {
              margin-top: 5px;
              padding: 0;
            }
            .total-row {
              display: flex;
              justify-content: flex-start;
              gap: 10px;
              font-weight: bold;
              font-size: 11px;
            }
            .signature-area { 
              margin-top: 5px; 
              padding-top: 3px;
            }
            .signature-box { 
              width: 120px; 
              border-top: 1px solid #000; 
              padding-top: 2px; 
              text-align: left; 
              font-size: 7px; 
              font-weight: bold;
            }
            .no-print {
              text-align: center;
              padding: 20px;
              background: #f0f0f0;
              margin-bottom: 20px;
            }
            .no-print button {
              background: #2563eb;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()">🖨️ Print Receipt</button>
          </div>
          
          <div class="receipt-page">
            <div class="header">
              <div class="clinic-name">Selihom Medical Clinic</div>
              <div class="receipt-title">TRANSACTION RECEIPT</div>
              <div class="receipt-info">
                Date: ${currentDate} | Time: ${currentTime}
              </div>
            </div>
            
            <div class="patient-name">
              ${patient?.name || 'N/A'}
            </div>
            
            <div class="services-section">
              <h3>Services</h3>
              ${services.map((service, index) => `
                <div class="service-item">
                  <div class="service-row">
                    <span>${index + 1}. ${service.name}</span>
                    <span>${service.totalPrice.toFixed(2)} ETB</span>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="total-section">
              <div class="total-row">
                <span>Total:</span>
                <span>${totalAmount.toFixed(2)} ETB</span>
              </div>
            </div>
            
            <div class="signature-area">
              <div class="signature-box">
                <div style="margin-bottom: 8px; height: 12px;"></div>
                <div>Signature</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Print transactions
  const handlePrintTransactions = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    const totalAmount = filteredTransactions.reduce((sum, t) => {
      return sum + (t.type === 'PAYMENT_RECEIVED' ? t.amount : -t.amount);
    }, 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Transactions Report</title>
          <style>
            @media print {
              @page { margin: 20mm; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              font-size: 11px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .clinic-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .report-title {
              font-size: 14px;
              color: #666;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .total-row {
              font-weight: bold;
              background-color: #f9f9f9;
            }
            .positive { color: #059669; }
            .negative { color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">Selihom Medical Clinic</div>
            <div class="report-title">Daily Cash Transactions Report</div>
            <div>Date: ${selectedDate ? new Date(selectedDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Description</th>
                <th>Type</th>
                <th>Payment Method</th>
                <th>Patient</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(t => `
                <tr>
                  <td>${new Date(t.createdAt).toLocaleString()}</td>
                  <td>${t.description}</td>
                  <td>${t.type.replace('_', ' ')}</td>
                  <td>${t.paymentMethod}</td>
                  <td>${t.patient ? t.patient.name : '-'}</td>
                  <td class="${t.type === 'PAYMENT_RECEIVED' ? 'positive' : 'negative'}">
                    ${t.type === 'PAYMENT_RECEIVED' ? '+' : '-'}${formatCurrency(t.amount)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="5" style="text-align: right;">Total:</td>
                <td>${formatCurrency(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #000;">
            <div style="margin-bottom: 20px;">
              <div style="border-top: 1px solid #000; width: 200px; margin-bottom: 5px;"></div>
              <div style="font-size: 11px; margin-bottom: 5px;">Signature: _________________________</div>
              <div style="font-size: 11px;">Date: _________________________</div>
            </div>
            <div style="text-align: center; font-size: 10px; color: #666; margin-top: 20px;">
              <div>Selihom Medical Clinic</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      case 'RESET': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No active session found</p>
      </div>
    );
  }

  const { calculatedTotals } = session;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Daily Cash Management</h1>
              <p className="text-gray-600">
                Session Date: {new Date(session.sessionDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
              {session.isReset && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  RESET
                </span>
              )}
            </div>
          </div>
          
          {/* Cash Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-600">Starting Cash</div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(session.startingCash)}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm font-medium text-green-600">Total Received</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(calculatedTotals.totalReceived)}
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-sm font-medium text-red-600">Total Expenses</div>
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(calculatedTotals.totalExpenses)}
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm font-medium text-purple-600">Current Cash</div>
              <div className="text-2xl font-bold text-purple-900">
                {formatCurrency(calculatedTotals.currentCash)}
              </div>
            </div>
          </div>
          
          {/* Comprehensive Cash Calculation */}
          <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Cash Reconciliation</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-700 font-medium">Starting Cash</span>
                <span className="text-lg font-semibold text-blue-900">+ {formatCurrency(session.startingCash)}</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-700 font-medium">Total Money Received Today</span>
                <span className="text-lg font-semibold text-green-700">+ {formatCurrency(calculatedTotals.totalReceived)}</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-700 font-medium">Total Expenses</span>
                <span className="text-lg font-semibold text-red-700">- {formatCurrency(calculatedTotals.totalExpenses)}</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b-2 border-gray-300">
                <span className="text-gray-700 font-medium">Bank Deposits</span>
                <span className="text-lg font-semibold text-yellow-700">- {formatCurrency(calculatedTotals.totalBankDeposit)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 bg-white rounded-lg px-4 py-3 shadow-sm">
                <span className="text-xl font-bold text-gray-900">Expected Cash in Drawer</span>
                <span className="text-3xl font-bold text-purple-900">
                  {formatCurrency(
                    session.startingCash + 
                    calculatedTotals.totalReceived - 
                    calculatedTotals.totalExpenses - 
                    calculatedTotals.totalBankDeposit
                  )}
                </span>
              </div>
              
              <div className="mt-3 text-sm text-gray-600 bg-white p-3 rounded border-l-4 border-indigo-500">
                <strong>Formula:</strong> Starting Cash + Money Received - Expenses - Bank Deposits = Expected Cash
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600">Session Created By</div>
              <div className="text-lg font-semibold text-gray-900">
                {session.createdBy.fullname}
              </div>
            </div>
            
            {session.resetBy && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600">Reset By</div>
                <div className="text-lg font-semibold text-gray-900">
                  {session.resetBy.fullname}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'transactions', name: 'Transactions', icon: '💰' },
                { id: 'deposits', name: 'Bank Deposits', icon: '🏦' },
                { id: 'expenses', name: 'Expenses', icon: '📝' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Transactions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                    <div className="space-y-2">
                      {session.transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-gray-500">
                              {transaction.type.replace('_', ' ')} • {transaction.paymentMethod}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${
                              transaction.type === 'PAYMENT_RECEIVED' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'PAYMENT_RECEIVED' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Expenses */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
                    <div className="space-y-2">
                      {session.expenses.slice(0, 5).map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{expense.description}</div>
                            <div className="text-sm text-gray-500">
                              {expense.category.replace('_', ' ')} • {expense.vendor || 'No vendor'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-red-600">
                              -{formatCurrency(expense.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(expense.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Tab - Patient Receipts */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                {/* Header with Date Filter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setSelectedDate('')}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    onClick={fetchPatientReceipts}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Refresh
                  </button>
                </div>

                {/* Patient Receipts List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Patient Receipts {selectedDate && `(${new Date(selectedDate).toLocaleDateString()})`}
                  </h3>
                  
                  {loadingPatientReceipts ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : patientReceipts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <p className="text-gray-500">No patient receipts found for the selected date</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patientReceipts.map((patientData, index) => (
                        <div key={patientData.patient.id || index} className="bg-white rounded-lg shadow overflow-hidden">
                          {/* Patient Header */}
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{patientData.patient.name}</h4>
                                <div className="mt-1 text-sm text-gray-600">
                                  {patientData.patient.mobile && `Phone: ${patientData.patient.mobile}`}
                                  {patientData.patient.mobile && patientData.patient.id && ' • '}
                                  {patientData.patient.id && `ID: ${patientData.patient.id}`}
                                  {patientData.visitCount > 0 && ` • ${patientData.visitCount} visit(s)`}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">
                                  {formatCurrency(patientData.totalAmount)}
                                </div>
                                <button
                                  onClick={() => printPatientReceipt(patientData)}
                                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                                >
                                  <Printer className="h-4 w-4" />
                                  Print Receipt
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Services List */}
                          <div className="px-6 py-4">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {patientData.services.map((service, serviceIndex) => (
                                  <tr key={serviceIndex} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{serviceIndex + 1}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{service.name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{service.code}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{service.quantity}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(service.unitPrice)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatCurrency(service.totalPrice)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-50">
                                <tr>
                                  <td colSpan="5" className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                                    Total Amount:
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                                    {formatCurrency(patientData.totalAmount)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bank Deposits Tab */}
            {activeTab === 'deposits' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Add Deposit Form */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Record Bank Deposit</h3>
                    <form onSubmit={handleAddDeposit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={depositForm.amount}
                          onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <input
                          type="text"
                          value={depositForm.bankName}
                          onChange={(e) => setDepositForm({...depositForm, bankName: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number (Optional)</label>
                        <input
                          type="text"
                          value={depositForm.accountNumber}
                          onChange={(e) => setDepositForm({...depositForm, accountNumber: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Transaction Number (Optional)</label>
                        <input
                          type="text"
                          value={depositForm.transactionNumber}
                          onChange={(e) => setDepositForm({...depositForm, transactionNumber: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                        <textarea
                          value={depositForm.notes}
                          onChange={(e) => setDepositForm({...depositForm, notes: e.target.value})}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Record Deposit
                      </button>
                    </form>
                  </div>

                  {/* Deposit List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Bank Deposits</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {session.bankDeposits.map((deposit) => (
                        <div key={deposit.id} className="flex justify-between items-center p-3 bg-white border rounded">
                          <div>
                            <div className="font-medium">{deposit.bankName}</div>
                            <div className="text-sm text-gray-500">
                              {deposit.accountNumber && `Account: ${deposit.accountNumber}`}
                            </div>
                            {deposit.transactionNumber && (
                              <div className="text-xs text-blue-600">
                                TXN: {deposit.transactionNumber}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {formatCurrency(deposit.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(deposit.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Add Expense Form */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Record Expense</h3>
                    <form onSubmit={handleAddExpense} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                          value={expenseForm.category}
                          onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="OFFICE_SUPPLIES">Office Supplies</option>
                          <option value="MEDICAL_SUPPLIES">Medical Supplies</option>
                          <option value="MAINTENANCE">Maintenance</option>
                          <option value="UTILITIES">Utilities</option>
                          <option value="FOOD_BEVERAGE">Food & Beverage</option>
                          <option value="TRANSPORTATION">Transportation</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                          type="text"
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vendor (Optional)</label>
                        <input
                          type="text"
                          value={expenseForm.vendor}
                          onChange={(e) => setExpenseForm({...expenseForm, vendor: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Record Expense
                      </button>
                    </form>
                  </div>

                  {/* Expense List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {session.expenses.map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-3 bg-white border rounded">
                          <div>
                            <div className="font-medium">{expense.description}</div>
                            <div className="text-sm text-gray-500">
                              {expense.category.replace('_', ' ')} • {expense.vendor || 'No vendor'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-red-600">
                              -{formatCurrency(expense.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(expense.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
  );
};

export default DailyCashManagement;
