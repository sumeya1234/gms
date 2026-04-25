import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, DollarSign, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { Link } from 'react-router-dom';

export default function OwnerDashboard() {
    const { t } = useTranslation();
    const { user } = useAuthStore();

    const [garageStats, setGarageStats] = useState({ activeJobs: 0, totalRevenue: 0, lowStockItems: [] });
    const [revenuePeriod, setRevenuePeriod] = useState('daily');
    const [revenueTrend, setRevenueTrend] = useState([]);
    const [generatedReport, setGeneratedReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboardData = useCallback(async () => {
        if (!user?.GarageID) return;

        try {
            setLoading(true);
            const [statsRes, trendRes, reportRes] = await Promise.all([
                api.get(`/garages/${user.GarageID}/owner-overview`),
                api.get(`/garages/${user.GarageID}/revenue-trend`, { params: { period: revenuePeriod } }),
                api.get(`/garages/${user.GarageID}/reports`, { params: { period: 'monthly' } })
            ]);

            setGarageStats({
                activeJobs: statsRes.data?.activeJobs || 0,
                totalRevenue: statsRes.data?.totalRevenue || 0,
                lowStockItems: statsRes.data?.lowStockItems || []
            });
            setRevenueTrend(trendRes.data?.data || []);
            setGeneratedReport(reportRes.data || null);
            setError('');
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
            setError('Failed to load dashboard metrics.');
        } finally {
            setLoading(false);
        }
    }, [user?.GarageID, revenuePeriod]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const stats = [
        { title: t('activeJobs'), value: garageStats.activeJobs || '0', icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50' },
        { title: t('totalRevenue'), value: `${parseFloat(garageStats.totalRevenue || 0).toLocaleString()} ETB`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
        { title: t('lowStockWarnings'), value: garageStats.lowStockItems?.length || '0', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-[var(--color-primary)]">
                    Owner Reports
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Revenue Reporting */}
                <div className="card p-6 min-h-[350px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Revenue Reporting</h2>
                        <select className="input-field !py-1.5 !text-sm" value={revenuePeriod} onChange={(e) => setRevenuePeriod(e.target.value)}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center">
                            <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                        </div>
                    ) : !revenueTrend || revenueTrend.length === 0 ? (
                        <div className="flex-1 flex justify-center items-center text-gray-400">No revenue data available for this period.</div>
                    ) : (
                        <div className="space-y-2 flex-1">
                            {revenueTrend.map((row) => (
                                <div key={row.label} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">{row.label}</span>
                                    <span className="font-semibold text-gray-900">{Number(row.revenue || 0).toLocaleString()} ETB</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Automated Report Snapshot */}
                <div className="card p-6 min-h-[350px] flex flex-col">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Automated Report Snapshot</h2>
                    {loading ? (
                        <div className="flex-1 flex justify-center items-center">
                            <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                        </div>
                    ) : generatedReport ? (
                        <div className="space-y-2 text-sm flex-1">
                            <p><span className="text-gray-500">Generated:</span> {generatedReport.generatedAt ? new Date(generatedReport.generatedAt).toLocaleString() : 'N/A'}</p>
                            <p><span className="text-gray-500">Active Jobs:</span> <span className="font-semibold">{generatedReport.operations?.activeJobs || 0}</span></p>
                            <p><span className="text-gray-500">Completed Jobs:</span> <span className="font-semibold">{generatedReport.operations?.completedJobs || 0}</span></p>
                            <p><span className="text-gray-500">Inventory Stock Value:</span> <span className="font-semibold">{Number(generatedReport.inventory?.totalStockValue || 0).toLocaleString()} ETB</span></p>
                            <p><span className="text-gray-500">Low Stock Items:</span> <span className="font-semibold">{generatedReport.inventory?.lowStockItems?.length || 0}</span></p>
                        </div>
                    ) : (
                        <div className="flex-1 flex justify-center items-center text-gray-400 text-sm">No report data available.</div>
                    )}
                </div>
            </div>

            {/* Low Stock Warning Panel */}
            <div className={`card border-t-4 p-6 flex flex-col bg-gradient-to-b ${!garageStats.lowStockItems || garageStats.lowStockItems.length === 0 ? 'border-t-green-500 from-green-50/30' : 'border-t-red-500 from-red-50/30'} to-white`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className={!garageStats.lowStockItems || garageStats.lowStockItems.length === 0 ? 'text-green-500' : 'text-red-500'} size={20} />
                        {(!garageStats.lowStockItems || garageStats.lowStockItems.length === 0) ? t('inventoryStatus') : t('lowStockWarnings')}
                    </h2>
                    <Link to="/inventory" className={`text-sm font-semibold hover:underline ${!garageStats.lowStockItems || garageStats.lowStockItems.length === 0 ? 'text-green-600' : 'text-red-600'}`}>{t('viewInventory')}</Link>
                </div>

                <div className="">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <span className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></span>
                        </div>
                    ) : !garageStats.lowStockItems || garageStats.lowStockItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center h-24 text-green-600 opacity-70">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                <Wrench size={24} />
                            </div>
                            <p className="font-semibold text-sm">{t('inventoryHealthy')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(garageStats.lowStockItems || []).map((item, idx) => (
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
    );
}
