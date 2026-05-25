import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { ChevronLeft, MapPin, Check } from 'lucide-react-native';
import { useLocationStore } from '../../store/locationStore';
import { colors } from '../../theme/colors';

export default function LocationSelectorScreen({ navigation }) {
    const { location, setManualLocation } = useLocationStore();

    // Start with global location or default to Addis Ababa
    const [region, setRegion] = useState({
        latitude: location?.coords?.latitude || 9.0222,
        longitude: location?.coords?.longitude || 38.7468,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    const [addressName, setAddressName] = useState('Fetching address...');
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentCoords, setCurrentCoords] = useState({
        latitude: region.latitude,
        longitude: region.longitude
    });

    const mapRef = useRef(null);

    const fetchAddress = async (coords) => {
        try {
            setIsUpdating(true);
            let addressArray = await Location.reverseGeocodeAsync(coords);
            if (addressArray && addressArray.length > 0) {
                const place = addressArray[0];
                const localName = place.district || place.street || place.name || '';
                const cityName = place.city || place.subregion || place.region || '';
                setAddressName(localName && cityName ? `${localName}, ${cityName}` : (localName || cityName || 'Unknown Location'));
            } else {
                setAddressName('Unknown Location');
            }
        } catch (e) {
            setAddressName('Location fetch failed');
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        // Fetch initial location address if starting blindly
        fetchAddress({ latitude: region.latitude, longitude: region.longitude });
    }, []);

    const handleRegionChangeComplete = async (newRegion) => {
        setCurrentCoords({ latitude: newRegion.latitude, longitude: newRegion.longitude });
        await fetchAddress({ latitude: newRegion.latitude, longitude: newRegion.longitude });
    };

    const handleConfirmLocation = () => {
        // Create an object matching the expo-location structure that the app expects
        const newLocationData = {
            coords: {
                latitude: currentCoords.latitude,
                longitude: currentCoords.longitude,
                accuracy: 10,
                altitude: null,
                heading: null,
                speed: null,
            },
            timestamp: Date.now()
        };

        // We only need basic address structure for the store override
        const newAddressData = {
            district: addressName.split(',')[0]?.trim() || '',
            city: addressName.split(',')[1]?.trim() || ''
        };

        setManualLocation(newLocationData, newAddressData);
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Location</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchBarContainer}>
                <Text style={styles.instructionsText}>Drag the map to position the pin exactly where you need service.</Text>
            </View>

            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={region}
                    onRegionChangeComplete={handleRegionChangeComplete}
                />
                <View style={styles.fixedMarker}>
                    <MapPin size={40} color={colors.primaryBlue} />
                </View>
            </View>

            <View style={styles.bottomCard}>
                <View style={styles.addressContainer}>
                    <MapPin size={20} color={colors.primaryBlue} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.addressTitle}>Selected Location</Text>
                        {isUpdating ? (
                            <ActivityIndicator size="small" color={colors.primaryBlue} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                        ) : (
                            <Text style={styles.addressText} numberOfLines={2}>{addressName}</Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.confirmButton, isUpdating && { opacity: 0.7 }]}
                    onPress={handleConfirmLocation}
                    disabled={isUpdating}
                >
                    <Text style={styles.confirmButtonText}>Confirm Location</Text>
                    <Check size={20} color={colors.white} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textDark,
    },
    searchBarContainer: {
        padding: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    instructionsText: {
        color: colors.textGray,
        fontSize: 14,
        textAlign: 'center'
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    fixedMarker: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -40,
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    bottomCard: {
        padding: 20,
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgGray,
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    addressTitle: {
        fontSize: 12,
        color: colors.textGray,
        marginBottom: 4,
        fontWeight: 'bold',
    },
    addressText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textDark,
    },
    confirmButton: {
        flexDirection: 'row',
        backgroundColor: colors.primaryBlue,
        paddingVertical: 16,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    }
});
