import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { signIn, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Clear errors when user types
  React.useEffect(() => {
    if (error) clearError();
    if (localError) setLocalError('');
  }, [email, password]);

  const handleLogin = async () => {
    setLocalError('');
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }
    try {
      await signIn(email, password);
    } catch (err) {
      // error state handled by zustand
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('Login')}</Text>

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

        <Input 
          label={t('Password')}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon={<Lock color={colors.textGray} size={20} />}
        />

        <TouchableOpacity 
          style={styles.forgotPasswordWrap}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>{t('Forgot Password?')}</Text>
        </TouchableOpacity>

        <Button 
          title={t('Login')}
          onPress={handleLogin}
          style={{ marginTop: 20 }}
          disabled={isLoading}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>{t('Register')}</Text>
          </TouchableOpacity>
        </View>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 40,
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
  forgotPasswordWrap: {
    alignItems: 'flex-end',
    marginTop: -8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: colors.accentBlue,
    fontSize: 14,
    fontWeight: '500',
  }
});
