import React, { useState } from 'react';
import { Container, Badge } from 'react-bootstrap';
import { ChevronDown, ChevronRight, Film, Tv, Lightbulb, Clock } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Link } from 'react-router-dom';

const ExpandableSection = ({ title, icon: Icon, items, type, defaultExpanded = false }: { title: string, icon: any, items: any[], type: 'movie' | 'tv', defaultExpanded?: boolean }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (items.length === 0) return null;

  return (
    <div className="mb-3">
      <div
        className="d-flex align-items-center gap-2 mb-1 p-2 rounded hover-bg-light"
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer', marginLeft: '-8px' }}
      >
        <div className="text-secondary d-flex align-items-center justify-content-center" style={{ width: '16px' }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        <Icon size={14} className="text-secondary" />
        <span className="fw-medium font-mono text-body" style={{ fontSize: '13px' }}>{title}</span>
        <Badge bg="secondary" className="bg-opacity-10 text-secondary border-0 ms-auto font-mono" style={{ fontSize: '10px' }}>
          {items.length}
        </Badge>
      </div>

      {expanded && (
        <div className="d-flex flex-column ms-3 ps-3 border-start" style={{ borderColor: 'var(--struct-border)' }}>
          {items.slice(0, 5).map(item => (
            <Link to={type === 'movie' ? '/movies' : '/tv'} key={item.id} className="text-decoration-none d-flex align-items-center justify-content-between p-2 rounded hover-bg-light" style={{ transition: 'background-color 0.1s', marginLeft: '-8px' }}>
              <div className="d-flex align-items-center gap-2 min-w-0">
                <span className="fw-medium font-mono text-body text-truncate" style={{ fontSize: '12px' }}>{item.title || item.name}</span>
                {item.statusColor && (
                  <div className={`rounded-circle bg-${item.statusColor}`} style={{ width: '6px', height: '6px' }}></div>
                )}
              </div>
              <div className="d-flex align-items-center gap-2">
                {type === 'tv' && item.progress && (
                  <span className="text-secondary font-mono" style={{ fontSize: '10px' }}>Ep {item.progress.watched}/{item.progress.total}</span>
                )}
                <span className="text-secondary font-mono" style={{ fontSize: '10px' }}>{item.year}</span>
              </div>
            </Link>
          ))}
          {items.length > 5 && (
            <Link to={type === 'movie' ? '/movies' : '/tv'} className="text-decoration-none text-secondary font-mono p-2 hover-bg-light rounded" style={{ fontSize: '11px', marginLeft: '-8px' }}>
              + {items.length - 5} more...
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const { movies, shows } = useLibrary();

  // Movie Stats
  const moviesWatched = movies.filter(m => m.status === 'WATCHED' || m.status === 'DONE');
  const moviesWatching = movies.filter(m => m.status === 'WATCHING');
  const moviesWillWatch = movies.filter(m => m.status === 'WILL WATCH');

  const totalMovieMinutes = moviesWatched.reduce((acc, m) => acc + (m.runtime || 120), 0);
  const movieDays = Math.floor(totalMovieMinutes / (24 * 60));
  const movieHours = Math.floor((totalMovieMinutes % (24 * 60)) / 60);

  // TV Stats
  const seriesWatched = shows.filter(s => s.status === 'DONE' || s.status === 'WATCHED');
  const seriesWatching = shows.filter(s => s.status === 'WATCHING');
  const seriesWillWatch = shows.filter(s => s.status === 'WILL WATCH');

  const totalSeriesMinutes = seriesWatched.reduce((acc, s) => acc + (s.runtime || 600), 0);
  const seriesDays = Math.floor(totalSeriesMinutes / (24 * 60));
  const seriesHours = Math.floor((totalSeriesMinutes % (24 * 60)) / 60);

  return (
    <Container className="py-3 px-4" style={{ maxWidth: '672px' }}>
      <div className="mb-5">
        <h1 className="fs-3 fw-medium font-mono text-body tracking-tight mb-2">Screen Arxiv</h1>
        <p className="text-secondary font-mono" style={{ fontSize: '13px' }}>Your personal digital archive for movies and series.</p>
      </div>

      <div className="bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded p-3 d-flex align-items-start gap-3 mb-5">
        <Lightbulb className="text-primary mt-1 flex-shrink-0" size={16} />
        <div className="d-flex flex-column gap-1">
          <p className="m-0 text-primary-emphasis fw-medium font-mono" style={{ fontSize: '12px', lineHeight: '1.5' }}>
            Keep in mind that you need time for important things.
          </p>
          <p className="m-0 text-primary text-uppercase font-mono opacity-75" style={{ fontSize: '9px', letterSpacing: '0.05em' }}>
            Mindfulness Reminder
          </p>
        </div>
      </div>

      <div className="mb-5">
        <div className="d-flex align-items-center gap-2 mb-3 px-2">
          <Film className="text-secondary" size={16} />
          <h2 className="fs-6 fw-bold font-mono text-body m-0">Movie Archive</h2>
        </div>

        <div className="card shadow-sm border-0 p-3 mb-3 d-flex flex-row align-items-center justify-content-between font-mono">
          <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '12px' }}>
            <Clock size={14} /> Total Time
          </div>
          <div className="fw-medium" style={{ fontSize: '13px' }}>
            {movieDays}d {movieHours}h
          </div>
        </div>

        <ExpandableSection title="Watching" icon={Film} items={moviesWatching} type="movie" defaultExpanded={true} />
        <ExpandableSection title="Will Watch" icon={Film} items={moviesWillWatch} type="movie" />
        <ExpandableSection title="Watched" icon={Film} items={moviesWatched} type="movie" />
      </div>

      <div className="mb-5">
        <div className="d-flex align-items-center gap-2 mb-3 px-2">
          <Tv className="text-secondary" size={16} />
          <h2 className="fs-6 fw-bold font-mono text-body m-0">TV Archive</h2>
        </div>

        <div className="card shadow-sm border-0 p-3 mb-3 d-flex flex-row align-items-center justify-content-between font-mono">
          <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '12px' }}>
            <Clock size={14} /> Total Time
          </div>
          <div className="fw-medium" style={{ fontSize: '13px' }}>
            {seriesDays}d {seriesHours}h
          </div>
        </div>

        <ExpandableSection title="Watching" icon={Tv} items={seriesWatching} type="tv" defaultExpanded={true} />
        <ExpandableSection title="Will Watch" icon={Tv} items={seriesWillWatch} type="tv" />
        <ExpandableSection title="Watched" icon={Tv} items={seriesWatched} type="tv" />
      </div>

      <div className="d-flex align-items-center gap-3 py-4 opacity-50">
        <div className="flex-grow-1 bg-secondary" style={{ height: '1px' }}></div>
        <span className="text-uppercase font-mono text-secondary" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>End of Record</span>
        <div className="flex-grow-1 bg-secondary" style={{ height: '1px' }}></div>
      </div>
    </Container>
  );
}

