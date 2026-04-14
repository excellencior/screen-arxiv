/**
 * useSwipeNavigation — Reanimated v2 + Gesture Handler hook
 * 
 * All gesture + animation logic runs on the UI thread via worklets.
 * This ensures 60 FPS swipe transitions with zero JS thread blocking.
 * 
 * Key concepts:
 * - translateX: shared value tracking the horizontal offset of the page strip
 * - currentIndex: shared value for the active page index
 * - Pan gesture with activeOffsetX to avoid conflicting with vertical ScrollViews
 * - withSpring for natural, physics-based snapping
 * - Edge resistance (rubber-band) at boundaries
 */

import { useCallback } from 'react';
import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Spring configuration for natural, responsive snapping
const SPRING_CONFIG = {
  damping: 22,
  stiffness: 220,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

// Thresholds for determining page switch vs snap-back
const SWIPE_THRESHOLD = SCREEN_WIDTH / 3;    // Distance threshold (1/3 of screen)
const VELOCITY_THRESHOLD = 500;               // Fast swipe velocity threshold (px/s)
const RUBBER_BAND_FACTOR = 0.3;               // Resistance at edges (30% of drag distance)

interface UseSwipeNavigationOptions {
  totalPages: number;
  /** Callback fired when page changes (runs on JS thread) */
  onPageChange?: (index: number) => void;
}

export function useSwipeNavigation({ totalPages, onPageChange }: UseSwipeNavigationOptions) {
  // Shared values — live on the UI thread, no bridge crossing
  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const startOffset = useSharedValue(0);

  // Min/max bounds for the horizontal strip
  const minTranslateX = -(totalPages - 1) * SCREEN_WIDTH;
  const maxTranslateX = 0;

  /**
   * Pan Gesture Configuration
   * 
   * - activeOffsetX: [-10, 10] — gesture only activates after 10px horizontal movement,
   *   preventing conflict with vertical ScrollViews inside each page
   * - failOffsetY: [-5, 5] — if vertical movement exceeds 5px first, gesture fails
   *   and vertical scroll takes over
   */
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onStart(() => {
      'worklet';
      // Capture the current offset at gesture start
      startOffset.value = translateX.value;
    })
    .onUpdate((event) => {
      'worklet';
      const rawTranslateX = startOffset.value + event.translationX;

      // Apply rubber-band resistance at edges
      if (rawTranslateX > maxTranslateX) {
        // Pulling past first page — apply resistance
        const overscroll = rawTranslateX - maxTranslateX;
        translateX.value = maxTranslateX + overscroll * RUBBER_BAND_FACTOR;
      } else if (rawTranslateX < minTranslateX) {
        // Pulling past last page — apply resistance
        const overscroll = minTranslateX - rawTranslateX;
        translateX.value = minTranslateX - overscroll * RUBBER_BAND_FACTOR;
      } else {
        // Normal scrolling within bounds
        translateX.value = rawTranslateX;
      }
    })
    .onEnd((event) => {
      'worklet';
      const { translationX, velocityX } = event;
      let targetIndex = currentIndex.value;

      // Determine if we should switch pages based on distance OR velocity
      if (translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {
        // Swiped left → next page
        targetIndex = Math.min(currentIndex.value + 1, totalPages - 1);
      } else if (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
        // Swiped right → previous page
        targetIndex = Math.max(currentIndex.value - 1, 0);
      }

      // Snap to target page with spring animation
      const targetOffset = -targetIndex * SCREEN_WIDTH;
      translateX.value = withSpring(targetOffset, SPRING_CONFIG);
      currentIndex.value = targetIndex;

      // Fire page change callback on JS thread
      if (onPageChange) {
        runOnJS(onPageChange)(targetIndex);
      }
    });

  /**
   * Animated style for the horizontal page strip.
   * Applied to the container holding all pages side-by-side.
   */
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  /**
   * Programmatically scroll to a specific page index.
   * Used when tapping tab bar icons.
   */
  const scrollTo = useCallback(
    (index: number) => {
      'worklet';
      const targetOffset = -index * SCREEN_WIDTH;
      translateX.value = withSpring(targetOffset, SPRING_CONFIG);
      currentIndex.value = index;
    },
    [translateX, currentIndex],
  );

  /**
   * Generate animated style for individual page with opacity/scale interpolation.
   * Pages slightly fade and scale down when not in focus for a polished transition.
   */
  const getPageAnimatedStyle = (pageIndex: number) => {
    'worklet';
    const inputRange = [
      -(pageIndex + 1) * SCREEN_WIDTH,
      -pageIndex * SCREEN_WIDTH,
      -(pageIndex - 1) * SCREEN_WIDTH,
    ];

    const opacity = interpolate(
      translateX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      translateX.value,
      inputRange,
      [0.92, 1, 0.92],
      Extrapolation.CLAMP,
    );

    return { opacity, transform: [{ scale }] };
  };

  return {
    panGesture,
    animatedContainerStyle,
    translateX,
    currentIndex,
    scrollTo,
    getPageAnimatedStyle,
    SCREEN_WIDTH,
  };
}
