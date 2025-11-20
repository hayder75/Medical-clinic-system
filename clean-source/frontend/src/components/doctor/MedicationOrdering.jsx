import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Printer, Pill, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const MedicationOrdering = ({ visitId, patientId, onOrdersPlaced, existingOrders = [] }) => {
  const [medicationSearch, setMedicationSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [customMedication, setCustomMedication] = useState({
    name: '',
    dosageForm: '',
    strength: '',
    quantity: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [medicationCheck, setMedicationCheck] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showContinuousInfusion, setShowContinuousInfusion] = useState(false);
  const [continuousInfusion, setContinuousInfusion] = useState({
    isContinuousInfusion: false,
    continuousInfusionDays: 1,
    dailyDose: '',
    frequency: 'Every 24 hours'
  });

  // Check if medication ordering is allowed
  useEffect(() => {
    checkMedicationOrderingAllowed();
  }, [visitId]);

  const checkMedicationOrderingAllowed = async () => {
    try {
      setIsChecking(true);
      const response = await api.get(`/doctors/visits/${visitId}/medication-check`);
      setMedicationCheck(response.data);
    } catch (error) {
      console.error('Error checking medication ordering:', error);
      setMedicationCheck({
        allowed: false,
        reason: 'Error checking medication ordering status'
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Search medications from inventory
  const searchMedications = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await api.get(`/medications/search?query=${encodeURIComponent(query)}&limit=20`);
      setSearchResults(response.data.medications || []);
    } catch (error) {
      console.error('Error searching medications:', error);
      toast.error('Failed to search medications');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setMedicationSearch(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchMedications(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Add medication from search results
  const addMedicationFromSearch = (medication) => {
    const newMedication = {
      id: medication.id,
      name: medication.name,
      genericName: medication.genericName,
      dosageForm: medication.dosageForm,
      strength: medication.strength,
      manufacturer: medication.manufacturer,
      availableQuantity: medication.availableQuantity,
      unitPrice: medication.unitPrice,
      category: medication.category || 'TABLETS',
      quantity: '',
      frequency: '',
      duration: '',
      instructions: '',
      isCustom: false,
      isContinuousInfusion: continuousInfusion.isContinuousInfusion,
      continuousInfusionDays: continuousInfusion.continuousInfusionDays,
      dailyDose: continuousInfusion.dailyDose
    };

    setSelectedMedications([...selectedMedications, newMedication]);
    setMedicationSearch('');
    setSearchResults([]);
    toast.success(`${medication.name} added to prescription`);
  };

  // Add custom medication
  const addCustomMedication = () => {
    if (!customMedication.name.trim()) {
      toast.error('Please enter medication name');
      return;
    }

    const newMedication = {
      id: `custom-${Date.now()}`,
      name: customMedication.name,
      genericName: customMedication.name,
      dosageForm: customMedication.dosageForm || 'Tablet',
      strength: customMedication.strength || 'N/A',
      manufacturer: 'Custom',
      availableQuantity: 0,
      unitPrice: 0,
      category: 'TABLETS', // Default category for custom medications
      quantity: customMedication.quantity,
      frequency: customMedication.frequency,
      duration: customMedication.duration,
      instructions: customMedication.instructions,
      isCustom: true,
      isContinuousInfusion: continuousInfusion.isContinuousInfusion,
      continuousInfusionDays: continuousInfusion.continuousInfusionDays,
      dailyDose: continuousInfusion.dailyDose
    };

    setSelectedMedications([...selectedMedications, newMedication]);
    setCustomMedication({
      name: '',
      dosageForm: '',
      strength: '',
      quantity: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    setShowCustomForm(false);
    toast.success('Custom medication added to prescription');
  };

  // Update medication details
  const updateMedication = (index, field, value) => {
    const updated = [...selectedMedications];
    updated[index][field] = value;
    setSelectedMedications(updated);
  };

  // Remove medication
  const removeMedication = (index) => {
    const updated = selectedMedications.filter((_, i) => i !== index);
    setSelectedMedications(updated);
  };

  // Submit medication orders
  const submitMedicationOrders = async () => {
    if (selectedMedications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    // Validate all medications have required fields
    const incomplete = selectedMedications.some(med => 
      !med.quantity || !med.frequency || !med.duration
    );

    if (incomplete) {
      toast.error('Please fill in quantity, frequency, and duration for all medications');
      return;
    }

    try {
      // Create individual medication orders
      const orders = selectedMedications.map(med => ({
        visitId: parseInt(visitId),
        patientId: patientId,
        name: med.name,
        dosageForm: med.dosageForm,
        strength: med.strength,
        quantity: med.quantity, // Keep as string - doctor can write anything
        frequency: String(med.frequency), // Ensure frequency is a string
        duration: med.duration,
        instructions: med.instructions,
        additionalNotes: med.isCustom ? 'Custom medication - not in inventory' : '',
        category: med.category || 'TABLETS', // Use actual category or default to TABLETS
        isContinuousInfusion: med.isContinuousInfusion || false,
        continuousInfusionDays: med.continuousInfusionDays || 1,
        dailyDose: med.dailyDose || ''
      }));

      // Submit each order
      for (const order of orders) {
        await api.post('/doctors/medication-orders', order);
      }

      toast.success(`${orders.length} medication(s) prescribed successfully`);
      setSelectedMedications([]);
      
      if (onOrdersPlaced) {
        onOrdersPlaced();
      }
    } catch (error) {
      console.error('Error prescribing medications:', error);
      toast.error(error.response?.data?.error || 'Failed to prescribe medications');
    }
  };

  // Print prescription
  const printPrescription = () => {
    if (selectedMedications.length === 0) {
      toast.error('No medications to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    const prescriptionContent = `
      <html>
        <head>
          <title>Prescription - Order #${visitId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .medication { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; }
            .medication-name { font-weight: bold; font-size: 16px; }
            .medication-details { margin-top: 5px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>MEDICAL PRESCRIPTION</h2>
            <p>Order Number: ${visitId}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          ${selectedMedications.map(med => `
            <div class="medication">
              <div class="medication-name">${med.name}</div>
              <div class="medication-details">
                <strong>Dosage:</strong> ${med.strength} ${med.dosageForm}<br>
                <strong>Quantity:</strong> ${med.quantity}<br>
                <strong>Frequency:</strong> ${med.frequency}<br>
                <strong>Duration:</strong> ${med.duration}<br>
                <strong>Instructions:</strong> ${med.instructions || 'As directed by doctor'}
              </div>
            </div>
          `).join('')}
          
          <div class="footer">
            <p>This prescription can be filled at any pharmacy using Order Number: ${visitId}</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(prescriptionContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Show loading state while checking medication ordering
  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Checking medication ordering status...</span>
      </div>
    );
  }

  // Show warning if medication ordering is not allowed
  if (!medicationCheck?.allowed) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">Medication Ordering Restricted</h3>
            <p className="text-yellow-700 mt-1">{medicationCheck?.reason}</p>
            <p className="text-sm text-yellow-600 mt-2">
              Please wait for all lab and radiology results to be completed before prescribing medications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success message if medication ordering is allowed */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">Medication ordering is allowed</span>
        </div>
        <p className="text-sm text-green-700 mt-1">{medicationCheck?.reason}</p>
      </div>

      {/* Medication Search */}
      <div>
        <h4 className="font-semibold mb-3" style={{ color: '#0C0E0B' }}>Search Medications from Inventory</h4>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search medications by name, generic name, or manufacturer..."
            value={medicationSearch}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
            {searchResults.map((medication) => (
              <div
                key={medication.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => addMedicationFromSearch(medication)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{medication.name}</p>
                    <p className="text-sm text-gray-600">{medication.genericName}</p>
                    <p className="text-sm text-gray-500">
                      {medication.strength} {medication.dosageForm} • {medication.manufacturer}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {medication.availableQuantity} available
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Medication Form */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold" style={{ color: '#0C0E0B' }}>Custom Medication</h4>
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            {showCustomForm ? 'Cancel' : 'Add Custom'}
          </button>
        </div>

        {showCustomForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name *</label>
                <input
                  type="text"
                  value={customMedication.name}
                  onChange={(e) => setCustomMedication({...customMedication, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Aspirin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Form</label>
                <select
                  value={customMedication.dosageForm}
                  onChange={(e) => setCustomMedication({...customMedication, dosageForm: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select form</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Drops">Drops</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
                <input
                  type="text"
                  value={customMedication.strength}
                  onChange={(e) => setCustomMedication({...customMedication, strength: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 500mg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={customMedication.quantity}
                  onChange={(e) => setCustomMedication({...customMedication, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <input
                  type="text"
                  value={customMedication.frequency}
                  onChange={(e) => setCustomMedication({...customMedication, frequency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3 times daily"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={customMedication.duration}
                  onChange={(e) => setCustomMedication({...customMedication, duration: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 7 days"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea
                value={customMedication.instructions}
                onChange={(e) => setCustomMedication({...customMedication, instructions: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Additional instructions for the patient..."
              />
            </div>
            <button
              onClick={addCustomMedication}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
            >
              Add Custom Medication
            </button>
          </div>
        )}
      </div>

      {/* Continuous Infusion Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold" style={{ color: '#0C0E0B' }}>Continuous Infusion</h4>
          <button
            onClick={() => setShowContinuousInfusion(!showContinuousInfusion)}
            className="flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Clock className="h-4 w-4 mr-1" />
            {showContinuousInfusion ? 'Hide' : 'Configure'}
          </button>
        </div>

        {showContinuousInfusion && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={continuousInfusion.isContinuousInfusion}
                  onChange={(e) => setContinuousInfusion({
                    ...continuousInfusion,
                    isContinuousInfusion: e.target.checked
                  })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  This medication requires continuous infusion
                </span>
              </label>
            </div>

            {continuousInfusion.isContinuousInfusion && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={continuousInfusion.continuousInfusionDays}
                    onChange={(e) => setContinuousInfusion({
                      ...continuousInfusion,
                      continuousInfusionDays: parseInt(e.target.value) || 1
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Dose
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 5ml over 24h"
                    value={continuousInfusion.dailyDose}
                    onChange={(e) => setContinuousInfusion({
                      ...continuousInfusion,
                      dailyDose: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={continuousInfusion.frequency}
                    onChange={(e) => setContinuousInfusion({
                      ...continuousInfusion,
                      frequency: e.target.value
                    })}
                  >
                    <option value="Every 24 hours">Every 24 hours</option>
                    <option value="Every 12 hours">Every 12 hours</option>
                    <option value="Every 8 hours">Every 8 hours</option>
                    <option value="Every 6 hours">Every 6 hours</option>
                    <option value="Continuous">Continuous</option>
                  </select>
                </div>
              </div>
            )}

            {continuousInfusion.isContinuousInfusion && (
              <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                <div className="text-sm text-purple-800">
                  <strong>Infusion Schedule:</strong> {continuousInfusion.continuousInfusionDays} day(s) 
                  of {continuousInfusion.dailyDose || 'daily dose'} - {continuousInfusion.frequency}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  This will create nurse administration tasks for each day of the infusion period.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Medications */}
      {selectedMedications.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: '#0C0E0B' }}>Prescription ({selectedMedications.length} medications)</h4>
          <div className="space-y-4">
            {selectedMedications.map((medication, index) => (
              <div key={medication.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">{medication.name}</h5>
                    <p className="text-sm text-gray-600">
                      {medication.strength} {medication.dosageForm}
                      {medication.isCustom && <span className="ml-2 text-orange-600">(Custom)</span>}
                      {medication.isContinuousInfusion && (
                        <span className="ml-2 text-purple-600 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          (Infusion)
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => removeMedication(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={medication.quantity}
                      onChange={(e) => updateMedication(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                    <input
                      type="text"
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 3 times daily"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                    <input
                      type="text"
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 7 days"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <textarea
                    value={medication.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Additional instructions for this medication..."
                  />
                </div>

                {medication.isContinuousInfusion && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-sm font-medium text-purple-800">
                      Continuous Infusion: {medication.continuousInfusionDays} day(s)
                    </div>
                    <div className="text-sm text-purple-600">
                      Daily Dose: {medication.dailyDose || 'Not specified'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={submitMedicationOrders}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Pill className="h-4 w-4 mr-2" />
              Submit Prescription
            </button>
            <button
              onClick={printPrescription}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationOrdering;
