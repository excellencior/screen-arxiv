/**
 * SwipeableTabView — Full-screen horizontally swipeable page container
 * 
 * Renders all pages in a horizontal strip and uses Gesture Handler + Reanimated
 * for native-feel, 60 FPS swiping. Includes animated pagination dots.
 *
 * Architecture:
 * ┌───────────────────────────────────────────────────┐
 * │  GestureDetector (captures pan gestures)          │
 * │  ┌─────────────────────────────────────────────┐  │
 * │  │  Animated.View (translateX moves the strip) │  │
 * │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │  │
 * │  │  │ P1  │ │ P2  │ │ P3  │ │ P4  │ │ P5  │  │  │
 * │  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │  │
 * │  └─────────────────────────────────────────────┘  │
 * │  ┌─────────────────────────────────────────────┐  │
 * │  │  Pagination Dots (animated indicators)      │  │
 * │  └─────────────────────────────────────────────┘  │
 * └───────────────────────────────────────────────────┘
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeableTabViewProps {
  /** Array of React elements — one per page */
  children: React.ReactNode[];
  /** Callback when the active page changes */
  onPageChange?: (index: number) => void;
  /** If true, show pagination dots */
  showDots?: boolean;
  /** Dot color for active indicator */
  activeDotColor?: string;
  /** Dot color for inactive indicators */
  inactiveDotColor?: string;
  /** Expose scrollTo for external navigation (e.g., tab bar taps) */
  scrollToRef?: React.MutableRefObject<((index: number) => void) | null>;
}

/**
 * Single animated pagination dot.
 * Interpolates width + opacity based on the current translateX position.
 */
const PaginationDot = ({
  index,
  translateX,
  activeColor,
  inactiveColor,
}: {
  index: number;
  translateX: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
}) => {
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      -(index + 1) * SCREEN_WIDTH,
      -index * SCREEN_WIDTH,
      -(index - 1) * SCREEN_WIDTH,
    ];

    // Active dot expands wider for visual emphasis
    const width = interpolate(
      translateX.value,
      inputRange,
      [6, 20, 6],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      translateX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    );

    const backgroundColor =
      Math.abs(translateX.value + index * SCREEN_WIDTH) < SCREEN_WIDTH / 2
        ? activeColor
        : inactiveColor;

    return {
      width,
      opacity,
      backgroundColor,
    };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
};

/**
 * Individual page wrapper with opacity/scale interpolation.
 * Adjacent pages slightly fade and scale down during transitions.
 */
const PageWrapper = ({
  index,
  translateX,
  children,
}: {
  index: number;
  translateX: SharedValue<number>;
  children: React.ReactNode;
}) => {
  const pageStyle = useAnimatedStyle(() => {
    const inputRange = [
      -(index + 1) * SCREEN_WIDTH,
      -index * SCREEN_WIDTH,
      -(index - 1) * SCREEN_WIDTH,
    ];

    const opacity = interpolate(
      translateX.value,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      translateX.value,
      inputRange,
      [0.94, 1, 0.94],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[styles.page, pageStyle]}>
      {children}
    </Animated.View>
  );
};

export default function SwipeableTabView({
  children,
  onPageChange,
  showDots = true,
  activeDotColor = '#6366f1',
  inactiveDotColor = 'rgba(255,255,255,0.3)',
  scrollToRef,
}: SwipeableTabViewProps) {
  const totalPages = React.Children.count(children);

  const { panGesture, animatedContainerStyle, translateX, scrollTo } =
    useSwipeNavigation({
      totalPages,
      onPageChange,
    });

  // Expose scrollTo to parent so tab bar taps can trigger animated navigation
  React.useEffect(() => {
    if (scrollToRef) {
      scrollToRef.current = scrollTo;
    }
  }, [scrollTo, scrollToRef]);

  const pages = React.Children.toArray(children);

  return (
    <View style={styles.container}>
      {/* GestureDetector wraps the entire swipeable area */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.pageStrip,
            { width: SCREEN_WIDTH * totalPages },
            animatedContainerStyle,
          ]}
        >
          {pages.map((page, index) => (
            <PageWrapper key={index} index={index} translateX={translateX}>
              {page}
            </PageWrapper>
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Animated pagination dots */}
      {showDots && (
        <View style={styles.dotsContainer}>
          {pages.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              translateX={translateX}
              activeColor={activeDotColor}
              inactiveColor={inactiveDotColor}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  pageStrip: {
    flex: 1,
    flexDirection: 'row',
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 100, // Positioned above the floating tab bar
    left: 0,
    right: 0,
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
