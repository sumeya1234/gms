import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Keyboard, Linking, Platform, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, ChevronDown, AlertCircle, Bell, Map as MapIcon, List as ListIcon } from 'lucide-react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';

import ServiceChip from '../../components/ServiceChip';
import GarageCard from '../../components/GarageCard';
import Skeleton from '../../components/Skeleton';
import { Wrench } from 'lucide-react-native';

const SERVICE_CATEGORIES = ['Towing', 'Diagnostics', 'Tires', 'Oil Change', 'Repair', 'Battery', 'Electrical'];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 3958.8; // Radius of the Earth in miles
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

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeView, setActiveView] = useState('list'); // 'list' or 'map'
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationName, setLocationName] = useState('Pending GPS...');
  const [userCoords, setUserCoords] = useState(null);
  const [sortBy, setSortBy] = useState('Nearest'); // 'Nearest' or 'Lowest Price'
  const [unreadCount, setUnreadCount] = useState(0);

  // Deterministic avatar color from user name
  const AVATAR_COLORS = ['#137fec', '#e74c3c', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#3498db', '#e91e63', '#00bcd4', '#ff5722'];
  const nameStr = user?.fullName || user?.firstName || 'User';
  const colorIndex = nameStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[colorIndex];
  const avatarInitial = nameStr.charAt(0).toUpperCase();

  useEffect(() => {
    const requestLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Location Denied');
        return;
      }
      try {
        setLocationName('Finding location...');
        let location = await Location.getCurrentPositionAsync({});
        setUserCoords(location.coords);
        let geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          // Construct a clean display name using available attributes
          const localName = place.district || place.street || place.name || '';
          const cityName = place.city || place.subregion || place.region || '';
          setLocationName(localName && cityName ? `${localName}, ${cityName}` : (localName || cityName || 'Unknown Location'));
        } else {
          setLocationName('Coordinates Found');
        }
      } catch (e) {
        setLocationName('Locating Failed');
      }
    };
    requestLocation();

    const fetchGarages = async () => {
      try {
        const response = await apiClient.get('/garages');

        const mapped = response.data.map(g => {
          const mod = g.GarageID % 3;

          // Base images based on mod
          const imgs = [
            "https://images.unsplash.com/photo-1598555239556-91d179eb9555?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1579227114347-15d08fc37cae?q=80&w=600&auto=format&fit=crop"
          ];

          // Use real services from the database
          const realServices = (g.Services || []).map(s => s.ServiceName);

          return {
            id: g.GarageID.toString(),
            name: g.Name,
            imageUrl: imgs[mod],
            rating: Number(g.AverageRating || 0).toFixed(1),
            reviews: g.TotalReviews || 0,
            isVerified: g.GarageID % 2 === 0,
            distance: (0.5 + (g.GarageID % 5) * 0.8).toFixed(1),
            availability: g.Availability || "Closed",
            services: realServices,
            serviceDetails: g.Services || [],
            startingPrice: Number(g.MinPrice) || 0,
            workingHours: typeof g.WorkingHours === 'string' ? JSON.parse(g.WorkingHours) : g.WorkingHours,
            timezone: g.Timezone || 'Africa/Addis_Ababa',
            location: {
              latitude: 9.0222 + (g.GarageID * 0.002),
              longitude: 38.7468 + (g.GarageID * 0.002)
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

    // Fetch unread notifications
    const fetchUnread = async () => {
      try {
        const res = await apiClient.get('/users/notifications');
        const count = (res.data || []).filter(n => !n.IsRead).length;
        setUnreadCount(count);
      } catch (e) {
        // silent
      }
    };
    fetchUnread();

    // Auto-refresh when screen comes to focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUnread();
    });

    const timer = setInterval(fetchUnread, 30000); // 30s poll

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [navigation]);

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

  // Filter garages logic: garage must provide ALL selected services, matching search query
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
      {/* Header Area */}
      <View style={[styles.headerWrapper, { paddingTop: 16 }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Text style={{ fontSize: 20 }}>🔧</Text>
            </View>
            <Text style={styles.logoText}>
              Garage<Text style={{ color: colors.primaryBlue }}>Pro</Text>
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TouchableOpacity style={{ position: 'relative' }} onPress={() => navigation.navigate('Notifications')}>
              <Bell size={24} color={colors.textDark} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute', top: -4, right: -6, backgroundColor: '#ef4444',
                  borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center',
                  alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: colors.white
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.avatarButton, { backgroundColor: avatarColor, justifyContent: 'center', alignItems: 'center' }]} onPress={() => { if (goToPage) goToPage(3); else navigation.getParent()?.navigate('Profile'); }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{avatarInitial}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.locationSelector}>
          <MapPin size={16} color={colors.primaryBlue} />
          <Text style={styles.locationText}>{locationName}</Text>
          <ChevronDown size={16} color={colors.textGray} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Search Bar Skeleton */}
          <View style={styles.searchWrapper}>
            <Skeleton width="100%" height={48} borderRadius={12} />
          </View>
          {/* Emergency Button Skeleton */}
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Skeleton width="100%" height={48} borderRadius={12} />
          </View>
          {/* Categories Skeleton */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 }}>
            <Skeleton width={60} height={32} borderRadius={16} style={{ marginRight: 8 }} />
            <Skeleton width={90} height={32} borderRadius={16} style={{ marginRight: 8 }} />
            <Skeleton width={100} height={32} borderRadius={16} />
          </View>
          {/* List content Skeletons */}
          <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 24 }}>
            <Skeleton width="100%" height={120} borderRadius={16} />
            <Skeleton width="100%" height={120} borderRadius={16} />
            <Skeleton width="100%" height={120} borderRadius={16} />
          </View>
        </ScrollView>
      ) : activeView === 'list' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Search Input Binding */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchInput}>
              <Search color={colors.textGray} size={20} style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, color: colors.textDark }}
                placeholder={t('Find service, repair, or garage...')}
                placeholderTextColor={colors.textGray}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Emergency Assistance */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.emergencyBtn}
            onPress={() => {
              if (filteredGarages.length > 0) {
                const nearest = [...filteredGarages].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))[0];
                navigation.navigate('Emergency', { garage: nearest });
              } else {
                alert('No Garages', 'No nearby garages found for emergency assistance.');
              }
            }}
          >
            <AlertCircle size={20} color={colors.white} />
            <Text style={styles.emergencyText}>{t('Emergency Assistance')}</Text>
          </TouchableOpacity>

          {/* Categories Horizontal Scroll */}
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
                isSelected={selectedCategories.includes(category)}
                onPress={() => toggleCategory(category)}
              />
            ))}
          </ScrollView>

          {/* Sorting */}
          <View style={[styles.viewToggleWrapper, { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderRadius: 8, padding: 2, borderWidth: 1, borderColor: colors.border }}>
              <TouchableOpacity onPress={() => setSortBy('Nearest')} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: sortBy === 'Nearest' ? colors.primaryBlue : 'transparent', borderRadius: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: sortBy === 'Nearest' ? colors.white : colors.textGray }}>Nearest</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSortBy('Lowest Price')} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: sortBy === 'Lowest Price' ? colors.primaryBlue : 'transparent', borderRadius: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: sortBy === 'Lowest Price' ? colors.white : colors.textGray }}>Price</Text>
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
                No garages match all selected services.
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
                  isSelected={selectedCategories.includes(category)}
                  onPress={() => toggleCategory(category)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Floating Toggle Button */}
      {!loading && (
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
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.bgGray,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emergencyBtn: {
    marginHorizontal: 16,
    backgroundColor: '#ef4444',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
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
  fabText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
