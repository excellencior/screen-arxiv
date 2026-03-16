import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { X, Check, Play, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackButton } from '../../context/BackButtonContext';
import { StatusDropdown } from '../MediaCard';

interface TVShowModalProps {
  show: any;
  onHide: () => void;
  onSeasonClick: (seasonNumber: number) => void;
  selectedSeason: number | null;
  setSelectedSeason: (season: number | null) => void;
  activeSeason: any;
  handleMarkAllSeasonsWatched: () => void;
  handleMarkAllWatched: () => void;
  setDeleteTarget: (target: any) => void;
  handleEpisodeStatusChange: (showId: number, seasonNumber: number, episodeId: number, newStatus: string, newColor: string) => void;
  setSelectedEpisode: (episode: any) => void;
  selectedEpisode: any;
}

const TVShowModal: React.FC<TVShowModalProps> = ({
  show,
  onHide,
  onSeasonClick,
  selectedSeason,
  setSelectedSeason,
  activeSeason,
  handleMarkAllSeasonsWatched,
  handleMarkAllWatched,
  setDeleteTarget,
  handleEpisodeStatusChange,
  setSelectedEpisode,
  selectedEpisode
}) => {
  // Handle back button: if in season view, go back to show view. Otherwise close modal.
  useBackButton(() => {
    if (selectedEpisode) return false; // Let EpisodeModal handle it if it's open
    if (selectedSeason !== null) {
      setSelectedSeason(null);
      return true;
    }
    onHide();
    return true;
  }, 10, !!show);

  if (!show) return null;

  const displayedEpisodes = activeSeason?.episodes || [];

  return (
    <Modal show={!!show} onHide={onHide} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden" animation={false}>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: selectedEpisode ? 'blur(4px)' : 'none', transition: 'filter 0.3s ease', pointerEvents: selectedEpisode ? 'none' : 'auto' }}
          >
            <div className="position-absolute top-0 start-0 end-0 p-3 d-flex justify-content-between align-items-center" style={{ zIndex: 12 }}>
              {selectedSeason !== null ? (
                <button
                  onClick={() => setSelectedSeason(null)}
                  className="border-0 bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '30px', height: '30px', cursor: 'pointer' }}
                  title="Back to seasons"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
              ) : <div />}
              <button
                onClick={onHide}
                className="border-0 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                style={{ width: '30px', height: '30px', cursor: 'pointer', backdropFilter: 'blur(4px)', backgroundColor: 'rgba(220,53,69,0.12)' }}
              >
                <X size={16} className="text-danger" />
              </button>
            </div>
            <div className="scrollbar-hide" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <Modal.Body className="p-0">
                {/* Header */}
                <div className="p-4 pb-3">
                  <div className="d-flex gap-3 align-items-start" style={{ paddingTop: selectedSeason !== null ? '36px' : '0' }}>
                    {/* Poster */}
                    {(() => {
                      const posterPath = selectedSeason !== null ? activeSeason?.poster_path : null;
                      const imageUrl = posterPath ? `https://image.tmdb.org/t/p/w200${posterPath}` : show.image;
                      return imageUrl && (
                        <div className="flex-shrink-0 shadow-sm rounded overflow-hidden" style={{ width: '72px', height: '108px' }}>
                          <img src={imageUrl} alt={show.title} className="w-100 h-100 object-fit-cover" />
                        </div>
                      );
                    })()}

                    <div className="flex-grow-1 min-w-0 pt-1">
                      <h1 className="fs-5 fw-bold font-mono text-body mb-1" style={{ letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                        {selectedSeason !== null ? `Season ${selectedSeason}` : show.title}
                      </h1>

                      <div className="d-flex align-items-center gap-2 flex-wrap font-mono text-secondary" style={{ fontSize: '12px' }}>
                        {selectedSeason !== null ? (
                          (() => {
                            const eps = activeSeason?.episodes || [];
                            const watched = eps.filter((e: any) => e.status === 'WATCHED').length;
                            const watchTime = eps.reduce((acc: number, ep: any) => acc + (ep.runtime || show.episode_runtime || 0), 0) || ((activeSeason?.episode_count || 0) * (show.episode_runtime || 0));
                            const hours = Math.floor(watchTime / 60);
                            const mins = watchTime % 60;
                            const timeStr = watchTime > 0 ? `${hours > 0 ? hours + 'h ' : ''}${mins}m` : null;

                            return (
                              <div className="d-flex flex-column gap-1">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  {eps.length > 0
                                    ? <><span>{eps.length} Episodes</span><span className="opacity-50">•</span><span className="text-success fw-bold">{watched}/{eps.length} watched</span></>
                                    : <span>{activeSeason?.episode_count || 0} Episodes</span>}
                                </div>
                                {timeStr && (
                                  <div className="d-flex align-items-center gap-1 opacity-75 mt-1" style={{ fontSize: '11px' }}>
                                    <Clock size={12} />
                                    <span>{timeStr}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <>
                            <span>{show.year}</span>
                            <span className="opacity-50">•</span>
                            <span>{show.seasons?.length || 0} Seasons</span>
                          </>
                        )}
                      </div>

                      {/* Episode progress */}
                      {selectedSeason === null && show.progress && (
                        <div className="font-mono text-secondary mt-1" style={{ fontSize: '11px' }}>
                          {show.total_episodes || 0} episodes
                        </div>
                      )}

                      {selectedSeason === null && show.progress && (() => {
                        const watched = show.progress?.watched ?? 0;
                        const total = show.progress?.total ?? (show.total_episodes ?? 0);
                        const remaining = Math.max(0, total - watched);
                        const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
                        return (
                          <div className="mt-2">
                            <div style={{ height: '5px', backgroundColor: 'var(--struct-hover)', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                              <div style={{
                                width: `${pct}%`,
                                height: '100%',
                                backgroundColor: pct === 100 ? '#198754' : 'var(--accent-blue)',
                                borderRadius: '3px',
                                transition: 'width 0.5s ease',
                              }} />
                            </div>
                            <div className="d-flex gap-3 font-mono" style={{ fontSize: '10px' }}>
                              <span className="text-success fw-bold">{watched} watched</span>
                              <span className="text-secondary">{remaining} left</span>
                              <span className="text-secondary opacity-75">{pct}%</span>
                            </div>
                          </div>
                        );
                      })()}

                      {selectedSeason === null && show.cast?.length > 0 && (
                        <div className="mt-3">
                          <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>Main Cast</h3>
                          <div className="d-flex flex-column gap-1">
                            {show.cast.slice(0, 3).map((person: any, idx: number) => (
                              <div key={idx} className="d-flex justify-content-between align-items-baseline">
                                <span className="text-body font-mono" style={{ fontSize: '11px' }}>{person.name}</span>
                                <span className="text-secondary font-mono" style={{ fontSize: '10px' }}>{person.role || person.character}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="d-none d-md-flex gap-2 flex-wrap mt-3">
                        {selectedSeason === null ? (
                          <>
                            <Button variant={show.status === 'WATCHED' ? 'success' : 'outline-secondary'} size="sm"
                              className={`d-flex align-items-center gap-2 rounded border-0 ${show.status === 'WATCHED' ? 'text-white' : 'bg-secondary bg-opacity-10'}`}
                              onClick={handleMarkAllSeasonsWatched}>
                              <Check size={13} />
                              <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>
                                {show.status === 'WATCHED' ? 'Watched' : 'Mark all'}
                              </span>
                            </Button>
                            {show.trailer && (
                              <Button variant="outline-primary" size="sm"
                                className="d-flex align-items-center gap-2 rounded border-0 bg-primary bg-opacity-10 shadow-none"
                                onClick={() => window.open(`https://www.youtube.com/watch?v=${show.trailer}`, '_blank')}>
                                <Play size={13} fill="currentColor" />
                                <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Trailer</span>
                              </Button>
                            )}
                            <Button variant="outline-danger" size="sm"
                              className="d-flex align-items-center gap-2 rounded border-0 bg-danger bg-opacity-10"
                              onClick={() => setDeleteTarget(show)}>
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
                        <Button variant={show.status === 'WATCHED' ? 'success' : 'outline-secondary'} size="sm"
                          className={`d-flex align-items-center gap-2 rounded border-0 ${show.status === 'WATCHED' ? 'text-white' : 'bg-secondary bg-opacity-10'}`}
                          onClick={handleMarkAllSeasonsWatched}>
                          <Check size={13} />
                          <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>
                            {show.status === 'WATCHED' ? 'Watched' : 'Mark all'}
                          </span>
                        </Button>
                        {show.trailer && (
                          <Button variant="outline-primary" size="sm"
                            className="d-flex align-items-center gap-2 rounded border-0 bg-primary bg-opacity-10 shadow-none"
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${show.trailer}`, '_blank')}>
                            <Play size={13} fill="currentColor" />
                            <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Trailer</span>
                          </Button>
                        )}
                        <Button variant="outline-danger" size="sm"
                          className="d-flex align-items-center gap-2 rounded border-0 bg-danger bg-opacity-10"
                          onClick={() => setDeleteTarget(show)}>
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

                {/* Seasons / Episodes list */}
                <div className="border-top border-secondary border-opacity-10" style={{ maxHeight: '52vh', overflowY: 'auto' }}>
                  <AnimatePresence mode="wait">
                    {selectedSeason === null ? (
                      <motion.div key="seasons-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }} className="d-flex flex-column">
                        {!show.seasons?.length ? (
                          <div className="text-center py-5 text-secondary font-mono" style={{ fontSize: '13px' }}>No seasons data available.</div>
                        ) : show.seasons.map((season: any) => {
                          const eps = season.episodes || [];
                          const watched = eps.filter((e: any) => e.status === 'WATCHED').length;
                          return (
                            <div key={season.id} className="d-flex flex-row align-items-center gap-3 p-3 border-bottom border-secondary border-opacity-10"
                              style={{ cursor: 'pointer' }} onClick={() => onSeasonClick(season.season_number)}>
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
                                  {(eps.length > 0 || show.status === 'WATCHED') && (
                                    <>
                                      <span className="text-secondary opacity-50" style={{ fontSize: '10px' }}>•</span>
                                      <span className="text-success fw-bold font-mono" style={{ fontSize: '11px' }}>
                                        {eps.length > 0 ? watched : season.episode_count}/{eps.length > 0 ? eps.length : season.episode_count}
                                      </span>
                                    </>
                                  )}
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
                                onSelect={(s, c) => handleEpisodeStatusChange(show.id, (selectedSeason as number), ep.id, s, c)} />
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
  );
};

export default TVShowModal;
