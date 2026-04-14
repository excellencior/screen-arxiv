export const DarkTheme = {
  colors: {
    background: '#000000',
    surface: '#111111',
    surfaceSelected: '#222222',
    surfaceHighlight: '#333333',
    text: '#FFFFFF',
    textSecondary: '#888888',
    textTertiary: '#444444',
    primary: '#FAFF00', // Bright Yellow
    primaryText: '#000000',
    accent: '#FF7A00', // Amber/Orange
    border: '#222222',
    navbar: 'rgba(0, 0, 0, 0.65)',
    navbarItem: 'rgba(255, 255, 255, 0.5)',
    ribbonWatched: '#10b981',
    ribbonWatching: '#3b82f6',
    ribbonWaitlist: '#f59e0b',
    ribbonText: '#FFFFFF',
    danger: '#ff4444'
  },
  isDark: true
};

export const LightTheme = {
  colors: {
    background: '#F9F9FB', // Soft off-white studio background
    surface: '#FFFFFF', // Pure white cards
    surfaceSelected: '#F0F0F4',
    surfaceHighlight: '#E5E5EA',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#AAAAAA',
    primary: '#D39E00', // Deep Premium Gold
    primaryText: '#FFFFFF', // White text on gold chips
    accent: '#D95E00',     // Deep Orange
    border: '#EAEAEA',
    navbar: 'rgba(255, 255, 255, 0.85)',
    navbarItem: 'rgba(0, 0, 0, 0.5)',
    ribbonWatched: '#059669', // Deeper green
    ribbonWatching: '#2563EB', // Deeper blue
    ribbonWaitlist: '#D97706', // Deeper amber
    ribbonText: '#FFFFFF',
    danger: '#DC2626'
  },
  isDark: false
};

// Backward compatibility until refactoring is complete
export const PolestarTheme = DarkTheme;
