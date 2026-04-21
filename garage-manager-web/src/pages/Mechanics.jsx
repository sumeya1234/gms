import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';
import { UserPlus, Users, X, Check, Search, Eye, EyeOff, Trash2, Power, Wrench } from 'lucide-react';

const PREDEFINED_SKILLS = [
  'Engine Repair', 'Brake Service', 'Oil Change', 'Electrical/Wiring',
  'Transmission', 'Suspension', 'Body Work', 'Tire Service', 'AC/Heating', 'Diagnostics'
];

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
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [skillsMechanic, setSkillsMechanic] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [skillsLoading, setSkillsLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [regSkills, setRegSkills] = useState([]);
  const [regCustomSkill, setRegCustomSkill] = useState('');
  const [regStep, setRegStep] = useState(1);

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
      await api.post(`/users/garage/${user.GarageID}/mechanics`, { ...formData, skills: regSkills });
      
      // Reset form and close modal
      setFormData({ fullName: '', email: '', phone: '' });
      setRegSkills([]);
      setRegCustomSkill('');
      setRegStep(1);
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

  const openSkillsModal = (mechanic) => {
    setSkillsMechanic(mechanic);
    setSelectedSkills(mechanic.Skills || []);
    setCustomSkill('');
    setIsSkillsModalOpen(true);
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills(prev => [...prev, trimmed]);
      setCustomSkill('');
    }
  };

  const handleSaveSkills = async () => {
    if (!skillsMechanic) return;
    setSkillsLoading(true);
    try {
      await api.put(`/users/garage/${user.GarageID}/mechanics/${skillsMechanic.UserID}/skills`, { skills: selectedSkills });
      showSuccess(`Skills updated for ${skillsMechanic.FullName}`);
      setIsSkillsModalOpen(false);
      fetchMechanics();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update skills');
    } finally {
      setSkillsLoading(false);
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
                      <div>{mechanic.FullName}</div>
                      {mechanic.Skills && mechanic.Skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mechanic.Skills.slice(0, 2).map(skill => (
                            <span key={skill} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded">{skill}</span>
                          ))}
                          {mechanic.Skills.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded">+{mechanic.Skills.length - 2} more</span>
                          )}
                        </div>
                      )}
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
                          onClick={() => openSkillsModal(mechanic)}
                          className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          title="Manage Skills"
                        >
                          <Wrench size={16} />
                        </button>
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
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserPlus size={20} className="text-[var(--color-primary)]" />
                  Register New Mechanic
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${regStep === 1 ? 'bg-[var(--color-primary)] text-white' : 'bg-green-100 text-green-700'}`}>1 Info</span>
                  <span className="text-gray-300 text-xs">›</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${regStep === 2 ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-400'}`}>2 Skills</span>
                </div>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); setRegSkills([]); setRegStep(1); }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step 1 — Basic Info */}
            {regStep === 1 && (
              <form onSubmit={e => { e.preventDefault(); setFormError(''); setRegStep(2); }} className="p-6" autoComplete="off">
                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">{formError}</div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" className="input-field w-full" required minLength={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="mechanic@garage.com" className="input-field w-full" autoComplete="off" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+251 911 234 567" className="input-field w-full" required minLength={10} />
                  </div>
                  <p className="text-xs text-gray-400 italic">A temporary password will be auto-generated and emailed to the mechanic.</p>
                </div>
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => { setIsAddModalOpen(false); setRegStep(1); }} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-lg transition-colors shadow-sm flex items-center gap-2">
                    Next: Add Skills <span>›</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 2 — Skills */}
            {regStep === 2 && (
              <form onSubmit={handleAddMechanic} className="p-6">
                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">{formError}</div>
                )}
                <p className="text-sm text-gray-500 mb-3">Select the skills this mechanic specializes in <span className="text-gray-400">(optional)</span>:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PREDEFINED_SKILLS.map(skill => {
                    const isSel = regSkills.includes(skill);
                    return (
                      <button key={skill} type="button"
                        onClick={() => setRegSkills(prev => isSel ? prev.filter(s => s !== skill) : [...prev, skill])}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          isSel ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                        }`}>
                        {isSel && <span className="mr-1">✓</span>}{skill}
                      </button>
                    );
                  })}
                </div>
                {regSkills.filter(s => !PREDEFINED_SKILLS.includes(s)).map(skill => (
                  <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 mb-2 mr-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                    {skill}<button type="button" onClick={() => setRegSkills(prev => prev.filter(s => s !== skill))} className="ml-0.5 text-purple-400 hover:text-purple-700"><X size={10} /></button>
                  </span>
                ))}
                <div className="flex gap-2 mt-2">
                  <input type="text" value={regCustomSkill} onChange={e => setRegCustomSkill(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const t = regCustomSkill.trim(); if (t && !regSkills.includes(t)) setRegSkills(prev => [...prev, t]); setRegCustomSkill(''); }}}
                    placeholder="Add custom skill..." className="input-field flex-1 text-sm" />
                  <button type="button" disabled={!regCustomSkill.trim()}
                    onClick={() => { const t = regCustomSkill.trim(); if (t && !regSkills.includes(t)) setRegSkills(prev => [...prev, t]); setRegCustomSkill(''); }}
                    className="px-3 py-2 text-sm font-semibold text-[var(--color-primary)] bg-blue-50 hover:bg-blue-100 disabled:opacity-40 rounded-lg transition-colors">Add</button>
                </div>
                <div className="flex gap-3 justify-between mt-6 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setRegStep(1)} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">← Back</button>
                  <div className="flex gap-2">
                    <button type="submit" disabled={formLoading} className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-opacity-70 rounded-lg transition-colors shadow-sm flex items-center gap-2">
                      {formLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Check size={16} />}
                      Create Account
                    </button>
                  </div>
                </div>
              </form>
            )}
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

      {/* Skills Modal */}
      {isSkillsModalOpen && skillsMechanic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Wrench size={20} className="text-[var(--color-primary)]" />
                Skills — {skillsMechanic.FullName}
              </h2>
              <button onClick={() => setIsSkillsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">Select the skills this mechanic specializes in:</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {PREDEFINED_SKILLS.map(skill => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                      }`}
                    >
                      {isSelected && <span className="mr-1">✓</span>}
                      {skill}
                    </button>
                  );
                })}
              </div>

              {/* Custom skills that are not in predefined list */}
              {selectedSkills.filter(s => !PREDEFINED_SKILLS.includes(s)).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Custom Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.filter(s => !PREDEFINED_SKILLS.includes(s)).map(skill => (
                      <span key={skill} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                        {skill}
                        <button onClick={() => toggleSkill(skill)} className="ml-1 text-purple-400 hover:text-purple-700">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                  placeholder="Add custom skill..."
                  className="input-field flex-1 text-sm"
                />
                <button
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim()}
                  className="px-3 py-2 text-sm font-semibold text-[var(--color-primary)] bg-blue-50 hover:bg-blue-100 disabled:opacity-40 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-5 border-t border-gray-100 bg-gray-50/30">
              <button
                onClick={() => setIsSkillsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSkills}
                disabled={skillsLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-opacity-70 rounded-lg transition-colors shadow-sm flex items-center gap-2"
              >
                {skillsLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <Check size={16} />
                )}
                Save Skills
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
