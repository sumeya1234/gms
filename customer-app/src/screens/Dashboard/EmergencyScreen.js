import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { AlertTriangle, Wrench, ShieldAlert, CarFront } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useVehicleStore } from '../../store/vehicleStore';
import { useServiceStore } from '../../store/serviceStore';
import showAlert from '../../utils/alert';

export default function EmergencyScreen({ navigation, route }) {
  const { t } = useTranslation();
  const garage = route.params?.garage;
  const insets = useSafeAreaInsets();

  const { vehicles, fetchVehicles, isLoading: vehiclesLoading } = useVehicleStore();
  const { createRequest, isLoading: requestLoading } = useServiceStore();

  const [step, setStep] = React.useState(1); 
  const [emergencyType, setEmergencyType] = React.useState(null);
  const [customerStatus, setCustomerStatus] = React.useState('');
  const [selectedVehicleId, setSelectedVehicleId] = React.useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].VehicleID || vehicles[0].id);
    }
  }, [vehicles]);

  const handleSelectType = (type) => {
    setEmergencyType(type);
    setStep(2);
  };

  const handleSOS = async () => {
    if (!garage) {
      showAlert(t('Error'), t('Could not find nearby garage.'), [], 'error');
      return;
    }

    if (!selectedVehicleId) {
      showAlert(t('Error'), t('You must add a vehicle in the Vehicles tab first before requesting SOS.'), [], 'error');
      return;
    }

    const payload = {
      serviceType: emergencyType === 'tow' ? 'Towing' : 'Repair',
      vehicleId: selectedVehicleId,
      garageId: garage.id,
      description: `[SOS EMERGENCY REQUEST]\nUser requested immediate ${emergencyType === 'tow' ? 'Towing' : 'On-site Mechanic'} assistance.`,
      isEmergency: true,
      customerStatus: customerStatus
    };

    const success = await createRequest(payload);
    if (success) {
      showAlert(
        t('SOS Sent'),
        t('{{garageName}} has been notified of your emergency. Help is on the way. Please stay safe and keep your phone active.', { garageName: garage.name }),
        [{ text: t('OK'), onPress: () => navigation.navigate('Main') }]
      );
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: 16 }} />
          <Text style={styles.title}>{t('Emergency Assistance')}</Text>
          <Text style={styles.subtitle}>
            {t('Connecting you instantly to ')}
            <Text style={{ fontWeight: 'bold', color: colors.textDark }}>{garage?.name}</Text>
          </Text>
        </View>

        {step === 1 && (
          <View style={styles.content}>
            <TouchableOpacity
              style={[styles.sosButton, styles.towButton]}
              onPress={() => handleSelectType('tow')}
              disabled={requestLoading}
            >
              <CarFront size={32} color={colors.white} />
              <Text style={styles.btnText}>{t('I NEED A TOW')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sosButton, styles.fixButton]}
              onPress={() => handleSelectType('fix')}
              disabled={requestLoading}
            >
              <Wrench size={32} color={colors.white} />
              <Text style={styles.btnText}>{t('I NEED A MECHANIC HERE')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.formContainer}>
            <Text style={[styles.formLabel, { marginBottom: 8 }]}>{t('Which vehicle?')}</Text>
            <View style={{ marginBottom: 16 }}>
              {vehicles.map(v => (
                <TouchableOpacity
                  key={v.VehicleID || v.id}
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderColor: selectedVehicleId === (v.VehicleID || v.id) ? colors.primaryBlue : colors.border,
                    backgroundColor: selectedVehicleId === (v.VehicleID || v.id) ? '#eff6ff' : colors.white,
                    borderRadius: 8,
                    marginBottom: 8
                  }}
                  onPress={() => setSelectedVehicleId(v.VehicleID || v.id)}
                >
                  <Text style={{ fontWeight: 'bold', color: colors.textDark }}>{v.Brand || v.brand} {v.Model || v.model}</Text>
                  <Text style={{ color: colors.textGray }}>{v.PlateNumber || v.plateNumber}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>{t('What is your current status?')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('Example: I am stuck at the main road near the gas station...')}
              value={customerStatus}
              onChangeText={setCustomerStatus}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => setStep(3)}
            >
              <Text style={styles.submitBtnText}>{t('Next')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
              <Text style={styles.backLinkText}>{t('Go Back')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmTitle}>{t('Confirm Emergency Request')}</Text>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmLabel}>{t('Type')}: <Text style={styles.confirmValue}>{emergencyType === 'tow' ? t('Towing') : t('Repair')}</Text></Text>
              <Text style={styles.confirmLabel}>{t('Status')}: <Text style={styles.confirmValue}>{customerStatus || t('No status provided')}</Text></Text>
            </View>
            <TouchableOpacity
              style={styles.sosFinalButton}
              onPress={handleSOS}
              disabled={requestLoading}
            >
              <AlertTriangle size={24} color={colors.white} />
              <Text style={styles.sosFinalText}>{t('SEND SOS NOW')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(2)} style={styles.backLink}>
              <Text style={styles.backLinkText}>{t('Go Back')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>{t('Cancel')}</Text>
          </TouchableOpacity>
        )}

        {requestLoading && (
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#ef4444" />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff1f2', 
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
    color: '#991b1b', 
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
    backgroundColor: '#f97316', 
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
  },
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
  },
  formLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#ef4444',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  backLinkText: {
    color: colors.textGray,
    fontSize: 16,
  },
  confirmContainer: {
    paddingHorizontal: 24,
    flex: 1,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
  },
  confirmLabel: {
    fontSize: 16,
    color: colors.textGray,
    marginBottom: 8,
  },
  confirmValue: {
    color: colors.textDark,
    fontWeight: 'bold',
  },
  sosFinalButton: {
    backgroundColor: '#ef4444',
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  sosFinalText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
  }
});
