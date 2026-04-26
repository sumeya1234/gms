import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useVehicleStore } from '../../store/vehicleStore';
import showAlert from '../../utils/alert';

export default function AddVehicleScreen({ navigation }) {
  const { t } = useTranslation();
  const { addVehicle, isLoading } = useVehicleStore();

  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState('');

  const handleAddVehicle = async () => {
    setError('');

    if (!plateNumber.trim() || !model.trim() || !type.trim()) {
      setError(t('All fields are required'));
      return;
    }

    const success = await addVehicle({
      plateNumber: plateNumber,
      model: model,
      type: type
    });

    if (success) {
      showAlert(
        t('Vehicle Added'),
        t('{{model}} has been successfully added to your profile.', { model }),
        [{ text: t('OK'), onPress: () => navigation.goBack() }]
      );
    } else {
      showAlert(t('Error'), t('Failed to add vehicle. Plate number might already exist.'), [], 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color={colors.textDark} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Add Vehicle')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Input
            label={t('Plate Number')}
            placeholder={t('e.g., AA-12345')}
            value={plateNumber}
            onChangeText={setPlateNumber}
            autoCapitalize="characters"
          />

          <Input
            label={t('Vehicle Model')}
            placeholder={t('e.g., Toyota Corolla')}
            value={model}
            onChangeText={setModel}
          />

          <Input
            label={t('Vehicle Type')}
            placeholder={t('e.g., Sedan, SUV, Truck')}
            value={type}
            onChangeText={setType}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('Save Vehicle')}
          onPress={handleAddVehicle}
          disabled={!!isLoading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgColor,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: colors.textDark,
  },
  scrollContent: {
    padding: 24,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  errorText: {
    color: '#ff4444',
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    fontSize: 14,
  },
  footer: {
    padding: 24,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
  }
});
