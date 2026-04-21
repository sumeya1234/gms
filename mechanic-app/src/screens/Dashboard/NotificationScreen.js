import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, StatusBar } from 'react-native';
import { ChevronLeft, Bell, CheckCircle, Trash } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import apiClient from '../../api/apiClient';

export default function NotificationScreen({ navigation }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/api/users/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await apiClient.put(`/api/users/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.NotificationID === id ? { ...n, IsRead: true } : n));
    } catch (err) {
      console.warn('Failed to mark as read', err);
    }
  };

  const confirmDelete = (id) => {
    Alert.alert(
      t('Delete Notification'),
      t('Are you sure you want to delete this notification?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Delete'), style: 'destructive', onPress: () => handleDelete(id) }
      ]
    );
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/users/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.NotificationID !== id));
    } catch (err) {
      console.warn('Failed to delete notification', err);
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      t('Clear All Notifications'),
      t('Are you sure you want to delete all notifications?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { 
          text: t('Clear All'), 
          style: 'destructive', 
          onPress: async () => {
             try {
               await apiClient.delete(`/api/users/notifications`);
               setNotifications([]);
             } catch (err) {
               console.warn('Failed to clear ALL notifications', err);
               setNotifications([]);
             }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.textMain} />
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
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.iconCircle}>
              <Bell size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('No notifications yet')}</Text>
            <Text style={styles.emptySub}>{t("We'll notify you when you receive new task assignments")}</Text>
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
                {notif.IsRead ? <CheckCircle size={20} color={colors.textMuted} /> : <Bell size={20} color={colors.primary} />}
              </View>
              <View style={styles.notifBody}>
                <Text style={[styles.notifTitle, !notif.IsRead && styles.unreadText]}>{notif.Title}</Text>
                <Text style={styles.notifMsg}>{notif.Message}</Text>
                <Text style={styles.notifTime}>{new Date(notif.CreatedAt).toLocaleString()}</Text>
              </View>
              <TouchableOpacity onPress={() => confirmDelete(notif.NotificationID)} style={{ padding: 4, justifyContent: 'center' }}>
                <Trash size={20} color={colors.error || "#ef4444"} />
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
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
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
    color: colors.textMain,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textMain,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  notifCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadCard: {
    backgroundColor: colors.surfaceLight || '#eff6ff',
    borderColor: colors.primary,
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
    color: colors.textMain,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  notifMsg: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 12,
    color: colors.textMuted,
    opacity: 0.7,
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    color: colors.error || '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
