import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

export default function MediaSlimCard({ item, onClick, selectionMode, isSelected, onSelect }: any) {
  const { theme } = useAppTheme();

  let statusColor = theme.colors.ribbonWatched;
  if (item.status === 'PLAN TO WATCH' || item.status === 'WILL WATCH') statusColor = theme.colors.ribbonWaitlist;
  else if (item.status === 'WATCHING') statusColor = theme.colors.ribbonWatching;

  const imageUri = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : item.image;
  return (
    <TouchableOpacity 
      style={[{ width: '100%', flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 8, overflow: 'hidden', marginBottom: 16, height: 110, borderWidth: 1, borderColor: theme.colors.border }, isSelected && { backgroundColor: theme.colors.surfaceSelected }]} 
      onPress={() => selectionMode ? onSelect(item.id) : onClick(item)}
      onLongPress={() => selectionMode ? null : onSelect(item.id)}
      activeOpacity={0.8}
    >
      <View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 }, { backgroundColor: statusColor }]} />
      {selectionMode && (
        <View style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.text, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface }}>
          {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary }} />}
        </View>
      )}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={{ width: 75, height: '100%', backgroundColor: theme.colors.surfaceHighlight }} resizeMode="cover" />
      ) : (
        <View style={{ width: 75, height: '100%', backgroundColor: theme.colors.surfaceHighlight }} />
      )}
      
      <View style={{ flex: 1, padding: 12, justifyContent: 'center' }}>
         <Text style={{ color: theme.colors.text, fontWeight: '800', letterSpacing: 1.0, fontSize: 16, marginBottom: 4 }} numberOfLines={2}>{item.title || item.name}</Text>
         <Text style={{ color: theme.colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'serif', fontWeight: '500', letterSpacing: 0.5, fontSize: 13 }}>{item.year}  •  {item.title ? (item.runtime ? `${Math.floor(item.runtime/60)}h ${item.runtime%60}m` : '') : 'Series'}</Text>
      </View>

      <View style={{ position: 'absolute', bottom: 18, right: -28, backgroundColor: statusColor, width: 110, height: 22, transform: [{ rotate: '-45deg' }], alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
        <Text style={{ color: theme.colors.background, fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
          {item.status === 'PLAN TO WATCH' || item.status === 'WILL WATCH' ? 'WAITLIST' : item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
