import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Plus, Building2, MapPin, Pencil, Trash2, X, AlertCircle, CheckCircle, Search } from 'lucide-react';


function GarageModal({ garage, allGarages, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEditing = !!garage;
  const [form, setForm] = useState({
    Name: garage?.Name || '',
    Location: garage?.Location || '',
    ContactNumber: garage?.ContactNumber || '',
    ManagerID: garage?.ManagerID || '',
    OwnerID: garage?.OwnerID || '',
    bankCode: garage?.BankCode || '',
    bankAccountNumber: garage?.BankAccountNumber || '',
    bankAccountName: garage?.BankAccountName || ''
  });

  const [step, setStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [managerInput, setManagerInput] = useState('');
  const [ownerInput, setOwnerInput] = useState('');
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [banks, setBanks] = useState([]);

  const updateFormField = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    if (garage) {
      setForm({
        Name: garage.Name || '',
        Location: garage.Location || '',
        ContactNumber: garage.ContactNumber || '',
        ManagerID: garage.ManagerID || '',
        OwnerID: garage.OwnerID || '',
        bankCode: garage.BankCode || '',
        bankAccountNumber: garage.BankAccountNumber || '',
        bankAccountName: garage.BankAccountName || ''
      });
      setStep(1);
      setError(null);
      setFieldErrors({});
    } else {
      setForm({
        Name: '', Location: '', ContactNumber: '',
        ManagerID: '', OwnerID: '',
        bankCode: '', bankAccountNumber: '', bankAccountName: ''
      });
      setStep(1);
      setFieldErrors({});
      setError(null);
    }
  }, [garage]);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, ownersRes, banksRes] = await Promise.all([
          api.get('/users'),
          api.get('/users/admin/owners').catch(() => ({ data: [] })),
          api.get('/payments/banks').catch(() => ({ data: { data: [] } }))
        ]);
        setUsers(usersRes.data);
        setOwners(ownersRes.data || []);
        setBanks(banksRes.data.data || []);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    fetchData();
  }, []);

  const managers = users.filter(u => u.Role === 'GarageManager');

  useEffect(() => {
    if (form.ManagerID && managers.length > 0) {
      const m = managers.find(u => u.UserID == form.ManagerID);
      if (m) {
        setManagerInput(m.FullName);
        return;
      }
    }
    setManagerInput('');
  }, [form.ManagerID, managers.length]);

  useEffect(() => {
    if (form.OwnerID && owners.length > 0) {
      const o = owners.find(u => u.UserID == form.OwnerID);
      if (o) {
        setOwnerInput(o.FullName);
        return;
      }
    }
    setOwnerInput('');
  }, [form.OwnerID, owners.length]);

  const filteredManagers = managers.filter(m =>
    m.FullName.toLowerCase().includes(managerInput.toLowerCase()) ||
    m.Email?.toLowerCase().includes(managerInput.toLowerCase())
  );

  const filteredOwners = owners.filter(o =>
    o.FullName?.toLowerCase().includes(ownerInput.toLowerCase()) ||
    o.Email?.toLowerCase().includes(ownerInput.toLowerCase())
  );

  const validateStep = () => {
    const newFieldErrors = {};
    if (step === 1) {
      if (!form.Name.trim() || form.Name.length < 3) {
        newFieldErrors.Name = t('garagesValidationNameMin');
      } else if (!/^[a-zA-Z\s\-\.]+$/.test(form.Name)) {
        newFieldErrors.Name = t('garagesValidationNameRegex');
      }
      if (!form.Location.trim() || form.Location.length < 3) {
        newFieldErrors.Location = t('garagesValidationLocation');
      }
      if (form.ContactNumber && !/^(09|07)[0-9]{8}$/.test(form.ContactNumber)) {
        newFieldErrors.ContactNumber = t('garagesValidationPhone');
      }
    } else if (step === 2) {
      if (!form.bankCode) {
        newFieldErrors.bankCode = t('garagesValidationBank');
      }
      if (!form.bankAccountNumber.trim()) {
        newFieldErrors.bankAccountNumber = t('garagesValidationAccNum');
      } else if (!/^[0-9]{10,20}$/.test(form.bankAccountNumber)) {
        newFieldErrors.bankAccountNumber = t('garagesValidationAccNumFormat');
      }
      if (!form.bankAccountName.trim()) {
        newFieldErrors.bankAccountName = t('garagesValidationAccName');
      } else if (form.bankAccountName.trim().length < 3) {
        newFieldErrors.bankAccountName = t('garagesValidationAccNameLength');
      } else if (!/^[a-zA-Z\s\-]+$/.test(form.bankAccountName)) {
        newFieldErrors.bankAccountName = t('garagesValidationAccNameRegex');
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return false;
    }
    return true;
  };


  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }

    setError(null);
    if (!validateStep()) return;

    if (form.ManagerID) {
      const isAssignedElsewhere = allGarages.some(g => g.ManagerID == form.ManagerID && g.GarageID !== garage?.GarageID);
      if (isAssignedElsewhere) {
        setError(t('garagesValidationManager'));
        return;
      }
    }

    if (form.OwnerID) {
      const isOwnerElsewhere = allGarages.some(g => g.OwnerID == form.OwnerID && g.GarageID !== garage?.GarageID);
      if (isOwnerElsewhere) {
        setError(t('onlyOwnersAssignedOnce'));
        return;
      }
    }

    setLoading(true); setFieldErrors({});
    try {
      const payload = {
        name: form.Name,
        location: form.Location,
        contact: form.ContactNumber || null,
        managerId: form.ManagerID || null,
        ownerId: form.OwnerID || null,
        bankCode: form.bankCode,
        bankAccountNumber: form.bankAccountNumber,
        bankAccountName: form.bankAccountName
      };

      console.log(`[GarageModal] Submitting ${isEditing ? 'PUT' : 'POST'} to /garages${isEditing ? `/${garage.GarageID}` : ''}`, payload);

      if (isEditing) {
        await api.put(`/garages/${garage.GarageID}`, payload);
      } else {
        await api.post('/garages', payload);
      }

      onSaved();
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        setError(backendErrors.join(', '));
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || t('errorSavingGarage'));
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] ">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 ">
            {isEditing ? t('editGarage') : t('addNewGarage')}
          </h2>
          <button id="modal-close-btn" onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500 " />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-center text-red-600 mb-6 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${step >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'
                  }`}
              >
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? 'bg-blue-600' : 'bg-slate-100'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col gap-2">
                <label htmlFor="garage-name" className="font-bold text-sm text-slate-700 ">{t('garageName')} <span className="text-red-500">*</span></label>
                <input
                  id="garage-name"
                  value={form.Name}
                  onChange={e => updateFormField('Name', e.target.value)}
                  placeholder="e.g. Sunrise Auto"
                  className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.Name ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-300'} bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm`}
                />
                {fieldErrors.Name && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.Name}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="garage-location" className="font-bold text-sm text-slate-700 ">{t('location')} <span className="text-red-500">*</span></label>
                <input
                  id="garage-location"
                  value={form.Location}
                  onChange={e => updateFormField('Location', e.target.value)}
                  placeholder="e.g. Bole, Addis Ababa"
                  className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.Location ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-300'} bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm`}
                />
                {fieldErrors.Location && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.Location}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="garage-contact" className="font-bold text-sm text-slate-700 ">{t('phone')} / {t('contact')}</label>
                <input
                  id="garage-contact"
                  value={form.ContactNumber}
                  onChange={e => updateFormField('ContactNumber', e.target.value)}
                  placeholder="e.g. 0911234567"
                  className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.ContactNumber ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-300'} bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm`}
                />
                {fieldErrors.ContactNumber && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.ContactNumber}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-slate-700 ">{t('bank')} <span className="text-red-500">*</span></label>
                <select
                  value={form.bankCode}
                  onChange={e => updateFormField('bankCode', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.bankCode ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-300'} bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm`}
                >
                  <option value="">{t('selectBank')}</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {fieldErrors.bankCode && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.bankCode}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-slate-700 ">{t('accountNumber')} <span className="text-red-500">*</span></label>
                <input
                  value={form.bankAccountNumber}
                  onChange={e => updateFormField('bankAccountNumber', e.target.value)}
                  placeholder="e.g. 1000123456789"
                  className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.bankAccountNumber ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-300'} bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm`}
                />
                {fieldErrors.bankAccountNumber && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.bankAccountNumber}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-slate-700 ">{t('extAccountName')} <span className="text-red-500">*</span></label>
                <input
                  value={form.bankAccountName}
                  onChange={e => updateFormField('bankAccountName', e.target.value)}
                  placeholder="e.g. John Doe / Prime Motors"
                  className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.bankAccountName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-300'} bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm`}
                />
                {fieldErrors.bankAccountName && <p className="text-red-500 text-xs font-bold mt-1">{fieldErrors.bankAccountName}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col gap-2 relative">
                <label htmlFor="garage-manager" className="font-bold text-sm text-slate-700 ">{t('garageManager')}</label>
                <div className="relative">
                  <input
                    id="garage-manager"
                    type="text"
                    value={managerInput}
                    onChange={e => {
                      setManagerInput(e.target.value);
                      setIsManagerDropdownOpen(true);
                      if (form.ManagerID) {
                        setForm(f => ({ ...f, ManagerID: '' }));
                      }
                    }}
                    onFocus={() => setIsManagerDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsManagerDropdownOpen(false), 200)}
                    placeholder={t('typeOrSelectManager')}
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsManagerDropdownOpen(!isManagerDropdownOpen);
                    }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${isManagerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {isManagerDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 z-10 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
                    <div
                      className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-slate-700 "
                      onMouseDown={() => {
                        setManagerInput('');
                        updateFormField('ManagerID', '');
                        setIsManagerDropdownOpen(false);
                      }}
                    >
                      <span className="italic">{t('unassigned')}</span>
                    </div>
                    {filteredManagers.length === 0 && managerInput && (
                      <div className="px-4 py-2 text-slate-500 ">
                        {t('noManagersFound')}
                      </div>
                    )}
                    {filteredManagers.map(user => (
                      <div
                        key={user.UserID}
                        className="px-4 py-3 hover:bg-slate-100 cursor-pointer flex flex-col border-t border-slate-100 "
                        onMouseDown={() => {
                          setManagerInput(user.FullName);
                          updateFormField('ManagerID', user.UserID);
                          setIsManagerDropdownOpen(false);
                        }}
                      >
                        <span className="font-medium text-slate-900 ">{user.FullName}</span>
                        <span className="text-xs text-slate-500 ">{user.Email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 relative">
                <label htmlFor="garage-owner" className="font-bold text-sm text-slate-700 ">{t('garageOwner')}</label>
                <div className="relative">
                  <input
                    id="garage-owner"
                    type="text"
                    value={ownerInput}
                    onChange={e => {
                      setOwnerInput(e.target.value);
                      setIsOwnerDropdownOpen(true);
                      if (form.OwnerID) {
                        setForm(f => ({ ...f, OwnerID: '' }));
                      }
                    }}
                    onFocus={() => setIsOwnerDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsOwnerDropdownOpen(false), 200)}
                    placeholder={t('typeOrSelectOwner')}
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOwnerDropdownOpen(!isOwnerDropdownOpen);
                    }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOwnerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {isOwnerDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 z-10 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
                    <div
                      className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-slate-700 "
                      onMouseDown={() => {
                        setOwnerInput('');
                        updateFormField('OwnerID', '');
                        setIsOwnerDropdownOpen(false);
                      }}
                    >
                      <span className="italic">{t('unassigned')}</span>
                    </div>
                    {filteredOwners.length === 0 && ownerInput && (
                      <div className="px-4 py-2 text-slate-500 ">
                        {t('noOwnersFound')}
                      </div>
                    )}
                    {filteredOwners.map(user => (
                      <div
                        key={user.UserID}
                        className="px-4 py-3 hover:bg-slate-100 cursor-pointer flex flex-col border-t border-slate-100 "
                        onMouseDown={() => {
                          setOwnerInput(user.FullName);
                          updateFormField('OwnerID', user.UserID);
                          setIsOwnerDropdownOpen(false);
                        }}
                      >
                        <span className="font-medium text-slate-900 ">{user.FullName}</span>
                        <span className="text-xs text-slate-500 ">{user.Email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-4">
            {step === 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                {t('cancel')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                {t('backBtn', 'Back')}
              </button>
            )}

            <button
              id="modal-submit-btn"
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl border-2 border-blue-600 bg-blue-600 text-white font-bold hover:bg-blue-700 hover:border-blue-700 transition-colors shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : (step < 3 ? t('nextBtn') : (isEditing ? t('saveChanges') : t('createGarage')))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function ConfirmDialog({ garage, onClose, onConfirm, loading, t }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <Trash2 size={32} className="text-red-500 " />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('archiveGarageConfirm')}</h2>
        <p className="text-slate-500 mb-8 font-medium">
          <strong className="text-slate-900 ">{garage.Name}</strong> {t('archiveGarageDesc')}
        </p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors disabled:opacity-70"
          >
            {t('cancelDesc')}
          </button>
          <button
            id="confirm-archive-btn"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border-2 border-red-600 bg-red-600 text-white font-bold hover:bg-red-700 hover:border-red-700 transition-colors shadow-lg shadow-red-500/30 hover:shadow-red-500/40 disabled:opacity-70"
          >
            {loading ? t('archiving') : t('yesArchive')}
          </button>
        </div>
      </div>
    </div>
  );
}


const ROLE_COLORS = { GarageManager: '#f59e0b', SuperAdmin: '#8b5cf6', Customer: '#22c55e', Mechanic: '#3b82f6' };


export default function Garages() {
  const { t } = useTranslation();
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [search, setSearch] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchGarages = async () => {
    try {
      const res = await api.get('/garages');
      setGarages(res.data);
    } catch (err) {
      showToast(t('errorLoadingGarages'), 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchGarages(); }, []);

  const handleSaved = () => {
    const isEdit = !!editTarget;
    setShowModal(false);
    setEditTarget(null);
    showToast(isEdit ? t('garageUpdatedSuccess') : t('garageCreatedSuccess'));

    // Small delay to ensure DB commit is visible on subsequent GET
    setTimeout(() => {
      fetchGarages();
    }, 500);
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await api.delete(`/garages/${archiveTarget.GarageID}`);
      showToast(`"${archiveTarget.Name}" ${t('garageArchived')}`);
      setArchiveTarget(null);
      fetchGarages();
    } catch (err) {
      showToast(t('errorArchivingGarage'), 'error');
    } finally { setArchiving(false); }
  };

  const filtered = garages.filter(g => g.Name?.toLowerCase().includes(search.toLowerCase()) || g.Location?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      { }
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[2000] rounded-xl px-5 py-3 flex items-center gap-2 shadow-lg font-medium text-sm border
          ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      { }
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 ">{t('garages')}</h1>
          <p className="text-slate-500 text-sm mt-1">{garages.length} {t('garages').toLowerCase()} {t('activeOnConfigLower')}</p>
        </div>
        <button
          id="add-garage-btn"
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-full shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all border border-blue-600"
        >
          <Plus size={18} /> {t('addNewGarage')}
        </button>
      </div>

      { }
      <div className="relative w-full max-w-[400px]">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="garage-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchByAddress')}
          className="w-full pl-11 pr-5 py-2.5 rounded-full border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm text-sm"
        />
      </div>

      { }
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 flex gap-4 items-center animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-100" />
              <div className="flex-1">
                <div className="bg-slate-100 rounded-md h-3.5 w-2/5 mb-2" />
                <div className="bg-slate-100 rounded-md h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
          <Building2 size={40} className="mx-auto mb-4 opacity-30 text-slate-400" />
          <p className="text-lg font-medium">{search ? t('noGarages') : t('addGarageToStart')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[t('garageName'), t('location'), t('owner'), t('manager'), t('actions')].map(h => (
                    <th key={h} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((g) => (
                  <tr key={g.GarageID} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 group-hover:bg-blue-100 transition-colors">
                          <Building2 size={20} />
                        </div>
                        <span className="font-semibold text-slate-900">{g.Name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                        <MapPin size={16} className="text-slate-400" />
                        {g.Location || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {g.OwnerID ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                          {g.OwnerName || `${t('ownerLabelPlaceholder')} ${g.OwnerID}`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50 italic">
                          {t('unassigned')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {g.ManagerID ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          {g.ManagerName || `${t('managerLabelPlaceholder')} ${g.ManagerID}`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50 italic">
                          {t('unassigned')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          id={`edit-garage-${g.GarageID}`}
                          onClick={() => { setEditTarget(g); setShowModal(true); }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-semibold transition-all shadow-sm"
                        >
                          <Pencil size={16} className="text-slate-400" /> {t('editText')}
                        </button>
                        <button
                          id={`archive-garage-${g.GarageID}`}
                          onClick={() => setArchiveTarget(g)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-200 text-red-600 text-sm font-semibold transition-all"
                        >
                          <Trash2 size={16} /> {t('archiveText')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      { }
      {showModal && (
        <GarageModal
          garage={editTarget}
          allGarages={garages}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}
      {archiveTarget && (
        <ConfirmDialog
          garage={archiveTarget}
          onClose={() => setArchiveTarget(null)}
          onConfirm={handleArchive}
          loading={archiving}
          t={t}
        />
      )}
    </div>
  );
}
