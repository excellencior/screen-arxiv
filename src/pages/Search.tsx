import React, { useState, useEffect } from 'react';
import { Container, Form, InputGroup, Button, Badge } from 'react-bootstrap';
import { Search as SearchIcon, Plus, Check } from 'lucide-react';
import { searchMulti, getImageUrl, fetchMovieDetails, fetchTVDetails } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { movies, shows, addMovie, addShow } = useLibrary();
  
  const isMockMode = !import.meta.env.VITE_TMDB_API_KEY || import.meta.env.VITE_TMDB_API_KEY === 'YOUR_TMDB_API_KEY';

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 2) {
        setLoading(true);
        setError(null);
        try {
          const data = await searchMulti(query);
          setResults(data || []);
        } catch (err: any) {
          setResults([]);
          setError(err.message || 'An error occurred while searching.');
        }
        setLoading(false);
      } else {
        setResults([]);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleAdd = async (item: any) => {
    if (item.media_type === 'movie') {
      const details = await fetchMovieDetails(item.id);
      const trailer = details?.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
      addMovie({
        id: item.id,
        title: item.title,
        date: item.release_date ? new Date(item.release_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBA',
        status: 'WILL WATCH',
        statusColor: 'warning',
        image: getImageUrl(item.poster_path),
        year: item.release_date ? new Date(item.release_date).getFullYear() : new Date().getFullYear(),
        summary: item.overview,
        cast: [],
        runtime: details?.runtime || 0,
        trailer
      });
    } else if (item.media_type === 'tv') {
      const details = await fetchTVDetails(item.id);
      const trailer = details?.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
      const episodeRuntime = details?.episode_run_time?.[0] || 0;
      const totalEpisodes = details?.number_of_episodes || 0;
      addShow({
        id: item.id,
        title: item.name,
        season: 'Season 1',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : new Date().getFullYear(),
        status: 'WILL WATCH',
        statusColor: 'warning',
        progress: { watched: 0, total: totalEpisodes || 10 },
        image: getImageUrl(item.poster_path),
        episodes: [],
        runtime: episodeRuntime * totalEpisodes,
        trailer
      });
    }
  };

  const isAdded = (item: any) => {
    if (item.media_type === 'movie') {
      return movies.some(m => m.id === item.id);
    } else {
      return shows.some(s => s.id === item.id);
    }
  };

  return (
    <Container className="py-4 px-3" style={{ maxWidth: '672px' }}>
      <div className="mb-4">
        <InputGroup className="shadow-sm rounded-3 overflow-hidden">
          <InputGroup.Text className="bg-body border-0 text-secondary ps-4">
            <SearchIcon size={20} />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search movies or series..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-body border-0 py-3 font-mono shadow-none"
            style={{ fontSize: '16px' }}
          />
        </InputGroup>
      </div>

      {isMockMode && (
        <div className="mb-4 p-3 bg-warning bg-opacity-10 rounded-3 border border-warning border-opacity-25">
          <p className="m-0 text-warning-emphasis font-mono" style={{ fontSize: '12px' }}>
            <strong>Demo Mode:</strong> TMDB API Key is missing. Only limited mock data is available (try searching for "Fight Club", "Game of Thrones", "Inception", or "Stranger Things").
          </p>
        </div>
      )}

      {loading && <div className="text-center text-secondary font-mono py-4">Searching...</div>}

      <div className="d-flex flex-column gap-3">
        {results.map(item => {
          const added = isAdded(item);
          return (
            <div key={item.id} className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3">
              <div className="flex-shrink-0 rounded overflow-hidden bg-secondary" style={{ width: '48px', height: '72px' }}>
                {item.poster_path ? (
                  <img src={getImageUrl(item.poster_path)} alt={item.title || item.name} className="w-100 h-100 object-fit-cover" />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white opacity-50 font-mono" style={{ fontSize: '10px' }}>No Img</div>
                )}
              </div>
              <div className="flex-grow-1 min-w-0">
                <h3 className="fs-6 fw-bold text-truncate mb-1 font-mono">{item.title || item.name}</h3>
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="secondary" className="font-mono text-uppercase" style={{ fontSize: '9px' }}>
                    {item.media_type}
                  </Badge>
                  <span className="text-secondary font-mono" style={{ fontSize: '12px' }}>
                    {item.release_date ? item.release_date.split('-')[0] : item.first_air_date ? item.first_air_date.split('-')[0] : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button 
                  variant={added ? "success" : "outline-primary"} 
                  className="rounded-circle p-0 d-flex align-items-center justify-content-center"
                  style={{ width: '36px', height: '36px' }}
                  onClick={() => !added && handleAdd(item)}
                  disabled={added}
                >
                  {added ? <Check size={18} /> : <Plus size={18} />}
                </Button>
              </div>
            </div>
          );
        })}
        
        {!loading && query.length > 2 && results.length === 0 && !error && (
          <div className="text-center text-secondary font-mono py-4">No results found.</div>
        )}
        
        {error && (
          <div className="text-center text-danger font-mono py-4 px-3 bg-danger bg-opacity-10 rounded-3">
            {error}
          </div>
        )}
      </div>
    </Container>
  );
}
