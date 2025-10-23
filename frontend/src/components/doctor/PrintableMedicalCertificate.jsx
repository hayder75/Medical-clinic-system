import React from 'react';
import { X, Printer } from 'lucide-react';

const PrintableMedicalCertificate = ({ certificate, onClose }) => {
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
    return diffDays + 1; // +1 to include both start and end dates
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
      {/* Print Controls */}
      <div className="mb-4 flex justify-between items-center print:hidden">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--dark)' }}>
          Print Medical Certificate
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-white rounded-md transition-colors flex items-center space-x-2"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary)'}
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Certificate Document */}
      <div className="certificate-content bg-white shadow-lg mx-auto max-w-4xl print:shadow-none print:max-w-none print:mx-0 print:bg-white">
        {/* Header */}
        <div className="text-center py-8 border-b border-gray-300">
          <h1 className="text-3xl font-bold text-black mb-2">Dr. Nigussie</h1>
          <p className="text-lg text-black mb-1">Piassa Awash Bank Building, Hawassa, Hawassa, Ethiopia</p>
          <p className="text-lg text-black">Phone: 0462126023 | Email: drnigussie@gmail.com</p>
        </div>

        {/* Certificate Title */}
        <div className="text-center py-6 border-b border-gray-300">
          <div className="flex justify-between items-center">
            <div className="flex-1"></div>
            <h2 className="text-3xl font-bold text-black uppercase">MEDICAL CERTIFICATE</h2>
            <div className="flex-1 text-right">
              <p className="text-lg text-black">Certificate No.: {certificate.certificateNo}</p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="py-6 border-b border-gray-300">
          <h3 className="text-lg font-bold text-black underline mb-4">Patient Information</h3>
          <div className="space-y-2">
            <p className="text-black"><strong>Name:</strong> {certificate.patient.name}</p>
            <p className="text-black"><strong>Gender:</strong> {certificate.patient.gender || 'Not specified'}</p>
            <p className="text-black"><strong>Age:</strong> {calculateAge(certificate.patient.dob)} years</p>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="py-6 border-b border-gray-300">
          <h3 className="text-lg font-bold text-black underline mb-4">Certificate Details</h3>
          <div className="space-y-2">
            <p className="text-black"><strong>Date Issued:</strong> {formatDate(certificate.certificateDate)}</p>
          </div>
        </div>

        {/* Medical Information */}
        <div className="py-6 border-b border-gray-300">
          <h3 className="text-lg font-bold text-black underline mb-4">Medical Information</h3>
          <div className="space-y-2">
            <p className="text-black"><strong>Diagnosis:</strong> {certificate.diagnosis}</p>
            <p className="text-black"><strong>Treatment:</strong> {certificate.treatment}</p>
            <p className="text-black"><strong>Recommendations:</strong> {certificate.recommendations}</p>
          </div>
        </div>

        {/* Rest Period */}
        <div className="py-6 border-b border-gray-300">
          <h3 className="text-lg font-bold text-black underline text-center mb-4">Rest Period</h3>
          <div className="text-center">
            <p className="text-lg text-black mb-2">
              From {formatDate(certificate.restStartDate)} to {formatDate(certificate.restEndDate)}
            </p>
            <p className="text-lg text-black">
              (Total of {calculateTotalDays(certificate.restStartDate, certificate.restEndDate)} days)
            </p>
          </div>
        </div>

        {/* Issued By */}
        <div className="py-6">
          <h3 className="text-lg font-bold text-black underline mb-4">Issued By</h3>
          <div className="space-y-2">
            <p className="text-black"><strong>Name:</strong> {certificate.doctor.fullname}</p>
            <p className="text-black"><strong>Specialization:</strong> {certificate.doctor.specialties || 'General Doctor'}</p>
          </div>
        </div>

        {/* Footer Line */}
        <div className="border-t border-gray-300 pt-4">
          <div className="text-center text-sm text-gray-600">
            <p>This certificate is issued for medical purposes only.</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
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
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:max-w-none {
            max-width: none !important;
          }
          
          .print\\:mx-0 {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          .print\\:bg-white {
            background: white !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .bg-gray-100 {
            background: white !important;
          }
          
          .p-4 {
            padding: 0 !important;
          }
          
          .mb-4 {
            margin-bottom: 0 !important;
          }
          
          .mx-auto {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          /* Ensure proper page margins */
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          /* Hide all navigation elements */
          nav, header, aside, .sidebar, .navigation {
            display: none !important;
          }
          
          /* Ensure certificate content fits on page */
          .certificate-content {
            page-break-inside: avoid;
            margin: 0;
            padding: 20px;
          }
          
          /* Make sure text is black for printing */
          h1, h2, h3, p, span, div {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableMedicalCertificate;
