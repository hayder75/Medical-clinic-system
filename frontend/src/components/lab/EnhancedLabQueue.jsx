import React, { useState, useEffect } from 'react';
import { TestTube, Clock, CheckCircle, AlertTriangle, FileText, Upload, User, Calendar, Stethoscope, Plus, Eye, Save, Send, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DynamicLabForm from './DynamicLabForm';
import LabTemplateSelector from './LabTemplateSelector';

const EnhancedLabQueue = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [detailedResults, setDetailedResults] = useState({});
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [draftResults, setDraftResults] = useState({});
  const [showBatchSubmit, setShowBatchSubmit] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const fetchDetailedResults = async (labOrderId) => {
    try {
      const response = await api.get(`/labs/orders/${labOrderId}/detailed-results`);
      return response.data.detailedResults || [];
    } catch (error) {
      console.error('Error fetching detailed results:', error);
      return [];
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

  const handleOrderSelect = async (order) => {
    setSelectedOrder(order);
    
    // Fetch detailed results for this order
    const results = await fetchDetailedResults(order.id);
    setDetailedResults(prev => ({
      ...prev,
      [order.id]: results
    }));
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    setShowDetailedForm(true);
  };

  const handleDetailedFormSubmit = async (resultData) => {
    try {
      // Refresh orders to show updated status
      await fetchOrders();
      
      // Refresh detailed results for this order
      const results = await fetchDetailedResults(selectedOrder.id);
      setDetailedResults(prev => ({
        ...prev,
        [selectedOrder.id]: results
      }));
      
      toast.success('Lab results submitted successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleDraftSave = (resultData) => {
    setDraftResults(prev => ({
      ...prev,
      [selectedOrder.id]: {
        ...prev[selectedOrder.id],
        [resultData.templateId]: resultData
      }
    }));
    setShowDetailedForm(false);
    setSelectedTemplate(null);
  };

  const handleBatchSubmit = async () => {
    if (!selectedOrder) return;

    const orderDrafts = draftResults[selectedOrder.id] || {};
    const draftArray = Object.values(orderDrafts);

    if (draftArray.length === 0) {
      toast.error('No draft results to submit');
      return;
    }

    try {
      setLoading(true);
      
      // Submit all draft results
      for (const draft of draftArray) {
        await api.post('/labs/results/detailed', draft);
      }

      // Clear drafts
      setDraftResults(prev => ({
        ...prev,
        [selectedOrder.id]: {}
      }));

      // Refresh data
      await fetchOrders();
      const results = await fetchDetailedResults(selectedOrder.id);
      setDetailedResults(prev => ({
        ...prev,
        [selectedOrder.id]: results
      }));

      setShowBatchSubmit(false);
      toast.success(`Successfully submitted ${draftArray.length} lab result(s)!`);
    } catch (error) {
      console.error('Error submitting batch results:', error);
      toast.error('Failed to submit some results');
    } finally {
      setLoading(false);
    }
  };

  const getDraftCount = (orderId) => {
    const orderDrafts = draftResults[orderId] || {};
    return Object.keys(orderDrafts).length;
  };

  const getExcludedTemplateIds = (orderId) => {
    const excluded = new Set();
    const submitted = detailedResults[orderId] || [];
    submitted.forEach(r => excluded.add(r.template?.id));
    const drafts = draftResults[orderId] || {};
    Object.keys(drafts).forEach(tid => excluded.add(tid));
    return Array.from(excluded).filter(Boolean);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'QUEUED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID': return <Clock className="w-4 h-4" />;
      case 'QUEUED': return <TestTube className="w-4 h-4" />;
      case 'IN_PROGRESS': return <AlertTriangle className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const renderDetailedResults = (orderId) => {
    const results = detailedResults[orderId] || [];
    
    if (results.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <TestTube className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No detailed results available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={result.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">{result.template.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(result.status)}`}>
                {result.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.results).map(([fieldName, value]) => {
                const field = result.template.fields.find(f => f.name === fieldName);
                if (!field || !value) return null;
                
                return (
                  <div key={fieldName} className="text-sm">
                    <span className="font-medium text-gray-600">{field.label}:</span>
                    <span className="ml-2 text-gray-800">{value}</span>
                    {field.unit && <span className="text-gray-500 ml-1">({field.unit})</span>}
                  </div>
                );
              })}
            </div>
            
            {result.additionalNotes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {result.additionalNotes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TestTube className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Lab Queue</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="ALL">All</option>
          </select>
          
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Lab Orders</h2>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : getFilteredOrders().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No lab orders found</p>
              </div>
            ) : (
              getFilteredOrders().map(order => (
                <div
                  key={order.id}
                  onClick={() => handleOrderSelect(order)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className="ml-2 font-medium text-gray-800">
                        {order.patient.name}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center mb-1">
                      <User className="w-4 h-4 mr-1" />
                      <span>Dr. {order.doctor.fullname}</span>
                    </div>
                    <div className="flex items-center mb-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <TestTube className="w-4 h-4 mr-1" />
                      <span>{order.services.length} test(s)</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Order Details</h2>
          </div>
          
          <div className="p-4">
            {selectedOrder ? (
              <div>
                <div className="mb-6">
                  <h3 className="font-medium text-gray-800 mb-2">Patient Information</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p><span className="font-medium">Name:</span> {selectedOrder.patient.name}</p>
                    <p><span className="font-medium">Type:</span> {selectedOrder.patient.type}</p>
                    <p><span className="font-medium">Mobile:</span> {selectedOrder.patient.mobile}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-800 mb-2">Requested Tests</h3>
                  <div className="space-y-2">
                    {selectedOrder.services.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{service.investigationType?.name || service.service?.name}</span>
                        <span className="text-xs text-gray-500">{service.service?.code}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800">Detailed Results</h3>
                    <div className="flex items-center space-x-2">
                      {getDraftCount(selectedOrder.id) > 0 && (
                        <button
                          onClick={() => setShowBatchSubmit(true)}
                          className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Submit All ({getDraftCount(selectedOrder.id)})
                        </button>
                      )}
                      <button
                        onClick={() => setShowTemplateSelector(true)}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Results
                      </button>
                    </div>
                  </div>
                  
                  {/* Draft Results */}
                  {getDraftCount(selectedOrder.id) > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Save className="w-4 h-4 text-yellow-600 mr-2" />
                          <span className="text-sm font-medium text-yellow-800">
                            {getDraftCount(selectedOrder.id)} draft result(s) ready for submission
                          </span>
                        </div>
                        <button
                          onClick={() => setShowBatchSubmit(true)}
                          className="text-sm text-yellow-700 hover:text-yellow-800 underline"
                        >
                          Submit All
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {renderDetailedResults(selectedOrder.id)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select an order to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4">
            <LabTemplateSelector
              labOrderId={selectedOrder?.id}
              onTemplateSelect={handleTemplateSelect}
              onClose={() => setShowTemplateSelector(false)}
              isDraft={true}
              excludedTemplateIds={selectedOrder ? getExcludedTemplateIds(selectedOrder.id) : []}
            />
          </div>
        </div>
      )}

      {/* Detailed Form Modal */}
      {showDetailedForm && selectedTemplate && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <DynamicLabForm
              labOrderId={selectedOrder.id}
              template={selectedTemplate}
              onSubmit={handleDraftSave}
              onClose={() => {
                setShowDetailedForm(false);
                setSelectedTemplate(null);
              }}
              isDraft={true}
            />
          </div>
        </div>
      )}

      {/* Batch Submit Modal */}
      {showBatchSubmit && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Submit All Results</h3>
              <button
                onClick={() => setShowBatchSubmit(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit all {getDraftCount(selectedOrder.id)} draft result(s) for {selectedOrder.patient.name}?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBatchSubmit(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchSubmit}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLabQueue;
