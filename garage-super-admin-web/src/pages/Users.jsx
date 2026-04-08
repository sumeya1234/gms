import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { UsersIcon, Search, UserCircle, Mail, Phone, Shield, AlertCircle } from 'lucide-react';

const ROLE_CONFIG = {
  SuperAdmin:    { bg: '#f5f3ff', color: '#7c3aed', label: 'Super Admin' },
  GarageManager: { bg: '#fffbeb', color: '#d97706', label: 'Garage Manager' },
  Mechanic:      { bg: '#eff6ff', color: '#2563eb', label: 'Mechanic' },
  Customer:      { bg: '#f0fdf4', color: '#16a34a', label: 'Customer' },
};

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role] || { bg: 'var(--bg-surface)', color: 'var(--text-muted)', label: role };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '0.25rem 0.625rem', borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: '0.75rem', fontWeight: 600
    }}>
      <Shield size={11} /> {cfg.label}
    </span>
  );
};

const StatusDot = ({ status }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 'var(--font-sizes-sm)', color: status === 'Active' ? '#16a34a' : 'var(--text-muted)'
  }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'Active' ? '#22c55e' : '#94a3b8', display: 'inline-block' }} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--font-sizes-2xl)', fontWeight: 700 }}>Users</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sizes-sm)', marginTop: 2 }}>
          {loading ? 'Loading...' : `${users.length} total users registered`}
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '1rem', display: 'flex', gap: 8, alignItems: 'center', color: '#dc2626', fontSize: 'var(--font-sizes-sm)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="user-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-11 pr-5 py-2.5 rounded-full border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {roles.map(r => (
            <button
              key={r}
              id={`filter-${r}`}
              onClick={() => setRoleFilter(r)}
              className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all shadow-sm ${
                roleFilter === r 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 10, padding: '1rem 1.25rem', border: '1px solid var(--border-light)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-surface)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ background: 'var(--bg-surface)', borderRadius: 4, height: 14, width: '35%', marginBottom: 8 }} />
                <div style={{ background: 'var(--bg-surface)', borderRadius: 4, height: 12, width: '50%' }} />
              </div>
              <div style={{ background: 'var(--bg-surface)', borderRadius: 20, height: 24, width: 80 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <UsersIcon size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>{search ? 'No users match your search.' : 'No users found.'}</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: 'var(--font-sizes-sm)', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => {
                const initials = (u.FullName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const roleCfg = ROLE_CONFIG[u.Role] || { bg: 'var(--bg-surface)', color: 'var(--text-muted)' };
                return (
                  <tr
                    key={u.UserID}
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: roleCfg.bg, color: roleCfg.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-sizes-sm)' }}>{u.FullName || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: 'var(--font-sizes-sm)', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={13} /> {u.Email}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: 'var(--font-sizes-sm)', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={13} /> {u.PhoneNumber || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <RoleBadge role={u.Role} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <StatusDot status={u.Status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: 'var(--font-sizes-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {u.CreatedAt ? new Date(u.CreatedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
