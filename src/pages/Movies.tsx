import React, { useState, useMemo } from 'react';
import { Container, Button, Modal } from 'react-bootstrap';
import { ChevronDown, Play, X, Plus, Trash2, CheckSquare } from 'lucide-react';
import { fetchMovieDetails } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { Link } from 'react-router-dom';
import MediaCard from '../components/MediaCard';

// TMDB genre id → name map (common subset)
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
};

const STATUS_COLORS: Record<string, string> = {
  WATCHED: 'success', WATCHING: 'primary', 'WILL WATCH': 'warning', 'ON HOLD': 'danger',
};

type SortKey = 'year-desc' | 'year-asc' | 'title-asc' | 'title-desc' | 'added-desc' | 'added-asc';

export default function Movies() {
  const { movies, updateMovie, removeMovie } = useLibrary();

  // ── Filters ──────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [genreFilter, setGenreFilter]   = useState<number | null>(null);
  const [sortKey, setSortKey]           = useState<SortKey>('year-desc');

  // Dropdown open states
  const [statusOpen, setStatusOpen] = useState(false);
  const [genreOpen, setGenreOpen]   = useState(false);
  const [sortOpen, setSortOpen]     = useState(false);

  // ── Selection mode ────────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds]     = useState<Set<number>>(new Set());

  // ── Detail / delete modals ────────────────────────────────
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [deleteTarget, setDeleteTarget]   = useState<any>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // ── Derived genre list from library ──────────────────────
  const availableGenres = useMemo(() => {
    const ids = new Set<number>();
    movies.forEach(m => (m.genre_ids || []).forEach((id: number) => ids.add(id)));
    return Array.from(ids)
      .filter(id => GENRE_MAP[id])
      .sort((a, b) => GENRE_MAP[a].localeCompare(GENRE_MAP[b]));
  }, [movies]);

  // ── Filtered + sorted list ────────────────────────────────
  const displayedMovies = useMemo(() => {
    let list = [...movies];
    if (statusFilter) list = list.filter(m => m.status === statusFilter);
    if (genreFilter)  list = list.filter(m => (m.genre_ids || []).includes(genreFilter));
    switch (sortKey) {
      case 'year-desc':  list.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
      case 'year-asc':   list.sort((a, b) => (a.year || 0) - (b.year || 0)); break;
      case 'title-asc':  list.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
      case 'title-desc': list.sort((a, b) => (b.title || '').localeCompare(a.title || '')); break;
      case 'added-desc': list.sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime()); break;
      case 'added-asc':  list.sort((a, b) => new Date(a.addedAt || 0).getTime() - new Date(b.addedAt || 0).getTime()); break;
    }
    return list;
  }, [movies, statusFilter, genreFilter, sortKey]);

  // Group by year only when sorting by year
  const isYearGrouped = sortKey === 'year-desc' || sortKey === 'year-asc';
  const groupedByYear = useMemo(() => {
    if (!isYearGrouped) return null;
    const map: Record<number, any[]> = {};
    displayedMovies.forEach(m => {
      if (!map[m.year]) map[m.year] = [];
      map[m.year].push(m);
    });
    const years = Object.keys(map).map(Number).sort((a, b) =>
      sortKey === 'year-desc' ? b - a : a - b
    );
    return { map, years };
  }, [displayedMovies, isYearGrouped, sortKey]);

  // ── Handlers ──────────────────────────────────────────────
  const handleMovieClick = async (movie: any) => {
    if (selectionMode) return;
    setSelectedMovie(movie);
    if (movie.cast && movie.cast.length > 0 && movie.runtime !== undefined) return;
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
    selectedIds.forEach(id => removeMovie(id));
    exitSelectionMode();
    setBulkDeleteOpen(false);
  };

  // ── Dropdown helper ───────────────────────────────────────
  const FilterDropdown = ({
    label, open, setOpen, children,
  }: { label: string; open: boolean; setOpen: (v: boolean) => void; children: React.ReactNode }) => (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(!open); setStatusOpen(false); setGenreOpen(false); setSortOpen(false); }}
        className="bg-body border rounded px-3 py-1 font-mono text-secondary d-inline-flex align-items-center gap-1"
        style={{ fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        {label} <ChevronDown size={11} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 1060,
            backgroundColor: 'var(--bs-body-bg)', borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '150px',
            padding: '4px 0', overflow: 'hidden',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );

  const DropdownItem = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="d-flex align-items-center gap-2 w-100 border-0 text-start font-mono"
      style={{
        padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
        background: active ? 'rgba(0,0,0,0.06)' : 'transparent',
        fontWeight: active ? 700 : 400, color: 'var(--bs-body-color)',
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = active ? 'rgba(0,0,0,0.06)' : 'transparent')}
    >
      {children}
    </button>
  );

  // Close dropdowns on outside click
  React.useEffect(() => {
    if (!statusOpen && !genreOpen && !sortOpen) return;
    const handler = () => { setStatusOpen(false); setGenreOpen(false); setSortOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusOpen, genreOpen, sortOpen]);

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

      {/* Header */}
      <div className="mb-5 d-flex align-items-center justify-content-between">
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
              <button
                onClick={() => setSelectionMode(true)}
                className="border-0 bg-secondary bg-opacity-10 text-body p-2 rounded d-flex align-items-center"
                title="Select items"
                style={{ cursor: 'pointer' }}
              >
                <CheckSquare size={16} />
              </button>
              <Button as={Link} to="/search" variant="outline-secondary" className="d-flex align-items-center gap-2 border-0 bg-secondary bg-opacity-10 text-body p-2 rounded">
                <Plus size={16} />
              </Button>
            </>
          ) : (
            <>
              <span className="font-mono text-secondary me-1" style={{ fontSize: '12px' }}>
                {selectedIds.size} selected
              </span>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setBulkDeleteOpen(true)}
                  className="border-0 bg-danger bg-opacity-10 text-danger p-2 rounded d-flex align-items-center gap-1 font-mono"
                  style={{ cursor: 'pointer', fontSize: '12px' }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
              <button
                onClick={exitSelectionMode}
                className="border-0 bg-secondary bg-opacity-10 text-body p-2 rounded d-flex align-items-center"
                style={{ cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </>
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
          {/* Filter bar */}
          <div className="d-flex gap-2 mb-4 overflow-auto hide-scrollbar" style={{ whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>

            <FilterDropdown
              label={statusFilter ?? 'Status'}
              open={statusOpen}
              setOpen={v => { setStatusOpen(v); if (v) { setGenreOpen(false); setSortOpen(false); } }}
            >
              <DropdownItem active={statusFilter === null} onClick={() => { setStatusFilter(null); setStatusOpen(false); }}>All</DropdownItem>
              {Object.keys(STATUS_COLORS).map(s => (
                <DropdownItem key={s} active={statusFilter === s} onClick={() => { setStatusFilter(s); setStatusOpen(false); }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: `var(--accent-${STATUS_COLORS[s]})`, display: 'inline-block' }} />
                  {s}
                </DropdownItem>
              ))}
            </FilterDropdown>

            <FilterDropdown
              label={genreFilter ? GENRE_MAP[genreFilter] : 'Genre'}
              open={genreOpen}
              setOpen={v => { setGenreOpen(v); if (v) { setStatusOpen(false); setSortOpen(false); } }}
            >
              <DropdownItem active={genreFilter === null} onClick={() => { setGenreFilter(null); setGenreOpen(false); }}>All</DropdownItem>
              {availableGenres.map(id => (
                <DropdownItem key={id} active={genreFilter === id} onClick={() => { setGenreFilter(id); setGenreOpen(false); }}>
                  {GENRE_MAP[id]}
                </DropdownItem>
              ))}
            </FilterDropdown>

            <FilterDropdown
              label={{
                'year-desc': 'Year ↓', 'year-asc': 'Year ↑',
                'title-asc': 'Title A–Z', 'title-desc': 'Title Z–A',
                'added-desc': 'Newest', 'added-asc': 'Oldest',
              }[sortKey]}
              open={sortOpen}
              setOpen={v => { setSortOpen(v); if (v) { setStatusOpen(false); setGenreOpen(false); } }}
            >
              {(['year-desc', 'year-asc', 'title-asc', 'title-desc', 'added-desc', 'added-asc'] as SortKey[]).map(k => (
                <DropdownItem key={k} active={sortKey === k} onClick={() => { setSortKey(k); setSortOpen(false); }}>
                  {{ 'year-desc': 'Year ↓', 'year-asc': 'Year ↑', 'title-asc': 'Title A–Z', 'title-desc': 'Title Z–A', 'added-desc': 'Newest added', 'added-asc': 'Oldest added' }[k]}
                </DropdownItem>
              ))}
            </FilterDropdown>

            {(statusFilter || genreFilter) && (
              <button
                onClick={() => { setStatusFilter(null); setGenreFilter(null); }}
                className="border-0 bg-danger bg-opacity-10 text-danger rounded px-2 py-1 font-mono d-flex align-items-center gap-1"
                style={{ fontSize: '11px', cursor: 'pointer' }}
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>

          {displayedMovies.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-secondary font-mono" style={{ fontSize: '13px' }}>No movies match the current filters.</p>
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
            <div className="d-flex flex-column gap-2">{renderCards(displayedMovies)}</div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal show={!!selectedMovie} onHide={() => setSelectedMovie(null)} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden">
        {selectedMovie && (
          <>
            {selectedMovie.image && (
              <div className="position-relative bg-secondary bg-opacity-10" style={{ height: '200px' }}>
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                  backgroundImage: `url(${selectedMovie.image})`, backgroundSize: 'cover',
                  backgroundPosition: 'center', filter: 'blur(20px) opacity(0.5)',
                }} />
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                  background: 'linear-gradient(to top, var(--base-surface) 0%, transparent 100%)',
                }} />
              </div>
            )}
            <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 1050 }}>
              <Button variant="light" className="rounded-circle p-1 d-flex align-items-center justify-content-center bg-body bg-opacity-75 shadow-sm border-0"
                onClick={() => setSelectedMovie(null)} style={{ width: '32px', height: '32px' }}>
                <X size={18} className="text-body" />
              </Button>
            </div>
            <Modal.Body className="p-4 p-sm-5 pt-0 position-relative" style={{ marginTop: selectedMovie.image ? '-60px' : '0' }}>
              <div className="d-flex gap-4 mb-4 mt-4">
                {selectedMovie.image && (
                  <div className="flex-shrink-0 shadow-sm rounded overflow-hidden" style={{ width: '80px', height: '120px' }}>
                    <img src={selectedMovie.image} alt={selectedMovie.title} className="w-100 h-100 object-fit-cover" />
                  </div>
                )}
                <div className="d-flex flex-column justify-content-end pb-1 min-w-0">
                  <h1 className="fs-4 fw-bold font-mono text-body tracking-tight mb-1">
                    {selectedMovie.title}
                  </h1>
                  <div className="d-flex align-items-center gap-2 flex-wrap font-mono text-secondary" style={{ fontSize: '12px' }}>
                    <span>{selectedMovie.year}</span>
                    <span className="opacity-50">•</span>
                    <span>{Math.floor((selectedMovie.runtime || 0) / 60)}h {(selectedMovie.runtime || 0) % 60}m</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-bottom border-secondary border-opacity-10 bg-body d-flex gap-2 flex-wrap">
                {selectedMovie.trailer && (
                  <Button variant="outline-primary" size="sm"
                    className="d-flex align-items-center gap-2 rounded border-0 bg-primary bg-opacity-10"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedMovie.trailer}`, '_blank')}>
                    <Play size={14} fill="currentColor" />
                    <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Trailer</span>
                  </Button>
                )}
                <Button variant="outline-danger" size="sm"
                  className="d-flex align-items-center gap-2 rounded border-0 bg-danger bg-opacity-10"
                  onClick={() => { setSelectedMovie(null); setDeleteTarget(selectedMovie); }}>
                  <Trash2 size={14} />
                  <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Remove</span>
                </Button>
              </div>
              <div className="p-4 bg-body">
                <div className="mb-4">
                  <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Summary</h3>
                  <p className="font-mono text-body" style={{ fontSize: '13px', lineHeight: '1.6' }}>{selectedMovie.summary || 'No summary available.'}</p>
                </div>
                <div className="mb-4">
                  <h3 className="text-secondary text-uppercase fw-bold mb-3 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Cast & Crew</h3>
                  <div className="d-flex flex-column gap-2">
                    {(selectedMovie.cast || []).map((person: any, idx: number) => (
                      <div key={idx} className="d-flex justify-content-between align-items-baseline border-bottom border-secondary border-opacity-10 pb-2">
                        <span className="fw-medium text-body font-mono" style={{ fontSize: '12px' }}>{person.name}</span>
                        <span className="text-secondary font-mono" style={{ fontSize: '11px', fontStyle: person.role === 'Director' ? 'italic' : 'normal' }}>{person.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>

      {/* Single delete confirm */}
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
              Remove <strong className="text-body">{deleteTarget.title}</strong> from your library?
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <Button variant="light" className="px-4 py-2 font-mono fw-medium rounded border-0 bg-secondary bg-opacity-10 text-body"
                onClick={() => setDeleteTarget(null)} style={{ fontSize: '13px' }}>Cancel</Button>
              <Button variant="danger" className="px-4 py-2 font-mono fw-medium rounded border-0"
                onClick={() => { removeMovie(deleteTarget.id); setDeleteTarget(null); }} style={{ fontSize: '13px' }}>Delete</Button>
            </div>
          </Modal.Body>
        )}
      </Modal>

      {/* Bulk delete confirm */}
      <Modal show={bulkDeleteOpen} onHide={() => setBulkDeleteOpen(false)} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden">
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