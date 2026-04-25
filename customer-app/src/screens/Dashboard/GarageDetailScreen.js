import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Linking, Platform } from 'react-native';
import { ChevronLeft, Heart, CheckCircle, MapPin, Star, MessageSquare, CalendarClock, AlertTriangle, Navigation } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useFeedbackStore } from '../../store/feedbackStore';
import Skeleton from '../../components/Skeleton';

const { width } = Dimensions.get('window');

export default function GarageDetailScreen({ route, navigation }) {
  const { garage, intentServices, isEmergency } = route.params;

  const { garageReviews, fetchGarageReviews, isLoading } = useFeedbackStore();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const reviewsSectionY = useRef(0);

  useEffect(() => {
    fetchGarageReviews(garage.id || garage.GarageID);
  }, []);

  // Inherit filtered services from Home, but let user modify them directly on the Garage page!
  const [selectedServices, setSelectedServices] = useState(intentServices || []);
  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };
  const workingHours = garage.workingHours || {};
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const shortDay = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  };

  const formatTime12h = (timeStr) => {
    if (!timeStr) return '';
    const [hourStr, minute] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  const getHourLabel = (day) => {
    if (!day?.isOpen || !day?.open || !day?.close) return 'Closed';
    return `${formatTime12h(day.open)} - ${formatTime12h(day.close)}`;
  };

  const groupedHours = (() => {
    const groups = [];
    let current = null;
    dayOrder.forEach((key) => {
      const label = getHourLabel(workingHours[key]);
      if (!current || current.label !== label) {
        if (current) groups.push(current);
        current = { start: key, end: key, label };
      } else {
        current.end = key;
      }
    });
    if (current) groups.push(current);
    return groups;
  })();

  const toggleService = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const openDirections = () => {
    const lat = garage.location.latitude;
    const lng = garage.location.longitude;
    const label = encodeURIComponent(garage.name);

    // Fallback coordinates if garage.location is malformed or missing
    if (!lat || !lng) return;

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`
    });

    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Garage Details</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Heart size={24} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Horizontal Images Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: garage.imageUrl }} style={styles.garageImage} />
          </View>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80" }} style={styles.garageImage} />
          </View>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: "https://images.unsplash.com/photo-1632823438641-69279dc60db7?auto=format&fit=crop&w=600&q=80" }} style={styles.garageImage} />
          </View>
        </ScrollView>

        <View style={styles.content}>
          {/* Title & Info */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.garageName}>{garage.name}</Text>
              <View style={styles.verifiedRow}>
                {garage.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <CheckCircle size={12} color={colors.primaryBlue} />
                    <Text style={styles.verifiedText}>Verified Business</Text>
                  </View>
                )}
                <Text style={styles.estText}>• Est. 2015</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{garage.availability}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.textGray} />
            <Text style={styles.locationText}>{garage.distance} miles away • {garage.location.latitude}, {garage.location.longitude}</Text>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeText}>{garage.rating}</Text>
            </View>
            <View style={styles.starsRow}>
              <Star size={16} color={colors.primaryBlue} fill={colors.primaryBlue} />
              <Star size={16} color={colors.primaryBlue} fill={colors.primaryBlue} />
              <Star size={16} color={colors.primaryBlue} fill={colors.primaryBlue} />
              <Star size={16} color={colors.primaryBlue} fill={colors.primaryBlue} />
              <Star size={16} color={colors.primaryBlue} />
            </View>
            <TouchableOpacity onPress={() => scrollRef.current?.scrollTo({ y: reviewsSectionY.current, animated: true })}>
              <Text style={styles.reviewsText}>See all {garageReviews.length} reviews</Text>
            </TouchableOpacity>
          </View>



          <View style={styles.divider} />

          {/* Popular Services Mock */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tap to add to request</Text>
          </View>

          {garage.services.map((service, index) => {
            const isSelected = selectedServices.includes(service);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.serviceItem, isSelected && { borderColor: colors.primaryBlue, backgroundColor: 'rgba(19, 127, 236, 0.03)' }]}
                onPress={() => toggleService(service)}
                activeOpacity={0.8}
              >
                <View style={[styles.serviceIconWrap, isSelected && { backgroundColor: colors.primaryBlue }]}>
                  <CheckCircle size={20} color={isSelected ? colors.white : colors.primaryBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{service}</Text>
                  <Text style={styles.serviceSub}>Expert mechanics</Text>
                </View>
                <Text style={styles.servicePrice}>From ETB {garage.startingPrice + index * 10}</Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.divider} />

          {/* Schedule & Map Two-Column representation (Stacking on mobile) */}
          <Text style={styles.sectionTitle}>Working Hours</Text>
          {groupedHours.map((group) => {
            const dayText = group.start === group.end
              ? shortDay[group.start]
              : `${shortDay[group.start]}-${shortDay[group.end]}`;
            return (
              <View key={`${group.start}-${group.end}-${group.label}`} style={styles.hoursRow}>
                <Text style={styles.dayText}>{dayText}</Text>
                {group.label === 'Closed' ? (
                  <Text style={styles.closedText}>Closed</Text>
                ) : (
                  <Text style={styles.hoursText}>{group.label}</Text>
                )}
              </View>
            );
          })}

          <View style={[styles.sectionHeader, { marginTop: 16 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Location</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={openDirections}>
              <Navigation size={16} color={colors.primaryBlue} />
              <Text style={styles.viewAll}>Get Directions</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mapWrap}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: garage.location.latitude,
                longitude: garage.location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={garage.location} />
            </MapView>
          </View>

          <View style={styles.divider} />

          {/* Live Reviews Section */}
          <View onLayout={(e) => { reviewsSectionY.current = e.nativeEvent.layout.y; }} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Reviews ({garageReviews.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddReview', { garage })}>
              <Text style={styles.viewAll}>Write a Review</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ gap: 12, marginBottom: 16 }}>
              <View style={styles.reviewCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                  <Skeleton width={36} height={36} borderRadius={18} />
                  <View style={{ gap: 4 }}>
                    <Skeleton width={100} height={14} />
                    <Skeleton width={60} height={12} />
                  </View>
                </View>
                <Skeleton width="100%" height={12} style={{ marginTop: 4 }} />
                <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
              </View>
              <View style={styles.reviewCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                  <Skeleton width={36} height={36} borderRadius={18} />
                  <View style={{ gap: 4 }}>
                    <Skeleton width={120} height={14} />
                    <Skeleton width={60} height={12} />
                  </View>
                </View>
              </View>
            </View>
          ) : garageReviews.length === 0 ? (
            <Text style={{ color: colors.textGray, marginBottom: 16 }}>No reviews yet. Be the first to leave one!</Text>
          ) : (
            <View style={{ gap: 12, marginBottom: 16 }}>
              {garageReviews.map((rev, idx) => (
                <View key={rev.ReviewID || idx} style={styles.reviewCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                    <View style={styles.avatarPlaceholder}>
                      <Text style={{ color: colors.white, fontWeight: 'bold' }}>{rev.Customer?.firstName?.[0] || 'U'}</Text>
                    </View>
                    <View>
                      <Text style={{ fontWeight: 'bold', color: colors.textDark, fontSize: 14 }}>
                        {rev.Customer?.firstName || 'User'} {rev.Customer?.lastName || ''}
                      </Text>
                      <View style={{ flexDirection: 'row', marginTop: 2 }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} color={i < rev.Rating ? "#eab308" : colors.border} fill={i < rev.Rating ? "#eab308" : "transparent"} />
                        ))}
                      </View>
                    </View>
                  </View>
                  {rev.Comment ? (
                    <Text style={{ color: colors.textDark, fontSize: 13, lineHeight: 20 }}>{rev.Comment}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.complaintBtn} onPress={() => navigation.navigate('AddComplaint', { garage })}>
            <AlertTriangle size={18} color="#ef4444" />
            <Text style={styles.complaintText}>Report an Issue (Private)</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 16 }]}>
        <TouchableOpacity style={styles.chatBtn}>
          <MessageSquare size={24} color={colors.primaryBlue} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.requestBtn} onPress={() => navigation.navigate('ServiceRequest', { garage, defaultServices: selectedServices, isEmergency })}>
          <Text style={styles.requestBtnText}>Request Service{selectedServices.length > 0 ? ` (${selectedServices.length})` : ''}</Text>
          <CalendarClock size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgGray
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark },
  imagesScroll: { paddingHorizontal: 16, paddingTop: 16 },
  imageWrapper: { width: width * 0.8, height: 200, marginRight: 16, borderRadius: 16, overflow: 'hidden' },
  garageImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  content: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  garageName: { fontSize: 24, fontWeight: 'bold', color: colors.textDark, marginBottom: 4 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(19,127,236,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
  verifiedText: { fontSize: 12, color: colors.primaryBlue, fontWeight: 'bold' },
  estText: { fontSize: 12, color: colors.textGray },
  statusBadge: { backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#16a34a', fontSize: 12, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 12 },
  locationText: { color: colors.textGray, fontSize: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingBadge: { backgroundColor: colors.primaryBlue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ratingBadgeText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewsText: { color: colors.primaryBlue, fontSize: 14, textDecorationLine: 'underline' },
  divider: { height: 1, backgroundColor: colors.bgGray, marginVertical: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginBottom: 8 },
  viewAll: { color: colors.primaryBlue, fontWeight: 'bold', fontSize: 14 },
  serviceItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 8 },
  serviceIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(19,127,236,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  serviceName: { fontSize: 16, fontWeight: 'bold', color: colors.textDark },
  serviceSub: { fontSize: 12, color: colors.textGray },
  servicePrice: { fontSize: 16, fontWeight: 'bold', color: colors.textDark },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.bgGray },
  dayText: { color: colors.textGray, fontSize: 14 },
  hoursText: { color: colors.textDark, fontWeight: '500', fontSize: 14 },
  closedText: { color: colors.textGray, fontWeight: '500', fontSize: 14 },
  mapWrap: { height: 150, borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  map: { width: '100%', height: '100%' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: 12 },
  chatBtn: { width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(19,127,236,0.1)', justifyContent: 'center', alignItems: 'center' },
  requestBtn: { flex: 1, backgroundColor: colors.primaryBlue, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  requestBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  reviewCard: { backgroundColor: colors.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryBlue, justifyContent: 'center', alignItems: 'center' },
  complaintBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  complaintText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 }
});
