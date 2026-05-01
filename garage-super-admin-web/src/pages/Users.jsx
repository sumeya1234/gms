import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { UsersIcon, Search, UserCircle, Mail, Phone, Shield, AlertCircle } from 'lucide-react';

const ROLE_CONFIG = {
  SuperAdmin: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200/50', label: 'Super Admin' },
  GarageManager: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200/50', label: 'Garage Manager' },
  Mechanic: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200/50', label: 'Mechanic' },
  Customer: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200/50', label: 'Customer' },
};

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: role };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Shield size={12} /> {cfg.label}
    </span>
  );
};

const StatusDot = ({ status }) => (
  <span className={`inline-flex items-center gap-2 text-sm font-medium ${status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>
    <span className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    {status || 'Active'}
  </span>
);

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
      } catch (err) {
        setError('Failed to load users. Make sure you are logged in as a Super Admin.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const roles = ['All', 'SuperAdmin', 'GarageManager', 'Mechanic', 'Customer'];

  const filtered = users.filter(u => {
    const matchSearch = u.FullName?.toLowerCase().includes(search.toLowerCase()) ||
                        u.Email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.Role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex flex-col gap-6">
      {}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading ? 'Loading...' : `${users.length} total users registered`}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-center text-red-600 text-sm font-semibold">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="user-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-11 pr-5 py-2.5 rounded-full border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm text-sm font-medium"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {roles.map(r => (
            <button
              key={r}
              id={`filter-${r}`}
              onClick={() => setRoleFilter(r)}
              className={`px-5 py-2.5 rounded-full border text-sm font-bold transition-all shadow-sm ${
                roleFilter === r 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 flex gap-4 items-center animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0" />
              <div className="flex-1">
                <div className="bg-slate-100 rounded-md h-3.5 w-1/3 mb-2" />
                <div className="bg-slate-100 rounded-md h-3 w-1/4" />
              </div>
              <div className="bg-slate-100 rounded-full h-6 w-20" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
          <UsersIcon size={48} className="mx-auto mb-4 opacity-30 text-slate-400" />
          <p className="text-lg font-medium">{search ? 'No users match your search.' : 'No users found.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined'].map(h => (
                    <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const initials = (u.FullName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  const roleCfg = ROLE_CONFIG[u.Role] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
                  return (
                    <tr
                      key={u.UserID}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border ${roleCfg.bg} ${roleCfg.text} ${roleCfg.border}`}>
                            {initials}
                          </div>
                          <span className="font-bold text-slate-900">{u.FullName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-slate-400" /> {u.Email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-slate-400" /> {u.PhoneNumber || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={u.Role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusDot status={u.Status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                        {u.CreatedAt ? new Date(u.CreatedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
