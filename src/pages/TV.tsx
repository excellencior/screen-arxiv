import React, { useState, useMemo } from 'react';
import { Container, Button, Modal } from 'react-bootstrap';
import { Check, X, Plus, Play, Trash2, CheckSquare } from 'lucide-react';
import { fetchTVDetails, fetchTVSeason } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MediaCard, { StatusDropdown, COLOR_MAP } from '../components/MediaCard';

type SortKey = 'year-desc' | 'year-asc' | 'title-asc' | 'title-desc' | 'added-desc' | 'added-asc';

export default function TV() {
  const { shows, updateShow, removeShow } = useLibrary();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const displayedShows = useMemo(() => {
    return [...shows].sort((a, b) => (b.year || 0) - (a.year || 0));
  }, [shows]);

  const groupedByYear = useMemo(() => {
    const map: Record<number, any[]> = {};
    displayedShows.forEach(s => { if (!map[s.year]) map[s.year] = []; map[s.year].push(s); });
    const years = Object.keys(map).map(Number).sort((a, b) => b - a);
    return { map, years };
  }, [displayedShows]);

  const handleShowClick = async (show: any) => {
    if (selectionMode) return;
    setSelectedShow(show);
    setSelectedSeason(null);
    if (show.seasons && show.seasons.length > 0 && show.runtime !== undefined) return;
    const details = await fetchTVDetails(show.id);
    if (details) {
      const trailer = details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
      const episodeRuntime = details.episode_run_time?.[0] || details.last_episode_to_air?.runtime || 0;
      const totalEpisodes = details.number_of_episodes || 0;
      const seasons = details.seasons?.filter((s: any) => s.season_number > 0) || [];
      const updated = { ...show, seasons: show.seasons || seasons, runtime: episodeRuntime * totalEpisodes, episode_runtime: episodeRuntime, trailer, total_episodes: totalEpisodes };
      setSelectedShow(updated);
      updateShow(show.id, updated);
    }
  };

  const handleSeasonClick = async (seasonNumber: number) => {
    const existing = selectedShow.seasons?.find((s: any) => s.season_number === seasonNumber);
    if (existing?.episodes?.length > 0) { setSelectedSeason(seasonNumber); return; }
    const seasonData = await fetchTVSeason(selectedShow.id, seasonNumber);
    if (seasonData?.episodes) {
      const formattedEps = seasonData.episodes.map((ep: any) => ({
        id: ep.id, title: ep.name,
        date: ep.air_date ? new Date(ep.air_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBA',
        runtime: ep.runtime || 0, status: 'WILL WATCH', statusColor: 'warning',
        summary: ep.overview,
        cast: ep.guest_stars?.map((g: any) => ({ name: g.name, role: g.character })) || []
      }));
      const updatedSeasons = selectedShow.seasons.map((s: any) =>
        s.season_number === seasonNumber ? { ...s, episodes: formattedEps } : s
      );
      const allEps = updatedSeasons.flatMap((s: any) => s.episodes || []);
      const watchedCount = allEps.filter((e: any) => e.status === 'WATCHED').length;
      const totalRuntime = allEps.reduce((acc: number, ep: any) => acc + (ep.runtime || 0), 0);
      const updated = { ...selectedShow, seasons: updatedSeasons, progress: { watched: watchedCount, total: selectedShow.total_episodes || allEps.length }, runtime: totalRuntime || selectedShow.runtime };
      setSelectedShow(updated);
      updateShow(selectedShow.id, updated);
      setSelectedSeason(seasonNumber);
    }
  };

  const deriveShowStatus = (seasons: any[], totalEpisodes: number) => {
    const allEps = seasons.flatMap((s: any) => s.episodes || []);
    const watchedCount = allEps.filter((e: any) => e.status === 'WATCHED').length;
    const allWatched = watchedCount >= totalEpisodes && totalEpisodes > 0;
    const hasOnHold = allEps.some((e: any) => e.status === 'ON HOLD');
    const hasWatching = allEps.some((e: any) => e.status === 'WATCHING');
    const hasWatched = watchedCount > 0;
    let status: string, statusColor: string;
    if (allWatched) { status = 'WATCHED'; statusColor = 'success'; }
    else if (hasOnHold) { status = 'ON HOLD'; statusColor = 'danger'; }
    else if (hasWatching || hasWatched) { status = 'WATCHING'; statusColor = 'primary'; }
    else { status = 'WILL WATCH'; statusColor = 'warning'; }
    return { status, statusColor, watchedCount };
  };

  const handleMarkAllWatched = () => {
    if (!selectedShow || selectedSeason === null) return;
    const updatedSeasons = selectedShow.seasons.map((s: any) =>
      s.season_number === selectedSeason ? { ...s, episodes: (s.episodes || []).map((ep: any) => ({ ...ep, status: 'WATCHED', statusColor: 'success' })) } : s
    );
    const total = selectedShow.total_episodes || updatedSeasons.flatMap((s: any) => s.episodes || []).length;
    const { status, statusColor, watchedCount } = deriveShowStatus(updatedSeasons, total);
    const updated = { ...selectedShow, seasons: updatedSeasons, progress: { watched: watchedCount, total }, status, statusColor };
    setSelectedShow(updated);
    updateShow(selectedShow.id, updated);
  };

  const handleMarkAllSeasonsWatched = () => {
    if (!selectedShow?.seasons) return;
    const updatedSeasons = selectedShow.seasons.map((s: any) => ({ ...s, episodes: (s.episodes || []).map((ep: any) => ({ ...ep, status: 'WATCHED', statusColor: 'success' })) }));
    const total = selectedShow.total_episodes || updatedSeasons.flatMap((s: any) => s.episodes || []).length;
    const updated = { ...selectedShow, seasons: updatedSeasons, progress: { watched: total, total }, status: 'WATCHED', statusColor: 'success' };
    setSelectedShow(updated);
    updateShow(selectedShow.id, updated);
  };

  const handleEpisodeStatusChange = (showId: number, seasonNumber: number, episodeId: number, newStatus: string, newColor: string) => {
    const show = shows.find(s => s.id === showId);
    if (!show?.seasons) return;
    const updatedSeasons = show.seasons.map((s: any) =>
      s.season_number === seasonNumber ? { ...s, episodes: (s.episodes || []).map((ep: any) => ep.id === episodeId ? { ...ep, status: newStatus, statusColor: newColor } : ep) } : s
    );
    const total = show.total_episodes || updatedSeasons.flatMap((s: any) => s.episodes || []).length;
    const { status, statusColor, watchedCount } = deriveShowStatus(updatedSeasons, total);
    const updated = { ...show, seasons: updatedSeasons, progress: { ...show.progress, watched: watchedCount }, status, statusColor };
    if (selectedShow?.id === showId) setSelectedShow(updated);
    updateShow(showId, updated);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const exitSelectionMode = () => { setSelectionMode(false); setSelectedIds(new Set()); };
  const handleBulkDelete = () => { selectedIds.forEach(id => removeShow(id)); exitSelectionMode(); setBulkDeleteOpen(false); };

  const activeSeason = selectedSeason !== null ? selectedShow?.seasons?.find((s: any) => s.season_number === selectedSeason) : null;
  const displayedEpisodes = activeSeason?.episodes || [];

  const renderCards = (list: any[]) =>
    list.map(show => (
      <MediaCard
        key={show.id}
        item={show}
        type="tv"
        onClick={() => handleShowClick(show)}
        onDelete={() => setDeleteTarget(show)}
        selectionMode={selectionMode}
        isSelected={selectedIds.has(show.id)}
        onSelect={toggleSelect}
      />
    ));

  return (
    <Container className="py-3 px-4" style={{ maxWidth: '672px' }}>

      <div className="mb-3 d-flex align-items-center justify-content-between">
        <div>
          <h1 className="fs-3 fw-medium font-mono text-body tracking-tight mb-2">Series</h1>
          <p className="text-secondary font-mono m-0" style={{ fontSize: '13px' }}>
            {displayedShows.length !== shows.length ? `${displayedShows.length} of ${shows.length} entries` : `${shows.length} entries`}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {!selectionMode ? (
            <>
              {shows.length > 0 && (
                <button onClick={() => setSelectionMode(true)}
                  className="border-0 bg-secondary bg-opacity-10 text-body p-2 rounded d-flex align-items-center"
                  title="Select items" style={{ cursor: 'pointer' }}>
                  <CheckSquare size={16} />
                </button>
              )}
              <Button as={Link} to="/search" variant="outline-secondary" className="d-flex align-items-center gap-2 border-0 bg-secondary bg-opacity-10 text-body p-2 rounded">
                <Plus size={16} />
              </Button>
            </>
          ) : (
            <div className="d-flex flex-column align-items-end gap-1">
              <div className="d-flex align-items-center gap-2">
                {selectedIds.size > 0 && (
                  <button onClick={() => setBulkDeleteOpen(true)}
                    className="border-0 bg-danger bg-opacity-10 text-danger p-2 rounded d-flex align-items-center gap-1 font-mono"
                    style={{ cursor: 'pointer', fontSize: '12px' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
                <button onClick={exitSelectionMode}
                  className="border-0 bg-secondary bg-opacity-10 text-body p-2 rounded d-flex align-items-center"
                  style={{ cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
              <span className="font-mono text-secondary" style={{ fontSize: '11px' }}>{selectedIds.size} selected</span>
            </div>
          )}
        </div>
      </div>

      {shows.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-secondary font-mono mb-4">Your TV series archive is empty.</p>
          <Button as={Link} to="/search" variant="primary" className="d-inline-flex align-items-center gap-2 font-mono rounded px-4">
            <Plus size={16} /> Add Series
          </Button>
        </div>
      ) : (
        groupedByYear.years.map(year => (
          <div key={year} className="mb-5">
            <h2 className="fs-5 fw-medium mb-3 font-mono text-body d-flex align-items-center gap-3">
              {year}
              <div className="flex-grow-1 bg-secondary opacity-25" style={{ height: '1px' }} />
            </h2>
            <div className="d-flex flex-column gap-2">{renderCards(groupedByYear.map[year])}</div>
          </div>
        ))
      )}

      {/* ── Show detail modal ── */}
      <Modal show={!!selectedShow} onHide={() => setSelectedShow(null)} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden" animation={false}>
        <AnimatePresence>
          {selectedShow && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 12 }}>
                <button
                  onClick={() => setSelectedShow(null)}
                  className="border-0 bg-secondary bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                  style={{ width: '30px', height: '30px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                >
                  <X size={16} className="text-body" />
                </button>
              </div>
              <div className="scrollbar-hide" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <Modal.Body className="p-0">
                  {/* ── Header ── */}
                  <div className="p-4 pb-3">
                    <div className="d-flex gap-3 align-items-start">
                      {/* Back button */}
                      <div className="flex-shrink-0 d-flex flex-column align-items-center gap-2" style={{ paddingTop: '2px' }}>
                        {selectedSeason !== null && (
                          <button
                            onClick={() => setSelectedSeason(null)}
                            className="border-0 bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '30px', height: '30px', cursor: 'pointer' }}
                            title="Back to seasons"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                          </button>
                        )}
                      </div>

                      {/* Poster */}
                      {(() => {
                        const posterPath = selectedSeason !== null ? activeSeason?.poster_path : null;
                        const imageUrl = posterPath ? `https://image.tmdb.org/t/p/w200${posterPath}` : selectedShow.image;
                        return imageUrl && (
                          <div className="flex-shrink-0 shadow-sm rounded overflow-hidden" style={{ width: '72px', height: '108px' }}>
                            <img src={imageUrl} alt={selectedShow.title} className="w-100 h-100 object-fit-cover" />
                          </div>
                        );
                      })()}

                      <div className="flex-grow-1 min-w-0 pt-1">
                        <h1 className="fs-5 fw-bold font-mono text-body mb-1" style={{ letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                          {selectedSeason !== null ? `Season ${selectedSeason}` : selectedShow.title}
                        </h1>

                        <div className="d-flex align-items-center gap-2 flex-wrap font-mono text-secondary" style={{ fontSize: '12px' }}>
                          {selectedSeason !== null ? (
                            (() => {
                              const eps = activeSeason?.episodes || [];
                              const watched = eps.filter((e: any) => e.status === 'WATCHED').length;
                              return eps.length > 0
                                ? <><span>{eps.length} Episodes</span><span className="opacity-50">•</span><span className="text-success fw-bold">{watched}/{eps.length} watched</span></>
                                : <span>{activeSeason?.episode_count || 0} Episodes</span>;
                            })()
                          ) : (
                            <>
                              <span>{selectedShow.year}</span>
                              <span className="opacity-50">•</span>
                              <span>{selectedShow.seasons?.length || 0} Seasons</span>
                              <span className="opacity-50">•</span>
                              <span>
                                <span className="text-success fw-bold">{selectedShow.progress?.watched || 0}</span>
                                <span className="opacity-50">/{selectedShow.total_episodes || 0}</span>
                                <span className="ms-1">watched</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Action buttons — md+ */}
                        <div className="d-none d-md-flex gap-2 flex-wrap mt-3">
                          {selectedSeason === null ? (
                            <>
                              <Button variant={selectedShow.status === 'WATCHED' ? 'success' : 'outline-secondary'} size="sm"
                                className={`d-flex align-items-center gap-2 rounded border-0 ${selectedShow.status === 'WATCHED' ? 'text-white' : 'bg-secondary bg-opacity-10'}`}
                                onClick={handleMarkAllSeasonsWatched}>
                                <Check size={13} />
                                <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>
                                  {selectedShow.status === 'WATCHED' ? 'Watched' : 'Mark all'}
                                </span>
                              </Button>
                              {selectedShow.trailer && (
                                <Button variant="outline-primary" size="sm"
                                  className="d-flex align-items-center gap-2 rounded border-0 bg-primary bg-opacity-10"
                                  onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedShow.trailer}`, '_blank')}>
                                  <Play size={13} fill="currentColor" />
                                  <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Trailer</span>
                                </Button>
                              )}
                              <Button variant="outline-danger" size="sm"
                                className="d-flex align-items-center gap-2 rounded border-0 bg-danger bg-opacity-10"
                                onClick={() => { setSelectedShow(null); setDeleteTarget(selectedShow); }}>
                                <Trash2 size={13} />
                                <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Remove</span>
                              </Button>
                            </>
                          ) : (() => {
                            const eps = activeSeason?.episodes || [];
                            const allWatched = eps.length > 0 && eps.every((ep: any) => ep.status === 'WATCHED');
                            return (
                              <Button variant={allWatched ? 'success' : 'outline-secondary'} size="sm"
                                className={`d-flex align-items-center gap-2 rounded border-0 ${allWatched ? 'text-white' : 'bg-secondary bg-opacity-10'}`}
                                onClick={handleMarkAllWatched}>
                                <Check size={13} />
                                <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>{allWatched ? 'Watched' : 'Mark all'}</span>
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons — small */}
                    <div className="d-flex d-md-none gap-2 flex-wrap mt-3">
                      {selectedSeason === null ? (
                        <>
                          <Button variant={selectedShow.status === 'WATCHED' ? 'success' : 'outline-secondary'} size="sm"
                            className={`d-flex align-items-center gap-2 rounded border-0 ${selectedShow.status === 'WATCHED' ? 'text-white' : 'bg-secondary bg-opacity-10'}`}
                            onClick={handleMarkAllSeasonsWatched}>
                            <Check size={13} />
                            <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>
                              {selectedShow.status === 'WATCHED' ? 'Watched' : 'Mark all'}
                            </span>
                          </Button>
                          {selectedShow.trailer && (
                            <Button variant="outline-primary" size="sm"
                              className="d-flex align-items-center gap-2 rounded border-0 bg-primary bg-opacity-10"
                              onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedShow.trailer}`, '_blank')}>
                              <Play size={13} fill="currentColor" />
                              <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Trailer</span>
                            </Button>
                          )}
                          <Button variant="outline-danger" size="sm"
                            className="d-flex align-items-center gap-2 rounded border-0 bg-danger bg-opacity-10"
                            onClick={() => { setSelectedShow(null); setDeleteTarget(selectedShow); }}>
                            <Trash2 size={13} />
                            <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Remove</span>
                          </Button>
                        </>
                      ) : (() => {
                        const eps = activeSeason?.episodes || [];
                        const allWatched = eps.length > 0 && eps.every((ep: any) => ep.status === 'WATCHED');
                        return (
                          <Button variant={allWatched ? 'success' : 'outline-secondary'} size="sm"
                            className={`d-flex align-items-center gap-2 rounded border-0 ${allWatched ? 'text-white' : 'bg-secondary bg-opacity-10'}`}
                            onClick={handleMarkAllWatched}>
                            <Check size={13} />
                            <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>{allWatched ? 'Watched' : 'Mark all'}</span>
                          </Button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* ── Seasons / Episodes list ── */}
                  <div className="border-top border-secondary border-opacity-10" style={{ maxHeight: '52vh', overflowY: 'auto' }}>
                    <AnimatePresence mode="wait">
                      {selectedSeason === null ? (
                        <motion.div key="seasons-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }} className="d-flex flex-column">
                          {!selectedShow.seasons?.length ? (
                            <div className="text-center py-5 text-secondary font-mono" style={{ fontSize: '13px' }}>No seasons data available.</div>
                          ) : selectedShow.seasons.map((season: any) => {
                            const eps = season.episodes || [];
                            const watched = eps.filter((e: any) => e.status === 'WATCHED').length;
                            return (
                              <div key={season.id} className="d-flex flex-row align-items-center gap-3 p-3 border-bottom border-secondary border-opacity-10"
                                style={{ cursor: 'pointer' }} onClick={() => handleSeasonClick(season.season_number)}>
                                <div className="flex-shrink-0 shadow-sm rounded overflow-hidden bg-secondary bg-opacity-10" style={{ width: '36px', height: '54px' }}>
                                  {season.poster_path ? (
                                    <img src={`https://image.tmdb.org/t/p/w200${season.poster_path}`} alt={season.name} className="w-100 h-100 object-fit-cover" />
                                  ) : (
                                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary opacity-50 font-mono" style={{ fontSize: '8px' }}>No Img</div>
                                  )}
                                </div>
                                <div className="flex-grow-1 min-w-0">
                                  <h3 className="fs-6 fw-medium text-truncate mb-1 font-mono text-body" style={{ fontSize: '13px' }}>{season.name}</h3>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="text-secondary font-mono" style={{ fontSize: '11px' }}>{season.episode_count} Eps</span>
                                    {season.air_date && (<><span className="text-secondary opacity-50" style={{ fontSize: '10px' }}>•</span><span className="text-secondary font-mono" style={{ fontSize: '11px' }}>{season.air_date.split('-')[0]}</span></>)}
                                    {eps.length > 0 && (<><span className="text-secondary opacity-50" style={{ fontSize: '10px' }}>•</span><span className="text-success fw-bold font-mono" style={{ fontSize: '11px' }}>{watched}/{eps.length}</span></>)}
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-secondary opacity-50">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </div>
                              </div>
                            );
                          })}
                        </motion.div>
                      ) : (
                        <motion.div key="episodes-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }} className="d-flex flex-column">
                          {displayedEpisodes.length === 0 ? (
                            <div className="text-center py-5">
                              <div className="spinner-border text-secondary opacity-50 mb-3" role="status" style={{ width: '1.5rem', height: '1.5rem' }} />
                              <p className="text-secondary font-mono" style={{ fontSize: '13px' }}>Loading episodes...</p>
                            </div>
                          ) : displayedEpisodes.map((ep: any, index: number) => (
                            <div key={ep.id} className="d-flex flex-row align-items-center gap-3 p-3 border-bottom border-secondary border-opacity-10 hover-bg-light"
                                 style={{ cursor: 'pointer' }}
                                 onClick={() => setSelectedEpisode({ ...ep, episodeNumber: index + 1 })}>
                              <div className="flex-shrink-0 text-secondary font-mono fw-medium" style={{ width: '22px', fontSize: '11px' }}>{String(index + 1).padStart(2, '0')}</div>
                              <div className="flex-grow-1 min-w-0">
                                <h3 className="fs-6 fw-medium text-truncate mb-1 font-mono text-body" style={{ fontSize: '13px' }}>{ep.title}</h3>
                                <div className="d-flex align-items-center gap-2">
                                  <p className="text-secondary mb-0 font-mono" style={{ fontSize: '11px' }}>{ep.date}</p>
                                  {ep.runtime > 0 && (<><span className="text-secondary opacity-50" style={{ fontSize: '10px' }}>•</span><p className="text-secondary mb-0 font-mono" style={{ fontSize: '11px' }}>{ep.runtime}m</p></>)}
                                </div>
                              </div>
                              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <StatusDropdown status={ep.status} statusColor={ep.statusColor}
                                  onSelect={(s, c) => handleEpisodeStatusChange(selectedShow.id, (selectedSeason as number), ep.id, s, c)} />
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Modal.Body>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* ── Episode detail modal ── */}
      <Modal show={!!selectedEpisode} onHide={() => setSelectedEpisode(null)} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden" animation={false}>
        <AnimatePresence>
          {selectedEpisode && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 12 }}>
                <button
                  onClick={() => setSelectedEpisode(null)}
                  className="border-0 bg-secondary bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                  style={{ width: '30px', height: '30px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                >
                  <X size={16} className="text-body" />
                </button>
              </div>
              <div className="scrollbar-hide" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <Modal.Body className="p-0">
                  <div className="p-4 pb-3">
                    <div className="d-flex gap-3 align-items-start">
                      {(() => {
                        let img = null;
                        if (selectedEpisode.still_path) img = `https://image.tmdb.org/t/p/w200${selectedEpisode.still_path}`;
                        else if (selectedSeason !== null && activeSeason?.poster_path) img = `https://image.tmdb.org/t/p/w200${activeSeason.poster_path}`;
                        else if (selectedShow?.image) img = selectedShow.image;
                        
                        return img && (
                          <div className="flex-shrink-0 shadow-sm rounded overflow-hidden" style={{ width: '72px', height: '108px' }}>
                            <img src={img} alt={selectedEpisode.title} className="w-100 h-100 object-fit-cover" />
                          </div>
                        );
                      })()}

                      <div className="flex-grow-1 min-w-0 pt-1">
                        <div className="text-secondary fw-bold text-uppercase mb-1 font-mono" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
                          S{String(selectedSeason).padStart(2, '0')} E{String(selectedEpisode.episodeNumber).padStart(2, '0')}
                        </div>
                        <h1 className="fs-5 fw-bold font-mono text-body mb-1" style={{ letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                          {selectedEpisode.title}
                        </h1>
                        <div className="d-flex align-items-center gap-2 flex-wrap font-mono text-secondary" style={{ fontSize: '12px' }}>
                          <span>{selectedEpisode.date}</span>
                          {selectedEpisode.runtime > 0 && (
                            <><span className="opacity-50">•</span><span>{selectedEpisode.runtime}m</span></>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <StatusDropdown status={selectedEpisode.status} statusColor={selectedEpisode.statusColor} onSelect={(s, c) => {
                        handleEpisodeStatusChange(selectedShow.id, selectedSeason as number, selectedEpisode.id, s, c);
                        setSelectedEpisode({ ...selectedEpisode, status: s, statusColor: c });
                      }} />
                    </div>
                  </div>

                  <div className="px-4 pb-4 d-flex flex-column gap-4">
                    {selectedEpisode.summary && (
                      <div>
                        <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Summary</h3>
                        <p className="font-mono text-body m-0" style={{ fontSize: '13px', lineHeight: '1.6' }}>{selectedEpisode.summary}</p>
                      </div>
                    )}
                    {selectedEpisode.cast?.length > 0 && (
                      <div>
                        <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Guest Stars</h3>
                        <div className="d-flex flex-column gap-2">
                          {selectedEpisode.cast.map((person: any, idx: number) => (
                            <div key={idx} className="d-flex justify-content-between align-items-baseline border-bottom border-secondary border-opacity-10 pb-2">
                              <span className="fw-medium text-body font-mono" style={{ fontSize: '12px' }}>{person.name}</span>
                              <span className="text-secondary font-mono" style={{ fontSize: '11px' }}>{person.role}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Modal.Body>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* Single delete */}
      <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden">
        {deleteTarget && (
          <Modal.Body className="p-4 p-sm-5 text-center">
            <div className="mb-3">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10" style={{ width: '48px', height: '48px' }}>
                <Trash2 size={22} className="text-danger" />
              </div>
            </div>
            <h5 className="fw-bold font-mono text-body mb-2">Remove Entry</h5>
            <p className="text-secondary font-mono mb-4" style={{ fontSize: '13px' }}>
              Remove <strong className="text-body">{deleteTarget.title || deleteTarget.name}</strong> from your library?
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <Button variant="light" className="px-4 py-2 font-mono fw-medium rounded border-0 bg-secondary bg-opacity-10 text-body"
                onClick={() => setDeleteTarget(null)} style={{ fontSize: '13px' }}>Cancel</Button>
              <Button variant="danger" className="px-4 py-2 font-mono fw-medium rounded border-0"
                onClick={() => { removeShow(deleteTarget.id); setDeleteTarget(null); }} style={{ fontSize: '13px' }}>Delete</Button>
            </div>
          </Modal.Body>
        )}
      </Modal>

      {/* Bulk delete */}
      <Modal show={bulkDeleteOpen} onHide={() => setBulkDeleteOpen(false)} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden">
        <Modal.Body className="p-4 p-sm-5 text-center">
          <div className="mb-3">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10" style={{ width: '48px', height: '48px' }}>
              <Trash2 size={22} className="text-danger" />
            </div>
          </div>
          <h5 className="fw-bold font-mono text-body mb-2">Remove {selectedIds.size} Series</h5>
          <p className="text-secondary font-mono mb-4" style={{ fontSize: '13px' }}>
            This will permanently remove {selectedIds.size} series from your library.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="light" className="px-4 py-2 font-mono fw-medium rounded border-0 bg-secondary bg-opacity-10 text-body"
              onClick={() => setBulkDeleteOpen(false)} style={{ fontSize: '13px' }}>Cancel</Button>
            <Button variant="danger" className="px-4 py-2 font-mono fw-medium rounded border-0"
              onClick={handleBulkDelete} style={{ fontSize: '13px' }}>Delete All</Button>
          </div>
        </Modal.Body>
      </Modal>

    </Container>
  );
}