import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null, // will hold the full profile including GarageID
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: true, // Used to defer rendering until auth is determined
  setAuth: (user, token) => {
    if (token) localStorage.setItem('token', token);
    set({ user, token: token || localStorage.getItem('token'), isAuthenticated: true, loading: false });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, loading: false });
  },
  fetchProfile: async () => {
    const { token } = get();
    if (!token) {
        set({ loading: false });
        return;
    }
    
    // Import API dynamically to avoid circular dependency if ever an issue
    const api = (await import('../lib/api')).default; 
    try {
        const response = await api.get('/users/profile');
        const user = response.data.user;
        set({ user, isAuthenticated: true, loading: false });
    } catch (err) {
        // Only clear auth on genuine 401 (token expired/invalid)
        // Network errors, timeouts, or server restarts should NOT force logout
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false, loading: false });
        } else {
          // Keep the user logged in, just stop loading
          console.warn('Profile fetch failed (non-auth error):', err.message);
          set({ loading: false });
        }
    }
  }
}));
