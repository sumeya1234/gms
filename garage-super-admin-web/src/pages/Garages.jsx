import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Plus, Building2, MapPin, Pencil, Trash2, X, AlertCircle, CheckCircle, Search } from 'lucide-react';

// ── Modal Component ─────────────────────────────────────────────────────────
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
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [users, setUsers] = useState([]);
 const [owners, setOwners] = useState([]);
 const [banks, setBanks] = useState([]);
 const [managerInput, setManagerInput] = useState('');
 const [ownerInput, setOwnerInput] = useState('');
 const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
 const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);

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
 }
 }
 }, [form.ManagerID, managers.length]);

 useEffect(() => {
 if (form.OwnerID && owners.length > 0) {
 const o = owners.find(u => u.UserID == form.OwnerID);
 if (o) {
 setOwnerInput(o.FullName);
 }
 }
 }, [form.OwnerID, owners.length]);

 const filteredManagers = managers.filter(m => 
 m.FullName.toLowerCase().includes(managerInput.toLowerCase()) || 
 m.Email?.toLowerCase().includes(managerInput.toLowerCase())
 );

 const filteredOwners = owners.filter(o => 
 o.FullName?.toLowerCase().includes(ownerInput.toLowerCase()) || 
 o.Email?.toLowerCase().includes(ownerInput.toLowerCase())
 );

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!form.Name.trim() || !form.Location.trim()) { setError('Garages must have a name and location.'); return; }
 if (!form.bankCode || !form.bankAccountNumber.trim() || !form.bankAccountName.trim()) { setError('Garages must have full bank details configured.'); return; }
 
 // Check if manager is assigned elsewhere
 if (form.ManagerID) {
 const isAssignedElsewhere = allGarages.some(g => g.ManagerID == form.ManagerID && g.GarageID !== garage?.GarageID);
 if (isAssignedElsewhere) {
 setError('This manager is already assigned to another garage. A manager can only be assigned to one garage.');
 return;
 }
 }

 setLoading(true); setError(null);
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

 if (isEditing) { await api.put(`/garages/${garage.GarageID}`, payload); }
 else { await api.post('/garages', payload); }
 onSaved();
 } catch (err) {
 setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save garage.');
 } finally { setLoading(false); }
 };

 return (
 <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
 <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] ">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-2xl font-bold text-slate-900 ">
 {isEditing ? t('Edit Garage') || 'Edit Garage' : t('addNewGarage')}
 </h2>
 <button id="modal-close-btn" onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
 <X size={20} className="text-slate-500 " />
 </button>
 </div>

 {error && (
 <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-center text-red-600 mb-6 text-sm font-bold">
 <AlertCircle size={18} /> {error}
 </div>
 )}

 <form onSubmit={handleSubmit} className="flex flex-col gap-4">
  <div className="flex gap-4">
    <div className="flex flex-col gap-2 flex-1">
      <label htmlFor="garage-name" className="font-bold text-sm text-slate-700 ">{t('garageName')} <span className="text-red-500">*</span></label>
      <input
        id="garage-name"
        value={form.Name}
        onChange={e => setForm(f => ({ ...f, Name: e.target.value }))}
        placeholder="e.g. Sunrise Auto"
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
      />
    </div>
    <div className="flex flex-col gap-2 flex-1">
      <label htmlFor="garage-location" className="font-bold text-sm text-slate-700 ">{t('location')} <span className="text-red-500">*</span></label>
      <input
        id="garage-location"
        value={form.Location}
        onChange={e => setForm(f => ({ ...f, Location: e.target.value }))}
        placeholder="e.g. Bole, Addis Ababa"
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
      />
    </div>
  </div>

  <div className="flex gap-4">
    <div className="flex flex-col gap-2 flex-1">
      <label htmlFor="garage-contact" className="font-bold text-sm text-slate-700 ">{t('phone')} / {t('contact')}</label>
      <input
        id="garage-contact"
        value={form.ContactNumber}
        onChange={e => setForm(f => ({ ...f, ContactNumber: e.target.value }))}
        placeholder="e.g. 0911234567"
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
      />
    </div>
    <div className="flex flex-col gap-2 flex-1">
      <label className="font-bold text-sm text-slate-700 ">Bank <span className="text-red-500">*</span></label>
      <select
        value={form.bankCode}
        onChange={e => setForm(f => ({ ...f, bankCode: e.target.value }))}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
      >
        <option value="">Select a Bank...</option>
        {banks.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  </div>
 
 <div className="flex gap-4">
   <div className="flex flex-col gap-2 flex-1">
     <label className="font-bold text-sm text-slate-700 ">Account Number <span className="text-red-500">*</span></label>
     <input
       value={form.bankAccountNumber}
       onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))}
       placeholder="e.g. 1000123456789"
       className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
     />
   </div>
   <div className="flex flex-col gap-2 flex-1">
     <label className="font-bold text-sm text-slate-700 ">Ext. Account Name <span className="text-red-500">*</span></label>
     <input
       value={form.bankAccountName}
       onChange={e => setForm(f => ({ ...f, bankAccountName: e.target.value }))}
       placeholder="e.g. Natnael Habtamu"
       className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
     />
   </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="flex flex-col gap-2 relative">
 <label htmlFor="garage-manager" className="font-bold text-sm text-slate-700 ">Garage Manager (Optional)</label>
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
 placeholder="Type or select a manager..."
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
 <div className="absolute top-full left-0 right-0 mt-2 z-10 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
 <div 
 className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-slate-700 "
 onClick={() => {
 setManagerInput('');
 setForm(f => ({ ...f, ManagerID: '' }));
 setIsManagerDropdownOpen(false);
 }}
 >
 <span className="italic">Unassigned</span>
 </div>
 {filteredManagers.length === 0 && managerInput && (
 <div className="px-4 py-2 text-slate-500 ">
 No managers found.
 </div>
 )}
 {filteredManagers.map(user => (
 <div 
 key={user.UserID} 
 className="px-4 py-3 hover:bg-slate-100 cursor-pointer flex flex-col border-t border-slate-100 "
 onClick={() => {
 setManagerInput(user.FullName);
 setForm(f => ({ ...f, ManagerID: user.UserID }));
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
 <label htmlFor="garage-owner" className="font-bold text-sm text-slate-700 ">Garage Owner (Optional)</label>
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
 placeholder="Type or select an owner..."
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
 <div className="absolute top-full left-0 right-0 mt-2 z-10 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
 <div 
 className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-slate-700 "
 onClick={() => {
 setOwnerInput('');
 setForm(f => ({ ...f, OwnerID: '' }));
 setIsOwnerDropdownOpen(false);
 }}
 >
 <span className="italic">Unassigned</span>
 </div>
 {filteredOwners.length === 0 && ownerInput && (
 <div className="px-4 py-2 text-slate-500 ">
 No owners found.
 </div>
 )}
 {filteredOwners.map(user => (
 <div 
 key={user.UserID} 
 className="px-4 py-3 hover:bg-slate-100 cursor-pointer flex flex-col border-t border-slate-100 "
 onClick={() => {
 setOwnerInput(user.FullName);
 setForm(f => ({ ...f, OwnerID: user.UserID }));
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
 <div className="flex gap-4 mt-4">
 <button
 type="button"
 onClick={onClose}
 className="flex-1 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors"
 >
 {t('cancel')}
 </button>
 <button
 id="modal-submit-btn"
 type="submit"
 disabled={loading}
 className="flex-1 py-3 rounded-xl border-2 border-blue-600 bg-blue-600 text-white font-bold hover:bg-blue-700 hover:border-blue-700 transition-colors shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
 >
 {loading ? 'Saving...' : (isEditing ? t('saveChanges') : t('createGarage'))}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}

// ── Archive Confirm ─────────────────────────────────────────────────────────
function ConfirmDialog({ garage, onClose, onConfirm, loading }) {
 return (
 <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
 <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] text-center">
 <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
 <Trash2 size={32} className="text-red-500 " />
 </div>
 <h2 className="text-2xl font-bold text-slate-900 mb-2">Archive Garage?</h2>
 <p className="text-slate-500 mb-8 font-medium">
 <strong className="text-slate-900 ">{garage.Name}</strong> will be archived and hidden from the public view. This action can be reversed.
 </p>
 <div className="flex gap-4">
 <button 
 onClick={onClose} 
 disabled={loading} 
 className="flex-1 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors disabled:opacity-70"
 >
 Cancel
 </button>
 <button 
 id="confirm-archive-btn" 
 onClick={onConfirm} 
 disabled={loading} 
 className="flex-1 py-3 rounded-xl border-2 border-red-600 bg-red-600 text-white font-bold hover:bg-red-700 hover:border-red-700 transition-colors shadow-lg shadow-red-500/30 hover:shadow-red-500/40 disabled:opacity-70"
 >
 {loading ? 'Archiving...' : 'Yes, Archive'}
 </button>
 </div>
 </div>
 </div>
 );
}

// ── Role Badge ──────────────────────────────────────────────────────────────
const ROLE_COLORS = { GarageManager: '#f59e0b', SuperAdmin: '#8b5cf6', Customer: '#22c55e', Mechanic: '#3b82f6' };

// ── Garages Page ────────────────────────────────────────────────────────────
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
 showToast('Failed to load garages.', 'error');
 } finally { setLoading(false); }
 };

 useEffect(() => { fetchGarages(); }, []);

 const handleSaved = () => {
 setShowModal(false); setEditTarget(null);
 showToast(editTarget ? 'Garage updated successfully.' : 'Garage created successfully.');
 fetchGarages();
 };

 const handleArchive = async () => {
 setArchiving(true);
 try {
 await api.delete(`/garages/${archiveTarget.GarageID}`);
 showToast(`"${archiveTarget.Name}" has been archived.`);
 setArchiveTarget(null);
 fetchGarages();
 } catch (err) {
 showToast('Failed to archive garage.', 'error');
 } finally { setArchiving(false); }
 };

 const filtered = garages.filter(g => g.Name?.toLowerCase().includes(search.toLowerCase()) || g.Location?.toLowerCase().includes(search.toLowerCase()));

   return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[2000] rounded-xl px-5 py-3 flex items-center gap-2 shadow-lg font-medium text-sm border
          ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 ">{t('garages') || 'Garages'}</h1>
          <p className="text-slate-500 text-sm mt-1">{garages.length} {t('garages')?.toLowerCase() || 'garages'} {t('activeOnConfig')}</p>
        </div>
        <button
          id="add-garage-btn"
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-full shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all border border-blue-600"
        >
          <Plus size={18} /> {t('addNewGarage')}
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-[400px]">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="garage-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchGarage') || "Search by name or location..."}
          className="w-full pl-11 pr-5 py-2.5 rounded-full border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm text-sm"
        />
      </div>

      {/* Table */}
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
                  {[t('garageName') || 'Garage', t('location') || 'Location', t('manager') || 'Manager', t('actions') || 'Actions'].map(h => (
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
                      {g.ManagerID ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          Manager #{g.ManagerID}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50 italic">
                          Unassigned
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
                          <Pencil size={16} className="text-slate-400" /> Edit
                        </button>
                        <button
                          id={`archive-garage-${g.GarageID}`}
                          onClick={() => setArchiveTarget(g)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-200 text-red-600 text-sm font-semibold transition-all"
                        >
                          <Trash2 size={16} /> Archive
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

      {/* Modals */}
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
        />
      )}
    </div>
  );
}
