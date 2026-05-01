import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, Platform, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../locale/i18n';
import { useAuthStore } from '../../store/authStore';
import { Camera, ChevronLeft, ArrowRight, Calendar, User as UserIcon, Mail, Phone, Lock, HelpCircle, LogOut } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, signOut, restoreToken } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const handleLogout = async () => {
    await signOut();
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      // Save
      try {
        await require('../../api/client').default.put('/api/users/profile', {
          fullName: editName,
          phone: editPhone
        });
        await restoreToken(); // pulls fresh user data
        setIsEditing(false);
      } catch (err) {
        console.warn('Failed to update profile', err);
      }
    } else {
      setEditName(user?.fullName || "John Doe");
      setEditPhone(user?.phone || "+1 (555) 123-4567");
      setIsEditing(true);
    }
  };

  const AVATAR_COLORS = ['#137fec', '#e74c3c', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#3498db', '#e91e63', '#00bcd4', '#ff5722'];
  const fullName = user?.fullName ? user.fullName : "User";
  const colorIndex = fullName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[colorIndex];
  const avatarInitial = fullName.charAt(0).toUpperCase();

  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotif, setLatestNotif] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await require('../../api/client').default.get('/api/users/notifications');
        const unread = response.data.filter(n => !n.IsRead);
        setUnreadCount(unread.length);
        if (unread.length > 0) {
          setLatestNotif(unread[0]);
        }
      } catch (err) {
        console.warn('Failed to load notifications', err);
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      fetchNotifications();
    });

    fetchNotifications();
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {}
      <View style={styles.header}>
        <View style={styles.iconButton} />
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editBtn} onPress={handleEditToggle}>
          <Text style={styles.editBtnText}>{isEditing ? t('Save') : t('Edit')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: avatarColor, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 44 }}>{avatarInitial}</Text>
            </View>
            <TouchableOpacity style={styles.cameraBtn}>
              <Camera size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{fullName}</Text>
          <View style={styles.roleWrap}>
            <CarFrontIcon />
            <Text style={styles.roleText}>Vehicle Owner</Text>
          </View>
        </View>

        {}
        {unreadCount > 0 && latestNotif && (
          <View style={styles.banner}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerHead}>
                <View style={styles.pulseDot} />
                <Text style={styles.bannerTitle}>{unreadCount} NEW UPDATE{unreadCount > 1 ? 'S' : ''}</Text>
              </View>
              <Text style={styles.bannerSub} numberOfLines={2}>{latestNotif.Message}</Text>
              <TouchableOpacity style={styles.bannerLink} onPress={() => navigation.navigate('Notifications')}>
                <Text style={styles.bannerLinkText}>View Details</Text>
                <ArrowRight size={14} color={colors.primaryBlue} />
              </TouchableOpacity>
            </View>
            <Image source={{ uri: "https://images.unsplash.com/photo-1632823438641-69279dc60db7?auto=format&fit=crop&w=150&q=80" }} style={styles.bannerImg} />
          </View>
        )}

        {}
        <Text style={styles.sectionTitle}>{t('Account Details')}</Text>
        <View style={styles.formGroup}>
          <View style={styles.formRow}>
            <UserIcon size={20} color={colors.textGray} />
            <View style={styles.inputWrap}>
              <Text style={styles.label}>{t('Full Name')}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInputEdit}
                  value={editName}
                  onChangeText={setEditName}
                />
              ) : (
                <Text style={styles.inputValue}>{fullName}</Text>
              )}
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.formRow}>
            <Mail size={20} color={colors.textGray} />
            <View style={styles.inputWrap}>
              <Text style={styles.label}>{t('Email')}</Text>
              <Text style={styles.inputValue}>{user?.email || "john.doe@example.com"}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.formRow}>
            <Phone size={20} color={colors.textGray} />
            <View style={styles.inputWrap}>
              <Text style={styles.label}>{t('Phone')}</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInputEdit}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.inputValue}>{user?.phone || "+1 (555) 123-4567"}</Text>
              )}
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.formRow}>
            <Lock size={20} color={colors.textGray} />
            <View style={styles.inputWrap}>
              <Text style={styles.label}>{t('Password')}</Text>
              <Text style={styles.inputValue}>••••••••</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />

        {}
        <Text style={styles.sectionTitle}>{t('Preferences')}</Text>
        <View style={[styles.formGroup, { paddingVertical: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            {[
              { code: 'en', label: 'English' },
              { code: 'am', label: 'አማርኛ' },
              { code: 'om', label: 'Afaan Oromo' }
            ].map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langBtn,
                  i18n.language === lang.code && styles.langBtnActive
                ]}
                onPress={() => i18n.changeLanguage(lang.code)}
              >
                <Text style={[
                  styles.langBtnText,
                  i18n.language === lang.code && styles.langBtnTextActive
                ]}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />

        {}
        <TouchableOpacity style={styles.helpBtn}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <HelpCircle size={20} color={colors.textGray} />
            <Text style={styles.helpText}>{t('Help & Support', 'Help & Support')}</Text>
          </View>
          <ChevronLeft style={{ transform: [{ rotate: '180deg' }] }} size={20} color={colors.textGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>{t('Logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


function CarFrontIcon() {
  return (
    <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: colors.bgGray, justifyContent: 'center', alignItems: 'center', marginRight: 4 }}>
      <Text style={{ fontSize: 10 }}>🚗</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgGray,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white
  },
  iconButton: { width: 40, height: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark },
  editBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  editBtnText: { color: colors.primaryBlue, fontWeight: 'bold', fontSize: 16 },
  content: { padding: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: colors.white },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primaryBlue, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.white },
  userName: { fontSize: 24, fontWeight: 'bold', color: colors.textDark, marginTop: 12 },
  roleWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  roleText: { fontSize: 14, color: colors.textGray, fontWeight: '500' },
  banner: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  bannerContent: { flex: 1, paddingRight: 12, justifyContent: 'center' },
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryBlue },
  bannerTitle: { fontSize: 12, fontWeight: 'bold', color: colors.textDark, letterSpacing: 0.5 },
  bannerSub: { fontSize: 14, color: colors.textGray, lineHeight: 20, marginBottom: 8 },
  bannerLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bannerLinkText: { fontSize: 14, fontWeight: 'bold', color: colors.primaryBlue },
  bannerImg: { width: 80, height: 80, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginBottom: 12, marginLeft: 4 },
  formGroup: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  formRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  inputWrap: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  inputValue: { fontSize: 16, fontWeight: '500', color: colors.textDark },
  textInputEdit: { fontSize: 16, fontWeight: '500', color: colors.textDark, padding: 0, borderBottomWidth: 1, borderBottomColor: colors.primaryBlue },
  divider: { height: 1, backgroundColor: colors.bgGray },
  helpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  helpText: { fontSize: 16, fontWeight: '500', color: colors.textDark },
  langBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.bgGray, borderWidth: 1, borderColor: colors.border },
  langBtnActive: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  langBtnText: { fontSize: 13, fontWeight: '600', color: colors.textGray },
  langBtnTextActive: { color: colors.white },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#fca5a5', gap: 8 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' }
});
