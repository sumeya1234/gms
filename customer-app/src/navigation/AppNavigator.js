import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

import AuthNavigator from './AuthNavigator';
import BottomTabNavigator from './BottomTabNavigator';
import SelectVehicleScreen from '../screens/Service/SelectVehicleScreen';
import ServiceDetailsScreen from '../screens/Service/ServiceDetailsScreen';
import ConfirmationScreen from '../screens/Service/ConfirmationScreen';
import AddVehicleScreen from '../screens/Vehicles/AddVehicleScreen';
import TrackServiceScreen from '../screens/Dashboard/TrackServiceScreen';
import GarageDetailScreen from '../screens/Dashboard/GarageDetailScreen';
import ServiceRequestScreen from '../screens/Dashboard/ServiceRequestScreen';

import NotificationScreen from '../screens/Dashboard/NotificationScreen';

import AddReviewScreen from '../screens/Dashboard/AddReviewScreen';
import AddComplaintScreen from '../screens/Dashboard/AddComplaintScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { restoreToken, isRestoring, token } = useAuthStore();

  useEffect(() => {
    restoreToken();
  }, []);

  if (isRestoring) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentBlue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token == null ? (
          // No token found, user isn't signed in
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator}
          />
        ) : (
          // User is signed in
          <Stack.Group>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
            <Stack.Screen name="TrackService" component={TrackServiceScreen} />
            <Stack.Screen name="SelectVehicle" component={SelectVehicleScreen} />
            <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
            <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
            <Stack.Screen name="GarageDetail" component={GarageDetailScreen} />
            <Stack.Screen name="ServiceRequest" component={ServiceRequestScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="AddReview" component={AddReviewScreen} />
            <Stack.Screen name="AddComplaint" component={AddComplaintScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgGray,
  }
});
