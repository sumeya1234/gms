import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { ChevronLeft, ShieldAlert, Send } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import { useFeedbackStore } from '../../store/feedbackStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import showAlert from '../../utils/alert';
import { io } from 'socket.io-client';

export default function AddComplaintScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { garage } = route.params;

  const { user } = useAuthStore();
  const { submitComplaint, isLoading, error, clearError } = useFeedbackStore();

  const [description, setDescription] = useState('');
  const [isEscalated, setIsEscalated] = useState(false);
  const [localError, setLocalError] = useState('');

  const [activeComplaint, setActiveComplaint] = useState(null);
  const [allComplaints, setAllComplaints] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingContext, setLoadingContext] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const scrollViewRef = useRef(null);
  const socketRef = useRef(null);

  const fetchContext = async () => {
    try {
      setLoadingContext(true);
      const response = await api.get('/api/complaints/my-complaints');
      const garageComplaints = response.data.filter(c => c.GarageID === Number(garage.id || garage.GarageID));
      setAllComplaints(garageComplaints);
      if (garageComplaints.length > 0) {
        const latest = garageComplaints[0];
        setActiveComplaint(latest);
        const msgRes = await api.get(`/api/complaints/${latest.ComplaintID}/messages`);
        setMessages(msgRes.data);
      }
    } catch (err) {
      console.warn('Failed to load complaint context', err);
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  useEffect(() => {
    if (activeComplaint) {
      // Always disconnect any existing socket before creating a new one
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const socket = io(api.defaults.baseURL, { transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_complaint_room', { complaintId: activeComplaint.ComplaintID });
      });

      socket.on('receive_complaint_message', (data) => {
        // Normalize both camelCase (socket relay) and PascalCase (REST) shapes
        const normalized = {
          complaintId: Number(data.complaintId ?? data.ComplaintID),
          SenderID: data.SenderID ?? data.senderId,
          Message: data.Message ?? data.message,
          SenderRole: data.SenderRole ?? data.senderRole ?? 'Support',
          SenderName: data.SenderName ?? data.senderName,
          CreatedAt: data.CreatedAt ?? new Date().toISOString(),
        };
        // Use Number() on both sides to avoid string/number strict equality mismatch
        if (normalized.complaintId === Number(activeComplaint.ComplaintID)) {
          setMessages(prev => {
            const alreadyExists = prev.some(
              m => m.Message === normalized.Message && m.SenderID === normalized.SenderID
            );
            if (alreadyExists) return prev;
            return [...prev, normalized];
          });
        }
      });

      socket.on('connect_error', (err) => {
        console.warn('Complaint socket connection error:', err.message);
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [activeComplaint]);

  useEffect(() => {
    clearError();
    setLocalError('');
  }, [description]);

  const handleSubmit = async () => {
    if (description.trim().length < 10) {
      setLocalError(t('Please provide a detailed description (minimum 10 characters)'));
      return;
    }

    const success = await submitComplaint({
      garageId: Number(garage.id || garage.GarageID),
      description: description.trim(),
      isEscalated
    });

    if (success) {
      showAlert(
        t('Report Submitted'),
        t("We've received your report. Management will review it and get back to you in the chat below."),
        [{ text: t('Great!'), onPress: () => { setShowForm(false); fetchContext(); } }]
      );
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeComplaint || isSending) return;
    const msgText = newMessage.trim();
    setIsSending(true);
    setNewMessage(''); // clear immediately for UX
    try {
      await api.post(`/api/complaints/${activeComplaint.ComplaintID}/messages`, { message: msgText });
      
      const socketMsg = {
        complaintId: Number(activeComplaint.ComplaintID),
        SenderID: user.id,
        Message: msgText,
        SenderRole: 'Customer',
        CreatedAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, socketMsg]);

      if (socketRef.current) {
        socketRef.current.emit('send_complaint_message', {
          ...socketMsg,
          senderName: user.fullName
        });
      }
    } catch (err) {
      setNewMessage(msgText); // restore if failed
      showAlert(t('Error'), t('Failed to send message'), [], 'error');
    } finally {
      setIsSending(false);
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Report an Issue')}</Text>
        {activeComplaint && !showForm ? (
          <TouchableOpacity onPress={() => { setShowForm(true); setDescription(''); setIsEscalated(false); }} style={styles.headerRightBtn}>
            <Text style={styles.headerRightText}>{t('+ New')}</Text>
          </TouchableOpacity>
        ) : activeComplaint && showForm ? (
          <TouchableOpacity onPress={() => setShowForm(false)} style={styles.headerRightBtn}>
            <Text style={styles.headerRightText}>{t('Chat')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loadingContext ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : activeComplaint && !showForm ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : null}>
          {allComplaints.length > 1 && (
            <View style={styles.tabContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 16 }}>
                {allComplaints.map((comp, idx) => {
                  const isActive = comp.ComplaintID === activeComplaint.ComplaintID;
                  const isResolved = comp.Status === 'Resolved';
                  return (
                    <TouchableOpacity
                      key={comp.ComplaintID}
                      onPress={async () => {
                        setActiveComplaint(comp);
                        setMessages([]);
                        try {
                          const msgRes = await api.get(`/api/complaints/${comp.ComplaintID}/messages`);
                          setMessages(msgRes.data);
                        } catch (err) {
                          console.warn('Failed to load complaint messages', err);
                        }
                      }}
                      style={[styles.tabButton, isActive && styles.activeTabButton]}
                    >
                      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                        {t('Ticket')} #{allComplaints.length - idx} {isResolved ? `(${t('Resolved')})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.chatDescriptionBanner}>
            <Text style={styles.chatBannerTitle}>{t('Active Support Thread')}</Text>
            <Text style={styles.chatBannerDesc}>{activeComplaint.Description}</Text>
          </View>

          <ScrollView
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          >
            {messages.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.textGray, marginTop: 40 }}>{t('No messages yet. Management will respond soon.')}</Text>
            ) : (
              messages.map((msg, idx) => {
                const isMine = msg.SenderID === user.id;
                return (
                  <View key={idx} style={[styles.messageRow, isMine ? styles.myMessageRow : styles.theirMessageRow]}>
                    <View style={[styles.messageBubble, isMine ? styles.myMessageBubble : styles.theirMessageBubble]}>
                      <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>{msg.Message}</Text>
                      <Text style={[styles.messageTime, isMine ? styles.myMessageTime : styles.theirMessageTime]}>
                        {new Date(msg.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {activeComplaint.Status !== 'Resolved' ? (
          <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatTextInput}
                placeholder={t('Type a message...')}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
                editable={!isSending}
              />
              <TouchableOpacity
                style={[styles.chatSendButton, { backgroundColor: (newMessage.trim() && !isSending) ? '#3b82f6' : colors.bgGray }]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Send size={20} color={newMessage.trim() ? colors.white : colors.textLight} />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ padding: 16, backgroundColor: colors.bgGray, alignItems: 'center' }}>
              <Text style={{ color: colors.textGray, fontStyle: 'italic' }}>{t('This complaint has been resolved by management.')}</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.iconHeader}>
              <View style={styles.shieldWrap}>
                <ShieldAlert size={32} color="#ef4444" />
              </View>
            </View>

            <Text style={styles.title}>{garage?.name}</Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {t('This report is private and will be reviewed directly by the Garage Management team. Please provide as much detail as possible to help us investigate.')}
              </Text>
            </View>

            <Text style={styles.label}>{t('Incident Description')}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder={t('Describe what happened in detail...')}
                placeholderTextColor={colors.textGray}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
              <View style={styles.charCountWrap}>
                <Text style={[styles.charCount, description.trim().length < 10 && description.length > 0 && { color: '#ef4444' }]}>
                  {Math.max(0, 10 - description.trim().length)} {t('chars min remaining')}
                </Text>
              </View>
            </View>

            <View style={styles.escalateWrap}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={styles.escalateTitle}>{t('Escalate to Super Admin')}</Text>
                <Text style={styles.escalateDesc}>{t('Turn this on if you believe this is a severe violation (e.g. fraud, theft, highly unprofessional behavior) and requires top-level system management intervention instead of just the garage manager.')}</Text>
              </View>
              <Switch
                value={isEscalated}
                onValueChange={setIsEscalated}
                trackColor={{ false: '#d1d5db', true: '#ef4444' }}
                thumbColor={isEscalated ? '#fff' : '#fff'}
              />
            </View>

            {displayError ? (
              <Text style={styles.errorText}>{displayError.replace(/"/g, '')}</Text>
            ) : null}

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.bottomFixed}>
            <TouchableOpacity
              style={[styles.submitBtn, (isLoading || description.trim().length < 10) && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isLoading || description.trim().length < 10}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>{t('Submit Private Report')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgGray },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border
  },
  iconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark },
  content: { padding: 24 },
  iconHeader: { alignItems: 'center', marginBottom: 16 },
  shieldWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, textAlign: 'center', marginBottom: 24 },
  infoBox: { backgroundColor: 'rgba(19, 127, 236, 0.1)', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(19, 127, 236, 0.2)' },
  infoText: { color: colors.textDark, fontSize: 14, lineHeight: 22 },
  label: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, marginBottom: 12 },
  inputWrap: { position: 'relative' },
  textArea: {
    backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    height: 180, padding: 16, fontSize: 16, color: colors.textDark, marginBottom: 16
  },
  charCountWrap: { position: 'absolute', bottom: 28, right: 16 },
  charCount: { fontSize: 12, color: colors.textGray },
  errorText: { color: '#ef4444', marginBottom: 16, fontSize: 14, textAlign: 'center' },
  bottomFixed: { backgroundColor: colors.white, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  submitBtn: {
    backgroundColor: '#ef4444', borderRadius: 12, height: 56,
    justifyContent: 'center', alignItems: 'center'
  },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  escalateWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    marginBottom: 16
  },
  escalateTitle: { fontSize: 15, fontWeight: 'bold', color: colors.textDark, marginBottom: 4 },
  escalateDesc: { fontSize: 12, color: colors.textGray, lineHeight: 18 },
  headerRightBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  headerRightText: { fontSize: 14, fontWeight: 'bold', color: '#ef4444' },
  chatDescriptionBanner: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  chatBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ef4444',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chatBannerDesc: {
    color: colors.textDark,
    fontSize: 14,
    lineHeight: 20,
  },
  messageRow: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  myMessageRow: {
    alignSelf: 'flex-end',
  },
  theirMessageRow: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessageBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  theirMessageText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMessageTime: {
    color: '#9ca3af',
  },
  chatInputContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textDark,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chatSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  }
});
