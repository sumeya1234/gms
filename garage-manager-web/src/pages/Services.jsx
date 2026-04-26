import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Check, Scissors, X } from 'lucide-react';

export default function Services() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [services, setServices] = useState([]);
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
    serviceName: '',
    price: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Quick Add State (Inline)
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickFormData, setQuickFormData] = useState({ serviceName: '', price: '' });

  const fetchServices = useCallback(async () => {
    if (!user?.GarageID) return;
    try {
      setLoading(true);
      const response = await api.get(`/catalog/${user.GarageID}`);
      setServices(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load services.');
    } finally {
      setLoading(false);
    }
  }, [user?.GarageID]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ serviceName: '', price: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      serviceName: item.ServiceName,
      price: item.Price
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
        await api.put(`/catalog/${editingItem.ServiceID}`, {
          serviceName: formData.serviceName,
          price: Number(formData.price)
        });
        showSuccess(`Service "${formData.serviceName}" updated successfully!`);
      } else {
        await api.post(`/catalog`, {
          serviceName: formData.serviceName,
          price: Number(formData.price),
          garageId: user.GarageID
        });
        showSuccess(`Service "${formData.serviceName}" added successfully!`);
      }

      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Failed to save service');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await api.delete(`/catalog/${editingItem.ServiceID}`);
      setIsDeleteModalOpen(false);
      showSuccess(`Service deleted successfully!`);
      fetchServices();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete service.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">Service Catalog</h1>
          <p className="text-gray-500 mt-1">Manage the labor services your garage provides.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all border ${showQuickAdd ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
              }`}
          >
            {showQuickAdd ? <X size={18} /> : <Plus size={18} />}
            <span>{showQuickAdd ? 'Cancel Quick Add' : 'Quick Add'}</span>
          </button>
          <button
            onClick={openAddModal}
            className="btn-primary flex items-center gap-2 py-2 px-4 shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={18} />
            <span>Add Service</span>
          </button>
        </div>
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

      {/* Main Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <span className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-gray-500 bg-gray-50/50">
            <Scissors size={56} className="mb-4 text-gray-300" />
            <p className="font-medium text-gray-600 text-lg">No services found.</p>
            <p className="text-sm mt-1">Add a service like "Oil Change" or "Tire Alignment" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-[var(--color-border)] text-sm text-[var(--color-text-light)]">
                  <th className="p-4 font-semibold w-16">ID</th>
                  <th className="p-4 font-semibold">Service Name</th>
                  <th className="p-4 font-semibold text-right">Price</th>
                  <th className="p-4 font-semibold text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {showQuickAdd && (
                  <tr className="bg-blue-50/50 border-b border-blue-100 animate-in slide-in-from-top-2 duration-300">
                    <td className="p-4 text-blue-400 font-mono text-xs">NEW</td>
                    <td className="p-4">
                      <input
                        className="w-full bg-white border border-blue-200 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all font-semibold"
                        placeholder="Service name..."
                        value={quickFormData.serviceName}
                        onChange={e => setQuickFormData({ ...quickFormData, serviceName: e.target.value })}
                        autoFocus
                      />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-400 font-bold">ETB</span>
                        <input
                          type="number"
                          className="w-24 bg-white border border-blue-200 rounded px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all font-bold"
                          placeholder="0.00"
                          value={quickFormData.price}
                          onChange={e => setQuickFormData({ ...quickFormData, price: e.target.value })}
                        />
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        disabled={!quickFormData.serviceName || !quickFormData.price || formLoading}
                        onClick={async () => {
                          setFormLoading(true);
                          try {
                            await api.post(`/catalog`, {
                              serviceName: quickFormData.serviceName,
                              price: Number(quickFormData.price),
                              garageId: user.GarageID
                            });
                            showSuccess(`Service "${quickFormData.serviceName}" added!`);
                            setQuickFormData({ serviceName: '', price: '' });
                            fetchServices();
                          } catch (err) {
                            alert(err.response?.data?.message || 'Failed to add service');
                          } finally {
                            setFormLoading(false);
                          }
                        }}
                        className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                      >
                        {formLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span> : <Check size={16} />}
                      </button>
                    </td>
                  </tr>
                )}
                {services.map((service) => (
                  <tr key={service.ServiceID} className="border-b border-[var(--color-border)] hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-gray-500 font-mono">#{service.ServiceID}</td>
                    <td className="p-4 text-[var(--color-text-main)] font-bold">
                      {service.ServiceName}
                    </td>
                    <td className="p-4 text-right text-[var(--color-text-main)] font-semibold">
                      ETB {Number(service.Price).toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(service)}
                          className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(service)}
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
                <Scissors size={20} className="text-[var(--color-primary)]" />
                {editingItem ? 'Edit Service' : 'Add New Service'}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Service Name</label>
                  <input
                    type="text"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                    placeholder="e.g. Brake Pad Replacement"
                    className="input-field w-full"
                    required
                    minLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="input-field w-full"
                    min="0"
                    step="0.01"
                    required
                  />
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
                  {editingItem ? 'Save Changes' : 'Create Service'}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Service</h3>
              <p className="text-gray-500 text-sm">
                Are you sure you want to delete <span className="font-semibold text-gray-800">"{editingItem?.ServiceName}"</span>? This action cannot be undone.
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
