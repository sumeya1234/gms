import { create } from 'zustand';
import * as Location from 'expo-location';

export const useLocationStore = create((set) => ({
  location: null,
  address: null,
  isLoading: false,
  error: null,

  requestLocation: async () => {
    set({ isLoading: true, error: null });
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ error: 'Permission to access location was denied', isLoading: false });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      // Optionally Reverse Geocode
      let addressArray = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      let address = addressArray.length > 0 ? addressArray[0] : null;

      set({ location, address, isLoading: false });
    } catch (error) {
      set({ error: 'Could not fetch location', isLoading: false });
    }
  }
}));
