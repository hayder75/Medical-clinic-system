import React, { useState, useEffect } from 'react';
import { TestTube, Clock, CheckCircle, AlertTriangle, FileText, User, Calendar, Stethoscope, X, Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { getServerUrl } from '../../utils/imageUrl';
import { useAuth } from '../../contexts/AuthContext';
import { checkLabTemplateStandard, checkLabFieldStandard } from '../../utils/medicalStandards';
import { checkValueInNormalRange } from '../../utils/normalRangeParser';
import { generateDefaultResults } from '../../utils/labDefaultValues';

const LabOrders = () => {
  const { user } = useAuth();
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
      console.log('📋 [fetchOrders] Raw response:', {
        batchOrders: response.data.batchOrders?.length || 0,
        walkInOrders: response.data.walkInOrders?.length || 0,
        labTestOrders: response.data.labTestOrders?.length || 0
      });
      
      // Log sample lab test orders structure
      if (response.data.labTestOrders && response.data.labTestOrders.length > 0) {
        const sample = response.data.labTestOrders[0];
        console.log('📋 [fetchOrders] Sample lab test order group:', {
          id: sample.id,
          visitId: sample.visitId,
          patientId: sample.patientId,
          ordersCount: sample.orders?.length,
          firstOrder: sample.orders?.[0] ? {
            id: sample.orders[0].id,
            hasLabTest: !!sample.orders[0].labTest,
            labTestName: sample.orders[0].labTest?.name,
            resultFieldsCount: sample.orders[0].labTest?.resultFields?.length
          } : null
        });
      }
      
      // Combine all order types: old batch orders, old walk-in orders, and new lab test orders
      const allOrders = [
        ...(response.data.batchOrders || []),
        ...(response.data.walkInOrders || []),
        ...(response.data.labTestOrders || [])
      ];
      setOrders(allOrders);
      console.log('📋 [fetchOrders] Total orders set:', allOrders.length);
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
    console.log('🔍 [handleOrderClick] Order clicked:', {
      id: order.id,
      visitId: order.visitId,
      patientId: order.patientId,
      hasOrders: !!order.orders,
      ordersCount: order.orders?.length,
      orders: order.orders?.map(o => ({ id: o.id, labTestName: o.labTest?.name, hasLabTest: !!o.labTest }))
    });
    
    setSelectedOrder(order);
    setShowTemplateForm(true);
    
    // Check if this is a new lab test order (has orders array)
    // Also check if it has visitId but no services (indicating new system)
    const hasOrdersArray = order.orders && Array.isArray(order.orders) && order.orders.length > 0;
    const hasVisitIdNoServices = order.visitId && !order.services && !order.type;
    const isNewLabTestOrder = hasOrdersArray || hasVisitIdNoServices;
    
    console.log('🔍 [handleOrderClick] Order detection:', {
      hasOrdersArray,
      ordersLength: order.orders?.length,
      hasVisitIdNoServices,
      visitId: order.visitId,
      hasServices: !!order.services,
      hasType: !!order.type,
      isNewLabTestOrder
    });
    
    // Make sure templates are loaded first (for old system)
    if (!isNewLabTestOrder && templates.length === 0) {
      await fetchTemplates();
    }
    
    // Initialize test results for each lab service
    const initialResults = {};
    
    // NEW SYSTEM: Handle lab test orders
    if (isNewLabTestOrder) {
      // If orders array is missing but we detected it as new system, we need to fetch the orders
      let ordersToProcess = order.orders || [];
      
      if (ordersToProcess.length === 0 && order.visitId) {
        console.warn('⚠️ [handleOrderClick] Orders array is empty for new system order, attempting to fetch...');
        try {
          // Fetch orders for this visit
          const ordersResponse = await api.get('/labs/orders');
          const allLabTestOrders = ordersResponse.data.labTestOrders || [];
          const matchingOrderGroup = allLabTestOrders.find(o => 
            (o.visitId === order.visitId && o.patientId === order.patientId) ||
            (o.id === order.id) ||
            (o.batchOrderId === order.batchOrderId)
          );
          if (matchingOrderGroup && matchingOrderGroup.orders && matchingOrderGroup.orders.length > 0) {
            ordersToProcess = matchingOrderGroup.orders;
            console.log('✅ [handleOrderClick] Fetched orders from API:', ordersToProcess.length);
            // Update the order object
            order.orders = ordersToProcess;
            // Also update selectedOrder to have the orders
            setSelectedOrder({ ...order, orders: ordersToProcess });
          } else {
            console.error('❌ [handleOrderClick] No matching order group found in API response');
            console.log('   Searched for:', { visitId: order.visitId, patientId: order.patientId, id: order.id, batchOrderId: order.batchOrderId });
            console.log('   Available groups:', allLabTestOrders.map(o => ({ id: o.id, visitId: o.visitId, patientId: o.patientId, ordersCount: o.orders?.length })));
          }
        } catch (err) {
          console.error('❌ [handleOrderClick] Error fetching orders:', err);
        }
      }
      
      if (ordersToProcess.length === 0) {
        console.error('❌ [handleOrderClick] No orders found to process for new lab test order!');
        console.error('   Order object:', {
          id: order.id,
          visitId: order.visitId,
          patientId: order.patientId,
          batchOrderId: order.batchOrderId,
          hasOrders: !!order.orders,
          ordersLength: order.orders?.length
        });
        toast.error('No lab test orders found. The order may not be properly loaded. Please refresh the page and try again.');
        return;
      }
      
      console.log('🔍 [handleOrderClick] Processing new lab test orders, count:', ordersToProcess.length);
      
      // Fetch existing results for each order
      for (const labOrder of ordersToProcess) {
        const orderId = labOrder.id;
        const labTest = labOrder.labTest;
        
        console.log('🔍 [handleOrderClick] Processing order:', {
          orderId,
          hasLabTest: !!labTest,
          labTestName: labTest?.name,
          resultFieldsCount: labTest?.resultFields?.length
        });
        
        if (!labTest) {
          console.warn('⚠️ [handleOrderClick] Order missing labTest, skipping:', orderId);
          continue;
        }
        
        // Fetch existing result if any
        let existingResult = null;
        try {
          // Check if result exists in the order data
          if (labOrder.results && labOrder.results.length > 0) {
            existingResult = labOrder.results[0]; // Take first result
            console.log('✅ [handleOrderClick] Found result in order data:', {
              resultId: existingResult.id,
              hasResults: !!existingResult.results,
              resultsKeys: existingResult.results ? Object.keys(existingResult.results) : []
            });
          } else {
            // If no result in order data, try fetching directly from API
            console.log('⚠️ [handleOrderClick] No result in order data, checking if order is completed...');
            // Results should be included in the initial fetch, but if missing, we'll handle it in display
          }
        } catch (err) {
          console.error('Error fetching existing result:', err);
        }
        
        // Parse results if it's stored as JSON string
        let parsedResults = {};
        if (existingResult && existingResult.results) {
          if (typeof existingResult.results === 'string') {
            try {
              parsedResults = JSON.parse(existingResult.results);
            } catch (e) {
              parsedResults = {};
            }
          } else {
            parsedResults = existingResult.results;
          }
        } else {
          // No existing result - generate defaults from normalRange
          const defaultResults = generateDefaultResults(labTest.resultFields || []);
          parsedResults = defaultResults;
        }
        
        // Mark as completed if result exists or if order status is COMPLETED
        const isCompleted = existingResult ? true : (labOrder.status === 'COMPLETED');
        
        // Initialize with resultFields from labTest
        initialResults[orderId] = {
          orderId: orderId,
          labTestId: labTest.id,
          labTest: labTest,
          resultFields: labTest.resultFields || [],
          results: parsedResults,
          additionalNotes: existingResult?.additionalNotes || '',
          completed: isCompleted,
          resultId: existingResult?.id || null,
          serviceName: labTest.name
        };
        
        console.log('✅ [handleOrderClick] Result data:', {
          orderId,
          serviceName: labTest.name,
          hasResults: Object.keys(parsedResults).length > 0,
          isCompleted,
          hasExistingResult: !!existingResult
        });
        
        console.log('✅ [handleOrderClick] Added to initialResults:', {
          orderId,
          serviceName: labTest.name,
          resultFieldsCount: (labTest.resultFields || []).length
        });
      }
      
      console.log('✅ [handleOrderClick] Total initialResults:', Object.keys(initialResults).length);
      setTestResults(initialResults);
      return;
    }
    
    console.log('⚠️ [handleOrderClick] Not a new lab test order, using old system');
    
    // OLD SYSTEM: Handle batch orders and walk-in orders
    const services = order.services || (order.type ? [{ service: order.type, id: order.id }] : []);
    
    // Always try to fetch existing results first (regardless of order status)
    let existingResults = {};
    try {
      if (order.isWalkIn) {
        // For walk-in orders, check labResults in the order data
        services.forEach(service => {
          if (service.labResults && service.labResults.length > 0) {
            const orderId = service.id || order.id;
            service.labResults.forEach(labResult => {
              if (labResult.testType && labResult.resultText) {
                const matchingTemplate = templates.find(t => 
                  labResult.testType.id === service.service.id
                );
                
                if (matchingTemplate) {
                  existingResults[orderId] = {
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
        });
      } else {
        // For batch orders, fetch from detailed-results endpoint
        try {
          const response = await api.get(`/labs/orders/${order.id}/detailed-results`);
          console.log('📋 Fetched detailed results:', response.data);
          if (response.data && response.data.detailedResults) {
            response.data.detailedResults.forEach(result => {
              console.log('📋 Processing result:', {
                serviceId: result.serviceId,
                templateId: result.templateId,
                hasResults: !!result.results,
                resultsKeys: result.results ? Object.keys(result.results) : []
              });
              
              // Find the service that matches this result by serviceId
              const matchingService = services.find(s => s.id === result.serviceId);
              if (matchingService && matchingService.service) {
                const serviceId = matchingService.id;
                
                // Find matching template - try by ID first, then from result, then by name
                let matchingTemplate = templates.find(t => t.id === result.templateId);
                if (!matchingTemplate && result.template) {
                  matchingTemplate = result.template;
                  // Also add it to templates array if not already there
                  if (!templates.find(t => t.id === result.template.id)) {
                    templates.push(result.template);
                  }
                }
                if (!matchingTemplate) {
                  // Try to find by service name
                  const serviceName = matchingService.service.name.toLowerCase();
                  matchingTemplate = templates.find(t => {
                    const templateName = t.name.toLowerCase();
                    return serviceName === templateName || 
                           serviceName.includes(templateName) || 
                           templateName.includes(serviceName);
                  });
                }
                
                // Parse results if it's a string, otherwise use as-is
                let parsedResults = result.results || {};
                if (typeof parsedResults === 'string') {
                  try {
                    parsedResults = JSON.parse(parsedResults);
                  } catch (e) {
                    console.error('Error parsing results:', e);
                    parsedResults = {};
                  }
                }
                
                console.log('✅ Creating existing result for serviceId:', serviceId, 'with', Object.keys(parsedResults).length, 'fields');
                
                existingResults[serviceId] = {
                  serviceId: serviceId,
                  labOrderId: order.id,
                  templateId: result.templateId,
                  template: matchingTemplate,
                  serviceName: matchingService.service.name,
                  results: parsedResults,
                  additionalNotes: result.additionalNotes || '',
                  completed: true,
                  resultId: result.id
                };
              } else {
                console.warn('⚠️ No matching service found for result.serviceId:', result.serviceId, 'Available services:', services.map(s => s.id));
              }
            });
          }
        } catch (err) {
          console.error('Error fetching detailed results:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching existing results:', err);
      // Continue with empty forms if fetch fails
    }
    
    console.log('📋 Existing results found:', Object.keys(existingResults).length);
    
    // Now prepare forms for all services, using existing results if available
    services.forEach(service => {
      if (service.service) {
        // For batch orders, service.id is the BatchOrderService.id
        // For walk-in orders, service.id is the LabOrder.id
        const serviceId = service.id; // This is the key we'll use in testResults
        const orderId = order.isWalkIn ? service.id : order.id;
        
        // Check if we already have existing results for this service
        if (existingResults[serviceId]) {
          // Use existing results - make sure template is loaded
          const existingResult = existingResults[serviceId];
          console.log('📋 Using existing result for serviceId:', serviceId, {
            hasTemplate: !!existingResult.template,
            templateId: existingResult.templateId,
            resultsCount: Object.keys(existingResult.results || {}).length,
            serviceName: existingResult.serviceName
          });
          
          if (!existingResult.template && existingResult.templateId) {
            // Try to find template if not loaded
            let matchingTemplate = templates.find(t => t.id === existingResult.templateId);
            if (matchingTemplate) {
              existingResult.template = matchingTemplate;
            }
          }
          
          // Ensure results is an object, not empty
          if (!existingResult.results || Object.keys(existingResult.results).length === 0) {
            console.warn('⚠️ Existing result has empty results object for serviceId:', serviceId);
          }
          
          initialResults[serviceId] = existingResult;
        } else {
          // No existing results - prepare empty form
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
            initialResults[serviceId] = {
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
            // No template found - create entry with blank text box option
            initialResults[serviceId] = {
              serviceId: service.id,
              labOrderId: orderId,
              templateId: null,
              template: null,
              serviceName: service.service.name,
              results: {},
              additionalNotes: '',
              completed: false,
              resultId: null
            };
            console.log('No template found for service:', service.service.name, '- Using blank text box');
          }
        }
      }
    });
    
    console.log('Initial results prepared:', Object.keys(initialResults).length, 'services');
    setTestResults(initialResults);
  };

  const handleServiceClick = (serviceId) => {
    // Allow viewing completed orders, but will be read-only
    setSelectedService(serviceId);
    setShowServiceTemplate(true);
  };
  
  const handlePrintResults = () => {
    if (!selectedOrder) return;
    
    const printWindow = window.open('', '_blank');
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
    
    // Get lab technician name from current user
    const labTechnicianName = user?.fullname || 'Lab Technician';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lab Results - ${selectedOrder.patient.name}</title>
          <style>
            @media print {
              @page { margin: 40px 60px; }
              body { margin: 0; }
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px 60px; 
              font-size: 17px;
              color: #000;
            }
            .clinic-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .clinic-name {
              font-size: 23px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .subheader {
              font-size: 18px;
              color: #666;
              margin-bottom: 20px;
            }
            .divider {
              border-top: 1px solid #000;
              margin: 15px 0;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              text-decoration: underline;
              margin: 15px 0 10px 0;
            }
            .patient-info {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              margin-bottom: 15px;
              font-size: 17px;
            }
            .test-section {
              page-break-inside: avoid;
              margin: 30px 0;
            }
            .test-title {
              font-size: 18px;
              font-weight: bold;
              margin: 10px 0 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 16px;
            }
            table td {
              padding: 12px;
              border: 1px solid #ddd;
            }
            .field-name {
              font-weight: bold;
              background: #f0f0f0;
            }
            .notes {
              margin-top: 15px;
              padding: 10px;
              background: #f9f9f9;
              font-style: italic;
              font-size: 16px;
            }
            .footer-section {
              margin-top: 30px;
              border-top: 2px solid #000;
              padding-top: 15px;
            }
            .signature-line {
              margin: 20px 0 5px 0;
              font-size: 16px;
              color: #666;
            }
            .footer-text {
              text-align: center;
              font-size: 15px;
              color: #666;
              margin: 20px 0 5px 0;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="clinic-header">
            <div class="clinic-name">Selihom Medical Clinic</div>
            <div class="subheader">Laboratory Test Results</div>
          </div>
          <div class="divider"></div>
          
          <!-- Patient Information -->
          <div class="section-title">Patient Information</div>
          <div class="patient-info">
            <span><strong>Name:</strong> ${selectedOrder.patient.name}</span>
            <span><strong>ID:</strong> ${selectedOrder.patient.id}</span>
            <span><strong>Gender:</strong> ${selectedOrder.patient.gender || 'N/A'}</span>
            <span><strong>Age:</strong> ${selectedOrder.patient.age || 'N/A'}</span>
            <span><strong>Blood Type:</strong> ${selectedOrder.patient.bloodType || 'N/A'}</span>
            <span><strong>Phone:</strong> ${selectedOrder.patient.mobile || 'N/A'}</span>
          </div>
          <div style="font-size: 21px; margin-bottom: 15px;">
            <strong>Order ID:</strong> ${selectedOrder.id} | 
            <strong>Date:</strong> ${formatDate(new Date(selectedOrder.createdAt))} | 
            <strong>Status:</strong> ${selectedOrder.status.replace(/_/g, ' ')}
          </div>
          <div class="divider"></div>
          
          <!-- Test Results -->
          <div class="section-title">Laboratory Test Results</div>
          ${Object.entries(testResults).map(([serviceId, result], index) => {
            const resultRows = Object.entries(result.results || {}).map(([field, value]) => {
              const fieldConfig = result.template?.fields?.[field] || {};
              const unit = fieldConfig.unit ? ' (' + fieldConfig.unit + ')' : '';
              const displayValue = (value === null || value === undefined || value === '' || String(value).trim() === '') ? '-' : value;
              return '<tr><td class="field-name">' + field + unit + '</td><td>' + displayValue + '</td></tr>';
            }).join('');
            
            const notesHtml = result.additionalNotes ? '<div class="notes"><strong>Notes:</strong> ' + result.additionalNotes + '</div>' : '';
            
            return '<div class="test-section"><div class="test-title">' + (index + 1) + '. ' + result.serviceName + '</div><table>' + resultRows + '</table>' + notesHtml + '</div>';
          }).join('')}
          
          <!-- Footer with Signature -->
          <div class="footer-section">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 20px;">
              <div>
                <span style="color: #666;">Lab Technician: </span>
                <strong>${labTechnicianName}</strong>
              </div>
              <div>
                <span style="color: #666;">Date: </span>
                <strong>${formatDateTime(currentDate)}</strong>
              </div>
            </div>
            <div class="signature-line">Signature: _________________________</div>
            <div class="signature-line">Stamp:</div>
            <div class="footer-text">Selihom Medical Clinic</div>
            <div class="footer-text">Generated on: ${formatDateTime(currentDate)}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
  
  const handleDownloadPDF = async () => {
    if (!selectedOrder) return;
    
    try {
      const response = await api.get(`/labs/orders/${selectedOrder.id}/pdf`);
      const link = document.createElement('a');
      link.href = `${getServerUrl()}${response.data.filePath}`;
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

  const handleCloseServiceTemplate = async () => {
    // Auto-save the current form data to database if it has results
    if (selectedService && testResults[selectedService] && selectedOrder) {
      const result = testResults[selectedService];
      const hasResults = Object.values(result.results || {}).some(value => value && value.toString().trim() !== '') || 
                        (result.additionalNotes && result.additionalNotes.trim() !== '');
      
      if (hasResults) {
        try {
          // Check if this is new lab test order system
          const isNewSystem = result.labTestId && result.orderId;
          
          if (isNewSystem) {
            // NEW SYSTEM: Save using lab test result endpoint
            await api.post('/labs/results/lab-test', {
              orderId: result.orderId,
              labTestId: result.labTestId,
              results: result.results || {},
              additionalNotes: result.additionalNotes || ''
            });
            
            toast.success('Lab test result saved successfully');
          } else {
            // OLD SYSTEM: Save using individual result endpoint
            const labOrderId = selectedOrder.isWalkIn 
              ? parseInt(result.labOrderId || selectedService) 
              : parseInt(selectedOrder.id);
            
            const serviceId = selectedOrder.isWalkIn
              ? parseInt(result.labOrderId || selectedService)
              : parseInt(result.serviceId || selectedService);
            
            await api.post('/labs/results/individual', {
              labOrderId: labOrderId,
              serviceId: serviceId,
              templateId: result.templateId || null,
              results: result.results || {},
              additionalNotes: result.additionalNotes || ''
            });
            
            toast.success('Results saved successfully');
          }
          
          // Update the result in state to mark it as saved
          setTestResults(prev => ({
            ...prev,
            [selectedService]: {
              ...prev[selectedService],
              completed: true
            }
          }));
          
        } catch (error) {
          console.error('Error saving result:', error);
          if (error.response?.status === 404) {
            toast.error('Order or test not found. Please refresh and try again.');
          } else {
            toast.error('Failed to save results: ' + (error.response?.data?.error || error.message));
          }
        }
      }
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
            placeholder={fieldConfig.unit ? `Enter value (${fieldConfig.unit}) - Optional` : 'Enter value (Optional)'}
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
          >
            <option value="">Select an option (Optional)</option>
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
            placeholder="Enter details... (Optional)"
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
            placeholder="Enter value... (Optional)"
          />
        );
    }
  };

  const handleCompleteBatchOrder = async () => {
    try {
      // Check if this is a new lab test order system
      const isNewLabTestOrder = selectedOrder.orders && Array.isArray(selectedOrder.orders);
      const isWalkIn = selectedOrder.isWalkIn;

      if (isNewLabTestOrder) {
        // NEW SYSTEM: Save each lab test order result
        for (const [orderId, result] of Object.entries(testResults)) {
          if (!result.completed && result.orderId) {
            try {
              await api.post('/labs/results/lab-test', {
                orderId: result.orderId,
                labTestId: result.labTestId,
                results: result.results || {},
                additionalNotes: result.additionalNotes || ''
              });
              
              // Mark as completed in state
              setTestResults(prev => ({
                ...prev,
                [orderId]: { ...prev[orderId], completed: true }
              }));
            } catch (error) {
              console.error('Error saving lab test result:', error);
              throw new Error(`Failed to save result for ${result.serviceName || result.labTest?.name}: ${error.response?.data?.error || error.message}`);
            }
          }
        }
        
        // Update all orders to completed and send to doctor if not walk-in
        if (!isWalkIn && selectedOrder.visitId) {
          // For doctor orders, they're automatically sent when all are completed
          toast.success('All lab tests completed and sent to doctor successfully');
        } else {
          toast.success('Walk-in lab tests completed successfully! Results ready for printing.');
        }
      } else {
        // OLD SYSTEM: Handle batch orders and walk-in orders
        const testResultsArray = Object.entries(testResults).map(([serviceIdKey, result]) => {
          const labOrderId = isWalkIn 
            ? parseInt(result.labOrderId || serviceIdKey) 
            : parseInt(selectedOrder.id);
          
          const serviceId = isWalkIn
            ? parseInt(result.labOrderId || serviceIdKey)
            : parseInt(result.serviceId || serviceIdKey);
          
          return {
            labOrderId: labOrderId,
            serviceId: serviceId,
            templateId: result.templateId || null,
            results: result.results || {},
            additionalNotes: result.additionalNotes || ''
          };
        });

        // Send each result individually (only if not already completed)
        for (const testResult of testResultsArray) {
          try {
            const resultEntry = Object.values(testResults).find(r => 
              (r.serviceId === testResult.serviceId || r.labOrderId === testResult.labOrderId) &&
              r.labOrderId === testResult.labOrderId
            );
            
            if (!resultEntry || !resultEntry.completed) {
              await api.post('/labs/results/individual', testResult);
            }
          } catch (error) {
            console.error('Error saving result:', error);
            if (error.response?.status === 404) {
              throw new Error(`Service ${testResult.serviceId} not found in order ${testResult.labOrderId}. Please refresh and try again.`);
            }
            throw error;
          }
        }

        // For walk-in orders, complete each individual order
        // For regular orders, send to doctor
        if (!isWalkIn) {
          await api.post(`/labs/orders/${selectedOrder.id}/send-to-doctor`);
          toast.success('All lab tests completed and sent to doctor successfully');
        } else {
          for (const labOrderId of Object.keys(testResults)) {
            await api.patch(`/labs/orders/${labOrderId}`, { status: 'COMPLETED' });
          }
          toast.success('Walk-in lab tests completed successfully! Results ready for printing.');
        }
      }
      
      // Refresh orders but keep the form open if there are more services to complete
      // Only close if all services are completed
      const allCompleted = Object.values(testResults).every(r => r.completed);
      if (allCompleted) {
        setShowTemplateForm(false);
        setSelectedOrder(null);
        setTestResults({});
      }
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
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.patient.name}
                      </h3>
                      <span className="text-xs text-gray-500 font-normal">
                        (#{order.id})
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.orders && order.orders.length > 0
                        ? order.orders.map(o => o.labTest?.name).filter(name => name).join(', ') || 'Loading...'
                        : order.services && order.services.length > 0
                          ? order.services.map(service => service.service?.name).filter(name => name).join(', ')
                          : order.type?.name || 'Lab Test'}
                      {order.isWalkIn && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">WALK-IN</span>}
                      {order.visitId && (!order.orders || order.orders.length === 0) && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">Loading tests...</span>
                      )}
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
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedOrder.status === 'COMPLETED' ? 'Lab Results' : 'Lab Services'} - Order #{selectedOrder.id}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Patient: {selectedOrder.patient.name} {selectedOrder.patientId && `(${selectedOrder.patientId})`}
                  {selectedOrder.doctor && ` | Doctor: ${selectedOrder.doctor.fullname}`}
                </p>
                {selectedOrder.status === 'COMPLETED' && (
                  <p className="text-sm text-green-600 mt-1 font-medium">
                    ✓ All tests completed - Results ready for review
                  </p>
                )}
              </div>
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
              {selectedOrder.createdAt && (
                <p className="text-xs text-blue-600 mt-1">
                  Created: {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Tests Ordered Summary */}
            {selectedOrder.orders && selectedOrder.orders.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Tests Ordered:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.orders.map((order, idx) => (
                    <span key={order.id || idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {order.labTest?.name || 'Unknown Test'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(testResults).map(([orderId, result]) => {
                const hasResults = Object.values(result.results || {}).some(value => value && value.toString().trim() !== '') || 
                                  (result.additionalNotes && result.additionalNotes.trim() !== '');
                const isCompleted = result.completed || selectedOrder.status === 'COMPLETED';
                const isNewSystem = !!result.labTest; // New system has labTest
                
                return (
                  <div key={orderId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    {/* Results Display Section for Completed Orders */}
                    {isCompleted && hasResults && isNewSystem && (
                      <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-green-900">{result.serviceName || result.labTest?.name}</h4>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {result.resultFields && result.resultFields.length > 0 && result.resultFields.map((field) => {
                            const fieldValue = result.results?.[field.fieldName];
                            if (!fieldValue && fieldValue !== 0) return null;
                            
                            return (
                              <div key={field.id} className="bg-white p-3 rounded border">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">{field.label}</p>
                                    {field.unit && <p className="text-xs text-gray-500">({field.unit})</p>}
                                  </div>
                                  <p 
                                    className="text-sm font-semibold ml-2"
                                    style={(() => {
                                      const rangeCheck = checkValueInNormalRange(fieldValue, field.normalRange);
                                      if (!rangeCheck.inRange) {
                                        return { color: '#dc2626' }; // red-600
                                      }
                                      return { color: '#111827' }; // gray-900
                                    })()}
                                  >
                                    {fieldValue}
                                  </p>
                                </div>
                                {field.normalRange && (
                                  <p className="text-xs text-gray-500 mt-1">Normal: {field.normalRange}</p>
                                )}
                                {(() => {
                                  const rangeCheck = checkValueInNormalRange(fieldValue, field.normalRange);
                                  if (!rangeCheck.inRange) {
                                    return (
                                      <p className="text-xs text-red-600 font-medium mt-1">
                                        {rangeCheck.message || 'Outside normal range'}
                                      </p>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            );
                          })}
                        </div>
                        {result.additionalNotes && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes:</p>
                            <p className="text-sm text-gray-600">{result.additionalNotes}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TestTube className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium text-gray-900">{result.serviceName || result.labTest?.name}</h3>
                          {isNewSystem && result.labTest?.description && (
                            <p className="text-sm text-gray-600">{result.labTest.description}</p>
                          )}
                          {!isNewSystem && result.template && (
                            <p className="text-sm text-gray-600">{result.template.description}</p>
                          )}
                          {isNewSystem && result.resultFields && result.resultFields.length > 0 && !isCompleted && (
                            <p className="text-xs text-gray-500">{result.resultFields.length} field(s) to fill</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {(hasResults || isCompleted) && <CheckCircle className="h-4 w-4 text-green-500" />}
                        <span className={`px-2 py-1 rounded text-xs ${
                          (hasResults || isCompleted) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isCompleted ? 'Completed' : hasResults ? 'Filled' : 'Empty'}
                        </span>
                        {!isCompleted && (
                          <button
                            onClick={() => handleServiceClick(orderId)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            {hasResults ? 'Edit Results' : 'Fill Results'}
                          </button>
                        )}
                        {isCompleted && (
                          <button
                            onClick={() => handleServiceClick(orderId)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                          >
                            View/Edit Results
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
                {testResults[selectedService].serviceName} - {testResults[selectedService].template ? 'Template Form' : 'Test Results'}
              </h2>
              <button
                onClick={handleCloseServiceTemplate}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* NEW SYSTEM: Show resultFields from labTest */}
              {testResults[selectedService].labTest && testResults[selectedService].resultFields ? (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">{testResults[selectedService].labTest.name}</h4>
                    {testResults[selectedService].labTest.description && (
                      <p className="text-sm text-blue-700">{testResults[selectedService].labTest.description}</p>
                    )}
                    {testResults[selectedService].labTest.group && (
                      <p className="text-xs text-blue-600 mt-1">Group: {testResults[selectedService].labTest.group.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testResults[selectedService].resultFields.map((field) => {
                      const result = testResults[selectedService];
                      const fieldValue = result.results?.[field.fieldName] || '';
                      const isCompleted = selectedOrder && selectedOrder.status === 'COMPLETED';
                      
                      return (
                        <div key={field.id} className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.unit && <span className="text-gray-500 ml-1">({field.unit})</span>}
                          </label>
                          {field.normalRange && (
                            <p className="text-xs text-gray-500">Normal: {field.normalRange}</p>
                          )}
                          {(() => {
                            const rangeCheck = checkValueInNormalRange(fieldValue, field.normalRange);
                            if (!rangeCheck.inRange && fieldValue !== '' && fieldValue !== null && fieldValue !== undefined) {
                              return (
                                <p className="text-xs text-red-600 font-medium mt-1">
                                  {rangeCheck.message || 'Outside normal range'}
                                </p>
                              );
                            }
                            return null;
                          })()}
                          
                          {/* Render field based on fieldType */}
                          {field.fieldType === 'number' ? (
                            <input
                              type="number"
                              step="any"
                              value={fieldValue}
                              readOnly={isCompleted}
                              onChange={(e) => {
                                if (isCompleted) return;
                                const newResults = { ...result.results };
                                newResults[field.fieldName] = e.target.value;
                                updateTestResult(selectedService, 'results', newResults);
                              }}
                              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isCompleted ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 
                                (() => {
                                  const rangeCheck = checkValueInNormalRange(fieldValue, field.normalRange);
                                  return rangeCheck.inRange || !fieldValue ? 'border-gray-300' : 'border-red-500';
                                })()
                              }`}
                              style={(() => {
                                const rangeCheck = checkValueInNormalRange(fieldValue, field.normalRange);
                                if (!rangeCheck.inRange && fieldValue !== '' && fieldValue !== null && fieldValue !== undefined) {
                                  return { color: '#dc2626' }; // red-600
                                }
                                return {};
                              })()}
                              placeholder={`Enter value${field.unit ? ` (${field.unit})` : ''}`}
                            />
                          ) : field.fieldType === 'select' ? (
                            (() => {
                              // Parse options - could be JSON string or already an array
                              let optionsList = [];
                              if (field.options) {
                                if (typeof field.options === 'string') {
                                  try {
                                    optionsList = JSON.parse(field.options);
                                  } catch (e) {
                                    console.error('Error parsing options:', e);
                                    optionsList = [];
                                  }
                                } else if (Array.isArray(field.options)) {
                                  optionsList = field.options;
                                }
                              }
                              
                              return (
                                <select
                                  value={fieldValue}
                                  disabled={isCompleted}
                                  onChange={(e) => {
                                    if (isCompleted) return;
                                    const newResults = { ...result.results };
                                    newResults[field.fieldName] = e.target.value;
                                    updateTestResult(selectedService, 'results', newResults);
                                  }}
                                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                  <option value="">-- Select --</option>
                                  {optionsList.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              );
                            })()
                          ) : field.fieldType === 'binary' ? (
                            (() => {
                              // Binary fields default to Positive/Negative if no options provided
                              let optionsList = ['Positive', 'Negative'];
                              if (field.options) {
                                if (typeof field.options === 'string') {
                                  try {
                                    optionsList = JSON.parse(field.options);
                                  } catch (e) {
                                    console.error('Error parsing options:', e);
                                  }
                                } else if (Array.isArray(field.options)) {
                                  optionsList = field.options;
                                }
                              }
                              
                              return (
                                <select
                                  value={fieldValue}
                                  disabled={isCompleted}
                                  onChange={(e) => {
                                    if (isCompleted) return;
                                    const newResults = { ...result.results };
                                    newResults[field.fieldName] = e.target.value;
                                    updateTestResult(selectedService, 'results', newResults);
                                  }}
                                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                  <option value="">-- Select --</option>
                                  {optionsList.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              );
                            })()
                          ) : field.fieldType === 'textarea' || field.fieldType === 'text' ? (
                            field.fieldType === 'textarea' ? (
                              <textarea
                                value={fieldValue}
                                readOnly={isCompleted}
                                onChange={(e) => {
                                  if (isCompleted) return;
                                  const newResults = { ...result.results };
                                  newResults[field.fieldName] = e.target.value;
                                  updateTestResult(selectedService, 'results', newResults);
                                }}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                rows={3}
                                placeholder="Enter details..."
                                required={field.isRequired}
                              />
                            ) : (
                              <input
                                type="text"
                                value={fieldValue}
                                readOnly={isCompleted}
                                onChange={(e) => {
                                  if (isCompleted) return;
                                  const newResults = { ...result.results };
                                  newResults[field.fieldName] = e.target.value;
                                  updateTestResult(selectedService, 'results', newResults);
                                }}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Enter value..."
                              />
                            )
                          ) : (
                            <input
                              type="text"
                              value={fieldValue}
                              readOnly={isCompleted}
                              onChange={(e) => {
                                if (isCompleted) return;
                                const newResults = { ...result.results };
                                newResults[field.fieldName] = e.target.value;
                                updateTestResult(selectedService, 'results', newResults);
                              }}
                              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              placeholder="Enter value..."
                              required={field.isRequired}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={testResults[selectedService].additionalNotes || ''}
                      readOnly={selectedOrder && selectedOrder.status === 'COMPLETED'}
                      onChange={(e) => {
                        if (selectedOrder && selectedOrder.status === 'COMPLETED') return;
                        updateTestResult(selectedService, 'additionalNotes', e.target.value);
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedOrder && selectedOrder.status === 'COMPLETED' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      rows={3}
                      placeholder="Any additional notes or observations..."
                    />
                  </div>
                </>
              ) : testResults[selectedService].template ? (
                <>
                  {/* OLD SYSTEM: Show template fields */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">{testResults[selectedService].template.name}</h4>
                    <p className="text-sm text-blue-700">{testResults[selectedService].template.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(testResults[selectedService].template.fields).map(([fieldName, fieldConfig]) => {
                      const result = testResults[selectedService];
                      const fieldValue = result.results?.[fieldName];
                      const fieldCheck = checkLabFieldStandard(fieldName, fieldValue, fieldConfig.unit);
                      
                      return (
                        <div key={fieldName} className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700">
                            {fieldName}
                            <span className="text-gray-400 ml-1 text-xs">(Optional)</span>
                            {fieldConfig.unit && <span className="text-gray-500 ml-1">({fieldConfig.unit})</span>}
                          </label>
                          {renderFormField(fieldName, fieldConfig, selectedService)}
                          {/* Individual Field Warning */}
                          {fieldCheck.message && (
                            <div className={`mt-1 p-2 rounded text-xs ${
                              fieldCheck.status === 'critical' 
                                ? 'bg-red-50 border border-red-200 text-red-800' 
                                : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                            }`}>
                              <div className="flex items-start">
                                <AlertTriangle className={`h-3 w-3 mt-0.5 mr-1 flex-shrink-0 ${
                                  fieldCheck.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                                }`} />
                                <span className="font-medium">{fieldCheck.message}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Overall Template Warning (if needed) */}
                  {(() => {
                    const result = testResults[selectedService];
                    const standardCheck = checkLabTemplateStandard(result.results || {}, result.template);
                    if (standardCheck.warning && standardCheck.fieldWarnings.length === 0) {
                      return (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-800">{standardCheck.warning}</p>
                              <p className="text-xs text-red-600 mt-1">
                                Fields filled: {standardCheck.filledCount} / {standardCheck.totalFields} | 
                                Standard: Min {standardCheck.standard.minFields}, Recommended {standardCheck.standard.recommendedFields}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

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
                </>
              ) : (
                <>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> This service does not have a template. Please write the test results below.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Test Results <span className="text-gray-400 ml-1 text-xs">(Optional)</span>
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
                      rows={10}
                      placeholder="Enter test results and findings here. This will be sent to the doctor... (Optional)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Write detailed test results, findings, and any relevant information for the doctor. All fields are optional.
                    </p>
                  </div>
                </>
              )}
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