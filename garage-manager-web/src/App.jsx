import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import { useAuthStore } from './stores/authStore';

import Bookings from './pages/Bookings';
import Mechanics from './pages/Mechanics';
import Services from './pages/Services';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Feedback from './pages/Feedback';
import AccountantPortal from './pages/AccountantPortal';

function App() {
  const { isAuthenticated, loading, fetchProfile, user } = useAuthStore();
  const role = user?.Role || user?.role;

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-secondary)] flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <span className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>
          <p className="mt-4 text-[var(--color-text-main)] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const getDashboard = () => {
    if (role === 'GarageOwner') return <OwnerDashboard />;
    if (role === 'Accountant') return <AccountantPortal />;
    return <Dashboard />;
  };

  return (
    <Routes>
      {}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/forgot-password" element={
        isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />
      } />

      {}
      <Route
        path="/"
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}
      >
        <Route index element={getDashboard()} />

        {}
        <Route path="bookings" element={role === 'GarageManager' ? <Bookings /> : <Navigate to="/" replace />} />
        <Route path="staff" element={role === 'GarageManager' ? <Mechanics /> : <Navigate to="/" replace />} />
        <Route path="mechanics" element={<Navigate to="/staff" replace />} />
        <Route path="accountants" element={<Navigate to="/staff" replace />} />
        <Route path="services" element={role === 'GarageManager' ? <Services /> : <Navigate to="/" replace />} />
        <Route path="inventory" element={(role === 'GarageManager' || role === 'GarageOwner') ? <Inventory /> : <Navigate to="/" replace />} />
        <Route path="feedback" element={role === 'GarageManager' ? <Feedback /> : <Navigate to="/" replace />} />
        <Route path="settings" element={role !== 'GarageOwner' ? <Settings /> : <Navigate to="/" replace />} />

        {}
        <Route path="accounting" element={<Navigate to="/" replace />} />
      </Route>

      {}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
