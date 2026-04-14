import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { AlertTriangle, Wrench, ShieldAlert, CarFront } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useVehicleStore } from '../../store/vehicleStore';
import { useServiceStore } from '../../store/serviceStore';

export default function EmergencyScreen({ navigation, route }) {
  const { t } = useTranslation();
  const garage = route.params?.garage;
  const insets = useSafeAreaInsets();
  
  const { vehicles, fetchVehicles, isLoading: vehiclesLoading } = useVehicleStore();
  const { createRequest, isLoading: requestLoading } = useServiceStore();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSOS = async (type) => {
    if (!garage) {
      Alert.alert(t('Error'), t('Could not find nearby garage.'));
      return;
    }
    
    if (vehicles.length === 0) {
      Alert.alert(t('Error'), t('You must add a vehicle in the Vehicles tab first before requesting SOS.'));
      return;
    }

    const primaryVehicle = vehicles[0];

    const payload = {
      serviceType: type === 'tow' ? 'Towing' : 'Repair',
      vehicleId: primaryVehicle.VehicleID || primaryVehicle.id,
      garageId: garage.id,
      description: `[SOS EMERGENCY REQUEST]\nUser requested immediate ${type === 'tow' ? 'Towing' : 'On-site Mechanic'} assistance.`,
      isEmergency: true
    };

    const success = await createRequest(payload);
    if (success) {
      Alert.alert(t('SOS Sent'), t('Emergency request sent to ') + garage.name);
      navigation.navigate('MainTabs'); 
    }
  };

  if (vehiclesLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>{t('Emergency Assistance')}</Text>
        <Text style={styles.subtitle}>
           {t('Connecting you instantly to ')} 
           <Text style={{fontWeight: 'bold', color: colors.textDark}}>{garage?.name}</Text>
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.sosButton, styles.towButton]} 
          onPress={() => handleSOS('tow')}
          disabled={requestLoading}
        >
          <CarFront size={32} color={colors.white} />
          <Text style={styles.btnText}>{t('I NEED A TOW')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sosButton, styles.fixButton]} 
          onPress={() => handleSOS('fix')}
          disabled={requestLoading}
        >
          <Wrench size={32} color={colors.white} />
          <Text style={styles.btnText}>{t('I NEED A MECHANIC HERE')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>{t('Cancel')}</Text>
      </TouchableOpacity>
      {requestLoading && (
         <View style={{...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center'}}>
           <ActivityIndicator size="large" color="#ef4444" />
         </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff1f2', // light red tinge
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#991b1b', // dark red
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#b91c1c',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    gap: 20,
    flex: 1,
  },
  sosButton: {
    height: 100,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  towButton: {
    backgroundColor: '#ef4444',
  },
  fixButton: {
    backgroundColor: '#f97316', // orange
  },
  btnText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'black',
  },
  cancelBtn: {
    padding: 20,
    alignItems: 'center',
  },
  cancelText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
