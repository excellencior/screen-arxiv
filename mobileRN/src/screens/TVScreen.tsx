declare var window: any;
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert, Platform, ImageBackground, Linking, ActivityIndicator, Dimensions, Animated } from 'react-native';
import { Tv, Play, Check, X, RefreshCw, ChevronLeft, Trash2, ShieldAlert, CheckSquare, Plus, Clock } from 'lucide-react-native';
import { useLibrary } from '../context/LibraryContext';
import { FadeInUp, smoothLayoutAnimation, springLayoutAnimation } from '../utils/animations';
import { fetchTVDetails, fetchTVSeason } from '../services/tmdb';
import { useAppTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';
import MediaSlimCard from '../components/MediaSlimCard';

const FONT_REGULAR = { fontFamily: 'Open Sans', fontWeight: '500' as const, letterSpacing: 0.5 };
const FONT_BOLD = { fontFamily: 'Open Sans', fontWeight: '800' as const, letterSpacing: 1.0 };
const { width } = Dimensions.get('window');
const ITEM_WIDTH = Math.floor((width - 32 - 16) / 2);

const AnimatedPill = ({ title, isActive, activeColor, onSelect }: any) => {
  const { theme, isDarkMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
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
        styles.pillBtnPrimary, 
        { paddingVertical: 8, borderRadius: 24, paddingHorizontal: 0 }, 
        isActive ? { backgroundColor: activeColor } : { backgroundColor: theme.colors.surfaceHighlight },
        { transform: [{ scale }] }
      ]}>
        <Text style={[styles.pillBtnPrimaryText, { fontSize: 13, marginLeft: 0 }, isActive ? { color: theme.colors.background } : { color: theme.colors.text }]}>{title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function TVScreen({ navigation }: any) {
  const { theme, isDarkMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  const { shows, updateShow, removeShow } = useLibrary();

  const cycleStatus = (current: string) => {
    const s = ['WATCHED', 'WATCHING', 'PLAN TO WATCH'];
    const i = s.indexOf(current);
    return s[(i + 1) % s.length] || s[0];
  };

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<any | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{type: 'single' | 'bulk'} | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const displayedShows = useMemo(() => {
    let list = [...shows];
    if (statusFilter) list = list.filter(m => m.status === statusFilter);
    list.sort((a, b) => (b.year || 0) - (a.year || 0));
    return list;
  }, [shows, statusFilter]);

  const groupedByYear = useMemo(() => {
    const map: Record<number, any[]> = {};
    displayedShows.forEach(s => {
      if (!map[s.year]) map[s.year] = [];
      map[s.year].push(s);
    });
    const years = Object.keys(map).map(Number).sort((a, b) => b - a);
    return { map, years };
  }, [displayedShows]);

  const deriveShowStatus = (seasons: any[], totalEpisodes: number) => {
    let watchedCount = 0;
    let hasOnHold = false;
    let hasWatching = false;

    seasons.forEach(s => {
      if (s.episodes?.length > 0) {
        const seasonWatched = s.episodes.filter((e: any) => e.status === 'WATCHED').length;
        watchedCount += seasonWatched;
        if (s.episodes.some((e: any) => e.status === 'ON HOLD')) hasOnHold = true;
        if (s.episodes.some((e: any) => e.status === 'WATCHING')) hasWatching = true;
      } else if (s.status === 'WATCHED') {
        watchedCount += (s.episode_count || 0);
      }
    });

    const allWatched = watchedCount >= totalEpisodes && totalEpisodes > 0;
    const hasWatched = watchedCount > 0;
    let status: string, statusColor: string;
    if (allWatched) { status = 'WATCHED'; statusColor = 'success'; }
    else if (hasOnHold) { status = 'ON HOLD'; statusColor = 'danger'; }
    else if (hasWatching || hasWatched) { status = 'WATCHING'; statusColor = 'primary'; }
    else { status = 'WILL WATCH'; statusColor = 'warning'; }
    return { status, statusColor, watchedCount };
  };

  const handleShowClick = async (show: any) => {
    if (selectionMode) return;
    smoothLayoutAnimation();
    setSelectedShow(show);
    setSelectedSeason(null);
    if (show.seasons && show.seasons.length > 0 && show.cast && show.cast.length > 0 && typeof show.cast[0].profile_path !== 'undefined') return;
    
    try {
      const details = await fetchTVDetails(show.id);
      if (details) {
        const trailer = details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
        const episodeRuntime = details.episode_run_time?.[0] || details.last_episode_to_air?.runtime || 0;
        const totalEpisodes = details.number_of_episodes || 0;
        const seasons = details.seasons?.filter((s: any) => s.season_number > 0) || [];
        const cast = details.credits?.cast?.slice(0, 5).map((c: any) => ({ name: c.name, role: c.character, profile_path: c.profile_path })) || [];
        
        const updated = { 
          ...show, 
          seasons: (Array.isArray(show.seasons) && show.seasons.length > 0) ? show.seasons : seasons, 
          runtime: episodeRuntime * totalEpisodes, 
          episode_runtime: episodeRuntime, 
          trailer, 
          total_episodes: totalEpisodes, 
          cast: (Array.isArray(show.cast) && show.cast.length > 0) ? show.cast : cast,
          summary: details.overview || show.summary,
          poster_path: details.poster_path,
          backdrop_path: details.backdrop_path,
          number_of_seasons: details.number_of_seasons || show.number_of_seasons || 1
        };
        setSelectedShow(updated);
        updateShow(show.id, updated);
      }
    } catch (e) {
      console.log('Failed fetching details', e);
    }
  };

  const handleSeasonClick = async (seasonNumber: number) => {
    const existing = selectedShow.seasons?.find((s: any) => s.season_number === seasonNumber);
    if (existing?.episodes?.length > 0 && typeof existing.episodes[0].episode_number !== 'undefined' && typeof existing.episodes[0].still_path !== 'undefined') { 
      setSelectedSeason(seasonNumber); 
      return; 
    }
    
    setLoadingSeason(true);
    const seasonData = await fetchTVSeason(selectedShow.id, seasonNumber);
    if (seasonData?.episodes) {
      const isSeasonWatched = existing?.status === 'WATCHED' || selectedShow.status === 'WATCHED';
      const now = new Date();
      
      const formattedEps = seasonData.episodes.map((ep: any) => {
        const epDateStr = ep.air_date ? new Date(ep.air_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBA';
        const isReleased = ep.air_date ? new Date(ep.air_date) <= now : false;
        const epStatus = (isSeasonWatched && isReleased) ? 'WATCHED' : 'WILL WATCH';
        return {
          id: ep.id, 
          title: ep.name,
          episode_number: ep.episode_number,
          still_path: ep.still_path,
          date: epDateStr,
          runtime: ep.runtime || 0,
          status: epStatus,
          statusColor: epStatus === 'WATCHED' ? 'success' : 'warning',
          summary: ep.overview,
          cast: ep.guest_stars?.map((g: any) => ({ name: g.name, role: g.character, profile_path: g.profile_path })) || []
        };
      });
      
      const allWatched = formattedEps.length > 0 && formattedEps.every((e: any) => e.status === 'WATCHED');
      const hasWatched = formattedEps.some((e: any) => e.status === 'WATCHED');
      const newSeasonStatus = allWatched ? 'WATCHED' : (hasWatched ? 'WATCHING' : 'WILL WATCH');
      
      const updatedSeasons = selectedShow.seasons.map((s: any) =>
        s.season_number === seasonNumber ? { ...s, episodes: formattedEps, status: isSeasonWatched ? newSeasonStatus : (s.status || 'WILL WATCH') } : s
      );
      
      const total = selectedShow.total_episodes || updatedSeasons.reduce((acc: number, s: any) => acc + (s.episode_count || s.episodes?.length || 0), 0);
      const { status, statusColor, watchedCount } = deriveShowStatus(updatedSeasons, total);
      
      const allEps = updatedSeasons.flatMap((s: any) => s.episodes || []);
      const totalRuntime = allEps.reduce((acc: number, ep: any) => acc + (ep.runtime || 0), 0);
      
      const updated = { 
        ...selectedShow, 
        seasons: updatedSeasons, 
        progress: { watched: watchedCount, total }, 
        status, 
        statusColor, 
        runtime: totalRuntime || selectedShow.runtime 
      };
      
      setSelectedShow(updated);
      updateShow(selectedShow.id, updated);
      setSelectedSeason(seasonNumber);
    }
    setLoadingSeason(false);
  };

  const handleEpisodeStatusChange = (episodeId: number, newStatus: string, newColor: string) => {
    if (!selectedShow?.seasons) return;
    const updatedSeasons = selectedShow.seasons.map((s: any) => {
      if (s.season_number === selectedSeason) {
        const updatedEps = (s.episodes || []).map((ep: any) => ep.id === episodeId ? { ...ep, status: newStatus, statusColor: newColor } : ep);
        const allWatched = updatedEps.length > 0 && updatedEps.every((e: any) => e.status === 'WATCHED');
        return { ...s, episodes: updatedEps, status: allWatched ? 'WATCHED' : 'WATCHING' };
      }
      return s;
    });
    
    const total = selectedShow.total_episodes || updatedSeasons.reduce((acc: number, s: any) => acc + (s.episode_count || s.episodes?.length || 0), 0);
    const { status, statusColor, watchedCount } = deriveShowStatus(updatedSeasons, total);
    
    const updated = { 
      ...selectedShow, 
      seasons: updatedSeasons, 
      progress: { watched: watchedCount, total }, 
      status, 
      statusColor 
    };
    
    setSelectedShow(updated);
    updateShow(selectedShow.id, updated);
  };

  const handleMarkAllWatched = () => {
    if (!selectedShow || selectedSeason === null) return;
    const now = new Date();
    const updatedSeasons = selectedShow.seasons.map((s: any) => {
      if (s.season_number === selectedSeason) {
        const updatedEps = (s.episodes || []).map((ep: any) => {
          const isReleased = ep.date !== 'TBA' && new Date(ep.date) <= now;
          if (isReleased) {
            return { ...ep, status: 'WATCHED', statusColor: 'success' };
          }
          return ep;
        });
        const allWatched = updatedEps.length > 0 && updatedEps.every((e: any) => e.status === 'WATCHED');
        return { ...s, status: allWatched ? 'WATCHED' : 'WATCHING', episodes: updatedEps };
      }
      return s;
    });
    const total = selectedShow.total_episodes || updatedSeasons.reduce((acc: number, s: any) => acc + (s.episode_count || s.episodes?.length || 0), 0);
    const { status, statusColor, watchedCount } = deriveShowStatus(updatedSeasons, total);
    const updated = { ...selectedShow, seasons: updatedSeasons, progress: { watched: watchedCount, total }, status, statusColor };
    setSelectedShow(updated);
    updateShow(selectedShow.id, updated);
  };

  const handleMarkAllSeasonsWatched = () => {
    if (!selectedShow?.seasons || selectedShow.seasons.length === 0) return;

    // Check if currently fully watched to support toggle behavior
    const currentTotal = selectedShow.progress?.total || selectedShow.total_episodes || 0;
    const currentWatched = selectedShow.progress?.watched || 0;
    const isCurrentlyFullyWatched = currentTotal > 0 && currentWatched >= currentTotal;

    const now = new Date();
    const updatedSeasons = selectedShow.seasons.map((s: any) => {
      let updatedEps = s.episodes || [];
      const hasEps = updatedEps.length > 0;

      if (isCurrentlyFullyWatched) {
        // TOGGLE OFF: Reset everything to WILL WATCH
        if (hasEps) {
          updatedEps = updatedEps.map((ep: any) => ({ ...ep, status: 'WILL WATCH', statusColor: 'warning' }));
          return { ...s, status: 'WILL WATCH', episodes: updatedEps };
        }
        return { ...s, status: 'WILL WATCH', episodes: [] };
      }

      // TOGGLE ON: Mark everything as WATCHED
      if (hasEps) {
        updatedEps = updatedEps.map((ep: any) => {
          const isReleased = ep.date !== 'TBA' && new Date(ep.date) <= now;
          if (isReleased) {
            return { ...ep, status: 'WATCHED', statusColor: 'success' };
          }
          return ep;
        });
        const allWatched = updatedEps.every((e: any) => e.status === 'WATCHED');
        return { ...s, status: allWatched ? 'WATCHED' : 'WATCHING', episodes: updatedEps };
      } else {
        let seasonStatus = 'WATCHED';
        if (s.air_date && new Date(s.air_date) > now) { seasonStatus = 'WILL WATCH'; }
        return { ...s, status: seasonStatus, episodes: [] };
      }
    });

    // Compute total from season data for consistency instead of relying on potentially mismatched total_episodes
    const computedTotal = updatedSeasons.reduce((acc: number, s: any) => {
      if (s.episodes?.length > 0) return acc + s.episodes.length;
      return acc + (s.episode_count || 0);
    }, 0);
    const total = computedTotal || selectedShow.total_episodes || 0;
    const { status, statusColor, watchedCount } = deriveShowStatus(updatedSeasons, total);
    const updated = { ...selectedShow, seasons: updatedSeasons, progress: { watched: watchedCount, total }, status, statusColor };
    setSelectedShow(updated);
    updateShow(selectedShow.id, updated);
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

  const handleDeleteSingle = () => {
    if (!selectedShow) return;
    setConfirmDelete({ type: 'single' });
  };

  const activeSeason = selectedSeason !== null ? selectedShow?.seasons?.find((s: any) => s.season_number === selectedSeason) : null;

  // Back button handler for web (browser back)
  const handleShowModalBack = useCallback(() => {
    if (selectedEpisode) {
      setSelectedEpisode(null);
    } else if (selectedSeason !== null) {
      smoothLayoutAnimation();
      setSelectedSeason(null);
    } else if (selectedShow) {
      smoothLayoutAnimation();
      setSelectedShow(null);
    }
  }, [selectedEpisode, selectedSeason, selectedShow]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (selectedShow) {
      (window as any).history.pushState({ modal: 'show' }, '');
      const handler = (e: any) => {
        handleShowModalBack();
      };
      (window as any).addEventListener('popstate', handler);
      return () => (window as any).removeEventListener('popstate', handler);
    }
  }, [selectedShow, selectedSeason, selectedEpisode, handleShowModalBack]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.superTitle}>LIBRARY</Text>
          <Text style={styles.headerTitle}>Series <Text style={styles.headerSubtitle}>({displayedShows.length})</Text></Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {!selectionMode ? (
            <>
              {shows.length > 0 && (
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
        {shows.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your series archive is empty.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Add Series</Text>
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
                {groupedByYear.map[year].map((show, index) => (
                  <FadeInUp key={show.id} delay={index * 30}>
                    <MediaSlimCard 
                      item={show} 
                      onClick={handleShowClick}
                      selectionMode={selectionMode}
                      isSelected={selectedIds.has(show.id)}
                      onSelect={toggleSelect}
                    />
                  </FadeInUp>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Cinematic Detail Modal for Series/Seasons */}
      <Modal visible={!!selectedShow} animationType="slide" presentationStyle="overFullScreen" transparent onRequestClose={() => { if (selectedSeason !== null) { smoothLayoutAnimation(); setSelectedSeason(null); } else { smoothLayoutAnimation(); setSelectedShow(null); } }}>
        {selectedShow && (
           <View style={{ flex: 1, backgroundColor: theme.colors.background, overflow: 'hidden' }}>
            <View style={{ height: Dimensions.get('window').height * 0.6, width: '100%', position: 'absolute', top: 0, backgroundColor: '#000000' }}>
               {selectedShow.backdrop_path ? (
                  <Image source={{ uri: `https://image.tmdb.org/t/p/w1280${selectedShow.backdrop_path}` }} style={{ width: '100%', height: '100%', opacity: 0.6 }} />
               ) : (
                  <Image source={{ uri: selectedShow.image }} style={{ width: '100%', height: '100%', opacity: 0.4 }} blurRadius={10} />
               )}
               {/* High-res gradient shim arrays to simulate smooth linear fade */}
               {Array.from({ length: 24 }).map((_, i) => (
                 <View 
                   key={`grad-${i}`} 
                   style={{ position: 'absolute', bottom: (23 - i) * 4, left: 0, right: 0, height: 4.5, backgroundColor: `rgba(0,0,0,${(i / 23).toFixed(2)})` }} 
                 />
               ))}
            </View>

            <ScrollView key={selectedSeason === null ? "show" : `season-${selectedSeason}`} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false} bounces={false}>
              {/* TOP LEFT STATUS RIBBON - scrolls with content */}
              {(() => {
                let ribbonStatus: string | null = null;
                let ribbonColor = '';
                
                if (selectedSeason !== null && activeSeason?.episodes?.length > 0) {
                  // Season-level: derive status from episode statuses
                  const eps = activeSeason.episodes;
                  const allWatched = eps.every((ep: any) => ep.status === 'WATCHED');
                  const allWillWatch = eps.every((ep: any) => !ep.status || ep.status === 'WILL WATCH');
                  const hasWatching = eps.some((ep: any) => ep.status === 'WATCHING');
                  const hasWatched = eps.some((ep: any) => ep.status === 'WATCHED');
                  
                  if (allWatched) {
                    ribbonStatus = 'WATCHED';
                    ribbonColor = theme.colors.ribbonWatched;
                  } else if (hasWatching || hasWatched) {
                    ribbonStatus = 'WATCHING';
                    ribbonColor = theme.colors.ribbonWatching;
                  } else if (allWillWatch) {
                    ribbonStatus = 'WAITLIST';
                    ribbonColor = theme.colors.ribbonWaitlist;
                  }
                } else if (selectedSeason === null) {
                  // Show-level: use show status
                  const total = selectedShow.progress?.total || selectedShow.total_episodes || 0;
                  const watched = selectedShow.progress?.watched || 0;
                  const isFullyWatched = total > 0 && watched >= total;
                  const showStatus = selectedShow.status;
                  
                  if (isFullyWatched || showStatus === 'WATCHED' || showStatus === 'DONE') {
                    ribbonStatus = 'WATCHED';
                    ribbonColor = theme.colors.ribbonWatched;
                  } else if (showStatus === 'WATCHING') {
                    ribbonStatus = 'WATCHING';
                    ribbonColor = theme.colors.ribbonWatching;
                  } else if (showStatus === 'WILL WATCH') {
                    ribbonStatus = 'WAITLIST';
                    ribbonColor = theme.colors.ribbonWaitlist;
                  }
                }
                
                if (ribbonStatus) {
                  return (
                    <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 44 : 28, left: -40, backgroundColor: ribbonColor, width: 140, height: 26, transform: [{ rotate: '-45deg' }], alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>{ribbonStatus}</Text>
                    </View>
                  );
                }
                return null;
              })()}
              <View style={styles.modalFloatingHeader}>
                {selectedSeason !== null && (
                  <TouchableOpacity style={[styles.closeBtn, { marginRight: 12, backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={() => { smoothLayoutAnimation(); setSelectedSeason(null); }}>
                    <ChevronLeft size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={() => { smoothLayoutAnimation(); setSelectedShow(null); setSelectedSeason(null); }}>
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {selectedSeason === null ? (
                <>
                  <View style={{ paddingTop: Dimensions.get('window').height * 0.38, paddingHorizontal: 24 }}>
                    <Text style={styles.modalTitle} numberOfLines={3}>{selectedShow.title || selectedShow.name}</Text>
                    <Text style={styles.modalMeta}>
                          {selectedShow.year}  •  {selectedShow.number_of_seasons || selectedShow.seasons?.length || '?'} Seasons
                    </Text>
                        
                    {/* PROGRESS BAR */}
                    {selectedShow.progress && (() => {
                      const watched = selectedShow.progress?.watched ?? 0;
                      const total = selectedShow.progress?.total ?? (selectedShow.total_episodes ?? 0);
                      const remaining = Math.max(0, total - watched);
                      const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
                      return (
                        <View style={{ marginTop: 24 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: theme.colors.ribbonWatched, ...FONT_BOLD, fontSize: 11 }}>{watched} watched</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.6)', ...FONT_REGULAR, fontSize: 11 }}>{remaining} left</Text>
                          </View>
                          <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ width: `${pct}%`, height: '100%', backgroundColor: theme.colors.ribbonWatched }} />
                          </View>
                        </View>
                      );
                    })()}
                  </View>

                  <View style={styles.modalActionButtons}>
                    {/* Trailer */}
                    {selectedShow.trailer && (
                       <TouchableOpacity style={styles.pillBtnPrimary} onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${selectedShow.trailer}`)} activeOpacity={0.8}>
                      <Play size={20} fill={theme.colors.primaryText} color={theme.colors.primaryText} />
                      <Text style={styles.pillBtnPrimaryText}>Play Trailer</Text>
                   </TouchableOpacity>
                    )}
                    
                    {/* Show-level Mark All Seen replacing the old Status Controller */}
                    {(() => {
                      const totalStatus = selectedShow.progress?.total || selectedShow.total_episodes || 0;
                      const watchedStatus = selectedShow.progress?.watched || 0;
                      const isFullyWatchedShow = totalStatus > 0 && watchedStatus >= totalStatus;
                      return (
                        <TouchableOpacity disabled={isFullyWatchedShow} style={[styles.pillBtnPrimary, { flex: 1, justifyContent: 'center', backgroundColor: isFullyWatchedShow ? theme.colors.surfaceHighlight : theme.colors.ribbonWatched, marginLeft: selectedShow.trailer ? 12 : 0, opacity: isFullyWatchedShow ? 0.8 : 1 }]} onPress={handleMarkAllSeasonsWatched} activeOpacity={0.8}>
                           <Check size={20} color={isFullyWatchedShow ? theme.colors.ribbonWatched : '#FFFFFF'} />
                           <Text style={[styles.pillBtnPrimaryText, { marginLeft: 8, color: isFullyWatchedShow ? theme.colors.textSecondary : '#FFFFFF' }]}>{isFullyWatchedShow ? 'WATCHED' : 'Mark All Seen'}</Text>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>

                  <View style={styles.modalContentCore}>
                    {selectedShow.summary && (
                      <View style={styles.summarySection}>
                        <Text style={styles.modalSummary}>{selectedShow.summary}</Text>
                      </View>
                    )}

                    {selectedShow.cast && selectedShow.cast.length > 0 && (
                      <View style={{ marginBottom: 20, marginHorizontal: -24 }}>
                        <Text style={[styles.sectionHeading, { marginBottom: 16, paddingHorizontal: 24 }]}>TOP CAST</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 24 }}>
                          {selectedShow.cast.map((c: any, i: number) => (
                            <FadeInUp key={i} delay={i * 50} style={{ alignItems: 'center', width: 70 }}>
                              <View style={[{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.surfaceHighlight, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border }, { overflow: 'hidden' }]}>
                                {c.profile_path ? (
                                  <Image source={{ uri: `https://image.tmdb.org/t/p/w400${c.profile_path}` }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                ) : (
                                  <Text style={{color: theme.colors.text, ...FONT_BOLD, fontSize: 16}}>{c.name.charAt(0)}</Text>
                                )}
                              </View>
                              <Text style={{ color: theme.colors.text, ...FONT_BOLD, fontSize: 11, textAlign: 'center', marginBottom: 2 }} numberOfLines={1}>{c.name}</Text>
                              <Text style={{ color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 10, textAlign: 'center' }} numberOfLines={1}>{c.role}</Text>
                            </FadeInUp>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {Array.isArray(selectedShow.seasons) && selectedShow.seasons.length > 0 && (
                      <View style={[styles.seasonsList, { marginHorizontal: -24 }]}>
                        <Text style={[styles.sectionHeading, { marginBottom: 16, paddingHorizontal: 24 }]}>SEASONS</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 24 }}>
                          {selectedShow.seasons.map((season: any, index: number) => {
                            const eps = season.episodes || [];
                            const watchedCount = eps.filter((e: any) => e.status === 'WATCHED').length;
                            const isFullyWatched = (eps.length > 0 && watchedCount === eps.length) || (eps.length === 0 && season.status === 'WATCHED');
                            return (
                              <FadeInUp key={season.id} delay={index * 50}>
                                <TouchableOpacity activeOpacity={0.8} style={{ width: 110 }} onPress={() => { smoothLayoutAnimation(); handleSeasonClick(season.season_number); }}>
                                   <View style={{ width: 110, height: 160, borderRadius: 8, overflow: 'hidden', marginBottom: 8, backgroundColor: theme.colors.surfaceHighlight }}>
                                     {season.poster_path ? (
                                        <Image source={{ uri: `https://image.tmdb.org/t/p/w200${season.poster_path}` }} style={{ width: '100%', height: '100%' }} />
                                     ) : (
                                        <Image source={{ uri: selectedShow.image }} style={{ width: '100%', height: '100%', opacity: 0.3 }} blurRadius={10} />
                                     )}
                                     {isFullyWatched && (
                                       <View style={{ position: 'absolute', bottom: 14, right: -24, backgroundColor: theme.colors.ribbonWatched, width: 90, height: 18, transform: [{ rotate: '-45deg' }], alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                         <Text style={{ color: theme.colors.background, fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>WATCHED</Text>
                                       </View>
                                     )}
                                   </View>
                                   <Text style={{ color: theme.colors.text, ...FONT_BOLD, fontSize: 13, marginBottom: 2 }} numberOfLines={1}>{season.name}</Text>
                                   <Text style={{ color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 11 }}>{season.episode_count} Eps</Text>
                                </TouchableOpacity>
                              </FadeInUp>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                    <View style={{ height: 40 }} />
                    </View>
                  </>
                ) : (
                  // Episodes View
                  loadingSeason ? (
                     <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 100 }} />
                  ) : (
                    <View style={[styles.modalContentCore, { paddingTop: Platform.OS === 'ios' ? 120 : 100 }]}>
                      <View style={{ alignItems: 'flex-start', marginBottom: 32 }}>
                        <Text style={{ fontSize: 38, color: theme.colors.text, ...FONT_BOLD, marginBottom: 16, lineHeight: 42 }}>{activeSeason?.name}</Text>
                        {(() => {
                           const eps = activeSeason?.episodes || [];
                           const allWatched = eps.length > 0 && eps.every((ep: any) => ep.status === 'WATCHED');
                           return (
                             <TouchableOpacity style={[styles.pillBtnPrimary, { backgroundColor: allWatched ? theme.colors.surfaceHighlight : theme.colors.ribbonWatched, flex: 0, paddingVertical: 12, paddingHorizontal: 28, alignSelf: 'flex-start', borderRadius: 24 }]} onPress={handleMarkAllWatched} activeOpacity={0.8}>
                               <Check size={16} color={allWatched ? theme.colors.ribbonWatched : theme.colors.background} />
                               <Text style={[styles.pillBtnPrimaryText, { color: allWatched ? theme.colors.textSecondary : theme.colors.background }]}>{allWatched ? 'WATCHED' : 'MARK COMPLETED'}</Text>
                             </TouchableOpacity>
                           );
                        })()}
                      </View>
                      
                      {activeSeason?.episodes?.map((ep: any, index: number) => (
                        <TouchableOpacity 
                          key={ep.id} 
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
                          onPress={() => setSelectedEpisode(ep)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1, paddingRight: 16 }}>
                             <Text style={{ color: theme.colors.text, ...FONT_BOLD, fontSize: 16, marginBottom: 4 }}>{String(index + 1).padStart(2, '0')}. {ep.title || ep.name}</Text>
                             <Text style={{ color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 13 }}>{ep.date || 'TBA'}  •  {ep.runtime ? `${ep.runtime}m` : '??m'}</Text>
                          </View>
                          
                          {/* Status Icon */}
                          {ep.status === 'WATCHED' ? (
                             <View style={{ backgroundColor: theme.colors.ribbonWatched + '22', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                               <Check size={16} color={theme.colors.ribbonWatched} />
                             </View>
                          ) : ep.status === 'WATCHING' ? (
                             <View style={{ backgroundColor: theme.colors.ribbonWatching + '22', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                               <Play size={14} color={theme.colors.ribbonWatching} />
                             </View>
                          ) : (
                             <View style={{ backgroundColor: theme.colors.ribbonWaitlist + '18', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                               <Clock size={14} color={theme.colors.ribbonWaitlist} />
                             </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )
                )}
              </ScrollView>
          </View>
        )}
      </Modal>

      {/* Deep-Linked Episode Details Modal */}
      <Modal visible={!!selectedEpisode} animationType="slide" presentationStyle="overFullScreen" transparent onRequestClose={() => { setSelectedEpisode(null); }}>
        {selectedEpisode && (
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View style={{ height: Dimensions.get('window').height * 0.6, width: '100%', position: 'absolute', top: 0 }}>
               {selectedEpisode.still_path ? (
                  <Image source={{ uri: `https://image.tmdb.org/t/p/w1280${selectedEpisode.still_path}` }} style={{ width: '100%', height: '100%', opacity: 0.6 }} />
               ) : (
                  <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                     <Image source={{ uri: selectedShow?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${selectedShow.backdrop_path}` : selectedShow?.image }} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.4 }} blurRadius={20} />
                     <Image source={{ uri: selectedShow?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${selectedShow.backdrop_path}` : selectedShow?.image }} style={{ width: '100%', height: '100%', opacity: 0.8 }} resizeMode="contain" />
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

            <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false} bounces={false}>
              {/* TOP LEFT STATUS RIBBON - scrolls with content */}
              {(() => {
                 if (!selectedEpisode.status) return null;
                 let ribbonColor = theme.colors.ribbonWatched;
                 let ribbonText = 'WATCHED';
                 if (selectedEpisode.status === 'WATCHING') {
                   ribbonColor = theme.colors.ribbonWatching;
                   ribbonText = 'WATCHING';
                 } else if (selectedEpisode.status === 'WILL WATCH' || selectedEpisode.status === 'PLAN TO WATCH') {
                   ribbonColor = theme.colors.ribbonWaitlist;
                   ribbonText = 'WAITLIST';
                 }
                 return (
                   <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 44 : 28, left: -40, backgroundColor: ribbonColor, width: 140, height: 26, transform: [{ rotate: '-45deg' }], alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                     <Text style={{ color: theme.colors.background, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>{ribbonText}</Text>
                   </View>
                 );
               })()}
              <View style={styles.modalFloatingHeader}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedEpisode(null)}>
                  <X size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ paddingTop: Dimensions.get('window').height * 0.45, paddingHorizontal: 24 }}>
                <Text style={[styles.superTitle, { marginBottom: 8, color: theme.colors.text }]}>EPISODE {typeof selectedEpisode.episode_number !== 'undefined' ? selectedEpisode.episode_number : '?'}</Text>
                <Text style={[{ fontSize: 38, color: theme.colors.text, ...FONT_BOLD, marginBottom: 8, lineHeight: 42, textShadow: isDarkMode ? '0px 2px 15px rgba(0,0,0,0.8)' : '0px 2px 15px rgba(255,255,255,1)' } as any]} numberOfLines={3}>{selectedEpisode.title || selectedEpisode.name}</Text>
                <Text style={[{ fontSize: 13, color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.9)', ...FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1, textShadow: isDarkMode ? '0px 1px 10px rgba(0,0,0,0.8)' : '0px 1px 10px rgba(255,255,255,1)' } as any]}>
                  {selectedEpisode.date || 'TBA'}   •   {selectedEpisode.runtime ? `${selectedEpisode.runtime}m` : '? min'}
                </Text>
              </View>

              {/* Status Segmented Controls */}
              <View style={[styles.modalActionButtons, { gap: 8, paddingHorizontal: 24, paddingBottom: 16, marginTop: 12 }]}>
                <AnimatedPill 
                  title="WATCHED" 
                  isActive={selectedEpisode.status === 'WATCHED'} 
                  activeColor={theme.colors.ribbonWatched} 
                  onSelect={() => {
                    handleEpisodeStatusChange(selectedEpisode.id, 'WATCHED', 'success');
                    setSelectedEpisode({ ...selectedEpisode, status: 'WATCHED', statusColor: 'success' });
                  }} 
                />
                <AnimatedPill 
                  title="WATCHING" 
                  isActive={selectedEpisode.status === 'WATCHING'} 
                  activeColor={theme.colors.ribbonWatching} 
                  onSelect={() => {
                    handleEpisodeStatusChange(selectedEpisode.id, 'WATCHING', 'primary');
                    setSelectedEpisode({ ...selectedEpisode, status: 'WATCHING', statusColor: 'primary' });
                  }} 
                />
                <AnimatedPill 
                  title="WAITLIST" 
                  isActive={selectedEpisode.status === 'WILL WATCH'} 
                  activeColor={theme.colors.ribbonWaitlist} 
                  onSelect={() => {
                    handleEpisodeStatusChange(selectedEpisode.id, 'WILL WATCH', 'warning');
                    setSelectedEpisode({ ...selectedEpisode, status: 'WILL WATCH', statusColor: 'warning' });
                  }} 
                />
              </View>

              <View style={[styles.modalContentCore, { paddingTop: 24 }]}>
                 {(selectedEpisode.summary || selectedEpisode.overview) && (
                   <View style={styles.summarySection}>
                     <Text style={styles.modalSummary}>{selectedEpisode.summary || selectedEpisode.overview}</Text>
                   </View>
                 )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      <ConfirmDeleteModal
         visible={!!confirmDelete}
         onHide={() => setConfirmDelete(null)}
         title={confirmDelete?.type === 'bulk' ? `Delete ${selectedIds.size} Series` : 'Delete Series'}
         message={confirmDelete?.type === 'bulk' ? `Are you sure you want to completely discard these ${selectedIds.size} series from your library?` : `Are you sure you want to completely discard ${selectedShow?.title || selectedShow?.name}?`}
         onConfirm={() => {
           if (confirmDelete?.type === 'bulk') {
             selectedIds.forEach(id => removeShow(id));
             exitSelectionMode();
           } else {
             removeShow(selectedShow.id);
             setSelectedShow(null);
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
  actionButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
  actionButtonText: { color: theme.colors.background, ...FONT_BOLD },
  
  yearSection: { marginBottom: 32 },
  yearHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  yearTitle: { color: theme.colors.text, fontSize: 18, ...FONT_BOLD, marginRight: 16 },
  yearLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  
  gridContainer: { flex: 1, gap: 12 },

  // Rich Cinematic Modal
  modalFloatingHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 24, zIndex: 100, flexDirection: 'row' },
  closeBtn: { padding: 8, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', borderRadius: 20 },
  
  modalTitle: { fontSize: 38, color: '#FFFFFF', ...FONT_BOLD, marginBottom: 8, lineHeight: 42, textShadow: '0px 2px 15px rgba(0,0,0,0.8)' } as any,
  modalMeta: { fontSize: 13, color: 'rgba(255,255,255,0.9)', ...FONT_BOLD, textTransform: 'uppercase', letterSpacing: 1, textShadow: '0px 1px 10px rgba(0,0,0,0.8)' } as any,
  
  modalActionButtons: { flexDirection: 'row', gap: 8, marginTop: 36, paddingHorizontal: 24, paddingBottom: 12 },
  pillBtnPrimary: { flex: 1, backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  pillBtnPrimaryText: { color: theme.colors.primaryText, ...FONT_BOLD, fontSize: 13, marginLeft: 8 },
  pillBtnDanger: { backgroundColor: theme.colors.danger + '22', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.danger },
  
  modalContentCore: { backgroundColor: theme.colors.background, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  summarySection: { marginBottom: 32 },
  sectionHeading: { color: theme.colors.textSecondary, ...FONT_BOLD, fontSize: 11, letterSpacing: 2, marginBottom: 12 },
  modalSummary: { color: theme.colors.text, ...FONT_REGULAR, fontSize: 15, lineHeight: 24, opacity: 0.9 },
  
  seasonsList: { marginTop: 16 },
  seasonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  seasonPoster: { width: 44, height: 66, borderRadius: 4, marginRight: 16 },
  seasonInfo: { flex: 1 },
  seasonTitle: { color: theme.colors.text, ...FONT_BOLD, fontSize: 16, marginBottom: 4 },
  seasonEps: { color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 12 },
  
  episodeRow: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  epTop: { marginBottom: 16 },
  epTitle: { color: theme.colors.text, ...FONT_BOLD, fontSize: 16, marginBottom: 4 },
  epDate: { color: theme.colors.textSecondary, ...FONT_REGULAR, fontSize: 12 },
  epActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  epActionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
  epActionText: { color: theme.colors.text, ...FONT_BOLD, fontSize: 11, textTransform: 'uppercase' }
});
