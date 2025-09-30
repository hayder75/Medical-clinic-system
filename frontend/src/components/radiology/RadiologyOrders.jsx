import React, { useState, useEffect } from 'react';
import { Scan, Clock, CheckCircle, AlertTriangle, FileText, Upload, Image, User, Calendar, Stethoscope, X, Plus, Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RadiologyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [expandedTests, setExpandedTests] = useState({});
  const [statusFilter, setStatusFilter] = useState('PENDING');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/radiologies/orders');
      console.log('Fetched orders:', response.data);
      setOrders(response.data.batchOrders || []);
    } catch (error) {
      toast.error('Failed to fetch radiology orders');
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

  const fetchExistingResults = async (batchOrderId) => {
    try {
      const response = await api.get(`/radiologies/batch-orders/${batchOrderId}/results`);
      console.log('Existing results:', response.data);
      const existingResults = {};
      
      if (response.data && response.data.radiologyResults) {
        response.data.radiologyResults.forEach(result => {
          existingResults[result.testTypeId] = {
            resultText: result.resultText || '',
            additionalNotes: result.additionalNotes || '',
            files: result.attachments || [],
            completed: true,
            resultId: result.id
          };
        });
      }
      
      return existingResults;
    } catch (error) {
      console.error('Error fetching existing results:', error);
      return {};
    }
  };

  const handleOrderClick = async (order) => {
    console.log('Order clicked:', order);
    setSelectedOrder(order);
    setShowReportForm(true);
    
    // Initialize test results for each radiology test
    const initialResults = {};
    order.services.forEach(service => {
      if (service.investigationType && service.investigationType.category === 'RADIOLOGY') {
        initialResults[service.investigationType.id] = {
          resultText: '',
          additionalNotes: '',
          files: [],
          completed: false,
          resultId: null
        };
      }
    });
    
    // Fetch existing results and merge with initial results
    const existingResults = await fetchExistingResults(order.id);
    const mergedResults = { ...initialResults, ...existingResults };
    
    console.log('Merged results:', mergedResults);
    setTestResults(mergedResults);
  };

  const updateTestResult = (testId, field, value) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async (testId, file) => {
    try {
      setUploadingFiles(prev => ({ ...prev, [testId]: true }));
      
      const testResult = testResults[testId];
      if (!testResult) {
        toast.error('Test result not found');
        return;
      }

      // If result already exists, upload to the existing result
      if (testResult.resultId) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(
          `/radiologies/batch-orders/${selectedOrder.id}/results/${testResult.resultId}/file`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        // Update the test result with the new file
        updateTestResult(testId, 'files', [...(testResult.files || []), response.data.file]);
        toast.success('File uploaded successfully');
      } else {
        // If no result exists yet, store the file locally and upload when result is submitted
        const fileData = {
          id: Date.now(), // Temporary ID
          originalName: file.name,
          fileType: file.type,
          size: file.size,
          file: file, // Store the actual file object
          uploaded: false
        };
        
        updateTestResult(testId, 'files', [...(testResult.files || []), fileData]);
        toast.success('File added. Will be uploaded when you submit the result.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [testId]: false }));
    }
  };

  const handleSubmitTestResult = async (testId) => {
    try {
      const testResult = testResults[testId];
      if (!testResult || !testResult.resultText) {
        toast.error('Please enter result text');
        return;
      }

      // Check if result already exists
      if (testResult.completed) {
        toast.error('Result already submitted for this test');
        return;
      }

      console.log('Submitting test result:', {
        testTypeId: parseInt(testId),
        resultText: testResult.resultText,
        additionalNotes: testResult.additionalNotes || ''
      });

      // Create radiology result
      const response = await api.post(`/radiologies/batch-orders/${selectedOrder.id}/results`, {
        testTypeId: parseInt(testId),
        resultText: testResult.resultText,
        additionalNotes: testResult.additionalNotes || ''
      });

      console.log('Test result submitted:', response.data);

      const resultId = response.data.radiologyResult.id;

      // Upload any pending files
      const pendingFiles = testResult.files?.filter(file => !file.uploaded) || [];
      const uploadedFiles = testResult.files?.filter(file => file.uploaded) || [];

      for (const fileData of pendingFiles) {
        try {
          const formData = new FormData();
          formData.append('file', fileData.file);

          const uploadResponse = await api.post(
            `/radiologies/batch-orders/${selectedOrder.id}/results/${resultId}/file`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          // Mark file as uploaded
          fileData.uploaded = true;
          fileData.id = uploadResponse.data.file.id;
          fileData.originalName = uploadResponse.data.file.originalName;
          fileData.fileType = uploadResponse.data.file.type;
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.error(`Failed to upload ${fileData.originalName}`);
        }
      }

      // Mark as completed locally
      updateTestResult(testId, 'completed', true);
      updateTestResult(testId, 'resultId', resultId);

      toast.success('Test result submitted successfully');
    } catch (error) {
      console.error('Error submitting test result:', error);
      if (error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        if (errorMessage.includes('already exists')) {
          // If result already exists, mark it as completed locally
          updateTestResult(testId, 'completed', true);
          toast.error('Result already exists for this test');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Failed to submit test result');
      }
    }
  };

  const handleCompleteBatchOrder = async () => {
    try {
      // Check if all tests are completed
      const allTestsCompleted = Object.values(testResults).every(result => result.completed);
      if (!allTestsCompleted) {
        toast.error('Please complete all tests before marking the batch as completed');
        return;
      }

      // Mark the entire batch order as completed
      const response = await api.put(`/radiologies/batch-orders/${selectedOrder.id}/results`, {
        result: 'All radiology tests completed',
        additionalNotes: 'Batch order completed by radiology technician'
      });

      console.log('Batch order completed:', response.data);
      toast.success('Batch order completed successfully');
      
      // Close the form and refresh orders
      setShowReportForm(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error completing batch order:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to complete batch order');
      }
    }
  };

  const toggleTestExpansion = (testId) => {
    setExpandedTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'QUEUED':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'QUEUED':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Scan className="h-6 w-6 mr-2" />
          Radiology Orders
        </h1>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
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

      {getFilteredOrders().length === 0 ? (
        <div className="text-center py-12">
          <Scan className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {statusFilter === 'PENDING' ? 'No pending radiology orders found' :
             statusFilter === 'COMPLETED' ? 'No completed radiology orders found' :
             'No radiology orders found'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {getFilteredOrders().map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-lg shadow-md border p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200 ${
                order.status === 'QUEUED' ? 'border-yellow-200' : 
                order.status === 'COMPLETED' ? 'border-green-200' : 'border-gray-200'
              }`}
              onClick={() => handleOrderClick(order)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id} – {order.patient.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {order.services
                        .filter(service => service.investigationType?.category === 'RADIOLOGY')
                        .map(service => service.investigationType?.name)
                        .join(', ')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>{order.patient.name}</span>
                </div>
                <div className="flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  <span>{order.doctor.fullname}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {(order.status === 'QUEUED' || order.status === 'COMPLETED') && (
                <div className={`mt-4 p-3 rounded-lg ${
                  order.status === 'QUEUED' ? 'bg-yellow-50' : 'bg-green-50'
                }`}>
                  <p className={`text-sm font-medium ${
                    order.status === 'QUEUED' ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                    {order.status === 'QUEUED' ? 'Click to process tests' : 'Click to view results'}
                  </p>
                </div>
              )}

              {order.instructions && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Instructions:</strong> {order.instructions}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Form Modal */}
      {showReportForm && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Radiology Results - Order #{selectedOrder.id}
              </h2>
              <button
                onClick={() => {
                  setShowReportForm(false);
                  setSelectedOrder(null);
                  setTestResults({});
                  setExpandedTests({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {selectedOrder.patient.name}</div>
                  <div><strong>Type:</strong> {selectedOrder.patient.type}</div>
                  <div><strong>Mobile:</strong> {selectedOrder.patient.mobile}</div>
                  <div><strong>Email:</strong> {selectedOrder.patient.email}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Radiology Tests</h3>
                {selectedOrder.services
                  .filter(service => service.investigationType?.category === 'RADIOLOGY')
                  .map((service, index) => {
                    const testId = service.investigationType.id;
                    const testResult = testResults[testId] || {};
                    const isExpanded = expandedTests[testId];
                    const isCompleted = testResult.completed;

                    return (
                      <div key={testId} className="border rounded-lg p-4">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleTestExpansion(testId)}
                        >
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {service.investigationType.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {service.investigationType.price} ETB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isCompleted && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            <span className="text-sm text-gray-500">
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Test Report *
                              </label>
                              <textarea
                                value={testResult.resultText || ''}
                                onChange={(e) => updateTestResult(testId, 'resultText', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                                placeholder="Enter test results and findings..."
                                disabled={isCompleted}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Notes
                              </label>
                              <textarea
                                value={testResult.additionalNotes || ''}
                                onChange={(e) => updateTestResult(testId, 'additionalNotes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={2}
                                placeholder="Any additional notes or observations..."
                                disabled={isCompleted}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Attachments
                              </label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      handleFileUpload(testId, file);
                                    }
                                  }}
                                  className="hidden"
                                  id={`file-upload-${testId}`}
                                  disabled={isCompleted}
                                />
                                <label
                                  htmlFor={`file-upload-${testId}`}
                                  className={`flex flex-col items-center justify-center py-4 cursor-pointer ${
                                    isCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-600">
                                    {uploadingFiles[testId] ? 'Uploading...' : 'Click to upload files'}
                                  </p>
                                </label>
                              </div>

                              {testResult.files && testResult.files.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {testResult.files.map((file, fileIndex) => (
                                    <div key={fileIndex} className="flex items-center justify-between text-sm">
                                      <div className="flex items-center space-x-2 text-gray-600">
                                        <FileText className="h-4 w-4" />
                                        <span>{file.originalName}</span>
                                        <span className="text-gray-400">
                                          {file.fileType}
                                        </span>
                                      </div>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        file.uploaded 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {file.uploaded ? 'Uploaded' : 'Pending'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {!isCompleted && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleSubmitTestResult(testId)}
                                  disabled={!testResult.resultText}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Submit Result
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowReportForm(false);
                    setSelectedOrder(null);
                    setTestResults({});
                    setExpandedTests({});
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteBatchOrder}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Complete Batch Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadiologyOrders;
