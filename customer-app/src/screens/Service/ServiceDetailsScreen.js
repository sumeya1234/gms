import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useLocationStore } from '../../store/locationStore';

export default function ServiceDetailsScreen({ route, navigation }) {
  const { vehicleId, vehicle } = route.params;
  const { requestLocation, address, isLoading: locationLoading } = useLocationStore();
  
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  
  const handleProceed = () => {
    navigation.navigate('Confirmation', {
      vehicleId,
      vehicle,
      description,
      address,
      preferredDate
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.white} size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>Service Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Describe the Problem</Text>
        <Input 
          placeholder="E.g., Engine making weird noise..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top' }}
        />

        <Text style={styles.sectionTitle}>Preferred Date</Text>
        <Input 
          placeholder="YYYY-MM-DD"
          value={preferredDate}
          onChangeText={setPreferredDate}
        />

        <Text style={styles.sectionTitle}>Location Services</Text>
        <View style={styles.locationBox}>
          {address ? (
            <Text style={styles.locationText}>{address.city}, {address.region}</Text>
          ) : (
            <Text style={styles.locationText}>Location not set for pickup/rescue</Text>
          )}
          <TouchableOpacity 
            style={styles.locationBtn} 
            onPress={requestLocation}
            disabled={locationLoading}
          >
            {locationLoading ? <ActivityIndicator size="small" color={colors.accentBlue} /> : <MapPin size={20} color={colors.accentBlue} />}
            <Text style={styles.locationBtnText}>Get Current Location</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Proceed to Confirmation" 
          variant="secondary"
          onPress={handleProceed}
          disabled={!description}
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
    flexGrow: 1,
    backgroundColor: colors.bgGray,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 10,
    marginTop: 20,
  },
  locationBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationText: {
    color: colors.textDark,
    marginBottom: 10,
    fontSize: 14,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  locationBtnText: {
    color: colors.accentBlue,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    backgroundColor: colors.bgGray,
    paddingBottom: 40,
  }
});
