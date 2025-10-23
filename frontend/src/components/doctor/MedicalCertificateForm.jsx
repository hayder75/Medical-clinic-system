import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Search, Calendar, User, FileText, Save, X } from 'lucide-react';
import api from '../../services/api';

const MedicalCertificateForm = ({ certificate, onSave, onCancel, isEditing = false }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    visitId: '',
    certificateDate: new Date().toISOString().split('T')[0],
    restStartDate: '',
    restEndDate: '',
    diagnosis: '',
    treatment: '',
    recommendations: '',
  });
  
  const [patients, setPatients] = useState([]);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (certificate && isEditing) {
      setFormData({
        patientId: certificate.patientId || '',
        patientName: certificate.patient?.name || '',
        visitId: certificate.visitId || '',
        certificateDate: certificate.certificateDate ? new Date(certificate.certificateDate).toISOString().split('T')[0] : '',
        restStartDate: certificate.restStartDate ? new Date(certificate.restStartDate).toISOString().split('T')[0] : '',
        restEndDate: certificate.restEndDate ? new Date(certificate.restEndDate).toISOString().split('T')[0] : '',
        diagnosis: certificate.diagnosis || '',
        treatment: certificate.treatment || '',
        recommendations: certificate.recommendations || '',
      });
    }
  }, [certificate, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePatientSearch = async (query) => {
    if (query.length < 2) {
      setPatients([]);
      return;
    }
    
    try {
      const response = await api.get(`/medical-certificates/search-patients?query=${query}&type=name`);
      setPatients(response.data.patients);
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Error searching patients');
    }
  };

  const handlePatientSelect = (patient) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name
    }));
    setShowPatientSearch(false);
    setSearchQuery('');
    setPatients([]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.patientId) {
      newErrors.patientId = 'Patient is required';
    }
    
    if (!formData.restStartDate) {
      newErrors.restStartDate = 'Rest start date is required';
    }
    
    if (!formData.restEndDate) {
      newErrors.restEndDate = 'Rest end date is required';
    }
    
    if (formData.restStartDate && formData.restEndDate) {
      const startDate = new Date(formData.restStartDate);
      const endDate = new Date(formData.restEndDate);
      
      if (endDate <= startDate) {
        newErrors.restEndDate = 'Rest end date must be after start date';
      }
    }
    
    if (!formData.diagnosis.trim()) {
      newErrors.diagnosis = 'Diagnosis is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        patientId: formData.patientId,
        visitId: formData.visitId ? parseInt(formData.visitId) : undefined,
        certificateDate: formData.certificateDate,
        restStartDate: formData.restStartDate,
        restEndDate: formData.restEndDate,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        recommendations: formData.recommendations,
      };
      
      let response;
      if (isEditing) {
        response = await api.put(`/medical-certificates/${certificate.id}`, payload);
      } else {
        response = await api.post('/medical-certificates', payload);
      }
      
      toast.success(isEditing ? 'Certificate updated successfully' : 'Certificate created successfully');
      onSave(response.data.certificate);
    } catch (error) {
      console.error('Error saving certificate:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to save certificate');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: '#0C0E0B' }}>
          {isEditing ? 'Edit Medical Certificate' : 'Create Medical Certificate'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" style={{ color: '#2e13d1' }} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: '#0C0E0B' }}>
            Patient *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.patientName}
              placeholder="Search and select patient..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: '#E5E7EB' }}
              onClick={() => setShowPatientSearch(true)}
              readOnly
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {errors.patientId && (
            <p className="text-sm text-red-600">{errors.patientId}</p>
          )}
          
          {/* Patient Search Modal */}
          {showPatientSearch && (
            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
              <div className="p-3 border-b">
                <input
                  type="text"
                  placeholder="Search patients by name..."
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handlePatientSearch(e.target.value);
                  }}
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {patients.length > 0 ? (
                  patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="font-medium" style={{ color: '#0C0E0B' }}>
                        {patient.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {patient.id} | {patient.gender} | {patient.mobile}
                      </div>
                    </div>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="p-3 text-gray-500 text-center">
                    No patients found
                  </div>
                ) : (
                  <div className="p-3 text-gray-500 text-center">
                    Type at least 2 characters to search
                  </div>
                )}
              </div>
              <div className="p-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowPatientSearch(false);
                    setSearchQuery('');
                    setPatients([]);
                  }}
                  className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Certificate Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: '#0C0E0B' }}>
            Certificate Date
          </label>
          <div className="relative">
            <input
              type="date"
              name="certificateDate"
              value={formData.certificateDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: '#E5E7EB' }}
            />
            <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Rest Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#0C0E0B' }}>
              Rest Start Date *
            </label>
            <div className="relative">
              <input
                type="date"
                name="restStartDate"
                value={formData.restStartDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: errors.restStartDate ? '#EA2E00' : '#E5E7EB' }}
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.restStartDate && (
              <p className="text-sm text-red-600">{errors.restStartDate}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#0C0E0B' }}>
              Rest End Date *
            </label>
            <div className="relative">
              <input
                type="date"
                name="restEndDate"
                value={formData.restEndDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: errors.restEndDate ? '#EA2E00' : '#E5E7EB' }}
              />
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.restEndDate && (
              <p className="text-sm text-red-600">{errors.restEndDate}</p>
            )}
          </div>
        </div>

        {/* Medical Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium" style={{ color: '#0C0E0B' }}>
            Medical Information
          </h3>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#0C0E0B' }}>
              Diagnosis *
            </label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              rows={3}
              placeholder="Enter diagnosis..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: errors.diagnosis ? '#EA2E00' : '#E5E7EB' }}
            />
            {errors.diagnosis && (
              <p className="text-sm text-red-600">{errors.diagnosis}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#0C0E0B' }}>
              Treatment
            </label>
            <textarea
              name="treatment"
              value={formData.treatment}
              onChange={handleInputChange}
              rows={3}
              placeholder="Enter treatment details..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: '#0C0E0B' }}>
              Recommendations
            </label>
            <textarea
              name="recommendations"
              value={formData.recommendations}
              onChange={handleInputChange}
              rows={3}
              placeholder="Enter recommendations..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-white rounded-md transition-colors flex items-center space-x-2"
            style={{ backgroundColor: '#2e13d1' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0D2A5A'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2e13d1'}
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicalCertificateForm;
