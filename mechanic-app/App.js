import React from 'react';
import './src/i18n';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

import * as Notifications from 'expo-notifications';
import { navigationRef } from './src/api/navigationRef';

export default function App() {
  React.useEffect(() => {
    // foreground listener
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // response listener (background/tapped)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const { type } = response.notification.request.content.data;

      // Navigate to Notifications or Dashboard if needed
      if (type === 'ASSIGNMENT' || type === 'EMERGENCY_BROADCAST') {
        if (navigationRef.isReady()) {
          navigationRef.navigate('Notifications');
        }
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor={colors.background} />
        <AppNavigator />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
