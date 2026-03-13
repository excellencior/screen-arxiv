export type StatusFilter = 'all' | 'WATCHED' | 'WATCHING' | 'WILL WATCH' | 'ON HOLD';

// Multi-select filter types
export type TypeToggle = { movies: boolean; tv: boolean };
export type StatusToggle = { WATCHED: boolean; WATCHING: boolean; 'WILL WATCH': boolean; 'ON HOLD': boolean };

export const STATUS_COLOR_MAP: Record<string, string> = {
    'WATCHED': '#198754',
    'DONE': '#198754',
    'WATCHING': '#0d6efd',
    'WILL WATCH': '#ffc107',
    'ON HOLD': '#dc3545',
    'UNKNOWN': '#6c757d',
};
