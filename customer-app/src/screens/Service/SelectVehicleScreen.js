import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, Car } from 'lucide-react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';

export default function SelectVehicleScreen({ navigation }) {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    // Fetch user's vehicles or available vehicles
    const fetchVehicles = async () => {
      try {
        const response = await apiClient.get('/api/vehicles');
        setVehicles(response.data.data);
      } catch (err) {
        console.error('Failed to fetch vehicles', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleNext = () => {
    if (selectedVehicle) {
      navigation.navigate('ServiceDetails', { vehicleId: selectedVehicle._id, vehicle: selectedVehicle });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.white} size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>Select Vehicle</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Input
          placeholder="Search your vehicles..."
          leftIcon={<Search color={colors.textGray} size={20} />}
        />

        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.grid}>
            {vehicles.map((v) => {
              const isSelected = selectedVehicle?._id === v._id;
              return (
                <TouchableOpacity
                  key={v._id}
                  style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                  onPress={() => setSelectedVehicle(v)}
                >
                  <View style={[styles.circleIcon, isSelected && styles.circleIconSelected]}>
                    <Car color={isSelected ? colors.textDark : colors.textGray} size={24} />
                  </View>
                  <Text style={styles.gridLabel}>{v.brand} {v.model}</Text>
                  <Text style={styles.plateLabel}>{v.plateNumber}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title="Cancel"
          variant="outline"
          style={{ flex: 1 }}
          onPress={() => navigation.goBack()}
        />
        <Button
          title="Next"
          style={{ flex: 1 }}
          variant="secondary"
          disabled={!selectedVehicle}
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBlue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: colors.bgGray,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemSelected: {
    borderColor: colors.yellowBtn,
  },
  circleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.bgGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  circleIconSelected: {
    backgroundColor: colors.yellowBtn,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  plateLabel: {
    fontSize: 12,
    color: colors.textGray,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    backgroundColor: colors.bgGray,
    paddingBottom: 40,
  }
});
