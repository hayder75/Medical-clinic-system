import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, CreditCard, Wallet, Eye, TrendingUp, TrendingDown, Search } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PatientAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, CREDIT, ADVANCE, NONE
  const [activeTab, setActiveTab] = useState('REQUESTS'); // REQUESTS, CREDIT, ADVANCE
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalType, setModalType] = useState(''); // 'deposit', 'payment', 'return-money', 'add-credit', 'adjust', 'view'

  useEffect(() => {
    fetchAccounts();
  }, [filter]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/accounts?type=${filter}`);
      setAccounts(response.data.accounts || []);
    } catch (error) {
      toast.error('Failed to fetch accounts');
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (account, type) => {
    setSelectedAccount(account);
    setModalType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAccount(null);
    setModalType('');
    fetchAccounts();
  };

  const handleVerify = async (accountId) => {
    try {
      await api.post(`/accounts/verify/${accountId}`);
      toast.success('Account verified successfully');
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to verify account');
    }
  };

  const handleReject = async (accountId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await api.post(`/accounts/reject/${accountId}`, { reason });
        toast.success('Account rejected');
        fetchAccounts();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to reject account');
      }
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'REQUESTS') {
      return matchesSearch && account.status === 'PENDING';
    } else if (activeTab === 'ALL') {
      return matchesSearch;
    } else {
      return matchesSearch && account.accountType === activeTab;
    }
  });

  const stats = {
    total: accounts.length,
    credit: accounts.filter(a => a.accountType === 'CREDIT').length,
    advance: accounts.filter(a => a.accountType === 'ADVANCE').length,
    totalDebt: accounts.filter(a => a.accountType === 'CREDIT' && a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0),
    totalAdvance: accounts.filter(a => a.accountType === 'ADVANCE' && a.balance > 0).reduce((sum, a) => sum + a.balance, 0)
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Patient Accounts Management</h2>
          <p className="text-gray-600">Manage credit and advance payment accounts</p>
        </div>
        <button
          onClick={() => handleOpenModal(null, 'create')}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Account
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Credit Accounts</p>
              <p className="text-2xl font-bold text-red-600">{stats.credit}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Total Debt: ${stats.totalDebt.toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Advance Accounts</p>
              <p className="text-2xl font-bold text-green-600">{stats.advance}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Total Balance: ${stats.totalAdvance.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('REQUESTS')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'REQUESTS' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Requests
            </button>
            <button
              onClick={() => setActiveTab('CREDIT')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'CREDIT' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Credit Users
            </button>
            <button
              onClick={() => setActiveTab('ADVANCE')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'ADVANCE' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Advance Payment Users
            </button>
          </div>
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
              <th>Account Type</th>
              <th>Balance</th>
              <th>Debt</th>
              <th>Total Used</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((account) => (
              <tr key={account.id}>
                <td className="font-medium">{account.patient?.name || 'N/A'}</td>
                <td>{account.patient?.mobile || 'N/A'}</td>
                <td>
                  <span className={`badge ${
                    account.accountType === 'CREDIT' ? 'badge-error' :
                    account.accountType === 'ADVANCE' ? 'badge-success' :
                    'badge-info'
                  }`}>
                    {account.accountType || 'NONE'}
                  </span>
                </td>
                <td>
                  <span className={`font-semibold ${
                    account.accountType === 'CREDIT' 
                      ? (account.balance > 0 ? 'text-blue-600' : 'text-gray-600')
                      : (account.balance < 0 ? 'text-red-600' : 
                         account.balance > 0 ? 'text-green-600' : 'text-gray-600')
                  }`}>
                    ${account.balance.toFixed(2)}
                  </span>
                </td>
                <td>
                  {account.accountType === 'CREDIT' ? (
                    <span className="font-semibold text-lg text-red-600">
                      ${(account.debtOwed || 0).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td>${account.totalUsed.toFixed(2)}</td>
                <td>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(account, 'view')}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {account.accountType === 'CREDIT' && (
                      <>
                        <button
                          onClick={() => handleOpenModal(account, 'add-credit')}
                          className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm"
                        >
                          Add Credit
                        </button>
                        {(account.debtOwed || 0) > 0 && (
                          <button
                            onClick={() => handleOpenModal(account, 'return-money')}
                            className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm"
                          >
                            Return Money
                          </button>
                        )}
                      </>
                    )}
                    {account.accountType === 'ADVANCE' && (
                      <button
                        onClick={() => handleOpenModal(account, 'deposit')}
                        className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm"
                      >
                        Add Deposit
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal will be rendered here */}
      {showModal && (
        <AccountModal
          account={selectedAccount}
          type={modalType}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

// Modal Component
const AccountModal = ({ account, type, onClose }) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    bankName: '',
    transNumber: '',
    notes: '',
    patientId: '',
    accountType: 'ADVANCE',
    searchPatient: ''
  });
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Search patients
  const searchPatients = async () => {
    if (formData.searchPatient.trim().length < 2) {
      setPatients([]);
      return;
    }

    try {
      setSearchingPatients(true);
      const response = await api.get(`/patients/search?query=${formData.searchPatient}`);
      const patientsList = response.data.patients || response.data || [];
      setPatients(patientsList);
    } catch (error) {
      console.error('Error searching patients:', error);
      setPatients([]);
    } finally {
      setSearchingPatients(false);
    }
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData({ ...formData, patientId: patient.id, searchPatient: patient.name });
    setPatients([]);
  };

  // Debounced search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (type === 'create' && formData.searchPatient.trim().length >= 2) {
        searchPatients();
      } else {
        setPatients([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [formData.searchPatient, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (type === 'create' && !formData.patientId) {
      toast.error('Please select a patient');
      return;
    }
    
    if (type !== 'create' && (!formData.amount || parseFloat(formData.amount) <= 0)) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      
      if (type === 'create') {
        await api.post('/accounts/requests', {
          patientId: formData.patientId,
          requestType: 'CREATE_ACCOUNT',
          accountType: formData.accountType,
          amount: formData.amount ? parseFloat(formData.amount) : 0,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes
        });
        toast.success('Account request created successfully, waiting for admin approval');
      } else if (type === 'deposit') {
        // ADVANCE account deposit - create request
        await api.post('/accounts/requests', {
          accountId: account.id,
          patientId: account.patientId,
          requestType: 'ADD_DEPOSIT',
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          bankName: formData.bankName || undefined,
          transNumber: formData.transNumber || undefined,
          notes: formData.notes || undefined
        });
        toast.success('Deposit request created, waiting for admin approval');
      } else if (type === 'add-credit') {
        // CREDIT account - add more credit limit - create request
        await api.post('/accounts/requests', {
          accountId: account.id,
          patientId: account.patientId,
          requestType: 'ADD_CREDIT',
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          bankName: formData.bankName || undefined,
          transNumber: formData.transNumber || undefined,
          notes: formData.notes || undefined
        });
        toast.success('Credit request created, waiting for admin approval');
      } else if (type === 'return-money' || type === 'payment') {
        // CREDIT account - return money to clear debt
        await api.post('/accounts/payment', {
          accountId: account.id,
          patientId: account.patientId,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          bankName: formData.bankName || undefined,
          transNumber: formData.transNumber || undefined,
          notes: formData.notes || undefined
        });
        toast.success('Payment returned successfully');
      }
      
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {type === 'create' ? 'Create Account' : 
               type === 'deposit' ? 'Add Deposit' : 
               type === 'add-credit' ? 'Add Credit' :
               type === 'return-money' ? 'Return Money to Clear Debt' :
               'Accept Payment'}
            </h3>
            <button onClick={onClose} className="text-gray-500">×</button>
          </div>
          
          {type === 'view' ? (
            <AccountDetails account={account} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {type === 'create' && (
                <>
                  <div>
                    <label className="label">Search Patient *</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="input"
                        placeholder="Type patient name to search..."
                        value={formData.searchPatient}
                        onChange={(e) => setFormData({ ...formData, searchPatient: e.target.value, patientId: '', selectedPatient: null })}
                      />
                      {searchingPatients && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        </div>
                      )}
                    </div>
                    {patients.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                        {patients.map((patient) => (
                          <div
                            key={patient.id}
                            onClick={() => selectPatient(patient)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                          >
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-xs text-gray-500">{patient.id} | {patient.mobile || 'No phone'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedPatient && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm font-medium text-blue-700">Selected: {selectedPatient.name}</p>
                      </div>
                    )}
                    {!formData.patientId && formData.searchPatient.length >= 2 && !searchingPatients && patients.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No patients found. Try a different search.</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="label">Account Type *</label>
                    <select
                      className="input"
                      value={formData.accountType}
                      onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                      required
                    >
                      <option value="ADVANCE">Advance Payment</option>
                      <option value="CREDIT">Credit Account</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">Initial Deposit (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for credit accounts</p>
                  </div>
                </>
              )}
              
              {type !== 'create' && (
              <>
                <div>
                  <label className="label">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="label">Payment Method *</label>
                  <select
                    className="input"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>
                
                {formData.paymentMethod === 'BANK' && (
                  <>
                    <div>
                      <label className="label">Bank Name</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Transaction Number</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.transNumber}
                        onChange={(e) => setFormData({ ...formData, transNumber: e.target.value })}
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </>
              )}
              
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Account Details Component
const AccountDetails = ({ account }) => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Patient</p>
            <p className="font-semibold">{account.patient?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p>{account.patient?.mobile || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Balance</p>
            <p className={`font-bold ${account.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${account.balance.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Account Type</p>
            <span className="badge">{account.accountType}</span>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-2">Recent Transactions</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {account.transactions && account.transactions.length > 0 ? (
            account.transactions.map((tx, idx) => (
              <div key={idx} className="border-b pb-2">
                <div className="flex justify-between">
                  <span className="text-sm">{tx.type}</span>
                  <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAccounts;

