import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Keyboard, Linking, Platform, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, ChevronDown, AlertCircle, Bell, Map as MapIcon, List as ListIcon, X, HelpCircle } from 'lucide-react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';

import ServiceChip from '../../components/ServiceChip';
import GarageCard from '../../components/GarageCard';
import Skeleton from '../../components/Skeleton';
import FloatingHint from '../../components/FloatingHint';
import { Wrench } from 'lucide-react-native';

const SERVICE_CATEGORIES = ['Towing', 'General Diagnosis', 'Tires', 'Oil Change', 'Repair', 'Battery', 'Electrical'];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function HomeScreen({ navigation, goToPage }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { location, address, requestLocation } = useLocationStore();

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Nearest');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmergencyHint, setShowEmergencyHint] = useState(false);
  const [showDiagnosticHint, setShowDiagnosticHint] = useState(false);

  const resolveLocationName = () => {
    if (!address) return t('Pending GPS...');
    const localName = address.district || address.street || address.name || '';
    const cityName = address.city || address.subregion || address.region || '';
    return localName && cityName ? `${localName}, ${cityName}` : (localName || cityName || t('Unknown Location'));
  };
  const locationName = resolveLocationName();
  const userCoords = location?.coords || null;


  const AVATAR_COLORS = ['#137fec', '#e74c3c', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#3498db', '#e91e63', '#00bcd4', '#ff5722'];
  const nameStr = user?.fullName || user?.firstName || t('User');
  const colorIndex = nameStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[colorIndex];
  const avatarInitial = nameStr.charAt(0).toUpperCase();

  useEffect(() => {
    if (!location) {
      requestLocation();
    }

    const fetchGarages = async () => {
      try {
        const response = await apiClient.get('/api/garages');

        const mapped = response.data.map(g => {
          const realServices = (g.Services || []).map(s => s.ServiceName);

          let displayImage = "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=800&q=80";
          const logo = g.LogoUrl || g.logoUrl;
          const rawImages = g.Images || g.images;

          if (logo && logo.trim() !== "") {
            displayImage = logo;
          } else if (rawImages) {
            try {
              const parsedImages = typeof rawImages === 'string' ? JSON.parse(rawImages) : rawImages;
              if (Array.isArray(parsedImages) && parsedImages.length > 0 && parsedImages[0]) {
                displayImage = parsedImages[0];
              }
            } catch (e) {
              console.warn("Failed to parse garage images", e);
            }
          }

          return {
            id: g.GarageID.toString(),
            name: g.Name,
            imageUrl: displayImage,
            Images: g.Images,
            LogoUrl: g.LogoUrl,
            rating: Number(g.AverageRating || 0).toFixed(1),
            reviews: g.TotalReviews || 0,
            isVerified: g.GarageID % 2 === 0,
            distance: (0.5 + (g.GarageID % 5) * 0.8).toFixed(1),
            availability: g.Availability || t('Closed'),
            services: realServices,
            serviceDetails: g.Services || [],
            startingPrice: Number(g.MinPrice) || 0,
            workingHours: typeof g.WorkingHours === 'string' ? JSON.parse(g.WorkingHours) : g.WorkingHours,
            timezone: g.Timezone || 'Africa/Addis_Ababa',
            contactNumber: g.ContactNumber || '',
            address: g.Location || '',
            location: {
              latitude: Number(g.Latitude) || (9.0222 + (g.GarageID * 0.002)),
              longitude: Number(g.Longitude) || (38.7468 + (g.GarageID * 0.002))
            }
          };
        });
        setGarages(mapped);
      } catch (err) {
        console.warn("Failed to fetch garages", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGarages();


    const fetchUnread = async () => {
      try {
        const res = await apiClient.get('/api/users/notifications');
        const count = (res.data || []).filter(n => !n.IsRead).length;
        setUnreadCount(count);
      } catch (e) {

      }
    };

    const checkHints = async () => {
      try {
        const emergencySeen = await AsyncStorage.getItem('hint_emergency_seen');
        const diagnosticSeen = await AsyncStorage.getItem('hint_diagnostic_seen');

        if (!emergencySeen) {
          setShowEmergencyHint(true);
        } else if (!diagnosticSeen) {
          setShowDiagnosticHint(true);
        }
      } catch (e) {
        console.warn("Failed to check hints", e);
      }
    };

    fetchUnread();
    checkHints();


    const unsubscribe = navigation.addListener('focus', () => {
      fetchUnread();
    });

    const timer = setInterval(fetchUnread, 30000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [navigation]);

  const dismissHint = async (key) => {
    try {
      await AsyncStorage.setItem(`hint_${key}_seen`, 'true');
      if (key === 'emergency') {
        setShowEmergencyHint(false);
        // Show next hint after a small delay
        const diagnosticSeen = await AsyncStorage.getItem('hint_diagnostic_seen');
        if (!diagnosticSeen) {
          setTimeout(() => setShowDiagnosticHint(true), 1200);
        }
      }
      if (key === 'diagnostic') setShowDiagnosticHint(false);
    } catch (e) {
      console.warn("Failed to dismiss hint", e);
    }
  };

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const openDirections = (garage) => {
    const lat = garage.location?.latitude;
    const lng = garage.location?.longitude;
    const label = encodeURIComponent(garage.name || 'Garage');
    if (!lat || !lng) return;

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`
    });

    if (url) Linking.openURL(url);
  };


  const filteredGarages = garages.filter(g => {
    if (selectedCategories.length === 0) return true;
    return selectedCategories.every(cat => g.services.includes(cat));
  }).filter(g => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.services.some(s => s.toLowerCase().includes(q))
    );
  }).map(g => {
    let finalPrice = g.startingPrice;
    if (selectedCategories.length > 0 && g.serviceDetails) {
      finalPrice = g.serviceDetails
        .filter(s => selectedCategories.includes(s.ServiceName))
        .reduce((sum, s) => sum + Number(s.Price), 0);
    }

    let dist = g.distance;
    if (userCoords && g.location) {
      dist = calculateDistance(userCoords.latitude, userCoords.longitude, g.location.latitude, g.location.longitude).toFixed(1);
    }

    return { ...g, startingPrice: finalPrice, distance: dist };
  }).sort((a, b) => {
    if (sortBy === 'Lowest Price') {
      return a.startingPrice - b.startingPrice;
    }
    return parseFloat(a.distance) - parseFloat(b.distance);
  });

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      { }
      <View style={[styles.headerWrapper, { paddingTop: 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingText}>
              {t('Hello')}, {nameStr.split(' ')[0]}
            </Text>
            <TouchableOpacity style={styles.locationSelector} onPress={() => navigation.navigate('LocationSelector')}>
              <MapPin size={14} color={colors.primaryBlue} />
              <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
              <ChevronDown size={14} color={colors.textGray} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
              <Bell size={22} color={colors.textDark} />
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.avatarButton, { backgroundColor: avatarColor }]} onPress={() => { if (goToPage) goToPage(3); else navigation.getParent()?.navigate('Profile'); }}>
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          { }
          <View style={styles.searchWrapper}>
            <Skeleton width="100%" height={48} borderRadius={12} />
          </View>
          { }
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Skeleton width="100%" height={48} borderRadius={12} />
          </View>
          { }
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 }}>
            <Skeleton width={60} height={32} borderRadius={16} style={{ marginRight: 8 }} />
            <Skeleton width={90} height={32} borderRadius={16} style={{ marginRight: 8 }} />
            <Skeleton width={100} height={32} borderRadius={16} />
          </View>
          { }
          <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 24 }}>
            <Skeleton width="100%" height={120} borderRadius={16} />
            <Skeleton width="100%" height={120} borderRadius={16} />
            <Skeleton width="100%" height={120} borderRadius={16} />
          </View>
        </ScrollView>
      ) : activeView === 'list' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header Title section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>{t('homeTitle1')} {"\n"}<Text style={{ color: colors.primaryBlue }}>{t('homeTitle2')}</Text> {t('homeTitle3')}</Text>
          </View>

          { }
          <View style={styles.searchWrapper}>
            <View style={styles.searchInput}>
              <Search color={colors.primaryBlue} size={22} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.searchTextInput}
                placeholder={t('Find service, repair, or garage...')}
                placeholderTextColor={colors.textGray}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <X size={18} color={colors.textGray} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Emergency Assistance UI moved to FAB */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            <ServiceChip
              title={t('All')}
              isSelected={selectedCategories.length === 0}
              onPress={() => setSelectedCategories([])}
            />
            {SERVICE_CATEGORIES.map(category => (
              <ServiceChip
                key={category}
                title={t(category)}
                isSpecial={category === 'General Diagnosis'}
                isSelected={selectedCategories.includes(category)}
                onPress={() => toggleCategory(category)}
              />
            ))}
          </ScrollView>

          { }
          <View style={[styles.viewToggleWrapper, { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderRadius: 8, padding: 2, borderWidth: 1, borderColor: colors.border }}>
              <TouchableOpacity onPress={() => setSortBy('Nearest')} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: sortBy === 'Nearest' ? colors.primaryBlue : 'transparent', borderRadius: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: sortBy === 'Nearest' ? colors.white : colors.textGray }}>{t('Nearest')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSortBy('Lowest Price')} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: sortBy === 'Lowest Price' ? colors.primaryBlue : 'transparent', borderRadius: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: sortBy === 'Lowest Price' ? colors.white : colors.textGray }}>{t('Price')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.listContainer}>
            {filteredGarages.map((garage) => (
              <GarageCard
                key={garage.id}
                item={garage}
                onPress={() => navigation.navigate('GarageDetail', { garage, intentServices: selectedCategories })}
              />
            ))}
            {filteredGarages.length === 0 && (
              <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textGray }}>
                {t('No garages match all selected services.')}
              </Text>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <View style={styles.mapContainerFull}>
          <MapView
            style={styles.mapFull}
            initialRegion={{
              latitude: userCoords?.latitude || 9.0222,
              longitude: userCoords?.longitude || 38.7468,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {filteredGarages.map(garage => (
              <Marker
                key={garage.id}
                coordinate={garage.location}
                title={garage.name}
                description={`${garage.services.slice(0, 3).join(', ')} • ${garage.distance} mi`}
                pinColor={colors.primaryBlue}
                onCalloutPress={() => navigation.navigate('GarageDetail', { garage, intentServices: selectedCategories })}
              />
            ))}
          </MapView>

          <View style={styles.mapOverlay}>
            <View style={[styles.searchInput, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
              <Search color={colors.textGray} size={20} style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, color: colors.textDark }}
                placeholder={t('Search garages...')}
                placeholderTextColor={colors.textGray}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mapCategoriesScroll}
            >
              <ServiceChip
                title={t('All')}
                isSelected={selectedCategories.length === 0}
                onPress={() => setSelectedCategories([])}
              />
              {SERVICE_CATEGORIES.map(category => (
                <ServiceChip
                  key={category}
                  title={t(category)}
                  isSpecial={category === 'General Diagnosis'}
                  isSelected={selectedCategories.includes(category)}
                  onPress={() => toggleCategory(category)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* FABs */}
      {!loading && (
        <>
          <TouchableOpacity
            style={styles.fabToggle}
            activeOpacity={0.9}
            onPress={() => setActiveView(activeView === 'list' ? 'map' : 'list')}
          >
            {activeView === 'list' ? (
              <>
                <MapIcon size={18} color={colors.white} />
                <Text style={styles.fabText}>{t('Map View')}</Text>
              </>
            ) : (
              <>
                <ListIcon size={18} color={colors.white} />
                <Text style={styles.fabText}>{t('List View')}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emergencyFab}
            activeOpacity={0.9}
            onPress={() => {
              if (filteredGarages.length > 0) {
                const nearest = [...filteredGarages].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))[0];
                navigation.navigate('Emergency', { garage: nearest });
              } else {
                showAlert(t('No Garages'), t('No nearby garages found for emergency assistance.'), [], 'info');
              }
            }}
          >
            <AlertCircle size={28} color={colors.white} />
          </TouchableOpacity>

          <FloatingHint
            visible={showEmergencyHint}
            message={t('Need urgent help? Use the Emergency SOS button to notify the nearest garage instantly.')}
            position={{ bottom: 90, right: 20 }}
            arrowPosition="bottom"
            onDismiss={() => dismissHint('emergency')}
          />

          <FloatingHint
            visible={showDiagnosticHint}
            message={t('Not sure what is wrong? Use General Diagnosis to have a mechanic check your vehicle.')}
            position={{ top: 380, left: 100 }}
            arrowPosition="top"
            onDismiss={() => dismissHint('diagnostic')}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgGray,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerWrapper: {
    backgroundColor: colors.bgGray,
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 15,
    color: colors.textGray,
    marginBottom: 4,
    fontWeight: '500',
  },
  iconButton: {
    position: 'relative',
    backgroundColor: colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 220,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 4,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textDark,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  searchTextInput: {
    flex: 1,
    color: colors.textDark,
    fontSize: 16,
    height: '100%',
  },
  emergencyWrapper: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  emergencyBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyIconBg: {
    backgroundColor: colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
  },
  emergencySubText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
    paddingBottom: 4,
  },
  viewToggleWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  mapContainerFull: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative'
  },
  mapOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    gap: 12,
  },
  mapCategoriesScroll: {
    paddingBottom: 4,
  },
  mapFull: {
    width: '100%',
    height: '100%',
  },
  mapContainer: {
    paddingHorizontal: 16,
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
  },
  calloutBubble: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: colors.textDark,
    marginBottom: 4,
  },
  calloutDesc: {
    fontSize: 12,
    color: colors.textGray,
    marginBottom: 10,
  },
  calloutDirBtn: {
    backgroundColor: colors.primaryBlue,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  calloutDirText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  calloutArrowBorder: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: '#000',
    borderWidth: 16,
    alignSelf: 'center',
    marginTop: -2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calloutArrow: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: colors.white,
    borderWidth: 16,
    alignSelf: 'center',
    marginTop: -32,
  },
  fabToggle: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: colors.textDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  emergencyFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#ef4444',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10,
  },
  fabText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  helpBanner: {
    backgroundColor: 'rgba(19, 127, 236, 0.08)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(19, 127, 236, 0.3)',
  },
  helpBannerIconBg: {
    backgroundColor: colors.primaryBlue,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  helpBannerTitle: {
    color: colors.primaryBlue,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  helpBannerSub: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  }
});
