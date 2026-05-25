import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar, Wrench, DollarSign, AlertTriangle, AlertCircle,
  Search, Download, TrendingUp, Package, FileText, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';
import { format } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { Link } from 'react-router-dom';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [period, setPeriod] = useState('monthly');
  const [requests, setRequests] = useState([]);
  const [garageStats, setGarageStats] = useState({
    activeJobs: 0,
    totalRevenue: 0,
    lowStockItems: [],
    activeEstimates: 0,
    pendingApproval: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [serviceTrends, setServiceTrends] = useState([]);
  const [partsUsage, setPartsUsage] = useState([]);
  const [garageInfo, setGarageInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    if (!user?.GarageID) return;

    try {
      setLoading(true);
      const [reqsResponse, statsResponse, garageResponse, revRes, servRes, partsRes] = await Promise.all([
        api.get(`/services/garage/${user.GarageID}`),
        api.get(`/garages/${user.GarageID}/stats`),
        api.get(`/garages/${user.GarageID}`),
        api.get(`/garages/${user.GarageID}/revenue-trend?period=${period}`),
        api.get(`/garages/${user.GarageID}/service-trends?period=${period}`),
        api.get(`/garages/${user.GarageID}/parts-usage?period=${period}`)
      ]);

      setRequests(reqsResponse.data?.data || reqsResponse.data || []);
      setGarageStats({
        activeJobs: statsResponse.data?.activeJobs || 0,
        totalRevenue: statsResponse.data?.totalRevenue || 0,
        lowStockItems: statsResponse.data?.lowStockItems || [],
        activeEstimates: statsResponse.data?.activeEstimates || 0,
        pendingApproval: statsResponse.data?.pendingApproval || 0
      });
      setGarageInfo(garageResponse.data);
      setRevenueData(revRes.data?.data || []);
      setServiceTrends(servRes.data || []);
      setPartsUsage(partsRes.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      setError(t('failedToLoadMetrics'));
    } finally {
      setLoading(false);
    }
  }, [user?.GarageID, period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredParts = useMemo(() => {
    return (partsUsage || []).filter(item =>
      item.ItemName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [partsUsage, searchQuery]);

  const totalPartsCost = useMemo(() => {
    return filteredParts.reduce((sum, item) => sum + Number(item.totalCost), 0);
  }, [filteredParts]);

  const stats = [
    { title: t('activeJobs'), value: garageStats.activeJobs || '0', icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: t('totalRevenue'), value: `${parseFloat(garageStats.totalRevenue || 0).toLocaleString()} ETB`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
    { title: t('partsConsumption'), value: partsUsage.reduce((s, d) => s + Number(d.totalQuantity), 0), icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: t('activeEstimates'), value: garageStats.activeEstimates, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">
            {t('dashboard')}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">{t('monitorPerformanceTrends')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {t(p)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {garageInfo && garageInfo.Status === 'Inactive' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900 mb-1">{t('garageNotPublished')}</h3>
              <p className="text-amber-800 text-sm mb-4">{t('completeOnboardingToAppear')}</p>
              <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider">
                <Link to="/services" className="px-3 py-1.5 bg-white border border-amber-200 text-amber-700 rounded-md hover:bg-amber-100 transition-colors">{t('setupServices')}</Link>
                <Link to="/inventory" className="px-3 py-1.5 bg-white border border-amber-200 text-amber-700 rounded-md hover:bg-amber-100 transition-colors">{t('addInventory')}</Link>
                <Link to="/settings" className="px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-sm">{t('completeProfile')}</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card flex items-center p-6 transition-all hover:shadow-md">
              <div className={`p-4 rounded-full ${stat.bg} ${stat.color} mr-5`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{stat.title}</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{loading ? '...' : stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6 flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">{t('revenueTrend')}</h2>
            <TrendingUp size={20} className="text-blue-500" />
          </div>
          <div className="flex-1 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center h-32">
                <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis hide />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val) => [`${val.toLocaleString()} ETB`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card p-6 flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">{t('popularServices')}</h2>
            <Wrench size={20} className="text-indigo-500" />
          </div>
          <div className="flex-1 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center h-32">
                <span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={serviceTrends} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="ServiceName" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#1e293b', fontWeight: 'bold' }} width={100} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="usageCount" name="Jobs" radius={[0, 4, 4, 0]}>
                    {serviceTrends.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 min-h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('recentBookings')}</h2>
            <Link to="/bookings" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">{t('viewAll')}</Link>
          </div>

          {loading ? (
            <div className="flex-1 flex justify-center items-center h-32">
              <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-gray-400 p-4">
              <Calendar size={48} className="mb-2 opacity-20" />
              <p>{t('noRecentBookings')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-100 text-xs uppercase tracking-wider text-gray-500 outline-none">
                    <th className="p-3 font-semibold">{t('reqId')}</th>
                    <th className="p-3 font-semibold">{t('serviceType')}</th>
                    <th className="p-3 font-semibold">{t('emergency')}</th>
                    <th className="p-3 font-semibold">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {requests.slice(0, 5).map((req) => (
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
                        <div className="flex flex-col gap-1">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.Status === 'Completed' ? 'bg-green-100 text-green-700' :
                            req.Status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              req.Status === 'InProgress' ? 'bg-blue-100 text-blue-700' :
                                req.Status === 'Approved' ? 'bg-indigo-100 text-indigo-700' :
                                  'bg-red-100 text-red-700'
                            }`}>
                            {t(req.Status === 'InProgress' ? 'inProgress' : req.Status.toLowerCase())}
                          </span>
                          {req.EstimatedCompletionTime && (req.Status === 'InProgress' || req.Status === 'Working' || req.Status === 'Arrived') && (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-fit">
                              <span className="opacity-70">{t('eta')}:</span> {new Date(req.EstimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
                {(garageStats.lowStockItems || []).slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white border border-red-100 rounded-lg shadow-sm">
                    <p className="font-bold text-gray-800 text-sm">{item.ItemName}</p>
                    <span className="font-black text-lg text-red-600">{item.Quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Parts Usage Table */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t('detailedPartsUsageLog')}</h2>
            <p className="text-xs text-slate-400 mt-0.5 tracking-tight uppercase font-black">{t('accountantCopy')}</p>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchUsedParts')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white transition-all outline-none font-medium w-full md:w-[300px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                <th className="p-4">{t('partName')}</th>
                <th className="p-4">{t('quantityUsed')}</th>
                <th className="p-4">{t('avgUnitPrice')}</th>
                <th className="p-4">{t('totalCost')}</th>
                <th className="p-4">{t('lastConsumption')}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center"><span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin inline-block"></span></td></tr>
              ) : filteredParts.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400 italic font-bold">{t('noPartsUsageFound')}</td></tr>
              ) : (
                filteredParts.map((item) => (
                  <tr key={item.ItemID} className="border-b border-slate-50 hover:bg-blue-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{item.ItemName}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{item.totalQuantity}</span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">{Number(item.avgPrice).toLocaleString()} ETB</td>
                    <td className="p-4 text-indigo-600 font-black">{Number(item.totalCost).toLocaleString()} ETB</td>
                    <td className="p-4 text-slate-400 text-xs font-medium">
                      {item.lastUsed ? format(new Date(item.lastUsed), 'MMM d, yyyy') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && filteredParts.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-black">
                  <td colSpan="3" className="p-4 text-right uppercase tracking-widest text-xs opacity-70">{t('grandTotalValue')}</td>
                  <td className="p-4 text-lg">{totalPartsCost.toLocaleString()} ETB</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
