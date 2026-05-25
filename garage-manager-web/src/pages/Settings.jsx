import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { User, Lock, Building, Check, AlertCircle, Edit2, Eye, EyeOff, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Default Icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    const addr = data.address || {};
    const parts = [
      addr.suburb || addr.neighbourhood || addr.quarter || addr.district,
      addr.city || addr.town || addr.village || addr.county
    ].filter(Boolean);
    return parts.join(', ') || data.display_name || '';
  } catch {
    return '';
  }
};

const LocationMarker = ({ latitude, longitude, setLocation, isEditing }) => {
  useMapEvents({
    click(e) {
      if (isEditing) {
        setLocation(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
      }
    },
  });

  return latitude && longitude ? (
    <Marker position={[parseFloat(latitude), parseFloat(longitude)]} />
  ) : null;
};

export default function Settings() {
  const { t } = useTranslation();
  const { user, fetchProfile } = useAuthStore();
  const role = user?.Role || user?.role;
  const canManageGarage = role === 'GarageManager';
  const [activeTab, setActiveTab] = useState('profile');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

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

  // Password Strength Logic
  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, text: '', color: 'bg-gray-200' };
    if (pwd.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score, text: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score, text: 'Medium', color: 'bg-yellow-500' };
    return { score, text: 'Strong', color: 'bg-green-500' };
  };

  const pwdStrength = getPasswordStrength(securityData.newPassword);

  // Tab 3: Garage State
  const [garageData, setGarageData] = useState({
    name: '',
    location: '',
    contact: '',
    workingHours: {
      monday: { isOpen: true, open: '08:00', close: '18:00' },
      tuesday: { isOpen: true, open: '08:00', close: '18:00' },
      wednesday: { isOpen: true, open: '08:00', close: '18:00' },
      thursday: { isOpen: true, open: '08:00', close: '18:00' },
      friday: { isOpen: true, open: '08:00', close: '18:00' },
      saturday: { isOpen: true, open: '09:00', close: '14:00' },
      sunday: { isOpen: false, open: null, close: null }
    },
    emergencyDepositPercentage: 10,
    emergencyMechanicSlots: 1,
    images: [],
    logoUrl: '',
    latitude: '',
    longitude: ''
  });
  const [isEditingGarage, setIsEditingGarage] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);


  useEffect(() => {
    if (activeTab === 'garage' && user?.GarageID && !garageData.name) {
      const fetchGarage = async () => {
        try {
          const [garageRes, servicesRes, inventoryRes] = await Promise.all([
            api.get(`/garages/${user.GarageID}`),
            api.get(`/catalog/${user.GarageID}`),
            api.get(`/inventory/${user.GarageID}`)
          ]);

          setGarageData({
            name: garageRes.data.Name || '',
            location: garageRes.data.Location || '',
            contact: garageRes.data.ContactNumber || '',
            workingHours: typeof garageRes.data.WorkingHours === 'string'
              ? JSON.parse(garageRes.data.WorkingHours)
              : (garageRes.data.WorkingHours || garageData.workingHours),
            emergencyDepositPercentage: garageRes.data.EmergencyDepositPercentage || 10,
            emergencyMechanicSlots: garageRes.data.EmergencyMechanicSlots ?? 1,
            images: typeof garageRes.data.Images === 'string' ? JSON.parse(garageRes.data.Images) : (garageRes.data.Images || []),
            logoUrl: garageRes.data.LogoUrl || '',
            latitude: garageRes.data.Latitude || '',
            longitude: garageRes.data.Longitude || '',
            status: garageRes.data.Status || 'Inactive'
          });
          setServices(servicesRes.data || []);
          setInventory(inventoryRes.data?.data || inventoryRes.data || []);
        } catch (err) {
          console.error(err);
        }
      };
      fetchGarage();
    }
  }, [activeTab, user?.GarageID]);

  useEffect(() => {
    if (!canManageGarage && activeTab === 'garage') {
      setActiveTab('profile');
    }
  }, [canManageGarage, activeTab]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!profileData.phone.trim() || !/^(09|07)[0-9]{8}$/.test(profileData.phone)) {
      setMessage({ text: t('invalidPhone'), type: 'error' });
      setLoading(false);
      return;
    }

    try {
      await api.put('/users/profile', profileData);
      setMessage({ text: t('profileUpdated'), type: 'success' });
      setIsEditingProfile(false);
      await fetchProfile();
    } catch (err) {
      const apiError = err.response?.data?.errors?.join(', ') || err.response?.data?.message || err.response?.data?.error || t('failedToUpdateProfile');
      setMessage({ text: apiError, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (securityData.newPassword === securityData.oldPassword) {
      setMessage({ text: t('newPasswordMustBeDifferent'), type: 'error' });
      setLoading(false);
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage({ text: t('passwordsDoNotMatch'), type: 'error' });
      setLoading(false);
      return;
    }

    try {
      await api.put('/users/password', {
        oldPassword: securityData.oldPassword,
        newPassword: securityData.newPassword
      });
      setMessage({ text: t('passwordUpdated'), type: 'success' });
      setSecurityData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const apiError = err.response?.data?.errors?.join(', ') || err.response?.data?.message || err.response?.data?.error || t('failedToUpdatePassword');
      setMessage({ text: apiError, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          const resolvedAddress = await reverseGeocode(lat, lng);
          setGarageData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            ...(resolvedAddress ? { location: resolvedAddress } : {})
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          setMessage({ text: "Failed to get location. Please allow location access in your browser.", type: 'error' });
        }
      );
    } else {
      setMessage({ text: "Geolocation is not supported by your browser.", type: 'error' });
    }
  };

  const handleGarageSubmit = async (e) => {
    e.preventDefault();
    if (!user?.GarageID) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    const rawSlots = garageData.emergencyMechanicSlots;
    if (rawSlots === '' || rawSlots === null || rawSlots === undefined || isNaN(Number(rawSlots)) || !Number.isInteger(Number(rawSlots))) {
      setSlotsError(t('slotsErrorNotANumber'));
      setLoading(false);
      return;
    }
    const parsedSlots = parseInt(rawSlots, 10);
    if (parsedSlots < 1) {
      setSlotsError(t('slotsErrorMinOne'));
      setLoading(false);
      return;
    }
    if (parsedSlots > 50) {
      setSlotsError(t('slotsErrorMaxFifty'));
      setLoading(false);
      return;
    }
    setSlotsError('');

    try {
      await api.put(`/garages/${user.GarageID}`, {
        name: garageData.name,
        location: garageData.location,
        contact: garageData.contact,
        workingHours: garageData.workingHours,
        emergencyDepositPercentage: parseFloat(garageData.emergencyDepositPercentage),
        emergencyMechanicSlots: parseInt(garageData.emergencyMechanicSlots, 10),
        images: garageData.images,
        logoUrl: garageData.logoUrl,
        latitude: garageData.latitude ? parseFloat(garageData.latitude) : null,
        longitude: garageData.longitude ? parseFloat(garageData.longitude) : null
      });
      setMessage({ text: t('garageUpdated'), type: 'success' });
      setIsEditingGarage(false);

      // Re-fetch data to ensure UI is in sync and matches backend names
      const [garageRes, servicesRes, inventoryRes] = await Promise.all([
        api.get(`/garages/${user.GarageID}`),
        api.get(`/catalog/${user.GarageID}`),
        api.get(`/inventory/${user.GarageID}`)
      ]);

      setGarageData({
        name: garageRes.data.Name || '',
        location: garageRes.data.Location || '',
        contact: garageRes.data.ContactNumber || '',
        workingHours: typeof garageRes.data.WorkingHours === 'string'
          ? JSON.parse(garageRes.data.WorkingHours)
          : (garageRes.data.WorkingHours || garageData.workingHours),
        emergencyDepositPercentage: garageRes.data.EmergencyDepositPercentage || 10,
        emergencyMechanicSlots: garageRes.data.EmergencyMechanicSlots ?? 1,
        images: typeof garageRes.data.Images === 'string' ? JSON.parse(garageRes.data.Images) : (garageRes.data.Images || []),
        logoUrl: garageRes.data.LogoUrl || '',
        latitude: garageRes.data.Latitude || '',
        longitude: garageRes.data.Longitude || '',
        status: garageRes.data.Status || 'Inactive'
      });
      setServices(servicesRes.data || []);
      setInventory(inventoryRes.data?.data || inventoryRes.data || []);
    } catch (err) {
      const apiError = err.response?.data?.errors?.join(', ') || err.response?.data?.message || err.response?.data?.error || t('failedToUpdateGarage');
      // If the error is specifically about mechanic slots, show it below the input field
      const apiErrorLower = apiError.toLowerCase();
      if (apiErrorLower.includes('emergency mechanic slots') || apiErrorLower.includes('emergency slots') || apiErrorLower.includes('mechanic slots')) {
        setSlotsError(apiError);
      } else {
        setMessage({ text: apiError, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!user?.GarageID) return;

    if (services.length === 0 || inventory.length === 0) {
      setMessage({ text: t('notEnoughInfoToPublish'), type: 'error' });
      return;
    }

    if (!window.confirm(t('publishGarageConfirm'))) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await api.put(`/garages/${user.GarageID}`, { status: 'Active' });
      setGarageData(prev => ({ ...prev, status: 'Active' }));
      setMessage({ text: t('garagePublishedSuccess'), type: 'success' });
    } catch (err) {
      const apiError = err.response?.data?.message || t('failedToUpdateGarage');
      setMessage({ text: apiError, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-primary)]">{t('settingsPageTitle')}</h1>
        <p className="text-gray-500 mt-1">
          {canManageGarage ? t('manageAccountGarage') : t('manageAccountOnly')}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden flex flex-col md:flex-row">

        { }
        <div className="w-full md:w-64 bg-gray-50/50 p-4 border-b md:border-b-0 md:border-r border-[var(--color-border)]">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => { setActiveTab('profile'); setMessage({ text: '', type: '' }); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'profile'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <User size={18} /> {t('tabProfile')}
            </button>
            <button
              onClick={() => { setActiveTab('security'); setMessage({ text: '', type: '' }); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'security'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Lock size={18} /> {t('tabSecurity')}
            </button>
            {canManageGarage && (
              <button
                onClick={() => { setActiveTab('garage'); setMessage({ text: '', type: '' }); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'garage'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Building size={18} /> {t('tabGarage')}
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 flex-1">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
              {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h2 className="text-xl font-bold text-gray-900">{t('personalInformation')}</h2>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] bg-blue-50 py-1.5 px-3 rounded-md transition-colors"
                  >
                    <Edit2 size={14} /> {t('editBtn')}
                  </button>
                )}
              </div>
              <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('emailAddress')}</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field w-full bg-gray-100 cursor-not-allowed text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('emailCannotChange')}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('fullName')}</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('phone')}</label>
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
                      {loading ? t('savingLabel') : t('saveProfileChanges')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileData({ fullName: user?.fullName || '', phone: user?.phone || '' });
                      }}
                      className="px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">{t('changePassword')}</h2>
              <form onSubmit={handleSecuritySubmit} className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('currentPassword')}</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('newPassword')}</label>
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
                  {securityData.newPassword && (
                    <div className="mt-2 mb-1 space-y-1 animate-in fade-in">
                      <div className="flex h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pwdStrength.color} transition-all duration-300`}
                          style={{ width: `${(pwdStrength.score / 3) * 100}%` }}
                        ></div>
                      </div>
                      <p className={`text-xs font-semibold ${pwdStrength.score <= 1 ? 'text-red-600' : pwdStrength.score === 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                        Password is {pwdStrength.text}.
                        {pwdStrength.score < 3 && ' Must use 8+ chars and a mix of letters, numbers & special characters (@$!%*?&-).'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('confirmNewPassword')}</label>
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
                    {loading ? t('updatingPassword') : t('updatePassword')}
                  </button>
                </div>
              </form>
            </div>
          )}

          { }
          {canManageGarage && activeTab === 'garage' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{t('status')}:
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs uppercase ${garageData.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {t(garageData.status === 'Active' ? 'activeStatus' : 'inactiveStatus')}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {garageData.status === 'Active'
                      ? 'Your garage is live and visible to customers.'
                      : 'Your garage is hidden. Complete setup and publish to go live.'}
                  </p>
                </div>
                {garageData.status === 'Inactive' && (
                  <button
                    onClick={handlePublish}
                    disabled={loading}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? t('savingLabel') : t('publishGarage')}
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h2 className="text-xl font-bold text-gray-900">{t('garagePublicProfile')}</h2>
                {!isEditingGarage && (
                  <button
                    onClick={() => setIsEditingGarage(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] bg-blue-50 py-1.5 px-3 rounded-md transition-colors"
                  >
                    <Edit2 size={14} /> {t('editBtn')}
                  </button>
                )}
              </div>
              <form onSubmit={handleGarageSubmit} className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('garageNameLabel')}</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('locationAddress')}</label>
                  <input
                    type="text"
                    value={garageData.location}
                    onChange={(e) => setGarageData({ ...garageData, location: e.target.value })}
                    className={`input-field w-full ${!isEditingGarage ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    required
                    disabled={!isEditingGarage}
                  />
                </div>

                {/* Map Picker UI */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {isEditingGarage ? "Click on the map to pin your garage location" : "Garage Location on Map"}
                  </label>
                  <div className="h-64 rounded-lg overflow-hidden border border-gray-300 relative z-0">
                    <MapContainer
                      center={garageData.latitude && garageData.longitude ? [parseFloat(garageData.latitude), parseFloat(garageData.longitude)] : [9.0123, 38.7654]}
                      zoom={13}
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker 
                        latitude={garageData.latitude} 
                        longitude={garageData.longitude} 
                        isEditing={isEditingGarage}
                        setLocation={async (lat, lng) => {
                          const resolvedAddress = await reverseGeocode(lat, lng);
                          setGarageData(prev => ({ 
                            ...prev, 
                            latitude: lat, 
                            longitude: lng,
                            ...(resolvedAddress ? { location: resolvedAddress } : {})
                          }));
                        }}
                      />
                    </MapContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('latitude')}</label>
                    <input
                      type="number"
                      step="any"
                      value={garageData.latitude}
                      onChange={(e) => setGarageData({ ...garageData, latitude: e.target.value })}
                      className={`input-field w-full ${!isEditingGarage ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="e.g. 9.0123"
                      disabled={!isEditingGarage}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('longitude')}</label>
                    <input
                      type="number"
                      step="any"
                      value={garageData.longitude}
                      onChange={(e) => setGarageData({ ...garageData, longitude: e.target.value })}
                      className={`input-field w-full ${!isEditingGarage ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      placeholder="e.g. 38.7654"
                      disabled={!isEditingGarage}
                    />
                  </div>
                </div>

                {isEditingGarage && (
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                  >
                    <span className="text-lg">📍</span> {t('getLocation')}
                  </button>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('contactNumber')}</label>
                  <input
                    type="tel"
                    value={garageData.contact}
                    onChange={(e) => setGarageData({ ...garageData, contact: e.target.value })}
                    className={`input-field w-full ${!isEditingGarage ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    required
                    disabled={!isEditingGarage}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('emergencyDepositPct')}</label>
                  <input
                    type="number"
                    value={garageData.emergencyDepositPercentage}
                    onChange={(e) => setGarageData({ ...garageData, emergencyDepositPercentage: e.target.value })}
                    className={`input-field w-full ${!isEditingGarage ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    disabled={!isEditingGarage}
                  />
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tight">{t('emergencyDepositNote')}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('emergencyMechanicSlots')}</label>
                  <input
                    type="number"
                    value={garageData.emergencyMechanicSlots}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGarageData({ ...garageData, emergencyMechanicSlots: val });
                      if (val === '' || isNaN(Number(val)) || !Number.isInteger(Number(val))) {
                        setSlotsError(t('slotsErrorNotANumber'));
                      } else if (parseInt(val, 10) < 1) {
                        setSlotsError(t('slotsErrorMinOne'));
                      } else if (parseInt(val, 10) > 50) {
                        setSlotsError(t('slotsErrorMaxFifty'));
                      } else {
                        setSlotsError('');
                      }
                    }}
                    className={`input-field w-full ${
                      !isEditingGarage ? 'bg-gray-50 cursor-not-allowed' : slotsError ? 'border-red-500 focus:ring-red-300' : ''
                    }`}
                    min="1"
                    step="1"
                    required
                    disabled={!isEditingGarage}
                  />
                  {slotsError && isEditingGarage && (
                    <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                      {slotsError}
                    </p>
                  )}
                  {!slotsError && <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tight">{t('emergencySlotsNote')}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="text"
                    value={garageData.logoUrl}
                    onChange={(e) => setGarageData({ ...garageData, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className={`input-field w-full ${!isEditingGarage ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    disabled={!isEditingGarage}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-gray-700">Garage Images (URLs)</label>
                    {isEditingGarage && (
                      <button
                        type="button"
                        onClick={() => setGarageData({ ...garageData, images: [...garageData.images, ''] })}
                        className="text-xs font-bold text-[var(--color-primary)] hover:underline"
                      >
                        + Add Image URL
                      </button>
                    )}
                  </div>
                  {garageData.images.map((url, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => {
                          const newImgs = [...garageData.images];
                          newImgs[idx] = e.target.value;
                          setGarageData({ ...garageData, images: newImgs });
                        }}
                        placeholder="https://example.com/image.jpg"
                        className={`input-field flex-1 ${!isEditingGarage ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        disabled={!isEditingGarage}
                      />
                      {isEditingGarage && (
                        <button
                          type="button"
                          onClick={() => {
                            const newImgs = garageData.images.filter((_, i) => i !== idx);
                            setGarageData({ ...garageData, images: newImgs });
                          }}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {garageData.images.length === 0 && (
                    <p className="text-xs text-gray-500 italic">No images added yet.</p>
                  )}
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('workingHoursLabel')}</label>
                  <div className="space-y-2">
                    {Object.entries(garageData.workingHours || {}).map(([dayKey, day]) => (
                      <div key={dayKey} className="grid grid-cols-4 gap-2 items-center">
                        <span className="text-sm font-medium text-gray-600 capitalize">{dayKey}</span>
                        <label className="text-xs text-gray-500 flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={!!day.isOpen}
                            disabled={!isEditingGarage}
                            onChange={(e) => setGarageData(prev => ({
                              ...prev,
                              workingHours: {
                                ...prev.workingHours,
                                [dayKey]: {
                                  ...prev.workingHours[dayKey],
                                  isOpen: e.target.checked,
                                  open: e.target.checked ? (prev.workingHours[dayKey].open || '08:00') : null,
                                  close: e.target.checked ? (prev.workingHours[dayKey].close || '18:00') : null
                                }
                              }
                            }))}
                          />
                          Open
                        </label>
                        <input
                          type="time"
                          value={day.open || ''}
                          disabled={!isEditingGarage || !day.isOpen}
                          onChange={(e) => setGarageData(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              [dayKey]: { ...prev.workingHours[dayKey], open: e.target.value }
                            }
                          }))}
                          className="input-field w-full text-sm"
                        />
                        <input
                          type="time"
                          value={day.close || ''}
                          disabled={!isEditingGarage || !day.isOpen}
                          onChange={(e) => setGarageData(prev => ({
                            ...prev,
                            workingHours: {
                              ...prev.workingHours,
                              [dayKey]: { ...prev.workingHours[dayKey], close: e.target.value }
                            }
                          }))}
                          className="input-field w-full text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {isEditingGarage && (
                  <div className="pt-4 flex gap-3">
                    <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-6">
                      {loading ? t('savingLabel') : t('saveChangesBtn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingGarage(false);
                      }}
                      className="px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div >
    </div >
  );
}
