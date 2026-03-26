import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { Play, TrendingUp, Layers, CalendarDays, Clapperboard, Star } from 'lucide-react-native';
import { useLibrary } from '../context/LibraryContext';
import { fetchGenreMap } from '../services/tmdb';
import {
  computeOverviewStats,
  computeEpisodeProgress,
  computeReleaseYearDistribution,
  computeGenreDistribution,
  computeTopLists,
  computeViewingBehavior,
} from '../services/analytics';
import { StatusToggle, STATUS_COLOR_MAP } from '../types';
import { useAppTheme } from '../context/ThemeContext';

const FONT_REGULAR = { fontFamily: 'Open Sans', fontWeight: '500' as const, letterSpacing: 0.5 };
const FONT_BOLD = { fontFamily: 'Open Sans', fontWeight: '800' as const, letterSpacing: 1.0 };
const SCREEN_WIDTH = Dimensions.get('window').width;

function FilterPill({ label, active, onClick, theme, isDarkMode }: { label: string; active: boolean; onClick: () => void, theme: any, isDarkMode: boolean }) {
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onClick}
      style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive]}
    >
      <Text style={[styles.filterPillText, active ? { color: theme.colors.primaryText } : { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function AnalyticsScreen() {
  const { theme, isDarkMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { movies, shows, typeToggle, statusToggle, setTypeToggle, setStatusToggle } = useLibrary();
  const [genreMap, setGenreMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    fetchGenreMap().then(setGenreMap);
  }, []);

  const toggleType = (key: 'movies' | 'tv') => setTypeToggle({ ...typeToggle, [key]: !typeToggle[key] });
  const toggleStatus = (key: keyof StatusToggle) => setStatusToggle({ ...statusToggle, [key]: !statusToggle[key] });

  const filteredMovies = useMemo(() => {
    if (!typeToggle.movies) return [];
    return movies.filter(x => {
      const s = x.status;
      if ((s === 'WATCHED' || s === 'DONE') && statusToggle.WATCHED) return true;
      if (s === 'WATCHING' && statusToggle.WATCHING) return true;
      if (s === 'WILL WATCH' && statusToggle['WILL WATCH']) return true;
      if (s === 'ON HOLD' && statusToggle['ON HOLD']) return true;
      return false;
    });
  }, [movies, typeToggle, statusToggle]);

  const filteredShows = useMemo(() => {
    if (!typeToggle.tv) return [];
    return shows.filter(x => {
      const st = x.status;
      if ((st === 'WATCHED' || st === 'DONE') && statusToggle.WATCHED) return true;
      if (st === 'WATCHING' && statusToggle.WATCHING) return true;
      if (st === 'WILL WATCH' && statusToggle['WILL WATCH']) return true;
      if (st === 'ON HOLD' && statusToggle['ON HOLD']) return true;
      return false;
    });
  }, [shows, typeToggle, statusToggle]);

  const overview = useMemo(() => computeOverviewStats(filteredMovies, filteredShows), [filteredMovies, filteredShows]);
  const episodeProgress = useMemo(() => computeEpisodeProgress(filteredShows), [filteredShows]);
  const decades = useMemo(() => computeReleaseYearDistribution(filteredMovies, filteredShows), [filteredShows, filteredMovies]);
  const genres = useMemo(() => computeGenreDistribution(filteredMovies, filteredShows, genreMap), [filteredMovies, filteredShows, genreMap]);
  const topLists = useMemo(() => computeTopLists(filteredMovies, filteredShows), [filteredMovies, filteredShows]);
  const behavior = useMemo(() => computeViewingBehavior(filteredMovies, filteredShows), [filteredMovies, filteredShows]);

  const totalItems = overview.totalMovies + overview.totalShows;
  const watchDays = Math.floor(overview.totalWatchTimeMinutes / (24 * 60));
  const watchHours = Math.floor((overview.totalWatchTimeMinutes % (24 * 60)) / 60);

  // Status Bar processing
  const ordered = ['WATCHING', 'WILL WATCH', 'WATCHED', 'DONE', 'ON HOLD'];
  let watchedPct = 0, watchedCount = 0;
  const mergedStatus: any[] = [];
  
  ordered.forEach(s => {
    if (!overview.statusCounts[s]) return;
    const count = overview.statusCounts[s];
    const pct = (count / totalItems) * 100;
    if (s === 'WATCHED' || s === 'DONE') {
      watchedPct += pct;
      watchedCount += count;
    } else {
      mergedStatus.push({ status: s, count, pct });
    }
  });
  if (watchedCount > 0) mergedStatus.push({ status: 'WATCHED', count: watchedCount, pct: watchedPct });
  mergedStatus.sort((a, b) => b.pct - a.pct);

  if (totalItems === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
         <Clapperboard size={48} color={theme.colors.border} />
         <Text style={{ color: theme.colors.textSecondary, marginTop: 24, ...FONT_REGULAR }}>No watch data available.</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    if (status === 'WATCHED' || status === 'DONE') return theme.colors.ribbonWatched;
    if (status === 'WATCHING') return theme.colors.ribbonWatching;
    if (status === 'WILL WATCH') return theme.colors.ribbonWaitlist;
    return theme.colors.textSecondary;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Massive Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>LIFETIME WATCH TIME</Text>
        <View style={styles.heroValueContainer}>
          <Text style={styles.heroNumber} numberOfLines={1} adjustsFontSizeToFit>{watchDays}</Text>
          <Text style={styles.heroUnit}>D</Text>
          <Text style={[styles.heroNumber, { marginLeft: 16 }]} numberOfLines={1} adjustsFontSizeToFit>{watchHours}</Text>
          <Text style={styles.heroUnit}>H</Text>
        </View>
        <View style={styles.heroGlowBar} />
      </View>

      {/* Control Panel (Filters) */}
      <View style={styles.controlPanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
          <FilterPill label="Movies" active={typeToggle.movies} onClick={() => toggleType('movies')} theme={theme} isDarkMode={isDarkMode} />
          <FilterPill label="Series" active={typeToggle.tv} onClick={() => toggleType('tv')} theme={theme} isDarkMode={isDarkMode} />
          <View style={{ width: 1, backgroundColor: theme.colors.border, marginHorizontal: 4 }} />
          <FilterPill label="Watched" active={statusToggle.WATCHED} onClick={() => toggleStatus('WATCHED')} theme={theme} isDarkMode={isDarkMode} />
          <FilterPill label="Watching" active={statusToggle.WATCHING} onClick={() => toggleStatus('WATCHING')} theme={theme} isDarkMode={isDarkMode} />
          <FilterPill label="Waitlist" active={statusToggle['WILL WATCH']} onClick={() => toggleStatus('WILL WATCH')} theme={theme} isDarkMode={isDarkMode} />
        </ScrollView>
      </View>

      <View style={styles.bodyPadding}>
        
        {/* The Archive */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>THE ARCHIVE</Text>
          <View style={styles.archiveRow}>
            <View style={[styles.archiveCard, { borderLeftColor: theme.colors.primary }]}>
              <Text style={styles.archiveStat}>{overview.totalMovies}</Text>
              <Text style={styles.archiveStatLabel}>MOVIES</Text>
            </View>
            <View style={[styles.archiveCard, { borderLeftColor: theme.colors.accent }]}>
              <Text style={styles.archiveStat}>{overview.totalShows}</Text>
              <Text style={styles.archiveStatLabel}>SERIES</Text>
            </View>
            <View style={[styles.archiveCard, { borderLeftColor: theme.colors.ribbonWatched }]}>
              <Text style={styles.archiveStat}>{overview.totalEpisodesWatched}</Text>
              <Text style={styles.archiveStatLabel}>EPISODES</Text>
            </View>
          </View>
        </View>

        {/* The Pipeline (Status Chart) */}
        {mergedStatus.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>THE PIPELINE</Text>
            <View style={styles.pipelineContainer}>
              <View style={styles.pipelineTrack}>
                {mergedStatus.map((seg, i) => (
                  <View 
                    key={seg.status} 
                    style={{ 
                      width: `${seg.pct}%`, 
                      backgroundColor: getStatusColor(seg.status),
                      borderLeftWidth: i > 0 ? 2 : 0,
                      borderColor: theme.colors.background
                    }} 
                  />
                ))}
              </View>
              <View style={styles.pipelineLegend}>
                {mergedStatus.map(seg => (
                  <View key={seg.status} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: getStatusColor(seg.status) }]} />
                    <Text style={styles.legendText}>{seg.status === 'WILL WATCH' ? 'WAITLIST' : seg.status} <Text style={{opacity: 0.5}}>({seg.count})</Text></Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Top Genres Overlap Pills */}
        {genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>CINEMATIC DNA</Text>
            <View style={styles.genreContainer}>
              {genres.slice(0, 8).map((g: any, i: number) => {
                const max = genres[0].count;
                const intensity = g.count / max;
                return (
                  <View key={i} style={[styles.genrePill, { backgroundColor: isDarkMode ? `rgba(250, 255, 0, ${0.1 + (intensity * 0.4)})` : `rgba(0, 0, 0, ${0.1 + (intensity * 0.4)})` }]}>
                    <Text style={[styles.genreText, { color: isDarkMode ? (intensity > 0.6 ? '#000' : theme.colors.primary) : (intensity > 0.6 ? '#FFF' : theme.colors.text) }]}>
                      {g.name} <Text style={{ opacity: 0.5 }}>{g.count}</Text>
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Additions Carousel */}
        {typeToggle.movies && topLists.recentMovies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>RECENT MOVIES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselTrack}>
              {topLists.recentMovies.map((movie: any) => (
                <View key={movie.id} style={styles.carouselItem}>
                  <Image source={{ uri: movie.image }} style={styles.carouselPoster} />
                  <Text style={styles.carouselTitle} numberOfLines={1}>{movie.title}</Text>
                  <Text style={styles.carouselSub}>{movie.detail}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Active Series Progress */}
        {typeToggle.tv && episodeProgress.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>ACTIVE SERIES PROGRESS</Text>
            <View style={styles.activeSeriesContainer}>
              {episodeProgress.map((ep: any) => (
                <View key={ep.id} style={styles.activeSeriesRow}>
                  <View style={styles.activeSeriesInfo}>
                     <Text style={styles.activeSeriesTitle} numberOfLines={1}>{ep.title}</Text>
                     <Text style={styles.activeSeriesStats}>{ep.watched} / {ep.total} EPS</Text>
                  </View>
                  <View style={styles.activeSeriesTrack}>
                    <View style={[styles.activeSeriesFill, { width: `${ep.percentage}%`, backgroundColor: ep.percentage === 100 ? theme.colors.ribbonWatched : theme.colors.primary }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 100 },
  
  // Hero Section
  heroSection: { paddingTop: Platform.OS === 'ios' ? 80 : 60, paddingHorizontal: 24, alignItems: 'center', marginBottom: 24 },
  heroLabel: { color: theme.colors.primary, ...FONT_BOLD, fontSize: 13, letterSpacing: 3, marginBottom: 8 },
  heroValueContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  heroNumber: { color: theme.colors.text, ...FONT_BOLD, fontSize: 72, lineHeight: 80 },
  heroUnit: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 24, marginTop: 12, marginRight: 16 },
  heroGlowBar: { width: 40, height: 4, backgroundColor: theme.colors.primary, borderRadius: 2, marginTop: 24, boxShadow: isDarkMode ? `0px 0px 10px ${theme.colors.primary}` : 'none' },

  // Control Panel
  controlPanel: { marginBottom: 32, paddingVertical: 16, borderBottomWidth: 1, borderTopWidth: 1, borderColor: theme.colors.border },
  filterPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, borderWidth: 1 },
  filterPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterPillInactive: { backgroundColor: 'transparent', borderColor: theme.colors.border },
  filterPillText: { ...FONT_BOLD, fontSize: 12, letterSpacing: 1 },

  // Body Alignment
  bodyPadding: { paddingHorizontal: 24 },

  section: { marginBottom: 48 },
  sectionHeader: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 12, letterSpacing: 2, marginBottom: 20 },

  // Archive Boxes
  archiveRow: { flexDirection: 'row', gap: 12 },
  archiveCard: { flex: 1, backgroundColor: theme.colors.surface, padding: 20, borderRadius: 12, borderLeftWidth: 3 },
  archiveStat: { color: theme.colors.text, ...FONT_BOLD, fontSize: 32, marginBottom: 4 },
  archiveStatLabel: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 10, letterSpacing: 1.5 },

  // Pipeline (Status bar)
  pipelineContainer: { backgroundColor: theme.colors.surface, padding: 24, borderRadius: 12 },
  pipelineTrack: { height: 16, borderRadius: 8, flexDirection: 'row', overflow: 'hidden', marginBottom: 24 },
  pipelineLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  legendText: { color: theme.colors.text, ...FONT_BOLD, fontSize: 10, letterSpacing: 0.5 },

  // Genres
  genreContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genrePill: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  genreText: { ...FONT_BOLD, fontSize: 12, letterSpacing: 1 },

  // Carousel
  carouselTrack: { gap: 16, paddingRight: 24 },
  carouselItem: { width: 120 },
  carouselPoster: { width: 120, height: 180, borderRadius: 8, backgroundColor: theme.colors.surfaceHighlight, marginBottom: 12 },
  carouselTitle: { color: theme.colors.text, ...FONT_BOLD, fontSize: 13, marginBottom: 4 },
  carouselSub: { color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 11 },

  // Series Progress
  activeSeriesContainer: { backgroundColor: theme.colors.surface, padding: 20, borderRadius: 12 },
  activeSeriesRow: { marginBottom: 20 },
  activeSeriesInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  activeSeriesTitle: { color: theme.colors.text, ...FONT_BOLD, fontSize: 14, flex: 1 },
  activeSeriesStats: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 10, letterSpacing: 1, marginLeft: 12 },
  activeSeriesTrack: { height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden' },
  activeSeriesFill: { height: '100%' }
});
