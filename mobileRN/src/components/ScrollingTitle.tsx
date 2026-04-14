import React, { useRef, useEffect } from 'react';
import { Animated, Text, StyleSheet, View, Dimensions } from 'react-native';

type ScrollingTitleProps = {
  text: string;
  speed?: number; // pixels per second
  style?: any;
};

export default function ScrollingTitle({ text, speed = 30, style }: ScrollingTitleProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const containerWidth = Dimensions.get('window').width - 32; // assume some padding

  useEffect(() => {
    // Measure text width after layout
    let textWidth = 0;
    const onLayout = (event: any) => {
      textWidth = event.nativeEvent.layout.width;
      if (textWidth <= containerWidth) return;
      const distance = textWidth + containerWidth;
      const duration = (distance / speed) * 1000;
      Animated.loop(
        Animated.timing(translateX, {
          toValue: -distance,
          duration,
          useNativeDriver: true,
        })
      ).start();
    };
    // Trigger layout measurement by rendering invisible view
    // We'll use a timeout to ensure layout occurs
    const timer = setTimeout(() => {
      // No-op, layout will happen automatically
    }, 0);
    return () => clearTimeout(timer);
  }, [text, speed, containerWidth, translateX]);

  return (
    <View style={[styles.container, style]} onLayout={(e) => {}}>
      <Animated.Text
        style={[styles.text, { transform: [{ translateX }] }]}
        numberOfLines={1}
        onLayout={(e) => {
          // Trigger effect when layout changes
        }}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
});
