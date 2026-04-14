import React, { useRef, useCallback, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutGrid, Film, Tv, Search, HardDrive } from 'lucide-react-native';
import { View, Text, StyleSheet, StatusBar, Platform, TouchableOpacity, Animated, Pressable, Dimensions } from 'react-native';

import { useAppTheme } from '../context/ThemeContext';
import SwipeableTabView from '../components/SwipeableTabView';

import MoviesScreen from '../screens/MoviesScreen';
import TVScreen from '../screens/TVScreen';
import SearchScreen from '../screens/SearchScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import BackupScreen from '../screens/BackupScreen';

const Stack = createNativeStackNavigator();

const TAB_NAMES = ['Analytics', 'Movies', 'Series', 'Search', 'Backup'];
const TAB_ICONS = [
  { name: 'Analytics', Icon: LayoutGrid },
  { name: 'Movies', Icon: Film },
  { name: 'Series', Icon: Tv },
  { name: 'Search', Icon: Search },
  { name: 'Backup', Icon: HardDrive },
];

/**
 * FloatingTabBar — Custom tab bar with theme toggle accordion.
 * Receives activeIndex + onTabPress for synchronized navigation.
 */
function FloatingTabBar({ 
  activeIndex, 
  onTabPress 
}: { 
  activeIndex: number; 
  onTabPress: (index: number) => void;
}) {
  const { theme, isDarkMode, toggleTheme } = useAppTheme();
  const [showAccordion, setShowAccordion] = React.useState(false);
  const accordionHeight = React.useRef(new Animated.Value(0)).current;

  const toggleAccordion = () => {
    if (showAccordion) {
      Animated.timing(accordionHeight, { toValue: 0, duration: 250, useNativeDriver: false }).start(() => setShowAccordion(false));
    } else {
      setShowAccordion(true);
      Animated.spring(accordionHeight, { toValue: 60, friction: 5, useNativeDriver: false }).start();
    }
  };

  return (
    <View style={[styles.floatingTabBar, { backgroundColor: theme.colors.navbar, borderColor: theme.colors.border }]}>
      
      {showAccordion && (
        <Pressable 
          onPress={() => toggleAccordion()}
          style={{ position: 'absolute', top: -Dimensions.get('window').height, left: -Dimensions.get('window').width, width: Dimensions.get('window').width * 3, height: Dimensions.get('window').height * 3, zIndex: -1 }}
        />
      )}

      {/* Hidden Theme Toggle Accordion */}
      <Animated.View style={{
        position: 'absolute', bottom: 70, left: 0, right: 0, height: accordionHeight,
        opacity: accordionHeight.interpolate({ inputRange: [0, 60], outputRange: [0, 1] }),
        transform: [{ translateY: accordionHeight.interpolate({ inputRange: [0, 60], outputRange: [20, 0] }) }],
        backgroundColor: theme.colors.surfaceHighlight, borderRadius: 24, 
        justifyContent: 'center', alignItems: 'center', pointerEvents: showAccordion ? 'auto' : 'none'
      }}>
        {showAccordion && (
          <TouchableOpacity onPress={() => { toggleTheme(); toggleAccordion(); }} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: isDarkMode ? '#FFF' : '#000' }} />
            <Text style={{ color: theme.colors.text, fontWeight: '800', letterSpacing: 1 }}>
              SWITCH TO {isDarkMode ? 'LIGHT' : 'DARK'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {TAB_ICONS.map((tab, index) => {
        const isFocused = activeIndex === index;
        const color = isFocused ? theme.colors.primary : theme.colors.navbarItem;
        const IconComponent = <tab.Icon size={24} color={color} strokeWidth={isFocused ? 2 : 1.5} />;

        return (
          <TouchableOpacity 
            key={tab.name} 
            activeOpacity={0.8} 
            onPress={() => onTabPress(index)}
            onLongPress={() => toggleAccordion()} 
            style={styles.tabBarItem}
          >
            {IconComponent}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * MainTabs — Renders all tab screens inside SwipeableTabView.
 * Uses Gesture Handler + Reanimated for 60 FPS swipe navigation.
 */
function MainTabs() {
  const { theme } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollToRef = useRef<((index: number) => void) | null>(null);

  const handleTabPress = useCallback((index: number) => {
    if (scrollToRef.current) {
      scrollToRef.current(index);
    }
    setActiveIndex(index);
  }, []);

  const handlePageChange = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SwipeableTabView
        onPageChange={handlePageChange}
        scrollToRef={scrollToRef}
        showDots={true}
        activeDotColor={theme.colors.primary}
        inactiveDotColor={theme.colors.navbarItem + '44'}
      >
        <AnalyticsScreen {...{ navigation: { navigate: (name: string) => handleTabPress(TAB_NAMES.indexOf(name)) } } as any} />
        <MoviesScreen navigation={{ navigate: (name: string) => handleTabPress(TAB_NAMES.indexOf(name)) }} />
        <TVScreen navigation={{ navigate: (name: string) => handleTabPress(TAB_NAMES.indexOf(name)) }} />
        <SearchScreen {...{ navigation: { navigate: (name: string) => handleTabPress(TAB_NAMES.indexOf(name)) } } as any} />
        <BackupScreen {...{ navigation: { navigate: (name: string) => handleTabPress(TAB_NAMES.indexOf(name)) } } as any} />
      </SwipeableTabView>

      <FloatingTabBar activeIndex={activeIndex} onTabPress={handleTabPress} />
    </View>
  );
}

export default function RootNavigator() {
  const { theme, isDarkMode } = useAppTheme();

  const NavigationDynamicTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  return (
    <NavigationContainer theme={NavigationDynamicTheme}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  floatingTabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 40,
    right: 40,
    elevation: 8,
    borderRadius: 32,
    height: 64,
    borderWidth: 1,
    boxShadow: '0px 10px 20px rgba(0,0,0,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabBarItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

