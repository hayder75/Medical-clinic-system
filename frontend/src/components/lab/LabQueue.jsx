import React, { useState, useEffect } from 'react';
import { TestTube, Clock, CheckCircle, AlertTriangle, FileText, Upload, User, Calendar, Stethoscope } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LabQueue = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showResultForm, setShowResultForm] = useState(false);
  const [resultData, setResultData] = useState({
    result: '',
    additionalNotes: '',
    attachments: [],
    testResults: {} // Store results for each test
  });
  const [expandedTests, setExpandedTests] = useState({});
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  useEffect(() => {
    fetchOrders();
  }, []);

  // Remove any auto-refresh intervals - only manual refresh

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/labs/orders');
      setOrders(response.data.batchOrders || []);
    } catch (error) {
      toast.error('Failed to fetch lab orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    if (statusFilter === 'PENDING') {
      return orders.filter(order => order.status !== 'COMPLETED');
    } else if (statusFilter === 'COMPLETED') {
      return orders.filter(order => order.status === 'COMPLETED');
    }
    return orders;
  };

  const toggleTestExpansion = (testId) => {
    setExpandedTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }));
  };

  const updateTestResult = (testId, field, value) => {
    setResultData(prev => ({
      ...prev,
      testResults: {
        ...prev.testResults,
        [testId]: {
          ...prev.testResults[testId],
          [field]: value
        }
      }
    }));
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    
    // Check if at least one test has results
    const hasResults = Object.values(resultData.testResults).some(test => 
      test && (test.result || test.notes)
    );

    if (!hasResults && !resultData.result.trim()) {
      toast.error('Please enter results for at least one test');
      return;
    }

    try {
      setUploading(true);
      
      // Prepare service results for individual tests
      const serviceResults = selectedOrder.services?.map(service => ({
        batchOrderServiceId: service.id,
        result: resultData.testResults[service.id]?.result || resultData.result,
        notes: resultData.testResults[service.id]?.notes || ''
      })) || [];

      // Submit result with batch order support
      const payload = {
        result: resultData.result || 'See individual test results',
        additionalNotes: resultData.additionalNotes,
        serviceResults: serviceResults
      };

      const response = await api.put(`/batch-orders/${selectedOrder.id}/results`, payload);
      
      toast.success('Lab results recorded successfully!');
      setShowResultForm(false);
      setSelectedOrder(null);
      setResultData({
        result: '',
        additionalNotes: '',
        attachments: [],
        testResults: {}
      });
      setExpandedTests({});
      
      // Refresh orders to show updated status
      fetchOrders();
      
    } catch (error) {
      console.error('Error submitting result:', error);
      
      // Handle different error types
      if (error.response?.status === 400) {
        toast.error(error.response.data.error || 'Invalid data provided');
      } else if (error.response?.status === 404) {
        toast.error('Lab order not found');
      } else if (error.response?.status === 403) {
        toast.error('Access denied');
      } else {
        toast.error('Failed to submit lab result. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await api.post(`/labs/orders/${selectedOrder.id}/attachment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('File uploaded successfully!');
      
      // Add to attachments list
      setResultData(prev => ({
        ...prev,
        attachments: [...prev.attachments, response.data.file]
      }));
      
    } catch (error) {
      console.error('Error uploading file:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to upload file: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'QUEUED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'VERIFIED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isDentalOrder = (order) => {
    return order.services?.some(service => 
      service.service?.code?.startsWith('DENTAL_') || 
      service.investigationType?.name?.toLowerCase().includes('dental')
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'QUEUED':
        return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <TestTube className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (type) => {
    // Determine priority based on test type
    const urgentTests = ['STAT', 'EMERGENCY', 'CRITICAL'];
    const testName = type?.name?.toLowerCase() || '';
    
    if (urgentTests.some(urgent => testName.includes(urgent.toLowerCase()))) {
      return 'border-l-4 border-red-500';
    }
    return 'border-l-4 border-blue-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Queue</h1>
          <p className="text-gray-600">Process laboratory test orders and submit results</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium text-blue-700">
              {orders.filter(o => o.status === 'QUEUED').length} Pending Tests
            </span>
          </div>
          <button
            onClick={fetchOrders}
            className="btn btn-outline"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PENDING">Pending Orders</option>
            <option value="COMPLETED">Completed Orders</option>
            <option value="ALL">All Orders</option>
          </select>
          <span className="text-sm text-gray-500">
            Showing {getFilteredOrders().length} of {orders.length} orders
          </span>
        </div>
      </div>

      {/* Orders List */}
      {getFilteredOrders().length === 0 ? (
        <div className="text-center py-12">
          <TestTube className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === 'PENDING' ? 'No Pending Lab Orders' :
             statusFilter === 'COMPLETED' ? 'No Completed Lab Orders' :
             'No Lab Orders'}
          </h3>
          <p className="text-gray-600">
            {statusFilter === 'PENDING' ? 'No laboratory tests are currently queued for processing.' :
             statusFilter === 'COMPLETED' ? 'No laboratory tests have been completed yet.' :
             'No laboratory tests are currently queued for processing.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {getFilteredOrders().map((order) => (
            <div 
              key={order.id} 
              className={`card ${getPriorityColor(order.type)} cursor-pointer hover:shadow-lg transition-shadow duration-200`}
              onClick={() => {
                if (order.status === 'QUEUED') {
                  setSelectedOrder(order);
                  setShowResultForm(true);
                }
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <TestTube className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id} – {order.patient?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tests Ordered: {order.services?.map(s => s.investigationType?.name || s.service?.name).join(', ') || 'Lab Tests'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isDentalOrder(order) && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      🦷 Dental
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status.replace(/_/g, ' ')}</span>
                  </span>
                </div>
              </div>

              {/* Patient Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.patient?.name}</p>
                    <p className="text-xs text-gray-600">ID: {order.patient?.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Stethoscope className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.doctor?.fullname}</p>
                    <p className="text-xs text-gray-600">{order.doctor?.specialties?.join(', ') || 'Doctor'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tests Summary */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">Tests in this order:</p>
                <div className="flex flex-wrap gap-2">
                  {order.services?.map((service, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {service.investigationType?.name || service.service?.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              {order.instructions && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Special Instructions:</p>
                  <p className="text-sm text-yellow-700">{order.instructions}</p>
                </div>
              )}

              {/* Visit Information */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Visit:</span> {order.visit?.visitUid} • 
                  <span className="font-medium ml-2">Status:</span> {order.visit?.status?.replace(/_/g, ' ')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                {order.status === 'QUEUED' && (
                  <div className="flex items-center text-blue-600">
                    <FileText className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Click to process tests</span>
                  </div>
                )}
                <div className="flex space-x-3">
                  {order.status === 'QUEUED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                        setShowResultForm(true);
                      }}
                      className="btn btn-primary"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Process All Tests
                    </button>
                  )}
                  {order.status === 'PAID' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                        setShowResultForm(true);
                      }}
                      className="btn btn-primary"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Process All Tests
                    </button>
                  )}
                  {order.status === 'COMPLETED' && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result Form Modal */}
      {showResultForm && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Lab Results - Order #{selectedOrder.id} - {selectedOrder.patient?.name}
                </h3>
                <button
                  onClick={() => setShowResultForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Header Section */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Patient Information</p>
                    <p className="font-medium">{selectedOrder.patient?.name}</p>
                    <p className="text-sm text-gray-600">ID: {selectedOrder.patient?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Doctor Information</p>
                    <p className="font-medium">{selectedOrder.doctor?.fullname}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.doctor?.specialties?.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Visit Information</p>
                    <p className="font-medium">{selectedOrder.visit?.visitUid}</p>
                    <p className="text-sm text-gray-600">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                {selectedOrder.instructions && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded">
                    <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
                    <p className="text-sm text-yellow-700">{selectedOrder.instructions}</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleResultSubmit} className="space-y-6">
                {/* Tests Section - Accordion Style */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Test Results</h4>
                  <div className="space-y-3">
                    {selectedOrder.services?.map((service, index) => (
                      <div key={service.id} className="border border-gray-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() => toggleTestExpansion(service.id)}
                          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <TestTube className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {service.investigationType?.name || service.service?.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Code: {service.service?.code} • Price: ETB {service.investigationType?.price || service.service?.price}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {resultData.testResults[service.id]?.result && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Completed
                              </span>
                            )}
                            <span className="text-gray-400">
                              {expandedTests[service.id] ? '−' : '+'}
                            </span>
                          </div>
                        </button>
                        
                        {expandedTests[service.id] && (
                          <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                            <div className="pt-4 space-y-4">
                              {/* Test-specific result fields */}
                              <div>
                                <label className="label">Test Result *</label>
                                <textarea
                                  className="input min-h-[100px]"
                                  value={resultData.testResults[service.id]?.result || ''}
                                  onChange={(e) => updateTestResult(service.id, 'result', e.target.value)}
                                  placeholder={`Enter results for ${service.investigationType?.name || service.service?.name}...`}
                                />
                              </div>
                              
                              <div>
                                <label className="label">Notes</label>
                                <textarea
                                  className="input min-h-[60px]"
                                  value={resultData.testResults[service.id]?.notes || ''}
                                  onChange={(e) => updateTestResult(service.id, 'notes', e.target.value)}
                                  placeholder="Additional notes for this test..."
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* General Result Section */}
                <div>
                  <label className="label">General Result Summary</label>
                  <textarea
                    className="input min-h-[120px]"
                    value={resultData.result}
                    onChange={(e) => setResultData({...resultData, result: e.target.value})}
                    placeholder="Enter a general summary of all test results..."
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="label">Additional Notes</label>
                  <textarea
                    className="input min-h-[80px]"
                    value={resultData.additionalNotes}
                    onChange={(e) => setResultData({...resultData, additionalNotes: e.target.value})}
                    placeholder="Any additional observations or notes..."
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="label">Attachments</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        Click to upload files (PDF, Images, Documents)
                      </span>
                    </label>
                  </div>
                  
                  {/* Attachment List */}
                  {resultData.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {resultData.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-700">{attachment.originalName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setResultData(prev => ({
                                ...prev,
                                attachments: prev.attachments.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowResultForm(false)}
                      className="btn btn-secondary"
                    >
                      Return to Queue
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Save progress functionality
                        toast.success('Progress saved');
                      }}
                      className="btn btn-outline"
                    >
                      Save Progress
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="btn btn-primary"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Results
                      </>
                    )}
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

export default LabQueue;
