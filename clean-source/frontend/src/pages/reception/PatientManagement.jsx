import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Eye,
  Filter,
  RefreshCw,
  Calendar
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardStatusFilter, setCardStatusFilter] = useState('ALL');
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, expired: 0 });
  const [activatingCard, setActivatingCard] = useState(false);

  // Card activation form
  const [activateForm, setActivateForm] = useState({
    notes: ''
  });

  useEffect(() => {
    fetchPatients();
  }, [searchQuery, cardStatusFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (cardStatusFilter !== 'ALL') params.append('cardStatus', cardStatusFilter);
      
      const response = await api.get(`/reception/patients?${params.toString()}`);
      
      if (response.data.patients) {
        setPatients(response.data.patients);
        
        // Calculate stats from the patients data
        const stats = {
          total: response.data.patients.length,
          active: response.data.patients.filter(p => p.cardStatus === 'ACTIVE').length,
          inactive: response.data.patients.filter(p => p.cardStatus === 'INACTIVE').length,
          expired: response.data.patients.filter(p => p.cardStatus === 'EXPIRED').length
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };


  const handleActivateCard = async () => {
    if (activatingCard) return; // Prevent multiple clicks
    
    try {
      setActivatingCard(true);
      
      const response = await api.post('/reception/activate-card', {
        patientId: selectedPatient.id,
        notes: activateForm.notes
      });
      
      if (response.data.billing) {
        toast.success('Card activation bill sent to billing. Patient will be activated after payment.');
        setShowActivateModal(false);
        setActivateForm({ notes: '' });
        setSelectedPatient(null);
        fetchPatients();
      } else {
        toast.error('Failed to activate card: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error activating card:', error);
      toast.error('Failed to activate card: ' + (error.response?.data?.message || error.message));
    } finally {
      setActivatingCard(false);
    }
  };

  const handleDeactivateCard = async (patientId) => {
    try {
      const response = await api.post(`/reception/patients/${patientId}/deactivate-card`);
      if (response.data.success) {
        toast.success('Card deactivated successfully');
        fetchPatients();
      }
    } catch (error) {
      toast.error('Failed to deactivate card');
    }
  };

  const getCardStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCardStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4" />;
      case 'INACTIVE': return <X className="h-4 w-4" />;
      case 'EXPIRED': return <AlertTriangle className="h-4 w-4" />;
      default: return <X className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Filter patients based on search query and card status
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = !searchQuery || 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.mobile && patient.mobile.includes(searchQuery));
    
    const matchesCardStatus = cardStatusFilter === 'ALL' || patient.cardStatus === cardStatusFilter;
    
    return matchesSearch && matchesCardStatus;
  });

  return (
    <div className="p-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Cards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <X className="h-8 w-8 text-gray-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Inactive Cards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Expired Cards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <select
              value={cardStatusFilter}
              onChange={(e) => setCardStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Cards</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
            </select>
            
            <button
              onClick={fetchPatients}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    {patients.length === 0 ? 'No patients found in database' : `No patients match your search/filter criteria (${patients.length} total patients)`}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">ID: {patient.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{patient.mobile || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{patient.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCardStatusColor(patient.cardStatus)}`}>
                        {getCardStatusIcon(patient.cardStatus)}
                        <span className="ml-1">{patient.cardStatus}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(patient.cardExpiryDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {patient.cardStatus === 'INACTIVE' && (
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowActivateModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Activate Card
                          </button>
                        )}
                        {patient.cardStatus === 'ACTIVE' && (
                          <button
                            onClick={() => handleDeactivateCard(patient.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Deactivate
                          </button>
                        )}
                        <button className="text-blue-600 hover:text-blue-900">
                          View History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Activate Card Modal */}
      {showActivateModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Activate Card</h2>
              <button
                onClick={() => setShowActivateModal(false)}
                disabled={activatingCard}
                className={`text-gray-400 hover:text-gray-600 ${
                  activatingCard ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Patient: <span className="font-medium">{selectedPatient.name}</span></p>
              <p className="text-sm text-gray-600">ID: <span className="font-medium">{selectedPatient.id}</span></p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={activateForm.notes}
                onChange={(e) => setActivateForm({ ...activateForm, notes: e.target.value })}
                rows={3}
                disabled={activatingCard}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  activatingCard ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="Add any notes about this activation..."
              />
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> This will create a 200 Birr activation bill. The card will be activated after payment is processed at billing.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowActivateModal(false)}
                disabled={activatingCard}
                className={`px-4 py-2 text-gray-700 rounded-lg ${
                  activatingCard 
                    ? 'bg-gray-100 cursor-not-allowed' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleActivateCard}
                disabled={activatingCard}
                className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 ${
                  activatingCard 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {activatingCard ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  'Send to Billing'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
