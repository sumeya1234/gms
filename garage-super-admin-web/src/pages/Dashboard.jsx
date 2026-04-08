import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Building2, Users, Activity, DollarSign,
  TrendingUp, ArrowRight, Plus, AlertCircle, TrendingDown
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, colorClass, iconBgClass, sub, trend }) => (
  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl min-w-[180px] shadow-md border border-slate-200 dark:border-slate-700">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClass} ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black text-on-surface">{value}</p>
      {sub && (
        <span className={`text-[10px] font-bold flex items-center ${trend === 'down' ? 'text-error' : 'text-success-500'}`}>
          {trend === 'down' ? <TrendingDown size={12} className="mr-1" /> : <TrendingUp size={12} className="mr-1" />}
          {sub}
        </span>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get('/users/admin/dashboard');
        setStats(res.data);
      } catch (err) {
        setError('Failed to load dashboard stats. Please check your connection.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col gap-10">
      <div className="h-24 bg-surface-container-low rounded-2xl animate-pulse" />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 h-64 bg-surface-container-low rounded-3xl animate-pulse" />
        <div className="col-span-12 lg:col-span-4 h-64 bg-surface-container-low rounded-3xl animate-pulse" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Header & Metrics */}
      <section className="grid grid-cols-12 gap-8 items-end">
        <div className="col-span-12 lg:col-span-5">
          <h2 className="text-5xl font-black tracking-tight text-on-surface">Welcome back</h2>
          <p className="text-on-surface-variant mt-2 text-lg">Here's an overview of the <span className="font-bold text-primary">GMS Platform</span> today.</p>
        </div>
        
        <div className="col-span-12 lg:col-span-7 flex flex-wrap justify-end gap-4">
          <StatCard
            icon={Building2}
            label="Garages"
            value={stats?.totalGarages ?? '—'}
            colorClass="text-primary"
            iconBgClass="bg-blue-100 dark:bg-blue-900/30"
            sub="Active on config"
          />
          <StatCard
            icon={Users}
            label="Users"
            value={stats?.totalUsers ?? '—'}
            colorClass="text-purple-600 dark:text-purple-400"
            iconBgClass="bg-purple-100 dark:bg-purple-900/30"
            sub="Registered"
          />
          <StatCard
            icon={Activity}
            label="Requests"
            value={stats?.activeRequests ?? '—'}
            colorClass="text-orange-600 dark:text-orange-400"
            iconBgClass="bg-orange-100 dark:bg-orange-900/30"
            sub="In-progress"
          />
          <StatCard
            icon={DollarSign}
            label="Revenue"
            value={stats?.totalRevenue != null ? `$${Number(stats.totalRevenue).toLocaleString()}` : '—'}
            colorClass="text-green-600 dark:text-green-400"
            iconBgClass="bg-green-100 dark:bg-green-900/30"
            sub="Completed"
          />
        </div>
      </section>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <AlertCircle size={20} />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      {/* Bento Grid Content */}
      <section className="grid grid-cols-12 gap-8">
        
        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-800 p-8 rounded-3xl relative overflow-hidden flex flex-col shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold tracking-tight">Quick Actions</h3>
          </div>
          
          <div className="space-y-4 flex-1">
            <button
              id="quick-action-add-garage"
              onClick={() => navigate('/garages')}
              className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-4">
                <Plus className="text-primary group-hover:text-on-primary" size={20} />
                <span className="font-bold text-sm">Add New Garage</span>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-on-primary" size={18} />
            </button>

            <button
              id="quick-action-view-users"
              onClick={() => navigate('/users')}
              className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl hover:bg-purple-600 hover:text-white transition-all group shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-4">
                <Users className="text-purple-600 group-hover:text-white" size={20} />
                <span className="font-bold text-sm">View All Users</span>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-white" size={18} />
            </button>
          </div>
        </div>

        {/* Platform Overview Placeholder */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold tracking-tight">System Health & Metrics</h3>
              <p className="text-sm text-on-surface-variant">Live overview of your infrastructure</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold">Today</button>
              <button className="px-4 py-2 bg-surface-container-high rounded-lg text-xs font-bold text-on-surface">Weekly</button>
            </div>
          </div>
          
          <div className="flex items-center justify-center p-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl relative overflow-hidden group">
             <div className="relative z-10 text-center">
                <Activity size={48} className="mx-auto text-primary mb-4" />
                <h4 className="font-black text-2xl leading-tight">All Systems Operational</h4>
                <p className="text-sm mt-2 opacity-80">Platform is currently stable with normal request volumes.</p>
              </div>
              <Activity className="absolute -right-6 -bottom-6 text-9xl opacity-10 group-hover:scale-110 transition-transform" />
          </div>
        </div>

      </section>
    </div>
  );
}
