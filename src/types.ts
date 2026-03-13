export type FilterType = 'all' | 'movies' | 'tv';
export type StatusFilter = 'all' | 'WATCHED' | 'WATCHING' | 'WILL WATCH' | 'ON HOLD';

export const STATUS_COLOR_MAP: Record<string, string> = {
    'WATCHED': '#198754',
    'DONE': '#198754',
    'WATCHING': '#0d6efd',
    'WILL WATCH': '#ffc107',
    'ON HOLD': '#dc3545',
    'UNKNOWN': '#6c757d',
};
