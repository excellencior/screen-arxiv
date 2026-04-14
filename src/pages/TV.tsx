import React, { useState, useMemo } from 'react';
import { Container, Button } from 'react-bootstrap';
import { X, Plus, Trash2, CheckSquare } from 'lucide-react';
import { fetchTVDetails, fetchTVSeason } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { Link } from 'react-router-dom';
import MediaCard from '../components/MediaCard';
import TVShowModal from '../components/modals/TVShowModal';
import TVEpisodeModal from '../components/modals/TVEpisodeModal';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';

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
    if (show.seasons && show.seasons.length > 0 && show.cast && show.cast.length > 0 && show.runtime !== undefined) return;
    const details = await fetchTVDetails(show.id);
    if (details) {
      const trailer = details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
      const episodeRuntime = details.episode_run_time?.[0] || details.last_episode_to_air?.runtime || 0;
      const totalEpisodes = details.number_of_episodes || 0;
      const seasons = details.seasons?.filter((s: any) => s.season_number > 0) || [];
      const cast = details.credits?.cast?.slice(0, 5).map((c: any) => ({ name: c.name, role: c.character })) || [];
      const updated = { ...show, seasons: show.seasons || seasons, runtime: episodeRuntime * totalEpisodes, episode_runtime: episodeRuntime, trailer, total_episodes: totalEpisodes, cast };
      setSelectedShow(updated);
      updateShow(show.id, updated);
    }
  };

  const handleSeasonClick = async (seasonNumber: number) => {
    const existing = selectedShow.seasons?.find((s: any) => s.season_number === seasonNumber);
    if (existing?.episodes?.length > 0) { setSelectedSeason(seasonNumber); return; }
    const seasonData = await fetchTVSeason(selectedShow.id, seasonNumber);
    if (seasonData?.episodes) {
      const isSeasonWatched = existing?.status === 'WATCHED' || selectedShow.status === 'WATCHED';
      const now = new Date();
      const formattedEps = seasonData.episodes.map((ep: any) => {
        const epDateStr = ep.air_date ? new Date(ep.air_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBA';
        const isReleased = ep.air_date ? new Date(ep.air_date) <= now : false;
        const epStatus = (isSeasonWatched && isReleased) ? 'WATCHED' : 'WILL WATCH';
        return {
          id: ep.id, title: ep.name,
          date: epDateStr,
          runtime: ep.runtime || 0,
          status: epStatus,
          statusColor: epStatus === 'WATCHED' ? 'success' : 'warning',
          summary: ep.overview,
          cast: ep.guest_stars?.map((g: any) => ({ name: g.name, role: g.character })) || []
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
      const updated = { ...selectedShow, seasons: updatedSeasons, progress: { watched: watchedCount, total }, status, statusColor, runtime: totalRuntime || selectedShow.runtime };
      setSelectedShow(updated);
      updateShow(selectedShow.id, updated);
      setSelectedSeason(seasonNumber);
    }
  };

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
        return {
          ...s,
          status: allWatched ? 'WATCHED' : 'WATCHING',
          episodes: updatedEps
        };
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
    if (!selectedShow?.seasons) return;
    const now = new Date();
    const updatedSeasons = selectedShow.seasons.map((s: any) => {
      let updatedEps = s.episodes || [];
      const hasEps = updatedEps.length > 0;

      if (hasEps) {
        updatedEps = updatedEps.map((ep: any) => {
          const isReleased = ep.date !== 'TBA' && new Date(ep.date) <= now;
          if (isReleased) {
            return { ...ep, status: 'WATCHED', statusColor: 'success' };
          }
          return ep;
        });
        const allWatched = updatedEps.every((e: any) => e.status === 'WATCHED');
        return {
          ...s,
          status: allWatched ? 'WATCHED' : 'WATCHING',
          episodes: updatedEps
        };
      } else {
        let seasonStatus = 'WATCHED';
        if (s.air_date && new Date(s.air_date) > now) {
          seasonStatus = 'WILL WATCH';
        }
        return {
          ...s,
          status: seasonStatus,
          episodes: []
        };
      }
    });

    const total = selectedShow.total_episodes || updatedSeasons.reduce((acc: number, s: any) => acc + (s.episode_count || s.episodes?.length || 0), 0);
    const { status, statusColor, watchedCount } = deriveShowStatus(updatedSeasons, total);
    const updated = { ...selectedShow, seasons: updatedSeasons, progress: { watched: watchedCount, total }, status, statusColor };
    setSelectedShow(updated);
    updateShow(selectedShow.id, updated);
  };

  const handleEpisodeStatusChange = (showId: number, seasonNumber: number, episodeId: number, newStatus: string, newColor: string) => {
    const show = shows.find(s => s.id === showId);
    if (!show?.seasons) return;
    const updatedSeasons = show.seasons.map((s: any) => {
      if (s.season_number === seasonNumber) {
        const updatedEps = (s.episodes || []).map((ep: any) => ep.id === episodeId ? { ...ep, status: newStatus, statusColor: newColor } : ep);
        const allWatched = updatedEps.length > 0 && updatedEps.every((e: any) => e.status === 'WATCHED');
        return { ...s, episodes: updatedEps, status: allWatched ? 'WATCHED' : 'WATCHING' };
      }
      return s;
    });
    const total = show.total_episodes || updatedSeasons.reduce((acc: number, s: any) => acc + (s.episode_count || s.episodes?.length || 0), 0);
    const { status, statusColor, watchedCount } = deriveShowStatus(updatedSeasons, total);
    const updated = { ...show, seasons: updatedSeasons, progress: { ...show.progress, watched: watchedCount, total }, status, statusColor };
    if (selectedShow?.id === showId) setSelectedShow(updated);
    updateShow(showId, updated);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const exitSelectionMode = () => { setSelectionMode(false); setSelectedIds(new Set()); };
  const handleBulkDelete = () => { selectedIds.forEach(id => removeShow(id)); exitSelectionMode(); setBulkDeleteOpen(false); };

  const activeSeason = selectedSeason !== null ? selectedShow?.seasons?.find((s: any) => s.season_number === selectedSeason) : null;

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

      <div className="mb-4 d-flex align-items-start justify-content-between">
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-baseline gap-1 gap-sm-2">
          <h1 className="fs-5 fw-bold font-mono text-body m-0">Series</h1>
          <p className="text-secondary font-mono m-0" style={{ fontSize: '12px' }}>
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

      {/* Extracted Modals */}
      <TVShowModal
        show={selectedShow}
        onHide={() => setSelectedShow(null)}
        onSeasonClick={handleSeasonClick}
        selectedSeason={selectedSeason}
        setSelectedSeason={setSelectedSeason}
        activeSeason={activeSeason}
        handleMarkAllSeasonsWatched={handleMarkAllSeasonsWatched}
        handleMarkAllWatched={handleMarkAllWatched}
        setDeleteTarget={setDeleteTarget}
        handleEpisodeStatusChange={handleEpisodeStatusChange}
        setSelectedEpisode={setSelectedEpisode}
        selectedEpisode={selectedEpisode}
      />

      <TVEpisodeModal
        episode={selectedEpisode}
        onHide={() => setSelectedEpisode(null)}
        selectedSeason={selectedSeason}
        selectedShow={selectedShow}
        activeSeason={activeSeason}
      />

      <ConfirmDeleteModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onConfirm={() => { removeShow(deleteTarget.id); setDeleteTarget(null); setSelectedShow(null); }}
        title="Remove Entry"
        message={deleteTarget && <>Remove <strong className="text-body">{deleteTarget.title || deleteTarget.name}</strong> from your library?</>}
      />

      <ConfirmDeleteModal
        show={bulkDeleteOpen}
        onHide={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Remove ${selectedIds.size} Series`}
        message={`This will permanently remove ${selectedIds.size} series from your library.`}
        confirmLabel="Delete All"
      />

    </Container>
  );
}