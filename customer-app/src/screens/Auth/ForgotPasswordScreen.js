import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Mail, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useTranslation();
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');

  React.useEffect(() => {
    if (error) clearError();
    if (localError) setLocalError('');
  }, [email]);

  const handleSendOTP = async () => {
    setLocalError('');
    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }
    
    try {
      const otpValue = await forgotPassword(email);
      
      navigation.navigate('OTPVerification', { email, autoOtp: otpValue });
    } catch (err) {
      
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.textDark} />
        </TouchableOpacity>

        <Text style={styles.title}>{t('Reset Password')}</Text>
        <Text style={styles.subtitle}>
          {t('Enter your email address and we will send you an OTP to reset your password.')}
        </Text>

        {(error || localError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || localError}</Text>
          </View>
        )}

        <Input 
          label={t('Email')}
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          leftIcon={<Mail color={colors.textGray} size={20} />}
          keyboardType="email-address"
        />

        <Button 
          title={t('Send OTP')}
          onPress={handleSendOTP}
          style={{ marginTop: 20 }}
          disabled={isLoading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textGray,
    marginBottom: 32,
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  }
});
