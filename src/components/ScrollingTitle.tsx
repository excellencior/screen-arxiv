import { useRef, useState, useEffect, useCallback } from 'react';

interface ScrollingTitleProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

// Animates as a ticker only when the text actually overflows the container.
// Uses ResizeObserver to re-check on every layout change (window resize, sidebar, etc).
export default function ScrollingTitle({ text, className = '', style }: ScrollingTitleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  const check = useCallback(() => {
    if (containerRef.current && measureRef.current) {
      // Use the measurement span (which has no padding) to check against container width
      setOverflowing(measureRef.current.offsetWidth > containerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(check, 50);
    const ro = new ResizeObserver(check);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { clearTimeout(t); ro.disconnect(); };
  }, [check, text]);

  return (
    <div
      ref={containerRef}
      className={`title-scroll-container${overflowing ? ' is-overflowing' : ''} ${className}`}
      style={style}
    >
      {/* Hidden span for accurate width measurement without padding */}
      <span ref={measureRef} className="position-absolute invisible pb-5" style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
        {text}
      </span>

      <span>{text}</span>
      {/* Duplicate for seamless loop — shown/hidden via CSS */}
      <span aria-hidden="true">{text}</span>
    </div>
  );
}
