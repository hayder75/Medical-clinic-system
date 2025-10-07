import React, { useState, useEffect } from 'react';
import { TestTube, Search, Filter, Plus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LabTemplateSelector = ({ labOrderId, onTemplateSelect, onClose, isDraft = false, excludedTemplateIds = [] }) => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, selectedCategory, excludedTemplateIds]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/labs/templates');
      const list = Array.isArray(response.data?.templates) ? response.data.templates : Array.isArray(response.data) ? response.data : [];
      setTemplates(list);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(list.map(t => t.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch lab templates');
      setTemplates([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    const source = Array.isArray(templates) ? templates : [];
    let filtered = source;

    // Exclude already used templates (drafts + submitted)
    const excludeSet = new Set(Array.isArray(excludedTemplateIds) ? excludedTemplateIds : []);
    filtered = filtered.filter(t => !excludeSet.has(t.id));

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        (template.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const handleTemplateSelect = (template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TestTube className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">
            {isDraft ? 'Save Draft Results' : 'Select Lab Test Template'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search lab templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {(Array.isArray(categories) ? categories : []).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Array.isArray(filteredTemplates) ? filteredTemplates : []).map(template => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-800">{template.name}</h3>
              <Plus className="w-4 h-4 text-gray-400" />
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {template.description || 'No description available'}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {template.category}
              </span>
              <span className="text-xs text-gray-500">
                {(template.fields || []).length} fields
              </span>
            </div>
          </div>
        ))}
      </div>

      {(Array.isArray(filteredTemplates) ? filteredTemplates : []).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No lab templates found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default LabTemplateSelector;
