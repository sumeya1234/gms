import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Building2, Users, Activity, DollarSign,
  TrendingUp, ArrowRight, Plus, AlertCircle, TrendingDown,
  Sparkles
} from 'lucide-react';

// eslint-disable-next-line no-unused-vars
const StatCard = ({ icon: Icon, label, value, colorClass, iconBgClass, sub, trend }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between min-w-[220px] flex-1">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgClass} ${colorClass}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
      {sub && (
        <span className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 ${trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {trend === 'down' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
          {sub}
        </span>
      )}
    </div>
    
    <div>
      <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
      <p className="text-sm font-semibold text-slate-500 mt-1">{label}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { t } = useTranslation();
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
    <div className="flex flex-col gap-6">
      <div className="h-28 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-64 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
        <div className="lg:col-span-2 h-64 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-bold mb-2 uppercase tracking-wide">
            <Sparkles size={14} /> Super Admin
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{t('welcomeBack')}</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">{t('overviewOf')} <span className="font-bold text-blue-600">GMS</span> {t('platformToday')}</p>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 border border-red-200 shadow-sm font-medium text-sm">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Stat Boxes Array */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label={t('garages')}
          value={stats?.totalGarages ?? '—'}
          colorClass="text-blue-600"
          iconBgClass="bg-blue-50"
          sub={t('activeOnConfig')}
          trend="up"
        />
        <StatCard
          icon={Users}
          label={t('users')}
          value={stats?.totalUsers ?? '—'}
          colorClass="text-violet-600"
          iconBgClass="bg-violet-50"
          sub={t('registered')}
          trend="up"
        />
        <StatCard
          icon={Activity}
          label={t('requests')}
          value={stats?.activeRequests ?? '—'}
          colorClass="text-amber-600"
          iconBgClass="bg-amber-50"
          sub={t('inProgress')}
          trend="up"
        />
        <StatCard
          icon={DollarSign}
          label={t('revenue')}
          value={stats?.totalRevenue != null ? `${Number(stats.totalRevenue).toLocaleString()}` : '—'}
          colorClass="text-emerald-600"
          iconBgClass="bg-emerald-50"
          sub="ETB"
          trend="up"
        />
      </section>

      {/* Main Content Modules */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t('quickActions')}</h3>
          
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <button
              id="quick-action-add-garage"
              onClick={() => navigate('/garages')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-600 hover:text-white transition-colors group border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:text-blue-600 text-blue-600">
                  <Plus size={18} strokeWidth={2.5} />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-white text-sm">{t('addNewGarage')}</span>
              </div>
              <ArrowRight className="text-slate-400 group-hover:text-white" size={16} />
            </button>

            <button
              id="quick-action-view-users"
              onClick={() => navigate('/users')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-violet-600 hover:text-white transition-colors group border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:text-violet-600 text-violet-600">
                  <Users size={18} strokeWidth={2.5} />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-white text-sm">{t('viewAllUsers')}</span>
              </div>
              <ArrowRight className="text-slate-400 group-hover:text-white" size={16} />
            </button>
          </div>
        </div>

        {/* System Health */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">{t('systemHealth')}</h3>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <button className="px-3 py-1.5 bg-white text-slate-900 rounded text-xs font-bold shadow-sm">{t('today')}</button>
              <button className="px-3 py-1.5 text-slate-500 hover:text-slate-900 rounded text-xs font-bold transition-colors">{t('weekly')}</button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 relative">
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30" />
              <Activity size={32} strokeWidth={2} />
            </div>
            <h4 className="font-bold text-xl text-slate-900 tracking-tight">{t('allSystemsOperational')}</h4>
            <p className="font-medium text-sm text-slate-500 mt-1">{t('platformStable')}</p>
          </div>
        </div>

      </section>
    </div>
  );
}
