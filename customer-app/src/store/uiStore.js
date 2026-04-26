import { create } from 'zustand';

export const useUIStore = create((set) => ({
    alert: {
        visible: false,
        title: '',
        message: '',
        type: 'success',
        buttons: [],
    },

    /**
     * Show a custom alert
     * @param {Object} config - { title, message, type, buttons }
     */
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
