import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Modal } from 'react-native';
import { ChevronLeft, Clock, CheckCircle, Wrench, CreditCard, Banknote, MapPin, Phone, DollarSign } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useServiceStore } from '../../store/serviceStore';
import apiClient from '../../api/client';
import showAlert from '../../utils/alert';
import { colors } from '../../theme/colors';

export default function TrackServiceScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { job } = route.params || {};
  const [loading, setLoading] = React.useState(false);
  const { cancelRequest } = useServiceStore();
  const [nearbyGarages, setNearbyGarages] = React.useState([]);

  const [showPayOptions, setShowPayOptions] = React.useState(false);
  const [paymentLoading, setPaymentLoading] = React.useState(false);

  const depositAmount = job?.EstimatedPrice && job?.DepositPercentage
    ? Math.ceil((job.EstimatedPrice * job.DepositPercentage) / 100)
    : null;

  const handleApprove = () => {
    // Show payment method selection — customer must pay deposit before service begins
    if (depositAmount) {
      setShowPayOptions(true);
    } else {
      // No deposit required — direct approval
      confirmApproval();
    }
  };

  const confirmApproval = async () => {
    setLoading(true);
    try {
      await apiClient.put(`/api/services/${job.RequestID}/status`, { status: 'Approved' });
      showAlert(t('Success'), t('Request approved. The garage will begin service shortly.'));
      navigation.goBack();
    } catch (err) {
      showAlert(t('Error'), t('Failed to approve request.'), [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayDeposit = async (method) => {
    setShowPayOptions(false);
    setPaymentLoading(true);
    try {
      // Initiate the deposit payment directly
      const response = await apiClient.post('/api/payments/pay', {
        requestId: job.RequestID,
        amount: depositAmount,
        method: method
      });

      if (method === 'Cash') {
        showAlert(
          t('Deposit Recorded'),
          t('Please pay ') + depositAmount + t(' ETB at the garage. The accountant will confirm your payment.'),
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        const checkoutUrl = response.data?.data?.checkout_url;
        if (checkoutUrl) {
          await Linking.openURL(checkoutUrl);
          navigation.goBack();
        }
      }
    } catch (err) {
      showAlert(t('Error'), err?.response?.data?.error || t('Failed to process deposit payment.'), [], 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await apiClient.put(`/api/services/${job.RequestID}/status`, { status: 'Rejected', rejectionReason: 'Customer rejected estimate' });

      // Fetch nearby garages
      const response = await apiClient.get('/api/garages');
      const filtered = response.data.filter(g => g.GarageID.toString() !== job.GarageID?.toString()).slice(0, 3);
      setNearbyGarages(filtered);
      showAlert(t('Request Rejected'), t('We have found some other nearby garages for you.'));
    } catch (err) {
      showAlert(t('Error'), t('Failed to reject request.'), [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = () => {
    showAlert(
      t('Cancel Request'),
      t('Are you sure you want to cancel this service request?'),
      [
        { text: t('No'), style: 'cancel' },
        {
          text: t('Yes, Cancel'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const result = await cancelRequest(job.RequestID);
            if (result === true) {
              showAlert(t('Success'), t('Your request has been cancelled.'));
              navigation.navigate('History');
            } else {
              showAlert(t('Error'), result?.message || t('Failed to cancel request.'), [], 'error');
              setLoading(false);
            }
          }
        }
      ],
      'confirm'
    );
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
    { title: t('Approved'), desc: job.IsEmergency ? t('Deposit paid, assigning mechanic') : t('Mechanic assignment pending'), icon: CheckCircle },
    { title: t('In Progress'), desc: job.IsEmergency ? t('Mechanic is on their way to you') : t('Mechanic is working on your vehicle'), icon: Wrench },
    { title: t('Completed'), desc: t('Service finished & ready for payment'), icon: CheckCircle },
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
          <Text style={styles.plateNumber}>{job.vehicleId?.plateNumber || 'N/A'}</Text>
          <Text style={styles.vehicleModel}>{job.vehicleId?.brand} {job.vehicleId?.model}</Text>
          <View style={styles.divider} />
          <Text style={styles.descriptionLabel}>{t('Issue Description')}:</Text>
          <Text style={styles.descriptionText}>{job.description || t('No description provided')}</Text>
          {job.CustomerStatus && (
            <>
              <Text style={[styles.descriptionLabel, { marginTop: 12 }]}>{t('Your Status')}:</Text>
              <Text style={styles.descriptionText}>{job.CustomerStatus}</Text>
            </>
          )}
        </View>

        {/* Emergency Estimate Section */}
        {!!job.IsEmergency && !!job.EstimatedPrice && !job.IsDepositPaid && (
          <View style={styles.estimateCard}>
            <View style={styles.estimateHeader}>
              <DollarSign size={20} color={colors.accentBlue} />
              <Text style={styles.estimateTitle}>{t('Garage Estimate')}</Text>
            </View>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>{t('Estimated Total')}</Text>
              <Text style={styles.estimateValue}>{Number(job.EstimatedPrice).toLocaleString()} ETB</Text>
            </View>
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>{t('Deposit Required')} ({job.DepositPercentage}%)</Text>
              <Text style={[styles.estimateValue, { color: colors.primaryBlue }]}>{depositAmount?.toLocaleString()} ETB</Text>
            </View>
            <Text style={styles.estimateNote}>{t('You must pay the deposit to confirm the service.')}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={handleApprove}
                disabled={loading || paymentLoading}
              >
                <Text style={styles.actionBtnText}>{t('Approve & Pay Deposit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={handleReject}
                disabled={loading || paymentLoading}
              >
                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>{t('Reject')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Suggested Garages */}
        {nearbyGarages.length > 0 ? (
          <View style={styles.nearbyContainer}>
            <Text style={styles.nearbyTitle}>{t('Other Nearby Garages')}</Text>
            {nearbyGarages.map(g => (
              <TouchableOpacity
                key={g.GarageID}
                style={styles.nearbyCard}
                onPress={() => navigation.navigate('GarageDetail', { garage: g })}
              >
                <View style={styles.nearbyInfo}>
                  <Text style={styles.nearbyName}>{g.Name}</Text>
                  <View style={styles.nearbyLocation}>
                    <MapPin size={14} color={colors.textGray} />
                    <Text style={styles.nearbyDist}>{g.Location}</Text>
                  </View>
                </View>
                <ChevronLeft size={20} color={colors.textGray} style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

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

        {/* Cancellation Section */}
        {(job.status?.toLowerCase() === 'pending' || job.status?.toLowerCase() === 'approved') && (
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              style={styles.cancelBookingBtn}
              onPress={handleCancelRequest}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color="#ef4444" /> : <Text style={styles.cancelBookingBtnText}>{t('Cancel Booking')}</Text>}
            </TouchableOpacity>
            <Text style={styles.cancelNote}>{t('You can only cancel before work begins.')}</Text>
          </View>
        )}
      </ScrollView>

      {/* Payment Method Modal */}
      <Modal transparent animationType="slide" visible={showPayOptions}>
        <View style={styles.payModalOverlay}>
          <View style={styles.payModalCard}>
            <Text style={styles.payModalTitle}>{t('Pay Deposit')}</Text>
            <Text style={styles.payModalAmount}>{depositAmount?.toLocaleString()} ETB</Text>
            <Text style={styles.payModalSub}>{t('Choose your payment method for the deposit:')}</Text>
            <TouchableOpacity style={[styles.payMethodBtn, { backgroundColor: '#28a745' }]} onPress={() => handlePayDeposit('Chapa')}>
              <CreditCard size={20} color="#fff" />
              <Text style={styles.payMethodText}>{t('Pay Online (Chapa)')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.payMethodBtn, { backgroundColor: colors.primaryBlue }]} onPress={() => handlePayDeposit('Cash')}>
              <Banknote size={20} color="#fff" />
              <Text style={styles.payMethodText}>{t('Pay Cash at Garage')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.payMethodCancel} onPress={() => setShowPayOptions(false)}>
              <Text style={{ color: colors.textGray, fontSize: 15 }}>{t('Cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment loading overlay */}
      {
        paymentLoading && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 99 }}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={{ marginTop: 12, color: colors.textDark, fontFamily: 'Inter-SemiBold' }}>{t('Processing payment...')}</Text>
          </View>
        )
      }
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
  estimateCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 32,
  },
  estimateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  estimateTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: colors.textDark,
  },
  estimatePrice: {
    fontSize: 15,
    color: colors.textGray,
    marginBottom: 4,
  },
  estimateDeposit: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: colors.primaryBlue,
  },
  rejectBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionBtnText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  nearbyContainer: {
    marginTop: 20,
    marginBottom: 32,
  },
  nearbyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  nearbyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textDark,
    marginBottom: 4,
  },
  nearbyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nearbyDist: {
    fontSize: 13,
    color: colors.textGray,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  estimateLabel: {
    fontSize: 14,
    color: colors.textGray,
    flex: 1,
  },
  estimateValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: colors.textDark,
  },
  estimateNote: {
    fontSize: 12,
    color: colors.textGray,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 16,
  },
  payModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  payModalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
  },
  payModalTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: colors.textDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  payModalAmount: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: colors.primaryBlue,
    textAlign: 'center',
    marginBottom: 8,
  },
  payModalSub: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  payMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    borderRadius: 14,
    marginBottom: 12,
  },
  payMethodText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  payMethodCancel: {
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
  },
  cancelBookingBtn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  cancelBookingBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontFamily: 'Inter-Bold',
  },
  cancelNote: {
    fontSize: 12,
    color: colors.textGray,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  }
});
