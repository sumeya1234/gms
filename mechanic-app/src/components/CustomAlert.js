import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CheckCircle, Info, AlertTriangle, HelpCircle } from 'lucide-react-native';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

/**
 * A premium custom alert modal to replace the default Alert.alert
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {string} props.title - Title of the alert
 * @param {string} props.message - Body text
 * @param {string} props.type - 'success' | 'info' | 'error' | 'confirm'
 * @param {Array} props.buttons - Array of { text, onPress, style }
 */
export default function CustomAlert({
    visible,
    title,
    message,
    type = 'success',
    buttons = []
}) {
    const getIcon = () => {
        switch (type) {
            case 'info': return <Info size={48} color={colors.accent} />;
            case 'error': return <AlertTriangle size={48} color={colors.error} />;
            case 'confirm': return <HelpCircle size={48} color={colors.warning} />;
            default: return <CheckCircle size={48} color={colors.success} />;
        }
    };

    const getIconBg = () => {
        switch (type) {
            case 'info': return 'rgba(37, 99, 235, 0.1)';
            case 'error': return 'rgba(239, 68, 68, 0.1)';
            case 'confirm': return 'rgba(251, 191, 36, 0.1)';
            default: return 'rgba(16, 185, 129, 0.1)';
        }
    };

    // If no buttons provided, default to a single OK button
    const finalButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'OK', onPress: () => { } }];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={[styles.iconWrapper, { backgroundColor: getIconBg() }]}>
                        {getIcon()}
                    </View>

                    {title ? <Text style={styles.title}>{title}</Text> : null}
                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    <View style={[styles.buttonContainer, finalButtons.length > 1 && styles.buttonContainerVertical]}>
                        {finalButtons.map((btn, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.button,
                                    btn.style === 'cancel' ? styles.buttonCancel : styles.buttonPrimary,
                                    btn.style === 'destructive' && styles.buttonDestructive,
                                    finalButtons.length === 1 ? { flex: 1 } : { width: '100%', marginBottom: idx < finalButtons.length - 1 ? 12 : 0 }
                                ]}
                                onPress={btn.onPress}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.buttonText,
                                    btn.style === 'cancel' && { color: colors.textMain }
                                ]}>{btn.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: width * 0.85,
        backgroundColor: colors.surface,
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 15,
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textMain,
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonContainerVertical: {
        flexDirection: 'column',
    },
    button: {
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
    },
    buttonDestructive: {
        backgroundColor: colors.error,
    },
    buttonCancel: {
        backgroundColor: colors.surfaceLight,
    },
    buttonText: {
        color: colors.surface,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
