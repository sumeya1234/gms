import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { LayoutDashboard, Users, Calendar, Wrench, Menu, X, LogOut, Settings, Bell, MessageSquare, Package, Globe, Building2, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';

export const Layout = () => {
  const { isAuthenticated, logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    setLangMenuOpen(false);
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  
  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang && i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/users/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
    const interval = setInterval(() => {
      if (isAuthenticated) fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/users/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.NotificationID === id ? { ...n, IsRead: 1 } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.IsRead).length;

  const role = user?.Role || user?.role;
  const roleTitle = role === 'GarageOwner' ? 'GMS Owner' : role === 'Accountant' ? 'GMS Accountant' : 'GMS Manager';
  const navItemsByRole = {
    GarageManager: [
      { path: '/', icon: LayoutDashboard, label: t('dashboard') },
      { path: '/bookings', icon: Calendar, label: t('bookings') },
      { path: '/staff', icon: Users, label: 'Staff' },
      { path: '/services', icon: Wrench, label: t('services') },
      { path: '/inventory', icon: Package, label: t('inventory') },
      { path: '/feedback', icon: MessageSquare, label: t('feedback') },
      { path: '/settings', icon: Settings, label: t('settings') },
    ],
    GarageOwner: [
      { path: '/', icon: FileText, label: 'Reports' },
      { path: '/inventory', icon: Package, label: t('inventory') },
    ],
    Accountant: [
      { path: '/', icon: LayoutDashboard, label: 'Accounting' },
      { path: '/settings', icon: Settings, label: t('settings') },
    ]
  };
  const navItems = navItemsByRole[role] || navItemsByRole.GarageManager;

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      {}
      <div className="md:hidden bg-white border-b border-[var(--color-border)] p-4 flex justify-between items-center z-20 fixed top-0 left-0 w-full h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Building2 size={18} />
          </div>
          <h1 className="text-lg font-black text-[#1890ff] tracking-tighter leading-none">{roleTitle}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-1 text-gray-500"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          <div className="relative">
            <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="p-1 text-gray-500">
              <Globe size={20} />
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 py-2 w-32 bg-white rounded shadow-xl border z-50">
                <button onClick={() => changeLanguage('en')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">English</button>
                <button onClick={() => changeLanguage('am')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Amharic</button>
                <button onClick={() => changeLanguage('om')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Afaan Oromo</button>
              </div>
            )}
          </div>

          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[var(--color-text-main)] focus:outline-none">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <aside className={`fixed top-0 left-0 h-screen bg-white border-r border-[var(--color-border)] flex flex-col transition-all duration-300 z-40 ${sidebarOpen ? 'w-full block' : 'w-64 hidden md:block'}`}>
        <div className="mb-8 px-6 hidden md:block mt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1890ff] tracking-tighter leading-none">{roleTitle}</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1 truncate max-w-[140px]" title={user?.GarageName || t('garageAdmin')}>
                {user?.GarageName || t('garageAdmin')}
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 mt-4 md:mt-0 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-main)] hover:bg-[var(--color-secondary)]'}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--color-border)]">
          <button
            onClick={logout}
            className="flex items-center space-x-3 p-3 w-full rounded-lg text-[var(--color-error)] hover:bg-[#fff1f0] transition-colors focus:outline-none"
          >
            <LogOut size={20} />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {}
      <main className="min-h-screen bg-[var(--color-secondary)] md:ml-64 flex flex-col pt-16">
        {}
        <div className="bg-white border-b border-[var(--color-border)] p-4 justify-end items-center hidden md:flex fixed top-0 right-0 left-0 md:left-64 h-16 z-20 shadow-sm">
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors mr-2"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          <div className="relative">
            <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="flex items-center gap-2 p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors">
              <Globe size={20} />
              <span className="text-sm font-medium">{i18n.language?.toUpperCase() || 'EN'}</span>
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 py-2 w-36 bg-white rounded-lg shadow-xl border z-50">
                <button onClick={() => changeLanguage('en')} className={`block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${i18n.language === 'en' ? 'font-bold text-[var(--color-primary)]' : ''}`}>English</button>
                <button onClick={() => changeLanguage('am')} className={`block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${i18n.language === 'am' ? 'font-bold text-[var(--color-primary)]' : ''}`}>Amharic</button>
                <button onClick={() => changeLanguage('om')} className={`block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${i18n.language === 'om' ? 'font-bold text-[var(--color-primary)]' : ''}`}>Afaan Oromo</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsNotificationOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div className="flex items-center gap-2">
                <Bell className="text-blue-500" size={20} />
                <h2 className="text-lg font-bold text-gray-800">{t('notifications')}</h2>
                {unreadCount > 0 && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
              </div>
              <button
                onClick={() => setIsNotificationOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Bell size={40} className="mx-auto mb-3 opacity-20" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map(note => (
                    <div
                      key={note.NotificationID}
                      className={`p-4 rounded-lg cursor-pointer transition-colors border ${!note.IsRead ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50' : 'bg-white border-transparent hover:bg-gray-50'}`}
                      onClick={() => !note.IsRead && markAsRead(note.NotificationID)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm ${!note.IsRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{note.Title}</h4>
                        {!note.IsRead && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>}
                      </div>
                      <p className={`text-sm ${!note.IsRead ? 'text-gray-700' : 'text-gray-500'}`}>{note.Message}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(note.CreatedAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
