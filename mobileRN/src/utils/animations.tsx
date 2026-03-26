import React, { useEffect, useRef } from 'react';
import { Animated, LayoutAnimation, Platform, UIManager } from 'react-native';

// Natively enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Triggers a fluid ease-in-ease-out transition on the very next paint cycle.
 * Perfect for filtering items in a grid, expanding panels, or closing modals seamlessly.
 */
export const smoothLayoutAnimation = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
};

/**
 * Triggers a spring-based layout mutation.
 * Excellent for lively mounting of robust elements or drawer interactions.
 */
export const springLayoutAnimation = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
};

/**
 * A beautiful drop-in replacement component that elegantly fades and slides its children upward.
 * Hook this into .map() functions with staggered delays `delay={index * 50}` to create glorious cascading mounts.
 */
export const FadeInUp = ({ children, delay = 0, style }: any) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Reset values in case of unmounting/remounting fast
    opacity.setValue(0);
    translateY.setValue(20);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};
