import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, LogOut, ChevronRight } from 'lucide-react';

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/',        label: 'Dashboard', icon: LayoutDashboard },
    { path: '/garages', label: 'Garages',   icon: Building2 },
    { path: '/users',   label: 'Users',     icon: Users },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Sidebar ── */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-900 flex flex-col py-8 px-4 z-40 transition-all border-r border-outline-variant/10">
        {/* Logo */}
        <div className="mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-blue-700 dark:text-blue-500 tracking-tighter leading-none">GMS Admin</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Super Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4 px-4">Navigation</p>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            const activeClasses = "text-blue-700 dark:text-blue-400 font-bold before:absolute before:left-0 before:w-1 before:h-6 before:bg-blue-600 before:rounded-full bg-slate-200/50";
            const inactiveClasses = "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 font-medium";
            
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

        {/* Footer / Logout */}
        <div className="mt-auto">
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl transition-all text-slate-500 hover:text-error hover:bg-error/10 font-bold text-sm tracking-tight"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ml-64 min-h-screen w-[calc(100%-16rem)] flex flex-col pt-16">
        {/* Top Bar */}
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex justify-between items-center px-8 shadow-sm shadow-slate-200/50 border-b border-outline-variant/10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span>GMS</span>
            <ChevronRight size={14} className="opacity-50" />
            <span className="text-slate-900 font-bold">
              {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
            </span>
          </div>

          {/* Admin Badge */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-surface-container rounded-full px-4 py-1.5 border border-outline-variant/20">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[10px]">SA</div>
              <span className="text-xs font-bold text-on-surface">Super Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-10 bg-surface">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
