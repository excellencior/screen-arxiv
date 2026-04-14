import React from 'react';
import { Modal, Badge, Button } from 'react-bootstrap';
import { X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackButton } from '../../context/BackButtonContext';

interface SearchDetailModalProps {
  item: any;
  onHide: () => void;
}

const SearchDetailModal: React.FC<SearchDetailModalProps> = ({
  item,
  onHide
}) => {
  useBackButton(() => {
    onHide();
    return true;
  }, 10, !!item);

  if (!item) return null;

  return (
    <Modal show={!!item} onHide={onHide} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden" animation={false}>
      <AnimatePresence>
        {item && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 12 }}>
            <button
              onClick={onHide}
              className="border-0 bg-secondary bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
              style={{ width: '30px', height: '30px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
            >
              <X size={16} className="text-body" />
            </button>
          </div>

          <div className="scrollbar-hide" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Hero Spotlight */}
            {(item.backdrop || item.image) && (
              <div className="position-relative" style={{ height: '300px' }}>
                <img src={item.backdrop || item.image} alt={item.title || item.name} className="w-100 h-100 object-fit-cover" />
                <div className="position-absolute bottom-0 start-0 w-100 h-100"
                  style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, var(--bs-body-bg) 100%)' }} />
              </div>
            )}
            <Modal.Body className="p-4 p-sm-5 pt-0 position-relative" style={{ marginTop: (item.backdrop || item.image) ? '-140px' : '0' }}>
            <div className="d-flex flex-column flex-sm-row gap-4 mb-4 mt-4 align-items-sm-end">
              {item.image && (
                <div className="flex-shrink-0 shadow-lg rounded overflow-hidden d-none d-sm-block" style={{ width: '120px', height: '180px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={item.image} alt={item.title || item.name} className="w-100 h-100 object-fit-cover" />
                </div>
              )}
              <div className="d-flex flex-column justify-content-end pb-2 min-w-0">
                <h1 className="fs-2 fw-bold font-mono text-body tracking-tight mb-2">
                  {item.title || item.name}
                </h1>
                <div className="d-flex align-items-center gap-2 flex-wrap font-mono text-secondary" style={{ fontSize: '12px' }}>
                  {item.media_type && (
                    <Badge bg="secondary" className="bg-opacity-10 text-secondary border-0 font-mono px-2 me-1" style={{ fontSize: '10px' }}>
                      {item.media_type.toUpperCase()}
                    </Badge>
                  )}
                  <span>{item.date || item.year || (item.release_date ? item.release_date.split('-')[0] : item.first_air_date ? item.first_air_date.split('-')[0] : 'N/A')}</span>
                  {item.runtime > 0 && (
                    <>
                      <span className="opacity-50">•</span>
                      <span>{Math.floor(item.runtime / 60)}h {item.runtime % 60}m</span>
                    </>
                  )}
                  {item.number_of_seasons > 0 && (
                    <>
                      <span className="opacity-50">•</span>
                      <span>{item.number_of_seasons} Season{item.number_of_seasons > 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Summary</h3>
              <p className="font-mono text-body" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                {item.summary || item.overview || 'No summary available.'}
              </p>
            </div>

            {item.cast && item.cast.length > 0 && (
              <div className="mb-4">
                <h3 className="text-secondary text-uppercase fw-bold mb-3 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Cast</h3>
                <div className="d-flex flex-column gap-2">
                  {item.cast.map((person: any, idx: number) => (
                    <div key={idx} className="d-flex justify-content-between align-items-baseline border-bottom border-secondary border-opacity-10 pb-2">
                      <span className="fw-medium text-body font-mono" style={{ fontSize: '12px' }}>{person.name}</span>
                      <span className="text-secondary font-mono" style={{ fontSize: '11px' }}>{person.role || person.character}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.trailer && (
              <Button
                variant="primary"
                className="w-100 py-2 d-flex align-items-center justify-content-center gap-2 font-mono fw-medium rounded border-0"
                onClick={() => window.open(`https://www.youtube.com/watch?v=${item.trailer}`, '_blank')}
                style={{ fontSize: '14px' }}
              >
                <Play size={16} fill="currentColor" /> Watch Trailer
              </Button>
            )}
          </Modal.Body>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default SearchDetailModal;
