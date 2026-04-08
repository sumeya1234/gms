import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors } from '../theme/colors';

export default function JobCard({ job, onPress }) {
  const isOngoing = job.status === 'in-progress' || job.status === 'pending';
  
  // Basic pulse effect for active job (analogous to the css animation)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOngoing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isOngoing]);

  const vehicleName = job.vehicleId?.brand ? `${job.vehicleId.brand} ${job.vehicleId.model}` : 'Unknown Vehicle';
  const plate = job.vehicleId?.plateNumber || 'N/A';
  
  // Format services
  const servicesText = job.services && job.services.length > 0
    ? job.services.map(s => s.name).join(', ')
    : 'General Check';
    
  // Time mock/estimation mapping
  let statusText = job.status === 'pending' ? 'Waiting' : 'In Service';
  if (!isOngoing) statusText = job.status.toUpperCase();

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLogo}>
          <Text style={styles.logoText}>{vehicleName.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.cardPlate}>{plate}</Text>
          <Text style={styles.cardModel}>{vehicleName}</Text>
        </View>
      </View>
      
      <View style={styles.cardServices}>
        <Text style={styles.serviceText} numberOfLines={1}>{servicesText}</Text>
      </View>
      
      <View style={styles.actionRow}>
        {isOngoing ? (
          <Animated.View style={[styles.timer, { opacity: pulseAnim }]}>
            <Clock size={12} color="#4ade80" />
            <Text style={styles.timerText}>{statusText}</Text>
          </Animated.View>
        ) : (
          <View style={[styles.timer, { backgroundColor: '#374151' }]}>
            <Text style={styles.timerText}>{statusText}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    marginBottom: 15, // for vertical layout as well
    width: 280, // for horizontal list
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardLogo: {
    width: 30,
    height: 30,
    backgroundColor: '#eee',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  cardPlate: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.textDark,
  },
  cardModel: {
    fontSize: 12,
    color: colors.textGray,
  },
  cardServices: {
    backgroundColor: '#eff6ff',
    padding: 6,
    borderRadius: 5,
    marginBottom: 10,
  },
  serviceText: {
    color: colors.accentBlue,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timer: {
    backgroundColor: '#111',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});
