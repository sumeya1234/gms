import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { ChevronLeft, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import { useFeedbackStore } from '../../store/feedbackStore';
import CustomAlert from '../../components/CustomAlert';

export default function AddReviewScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { garage } = route.params;

  const { submitReview, isLoading, error, clearError } = useFeedbackStore();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    clearError();
    setLocalError('');
  }, [rating, comment]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setLocalError(t('Please select a star rating'));
      return;
    }

    
    const success = await submitReview({
      garageId: Number(garage.id || garage.GarageID),
      rating,
      comment: comment.trim()
    });

    if (success) {
      showAlert(
        t('Thank You'),
        t('Your feedback helps us and specifically {{garageName}} improve their services.', { garageName: garage.name }),
        [{ text: t('OK'), onPress: () => navigation.goBack() }]
      );
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Write a Review', 'Write a Review')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{garage?.name}</Text>
        <Text style={styles.subtitle}>{t('How was your service experience?', 'How was your service experience?')}</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.8}>
              <Star
                size={40}
                color={star <= rating ? "#eab308" : colors.border}
                fill={star <= rating ? "#eab308" : "transparent"}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('Share your experience (Optional)', 'Share your experience (Optional)')}</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder={t('Tell us about the quality, timeliness, and mechanics...', 'Tell us about the quality, timeliness, and mechanics...')}
          placeholderTextColor={colors.textGray}
          value={comment}
          onChangeText={setComment}
          textAlignVertical="top"
        />

        {displayError ? (
          <Text style={styles.errorText}>{displayError.replace(/"/g, '')}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>{t('Submit Review', 'Submit Review')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border
  },
  iconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark },
  content: { padding: 24, flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.textDark, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textGray, textAlign: 'center', marginBottom: 32 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 40 },
  label: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, marginBottom: 12 },
  textArea: {
    backgroundColor: colors.bgGray, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    height: 150, padding: 16, fontSize: 16, color: colors.textDark, marginBottom: 16
  },
  errorText: { color: '#ef4444', marginBottom: 16, fontSize: 14, textAlign: 'center' },
  submitBtn: {
    backgroundColor: colors.primaryBlue, borderRadius: 12, height: 56,
    justifyContent: 'center', alignItems: 'center', marginTop: 'auto', marginBottom: 20
  },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' }
});
