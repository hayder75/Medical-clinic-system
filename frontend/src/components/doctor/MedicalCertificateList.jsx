import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, Edit, Trash2, Eye, Download, Calendar, User, FileText } from 'lucide-react';
import api from '../../services/api';
import MedicalCertificateForm from './MedicalCertificateForm';

const MedicalCertificateList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchCertificates = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await api.get('/medical-certificates', {
        params: {
          page,
          limit: pagination.limit,
          search,
        }
      });
      
      setCertificates(response.data.certificates);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCertificates(1, searchQuery);
  };

  const handlePageChange = (newPage) => {
    fetchCertificates(newPage, searchQuery);
  };

  const handleCreateNew = () => {
    setEditingCertificate(null);
    setShowForm(true);
  };

  const handleEdit = (certificate) => {
    setEditingCertificate(certificate);
    setShowForm(true);
  };

  const handleDelete = async (certificate) => {
    if (!window.confirm(`Are you sure you want to delete certificate ${certificate.certificateNo}?`)) {
      return;
    }

    try {
      await api.delete(`/medical-certificates/${certificate.id}`);
      toast.success('Certificate deleted successfully');
      fetchCertificates(pagination.page, searchQuery);
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error('Failed to delete certificate');
    }
  };

  const handleGeneratePDF = async (certificate) => {
    try {
      const response = await api.get(`/medical-certificates/${certificate.id}/pdf`);
      
      // Create a temporary link to download the PDF
      const link = document.createElement('a');
      link.href = `${api.defaults.baseURL}${response.data.filePath}`;
      link.download = response.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleFormSave = (certificate) => {
    setShowForm(false);
    setEditingCertificate(null);
    fetchCertificates(pagination.page, searchQuery);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCertificate(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showForm) {
    return (
      <MedicalCertificateForm
        certificate={editingCertificate}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
        isEditing={!!editingCertificate}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0C0E0B' }}>
            Medical Certificates
          </h1>
          <p className="text-gray-600 mt-1">
            Manage patient medical certificates and sick leave documents
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 text-white rounded-md transition-colors flex items-center space-x-2"
          style={{ backgroundColor: '#2e13d1' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0D2A5A'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2e13d1'}
        >
          <Plus className="h-4 w-4" />
          <span>Create Certificate</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <form onSubmit={handleSearch} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by certificate number, patient name, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: '#E5E7EB' }}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-white rounded-md transition-colors"
            style={{ backgroundColor: '#2e13d1' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0D2A5A'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2e13d1'}
          >
            Search
          </button>
        </form>
      </div>

      {/* Certificates List */}
      <div className="bg-white rounded-lg shadow-md">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#2e13d1' }}></div>
            <p className="mt-2 text-gray-600">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No certificates found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery ? 'Try adjusting your search criteria' : 'Create your first medical certificate'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certificate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rest Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {certificates.map((certificate) => (
                    <tr key={certificate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium" style={{ color: '#0C0E0B' }}>
                            {certificate.certificateNo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(certificate.certificateDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium" style={{ color: '#0C0E0B' }}>
                            {certificate.patient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {certificate.patient.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: '#0C0E0B' }}>
                          {certificate.doctor.fullname}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm" style={{ color: '#0C0E0B' }}>
                            {formatDate(certificate.restStartDate)} - {formatDate(certificate.restEndDate)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ({certificate.totalDays} days)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(certificate.status)}`}>
                          {certificate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleGeneratePDF(certificate)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Generate PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(certificate)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(certificate)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MedicalCertificateList;
