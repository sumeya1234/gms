import { useUIStore } from '../store/uiStore';

/**
 * A drop-in replacement utility for Alert.alert
 * @param {string} title 
 * @param {string} message 
 * @param {Array} buttons - Array of { text, onPress, style }
 * @param {string} type - 'success' | 'info' | 'error' | 'confirm'
 */
const showCustomAlert = (title, message, buttons = [], type = 'success') => {
    // If no buttons, provide a default close button
    const finalButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];

    useUIStore.getState().showAlert({
        title,
        message,
        type: type || (title?.toLowerCase().includes('error') ? 'error' : 'success'),
        buttons: finalButtons.map(btn => ({
            ...btn,
            onPress: () => {
                useUIStore.getState().hideAlert();
                if (btn.onPress) btn.onPress();
            }
        }))
    });
};

export default showCustomAlert;
