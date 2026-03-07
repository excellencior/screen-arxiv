// analytics.ts — Pure computation module for deriving statistics from library data.
// All functions are stateless: they take movies[] and shows[] and return derived data.

export interface OverviewStats {
    totalMovies: number;
    totalShows: number;
    totalSeasonsWatched: number;
    totalEpisodesWatched: number;
    totalWatchTimeMinutes: number;
    statusCounts: Record<string, number>;
}

export interface CompletionMetrics {
    completedSeries: number;
    inProgressSeries: number;
    onHoldSeries: number;
    willWatchSeries: number;
    avgCompletionRate: number; // 0–100
}

export interface EpisodeProgressItem {
    id: number;
    title: string;
    watched: number;
    total: number;
    percentage: number;
}

export interface GenreEntry {
    name: string;
    count: number;
}

export interface DecadeEntry {
    decade: string;
    count: number;
}

export interface MonthEntry {
    label: string; // e.g. "2025-03"
    count: number;
}

export interface TopListItem {
    id: number;
    title: string;
    detail: string; // e.g. year, episode count, etc.
    image?: string;
}

// ─── Overview ───────────────────────────────────────────────

export function computeOverviewStats(movies: any[], shows: any[]): OverviewStats {
    const allItems = [...movies, ...shows];
    const statusCounts: Record<string, number> = {};
    for (const item of allItems) {
        const s = item.status || 'UNKNOWN';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
    }

    // Use show.progress.watched as the primary source for episodes
    // (season episodes are lazy-loaded and often unavailable)
    let totalEpisodesWatched = 0;
    let totalSeasonsWatched = 0;
    for (const show of shows) {
        // Primary: use progress tracker
        if (show.progress && show.progress.watched > 0) {
            totalEpisodesWatched += show.progress.watched;
        }
        // Count fully-watched seasons from episode data if available
        if (show.seasons) {
            for (const season of show.seasons) {
                const eps = season.episodes || [];
                if (eps.length > 0) {
                    const watched = eps.filter((e: any) => e.status === 'WATCHED').length;
                    if (watched > 0 && watched === eps.length) totalSeasonsWatched++;
                }
            }
        }
        // Fallback: if show is fully WATCHED/DONE, count all its seasons
        if (totalSeasonsWatched === 0 && (show.status === 'WATCHED' || show.status === 'DONE') && show.seasons) {
            totalSeasonsWatched += show.seasons.length;
        }
    }

    // Sum runtime for all items in the filtered set
    // (the page's filter bar already narrows by status)
    const movieWatchTime = movies
        .reduce((acc, m) => acc + (m.runtime || 0), 0);

    const showWatchTime = shows
        .reduce((acc, s) => acc + (s.runtime || 0), 0);

    return {
        totalMovies: movies.length,
        totalShows: shows.length,
        totalSeasonsWatched,
        totalEpisodesWatched,
        totalWatchTimeMinutes: movieWatchTime + showWatchTime,
        statusCounts,
    };
}

// ─── Completion Metrics ─────────────────────────────────────

export function computeCompletionMetrics(shows: any[]): CompletionMetrics {
    const completed = shows.filter(s => s.status === 'WATCHED' || s.status === 'DONE').length;
    const inProgress = shows.filter(s => s.status === 'WATCHING').length;
    const onHold = shows.filter(s => s.status === 'ON HOLD').length;
    const willWatch = shows.filter(s => s.status === 'WILL WATCH').length;

    // Average completion rate based on episode progress
    let totalRate = 0;
    let countWithProgress = 0;
    for (const show of shows) {
        if (show.progress && show.progress.total > 0) {
            totalRate += (show.progress.watched / show.progress.total) * 100;
            countWithProgress++;
        }
    }

    return {
        completedSeries: completed,
        inProgressSeries: inProgress,
        onHoldSeries: onHold,
        willWatchSeries: willWatch,
        avgCompletionRate: countWithProgress > 0 ? Math.round(totalRate / countWithProgress) : 0,
    };
}

// ─── Episode Progress ───────────────────────────────────────

export function computeEpisodeProgress(shows: any[]): EpisodeProgressItem[] {
    return shows
        .filter(s => s.progress && s.progress.total > 0 && s.status === 'WATCHING')
        .map(s => ({
            id: s.id,
            title: s.title || s.name,
            watched: s.progress.watched,
            total: s.progress.total,
            percentage: Math.round((s.progress.watched / s.progress.total) * 100),
        }))
        .sort((a, b) => b.percentage - a.percentage);
}

// ─── Release Year Distribution ──────────────────────────────

export function computeReleaseYearDistribution(movies: any[], shows: any[]): DecadeEntry[] {
    const decadeMap: Record<string, number> = {};
    for (const item of [...movies, ...shows]) {
        if (item.year) {
            const decade = `${Math.floor(item.year / 10) * 10}s`;
            decadeMap[decade] = (decadeMap[decade] || 0) + 1;
        }
    }
    return Object.entries(decadeMap)
        .map(([decade, count]) => ({ decade, count }))
        .sort((a, b) => a.decade.localeCompare(b.decade));
}

// ─── Genre Distribution ─────────────────────────────────────

export function computeGenreDistribution(
    movies: any[],
    shows: any[],
    genreMap: Map<number, string>
): GenreEntry[] {
    const freq: Record<string, number> = {};
    for (const item of [...movies, ...shows]) {
        const ids: number[] = item.genre_ids || [];
        for (const gid of ids) {
            const name = genreMap.get(gid) || `Genre ${gid}`;
            freq[name] = (freq[name] || 0) + 1;
        }
    }
    return Object.entries(freq)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

// ─── Time-Based Trends (requires addedAt) ───────────────────

export function computeMonthlyAdditions(movies: any[], shows: any[]): MonthEntry[] {
    const monthMap: Record<string, number> = {};
    for (const item of [...movies, ...shows]) {
        if (item.addedAt) {
            const d = new Date(item.addedAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthMap[key] = (monthMap[key] || 0) + 1;
        }
    }
    return Object.entries(monthMap)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

// ─── Top Lists ──────────────────────────────────────────────

export function computeTopLists(movies: any[], shows: any[]) {
    // Recently added movies (by addedAt, fallback to array order)
    const recentMovies: TopListItem[] = [...movies]
        .sort((a, b) => {
            if (a.addedAt && b.addedAt) return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
            return 0;
        })
        .slice(0, 5)
        .map(m => ({ id: m.id, title: m.title, detail: `${m.year || 'N/A'}`, image: m.image }));

    // Recently completed TV
    const completedShows: TopListItem[] = shows
        .filter(s => s.status === 'WATCHED' || s.status === 'DONE')
        .sort((a, b) => {
            if (a.addedAt && b.addedAt) return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
            return 0;
        })
        .slice(0, 5)
        .map(s => ({ id: s.id, title: s.title || s.name, detail: `${s.total_episodes || '?'} episodes`, image: s.image }));

    // Longest series by total episodes
    const longestSeries: TopListItem[] = [...shows]
        .filter(s => s.total_episodes)
        .sort((a, b) => (b.total_episodes || 0) - (a.total_episodes || 0))
        .slice(0, 5)
        .map(s => ({ id: s.id, title: s.title || s.name, detail: `${s.total_episodes} episodes`, image: s.image }));

    return { recentMovies, completedShows, longestSeries };
}

// ─── Viewing Behavior ───────────────────────────────────────

export function computeViewingBehavior(movies: any[], shows: any[]) {
    // Movies with addedAt
    const datedMovies = movies.filter(m => m.addedAt && (m.status === 'WATCHED' || m.status === 'DONE'));

    let avgMoviesPerMonth = 0;
    if (datedMovies.length >= 2) {
        const dates = datedMovies.map(m => new Date(m.addedAt).getTime());
        const earliest = Math.min(...dates);
        const latest = Math.max(...dates);
        const months = Math.max(1, (latest - earliest) / (1000 * 60 * 60 * 24 * 30));
        avgMoviesPerMonth = +(datedMovies.length / months).toFixed(1);
    }

    // Total episodes remaining
    let totalEpisodesRemaining = 0;
    for (const show of shows) {
        if (show.progress && show.status === 'WATCHING') {
            totalEpisodesRemaining += Math.max(0, (show.progress.total || 0) - (show.progress.watched || 0));
        }
    }

    return { avgMoviesPerMonth, totalEpisodesRemaining };
}

// ─── Remaining Watch Time ───────────────────────────────────

export function computeRemainingWatchTime(movies: any[], shows: any[]) {
    // Movies: WILL WATCH → full runtime, WATCHING → full runtime (can't partial a movie)
    const movieMinutes = movies
        .filter(m => m.status === 'WILL WATCH' || m.status === 'WATCHING')
        .reduce((acc, m) => acc + (m.runtime || 0), 0);

    // Series: WILL WATCH → full runtime, WATCHING → remaining episodes * episode_runtime
    let seriesMinutes = 0;
    for (const show of shows) {
        if (show.status === 'WILL WATCH') {
            seriesMinutes += show.runtime || 0;
        } else if (show.status === 'WATCHING') {
            const epRuntime = show.episode_runtime || 0;
            const remaining = Math.max(0, (show.total_episodes || 0) - (show.progress?.watched || 0));
            seriesMinutes += epRuntime > 0 ? remaining * epRuntime : (show.runtime || 0);
        }
    }

    return {
        movieMinutes,
        seriesMinutes,
        totalMinutes: movieMinutes + seriesMinutes,
    };
}
