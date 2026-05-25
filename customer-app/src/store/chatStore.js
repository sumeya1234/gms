import { create } from 'zustand';
import api from '../api/client';

export const useChatStore = create((set, get) => ({
    messages: [],
    loading: false,
    error: null,

    fetchMessages: async (complaintId) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get(`/api/complaints/${complaintId}/messages`);
            set({ messages: response.data, loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    addMessage: (message) => {
        set((state) => ({
            messages: [...state.messages, message]
        }));
    },

    sendMessage: async (complaintId, messageText, userId) => {
        try {
            // First save to database via REST
            const response = await api.post(`/api/complaints/${complaintId}/messages`, {
                message: messageText
            });
            
            if (response.data) {
                // Return data for socket emission
                return {
                    complaintId,
                    SenderID: userId,
                    Message: messageText,
                    CreatedAt: new Date().toISOString()
                };
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            throw err;
        }
    }
}));
