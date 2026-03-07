import React, { useState } from 'react';
import { Container, Button, Modal } from 'react-bootstrap';
import { Check, X, Plus, Play } from 'lucide-react';
import { fetchTVDetails, fetchTVSeason } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MediaCard, { StatusDropdown, COLOR_MAP } from '../components/MediaCard';

export default function TV() {
  const { shows, updateShow } = useLibrary();
  const [selectedShow, setSelectedShow] = useState<any>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  const handleShowClick = async (show: any) => {
    setSelectedShow(show);
    setSelectedSeason(null);
    if (show.seasons && show.seasons.length > 0 && show.runtime !== undefined) return;

    const details = await fetchTVDetails(show.id);
    if (details) {
      const trailer = details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
      const episodeRuntime = details.episode_run_time?.[0] || 0;
      const totalEpisodes = details.number_of_episodes || 0;

      const seasons = details.seasons?.filter((s: any) => s.season_number > 0) || [];

      const updatedShow = {
        ...show,
        seasons: show.seasons || seasons,
        runtime: episodeRuntime * totalEpisodes,
        trailer,
        total_episodes: totalEpisodes
      };
      setSelectedShow(updatedShow);
      updateShow(show.id, updatedShow);
    }
  };

  const handleSeasonClick = async (seasonNumber: number) => {
    // If we've already fetched this season's episodes, just open it
    const existingSeason = selectedShow.seasons?.find((s: any) => s.season_number === seasonNumber);
    if (existingSeason && existingSeason.episodes && existingSeason.episodes.length > 0) {
      setSelectedSeason(seasonNumber);
      return;
    }

    const seasonData = await fetchTVSeason(selectedShow.id, seasonNumber);
    if (seasonData && seasonData.episodes) {
      const formattedEpisodes = seasonData.episodes.map((ep: any) => ({
        id: ep.id,
        title: ep.name,
        date: ep.air_date ? new Date(ep.air_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBA',
        status: 'WILL WATCH',
        statusColor: 'warning'
      }));

      const updatedSeasons = selectedShow.seasons.map((s: any) =>
        s.season_number === seasonNumber ? { ...s, episodes: formattedEpisodes } : s
      );

      // Re-calculate global progress
      const allTrackedEpisodes = updatedSeasons.flatMap((s: any) => s.episodes || []);
      const watchedCount = allTrackedEpisodes.filter((ep: any) => ep.status === 'WATCHED').length;

      const updatedShow = {
        ...selectedShow,
        seasons: updatedSeasons,
        progress: { watched: watchedCount, total: selectedShow.total_episodes || allTrackedEpisodes.length }
      };

      setSelectedShow(updatedShow);
      updateShow(selectedShow.id, updatedShow);
      setSelectedSeason(seasonNumber);
    }
  };

  const handleMarkAllWatched = () => {
    if (!selectedShow || selectedSeason === null) return;

    const updatedSeasons = selectedShow.seasons.map((season: any) => {
      if (season.season_number === selectedSeason) {
        const updatedEpisodes = (season.episodes || []).map((ep: any) => ({
          ...ep,
          status: 'WATCHED',
          statusColor: 'success'
        }));
        return { ...season, episodes: updatedEpisodes };
      }
      return season;
    });

    const allTrackedEpisodes = updatedSeasons.flatMap((s: any) => s.episodes || []);
    const watchedCount = allTrackedEpisodes.filter((ep: any) => ep.status === 'WATCHED').length;

    const updatedShow = {
      ...selectedShow,
      seasons: updatedSeasons,
      progress: { watched: watchedCount, total: selectedShow.total_episodes || allTrackedEpisodes.length },
      status: watchedCount === (selectedShow.total_episodes || allTrackedEpisodes.length) ? 'WATCHED' : selectedShow.status,
      statusColor: watchedCount === (selectedShow.total_episodes || allTrackedEpisodes.length) ? 'success' : selectedShow.statusColor
    };

    setSelectedShow(updatedShow);
    updateShow(selectedShow.id, updatedShow);
  };

  const handleStatusChange = (showId: number, newStatus: string, newColor: string) => {
    updateShow(showId, { status: newStatus, statusColor: newColor });
  };

  const handleEpisodeStatusChange = (showId: number, seasonNumber: number, episodeId: number, newStatus: string, newColor: string) => {
    const show = shows.find(s => s.id === showId);
    if (!show || !show.seasons) return;

    const updatedSeasons = show.seasons.map((season: any) => {
      if (season.season_number === seasonNumber) {
        const updatedEpisodes = (season.episodes || []).map((ep: any) =>
          ep.id === episodeId ? { ...ep, status: newStatus, statusColor: newColor } : ep
        );
        return { ...season, episodes: updatedEpisodes };
      }
      return season;
    });

    const allTrackedEpisodes = updatedSeasons.flatMap((s: any) => s.episodes || []);
    const watchedCount = allTrackedEpisodes.filter((ep: any) => ep.status === 'WATCHED').length;

    const updatedShow = {
      ...show,
      seasons: updatedSeasons,
      progress: { ...show.progress, watched: watchedCount }
    };

    if (selectedShow && selectedShow.id === showId) {
      setSelectedShow(updatedShow);
    }
    updateShow(showId, updatedShow);
  };

  const groupedShows = shows.reduce((acc, show) => {
    if (!acc[show.year]) acc[show.year] = [];
    acc[show.year].push(show);
    return acc;
  }, {} as Record<number, any[]>);

  const years = Object.keys(groupedShows).map(Number).sort((a, b) => b - a);

  const activeSeason = selectedSeason !== null ? selectedShow?.seasons?.find((s: any) => s.season_number === selectedSeason) : null;
  const displayedEpisodes = activeSeason?.episodes || [];

  return (
    <Container className="py-3 px-4" style={{ maxWidth: '672px' }}>
      <div className="mb-5 d-flex align-items-center justify-content-between">
        <div>
          <h1 className="fs-3 fw-medium font-mono text-body tracking-tight mb-2">TV Series</h1>
          <p className="text-secondary font-mono m-0" style={{ fontSize: '13px' }}>{shows.length} entries</p>
        </div>
        <Button as={Link} to="/search" variant="outline-secondary" className="d-flex align-items-center gap-2 border-0 bg-secondary bg-opacity-10 text-body p-2 rounded">
          <Plus size={16} />
        </Button>
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
          {years.map(year => (
            <div key={year} className="mb-5">
              <h2 className="fs-5 fw-medium mb-3 font-mono text-body d-flex align-items-center gap-3">
                {year}
                <div className="flex-grow-1 bg-secondary opacity-25" style={{ height: '1px' }}></div>
              </h2>
              <div className="d-flex flex-column gap-2">
                {groupedShows[year].map(show => (
                  <MediaCard
                    key={show.id}
                    item={show}
                    type="tv"
                    onClick={() => handleShowClick(show)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Modal */}
      <Modal
        show={!!selectedShow}
        onHide={() => setSelectedShow(null)}
        centered
        contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
      >
        {selectedShow && (
          <>
            <div className="d-flex align-items-center justify-content-between p-4 border-bottom border-secondary border-opacity-10 bg-body">
              <div className="min-w-0 pe-3 d-flex align-items-center gap-3">
                {selectedSeason !== null && (
                  <Button
                    variant="light"
                    className="rounded-circle p-1 d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 border-0 flex-shrink-0 hover-bg-light"
                    onClick={() => setSelectedSeason(null)}
                    style={{ width: '32px', height: '32px', cursor: 'pointer' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </Button>
                )}
                <div className="d-flex flex-column">
                  <h2 className="fs-5 fw-bold m-0 font-mono text-body text-truncate" style={{ letterSpacing: '-0.01em' }}>
                    {selectedSeason !== null ? `Season ${selectedSeason}` : selectedShow.title}
                  </h2>
                  <span className="text-secondary font-mono" style={{ fontSize: '12px' }}>
                    {selectedSeason !== null ? selectedShow.title : `${selectedShow.seasons?.length || 0} Seasons • ${selectedShow.progress?.watched || 0}/${selectedShow.total_episodes || 0} Watched`}
                  </span>
                </div>
              </div>
              <Button
                variant="light"
                className="rounded-circle p-1 d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 border-0 flex-shrink-0"
                onClick={() => setSelectedShow(null)}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} className="text-body" />
              </Button>
            </div>

            <div className="px-4 py-3 border-bottom border-secondary border-opacity-10 bg-body d-flex gap-2 flex-wrap align-items-center justify-content-between">
              <div className="d-flex gap-2">
                {selectedSeason !== null && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="d-flex align-items-center gap-2 rounded border-0 bg-secondary bg-opacity-10"
                    onClick={handleMarkAllWatched}
                  >
                    <Check size={14} />
                    <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Mark season watched</span>
                  </Button>
                )}
                {selectedSeason === null && selectedShow.trailer && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="d-flex align-items-center gap-2 rounded border-0 bg-primary bg-opacity-10"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedShow.trailer}`, '_blank')}
                  >
                    <Play size={14} fill="currentColor" />
                    <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Trailer</span>
                  </Button>
                )}
              </div>
            </div>

            <Modal.Body className="p-0 bg-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              <AnimatePresence mode="wait">
                {selectedSeason === null ? (
                  <motion.div
                    key="seasons-view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className="d-flex flex-column"
                  >
                    {selectedShow.seasons?.length === 0 ? (
                      <div className="text-center py-5 text-secondary font-mono" style={{ fontSize: '13px' }}>
                        No seasons data available.
                      </div>
                    ) : (
                      selectedShow.seasons?.map((season: any) => {
                        const seasonEpisodes = season.episodes || [];
                        const seasonWatched = seasonEpisodes.filter((ep: any) => ep.status === 'WATCHED').length;
                        const isSeasonTracked = seasonEpisodes.length > 0;

                        return (
                          <div
                            key={season.id}
                            className="d-flex flex-row align-items-center gap-3 p-3 border-bottom border-secondary border-opacity-10 cursor-pointer hover-bg-light"
                            style={{ backgroundColor: 'transparent', cursor: 'pointer' }}
                            onClick={() => handleSeasonClick(season.season_number)}
                          >
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
                                <span className="text-secondary mb-0 font-mono" style={{ fontSize: '11px' }}>{season.episode_count} Episodes</span>
                                {season.air_date && (
                                  <>
                                    <span className="text-secondary opacity-50" style={{ fontSize: '10px' }}>•</span>
                                    <span className="text-secondary mb-0 font-mono" style={{ fontSize: '11px' }}>{season.air_date.split('-')[0]}</span>
                                  </>
                                )}
                                {isSeasonTracked && (
                                  <>
                                    <span className="text-secondary opacity-50" style={{ fontSize: '10px' }}>•</span>
                                    <span className="text-success fw-bold font-mono" style={{ fontSize: '11px' }}>{seasonWatched}/{seasonEpisodes.length}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-secondary opacity-50">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="episodes-view"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                    className="d-flex flex-column"
                  >
                    {displayedEpisodes.length === 0 ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-secondary opacity-50 mb-3" role="status" style={{ width: '1.5rem', height: '1.5rem' }}></div>
                        <p className="text-secondary font-mono" style={{ fontSize: '13px' }}>Loading episodes...</p>
                      </div>
                    ) : (
                      displayedEpisodes.map((ep: any, index: number) => (
                        <div
                          key={ep.id}
                          className="d-flex flex-row align-items-center gap-3 p-3 border-bottom border-secondary border-opacity-10"
                          style={{ backgroundColor: 'transparent' }}
                        >
                          <div className="flex-shrink-0 text-secondary font-mono fw-medium" style={{ width: '24px', fontSize: '12px' }}>
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <h3 className="fs-6 fw-medium text-truncate mb-1 font-mono text-body" style={{ fontSize: '14px' }}>{ep.title}</h3>
                            <p className="text-secondary mb-0 font-mono" style={{ fontSize: '11px' }}>{ep.date}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <StatusDropdown
                              status={ep.status}
                              statusColor={ep.statusColor}
                              onSelect={(newStatus, newColor) =>
                                handleEpisodeStatusChange(selectedShow.id, selectedSeason, ep.id, newStatus, newColor)
                              }
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Modal.Body>
          </>
        )}
      </Modal>
    </Container>
  );
}