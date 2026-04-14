import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import apiClient from '../../api/apiClient';
import { useTranslation } from 'react-i18next';

export default function HistoryScreen({ navigation }) {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/services/my-assignments?status=Completed');
      setTasks(response.data);
    } catch (error) {
      console.log('Error fetching history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchHistory();
    });
    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => navigation.navigate('TaskDetail', { task: item })}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.vehicleName}>{item.Model ? `${item.Model} (${item.PlateNumber})` : `Request #${item.RequestID}`}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.AssignmentStatus}</Text>
        </View>
      </View>
      <Text style={styles.taskDesc}>{item.Description || item.ServiceType}</Text>
      <Text style={styles.taskDate}>Finished: {new Date(item.CompletionDate || item.AssignedDate).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('History')}</Text>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList 
            data={tasks}
            keyExtractor={item => item.AssignmentID?.toString() || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No completed tasks found.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.textMain },
  listContainer: { flex: 1, paddingHorizontal: 20 },
  taskCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, marginBottom: 12, opacity: 0.8 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  vehicleName: { color: colors.textMain, fontSize: 18, fontWeight: 'bold' },
  statusBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.success },
  statusText: { color: colors.success, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  taskDesc: { color: colors.textMuted, fontSize: 14, marginBottom: 12 },
  taskDate: { color: colors.textMuted, fontSize: 12 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40 }
});
