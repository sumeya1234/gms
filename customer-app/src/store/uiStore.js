import { create } from 'zustand';

export const useUIStore = create((set) => ({
    alert: {
        visible: false,
        title: '',
        message: '',
        type: 'success',
        buttons: [],
    },

    
    showAlert: (config) => set({
        alert: {
            ...config,
            visible: true,
            buttons: config.buttons || [{ text: 'OK', onPress: () => set({ alert: { visible: false } }) }]
        }
    }),

    hideAlert: () => set((state) => ({
        alert: { ...state.alert, visible: false }
    })),
}));
