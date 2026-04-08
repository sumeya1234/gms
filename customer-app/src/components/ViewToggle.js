import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { List, Map } from 'lucide-react-native';
import { colors } from '../theme/colors';

export default function ViewToggle({ activeView, onViewChange }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.button, activeView === 'list' && styles.buttonActive]}
        onPress={() => onViewChange('list')}
      >
        <List size={18} color={activeView === 'list' ? colors.primaryBlue : colors.textGray} />
        <Text style={[styles.text, activeView === 'list' && styles.textActive]}>List View</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.button, activeView === 'map' && styles.buttonActive]}
        onPress={() => onViewChange('map')}
      >
        <Map size={18} color={activeView === 'map' ? colors.primaryBlue : colors.textGray} />
        <Text style={[styles.text, activeView === 'map' && styles.textActive]}>Map View</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    padding: 4,
    borderRadius: 10,
    height: 48,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    gap: 8,
  },
  buttonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textGray,
  },
  textActive: {
    color: colors.primaryBlue,
  }
});
