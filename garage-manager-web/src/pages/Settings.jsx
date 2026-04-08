import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { User, Lock, Building, Check, AlertCircle, Edit2, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
  const { user, fetchProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Tab 1: Profile State
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Tab 2: Security State
  const [securityData, setSecurityData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Tab 3: Garage State
  const [garageData, setGarageData] = useState({
    name: '',
    location: '',
    contact: ''
  });
  const [isEditingGarage, setIsEditingGarage] = useState(false);

  // Fetch Garage data when tab is opened
  useEffect(() => {
    if (activeTab === 'garage' && user?.GarageID && !garageData.name) {
      const fetchGarage = async () => {
        try {
          const res = await api.get(`/garages/${user.GarageID}`);
          setGarageData({
            name: res.data.Name || '',
            location: res.data.Location || '',
            contact: res.data.ContactNumber || ''
          });
        } catch (err) {
          console.error(err);
        }
      };
      fetchGarage();
    }
  }, [activeTab, user?.GarageID, garageData.name]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await api.put('/users/profile', profileData);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditingProfile(false);
      await fetchProfile(); // Refresh global user state
    } catch (err) {
      const apiError = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Failed to update profile';
      setMessage({ text: apiError, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage({ text: 'New passwords do not match!', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      await api.put('/users/password', {
        oldPassword: securityData.oldPassword,
        newPassword: securityData.newPassword
      });
      setMessage({ text: 'Password updated successfully!', type: 'success' });
      setSecurityData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const apiError = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Failed to update password';
      setMessage({ text: apiError, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGarageSubmit = async (e) => {
    e.preventDefault();
    if (!user?.GarageID) return;

    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await api.put(`/garages/${user.GarageID}`, {
        name: garageData.name,
        location: garageData.location,
        contact: garageData.contact
      });
      setMessage({ text: 'Garage details updated successfully!', type: 'success' });
      setIsEditingGarage(false);
    } catch (err) {
      const apiError = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Failed to update garage';
      setMessage({ text: apiError, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and garage preferences.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-gray-50/50 p-4 border-b md:border-b-0 md:border-r border-[var(--color-border)]">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => { setActiveTab('profile'); setMessage({ text: '', type: '' }); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'profile' 
                  ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User size={18} /> Personal Profile
            </button>
            <button
              onClick={() => { setActiveTab('security'); setMessage({ text: '', type: '' }); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'security' 
                  ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Lock size={18} /> Security & Password
            </button>
            <button
              onClick={() => { setActiveTab('garage'); setMessage({ text: '', type: '' }); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'garage' 
                  ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Building size={18} /> Garage Details
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 flex-1">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                {!isEditingProfile && (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] bg-blue-50 py-1.5 px-3 rounded-md transition-colors"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field w-full bg-gray-100 cursor-not-allowed text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className={`input-field w-full ${!isEditingProfile ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    required
                    minLength={3}
                    disabled={!isEditingProfile}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className={`input-field w-full ${!isEditingProfile ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    required
                    minLength={10}
                    disabled={!isEditingProfile}
                  />
                </div>

                {isEditingProfile && (
                  <div className="pt-4 flex gap-3">
                    <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-6">
                      {loading ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileData({ fullName: user?.fullName || '', phone: user?.phone || '' });
                      }}
                      className="px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Change Password</h2>
              <form onSubmit={handleSecuritySubmit} className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={securityData.oldPassword}
                      onChange={(e) => setSecurityData({ ...securityData, oldPassword: e.target.value })}
                      className="input-field w-full pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                      className="input-field w-full pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                      className="input-field w-full pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-8">
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Garage Details Tab */}
          {activeTab === 'garage' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h2 className="text-xl font-bold text-gray-900">Garage Public Profile</h2>
                {!isEditingGarage && (
                  <button 
                    onClick={() => setIsEditingGarage(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] bg-blue-50 py-1.5 px-3 rounded-md transition-colors"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleGarageSubmit} className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Garage Name</label>
                  <input
                    type="text"
                    value={garageData.name}
                    onChange={(e) => setGarageData({ ...garageData, name: e.target.value })}
                    className={`input-field w-full ${!isEditingGarage ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    required
                    minLength={3}
                    disabled={!isEditingGarage}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location / Address</label>
                  <input
                    type="text"
                    value={garageData.location}
                    onChange={(e) => setGarageData({ ...garageData, location: e.target.value })}
                    className={`input-field w-full ${!isEditingGarage ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    required
                    disabled={!isEditingGarage}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={garageData.contact}
                    onChange={(e) => setGarageData({ ...garageData, contact: e.target.value })}
                    className={`input-field w-full ${!isEditingGarage ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    required
                    disabled={!isEditingGarage}
                  />
                </div>

                {isEditingGarage && (
                  <div className="pt-4 flex gap-3">
                    <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-6">
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsEditingGarage(false);
                      }}
                      className="px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
