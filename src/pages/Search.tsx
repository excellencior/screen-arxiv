import React, { useState, useEffect } from 'react';
import { Container, Form, Badge, Button, Alert, Modal } from 'react-bootstrap';
import { Search as SearchIcon, X, Play } from 'lucide-react';
import { searchMulti, fetchMovieDetails, fetchTVDetails } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';
import MediaCard from '../components/MediaCard';
import toast from 'react-hot-toast';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { addMovie, addShow, movies, shows, updateMovie, updateShow } = useLibrary();

  useEffect(() => {
    if (!import.meta.env.VITE_TMDB_API_KEY || import.meta.env.VITE_TMDB_API_KEY === 'your_tmdb_api_key_here') {
      setIsDemoMode(true);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    if (isDemoMode) {
      setTimeout(() => {
        setResults([
          {
            id: 101,
            title: 'Inception',
            date: '2010',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRQEWyN98Kf-5V6Zqz9Yxx5S1yJz2JfL_L9db3fxIvaKNYHOG1UZDhh18FSXouNJeyLEKJ4VxVgdJz22sTv3-7euU337992DcQiKSKv5HToT5pv02Gr079eyeN3oO8CGebVTuouTt6lH9h2DwDNXf3WKFTW5fRzbREKVLbDbvWl0_6cKmwdNpEw8YKSFhXm4iOIlU7o1plyXtONpdroNY8KLBUPXBsSKRC92iQAkQ-yjn4uVj3XBMAcmu3g8tHYsqAQX5BewXRjdI',
            media_type: 'movie',
            summary: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
          },
          {
            id: 102,
            title: 'Stranger Things',
            date: '2016',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALFPQFUonhpmFbZY0fLqCDYQOduUwN6ZQZFEwHNAaNAPx167JO90Um81Qjqp99ojNIOLp8jz45zbcQpLHxU5xo8Kuxe_3cUHOXOzBt1V-mWABJBa-8qD5KdvEehI2Rv558Gajp7BuL1ZQ1JnyV_frZiOQBvqYz42Do663FRIB2Og86pb5gjq3Z9QK6AMPW6ezzue604dTAOll29ZsJXPf304BZuh0vStZr0mQtjb_Pw0fUeRiR2ANTX83xjQaTHbL7KmyEiXi1bOo',
            media_type: 'tv',
            summary: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
          }
        ]);
        setLoading(false);
      }, 500);
    } else {
      const data = await searchMulti(query);
      setResults(data);
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  const handleItemClick = async (item: any) => {
    setSelectedItem(item);
    if (isDemoMode) return;

    if (item.media_type === 'movie') {
      const details = await fetchMovieDetails(item.id);
      if (details) {
        setSelectedItem({
          ...item,
          summary: details.overview || item.summary,
          cast: details.credits?.cast?.slice(0, 5).map((c: any) => ({ name: c.name, role: c.character })) || [],
          runtime: details.runtime || 0,
          trailer: details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null,
        });
      }
    } else if (item.media_type === 'tv') {
      const details = await fetchTVDetails(item.id);
      if (details) {
        setSelectedItem({
          ...item,
          summary: details.overview || item.summary,
          trailer: details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null,
          number_of_seasons: details.number_of_seasons || details.seasons?.length,
        });
      }
    }
  };

  const handleAdd = (item: any, status: string, color: string) => {
    const isMovie = item.media_type === 'movie';
    const existingItem = isMovie
      ? movies.find(m => m.id === item.id)
      : shows.find(s => s.id === item.id);

    if (existingItem) {
      if (isMovie) {
        updateMovie(item.id, { status, statusColor: color });
      } else {
        updateShow(item.id, { status, statusColor: color });
      }
      toast.success(`${item.title || item.name} updated to ${status}`, {
        icon: '✓',
        style: { border: `1px solid var(--bs-${color})` }
      });
      return;
    }

    const newItem = {
      id: item.id,
      title: item.title || item.name,
      date: item.date || item.release_date || item.first_air_date,
      year: item.date
        ? parseInt(item.date.split(',').pop()?.trim() || item.date)
        : (item.release_date
          ? parseInt(item.release_date.split('-')[0])
          : (item.first_air_date
            ? parseInt(item.first_air_date.split('-')[0])
            : new Date().getFullYear())),
      status,
      statusColor: color,
      image: item.image || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null),
      summary: item.summary || item.overview,
      media_type: item.media_type,
      genre_ids: item.genre_ids || [],
      ...(isMovie ? {} : { progress: { watched: 0, total: 10 }, season: 'Season 1', episodes: [] })
    };

    if (isMovie) {
      addMovie(newItem);
      // Background fetch to get runtime for analytics
      fetchMovieDetails(item.id).then(details => {
        if (details) {
          updateMovie(item.id, {
            runtime: details.runtime || 0,
            cast: details.credits?.cast?.slice(0, 5) || [],
            trailer: details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null,
          });
        }
      });
    } else {
      addShow(newItem);
      // Background fetch to get runtime/seasons for analytics
      fetchTVDetails(item.id).then(details => {
        if (details) {
          const episodeRuntime = details.episode_run_time?.[0] || details.last_episode_to_air?.runtime || 0;
          const totalEpisodes = details.number_of_episodes || 0;
          const seasons = details.seasons?.filter((s: any) => s.season_number > 0) || [];
          updateShow(item.id, {
            runtime: episodeRuntime * totalEpisodes,
            episode_runtime: episodeRuntime,
            total_episodes: totalEpisodes,
            seasons,
            trailer: details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null,
          });
        }
      });
    }

    toast.success(`${newItem.title} marked as ${status}`, {
      icon: '✓',
      style: { border: `1px solid var(--bs-${color})` }
    });
  };

  const filteredResults = results.filter(item => {
    if (filter === 'all') return true;
    return item.media_type === filter;
  });

  return (
    <Container className="py-3 px-4" style={{ maxWidth: '672px' }}>
      <div className="mb-4 d-flex align-items-baseline gap-2">
        <h1 className="fs-5 fw-bold font-mono text-body m-0">Search</h1>
        <p className="text-secondary font-mono m-0" style={{ fontSize: '12px' }}>Find movies and TV series.</p>
      </div>

      {isDemoMode && (
        <Alert variant="info" className="font-mono mb-4 border-0 bg-info bg-opacity-10 text-body rounded" style={{ fontSize: '12px' }}>
          <strong>Demo Mode Active:</strong> TMDB API key is missing. Using local mock data. Try searching for any term to see sample results.
        </Alert>
      )}

      <Form onSubmit={handleSearch} className="mb-4">
        <div className="position-relative">
          <div className="position-absolute top-50 start-0 translate-middle-y ps-3 text-secondary pointer-events-none">
            <SearchIcon size={18} />
          </div>
          <Form.Control
            type="text"
            placeholder="Search by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-3 border font-mono ps-5 py-2 pe-5 bg-body text-body shadow-sm"
            style={{ fontSize: '14px' }}
            autoFocus
          />
          {query && (
            <Button
              variant="link"
              className="position-absolute top-50 end-0 translate-middle-y pe-3 text-secondary p-0"
              onClick={handleClear}
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </Form>

      {results.length > 0 && (
        <div className="d-flex gap-2 mb-4">
          {(['all', 'movie', 'tv'] as const).map(f => (
            <Button
              key={f}
              variant="light"
              size="sm"
              onClick={() => setFilter(f)}
              className={`rounded font-mono px-3 py-1 border ${filter === f ? 'bg-body border-secondary border-opacity-25 shadow-sm' : 'bg-secondary bg-opacity-10 text-secondary border-transparent'}`}
              style={{ fontSize: '12px' }}
            >
              {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV Series'}
            </Button>
          ))}
        </div>
      )}

      {/* KEY FIX: no position-relative wrapper, use isolation instead to avoid clipping the dropdown */}
      <div className="d-flex flex-column gap-2 pb-5">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-secondary opacity-50 mb-3" role="status" style={{ width: '1.5rem', height: '1.5rem' }}></div>
            <p className="text-secondary font-mono" style={{ fontSize: '13px' }}>Searching...</p>
          </div>
        ) : filteredResults.length > 0 ? (
          filteredResults.map((item) => {
            const isMovie = item.media_type === 'movie';
            const libraryItem = isMovie
              ? movies.find(m => m.id === item.id)
              : shows.find(s => s.id === item.id);

            const displayItem = libraryItem
              ? { ...item, status: libraryItem.status, statusColor: libraryItem.statusColor }
              : item;

            return (
              <MediaCard
                key={item.id}
                item={displayItem}
                type="search"
                onAdd={handleAdd}
                onClick={() => handleItemClick(item)}
              />
            );
          })
        ) : query && !loading ? (
          <div className="text-center py-5">
            <p className="text-secondary font-mono" style={{ fontSize: '13px' }}>No results found for "{query}".</p>
          </div>
        ) : null}
      </div>

      <Modal
        show={!!selectedItem}
        onHide={() => setSelectedItem(null)}
        centered
        contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
      >
        {selectedItem && (
          <>
            {selectedItem.image && (
              <div className="position-relative bg-secondary bg-opacity-10" style={{ height: '200px' }}>
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                  backgroundImage: `url(${selectedItem.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(20px) opacity(0.5)'
                }} />
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                  background: 'linear-gradient(to top, var(--base-surface) 0%, transparent 100%)'
                }} />
              </div>
            )}

            <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 1050 }}>
              <Button
                variant="light"
                className="rounded-circle p-1 d-flex align-items-center justify-content-center bg-body bg-opacity-75 shadow-sm border-0"
                onClick={() => setSelectedItem(null)}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} className="text-body" />
              </Button>
            </div>

            <Modal.Body className="p-4 p-sm-5 pt-0 position-relative" style={{ marginTop: selectedItem.image ? '-60px' : '0' }}>
              <div className="d-flex gap-4 mb-4 mt-4">
                {selectedItem.image && (
                  <div className="flex-shrink-0 shadow-sm rounded overflow-hidden" style={{ width: '80px', height: '120px' }}>
                    <img src={selectedItem.image} alt={selectedItem.title || selectedItem.name} className="w-100 h-100 object-fit-cover" />
                  </div>
                )}
                <div className="d-flex flex-column justify-content-end pb-1 min-w-0">
                  <h1 className="fs-4 fw-bold font-mono text-body tracking-tight mb-1">
                    {selectedItem.title || selectedItem.name}
                  </h1>
                  <div className="d-flex align-items-center gap-2 flex-wrap font-mono text-secondary" style={{ fontSize: '12px' }}>
                    {selectedItem.media_type && (
                      <Badge bg="secondary" className="bg-opacity-10 text-secondary border-0 font-mono px-2 me-1" style={{ fontSize: '10px' }}>
                        {selectedItem.media_type.toUpperCase()}
                      </Badge>
                    )}
                    <span>{selectedItem.date || selectedItem.year || (selectedItem.release_date ? selectedItem.release_date.split('-')[0] : selectedItem.first_air_date ? selectedItem.first_air_date.split('-')[0] : 'N/A')}</span>
                    {selectedItem.runtime > 0 && (
                      <>
                        <span className="opacity-50">•</span>
                        <span>{Math.floor(selectedItem.runtime / 60)}h {selectedItem.runtime % 60}m</span>
                      </>
                    )}
                    {selectedItem.number_of_seasons > 0 && (
                      <>
                        <span className="opacity-50">•</span>
                        <span>{selectedItem.number_of_seasons} Season{selectedItem.number_of_seasons > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Summary</h3>
                <p className="font-mono text-body" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  {selectedItem.summary || selectedItem.overview || 'No summary available.'}
                </p>
              </div>

              {selectedItem.cast && selectedItem.cast.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-secondary text-uppercase fw-bold mb-3 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Cast</h3>
                  <div className="d-flex flex-column gap-2">
                    {selectedItem.cast.map((person: any, idx: number) => (
                      <div key={idx} className="d-flex justify-content-between align-items-baseline border-bottom border-secondary border-opacity-10 pb-2">
                        <span className="fw-medium text-body font-mono" style={{ fontSize: '12px' }}>{person.name}</span>
                        <span className="text-secondary font-mono" style={{ fontSize: '11px' }}>{person.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.trailer && (
                <Button
                  variant="primary"
                  className="w-100 py-2 d-flex align-items-center justify-content-center gap-2 font-mono fw-medium rounded border-0"
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedItem.trailer}`, '_blank')}
                  style={{ fontSize: '14px' }}
                >
                  <Play size={16} fill="currentColor" /> Watch Trailer
                </Button>
              )}
            </Modal.Body>
          </>
        )}
      </Modal>
    </Container>
  );
}