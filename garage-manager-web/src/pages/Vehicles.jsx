import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { 
  Car, User, Phone, Calendar, Search, ArrowRight, 
  ShieldCheck, Clock, X, ChevronRight, DollarSign,
  TrendingUp, Award, Filter, ArrowUpDown, History,
  LayoutGrid, List
} from 'lucide-react';

export default function Vehicles() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('visit'); // 'visit', 'services', 'name'
  
  // History Modal State
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user?.GarageID) {
      const fetchVehicles = async () => {
        try {
          const res = await api.get(`/garages/${user.GarageID}/vehicles`);
          setVehicles(res.data);
        } catch (err) {
          console.error("Failed to fetch vehicles:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchVehicles();
    }
  }, [user?.GarageID]);

  const fetchHistory = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setLoadingHistory(true);
    setHistory([]);
    try {
      const res = await api.get(`/garages/${user.GarageID}/vehicles/${vehicle.VehicleID}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sortedVehicles = [...vehicles]
    .filter(v => 
      v.PlateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.Model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.OwnerName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'visit') return new Date(b.LastVisit) - new Date(a.LastVisit);
      if (sortBy === 'services') return b.TotalServices - a.TotalServices;
      if (sortBy === 'name') return a.Model.localeCompare(b.Model);
      return 0;
    });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'approved': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'inprogress': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'rejected': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  // Stats calculations
  const totalVehicles = vehicles.length;
  const frequentVehicles = vehicles.filter(v => v.TotalServices > 5).length;
  const recentVisits = vehicles.filter(v => {
     const visitDate = new Date(v.LastVisit);
     const sevenDaysAgo = new Date();
     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
     return visitDate >= sevenDaysAgo;
  }).length;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="relative">
           <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
           <Car className="absolute inset-0 m-auto text-blue-600/20" size={20} />
        </div>
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">{t('loading')}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero / Header Section */}
      <section className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
         {/* Abstract background pattern */}
         <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
               <circle cx="80" cy="20" r="40" />
               <circle cx="20" cy="80" r="30" />
            </svg>
         </div>

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-500/30">
                  <Award size={14} /> {t('garageAdmin')}
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">{t('garageVehicles')}</h1>
               <p className="text-slate-400 font-medium max-w-md">{t('trackCustomerVehicles')}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto">
               <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                  <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1">{t('total')}</p>
                  <p className="text-2xl font-black">{totalVehicles}</p>
               </div>
               <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                  <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1">{t('loyal')}</p>
                  <p className="text-2xl font-black text-blue-400">{frequentVehicles}</p>
               </div>
               <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 col-span-2 sm:col-span-1">
                  <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-1">{t('newVisits')}</p>
                  <p className="text-2xl font-black text-emerald-400">{recentVisits}</p>
               </div>
            </div>
         </div>
      </section>

      {/* Filter / Search Bar */}
      <section className="flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
               type="text"
               placeholder={t('searchVehicles')}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-600/20 text-slate-700 font-medium transition-all"
            />
         </div>

         <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="bg-slate-50 p-1.5 rounded-xl flex items-center gap-1 border border-slate-100">
               <button 
                  onClick={() => setSortBy('visit')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'visit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  {t('recent')}
               </button>
               <button 
                  onClick={() => setSortBy('services')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'services' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  {t('loyalty')}
               </button>
               <button 
                  onClick={() => setSortBy('name')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'name' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  {t('name')}
               </button>
            </div>
            
            <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors border border-slate-100">
               <Filter size={20} />
            </button>
         </div>
      </section>

      {/* Grid Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedVehicles.map(vehicle => (
          <div key={vehicle.VehicleID} className="bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col overflow-hidden group">
            {/* Card Header (Plate style) */}
            <div className="px-6 pt-6 pb-4">
               <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                     <Car size={28} />
                  </div>
                  <div className="flex flex-col items-end">
                     <div className="bg-slate-900 px-3 py-1.5 rounded-lg border-2 border-slate-700 shadow-lg mb-2">
                        <span className="text-white text-xs font-black tracking-[0.2em] uppercase">{vehicle.PlateNumber}</span>
                     </div>
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{vehicle.Type || 'Passenger'}</span>
                  </div>
               </div>
               
               <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-4 group-hover:text-blue-600 transition-colors">{vehicle.Model}</h3>
            </div>

            {/* Owner Info Bar */}
            <div className="px-6 py-5 bg-slate-50 flex items-center justify-between border-y border-slate-100">
               <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 font-black text-xs">
                     {vehicle.OwnerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                     <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider leading-none mb-1">{t('owner')}</p>
                     <p className="font-bold text-slate-700 truncate text-sm">{vehicle.OwnerName}</p>
                  </div>
               </div>
               
               <a href={`tel:${vehicle.OwnerPhone}`} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <Phone size={18} />
               </a>
            </div>

            {/* Meta Info */}
            <div className="p-6 flex flex-col gap-5">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <Calendar size={16} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{t('lastVisit')}</p>
                        <p className="text-xs font-black text-slate-800">{new Date(vehicle.LastVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                     </div>
                  </div>

                  <div className="text-right">
                     <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{t('loyalty')}</p>
                     <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black border border-amber-100">
                        <TrendingUp size={12} />
                        {vehicle.TotalServices} {t('services').toUpperCase()}
                     </div>
                  </div>
               </div>

               <button
                  onClick={() => fetchHistory(vehicle)}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 font-black text-xs uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/30 transition-all active:scale-95 shadow-sm shadow-slate-200/20"
               >
                  <History size={16} />
                  {t('viewServiceHistory')}
               </button>
            </div>
          </div>
        ))}
      </section>

      {/* Empty State */}
      {sortedVehicles.length === 0 && (
        <div className="bg-white py-24 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
          <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8 relative">
            <Car size={64} />
            <div className="absolute top-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-400 shadow-lg border border-slate-100">
               <X size={16} />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{t('noVehiclesFound')}</h3>
          <p className="text-slate-400 font-medium max-w-sm px-6">{t('noVehiclesDesc')}</p>
        </div>
      )}

      {/* Advanced History Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => setSelectedVehicle(null)}></div>
          
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            {/* Modern Header */}
            <div className="p-8 md:p-10 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl"></div>
               
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 rounded-[2.5rem] bg-white shadow-xl shadow-blue-600/10 flex items-center justify-center text-blue-600 border border-slate-100 rotate-3 group-hover:rotate-0 transition-transform">
                        <Car size={40} strokeWidth={2.5} />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">{selectedVehicle.Model}</h2>
                           <span className="px-3 py-1 bg-slate-800 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">{selectedVehicle.PlateNumber}</span>
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                           {selectedVehicle.OwnerName} <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {selectedVehicle.TotalServices} {t('services')}
                        </p>
                     </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                     <div className="flex-1 md:flex-none p-4 bg-white/80 rounded-3xl border border-slate-100 shadow-sm text-center">
                        <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-1">{t('totalPayments')}</p>
                        <p className="text-xl font-black text-emerald-600">
                           {history.reduce((sum, r) => sum + Number(r.PaymentAmount || 0), 0).toLocaleString()} <span className="text-[10px] opacity-60">ETB</span>
                        </p>
                     </div>
                     <button 
                        onClick={() => setSelectedVehicle(null)}
                        className="p-4 md:p-6 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-3xl transition-colors border border-slate-100"
                     >
                        <X size={24} />
                     </button>
                  </div>
               </div>
            </div>

            {/* Feed Style History */}
            <div className="flex-1 overflow-y-auto p-8 md:p-10 bg-white">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <div className="w-12 h-12 rounded-full border-4 border-slate-50 border-t-blue-600 animate-spin"></div>
                   <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.3em] italic">{t('loadingHistory')}...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                  <History size={64} className="mx-auto text-slate-200 mb-6" />
                  <h4 className="text-xl font-black text-slate-800 mb-2">{t('noPastServicesFound')}</h4>
                  <p className="text-slate-400 text-sm font-medium">{t('noVehiclesDesc')}</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical line connecting cards */}
                  <div className="absolute left-6 top-6 bottom-0 w-1 bg-slate-50 rounded-full"></div>
                  
                  <div className="space-y-8">
                    {history.map((record) => (
                      <div key={record.RequestID} className="relative pl-20 group/item">
                        {/* Status Icon Marker */}
                        <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center z-10 transition-transform group-hover/item:scale-110 ${
                           record.Status === 'Completed' ? 'bg-emerald-500 text-white' : 
                           record.Status === 'Rejected' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                           {record.Status === 'Completed' ? <Award size={20} /> : <Clock size={20} />}
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300">
                           <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                              <div>
                                 <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-xl font-black text-slate-800 tracking-tight">{record.ServiceType}</h4>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusColor(record.Status)}`}>
                                       {record.Status}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    <Calendar size={14} />
                                    {new Date(record.RequestDate).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                 </div>
                              </div>
                              
                              <div className="flex flex-col items-end">
                                 <div className="text-2xl font-black text-slate-900 flex items-center gap-1.5">
                                    <span className="text-xs text-slate-300 mt-1 uppercase">ETB</span>
                                    {Number(record.PaymentAmount || record.EstimatedPrice || 0).toLocaleString()}
                                 </div>
                                 <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">{t('paidInFull')}</p>
                              </div>
                           </div>
                           
                           <div className="bg-slate-50/80 p-6 rounded-3xl mb-6">
                              <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                                 "{record.Description || t('noDescriptionProvided')}"
                              </p>
                           </div>

                           <div className="flex flex-wrap items-center gap-6 text-[11px] font-black uppercase tracking-widest text-slate-400">
                              <div className="flex items-center gap-2 border-r border-slate-100 pr-6">
                                 <Building2 size={16} className="text-blue-500" />
                                 <span className="text-slate-800">{record.GarageName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <ShieldCheck size={16} className="text-emerald-500" />
                                 ID: <span className="text-slate-600">#{record.RequestID}</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Actions */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center">
               <p className="text-xs font-bold text-slate-400">
                  {history.length} {t('recordsFound')}
               </p>
               <button 
                onClick={() => setSelectedVehicle(null)}
                className="px-10 py-4 bg-slate-900 text-white rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-blue-600 transition-all hover:shadow-xl hover:shadow-blue-600/20 active:scale-95"
               >
                 {t('close')}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility SVG Components
function Building2({ size, className }) {
 return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/></svg>
}
