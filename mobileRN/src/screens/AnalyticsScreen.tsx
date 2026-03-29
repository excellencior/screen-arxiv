import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Clapperboard } from 'lucide-react-native';
import { useLibrary } from '../context/LibraryContext';
import { fetchGenreMap } from '../services/tmdb';
import {
  computeOverviewStats,
  computeEpisodeProgress,
  computeReleaseYearDistribution,
  computeGenreDistribution,
  computeTopLists,
  computeViewingBehavior,
  computeCompletionMetrics,
  computeRemainingWatchTime,
} from '../services/analytics';
import { StatusToggle } from '../types';
import { useAppTheme } from '../context/ThemeContext';

const FONT_REGULAR = { fontFamily: 'Open Sans', fontWeight: '500' as const, letterSpacing: 0.5 };
const FONT_BOLD = { fontFamily: 'Open Sans', fontWeight: '800' as const, letterSpacing: 1.0 };

function FilterPill({ label, active, onPress, theme }: { label: string; active: boolean; onPress: () => void; theme: any }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[{
      paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
    }, active ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary } : { backgroundColor: 'transparent', borderColor: theme.colors.border }]}>
      <Text style={[{ ...FONT_BOLD, fontSize: 11, letterSpacing: 0.5 }, active ? { color: theme.colors.primaryText } : { color: theme.colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function formatRuntime(minutes: number) {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function AnalyticsScreen() {
  const { theme, isDarkMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { movies, shows, statusToggle, setStatusToggle } = useLibrary();
  const [genreMap, setGenreMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    fetchGenreMap().then(setGenreMap);
  }, []);

  const toggleStatus = (key: keyof StatusToggle) => setStatusToggle({ ...statusToggle, [key]: !statusToggle[key] });

  const filteredMovies = useMemo(() => {
    return movies.filter(x => {
      const s = x.status;
      if ((s === 'WATCHED' || s === 'DONE') && statusToggle.WATCHED) return true;
      if (s === 'WATCHING' && statusToggle.WATCHING) return true;
      if (s === 'WILL WATCH' && statusToggle['WILL WATCH']) return true;
      if (s === 'ON HOLD' && statusToggle['ON HOLD']) return true;
      return false;
    });
  }, [movies, statusToggle]);

  const filteredShows = useMemo(() => {
    return shows.filter(x => {
      const st = x.status;
      if ((st === 'WATCHED' || st === 'DONE') && statusToggle.WATCHED) return true;
      if (st === 'WATCHING' && statusToggle.WATCHING) return true;
      if (st === 'WILL WATCH' && statusToggle['WILL WATCH']) return true;
      if (st === 'ON HOLD' && statusToggle['ON HOLD']) return true;
      return false;
    });
  }, [shows, statusToggle]);

  const overview = useMemo(() => computeOverviewStats(filteredMovies, filteredShows), [filteredMovies, filteredShows]);
  const episodeProgress = useMemo(() => computeEpisodeProgress(filteredShows), [filteredShows]);
  const decades = useMemo(() => computeReleaseYearDistribution(filteredMovies, filteredShows), [filteredShows, filteredMovies]);
  const genres = useMemo(() => computeGenreDistribution(filteredMovies, filteredShows, genreMap), [filteredMovies, filteredShows, genreMap]);
  const completion = useMemo(() => computeCompletionMetrics(filteredShows), [filteredShows]);
  const behavior = useMemo(() => computeViewingBehavior(filteredMovies, filteredShows), [filteredMovies, filteredShows]);
  const remaining = useMemo(() => computeRemainingWatchTime(filteredMovies, filteredShows), [filteredMovies, filteredShows]);

  // Per-category runtime
  const movieRuntime = useMemo(() => filteredMovies.reduce((acc: number, m: any) => acc + (m.runtime || 0), 0), [filteredMovies]);
  const seriesRuntime = useMemo(() => filteredShows.reduce((acc: number, s: any) => acc + (s.runtime || 0), 0), [filteredShows]);

  // Remaining time formatted
  const remainingHours = Math.floor(remaining.totalMinutes / 60);
  const remainingMins = remaining.totalMinutes % 60;

  const totalItems = overview.totalMovies + overview.totalShows;
  const watchDays = Math.floor(overview.totalWatchTimeMinutes / (24 * 60));
  const watchHours = Math.floor((overview.totalWatchTimeMinutes % (24 * 60)) / 60);

  // Status bar segments
  const ordered = ['WATCHING', 'WILL WATCH', 'WATCHED', 'DONE', 'ON HOLD'];
  let watchedPct = 0, watchedCount = 0;
  const mergedStatus: any[] = [];
  ordered.forEach(s => {
    if (!overview.statusCounts[s]) return;
    const count = overview.statusCounts[s];
    const pct = totalItems > 0 ? (count / totalItems) * 100 : 0;
    if (s === 'WATCHED' || s === 'DONE') {
      watchedPct += pct;
      watchedCount += count;
    } else {
      mergedStatus.push({ status: s, count, pct });
    }
  });
  if (watchedCount > 0) mergedStatus.push({ status: 'WATCHED', count: watchedCount, pct: watchedPct });
  mergedStatus.sort((a, b) => b.pct - a.pct);

  const getStatusColor = (status: string) => {
    if (status === 'WATCHED' || status === 'DONE') return theme.colors.ribbonWatched;
    if (status === 'WATCHING') return theme.colors.ribbonWatching;
    if (status === 'WILL WATCH') return theme.colors.ribbonWaitlist;
    return theme.colors.textSecondary;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'WILL WATCH') return 'WAITLIST';
    return status;
  };

  // Decade chart max
  const decadeMax = decades.length > 0 ? Math.max(...decades.map(d => d.count)) : 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Hero — Lifetime Watch Time */}
      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>LIFETIME WATCH TIME</Text>
        <View style={styles.heroValueContainer}>
          <Text style={styles.heroNumber} numberOfLines={1} adjustsFontSizeToFit>{watchDays}</Text>
          <Text style={styles.heroUnit}>D</Text>
          <Text style={[styles.heroNumber, { marginLeft: 12 }]} numberOfLines={1} adjustsFontSizeToFit>{watchHours}</Text>
          <Text style={styles.heroUnit}>H</Text>
        </View>
        <View style={styles.heroGlowBar} />
      </View>

      {/* Status Filters */}
      <View style={{ paddingVertical: 12, marginBottom: 24, borderBottomWidth: 1, borderTopWidth: 1, borderColor: theme.colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
          <FilterPill label="Watched" active={statusToggle.WATCHED} onPress={() => toggleStatus('WATCHED')} theme={theme} />
          <FilterPill label="Watching" active={statusToggle.WATCHING} onPress={() => toggleStatus('WATCHING')} theme={theme} />
          <FilterPill label="Waitlist" active={statusToggle['WILL WATCH']} onPress={() => toggleStatus('WILL WATCH')} theme={theme} />
        </ScrollView>
      </View>

      {totalItems === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 80 }}>
          <Clapperboard size={40} color={theme.colors.border} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 16, ...FONT_REGULAR, fontSize: 13 }}>No data for this filter.</Text>
        </View>
      ) : (
      <View style={styles.bodyPadding}>

        {/* Quick Stats Row */}
        <View style={styles.section}>
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatNumber}>{overview.totalMovies}</Text>
              <Text style={styles.quickStatLabel}>MOVIES</Text>
              <Text style={styles.quickStatSub}>{formatRuntime(movieRuntime)}</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatNumber}>{overview.totalShows}</Text>
              <Text style={styles.quickStatLabel}>SERIES</Text>
              <Text style={styles.quickStatSub}>{formatRuntime(seriesRuntime)}</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatNumber}>{overview.totalEpisodesWatched}</Text>
              <Text style={styles.quickStatLabel}>EPISODES</Text>
            </View>
          </View>
        </View>

        {/* Completion & Pace — Two-column insight cards */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>INSIGHTS</Text>
          <View style={styles.insightRow}>
            <View style={styles.insightCard}>
              <Text style={[styles.insightValue, { color: theme.colors.ribbonWatched }]}>{completion.avgCompletionRate}%</Text>
              <Text style={styles.insightLabel}>COMPLETION</Text>
              <Text style={styles.insightSub}>{completion.completedSeries} of {completion.completedSeries + completion.inProgressSeries + completion.willWatchSeries} series done</Text>
            </View>
            <View style={styles.insightCard}>
              <Text style={[styles.insightValue, { color: theme.colors.ribbonWaitlist }]}>{remainingHours > 0 ? `${remainingHours}h` : `${remainingMins}m`}</Text>
              <Text style={styles.insightLabel}>TO COMPLETE</Text>
              <Text style={styles.insightSub}>{remaining.totalMinutes > 0 ? `${formatRuntime(remaining.movieMinutes)} movies · ${formatRuntime(remaining.seriesMinutes)} series` : 'nothing pending'}</Text>
            </View>
          </View>
        </View>

        {/* Status Pipeline */}
        {mergedStatus.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>STATUS BREAKDOWN</Text>
            <View style={styles.pipelineCard}>
              <View style={styles.pipelineTrack}>
                {mergedStatus.map((seg, i) => (
                  <View 
                    key={seg.status} 
                    style={{ 
                      width: `${Math.max(seg.pct, 2)}%`, 
                      backgroundColor: getStatusColor(seg.status),
                      borderTopLeftRadius: i === 0 ? 6 : 0,
                      borderBottomLeftRadius: i === 0 ? 6 : 0,
                      borderTopRightRadius: i === mergedStatus.length - 1 ? 6 : 0,
                      borderBottomRightRadius: i === mergedStatus.length - 1 ? 6 : 0,
                      marginLeft: i > 0 ? 2 : 0,
                    }} 
                  />
                ))}
              </View>
              <View style={styles.pipelineLegend}>
                {mergedStatus.map(seg => (
                  <View key={seg.status} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: getStatusColor(seg.status) }]} />
                    <Text style={styles.legendLabel}>{getStatusLabel(seg.status)}</Text>
                    <Text style={styles.legendCount}>{seg.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Cinematic DNA — Genre Pills */}
        {genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>CINEMATIC DNA</Text>
            <View style={styles.genreGrid}>
              {genres.slice(0, 10).map((g: any, i: number) => {
                const max = genres[0].count;
                const intensity = g.count / max;
                return (
                  <View key={i} style={[styles.genrePill, { 
                    backgroundColor: isDarkMode 
                      ? `rgba(250, 255, 0, ${0.08 + (intensity * 0.35)})` 
                      : `rgba(0, 0, 0, ${0.05 + (intensity * 0.3)})`,
                    borderWidth: 1,
                    borderColor: isDarkMode 
                      ? `rgba(250, 255, 0, ${0.1 + (intensity * 0.2)})` 
                      : `rgba(0, 0, 0, ${0.05 + (intensity * 0.1)})`,
                  }]}>
                    <Text style={[styles.genreText, { 
                      color: isDarkMode 
                        ? (intensity > 0.7 ? '#000' : theme.colors.primary) 
                        : (intensity > 0.7 ? '#FFF' : theme.colors.text) 
                    }]}>
                      {g.name}
                    </Text>
                    <Text style={[styles.genreCount, {
                      color: isDarkMode 
                        ? (intensity > 0.7 ? 'rgba(0,0,0,0.5)' : 'rgba(250,255,0,0.4)') 
                        : (intensity > 0.7 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)')
                    }]}>{g.count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Decade Distribution */}
        {decades.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>ERA DISTRIBUTION</Text>
            <View style={styles.decadeCard}>
              {decades.map((d, i) => (
                <View key={d.decade} style={styles.decadeRow}>
                  <Text style={styles.decadeLabel}>{d.decade}</Text>
                  <View style={styles.decadeBarTrack}>
                    <View style={[styles.decadeBarFill, { 
                      width: `${(d.count / decadeMax) * 100}%`,
                      backgroundColor: theme.colors.primary,
                      opacity: 0.3 + (d.count / decadeMax) * 0.7,
                    }]} />
                  </View>
                  <Text style={styles.decadeCount}>{d.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Active Series Progress */}
        {episodeProgress.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>CURRENTLY WATCHING</Text>
            <View style={styles.progressCard}>
              {episodeProgress.slice(0, 8).map((ep: any) => (
                <View key={ep.id} style={styles.progressRow}>
                  <View style={styles.progressInfo}>
                     <Text style={styles.progressTitle} numberOfLines={1}>{ep.title}</Text>
                     <Text style={styles.progressStats}>{ep.watched}/{ep.total}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { 
                      width: `${ep.percentage}%`, 
                      backgroundColor: ep.percentage === 100 ? theme.colors.ribbonWatched : theme.colors.ribbonWatching 
                    }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

      </View>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 100 },
  
  // Hero
  heroSection: { paddingTop: Platform.OS === 'ios' ? 80 : 16, paddingHorizontal: 24, alignItems: 'center', marginBottom: 32 },
  heroLabel: { color: theme.colors.primary, ...FONT_BOLD, fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  heroValueContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  heroNumber: { color: theme.colors.text, ...FONT_BOLD, fontSize: 64, lineHeight: 72 },
  heroUnit: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 20, marginTop: 10, marginRight: 12 },
  heroGlowBar: { width: 32, height: 3, backgroundColor: theme.colors.primary, borderRadius: 2, marginTop: 20 },

  bodyPadding: { paddingHorizontal: 20 },
  section: { marginBottom: 32 },
  sectionHeader: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 11, letterSpacing: 2, marginBottom: 16 },

  // Quick Stats
  quickStatsRow: { flexDirection: 'row', gap: 10 },
  quickStatCard: { flex: 1, backgroundColor: theme.colors.surface, paddingVertical: 16, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  quickStatNumber: { color: theme.colors.text, ...FONT_BOLD, fontSize: 28, marginBottom: 4 },
  quickStatLabel: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 9, letterSpacing: 1.5 },
  quickStatSub: { color: theme.colors.primary, ...FONT_BOLD, fontSize: 10, marginTop: 4, opacity: 0.8 },

  // Insight Cards
  insightRow: { flexDirection: 'row', gap: 10 },
  insightCard: { flex: 1, backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  insightValue: { ...FONT_BOLD, fontSize: 28, marginBottom: 4 },
  insightLabel: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 9, letterSpacing: 1.5, marginBottom: 6 },
  insightSub: { color: theme.colors.textTertiary, ...FONT_REGULAR, fontSize: 11 },

  // Status Pipeline
  pipelineCard: { backgroundColor: theme.colors.surface, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  pipelineTrack: { height: 12, flexDirection: 'row', overflow: 'hidden', marginBottom: 16, borderRadius: 6 },
  pipelineLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  legendLabel: { color: theme.colors.text, ...FONT_BOLD, fontSize: 10, letterSpacing: 0.5, marginRight: 4 },
  legendCount: { color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 10 },

  // Genres
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genrePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  genreText: { ...FONT_BOLD, fontSize: 11, letterSpacing: 0.5 },
  genreCount: { ...FONT_BOLD, fontSize: 9, textAlign: 'center', marginTop: 2 },

  // Decades
  decadeCard: { backgroundColor: theme.colors.surface, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  decadeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  decadeLabel: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 11, width: 40 },
  decadeBarTrack: { flex: 1, height: 8, backgroundColor: theme.colors.border, borderRadius: 4, overflow: 'hidden', marginHorizontal: 10 },
  decadeBarFill: { height: '100%', borderRadius: 4 },
  decadeCount: { color: theme.colors.text, ...FONT_BOLD, fontSize: 11, width: 24, textAlign: 'right' },

  // Series Progress
  progressCard: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  progressRow: { marginBottom: 14 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressTitle: { color: theme.colors.text, ...FONT_BOLD, fontSize: 12, flex: 1, marginRight: 8 },
  progressStats: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 10, letterSpacing: 0.5 },
  progressTrack: { height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
});
