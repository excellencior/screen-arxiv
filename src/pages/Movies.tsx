import React, { useState, useMemo } from 'react';
import { Container, Button, Modal } from 'react-bootstrap';
import { Play, X, Plus, Trash2, CheckSquare } from 'lucide-react';
import { fetchMovieDetails } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MediaCard from '../components/MediaCard';

const STATUS_COLORS: Record<string, string> = {
  WATCHED: 'success', WATCHING: 'primary', 'WILL WATCH': 'warning', 'ON HOLD': 'danger',
};

type SortKey = 'year-desc' | 'year-asc' | 'title-asc' | 'title-desc' | 'added-desc' | 'added-asc';

export default function Movies() {
  const { movies, updateMovie, removeMovie } = useLibrary();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const displayedMovies = useMemo(() => {
    let list = [...movies];
    list.sort((a, b) => (b.year || 0) - (a.year || 0));
    return list;
  }, [movies]);

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
    setSelectedMovie(movie);
    if (movie.cast && movie.cast.length > 0 && movie.cast[0].role && movie.runtime !== undefined) return;
    const details = await fetchMovieDetails(movie.id);
    if (details) {
      const cast = details.credits?.cast?.slice(0, 5).map((c: any) => ({ name: c.name, role: c.character })) || [];
      const trailer = details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
      const updated = { ...movie, summary: details.overview || movie.summary, cast, runtime: details.runtime || 0, trailer };
      setSelectedMovie(updated);
      updateMovie(movie.id, updated);
    }
  };

  const handleStatusChange = (movieId: number, newStatus: string, newColor: string) => {
    updateMovie(movieId, { status: newStatus, statusColor: newColor });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const exitSelectionMode = () => { setSelectionMode(false); setSelectedIds(new Set()); };
  const handleBulkDelete = () => { selectedIds.forEach(id => removeMovie(id)); exitSelectionMode(); setBulkDeleteOpen(false); };

  const renderCards = (list: any[]) =>
    list.map(movie => (
      <MediaCard
        key={movie.id}
        item={movie}
        type="movie"
        onClick={() => handleMovieClick(movie)}
        onStatusChange={handleStatusChange}
        onDelete={() => setDeleteTarget(movie)}
        selectionMode={selectionMode}
        isSelected={selectedIds.has(movie.id)}
        onSelect={toggleSelect}
      />
    ));

  return (
    <Container className="py-3 px-4" style={{ maxWidth: '672px' }}>

      <div className="mb-3 d-flex align-items-center justify-content-between">
        <div>
          <h1 className="fs-3 fw-medium font-mono text-body tracking-tight mb-2">Movies</h1>
          <p className="text-secondary font-mono m-0" style={{ fontSize: '13px' }}>
            {displayedMovies.length !== movies.length
              ? `${displayedMovies.length} of ${movies.length} entries`
              : `${movies.length} entries`}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {!selectionMode ? (
            <>
              {movies.length > 0 && (
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

      {movies.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-secondary font-mono mb-4">Your movie archive is empty.</p>
          <Button as={Link} to="/search" variant="primary" className="d-inline-flex align-items-center gap-2 font-mono rounded px-4">
            <Plus size={16} /> Add Movies
          </Button>
        </div>
      ) : (
        <>
          {displayedMovies.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-secondary font-mono" style={{ fontSize: '13px' }}>No movies available.</p>
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
        </>
      )}

      {/* ── Detail Modal ── */}
      <Modal show={!!selectedMovie} onHide={() => setSelectedMovie(null)} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden" animation={false}>
        <AnimatePresence>
          {selectedMovie && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 12 }}>
              <button
                onClick={() => setSelectedMovie(null)}
                className="border-0 bg-secondary bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                style={{ width: '30px', height: '30px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
              >
                <X size={16} className="text-body" />
              </button>
            </div>
            
            <div className="scrollbar-hide" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            
            <Modal.Body className="p-0">
              {/* ── Header ── */}
              <div className="p-4 pb-3">
                <div className="d-flex gap-3 align-items-start">
                  {selectedMovie.image && (
                    <div className="flex-shrink-0 shadow-sm rounded overflow-hidden" style={{ width: '72px', height: '108px' }}>
                      <img src={selectedMovie.image} alt={selectedMovie.title} className="w-100 h-100 object-fit-cover" />
                    </div>
                  )}

                  <div className="flex-grow-1 min-w-0 pt-1">
                    <h1 className="fs-5 fw-bold font-mono text-body mb-1" style={{ letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                      {selectedMovie.title}
                    </h1>
                    <div className="d-flex align-items-center gap-2 flex-wrap font-mono text-secondary" style={{ fontSize: '12px' }}>
                      <span>{selectedMovie.year}</span>
                      {selectedMovie.runtime > 0 && (
                        <>
                          <span className="opacity-50">•</span>
                          <span>{Math.floor(selectedMovie.runtime / 60)}h {selectedMovie.runtime % 60}m</span>
                        </>
                      )}
                    </div>

                    {/* Buttons: md+ */}
                    <div className="d-none d-md-flex gap-2 flex-wrap mt-3">
                      {selectedMovie.trailer && (
                        <Button variant="outline-primary" size="sm"
                          className="d-flex align-items-center gap-2 rounded border-0 bg-primary bg-opacity-10"
                          onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedMovie.trailer}`, '_blank')}>
                          <Play size={13} fill="currentColor" />
                          <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Trailer</span>
                        </Button>
                      )}
                      <Button variant="outline-danger" size="sm"
                        className="d-flex align-items-center gap-2 rounded border-0 bg-danger bg-opacity-10"
                        onClick={() => { setDeleteTarget(selectedMovie); }}>
                        <Trash2 size={13} />
                        <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Remove</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Buttons: small only */}
                <div className="d-flex d-md-none gap-2 flex-wrap mt-3">
                  {selectedMovie.trailer && (
                    <Button variant="outline-primary" size="sm"
                      className="d-flex align-items-center gap-2 rounded border-0 bg-primary bg-opacity-10"
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedMovie.trailer}`, '_blank')}>
                      <Play size={13} fill="currentColor" />
                      <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Trailer</span>
                    </Button>
                  )}
                  <Button variant="outline-danger" size="sm"
                    className="d-flex align-items-center gap-2 rounded border-0 bg-danger bg-opacity-10"
                    onClick={() => { setDeleteTarget(selectedMovie); }}>
                    <Trash2 size={13} />
                    <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Remove</span>
                  </Button>
                </div>
              </div>

              <div className="px-4 pb-4 d-flex flex-column gap-4">
                {selectedMovie.summary && (
                  <div>
                    <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Summary</h3>
                    <p className="font-mono text-body m-0" style={{ fontSize: '13px', lineHeight: '1.6' }}>{selectedMovie.summary}</p>
                  </div>
                )}
                {selectedMovie.cast?.length > 0 && (
                  <div>
                    <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Cast & Crew</h3>
                    <div className="d-flex flex-column gap-2">
                      {selectedMovie.cast.map((person: any, idx: number) => (
                        <div key={idx} className="d-flex justify-content-between align-items-baseline border-bottom border-secondary border-opacity-10 pb-2">
                          <span className="fw-medium text-body font-mono" style={{ fontSize: '12px' }}>{person.name}</span>
                          <span className="text-secondary font-mono" style={{ fontSize: '11px' }}>{person.role || person.character}</span>
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
      <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden" size="sm">
        {deleteTarget && (
          <Modal.Body className="p-4 p-sm-5 text-center">
            <div className="mb-3">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10" style={{ width: '48px', height: '48px' }}>
                <Trash2 size={22} className="text-danger" />
              </div>
            </div>
            <h5 className="fw-bold font-mono text-body mb-2">Remove Entry</h5>
            <p className="text-secondary font-mono mb-4" style={{ fontSize: '13px' }}>
              Remove <strong className="text-body">{deleteTarget.title}</strong> from your library?
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <Button variant="light" className="px-4 py-2 font-mono fw-medium rounded border-0 bg-secondary bg-opacity-10 text-body"
                onClick={() => setDeleteTarget(null)} style={{ fontSize: '13px' }}>Cancel</Button>
              <Button variant="danger" className="px-4 py-2 font-mono fw-medium rounded border-0"
                onClick={() => { removeMovie(deleteTarget.id); setDeleteTarget(null); setSelectedMovie(null); }} style={{ fontSize: '13px' }}>Delete</Button>
            </div>
          </Modal.Body>
        )}
      </Modal>

      {/* Bulk delete */}
      <Modal show={bulkDeleteOpen} onHide={() => setBulkDeleteOpen(false)} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden" size="sm">
        <Modal.Body className="p-4 p-sm-5 text-center">
          <div className="mb-3">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10" style={{ width: '48px', height: '48px' }}>
              <Trash2 size={22} className="text-danger" />
            </div>
          </div>
          <h5 className="fw-bold font-mono text-body mb-2">Remove {selectedIds.size} Movies</h5>
          <p className="text-secondary font-mono mb-4" style={{ fontSize: '13px' }}>
            This will permanently remove {selectedIds.size} movie{selectedIds.size > 1 ? 's' : ''} from your library.
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