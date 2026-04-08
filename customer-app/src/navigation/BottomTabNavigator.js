import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Home, CheckCircle2, User, Car } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/Dashboard/HomeScreen';
import HistoryScreen from '../screens/Dashboard/HistoryScreen';
import MyVehiclesScreen from '../screens/Vehicles/MyVehiclesScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          minHeight: 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.accentBlue,
        tabBarInactiveTintColor: colors.textGray,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: t('Home'),
          tabBarIcon: ({ color }) => (
            <Home size={24} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{
          title: t('History'),
          tabBarIcon: ({ color }) => (
            <CheckCircle2 size={24} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="VehiclesTab" 
        component={MyVehiclesScreen} 
        options={{
          title: t('Vehicles'),
          tabBarIcon: ({ color }) => (
            <Car size={24} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          title: t('Profile'),
          tabBarIcon: ({ color }) => (
            <User size={24} color={color} />
          )
        }}
      />
    </Tab.Navigator>
  );
}
