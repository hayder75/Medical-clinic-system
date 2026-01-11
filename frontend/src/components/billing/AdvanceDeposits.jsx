import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Wallet, Search } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdvanceDeposits = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [acceptForm, setAcceptForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    bankName: '',
    transNumber: '',
    notes: ''
  });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetchAdvanceAccounts();
  }, []);

  const fetchAdvanceAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounts?type=ADVANCE');
      // Only show verified advance accounts
      const verifiedAccounts = (response.data.accounts || []).filter(
        acc => acc.status === 'VERIFIED' && acc.accountType === 'ADVANCE'
      );
      setAccounts(verifiedAccounts);
    } catch (error) {
      toast.error('Failed to fetch advance accounts');
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAcceptModal = (account) => {
    setSelectedAccount(account);
    setAcceptForm({
      amount: '',
      paymentMethod: 'CASH',
      bankName: '',
      transNumber: '',
      notes: ''
    });
    setShowAcceptModal(true);
  };

  const handleAcceptDeposit = async (e) => {
    e.preventDefault();
    
    if (!selectedAccount) return;
    
    const amount = parseFloat(acceptForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setAccepting(true);
      await api.post('/accounts/payment', {
        accountId: selectedAccount.id,
        patientId: selectedAccount.patientId,
        amount: amount,
        paymentMethod: acceptForm.paymentMethod,
        bankName: acceptForm.bankName || undefined,
        transNumber: acceptForm.transNumber || undefined,
        notes: acceptForm.notes || 'Deposit accepted by billing'
      });
      
      toast.success(`Deposit of ${amount.toFixed(2)} ETB accepted. Money added to daily cash.`);
      setShowAcceptModal(false);
      setSelectedAccount(null);
      fetchAdvanceAccounts();
    } catch (error) {
      console.error('Error accepting deposit:', error);
      toast.error(error.response?.data?.error || 'Failed to accept deposit');
    } finally {
      setAccepting(false);
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.patient?.mobile?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advance Payment Deposits</h2>
          <p className="text-gray-600">Accept deposits from advance payment users</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Phone</th>
                <th>Current Balance</th>
                <th>Total Deposited</th>
                <th>Total Used</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No advance payment accounts found
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="font-medium">{account.patient?.name || 'N/A'}</td>
                    <td>{account.patient?.mobile || 'N/A'}</td>
                    <td>
                      <span className="font-semibold text-green-600">
                        ETB {account.balance.toFixed(2)}
                      </span>
                    </td>
                    <td>ETB {account.totalDeposited.toFixed(2)}</td>
                    <td>ETB {account.totalUsed.toFixed(2)}</td>
                    <td>
                      <button
                        onClick={() => openAcceptModal(account)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept Deposit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accept Deposit Modal */}
      {showAcceptModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Accept Deposit</h3>
                <button
                  onClick={() => {
                    setShowAcceptModal(false);
                    setSelectedAccount(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Patient: {selectedAccount.patient?.name}</p>
                <p className="text-sm text-gray-600">Current Balance: ETB {selectedAccount.balance.toFixed(2)}</p>
              </div>

              <form onSubmit={handleAcceptDeposit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deposit Amount (ETB) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={acceptForm.amount}
                    onChange={(e) => setAcceptForm({ ...acceptForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={acceptForm.paymentMethod}
                    onChange={(e) => setAcceptForm({ ...acceptForm, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>

                {acceptForm.paymentMethod === 'BANK' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={acceptForm.bankName}
                        onChange={(e) => setAcceptForm({ ...acceptForm, bankName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction Number
                      </label>
                      <input
                        type="text"
                        value={acceptForm.transNumber}
                        onChange={(e) => setAcceptForm({ ...acceptForm, transNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={acceptForm.notes}
                    onChange={(e) => setAcceptForm({ ...acceptForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAcceptModal(false);
                      setSelectedAccount(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={accepting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {accepting ? 'Accepting...' : 'Accept Deposit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvanceDeposits;

