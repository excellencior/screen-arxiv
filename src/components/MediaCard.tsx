import { Badge } from 'react-bootstrap';
import { ChevronDown, Plus, Minus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import ScrollingTitle from './ScrollingTitle';

interface MediaCardProps {
    item: any;
    type: 'movie' | 'tv' | 'search';
    onClick?: () => void;
    onStatusChange?: (id: number, status: string, color: string) => void;
    onAdd?: (item: any, status: string, color: string) => void;
    onDelete?: (id: number) => void;
    selectionMode?: boolean;
    isSelected?: boolean;
    onSelect?: (id: number) => void;
}

export const STATUS_OPTIONS = [
    { label: 'WATCHED', color: 'success' },
    { label: 'WATCHING', color: 'primary' },
    { label: 'WILL WATCH', color: 'warning' },
    { label: 'ON HOLD', color: 'danger' }
];

export const COLOR_MAP: Record<string, string> = {
    success: '#198754',
    primary: '#0d6efd',
    warning: '#ffc107',
    danger: '#dc3545',
    secondary: '#6c757d',
};

export function StatusDropdown({ status, statusColor, onSelect }: {
    status?: string;
    statusColor?: string;
    onSelect: (label: string, color: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const color = statusColor ? COLOR_MAP[statusColor] ?? '#6c757d' : '#6c757d';
    const bgColor = statusColor ? COLOR_MAP[statusColor] + '33' : undefined;

    return (
        <div ref={ref} style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            {status ? (
                <button onClick={() => setOpen(o => !o)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '3px 8px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontFamily: 'monospace', fontWeight: 600,
                    backgroundColor: bgColor, color, whiteSpace: 'nowrap',
                }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                    {status}
                    <ChevronDown size={10} style={{ opacity: 0.75 }} />
                </button>
            ) : (
                <button onClick={() => setOpen(o => !o)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontFamily: 'monospace',
                    backgroundColor: 'rgba(101, 117, 133, 0.15)', color: 'var(--bs-body-color)',
                }}>
                    <Plus size={14} /> Add
                </button>
            )}
            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 1050,
                    backgroundColor: 'var(--bs-body-bg, #fff)', borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '140px',
                    padding: '4px 0', overflow: 'hidden',
                }}>
                    {STATUS_OPTIONS.map(option => {
                        const optColor = COLOR_MAP[option.color];
                        const isActive = status === option.label;
                        return (
                            <button key={option.label}
                                onMouseDown={(e) => { e.stopPropagation(); onSelect(option.label, option.color); setOpen(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    width: '100%', padding: '6px 12px', border: 'none',
                                    background: isActive ? 'rgba(0,0,0,0.06)' : 'transparent',
                                    cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace',
                                    fontWeight: isActive ? 700 : 400,
                                    color: 'var(--bs-body-color, #333)', textAlign: 'left',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = isActive ? 'rgba(0,0,0,0.06)' : 'transparent')}
                            >
                                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: optColor, flexShrink: 0 }} />
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function MediaCard({
    item, type, onClick, onStatusChange, onAdd, onDelete,
    selectionMode = false, isSelected = false, onSelect,
}: MediaCardProps) {
    const isSearch = type === 'search';

    const formatRuntime = (minutes: number) => {
        if (!minutes) return null;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h > 0 ? h + 'h ' : ''}${m}m`;
    };

    const handleClick = () => {
        if (selectionMode && onSelect) {
            onSelect(item.id);
        } else if (onClick) {
            onClick();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`card border-0 shadow-sm p-3 cursor-pointer`}
            onClick={handleClick}
            style={{
                outline: isSelected ? '2px solid var(--accent-red, #dc3545)' : '2px solid transparent',
                backgroundColor: isSelected ? 'rgba(220,53,69,0.05)' : undefined,
                transition: 'outline 0.15s, background-color 0.15s',
            }}
        >
            <div className="d-flex flex-row align-items-center gap-3 w-100">

                {/* Poster with selection overlay */}
                <div className="flex-shrink-0 position-relative" style={{ width: '40px', height: '60px' }}>
                    <div className="rounded overflow-hidden bg-secondary bg-opacity-10 w-100 h-100">
                        {item.image || item.poster_path ? (
                            <img
                                src={item.image || `https://image.tmdb.org/t/p/w200${item.poster_path}`}
                                alt={item.title || item.name}
                                className="w-100 h-100 object-fit-cover"
                                style={{ opacity: selectionMode ? 0.45 : 1, transition: 'opacity 0.15s' }}
                            />
                        ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary opacity-50 font-mono" style={{ fontSize: '9px' }}>
                                No Img
                            </div>
                        )}
                    </div>
                    {selectionMode && (
                        <div className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                                width: '22px', height: '22px',
                                backgroundColor: isSelected ? 'var(--accent-red, #dc3545)' : 'rgba(255,255,255,0.88)',
                                border: `2px solid ${isSelected ? 'var(--accent-red, #dc3545)' : 'rgba(0,0,0,0.18)'}`,
                                transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                            }}
                        >
                            {isSelected && <Check size={12} color="white" strokeWidth={3} />}
                        </div>
                    )}
                </div>

                {/* Metadata — fills remaining width */}
                <div className="flex-grow-1 min-w-0 d-flex flex-column" style={{ gap: 0, lineHeight: 1.2 }}>
                    <ScrollingTitle
                        text={item.title || item.name}
                        style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}
                    />

                    {/* Metadata block with separate lines for each tag */}
                    <div className="d-flex justify-content-between align-items-start gap-2 w-100">
                        <div className="d-flex flex-column min-w-0" style={{ gap: '0' }}>
                            {type === 'tv' && (item.number_of_seasons || (item.seasons && item.seasons.length > 0) || item.season) && (
                                <p className="text-secondary mb-0 font-mono" style={{ fontSize: '11px' }}>
                                    {item.number_of_seasons
                                        ? `${item.number_of_seasons} Season${item.number_of_seasons !== 1 ? 's' : ''}`
                                        : item.seasons?.length
                                            ? `${item.seasons.length} Season${item.seasons.length !== 1 ? 's' : ''}`
                                            : item.season}
                                </p>
                            )}
                            <p className="text-secondary mb-0 font-mono" style={{ fontSize: '11px' }}>
                                {item.date || item.year || (item.release_date ? item.release_date.split('-')[0] : item.first_air_date ? item.first_air_date.split('-')[0] : 'N/A')}
                            </p>
                            {item.runtime > 0 && !isSearch && (
                                <p className="text-secondary mb-0 font-mono" style={{ fontSize: '11px' }}>{formatRuntime(item.runtime)}</p>
                            )}
                            {item.media_type && isSearch && (
                                <Badge bg="secondary" className="bg-opacity-10 text-secondary border-0 font-mono px-2 align-self-start" style={{ fontSize: '9px', marginTop: '2px' }}>
                                    {item.media_type.toUpperCase()}
                                </Badge>
                            )}
                            {type === 'tv' && item.progress && !isSearch && (
                                <div className="d-flex align-items-center gap-1 font-mono" style={{ fontSize: '10px', marginTop: '1px' }}>
                                    <span className="text-secondary">Ep:</span>
                                    <span className="text-success fw-bold">{item.progress.watched}</span>
                                    <span className="text-secondary opacity-50">/</span>
                                    <span className="text-secondary">{item.progress.total}</span>
                                </div>
                            )}
                        </div>

                        {/* Status pill on the right */}
                        {!selectionMode && (
                            <div className="flex-shrink-0">
                                {isSearch ? (
                                    <div className="d-flex align-items-center">
                                        {onAdd && (
                                            item.status ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                        padding: '4px 10px', borderRadius: '6px', border: 'none',
                                                        cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace',
                                                        backgroundColor: 'rgba(224, 62, 62, 0.15)', color: '#e03e3e',
                                                    }}
                                                >
                                                    <Minus size={14} /> Remove
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onAdd(item, 'WILL WATCH', 'warning'); }}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                        padding: '4px 10px', borderRadius: '6px', border: 'none',
                                                        cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace',
                                                        backgroundColor: 'rgba(101, 117, 133, 0.15)', color: 'var(--bs-body-color)',
                                                    }}
                                                >
                                                    <Plus size={14} /> Add
                                                </button>
                                            )
                                        )}
                                    </div>
                                ) : onStatusChange ? (
                                    <StatusDropdown
                                        status={item.status}
                                        statusColor={item.statusColor}
                                        onSelect={(label, color) => onStatusChange(item.id, label, color)}
                                    />
                                ) : item.status ? (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        padding: '3px 8px', borderRadius: '20px', fontSize: '11px',
                                        fontFamily: 'monospace', fontWeight: 600,
                                        backgroundColor: COLOR_MAP[item.statusColor] + '33',
                                        color: COLOR_MAP[item.statusColor], whiteSpace: 'nowrap',
                                    }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: COLOR_MAP[item.statusColor], flexShrink: 0 }} />
                                        {item.status}
                                    </span>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}