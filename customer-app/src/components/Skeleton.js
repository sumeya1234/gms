import React, { useEffect, useRef } from 'react';
import {Animated, StyleSheet} from 'react-native';
import { colors } from '../theme/colors';

export default function Skeleton({ width, height, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View 
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity: opacity
        },
        style
      ]} 
    />
  );
}
