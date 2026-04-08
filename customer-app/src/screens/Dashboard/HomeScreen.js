import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Keyboard, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, ChevronDown, AlertCircle, Bell } from 'lucide-react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import { colors } from '../../theme/colors';

import ServiceChip from '../../components/ServiceChip';
import GarageCard from '../../components/GarageCard';
import ViewToggle from '../../components/ViewToggle';
import Skeleton from '../../components/Skeleton';

const SERVICE_CATEGORIES = ['Towing', 'Diagnostics', 'Tires', 'Oil Change', 'Repair', 'Battery', 'Electrical'];

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeView, setActiveView] = useState('list'); // 'list' or 'map'
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationName, setLocationName] = useState('Pending GPS...');

  // Standard generic avatar if user doesn't have one
  const avatarUrl = user?.avatarUrl || "https://ui-avatars.com/api/?name=" + (user?.firstName || "User") + "&background=137fec&color=fff";

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
        
        // Attach mock properties based on their GarageID for UI integration
        const mapped = response.data.map(g => {
             const mod = g.GarageID % 3;
             let mockServices = [];
             if (mod === 0) mockServices = ['Tires', 'Oil Change'];
             else if (mod === 1) mockServices = ['Towing', 'Repair', 'Diagnostics', 'Electrical'];
             else mockServices = ['Electrical', 'Battery', 'Diagnostics', 'Repair'];
             
             // Base images based on mod
             const imgs = [
                 "https://images.unsplash.com/photo-1598555239556-91d179eb9555?q=80&w=600&auto=format&fit=crop",
                 "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=600&auto=format&fit=crop",
                 "https://images.unsplash.com/photo-1579227114347-15d08fc37cae?q=80&w=600&auto=format&fit=crop"
             ];

             return {
                 id: g.GarageID.toString(),
                 name: g.Name,
                 imageUrl: imgs[mod],
                 rating: Number(g.AverageRating || 0).toFixed(1),
                 reviews: g.TotalReviews || 0,
                 isVerified: g.GarageID % 2 === 0,
                 distance: (0.5 + (g.GarageID % 5) * 0.8).toFixed(1),
                 availability: "Open Now",
                 services: mockServices,
                 startingPrice: 30 + g.GarageID * 5,
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
  }, []);

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
    return g.name.toLowerCase().includes(searchQuery.toLowerCase());
  }).map(g => {
    // Generate an estimated bundle total price depending on how many services they selected
    const multiplier = selectedCategories.length > 0 ? selectedCategories.length : 1;
    // Overwrite their base startingPrice locally for the UI layer representation
    return { ...g, startingPrice: Math.floor(g.startingPrice * multiplier * 0.85) }; // 15% discount bundle!
  });

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Area */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top || 16 }]}>
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
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <Bell size={24} color={colors.textDark} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarButton}>
               <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
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
      ) : (
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
          <TouchableOpacity activeOpacity={0.8} style={styles.emergencyBtn}>
            <AlertCircle size={20} color={colors.white} />
            <Text style={styles.emergencyText}>{t('Emergency Assistance')}</Text>
          </TouchableOpacity>

          {/* Categories Horizontal Scroll */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoriesScroll}
          >
            {/* The "All" chip */}
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

          {/* View Toggle */}
          <View style={styles.viewToggleWrapper}>
            <ViewToggle activeView={activeView} onViewChange={setActiveView} />
          </View>

          {/* Main Content Area */}
          {activeView === 'list' ? (
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
          ) : (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: 9.0222,
                  longitude: 38.7468,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                {filteredGarages.map(garage => (
                  <Marker
                    key={garage.id}
                    coordinate={garage.location}
                  >
                    <Callout tooltip onPress={() => navigation.navigate('GarageDetail', { garage, intentServices: selectedCategories })}>
                       <View style={styles.calloutBubble}>
                          <Text style={styles.calloutTitle}>{garage.name}</Text>
                          <Text style={styles.calloutDesc} numberOfLines={1}>{garage.services.join(', ')}</Text>
                          
                          <TouchableOpacity 
                             style={styles.calloutDirBtn} 
                             onPress={(e) => {
                               // Try to prevent event bubbling if possible, then open directions
                               e.stopPropagation();
                               openDirections(garage);
                             }}
                          >
                             <Text style={styles.calloutDirText}>Directions • {garage.distance} mi</Text>
                          </TouchableOpacity>
                       </View>
                       <View style={styles.calloutArrowBorder} />
                       <View style={styles.calloutArrow} />
                    </Callout>
                  </Marker>
                ))}
              </MapView>
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgGray,
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
  }
});
