import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import { useUIStore } from '../store/uiStore';
import CustomAlert from '../components/CustomAlert';

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
import EmergencyScreen from '../screens/Dashboard/EmergencyScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { restoreToken, isRestoring, token } = useAuthStore();
  const alert = useUIStore((state) => state.alert);
  const hideAlert = useUIStore((state) => state.hideAlert);

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
          
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
          />
        ) : (
          
          <Stack.Group>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
            <Stack.Screen name="TrackService" component={TrackServiceScreen} />
            <Stack.Screen name="SelectVehicle" component={SelectVehicleScreen} />
            <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
            <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
            <Stack.Screen name="GarageDetail" component={GarageDetailScreen} />
            <Stack.Screen name="ServiceRequest" component={ServiceRequestScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="AddReview" component={AddReviewScreen} />
            <Stack.Screen name="AddComplaint" component={AddComplaintScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttons={alert.buttons}
      />
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
