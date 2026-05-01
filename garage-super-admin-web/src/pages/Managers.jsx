import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Briefcase, Search, Plus, Mail, Phone, AlertCircle, X, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Managers() {
  const { t } = useTranslation();
  const [managers, setManagers] = useState([]);
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [staffRole, setStaffRole] = useState('GarageManager');
  
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [selectedGarageId, setSelectedGarageId] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchManagers();
    fetchGarages();
  }, [staffRole]);

  const fetchManagers = async () => {
    try {
      const endpoint = staffRole === 'GarageOwner' ? '/users/admin/owners' : '/users/admin/managers';
      const res = await api.get(endpoint);
      setManagers(res.data);
    } catch (err) {
      setError(`Failed to load ${staffRole === 'GarageOwner' ? 'owners' : 'managers'}.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGarages = async () => {
    try {
      const res = await api.get('/garages');
      setGarages(res.data);
    } catch (err) {
      console.error("Failed to load garages for assignment dropdown", err);
    }
  };

  const handleAddManager = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        email: formData.email.trim(),
        password: formData.password.trim(),
      };
      const endpoint = staffRole === 'GarageOwner' ? '/users/admin/owners' : '/users/admin/managers';
      await api.post(endpoint, payload);
      setIsAddModalOpen(false);
      setFormData({ fullName: '', email: '', phone: '', password: '' });
      fetchManagers();
    } catch (err) {
      setFormError(err.response?.data?.error || `Failed to create ${staffRole === 'GarageOwner' ? 'owner' : 'manager'}.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignGarage = async (e) => {
    e.preventDefault();
    if (!selectedGarageId || !selectedManager) return;
    
    setFormError('');
    setFormLoading(true);
    try {
      await api.put(`/users/${selectedManager.UserID}/garage`, { garageId: selectedGarageId });
      setIsAssignModalOpen(false);
      setSelectedManager(null);
      setSelectedGarageId('');
      fetchManagers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to assign garage.');
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = managers.filter(m => 
    m.FullName?.toLowerCase().includes(search.toLowerCase()) ||
    m.Email?.toLowerCase().includes(search.toLowerCase()) ||
    m.GarageName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{staffRole === 'GarageOwner' ? 'Garage Owners' : 'Garage Managers'}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? 'Loading...' : `${managers.length} ${staffRole === 'GarageOwner' ? 'owners' : 'managers'} on the platform`}
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#1890ff] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all hover:bg-blue-600"
        >
          <Plus size={18} /> {staffRole === 'GarageOwner' ? 'Add Owner' : 'Add Manager'}
        </button>
      </div>

      <div className="inline-flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm w-fit">
        {[
          { id: 'GarageManager', label: 'Managers' },
          { id: 'GarageOwner', label: 'Owners' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setStaffRole(item.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              staffRole === item.id ? 'bg-[#1890ff] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2 items-center text-red-600 text-sm font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {}
      <div className="relative max-w-sm">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or garage..."
          className="w-full pl-11 pr-5 py-2.5 rounded-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#1890ff] transition-all shadow-sm text-sm"
        />
      </div>

      {}
      {loading ? (
         <div className="flex justify-center items-center h-32">
           <span className="w-8 h-8 border-4 border-[#1890ff] border-t-transparent rounded-full animate-spin"></span>
         </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Briefcase size={48} className="mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Managers Found</h3>
          <p className="text-gray-500 text-sm">{search ? 'Try adjusting your search query.' : `Click "Add ${staffRole === 'GarageOwner' ? 'Owner' : 'Manager'}" to onboard your first garage ${staffRole === 'GarageOwner' ? 'owner' : 'manager'}.`}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                  <th className="p-4 font-semibold whitespace-nowrap">{staffRole === 'GarageOwner' ? 'Owner Profile' : 'Manager Profile'}</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Contact</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Assigned Garage</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Joined Date</th>
                  <th className="p-4 font-semibold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map((m) => {
                  const initials = (m.FullName || 'M').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={m.UserID} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1890ff] flex items-center justify-center font-bold text-sm shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{m.FullName || '—'}</div>
                            <div className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full inline-block mt-1">
                              {staffRole === 'GarageOwner' ? 'Owner' : 'Manager'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail size={14} className="text-gray-400" /> 
                          <span className="truncate max-w-[150px]">{m.Email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" /> {m.PhoneNumber || '—'}
                        </div>
                      </td>
                      <td className="p-4">
                        {m.GarageID ? (
                          <div className="flex items-center gap-2 text-green-700 font-bold bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg inline-flex">
                            <ShieldCheck size={16} />
                            {m.GarageName}
                          </div>
                        ) : (
                          <span className="text-gray-400 font-medium italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 whitespace-nowrap">
                        {m.CreatedAt ? new Date(m.CreatedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => {
                            setSelectedManager(m);
                            setSelectedGarageId(m.GarageID || '');
                            setIsAssignModalOpen(true);
                          }}
                          className={`${m.GarageID ? 'text-gray-500 hover:text-[#1890ff] bg-gray-50 hover:bg-blue-50' : 'text-[#1890ff] bg-blue-50 hover:bg-blue-100'} px-4 py-2 rounded-lg font-bold transition-colors shadow-sm`}
                        >
                          {m.GarageID ? 'Re-assign' : 'Assign Garage'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{staffRole === 'GarageOwner' ? 'Add New Owner' : 'Add New Manager'}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddManager} className="p-6">
              {formError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 font-medium flex gap-2 items-center mb-5">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    placeholder="e.g. Abebe Kebede"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-blue-500/10 focus:border-[#1890ff] transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="manager@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-blue-500/10 focus:border-[#1890ff] transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+251 911 234 567"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-blue-500/10 focus:border-[#1890ff] transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Temporary Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-blue-500/10 focus:border-[#1890ff] transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3 rounded-xl bg-[#1890ff] text-white font-bold hover:bg-blue-600 transition-colors disabled:opacity-70"
                >
                  {formLoading ? `Creating ${staffRole === 'GarageOwner' ? 'Owner' : 'Manager'}...` : `Create ${staffRole === 'GarageOwner' ? 'Owner' : 'Manager'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {isAssignModalOpen && selectedManager && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Assign Garage</h2>
              <button 
                onClick={() => { setIsAssignModalOpen(false); setSelectedManager(null); setSelectedGarageId(''); }} 
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAssignGarage} className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                Map <strong className="text-gray-900">{selectedManager.FullName}</strong> to manage operations at a specific garage system below.
              </p>

              {formError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 font-medium flex gap-2 items-center mb-5">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Garage</label>
                <select
                  required
                  value={selectedGarageId}
                  onChange={e => setSelectedGarageId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-4 focus:ring-blue-500/10 focus:border-[#1890ff] transition-all text-sm font-medium"
                >
                  <option value="" disabled>-- Choose a Garage --</option>
                  {garages.map(g => (
                    <option key={g.GarageID} value={g.GarageID}>{g.Name} (ID: {g.GarageID})</option>
                  ))}
                </select>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !selectedGarageId}
                  className="flex-1 py-3 rounded-xl bg-[#1890ff] text-white font-bold hover:bg-blue-600 transition-colors disabled:opacity-70"
                >
                  {formLoading ? 'Assigning...' : 'Save Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
