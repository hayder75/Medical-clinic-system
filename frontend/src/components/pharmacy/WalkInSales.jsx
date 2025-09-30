import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, CreditCard, Package, Search, User, Phone, Mail } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const WalkInSales = () => {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [saleData, setSaleData] = useState({
    customerName: '',
    pharmacyInvoiceItems: [],
    paymentMethod: 'CASH',
    insuranceId: '',
    totalAmount: 0,
    notes: ''
  });

  const [newItem, setNewItem] = useState({
    medicationCatalogId: '',
    name: '',
    dosageForm: '',
    strength: '',
    quantity: 1,
    unitPrice: 0,
    notes: ''
  });

  const categories = [
    'ANTIBIOTIC',
    'ANALGESIC',
    'CARDIOVASCULAR',
    'ANTIDIABETIC',
    'RESPIRATORY',
    'CORTICOSTEROID',
    'GASTROINTESTINAL',
    'VITAMIN',
    'OPIOID',
    'BENZODIAZEPINE',
    'ANTIHISTAMINE',
    'ANTACID',
    'LAXATIVE',
    'DIURETIC',
    'OTHER'
  ];

  const units = [
    'TABLETS',
    'CAPSULES',
    'ML',
    'MG',
    'UNITS',
    'VIALS',
    'BOTTLES'
  ];

  useEffect(() => {
    fetchSales();
    fetchInventory();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await api.get('/walk-in-sales/sales');
      setSales(response.data.sales);
    } catch (error) {
      toast.error('Failed to fetch walk-in sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get('/pharmacies/inventory');
      setInventory(response.data.inventory);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    }
  };

  const handleAddItem = () => {
    if (!newItem.medicationCatalogId || !newItem.name || !newItem.dosageForm || !newItem.strength || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      toast.error('Please select a medication and fill in all required fields');
      return;
    }

    const item = {
      ...newItem,
      totalPrice: newItem.quantity * newItem.unitPrice
    };

    setSaleData(prev => ({
      ...prev,
      pharmacyInvoiceItems: [...prev.pharmacyInvoiceItems, item],
      totalAmount: prev.totalAmount + item.totalPrice
    }));

    setNewItem({
      medicationCatalogId: '',
      name: '',
      dosageForm: '',
      strength: '',
      quantity: 1,
      unitPrice: 0,
      notes: ''
    });
  };

  const handleRemoveItem = (index) => {
    const item = saleData.pharmacyInvoiceItems[index];
    setSaleData(prev => ({
      ...prev,
      pharmacyInvoiceItems: prev.pharmacyInvoiceItems.filter((_, i) => i !== index),
      totalAmount: prev.totalAmount - item.totalPrice
    }));
  };

  const handleCreateSale = async () => {
    try {
      if (saleData.pharmacyInvoiceItems.length === 0) {
        toast.error('Please add at least one item');
        return;
      }

      setLoading(true);
      await api.post('/walk-in-sales/sales', saleData);
      toast.success('Walk-in sale created successfully');
      setShowCreateModal(false);
      setSaleData({
        customerName: '',
        pharmacyInvoiceItems: [],
        paymentMethod: 'CASH',
        insuranceId: '',
        totalAmount: 0,
        notes: ''
      });
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create walk-in sale');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    try {
      setLoading(true);
      await api.post(`/walk-in-sales/sales/${selectedSale.id}/payment`, {
        paymentMethod: selectedSale.paymentMethod,
        insuranceId: selectedSale.insuranceId
      });
      toast.success('Payment processed successfully');
      setShowPaymentModal(false);
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    try {
      setLoading(true);
      await api.post(`/walk-in-sales/sales/${selectedSale.id}/dispense`, {
        items: selectedSale.items.map(item => ({
          medicationCatalogId: item.medicationCatalogId,
          name: item.name,
          dosageForm: item.dosageForm,
          strength: item.strength,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes
        }))
      });
      toast.success('Walk-in sale dispensed successfully');
      setShowDispenseModal(false);
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to dispense walk-in sale');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'badge-success';
      case 'PAID':
        return 'badge-info';
      case 'PENDING':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Walk-in Sales</h2>
          <p className="text-gray-600">Manage over-the-counter and external prescription sales</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Sale
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name or sale ID..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Sales List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="font-mono text-sm">{sale.id.substring(0, 8)}...</td>
                  <td>
                    <div>
                      <p className="font-medium">{sale.customerName}</p>
                    </div>
                  </td>
                  <td>{sale.pharmacyInvoiceItems?.length || 0} items</td>
                  <td className="font-medium">ETB {sale.totalAmount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex space-x-2">
                      {sale.status === 'PENDING' && (
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowPaymentModal(true);
                          }}
                          className="btn btn-sm btn-outline"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay
                        </button>
                      )}
                      {sale.status === 'PAID' && (
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowDispenseModal(true);
                          }}
                          className="btn btn-sm btn-primary"
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Dispense
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sale Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="text-lg font-bold mb-4">Create Walk-in Sale</h3>
            
            {/* Customer Information */}
            <div className="mb-6">
              <label className="label">
                <span className="label-text">Customer Name *</span>
              </label>
              <input
                type="text"
                className="input"
                value={saleData.customerName}
                onChange={(e) => setSaleData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Enter customer name"
              />
            </div>

            {/* Add Item Form */}
            <div className="border rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-3">Add Medication</h4>
              {/* Medicine Search */}
              <div className="mb-4">
                <label className="label">
                  <span className="label-text">Search Medicine *</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Search by medicine name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                
                {/* Medicine Selection Dropdown */}
                {searchTerm && (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg bg-white shadow-lg">
                    {inventory
                      .filter(med => 
                        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        med.genericName?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((med) => (
                        <div
                          key={med.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setNewItem({
                              medicationCatalogId: med.id,
                              name: med.name,
                              dosageForm: med.dosageForm,
                              strength: med.strength,
                              quantity: 1,
                              unitPrice: med.unitPrice,
                              notes: ''
                            });
                            setSearchTerm('');
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{med.name}</p>
                              <p className="text-sm text-gray-500">
                                {med.genericName} - {med.strength} ({med.dosageForm})
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">ETB {med.unitPrice}</p>
                              <p className="text-sm text-gray-500">Stock: {med.availableQuantity}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Selected Medicine Details */}
              {newItem.medicationCatalogId && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="label">
                      <span className="label-text">Quantity *</span>
                    </label>
                    <input
                      type="number"
                      className="input input-sm"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Unit Price *</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input input-sm"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Notes</span>
                    </label>
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="Optional notes"
                      value={newItem.notes}
                      onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn btn-primary btn-sm w-full"
                    >
                      Add to Sale
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Items List */}
            {saleData.pharmacyInvoiceItems.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Items ({saleData.pharmacyInvoiceItems.length})</h4>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Dosage</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleData.pharmacyInvoiceItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>{item.strength} - {item.dosageForm}</td>
                          <td>{item.quantity}</td>
                          <td>ETB {item.unitPrice.toFixed(2)}</td>
                          <td>ETB {item.totalPrice.toFixed(2)}</td>
                          <td>
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="btn btn-sm btn-error"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-right mt-2">
                  <p className="text-lg font-bold">Total: ETB {saleData.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">
                  <span className="label-text">Payment Method</span>
                </label>
                <select
                  className="select"
                  value={saleData.paymentMethod}
                  onChange={(e) => setSaleData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="CASH">Cash</option>
                  <option value="INSURANCE">Insurance</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={saleData.notes}
                  onChange={(e) => setSaleData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSale}
                className="btn btn-primary"
                disabled={loading || saleData.items.length === 0}
              >
                {loading ? 'Creating...' : 'Create Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedSale && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold mb-4">Process Payment</h3>
            <p className="mb-4">Sale ID: {selectedSale.id}</p>
            <p className="mb-4">Total Amount: ETB {selectedSale.totalAmount.toLocaleString()}</p>
            <div className="modal-action">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Process Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispense Modal */}
      {showDispenseModal && selectedSale && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold mb-4">Dispense Medications</h3>
            <p className="mb-4">Sale ID: {selectedSale.id}</p>
            <div className="mb-4">
              <h4 className="font-medium mb-2">Items to dispense:</h4>
              <ul className="list-disc list-inside">
                {selectedSale.items?.map((item, index) => (
                  <li key={index}>
                    {item.name} - {item.strength} - {item.dosageForm} (Qty: {item.quantity})
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setShowDispenseModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDispense}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Dispensing...' : 'Dispense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalkInSales;
