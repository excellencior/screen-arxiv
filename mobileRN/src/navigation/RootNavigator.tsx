import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutGrid, Film, Tv, Search, HardDrive } from 'lucide-react-native';
import { View, Text, StyleSheet, StatusBar, Platform, TouchableOpacity, Animated, Pressable, Dimensions } from 'react-native';

import { useAppTheme } from '../context/ThemeContext';

import MoviesScreen from '../screens/MoviesScreen';
import TVScreen from '../screens/TVScreen';
import SearchScreen from '../screens/SearchScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import BackupScreen from '../screens/BackupScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Dynamic styles derived inside component via useAppTheme

// Global Header explicitly removed to allow edge-to-edge content on screens

function FloatingTabBar({ state, descriptors, navigation }: any) {
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

      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) { navigation.navigate(route.name); }
        };

        const onLongPress = () => toggleAccordion();

        const color = isFocused ? theme.colors.primary : theme.colors.navbarItem;
        let IconComponent = null;

        if (route.name === 'Analytics') IconComponent = <LayoutGrid size={24} color={color} strokeWidth={isFocused ? 2 : 1.5} />;
        if (route.name === 'Movies') IconComponent = <Film size={24} color={color} strokeWidth={isFocused ? 2 : 1.5} />;
        if (route.name === 'Series') IconComponent = <Tv size={24} color={color} strokeWidth={isFocused ? 2 : 1.5} />;
        if (route.name === 'Search') IconComponent = <Search size={24} color={color} strokeWidth={isFocused ? 2 : 1.5} />;
        if (route.name === 'Backup') IconComponent = <HardDrive size={24} color={color} strokeWidth={isFocused ? 2 : 1.5} />;

        return (
          <TouchableOpacity key={route.key} activeOpacity={0.8} onPress={onPress} onLongPress={onLongPress} style={styles.tabBarItem}>
            {IconComponent}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }} initialRouteName="Analytics">
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Movies" component={MoviesScreen} />
      <Tab.Screen name="Series" component={TVScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Backup" component={BackupScreen} />
    </Tab.Navigator>
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
