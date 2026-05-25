import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function ServiceChip({ title, isSelected, onPress, isSpecial }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        isSpecial && !isSelected && styles.containerSpecial
      ]}
    >
      <Text style={[
        styles.text,
        isSelected && styles.textSelected,
        isSpecial && !isSelected && styles.textSpecial
      ]}>
        {isSpecial ? `❓ ${title}` : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  containerSelected: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
  },
  textSelected: {
    color: colors.white,
  },
  containerSpecial: {
    backgroundColor: 'rgba(19, 127, 236, 0.1)',
    borderColor: 'rgba(19, 127, 236, 0.5)',
    borderWidth: 1.5,
  },
  textSpecial: {
    color: colors.primaryBlue,
    fontWeight: 'bold',
  }
});
