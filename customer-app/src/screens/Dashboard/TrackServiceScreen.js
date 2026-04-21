import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, CheckCircle2, Clock, Wrench, Phone } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function TrackServiceScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { job } = route.params || {};

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
          <Text style={styles.plateNumber}>{job.vehicleId?.plateNumber || 'N/A'}</Text>
          <Text style={styles.vehicleModel}>{job.vehicleId?.brand} {job.vehicleId?.model}</Text>
          <View style={styles.divider} />
          <Text style={styles.descriptionLabel}>{t('Issue Description')}:</Text>
          <Text style={styles.descriptionText}>{job.description || t('No description provided')}</Text>
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
      </ScrollView>
    </SafeAreaView>
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
});
