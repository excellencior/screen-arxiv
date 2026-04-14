import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Trash2 } from 'lucide-react';
import { useBackButton } from '../../context/BackButtonContext';

interface ConfirmDeleteModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  variant = 'danger'
}) => {
  useBackButton(() => {
    onHide();
    return true;
  }, 30, show);

  return (
    <Modal show={show} onHide={onHide} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden" size="sm">
      <Modal.Body className="p-4 p-sm-5 text-center">
        <div className="mb-3">
          <div className={`d-inline-flex align-items-center justify-content-center rounded-circle bg-${variant} bg-opacity-10`} style={{ width: '48px', height: '48px' }}>
            <Trash2 size={22} className={`text-${variant}`} />
          </div>
        </div>
        <h5 className="fw-bold font-mono text-body mb-2">{title}</h5>
        <div className="text-secondary font-mono mb-4" style={{ fontSize: '13px' }}>
          {message}
        </div>
        <div className="d-flex gap-2 justify-content-center">
          <Button variant="light" className="px-4 py-2 font-mono fw-medium rounded border-0 bg-secondary bg-opacity-10 text-body"
            onClick={onHide} style={{ fontSize: '13px' }}>Cancel</Button>
          <Button variant={variant} className="px-4 py-2 font-mono fw-medium rounded border-0"
            onClick={onConfirm} style={{ fontSize: '13px' }}>{confirmLabel}</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ConfirmDeleteModal;
