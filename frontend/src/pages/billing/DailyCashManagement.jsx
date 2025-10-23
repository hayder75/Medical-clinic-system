import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const DailyCashManagement = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form states
  const [transactionForm, setTransactionForm] = useState({
    type: 'PAYMENT_RECEIVED',
    amount: '',
    description: '',
    paymentMethod: 'CASH',
    billingId: '',
    patientId: ''
  });
  
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
  
  const [resetForm, setResetForm] = useState({
    endingCash: ''
  });

  useEffect(() => {
    fetchCurrentSession();
  }, []);

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

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/cash-management/add-transaction', {
        ...transactionForm,
        amount: parseFloat(transactionForm.amount)
      });
      
      toast.success('Transaction added successfully');
      setTransactionForm({
        type: 'PAYMENT_RECEIVED',
        amount: '',
        description: '',
        paymentMethod: 'CASH',
        billingId: '',
        patientId: ''
      });
      fetchCurrentSession();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error(error.response?.data?.error || 'Failed to add transaction');
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

  const handleResetSession = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to reset this session? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await api.post('/cash-management/reset-session', {
        sessionId: session.id,
        endingCash: parseFloat(resetForm.endingCash)
      });
      
      toast.success('Session reset successfully');
      setResetForm({ endingCash: '' });
      fetchCurrentSession();
    } catch (error) {
      console.error('Error resetting session:', error);
      toast.error(error.response?.data?.error || 'Failed to reset session');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
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
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm font-medium text-yellow-600">Bank Deposits</div>
              <div className="text-xl font-bold text-yellow-900">
                {formatCurrency(calculatedTotals.totalBankDeposit)}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600">Session Created By</div>
              <div className="text-lg font-semibold text-gray-900">
                {session.createdBy.fullname}
              </div>
            </div>
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
                { id: 'expenses', name: 'Expenses', icon: '📝' },
                { id: 'reset', name: 'Reset Session', icon: '🔄' }
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

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Add Transaction Form */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Add Transaction</h3>
                    <form onSubmit={handleAddTransaction} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          value={transactionForm.type}
                          onChange={(e) => setTransactionForm({...transactionForm, type: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="PAYMENT_RECEIVED">Payment Received</option>
                          <option value="REFUND_GIVEN">Refund Given</option>
                          <option value="CASH_ADJUSTMENT">Cash Adjustment</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={transactionForm.amount}
                          onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                          type="text"
                          value={transactionForm.description}
                          onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                        <select
                          value={transactionForm.paymentMethod}
                          onChange={(e) => setTransactionForm({...transactionForm, paymentMethod: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="CASH">Cash</option>
                          <option value="BANK">Bank Transfer</option>
                          <option value="INSURANCE">Insurance</option>
                          <option value="CHARITY">Charity</option>
                        </select>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Add Transaction
                      </button>
                    </form>
                  </div>

                  {/* Transaction List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">All Transactions</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {session.transactions.map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 bg-white border rounded">
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-gray-500">
                              {transaction.type.replace('_', ' ')} • {transaction.paymentMethod}
                            </div>
                            {transaction.patient && (
                              <div className="text-xs text-blue-600">
                                Patient: {transaction.patient.name}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${
                              transaction.type === 'PAYMENT_RECEIVED' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'PAYMENT_RECEIVED' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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

            {/* Reset Session Tab */}
            {activeTab === 'reset' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-yellow-600 text-2xl mr-3">⚠️</div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-800">Reset Daily Session</h3>
                      <p className="text-yellow-700">
                        This action will close the current session and reset all daily totals. 
                        This should only be done at the end of the day after all money has been deposited to the bank.
                      </p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleResetSession} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Ending Cash Amount (Cash remaining in drawer)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={resetForm.endingCash}
                        onChange={(e) => setResetForm({...resetForm, endingCash: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Reset Session
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default DailyCashManagement;
