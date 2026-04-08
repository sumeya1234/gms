import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Mail, Lock, User, Phone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors } from '../../theme/colors';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Clear errors when user types
  React.useEffect(() => {
    if (error) clearError();
    if (localError) setLocalError('');
  }, [name, phone, email, password]);

  const handleRegister = async () => {
    setLocalError('');
    if (!name || !email || !password || !phone) {
      setLocalError('Please fill in all fields');
      return;
    }
    try {
      await register({ name, phone, email, password, role: 'customer' });
    } catch (err) {
      // error state handled by zustand
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('Register')}</Text>

        {(error || localError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || localError}</Text>
          </View>
        )}

        <Input 
          label="Full Name"
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
          leftIcon={<User color={colors.textGray} size={20} />}
        />

        <Input 
          label="Phone Number"
          placeholder="+1234567890"
          value={phone}
          onChangeText={setPhone}
          leftIcon={<Phone color={colors.textGray} size={20} />}
          keyboardType="phone-pad"
        />

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

        <Button 
          title={t('Register')}
          onPress={handleRegister}
          style={{ marginTop: 20 }}
          disabled={isLoading}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
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
  }
});
