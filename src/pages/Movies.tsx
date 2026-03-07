import React, { useState } from 'react';
import { Container, Dropdown, Button, Modal, Badge } from 'react-bootstrap';
import { ChevronDown, Play, X, Plus } from 'lucide-react';
import { fetchMovieDetails } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { Link } from 'react-router-dom';
import MediaCard from '../components/MediaCard';

export default function Movies() {
  const { movies, updateMovie } = useLibrary();
  const [selectedMovie, setSelectedMovie] = useState<any>(null);

  const handleMovieClick = async (movie: any) => {
    setSelectedMovie(movie);
    if (movie.cast && movie.cast.length > 0 && movie.runtime !== undefined) return;

    const details = await fetchMovieDetails(movie.id);
    if (details) {
      const cast = details.credits?.cast?.slice(0, 5).map((c: any) => ({
        name: c.name,
        role: c.character
      })) || [];

      const trailer = details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;

      const updatedMovie = {
        ...movie,
        summary: details.overview || movie.summary,
        cast,
        runtime: details.runtime || 0,
        trailer
      };
      setSelectedMovie(updatedMovie);
      updateMovie(movie.id, updatedMovie);
    }
  };

  const handleStatusChange = (movieId: number, newStatus: string, newColor: string) => {
    updateMovie(movieId, { status: newStatus, statusColor: newColor });
  };

  const groupedMovies = movies.reduce((acc, movie) => {
    if (!acc[movie.year]) acc[movie.year] = [];
    acc[movie.year].push(movie);
    return acc;
  }, {} as Record<number, any[]>);

  const years = Object.keys(groupedMovies).map(Number).sort((a, b) => b - a);


  return (
    <Container className="py-3 px-4" style={{ maxWidth: '672px' }}>
      <div className="mb-5 d-flex align-items-center justify-content-between">
        <div>
          <h1 className="fs-3 fw-medium font-mono text-body tracking-tight mb-2">Movies</h1>
          <p className="text-secondary font-mono m-0" style={{ fontSize: '13px' }}>{movies.length} entries</p>
        </div>
        <Button as={Link} to="/search" variant="outline-secondary" className="d-flex align-items-center gap-2 border-0 bg-secondary bg-opacity-10 text-body p-2 rounded">
          <Plus size={16} />
        </Button>
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
          <div className="d-flex gap-2 mb-4 overflow-auto hide-scrollbar" style={{ whiteSpace: 'nowrap' }}>
            <Dropdown>
              <Dropdown.Toggle variant="light" className="bg-body border rounded px-3 py-1 font-mono text-secondary hover-bg-light" style={{ fontSize: '12px' }}>
                Status
              </Dropdown.Toggle>
            </Dropdown>
            <Dropdown>
              <Dropdown.Toggle variant="light" className="bg-body border rounded px-3 py-1 font-mono text-secondary hover-bg-light" style={{ fontSize: '12px' }}>
                Genre
              </Dropdown.Toggle>
            </Dropdown>
            <Dropdown>
              <Dropdown.Toggle variant="light" className="bg-body border rounded px-3 py-1 font-mono text-secondary hover-bg-light" style={{ fontSize: '12px' }}>
                Sort
              </Dropdown.Toggle>
            </Dropdown>
          </div>

          {years.map(year => (
            <div key={year} className="mb-5">
              <h2 className="fs-5 fw-medium mb-3 font-mono text-body d-flex align-items-center gap-3">
                {year}
                <div className="flex-grow-1 bg-secondary opacity-25" style={{ height: '1px' }}></div>
              </h2>
              <div className="d-flex flex-column gap-2">
                {groupedMovies[year].map(movie => (
                  <MediaCard
                    key={movie.id}
                    item={movie}
                    type="movie"
                    onClick={() => handleMovieClick(movie)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Notion-style Modal */}
      <Modal
        show={!!selectedMovie}
        onHide={() => setSelectedMovie(null)}
        centered
        dialogClassName="modal-dialog-centered"
        contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
      >
        {selectedMovie && (
          <>
            {selectedMovie.image && (
              <div className="position-relative bg-secondary bg-opacity-10" style={{ height: '200px' }}>
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                  backgroundImage: `url(${selectedMovie.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(20px) opacity(0.5)'
                }} />
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient text-white p-4 d-flex align-items-end bottom-0" style={{
                  background: 'linear-gradient(to top, var(--base-surface) 0%, transparent 100%)'
                }}></div>
              </div>
            )}

            <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 1050 }}>
              <Button variant="light" className="rounded-circle p-1 d-flex align-items-center justify-content-center bg-body bg-opacity-75 backdrop-blur shadow-sm border-0" onClick={() => setSelectedMovie(null)} style={{ width: '32px', height: '32px' }}>
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
                  <h1 className="fs-4 fw-bold font-mono text-body tracking-tight mb-1 text-truncate">
                    {selectedMovie.title}
                  </h1>
                  <div className="d-flex align-items-center gap-2 flex-wrap font-mono text-secondary" style={{ fontSize: '12px' }}>
                    <span>{selectedMovie.year}</span>
                    <span className="opacity-50">•</span>
                    <span>{Math.floor((selectedMovie.runtime || 0) / 60)}h {(selectedMovie.runtime || 0) % 60}m</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Summary</h3>
                <p className="font-mono text-body" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  {selectedMovie.summary || 'No summary available.'}
                </p>
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

              {selectedMovie.trailer ? (
                <Button
                  variant="primary"
                  className="w-100 py-2 d-flex align-items-center justify-content-center gap-2 font-mono fw-medium rounded border-0"
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedMovie.trailer}`, '_blank')}
                  style={{ fontSize: '14px' }}
                >
                  <Play size={16} fill="currentColor" /> Watch Trailer
                </Button>
              ) : (
                <Button
                  variant="light"
                  className="w-100 py-2 d-flex align-items-center justify-content-center gap-2 font-mono fw-medium rounded border text-secondary"
                  disabled
                  style={{ fontSize: '14px' }}
                >
                  No Trailer Available
                </Button>
              )}
            </Modal.Body>
          </>
        )}
      </Modal>
    </Container>
  );
}
