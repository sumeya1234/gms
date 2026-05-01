import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, LogOut, ChevronRight, Globe, Briefcase, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export const Layout = () => {
 const location = useLocation();
 const navigate = useNavigate();

 const { t, i18n } = useTranslation();
 const [langMenuOpen, setLangMenuOpen] = useState(false);

 useEffect(() => {
 const savedLang = localStorage.getItem('language');
 if (savedLang && i18n.language !== savedLang) {
 i18n.changeLanguage(savedLang);
 }
 }, []);

 const changeLanguage = (lng) => {
 i18n.changeLanguage(lng);
 localStorage.setItem('language', lng);
 setLangMenuOpen(false);
 };

 const navItems = [
 { path: '/', label: t('dashboard') || 'Dashboard', icon: LayoutDashboard },
 { path: '/garages', label: t('garages') || 'Garages', icon: Building2 },
 { path: '/users', label: t('users') || 'Users', icon: Users },
 { path: '/managers', label: t('managers') || 'Managers', icon: Briefcase },
 { path: '/complaints', label: t('Complaints', 'Complaints'), icon: AlertTriangle },
 ];

 const handleLogout = () => {
 localStorage.removeItem('token');
 localStorage.removeItem('role');
 navigate('/login');
 };

 return (
 <div className="flex min-h-screen bg-[#f0f2f5]">
 {}
 <aside className="h-screen w-64 fixed left-0 top-0 bg-white flex flex-col py-8 px-4 z-40 transition-all border-r border-slate-200">
 {}
 <div className="mb-10 px-2">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
 <Building2 size={24} />
 </div>
 <div>
 <h1 className="text-2xl font-black text-[#1890ff] tracking-tighter leading-none">GMS Admin</h1>
 <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">{t('superAdmin')}</p>
 </div>
 </div>
 </div>

 {}
 <nav className="flex-1 space-y-1">
 <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4 px-4">Navigation</p>
 {navItems.map(({ path, label, icon: Icon }) => {
 const isActive = location.pathname === path;
 const activeClasses = "text-white font-bold bg-[#1890ff]";
 const inactiveClasses = "text-gray-600 hover:text-gray-900 hover:bg-slate-100 font-bold";
 
 return (
 <Link
 key={path}
 to={path}
 id={`nav-${label.toLowerCase()}`}
 className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all relative ${isActive ? activeClasses : inactiveClasses}`}
 >
 <Icon size={20} />
 <span className="font-public-sans tracking-tight text-sm flex-1">{label}</span>
 {isActive && <ChevronRight size={16} className="opacity-50" />}
 </Link>
 );
 })}
 </nav>

 <div className="mt-auto">
 <button
 id="logout-btn"
 onClick={handleLogout}
 className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl transition-all text-slate-500 hover:text-error hover:bg-error/10 font-bold text-sm tracking-tight"
 >
 <LogOut size={20} />
 <span>{t('logout') || 'Sign Out'}</span>
 </button>
 </div>
 </aside>

 {}
 <main className="ml-64 min-h-screen w-[calc(100%-16rem)] flex flex-col pt-16">
 {}
 <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-30 bg-white/95 backdrop-blur-md flex justify-between items-center px-8 shadow-sm border-b border-slate-200">
 {}
 <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
 <span>GMS</span>
 <ChevronRight size={14} className="opacity-50" />
 <span className="text-slate-900 font-bold">
 {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
 </span>
 </div>

 {}
 <div className="flex items-center gap-4 relative">
 <div className="relative">
 <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="flex items-center gap-2 p-2 text-slate-500 hover:bg-slate-100 rounded transition-colors mr-2">
 <Globe size={20} />
 <span className="text-sm font-medium">{i18n.language?.toUpperCase() || 'EN'}</span>
 </button>
 {langMenuOpen && (
 <div className="absolute right-0 mt-2 py-2 w-36 bg-white rounded-lg shadow-xl border border-slate-100 z-50">
 <button onClick={() => changeLanguage('en')} className={`block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm ${i18n.language === 'en' ? 'font-bold text-blue-600' : 'text-slate-700'}`}>English</button>
 <button onClick={() => changeLanguage('am')} className={`block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm ${i18n.language === 'am' ? 'font-bold text-blue-600' : 'text-slate-700'}`}>Amharic</button>
 <button onClick={() => changeLanguage('om')} className={`block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm ${i18n.language === 'om' ? 'font-bold text-blue-600' : 'text-slate-700'}`}>Afaan Oromo</button>
 </div>
 )}
 </div>

 <div className="flex items-center gap-3 bg-slate-100 rounded-full px-4 py-1.5 border border-slate-200">
 <div className="w-6 h-6 rounded-full bg-[#1890ff] flex items-center justify-center text-white font-bold text-[10px]">SA</div>
 <span className="text-xs font-bold text-gray-900">Super Admin</span>
 </div>
 </div>
 </header>

 {}
 <div className="flex-1 p-10 bg-[#f0f2f5]">
 <Outlet />
 </div>
 </main>
 </div>
 );
};
