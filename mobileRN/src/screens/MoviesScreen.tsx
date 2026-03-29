declare var window: any;
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert, Platform, ImageBackground, Linking, Dimensions, Animated } from 'react-native';
import { Plus, X, Trash2, CheckSquare, Play, RefreshCw, Search, ChevronRight } from 'lucide-react-native';
import MediaSlimCard from '../components/MediaSlimCard';
import { FadeInUp, smoothLayoutAnimation, springLayoutAnimation } from '../utils/animations';
import { useLibrary } from '../context/LibraryContext';
import { fetchMovieDetails } from '../services/tmdb';
import { useAppTheme } from '../context/ThemeContext';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';

const AnimatedPill = ({ title, isActive, activeColor, onSelect }: any) => {
  const { theme } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    onSelect();
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start();
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={{flex: 1}}>
      <Animated.View style={[
        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 24 },
        isActive ? { backgroundColor: activeColor } : { backgroundColor: theme.colors.surfaceHighlight },
        { transform: [{ scale }] }
      ]}>
        <Text style={[{ fontFamily: 'Open Sans', fontWeight: '800' as const, letterSpacing: 1.0, fontSize: 13 }, isActive ? { color: theme.colors.background } : { color: theme.colors.text }]}>{title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const FONT_REGULAR = { fontFamily: 'Open Sans', fontWeight: '500' as const, letterSpacing: 0.5 };
const FONT_BOLD = { fontFamily: 'Open Sans', fontWeight: '800' as const, letterSpacing: 1.0 };
const { width } = Dimensions.get('window');

export default function MoviesScreen({ navigation }: any) {
  const { theme, isDarkMode } = useAppTheme(); // Consuming useAppTheme
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]); // Dynamic styles

  const { movies, updateMovie, removeMovie } = useLibrary();

  const cycleStatus = (current: string) => {
    const s = ['WATCHED', 'WATCHING', 'PLAN TO WATCH'];
    const i = s.indexOf(current);
    return s[(i + 1) % s.length] || s[0];
  };

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<{type: 'single'|'bulk'} | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const displayedMovies = useMemo(() => {
    let list = [...movies];
    if (statusFilter) list = list.filter(m => m.status === statusFilter);
    list.sort((a, b) => (b.year || 0) - (a.year || 0));
    return list;
  }, [movies, statusFilter]);

  const groupedByYear = useMemo(() => {
    const map: Record<number, any[]> = {};
    displayedMovies.forEach(m => {
      if (!map[m.year]) map[m.year] = [];
      map[m.year].push(m);
    });
    const years = Object.keys(map).map(Number).sort((a, b) => b - a);
    return { map, years };
  }, [displayedMovies]);

  const handleMovieClick = async (movie: any) => {
    if (selectionMode) return;
    smoothLayoutAnimation();
    setSelectedMovie(movie);
    if (movie.cast && movie.cast.length > 0 && typeof movie.cast[0].profile_path !== 'undefined' && movie.runtime !== undefined) return;
    
    try {
      const details = await fetchMovieDetails(movie.id);
      if (details) {
        const cast = details.credits?.cast?.slice(0, 5).map((c: any) => ({ name: c.name, role: c.character, profile_path: c.profile_path })) || [];
        const runtime = details.runtime || 0;
        const summary = details.overview || movie.summary;
        const trailer = details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
        const updated = { ...movie, summary, cast, runtime, trailer, poster_path: details.poster_path, backdrop_path: details.backdrop_path };
        setSelectedMovie(updated);
        updateMovie(movie.id, updated);
      }
    } catch (e) {
      console.log('Failed fetching details', e);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { 
      const next = new Set(prev); 
      next.has(id) ? next.delete(id) : next.add(id); 
      return next; 
    });
  };

  const exitSelectionMode = () => { 
    setSelectionMode(false); 
    setSelectedIds(new Set()); 
  };

  const handleBulkDelete = () => {
    setConfirmDelete({ type: 'bulk' });
  };

  // Back button handler for web (browser back)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (selectedMovie) {
      window.history.pushState({ modal: 'movie' }, '');
      const handler = () => {
        smoothLayoutAnimation();
        setSelectedMovie(null);
      };
      window.addEventListener('popstate', handler);
      return () => window.removeEventListener('popstate', handler);
    }
  }, [selectedMovie]);

  const handleDeleteSingle = () => {
    if (!selectedMovie) return;
    setConfirmDelete({ type: 'single' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.superTitle}>LIBRARY</Text>
          <Text style={styles.headerTitle}>Movies <Text style={styles.headerSubtitle}>({displayedMovies.length})</Text></Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {!selectionMode ? (
            <>
              {movies.length > 0 && (
                <TouchableOpacity onPress={() => setSelectionMode(true)} style={styles.iconButton}>
                  <CheckSquare size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.iconButton}>
                <Plus size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {selectedIds.size > 0 && (
                <TouchableOpacity onPress={handleBulkDelete} style={[styles.iconButton, { backgroundColor: theme.colors.danger + '22' }]}>
                  <Trash2 size={20} color={theme.colors.danger} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={exitSelectionMode} style={styles.iconButton}>
                <X size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 4, gap: 8 }}>
          <TouchableOpacity onPress={() => { smoothLayoutAnimation(); setStatusFilter(null); }} style={[styles.filterPill, !statusFilter && styles.filterPillActive]}>
            <Text style={[styles.filterPillText, !statusFilter && styles.filterPillTextActive]}>All</Text>
          </TouchableOpacity>
          {['WATCHED', 'WATCHING', 'PLAN TO WATCH'].map((status) => {
            const pillColor = status === 'WATCHED' ? theme.colors.ribbonWatched : status === 'WATCHING' ? theme.colors.ribbonWatching : theme.colors.ribbonWaitlist;
            return (
              <TouchableOpacity key={status} onPress={() => { smoothLayoutAnimation(); setStatusFilter(status); }} style={[styles.filterPill, statusFilter === status && { backgroundColor: pillColor, borderColor: pillColor }]}>
                <Text style={[styles.filterPillText, statusFilter === status && styles.filterPillTextActive]}>{status === 'PLAN TO WATCH' ? 'Waitlist' : status === 'WATCHING' ? 'Watching' : 'Watched'}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {movies.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your movie archive is empty.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Add Movies</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupedByYear.years.map(year => (
            <View key={year} style={styles.yearSection}>
              <View style={styles.yearHeader}>
                <Text style={styles.yearTitle}>{year}</Text>
                <View style={styles.yearLine} />
              </View>
              <View style={styles.gridContainer}>
                {groupedByYear.map[year].map((movie, index) => (
                  <FadeInUp key={movie.id} delay={index * 30}>
                    <MediaSlimCard 
                      item={movie} 
                      onClick={handleMovieClick}
                      selectionMode={selectionMode}
                      isSelected={selectedIds.has(movie.id)}
                      onSelect={toggleSelect}
                    />
                  </FadeInUp>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Cinematic Detail Modal */}
      <Modal visible={!!selectedMovie} animationType="slide" presentationStyle="overFullScreen" transparent onRequestClose={() => setSelectedMovie(null)}>
        {selectedMovie && (
          <View style={{ flex: 1, backgroundColor: theme.colors.background, overflow: 'hidden' }}>
             {/* TOP LEFT STATUS RIBBON */}
             {(() => {
                if (!selectedMovie.status) return null;
                let ribbonColor = theme.colors.ribbonWatched;
                let ribbonText = 'WATCHED';
                if (selectedMovie.status === 'WATCHING') {
                  ribbonColor = theme.colors.ribbonWatching;
                  ribbonText = 'WATCHING';
                } else if (selectedMovie.status === 'PLAN TO WATCH' || selectedMovie.status === 'WILL WATCH') {
                  ribbonColor = theme.colors.ribbonWaitlist;
                  ribbonText = 'WAITLIST';
                }
                return (
                  <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 44 : 28, left: -40, backgroundColor: ribbonColor, width: 140, height: 26, transform: [{ rotate: '-45deg' }], alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <Text style={{ color: theme.colors.ribbonText, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>{ribbonText}</Text>
                  </View>
                );
              })()}
            {/* The Backdrop Image is confined to the top half */}
            <View style={{ height: Dimensions.get('window').height * 0.6, width: '100%', position: 'absolute', top: 0, backgroundColor: theme.colors.background }}>
               {selectedMovie.backdrop_path ? (
                  <Image source={{ uri: `https://image.tmdb.org/t/p/w1280${selectedMovie.backdrop_path}` }} style={{ width: '100%', height: '100%', opacity: 0.6 }} />
               ) : (
                  <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                     <Image source={{ uri: selectedMovie.image }} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.4 }} blurRadius={20} />
                     <Image source={{ uri: selectedMovie.image }} style={{ width: '100%', height: '100%', opacity: 0.8 }} resizeMode="contain" />
                  </View>
               )}
               {/* High-res gradient shim arrays to simulate smooth linear fade */}
               {Array.from({ length: 24 }).map((_, i) => (
                 <View 
                   key={`grad-${i}`} 
                   style={{ position: 'absolute', bottom: (23 - i) * 4, left: 0, right: 0, height: 4.5, backgroundColor: isDarkMode ? `rgba(0,0,0,${(i / 23).toFixed(2)})` : `rgba(249, 249, 251, ${(i / 23).toFixed(2)})` }} 
                 />
               ))}
            </View>

            <View style={styles.modalFloatingHeader}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => { smoothLayoutAnimation(); setSelectedMovie(null); }}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false} bounces={false}>
              
              <View style={{ paddingTop: Dimensions.get('window').height * 0.45, paddingHorizontal: 24 }}>
                 <Text style={styles.modalTitle} numberOfLines={3}>{selectedMovie.title}</Text>
                 <Text style={styles.modalMeta}>
                    {selectedMovie.year}   •   {selectedMovie.runtime ? `${Math.floor(selectedMovie.runtime / 60)}h ${selectedMovie.runtime % 60}m` : '? min'}
                 </Text>
              </View>

              {/* Status Segmented Controls */}
              <View style={[styles.modalActionButtons, { gap: 8, paddingHorizontal: 24, paddingBottom: 16, marginTop: 12 }]}>
                <AnimatedPill 
                  title="WATCHED" 
                  isActive={selectedMovie.status === 'WATCHED'} 
                  activeColor={theme.colors.ribbonWatched} 
                  onSelect={() => {
                    updateMovie(selectedMovie.id, { status: 'WATCHED' });
                    smoothLayoutAnimation();
                    setSelectedMovie({ ...selectedMovie, status: 'WATCHED' });
                  }} 
                />
                <AnimatedPill 
                  title="WATCHING" 
                  isActive={selectedMovie.status === 'WATCHING'} 
                  activeColor={theme.colors.ribbonWatching} 
                  onSelect={() => {
                    updateMovie(selectedMovie.id, { status: 'WATCHING' });
                    smoothLayoutAnimation();
                    setSelectedMovie({ ...selectedMovie, status: 'WATCHING' });
                  }} 
                />
                <AnimatedPill 
                  title="WAITLIST" 
                  isActive={selectedMovie.status === 'PLAN TO WATCH' || selectedMovie.status === 'WILL WATCH'} 
                  activeColor={theme.colors.ribbonWaitlist} 
                  onSelect={() => {
                    updateMovie(selectedMovie.id, { status: 'PLAN TO WATCH' });
                    smoothLayoutAnimation();
                    setSelectedMovie({ ...selectedMovie, status: 'PLAN TO WATCH' });
                  }} 
                />
              </View>
              <View style={[styles.modalContentCore, { paddingTop: 24 }]}>
                 {selectedMovie.summary && (
                   <View style={styles.summarySection}>
                     <Text style={styles.modalSummary}>{selectedMovie.summary}</Text>
                   </View>
                 )}

                 {selectedMovie.cast && selectedMovie.cast.length > 0 && (
                   <View style={[styles.castSection, { marginHorizontal: -24 }]}>
                     <Text style={[styles.sectionHeading, { paddingHorizontal: 24 }]}>TOP CAST</Text>
                     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 24 }}>
                       {selectedMovie.cast.map((c: any, i: number) => (
                         <View key={i} style={styles.castBubble}>
                           <View style={[styles.castCircLight, { overflow: 'hidden' }]}>
                              {c.profile_path ? (
                                <Image source={{ uri: `https://image.tmdb.org/t/p/w400${c.profile_path}` }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                              ) : (
                                <Text style={{color: theme.colors.text, ...FONT_BOLD, fontSize: 16}}>{c.name.charAt(0)}</Text>
                              )}
                           </View>
                           <Text style={styles.castName} numberOfLines={1}>{c.name}</Text>
                           <Text style={styles.castRole} numberOfLines={1}>{c.role}</Text>
                         </View>
                       ))}
                     </ScrollView>
                   </View>
                  )}
                  
                  {/* Play Trailer - pinned to bottom */}
                  {selectedMovie.trailer && (
                    <View style={{ marginTop: 12 }}>
                      <TouchableOpacity style={[styles.pillBtnPrimary, { borderRadius: 24 }]} onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${selectedMovie.trailer}`)} activeOpacity={0.8}>
                        <Play size={20} fill={theme.colors.primaryText} color={theme.colors.primaryText} />
                        <Text style={styles.pillBtnPrimaryText}>Play Trailer</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={{ height: 40 }} />
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      <ConfirmDeleteModal
         visible={!!confirmDelete}
         onHide={() => setConfirmDelete(null)}
         title={confirmDelete?.type === 'bulk' ? `Delete ${selectedIds.size} Movies` : 'Delete Movie'}
         message={confirmDelete?.type === 'bulk' ? `Are you sure you want to completely discard these ${selectedIds.size} movies from your library?` : `Are you sure you want to completely discard ${selectedMovie?.title}?`}
         onConfirm={() => {
           if (confirmDelete?.type === 'bulk') {
             selectedIds.forEach(id => removeMovie(id));
             exitSelectionMode();
           } else {
             removeMovie(selectedMovie.id);
             setSelectedMovie(null);
           }
           setConfirmDelete(null);
         }}
      />
    </View>
  );
}

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  superTitle: { color: theme.colors.primary, ...FONT_BOLD, fontSize: 11, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 36, color: theme.colors.text, ...FONT_BOLD, letterSpacing: 1 },
  headerSubtitle: { fontSize: 16, color: theme.colors.textSecondary, ...FONT_REGULAR },
  iconButton: { padding: 10, borderRadius: 20, backgroundColor: theme.colors.surfaceHighlight, marginLeft: 8 },
  
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  filterPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterPillText: { color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 13 },
  filterPillTextActive: { color: theme.colors.background, ...FONT_BOLD },

  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: theme.colors.textSecondary, ...FONT_BOLD, marginBottom: 24 },
  actionButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4 },
  actionButtonText: { color: theme.colors.background, ...FONT_BOLD },
  
  yearSection: { marginBottom: 32 },
  yearHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  yearTitle: { color: theme.colors.text, fontSize: 18, ...FONT_BOLD, marginRight: 16 },
  yearLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  
  gridContainer: { flex: 1, gap: 12 },
  slimCard: { width: '100%', flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 8, overflow: 'hidden', marginBottom: 16, height: 110, borderWidth: 1, borderColor: theme.colors.border },
  slimCardSelected: { backgroundColor: theme.colors.surfaceSelected },
  slimPoster: { width: 75, height: '100%', backgroundColor: theme.colors.surfaceHighlight },
  slimCardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  slimCardTitle: { color: theme.colors.text, ...FONT_BOLD, fontSize: 16, marginBottom: 4 },
  slimCardMeta: { color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 13 },
  slimStatusText: { color: theme.colors.background, ...FONT_BOLD, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  statusLine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  slimCheckCircle: { position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.text, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface },
  slimCheckDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },

  // Rich Cinematic Modal
  modalFloatingHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 24, zIndex: 100 },
  closeBtn: { padding: 8, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', borderRadius: 20 },
  
  modalTitle: { fontSize: 38, color: theme.colors.text, ...FONT_BOLD, marginBottom: 8, lineHeight: 42, textShadowColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'transparent', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 15 } as any,
  modalMeta: { fontSize: 13, color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.9)', ...FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1, textShadowColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 10 } as any,
  
  modalActionButtons: { flexDirection: 'row', gap: 12, marginTop: 24, paddingHorizontal: 24, paddingBottom: 24 },
  pillBtnPrimary: { flex: 1, backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 8 },
  pillBtnPrimaryText: { color: theme.colors.primaryText, ...FONT_BOLD, fontSize: 15, marginLeft: 8 },
  pillBtnDanger: { backgroundColor: theme.colors.danger + '22', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.danger },
  
  modalContentCore: { backgroundColor: theme.colors.background, paddingHorizontal: 24, paddingBottom: 40 },
  summarySection: { marginBottom: 32 },
  sectionHeading: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 11, letterSpacing: 2, marginBottom: 12 },
  modalSummary: { color: theme.colors.text, ...FONT_REGULAR, fontSize: 15, lineHeight: 24, opacity: 0.9 },
  
  castSection: { marginBottom: 20 },
  castBubble: { alignItems: 'center', width: 70 },
  castCircLight: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.surfaceHighlight, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  castName: { color: theme.colors.text, ...FONT_BOLD, fontSize: 11, textAlign: 'center', marginBottom: 2 },
  castRole: { color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 10, textAlign: 'center' }
});
