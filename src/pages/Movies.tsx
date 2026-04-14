import React, { useState, useMemo } from 'react';
import { Container, Button } from 'react-bootstrap';
import { Plus, X, Trash2, CheckSquare } from 'lucide-react';
import { fetchMovieDetails } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { Link } from 'react-router-dom';
import MediaCard from '../components/MediaCard';
import MovieDetailModal from '../components/modals/MovieDetailModal';
import ConfirmDeleteModal from '../components/modals/ConfirmDeleteModal';

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

      <div className="mb-4 d-flex align-items-start justify-content-between">
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-baseline gap-1 gap-sm-2">
          <h1 className="fs-5 fw-bold font-mono text-body m-0">Movies</h1>
          <p className="text-secondary font-mono m-0" style={{ fontSize: '12px' }}>
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

      {/* Extracted Modals */}
      <MovieDetailModal
        movie={selectedMovie}
        onHide={() => setSelectedMovie(null)}
        setDeleteTarget={setDeleteTarget}
      />

      <ConfirmDeleteModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onConfirm={() => { removeMovie(deleteTarget.id); setDeleteTarget(null); setSelectedMovie(null); }}
        title="Remove Entry"
        message={deleteTarget && <>Remove <strong className="text-body">{deleteTarget.title}</strong> from your library?</>}
      />

      <ConfirmDeleteModal
        show={bulkDeleteOpen}
        onHide={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Remove ${selectedIds.size} Movies`}
        message={`This will permanently remove ${selectedIds.size} movie${selectedIds.size > 1 ? 's' : ''} from your library.`}
        confirmLabel="Delete All"
      />

    </Container>
  );
}