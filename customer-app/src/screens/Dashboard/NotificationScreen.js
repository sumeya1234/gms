import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { ChevronLeft, Bell, CheckCircle, Trash } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import api from '../../api/client';
import showAlert from '../../utils/alert';

export default function NotificationScreen({ navigation }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/api/users/notifications');
        setNotifications(response.data);
      } catch (err) {
        console.warn('Failed to fetch notifications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/api/users/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.NotificationID === id ? { ...n, IsRead: true } : n));
    } catch (err) {
      console.warn('Failed to mark as read', err);
    }
  };

  const confirmDelete = (id) => {
    showAlert(
      t('Delete Notification'),
      t('Are you sure you want to delete this notification?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Delete'), style: 'destructive', onPress: () => handleDelete(id) }
      ],
      'confirm'
    );
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/users/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.NotificationID !== id));
    } catch (err) {
      console.warn('Failed to delete notification', err);
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    showAlert(
      t('Clear All Notifications'),
      t('Are you sure you want to delete all notifications?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Clear All'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/users/notifications`);
              setNotifications([]);
            } catch (err) {
              console.warn('Failed to clear ALL notifications', err);
              
              notifications.forEach(n => api.delete(`/api/users/notifications/${n.NotificationID}`).catch(() => { }));
              setNotifications([]);
            }
          }
        }
      ],
      'confirm'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Notifications')}</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
            <Text style={styles.clearAllText}>{t('Clear All')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginTop: 50 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.iconCircle}>
              <Bell size={48} color={colors.primaryBlue} />
            </View>
            <Text style={styles.emptyTitle}>{t('No notifications yet')}</Text>
            <Text style={styles.emptySub}>{t("We'll notify you when your service request is updated")}</Text>
          </View>
        ) : (
          notifications.map(notif => (
            <TouchableOpacity
              key={notif.NotificationID}
              style={[styles.notifCard, !notif.IsRead && styles.unreadCard]}
              onPress={() => !notif.IsRead && handleMarkRead(notif.NotificationID)}
              activeOpacity={0.7}
            >
              <View style={styles.notifIcon}>
                {notif.IsRead ? <CheckCircle size={20} color={colors.textGray} /> : <Bell size={20} color={colors.primaryBlue} />}
              </View>
              <View style={styles.notifBody}>
                <Text style={[styles.notifTitle, !notif.IsRead && styles.unreadText]}>{notif.Title}</Text>
                <Text style={styles.notifMsg}>{notif.Message}</Text>
                <Text style={styles.notifTime}>{new Date(notif.CreatedAt).toLocaleString()}</Text>
              </View>
              <TouchableOpacity onPress={() => confirmDelete(notif.NotificationID)} style={{ padding: 4, justifyContent: 'center' }}>
                <Trash size={20} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgGray,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyState: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  notifCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  notifIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notifBody: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
    color: colors.primaryBlue,
  },
  notifMsg: {
    fontSize: 14,
    color: colors.textGray,
    lineHeight: 20,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
