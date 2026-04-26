import { create } from 'zustand';
import client from '../api/client';

export const useVehicleStore = create((set, get) => ({
  vehicles: [],
  isLoading: false,
  error: null,

  fetchVehicles: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.get('/api/vehicles');
      set({ vehicles: response.data.vehicles || response.data, isLoading: false });
    } catch (error) {
      console.log('Fetch Vehicles Error', error?.response?.data || error);
      set({ error: error?.response?.data?.message || 'Failed to fetch vehicles', isLoading: false });
    }
  },

  addVehicle: async (vehicleData) => {
    set({ isLoading: true, error: null });
    try {
      await client.post('/api/vehicles', vehicleData);

      // Re-fetch to get the assigned DB ID and proper structure
      await get().fetchVehicles();

      return true;
    } catch (error) {
      console.log('Add Vehicle Error', error?.response?.data || error);
      set({ error: error?.response?.data?.message || 'Failed to add vehicle', isLoading: false });
      return false;
    }
  },

  deleteVehicle: async (vehicleId) => {
    set({ isLoading: true, error: null });
    try {
      await client.delete(`/vehicles/${vehicleId}`);
      set((state) => ({
        vehicles: state.vehicles.filter(v => (v.VehicleID || v.id) !== vehicleId),
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ error: error?.response?.data?.message || 'Failed to delete vehicle', isLoading: false });
      return false;
    }
  }
}));
