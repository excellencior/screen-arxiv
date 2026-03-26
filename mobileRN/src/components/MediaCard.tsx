import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

interface MediaCardProps {
  title: string;
  imageUri?: string;
  onPress?: () => void;
}

export default function MediaCard({ title, imageUri, onPress }: MediaCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    boxShadow: '0px 0px 4px rgba(0,0,0,0.1)',
    marginVertical: 6,
    overflow: 'hidden',
  },
  image: {
    width: 80,
    height: 120,
    backgroundColor: '#e0e0e0',
  },
  placeholder: {
    backgroundColor: '#c0c0c0',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
});
