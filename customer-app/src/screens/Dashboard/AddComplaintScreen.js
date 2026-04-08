import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { ChevronLeft, ShieldAlert, FileText } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import { useFeedbackStore } from '../../store/feedbackStore';

export default function AddComplaintScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { garage } = route.params;

  const { submitComplaint, isLoading, error, clearError } = useFeedbackStore();

  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState('');

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
      description: description.trim()
    });

    if (success) {
      Alert.alert(t('Report Submitted'), t('Management has received your report and will investigate securely.'));
      navigation.goBack();
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
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' }
});
