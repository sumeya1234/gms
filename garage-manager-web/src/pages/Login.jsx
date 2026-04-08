import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Get Token and Role
      const response = await api.post('/auth/login', { email, password });
      const { token, role } = response.data;

      if (role !== 'GarageManager') {
        setError('Unauthorized access. Only Garage Managers can login here.');
        setLoading(false);
        return;
      }

      // Store token first so interceptor works for the profile fetch
      localStorage.setItem('token', token);

      // 2. Get User Profile
      const profileResponse = await api.get('/users/profile');
      const user = profileResponse.data.user;

      if (!user.GarageID) {
        localStorage.removeItem('token');
        setError('No garage assigned to your account. Please contact the administrator.');
        setLoading(false);
        return;
      }

      // 3. Save to global state
      setAuth(user, token);
      navigate('/');
    } catch (err) {
      localStorage.removeItem('token'); // Clean up on error
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">Garage Manager</h1>
          <p className="text-[var(--color-text-light)] mt-2">Sign in to manage your garage.</p>
        </div>

        {error && (
          <div className="bg-[var(--color-error)]/10 border-l-4 border-[var(--color-error)] text-[var(--color-error)] p-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="manager@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex justify-center items-center py-2.5"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              t('login') || 'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
