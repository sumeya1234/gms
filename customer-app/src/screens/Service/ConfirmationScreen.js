import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import Button from '../../components/Button';
import { useServiceStore } from '../../store/serviceStore';

export default function ConfirmationScreen({ route, navigation }) {
  const { vehicleId, vehicle, description, address, preferredDate } = route.params;
  const { createService, isLoading } = useServiceStore();

  const handleConfirm = async () => {
    try {
      await createService({
        vehicleId,
        description,
        location: address ? `${address.city}, ${address.region}` : 'Not Specified',
        preferredDate: preferredDate || new Date().toISOString()
      });
      Alert.alert('Success', 'Service requested successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Main') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to request service');
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
