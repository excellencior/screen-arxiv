import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Modal, Platform, Dimensions } from 'react-native';
import { Search as SearchIcon, X, Check, Plus } from 'lucide-react-native';
import { useLibrary } from '../context/LibraryContext';
import { FadeInUp } from '../utils/animations';
import { searchMulti, fetchMovieDetails, fetchTVDetails } from '../services/tmdb';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '../context/ThemeContext';

const FONT_REGULAR = { fontFamily: 'Open Sans', fontWeight: '500' as const, letterSpacing: 0.5 };
const FONT_BOLD = { fontFamily: 'Open Sans', fontWeight: '800' as const, letterSpacing: 1.0 };

const { width } = Dimensions.get('window');
const ITEM_WIDTH = Math.floor((width - 32 - 16) / 2);

function SearchSlimCard({ item, existingItem, onAddPress, onPress }: any) {
  const { theme, isDarkMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  const imageUri = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : null;

  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.slimCard} onPress={() => onPress(item)}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.slimPoster} resizeMode="cover" />
      ) : (
        <View style={styles.slimPoster} />
      )}
      
      <View style={styles.slimCardInfo}>
         <Text style={styles.slimCardTitle} numberOfLines={2}>{item.title || item.name}</Text>
         <Text style={styles.slimCardMeta}>{item.release_date?.substring(0,4) || item.first_air_date?.substring(0,4) || ''}  •  {item.media_type === 'movie' ? 'Movie' : 'Series'}</Text>
      </View>

      {existingItem && (
        <View style={[styles.statusLine, { backgroundColor: theme.colors.ribbonWatched }]} />
      )}

      <View style={{ paddingRight: 16, justifyContent: 'center' }}>
        {existingItem ? (
           <View style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
             <Check size={20} color={theme.colors.ribbonWatched} />
           </View>
        ) : (
          <TouchableOpacity onPress={() => onAddPress(item)} activeOpacity={0.8}>
             <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }}>
               <Plus size={16} color={theme.colors.primaryText} />
             </View>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const { theme, isDarkMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { movies, shows, addMovie, addShow, updateMovie, updateShow } = useLibrary();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingItem, setAddingItem] = useState<any>(null); // State for the Add Modal
  const [selectedItem, setSelectedItem] = useState<any>(null); // State for Details Modal

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchMulti(query);
      setResults(data);
    } catch(e) {
      console.log('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  const handleAddSubmit = async (status: string, color: string) => {
    if (!addingItem) return;
    const item = addingItem;
    setAddingItem(null); // Close modal

    const isMovie = item.media_type === 'movie';
    const existingItem = isMovie ? movies.find(m => m.id === item.id) : shows.find(s => s.id === item.id);

    if (existingItem) {
      if (isMovie) updateMovie(item.id, { status, statusColor: color });
      else updateShow(item.id, { status, statusColor: color });
      Toast.show({ type: 'success', text1: 'Updated', text2: `${item.title || item.name} updated to ${status}` });
      return;
    }

    const year = item.release_date ? parseInt(item.release_date.split('-')[0]) : (item.first_air_date ? parseInt(item.first_air_date.split('-')[0]) : new Date().getFullYear());
    const newItem = {
      id: item.id,
      title: item.title || item.name,
      year,
      status,
      statusColor: color,
      image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      backdrop_path: item.backdrop_path || null,
      summary: item.overview,
      media_type: item.media_type,
      ...(isMovie ? {} : { progress: { watched: 0, total: 10 }, number_of_seasons: 1, seasons: [], episodes: [] })
    };

    if (isMovie) {
      addMovie(newItem);
      const details = await fetchMovieDetails(item.id);
      if (details) {
        updateMovie(item.id, {
          runtime: details.runtime || 0,
          cast: details.credits?.cast?.slice(0, 5).map((c: any) => ({ name: c.name, role: c.character, profile_path: c.profile_path })) || [],
        });
      }
    } else {
      addShow(newItem);
      const details = await fetchTVDetails(item.id);
      if (details) {
        updateShow(item.id, {
          number_of_seasons: details.number_of_seasons || details.seasons?.length || 1,
          cast: details.credits?.cast?.slice(0, 5).map((c: any) => ({ name: c.name, role: c.character, profile_path: c.profile_path })) || [],
        });
      }
    }
    Toast.show({ type: 'success', text1: 'Added', text2: `${newItem.title} added to library` });
    setResults([...results]); 
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.superTitle}>DISCOVER</Text>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={styles.searchBar}>
          <SearchIcon size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title..."
            placeholderTextColor={theme.colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={{ padding: 4 }}>
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
        ) : results.length > 0 ? (
          <View style={styles.gridContainer}>
            {results.map((item: any, index: number) => {
              const isMovie = item.media_type === 'movie';
              const exists = isMovie ? movies.find(m => m.id === item.id) : shows.find(s => s.id === item.id);
              if (item.media_type !== 'movie' && item.media_type !== 'tv') return null;
              return (
                <FadeInUp key={`${item.media_type}-${item.id}`} delay={index * 30}>
                  <SearchSlimCard 
                    item={item} 
                    existingItem={exists}
                    onPress={setSelectedItem}
                    onAddPress={setAddingItem}
                  />
                </FadeInUp>
              );
            })}
          </View>
        ) : query && !loading ? (
          <Text style={styles.emptyText}>No results found for "{query}".</Text>
        ) : null}
      </ScrollView>

      {/* Custom Add Status Modal */}
      <Modal visible={!!addingItem} transparent animationType="fade" onRequestClose={() => setAddingItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Add {addingItem?.title || addingItem?.name}</Text>
            <Text style={styles.modalInstruction}>Choose an initial status for this title.</Text>
            
            <View style={{ gap: 8, marginTop: 16 }}>
              <TouchableOpacity style={[styles.statusOption, { borderColor: theme.colors.ribbonWatched }]} onPress={() => handleAddSubmit('WATCHED', 'success')}>
                <Text style={styles.statusOptionText}>Watched</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statusOption, { borderColor: theme.colors.ribbonWatching }]} onPress={() => handleAddSubmit('WATCHING', 'primary')}>
                <Text style={styles.statusOptionText}>Watching</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statusOption, { borderColor: theme.colors.ribbonWaitlist }]} onPress={() => handleAddSubmit('PLAN TO WATCH', 'warning')}>
                <Text style={styles.statusOptionText}>Waitlist</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setAddingItem(null)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal visible={!!selectedItem} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.detailsModalContainer}>
          <ScrollView contentContainerStyle={styles.detailsModalContent}>
            {selectedItem && (
              <>
                {selectedItem.backdrop_path && (
                  <Image source={{ uri: `https://image.tmdb.org/t/p/w500${selectedItem.backdrop_path}` }} style={styles.modalBackdrop} />
                )}
                <View style={styles.detailsModalBody}>
                  <Text style={styles.detailsModalTitle}>{selectedItem.title || selectedItem.name}</Text>
                  <Text style={styles.detailsModalMeta}>
                    {selectedItem.release_date ? parseInt(selectedItem.release_date.split('-')[0]) : (selectedItem.first_air_date ? parseInt(selectedItem.first_air_date.split('-')[0]) : '')}  •  {selectedItem.media_type}
                  </Text>
                  <Text style={styles.detailsModalSummary}>{selectedItem.overview}</Text>
                </View>
              </>
            )}
          </ScrollView>
          <View style={styles.modalActions}>
             <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                <Text style={styles.closeBtnText}>Close</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 20,
  },
  superTitle: { color: theme.colors.primary, ...FONT_BOLD, fontSize: 11, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 36, color: theme.colors.text, ...FONT_BOLD, letterSpacing: 1 },
  
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSelected,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: theme.colors.text,
    ...FONT_REGULAR,
    fontSize: 16,
    marginLeft: 8,
  },
  scrollContent: { padding: 16, paddingBottom: 60 },
  emptyText: { color: theme.colors.textSecondary, ...FONT_REGULAR, textAlign: 'center', marginTop: 40 },
  
  gridContainer: { flex: 1, gap: 12 },
  slimCard: { width: '100%', flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 8, overflow: 'hidden', marginBottom: 16, height: 110 },
  slimPoster: { width: 75, height: '100%', backgroundColor: theme.colors.surfaceHighlight },
  slimCardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  slimCardTitle: { color: theme.colors.text, ...FONT_BOLD, fontSize: 16, marginBottom: 4 },
  slimCardMeta: { color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 13 },
  statusLine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  // Custom Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 400, backgroundColor: theme.colors.surface, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: theme.colors.border },
  modalHeader: { color: theme.colors.text, fontSize: 18, ...FONT_BOLD, marginBottom: 8, textAlign: 'center' },
  modalInstruction: { color: theme.colors.textSecondary, fontSize: 12, ...FONT_REGULAR, textAlign: 'center' },
  statusOption: { paddingVertical: 8, borderWidth: 1, borderRadius: 8, backgroundColor: theme.colors.background, alignItems: 'center' },
  statusOptionText: { color: theme.colors.text, ...FONT_BOLD, fontSize: 14 },
  cancelButton: { marginTop: 16, paddingVertical: 8, backgroundColor: theme.colors.surfaceSelected, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 14 },
  
  detailsModalContainer: { flex: 1, backgroundColor: theme.colors.background },
  detailsModalContent: { paddingBottom: 100 },
  modalBackdrop: { width: '100%', height: 200, backgroundColor: theme.colors.surfaceSelected },
  detailsModalBody: { padding: 24 },
  detailsModalTitle: { fontSize: 24, color: theme.colors.text, ...FONT_BOLD, marginBottom: 8 },
  detailsModalMeta: { fontSize: 12, color: theme.colors.textSecondary, ...FONT_REGULAR, marginBottom: 24, textTransform: 'uppercase' },
  detailsModalSummary: { fontSize: 14, color: theme.colors.text, ...FONT_REGULAR, lineHeight: 22, marginBottom: 24 },
  modalActions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 16, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border },
  closeBtn: { flex: 1, backgroundColor: theme.colors.surfaceSelected, padding: 16, borderRadius: 8, alignItems: 'center' },
  closeBtnText: { color: theme.colors.text, ...FONT_BOLD }
});
