import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Car, Plus, Trash2 } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useVehicleStore } from '../../store/vehicleStore';
import showAlert from '../../utils/alert';

export default function MyVehiclesScreen({ navigation }) {
  const { t } = useTranslation();
  const { vehicles, isLoading, fetchVehicles, deleteVehicle } = useVehicleStore();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = (id) => {
    showAlert(
      t('Confirm Deletion'),
      t('Are you sure you want to delete this vehicle? This action cannot be undone.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Delete'), style: 'destructive', onPress: () => deleteVehicle(id) }
      ],
      'confirm'
    );
  };

  const renderVehicle = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.carIconWrapper}>
        <Car color={colors.primaryBlue} size={28} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.plate}>{item.PlateNumber}</Text>
        <Text style={styles.details}>{item.Model} • {item.Type}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.VehicleID || item.id)}>
        <Trash2 color={colors.textGray} size={20} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('My Garage')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddVehicle')}
        >
          <Plus color={colors.yellowBtn} size={24} />
          <Text style={styles.addButtonText}>{t('Add')}</Text>
        </TouchableOpacity>
      </View>

      {isLoading && vehicles.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : vehicles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Car color={colors.textLight} size={64} />
          <Text style={styles.emptyText}>{t('No vehicles found')}</Text>
          <Text style={styles.emptySubtext}>{t('Add a vehicle to make service requests.')}</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item, index) => (item.VehicleID || item.id || index).toString()}
          renderItem={renderVehicle}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgColor,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: colors.primaryBlue,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: colors.yellowBtn,
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  carIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(10, 37, 64, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  plate: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: colors.textDark,
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textGray,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textGray,
    textAlign: 'center',
  }
});
