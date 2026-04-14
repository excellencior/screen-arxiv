import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, ScrollView, Animated, PanResponder, ScrollViewProps } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

export type ScrollSection = { label: string; scrollY: number };

type CustomScrollViewProps = ScrollViewProps & {
  /** Optional list of sections with their scroll offsets for the floating label indicator */
  sections?: ScrollSection[];
};

const CustomScrollView = forwardRef<ScrollView, CustomScrollViewProps>((props, ref) => {
  const { sections, ...scrollViewProps } = props;
  const { theme, isDarkMode } = useAppTheme();
  
  const internalRef = useRef<ScrollView>(null);
  useImperativeHandle(ref, () => internalRef.current as ScrollView);

  const [contentHeight, setContentHeight] = useState(0);
  const [visibleHeight, setVisibleHeight] = useState(0);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const currentScrollY = useRef(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isDraggingTrack, setIsDraggingTrack] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const panStartScrollY = useRef(0);

  // Active section label — shown next to thumb while scrolling/dragging
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const labelHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mutable ref so panResponder handlers always read fresh geometry values
  // (panResponder is created once via useRef — its closures would otherwise be stale)
  const scrollGeometry = useRef({ maxScrollY: 0, maxThumbY: 0 });

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => { currentScrollY.current = value; });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const getLabelForScrollY = (y: number): string | null => {
    if (!sections || sections.length === 0) return null;
    // Walk backwards to find the last section whose scrollY is <= current y
    let active = sections[0];
    for (const s of sections) {
      if (y >= s.scrollY) active = s;
    }
    return active.label;
  };

  const showLabel = (y: number) => {
    const label = getLabelForScrollY(y);
    if (!label) return;
    setActiveLabel(label);
    if (labelHideTimeout.current) clearTimeout(labelHideTimeout.current);
    Animated.timing(labelOpacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  const hideLabel = (delay = 800) => {
    if (labelHideTimeout.current) clearTimeout(labelHideTimeout.current);
    labelHideTimeout.current = setTimeout(() => {
      Animated.timing(labelOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }, delay);
  };

  const showScrollbar = () => {
    setIsVisible(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    
    if (!isDraggingTrack) {
       hideTimeout.current = setTimeout(() => {
         Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(({ finished }) => {
           if (finished) setIsVisible(false);
         });
       }, 1500);
    }
  };

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    scrollY.setValue(y);
    if (!isDraggingTrack) {
      showScrollbar();
      if (sections && sections.length > 0) {
        showLabel(y);
        hideLabel(800);
      }
    }
    if (scrollViewProps.onScroll) scrollViewProps.onScroll(event);
  };

  if (scrollViewProps.horizontal) {
    return <ScrollView ref={internalRef} {...scrollViewProps} showsHorizontalScrollIndicator={false} />;
  }

  const heightRatio = visibleHeight > 0 && contentHeight > 0 ? visibleHeight / contentHeight : 1;
  const isScrollable = heightRatio < 1 && heightRatio > 0;
  
  const trackHeight = visibleHeight;
  const rawThumbHeight = trackHeight * heightRatio;
  const thumbHeight = Math.max(rawThumbHeight, 60); // Minimum 60px thumb so it's easily grabbable

  const maxScrollY = Math.max(0, contentHeight - visibleHeight);
  const maxThumbY = Math.max(0, trackHeight - thumbHeight);

  // Keep the geometry ref in sync with the latest derived values
  scrollGeometry.current = { maxScrollY, maxThumbY };

  // Transform scroll position into thumb position seamlessly
  const thumbTranslateY = scrollY.interpolate({
    inputRange: [0, Math.max(1, maxScrollY)],
    outputRange: [0, maxThumbY],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDraggingTrack(true);
        panStartScrollY.current = currentScrollY.current;
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }).start();
        // Show label immediately on grab
        const lbl = getLabelForScrollY(currentScrollY.current);
        if (lbl) { setActiveLabel(lbl); }
        if (labelHideTimeout.current) clearTimeout(labelHideTimeout.current);
        Animated.timing(labelOpacity, { toValue: 1, duration: 100, useNativeDriver: true }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        const { maxScrollY: msy, maxThumbY: mty } = scrollGeometry.current;
        const multiplier = mty > 0 ? msy / mty : 1;
        const targetScrollY = Math.max(0, Math.min(msy, panStartScrollY.current + gestureState.dy * multiplier));
        internalRef.current?.scrollTo({ y: targetScrollY, animated: false });
        // Update label while dragging — read from ref to avoid stale closure
        const lbl = getLabelForScrollY(targetScrollY);
        if (lbl) setActiveLabel(lbl);
      },
      onPanResponderRelease: () => {
        setIsDraggingTrack(false);
        showScrollbar();
        hideLabel(600);
      },
      onPanResponderTerminate: () => {
        setIsDraggingTrack(false);
        showScrollbar();
        hideLabel(0);
      },
    })
  ).current;

  // Scrollbar thumb color — more subtle/transparent than before
  const thumbColor = isDarkMode ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)';

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, scrollViewProps.style]}>
      <ScrollView
        ref={internalRef}
        {...scrollViewProps}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={(w, h) => {
          setContentHeight(h);
          if (scrollViewProps.onContentSizeChange) scrollViewProps.onContentSizeChange(w, h);
        }}
        onLayout={(e) => {
          setVisibleHeight(e.nativeEvent.layout.height);
          if (scrollViewProps.onLayout) scrollViewProps.onLayout(e);
        }}
      >
        {scrollViewProps.children}
      </ScrollView>

      {isScrollable && (
        <Animated.View
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 36,
            justifyContent: 'flex-start', alignItems: 'flex-end', opacity,
          }}
          pointerEvents={isVisible || isDraggingTrack ? 'box-none' : 'none'}
        >
          {/* Section label pill — floats left of the thumb */}
          {sections && sections.length > 0 && activeLabel && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                right: 40, // offset left of the scrollbar track
                opacity: labelOpacity,
                transform: [{ translateY: thumbTranslateY }],
                height: thumbHeight,
                justifyContent: 'center',
              }}
            >
              <View style={{
                backgroundColor: isDarkMode ? 'rgba(30,30,40,0.92)' : 'rgba(240,240,248,0.95)',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 8,
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              }}>
                <Text style={{
                  color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                  fontSize: 14,
                  fontFamily: 'Open Sans',
                  fontWeight: '800',
                  letterSpacing: 1,
                }}>
                  {activeLabel}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Scrollbar thumb */}
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              width: 36, height: thumbHeight,
              transform: [{ translateY: thumbTranslateY }],
              justifyContent: 'center', alignItems: 'flex-end',
              paddingRight: 4,
            }}
          >
            <View style={{
              width: 4, height: '100%', borderRadius: 2,
              backgroundColor: thumbColor,
            }} />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
});

CustomScrollView.displayName = 'CustomScrollView';
export default CustomScrollView;
