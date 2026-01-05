import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, Filter, UserCheck, UserX } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullname: '',
    role: 'DOCTOR',
    email: '',
    phone: '',
    specialties: [],
    consultationFee: '',
    licenseNumber: '',
    waiveConsultationFee: false
  });

  const roles = [
    { value: 'DOCTOR', label: 'Doctor' },
    { value: 'NURSE', label: 'Nurse' },
    { value: 'RECEPTIONIST', label: 'Receptionist' },
    { value: 'RADIOLOGIST', label: 'Radiologist' },
    { value: 'LAB_TECHNICIAN', label: 'Lab Technician' },
    { value: 'PHARMACIST', label: 'Pharmacist' },
    { value: 'BILLING_OFFICER', label: 'Billing Officer' },
    { value: 'PHARMACY_BILLING_OFFICER', label: 'Pharmacy Billing Officer' }
  ];

  const specialties = [
    { value: 'General Doctor', label: 'General Doctor' },
    { value: 'Dentist', label: 'Dentist' },
    { value: 'Cardiologist', label: 'Cardiologist (Heart)' },
    { value: 'Ophthalmologist', label: 'Ophthalmologist (Eye Doctor)' }
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setStaff(response.data.users || []);
    } catch (error) {
      toast.error('Failed to fetch staff data');
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate doctor-specific fields
      if (formData.role === 'DOCTOR') {
        if (!formData.specialties || formData.specialties.length === 0) {
          toast.error('Please select at least one specialty for doctors');
          return;
        }
        // Only require consultation fee if not waived
        if (!formData.waiveConsultationFee && (!formData.consultationFee || formData.consultationFee <= 0)) {
          toast.error('Please enter a valid consultation fee for doctors, or check "Waive Consultation Fee"');
          return;
        }
      }

      // Clean up form data before sending
      const cleanedData = {
        ...formData,
        specialties: formData.role === 'DOCTOR' ? formData.specialties : [],
        // Set consultation fee to 0 if waived, otherwise use the provided value
        consultationFee: formData.role === 'DOCTOR' 
          ? (formData.waiveConsultationFee ? 0 : (formData.consultationFee ? parseFloat(formData.consultationFee) : undefined))
          : undefined,
        licenseNumber: formData.role === 'DOCTOR' && formData.licenseNumber ? formData.licenseNumber : undefined,
        waiveConsultationFee: formData.role === 'DOCTOR' ? (formData.waiveConsultationFee || false) : undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined
      };

      // Remove empty strings and undefined values
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '' || cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });

      if (editingStaff) {
        await api.put(`/admin/users/${editingStaff.id}`, cleanedData);
        toast.success('Staff member updated successfully');
      } else {
        await api.post('/admin/users', cleanedData);
        toast.success('Staff member created successfully');
      }
      setShowModal(false);
      setEditingStaff(null);
      setFormData({
        username: '',
        password: '',
        fullname: '',
        role: 'DOCTOR',
        email: '',
        phone: '',
        specialties: [],
        consultationFee: '',
        licenseNumber: '',
        waiveConsultationFee: false
      });
      fetchStaff();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to save staff member';
      const errorDetails = error.response?.data?.details;
      if (errorDetails && Array.isArray(errorDetails)) {
        const detailsMessage = errorDetails.map(d => d.message || d.path?.join('.')).join(', ');
        toast.error(`${errorMessage}: ${detailsMessage}`);
      } else {
        toast.error(errorMessage);
      }
      console.error('Error saving staff member:', error.response?.data || error);
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      username: staffMember.username,
      password: '',
      fullname: staffMember.fullname || '',
      role: staffMember.role,
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      specialties: staffMember.specialties || [],
      consultationFee: staffMember.consultationFee || '',
      licenseNumber: staffMember.licenseNumber || '',
      waiveConsultationFee: staffMember.waiveConsultationFee || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        toast.success('Staff member deleted successfully');
        fetchStaff();
      } catch (error) {
        toast.error('Failed to delete staff member');
      }
    }
  };

  const handleToggleStatus = async (member) => {
    const action = member.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${member.fullname || member.username}?`)) {
      return;
    }

    try {
      await api.patch(`/auth/toggle-status/${member.id}`, {
        isActive: !member.isActive
      });
      toast.success(`User ${action}d successfully`);
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${action} user`);
    }
  };

  const handleSpecialtyChange = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.fullname?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-lg text-gray-600">Manage hospital staff members and their roles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center text-lg px-6 py-3"
        >
          <Plus className="h-6 w-6 mr-2" />
          Add Staff Member
        </button>
      </div>

      {/* Filters */}
      <div className="card w-full">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff members..."
                className="input pl-12 text-lg py-3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-56">
            <select
              className="input text-lg py-3"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        <table className="table w-full" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              <th className="text-base" style={{ width: '15%' }}>Name</th>
              <th className="text-base" style={{ width: '12%' }}>Username</th>
              <th className="text-base" style={{ width: '12%' }}>Role</th>
              <th className="text-base" style={{ width: '15%' }}>Specialties</th>
              <th className="text-base" style={{ width: '8%' }}>Fee</th>
              <th className="text-base" style={{ width: '15%' }}>Email</th>
              <th className="text-base" style={{ width: '11%' }}>Phone</th>
              <th className="text-base" style={{ width: '12%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member) => (
              <tr key={member.id} className={!member.isActive ? 'bg-red-50' : ''}>
                <td className="font-medium text-base break-words">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className={!member.isActive ? 'text-red-700' : ''}>{member.fullname || 'N/A'}</span>
                    {!member.isActive && (
                      <span className="badge badge-error text-xs font-bold">INACTIVE</span>
                    )}
                  </div>
                </td>
                <td className={`text-base break-words ${!member.isActive ? 'text-red-600' : ''}`}>{member.username}</td>
                <td>
                  <span className={`badge text-sm ${!member.isActive ? 'badge-error' : 'badge-info'}`}>
                    {roles.find(r => r.value === member.role)?.label || member.role}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {member.specialties?.map((specialty, index) => (
                      <span key={index} className="badge badge-secondary text-xs">
                        {specialty}
                      </span>
                    )) || 'N/A'}
                  </div>
                </td>
                <td className={`text-base ${!member.isActive ? 'text-red-600' : ''}`}>
                  {member.consultationFee ? `$${member.consultationFee}` : 'N/A'}
                </td>
                <td className={`text-base break-words ${!member.isActive ? 'text-red-600' : ''}`}>{member.email || 'N/A'}</td>
                <td className={`text-base ${!member.isActive ? 'text-red-600' : ''}`}>{member.phone || 'N/A'}</td>
                <td>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => handleToggleStatus(member)}
                      className={`px-1.5 py-1 rounded text-xs font-medium flex items-center gap-0.5 whitespace-nowrap ${
                        member.isActive 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {member.isActive ? (
                        <>
                          <UserX className="h-3 w-3" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3 w-3" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(member)}
                      className="px-1.5 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-0.5 whitespace-nowrap"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="px-1.5 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-0.5 whitespace-nowrap"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label text-lg">Username *</label>
                    <input
                      type="text"
                      className="input text-lg"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label text-lg">Password {!editingStaff && '*'}</label>
                    <input
                      type="password"
                      className="input text-lg"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      minLength={4}
                      required={!editingStaff}
                    />
                    {!editingStaff && (
                      <p className="text-sm text-gray-500 mt-1">Min 4 characters</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="label text-lg">Full Name</label>
                    <input
                      type="text"
                      className="input text-lg"
                      value={formData.fullname}
                      onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="label text-lg">Role *</label>
                    <select
                      className="input text-lg"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      required
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="label text-lg">Email (optional)</label>
                    <input
                      type="email"
                      className="input text-lg"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="label text-lg">Phone</label>
                    <input
                      type="tel"
                      className="input text-lg"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                {/* Doctor-specific fields */}
                {formData.role === 'DOCTOR' && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="col-span-3">
                      <label className="label text-lg">Specialties</label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {specialties.map((specialty) => (
                          <label key={specialty.value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.specialties.includes(specialty.value)}
                              onChange={() => handleSpecialtyChange(specialty.value)}
                              className="rounded border-gray-300 h-5 w-5"
                            />
                            <span className="text-base">{specialty.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="label text-lg">Consultation Fee ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input text-lg"
                        value={formData.consultationFee}
                        onChange={(e) => setFormData({...formData, consultationFee: e.target.value})}
                        placeholder="0.00"
                        required={formData.role === 'DOCTOR' && !formData.waiveConsultationFee}
                        disabled={formData.waiveConsultationFee}
                      />
                      {formData.waiveConsultationFee && (
                        <p className="text-sm text-gray-500 mt-1">Fee waived</p>
                      )}
                    </div>

                    <div>
                      <label className="label text-lg">License Number</label>
                      <input
                        type="text"
                        className="input text-lg"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                        placeholder="Medical license number"
                      />
                    </div>

                    <div className="flex items-center pt-8">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.waiveConsultationFee}
                          onChange={(e) => setFormData({...formData, waiveConsultationFee: e.target.checked})}
                          className="rounded border-gray-300 h-5 w-5"
                        />
                        <span className="text-lg font-medium text-gray-700">
                          Waive Consultation Fee
                        </span>
                      </label>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingStaff(null);
                      setFormData({
                        username: '',
                        password: '',
                        fullname: '',
                        role: 'DOCTOR',
                        email: '',
                        phone: '',
                        specialties: [],
                        consultationFee: '',
                        licenseNumber: ''
                      });
                    }}
                    className="btn btn-secondary text-lg px-6 py-2"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary text-lg px-6 py-2">
                    {editingStaff ? 'Update' : 'Create'}
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

export default StaffManagement;
