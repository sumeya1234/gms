import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, Check, Wrench, Flag, CarFront, ChevronDown, Camera, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import { useVehicleStore } from '../../store/vehicleStore';
import { useServiceStore } from '../../store/serviceStore';
import ServiceChip from '../../components/ServiceChip';
import Skeleton from '../../components/Skeleton';

const SERVICE_CATEGORIES = ['Towing', 'Diagnostics', 'Tires', 'Oil Change', 'Repair', 'Battery', 'Electrical'];

export default function ServiceRequestScreen({ navigation, route }) {
  const { t } = useTranslation();
  const garage = route.params?.garage || null;
  const defaultServices = route.params?.defaultServices || [];

  const { vehicles, fetchVehicles, isLoading: vehiclesLoading } = useVehicleStore();
  const { createRequest, isLoading: requestLoading } = useServiceStore();

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [selectedServices, setSelectedServices] = useState(defaultServices.length > 0 ? defaultServices : ['Repair']);
  const [description, setDescription] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles]);

  const toggleService = (cat) => {
    if (selectedServices.includes(cat)) {
      if (selectedServices.length === 1) return; // Must have at least one service!
      setSelectedServices(selectedServices.filter(c => c !== cat));
    } else {
      setSelectedServices([...selectedServices, cat]);
    }
  };

  const handleSubmit = async () => {
    if (!garage || !garage.id) {
      Alert.alert(t('Error'), t('Garage details missing. Please select a garage from the Home tab.'));
      return;
    }
    if (!selectedVehicle) {
      Alert.alert(t('Error'), t('Please select or add a vehicle first.'));
      return;
    }
    if (selectedServices.length === 0) {
      Alert.alert(t('Error'), t('Please select at least one service to request.'));
      return;
    }

    // Embed preferred time into description
    let finalDescription = description.trim();
    if (preferredTime.trim().length > 0) {
       finalDescription += `\n[Preferred Drop-off: ${preferredTime}]`;
    }

    const payload = {
      serviceType: selectedServices.join(', '),
      vehicleId: selectedVehicle.VehicleID || selectedVehicle.id,
      garageId: garage.id,
      description: finalDescription,
      isEmergency
    };

    const success = await createRequest(payload);
    if (success) {
      Alert.alert(t('Request Sent', 'Request Sent'), t('Your service request was submitted successfully.', 'Your service request was submitted successfully.'));
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Service Request', 'Service Request')}</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headline}>
          <Text style={styles.title}>{t('How can we help?', 'How can we help?')}</Text>
          <Text style={styles.subtitle}>{t('Send a direct request to', 'Send a direct request to')} {garage ? garage.name : 'Unknown Garage'}</Text>
        </View>

        {/* Stepper Mock (Visual element matching the HTML) */}
        <View style={styles.trackerCard}>
           <View style={styles.trackerHeader}>
             <Text style={styles.trackerTitle}>{t('Request Pipeline', 'Request Pipeline')}</Text>
             <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{t('Filling Form', 'Filling Form')}</Text>
             </View>
           </View>
           
           <View style={styles.stepperWrap}>
              <View style={styles.stepperLine} />
              <View style={styles.step}>
                 <View style={[styles.stepCircle, styles.stepActive]}>
                    <Check size={16} color={colors.white} />
                 </View>
                 <Text style={styles.stepText}>{t('Draft', 'Draft')}</Text>
              </View>
              <View style={styles.step}>
                 <View style={[styles.stepCircle, styles.stepInactive]}>
                    <ChevronDown size={16} color={colors.textGray} />
                 </View>
                 <Text style={styles.stepInactiveText}>{t('Review', 'Review')}</Text>
              </View>
              <View style={styles.step}>
                 <View style={[styles.stepCircle, styles.stepInactive]}>
                    <Wrench size={16} color={colors.textGray} />
                 </View>
                 <Text style={styles.stepInactiveText}>{t('Working', 'Working')}</Text>
              </View>
              <View style={styles.step}>
                 <View style={[styles.stepCircle, styles.stepInactive]}>
                    <Flag size={16} color={colors.textGray} />
                 </View>
                 <Text style={styles.stepInactiveText}>{t('Done', 'Done')}</Text>
              </View>
           </View>
        </View>

        {/* Form */}
        <Text style={styles.sectionTitle}>{t('New Request', 'New Request')}</Text>
        
        <Text style={styles.label}>{t('Select Vehicle', 'Select Vehicle')}</Text>
        {vehiclesLoading && !selectedVehicle ? (
           <Skeleton width="100%" height={56} borderRadius={12} style={{ marginBottom: 16 }} />
        ) : (
           <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.inputWrap} 
              onPress={() => setShowVehiclePicker(!showVehiclePicker)}
           >
              <TextInput 
                style={[styles.input, { color: selectedVehicle ? colors.textDark : colors.textGray }]} 
                value={selectedVehicle ? `${selectedVehicle.PlateNumber} - ${selectedVehicle.Model}` : t('No vehicles found')} 
                editable={false} 
                pointerEvents="none"
              />
              <ChevronDown size={20} color={colors.textGray} style={styles.inputIcon} />
           </TouchableOpacity>
        )}

        {showVehiclePicker && vehicles.length > 0 && (
          <View style={styles.pickerBox}>
            {vehicles.map(v => (
              <TouchableOpacity 
                key={v.VehicleID || v.id} 
                style={styles.pickerRow}
                onPress={() => {
                  setSelectedVehicle(v);
                  setShowVehiclePicker(false);
                }}
              >
                <Text style={styles.pickerText}>{v.PlateNumber} • {v.Model}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {showVehiclePicker && vehicles.length === 0 && (
          <Text style={{color: '#ef4444', marginBottom: 16}}>{t('Please go to the Vehicles tab and add a vehicle first.')}</Text>
        )}

        <Text style={styles.label}>{t('Service Type', 'Service Type')} (Select Multiple)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
           {SERVICE_CATEGORIES.map(category => (
             <View key={category} style={{ marginRight: 8 }}>
               <ServiceChip 
                 title={t(category, category)}
                 isSelected={selectedServices.includes(category)}
                 onPress={() => toggleService(category)}
               />
             </View>
           ))}
        </ScrollView>

        <TouchableOpacity 
           style={[styles.emergencyBtn, isEmergency && styles.emergencyBtnActive]} 
           onPress={() => setIsEmergency(!isEmergency)}
        >
           <AlertCircle size={20} color={isEmergency ? colors.white : '#ef4444'} />
           <Text style={isEmergency ? styles.emergencyTextActive : styles.emergencyText}>
             {isEmergency ? t('Marked as Emergency') : t('Mark as Emergency')}
           </Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t('Problem Description', 'Problem Description')}</Text>
        <TextInput 
          style={styles.textArea} 
          multiline 
          placeholder={t("Describe the noise or issue in detail...", "Describe the noise or issue in detail...")}
          placeholderTextColor={colors.textGray}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>{t('Preferred Time (Optional)', 'Preferred Time (Optional)')}</Text>
        <TextInput 
          style={[styles.input, { marginBottom: 16 }]} 
          placeholder={t("e.g. Tomorrow morning, 10:00 AM", "e.g. Tomorrow morning, 10:00 AM")}
          placeholderTextColor={colors.textGray}
          value={preferredTime}
          onChangeText={setPreferredTime}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={styles.bottomBar}>
         <TouchableOpacity 
           style={[styles.submitBtn, (requestLoading || !garage) && { opacity: 0.7 }]} 
           onPress={handleSubmit}
           disabled={requestLoading || !garage}
         >
            {requestLoading ? (
               <ActivityIndicator color={colors.white} />
            ) : (
               <Text style={styles.submitBtnText}>{t('Submit Request', 'Submit Request')}</Text>
            )}
         </TouchableOpacity>
         <View style={styles.trustWrap}>
            <ShieldCheck size={16} color="#22c55e" />
            <Text style={styles.trustText}>{t('Secure Booking & Certified Mechanics', 'Secure Booking & Certified Mechanics')}</Text>
         </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgGray },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  iconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark },
  content: { padding: 16 },
  headline: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.textDark, marginBottom: 6 },
  subtitle: { fontSize: 16, color: colors.textGray },
  trackerCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  trackerTitle: { fontSize: 14, fontWeight: 'bold', color: colors.textDark },
  statusBadge: { backgroundColor: 'rgba(19, 127, 236, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: colors.primaryBlue, fontWeight: 'bold', fontSize: 12 },
  stepperWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative' },
  stepperLine: { position: 'absolute', top: 16, left: 0, right: 0, height: 2, backgroundColor: colors.bgGray, zIndex: 0 },
  step: { alignItems: 'center', gap: 6, zIndex: 1, backgroundColor: colors.white, paddingHorizontal: 4 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepActive: { backgroundColor: colors.primaryBlue },
  stepInactive: { backgroundColor: colors.bgGray },
  stepText: { fontSize: 10, fontWeight: 'bold', color: colors.primaryBlue },
  stepInactiveText: { fontSize: 10, fontWeight: '500', color: colors.textGray },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textDark, marginBottom: 8 },
  inputWrap: { position: 'relative', marginBottom: 16 },
  input: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, height: 56, paddingHorizontal: 16, fontSize: 16, color: colors.textDark },
  inputIcon: { position: 'absolute', right: 16, top: 18 },
  pickerBox: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 16, marginTop: -10, overflow: 'hidden' },
  pickerRow: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.bgGray },
  pickerText: { fontSize: 16, color: colors.textDark },
  textArea: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, height: 120, padding: 16, fontSize: 16, color: colors.textDark, textAlignVertical: 'top', marginBottom: 16 },
  emergencyBtn: {
    height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, 
    borderWidth: 1, borderColor: '#ef4444', backgroundColor: 'transparent'
  },
  emergencyBtnActive: { backgroundColor: '#ef4444' },
  emergencyText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  emergencyTextActive: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  submitBtn: { backgroundColor: colors.primaryBlue, borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  trustWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  trustText: { fontSize: 12, color: colors.textGray, fontWeight: '500' }
});
