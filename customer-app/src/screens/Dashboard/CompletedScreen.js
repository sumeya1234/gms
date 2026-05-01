import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useServiceStore } from '../../store/serviceStore';
import JobCard from '../../components/JobCard';
import { colors } from '../../theme/colors';

export default function CompletedScreen() {
  const { t } = useTranslation();
  const { historyServices, fetchHistoryServices, isLoading } = useServiceStore();

  useEffect(() => {
    fetchHistoryServices();
  }, []);

  const onRefresh = () => {
    fetchHistoryServices();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('Completed')}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      >
        <View style={styles.verticalList}>
          {historyServices.length > 0 ? (
            historyServices.map((job) => (
              <View key={job._id} style={styles.cardWrapper}>
                {}
                <JobCard job={job} /> 
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No completed services found.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgGray,
  },
  header: {
    backgroundColor: colors.primaryBlue,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  content: {
    padding: 20,
  },
  verticalList: {
    flex: 1,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 15,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: colors.textGray,
    fontStyle: 'italic',
  }
});
