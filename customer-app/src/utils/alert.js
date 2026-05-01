import { useUIStore } from '../store/uiStore';


const showCustomAlert = (title, message, buttons = [], type = 'success') => {
    
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
