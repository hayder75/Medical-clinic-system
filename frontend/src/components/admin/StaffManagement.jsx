import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react';
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
    licenseNumber: ''
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
    { value: 'General Doctor', label: 'General Doctor/General Practitioner' },
    { value: 'Dentist', label: 'Dentist (Dental Specialist)' },
    { value: 'Ophthalmologist', label: 'Ophthalmologist (Eye Doctor)' },
    { value: 'Radiologist', label: 'Radiologist (Imaging Specialist)' },
    { value: 'Orthodontist', label: 'Orthodontist (Teeth Alignment)' },
    { value: 'Periodontist', label: 'Periodontist (Gum Specialist)' },
    { value: 'Endodontist', label: 'Endodontist (Root Canal Specialist)' },
    { value: 'Cardiologist', label: 'Cardiologist (Heart Specialist)' }
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
        if (!formData.consultationFee || formData.consultationFee <= 0) {
          toast.error('Please enter a valid consultation fee for doctors');
          return;
        }
      }

      // Clean up form data before sending
      const cleanedData = {
        ...formData,
        specialties: formData.role === 'DOCTOR' ? formData.specialties : [],
        consultationFee: formData.role === 'DOCTOR' && formData.consultationFee ? parseFloat(formData.consultationFee) : undefined,
        licenseNumber: formData.role === 'DOCTOR' && formData.licenseNumber ? formData.licenseNumber : undefined,
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
        licenseNumber: ''
      });
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save staff member');
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
      licenseNumber: staffMember.licenseNumber || ''
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-600">Manage hospital staff members and their roles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Staff Member
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff members..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              className="input"
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
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Specialties</th>
                <th>Consultation Fee</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => (
                <tr key={member.id}>
                  <td className="font-medium">{member.fullname || 'N/A'}</td>
                  <td>{member.username}</td>
                  <td>
                    <span className="badge badge-info">
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
                  <td>
                    {member.consultationFee ? `$${member.consultationFee}` : 'N/A'}
                  </td>
                  <td>{member.email || 'N/A'}</td>
                  <td>{member.phone || 'N/A'}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 hover:text-red-800"
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
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Username *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="label">Password {!editingStaff && '*'}</label>
                  <input
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingStaff}
                  />
                </div>
                
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.fullname}
                    onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="label">Role *</label>
                  <select
                    className="input"
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
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                

                {/* Doctor-specific fields */}
                {formData.role === 'DOCTOR' && (
                  <>
                    <div>
                      <label className="label">Specialties</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {specialties.map((specialty) => (
                          <label key={specialty.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.specialties.includes(specialty.value)}
                              onChange={() => handleSpecialtyChange(specialty.value)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{specialty.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="label">Consultation Fee ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                        value={formData.consultationFee}
                        onChange={(e) => setFormData({...formData, consultationFee: e.target.value})}
                        placeholder="0.00"
                        required={formData.role === 'DOCTOR'}
                      />
                    </div>

                    <div>
                      <label className="label">License Number</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                        placeholder="Medical license number"
                      />
                    </div>
                  </>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
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
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
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
