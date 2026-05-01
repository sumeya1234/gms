import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import apiClient from '../../api/apiClient';
import { AuthContext } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const { t, i18n } = useTranslation();

  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info', buttons: [] });
  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));
  const showAlert = (title, message, type = 'info', buttons = [{ text: 'OK', onPress: closeAlert }]) => {
    setAlertConfig({ visible: true, title, message, type, buttons });
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      showAlert('Error', 'Please enter both old and new passwords.', 'error');
      return;
    }
    setLoadingPassword(true);
    try {
      await apiClient.put('/api/users/password', { oldPassword, newPassword });
      showAlert('Success', 'Password updated successfully!', 'success');
      setPasswordModalVisible(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setLoadingPassword(false);
    }
  };

  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);
    await AsyncStorage.setItem('language', lng);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('Profile')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.fullName || 'Mechanic'}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || 'N/A'}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{user?.phone || 'N/A'}</Text>

        <TouchableOpacity style={styles.changePwdBtn} onPress={() => setPasswordModalVisible(true)}>
          <Text style={styles.changePwdText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('Language')}</Text>
        <View style={styles.langContainer}>
          <TouchableOpacity
            style={[styles.langBtn, i18n.language === 'en' && styles.langBtnActive]}
            onPress={() => changeLanguage('en')}
          >
            <Text style={[styles.langText, i18n.language === 'en' && styles.langTextActive]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, i18n.language === 'am' && styles.langBtnActive]}
            onPress={() => changeLanguage('am')}
          >
            <Text style={[styles.langText, i18n.language === 'am' && styles.langTextActive]}>Amharic</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, i18n.language === 'om' && styles.langBtnActive]}
            onPress={() => changeLanguage('om')}
          >
            <Text style={[styles.langText, i18n.language === 'om' && styles.langTextActive]}>Afaan Oromo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => {
        showAlert(t('Confirm Logout'), t('Are you sure you want to log out?'), 'confirm', [
          { text: t('Cancel'), style: 'cancel', onPress: closeAlert },
          { text: t('Logout'), style: 'destructive', onPress: () => { closeAlert(); logout(); } }
        ]);
      }}>
        <Text style={styles.logoutText}>{t('Logout')}</Text>
      </TouchableOpacity>

      {}
      <Modal visible={isPasswordModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Old Password"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setPasswordModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleChangePassword} disabled={loadingPassword}>
                {loadingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  header: { marginBottom: 20, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.textMain },
  card: { backgroundColor: colors.surface, padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  value: { color: colors.textMain, fontSize: 16, marginBottom: 16, fontWeight: '600' },
  sectionTitle: { color: colors.textMain, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  langContainer: { flexDirection: 'row', gap: 10 },
  langBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, alignItems: 'center' },
  langBtnActive: { backgroundColor: 'rgba(0, 229, 255, 0.1)', borderColor: colors.primary },
  langText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  langTextActive: { color: colors.primary },
  logoutBtn: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.error, alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
  logoutText: { color: colors.error, fontWeight: 'bold', fontSize: 16 },

  changePwdBtn: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.surfaceLight, borderRadius: 8 },
  changePwdText: { color: colors.textMain, fontWeight: '600', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.surface, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: colors.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textMain, marginBottom: 16 },
  input: { backgroundColor: colors.surfaceLight, color: colors.textMain, padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancel: { padding: 12 },
  modalCancelText: { color: colors.textMuted, fontWeight: 'bold' },
  modalSave: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: 'bold' }
});
