import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Play, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackButton } from '../../context/BackButtonContext';

interface MovieDetailModalProps {
  movie: any;
  onHide: () => void;
  setDeleteTarget: (movie: any) => void;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onHide,
  setDeleteTarget
}) => {
  useBackButton(() => {
    onHide();
    return true;
  }, 10, !!movie);

  if (!movie) return null;

  return (
    <Modal show={!!movie} onHide={onHide} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden" animation={false}>
      <AnimatePresence>
        {movie && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 12 }}>
              <button
                onClick={onHide}
                className="border-0 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                style={{ width: '30px', height: '30px', cursor: 'pointer', backdropFilter: 'blur(4px)', backgroundColor: 'rgba(220,53,69,0.12)' }}
              >
                <X size={16} className="text-danger" />
              </button>
            </div>
          
          <div className="scrollbar-hide" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <Modal.Body className="p-0">
              {/* Header */}
              <div className="p-4 pb-3">
                <div className="d-flex gap-3 align-items-start">
                  {movie.image && (
                    <div className="flex-shrink-0 shadow-sm rounded overflow-hidden" style={{ width: '72px', height: '108px' }}>
                      <img src={movie.image} alt={movie.title} className="w-100 h-100 object-fit-cover" />
                    </div>
                  )}

                  <div className="flex-grow-1 min-w-0 pt-1">
                    <h1 className="fs-5 fw-bold font-mono text-body mb-1" style={{ letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                      {movie.title}
                    </h1>
                    <div className="d-flex align-items-center gap-2 flex-wrap font-mono text-secondary" style={{ fontSize: '12px' }}>
                      <span>{movie.year}</span>
                      {movie.runtime > 0 && (
                        <>
                          <span className="opacity-50">•</span>
                          <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                        </>
                      )}
                    </div>

                    {/* Buttons: md+ */}
                    <div className="d-none d-md-flex gap-2 flex-wrap mt-3">
                      {movie.trailer && (
                        <Button variant="outline-primary" size="sm"
                          className="d-flex align-items-center gap-2 rounded border-0 bg-primary bg-opacity-10"
                          onClick={() => window.open(`https://www.youtube.com/watch?v=${movie.trailer}`, '_blank')}>
                          <Play size={13} fill="currentColor" />
                          <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Trailer</span>
                        </Button>
                      )}
                      <Button variant="outline-danger" size="sm"
                        className="d-flex align-items-center gap-2 rounded border-0 bg-danger bg-opacity-10"
                        onClick={() => setDeleteTarget(movie)}>
                        <Trash2 size={13} />
                        <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Remove</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Buttons: small only */}
                <div className="d-flex d-md-none gap-2 flex-wrap mt-3">
                  {movie.trailer && (
                    <Button variant="outline-primary" size="sm"
                      className="d-flex align-items-center gap-2 rounded border-0 bg-primary bg-opacity-10"
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${movie.trailer}`, '_blank')}>
                      <Play size={13} fill="currentColor" />
                      <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Trailer</span>
                    </Button>
                  )}
                  <Button variant="outline-danger" size="sm"
                    className="d-flex align-items-center gap-2 rounded border-0 bg-danger bg-opacity-10"
                    onClick={() => setDeleteTarget(movie)}>
                    <Trash2 size={13} />
                    <span className="font-mono fw-medium" style={{ fontSize: '11px' }}>Remove</span>
                  </Button>
                </div>
              </div>

              <div className="px-4 pb-4 d-flex flex-column gap-4">
                {movie.summary && (
                  <div>
                    <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Summary</h3>
                    <p className="font-mono text-body m-0" style={{ fontSize: '13px', lineHeight: '1.6' }}>{movie.summary}</p>
                  </div>
                )}
                {movie.cast?.length > 0 && (
                  <div>
                    <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Cast & Crew</h3>
                    <div className="d-flex flex-column gap-2">
                      {movie.cast.map((person: any, idx: number) => (
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
  );
};

export default MovieDetailModal;
