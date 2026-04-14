import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, LightTheme } from '../theme';
import { LayoutAnimation } from 'react-native';

type ThemeType = typeof DarkTheme;

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DarkTheme,
  isDarkMode: true,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@app_theme');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (e) {
        console.error('Error loading theme:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('@app_theme', newMode ? 'dark' : 'light');
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  };

  const theme = isDarkMode ? DarkTheme : LightTheme;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
