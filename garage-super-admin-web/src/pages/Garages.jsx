import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Building2, MapPin, Pencil, Trash2, X, AlertCircle, CheckCircle, Search } from 'lucide-react';

// ── Modal Component ─────────────────────────────────────────────────────────
function GarageModal({ garage, allGarages, onClose, onSaved }) {
  const isEditing = !!garage;
  const [form, setForm] = useState({ 
    Name: garage?.Name || '', 
    Location: garage?.Location || '',
    ContactNumber: garage?.ContactNumber || '',
    ManagerID: garage?.ManagerID || '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [managerInput, setManagerInput] = useState('');
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };
    fetchUsers();
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

  const filteredManagers = managers.filter(m => 
    m.FullName.toLowerCase().includes(managerInput.toLowerCase()) || 
    m.Email?.toLowerCase().includes(managerInput.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Name.trim() || !form.Location.trim()) { setError('Garages must have a name and location.'); return; }
    
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
        managerId: form.ManagerID || null
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
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:border dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Garage' : 'Add New Garage'}
          </h2>
          <button id="modal-close-btn" onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-300" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex gap-3 items-center text-red-600 dark:text-red-400 mb-6 text-sm font-bold">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="garage-name" className="font-bold text-sm text-slate-700 dark:text-slate-300">Garage Name <span className="text-red-500">*</span></label>
            <input
              id="garage-name"
              value={form.Name}
              onChange={e => setForm(f => ({ ...f, Name: e.target.value }))}
              placeholder="e.g. Sunrise Auto Garage"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="garage-location" className="font-bold text-sm text-slate-700 dark:text-slate-300">Location <span className="text-red-500">*</span></label>
            <input
              id="garage-location"
              value={form.Location}
              onChange={e => setForm(f => ({ ...f, Location: e.target.value }))}
              placeholder="e.g. Bole, Addis Ababa"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="garage-contact" className="font-bold text-sm text-slate-700 dark:text-slate-300">Contact Number</label>
            <input
              id="garage-contact"
              value={form.ContactNumber}
              onChange={e => setForm(f => ({ ...f, ContactNumber: e.target.value }))}
              placeholder="e.g. 0911234567"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
            />
          </div>
          <div className="flex flex-col gap-2 relative">
            <label htmlFor="garage-manager" className="font-bold text-sm text-slate-700 dark:text-slate-300">Garage Manager (Optional)</label>
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
                className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-base shadow-sm"
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
              <div className="absolute top-full left-0 right-0 mt-2 z-10 max-h-48 overflow-y-auto bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg">
                <div 
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer text-slate-700 dark:text-slate-200"
                  onClick={() => {
                    setManagerInput('');
                    setForm(f => ({ ...f, ManagerID: '' }));
                    setIsManagerDropdownOpen(false);
                  }}
                >
                  <span className="italic">Unassigned</span>
                </div>
                {filteredManagers.length === 0 && managerInput && (
                  <div className="px-4 py-2 text-slate-500 dark:text-slate-400">
                    No managers found.
                  </div>
                )}
                {filteredManagers.map(user => (
                  <div 
                    key={user.UserID} 
                    className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer flex flex-col border-t border-slate-100 dark:border-slate-600"
                    onClick={() => {
                      setManagerInput(user.FullName);
                      setForm(f => ({ ...f, ManagerID: user.UserID }));
                      setIsManagerDropdownOpen(false);
                    }}
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{user.FullName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{user.Email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              id="modal-submit-btn"
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl border-2 border-blue-600 bg-blue-600 text-white font-bold hover:bg-blue-700 hover:border-blue-700 transition-colors shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Garage')}
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
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:border dark:border-slate-700 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
          <Trash2 size={32} className="text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Archive Garage?</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
          <strong className="text-slate-900 dark:text-white">{garage.Name}</strong> will be archived and hidden from the public view. This action can be reversed.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onClose} 
            disabled={loading} 
            className="flex-1 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-70"
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 2000,
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: 10, padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: 8,
          color: toast.type === 'success' ? '#15803d' : '#dc2626', boxShadow: 'var(--shadow-md)',
          fontWeight: 500, fontSize: 'var(--font-sizes-sm)'
        }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Garages</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{garages.length} total garages on platform</p>
        </div>
        <button
          id="add-garage-btn"
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-full shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all border border-blue-600"
        >
          <Plus size={18} /> Add New Garage
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-[400px]">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="garage-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or location..."
          className="w-full pl-11 pr-5 py-2.5 rounded-full border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 10, padding: '1.25rem', border: '1px solid var(--border-light)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-surface)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ background: 'var(--bg-surface)', borderRadius: 4, height: 14, width: '40%', marginBottom: 8 }} />
                <div style={{ background: 'var(--bg-surface)', borderRadius: 4, height: 12, width: '25%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Building2 size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>{search ? 'No garages match your search.' : 'No garages yet. Add your first one!'}</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                {['Garage', 'Location', 'Manager', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: 'var(--font-sizes-sm)', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, idx) => (
                <tr key={g.GarageID} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={18} color="var(--primary-600)" />
                      </div>
                      <span style={{ fontWeight: 600 }}>{g.Name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 'var(--font-sizes-sm)' }}>
                      <MapPin size={14} />
                      {g.Location || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: 'var(--font-sizes-sm)', color: 'var(--text-muted)' }}>
                    {g.ManagerID ? `Manager #${g.ManagerID}` : <span style={{ color: '#f59e0b', fontStyle: 'italic' }}>Unassigned</span>}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        id={`edit-garage-${g.GarageID}`}
                        onClick={() => { setEditTarget(g); setShowModal(true); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.875rem', borderRadius: 6, border: '1px solid var(--border-strong)', background: 'white', cursor: 'pointer', fontSize: 'var(--font-sizes-sm)', fontWeight: 500 }}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        id={`archive-garage-${g.GarageID}`}
                        onClick={() => setArchiveTarget(g)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.875rem', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', fontSize: 'var(--font-sizes-sm)', fontWeight: 500, color: '#dc2626' }}
                      >
                        <Trash2 size={14} /> Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
