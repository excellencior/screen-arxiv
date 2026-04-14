/**
 * MarqueeTitle — Auto-scrolling single-line title component
 * 
 * Displays text on a single line. If the text overflows the container,
 * it auto-scrolls (marquee effect) to reveal the full title.
 * 
 * Text width measurement uses onLayout on an absolutely-positioned hidden
 * Text element, which is reliable on both Android and iOS (unlike onTextLayout
 * which doesn't consistently return line widths on Android).
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

interface MarqueeTitleProps {
  title: string;
  style: any;
}

const MarqueeTitle = ({ title, style }: MarqueeTitleProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerW, setContainerW] = useState(0);
  const [textW, setTextW] = useState(0);

  useEffect(() => {
    translateX.setValue(0);
    if (textW > containerW && containerW > 0) {
      const distance = textW - containerW;
      const anim = Animated.loop(
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(translateX, {
            toValue: -distance,
            duration: distance * 18,
            useNativeDriver: true,
          }),
          Animated.delay(800),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [textW, containerW, title]);

  return (
    <View
      style={{ overflow: 'hidden', marginBottom: 8 }}
      onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
    >
      {/* Visible animated text — clipped by container overflow: hidden */}
      <Animated.View style={{ transform: [{ translateX }], alignSelf: 'flex-start' }}>
        <Text style={style} numberOfLines={1}>
          {title}
        </Text>
      </Animated.View>

      {/* Hidden measurement text — absolutely positioned, invisible, 
          used to get the full unconstrained text width via onLayout.
          This is reliable on Android unlike onTextLayout. */}
      <Text
        style={[style, { position: 'absolute', opacity: 0, top: -9999 }]}
        onLayout={(e) => {
          const measuredWidth = e.nativeEvent.layout.width;
          if (measuredWidth > 0) setTextW(measuredWidth);
        }}
      >
        {title}
      </Text>
    </View>
  );
};

export default MarqueeTitle;
