import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { ChevronLeft, ShieldAlert, Send } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import { useFeedbackStore } from '../../store/feedbackStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import showAlert from '../../utils/alert';

export default function AddComplaintScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { garage } = route.params;

  const { user } = useAuthStore();
  const { submitComplaint, isLoading, error, clearError } = useFeedbackStore();

  const [description, setDescription] = useState('');
  const [isEscalated, setIsEscalated] = useState(false);
  const [localError, setLocalError] = useState('');

  const [activeComplaint, setActiveComplaint] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingContext, setLoadingContext] = useState(true);
  const scrollViewRef = useRef(null);

  const fetchContext = async () => {
    try {
      setLoadingContext(true);
      const response = await api.get('/api/complaints/my-complaints');
      const garageComplaints = response.data.filter(c => c.GarageID === Number(garage.id || garage.GarageID));
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
        [{ text: t('Great!'), onPress: () => fetchContext() }]
      );
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeComplaint) return;
    try {
      await api.post(`/api/complaints/${activeComplaint.ComplaintID}/messages`, { message: newMessage.trim() });
      setNewMessage('');
      const msgRes = await api.get(`/api/complaints/${activeComplaint.ComplaintID}/messages`);
      setMessages(msgRes.data);
    } catch (err) {
      showAlert(t('Error'), t('Failed to send message'), [], 'error');
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Report an Issue', 'Report an Issue')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loadingContext ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : activeComplaint ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : null}>
          {}
          <View style={{ padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderBottomWidth: 1, borderBottomColor: 'rgba(239, 68, 68, 0.1)' }}>
            <Text style={{ fontWeight: 'bold', color: '#ef4444', marginBottom: 4 }}>Report #{activeComplaint.ComplaintID} ({activeComplaint.Status})</Text>
            <Text style={{ color: colors.textDark, fontSize: 13, lineHeight: 18 }}>{activeComplaint.Description}</Text>
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
                  <View key={idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '80%', marginBottom: 12 }}>
                    <View style={{ backgroundColor: isMine ? colors.primaryBlue : colors.white, padding: 12, borderRadius: 16, borderBottomRightRadius: isMine ? 4 : 16, borderBottomLeftRadius: isMine ? 16 : 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                      <Text style={{ color: isMine ? colors.white : colors.textDark }}>{msg.Message}</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: colors.textLight, marginTop: 4, alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
                      {new Date(msg.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {isMine ? 'You' : msg.SenderRole}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {activeComplaint.Status !== 'Resolved' ? (
            <View style={{ padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{ flex: 1, backgroundColor: colors.bgGray, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.textDark, marginRight: 12 }}
                placeholder={t('Type a message...')}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: newMessage.trim() ? colors.primaryBlue : colors.bgGray, justifyContent: 'center', alignItems: 'center' }}
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send size={20} color={newMessage.trim() ? colors.white : colors.textLight} />
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
                {t('This report is private and will be reviewed directly by the Garage Management team. Please provide as much detail as possible to help us investigate.', 'This report is private and will be reviewed directly by the Garage Management team. Please provide as much detail as possible to help us investigate.')}
              </Text>
            </View>

            <Text style={styles.label}>{t('Incident Description', 'Incident Description')}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder={t('Describe what happened in detail...', 'Describe what happened in detail...')}
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
                <Text style={styles.submitBtnText}>{t('Submit Private Report', 'Submit Private Report')}</Text>
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
  escalateDesc: { fontSize: 12, color: colors.textGray, lineHeight: 18 }
});
