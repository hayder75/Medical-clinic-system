import React, { useState, useEffect } from 'react';
import { 
  User, Search, FileText, Calendar, TestTube, Scan, Pill, Heart, Clock, 
  CheckCircle, AlertTriangle, Download, Eye, Circle, Stethoscope, 
  Activity, Image, Receipt, Users, ChevronDown, ChevronRight, 
  MapPin, Phone, Mail, Calendar as CalendarIcon, UserCheck, X, ArrowLeft, Printer, Smile, UserCog
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DentalChartDisplay from '../common/DentalChartDisplay';
import ImageViewer from '../common/ImageViewer';
import { getImageUrl } from '../../utils/imageUrl';

const ComprehensivePatientHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [activeTab, setActiveTab] = useState('vitals');
  const [imageViewerState, setImageViewerState] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0
  });

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      console.log('🔍 Frontend: Searching for:', searchTerm);
      const response = await api.get(`/patients/search?query=${encodeURIComponent(searchTerm)}`);
      console.log('🔍 Frontend: Search response:', response.data);
      console.log('🔍 Frontend: Patients found:', response.data.patients?.length || 0);
      setPatients(response.data.patients || []);
      if (response.data.patients?.length === 0) {
        console.warn('⚠️ Frontend: No patients found for search term:', searchTerm);
      }
    } catch (error) {
      console.error('❌ Frontend: Search error:', error);
      console.error('❌ Frontend: Error response:', error.response?.data);
      toast.error('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHistory = async (patientId) => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors/patient-history/${patientId}`);
      setPatientHistory(response.data);
      // Auto-select the first visit if available
      if (response.data?.visits && response.data.visits.length > 0) {
        setSelectedVisitId(response.data.visits[0].id);
      }
    } catch (error) {
      toast.error('Failed to fetch patient history');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSelectedVisitId(null);
    setActiveTab('vitals');
    setPatients([]); // Clear search results
    setSearchTerm(''); // Clear search term
    fetchPatientHistory(patient.id);
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setPatientHistory(null);
    setSelectedVisitId(null);
    setActiveTab('vitals');
  };

  const openImageViewer = (images, currentIndex = 0) => {
    setImageViewerState({
      isOpen: true,
      images: images || [],
      currentIndex
    });
  };

  const closeImageViewer = () => {
    setImageViewerState({
      isOpen: false,
      images: [],
      currentIndex: 0
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'DISPENSED':
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'QUEUED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSelectedVisit = () => {
    if (!patientHistory?.visits || !selectedVisitId) return null;
    return patientHistory.visits.find(v => v.id === selectedVisitId);
  };

  const selectedVisit = getSelectedVisit();

  const handlePrintVisit = () => {
    if (!selectedVisit || !patientHistory) return;
    
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintHTML(selectedVisit, patientHistory);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadPDF = async () => {
    if (!selectedVisit || !patientHistory) return;
    
    try {
      const response = await api.get(`/doctors/patient-history/${patientHistory.patient.id}/visit/${selectedVisit.id}/pdf`);
      const link = document.createElement('a');
      link.href = getImageUrl(response.data.filePath);
      link.download = response.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const generatePrintHTML = (visit, history) => {
    const patient = history.patient;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patient History - ${visit.visitUid}</title>
          <style>
            @page {
              margin: 0.5in;
              size: A4;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              color: #000;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .clinic-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .section {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              margin-bottom: 10px;
            }
            .info-item {
              margin-bottom: 5px;
            }
            .label {
              font-weight: bold;
              display: inline-block;
              min-width: 120px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 10px;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 6px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .text-content {
              margin-top: 5px;
              padding: 8px;
              background-color: #f9f9f9;
              border-left: 3px solid #2e13d1;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">Selihom Medical Clinic</div>
            <div>Patient Medical History Report</div>
          </div>

          <div class="section">
            <div class="section-title">Patient Information</div>
            <div class="info-grid">
              <div class="info-item"><span class="label">Name:</span> ${patient.name}</div>
              <div class="info-item"><span class="label">Patient ID:</span> ${patient.id}</div>
              <div class="info-item"><span class="label">Age/Gender:</span> ${patient.age || 'N/A'} / ${patient.gender || 'N/A'}</div>
              <div class="info-item"><span class="label">Blood Type:</span> ${patient.bloodType || 'N/A'}</div>
              <div class="info-item"><span class="label">Phone:</span> ${patient.phone || 'N/A'}</div>
              <div class="info-item"><span class="label">Visit ID:</span> ${visit.visitUid}</div>
              <div class="info-item"><span class="label">Visit Date:</span> ${formatDateOnly(visit.date)}</div>
              <div class="info-item"><span class="label">Status:</span> ${visit.status.replace(/_/g, ' ')}</div>
            </div>
          </div>

          ${visit.vitals && visit.vitals.length > 0 ? `
          <div class="section">
            <div class="section-title">Vital Signs</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>BP</th>
                  <th>Temp</th>
                  <th>HR</th>
                  <th>O2 Sat</th>
                  <th>BMI</th>
                </tr>
              </thead>
              <tbody>
                ${visit.vitals.map(v => `
                  <tr>
                    <td>${formatDateOnly(v.createdAt)}</td>
                    <td>${v.bloodPressure || 'N/A'}</td>
                    <td>${v.temperature ? v.temperature + '°C' : 'N/A'}</td>
                    <td>${v.heartRate ? v.heartRate + ' bpm' : 'N/A'}</td>
                    <td>${v.oxygenSaturation ? v.oxygenSaturation + '%' : 'N/A'}</td>
                    <td>${v.bmi || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${visit.vitals[0].chiefComplaint ? `<div class="text-content"><strong>Chief Complaint:</strong> ${visit.vitals[0].chiefComplaint}</div>` : ''}
            ${visit.vitals[0].physicalExamination ? `<div class="text-content"><strong>Physical Examination:</strong> ${visit.vitals[0].physicalExamination}</div>` : ''}
            ${visit.vitals[0].notes ? `<div class="text-content"><strong>Notes:</strong> ${visit.vitals[0].notes}</div>` : ''}
          </div>
          ` : ''}

          ${visit.diagnosisNotes && visit.diagnosisNotes.length > 0 ? `
          <div class="section">
            <div class="section-title">Diagnosis & Notes</div>
            ${visit.diagnosisNotes.map(note => `
              <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ccc;">
                <div style="font-weight: bold; margin-bottom: 8px;">Dr. ${note.doctor?.fullname || 'Unknown'} - ${formatDate(note.createdAt)}</div>
                ${note.chiefComplaint ? `<div class="text-content"><strong>Chief Complaint:</strong> ${note.chiefComplaint}</div>` : ''}
                ${note.historyOfPresentIllness ? `<div class="text-content"><strong>History of Present Illness:</strong> ${note.historyOfPresentIllness}</div>` : ''}
                ${note.pastMedicalHistory ? `<div class="text-content"><strong>Past Medical History:</strong> ${note.pastMedicalHistory}</div>` : ''}
                ${note.allergicHistory ? `<div class="text-content"><strong>Allergic History:</strong> ${note.allergicHistory}</div>` : ''}
                ${note.physicalExamination ? `<div class="text-content"><strong>Physical Examination:</strong> ${note.physicalExamination}</div>` : ''}
                ${note.investigationFindings ? `<div class="text-content"><strong>Investigation Findings:</strong> ${note.investigationFindings}</div>` : ''}
                ${note.assessmentAndDiagnosis ? `<div class="text-content"><strong>Assessment & Diagnosis:</strong> ${note.assessmentAndDiagnosis}</div>` : ''}
                ${note.treatmentPlan ? `<div class="text-content"><strong>Treatment Plan:</strong> ${note.treatmentPlan}</div>` : ''}
                ${note.treatmentGiven ? `<div class="text-content"><strong>Treatment Given:</strong> ${note.treatmentGiven}</div>` : ''}
                ${note.medicationIssued ? `<div class="text-content"><strong>Medication Issued:</strong> ${note.medicationIssued}</div>` : ''}
                ${note.prognosis ? `<div class="text-content"><strong>Prognosis:</strong> ${note.prognosis}</div>` : ''}
                ${note.additional ? `<div class="text-content"><strong>Additional Notes:</strong> ${note.additional}</div>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${visit.diagnosis ? `
          <div class="section">
            <div class="section-title">Final Diagnosis</div>
            <div class="text-content">
              <strong>Diagnosis:</strong> ${visit.diagnosis}
              ${visit.diagnosisDetails ? `<br><br><strong>Details:</strong> ${visit.diagnosisDetails}` : ''}
            </div>
          </div>
          ` : ''}

          ${visit.instructions ? `
          <div class="section">
            <div class="section-title">Patient Instructions</div>
            <div class="text-content">${visit.instructions}</div>
          </div>
          ` : ''}

          ${visit.labResults && visit.labResults.length > 0 ? `
          <div class="section">
            <div class="section-title">Lab Results</div>
            ${visit.labResults.map(result => `
              <div style="margin-bottom: 10px; padding: 8px; border: 1px solid #ccc;">
                <strong>${result.testType?.name || 'Lab Test'}</strong> - ${result.status}
                ${result.detailedResults && result.detailedResults.length > 0 ? `
                  <table style="margin-top: 8px;">
                    <thead>
                      <tr>
                        <th>Test Name</th>
                        <th>Result</th>
                        <th>Unit</th>
                        <th>Reference Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${result.detailedResults.map(test => `
                        <tr>
                          <td>${test.testName || 'N/A'}</td>
                          <td>${test.result || 'N/A'}</td>
                          <td>${test.unit || '-'}</td>
                          <td>${test.referenceRange || 'N/A'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                ` : result.resultText ? `<div class="text-content">${result.resultText}</div>` : ''}
                ${result.additionalNotes ? `<div class="text-content"><strong>Notes:</strong> ${result.additionalNotes}</div>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${visit.radiologyResults && visit.radiologyResults.length > 0 ? `
          <div class="section">
            <div class="section-title">Radiology Results</div>
            ${visit.radiologyResults.map(result => `
              <div style="margin-bottom: 10px; padding: 8px; border: 1px solid #ccc;">
                <strong>${result.serviceName || result.testType?.name || 'Radiology Test'}</strong> - ${result.status}
                ${result.resultText ? `<div class="text-content">${result.resultText}</div>` : ''}
                ${result.additionalNotes ? `<div class="text-content"><strong>Notes:</strong> ${result.additionalNotes}</div>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${visit.medications && visit.medications.length > 0 ? `
          <div class="section">
            <div class="section-title">Medications</div>
            <table>
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${visit.medications.map(med => `
                  <tr>
                    <td>${med.medication?.name || med.name || 'N/A'}</td>
                    <td>${med.dosage || 'N/A'}</td>
                    <td>${med.frequency || 'N/A'}</td>
                    <td>${med.duration || 'N/A'}</td>
                    <td>${med.quantity || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${visit.nurseServices && visit.nurseServices.length > 0 ? `
          <div class="section">
            <div class="section-title">Nurse Services</div>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Code</th>
                  <th>Performed By</th>
                  <th>Price</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                ${visit.nurseServices.map(service => `
                  <tr>
                    <td>${service.serviceName || 'N/A'}</td>
                    <td>${service.serviceCode || 'N/A'}</td>
                    <td>${service.assignedNurse || 'N/A'}</td>
                    <td>ETB ${service.servicePrice?.toFixed(2) || '0.00'}</td>
                    <td>${formatDateOnly(service.completedAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${visit.dentalServices && visit.dentalServices.length > 0 ? `
          <div class="section">
            <div class="section-title">Dental Services</div>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Code</th>
                  <th>Performed By</th>
                  <th>Price</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                ${visit.dentalServices.map(service => `
                  <tr>
                    <td>${service.serviceName || 'N/A'}</td>
                    <td>${service.serviceCode || 'N/A'}</td>
                    <td>${service.doctor ? 'Dr. ' + service.doctor : 'N/A'}</td>
                    <td>ETB ${service.servicePrice?.toFixed(2) || '0.00'}</td>
                    <td>${formatDateOnly(service.completedAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #000;">
            <div style="margin-bottom: 20px;">
              <div style="border-top: 1px solid #000; width: 200px; margin-bottom: 5px;"></div>
              <div style="font-size: 11px; margin-bottom: 5px;">Signature: _________________________</div>
              <div style="font-size: 11px;">Date: _________________________</div>
            </div>
            <div style="text-align: center; font-size: 10px; color: #666; margin-top: 20px;">
              <div>Selihom Medical Clinic</div>
              <div>Generated on: ${formatDate(new Date())}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Define tabs based on available data
  const tabs = selectedVisit ? [
    { id: 'vitals', label: 'Vitals & History', icon: Activity, show: true },
    { id: 'attachedImages', label: 'Attached Images', icon: Image, show: selectedVisit.attachedImages?.length > 0 },
    { id: 'gallery', label: 'Before & After Gallery', icon: Image, show: selectedVisit.galleryImages?.length > 0 },
    { id: 'labResults', label: 'Lab Orders', icon: TestTube, show: selectedVisit.labResults?.length > 0 },
    { id: 'radiologyResults', label: 'Radiology Orders', icon: Scan, show: selectedVisit.radiologyResults?.length > 0 },
    { id: 'medications', label: 'Medications', icon: Pill, show: selectedVisit.medications?.length > 0 },
    { id: 'diagnosisNotes', label: 'Diagnosis & Notes', icon: FileText, show: selectedVisit.diagnosisNotes?.length > 0 },
    { id: 'nurseServices', label: 'Nurse Services', icon: UserCog, show: selectedVisit.nurseServices?.length > 0 },
    { id: 'dentalServices', label: 'Dental Services', icon: Smile, show: selectedVisit.dentalServices?.length > 0 },
    { id: 'dentalChart', label: 'Dental Chart', icon: Stethoscope, show: selectedVisit.dentalRecords?.length > 0 },
    { id: 'bills', label: 'Bills & Payments', icon: Receipt, show: true }, // Always show bills tab
  ].filter(tab => tab.show) : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      
      {/* Search Section */}
      {!selectedPatient && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#0C0E0B' }}>
              Patient History Search
            </h2>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#6B7280' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPatients()}
                  placeholder="Search by name, ID, or phone number..."
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ borderColor: '#E5E7EB', focusRingColor: '#2e13d1' }}
                />
              </div>
              <button
                onClick={searchPatients}
                disabled={loading}
                className="px-6 py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: '#2e13d1' }}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {patients.length > 0 && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition hover:border-blue-500"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
                          <User className="h-5 w-5" style={{ color: '#2e13d1' }} />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: '#0C0E0B' }}>{patient.name}</p>
                          <p className="text-sm" style={{ color: '#6B7280' }}>{patient.id} • {patient.phone}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5" style={{ color: '#6B7280' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Selected View */}
      {selectedPatient && patientHistory && (
        <>
          {/* Header with Back Button */}
          <div className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <button
                onClick={clearPatientSelection}
                className="flex items-center space-x-2 text-sm hover:opacity-70 transition"
                style={{ color: '#6B7280' }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Search</span>
              </button>
            </div>
          </div>

          {/* Patient Info Banner */}
          <div className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center space-x-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: '#2e13d1' }}>
                  <User className="h-8 w-8" style={{ color: '#FFFFFF' }} />
                </div>
                <div className="flex-1 grid grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Patient Name</p>
                    <p className="text-sm font-semibold" style={{ color: '#0C0E0B' }}>{patientHistory.patient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Age / Gender</p>
                    <p className="text-sm font-semibold" style={{ color: '#0C0E0B' }}>
                      {patientHistory.patient.age || 'N/A'} / {patientHistory.patient.gender || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Blood Type</p>
                    <p className="text-sm font-semibold" style={{ color: '#0C0E0B' }}>{patientHistory.patient.bloodType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Mobile</p>
                    <p className="text-sm font-semibold" style={{ color: '#0C0E0B' }}>{patientHistory.patient.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedVisit?.status)}`}>
                      {selectedVisit?.status?.replace(/_/g, ' ') || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visit Selector Tabs */}
          <div className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <p className="text-xs font-medium mb-2" style={{ color: '#6B7280' }}>SELECT VISIT</p>
              <div className="flex overflow-x-auto space-x-2 pb-2">
                {patientHistory.visits?.map((visit) => (
                  <button
                    key={visit.id}
                    onClick={() => {
                      setSelectedVisitId(visit.id);
                      setActiveTab('vitals');
                    }}
                    className={`px-4 py-2 rounded-lg border transition whitespace-nowrap text-sm font-medium ${
                      selectedVisitId === visit.id
                        ? 'text-white'
                        : 'bg-white hover:border-gray-400'
                    }`}
                    style={{
                      backgroundColor: selectedVisitId === visit.id ? '#2e13d1' : 'white',
                      borderColor: selectedVisitId === visit.id ? '#2e13d1' : '#E5E7EB',
                      color: selectedVisitId === visit.id ? 'white' : '#0C0E0B'
                    }}
                  >
                    <div>{visit.visitUid}</div>
                    <div className={`text-xs ${selectedVisitId === visit.id ? 'text-white' : 'text-gray-500'}`}>
                      {new Date(visit.date).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          {selectedVisit && (
            <div className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex space-x-1 overflow-x-auto flex-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                          isActive ? '' : 'hover:bg-gray-50'
                        }`}
                        style={{
                          borderColor: isActive ? '#2e13d1' : 'transparent',
                          color: isActive ? '#2e13d1' : '#6B7280'
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={handlePrintVisit}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition text-sm font-medium hover:opacity-90"
                      style={{ borderColor: '#E5E7EB', color: '#0C0E0B' }}
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg transition text-sm font-medium text-white hover:opacity-90"
                      style={{ backgroundColor: '#2e13d1' }}
                    >
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          {selectedVisit && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              
              {/* Vitals & History Tab */}
              {activeTab === 'vitals' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Vital Signs History</h3>
                  {selectedVisit.vitals && selectedVisit.vitals.length > 0 ? (
                    <div className="space-y-4">
                      {selectedVisit.vitals.map((vital, index) => (
                        <div key={vital.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium" style={{ color: '#0C0E0B' }}>Record #{index + 1}</h4>
                            <span className="text-sm" style={{ color: '#6B7280' }}>{formatDate(vital.createdAt)}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p style={{ color: '#6B7280' }}>Heart Rate</p>
                              <p className="font-semibold" style={{ color: '#0C0E0B' }}>{vital.heartRate} bpm</p>
                            </div>
                            <div>
                              <p style={{ color: '#6B7280' }}>Temperature</p>
                              <p className="font-semibold" style={{ color: '#0C0E0B' }}>{vital.temperature}°C</p>
                            </div>
                            <div>
                              <p style={{ color: '#6B7280' }}>Blood Pressure</p>
                              <p className="font-semibold" style={{ color: '#0C0E0B' }}>{vital.bloodPressure} mmHg</p>
                            </div>
                            <div>
                              <p style={{ color: '#6B7280' }}>Oxygen Sat</p>
                              <p className="font-semibold" style={{ color: '#0C0E0B' }}>{vital.oxygenSaturation}%</p>
                            </div>
                          </div>
                          {vital.chiefComplaint && (
                            <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                              <p style={{ color: '#6B7280' }} className="text-sm">Chief Complaint:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{vital.chiefComplaint}</p>
                            </div>
                          )}
                          {vital.physicalExamination && (
                            <div className="mt-2">
                              <p style={{ color: '#6B7280' }} className="text-sm">Physical Examination:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{vital.physicalExamination}</p>
                            </div>
                          )}
                          {vital.notes && (
                            <div className="mt-2">
                              <p style={{ color: '#6B7280' }} className="text-sm">Notes:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{vital.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#6B7280' }}>No vital signs recorded for this visit</p>
                  )}
                </div>
              )}

              {/* Attached Images Tab */}
              {activeTab === 'attachedImages' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Attached Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {selectedVisit.attachedImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="w-full h-48 bg-gray-200 rounded-lg border-2 border-gray-200 overflow-hidden">
                          <img
                            src={getImageUrl(image.filePath)}
                            alt={image.description || 'Medical image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {image.description && (
                          <p className="text-xs mt-2" style={{ color: '#6B7280' }}>{image.description}</p>
                        )}
                        <button
                          className="mt-2 w-full px-3 py-2 text-sm rounded transition flex items-center justify-center space-x-2 text-white hover:opacity-90"
                          style={{ backgroundColor: '#2e13d1' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const allImages = selectedVisit.attachedImages.map(img => ({
                              filePath: getImageUrl(img.filePath),
                              fileName: img.fileName,
                              description: img.description
                            }));
                            openImageViewer(allImages, index);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Image</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Before & After Gallery Tab */}
              {activeTab === 'gallery' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Before & After Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedVisit.galleryImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={getImageUrl(image.filePath)}
                          alt={image.imageType}
                          className="w-full h-48 object-cover rounded border cursor-pointer hover:opacity-80 transition"
                          style={{ borderColor: '#E5E7EB' }}
                          onClick={() => openImageViewer([image], 0)}
                        />
                        <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded shadow ${
                          image.imageType === 'BEFORE' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                          {image.imageType}
                        </div>
                        <div className="mt-2">
                          <p className="text-xs" style={{ color: '#6B7280' }}>{image.uploadedBy.fullname}</p>
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>{formatDate(image.createdAt)}</p>
                          {image.description && (
                            <p className="text-xs mt-1 line-clamp-2" style={{ color: '#6B7280' }}>{image.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Results Tab */}
              {activeTab === 'labResults' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Lab Results</h3>
                  <div className="space-y-4">
                    {selectedVisit.labResults.map((result, index) => (
                      <div key={index} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-lg" style={{ color: '#0C0E0B' }}>
                            {result.testType?.name || result.serviceName || 'Lab Test'}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </div>
                        
                        {result.detailedResults && result.detailedResults.length > 0 ? (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-sm border" style={{ borderColor: '#E5E7EB' }}>
                              <thead style={{ backgroundColor: '#F3F4F6' }}>
                                <tr>
                                  <th className="px-3 py-2 text-left border" style={{ color: '#6B7280', borderColor: '#E5E7EB' }}>Test Name</th>
                                  <th className="px-3 py-2 text-left border" style={{ color: '#6B7280', borderColor: '#E5E7EB' }}>Result</th>
                                  <th className="px-3 py-2 text-left border" style={{ color: '#6B7280', borderColor: '#E5E7EB' }}>Unit</th>
                                  <th className="px-3 py-2 text-left border" style={{ color: '#6B7280', borderColor: '#E5E7EB' }}>Reference Range</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.detailedResults.map((test, idx) => (
                                  <tr key={idx} style={{ borderColor: '#E5E7EB' }}>
                                    <td className="px-3 py-2 border" style={{ color: '#0C0E0B', borderColor: '#E5E7EB' }}>
                                      {test.testName || 'Details not given'}
                                    </td>
                                    <td className="px-3 py-2 font-semibold border" style={{ color: '#0C0E0B', borderColor: '#E5E7EB' }}>
                                      {test.result || 'Details not given'}
                                    </td>
                                    <td className="px-3 py-2 border" style={{ color: '#0C0E0B', borderColor: '#E5E7EB' }}>
                                      {test.unit || '-'}
                                    </td>
                                    <td className="px-3 py-2 border" style={{ color: '#6B7280', borderColor: '#E5E7EB' }}>
                                      {test.referenceRange || 'Details not given'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : result.resultText ? (
                          <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#FFF3CD', color: '#856404' }}>
                            <p className="text-sm font-medium">Result Summary:</p>
                            <p className="text-sm mt-1">{result.resultText}</p>
                          </div>
                        ) : (
                          <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#FFF3CD', color: '#856404' }}>
                            <p className="text-sm italic">📋 Lab test was ordered but detailed results have not been entered yet.</p>
                          </div>
                        )}
                        
                        {result.additionalNotes && (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
                            <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Additional Notes:</p>
                            <p className="text-sm mt-1" style={{ color: '#0C0E0B' }}>{result.additionalNotes}</p>
                          </div>
                        )}
                        
                        <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                          <div className="flex justify-between">
                            <span>Ordered: {result.createdAt ? new Date(result.createdAt).toLocaleString() : 'N/A'}</span>
                            {result.verifiedBy && result.verifiedAt && (
                              <span>Verified by: {result.verifiedBy} on {new Date(result.verifiedAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Radiology Results Tab */}
              {activeTab === 'radiologyResults' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Radiology Results</h3>
                  <div className="space-y-4">
                    {selectedVisit.radiologyResults.map((result, index) => (
                      <div key={index} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium" style={{ color: '#0C0E0B' }}>{result.serviceName}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </div>
                        {result.findings && (
                          <div className="mt-3">
                            <p style={{ color: '#6B7280' }} className="text-sm">Findings:</p>
                            <p className="text-sm" style={{ color: '#0C0E0B' }}>{result.findings}</p>
                          </div>
                        )}
                        {result.impression && (
                          <div className="mt-2">
                            <p style={{ color: '#6B7280' }} className="text-sm">Impression:</p>
                            <p className="text-sm" style={{ color: '#0C0E0B' }}>{result.impression}</p>
                          </div>
                        )}
                        {result.attachments && result.attachments.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {result.attachments.map((attachment, idx) => (
                              <div key={idx}>
                                <img
                                  src={getImageUrl(attachment.fileUrl)}
                                  alt={`Radiology ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                                  style={{ borderColor: '#E5E7EB' }}
                                  onClick={() => openImageViewer(result.attachments, idx)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications Tab */}
              {activeTab === 'medications' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Medications</h3>
                  <div className="space-y-3">
                    {selectedVisit.medications.map((med) => (
                      <div key={med.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium" style={{ color: '#0C0E0B' }}>{med.medication.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(med.status)}`}>
                            {med.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span style={{ color: '#6B7280' }}>Dosage:</span> <span style={{ color: '#0C0E0B' }}>{med.dosage}</span>
                          </div>
                          <div>
                            <span style={{ color: '#6B7280' }}>Frequency:</span> <span style={{ color: '#0C0E0B' }}>{med.frequency}</span>
                          </div>
                          <div>
                            <span style={{ color: '#6B7280' }}>Duration:</span> <span style={{ color: '#0C0E0B' }}>{med.duration}</span>
                          </div>
                          <div>
                            <span style={{ color: '#6B7280' }}>Quantity:</span> <span style={{ color: '#0C0E0B' }}>{med.quantity}</span>
                          </div>
                        </div>
                        {med.instructions && (
                          <div className="mt-2 pt-2 border-t" style={{ borderColor: '#E5E7EB' }}>
                            <p style={{ color: '#6B7280' }} className="text-sm">Instructions:</p>
                            <p className="text-sm" style={{ color: '#0C0E0B' }}>{med.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnosis Notes Tab */}
              {activeTab === 'diagnosisNotes' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Diagnosis & Notes</h3>
                  <div className="space-y-4">
                    {selectedVisit.diagnosisNotes.map((note) => (
                      <div key={note.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-sm" style={{ color: '#6B7280' }}>{formatDate(note.createdAt)}</span>
                          <span className="text-sm font-medium" style={{ color: '#2e13d1' }}>
                            Dr. {note.doctor?.fullname || 'Unknown'}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {note.chiefComplaint && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Chief Complaint:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.chiefComplaint}</p>
                            </div>
                          )}

                          {note.historyOfPresentIllness && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">History of Present Illness:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.historyOfPresentIllness}</p>
                            </div>
                          )}

                          {note.pastMedicalHistory && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Past Medical History:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.pastMedicalHistory}</p>
                            </div>
                          )}

                          {note.allergicHistory && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Allergic History:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.allergicHistory}</p>
                            </div>
                          )}

                          {note.physicalExamination && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Physical Examination:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.physicalExamination}</p>
                            </div>
                          )}

                          {note.investigationFindings && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Investigation Findings:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.investigationFindings}</p>
                            </div>
                          )}

                          {note.assessmentAndDiagnosis && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Assessment & Diagnosis:</p>
                              <p className="text-sm font-medium" style={{ color: '#0C0E0B' }}>{note.assessmentAndDiagnosis}</p>
                            </div>
                          )}

                          {note.treatmentPlan && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Treatment Plan:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.treatmentPlan}</p>
                            </div>
                          )}

                          {note.treatmentGiven && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Treatment Given:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.treatmentGiven}</p>
                            </div>
                          )}

                          {note.medicationIssued && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Medication Issued:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.medicationIssued}</p>
                            </div>
                          )}

                          {note.prognosis && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Prognosis:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.prognosis}</p>
                            </div>
                          )}

                          {note.additional && (
                            <div>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Additional Notes:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{note.additional}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nurse Services Tab */}
              {activeTab === 'nurseServices' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Nurse Services Performed</h3>
                  {selectedVisit.nurseServices && selectedVisit.nurseServices.length > 0 ? (
                    <div className="space-y-4">
                      {selectedVisit.nurseServices.map((service) => (
                        <div key={service.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium" style={{ color: '#0C0E0B' }}>{service.serviceName}</h4>
                              <p className="text-sm" style={{ color: '#6B7280' }}>{service.serviceCode}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold" style={{ color: '#2e13d1' }}>{service.servicePrice?.toFixed(2) || '0.00'} ETB</p>
                              {service.completedAt && (
                                <p className="text-xs" style={{ color: '#6B7280' }}>{formatDate(service.completedAt)}</p>
                              )}
                            </div>
                          </div>
                          {service.serviceDescription && (
                            <p className="text-sm mt-2" style={{ color: '#6B7280' }}>{service.serviceDescription}</p>
                          )}
                          {service.assignedNurse && (
                            <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
                              <span className="font-medium">Performed by:</span> {service.assignedNurse}
                            </p>
                          )}
                          {service.notes && (
                            <div className="mt-2 pt-2 border-t" style={{ borderColor: '#E5E7EB' }}>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Notes:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{service.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: '#6B7280' }}>No nurse services performed in this visit.</p>
                  )}
                </div>
              )}

              {/* Dental Services Tab */}
              {activeTab === 'dentalServices' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Dental Services Performed</h3>
                  {selectedVisit.dentalServices && selectedVisit.dentalServices.length > 0 ? (
                    <div className="space-y-4">
                      {selectedVisit.dentalServices.map((service) => (
                        <div key={service.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium" style={{ color: '#0C0E0B' }}>{service.serviceName}</h4>
                              <p className="text-sm" style={{ color: '#6B7280' }}>{service.serviceCode}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold" style={{ color: '#2e13d1' }}>{service.servicePrice?.toFixed(2) || '0.00'} ETB</p>
                              {service.completedAt && (
                                <p className="text-xs" style={{ color: '#6B7280' }}>{formatDate(service.completedAt)}</p>
                              )}
                            </div>
                          </div>
                          {service.serviceDescription && (
                            <p className="text-sm mt-2" style={{ color: '#6B7280' }}>{service.serviceDescription}</p>
                          )}
                          {service.doctor && (
                            <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
                              <span className="font-medium">Performed by:</span> Dr. {service.doctor}
                            </p>
                          )}
                          {service.notes && (
                            <div className="mt-2 pt-2 border-t" style={{ borderColor: '#E5E7EB' }}>
                              <p style={{ color: '#6B7280' }} className="text-sm font-semibold">Notes:</p>
                              <p className="text-sm" style={{ color: '#0C0E0B' }}>{service.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: '#6B7280' }}>No dental services performed in this visit.</p>
                  )}
                </div>
              )}

              {/* Dental Chart Tab */}
              {activeTab === 'dentalChart' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Dental Chart</h3>
                  <DentalChartDisplay 
                    patientId={patientHistory.patient.id} 
                    visitId={selectedVisit.id} 
                  />
                </div>
              )}

              {/* Bills & Payments Tab */}
              {activeTab === 'bills' && (
                <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: '#E5E7EB' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0C0E0B' }}>Bills & Payments</h3>
                  {selectedVisit.bills && selectedVisit.bills.length > 0 ? (
                    <div className="space-y-3">
                      {selectedVisit.bills.map((bill) => (
                        <div key={bill.id} className="p-4 border rounded-lg" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-sm" style={{ color: '#6B7280' }}>Bill ID: {bill.id.substring(0, 8)}...</p>
                              <p className="text-lg font-semibold" style={{ color: '#0C0E0B' }}>
                                ETB {bill.totalAmount?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bill.status)}`}>
                              {bill.status}
                            </span>
                          </div>
                          {bill.services && bill.services.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm mb-1" style={{ color: '#6B7280' }}>Services:</p>
                              <ul className="text-sm space-y-1">
                                {bill.services.map((service, idx) => {
                                  const price = service.price || service.service?.price || 0;
                                  return (
                                    <li key={idx} className="flex justify-between">
                                      <span style={{ color: '#0C0E0B' }}>{service.service?.name || 'Unknown Service'}</span>
                                      <span className="font-medium" style={{ color: '#0C0E0B' }}>
                                        ETB {Number(price).toFixed(2)}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                          {bill.paidAt && (
                            <div className="mt-2 pt-2 border-t text-sm" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                              Paid on: {formatDate(bill.paidAt)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#6B7280' }}>No billing records for this visit</p>
                  )}
                </div>
              )}

            </div>
          )}
        </>
      )}

      {/* Image Viewer */}
      <ImageViewer
        isOpen={imageViewerState.isOpen}
        onClose={closeImageViewer}
        images={imageViewerState.images}
        currentIndex={imageViewerState.currentIndex}
      />
    </div>
  );
};

export default ComprehensivePatientHistory;
