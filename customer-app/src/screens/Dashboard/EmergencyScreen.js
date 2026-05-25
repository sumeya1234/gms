import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput, Image, ScrollView, Animated, Dimensions, Pressable } from 'react-native';
import { ShieldAlert, CarFront, Wrench, MoreHorizontal, ImagePlus, X, Check, AlertTriangle, Info, ShieldCheck, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useVehicleStore } from '../../store/vehicleStore';
import { useServiceStore } from '../../store/serviceStore';
import { useLocationStore } from '../../store/locationStore';
import showAlert from '../../utils/alert';

const { width } = Dimensions.get('window');

export default function EmergencyScreen({ navigation, route }) {
  const { t } = useTranslation();
  const garage = route.params?.garage;
  const insets = useSafeAreaInsets();

  const { vehicles, fetchVehicles, isLoading: vehiclesLoading } = useVehicleStore();
  const { createRequest, isLoading: requestLoading } = useServiceStore();
  const { location, address } = useLocationStore();

  const [step, setStep] = useState(1);
  const [emergencyType, setEmergencyType] = useState(null);
  const [customerStatus, setCustomerStatus] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [issueImages, setIssueImages] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  
  // SOS Progress
  const [sosHolding, setSosHolding] = useState(false);
  const sosProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].VehicleID || vehicles[0].id);
    }
  }, [vehicles]);

  const pickImage = async () => {
    if (issueImages.length >= 3) {
      showAlert(t('Limit Reached'), t('You can only upload up to 3 images.'), [], 'info');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      setIssueImages([...issueImages, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const removePhoto = (index) => {
    setIssueImages(issueImages.filter((_, i) => i !== index));
  };

  const toggleEmergencyService = (serviceName) => {
    if (selectedServices.includes(serviceName)) {
      setSelectedServices(selectedServices.filter(s => s !== serviceName));
    } else {
      setSelectedServices([...selectedServices, serviceName]);
    }
  };

  const startSosPress = () => {
    setSosHolding(true);
    Animated.timing(sosProgress, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleSOS();
      }
    });
  };

  const endSosPress = () => {
    setSosHolding(false);
    Animated.timing(sosProgress, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSOS = async () => {
    if (!garage) {
      showAlert(t('Error'), t('Could not find nearby garage.'), [], 'error');
      return;
    }
    if (!selectedVehicleId) {
      showAlert(t('Error'), t('Select a vehicle first.'), [], 'error');
      return;
    }

    let finalServiceType = 'Emergency Assistance';
    if (emergencyType === 'tow') finalServiceType = 'Towing';
    else if (emergencyType === 'fix') finalServiceType = 'Repair';
    else if (selectedServices.length > 0) finalServiceType = selectedServices.join(', ');

    const payload = {
      serviceType: finalServiceType,
      vehicleId: selectedVehicleId,
      garageId: garage.id,
      description: `[SOS EMERGENCY REQUEST]\nServices: ${selectedServices.join(', ') || 'General'}\nNote: ${customerStatus || 'No extra info'}`,
      isEmergency: true,
      latitude: location?.coords?.latitude || null,
      longitude: location?.coords?.longitude || null,
      address: address ? `${address.district || address.name || ''}, ${address.city || ''}`.replace(/^, | ,|, $/g, '') : null,
      issueImage: issueImages
    };

    const success = await createRequest(payload);
    if (success) {
      setStep(3);
    }
  };

  if (vehiclesLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 0, backgroundColor: colors.white }}>
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <View style={styles.shieldIconWrap}>
              <ShieldAlert size={20} color={colors.primaryBlue} />
            </View>
            <Text style={styles.logoText}>PRECISION GARAGE</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <X size={24} color={colors.textDark} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {step === 1 && (
            <View style={styles.mainContainer}>
              <View style={styles.headerTitleSec}>
                <Text style={styles.mainTitle}>{t('Emergency Assistance')}</Text>
                <Text style={styles.subTitle}>{t('Need help with your vehicle? Select the issue and hold the SOS button.')}</Text>
              </View>

              {/* Emergency Types */}
              <View style={styles.grid}>
                <TouchableOpacity 
                  style={[styles.typeCard, emergencyType === 'tow' && styles.typeCardActive]}
                  onPress={() => setEmergencyType(emergencyType === 'tow' ? null : 'tow')}
                >
                  <View accessible={false} style={[styles.typeIconCircle, { backgroundColor: emergencyType === 'tow' ? colors.primaryBlue : 'rgba(30,58,138,0.05)' }]}>
                    <CarFront size={28} color={emergencyType === 'tow' ? colors.white : colors.primaryBlue} />
                  </View>
                  <Text style={[styles.typeCardTitle, emergencyType === 'tow' && { color: colors.primaryBlue }]}>{t('I Need a Tow')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.typeCard, emergencyType === 'fix' && styles.typeCardActive]}
                  onPress={() => setEmergencyType(emergencyType === 'fix' ? null : 'fix')}
                >
                  <View accessible={false} style={[styles.typeIconCircle, { backgroundColor: emergencyType === 'fix' ? colors.accentBlue : 'rgba(37,99,235,0.05)' }]}>
                    <Wrench size={28} color={emergencyType === 'fix' ? colors.white : colors.accentBlue} />
                  </View>
                  <Text style={[styles.typeCardTitle, emergencyType === 'fix' && { color: colors.accentBlue }]}>{t('Repair Assistance')}</Text>
                </TouchableOpacity>
              </View>

              {/* Symptom Scroller */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('SELECT SPECIFIC ISSUE')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroller}>
                  {(() => {
                    const emergencyServices = (garage.serviceDetails || garage.Services || []).filter(s => !!s.IsEmergency);
                    return emergencyServices.map((s, idx) => {
                      const isSelected = selectedServices.includes(s.ServiceName);
                      return (
                        <TouchableOpacity 
                          key={idx} 
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() => toggleEmergencyService(s.ServiceName)}
                        >
                          {isSelected && <Check size={14} color="#FFF" style={{ marginRight: 4 }} />}
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{s.ServiceName}</Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </ScrollView>
              </View>

              {/* Vehicle Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('WHICH VEHICLE?')}</Text>
                {vehicles.map(v => (
                  <TouchableOpacity 
                    key={v.VehicleID || v.id} 
                    style={[styles.vehicleRow, selectedVehicleId === (v.VehicleID || v.id) && styles.vehicleRowActive]}
                    onPress={() => setSelectedVehicleId(v.VehicleID || v.id)}
                  >
                     <View>
                        <Text style={styles.vehicleName}>{v.Brand || v.brand} {v.Model || v.model}</Text>
                        <Text style={styles.vehiclePlate}>{v.PlateNumber || v.plateNumber}</Text>
                     </View>
                     <View style={[styles.selectCircle, selectedVehicleId === (v.VehicleID || v.id) && styles.selectCircleActive]}>
                        {selectedVehicleId === (v.VehicleID || v.id) && <View style={styles.selectDot} />}
                     </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Details Input */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('ADDITIONAL DETAILS')}</Text>
                <TextInput 
                  style={styles.textArea}
                  placeholder={t("Tell us exactly what's wrong...")}
                  placeholderTextColor={colors.textGray}
                  multiline
                  value={customerStatus}
                  onChangeText={setCustomerStatus}
                />
              </View>

              {/* Photo Evidence */}
              <View style={styles.section}>
                <View style={styles.flexRow}>
                  <Text style={styles.sectionLabel}>{t('PHOTO EVIDENCE (OPTIONAL)')}</Text>
                  <Text style={styles.photoCount}>{issueImages.length}/3</Text>
                </View>
                <View style={styles.mediaGrid}>
                  {issueImages.map((img, idx) => (
                    <View key={idx} style={styles.imageWrap}>
                      <Image source={{ uri: img }} style={styles.evidenceImage} />
                      <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(idx)}>
                        <X size={12} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {issueImages.length < 3 && (
                    <TouchableOpacity style={styles.addMediaBtn} onPress={pickImage}>
                       <ImagePlus size={24} color={colors.textGray} />
                       <Text style={styles.addMediaText}>{t('Add Photo')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.successContainer}>
              <View style={styles.successHeader}>
                <View style={styles.pulseContainer}>
                  <View style={styles.pulseCircle} />
                  <View style={styles.checkIconWrap}>
                    <ShieldCheck size={40} color="#FFF" />
                  </View>
                </View>
                <Text style={styles.successTitle}>{t('Request Sent!')}</Text>
                <Text style={styles.successSub}>{t("We've notified {{name}}. Help is being arranged.", { name: garage?.name || t('the garage') })}</Text>
              </View>

              <View style={styles.glassCard}>
                <View style={styles.etaRow}>
                   <View>
                      <Text style={styles.etaLabel}>{t('ESTIMATED ARRIVAL')}</Text>
                      <Text style={styles.etaTime}>
                        {Math.ceil(parseFloat(garage?.distance || 2) * 5) + 5} <Text style={{ fontSize: 18 }}>{t('MINS')}</Text>
                      </Text>
                   </View>
                   <View style={styles.liveTag}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>{t('GPS ACTIVE')}</Text>
                   </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.garageDetail}>
                  <Text style={styles.garageNameText}>{garage?.name}</Text>
                  <Text style={styles.garageAddressText}>{address ? `${address.city}, ${address.district}` : t('Identifying location...')}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.doneBtn}
                onPress={() => navigation.navigate('Main')}
              >
                <Text style={styles.doneBtnText}>{t('RETURN TO HOME')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SOS Button Footer */}
      {step === 1 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable 
            style={({ pressed }) => [
              styles.sosButton,
              (pressed || sosHolding) && styles.sosButtonPressed,
              { backgroundColor: colors.primaryBlue }
            ]}
            onPressIn={startSosPress}
            onPressOut={endSosPress}
          >
            <View style={styles.sosContent}>
               <AlertTriangle size={24} color="#FFF" />
               <Text style={styles.sosText}>{sosHolding ? t('HOLDING...') : t('HOLD TO SEND SOS')}</Text>
            </View>
            <Animated.View 
              style={[
                styles.sosProgressBar, 
                { 
                  width: sosProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  backgroundColor: colors.yellowBtn 
                }
              ]} 
            />
          </Pressable>
        </View>
      )}

      {requestLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgGray,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shieldIconWrap: {
    backgroundColor: 'rgba(30,58,138,0.1)',
    padding: 6,
    borderRadius: 8,
  },
  logoText: {
    color: colors.primaryBlue,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mainContainer: {
    padding: 20,
  },
  headerTitleSec: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 15,
    color: colors.textGray,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  typeCardActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: 'rgba(30,58,138,0.02)',
  },
  typeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeCardTitle: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: colors.textGray,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  chipScroller: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  chipText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vehicleRowActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: 'rgba(30,58,138,0.02)',
  },
  vehicleName: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '700',
  },
  vehiclePlate: {
    color: colors.textGray,
    fontSize: 13,
  },
  selectCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectCircleActive: {
    borderColor: colors.primaryBlue,
  },
  selectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryBlue,
  },
  textArea: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    color: colors.textDark,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoCount: {
    color: colors.primaryBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  mediaGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  imageWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 10,
  },
  addMediaBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textGray,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMediaText: {
    color: colors.textGray,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sosButton: {
    height: 70,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  sosButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  sosContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  sosText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sosProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 6,
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  pulseContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseCircle: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderRadius: 50,
  },
  checkIconWrap: {
    backgroundColor: colors.success,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    color: colors.textDark,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSub: {
    color: colors.textGray,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  glassCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  etaLabel: {
    color: colors.textGray,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  etaTime: {
    color: colors.accentBlue,
    fontSize: 40,
    fontWeight: '800',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37,99,235,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.1)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentBlue,
  },
  liveText: {
    color: colors.accentBlue,
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  garageDetail: {
    alignItems: 'center',
  },
  garageNameText: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  garageAddressText: {
    color: colors.textGray,
    fontSize: 14,
  },
  doneBtn: {
    marginTop: 40,
    width: '100%',
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  }
});
