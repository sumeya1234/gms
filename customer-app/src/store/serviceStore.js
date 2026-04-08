import { create } from 'zustand';
import client from '../api/client';

export const useServiceStore = create((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,

  fetchMyRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.get('/services/my-requests');
      set({ requests: response.data || [], isLoading: false });
    } catch (error) {
      console.log('Fetch Requests Error', error?.response?.data || error);
      set({ error: error?.response?.data?.message || 'Failed to fetch requests', isLoading: false });
    }
  },

  createRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    try {
      await client.post('/services', requestData);
      // Refresh requests silently
      await get().fetchMyRequests();
      return true;
    } catch (error) {
      console.log('Create Request Error', error?.response?.data || error);
      set({ error: error?.response?.data?.message || 'Failed to submit request', isLoading: false });
      return false;
    }
  }
}));
