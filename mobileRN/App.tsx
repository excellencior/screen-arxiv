import React from 'react';
import { View, LogBox, Platform, Text } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import Toast, { BaseToastProps } from 'react-native-toast-message';
import { LibraryProvider } from './src/context/LibraryContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';

LogBox.ignoreLogs(['props.pointerEvents is deprecated']);

if (Platform.OS === 'web') {
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('props.pointerEvents')) return;
    originalError(...args);
  };
}
const AppContent = () => {
  const { theme, isDarkMode } = useAppTheme();

  const toastConfig = {
    success: (props: BaseToastProps) => (
      <View style={{ width: '90%', backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderLeftWidth: 4, borderLeftColor: theme.colors.ribbonWatched, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 14, marginBottom: 2 }}>{props.text1}</Text>
        {props.text2 && <Text style={{ color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 }}>{props.text2}</Text>}
      </View>
    ),
    error: (props: BaseToastProps) => (
      <View style={{ width: '90%', backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderLeftWidth: 4, borderLeftColor: theme.colors.danger, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 14, marginBottom: 2 }}>{props.text1}</Text>
        {props.text2 && <Text style={{ color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 }}>{props.text2}</Text>}
      </View>
    ),
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <RootNavigator />
      <Toast config={toastConfig} />
    </View>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <AppContent />
      </LibraryProvider>
    </ThemeProvider>
  );
}
