import React, { useContext, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PagerView from 'react-native-pager-view';
import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/Auth/LoginScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import VerifyOTPScreen from '../screens/Auth/VerifyOTPScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import NotificationScreen from '../screens/Dashboard/NotificationScreen';
import TaskDetailScreen from '../screens/Tasks/TaskDetailScreen';
import HistoryScreen from '../screens/History/HistoryScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator();

const TABS = [
  { key: 'Home', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
  { key: 'History', icon: 'time', iconOutline: 'time-outline', label: 'History' },
  { key: 'Profile', icon: 'person', iconOutline: 'person-outline', label: 'Profile' },
];

function TabNavigator({ navigation }) {
  const { t } = useTranslation();
  const pagerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onPageSelected = useCallback((e) => {
    setActiveIndex(e.nativeEvent.position);
  }, []);

  const goToPage = useCallback((index) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  }, []);

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={onPageSelected}
        overdrag={true}
      >
        <View key="home" style={styles.page}>
          <DashboardScreen navigation={navigation} />
        </View>
        <View key="history" style={styles.page}>
          <HistoryScreen navigation={navigation} />
        </View>
        <View key="profile" style={styles.page}>
          <ProfileScreen navigation={navigation} />
        </View>
      </PagerView>

      {/* Custom Bottom Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: Platform.OS === 'ios' ? 20 : 5 }]}>
        {TABS.map((tab, index) => {
          const isActive = activeIndex === index;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => goToPage(index)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.icon : tab.iconOutline}
                size={24}
                color={isActive ? colors.primary : colors.textMuted}
              />
              <Text style={[
                styles.tabLabel,
                { color: isActive ? colors.primary : colors.textMuted },
                isActive && styles.tabLabelActive
              ]}>
                {t(tab.label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: 'bold',
  },
});

export default function AppNavigator() {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return null; 
  }

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
