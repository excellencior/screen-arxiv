import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { toast, Toast, resolveValue } from 'react-hot-toast';

interface SwipeableToastProps {
  t: Toast;
}

export default function SwipeableToast({ t }: SwipeableToastProps) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0]);
  const scale = useTransform(x, [-100, 0, 100], [0.95, 1, 0.95]);

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 60) {
      toast.dismiss(t.id);
    }
  };

  const isSuccess = t.type === 'success';
  const isError = t.type === 'error';

  // Aggressively prevent focus theft by blocking the start of any interaction
  const preventFocus = (e: React.UIEvent | React.TouchEvent) => {
    e.preventDefault();
  };

  const baseStyle: React.CSSProperties = {
    backgroundColor: isSuccess ? '#f0fff4' : isError ? '#fff5f5' : 'var(--base-surface, #fff)',
    border: `1px solid ${isSuccess ? '#c6f6d5' : isError ? '#fed7d7' : 'var(--struct-border, rgba(0,0,0,0.1))'}`,
    color: isSuccess ? '#276749' : isError ? '#9b2c2c' : 'var(--base-text, #333)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
    borderRadius: '8px',
    padding: '3px 10px',
    fontSize: '11px',
    fontFamily: '"PT Sans", sans-serif',
    fontWeight: 600,
    width: 'fit-content',
    maxWidth: '100%',
    userSelect: 'none',
    pointerEvents: 'auto',
    cursor: 'grab',
  };

  return (
    <motion.div
      layout
      tabIndex={-1}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      // CRITICAL: Disable pointer events during exit so background clicks work IMMEDIATELY
      exit={{ opacity: 0, scale: 0.9, pointerEvents: 'none', transition: { duration: 0.15 } }}
      style={{
        ...baseStyle,
        x,
        opacity: t.visible ? opacity : 0,
        scale,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      // TRIPLE GUARD: Block focus shift on all interaction types
      onPointerDown={preventFocus}
      onMouseDown={preventFocus}
      onTouchStart={preventFocus}
      className="d-flex align-items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <div className="d-flex align-items-center gap-2">
        {t.icon && <span className="d-flex align-items-center" style={{ fontSize: '12px' }}>{t.icon}</span>}
        <div className="flex-grow-1" style={{ whiteSpace: 'nowrap' }}>
          {resolveValue(t.message, t)}
        </div>
      </div>
    </motion.div>
  );
}
