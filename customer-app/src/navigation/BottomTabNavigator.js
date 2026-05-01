import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useTranslation } from 'react-i18next';
import { Home, CheckCircle2, User, Car } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/Dashboard/HomeScreen';
import HistoryScreen from '../screens/Dashboard/HistoryScreen';
import MyVehiclesScreen from '../screens/Vehicles/MyVehiclesScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const TABS = [
  { key: 'Home', icon: Home, label: 'Home' },
  { key: 'History', icon: CheckCircle2, label: 'History' },
  { key: 'VehiclesTab', icon: Car, label: 'Vehicles' },
  { key: 'ProfileTab', icon: User, label: 'Profile' },
];

export default function BottomTabNavigator({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
          <HomeScreen navigation={navigation} goToPage={goToPage} />
        </View>
        <View key="history" style={styles.page}>
          <HistoryScreen navigation={navigation} />
        </View>
        <View key="vehicles" style={styles.page}>
          <MyVehiclesScreen navigation={navigation} />
        </View>
        <View key="profile" style={styles.page}>
          <ProfileScreen navigation={navigation} />
        </View>
      </PagerView>

      {}
      <View style={[styles.tabBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8 }]}>
        {TABS.map((tab, index) => {
          const isActive = activeIndex === index;
          const IconComponent = tab.icon;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => goToPage(index)}
              activeOpacity={0.7}
            >
              <IconComponent
                size={24}
                color={isActive ? colors.accentBlue : colors.textGray}
              />
              <Text style={[
                styles.tabLabel,
                { color: isActive ? colors.accentBlue : colors.textGray },
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
    backgroundColor: colors.bgGray,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

