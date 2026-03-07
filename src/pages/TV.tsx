import React, { useState } from 'react';
import { Container, Dropdown, Button, Modal, Badge } from 'react-bootstrap';
import { ChevronDown, Check, X, Plus, Play } from 'lucide-react';
import { fetchTVDetails, fetchTVSeason, getImageUrl } from '../services/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { Link } from 'react-router-dom';

const STATUS_OPTIONS = [
  { label: 'WATCHED', color: 'success' },
  { label: 'WATCHING', color: 'primary' },
  { label: 'WILL WATCH', color: 'warning' },
  { label: 'ON HOLD', color: 'danger' },
  { label: 'DONE', color: 'secondary' }
];

const MOCK_TV_DATA = [
  {
    id: 1,
    title: 'Severance',
    season: 'Season 2',
    year: 2026,
    status: 'WATCHING',
    statusColor: 'primary',
    progress: { watched: 4, total: 9 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALFPQFUonhpmFbZY0fLqCDYQOduUwN6ZQZFEwHNAaNAPx167JO90Um81Qjqp99ojNIOLp8jz45zbcQpLHxU5xo8Kuxe_3cUHOXOzBt1V-mWABJBa-8qD5KdvEehI2Rv558Gajp7BuL1ZQ1JnyV_frZiOQBvqYz42Do663FRIB2Og86pb5gjq3Z9QK6AMPW6ezzue604dTAOll29ZsJXPf304BZuh0vStZr0mQtjb_Pw0fUeRiR2ANTX83xjQaTHbL7KmyEiXi1bOo',
    episodes: [
      { id: 1, title: 'Good News About Hell', date: 'Feb 18, 2022', status: 'WATCHED', statusColor: 'success' },
      { id: 2, title: 'Half Loop', date: 'Feb 18, 2022', status: 'WATCHED', statusColor: 'success' },
      { id: 3, title: 'In Perpetuity', date: 'Feb 25, 2022', status: 'WILL WATCH', statusColor: 'warning' },
      { id: 4, title: 'The You You Are', date: 'Mar 4, 2022', status: 'WILL WATCH', statusColor: 'warning' },
      { id: 5, title: 'The Grim Barbarity', date: 'Mar 11, 2022', status: 'WILL WATCH', statusColor: 'warning' },
      { id: 6, title: 'Hide and Seek', date: 'Mar 18, 2022', status: 'WILL WATCH', statusColor: 'warning' }
    ]
  },
  {
    id: 2,
    title: 'The Bear',
    season: 'Season 4',
    year: 2026,
    status: 'DONE',
    statusColor: 'secondary',
    progress: { watched: 10, total: 10 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ5nJ5F7qhnPk1D3yowaxmgUYCKj6u6GE5At21oxiTiqq-BGU7NZT3UQt-nMCaI0lsbZU6jy36Xnvhbpn7tgCoCEMvnXXid3MzPlCnG031ct0OaBfiP7ZLUvYdXEdTw1yxKxpdb_aEbdssxGFl3xr95mtSAbpEI47nXT6iDoPJdM0sUEkn4nz5NMz2Gb7HcyKDziO4hMxpK4NiQLF5Pf2eGEy5IRzzWNrI3mq33MKaMM7l3_LHU8_CjoPMnpQKBUM7UPfvnUgHu3c'
  },
  {
    id: 3,
    title: 'The White Lotus',
    season: 'Season 3',
    year: 2025,
    status: 'ON HOLD',
    statusColor: 'danger',
    progress: { watched: 2, total: 7 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2PJK97E2GX9me1ed8cB2KkI68RuWax7K99jZ5IfMZT4rkiHs8wAVdZwXuYs-yQgh6ZlpipjAK25N_es4Ane8Pn0PEKO2qduHat-ut5zENkoWT48YlP_yZuTz9pmcbSl5Wcf8CHACSzjRed6ulrLKVH-qjrwYK5j5vh-ZlaxU9CFkMlPbMliV_XVCGZhIGMw35Mvp0TOX-fOh8N6W5DEayPG0zAxxITNOi09Pgmebg55mdQxu1c1wHaRbhd-L9YsCYxM8tYIo0lmA'
  },
  {
    id: 4,
    title: 'Andor',
    season: 'Season 2',
    year: 2025,
    status: 'WILL WATCH',
    statusColor: 'warning',
    progress: { watched: 0, total: 12 },
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUjWATC7cvCDa9WABRY5ynGI4sySZaByzHQXbpbv3Mk1hUghyXq6mIOTrtHGY0Wcra1NHOayVcwZHzE6N0jafWrz91bqH8v2GwnupSeBKVlzuJrZEuN6dKJ0tNUMIznUYAF5qdtY3CNfFDEJTM3fEOdKXGbksvEeRZbg0S_E-QOFawSlCMKLMMra8ZHuelE4-mwbTpg09etUW5S82pP2dEw-h1M56xL1varL9_NmtKh1khv3nUqaqMwH9IzhawaumQ2j4XzUyqW1E'
  }
];

export default function TV() {
  const { shows, updateShow } = useLibrary();
  const [selectedShow, setSelectedShow] = useState<any>(null);

  const formatRuntime = (minutes: number) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  const handleShowClick = async (show: any) => {
    setSelectedShow(show);
    if (show.episodes && show.episodes.length > 0 && show.runtime !== undefined) return;

    const details = await fetchTVDetails(show.id);
    if (details && details.seasons) {
      const validSeason = details.seasons.find((s:any) => s.season_number > 0) || details.seasons[0];
      if (validSeason) {
        const seasonData = await fetchTVSeason(show.id, validSeason.season_number);
        if (seasonData && seasonData.episodes) {
          const episodes = seasonData.episodes.map((ep: any) => ({
            id: ep.id,
            title: ep.name,
            date: ep.air_date ? new Date(ep.air_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBA',
            status: 'WILL WATCH',
            statusColor: 'warning'
          }));
          
          const trailer = details.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null;
          const episodeRuntime = details.episode_run_time?.[0] || 0;
          const totalEpisodes = details.number_of_episodes || 0;

          const updatedShow = { 
            ...show, 
            season: `Season ${validSeason.season_number}`, 
            episodes,
            progress: { watched: 0, total: episodes.length },
            runtime: episodeRuntime * totalEpisodes,
            trailer
          };
          setSelectedShow(updatedShow);
          updateShow(show.id, updatedShow);
        }
      }
    }
  };

  const handleMarkAllWatched = () => {
    if (!selectedShow) return;
    
    const updatedEpisodes = selectedShow.episodes.map((ep: any) => ({
      ...ep,
      status: 'WATCHED',
      statusColor: 'success'
    }));

    const updatedShow = {
      ...selectedShow,
      episodes: updatedEpisodes,
      progress: { watched: updatedEpisodes.length, total: updatedEpisodes.length },
      status: 'WATCHED',
      statusColor: 'success'
    };

    setSelectedShow(updatedShow);
    updateShow(selectedShow.id, updatedShow);
  };

  const handleStatusChange = (showId: number, newStatus: string, newColor: string) => {
    updateShow(showId, { status: newStatus, statusColor: newColor });
  };

  const handleEpisodeStatusChange = (showId: number, episodeId: number, newStatus: string, newColor: string) => {
    const show = shows.find(s => s.id === showId);
    if (!show) return;

    const updatedEpisodes = show.episodes.map((ep: any) => 
      ep.id === episodeId 
        ? { ...ep, status: newStatus, statusColor: newColor }
        : ep
    );
    
    const watchedCount = updatedEpisodes.filter((ep:any) => ep.status === 'WATCHED' || ep.status === 'DONE').length;
    const updatedShow = { 
      ...show, 
      episodes: updatedEpisodes,
      progress: { ...show.progress, watched: watchedCount }
    };

    // Update selected show if it's currently open
    if (selectedShow && selectedShow.id === showId) {
      setSelectedShow(updatedShow);
    }
    
    updateShow(showId, updatedShow);
  };

  const groupedShows = shows.reduce((acc, show) => {
    if (!acc[show.year]) acc[show.year] = [];
    acc[show.year].push(show);
    return acc;
  }, {} as Record<number, any[]>);

  const years = Object.keys(groupedShows).map(Number).sort((a, b) => b - a);

  return (
    <Container className="py-4 px-3" style={{ maxWidth: '672px' }}>
      {shows.length === 0 ? (
        <div className="text-center py-5">
          <h2 className="fs-4 fw-bold mb-3 font-mono">Your Library is Empty</h2>
          <p className="text-secondary font-mono mb-4">Search for TV series to add them to your archive.</p>
          <Button as={Link} to="/search" variant="primary" className="d-inline-flex align-items-center gap-2 font-mono rounded-pill px-4">
            <Plus size={18} /> Search Series
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
          <h2 className="fs-4 fw-bold mb-3 font-mono border-bottom pb-2">{year}</h2>
          <div className="d-flex flex-column gap-3">
            {groupedShows[year].map(show => (
              <div 
                key={show.id} 
                className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3 cursor-pointer"
              >
                <div 
                  className="flex-shrink-0 rounded overflow-hidden bg-secondary" 
                  style={{ width: '48px', height: '72px', cursor: 'pointer' }}
                  onClick={() => handleShowClick(show)}
                >
                  <img src={show.image} alt={show.title} className="w-100 h-100 object-fit-cover" />
                </div>
                <div 
                  className="flex-grow-1 min-w-0"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleShowClick(show)}
                >
                  <h3 className="fs-6 fw-bold text-truncate mb-1 font-mono">{show.title}</h3>
                  <div className="d-flex align-items-center gap-2">
                    <p className="text-secondary mb-1 font-mono" style={{ fontSize: '12px' }}>{show.season}, {show.year}</p>
                    {show.runtime > 0 && (
                      <>
                        <span className="text-secondary mb-1" style={{ fontSize: '10px' }}>•</span>
                        <p className="text-secondary mb-1 font-mono" style={{ fontSize: '12px' }}>{formatRuntime(show.runtime)}</p>
                      </>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2 font-mono" style={{ fontSize: '10px' }}>
                    <span className="text-secondary text-uppercase fw-bold">Progress:</span>
                    <span className="text-success fw-bold">W: {show.progress.watched.toString().padStart(2, '0')}</span>
                    <span className="text-secondary">/</span>
                    <span className="text-primary fw-bold">T: {show.progress.total.toString().padStart(2, '0')}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Dropdown>
                    <Dropdown.Toggle 
                      as={Badge}
                      bg={show.statusColor} 
                      className={`rounded-pill px-2 py-1 d-flex align-items-center gap-1 font-mono border-0 ${show.statusColor === 'warning' ? 'text-dark' : ''}`}
                      style={{ fontSize: '10px', letterSpacing: '0.05em', cursor: 'pointer' }}
                    >
                      {show.status} <ChevronDown size={12} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="font-mono shadow-sm border-0" style={{ fontSize: '12px' }}>
                      {STATUS_OPTIONS.map(option => (
                        <Dropdown.Item 
                          key={option.label}
                          onClick={() => handleStatusChange(show.id, option.label, option.color)}
                          active={show.status === option.label}
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

      <Modal show={!!selectedShow} onHide={() => setSelectedShow(null)} centered dialogClassName="modal-dialog-centered modal-fullscreen-sm-down" contentClassName="border-0 shadow-lg rounded-4">
        {selectedShow && (
          <>
            <div className="d-flex align-items-center justify-content-between p-4 border-bottom">
              <h2 className="fs-6 fw-medium m-0 font-mono">{selectedShow.title}: {selectedShow.season}</h2>
              <Button variant="link" className="text-secondary p-0" onClick={() => setSelectedShow(null)}>
                <X size={20} />
              </Button>
            </div>
            <div className="px-4 py-3 border-bottom bg-body d-flex gap-2">
              <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2 rounded-3" onClick={handleMarkAllWatched}>
                <Check size={16} />
                <span className="text-uppercase font-mono fw-medium" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Mark all as watched</span>
              </Button>
              {selectedShow.trailer && (
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="d-flex align-items-center gap-2 rounded-3" 
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedShow.trailer}`, '_blank')}
                >
                  <Play size={16} fill="currentColor" />
                  <span className="text-uppercase font-mono fw-medium" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Watch Trailer</span>
                </Button>
              )}
            </div>
            <Modal.Body className="p-4 bg-light" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="d-flex flex-column gap-3">
                {(selectedShow.episodes || []).map((ep: any) => (
                  <div key={ep.id} className="card border-0 shadow-sm p-2 d-flex flex-row align-items-center gap-3">
                    <div className="flex-shrink-0 bg-secondary bg-opacity-10 rounded d-flex align-items-center justify-content-center" style={{ width: '40px', height: '60px' }}>
                      <span className="font-mono fs-4 text-secondary opacity-50">{ep.id.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <h3 className="fs-6 fw-medium text-truncate mb-1 font-mono">{ep.title}</h3>
                      <p className="text-secondary mb-0 font-mono" style={{ fontSize: '10px' }}>{ep.date}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Dropdown>
                        <Dropdown.Toggle 
                          as={Badge}
                          bg={ep.statusColor} 
                          className={`rounded-pill px-2 py-1 d-flex align-items-center gap-1 font-mono border-0 ${ep.statusColor === 'warning' ? 'text-dark' : ''}`}
                          style={{ fontSize: '9px', letterSpacing: '0.05em', cursor: 'pointer' }}
                        >
                          {ep.status} <ChevronDown size={12} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="font-mono shadow-sm border-0" style={{ fontSize: '12px' }}>
                          {STATUS_OPTIONS.map(option => (
                            <Dropdown.Item 
                              key={option.label}
                              onClick={() => handleEpisodeStatusChange(selectedShow.id, ep.id, option.label, option.color)}
                              active={ep.status === option.label}
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
            </Modal.Body>
          </>
        )}
      </Modal>
    </Container>
  );
}

