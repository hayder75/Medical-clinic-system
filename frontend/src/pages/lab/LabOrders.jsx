import React, { useState, useEffect } from 'react';
import { TestTube, Clock, CheckCircle, AlertTriangle, FileText, User, Calendar, Stethoscope, X, Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LabOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceTemplate, setShowServiceTemplate] = useState(false);
  const [savedFormData, setSavedFormData] = useState({});

  useEffect(() => {
    fetchOrders();
    fetchTemplates();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/labs/orders');
      // Combine batch orders with walk-in orders; tag each with a kind to avoid key collisions
      const batchOrders = (response.data.batchOrders || []).map(o => ({ ...o, __kind: 'batch' }));
      const walkInOrders = (response.data.walkInOrders || []).map(o => ({ ...o, __kind: 'walkin' }));
      const allOrders = [...batchOrders, ...walkInOrders];
      setOrders(allOrders);
    } catch (error) {
      toast.error('Failed to fetch lab orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/labs/templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;
    
    // Status filter
    if (statusFilter === 'PENDING') {
      filtered = filtered.filter(order => order.status !== 'COMPLETED');
    } else if (statusFilter === 'COMPLETED') {
      filtered = filtered.filter(order => order.status === 'COMPLETED');
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.doctor?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.type?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort completed orders by date (recent first)
    if (statusFilter === 'COMPLETED') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB - dateA; // Descending order
      });
    }
    
    return filtered;
  };

  const fetchExistingResults = async (batchOrderId) => {
    try {
      const response = await api.get(`/labs/orders/${batchOrderId}/detailed-results`);
      const existingResults = {};
      
      if (response.data && response.data.detailedResults) {
        response.data.detailedResults.forEach(result => {
          existingResults[result.templateId] = {
            results: result.results || {},
            additionalNotes: result.additionalNotes || '',
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
    setSelectedOrder(order);
    setShowTemplateForm(true);
    
    // Check if this is a completed order
    const isCompleted = order.status === 'COMPLETED';
    
    // Initialize test results for each lab service
    const initialResults = {};
    
    // Handle walk-in orders (has services array with individual orders) vs batch orders
    const services = order.services || (order.type ? [{ service: order.type, id: order.id }] : []);
    
    // If completed, load existing results
    if (isCompleted) {
      for (const service of services) {
        if (service.service) {
          const orderId = service.id || order.id;
          
          // Fetch existing results from database
          try {
            // For walk-in orders, get results from labResults
            if (order.isWalkIn && service.labResults && service.labResults.length > 0) {
              service.labResults.forEach(labResult => {
                if (labResult.testType && labResult.resultText) {
                  const matchingTemplate = templates.find(t => 
                    labResult.testType.id === service.service.id
                  );
                  
                  if (matchingTemplate) {
                    initialResults[orderId] = {
                      serviceId: service.id,
                      labOrderId: orderId,
                      templateId: matchingTemplate.id,
                      template: matchingTemplate,
                      serviceName: service.service.name,
                      results: JSON.parse(labResult.resultText || '{}'),
                      additionalNotes: labResult.additionalNotes || '',
                      completed: true,
                      resultId: labResult.id
                    };
                  }
                }
              });
            }
          } catch (err) {
            console.error('Error loading existing results:', err);
          }
        }
      }
    } else {
      // Not completed - prepare empty forms
      services.forEach(service => {
        if (service.service) {
          // Find matching template
          const matchingTemplate = templates.find(template => {
            const serviceName = service.service.name.toLowerCase();
            const templateName = template.name.toLowerCase();
            
            if (serviceName === templateName) return true;
            if (serviceName.includes(templateName) || templateName.includes(serviceName)) return true;
            
            const serviceWords = serviceName.split(' ');
            const templateWords = templateName.split(' ');
            
            return serviceWords.some(word => 
              templateWords.some(tWord => 
                word.includes(tWord) || tWord.includes(word)
              )
            );
          });

          if (matchingTemplate) {
            // For walk-in orders, use the actual order ID from the service object
            const orderId = service.id || order.id;
            
            initialResults[orderId] = {
              serviceId: service.id,
              labOrderId: orderId,
              templateId: matchingTemplate.id,
              template: matchingTemplate,
              serviceName: service.service.name,
              results: {},
              additionalNotes: '',
              completed: false,
              resultId: null
            };
          } else {
            console.log('No template found for service:', service.service.name);
          }
        }
      });
    }
    
    setTestResults(initialResults);
  };

  const handleServiceClick = (serviceId) => {
    // Allow viewing completed orders, but will be read-only
    setSelectedService(serviceId);
    setShowServiceTemplate(true);
  };
  
  const handlePrintResults = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab Results - ${selectedOrder.patient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .patient-info { margin: 20px 0; }
            .test-section { page-break-inside: avoid; margin: 30px 0; border: 1px solid #ddd; padding: 15px; }
            .test-title { font-size: 18px; font-weight: bold; background: #f0f0f0; padding: 10px; margin: -15px -15px 15px -15px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            td { padding: 8px; border: 1px solid #ddd; }
            .field-name { font-weight: bold; background: #f9f9f9; }
            .notes { margin-top: 15px; padding: 10px; background: #f9f9f9; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Lab Test Results</h1>
            <div class="patient-info">
              <p><strong>Patient:</strong> ${selectedOrder.patient.name}</p>
              <p><strong>Order ID:</strong> ${selectedOrder.id}</p>
              <p><strong>Date:</strong> ${new Date(selectedOrder.updatedAt || selectedOrder.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          ${Object.entries(testResults).map(([serviceId, result]) => `
            <div class="test-section">
              <div class="test-title">${result.serviceName}</div>
              <table>
                ${Object.entries(result.results).map(([field, value]) => `
                  <tr>
                    <td class="field-name">${field}</td>
                    <td>${value || '-'}</td>
                  </tr>
                `).join('')}
              </table>
              ${result.additionalNotes ? `<div class="notes"><strong>Notes:</strong> ${result.additionalNotes}</div>` : ''}
            </div>
          `).join('')}
          
          <p style="margin-top: 40px; text-align: center; color: #666;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  
  const handleDownloadPDF = async () => {
    // TODO: Implement PDF generation using a library like jsPDF
    // For now, use the same print functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab Results - ${selectedOrder.patient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .patient-info { margin: 20px 0; }
            .test-section { page-break-inside: avoid; margin: 30px 0; border: 1px solid #ddd; padding: 15px; }
            .test-title { font-size: 18px; font-weight: bold; background: #f0f0f0; padding: 10px; margin: -15px -15px 15px -15px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            td { padding: 8px; border: 1px solid #ddd; }
            .field-name { font-weight: bold; background: #f9f9f9; }
            .notes { margin-top: 15px; padding: 10px; background: #f9f9f9; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Lab Test Results</h1>
            <div class="patient-info">
              <p><strong>Patient:</strong> ${selectedOrder.patient.name}</p>
              <p><strong>Order ID:</strong> ${selectedOrder.id}</p>
              <p><strong>Date:</strong> ${new Date(selectedOrder.updatedAt || selectedOrder.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          ${Object.entries(testResults).map(([serviceId, result]) => `
            <div class="test-section">
              <div class="test-title">${result.serviceName}</div>
              <table>
                ${Object.entries(result.results).map(([field, value]) => `
                  <tr>
                    <td class="field-name">${field}</td>
                    <td>${value || '-'}</td>
                  </tr>
                `).join('')}
              </table>
              ${result.additionalNotes ? `<div class="notes"><strong>Notes:</strong> ${result.additionalNotes}</div>` : ''}
            </div>
          `).join('')}
          
          <p style="margin-top: 40px; text-align: center; color: #666;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    toast.success('PDF prepared for printing/download');
  };

  const handleCloseServiceTemplate = () => {
    // Auto-save the current form data
    if (selectedService && testResults[selectedService]) {
      const serviceKey = `${selectedOrder.id}-${selectedService}`;
      setSavedFormData(prev => ({
        ...prev,
        [serviceKey]: testResults[selectedService].results
      }));
    }
    
    setShowServiceTemplate(false);
    setSelectedService(null);
  };

  const updateTestResult = (serviceId, field, value) => {
    setTestResults(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value
      }
    }));
  };


  const renderFormField = (fieldName, fieldConfig, serviceId) => {
    const value = testResults[serviceId]?.results?.[fieldName] || '';
    const isCompleted = selectedOrder && selectedOrder.status === 'COMPLETED';
    const baseClassName = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`;
    
    switch (fieldConfig.type) {
      case 'number':
        return (
          <input
            type="number"
            value={value}
            readOnly={isCompleted}
            onChange={(e) => {
              if (isCompleted) return;
              const newResults = { ...testResults[serviceId].results };
              newResults[fieldName] = e.target.value;
              updateTestResult(serviceId, 'results', newResults);
            }}
            className={baseClassName}
            placeholder={fieldConfig.unit ? `Enter value (${fieldConfig.unit})` : 'Enter value'}
            required={fieldConfig.required}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            disabled={isCompleted}
            onChange={(e) => {
              if (isCompleted) return;
              const newResults = { ...testResults[serviceId].results };
              newResults[fieldName] = e.target.value;
              updateTestResult(serviceId, 'results', newResults);
            }}
            className={baseClassName}
            required={fieldConfig.required}
          >
            <option value="">Select an option</option>
            {fieldConfig.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            readOnly={isCompleted}
            onChange={(e) => {
              if (isCompleted) return;
              const newResults = { ...testResults[serviceId].results };
              newResults[fieldName] = e.target.value;
              updateTestResult(serviceId, 'results', newResults);
            }}
            className={baseClassName}
            rows={3}
            placeholder="Enter details..."
            required={fieldConfig.required}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            readOnly={isCompleted}
            onChange={(e) => {
              if (isCompleted) return;
              const newResults = { ...testResults[serviceId].results };
              newResults[fieldName] = e.target.value;
              updateTestResult(serviceId, 'results', newResults);
            }}
            className={baseClassName}
            placeholder="Enter value..."
            required={fieldConfig.required}
          />
        );
    }
  };

  const handleCompleteBatchOrder = async () => {
    try {
      // Check if all tests have required fields filled
      const allTestsHaveResults = Object.values(testResults).every(result => {
        if (!result.template) return false;
        
        return Object.entries(result.template.fields).every(([field, config]) => {
          if (!config.required) return true;
          return result.results[field] && result.results[field].toString().trim() !== '';
        });
      });

      if (!allTestsHaveResults) {
        toast.error('Please fill all required fields for all tests before submitting');
        return;
      }

      // Check if this is a walk-in order
      const isWalkIn = selectedOrder.isWalkIn;

      // Submit all test results
      const testResultsArray = Object.entries(testResults).map(([labOrderId, result]) => ({
        labOrderId: parseInt(result.labOrderId || labOrderId), // Use the actual order ID
        serviceId: parseInt(result.serviceId || labOrderId), // The service ID (same as order ID for walk-ins)
        templateId: result.templateId,
        results: result.results,
        additionalNotes: result.additionalNotes || ''
      }));

      // Send each result individually
      for (const testResult of testResultsArray) {
        await api.post('/labs/results/individual', testResult);
      }

      // For walk-in orders, complete each individual order
      // For regular orders, send to doctor
      if (!isWalkIn) {
        await api.post(`/labs/orders/${selectedOrder.id}/send-to-doctor`);
        toast.success('All lab tests completed and sent to doctor successfully');
      } else {
        // Update each walk-in order status to completed
        for (const labOrderId of Object.keys(testResults)) {
          await api.patch(`/labs/orders/${labOrderId}`, { status: 'COMPLETED' });
        }
        toast.success('Walk-in lab tests completed successfully! Results ready for printing.');
      }
      
      // Close the form and refresh orders
      setShowTemplateForm(false);
      setSelectedOrder(null);
      setTestResults({});
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
          <TestTube className="h-6 w-6 mr-2" />
          Lab Orders
        </h1>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by patient name, doctor, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
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
          <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {statusFilter === 'PENDING' ? 'No pending lab orders found' :
             statusFilter === 'COMPLETED' ? 'No completed lab orders found' :
             'No lab orders found'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {getFilteredOrders().map((order) => (
            <div
              key={`${order.__kind || (order.isWalkIn ? 'walkin' : 'batch')}-${order.id}`}
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
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id} – {order.patient.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.services 
                        ? order.services.map(service => service.service?.name).filter(name => name).join(', ')
                        : order.type?.name || 'Lab Test'}
                      {order.isWalkIn && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">WALK-IN</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>{order.patient.name}</span>
                </div>
                {order.doctor && (
                  <div className="flex items-center">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    <span>{order.doctor.fullname}</span>
                  </div>
                )}
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

      {/* Order Services Modal */}
      {showTemplateForm && selectedOrder && !showServiceTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Lab Services - Order #{selectedOrder.id} ({selectedOrder.patient.name})
              </h2>
              <button
                onClick={() => {
                  setShowTemplateForm(false);
                  setSelectedOrder(null);
                  setTestResults({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> {selectedOrder.instructions || 'No specific instructions'}
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(testResults).map(([serviceId, result]) => {
                const hasResults = Object.values(result.results).some(value => value && value.toString().trim() !== '');
                
                return (
                  <div key={serviceId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TestTube className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium text-gray-900">{result.serviceName}</h3>
                          <p className="text-sm text-gray-600">{result.template.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {hasResults && <CheckCircle className="h-4 w-4 text-green-500" />}
                        <span className={`px-2 py-1 rounded text-xs ${
                          hasResults ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedOrder.status === 'COMPLETED' ? 'Completed' : hasResults ? 'Filled' : 'Empty'}
                        </span>
                        {selectedOrder.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleServiceClick(serviceId)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            {hasResults ? 'Edit Results' : 'Fill Results'}
                          </button>
                        )}
                        {selectedOrder.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleServiceClick(serviceId)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                          >
                            View Results
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t gap-2">
              {selectedOrder.status === 'COMPLETED' ? (
                <>
                  <button
                    onClick={() => handlePrintResults()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Print Results
                  </button>
                  <button
                    onClick={() => handleDownloadPDF()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCompleteBatchOrder}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Complete All Tests
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Individual Service Template Modal */}
      {showServiceTemplate && selectedService && testResults[selectedService] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {testResults[selectedService].serviceName} - Template Form
              </h2>
              <button
                onClick={handleCloseServiceTemplate}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">{testResults[selectedService].template.name}</h4>
                <p className="text-sm text-blue-700">{testResults[selectedService].template.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(testResults[selectedService].template.fields).map(([fieldName, fieldConfig]) => (
                  <div key={fieldName} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {fieldName}
                      {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                      {fieldConfig.unit && <span className="text-gray-500 ml-1">({fieldConfig.unit})</span>}
                    </label>
                    {renderFormField(fieldName, fieldConfig, selectedService)}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  value={testResults[selectedService].additionalNotes || ''}
                  readOnly={selectedOrder && selectedOrder.status === 'COMPLETED'}
                  onChange={(e) => {
                    if (selectedOrder && selectedOrder.status === 'COMPLETED') return;
                    updateTestResult(selectedService, 'additionalNotes', e.target.value);
                  }}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    selectedOrder && selectedOrder.status === 'COMPLETED' ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  rows={3}
                  placeholder="Enter any additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={handleCloseServiceTemplate}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabOrders;