import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, PanResponder } from 'react-native';
import { useToast } from 'react-native-toast-message';

type SwipeableToastProps = {
  id: string;
  message: string;
  duration?: number;
  onDismiss?: () => void;
};

export default function SwipeableToast({ id, message, duration = 4000, onDismiss }: SwipeableToastProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // Auto dismiss after duration
    const timer = setTimeout(() => {
      dismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss && onDismiss();
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      translateY.setValue(gestureState.dy);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dy) > 50) {
        dismiss();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return (
    <Animated.View
      style={[styles.toast, { opacity, transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={dismiss} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginVertical: 4,
    justifyContent: 'space-between',
  },
  message: {
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  closeBtn: {
    paddingHorizontal: 4,
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
  },
});
