import { Badge } from 'react-bootstrap';
import { createPortal } from 'react-dom';
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
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0, placement: 'bottom' as 'top' | 'bottom' });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        const handleScroll = (e: Event) => {
            // Close if we scroll the main window or any scrollable container
            setOpen(false);
        };
        
        document.addEventListener('mousedown', handler);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handler);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [open]);

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!open) {
            const rect = e.currentTarget.getBoundingClientRect();
            const dropdownHeight = 180; // Buffer for menu height
            const spaceBelow = window.innerHeight - rect.bottom;
            const placement = spaceBelow < dropdownHeight ? 'top' : 'bottom';
            
            setCoords({ 
                top: placement === 'bottom' ? rect.bottom : rect.top, 
                left: rect.left, 
                width: rect.width,
                height: rect.height,
                placement 
            });
        }
        setOpen(!open);
    };

    const color = statusColor ? COLOR_MAP[statusColor] ?? '#6c757d' : '#6c757d';
    const bgColor = statusColor ? COLOR_MAP[statusColor] + '33' : undefined;

    return (
        <div style={{ display: 'inline-block' }} onClick={(e) => e.stopPropagation()}>
            {status ? (
                <button 
                    onClick={handleToggle} 
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '3px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                        fontSize: '11px', fontFamily: '"PT Sans", sans-serif', fontWeight: 600,
                        backgroundColor: bgColor, color, whiteSpace: 'nowrap',
                        transition: 'opacity 0.15s ease',
                    }}
                >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                    {status}
                    <ChevronDown size={10} style={{ opacity: 0.75 }} />
                </button>
            ) : (
                <button 
                    onClick={handleToggle} 
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        fontSize: '11px', fontFamily: '"PT Sans", sans-serif',
                        backgroundColor: 'var(--struct-hover)', color: 'var(--base-text)',
                        fontWeight: 500,
                    }}
                >
                    <Plus size={14} /> Add
                </button>
            )}
            {open && createPortal(
                <div 
                    ref={dropdownRef}
                    style={{
                        position: 'fixed', 
                        top: coords.placement === 'bottom' ? coords.top + 6 : undefined,
                        bottom: coords.placement === 'top' ? (window.innerHeight - coords.top) + 6 : undefined,
                        left: Math.max(8, Math.min(window.innerWidth - 158, coords.left + coords.width - 150)), 
                        zIndex: 9999,
                        backgroundColor: 'var(--base-surface)', 
                        borderRadius: '10px',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--struct-border)', 
                        minWidth: '150px',
                        padding: '6px', 
                        overflow: 'hidden',
                        animation: 'dropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    <style>
                        {`
                        @keyframes dropdownFadeIn {
                            from { opacity: 0; transform: scale(0.95) translateY(${coords.placement === 'bottom' ? '-8px' : '8px'}); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                        `}
                    </style>
                    {STATUS_OPTIONS.map(option => {
                        const optColor = COLOR_MAP[option.color];
                        const isActive = status === option.label;
                        return (
                            <button key={option.label}
                                onMouseDown={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    onSelect(option.label, option.color); 
                                    setOpen(false); 
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    width: '100%', padding: '8px 12px', border: 'none',
                                    borderRadius: '6px',
                                    background: isActive ? 'var(--struct-hover)' : 'transparent',
                                    cursor: 'pointer', fontSize: '12px', 
                                    fontFamily: '"PT Sans", sans-serif',
                                    fontWeight: isActive ? 600 : 400,
                                    color: 'var(--base-text)', textAlign: 'left',
                                    transition: 'background-color 0.15s ease',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--struct-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = isActive ? 'var(--struct-hover)' : 'transparent')}
                            >
                                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: optColor, flexShrink: 0 }} />
                                {option.label}
                            </button>
                        );
                    })}
                </div>,
                document.body
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