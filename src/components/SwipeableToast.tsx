import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { toast, Toast, resolveValue } from 'react-hot-toast';

interface SwipeableToastProps {
  t: Toast;
}

export default function SwipeableToast({ t }: SwipeableToastProps) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0]);
  const scale = useTransform(x, [-100, 0, 100], [0.9, 1, 0.9]);

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 60) {
      toast.dismiss(t.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      style={{
        x,
        opacity: t.visible ? opacity : 0,
        scale,
        pointerEvents: t.visible ? 'auto' : 'none',
        zIndex: t.visible ? 9999 : 0,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className={`${t.className} d-flex align-items-center gap-2`}
      role="status"
      aria-live="polite"
    >
      <div className="d-flex align-items-center gap-2 px-1">
        {t.icon && <span className="fs-6">{t.icon}</span>}
        <div className="flex-grow-1">
          {resolveValue(t.message, t)}
        </div>
      </div>
    </motion.div>
  );
}
