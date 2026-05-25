import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, Wrench } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const updateFormField = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);

    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const newFieldErrors = {};
    if (!email.trim()) {
      newFieldErrors.email = t('validationEmailInvalid');
    } else if (!email.includes('@')) {
      newFieldErrors.email = t('validationEmailInvalid');
    }

    if (!password.trim()) {
      newFieldErrors.password = t('validationPasswordRequired');
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);

    try {
      // 1. Get Token and Role
      const response = await api.post('/auth/login', { email: email.trim(), password: password.trim() });
      const { token, role } = response.data;

      if (!['GarageManager', 'GarageOwner', 'Accountant'].includes(role)) {
        setError(t('unauthorizedAccess'));
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);

      const profileResponse = await api.get('/users/profile');
      const user = profileResponse.data.user;

      if (!user.GarageID && role !== 'GarageOwner') {
        localStorage.removeItem('token');
        setError(t('noGarageAssigned'));
        setLoading(false);
        return;
      }

      setAuth(user, token);
      navigate('/');
    } catch (err) {
      localStorage.removeItem('token');
      setError(err.response?.data?.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6 relative overflow-hidden font-sans">
      { }
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-orange-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative z-10 overflow-hidden">

        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-sm border border-blue-100">
              <Wrench size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('loginPortalTitle')}</h1>
            <p className="text-slate-500 mt-2 font-medium">{t('loginPortalSub')}</p>
          </div>

          {error && <div className="text-red-600 text-sm font-bold text-center bg-red-50 border border-red-100 py-3 mx-4 rounded-xl mb-6">{error}</div>}

          <form onSubmit={handleLogin} className="flex flex-col gap-6" noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-bold text-sm text-slate-700 ml-1">{t('emailAddressLabel')} <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => updateFormField('email', e.target.value)}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border ${fieldErrors.email ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200'} bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium`}
                  placeholder="manager@example.com"
                />
              </div>
              {fieldErrors.email && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{fieldErrors.email}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-bold text-sm text-slate-700 ml-1">{t('passwordLabel')} <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => updateFormField('password', e.target.value)}
                  className={`w-full pl-11 pr-12 py-3.5 rounded-xl border ${fieldErrors.password ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200'} bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{fieldErrors.password}</p>}
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  {t('forgotPasswordLink')}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full py-4 text-base font-bold text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:bg-blue-700 hover:-translate-y-0.5 transition-all outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {t('signingInLabel')}
                </>
              ) : (t('secureSignIn'))}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
