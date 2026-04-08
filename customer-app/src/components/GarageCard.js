import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, MapPin, Heart } from 'lucide-react-native';
import { colors } from '../theme/colors';

export default function GarageCard({ item, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        
        <View style={styles.ratingBadge}>
          <Star size={14} color="#eab308" fill="#eab308" />
          <Text style={styles.ratingText}>{item.rating} ({item.reviews})</Text>
        </View>
        
        {item.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.distanceRow}>
              <MapPin size={14} color={colors.textGray} />
              <Text style={styles.distanceText}>
                {item.distance} mi away • {item.availability}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.favoriteButton}>
            <Heart size={18} color={colors.textGray} />
          </TouchableOpacity>
        </View>

        <View style={styles.tagsContainer}>
          {item.services.map((service, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{service}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.startsAt}>Starts at</Text>
            <Text style={styles.price}>${item.startingPrice}</Text>
          </View>
          
          <TouchableOpacity style={styles.bookButton} onPress={onPress}>
            <Text style={styles.bookText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  detailsContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    color: colors.textGray,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: colors.bgGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textDark,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startsAt: {
    fontSize: 12,
    color: colors.textGray,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryBlue,
  },
  bookButton: {
    backgroundColor: 'rgba(19, 127, 236, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primaryBlue,
  }
});
