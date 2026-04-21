import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Linking, Alert, AppState, Modal, Platform, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Star, Send, Flag, Store, CreditCard, Clock, CheckCircle, Banknote, X, Wrench, Trash } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useServiceStore } from '../../store/serviceStore';
import Skeleton from '../../components/Skeleton';
import api from '../../api/client';

export default function HistoryScreen({ navigation }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('History');
  
  const { requests, isLoading, fetchMyRequests } = useServiceStore();
  const [historyFilter, setHistoryFilter] = useState('Today');
  const pendingTxRef = useRef(null);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [submittingReview, setSubmittingReview] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [showPayOptions, setShowPayOptions] = useState(null);
  const [reviewPrompt, setReviewPrompt] = useState(null);
  const prevCompletedRef = useRef(new Set());
  const [invoiceItem, setInvoiceItem] = useState(null);
  const [invoiceParts, setInvoiceParts] = useState([]);
  const [invoiceCatalog, setInvoiceCatalog] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(null);

  const ServiceCard = ({ item }) => (
    <TouchableOpacity style={styles.historyCard} activeOpacity={0.7} onPress={() => {
       if (item.Status === 'Completed') {
          handleViewInvoice(item);
       } else if (item.Status !== 'Rejected') {
          navigation.navigate('TrackService', { job: { 
             ...item, 
             status: item.Status, 
             description: item.Description,
             vehicleId: { brand: item.Brand, model: item.Model, plateNumber: item.PlateNumber } 
          } });
       } else {
          Alert.alert('Request Rejected', item.RejectionReason || 'This request was rejected by the garage.');
       }
    }}>
       <View style={styles.histHeaderRow}>
         <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.histTitle} numberOfLines={2}>{item.ServiceType}</Text>
            {item.GarageName && (
               <Text style={{ fontSize: 13, color: colors.primaryBlue, fontWeight: '500', marginBottom: 2 }}>{item.GarageName}</Text>
            )}
            <Text style={styles.histSub}>{new Date(item.RequestDate).toLocaleDateString()}</Text>
         </View>
         <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ backgroundColor: getStatusColor(item.Status), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
               <Text style={{ color: colors.white, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>{item.Status}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteRequest(item)} style={{ padding: 4 }}>
               <Trash size={16} color="#ef4444" />
            </TouchableOpacity>
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

       <View style={[styles.histFooter, { justifyContent: 'flex-end' }]}>
          {/* No payment yet — show Pay buttons */}
          {item.Status === 'Completed' && (!item.PaymentStatus || item.PaymentStatus === null) && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textGray, marginBottom: 4 }}>
                Total: {(Number(item.PartsCost) + Number(item.BaseServicePrice)).toLocaleString()} ETB
              </Text>
              
              {paymentLoading === item.RequestID ? (
                <ActivityIndicator color={colors.primaryBlue} />
              ) : showPayOptions === item.RequestID ? (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity 
                    style={{ backgroundColor: '#28a745', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 4 }}
                    onPress={() => handlePayNow(item, 'Chapa')}
                  >
                    <CreditCard size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Online</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ backgroundColor: '#0d6efd', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 4 }}
                    onPress={() => handlePayNow(item, 'Cash')}
                  >
                    <Banknote size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Cash</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={{ backgroundColor: '#28a745', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, gap: 4 }}
                  onPress={() => setShowPayOptions(item.RequestID)}
                >
                  <CreditCard size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Pay Now</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Payment is pending — Cash */}
          {item.Status === 'Completed' && item.PaymentStatus === 'Pending' && item.PaymentMethod === 'Cash' && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textGray, marginBottom: 2 }}>
                Total: {(Number(item.PartsCost) + Number(item.BaseServicePrice)).toLocaleString()} ETB
              </Text>
              <View style={{ backgroundColor: '#fff3cd', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                <Text style={{ color: '#856404', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Cash - Awaiting Confirmation</Text>
              </View>
            </View>
          )}

          {/* Payment is pending — Online: show Verify button */}
          {item.Status === 'Completed' && item.PaymentStatus === 'Pending' && item.PaymentMethod !== 'Cash' && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textGray, marginBottom: 4 }}>
                Total: {(Number(item.PartsCost) + Number(item.BaseServicePrice)).toLocaleString()} ETB
              </Text>
              {verifyingPayment === item.RequestID ? (
                <ActivityIndicator color={colors.primaryBlue} />
              ) : (
                <TouchableOpacity 
                  style={{ backgroundColor: '#0d6efd', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
                  onPress={() => handleVerifyOnline(item)}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Verify Payment</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Payment completed */}
          {item.Status === 'Completed' && item.PaymentStatus === 'Completed' && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textGray, marginBottom: 2 }}>
                Paid: {(Number(item.TotalPaid)).toLocaleString()} ETB
              </Text>
              <View style={{ backgroundColor: '#d4edda', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                <Text style={{ color: '#155724', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>PAID VIA {item.PaymentMethod || 'CHAPA'}</Text>
              </View>
            </View>
          )}
       </View>
    </TouchableOpacity>
  );

  const handleViewInvoice = async (item) => {
    setInvoiceItem(item);
    setInvoiceParts([]);
    setInvoiceCatalog([]);
    setInvoiceLoading(true);
    try {
      const [partsRes, catalogRes] = await Promise.all([
        api.get(`/services/${item.RequestID}/items`),
        api.get(`/catalog/${item.GarageID}`)
      ]);
      setInvoiceParts(partsRes.data);
      setInvoiceCatalog(catalogRes.data);
    } catch (e) {
      console.log('Failed to fetch invoice data:', e.message);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleVerifyOnline = async (item) => {
    if (!item.TransactionRef) {
      Alert.alert('Error', 'No transaction reference found.');
      return;
    }
    setVerifyingPayment(item.RequestID);
    try {
      await api.get(`/payments/verify/${item.TransactionRef}`);
      Alert.alert('Success', 'Payment verified successfully!');
      fetchMyRequests();
    } catch (e) {
      Alert.alert('Verification', 'Payment is still being processed. Please try again shortly.');
    } finally {
      setVerifyingPayment(null);
    }
  };

  const handleDeleteRequest = (item) => {
    Alert.alert(
      "Remove Request",
      "Are you sure you want to remove this service request from your history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
             try {
               await api.delete(`/services/my-requests/${item.RequestID}`);
               fetchMyRequests();
             } catch (err) {
               console.warn("Failed to delete request", err);
               Alert.alert("Error", "Could not remove request.");
             }
          }
        }
      ]
    );
  };

  const handlePayNow = async (request, method) => {
    setShowPayOptions(null);
    setPaymentLoading(request.RequestID);
    try {
      const totalAmount = Number(request.PartsCost) + Number(request.BaseServicePrice);
      if (totalAmount <= 0) {
        Alert.alert("Error", "Invoice amount is zero, cannot proceed to pay.");
        setPaymentLoading(null);
        return;
      }
      const response = await api.post('/payments/pay', {
        requestId: request.RequestID,
        amount: totalAmount,
        method: method
      });

      if (method === 'Cash') {
        Alert.alert(
          t('Cash Payment Recorded'),
          t('Please pay at the garage. The manager will confirm your payment.'),
          [{ text: 'OK' }]
        );
        fetchMyRequests();
      } else {
        const checkoutUrl = response.data.data.checkout_url;
        const txRef = response.data.data.tx_ref;
        if (checkoutUrl) {
          pendingTxRef.current = txRef;
          await Linking.openURL(checkoutUrl);
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Payment Error", "Failed to initialize payment.");
    } finally {
      setPaymentLoading(null);
    }
  };

  // Auto-verify payment when user returns to the app from Chapa checkout
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && pendingTxRef.current) {
        const txRef = pendingTxRef.current;
        pendingTxRef.current = null;
        try {
          await api.get(`/payments/verify/${txRef}`);
        } catch (e) {
          console.log('Payment verify check:', e.message);
        }
        fetchMyRequests();
      }
    });
    return () => subscription.remove();
  }, []);

  // Show review prompt when a new completed service is detected
  useEffect(() => {
    if (requests.length > 0) {
      const newlyCompleted = requests.find(
        r => r.Status === 'Completed' && !r.HasReviewed && !prevCompletedRef.current.has(r.RequestID)
      );
      if (newlyCompleted && prevCompletedRef.current.size > 0) {
        setReviewPrompt(newlyCompleted);
      }
      prevCompletedRef.current = new Set(requests.filter(r => r.Status === 'Completed').map(r => r.RequestID));
    }
  }, [requests]);

  const handleSubmitReview = async (item) => {
    const rating = ratings[item.RequestID];
    const comment = comments[item.RequestID] || '';
    if (!rating || rating === 0) {
      Alert.alert('Error', 'Please select a star rating.');
      return;
    }
    setSubmittingReview(item.RequestID);
    try {
      await api.post('/reviews', {
        garageId: item.GarageID,
        requestId: item.RequestID,
        rating,
        comment: comment.trim()
      });
      Alert.alert('Thank you!', 'Your feedback has been submitted.');
      setRatings(prev => ({ ...prev, [item.RequestID]: 0 }));
      setComments(prev => ({ ...prev, [item.RequestID]: '' }));
      fetchMyRequests();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(null);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyRequests();
    });
    return unsubscribe;
  }, [navigation]);

  const getStatusColor = (status) => {
    if (status === 'Pending') return '#f59e0b';
    if (status === 'Approved') return colors.primaryBlue;
    if (status === 'InProgress') return '#8b5cf6';
    if (status === 'Completed') return '#10b981';
    if (status === 'Rejected') return '#ef4444';
    return colors.textGray;
  };

  // Only show completed requests that haven't been reviewed yet
  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth() &&
           d.getDate() === now.getDate();
  };

  const allRequests = [...requests].sort((a, b) => new Date(b.RequestDate) - new Date(a.RequestDate));
  const todayRequests = allRequests.filter(r => isToday(r.BookingDate) || (!r.BookingDate && isToday(r.RequestDate)));
  const olderRequests = allRequests.filter(r => !todayRequests.some(tr => tr.RequestID === r.RequestID));

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
              
              {unreviewedRequests.length === 0 ? (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <CheckCircle size={48} color={colors.border} />
                  <Text style={{ textAlign: 'center', color: colors.textGray, marginTop: 12, fontSize: 16 }}>
                    {t('All caught up! No services to review.', 'All caught up! No services to review.')}
                  </Text>
                </View>
              ) : (
                 unreviewedRequests.map(item => (
                    <View key={item.RequestID} style={styles.pendingCard}>
                       <View style={styles.pendingImgWrap}>
                          <View style={[styles.pendingImg, { backgroundColor: colors.primaryBlue, justifyContent: 'center', alignItems: 'center' }]}>
                             <Wrench size={48} color={colors.white} />
                          </View>
                           <View style={styles.pendingOverlay}>
                              <Text style={styles.pendingJobText}>{item.ServiceType}</Text>
                              {item.GarageName && (
                                 <Text style={{ color: colors.white, fontSize: 15, fontWeight: '600', marginTop: 2 }}>{item.GarageName}</Text>
                              )}
                              <Text style={styles.pendingSubText}>{new Date(item.RequestDate).toLocaleDateString()}</Text>
                           </View>
                       </View>

                       <View style={styles.pendingActionWrap}>
                          <Text style={styles.askText}>{t('How was your experience?', 'How was your experience?')}</Text>
                          <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity key={star} onPress={() => setRatings(prev => ({ ...prev, [item.RequestID]: star }))} activeOpacity={0.7}>
                                <Star 
                                  size={36} 
                                  color={star <= (ratings[item.RequestID] || 0) ? '#eab308' : colors.textGray} 
                                  fill={star <= (ratings[item.RequestID] || 0) ? '#eab308' : 'transparent'} 
                                />
                              </TouchableOpacity>
                            ))}
                          </View>

                          <TextInput
                            style={styles.textArea}
                            placeholder={t("Share your experience... (optional)", "Share your experience... (optional)")}
                            placeholderTextColor={colors.textGray}
                            multiline
                            value={comments[item.RequestID] || ''}
                            onChangeText={(text) => setComments(prev => ({ ...prev, [item.RequestID]: text }))}
                          />

                          <TouchableOpacity 
                            style={[styles.submitBtn, submittingReview === item.RequestID && { opacity: 0.7 }]}
                            onPress={() => handleSubmitReview(item)}
                            disabled={submittingReview === item.RequestID}
                          >
                             {submittingReview === item.RequestID ? (
                               <ActivityIndicator color={colors.white} />
                             ) : (
                               <>
                                 <Text style={styles.submitBtnText}>{t('Submit Feedback', 'Submit Feedback')}</Text>
                                 <Send size={18} color={colors.white} />
                               </>
                             )}
                          </TouchableOpacity>
                       </View>
                    </View>
                 ))
              )}
            </View>
          ) : (
            <View>
              <View style={styles.historyHeader}>
                 <View style={styles.filterChipsRow}>
                    {['Today', 'Previous'].map(f => (
                       <TouchableOpacity 
                          key={f} 
                          onPress={() => setHistoryFilter(f)}
                          style={[styles.filterChip, historyFilter === f && styles.filterChipActive]}
                       >
                          <Text style={[styles.filterChipText, historyFilter === f && styles.filterChipTextActive]}>{f}</Text>
                       </TouchableOpacity>
                    ))}
                 </View>
              </View>

              {allRequests.length === 0 ? (
                <Text style={{ textAlign: 'center', color: colors.textGray, marginTop: 40 }}>{t('You have no service requests yet.', 'You have no service requests yet.')}</Text>
              ) : (
                <View>
                  {(historyFilter === 'Today') && todayRequests.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      {todayRequests.map(item => <ServiceCard key={item.RequestID} item={item} />)}
                    </View>
                  )}

                  {(historyFilter === 'Previous') && olderRequests.length > 0 && (
                    <View>
                      {olderRequests.map(item => <ServiceCard key={item.RequestID} item={item} />)}
                    </View>
                  )}

                  {historyFilter === 'Today' && todayRequests.length === 0 && (
                    <Text style={styles.emptyFilterText}>{t('No services scheduled for today.')}</Text>
                  )}

                  {historyFilter === 'Previous' && olderRequests.length === 0 && (
                    <Text style={styles.emptyFilterText}>{t('No previous records found.')}</Text>
                  )}
                </View>
              )}

            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Review Prompt Modal — appears when a new service is completed */}
      {reviewPrompt && (
        <Modal transparent animationType="fade" visible={!!reviewPrompt}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setReviewPrompt(null)}>
                <X size={20} color={colors.textGray} />
              </TouchableOpacity>
              <CheckCircle size={48} color="#10b981" />
              <Text style={styles.modalTitle}>{t('Service Completed!', 'Service Completed!')}</Text>
              <Text style={styles.modalSubtitle}>
                {t('Your service has been completed. Would you like to leave a review?', 'Your service has been completed. Would you like to leave a review?')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: colors.bgGray }]}
                  onPress={() => setReviewPrompt(null)}
                >
                  <Text style={[styles.modalBtnText, { color: colors.textDark }]}>{t('Later', 'Later')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: colors.primaryBlue }]}
                  onPress={() => { setReviewPrompt(null); setActiveTab('Rate'); }}
                >
                  <Text style={[styles.modalBtnText, { color: colors.white }]}>{t('Review Now', 'Review Now')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Invoice Detail Modal */}
      {invoiceItem && (
        <Modal transparent animationType="slide" visible={!!invoiceItem}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { padding: 0, width: '92%', alignItems: 'stretch', maxWidth: 400 }]}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textDark }}>Invoice Details</Text>
                <TouchableOpacity style={{ padding: 8 }} onPress={() => setInvoiceItem(null)}>
                  <X size={22} color={colors.textGray} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 450 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                {/* Service info */}
                <View style={{ backgroundColor: colors.bgGray, padding: 14, borderRadius: 12, marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textDark }}>#{invoiceItem.RequestID} — {invoiceItem.ServiceType}</Text>
                  {invoiceItem.GarageName && (
                     <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.primaryBlue, marginTop: 4 }}>{invoiceItem.GarageName}</Text>
                  )}
                  <Text style={{ fontSize: 12, color: colors.textGray, marginTop: 4 }}>{new Date(invoiceItem.RequestDate).toLocaleDateString()}</Text>
                </View>

                {/* Service cost lines */}
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textGray, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Services</Text>
                {invoiceItem.ServiceType.split(',').map((svc, idx) => {
                  const matched = invoiceCatalog.find(c => c.ServiceName === svc.trim());
                  const price = matched ? Number(matched.Price) : 0;
                  return (
                    <View key={`svc-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <Text style={{ fontSize: 14, color: colors.textDark, fontWeight: '500', flex: 1 }}>{svc.trim()}</Text>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textDark }}>{price.toLocaleString()} ETB</Text>
                    </View>
                  );
                })}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.primaryBlue }}>Service Subtotal</Text>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.primaryBlue }}>{Number(invoiceItem.BaseServicePrice || 0).toLocaleString()} ETB</Text>
                </View>

                {/* Parts section */}
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.textGray, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Parts Used</Text>
                {invoiceLoading ? (
                  <ActivityIndicator color={colors.primaryBlue} style={{ marginVertical: 16 }} />
                ) : invoiceParts.length === 0 ? (
                  <Text style={{ fontSize: 13, color: colors.textGray, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 }}>No parts were used</Text>
                ) : (
                  invoiceParts.map((part, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, color: colors.textDark, fontWeight: '500' }}>{part.ItemName}</Text>
                        <Text style={{ fontSize: 11, color: colors.textGray }}>{part.QuantityUsed} x {Number(part.SellingPrice).toLocaleString()} ETB</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textDark }}>{(part.QuantityUsed * Number(part.SellingPrice)).toLocaleString()} ETB</Text>
                    </View>
                  ))
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 20 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#8b5cf6' }}>Parts Subtotal</Text>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#8b5cf6' }}>{Number(invoiceItem.PartsCost || 0).toLocaleString()} ETB</Text>
                </View>

                {/* Grand total */}
                <View style={{ backgroundColor: colors.primaryBlue, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.white }}>Total</Text>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.white }}>{(Number(invoiceItem.BaseServicePrice || 0) + Number(invoiceItem.PartsCost || 0)).toLocaleString()} ETB</Text>
                </View>
              </ScrollView>

              {/* Close button */}
              <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
                <TouchableOpacity style={{ backgroundColor: colors.bgGray, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' }} onPress={() => setInvoiceItem(null)}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textDark }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.bgGray,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
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
  historyHeader: { marginBottom: 12 },
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
  // Review Prompt Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.white, borderRadius: 20, padding: 32, alignItems: 'center', width: '100%', maxWidth: 340 },
  modalClose: { position: 'absolute', top: 12, right: 12, padding: 4 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 16 },
  modalSubtitle: { fontSize: 14, color: colors.textGray, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: 'bold' },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 },
  sectionHeaderText: { fontSize: 14, fontWeight: 'bold', color: colors.textGray, textTransform: 'uppercase', letterSpacing: 1 },
  filterChipsRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 4 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  filterChipText: { fontSize: 13, fontWeight: '600', color: colors.textGray },
  filterChipTextActive: { color: colors.white },
  emptyFilterText: { textAlign: 'center', color: colors.textGray, marginTop: 40, fontSize: 14, fontStyle: 'italic' },
});
