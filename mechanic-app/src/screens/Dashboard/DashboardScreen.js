import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import apiClient from '../../api/apiClient';
import { useTranslation } from 'react-i18next';
import { Bell, AlertTriangle } from 'lucide-react-native';

export default function DashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [unreadCount, setUnreadCount] = useState(0);

  const filteredTasks = tasks
    .filter(t => {
      if (activeFilter === 'All') return true;
      return t.AssignmentStatus === activeFilter;
    })
    // Sort: emergency first, then by assigned date desc
    .sort((a, b) => {
      if (b.IsEmergency !== a.IsEmergency) return (b.IsEmergency ? 1 : 0) - (a.IsEmergency ? 1 : 0);
      return new Date(b.AssignedDate) - new Date(a.AssignedDate);
    });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/services/my-assignments');
      setTasks(response.data);
    } catch (error) {
      console.log('Error fetching tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const response = await apiClient.get('/api/users/notifications');
      const unread = response.data.filter(n => !n.IsRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.log('Error fetching notification count', error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTasks();
      fetchNotificationCount();
    });
    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.taskCard, item.IsEmergency && styles.taskCardEmergency]}
      onPress={() => navigation.navigate('TaskDetail', { task: item })}
    >
      {item.IsEmergency && (
        <View style={styles.emergencyBanner}>
          <AlertTriangle size={14} color="#fff" />
          <Text style={styles.emergencyBannerText}>⚡ EMERGENCY — Handle Immediately</Text>
        </View>
      )}
      <View style={styles.taskHeader}>
        <Text style={[styles.vehicleName, item.IsEmergency && { color: '#ff4444' }]}>
          {item.Model ? `${item.Model} (${item.PlateNumber})` : `Request #${item.RequestID}`}
        </Text>
        <View style={[styles.statusBadge, item.AssignmentStatus === 'InProgress' ? styles.statusInProgress : {}]}>
          <Text style={styles.statusText}>{item.AssignmentStatus}</Text>
        </View>
      </View>
      <Text style={styles.taskDesc}>{item.ServiceType}</Text>
      {item.Description ? <Text style={styles.taskDesc} numberOfLines={1}>{item.Description}</Text> : null}
      <Text style={styles.taskDate}>{t('Assigned')}: {new Date(item.AssignedDate).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.userName}>{user?.fullName || 'Mechanic'}</Text>
          <Text style={styles.greeting}>{t('Good Morning')}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')}
          style={styles.notificationBtn}
        >
          <Bell size={24} color={colors.textMain} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{tasks.length}</Text>
          <Text style={styles.statLabel}>{t('Total Jobs')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {tasks.filter(t => t.AssignmentStatus === 'InProgress').length}
          </Text>
          <Text style={styles.statLabel}>{t('In Progress')}</Text>
        </View>
        {tasks.some(t => t.IsEmergency) && (
          <View style={[styles.statBox, styles.statBoxEmergency]}>
            <Text style={[styles.statValue, { color: '#ff4444' }]}>
              {tasks.filter(t => t.IsEmergency).length}
            </Text>
            <Text style={[styles.statLabel, { color: '#ff4444' }]}>🚨 Emergency</Text>
          </View>
        )}
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeaderRow}>
           <Text style={styles.sectionTitle}>{t('Your Tasks')}</Text>
        </View>

        <View style={styles.filterContainer}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {['All', 'Assigned', 'InProgress', 'Completed'].map(f => (
                 <TouchableOpacity 
                    key={f} 
                    style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                    onPress={() => setActiveFilter(f)}
                 >
                    <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                       {t(f === 'InProgress' ? 'In Progress' : f)}
                    </Text>
                 </TouchableOpacity>
              ))}
           </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList 
            data={filteredTasks}
            keyExtractor={item => item.AssignmentID?.toString() || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={<Text style={styles.emptyText}>{t('No tasks assigned yet.')}</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    color: colors.textMuted,
    fontSize: 16,
  },
  userName: {
    color: colors.textMain,
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: colors.error,
    fontWeight: '600',
  },
  notificationBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error || '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    color: colors.textMain,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textMain,
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterContainer: {
    marginBottom: 16,
    marginHorizontal: -20, // To allow edge-to-edge scroll
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff', 
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  taskCardEmergency: {
    borderColor: '#ff4444',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 68, 68, 0.04)',
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ff4444',
    marginHorizontal: -16,
    marginTop: -16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  emergencyBannerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statBoxEmergency: {
    borderColor: '#ff4444',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vehicleName: {
    color: colors.textMain,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusInProgress: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  statusText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  taskDesc: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
  taskDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  }
});
