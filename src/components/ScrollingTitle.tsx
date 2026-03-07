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
  const spanRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  const check = useCallback(() => {
    if (containerRef.current && spanRef.current) {
      setOverflowing(spanRef.current.scrollWidth > containerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    // Small defer so the container has its final rendered width after fonts/layout settle
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
      <span ref={spanRef}>{text}</span>
      {/* Duplicate for seamless loop — hidden via CSS when not overflowing */}
      <span aria-hidden="true">{text}</span>
    </div>
  );
}
