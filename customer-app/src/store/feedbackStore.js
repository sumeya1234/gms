import { create } from 'zustand';
import apiClient from '../api/client';

export const useFeedbackStore = create((set, get) => ({
  garageReviews: [],
  isLoading: false,
  error: null,

  fetchGarageReviews: async (garageId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/api/reviews/garage/${garageId}`);
      if (response.data?.success) {
        set({ garageReviews: response.data.data, isLoading: false });
      } else {
        // Fallback for API structure inconsistencies
        set({ garageReviews: response.data || [], isLoading: false });
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load reviews', isLoading: false });
    }
  },

  submitReview: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/api/reviews', payload);
      // Try to re-fetch to live update the UI array if possible
      await get().fetchGarageReviews(payload.garageId);
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || err.response?.data?.message || 'Failed to submit review', isLoading: false });
      return false;
    }
  },

  submitComplaint: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/api/complaints', payload);
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || err.response?.data?.message || 'Failed to submit complaint', isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null })
}));
