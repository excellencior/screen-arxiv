import React from 'react';
import { Modal } from 'react-bootstrap';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackButton } from '../../context/BackButtonContext';

interface TVEpisodeModalProps {
  episode: any;
  onHide: () => void;
  selectedSeason: number | null;
  selectedShow: any;
  activeSeason: any;
}

const TVEpisodeModal: React.FC<TVEpisodeModalProps> = ({
  episode,
  onHide,
  selectedSeason,
  selectedShow,
  activeSeason
}) => {
  // Higher priority than TVShowModal
  useBackButton(() => {
    onHide();
    return true;
  }, 20, !!episode);

  if (!episode) return null;

  return (
    <Modal show={!!episode} onHide={onHide} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden" animation={false} backdropClassName="episode-modal-backdrop">
      <AnimatePresence>
        {episode && (
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
            <div className="scrollbar-hide" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <Modal.Body className="p-0">
                <div className="p-4 pb-3">
                  <div className="d-flex gap-3 align-items-start">
                    {(() => {
                      let img = null;
                      if (episode.still_path) img = `https://image.tmdb.org/t/p/w200${episode.still_path}`;
                      else if (selectedSeason !== null && activeSeason?.poster_path) img = `https://image.tmdb.org/t/p/w200${activeSeason.poster_path}`;
                      else if (selectedShow?.image) img = selectedShow.image;
                      
                      return img && (
                        <div className="flex-shrink-0 shadow-sm rounded overflow-hidden" style={{ width: '72px', height: '108px' }}>
                          <img src={img} alt={episode.title} className="w-100 h-100 object-fit-cover" />
                        </div>
                      );
                    })()}

                    <div className="flex-grow-1 min-w-0 pt-1">
                      <div className="text-secondary fw-bold text-uppercase mb-1 font-mono" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
                        S{String(selectedSeason).padStart(2, '0')} E{String(episode.episodeNumber).padStart(2, '0')}
                      </div>
                      <h1 className="fs-5 fw-bold font-mono text-body mb-1" style={{ letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                        {episode.title}
                      </h1>
                      <div className="d-flex align-items-center gap-2 flex-wrap font-mono text-secondary" style={{ fontSize: '12px' }}>
                        <span>{episode.date}</span>
                        {episode.runtime > 0 && (
                          <><span className="opacity-50">•</span><span>{episode.runtime}m</span></>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                <div className="px-4 pb-4 d-flex flex-column gap-4">
                  {episode.summary && (
                    <div>
                      <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Summary</h3>
                      <p className="font-mono text-body m-0" style={{ fontSize: '13px', lineHeight: '1.6' }}>{episode.summary}</p>
                    </div>
                  )}
                  {episode.cast?.length > 0 && (
                    <div>
                      <h3 className="text-secondary text-uppercase fw-bold mb-2 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Guest Stars</h3>
                      <div className="d-flex flex-column gap-2">
                        {episode.cast.map((person: any, idx: number) => (
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

export default TVEpisodeModal;
