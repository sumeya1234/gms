import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import { useAuthStore } from './stores/authStore';

import Bookings from './pages/Bookings';
import Mechanics from './pages/Mechanics';
import Services from './pages/Services';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Feedback from './pages/Feedback';

function App() {
  const { isAuthenticated, loading, fetchProfile } = useAuthStore();

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

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/forgot-password" element={
        isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />
      } />

      {/* Protected Routes */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="mechanics" element={<Mechanics />} />
        <Route path="services" element={<Services />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
