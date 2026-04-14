import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, Wrench, DollarSign, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [requests, setRequests] = useState([]);
  const [garageStats, setGarageStats] = useState({ activeJobs: 0, totalRevenue: 0, lowStockItems: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    if (!user?.GarageID) return;
    
    try {
      setLoading(true);
      const [reqsResponse, statsResponse] = await Promise.all([
        api.get(`/services/garage/${user.GarageID}`),
        api.get(`/garages/${user.GarageID}/stats`)
      ]);
      
      setRequests(reqsResponse.data.data);
      setGarageStats(statsResponse.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [user?.GarageID]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = [
    { title: t('activeJobs'), value: garageStats.activeJobs || '0', icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: t('totalRevenue'), value: `${parseFloat(garageStats.totalRevenue || 0).toLocaleString()} ETB`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
    { title: t('lowStockWarnings'), value: garageStats.lowStockItems?.length || '0', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">
          {t('dashboard') || 'Garage Dashboard'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card flex items-center p-6 transition-all hover:shadow-md">
              <div className={`p-4 rounded-full ${stat.bg} ${stat.color} mr-5`}>
                <Icon size={28} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium tracking-wide">{stat.title}</p>
                <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{loading ? '...' : stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings Panel */}
        <div className="lg:col-span-2 card p-6 min-h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('recentBookings')}</h2>
            <Link to="/bookings" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">{t('viewAll')}</Link>
          </div>
          
          {loading ? (
             <div className="flex-1 flex justify-center items-center h-32">
               <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
             </div>
          ) : requests.length === 0 ? (
             <div className="flex-1 flex flex-col justify-center items-center text-gray-400 p-4">
               <Calendar size={48} className="mb-2 opacity-20" />
               <p>{t('noRecentBookings')}</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                    <th className="p-3 font-semibold">{t('reqId')}</th>
                    <th className="p-3 font-semibold">{t('serviceType')}</th>
                    <th className="p-3 font-semibold">{t('emergency')}</th>
                    <th className="p-3 font-semibold">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {requests.slice(0, 7).map((req) => (
                    <tr key={req.RequestID} className="border-b border-gray-50 hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-gray-500 font-mono">#{req.RequestID.toString().padStart(4, '0')}</td>
                      <td className="p-3 text-gray-900 font-bold">{req.ServiceType}</td>
                      <td className="p-3">
                        {req.IsEmergency ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-bold uppercase">{t('yes')}</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs uppercase font-medium">{t('no')}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.Status === 'Completed' ? 'bg-green-100 text-green-700' :
                          req.Status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          req.Status === 'InProgress' ? 'bg-blue-100 text-blue-700' :
                          req.Status === 'Approved' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {req.Status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Warning Panel */}
        <div className={`card border-t-4 p-6 flex flex-col h-full bg-gradient-to-b ${!garageStats.lowStockItems || garageStats.lowStockItems.length === 0 ? 'border-t-green-500 from-green-50/30' : 'border-t-red-500 from-red-50/30'} to-white`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className={!garageStats.lowStockItems || garageStats.lowStockItems.length === 0 ? 'text-green-500' : 'text-red-500'} size={20} />
              {(!garageStats.lowStockItems || garageStats.lowStockItems.length === 0) ? t('inventoryStatus') : t('lowStockWarnings')}
            </h2>
            <Link to="/inventory" className={`text-sm font-semibold hover:underline ${!garageStats.lowStockItems || garageStats.lowStockItems.length === 0 ? 'text-green-600' : 'text-red-600'}`}>{t('manageAll')}</Link>
          </div>

          <div className="flex-1">
            {loading ? (
               <div className="flex justify-center items-center h-32">
                 <span className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></span>
               </div>
            ) : !garageStats.lowStockItems || garageStats.lowStockItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center text-center h-full text-green-600 py-10 opacity-70">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                   <Wrench size={32} />
                 </div>
                 <p className="font-semibold text-sm">{t('inventoryHealthy')}</p>
                 <p className="text-xs text-gray-500 mt-1">{t('noMinimumStockLimits')}</p>
               </div>
            ) : (
              <div className="space-y-3">
                {garageStats.lowStockItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white border border-red-100 rounded-lg shadow-sm hover:border-red-300 transition-colors">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{item.ItemName}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-xs text-gray-500 uppercase font-medium">{t('qty')}:</span>
                      <span className={`font-black text-lg ${item.Quantity === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                        {item.Quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
