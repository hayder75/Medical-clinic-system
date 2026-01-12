import React, { useState } from 'react';
import { 
  Search, FileText, TestTube, Scan, Pill, Printer, 
  User, Phone, ArrowLeft, Calendar, Clock
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const BillingPatientHistory = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [activeTab, setActiveTab] = useState('medications');

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/patients/search?query=${encodeURIComponent(searchTerm)}`);
      setPatients(response.data.patients || []);
      if (response.data.patients?.length === 0) {
        toast.error('No patients found');
      }
    } catch (error) {
      console.error('Search error:', error);
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
      if (response.data?.visits && response.data.visits.length > 0) {
        setSelectedVisitId(response.data.visits[0].id);
      }
    } catch (error) {
      console.error('Fetch history error:', error);
      toast.error('Failed to fetch patient history');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSelectedVisitId(null);
    setActiveTab('medications');
    setPatients([]);
    setSearchTerm('');
    fetchPatientHistory(patient.id);
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setPatientHistory(null);
    setSelectedVisitId(null);
    setActiveTab('medications');
  };

  const selectedVisit = patientHistory?.visits?.find(v => v.id === selectedVisitId);

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Print Medications - Matching MedicationOrdering.jsx style
  const handlePrintMedications = () => {
    if (!selectedVisit || !patientHistory) {
      toast.error('No medications to print');
      return;
    }

    const medicationsToPrint = (selectedVisit.medications || selectedVisit.medicationOrders || []).map(med => ({
      name: med.medication?.name || med.medicationCatalog?.name || med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      quantity: med.quantity,
      instructions: med.instructions,
      dosageForm: med.medication?.dosageForm || med.medicationCatalog?.dosageForm || med.dosageForm,
      strength: med.medication?.strength || med.medicationCatalog?.strength || med.strength,
      doctor: med.doctor || med.medicationOrder?.doctor || null, // Get doctor from order
    }));
    
    // Get doctor from first medication order (all should be from same doctor)
    const firstMed = (selectedVisit.medications || selectedVisit.medicationOrders || [])[0];
    const prescribingDoctor = firstMed?.doctor || firstMed?.medicationOrder?.doctor || null;

    if (medicationsToPrint.length === 0) {
      toast.error('No medications to print');
      return;
    }

    const patient = patientHistory.patient;
    const patientName = patient?.name || 'Unknown';
    const patientPhone = patient?.mobile || 'N/A';
    const patientAge = patient?.dob ? calculateAge(patient.dob) : 'N/A';
    const patientGender = patient?.gender || 'N/A';
    const patientCardNumber = patient?.id || 'N/A';
    // Use doctor from medication order, not current user
    const doctorName = prescribingDoctor?.fullname || currentUser?.fullname || 'Dr. Unknown';
    const doctorSpecialty = prescribingDoctor?.specialties?.join(', ') || currentUser?.specialties?.join(', ') || 'General Practitioner';
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const medCount = medicationsToPrint.length;
    let numColumns = 1;
    if (medCount >= 7) {
      numColumns = 3;
    } else if (medCount >= 4) {
      numColumns = 2;
    } else if (medCount >= 3) {
      numColumns = 2;
    } else {
      numColumns = 1;
    }

    const printWindow = window.open('', '_blank');
    const prescriptionContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${patientName}</title>
          <style>
            @media print {
              @page { 
                size: A6;
                margin: 0;
              }
              body { 
                margin: 0; 
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: flex-start;
              }
              .no-print { display: none; }
              .prescription-container {
                width: 105mm;
                height: 148mm;
                margin: 0;
                padding: 8mm;
                border: none;
                box-shadow: none;
              }
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px;
              color: #333;
              line-height: 1.3;
              background: #f3f4f6;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .no-print {
              text-align: center;
              padding: 15px;
              background: #fff;
              margin-bottom: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              width: 100%;
              max-width: 400px;
            }
            .no-print button {
              background: #2563eb;
              color: white;
              border: none;
              padding: 10px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: background 0.2s;
            }
            .no-print button:hover {
              background: #1d4ed8;
            }
            .prescription-container {
              width: 105mm;
              min-height: 148mm;
              background: white;
              padding: 8mm;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
              border-radius: 2px;
              position: relative;
              box-sizing: border-box;
            }
            .header { 
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 8px; 
              margin-bottom: 12px; 
              border-bottom: 2px solid #2563eb;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .logo {
              width: 45px;
              height: 45px;
              object-fit: contain;
            }
            .clinic-info {
              text-align: left;
            }
            .clinic-name { 
              font-size: 18px; 
              font-weight: 800; 
              margin: 0;
              color: #1e40af;
              letter-spacing: -0.3px;
            }
            .clinic-tagline {
              font-size: 10px;
              color: #64748b;
              margin: 0;
              font-style: italic;
            }
            .header-right {
              text-align: right;
            }
            .report-title { 
              font-size: 16px; 
              font-weight: 700; 
              margin: 0;
              color: #0f172a;
              text-transform: uppercase;
            }
            .report-info {
              font-size: 10px;
              color: #64748b;
              margin-top: 1px;
            }
            .patient-section {
              margin: 8px 0;
              padding: 6px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
            }
            .patient-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 4px 8px;
              font-size: 12px;
            }
            .info-item {
              display: flex;
              gap: 4px;
            }
            .info-label {
              font-weight: 700;
              color: #64748b;
              min-width: 60px;
              font-size: 11px;
            }
            .info-value {
              color: #1e293b;
              font-weight: 500;
              font-size: 12px;
            }
            .medications-section {
              margin: 5px 0;
            }
            .medication-item {
              margin-bottom: 8px;
              padding-bottom: 4px;
              border-bottom: 1px dashed #e2e8f0;
              page-break-inside: avoid;
            }
            .medication-item:last-child {
              border-bottom: none;
            }
            .medication-name {
              font-weight: 700;
              font-size: 13px;
              color: #0f172a;
            }
            .medication-details {
              font-size: 12px;
              color: #475569;
              margin-top: 1px;
              font-style: italic;
            }
            .footer {
              margin-top: 15px;
              padding-top: 8px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .doctor-info {
              font-size: 11px;
              color: #475569;
            }
            .doctor-name {
              font-weight: 700;
              color: #1e293b;
              font-size: 12px;
            }
            .signature-area {
              text-align: center;
              width: 120px;
            }
            .signature-line {
              border-top: 1px solid #334155;
              margin-top: 25px;
              padding-top: 3px;
              font-size: 10px;
              font-weight: 600;
              color: #64748b;
            }
            .print-footer {
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()">Print Prescription</button>
          </div>

          <div class="prescription-container">
            <div class="header">
              <div class="header-left">
                <img src="/clinic-logo.jpg" alt="Clinic Logo" class="logo" onerror="this.style.display='none'">
                <div class="clinic-info">
                  <h1 class="clinic-name">Selihom Medium Clinic</h1>
                  <p class="clinic-tagline">Quality Healthcare You Can Trust</p>
                </div>
              </div>
              <div class="header-right">
                <h2 class="report-title">Prescription</h2>
                <div class="report-info">
                  Date: ${currentDate}<br>
                  Time: ${currentTime}
                </div>
              </div>
            </div>

            <div class="patient-section">
              <div class="patient-grid">
                <div class="info-item">
                  <span class="info-label">Patient:</span>
                  <span class="info-value">${patientName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">ID:</span>
                  <span class="info-value">#${patientCardNumber}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Age/Sex:</span>
                  <span class="info-value">${patientAge}Y / ${patientGender}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${patientPhone}</span>
                </div>
              </div>
            </div>

            <div class="medications-section">
              ${medicationsToPrint.map((med, index) => {
        const medName = med.name || 'Unknown';
        const medDosageForm = med.dosageForm || '';
        const medStrength = med.strength || '';
        const medQuantity = med.quantity || '';
        const medFrequency = med.frequency || '';
        const medDuration = med.duration || '';
        const medInstructions = med.instructions || '';

        const details = [];
        if (medStrength) details.push(medStrength);
        if (medDosageForm) details.push(medDosageForm);
        if (medFrequency) details.push(medFrequency);
        if (medDuration) details.push(medDuration);
        if (medQuantity) details.push(`Qty: ${medQuantity}`);

        return `
                <div class="medication-item">
                  <div class="medication-name">${index + 1}. ${medName}</div>
                  <div class="medication-details">
                    ${details.join(' • ')}
                    ${medInstructions ? `<br>Note: ${medInstructions}` : ''}
                  </div>
                </div>
              `;
      }).join('')}
            </div>

            <div class="footer">
              <div class="doctor-info">
                Prescribed by:<br>
                <span class="doctor-name">${doctorName}</span><br>
                ${doctorSpecialty}
              </div>
              <div class="signature-area">
                <div class="signature-line">Doctor's Signature & Stamp</div>
              </div>
            </div>

            <div class="print-footer">
              Selihom Medium Clinic - Generated on ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(prescriptionContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
    toast.success('Opening print preview...');
  };

  // Print Lab Results - Matching LabOrders.jsx style
  const handlePrintLabResults = async () => {
    const labResults = selectedVisit?.labResults || selectedVisit?.labOrders || selectedVisit?.labTestOrders || [];
    if (!selectedVisit || !patientHistory || labResults.length === 0) {
      toast.error('No lab results to print');
      return;
    }

    // Filter completed results only
    let allResults = [];
    for (const result of labResults) {
      const status = result.status?.toUpperCase() || '';
      if (['QUEUED', 'PENDING', 'UNPAID'].includes(status)) continue;
      
      if (status === 'COMPLETED' || result.detailedResults?.length > 0 || result.resultText) {
        allResults.push({
          testName: result.testType?.name || result.serviceName || 'Lab Test',
          detailedResults: result.detailedResults || [],
          resultText: result.resultText || null,
          additionalNotes: result.additionalNotes || '',
          createdAt: result.createdAt,
          verifiedBy: result.verifiedBy,
          verifiedAt: result.verifiedAt,
        });
      }
    }

    if (allResults.length === 0) {
      toast.error('No completed lab results to print');
      return;
    }

    const patient = patientHistory.patient;
    const currentDate = new Date();
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    const formatDateTime = (date) => {
      return date.toLocaleString('en-US');
    };

    // Get lab technician from first result's verifiedByUser
    const firstResult = allResults[0];
    const labTechnicianName = firstResult?.verifiedByUser?.fullname || firstResult?.verifiedByUser || currentUser?.fullname || 'Lab Technician';
    const patientAge = patient?.dob ? calculateAge(patient.dob) : 'N/A';
    const patientBloodType = patient?.bloodType || 'N/A';

    const printWindow = window.open('', '_blank');
    const labContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab Results - ${patient.name || 'Patient'}</title>
          <style>
            @media print {
              @page { 
                size: A4;
                margin: 10mm;
              }
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 10px;
              color: #333;
              line-height: 1.4;
            }
            .no-print {
              text-align: center;
              padding: 15px;
              background: #f8f9fa;
              margin-bottom: 15px;
              border-bottom: 1px solid #dee2e6;
            }
            .no-print button {
              background: #2563eb;
              color: white;
              border: none;
              padding: 8px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
            }
            .header { 
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 10px; 
              margin-bottom: 15px; 
              border-bottom: 3px solid #2563eb;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
            }
            .clinic-info {
              text-align: left;
            }
            .clinic-name { 
              font-size: 26px; 
              font-weight: 800; 
              margin: 0;
              color: #1e40af;
              letter-spacing: -0.5px;
            }
            .clinic-tagline {
              font-size: 13px;
              color: #64748b;
              margin: 0;
              font-style: italic;
            }
            .header-right {
              text-align: right;
            }
            .report-title { 
              font-size: 22px; 
              font-weight: 700; 
              margin: 0;
              color: #0f172a;
              text-transform: uppercase;
            }
            .report-info {
              font-size: 13px;
              color: #64748b;
              margin-top: 2px;
            }
            .patient-section {
              margin: 15px 0;
              padding: 12px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
            }
            .section-header {
              font-size: 15px;
              font-weight: 700;
              margin-bottom: 10px;
              color: #1e293b;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 5px;
            }
            .patient-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              font-size: 14px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
            }
            .info-label {
              font-weight: 600;
              color: #64748b;
              font-size: 12px;
              text-transform: uppercase;
            }
            .info-value {
              color: #1e293b;
              font-weight: 500;
              font-size: 14px;
            }
            .results-section {
              margin: 15px 0;
            }
            .test-card {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .test-header {
              font-size: 17px;
              font-weight: 700;
              margin-bottom: 10px;
              padding: 8px 12px;
              background: #f1f5f9;
              border-left: 4px solid #2563eb;
              color: #1e293b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 5px 0;
            }
            th {
              text-align: left;
              padding: 10px 12px;
              background: #f8fafc;
              color: #475569;
              font-size: 13px;
              font-weight: 600;
              text-transform: uppercase;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 14px;
              color: #334155;
            }
            .field-name {
              font-weight: 600;
              color: #1e293b;
              width: 40%;
            }
            .field-value {
              font-weight: 500;
            }
            .notes-box {
              margin-top: 10px;
              padding: 8px 12px;
              background: #fffbeb;
              border-left: 4px solid #f59e0b;
              font-size: 14px;
              color: #92400e;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .signature-area {
              text-align: center;
              width: 180px;
            }
            .signature-line {
              border-top: 1px solid #334155;
              margin-top: 30px;
              padding-top: 5px;
              font-size: 12px;
              font-weight: 600;
              color: #475569;
            }
            .stamp-area {
              width: 100px;
              height: 100px;
              border: 2px dashed #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #94a3b8;
              font-size: 11px;
              border-radius: 50%;
              text-transform: uppercase;
              font-weight: 600;
            }
            .print-footer {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()">Print Report</button>
          </div>

          <div class="header">
            <div class="header-left">
              <img src="/clinic-logo.jpg" alt="Clinic Logo" class="logo" onerror="this.style.display='none'">
              <div class="clinic-info">
                <h1 class="clinic-name">Selihom Medium Clinic</h1>
                <p class="clinic-tagline">Quality Healthcare You Can Trust</p>
              </div>
            </div>
            <div class="header-right">
              <h2 class="report-title">Laboratory Report</h2>
              <div class="report-info">
                Date: ${formatDate(currentDate)}<br>
                Time: ${currentDate.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div class="patient-section">
            <div class="section-header">Patient Information</div>
            <div class="patient-grid">
              <div class="info-item">
                <span class="info-label">Full Name</span>
                <span class="info-value">${patient.name || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Patient ID</span>
                <span class="info-value">#${patient.id || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Gender</span>
                <span class="info-value">${patient.gender || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Age</span>
                <span class="info-value">${patientAge}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Blood Type</span>
                <span class="info-value">${patientBloodType}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Contact</span>
                <span class="info-value">${patient.mobile || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Visit ID</span>
                <span class="info-value">#${selectedVisit.visitUid || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div class="results-section">
            ${allResults.map((result, idx) => `
              <div class="test-card">
                <div class="test-header">${idx + 1}. ${result.testName}</div>
                ${result.detailedResults?.length > 0 ? `
                  <table>
                    <thead>
                      <tr>
                        <th>Test Name</th>
                        <th>Result</th>
                        <th>Unit</th>
                        <th>Reference Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${result.detailedResults.map((test, testIdx) => `
                        <tr>
                          <td class="field-name">${test.testName || 'N/A'}</td>
                          <td class="field-value">${test.result || 'N/A'}</td>
                          <td>${test.unit || '-'}</td>
                          <td>${test.referenceRange || 'N/A'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                ` : result.resultText ? `
                  <div class="notes-box">
                    <strong>Result:</strong> ${result.resultText}
                  </div>
                ` : ''}
                ${result.additionalNotes ? `
                  <div class="notes-box">
                    <strong>Notes:</strong> ${result.additionalNotes}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <div class="signature-area">
              <div class="signature-line">Lab Technician</div>
              <div style="font-size: 13px; margin-top: 3px; font-weight: 600;">${labTechnicianName}</div>
            </div>
            <div class="stamp-area">Clinic Stamp</div>
            <div class="signature-area">
              <div class="signature-line">Authorized Signature</div>
            </div>
          </div>

          <div class="print-footer">
            This is a computer-generated report. Selihom Medium Clinic. Generated on ${formatDateTime(currentDate)}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(labContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
    toast.success('Opening print preview...');
  };

  // Print Radiology Results - Matching RadiologyOrders.jsx style
  const handlePrintRadiologyResults = () => {
    const radiologyResults = selectedVisit?.radiologyResults || selectedVisit?.radiologyOrders || [];
    if (!selectedVisit || !patientHistory || radiologyResults.length === 0) {
      toast.error('No radiology results to print');
      return;
    }

    const patient = patientHistory.patient;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const patientAge = patient?.dob ? calculateAge(patient.dob) : 'N/A';
    const patientBloodType = patient?.bloodType || 'N/A';
    
    // Get radiologist from first result's radiologistUser
    const firstResult = radiologyResults[0];
    const radiologistName = firstResult?.radiologistUser?.fullname || firstResult?.radiologistUser || 'Radiologist';

    const printWindow = window.open('', '_blank');
    const radiologyContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Radiology Results Report</title>
          <style>
            @media print {
              @page { 
                size: A4;
                margin: 10mm;
              }
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 10px;
              color: #333;
              line-height: 1.4;
              background: white;
            }
            .no-print {
              text-align: center;
              padding: 15px;
              background: #f8f9fa;
              margin-bottom: 15px;
              border-bottom: 1px solid #dee2e6;
            }
            .no-print button {
              background: #2563eb;
              color: white;
              border: none;
              padding: 8px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
            }
            .header { 
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-bottom: 10px; 
              margin-bottom: 15px; 
              border-bottom: 3px solid #2563eb;
            }
            .header-left {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
            }
            .clinic-info {
              text-align: left;
            }
            .clinic-name { 
              font-size: 26px; 
              font-weight: 800; 
              margin: 0;
              color: #1e40af;
              letter-spacing: -0.5px;
            }
            .clinic-tagline {
              font-size: 13px;
              color: #64748b;
              margin: 0;
              font-style: italic;
            }
            .header-right {
              text-align: right;
            }
            .report-title { 
              font-size: 22px; 
              font-weight: 700; 
              margin: 0;
              color: #0f172a;
              text-transform: uppercase;
            }
            .report-info {
              font-size: 13px;
              color: #64748b;
              margin-top: 2px;
            }
            .patient-section {
              margin: 15px 0;
              padding: 12px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
            }
            .section-header {
              font-size: 15px;
              font-weight: 700;
              margin-bottom: 10px;
              color: #1e293b;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 5px;
            }
            .patient-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              font-size: 14px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
            }
            .info-label {
              font-weight: 600;
              color: #64748b;
              font-size: 12px;
              text-transform: uppercase;
            }
            .info-value {
              color: #1e293b;
              font-weight: 500;
              font-size: 14px;
            }
            .results-section {
              margin: 15px 0;
            }
            .test-result {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .test-title {
              font-size: 17px;
              font-weight: 700;
              margin-bottom: 10px;
              padding: 8px 12px;
              background: #f1f5f9;
              border-left: 4px solid #2563eb;
              color: #1e293b;
            }
            .findings-section, .conclusion-section {
              margin: 10px 0;
            }
            .section-label {
              font-size: 15px;
              font-weight: 700;
              margin-bottom: 5px;
              color: #1e293b;
            }
            .section-content {
              font-size: 14px;
              line-height: 1.6;
              color: #334155;
              white-space: pre-wrap;
              padding: 8px 12px;
              background: #fff;
              border-left: 3px solid #e2e8f0;
              margin-left: 5px;
            }
            .signature-section {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .signature-box {
              text-align: center;
              width: 180px;
            }
            .signature-line {
              border-top: 1px solid #334155;
              margin-top: 30px;
              padding-top: 5px;
              font-size: 12px;
              font-weight: 600;
              color: #475569;
            }
            .stamp-area {
              width: 100px;
              height: 100px;
              border: 2px dashed #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #94a3b8;
              font-size: 11px;
              border-radius: 50%;
              text-transform: uppercase;
              font-weight: 600;
            }
            .print-footer {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()">Print Report</button>
          </div>

          <div class="header">
            <div class="header-left">
              <img src="/clinic-logo.jpg" alt="Clinic Logo" class="logo" onerror="this.style.display='none'">
              <div class="clinic-info">
                <h1 class="clinic-name">Selihom Medium Clinic</h1>
                <p class="clinic-tagline">Quality Healthcare You Can Trust</p>
              </div>
            </div>
            <div class="header-right">
              <h2 class="report-title">Radiology Report</h2>
              <div class="report-info">
                Date: ${currentDate}<br>
                Time: ${currentTime}
              </div>
            </div>
          </div>

          <div class="patient-section">
            <div class="section-header">Patient Information</div>
            <div class="patient-grid">
              <div class="info-item">
                <span class="info-label">Full Name</span>
                <span class="info-value">${patient.name || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Patient ID</span>
                <span class="info-value">#${patient.id || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Gender</span>
                <span class="info-value">${patient.gender || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Age</span>
                <span class="info-value">${patientAge}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Blood Type</span>
                <span class="info-value">${patientBloodType}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Visit ID</span>
                <span class="info-value">#${selectedVisit.visitUid || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div class="results-section">
            ${radiologyResults.map(result => `
              <div class="test-result">
                <div class="test-title">${result.testType?.name || result.serviceName || 'Radiology Test'}</div>
                
                ${result.findings ? `
                  <div class="findings-section">
                    <div class="section-label">Findings:</div>
                    <div class="section-content">${result.findings}</div>
                  </div>
                ` : ''}
                
                ${result.conclusion ? `
                  <div class="conclusion-section">
                    <div class="section-label">Conclusion:</div>
                    <div class="section-content">${result.conclusion}</div>
                  </div>
                ` : ''}
                
                ${result.additionalNotes || result.notes ? `
                  <div class="findings-section">
                    <div class="section-label">Additional Notes:</div>
                    <div class="section-content">${result.additionalNotes || result.notes}</div>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">Radiologist Signature</div>
              <div style="font-size: 13px; margin-top: 3px; font-weight: 600;">${radiologistName}</div>
            </div>
            <div class="stamp-area">Clinic Stamp</div>
            <div class="signature-box">
              <div class="signature-line">Authorized Signature</div>
            </div>
          </div>

          <div class="print-footer">
            This is a computer-generated report. Selihom Medium Clinic. Generated on ${currentDate} ${currentTime}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(radiologyContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
    toast.success('Opening print preview...');
  };

  return (
    <div className="p-6">
      {!selectedPatient ? (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Print Lab, Radiology & Medications</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, phone, or patient ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={searchPatients}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="h-5 w-5" />
                Search
              </button>
            </div>
          </div>

          {patients.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="font-semibold">Search Results</h2>
              </div>
              <div className="divide-y">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-gray-600">
                        {patient.mobile && <><Phone className="inline h-4 w-4 mr-1" />{patient.mobile}</>}
                        <span className="ml-4">ID: {patient.id}</span>
                      </div>
                    </div>
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={clearPatientSelection}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Search
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-2">{selectedPatient.name}</h2>
            <div className="text-sm text-gray-600">
              <span>ID: {selectedPatient.id}</span>
              {selectedPatient.mobile && <span className="ml-4">Phone: {selectedPatient.mobile}</span>}
            </div>
          </div>

          {patientHistory?.visits && patientHistory.visits.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <p className="text-xs font-medium mb-2 text-gray-600">SELECT VISIT</p>
                <div className="flex overflow-x-auto space-x-2 pb-2">
                  {patientHistory.visits.map((visit) => (
                    <button
                      key={visit.id}
                      onClick={() => {
                        setSelectedVisitId(visit.id);
                        setActiveTab('medications');
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
                        {new Date(visit.createdAt || visit.date).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedVisit && (
                <div>
                  <div className="flex gap-2 mb-4 border-b">
                    <button
                      onClick={() => setActiveTab('medications')}
                      className={`px-4 py-2 ${activeTab === 'medications' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}
                    >
                      <Pill className="inline h-4 w-4 mr-2" />
                      Medications
                    </button>
                    <button
                      onClick={() => setActiveTab('lab')}
                      className={`px-4 py-2 ${activeTab === 'lab' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}
                    >
                      <TestTube className="inline h-4 w-4 mr-2" />
                      Lab Results
                    </button>
                    <button
                      onClick={() => setActiveTab('radiology')}
                      className={`px-4 py-2 ${activeTab === 'radiology' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}
                    >
                      <Scan className="inline h-4 w-4 mr-2" />
                      Radiology
                    </button>
                  </div>

                  {activeTab === 'medications' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Medications</h3>
                        {((selectedVisit.medications?.length > 0) || (selectedVisit.medicationOrders?.length > 0)) && (
                          <button
                            onClick={handlePrintMedications}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Printer className="h-4 w-4" />
                            Print
                          </button>
                        )}
                      </div>
                      {((selectedVisit.medications || selectedVisit.medicationOrders) || []).length > 0 ? (
                        <div className="space-y-3">
                          {(selectedVisit.medications || selectedVisit.medicationOrders || []).map((med) => {
                            const medName = med.medication?.name || med.medicationCatalog?.name || med.name || 'Unknown';
                            return (
                              <div key={med.id} className="p-4 border rounded-lg">
                                <div className="font-medium">{medName}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {med.dosage && <span>Dosage: {med.dosage}</span>}
                                  {med.frequency && <span className="ml-4">Frequency: {med.frequency}</span>}
                                  {med.duration && <span className="ml-4">Duration: {med.duration}</span>}
                                  {med.quantity && <span className="ml-4">Qty: {med.quantity}</span>}
                                </div>
                                {med.instructions && (
                                  <div className="text-sm text-gray-500 mt-2">{med.instructions}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500">No medications for this visit</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'lab' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Lab Results</h3>
                        {((selectedVisit.labResults?.length > 0) || (selectedVisit.labOrders?.length > 0) || (selectedVisit.labTestOrders?.length > 0)) && (
                          <button
                            onClick={handlePrintLabResults}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Printer className="h-4 w-4" />
                            Print
                          </button>
                        )}
                      </div>
                      {((selectedVisit.labResults || selectedVisit.labOrders || selectedVisit.labTestOrders) || []).length > 0 ? (
                        <div className="space-y-4">
                          {(selectedVisit.labResults || selectedVisit.labOrders || selectedVisit.labTestOrders || []).map((result, index) => {
                            const testName = result.labTest?.name || result.testType?.name || result.type?.name || result.serviceName || 'Lab Test';
                            const status = result.status || 'PENDING';
                            const detailedResults = result.detailedResults || [];
                            return (
                              <div key={result.id || index} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-medium text-lg">{testName}</h4>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {status}
                                  </span>
                                </div>
                                {detailedResults.length > 0 ? (
                                  <div className="mt-3 overflow-x-auto">
                                    <table className="w-full text-sm border">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-3 py-2 text-left border">Test Name</th>
                                          <th className="px-3 py-2 text-left border">Result</th>
                                          <th className="px-3 py-2 text-left border">Unit</th>
                                          <th className="px-3 py-2 text-left border">Reference Range</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {detailedResults.map((test, idx) => (
                                          <tr key={idx}>
                                            <td className="px-3 py-2 border">{test.testName || 'N/A'}</td>
                                            <td className="px-3 py-2 font-semibold border">{test.result || 'N/A'}</td>
                                            <td className="px-3 py-2 border">{test.unit || '-'}</td>
                                            <td className="px-3 py-2 border">{test.referenceRange || 'N/A'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : result.resultText ? (
                                  <div className="mt-3 p-3 rounded bg-yellow-50">
                                    <p className="text-sm">{result.resultText}</p>
                                  </div>
                                ) : (
                                  <div className="mt-3 p-3 rounded bg-yellow-50">
                                    <p className="text-sm italic">Lab test was ordered but detailed results have not been entered yet.</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500">No lab results for this visit</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'radiology' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Radiology Results</h3>
                        {((selectedVisit.radiologyResults?.length > 0) || (selectedVisit.radiologyOrders?.length > 0)) && (
                          <button
                            onClick={handlePrintRadiologyResults}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Printer className="h-4 w-4" />
                            Print
                          </button>
                        )}
                      </div>
                      {((selectedVisit.radiologyResults || selectedVisit.radiologyOrders) || []).length > 0 ? (
                        <div className="space-y-4">
                          {(selectedVisit.radiologyResults || selectedVisit.radiologyOrders || []).map((result, index) => {
                            const testName = result.testType?.name || result.serviceName || 'Radiology Test';
                            return (
                              <div key={result.id || index} className="p-4 border rounded-lg">
                                <h4 className="font-medium text-lg mb-3">{testName}</h4>
                                {result.findings && (
                                  <div className="mt-3 p-3 rounded bg-blue-50">
                                    <p className="text-sm font-semibold mb-1">Findings:</p>
                                    <p className="text-sm">{result.findings}</p>
                                  </div>
                                )}
                                {result.conclusion && (
                                  <div className="mt-3 p-3 rounded bg-green-50">
                                    <p className="text-sm font-semibold mb-1">Conclusion:</p>
                                    <p className="text-sm">{result.conclusion}</p>
                                  </div>
                                )}
                                {result.notes && (
                                  <div className="mt-3 text-sm text-gray-600">
                                    <strong>Notes:</strong> {result.notes}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500">No radiology results for this visit</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              No visits found for this patient
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillingPatientHistory;
