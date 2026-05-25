import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * A floating hint (tooltip) component to guide users.
 * @param {Object} props
 * @param {boolean} props.visible - Whether the hint is visible.
 * @param {string} props.message - The message to display.
 * @param {Object} props.position - { top, bottom, left, right }
 * @param {string} props.arrowPosition - 'top', 'bottom', 'left', 'right'
 * @param {Function} props.onDismiss - Callback when dismissed.
 */
export default function FloatingHint({
    visible,
    message,
    position = {},
    arrowPosition = 'bottom',
    onDismiss
}) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(10)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            slideAnim.setValue(10);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                position,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={styles.bubble}>
                <Text style={styles.text}>{message}</Text>
                <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
                    <Text style={styles.dismissText}>Got it</Text>
                </TouchableOpacity>
            </View>

            {/* Arrow */}
            <View
                style={[
                    styles.arrow,
                    styles[`arrow${arrowPosition.charAt(0).toUpperCase() + arrowPosition.slice(1)}`]
                ]}
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 1000,
        width: 220,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    bubble: {
        backgroundColor: colors.primaryBlue,
        borderRadius: 12,
        padding: 12,
        position: 'relative',
    },
    text: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        marginBottom: 8,
    },
    dismissBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'flex-end',
    },
    dismissText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    arrow: {
        position: 'absolute',
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: colors.primaryBlue,
    },
    arrowBottom: {
        bottom: -10,
        alignSelf: 'center',
        transform: [{ rotate: '180deg' }],
    },
    arrowTop: {
        top: -10,
        alignSelf: 'center',
    },
    arrowLeft: {
        left: -15,
        top: '50%',
        marginTop: -5,
        transform: [{ rotate: '-90deg' }],
    },
    arrowRight: {
        right: -15,
        top: '50%',
        marginTop: -5,
        transform: [{ rotate: '90deg' }],
    },
});
