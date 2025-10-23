import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, Edit, Trash2, Eye, Download, Calendar, User, FileText, Printer } from 'lucide-react';
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

  const handlePrint = (certificate) => {
    // Create a temporary print component
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Certificate - ${certificate.certificateNo}</title>
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              font-family: Arial, sans-serif !important;
            }
            
            @page {
              margin: 0.25in;
              size: A4;
            }
            
            .certificate-content {
              page-break-inside: avoid;
              margin: 0;
              padding: 10px;
              max-width: none;
              height: 100vh;
              overflow: hidden;
            }
            
            h1, h2, h3, p, span, div {
              color: black !important;
            }
            
            .text-center { text-align: center; }
            .text-lg { font-size: 18px; }
            .text-3xl { font-size: 30px; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .uppercase { text-transform: uppercase; }
            .underline { text-decoration: underline; }
            .border-b { border-bottom: 1px solid #ccc; }
            .border-gray-300 { border-color: #ccc; }
            .py-8 { padding-top: 16px; padding-bottom: 16px; }
            .py-6 { padding-top: 12px; padding-bottom: 12px; }
            .py-4 { padding-top: 8px; padding-bottom: 8px; }
            .py-2 { padding-top: 4px; padding-bottom: 4px; }
            .mb-4 { margin-bottom: 8px; }
            .mb-2 { margin-bottom: 4px; }
            .mb-1 { margin-bottom: 2px; }
            .space-y-2 > * + * { margin-top: 4px; }
            .space-y-4 > * + * { margin-top: 8px; }
            
            /* Compact layout for single page */
            .text-3xl { font-size: 24px; }
            .text-lg { font-size: 14px; }
            .text-sm { font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="certificate-content">
            ${generateCertificateHTML(certificate)}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const generateCertificateHTML = (certificate) => {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const calculateAge = (dob) => {
      if (!dob) return '';
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const calculateTotalDays = (startDate, endDate) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    };

    return `
      <!-- Header -->
      <div class="text-center py-4 border-b border-gray-300">
        <h1 class="text-3xl font-bold text-black mb-1">Dr. Nigussie</h1>
        <p class="text-lg text-black mb-1">Piassa Awash Bank Building, Hawassa, Hawassa, Ethiopia</p>
        <p class="text-lg text-black">Phone: 0462126023 | Email: drnigussie@gmail.com</p>
      </div>

      <!-- Certificate Title -->
      <div class="text-center py-4 border-b border-gray-300">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;"></div>
          <h2 class="text-3xl font-bold text-black uppercase">MEDICAL CERTIFICATE</h2>
          <div style="flex: 1; text-align: right;">
            <p class="text-lg text-black">Certificate No.: ${certificate.certificateNo}</p>
          </div>
        </div>
      </div>

      <!-- Patient Information -->
      <div class="py-3 border-b border-gray-300">
        <h3 class="text-lg font-bold text-black underline mb-2">Patient Information</h3>
        <div class="space-y-2">
          <p class="text-black"><strong>Name:</strong> ${certificate.patient.name}</p>
          <p class="text-black"><strong>Gender:</strong> ${certificate.patient.gender || 'Not specified'}</p>
          <p class="text-black"><strong>Age:</strong> ${calculateAge(certificate.patient.dob)} years</p>
        </div>
      </div>

      <!-- Certificate Details -->
      <div class="py-3 border-b border-gray-300">
        <h3 class="text-lg font-bold text-black underline mb-2">Certificate Details</h3>
        <div class="space-y-2">
          <p class="text-black"><strong>Date Issued:</strong> ${formatDate(certificate.certificateDate)}</p>
        </div>
      </div>

      <!-- Medical Information -->
      <div class="py-3 border-b border-gray-300">
        <h3 class="text-lg font-bold text-black underline mb-2">Medical Information</h3>
        <div class="space-y-2">
          <p class="text-black"><strong>Diagnosis:</strong> ${certificate.diagnosis}</p>
          <p class="text-black"><strong>Treatment:</strong> ${certificate.treatment}</p>
          <p class="text-black"><strong>Recommendations:</strong> ${certificate.recommendations}</p>
        </div>
      </div>

      <!-- Rest Period -->
      <div class="py-3 border-b border-gray-300">
        <h3 class="text-lg font-bold text-black underline text-center mb-2">Rest Period</h3>
        <div class="text-center">
          <p class="text-lg text-black mb-1">
            From ${formatDate(certificate.restStartDate)} to ${formatDate(certificate.restEndDate)}
          </p>
          <p class="text-lg text-black">
            (Total of ${calculateTotalDays(certificate.restStartDate, certificate.restEndDate)} days)
          </p>
        </div>
      </div>

      <!-- Issued By -->
      <div class="py-3">
        <h3 class="text-lg font-bold text-black underline mb-2">Issued By</h3>
        <div class="space-y-2">
          <p class="text-black"><strong>Name:</strong> ${certificate.doctor.fullname}</p>
          <p class="text-black"><strong>Specialization:</strong> ${certificate.doctor.specialties || 'General Doctor'}</p>
        </div>
      </div>

      <!-- Footer Line -->
      <div class="border-t border-gray-300 pt-2">
        <div class="text-center text-sm text-gray-600">
          <p>This certificate is issued for medical purposes only.</p>
        </div>
      </div>
    `;
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--dark)' }}>
            Medical Certificates
          </h1>
          <p className="text-gray-600 mt-1">
            Manage patient medical certificates and sick leave documents
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 text-white rounded-md transition-colors flex items-center space-x-2"
          style={{ backgroundColor: 'var(--primary)' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary)'}
        >
          <Plus className="h-5 w-5" />
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
              className="w-full px-3 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                borderColor: 'var(--primary)',
                '--tw-ring-color': 'var(--primary)'
              }}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-white rounded-md transition-colors"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary)'}
          >
            Search
          </button>
        </form>
      </div>

      {/* Certificates List */}
      <div className="bg-white rounded-lg shadow-md">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--primary)' }}></div>
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
                          <div className="text-sm font-medium" style={{ color: 'var(--dark)' }}>
                            {certificate.certificateNo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(certificate.certificateDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--dark)' }}>
                            {certificate.patient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {certificate.patient.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: 'var(--dark)' }}>
                          {certificate.doctor.fullname}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm" style={{ color: 'var(--dark)' }}>
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
                            onClick={() => handlePrint(certificate)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Print Certificate"
                          >
                            <Printer className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleGeneratePDF(certificate)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Generate PDF"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(certificate)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(certificate)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
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
