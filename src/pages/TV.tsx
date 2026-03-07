import React, { useState, useMemo } from 'react';
import { Container, Button, Modal } from 'react-bootstrap';
import { Check, X, Plus, Play, Trash2, ChevronDown, CheckSquare } from 'lucide-react';
import { fetchTVDetails, fetchTVSeason } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MediaCard, { StatusDropdown, COLOR_MAP } from '../components/MediaCard';

const GENRE_MAP: Record<number, string> = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids',
  9648: 'Mystery', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
  10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics', 37: 'Western',
};

const STATUS_COLORS: Record<string, string> = {
  WATCHED: 'success', WATCHING: 'primary', 'WILL WATCH': 'warning', 'ON HOLD': 'danger',
};

type SortKey = 'year-desc' | 'year-asc' | 'title-asc' | 'title-desc' | 'added-desc' | 'added-asc';

export default function TV() {
  const { shows, updateShow, removeShow } = useLibrary();

  // ── Filters ───────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [genreFilter, setGenreFilter]   = useState<number | null>(null);
  const [sortKey, setSortKey]           = useState<SortKey>('year-desc');
  const [statusOpen, setStatusOpen]     = useState(false);
  const [genreOpen, setGenreOpen]       = useState(false);
  const [sortOpen, setSortOpen]         = useState(false);

  // ── Selection ─────────────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds]     = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // ── Detail / delete modals ────────────────────────────────
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // ── Derived genre list ────────────────────────────────────
  const availableGenres = useMemo(() => {
    const ids = new Set<number>();
    shows.forEach(s => (s.genre_ids || []).forEach((id: number) => ids.add(id)));
    return Array.from(ids).filter(id => GENRE_MAP[id]).sort((a, b) => GENRE_MAP[a].localeCompare(GENRE_MAP[b]));
  }, [shows]);

  // ── Filtered + sorted ─────────────────────────────────────
  const displayedShows = useMemo(() => {
    let list = [...shows];
    if (statusFilter) list = list.filter(s => s.status === statusFilter);
    if (genreFilter)  list = list.filter(s => (s.genre_ids || []).includes(genreFilter));
    switch (sortKey) {
      case 'year-desc':  list.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
      case 'year-asc':   list.sort((a, b) => (a.year || 0) - (b.year || 0)); break;
      case 'title-asc':  list.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
      case 'title-desc': list.sort((a, b) => (b.title || '').localeCompare(a.title || '')); break;
      case 'added-desc': list.sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime()); break;
      case 'added-asc':  list.sort((a, b) => new Date(a.addedAt || 0).getTime() - new Date(b.addedAt || 0).getTime()); break;
    }
    return list;
  }, [shows, statusFilter, genreFilter, sortKey]);

  const isYearGrouped = sortKey === 'year-desc' || sortKey === 'year-asc';
  const groupedByYear = useMemo(() => {
    if (!isYearGrouped) return null;
    const map: Record<number, any[]> = {};
    displayedShows.forEach(s => { if (!map[s.year]) map[s.year] = []; map[s.year].push(s); });
    const years = Object.keys(map).map(Number).sort((a, b) => sortKey === 'year-desc' ? b - a : a - b);
    return { map, years };
  }, [displayedShows, isYearGrouped, sortKey]);

  // ── Show detail handlers ──────────────────────────────────
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

  const handleStatusChange = (showId: number, newStatus: string, newColor: string) => {
    updateShow(showId, { status: newStatus, statusColor: newColor });
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

  // ── Selection handlers ────────────────────────────────────
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const exitSelectionMode = () => { setSelectionMode(false); setSelectedIds(new Set()); };
  const handleBulkDelete = () => { selectedIds.forEach(id => removeShow(id)); exitSelectionMode(); setBulkDeleteOpen(false); };

  // ── Dropdown components ───────────────────────────────────
  const FilterDropdown = ({ label, open, setOpen, children }: { label: string; open: boolean; setOpen: (v: boolean) => void; children: React.ReactNode }) => (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        className="bg-body border rounded px-3 py-1 font-mono text-secondary d-inline-flex align-items-center gap-1"
        style={{ fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        {label} <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 1060,
          backgroundColor: 'var(--bs-body-bg)', borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '150px', padding: '4px 0', overflow: 'hidden',
        }}>
          {children}
        </div>
      )}
    </div>
  );

  const DropdownItem = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick}
      className="d-flex align-items-center gap-2 w-100 border-0 text-start font-mono"
      style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: active ? 'rgba(0,0,0,0.06)' : 'transparent', fontWeight: active ? 700 : 400, color: 'var(--bs-body-color)' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = active ? 'rgba(0,0,0,0.06)' : 'transparent')}>
      {children}
    </button>
  );

  React.useEffect(() => {
    if (!statusOpen && !genreOpen && !sortOpen) return;
    const handler = () => { setStatusOpen(false); setGenreOpen(false); setSortOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusOpen, genreOpen, sortOpen]);

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

      {/* Header */}
      <div className="mb-5 d-flex align-items-center justify-content-between">
        <div>
          <h1 className="fs-3 fw-medium font-mono text-body tracking-tight mb-2">Series</h1>
          <p className="text-secondary font-mono m-0" style={{ fontSize: '13px' }}>
            {displayedShows.length !== shows.length ? `${displayedShows.length} of ${shows.length} entries` : `${shows.length} entries`}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {!selectionMode ? (
            <>
              <button onClick={() => setSelectionMode(true)}
                className="border-0 bg-secondary bg-opacity-10 text-body p-2 rounded d-flex align-items-center"
                title="Select items" style={{ cursor: 'pointer' }}>
                <CheckSquare size={16} />
              </button>
              <Button as={Link} to="/search" variant="outline-secondary" className="d-flex align-items-center gap-2 border-0 bg-secondary bg-opacity-10 text-body p-2 rounded">
                <Plus size={16} />
              </Button>
            </>
          ) : (
            <>
              <span className="font-mono text-secondary me-1" style={{ fontSize: '12px' }}>{selectedIds.size} selected</span>
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
            </>
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
        <>
          {/* Filter bar */}
          <div className="d-flex gap-2 mb-4 overflow-auto hide-scrollbar" style={{ whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
            <FilterDropdown label={statusFilter ?? 'Status'} open={statusOpen}
              setOpen={v => { setStatusOpen(v); if (v) { setGenreOpen(false); setSortOpen(false); } }}>
              <DropdownItem active={statusFilter === null} onClick={() => { setStatusFilter(null); setStatusOpen(false); }}>All</DropdownItem>
              {Object.keys(STATUS_COLORS).map(s => (
                <DropdownItem key={s} active={statusFilter === s} onClick={() => { setStatusFilter(s); setStatusOpen(false); }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: `var(--accent-${STATUS_COLORS[s]})`, display: 'inline-block' }} />
                  {s}
                </DropdownItem>
              ))}
            </FilterDropdown>

            <FilterDropdown label={genreFilter ? GENRE_MAP[genreFilter] : 'Genre'} open={genreOpen}
              setOpen={v => { setGenreOpen(v); if (v) { setStatusOpen(false); setSortOpen(false); } }}>
              <DropdownItem active={genreFilter === null} onClick={() => { setGenreFilter(null); setGenreOpen(false); }}>All</DropdownItem>
              {availableGenres.map(id => (
                <DropdownItem key={id} active={genreFilter === id} onClick={() => { setGenreFilter(id); setGenreOpen(false); }}>{GENRE_MAP[id]}</DropdownItem>
              ))}
            </FilterDropdown>

            <FilterDropdown label={{ 'year-desc': 'Year ↓', 'year-asc': 'Year ↑', 'title-asc': 'Title A–Z', 'title-desc': 'Title Z–A', 'added-desc': 'Newest', 'added-asc': 'Oldest' }[sortKey]}
              open={sortOpen} setOpen={v => { setSortOpen(v); if (v) { setStatusOpen(false); setGenreOpen(false); } }}>
              {(['year-desc', 'year-asc', 'title-asc', 'title-desc', 'added-desc', 'added-asc'] as SortKey[]).map(k => (
                <DropdownItem key={k} active={sortKey === k} onClick={() => { setSortKey(k); setSortOpen(false); }}>
                  {{ 'year-desc': 'Year ↓', 'year-asc': 'Year ↑', 'title-asc': 'Title A–Z', 'title-desc': 'Title Z–A', 'added-desc': 'Newest added', 'added-asc': 'Oldest added' }[k]}
                </DropdownItem>
              ))}
            </FilterDropdown>

            {(statusFilter || genreFilter) && (
              <button onClick={() => { setStatusFilter(null); setGenreFilter(null); }}
                className="border-0 bg-danger bg-opacity-10 text-danger rounded px-2 py-1 font-mono d-flex align-items-center gap-1"
                style={{ fontSize: '11px', cursor: 'pointer' }}>
                <X size={11} /> Clear
              </button>
            )}
          </div>

          {displayedShows.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-secondary font-mono" style={{ fontSize: '13px' }}>No series match the current filters.</p>
            </div>
          ) : isYearGrouped && groupedByYear ? (
            groupedByYear.years.map(year => (
              <div key={year} className="mb-5">
                <h2 className="fs-5 fw-medium mb-3 font-mono text-body d-flex align-items-center gap-3">
                  {year}
                  <div className="flex-grow-1 bg-secondary opacity-25" style={{ height: '1px' }} />
                </h2>
                <div className="d-flex flex-column gap-2">{renderCards(groupedByYear.map[year])}</div>
              </div>
            ))
          ) : (
            <div className="d-flex flex-column gap-2">{renderCards(displayedShows)}</div>
          )}
        </>
      )}

      {/* Show detail modal — unchanged from original */}
      <Modal show={!!selectedShow} onHide={() => setSelectedShow(null)} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden">
        {selectedShow && (
          <>
            <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-secondary border-opacity-10 bg-body">
              <div className="min-w-0 pe-3 d-flex align-items-center gap-3">
                {selectedSeason !== null && (
                  <Button variant="light" className="rounded-circle p-1 d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 border-0 flex-shrink-0"
                    onClick={() => setSelectedSeason(null)} style={{ width: '32px', height: '32px', cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </Button>
                )}
                <div className="d-flex flex-column">
                  <h2 className="fs-5 fw-bold m-0 font-mono text-body" style={{ letterSpacing: '-0.01em' }}>
                    {selectedSeason !== null ? `Season ${selectedSeason}` : selectedShow.title}
                  </h2>
                  <span className="text-secondary font-mono" style={{ fontSize: '12px' }}>
                    {selectedSeason !== null ? selectedShow.title : `${selectedShow.seasons?.length || 0} Seasons • ${selectedShow.progress?.watched || 0}/${selectedShow.total_episodes || 0} Watched`}
                  </span>
                </div>
              </div>
              <Button variant="light" className="rounded-circle p-1 d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 border-0 flex-shrink-0"
                onClick={() => setSelectedShow(null)} style={{ width: '32px', height: '32px' }}>
                <X size={18} className="text-body" />
              </Button>
            </div>

            <div className="px-4 py-3 border-bottom border-secondary border-opacity-10 bg-body d-flex gap-2 flex-wrap align-items-center justify-content-between">
              <div className="d-flex gap-2">
                {selectedSeason !== null && (() => {
                  const allWatched = (activeSeason?.episodes || []).length > 0 && (activeSeason?.episodes || []).every((ep: any) => ep.status === 'WATCHED');
                  return (
                    <Button variant={allWatched ? 'success' : 'outline-secondary'} size="sm"
                      className={`d-flex align-items-center gap-2 rounded border-0 ${allWatched ? 'text-white' : 'bg-secondary bg-opacity-10'}`}
                      onClick={handleMarkAllWatched}>
                      <Check size={14} />
                      <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>{allWatched ? 'Watched' : 'Mark all'}</span>
                    </Button>
                  );
                })()}
                {selectedSeason === null && (() => {
                  const isWatched = selectedShow.status === 'WATCHED';
                  return (
                    <Button variant={isWatched ? 'success' : 'outline-secondary'} size="sm"
                      className={`d-flex align-items-center gap-2 rounded border-0 ${isWatched ? 'text-white' : 'bg-secondary bg-opacity-10'}`}
                      onClick={handleMarkAllSeasonsWatched}>
                      <Check size={14} />
                      <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>{isWatched ? 'Watched' : 'Mark all'}</span>
                    </Button>
                  );
                })()}
                {selectedSeason === null && selectedShow.trailer && (
                  <Button variant="outline-primary" size="sm" className="d-flex align-items-center gap-2 rounded border-0 bg-primary bg-opacity-10"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedShow.trailer}`, '_blank')}>
                    <Play size={14} fill="currentColor" />
                    <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Trailer</span>
                  </Button>
                )}
                {selectedSeason === null && (
                  <Button variant="outline-danger" size="sm" className="d-flex align-items-center gap-2 rounded border-0 bg-danger bg-opacity-10"
                    onClick={() => { setSelectedShow(null); setDeleteTarget(selectedShow); }}>
                    <Trash2 size={14} />
                    <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Remove</span>
                  </Button>
                )}
              </div>
            </div>

            <Modal.Body className="p-0 bg-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
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
                          <div className="flex-shrink-0 shadow-sm rounded overflow-hidden bg-secondary bg-opacity-10" style={{ width: '40px', height: '60px' }}>
                            {season.poster_path ? (
                              <img src={`https://image.tmdb.org/t/p/w200${season.poster_path}`} alt={season.name} className="w-100 h-100 object-fit-cover" />
                            ) : (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary opacity-50 font-mono" style={{ fontSize: '9px' }}>No Img</div>
                            )}
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <h3 className="fs-6 fw-medium text-truncate mb-1 font-mono text-body" style={{ fontSize: '14px' }}>{season.name}</h3>
                            <div className="d-flex align-items-center gap-2">
                              <span className="text-secondary font-mono" style={{ fontSize: '11px' }}>{season.episode_count} Episodes</span>
                              {season.air_date && (<><span className="text-secondary opacity-50" style={{ fontSize: '10px' }}>•</span><span className="text-secondary font-mono" style={{ fontSize: '11px' }}>{season.air_date.split('-')[0]}</span></>)}
                              {eps.length > 0 && (<><span className="text-secondary opacity-50" style={{ fontSize: '10px' }}>•</span><span className="text-success fw-bold font-mono" style={{ fontSize: '11px' }}>{watched}/{eps.length}</span></>)}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-secondary opacity-50">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
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
                      <div key={ep.id} className="d-flex flex-row align-items-center gap-3 p-3 border-bottom border-secondary border-opacity-10">
                        <div className="flex-shrink-0 text-secondary font-mono fw-medium" style={{ width: '24px', fontSize: '12px' }}>{String(index + 1).padStart(2, '0')}</div>
                        <div className="flex-grow-1 min-w-0">
                          <h3 className="fs-6 fw-medium text-truncate mb-1 font-mono text-body" style={{ fontSize: '14px' }}>{ep.title}</h3>
                          <div className="d-flex align-items-center gap-2">
                            <p className="text-secondary mb-0 font-mono" style={{ fontSize: '11px' }}>{ep.date}</p>
                            {ep.runtime > 0 && (<><span className="text-secondary opacity-50" style={{ fontSize: '10px' }}>•</span><p className="text-secondary mb-0 font-mono" style={{ fontSize: '11px' }}>{ep.runtime}m</p></>)}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <StatusDropdown status={ep.status} statusColor={ep.statusColor}
                            onSelect={(s, c) => handleEpisodeStatusChange(selectedShow.id, selectedSeason, ep.id, s, c)} />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </Modal.Body>
          </>
        )}
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