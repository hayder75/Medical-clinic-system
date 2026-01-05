import React, { useState, useEffect } from 'react';
import { TestTube, Plus, X, CheckCircle, Clock, ChevronDown, ChevronRight, Package } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LabOrdering = ({ visitId, patientId, onOrdersPlaced, existingOrders = [] }) => {
  const [organizedTests, setOrganizedTests] = useState({});
  const [selectedTestIds, setSelectedTestIds] = useState(new Set());
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTests, setFetchingTests] = useState(true);

  useEffect(() => {
    fetchLabTests();
    // Start with all categories collapsed (Standalone Tests is always visible, no dropdown)
    setExpandedCategories(new Set([
      'Standalone Tests' // Always visible, no dropdown needed
    ]));
  }, []);

  const fetchLabTests = async () => {
    try {
      setFetchingTests(true);
      console.log('🔍 [Doctor] Fetching lab tests from /doctors/lab-tests/for-ordering...');
      const response = await api.get('/doctors/lab-tests/for-ordering');
      console.log('✅ [Doctor] Response received:', {
        status: response.status,
        hasData: !!response.data,
        hasOrganized: !!response.data?.organized,
        categories: response.data?.organized ? Object.keys(response.data.organized) : []
      });
      
      if (!response.data?.organized) {
        console.warn('⚠️ [Doctor] Response data missing "organized" field:', response.data);
        toast.error('Invalid response format from server');
        return;
      }
      
      setOrganizedTests(response.data.organized);
      console.log('✅ [Doctor] Tests loaded successfully:', Object.keys(response.data.organized).length, 'categories');
    } catch (error) {
      console.error('❌ [Doctor] Error fetching lab tests:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      if (error.response?.status === 404) {
        toast.error('Lab tests endpoint not found. Please check server configuration.');
      } else if (error.response?.status === 403) {
        toast.error('Permission denied. Please check your user role.');
      } else {
        toast.error(`Failed to fetch lab tests: ${error.message}`);
      }
    } finally {
      setFetchingTests(false);
    }
  };

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Toggle group expansion
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Handle panel selection (select all tests in a group)
  const handlePanelSelect = (group) => {
    const allTestIds = group.tests.map(test => test.id);
    const allSelected = allTestIds.every(id => selectedTestIds.has(id));
    
    setSelectedTestIds(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all
        allTestIds.forEach(id => newSet.delete(id));
      } else {
        // Select all
        allTestIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  // Select all tests across all categories
  const handleSelectAll = () => {
    const allTestIds = new Set();
    Object.values(organizedTests).forEach(category => {
      category.groups?.forEach(group => {
        group.tests?.forEach(test => {
          if (!isTestOrdered(test.id)) {
            allTestIds.add(test.id);
          }
        });
      });
      category.standalone?.forEach(test => {
        if (!isTestOrdered(test.id)) {
          allTestIds.add(test.id);
        }
      });
    });
    
    const allCurrentlySelected = Array.from(selectedTestIds).every(id => allTestIds.has(id));
    const allSelected = allTestIds.size > 0 && allCurrentlySelected && selectedTestIds.size === allTestIds.size;
    
    if (allSelected) {
      // Deselect all
      setSelectedTestIds(new Set());
    } else {
      // Select all available (not already ordered)
      setSelectedTestIds(allTestIds);
    }
  };

  // Check if all available tests are selected
  const areAllTestsSelected = () => {
    const allAvailableTestIds = new Set();
    Object.values(organizedTests).forEach(category => {
      category.groups?.forEach(group => {
        group.tests?.forEach(test => {
          if (!isTestOrdered(test.id)) {
            allAvailableTestIds.add(test.id);
          }
        });
      });
      category.standalone?.forEach(test => {
        if (!isTestOrdered(test.id)) {
          allAvailableTestIds.add(test.id);
        }
      });
    });
    
    if (allAvailableTestIds.size === 0) return false;
    return allAvailableTestIds.size === selectedTestIds.size && 
           Array.from(selectedTestIds).every(id => allAvailableTestIds.has(id));
  };

  // Handle individual test selection
  const handleTestSelect = (testId) => {
    setSelectedTestIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  // Check if panel is fully selected
  const isPanelFullySelected = (group) => {
    if (!group.tests || group.tests.length === 0) return false;
    return group.tests.every(test => selectedTestIds.has(test.id));
  };

  // Check if panel is partially selected
  const isPanelPartiallySelected = (group) => {
    if (!group.tests || group.tests.length === 0) return false;
    const selectedCount = group.tests.filter(test => selectedTestIds.has(test.id)).length;
    return selectedCount > 0 && selectedCount < group.tests.length;
  };

  // Get all selected tests with details
  const getSelectedTests = () => {
    const selected = [];
    Object.values(organizedTests).forEach(category => {
      category.groups?.forEach(group => {
        group.tests?.forEach(test => {
          if (selectedTestIds.has(test.id)) {
            selected.push({ ...test, groupName: group.name });
          }
        });
      });
      category.standalone?.forEach(test => {
        if (selectedTestIds.has(test.id)) {
          selected.push(test);
        }
      });
    });
    return selected;
  };

  // Check if test is already ordered
  const isTestOrdered = (testId) => {
    // Check in existing orders (both old and new system)
    return existingOrders.some(order => {
      if (order.orders) {
        // New system
        return order.orders.some(o => o.labTest?.id === testId);
      } else if (order.services) {
        // Old system
        return order.services.some(s => s.service?.id === testId);
      }
      return false;
    });
  };

  const handleSubmit = async () => {
    if (selectedTestIds.size === 0) {
      toast.error('Please select at least one lab test');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/batch-orders/lab-tests', {
        visitId: parseInt(visitId),
        patientId: patientId.toString(),
        labTestIds: Array.from(selectedTestIds),
        instructions: instructions
      });
      
      toast.success(`Lab orders placed successfully (${selectedTestIds.size} test(s))`);
      
      if (onOrdersPlaced) {
        onOrdersPlaced(response.data);
      }
      
      // Reset form
      setSelectedTestIds(new Set());
      setInstructions('');
      
    } catch (error) {
      console.error('Error placing lab orders:', error);
      const errorMessage = error.response?.data?.error || 'Failed to place lab orders';
      if (errorMessage.includes('inactive') || errorMessage.includes('not found')) {
        toast.error('One or more selected lab tests are inactive or not available. Please refresh and select only active tests.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    return getSelectedTests().reduce((sum, test) => sum + (test.price || 0), 0);
  };

  if (fetchingTests) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Loading lab tests...</span>
      </div>
    );
  }

  const selectedTests = getSelectedTests();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <TestTube className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Lab Test Ordering</h3>
            <p className="text-base text-gray-600">Select and order lab tests</p>
          </div>
        </div>
        {selectedTests.length > 0 && (
          <div className="flex items-center space-x-2 text-base font-semibold text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>{selectedTests.length} test(s) selected</span>
          </div>
        )}
      </div>

      {/* Available Lab Tests - Hierarchical View */}
      <div>
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Available Lab Tests</h4>
        </div>
        
        <div className="space-y-4 max-h-[700px] overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
          {Object.entries(organizedTests).map(([category, data]) => (
            <div key={category} className="border-b border-gray-200 pb-4 last:border-b-0">
              {/* Category Header - For "Standalone Tests", always show expanded, no dropdown */}
              {category === 'Standalone Tests' ? (
                <div className="w-full flex items-center justify-between py-3 px-4 bg-white border border-gray-200 rounded-lg">
                  <span className="text-base font-semibold text-gray-900">{category}</span>
                </div>
              ) : (
                <div
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg transition-all cursor-pointer"
                >
                  <span className="text-base font-semibold text-gray-900">{category}</span>
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              )}

              {/* Category Content */}
              {(category === 'Standalone Tests' || expandedCategories.has(category)) && (
                <div className="mt-3 space-y-3">
                  {/* For "Standalone Tests" category, show tests directly without groups */}
                  {category === 'Standalone Tests' && data.standalone && data.standalone.length > 0 && (
                    <div className="space-y-2">
                      {data.standalone.map((test) => {
                        const isSelected = selectedTestIds.has(test.id);
                        const isOrdered = isTestOrdered(test.id);
                        
                        return (
                          <div
                            key={test.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                              isOrdered 
                                ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed' 
                                : isSelected 
                                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => !isOrdered && handleTestSelect(test.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <TestTube className={`w-6 h-6 ${isOrdered ? 'text-gray-400' : isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                                  <span className={`text-lg font-bold ${isOrdered ? 'text-gray-500' : 'text-gray-900'}`}>
                                    {test.name}
                                  </span>
                                </div>
                                {test.description && (
                                  <p className="text-sm text-gray-600 mt-1 ml-7">{test.description}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-semibold text-gray-700">
                                  {test.price ? `${test.price.toFixed(2)} ETB` : 'N/A'}
                                </span>
                                <label className="flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isOrdered}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleTestSelect(test.id);
                                    }}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Groups (Panels) - for categories with groups */}
                  {category !== 'Standalone Tests' && data.groups && data.groups.map((group) => {
                    const isFullySelected = isPanelFullySelected(group);
                    const isPartiallySelected = isPanelPartiallySelected(group);
                    const isExpanded = expandedGroups.has(group.id);
                    
                    return (
                      <div key={group.id} className="border border-gray-200 rounded-lg bg-white">
                        {/* Panel Header */}
                        <div 
                          onClick={() => toggleGroup(group.id)}
                          className="p-3 bg-gray-50 rounded-t-lg cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1">
                              <div className="flex items-center space-x-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                                <Package className="w-4 h-4 text-gray-600" />
                                <span className="text-base font-semibold text-gray-900">{group.name}</span>
                                {group.description && (
                                  <span className="text-sm text-gray-600 ml-2">({group.description})</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                              <span className="text-sm font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
                                {group.tests?.length || 0} test(s)
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePanelSelect(group);
                                }}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
                                style={{ fontSize: '16px', fontWeight: 'bold' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isFullySelected}
                                  ref={(el) => {
                                    if (el) el.indeterminate = isPartiallySelected;
                                  }}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handlePanelSelect(group);
                                  }}
                                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  style={{ pointerEvents: 'none' }}
                                />
                                <span>
                                  {isFullySelected ? 'Deselect All' : 'Select All'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Panel Children (Tests) */}
                        {isExpanded && group.tests && (
                          <div className="space-y-2">
                            {group.tests.map((test) => {
                              const isSelected = selectedTestIds.has(test.id);
                              const isOrdered = isTestOrdered(test.id);
                              
                              return (
                                <div
                                  key={test.id}
                                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                    isOrdered 
                                      ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed' 
                                      : isSelected 
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                  onClick={() => !isOrdered && handleTestSelect(test.id)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <h5 className="text-base font-semibold text-gray-900">{test.name}</h5>
                                        {isOrdered && (
                                          <span className="px-2 py-1 text-sm bg-gray-200 text-gray-600 rounded">Already Ordered</span>
                                        )}
                                        {isSelected && !isOrdered && (
                                          <CheckCircle className="h-5 w-5 text-blue-600" />
                                        )}
                                      </div>
                                      {test.description && (
                                        <p className="text-base text-gray-600 mt-1">{test.description}</p>
                                      )}
                                    </div>
                                    <div className="ml-3">
                                      {isSelected ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleTestSelect(test.id);
                                          }}
                                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                                        >
                                          <X className="h-5 w-5" />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleTestSelect(test.id);
                                          }}
                                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                        >
                                          <Plus className="h-5 w-5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Standalone Tests - only show for non-Standalone categories */}
                  {category !== 'Standalone Tests' && data.standalone && data.standalone.length > 0 && (
                    <div className="space-y-2">
                      {data.standalone.map((test) => {
                        const isSelected = selectedTestIds.has(test.id);
                        const isOrdered = isTestOrdered(test.id);
                        
                        return (
                          <div
                            key={test.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                              isOrdered 
                                ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed' 
                                : isSelected 
                                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => !isOrdered && handleTestSelect(test.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="text-base font-semibold text-gray-900">{test.name}</h5>
                                  {isOrdered && (
                                    <span className="px-2 py-1 text-sm bg-gray-200 text-gray-600 rounded">Already Ordered</span>
                                  )}
                                  {isSelected && !isOrdered && (
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                                {test.description && (
                                  <p className="text-base text-gray-600 mt-1">{test.description}</p>
                                )}
                              </div>
                              <div className="ml-3">
                                {isSelected ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTestSelect(test.id);
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTestSelect(test.id);
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  >
                                    <Plus className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Tests Summary */}
      {selectedTests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">Selected Lab Tests ({selectedTests.length})</h4>
          <div className="space-y-2">
            {selectedTests.map((test) => (
              <div key={test.id} className="flex items-center justify-between text-base">
                <span className="text-blue-800 font-medium">{test.name}</span>
                {test.groupName && (
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">{test.groupName}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div>
        <label className="block text-base font-semibold text-gray-700 mb-2">
          Instructions for Lab Tests
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows="3"
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add specific instructions for the lab tests..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={selectedTests.length === 0 || loading}
          className="px-6 py-3 text-base font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Ordering...</span>
            </>
          ) : (
            <>
              <TestTube className="h-5 w-5" />
              <span>Order {selectedTests.length} Lab Test(s)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LabOrdering;
