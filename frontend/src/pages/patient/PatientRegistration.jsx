import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Phone, Mail, MapPin, Heart, Calendar, CreditCard, Search, UserPlus, Clock, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PatientAttachedImagesSection from '../../components/common/PatientAttachedImagesSection';

const PatientRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [visit, setVisit] = useState(null);
  const [billing, setBilling] = useState(null);
  const [step, setStep] = useState(1); // 1: Registration Type, 2: Search/Register, 3: Billing, 4: Payment
  const [insurances, setInsurances] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    transNumber: ''
  });
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [paymentErrors, setPaymentErrors] = useState({});
  
  // New state for patient search
  const [registrationType, setRegistrationType] = useState(''); // 'new' or 'existing'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name', 'id', 'phone'
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  useEffect(() => {
    fetchInsurances();
  }, []);

  const fetchInsurances = async () => {
    try {
      const response = await api.get('/billing/insurances');
      setInsurances(response.data.insurances || []);
    } catch (error) {
      console.error('Error fetching insurances:', error);
    }
  };

  // Search for existing patients
  const searchPatients = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast.error('Please enter at least 2 characters to search');
      return;
    }

    try {
      setSearchLoading(true);
      const response = await api.get('/patients/search', {
        params: {
          query: searchQuery,
          type: searchType
        }
      });
      
      setSearchResults(response.data.patients || []);
      setShowSearchResults(true);
      
      if (response.data.patients.length === 0) {
        toast.info('No patients found with that search criteria');
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Error searching patients');
    } finally {
      setSearchLoading(false);
    }
  };

  // Select a patient from search results
  const selectPatient = async (patient) => {
    try {
      setLoading(true);
      
      // First check if patient can create a new visit
      const statusResponse = await api.get(`/billing/check-visit-status/${patient.id}`);
      
      if (!statusResponse.data.canCreateVisit) {
        toast.error(`${statusResponse.data.reason}. ${statusResponse.data.suggestion || 'Please complete the current visit first.'}`);
        return;
      }
      
      const response = await api.get(`/patients/${patient.id}/for-visit`);
      
      setSelectedPatient(response.data.patient);
      setPatient(response.data.patient);
      setShowSearchResults(false);
      setSearchQuery('');
      
      // Create visit for existing patient
      const visitResponse = await api.post('/billing/create-visit', {
        patientId: patient.id,
        type: 'REGULAR',
        notes: 'Returning patient visit'
      });
      
      setVisit(visitResponse.data.visit);
      setBilling(visitResponse.data.billing);
      setStep(3); // Skip to billing step
      toast.success('Patient found! Visit created successfully');
      
    } catch (error) {
      console.error('Error selecting patient:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.reason) {
        toast.error(`${error.response.data.reason}. ${error.response.data.suggestion || 'Please complete the current visit first.'}`);
      } else {
        toast.error('Error creating visit for patient');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Register patient
      const patientResponse = await api.post('/billing/register', {
        name: data.name,
        type: data.type,
        dob: data.dob,
        gender: data.gender,
        mobile: data.mobile,
        email: data.email,
        address: data.address,
        emergencyContact: data.emergencyContact,
        bloodType: data.bloodType,
        maritalStatus: data.maritalStatus,
        insuranceId: data.insuranceId || null
      });

      setPatient(patientResponse.data.patient);
      setVisit(patientResponse.data.visit);
      setBilling(patientResponse.data.billing);
      setStep(3); // Skip to billing step
      toast.success('Patient registered successfully!');
      
    } catch (error) {
      // Handle duplicate patient error
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        toast.error(errorData.error);
        
        // Show suggestion to search for existing patient
        if (errorData.existingPatient) {
          setRegistrationType('existing');
          setSearchQuery(errorData.existingPatient.mobile || errorData.existingPatient.name);
          setSearchType(errorData.existingPatient.mobile ? 'phone' : 'name');
          setStep(2);
        }
      } else {
        toast.error(error.response?.data?.error || 'Failed to register patient');
      }
    } finally {
      setLoading(false);
    }
  };

  // Clean payment validation
  const validatePayment = () => {
    const errors = {};
    
    if (!paymentMethod) {
      errors.paymentMethod = 'Please select a payment method';
    }
    
    if (paymentMethod === 'BANK') {
      if (!bankDetails.bankName.trim()) {
        errors.bankName = 'Bank name is required for bank transfers';
      }
      if (!bankDetails.transNumber.trim()) {
        errors.transNumber = 'Transaction number is required for bank transfers';
      }
    }
    
    if (paymentMethod === 'INSURANCE' && !selectedInsurance) {
      errors.insuranceId = 'Please select an insurance provider';
    }
    
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePayment = async () => {
    // Clear previous errors
    setPaymentErrors({});
    
    // Validate payment form
    if (!validatePayment()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    if (!billing) {
      toast.error('No billing information available. Please try registering again.');
      return;
    }
    
    try {
      setLoading(true);
      
      const paymentData = {
        billingId: billing.id,
        amount: Number(billing.totalAmount),
        type: paymentMethod,
        bankName: bankDetails.bankName || null,
        transNumber: bankDetails.transNumber || null,
        insuranceId: selectedInsurance || null,
        notes: `Payment method: ${paymentMethod}`
      };

      const response = await api.post('/billing/payments', paymentData);

      toast.success('Payment processed successfully!');
      setStep(4);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset();
    setPatient(null);
    setVisit(null);
    setBilling(null);
    setStep(1);
    setPaymentMethod('');
    setBankDetails({ bankName: '', transNumber: '' });
    setSelectedInsurance('');
    setPaymentErrors({});
    setRegistrationType('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPatient(null);
    setShowSearchResults(false);
  };

  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="text-center mb-8">
            <User className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Patient Registration</h1>
            <p className="text-gray-600">Choose how to proceed with patient registration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* New Patient Registration */}
            <div 
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                registrationType === 'new' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setRegistrationType('new')}
            >
              <div className="text-center">
                <UserPlus className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">New Patient</h3>
                <p className="text-gray-600 mb-4">Register a completely new patient in the system</p>
                <div className="text-sm text-gray-500">
                  <p>• First time visiting</p>
                  <p>• Complete registration required</p>
                  <p>• New patient ID generated</p>
                </div>
              </div>
            </div>

            {/* Existing Patient Search */}
            <div 
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                registrationType === 'existing' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setRegistrationType('existing')}
            >
              <div className="text-center">
                <Search className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Returning Patient</h3>
                <p className="text-gray-600 mb-4">Search for an existing patient and create a new visit</p>
                <div className="text-sm text-gray-500">
                  <p>• Patient already in system</p>
                  <p>• Search by name, ID, or phone</p>
                  <p>• Create new visit only</p>
                </div>
              </div>
            </div>
          </div>

          {registrationType && (
            <div className="flex justify-center">
              <button
                onClick={() => setStep(2)}
                className="btn btn-primary btn-lg"
              >
                Continue with {registrationType === 'new' ? 'New Patient' : 'Returning Patient'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 2) {
    // New Patient Registration Form
    if (registrationType === 'new') {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="text-center mb-8">
              <UserPlus className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900">New Patient Registration</h1>
              <p className="text-gray-600">Register a new patient in the system</p>
            </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="label">Date of Birth *</label>
                <input
                  type="date"
                  className="input"
                  {...register('dob', { required: 'Date of birth is required' })}
                />
                {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob.message}</p>}
              </div>

              <div>
                <label className="label">Gender *</label>
                <select className="input" {...register('gender', { required: 'Gender is required' })}>
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
              </div>

              <div>
                <label className="label">Patient Type *</label>
                <select className="input" {...register('type', { required: 'Patient type is required' })}>
                  <option value="">Select Type</option>
                  <option value="REGULAR">Regular</option>
                  <option value="INSURANCE">Insurance</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    className="input pl-10"
                    placeholder="0912345678"
                    {...register('mobile', { 
                      required: 'Mobile number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Please enter a valid 10-digit mobile number'
                      }
                    })}
                  />
                </div>
                {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>}
              </div>

              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="patient@email.com"
                    {...register('email', {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="label">Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  className="input pl-10"
                  rows="3"
                  placeholder="Enter full address"
                  {...register('address', { required: 'Address is required' })}
                />
              </div>
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>

            {/* Medical Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="label">Blood Type</label>
                <select className="input" {...register('bloodType')}>
                  <option value="">Select Blood Type</option>
                  <option value="A_PLUS">A+</option>
                  <option value="A_MINUS">A-</option>
                  <option value="B_PLUS">B+</option>
                  <option value="B_MINUS">B-</option>
                  <option value="AB_PLUS">AB+</option>
                  <option value="AB_MINUS">AB-</option>
                  <option value="O_PLUS">O+</option>
                  <option value="O_MINUS">O-</option>
                </select>
              </div>

              <div>
                <label className="label">Marital Status</label>
                <select className="input" {...register('maritalStatus')}>
                  <option value="">Select Status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>

              <div>
                <label className="label">Insurance ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Optional"
                  {...register('insuranceId')}
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="label">Emergency Contact *</label>
              <input
                type="text"
                className="input"
                placeholder="Name - Phone Number"
                {...register('emergencyContact', { required: 'Emergency contact is required' })}
              />
              {errors.emergencyContact && <p className="text-red-500 text-sm mt-1">{errors.emergencyContact.message}</p>}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-outline"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Registering...' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
    }

    // Existing Patient Search Form
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="text-center mb-8">
            <Search className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Search Existing Patient</h1>
            <p className="text-gray-600">Find an existing patient to create a new visit</p>
          </div>

          <div className="space-y-6">
            {/* Search Form */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="label">Search Type</label>
                  <select
                    className="input"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                  >
                    <option value="name">By Name</option>
                    <option value="id">By Patient ID</option>
                    <option value="phone">By Phone Number</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Search Query</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="input flex-1"
                      placeholder={
                        searchType === 'name' ? 'Enter patient name...' :
                        searchType === 'id' ? 'Enter patient ID (e.g., PAT-2025-01)...' :
                        'Enter phone number...'
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                    />
                    <button
                      type="button"
                      onClick={searchPatients}
                      disabled={searchLoading || !searchQuery.trim()}
                      className="btn btn-primary"
                    >
                      {searchLoading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Results */}
            {showSearchResults && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Search Results ({searchResults.length} found)
                </h3>
                
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer"
                        onClick={() => selectPatient(patient)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <User className="h-8 w-8 text-primary-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                                <p className="text-sm text-gray-600">
                                  ID: {patient.id} • {patient.mobile} • {patient.type}
                                </p>
                                {patient.email && (
                                  <p className="text-sm text-gray-500">{patient.email}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectPatient(patient);
                              }}
                              disabled={loading}
                              className="btn btn-primary btn-sm"
                            >
                              {loading ? 'Creating...' : 'Create Visit'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No patients found matching your search criteria</p>
                    <p className="text-sm">Try a different search term or search type</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="btn btn-secondary"
              >
                Back
              </button>
              <button
                onClick={resetForm}
                className="btn btn-outline"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="text-center mb-8">
            <CreditCard className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Payment Required</h1>
            <p className="text-gray-600">Complete payment to proceed with registration</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Patient Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{patient?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient ID:</span>
                  <span className="font-medium font-mono">{patient?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{patient?.type?.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobile:</span>
                  <span className="font-medium">{patient?.mobile}</span>
                </div>
              </div>
            </div>

            {/* Billing Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing ID:</span>
                  <span className="font-medium font-mono">{billing?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">Entry Fee</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{billing?.totalAmount} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="badge badge-warning">Pending</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Payment Methods</h4>
            
            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="label">Payment Method *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`btn ${paymentMethod === 'CASH' ? 'btn-success' : 'btn-outline'}`}
                  disabled={loading}
                >
                  Cash Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK')}
                  className={`btn ${paymentMethod === 'BANK' ? 'btn-primary' : 'btn-outline'}`}
                  disabled={loading}
                >
                  Bank Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('INSURANCE')}
                  className={`btn ${paymentMethod === 'INSURANCE' ? 'btn-secondary' : 'btn-outline'}`}
                  disabled={loading}
                >
                  Insurance
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CHARITY')}
                  className={`btn ${paymentMethod === 'CHARITY' ? 'btn-warning' : 'btn-outline'}`}
                  disabled={loading}
                >
                  Charity
                </button>
              </div>
              {paymentErrors.paymentMethod && (
                <p className="text-red-500 text-sm mt-1">{paymentErrors.paymentMethod}</p>
              )}
            </div>

            {/* Bank Transfer Details */}
            {paymentMethod === 'BANK' && (
              <div className="space-y-4 mb-6">
                <h5 className="font-medium text-gray-900">Bank Transfer Details</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Bank Name *</label>
                    <input
                      type="text"
                      className={`input ${paymentErrors.bankName ? 'border-red-500' : ''}`}
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                      placeholder="Enter bank name"
                    />
                    {paymentErrors.bankName && (
                      <p className="text-red-500 text-sm mt-1">{paymentErrors.bankName}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Transaction Number *</label>
                    <input
                      type="text"
                      className={`input ${paymentErrors.transNumber ? 'border-red-500' : ''}`}
                      value={bankDetails.transNumber}
                      onChange={(e) => setBankDetails({...bankDetails, transNumber: e.target.value})}
                      placeholder="Enter transaction number"
                    />
                    {paymentErrors.transNumber && (
                      <p className="text-red-500 text-sm mt-1">{paymentErrors.transNumber}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Insurance Selection */}
            {paymentMethod === 'INSURANCE' && (
              <div className="space-y-4 mb-6">
                <h5 className="font-medium text-gray-900">Select Insurance Provider</h5>
                <select
                  className={`input ${paymentErrors.insuranceId ? 'border-red-500' : ''}`}
                  value={selectedInsurance}
                  onChange={(e) => setSelectedInsurance(e.target.value)}
                >
                  <option value="">Select Insurance Provider</option>
                  {insurances.map((insurance) => (
                    <option key={insurance.id} value={insurance.id}>
                      {insurance.name} ({insurance.code})
                    </option>
                  ))}
                </select>
                {paymentErrors.insuranceId && (
                  <p className="text-red-500 text-sm mt-1">{paymentErrors.insuranceId}</p>
                )}
              </div>
            )}

            {/* Attached Medical Images Section */}
            {visit && patient && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <PatientAttachedImagesSection
                  visitId={visit.id}
                  patientId={patient.id}
                  title="Attached Medical Images (Optional)"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Upload X-rays, lab reports, or other medical documents the patient brought from other hospitals
                </p>
              </div>
            )}

            {/* Process Payment Button */}
            {paymentMethod && (
              <div className="flex justify-end">
                <button
                  onClick={handlePayment}
                  className="btn btn-primary"
                  disabled={loading || (paymentMethod === 'INSURANCE' && !selectedInsurance)}
                >
                  {loading ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="mb-6">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Registration Complete!</h1>
            <p className="text-gray-600 mt-2">Patient has been successfully registered and payment processed</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Patient Details */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Details</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient ID:</span>
                  <span className="font-medium font-mono">{patient?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{patient?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visit ID:</span>
                  <span className="font-medium font-mono">{visit?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="badge badge-success">Registered & Paid</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment:</span>
                  <span className="font-medium text-green-600">ETB {billing?.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-medium">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Vital Checkup</p>
                    <p className="text-sm text-gray-600">Proceed to nurse station for vital signs measurement</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-medium">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Triage Assessment</p>
                    <p className="text-sm text-gray-600">Nurse will assess urgency and assign priority</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-medium">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Doctor Assignment</p>
                    <p className="text-sm text-gray-600">Wait for doctor assignment based on specialty</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.location.href = '/billing/queue'}
                className="btn btn-primary btn-lg flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View Billing Queue
              </button>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={resetForm}
                className="btn btn-outline"
              >
                Register Another Patient
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PatientRegistration;
