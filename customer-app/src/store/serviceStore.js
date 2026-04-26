import { create } from 'zustand';
import client from '../api/client';

export const useServiceStore = create((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,

  fetchMyRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.get('/api/services/my-requests');
      set({ requests: response.data || [], isLoading: false });
    } catch (error) {
      console.log('Fetch Requests Error', error?.response?.data || error);
      set({ error: error?.response?.data?.message || 'Failed to fetch requests', isLoading: false });
    }
  },

  createRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    try {
      await client.post('/api/services', requestData);
      // Refresh requests silently
      await get().fetchMyRequests();
      return true;
    } catch (error) {
      console.log('Create Request Error', error?.response?.data || error);
      set({ error: error?.response?.data?.message || 'Failed to submit request', isLoading: false });
      return false;
    }
  },

  checkAvailability: async (garageId, dateString) => {
    try {
      const response = await client.get(`/api/garages/${garageId}/availability?date=${dateString}`);
      return response.data;
    } catch (error) {
      console.log('Availability Check Error', error?.response?.data || error);
      return null;
    }
  },

  cancelRequest: async (requestId) => {
    set({ isLoading: true, error: null });
    try {
      await client.post(`/api/services/${requestId}/cancel`);
      await get().fetchMyRequests();
      return true;
    } catch (error) {
      console.log('Cancel Request Error', error?.response?.data || error);
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Failed to cancel request';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  }
}));
