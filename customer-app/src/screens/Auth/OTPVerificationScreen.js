import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Key, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors } from '../../theme/colors';

export default function OTPVerificationScreen({ navigation, route }) {
  const { t } = useTranslation();
  
  const email = route.params?.email || '';
  const autoOtp = route.params?.autoOtp || '';

  const [otp, setOtp] = useState(autoOtp);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (localError) setLocalError('');
  }, [otp]);

  const handleVerify = () => {
    setLocalError('');
    if (!otp) {
      setLocalError('Please enter the OTP code');
      return;
    }
    if (otp.length !== 6) {
      setLocalError('OTP code must be 6 digits');
      return;
    }
    
    
    navigation.navigate('ResetPassword', { email, otp });
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

        <Text style={styles.title}>{t('Verify OTP')}</Text>
        <Text style={styles.subtitle}>
          {t('Enter the 6-digit code sent to')} {email}
        </Text>

        {localError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{localError}</Text>
          </View>
        ) : null}

        <Input 
          label={t('OTP Code')}
          placeholder="123456"
          value={otp}
          onChangeText={setOtp}
          leftIcon={<Key color={colors.textGray} size={20} />}
          keyboardType="number-pad"
          maxLength={6}
        />

        <Button 
          title={t('Verify Code')}
          onPress={handleVerify}
          style={{ marginTop: 24 }}
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
