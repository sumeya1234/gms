import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Box, X, Check, PackageOpen } from 'lucide-react';

export default function Inventory() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    unitPrice: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchInventory = useCallback(async () => {
    if (!user?.GarageID) return;
    try {
      setLoading(true);
      const response = await api.get(`/inventory/${user.GarageID}`);
      setInventory(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load inventory & services.');
    } finally {
      setLoading(false);
    }
  }, [user?.GarageID]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ itemName: '', quantity: '', unitPrice: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ 
      itemName: item.ItemName, 
      quantity: item.Quantity, 
      unitPrice: item.UnitPrice 
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openDeleteModal = (item) => {
    setEditingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.ItemID}`, {
          itemName: formData.itemName,
          quantity: Number(formData.quantity),
          unitPrice: Number(formData.unitPrice)
        });
        showSuccess(`Item "${formData.itemName}" updated successfully!`);
      } else {
        await api.post(`/inventory`, {
          itemName: formData.itemName,
          quantity: Number(formData.quantity),
          unitPrice: Number(formData.unitPrice),
          garageId: user.GarageID
        });
        showSuccess(`Item "${formData.itemName}" added successfully!`);
      }
      
      setIsModalOpen(false);
      fetchInventory();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Failed to save item');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/inventory/${editingItem.ItemID}`);
      setIsDeleteModalOpen(false);
      showSuccess(`Item deleted successfully!`);
      fetchInventory();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete item. Ensure it is not attached to existing active services.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">{t('inventoryManagement')}</h1>
          <p className="text-gray-500 mt-1">{t('managePhysicalParts')}</p>
        </div>
        
        <button 
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 py-2 px-4 shadow-sm hover:shadow-md transition-all"
        >
          <Plus size={18} />
          <span>{t('addNew')}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 flex items-center gap-2 animate-in slide-in-from-top-2 flex flex-col md:flex-row">
          <Check size={18} />
          <span className="font-medium text-sm">{successMessage}</span>
        </div>
      )}

      {/* Low Stock Alert */}
      {!loading && inventory.some(item => item.Quantity < 10) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm animate-in slide-in-from-top-2">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {t('lowStockAlert')}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{t('itemsRunningLow')}</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {inventory.filter(item => item.Quantity < 10).map(item => (
                    <li key={item.ItemID}>
                      <span className="font-semibold">{item.ItemName}</span> - {t('onlyLeft').replace('{{count}}', item.Quantity.toString())}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <span className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : inventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-gray-500 bg-gray-50/50">
            <PackageOpen size={56} className="mb-4 text-gray-300" />
            <p className="font-medium text-gray-600 text-lg">{t('noInventoryItems')}</p>
            <p className="text-sm mt-1">{t('addItemsGetStarted')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-[var(--color-border)] text-sm text-[var(--color-text-light)]">
                  <th className="p-4 font-semibold w-16">ID</th>
                  <th className="p-4 font-semibold">{t('partName')}</th>
                  <th className="p-4 font-semibold">{t('quantity')}</th>
                  <th className="p-4 font-semibold text-right">{t('unitPrice')}</th>
                  <th className="p-4 font-semibold text-right w-32">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {inventory.map((item) => (
                  <tr key={item.ItemID} className="border-b border-[var(--color-border)] hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-gray-500 font-mono">#{item.ItemID}</td>
                    <td className="p-4 text-[var(--color-text-main)] font-bold">
                      {item.ItemName}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider ${
                        item.Quantity >= 10 ? 'bg-green-100 text-green-700' : 
                        item.Quantity > 0 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-red-100 text-red-700'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          item.Quantity >= 10 ? 'bg-green-500' : 
                          item.Quantity > 0 ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                        {item.Quantity >= 10 ? `${item.Quantity} ${t('inStock')}` : 
                         item.Quantity > 0 ? `${item.Quantity} - LOW STOCK` : 'OUT OF STOCK'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-[var(--color-text-main)] font-semibold">
                      ETB {Number(item.UnitPrice).toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(item)}
                          className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Box size={20} className="text-[var(--color-primary)]" />
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6" autoComplete="off">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                  {formError}
                </div>
              )}
            
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Part Name</label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    placeholder="e.g. Premium Engine Oil"
                    className="input-field w-full"
                    required
                    minLength={2}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="input-field w-full"
                      min="0"
                      required
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Must be 0 or greater.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Unit Price (ETB)</label>
                    <input
                      type="number"
                      name="unitPrice"
                      value={formData.unitPrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="input-field w-full"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-opacity-70 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  {formLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <Check size={16} />
                  )}
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Item</h3>
              <p className="text-gray-500 text-sm">
                Are you sure you want to delete <span className="font-semibold text-gray-800">"{editingItem?.ItemName}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-center p-6 border-t border-gray-50 bg-gray-50/50">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={formLoading}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={formLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-opacity-70 rounded-lg transition-colors shadow-sm flex items-center justify-center"
              >
                {formLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  "Yes, Delete It"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
