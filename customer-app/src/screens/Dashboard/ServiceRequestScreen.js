import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, ChevronDown, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useVehicleStore } from '../../store/vehicleStore';
import { useServiceStore } from '../../store/serviceStore';
import ServiceChip from '../../components/ServiceChip';
import Skeleton from '../../components/Skeleton';

const SERVICE_CATEGORIES = ['Towing', 'Diagnostics', 'Tires', 'Oil Change', 'Repair', 'Battery', 'Electrical'];

const generateDates = () => {
    const dates = [];
    const today = new Date();
    for(let i=0; i<7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        dates.push({
            dateString: `${yyyy}-${mm}-${dd}`,
            dayStr,
            dayNum: d.getDate()
        });
    }
    return dates;
};
const DATES = generateDates();
const TIME_SLOTS = [
  '08:00:00', '09:00:00', '10:00:00', '11:00:00', 
  '12:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00'
];

export default function ServiceRequestScreen({ navigation, route }) {
  const { t } = useTranslation();
  const garage = route.params?.garage || null;
  const defaultServices = route.params?.defaultServices || [];

  const { vehicles, fetchVehicles, isLoading: vehiclesLoading } = useVehicleStore();
  const { createRequest, checkAvailability, isLoading: requestLoading } = useServiceStore();

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [selectedServices, setSelectedServices] = useState(defaultServices.length > 0 ? defaultServices : ['Repair']);
  const [description, setDescription] = useState('');
  
  // Scheduling State
  const [selectedDate, setSelectedDate] = useState(DATES[0].dateString);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availability, setAvailability] = useState({});
  const [isCheckingTime, setIsCheckingTime] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles]);

  useEffect(() => {
     if(garage?.id && selectedDate) {
        const fetchAvailability = async () => {
           setIsCheckingTime(true);
           const data = await checkAvailability(garage.id, selectedDate);
           if(data) {
              setAvailability(data);
              // if selected time is now congested, clear it
              if(selectedTime && data.congestedTimes?.includes(selectedTime)) {
                 setSelectedTime(null);
              }
           }
           setIsCheckingTime(false);
        };
        fetchAvailability();
     }
  }, [selectedDate, garage?.id]);

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
    if (!selectedTime) {
      Alert.alert(t('Error'), t('Please select a drop-off time.'));
      return;
    }
    if (availability?.isFullyBooked) {
      Alert.alert(t('Error'), t('The garage is fully booked on this date.'));
      return;
    }

    let finalDescription = description.trim();

    const payload = {
      serviceType: selectedServices.join(', '),
      vehicleId: selectedVehicle.VehicleID || selectedVehicle.id,
      garageId: garage.id,
      description: finalDescription,
      isEmergency: false,
      bookingDate: selectedDate,
      dropOffTime: selectedTime
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



        <Text style={styles.label}>{t('Problem Description (Optional)', 'Problem Description (Optional)')}</Text>
        <TextInput 
          style={styles.textArea} 
          multiline 
          placeholder={t("Describe any specific issues or focus areas...", "Describe any specific issues or focus areas...")}
          placeholderTextColor={colors.textGray}
          value={description}
          onChangeText={setDescription}
        />

        {/* Dynamic Scheduling Engine */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t('Schedule Drop-off', 'Schedule Drop-off')}</Text>
        <Text style={[styles.label, { marginBottom: 12 }]}>{t('Select Date', 'Select Date')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
           {DATES.map((d, index) => {
              const isSelected = selectedDate === d.dateString;
              return (
                 <TouchableOpacity
                    key={d.dateString}
                    style={[
                       styles.dateBox,
                       isSelected && styles.dateBoxSelected,
                       { marginLeft: index === 0 ? 0 : 12 }
                    ]}
                    onPress={() => setSelectedDate(d.dateString)}
                 >
                    <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>{d.dayStr}</Text>
                    <Text style={[styles.dateNum, isSelected && styles.dateTextSelected]}>{d.dayNum}</Text>
                 </TouchableOpacity>
              )
           })}
        </ScrollView>

        <Text style={[styles.label, { marginBottom: 12 }]}>{t('Select Time', 'Select Time')}</Text>
        {isCheckingTime ? (
           <ActivityIndicator size="small" color={colors.primaryBlue} style={{ alignSelf: 'flex-start', marginVertical: 16 }} />
        ) : availability?.isFullyBooked ? (
           <View style={styles.fullyBookedWrap}>
              <Text style={styles.fullyBookedText}>{t('Garage is at Max Labor Capacity for this date. Please select another date.')}</Text>
           </View>
        ) : (
           <View style={styles.timeGrid}>
              {TIME_SLOTS.map(time => {
                 const isCongested = availability?.congestedTimes?.includes(time);
                 const isSelected = selectedTime === time;
                 const displayTime = time.substring(0, 5); // 08:00
                 
                 return (
                    <TouchableOpacity
                       key={time}
                       disabled={isCongested}
                       style={[
                          styles.timeSlot,
                          isSelected && styles.timeSlotSelected,
                          isCongested && styles.timeSlotDisabled
                       ]}
                       onPress={() => setSelectedTime(time)}
                    >
                       <Text style={[
                          styles.timeSlotText,
                          isSelected && styles.timeSlotTextSelected,
                          isCongested && styles.timeSlotTextDisabled
                       ]}>
                          {displayTime}
                       </Text>
                    </TouchableOpacity>
                 );
              })}
           </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 16 }]}>
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
  dateBox: { width: 60, height: 75, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  dateBoxSelected: { borderColor: colors.primaryBlue, backgroundColor: colors.primaryBlue },
  dateDay: { fontSize: 13, color: colors.textGray, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' },
  dateNum: { fontSize: 20, color: colors.textDark, fontWeight: 'bold' },
  dateTextSelected: { color: colors.white },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  timeSlot: { width: '30%', height: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  timeSlotSelected: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  timeSlotDisabled: { backgroundColor: colors.bgGray, borderColor: colors.border, opacity: 0.6 },
  timeSlotText: { fontSize: 14, color: colors.textDark, fontWeight: '600' },
  timeSlotTextSelected: { color: colors.white },
  timeSlotTextDisabled: { color: colors.textGray, textDecorationLine: 'line-through' },
  fullyBookedWrap: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', marginBottom: 16 },
  fullyBookedText: { color: '#ef4444', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  submitBtn: { backgroundColor: colors.primaryBlue, borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  trustWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  trustText: { fontSize: 12, color: colors.textGray, fontWeight: '500' }
});
