import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { LayoutDashboard, Users, Calendar, Wrench, Menu, X, LogOut, Settings, Bell, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';

export const Layout = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
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

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('dashboard') || 'Dashboard' },
    { path: '/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/mechanics', icon: Users, label: 'Mechanics' },
    { path: '/services', icon: Wrench, label: 'Services' },
    { path: '/feedback', icon: MessageSquare, label: 'Feedback' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-[var(--color-border)] p-4 flex justify-between items-center z-10 sticky top-0">
        <h1 className="text-xl font-bold text-[var(--color-primary)]">Garage Admin</h1>
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
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[var(--color-text-main)] focus:outline-none">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`md:block w-full md:w-64 bg-white border-r border-[var(--color-border)] min-h-screen flex flex-col transition-all duration-300 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">Garage Admin</h1>
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
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--color-secondary)] relative">
        {/* Desktop Top Bar */}
        <div className="bg-white border-b border-[var(--color-border)] p-4 flex justify-end items-center sticky top-0 z-10 hidden md:flex">
          <button 
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>
        
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Notifications Slide-over */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsNotificationOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div className="flex items-center gap-2">
                <Bell className="text-blue-500" size={20} />
                <h2 className="text-lg font-bold text-gray-800">Notifications</h2>
                {unreadCount > 0 && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} new</span>}
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
