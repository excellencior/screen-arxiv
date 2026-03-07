import React from 'react';
import { Container, Card, Badge, ProgressBar } from 'react-bootstrap';
import { Film, Tv, Lightbulb } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export default function Dashboard() {
  const { movies, shows } = useLibrary();

  const moviesWatched = movies.filter(m => m.status === 'WATCHED' || m.status === 'DONE');
  const totalMovieMinutes = moviesWatched.reduce((acc, m) => acc + (m.runtime || 120), 0);
  const movieDays = Math.floor(totalMovieMinutes / (24 * 60));
  const movieHours = Math.floor((totalMovieMinutes % (24 * 60)) / 60);
  const movieMins = totalMovieMinutes % 60;

  const seriesWatched = shows.filter(s => s.status === 'DONE');
  const totalSeriesMinutes = seriesWatched.reduce((acc, s) => acc + (s.runtime || 600), 0);
  const seriesDays = Math.floor(totalSeriesMinutes / (24 * 60));
  const seriesHours = Math.floor((totalSeriesMinutes % (24 * 60)) / 60);
  const seriesMins = totalSeriesMinutes % 60;

  const activeSeries = shows.filter(s => s.status === 'WATCHING').length;
  const willWatchSeries = shows.filter(s => s.status === 'WILL WATCH');
  const willWatchMinutes = willWatchSeries.reduce((acc, s) => acc + (s.runtime || 600), 0);
  const willWatchDays = Math.floor(willWatchMinutes / (24 * 60));
  const willWatchHours = Math.floor((willWatchMinutes % (24 * 60)) / 60);
  const willWatchMins = willWatchMinutes % 60;

  return (
    <Container className="py-4 px-3" style={{ maxWidth: '672px' }}>
      <div className="mb-4">
        <h2 className="text-secondary text-uppercase fw-bold m-0" style={{ fontSize: '12px', letterSpacing: '0.1em' }}>
          Analytical Dashboard
        </h2>
      </div>

      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-2 mb-4">
            <Film className="text-primary" size={20} />
            <h3 className="m-0 fs-6 fw-bold text-body">Movie Archive Statistics</h3>
          </div>
          <div className="d-flex flex-column gap-3 font-mono">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
              <span className="text-secondary" style={{ fontSize: '14px' }}>Movies Watched</span>
              <span className="fw-bold text-body">{moviesWatched.length}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-secondary" style={{ fontSize: '14px' }}>Total Watch Time</span>
              <span className="fw-bold text-body">{movieDays}d {movieHours}h {movieMins}m</span>
            </div>
          </div>
        </Card.Body>
        <div className="bg-primary bg-opacity-10 w-100" style={{ height: '4px' }}>
          <div className="bg-primary h-100" style={{ width: movies.length > 0 ? `${(moviesWatched.length / movies.length) * 100}%` : '0%' }}></div>
        </div>
      </Card>

      <div className="bg-primary bg-opacity-10 border-start border-primary border-4 rounded-3 p-4 d-flex align-items-start gap-3 mb-4">
        <Lightbulb className="text-primary mt-1 flex-shrink-0" size={20} />
        <div className="d-flex flex-column gap-1">
          <p className="m-0 text-body fw-medium" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            Keep in mind that You need time for Important things
          </p>
          <p className="m-0 text-secondary text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
            Mindfulness Reminder
          </p>
        </div>
      </div>

      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-2 mb-4">
            <Tv className="text-primary" size={20} />
            <h3 className="m-0 fs-6 fw-bold text-body">TV Archive Statistics</h3>
          </div>
          <div className="d-flex flex-column gap-3 font-mono">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
              <span className="text-secondary" style={{ fontSize: '14px' }}>Series Watched</span>
              <span className="fw-bold text-body">{seriesWatched.length}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-secondary" style={{ fontSize: '14px' }}>Total Watch Time</span>
              <span className="fw-bold text-body">{seriesDays}d {seriesHours}h {seriesMins}m</span>
            </div>
          </div>
        </Card.Body>
        <div className="bg-primary bg-opacity-10 w-100" style={{ height: '4px' }}>
          <div className="bg-primary h-100" style={{ width: shows.length > 0 ? `${(seriesWatched.length / shows.length) * 100}%` : '0%' }}></div>
        </div>
      </Card>

      <div className="d-flex align-items-center gap-3 py-4 opacity-50">
        <div className="flex-grow-1 bg-secondary" style={{ height: '1px' }}></div>
        <span className="text-uppercase font-mono text-secondary" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>End of Record</span>
        <div className="flex-grow-1 bg-secondary" style={{ height: '1px' }}></div>
      </div>

      <div className="row g-3 font-mono">
        <div className="col-6">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-3">
              <p className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Watching</p>
              <p className="fs-5 fw-bold text-body mb-0">{activeSeries} Series</p>
              <p className="text-primary text-uppercase fw-bold mt-1 mb-0" style={{ fontSize: '10px' }}>Active Progress</p>
            </Card.Body>
          </Card>
        </div>
        <div className="col-6">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="p-3">
              <p className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Will Watch</p>
              <p className="fs-5 fw-bold text-body mb-0">{willWatchSeries.length} Series</p>
              <p className="text-secondary text-uppercase fw-bold mt-1 mb-0" style={{ fontSize: '10px' }}>Est. Time: {willWatchDays}d {willWatchHours}h {willWatchMins}m</p>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
}

