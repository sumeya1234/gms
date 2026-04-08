import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Star, Send, Flag, Store, Wrench } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useServiceStore } from '../../store/serviceStore';
import Skeleton from '../../components/Skeleton';

export default function HistoryScreen({ navigation }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('History'); // 'Rate' or 'History'
  
  const { requests, isLoading, fetchMyRequests } = useServiceStore();

  useEffect(() => {
    fetchMyRequests();
  }, []);

  // For demonstration, map statuses to colors
  const getStatusColor = (status) => {
    if (status === 'Pending') return '#f59e0b';
    if (status === 'Approved') return colors.primaryBlue;
    if (status === 'InProgress') return '#8b5cf6';
    if (status === 'Completed') return '#10b981';
    if (status === 'Rejected') return '#ef4444';
    return colors.textGray;
  };

  const completedRequests = requests.filter(r => r.Status === 'Completed');
  const allRequests = requests;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('Service History', 'Service History')}</Text>
      </View>

      <View style={styles.tabsWrap}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'History' && styles.tabBtnActive]}
            onPress={() => setActiveTab('History')}
          >
            <Text style={[styles.tabText, activeTab === 'History' && styles.tabTextActive]}>{t('History', 'History')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'Rate' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Rate')}
          >
            <Text style={[styles.tabText, activeTab === 'Rate' && styles.tabTextActive]}>{t('Rate Service', 'Rate Service')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.historyCard, { marginBottom: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
               <View style={{ gap: 6 }}>
                  <Skeleton width={120} height={16} />
                  <Skeleton width={80} height={12} />
               </View>
               <Skeleton width={60} height={20} borderRadius={6} />
            </View>
            <Skeleton width="100%" height={40} style={{ marginBottom: 12 }} />
            <View style={{ borderTopWidth: 1, borderTopColor: colors.bgGray, paddingTop: 12 }}>
               <Skeleton width={80} height={12} />
            </View>
          </View>

          <View style={[styles.historyCard, { marginBottom: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
               <View style={{ gap: 6 }}>
                  <Skeleton width={140} height={16} />
                  <Skeleton width={90} height={12} />
               </View>
               <Skeleton width={70} height={20} borderRadius={6} />
            </View>
            <Skeleton width="100%" height={40} style={{ marginBottom: 12 }} />
            <View style={{ borderTopWidth: 1, borderTopColor: colors.bgGray, paddingTop: 12 }}>
               <Skeleton width={80} height={12} />
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'Rate' ? (
            <View>
              <Text style={styles.sectionTitle}>{t('Pending Reviews', 'Pending Reviews')}</Text>
              
              {completedRequests.length === 0 ? (
                <Text style={{ textAlign: 'center', color: colors.textGray, marginTop: 40 }}>{t('No completed services to rate yet.', 'No completed services to rate yet.')}</Text>
              ) : (
                 completedRequests.map(item => (
                    <View key={item.RequestID} style={styles.pendingCard}>
                       <View style={styles.pendingImgWrap}>
                          <View style={[styles.pendingImg, { backgroundColor: colors.primaryBlue, justifyContent: 'center', alignItems: 'center' }]}>
                             <Wrench size={48} color={colors.white} />
                          </View>
                          <View style={styles.pendingOverlay}>
                             <Text style={styles.pendingJobText}>{item.ServiceType}</Text>
                             <Text style={styles.pendingSubText}>{new Date(item.CreatedAt).toLocaleDateString()}</Text>
                          </View>
                       </View>

                       <View style={styles.pendingActionWrap}>
                          <Text style={styles.askText}>{t('How was your experience?', 'How was your experience?')}</Text>
                          <View style={styles.starsRow}>
                            <Star size={36} color={colors.textGray} />
                            <Star size={36} color={colors.textGray} />
                            <Star size={36} color={colors.textGray} />
                            <Star size={36} color={colors.textGray} />
                            <Star size={36} color={colors.textGray} />
                          </View>

                          <TextInput
                            style={styles.textArea}
                            placeholder={t("Share your experience... (optional)", "Share your experience... (optional)")}
                            placeholderTextColor={colors.textGray}
                            multiline
                          />

                          <TouchableOpacity style={styles.submitBtn}>
                             <Text style={styles.submitBtnText}>{t('Submit Feedback', 'Submit Feedback')}</Text>
                             <Send size={18} color={colors.white} />
                          </TouchableOpacity>
                       </View>
                    </View>
                 ))
              )}
            </View>
          ) : (
            <View>
              <View style={styles.historyHeader}>
                 <Text style={styles.sectionTitle}>{t('Recent History', 'Recent History')}</Text>
              </View>

              {allRequests.length === 0 ? (
                <Text style={{ textAlign: 'center', color: colors.textGray, marginTop: 40 }}>{t('You have no service requests yet.', 'You have no service requests yet.')}</Text>
              ) : (
                allRequests.map(item => (
                  <View key={item.RequestID} style={styles.historyCard}>
                     <View style={styles.histHeaderRow}>
                       <View>
                          <Text style={styles.histTitle}>{item.ServiceType}</Text>
                          <Text style={styles.histSub}>{new Date(item.CreatedAt).toLocaleDateString()}</Text>
                       </View>
                       <View style={{ backgroundColor: getStatusColor(item.Status), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                          <Text style={{ color: colors.white, fontSize: 12, fontWeight: 'bold' }}>{item.Status}</Text>
                       </View>
                     </View>
                     
                     <Text style={styles.histComment}>{item.Description || 'No description provided.'}</Text>

                     {item.RejectionReason ? (
                       <View style={styles.managerResponse}>
                          <View style={styles.respHeader}>
                             <Store size={14} color={colors.primaryBlue} />
                             <Text style={styles.respTitle}>Rejection Reason</Text>
                          </View>
                          <Text style={styles.respText}>{item.RejectionReason}</Text>
                       </View>
                     ) : null}

                     <View style={[styles.histFooter, { justifyContent: 'space-between' }]}>
                       <Text style={{ fontSize: 12, color: colors.textGray }}>Vehicle #{item.VehicleID}</Text>
                     </View>
                  </View>
                ))
              )}

            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgGray },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primaryBlue },
  tabsWrap: { padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabsContainer: { flexDirection: 'row', backgroundColor: colors.bgGray, padding: 4, borderRadius: 12, height: 48 },
  tabBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.textGray },
  tabTextActive: { color: colors.primaryBlue, fontWeight: 'bold' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark, marginBottom: 12 },
  pendingCard: { backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  pendingImgWrap: { height: 180, position: 'relative' },
  pendingImg: { width: '100%', height: '100%' },
  pendingOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.6)' },
  pendingJobText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  pendingSubText: { color: colors.bgGray, fontSize: 14, marginTop: 4 },
  pendingActionWrap: { padding: 20, alignItems: 'center' },
  askText: { fontSize: 16, fontWeight: '500', color: colors.textDark, marginBottom: 16 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  textArea: { width: '100%', backgroundColor: colors.bgGray, borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', fontSize: 14, color: colors.textDark, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  submitBtn: { flexDirection: 'row', width: '100%', backgroundColor: colors.primaryBlue, borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', gap: 8 },
  submitBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  histHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  histTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textDark },
  histSub: { fontSize: 12, color: colors.textGray, marginTop: 2 },
  histComment: { fontSize: 14, color: colors.textDark, lineHeight: 20, marginBottom: 12 },
  managerResponse: { backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ef4444', marginBottom: 12 },
  respHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  respTitle: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },
  respText: { fontSize: 12, color: colors.textGray, fontStyle: 'italic' },
  histFooter: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.bgGray, paddingTop: 12 },
});
