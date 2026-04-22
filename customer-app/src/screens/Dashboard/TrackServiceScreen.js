import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, CheckCircle2, Clock, Wrench, Phone, AlertTriangle, MapPin, CreditCard, Banknote, X } from 'lucide-react-native';
import api from '../../api/client';
import { colors } from '../../theme/colors';

export default function TrackServiceScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { job: initialJob } = route.params || {};
  const [job, setJob] = useState(initialJob);
  const [suggestions, setSuggestions] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPayOptions, setShowPayOptions] = useState(false);

  const fetchJobDetails = async () => {
    try {
      const res = await api.get(`/services/${job.RequestID}`);
      if (res.data) setJob(res.data);
    } catch (e) {
      console.log('Refresh Job Error:', e.message);
    }
  };

  const handlePayDeposit = async (method) => {
    setPaymentLoading(true);
    try {
      const response = await api.post('/payments/pay', {
        requestId: job.RequestID,
        amount: job.DepositAmount,
        method: method
      });

      if (method === 'Cash') {
        Alert.alert(t('Recorded'), t('Please pay at the garage.'));
        fetchJobDetails();
      } else {
        const checkoutUrl = response.data.data.checkout_url;
        if (checkoutUrl) {
          await Linking.openURL(checkoutUrl);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to initialize payment.');
    } finally {
      setPaymentLoading(false);
      setShowPayOptions(false);
    }
  };

  const handleResponse = async (accept) => {
    try {
      const res = await api.put(`/services/${job.RequestID}/respond`, { accept });
      if (accept) {
        Alert.alert(t('Success'), t('Offer accepted! Work will begin shortly.'));
        // Refresh job state or go back
        navigation.goBack();
      } else {
        Alert.alert(t('Offer Rejected'), t('We have found some alternative garages for you.'));
        setSuggestions(res.data.suggestions || []);
      }
    } catch (err) {
      Alert.alert(t('Error'), err.response?.data?.message || t('Failed to respond to offer.'));
    }
  };

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={28} color={colors.textDark} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text>{t('Service details not found')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine active step based on status
  const statuses = ['pending', 'approved', 'inprogress', 'completed'];
  const currentStatusIndex = statuses.indexOf(job.status?.toLowerCase() || 'pending');

  const steps = [
    { title: t('Request Received'), desc: t('Waiting for garage approval'), icon: Clock },
    { title: t('Approved'), desc: t('Mechanic assignment pending'), icon: CheckCircle2 },
    { title: t('In Progress'), desc: t('Mechanic is working on your vehicle'), icon: Wrench },
    { title: t('Completed'), desc: t('Service finished & ready for payment'), icon: CheckCircle2 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={28} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Track Service')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Job Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.plateNumber}>{job.vehicleId?.plateNumber || job.PlateNumber || 'N/A'}</Text>
          <Text style={styles.vehicleModel}>{job.vehicleId?.brand || job.Brand} {job.vehicleId?.model || job.Model}</Text>
          <View style={styles.divider} />
          <Text style={styles.descriptionLabel}>{t('Issue Description')}:</Text>
          <Text style={styles.descriptionText}>{job.description || job.Description || t('No description provided')}</Text>

          {/* Deposit Needed Section */}
          {job.DepositAmount > 0 && !job.IsDepositPaid && job.status !== 'Rejected' && job.Status !== 'Rejected' && (
            <View style={styles.depositSection}>
              <View style={styles.depositHeader}>
                <AlertTriangle size={18} color="#9a3412" />
                <Text style={styles.depositTitle}>{t('Preservice Deposit Required')}</Text>
              </View>
              <Text style={styles.depositAmountText}>{Number(job.DepositAmount).toLocaleString()} ETB</Text>

              {paymentLoading ? (
                <ActivityIndicator color="#ea580c" />
              ) : showPayOptions ? (
                <View style={styles.depositActions}>
                  <TouchableOpacity style={styles.onlinePayBtn} onPress={() => handlePayDeposit('Chapa')}>
                    <CreditCard size={16} color="#fff" />
                    <Text style={styles.payBtnText}>{t('Pay Online')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cashPayBtn} onPress={() => handlePayDeposit('Cash')}>
                    <Text style={styles.payBtnText}>{t('Cash')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closePayBtn} onPress={() => setShowPayOptions(false)}>
                    <X size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.payNowTrigger} onPress={() => setShowPayOptions(true)}>
                  <Banknote size={16} color="#fff" />
                  <Text style={styles.payNowText}>{t('Pay Deposit Now')}</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.depositNote}>{t('* The garage will only start working after deposit confirmation.')}</Text>
            </View>
          )}
        </View>

        <Text style={styles.timelineTitle}>{t('Service Timeline')}</Text>

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          {steps.map((step, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const Icon = step.icon;

            return (
              <View key={index} style={styles.timelineStep}>
                <View style={styles.timelineIconColumn}>
                  <View style={[
                    styles.iconWrapper,
                    isCompleted ? styles.iconWrapperActive : styles.iconWrapperInactive,
                    isCurrent && styles.iconWrapperCurrent
                  ]}>
                    <Icon size={20} color={isCompleted ? colors.white : colors.textGray} />
                  </View>
                  {index < steps.length - 1 && (
                    <View style={[
                      styles.timelineLine,
                      index < currentStatusIndex ? styles.timelineLineActive : styles.timelineLineInactive
                    ]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.stepTitle, isCompleted && styles.stepTitleActive]}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Mechanic Info */}
        {currentStatusIndex >= 1 && job.AssignedMechanicName && (
          <View style={styles.mechanicCard}>
            <Text style={styles.mechanicLabel}>{t('Assigned Mechanic')}</Text>
            <View style={styles.mechanicRow}>
              <View style={styles.mechanicAvatar}>
                <Text style={styles.avatarText}>{job.AssignedMechanicName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.mechanicInfo}>
                <Text style={styles.mechanicName}>{job.AssignedMechanicName}</Text>
                {job.AssignedMechanicPhone && (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${job.AssignedMechanicPhone}`)} style={styles.phoneAction}>
                    <Phone size={14} color={colors.accentBlue} />
                    <Text style={styles.mechanicPhone}>{job.AssignedMechanicPhone}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Emergency Offer Banner */}
        {job.IsEmergency && job.EmergencyStatus === 'OfferSent' && suggestions.length === 0 && (
          <View style={styles.offerCard}>
            <View style={styles.offerHeader}>
              <AlertTriangle color={colors.yellowBtn} size={24} />
              <Text style={styles.offerTitle}>{t('Emergency Service Offer')}</Text>
            </View>
            <Text style={styles.offerDesc}>{t('The garage has provided an estimate for your emergency request.')}</Text>

            <View style={styles.offerDetails}>
              <View style={styles.offerRow}>
                <Text style={styles.offerLabel}>{t('Estimated Price')}:</Text>
                <Text style={styles.offerValue}>ETB {job.EstimatedPrice}</Text>
              </View>
              {job.AssignedMechanicName && (
                <View style={styles.offerRow}>
                  <Text style={styles.offerLabel}>{t('Mechanic')}:</Text>
                  <Text style={styles.offerValue}>{job.AssignedMechanicName}</Text>
                </View>
              )}
            </View>

            <View style={styles.offerActions}>
              <TouchableOpacity
                style={[styles.offerBtn, styles.acceptBtn]}
                onPress={() => handleResponse(true)}
              >
                <Text style={styles.acceptBtnText}>{t('Accept & Start')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.offerBtn, styles.rejectBtn]}
                onPress={() => handleResponse(false)}
              >
                <Text style={styles.rejectBtnText}>{t('Reject')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Alternative Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>{t('Suggested Nearby Garages')}</Text>
            {suggestions.map((g) => (
              <TouchableOpacity
                key={g.GarageID}
                style={styles.suggestionItem}
                onPress={() => navigation.navigate('GarageDetail', { garageId: g.GarageID })}
              >
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionName}>{g.Name}</Text>
                  <View style={styles.suggestionSub}>
                    <MapPin size={12} color={colors.textGray} />
                    <Text style={styles.suggestionLoc}>{g.Location}</Text>
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{Number(g.AverageRating).toFixed(1)} ★</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeSuggestions}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeSuggestionsText}>{t('Close')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgColor },
  header: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontFamily: 'Inter-SemiBold', color: colors.textDark },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 20,
    shadowColor: colors.textDark, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 32,
  },
  plateNumber: { fontSize: 20, fontFamily: 'Inter-Bold', color: colors.primaryBlue },
  vehicleModel: { fontSize: 14, color: colors.textGray, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  descriptionLabel: { fontSize: 12, color: colors.textGray, textTransform: 'uppercase', marginBottom: 4 },
  descriptionText: { fontSize: 14, color: colors.textDark, lineHeight: 20 },
  timelineTitle: { fontSize: 18, fontFamily: 'Inter-Bold', color: colors.textDark, marginBottom: 20 },
  timelineContainer: {
    paddingLeft: 10,
    marginBottom: 32,
  },
  timelineStep: { flexDirection: 'row', marginBottom: 0 },
  timelineIconColumn: { alignItems: 'center', marginRight: 16 },
  iconWrapper: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  iconWrapperActive: { backgroundColor: colors.accentBlue },
  iconWrapperInactive: { backgroundColor: colors.bgGray, borderWidth: 1, borderColor: colors.border },
  iconWrapperCurrent: { shadowColor: colors.accentBlue, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  timelineLine: { width: 2, height: 40 },
  timelineLineActive: { backgroundColor: colors.accentBlue },
  timelineLineInactive: { backgroundColor: colors.border },
  timelineContent: { flex: 1, paddingTop: 8, paddingBottom: 32 },
  stepTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.textGray },
  stepTitleActive: { color: colors.textDark },
  stepDesc: { fontSize: 13, color: colors.textGray, marginTop: 4 },
  mechanicCard: {
    backgroundColor: colors.bgGray, borderRadius: 16, padding: 20, marginTop: 10
  },
  mechanicLabel: { fontSize: 12, color: colors.textGray, textTransform: 'uppercase', marginBottom: 12 },
  mechanicRow: { flexDirection: 'row', alignItems: 'center' },
  mechanicAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.yellowBtn,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontFamily: 'Inter-Bold', color: colors.textDark },
  mechanicInfo: { flex: 1 },
  mechanicName: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.textDark },
  phoneAction: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  mechanicPhone: { fontSize: 13, color: colors.accentBlue, fontFamily: 'Inter-SemiBold' },
  // Deposit Styles
  depositSection: {
    marginTop: 20, padding: 16, backgroundColor: '#fff7ed', borderRadius: 12,
    borderWidth: 1, borderColor: '#ffedd5', alignItems: 'center'
  },
  depositHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  depositTitle: { fontSize: 14, fontWeight: 'bold', color: '#9a3412' },
  depositAmountText: { fontSize: 24, fontWeight: 'bold', color: '#ea580c', marginBottom: 16 },
  depositActions: { flexDirection: 'row', gap: 8, width: '100%' },
  onlinePayBtn: {
    flex: 2, backgroundColor: '#ea580c', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 10
  },
  cashPayBtn: {
    flex: 1, backgroundColor: colors.white, borderWidth: 1,
    borderColor: '#ea580c', alignItems: 'center', justifyContent: 'center', borderRadius: 10
  },
  closePayBtn: {
    width: 48, backgroundColor: colors.white, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center', borderRadius: 10
  },
  payBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  payNowTrigger: {
    width: '100%', backgroundColor: '#ea580c', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 12
  },
  payNowText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  depositNote: { fontSize: 11, color: '#c2410c', marginTop: 10, fontStyle: 'italic', textAlign: 'center' },
  // New Styles
  offerCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 20, marginTop: 20,
    borderWidth: 2, borderColor: colors.yellowBtn,
    shadowColor: colors.textDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  offerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  offerTitle: { fontSize: 18, fontFamily: 'Inter-Bold', color: colors.textDark },
  offerDesc: { fontSize: 13, color: colors.textGray, marginBottom: 16, lineHeight: 18 },
  offerDetails: { backgroundColor: colors.bgGray, borderRadius: 12, padding: 16, marginBottom: 20 },
  offerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  offerLabel: { fontSize: 14, color: colors.textGray },
  offerValue: { fontSize: 14, fontFamily: 'Inter-Bold', color: colors.textDark },
  offerActions: { flexDirection: 'row', gap: 12 },
  offerBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  acceptBtn: { backgroundColor: colors.primaryBlue },
  rejectBtn: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  acceptBtnText: { color: colors.white, fontFamily: 'Inter-Bold', fontSize: 14 },
  rejectBtnText: { color: colors.textGray, fontFamily: 'Inter-SemiBold', fontSize: 14 },
  suggestionsContainer: { marginTop: 24 },
  suggestionsTitle: { fontSize: 18, fontFamily: 'Inter-Bold', color: colors.textDark, marginBottom: 16 },
  suggestionItem: {
    backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  suggestionInfo: { flex: 1 },
  suggestionName: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.textDark },
  suggestionSub: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  suggestionLoc: { fontSize: 12, color: colors.textGray },
  ratingBadge: { backgroundColor: colors.bgGray, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ratingText: { fontSize: 12, fontFamily: 'Inter-Bold', color: colors.textDark },
  closeSuggestions: { marginTop: 12, padding: 16, alignItems: 'center' },
  closeSuggestionsText: { color: colors.accentBlue, fontFamily: 'Inter-SemiBold' },
});
