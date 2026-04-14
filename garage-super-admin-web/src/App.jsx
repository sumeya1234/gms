import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Garages from './pages/Garages';
import Users from './pages/Users';
import Managers from './pages/Managers';
import Login from './pages/Login';
import Complaints from './pages/Complaints';

function App() {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
      >
        <Route index element={<Dashboard />} />
        <Route path="garages" element={<Garages />} />
        <Route path="users" element={<Users />} />
        <Route path="managers" element={<Managers />} />
        <Route path="complaints" element={<Complaints />} />
      </Route>
    </Routes>
  );
}

export default App;
