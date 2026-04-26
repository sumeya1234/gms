import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import Button from '../../components/Button';
import { useServiceStore } from '../../store/serviceStore';
import { useTranslation } from 'react-i18next';
import showAlert from '../../utils/alert';

export default function ConfirmationScreen({ route, navigation }) {
  const { vehicleId, vehicle, description, address, preferredDate, garageId, serviceType, bookingDate, dropOffTime } = route.params;
  const { createRequest, isLoading } = useServiceStore();
  const { t } = useTranslation();

  const handleConfirm = async () => {
    if (!garageId || !serviceType) {
      showAlert(t('Missing Details'), t('Please book a service from the Home tab by selecting a garage first.'), [], 'info');
      return;
    }
    try {
      const success = await createRequest({
        vehicleId,
        garageId,
        serviceType,
        description,
        bookingDate: bookingDate || preferredDate || null,
        dropOffTime: dropOffTime || null,
        isEmergency: false,
      });
      if (success) {
        showAlert(
          t('Service Requested'),
          t("We've sent your details to the garage. They will update you once they review the request."),
          [{ text: t('Great!'), onPress: () => navigation.navigate('Main') }]
        );
      } else {
        const errorMsg = useServiceStore.getState().error || 'Failed to request service. Please try again.';
        showAlert(t('Booking Error'), t(errorMsg), [], 'error');
      }
    } catch (error) {
      showAlert(t('Error'), t('Failed to request service. Please try again.'), [], 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Confirmation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Brand</Text>
            <Text style={styles.value}>{vehicle?.brand}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Model</Text>
            <Text style={styles.value}>{vehicle?.model}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Plate No</Text>
            <Text style={styles.value}>{vehicle?.plateNumber}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value} numberOfLines={2}>{description}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{address ? `${address.city}` : 'Not provided'}</Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Edit Details"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={{ marginBottom: 10 }}
        />
        <Button
          title={isLoading ? 'Booking...' : "Confirm Book"}
          variant="secondary"
          onPress={handleConfirm}
          disabled={isLoading}
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 1,
    backgroundColor: colors.bgGray,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    color: colors.textGray,
    fontSize: 14,
  },
  value: {
    color: colors.textDark,
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    padding: 24,
    backgroundColor: colors.bgGray,
    paddingBottom: 40,
  }
});
