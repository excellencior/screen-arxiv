// Web-compatible stub for react-native-safe-area-context
// Replaces native SafeAreaProvider/View with simple div wrappers on web
import React from 'react';
import { View } from 'react-native';

// Types
export type Edge = 'top' | 'right' | 'bottom' | 'left';
export type EdgeMode = 'off' | 'additive' | 'maximum';
export type EdgeRecord = Partial<Record<Edge, EdgeMode>>;
export type Edges = readonly Edge[] | Readonly<EdgeRecord>;

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Metrics {
  insets: EdgeInsets;
  frame: Rect;
}

// Constants
const defaultInsets: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const defaultFrame: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const initialWindowMetrics: Metrics | null = null;
export const initialWindowSafeAreaInsets: EdgeInsets | null = null;
export const initialMetrics = initialWindowMetrics;

// Contexts
export const SafeAreaInsetsContext = React.createContext<EdgeInsets | null>(null);
export const SafeAreaFrameContext = React.createContext<Rect | null>(null);
export const SafeAreaContext = SafeAreaInsetsContext;
export const SafeAreaConsumer = SafeAreaInsetsContext.Consumer;

// Components
export function SafeAreaProvider({ children, style, initialMetrics: _im, onInsetsChange: _oic, ...rest }: any) {
  return (
    <View style={[{ flex: 1 }, style]} {...rest}>
      <SafeAreaInsetsContext.Provider value={defaultInsets}>
        <SafeAreaFrameContext.Provider value={defaultFrame}>
          {children}
        </SafeAreaFrameContext.Provider>
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

export function SafeAreaView({ children, style, edges, mode, ...rest }: any) {
  return (
    <View style={[{ flex: 1 }, style]} {...rest}>
      {children}
    </View>
  );
}

export function SafeAreaListener({ children, onInsetsChange, ...rest }: any) {
  return (
    <View {...rest}>
      {children}
    </View>
  );
}

// Hooks
export function useSafeAreaInsets(): EdgeInsets {
  return React.useContext(SafeAreaInsetsContext) ?? defaultInsets;
}

export function useSafeAreaFrame(): Rect {
  return React.useContext(SafeAreaFrameContext) ?? defaultFrame;
}

// Deprecated alias
export function useSafeArea(): EdgeInsets {
  return useSafeAreaInsets();
}

// HOC
export function withSafeAreaInsets<T>(WrappedComponent: React.ComponentType<T>) {
  return React.forwardRef((props: any, ref: any) => {
    const insets = useSafeAreaInsets();
    return <WrappedComponent {...props} ref={ref} insets={insets} />;
  });
}
