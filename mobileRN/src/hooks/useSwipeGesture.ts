import { useRef } from 'react';
import { PanResponder, PanResponderGestureState } from 'react-native';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocityThreshold?: number;
  /** If true, captures horizontal gestures before child ScrollViews can claim them */
  captureHorizontal?: boolean;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3,
  captureHorizontal = false,
}: SwipeConfig) {
  const callbacksRef = useRef({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown });
  callbacksRef.current = { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 15 || Math.abs(dy) > 15;
      },
      // Capture horizontal gestures before children (e.g. ScrollViews) get them
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        if (!captureHorizontal) return false;
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
        const { dx, dy, vx, vy } = gestureState;
        const isHorizontal = Math.abs(dx) > Math.abs(dy);
        const cb = callbacksRef.current;

        if (isHorizontal) {
          if (dx < -threshold && (Math.abs(vx) > velocityThreshold || Math.abs(dx) > threshold * 2)) {
            cb.onSwipeLeft?.();
          } else if (dx > threshold && (Math.abs(vx) > velocityThreshold || Math.abs(dx) > threshold * 2)) {
            cb.onSwipeRight?.();
          }
        } else {
          if (dy < -threshold && (Math.abs(vy) > velocityThreshold || Math.abs(dy) > threshold * 2)) {
            cb.onSwipeUp?.();
          } else if (dy > threshold && (Math.abs(vy) > velocityThreshold || Math.abs(dy) > threshold * 2)) {
            cb.onSwipeDown?.();
          }
        }
      },
    })
  ).current;

  return panResponder.panHandlers;
}
