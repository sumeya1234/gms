import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOTPScreen({ navigation, route }) {
  const { email, devOtp } = route.params;
  const [otp, setOtp] = useState(devOtp || ''); // Pre-fill in dev mode if provided
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = () => {
    if (otp.length !== 6) {
      setErrorMsg('Please enter the 6-digit code');
      return;
    }
    // In this flow, we just pass the OTP to the final reset screen
    // The backend verification happens during the final reset password call
    navigation.navigate('ResetPassword', { email, otp });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Change Email</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>
        </View>

        <View style={styles.formContainer}>
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#666"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
            <Text style={styles.buttonText}>Verify Code</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resendButton} 
            disabled={timer > 0}
            onPress={() => {/* Re-trigger requestPasswordReset */}}
          >
            <Text style={[styles.resendText, timer > 0 && styles.resendDisabled]}>
              {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  backText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputGroup: {
    marginBottom: 24,
    alignItems: 'center',
  },
  otpInput: {
    backgroundColor: colors.surfaceLight,
    color: colors.textMain,
    borderRadius: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 8,
    paddingVertical: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resendDisabled: {
    color: colors.textMuted,
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  }
});
