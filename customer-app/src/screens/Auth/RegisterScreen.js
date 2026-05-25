import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Mail, Lock, User, Phone, CheckCircle, XCircle, Key } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors } from '../../theme/colors';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { register, requestRegistrationOTP, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [localError, setLocalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Clear general errors when user types
  React.useEffect(() => {
    if (error) clearError();
    if (localError) setLocalError('');
  }, [name, phone, email, password, confirmPassword]);

  const updateField = (field, setter, value) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, text: '', color: '#e5e7eb' };
    if (pwd.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score, text: t('Weak'), color: colors.error };
    if (score === 2) return { score, text: t('Medium'), color: '#f59e0b' };
    return { score, text: t('Strong'), color: colors.success };
  };

  const pwdStrength = getPasswordStrength(password);

  const handleRegister = async () => {
    setLocalError('');
    const newFieldErrors = {};

    if (!isOtpSent) {
      if (!name.trim()) {
        newFieldErrors.name = t('fieldRequired', { field: t('Full Name') });
      } else if (name.trim().length < 3) {
        newFieldErrors.name = t('nameTooShort');
      } else if (!/^[a-zA-Z\s\-]+$/.test(name)) {
        newFieldErrors.name = t('onlyLetters', { field: t('Full Name') });
      }

      if (!phone.trim()) {
        newFieldErrors.phone = t('fieldRequired', { field: t('Phone Number') });
      } else if (!/^(09|07)[0-9]{8}$/.test(phone)) {
        newFieldErrors.phone = t('invalidPhone');
      }

      if (!email.trim()) {
        newFieldErrors.email = t('fieldRequired', { field: t('Email') });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newFieldErrors.email = t('invalidEmail');
      }

      if (!password) {
        newFieldErrors.password = t('fieldRequired', { field: t('Password') });
      } else if (password.length < 8) {
        newFieldErrors.password = t('passwordRequirement');
      }

      if (password !== confirmPassword) {
        newFieldErrors.confirmPassword = t('passwordsDoNotMatch');
      }

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        return;
      }

      try {
        await requestRegistrationOTP(email);
        setIsOtpSent(true);
      } catch (err) {
        // Error handled by store
      }
    } else {
      if (!otp || otp.length !== 6) {
        newFieldErrors.otp = t('Verification code must be 6 digits.');
      }

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        return;
      }

      try {
        await register({ name, phone, email, password, otp });
      } catch (err) {
        // Error handled by store
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('Register')}</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!isOtpSent ? (
          <>
            <Input
              label={t("Full Name")}
              placeholder="John Doe"
              value={name}
              onChangeText={(text) => updateField('name', setName, text)}
              leftIcon={<User color={colors.textGray} size={20} />}
              error={fieldErrors.name}
            />

            <Input
              label={t("Phone Number")}
              placeholder="09... or +251..."
              value={phone}
              onChangeText={(text) => updateField('phone', setPhone, text)}
              leftIcon={<Phone color={colors.textGray} size={20} />}
              keyboardType="phone-pad"
              error={fieldErrors.phone}
            />

            <Input
              label={t('Email')}
              placeholder="your@email.com"
              value={email}
              onChangeText={(text) => updateField('email', setEmail, text)}
              leftIcon={<Mail color={colors.textGray} size={20} />}
              keyboardType="email-address"
              error={fieldErrors.email}
            />

            <Input
              label={t('Password')}
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => updateField('password', setPassword, text)}
              secureTextEntry
              leftIcon={<Lock color={colors.textGray} size={20} />}
              error={fieldErrors.password}
            />

            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthSegmentRow}>
                  {[1, 2, 3].map((seg) => (
                    <View
                      key={seg}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor: pwdStrength.score >= seg ? pwdStrength.color : '#e5e7eb'
                        }
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.strengthHeader}>
                  <Text style={[styles.strengthText, { color: pwdStrength.color }]}>
                    {t('passwordStrength')}: {pwdStrength.text}
                  </Text>
                  {pwdStrength.score === 3 && <CheckCircle size={14} color={colors.success} />}
                </View>
                {pwdStrength.score < 3 && (
                  <Text style={styles.guidanceText}>
                    {t('passwordRequirement')}
                  </Text>
                )}
              </View>
            )}

            <Input
              label={t('confirmPassword')}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', setConfirmPassword, text)}
              secureTextEntry
              leftIcon={<Lock color={colors.textGray} size={20} />}
              error={fieldErrors.confirmPassword}
            />

            {!fieldErrors.confirmPassword && confirmPassword.length > 0 && password === confirmPassword && (
              <View style={styles.matchIndicator}>
                <CheckCircle size={14} color={colors.success} />
                <Text style={styles.matchText}>{t('passwordsDoNotMatch').includes('not') ? t('Passwords match') : t('passwordsDoNotMatch')}</Text>
              </View>
            )}

            <Button
              title={t('Send Verification Code')}
              onPress={handleRegister}
              style={{ marginTop: 10 }}
              disabled={isLoading}
              loading={isLoading}
            />
          </>
        ) : (
          <>
            <View style={styles.otpHeader}>
              <Text style={styles.otpSubtitle}>{t('We sent a 6-digit code to')}</Text>
              <Text style={styles.otpEmail}>{email}</Text>
              <Text style={styles.spamNotice}>{t("(Check your spam folder if you can't find it)")}</Text>
            </View>

            <Input
              label={t('Verification Code')}
              placeholder="123456"
              value={otp}
              onChangeText={(text) => updateField('otp', setOtp, text)}
              leftIcon={<Key color={colors.textGray} size={20} />}
              keyboardType="number-pad"
              maxLength={6}
              error={fieldErrors.otp}
            />

            <Button
              title={t('Verify & Register')}
              onPress={handleRegister}
              style={{ marginTop: 10 }}
              disabled={isLoading}
              loading={isLoading}
            />

            <TouchableOpacity
              onPress={() => setIsOtpSent(false)}
              style={styles.backToDetails}
              disabled={isLoading}
            >
              <Text style={styles.backToDetailsText}>{t('Back to details')}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("Already have an account? ")}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerLink}>{t('Login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 40,
    marginTop: 40,
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
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: colors.textGray,
    fontSize: 14,
  },
  footerLink: {
    color: colors.accentBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  strengthContainer: {
    marginBottom: 16,
    width: '100%',
  },
  strengthSegmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    width: '100%',
  },
  strengthSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  guidanceText: {
    fontSize: 11,
    color: colors.textGray,
    fontStyle: 'italic',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  otpHeader: {
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  otpSubtitle: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 4,
  },
  otpEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  spamNotice: {
    fontSize: 12,
    color: colors.textGray,
    marginTop: 8,
    fontStyle: 'italic',
  },
  backToDetails: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
  backToDetailsText: {
    color: colors.textGray,
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});
