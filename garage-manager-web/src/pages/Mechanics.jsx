import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';
import { UserPlus, Users, X, Check, Search, Eye, EyeOff, Trash2, Power } from 'lucide-react';

export default function Mechanics() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchMechanics = useCallback(async () => {
    if (!user?.GarageID) return;
    try {
      setLoading(true);
      const response = await api.get(`/users/garage/${user.GarageID}/mechanics`);
      setMechanics(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load mechanics.');
    } finally {
      setLoading(false);
    }
  }, [user?.GarageID]);

  useEffect(() => {
    fetchMechanics();
  }, [fetchMechanics]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMechanic = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    
    try {
      await api.post(`/users/garage/${user.GarageID}/mechanics`, formData);
      
      // Reset form and close modal
      setFormData({ fullName: '', email: '', phone: '', password: '' });
      setIsAddModalOpen(false);
      
      // Refresh list
      fetchMechanics();
    } catch (err) {
      console.error(err);
      const apiError = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Failed to add mechanic';
      setFormError(apiError);
    } finally {
      setFormLoading(false);
    }
  };

  const openStatusModal = (mechanic) => {
    setSelectedMechanic(mechanic);
    setIsStatusModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedMechanic) return;
    setFormLoading(true);
    const newStatus = selectedMechanic.Status === 'Suspended' ? 'Active' : 'Suspended';
    try {
      await api.put(`/users/garage/${user.GarageID}/mechanics/${selectedMechanic.UserID}/status`, { status: newStatus });
      showSuccess(`Mechanic ${selectedMechanic.FullName} is now ${newStatus}`);
      setIsStatusModalOpen(false);
      fetchMechanics();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update mechanic status');
    } finally {
      setFormLoading(false);
    }
  };

  const openArchiveModal = (mechanic) => {
    setSelectedMechanic(mechanic);
    setIsArchiveModalOpen(true);
  };

  const confirmArchive = async () => {
    if (!selectedMechanic) return;
    setFormLoading(true);
    try {
      await api.put(`/users/garage/${user.GarageID}/mechanics/${selectedMechanic.UserID}/status`, { status: 'Archived' });
      showSuccess(`Mechanic ${selectedMechanic.FullName} has been archived successfully`);
      setIsArchiveModalOpen(false);
      fetchMechanics();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to archive mechanic');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">Mechanics Management</h1>
          <p className="text-gray-500 mt-1">Manage the mechanics assigned to your garage.</p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2 py-2 px-4 shadow-sm hover:shadow-md transition-all"
        >
          <UserPlus size={18} />
          <span>Add Mechanic</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 flex items-center gap-2 animate-in slide-in-from-top-2">
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
        ) : mechanics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 bg-gray-50/50">
            <Users size={48} className="mb-4 text-gray-300" />
            <p className="font-medium text-gray-600">No mechanics found.</p>
            <p className="text-sm mt-1">Click "Add Mechanic" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-[var(--color-border)] text-sm text-[var(--color-text-light)]">
                  <th className="p-4 font-semibold w-16">ID</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Phone Number</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {mechanics.map((mechanic) => (
                  <tr key={mechanic.UserID} className="border-b border-[var(--color-border)] hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-gray-500 font-mono">#{mechanic.UserID}</td>
                    <td className="p-4 text-[var(--color-text-main)] font-bold">
                      {mechanic.FullName}
                    </td>
                    <td className="p-4 text-gray-600">
                      {mechanic.Email}
                    </td>
                    <td className="p-4 text-gray-600">
                      {mechanic.PhoneNumber}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded inline-flex font-semibold text-xs uppercase tracking-wide ${
                        mechanic.Status === 'Active' ? 'bg-green-100 text-green-700' : 
                        mechanic.Status === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {mechanic.Status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openStatusModal(mechanic)}
                          className={`p-1.5 rounded transition-colors ${
                            mechanic.Status === 'Suspended' 
                              ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                              : 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                          }`}
                          title={mechanic.Status === 'Suspended' ? "Activate Mechanic" : "Suspend Mechanic"}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => openArchiveModal(mechanic)}
                          className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                          title="Archive Mechanic"
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

      {/* Add Mechanic Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus size={20} className="text-[var(--color-primary)]" />
                Register New Mechanic
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddMechanic} className="p-6" autoComplete="off">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                  {formError}
                </div>
              )}
            
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="input-field w-full"
                    required
                    minLength={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="mechanic@garage.com"
                    className="input-field w-full"
                    autoComplete="off"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+251 911 234 567"
                    className="input-field w-full"
                    required
                    minLength={10}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Temporary Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="input-field w-full pr-10"
                      autoComplete="new-password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mechanics can change this later.</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Status Confirmation Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${selectedMechanic?.Status === 'Suspended' ? 'bg-green-100 text-green-500' : 'bg-yellow-100 text-yellow-500'}`}>
                <Power size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {selectedMechanic?.Status === 'Suspended' ? 'Activate' : 'Suspend'} Mechanic
              </h3>
              <p className="text-gray-500 text-sm">
                Are you sure you want to {selectedMechanic?.Status === 'Suspended' ? 'activate' : 'suspend'} <span className="font-semibold text-gray-800">"{selectedMechanic?.FullName}"</span>?
                {selectedMechanic?.Status !== 'Suspended' && ' They will not be able to accept any new assigned bookings until re-activated.'}
              </p>
            </div>
            <div className="flex gap-3 justify-center p-6 border-t border-gray-50 bg-gray-50/50">
              <button 
                onClick={() => setIsStatusModalOpen(false)}
                disabled={formLoading}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmStatusChange}
                disabled={formLoading}
                className={`px-5 py-2.5 text-sm font-semibold text-white disabled:bg-opacity-70 rounded-lg transition-colors shadow-sm flex items-center justify-center ${selectedMechanic?.Status === 'Suspended' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
              >
                {formLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  `Yes, ${selectedMechanic?.Status === 'Suspended' ? 'Activate' : 'Suspend'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Archive Mechanic</h3>
              <p className="text-gray-500 text-sm">
                Are you sure you want to archive <span className="font-semibold text-gray-800">"{selectedMechanic?.FullName}"</span>? They will immediately be removed from your active roster view.
              </p>
            </div>
            <div className="flex gap-3 justify-center p-6 border-t border-gray-50 bg-gray-50/50">
              <button 
                onClick={() => setIsArchiveModalOpen(false)}
                disabled={formLoading}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmArchive}
                disabled={formLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-opacity-70 rounded-lg transition-colors shadow-sm flex items-center justify-center"
              >
                {formLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  "Yes, Archive"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
