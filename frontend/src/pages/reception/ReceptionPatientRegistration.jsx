import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Heart, Calendar, CreditCard, Search, UserPlus, Clock, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PatientAttachedImagesSection from '../../components/common/PatientAttachedImagesSection';

const ReceptionPatientRegistration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [visit, setVisit] = useState(null);
  const [billing, setBilling] = useState(null);
  const [step, setStep] = useState(1); // 1: Registration Type, 2: Search/Register, 3: Confirmation
  
  // New state for patient search
  const [registrationType, setRegistrationType] = useState(''); // 'new' or 'existing'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name', 'id', 'phone'
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [visitType, setVisitType] = useState('REGULAR'); // 'REGULAR' or 'EMERGENCY'
  
  // Age-based date generation
  const [dateInputType, setDateInputType] = useState('date'); // 'date' or 'age'
  const [ageInput, setAgeInput] = useState('');

  // Pre-registration data from URL
  const preRegistrationData = {
    name: searchParams.get('name'),
    phone: searchParams.get('phone'),
    notes: searchParams.get('notes'),
    priority: searchParams.get('priority')
  };

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  useEffect(() => {
    // Remove insurance fetching since we don't need billing in reception
    
    // Pre-fill form if coming from pre-registration
    if (preRegistrationData.name && preRegistrationData.phone) {
      setValue('name', preRegistrationData.name);
      setValue('mobile', preRegistrationData.phone);
      setRegistrationType('new');
      setStep(2);
      
      // Show notification about pre-registration
      toast.success(`Pre-registration data loaded for ${preRegistrationData.name}`);
    }
  }, [setValue]);

  // Handle browser back button separately
  useEffect(() => {
    // Push state when step changes to allow back button
    if (step > 1) {
      window.history.pushState({ step, registrationType }, '', window.location.pathname);
    }

    const handlePopState = (e) => {
      // When browser back is pressed, go back to step 1
      if (step > 1) {
        setStep(1);
        setRegistrationType('');
        // Push state again to prevent going to dashboard
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [step, registrationType]);


  // Generate date of birth from age
  const generateDateFromAge = (age) => {
    if (!age || age < 0 || age > 120) return null;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const birthYear = currentYear - age;
    
    // Generate random month (1-12) and day (1-28 to avoid month-end issues)
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    const randomDay = Math.floor(Math.random() * 28) + 1;
    
    // Create the date
    const generatedDate = new Date(birthYear, randomMonth - 1, randomDay);
    
    // Format as YYYY-MM-DD for input field
    const formattedDate = generatedDate.toISOString().split('T')[0];
    
    return formattedDate;
  };

  // Handle age input change
  const handleAgeChange = (age) => {
    setAgeInput(age);
    if (age && age > 0 && age <= 120) {
      const generatedDate = generateDateFromAge(parseInt(age));
      if (generatedDate) {
        setValue('dob', generatedDate);
        // Only show notification when user finishes typing (not on every keystroke)
        const timeoutId = setTimeout(() => {
          toast.success(`Generated date: ${generatedDate} (Age: ${age})`);
        }, 1000); // 1 second delay
        
        // Clear previous timeout
        if (window.ageTimeout) {
          clearTimeout(window.ageTimeout);
        }
        window.ageTimeout = timeoutId;
      }
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
      const response = await api.get('/reception/patients', {
        params: {
          search: searchQuery,
          page: 1,
          limit: 20
        }
      });
      
      setSearchResults(response.data.patients || []);
      setShowSearchResults(true);
      
      if (response.data.patients.length === 0) {
        toast('No patients found with that search criteria');
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast.error(error.response?.data?.error || 'Error searching patients');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  // Select a patient from search results
  const selectPatient = async (patient) => {
    try {
      setLoading(true);
      
      // Check if patient can create a new visit (card must be active)
      if (patient.cardStatus !== 'ACTIVE') {
        toast.error(`Patient card is ${patient.cardStatus.toLowerCase()}. Please activate the card first.`);
        return;
      }
      
      setSelectedPatient(patient);
      setPatient(patient);
      setShowSearchResults(false);
      setSearchQuery('');
      
      // Create visit for existing patient
      const visitResponse = await api.post('/reception/visits', {
        patientId: patient.id,
        notes: visitType === 'EMERGENCY' ? 'Emergency visit for existing patient' : 'Returning patient visit',
        queueType: 'CONSULTATION',
        isEmergency: visitType === 'EMERGENCY'
      });
      
      setVisit(visitResponse.data.visit);
      
      toast.success(visitResponse.data.message || 'Visit created successfully and sent to triage!');
      
      // Automatically return to step 1 after a short delay
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (error) {
      console.error('Error selecting patient:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      toast.error('Error creating visit: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Register patient via reception
      const patientResponse = await api.post('/reception/patients', {
        name: data.name,
        type: data.type,
        dob: data.dob || undefined,
        gender: data.gender || undefined,
        mobile: data.mobile || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        emergencyContact: data.emergencyContact || undefined,
        bloodType: data.bloodType || undefined,
        maritalStatus: data.maritalStatus || undefined,
        insuranceId: data.insuranceId || undefined
      });

      setPatient(patientResponse.data.patient);
      setBilling(patientResponse.data.billing);
      toast.success(patientResponse.data.message || 'Patient registered successfully! Card registration bill sent to billing.');
      
      // Immediately reset form and return to step 1 to prevent multiple clicks
      resetForm();
      
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
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to register patient';
        toast.error(errorMessage);
        console.error('Registration error:', error.response?.data);
      }
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
            <h1 className="text-3xl font-bold text-gray-900">Patient Registration & Visit Creation</h1>
            <p className="text-gray-600">Choose how to proceed with patient registration</p>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Reception Process</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>New Patient:</strong> Creates 300 Birr card registration bill</li>
                    <li><strong>Existing Patient:</strong> Creates 50 Birr consultation bill</li>
                    <li><strong>Card Status:</strong> Only patients with ACTIVE cards can create visits</li>
                    <li><strong>Billing:</strong> All bills are sent to billing department for payment processing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* New Patient Registration */}
            <div 
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                registrationType === 'new' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                setRegistrationType('new');
                setStep(2); // Automatically advance to next step
              }}
            >
              <div className="text-center">
                <UserPlus className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">New Patient</h3>
                <p className="text-gray-600 mb-4">Register a completely new patient in the system</p>
                <div className="text-sm text-gray-500">
                  <p>• First time visiting</p>
                  <p>• Complete registration required</p>
                  <p>• 300 Birr card registration bill</p>
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
              onClick={() => {
                setRegistrationType('existing');
                setStep(2); // Automatically advance to next step
              }}
            >
              <div className="text-center">
                <Search className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Returning Patient</h3>
                <p className="text-gray-600 mb-4">Search for an existing patient and create a new visit</p>
                <div className="text-sm text-gray-500">
                  <p>• Patient already in system</p>
                  <p>• Card must be ACTIVE</p>
                  <p>• 50 Birr consultation bill</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    // New Patient Registration Form
    if (registrationType === 'new') {
      return (
        <div className="max-w-4xl mx-auto">
          {/* Back Button - Big and Visible at Top */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setRegistrationType('');
              }}
              className="flex items-center text-primary-600 hover:text-primary-800 font-semibold text-lg group"
            >
              <ArrowLeft className="h-6 w-6 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Selection
            </button>
          </div>
          
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
                <div className="space-y-3">
                  {/* Input Type Toggle */}
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setDateInputType('date')}
                      className={`px-3 py-1 rounded text-sm ${
                        dateInputType === 'date' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      📅 Enter Date
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateInputType('age')}
                      className={`px-3 py-1 rounded text-sm ${
                        dateInputType === 'age' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      👴 Enter Age
                    </button>
                  </div>
                  
                  {/* Date Input */}
                  {dateInputType === 'date' && (
                    <input
                      type="date"
                      className="input"
                      {...register('dob', { required: 'Date of birth is required' })}
                    />
                  )}
                  
                  {/* Age Input */}
                  {dateInputType === 'age' && (
                    <div className="space-y-2">
                      <input
                        type="number"
                        className="input"
                        placeholder="Enter age (e.g., 25)"
                        min="0"
                        max="120"
                        value={ageInput}
                        onChange={(e) => handleAgeChange(e.target.value)}
                      />
                      <p className="text-xs text-gray-600">
                        💡 For illiterate patients: Enter their age and we'll generate a random date
                      </p>
                      {ageInput && (
                        <div className="p-2 bg-green-50 rounded text-sm text-green-700">
                          ✅ Generated date will be automatically filled below
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                  <option value="EMERGENCY" style={{color: 'red', fontWeight: 'bold'}}>🚨 Emergency</option>
                  <option value="STAFF">Staff</option>
                  <option value="CHARITY">Charity</option>
                </select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
                <p className="text-xs text-gray-600 mt-1">
                  💡 <strong>Emergency patients:</strong> Skip card payment, go directly to emergency billing
                </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <label className="label">Emergency Contact</label>
              <input
                type="text"
                className="input"
                placeholder="Name - Phone Number (Optional)"
                {...register('emergencyContact')}
              />
              <p className="text-xs text-gray-500 mt-1">Optional - can be filled later by nurse</p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-outline"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading || patient !== null}
                className="btn btn-primary"
              >
                {loading ? 'Registering...' : patient ? 'Registered ✓' : 'Register Patient'}
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
        {/* Back Button - Big and Visible at Top */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setRegistrationType('');
            }}
            className="flex items-center text-primary-600 hover:text-primary-800 font-semibold text-lg group"
          >
            <ArrowLeft className="h-6 w-6 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Selection
          </button>
        </div>
        
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

            {/* Visit Type Selection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Visit Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  visitType === 'REGULAR' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="visitType"
                    value="REGULAR"
                    checked={visitType === 'REGULAR'}
                    onChange={(e) => setVisitType(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-blue-800 font-medium">Regular Visit</span>
                    <p className="text-xs text-gray-600">Normal billing and triage process</p>
                  </div>
                </label>
                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  visitType === 'EMERGENCY' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="visitType"
                    value="EMERGENCY"
                    checked={visitType === 'EMERGENCY'}
                    onChange={(e) => setVisitType(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-red-800 font-bold">🚨 Emergency Visit</span>
                    <p className="text-xs text-gray-600">Skip payment, go to emergency billing</p>
                  </div>
                </label>
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
                            <div className="mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                patient.cardStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                patient.cardStatus === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {patient.cardStatus === 'ACTIVE' ? <CheckCircle className="h-3 w-3 mr-1" /> :
                                 patient.cardStatus === 'INACTIVE' ? <Clock className="h-3 w-3 mr-1" /> :
                                 <AlertTriangle className="h-3 w-3 mr-1" />}
                                {patient.cardStatus}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectPatient(patient);
                              }}
                              disabled={loading || patient.cardStatus !== 'ACTIVE'}
                              className={`btn btn-sm ${
                                patient.cardStatus === 'ACTIVE' ? 'btn-primary' : 'btn-disabled'
                              }`}
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

            <div className="flex justify-end">
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

  // Step 3 removed - automatically returns to step 1 after registration
  return null;

  return null;
};

export default ReceptionPatientRegistration;
