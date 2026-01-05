import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Circle, Calendar, User, FileText, AlertCircle } from 'lucide-react';

const DentalChartDisplay = ({ patientId, visitId, showHistory = false }) => {
  const [dentalRecord, setDentalRecord] = useState(null);
  const [dentalHistory, setDentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // FDI tooth numbering system (11-18, 21-28, 31-38, 41-48)
  const toothNumbers = [
    // Upper jaw (right to left)
    18, 17, 16, 15, 14, 13, 12, 11,
    21, 22, 23, 24, 25, 26, 27, 28,
    // Lower jaw (left to right)
    38, 37, 36, 35, 34, 33, 32, 31,
    41, 42, 43, 44, 45, 46, 47, 48
  ];

  const toothStatuses = {
    HEALTHY: { color: '#10B981', label: 'Healthy', bgColor: 'bg-green-100' },
    DECAY: { color: '#EF4444', label: 'Decay', bgColor: 'bg-red-100' },
    FILLED: { color: '#3B82F6', label: 'Filled', bgColor: 'bg-blue-100' },
    ROOT_CANAL: { color: '#8B5CF6', label: 'Root Canal', bgColor: 'bg-purple-100' },
    MISSING: { color: '#6B7280', label: 'Missing', bgColor: 'bg-gray-100' },
    IMPACTED: { color: '#F59E0B', label: 'Impacted', bgColor: 'bg-yellow-100' },
    EXTRACTED: { color: '#DC2626', label: 'Extracted', bgColor: 'bg-red-200' }
  };

  useEffect(() => {
    if (showHistory) {
      fetchDentalHistory();
    } else {
      fetchDentalRecord();
    }
  }, [patientId, visitId, showHistory]);

  const fetchDentalRecord = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dental/records/${patientId}/${visitId}`);
      setDentalRecord(response.data.dentalRecord);
    } catch (error) {
      console.error('Error fetching dental record:', error);
      // Don't show error for 404 - just means no dental record exists
      if (error.response?.status !== 404) {
        console.error('Non-404 error fetching dental record:', error);
      }
      setDentalRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDentalHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dental/history/${patientId}`);
      setDentalHistory(response.data.dentalHistory);
      if (response.data.dentalHistory.length > 0) {
        setSelectedRecord(response.data.dentalHistory[0]);
      }
    } catch (error) {
      console.error('Error fetching dental history:', error);
      // Don't show error for 404 - just means no dental history exists
      if (error.response?.status !== 404) {
        console.error('Non-404 error fetching dental history:', error);
      }
      setDentalHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTooth = (toothNumber, toothData = null) => {
    const data = toothData || (dentalRecord?.toothChart?.[toothNumber]) || { status: 'HEALTHY', notes: '', surfaces: [] };
    const status = data.status;
    const hasPain = dentalRecord?.painFlags?.[toothNumber];
    const statusInfo = toothStatuses[status] || toothStatuses.HEALTHY;

    return (
      <div
        key={toothNumber}
        className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-110 ${statusInfo.bgColor}`}
        style={{ borderColor: statusInfo.color }}
        title={`Tooth ${toothNumber}: ${statusInfo.label}${data.notes ? ` - ${data.notes}` : ''}${hasPain ? ` (Pain: ${hasPain.level}/10)` : ''}`}
      >
        <span className="text-gray-700 font-semibold">{toothNumber}</span>
        {hasPain && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">!</span>
          </div>
        )}
      </div>
    );
  };

  const renderDentalChart = (record) => {
    if (!record?.toothChart) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Circle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No dental chart data available</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Tooth Chart Grid */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Circle className="h-5 w-5 mr-2 text-blue-600" />
            Dental Chart
          </h4>
          
          {/* Upper Jaw */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Upper Jaw</h5>
            <div className="flex justify-center space-x-1">
              {toothNumbers.slice(0, 16).map(toothNumber => 
                renderTooth(toothNumber, record.toothChart?.[toothNumber])
              )}
            </div>
          </div>

          {/* Lower Jaw */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Lower Jaw</h5>
            <div className="flex justify-center space-x-1">
              {toothNumbers.slice(16, 32).map(toothNumber => 
                renderTooth(toothNumber, record.toothChart?.[toothNumber])
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(toothStatuses).map(([status, info]) => (
              <div key={status} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full border-2"
                  style={{ borderColor: info.color, backgroundColor: info.color + '20' }}
                />
                <span className="text-sm text-gray-700">{info.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        {(record.gumCondition || record.oralHygiene || record.notes) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Additional Information
            </h4>
            
            <div className="space-y-4">
              {record.gumCondition && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Gum Condition</h5>
                  <p className="text-gray-900">{record.gumCondition}</p>
                </div>
              )}
              
              {record.oralHygiene && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Oral Hygiene</h5>
                  <p className="text-gray-900">{record.oralHygiene}</p>
                </div>
              )}
              
              {record.notes && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Notes</h5>
                  <p className="text-gray-900">{record.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pain Flags */}
        {record.painFlags && Object.keys(record.painFlags).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Pain Indicators
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(record.painFlags).map(([toothNumber, pain]) => (
                <div key={toothNumber} className="bg-red-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Tooth {toothNumber}</span>
                    <span className="text-red-600 font-semibold">{pain.level}/10</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{pain.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showHistory) {
    if (dentalHistory.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 text-center">
          <Circle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No dental history available</p>
        </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Circle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Dental History</h3>
                <p className="text-sm text-gray-600">
                  {dentalHistory.length} record{dentalHistory.length > 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* History Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Visit Record
            </label>
            <select
              value={selectedRecord?.id || ''}
              onChange={(e) => {
                const record = dentalHistory.find(r => r.id === parseInt(e.target.value));
                setSelectedRecord(record);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {dentalHistory.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.visit?.visitUid || 'Unknown Visit'} - {new Date(record.createdAt).toLocaleDateString()}
                  {record.doctor?.fullname && ` (Dr. ${record.doctor.fullname})`}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Record Details */}
          {selectedRecord && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(selectedRecord.createdAt).toLocaleDateString()}</span>
                  </div>
                  {selectedRecord.doctor?.fullname && (
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Dr. {selectedRecord.doctor.fullname}</span>
                    </div>
                  )}
                  {selectedRecord.visit?.visitUid && (
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{selectedRecord.visit.visitUid}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {renderDentalChart(selectedRecord)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single record display (for results queue)
  if (!dentalRecord) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 text-center">
          <Circle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No dental chart available for this visit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Circle className="h-6 w-6 text-blue-600" />
              </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Dental Chart</h3>
              <p className="text-sm text-gray-600">
                {dentalRecord.doctor?.fullname && `Examined by Dr. ${dentalRecord.doctor.fullname}`}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <Circle className="h-4 w-4 mr-1" />
            Completed
          </span>
        </div>
      </div>

      <div className="p-6">
        {renderDentalChart(dentalRecord)}
      </div>
    </div>
  );
};

export default DentalChartDisplay;
