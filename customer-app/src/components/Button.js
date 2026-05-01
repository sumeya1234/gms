import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  textStyle,
  icon,
  disabled 
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        styles[variant], 
        disabled && styles.disabled,
        style
      ]} 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && icon}
      <Text style={[
        styles.text, 
        styles[`${variant}Text`], 
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: {
    backgroundColor: colors.accentBlue,
    shadowColor: colors.accentBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  secondary: {
    backgroundColor: colors.yellowBtn,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
  },
  primaryText: {
    color: colors.white,
    ...typography.button,
  },
  secondaryText: {
    color: colors.textDark,
    ...typography.button,
  },
  outlineText: {
    color: colors.textDark,
    ...typography.button,
  },
  disabled: {
    opacity: 0.5,
  }
});

export default Button;
