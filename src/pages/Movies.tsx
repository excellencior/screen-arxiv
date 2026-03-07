import React, { useState } from 'react';
import { Container, Dropdown, Button, Modal, Badge } from 'react-bootstrap';
import { ChevronDown, Play, X, Plus } from 'lucide-react';
import { fetchMovieDetails, getImageUrl } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { Link } from 'react-router-dom';

const STATUS_OPTIONS = [
  { label: 'WATCHED', color: 'success' },
  { label: 'WATCHING', color: 'primary' },
  { label: 'WILL WATCH', color: 'warning' },
  { label: 'ON HOLD', color: 'danger' },
  { label: 'DONE', color: 'secondary' }
];

const MOCK_MOVIE_DATA = [
  {
    id: 1,
    title: 'Dune: Part Three',
    date: 'Dec 18, 2026',
    status: 'WATCHED',
    statusColor: 'success',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBO0xD1Tkc0awIV1iNTg4Kds9v5p-GWWuTRjmlnjSIQkGtOQxTtxdi2HRTMI4RHjtX5C5oBPHt6cUrKWhdsWrEgwL138tXonKM2x31c3QuxSIPGIbQffU_iGs9lpq0Pr4zlfYcLETVdhYNf64i0pvholdluhREL8KzbJUkfxx1lfPjXF8SckGXtSxbwl0ygS-It5dg22tfrfqGcBmKuGPbZI9tFWe4pooMWxOieykvZxPoRwCDTzvDcuQTNSH6qufYt3y5VlhywZu4',
    year: 2026,
    summary: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    cast: [
      { name: 'Timothée Chalamet', role: 'Paul Atreides' },
      { name: 'Zendaya', role: 'Chani' },
      { name: 'Rebecca Ferguson', role: 'Lady Jessica' },
      { name: 'Oscar Isaac', role: 'Duke Leto' },
      { name: 'Denis Villeneuve', role: 'Director' }
    ]
  },
  {
    id: 2,
    title: 'The Batman II',
    date: 'Oct 02, 2026',
    status: 'WATCHING',
    statusColor: 'primary',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRQEWyN98Kf-5V6Zqz9Yxx5S1yJz2JfL_L9db3fxIvaKNYHOG1UZDhh18FSXouNJeyLEKJ4VxVgdJz22sTv3-7euU337992DcQiKSKv5HToT5pv02Gr079eyeN3oO8CGebVTuouTt6lH9h2DwDNXf3WKFTW5fRzbREKVLbDbvWl0_6cKmwdNpEw8YKSFhXm4iOIlU7o1plyXtONpdroNY8KLBUPXBsSKRC92iQAkQ-yjn4uVj3XBMAcmu3g8tHYsqAQX5BewXRjdI',
    year: 2026
  },
  {
    id: 3,
    title: 'Spider-Verse 3',
    date: 'Mar 27, 2026',
    status: 'WILL WATCH',
    statusColor: 'warning',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBO0xD1Tkc0awIV1iNTg4Kds9v5p-GWWuTRjmlnjSIQkGtOQxTtxdi2HRTMI4RHjtX5C5oBPHt6cUrKWhdsWrEgwL138tXonKM2x31c3QuxSIPGIbQffU_iGs9lpq0Pr4zlfYcLETVdhYNf64i0pvholdluhREL8KzbJUkfxx1lfPjXF8SckGXtSxbwl0ygS-It5dg22tfrfqGcBmKuGPbZI9tFWe4pooMWxOieykvZxPoRwCDTzvDcuQTNSH6qufYt3y5VlhywZu4',
    year: 2026
  },
  {
    id: 4,
    title: 'Superman',
    date: 'Jul 11, 2025',
    status: 'WATCHED',
    statusColor: 'success',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRQEWyN98Kf-5V6Zqz9Yxx5S1yJz2JfL_L9db3fxIvaKNYHOG1UZDhh18FSXouNJeyLEKJ4VxVgdJz22sTv3-7euU337992DcQiKSKv5HToT5pv02Gr079eyeN3oO8CGebVTuouTt6lH9h2DwDNXf3WKFTW5fRzbREKVLbDbvWl0_6cKmwdNpEw8YKSFhXm4iOIlU7o1plyXtONpdroNY8KLBUPXBsSKRC92iQAkQ-yjn4uVj3XBMAcmu3g8tHYsqAQX5BewXRjdI',
    year: 2025
  },
  {
    id: 5,
    title: 'GTA: The Movie',
    date: 'Nov 20, 2025',
    status: 'WILL WATCH',
    statusColor: 'warning',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBO0xD1Tkc0awIV1iNTg4Kds9v5p-GWWuTRjmlnjSIQkGtOQxTtxdi2HRTMI4RHjtX5C5oBPHt6cUrKWhdsWrEgwL138tXonKM2x31c3QuxSIPGIbQffU_iGs9lpq0Pr4zlfYcLETVdhYNf64i0pvholdluhREL8KzbJUkfxx1lfPjXF8SckGXtSxbwl0ygS-It5dg22tfrfqGcBmKuGPbZI9tFWe4pooMWxOieykvZxPoRwCDTzvDcuQTNSH6qufYt3y5VlhywZu4',
    year: 2025
  }
];

export default function Movies() {
  const { movies, updateMovie } = useLibrary();
  const [selectedMovie, setSelectedMovie] = useState<any>(null);

  const formatRuntime = (minutes: number) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  };

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
    <Container className="py-4 px-3" style={{ maxWidth: '672px' }}>
      {movies.length === 0 ? (
        <div className="text-center py-5">
          <h2 className="fs-4 fw-bold mb-3 font-mono">Your Library is Empty</h2>
          <p className="text-secondary font-mono mb-4">Search for movies to add them to your archive.</p>
          <Button as={Link} to="/search" variant="primary" className="d-inline-flex align-items-center gap-2 font-mono rounded-pill px-4">
            <Plus size={18} /> Search Movies
          </Button>
        </div>
      ) : (
        <>
          <div className="d-flex gap-2 mb-4 overflow-auto hide-scrollbar" style={{ whiteSpace: 'nowrap' }}>
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" className="bg-body rounded-pill px-3 py-1 font-mono" style={{ fontSize: '14px' }}>
            Status
          </Dropdown.Toggle>
        </Dropdown>
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" className="bg-body rounded-pill px-3 py-1 font-mono" style={{ fontSize: '14px' }}>
            Genre
          </Dropdown.Toggle>
        </Dropdown>
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" className="bg-body rounded-pill px-3 py-1 font-mono" style={{ fontSize: '14px' }}>
            Sort
          </Dropdown.Toggle>
        </Dropdown>
      </div>

      {years.map(year => (
        <div key={year} className="mb-5">
          <h2 className="fs-4 fw-bold mb-3 font-mono">{year}</h2>
          <div className="d-flex flex-column gap-3">
            {groupedMovies[year].map(movie => (
              <div 
                key={movie.id} 
                className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3 cursor-pointer"
              >
                <div 
                  className="flex-shrink-0 rounded overflow-hidden bg-secondary" 
                  style={{ width: '48px', height: '72px', cursor: 'pointer' }}
                  onClick={() => handleMovieClick(movie)}
                >
                  <img src={movie.image} alt={movie.title} className="w-100 h-100 object-fit-cover" />
                </div>
                <div 
                  className="flex-grow-1 min-w-0"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleMovieClick(movie)}
                >
                  <h3 className="fs-6 fw-bold text-truncate mb-1 font-mono">{movie.title}</h3>
                  <div className="d-flex align-items-center gap-2">
                    <p className="text-secondary mb-0 font-mono" style={{ fontSize: '12px' }}>{movie.date}</p>
                    {movie.runtime > 0 && (
                      <>
                        <span className="text-secondary" style={{ fontSize: '10px' }}>•</span>
                        <p className="text-secondary mb-0 font-mono" style={{ fontSize: '12px' }}>{formatRuntime(movie.runtime)}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Dropdown>
                    <Dropdown.Toggle 
                      as={Badge}
                      bg={movie.statusColor} 
                      className={`rounded-pill px-2 py-1 d-flex align-items-center gap-1 font-mono border-0 ${movie.statusColor === 'warning' ? 'text-dark' : ''}`}
                      style={{ fontSize: '10px', letterSpacing: '0.05em', cursor: 'pointer' }}
                    >
                      {movie.status} <ChevronDown size={12} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="font-mono shadow-sm border-0" style={{ fontSize: '12px' }}>
                      {STATUS_OPTIONS.map(option => (
                        <Dropdown.Item 
                          key={option.label}
                          onClick={() => handleStatusChange(movie.id, option.label, option.color)}
                          active={movie.status === option.label}
                        >
                          <Badge bg={option.color} className={`me-2 ${option.color === 'warning' ? 'text-dark' : ''}`}> </Badge>
                          {option.label}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      </>
      )}

      <Modal show={!!selectedMovie} onHide={() => setSelectedMovie(null)} centered dialogClassName="modal-dialog-centered modal-fullscreen-sm-down" contentClassName="border-0 shadow-lg rounded-4">
        {selectedMovie && (
          <>
            <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 1050 }}>
              <Button variant="link" className="text-secondary p-0" onClick={() => setSelectedMovie(null)}>
                <X size={24} />
              </Button>
            </div>
            <Modal.Body className="p-4 p-sm-5">
              <h1 className="fs-5 fw-medium font-mono text-uppercase tracking-tight mb-2">
                {selectedMovie.title}
              </h1>
              <div className="bg-primary mb-4" style={{ height: '2px', width: '48px' }}></div>

              <div className="mb-4">
                <h3 className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Summary</h3>
                <p className="font-mono text-body" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {selectedMovie.summary || 'No summary available.'}
                </p>
              </div>

              <div className="mb-4">
                <h3 className="text-secondary text-uppercase fw-bold mb-3" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Cast & Crew</h3>
                <div className="d-flex flex-column gap-2">
                  {(selectedMovie.cast || []).map((person: any, idx: number) => (
                    <div key={idx} className="d-flex justify-content-between align-items-baseline border-bottom pb-2">
                      <span className="fw-medium text-body" style={{ fontSize: '14px' }}>{person.name}</span>
                      <span className="text-secondary font-mono" style={{ fontSize: '12px', fontStyle: person.role === 'Director' ? 'italic' : 'normal' }}>{person.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedMovie.trailer ? (
                <Button 
                  variant="primary" 
                  className="w-100 py-3 d-flex align-items-center justify-content-center gap-2 font-mono fw-medium rounded-3"
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedMovie.trailer}`, '_blank')}
                >
                  <Play size={16} fill="currentColor" /> Watch Trailer
                </Button>
              ) : (
                <Button 
                  variant="secondary" 
                  className="w-100 py-3 d-flex align-items-center justify-content-center gap-2 font-mono fw-medium rounded-3"
                  disabled
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
