import React, { useState, useEffect, useMemo } from 'react';
import { Container, Button } from 'react-bootstrap';
import {
    BarChart3, Film, Tv, Clock, TrendingUp, Layers,
    ListChecks, Trophy, CalendarDays, Clapperboard, Lightbulb
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { getDailyQuote } from '../data/quotes';
import { fetchGenreMap } from '../services/tmdb';
import {
    computeOverviewStats,
    computeCompletionMetrics,
    computeEpisodeProgress,
    computeReleaseYearDistribution,
    computeGenreDistribution,
    computeMonthlyAdditions,
    computeTopLists,
    computeViewingBehavior,
} from '../services/analytics';

import { FilterType, StatusFilter, STATUS_COLOR_MAP } from '../types';

// ─── Stat Card ──────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
    return (
        <div className="card border-0 shadow-sm p-3 d-flex flex-column gap-1" style={{ flex: '1 1 140px', minWidth: '140px' }}>
            <div className="d-flex align-items-center gap-2 mb-1">
                <Icon size={14} className="text-secondary" />
                <span className="text-secondary font-mono text-uppercase fw-bold" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>{label}</span>
            </div>
            <span className="fw-bold font-mono text-body" style={{ fontSize: '22px', lineHeight: 1.1 }}>{value}</span>
            {sub && <span className="text-secondary font-mono" style={{ fontSize: '10px' }}>{sub}</span>}
        </div>
    );
}

// ─── Horizontal Stacked Bar ─────────────────────────────────

function StatusBar({ statusCounts, total }: { statusCounts: Record<string, number>; total: number }) {
    if (total === 0) return null;
    const ordered = ['WATCHING', 'WILL WATCH', 'WATCHED', 'DONE', 'ON HOLD'];
    const segments = ordered
        .filter(s => statusCounts[s])
        .map(s => ({ status: s, count: statusCounts[s], pct: (statusCounts[s] / total) * 100 }));

    // merge WATCHED + DONE
    const merged: { status: string; count: number; pct: number }[] = [];
    let watchedPct = 0, watchedCount = 0;
    for (const seg of segments) {
        if (seg.status === 'WATCHED' || seg.status === 'DONE') {
            watchedPct += seg.pct;
            watchedCount += seg.count;
        } else {
            merged.push(seg);
        }
    }
    if (watchedCount > 0) merged.push({ status: 'WATCHED', count: watchedCount, pct: watchedPct });
    merged.sort((a, b) => b.pct - a.pct);

    return (
        <div>
            <div className="d-flex rounded overflow-hidden" style={{ height: '10px', gap: '2px' }}>
                {merged.map(seg => (
                    <div
                        key={seg.status}
                        style={{
                            width: `${seg.pct}%`,
                            backgroundColor: STATUS_COLOR_MAP[seg.status] || '#6c757d',
                            borderRadius: '4px',
                            minWidth: seg.pct > 0 ? '4px' : '0',
                            transition: 'width 0.5s ease',
                        }}
                        title={`${seg.status}: ${seg.count}`}
                    />
                ))}
            </div>
            <div className="d-flex flex-wrap gap-3 mt-2">
                {merged.map(seg => (
                    <div key={seg.status} className="d-flex align-items-center gap-1">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLOR_MAP[seg.status] || '#6c757d' }} />
                        <span className="font-mono text-secondary" style={{ fontSize: '10px' }}>{seg.status} ({seg.count})</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── CSS Bar Chart ──────────────────────────────────────────

function BarChart({ data, labelKey, valueKey, color }: { data: any[]; labelKey: string; valueKey: string; color: string }) {
    const max = Math.max(...data.map(d => d[valueKey]), 1);
    return (
        <div className="d-flex flex-column gap-2">
            {data.map((d, i) => (
                <div key={i} className="d-flex align-items-center gap-2">
                    <span className="font-mono text-secondary flex-shrink-0" style={{ fontSize: '11px', width: '60px', textAlign: 'right' }}>{d[labelKey]}</span>
                    <div className="flex-grow-1" style={{ height: '18px', backgroundColor: 'var(--struct-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${(d[valueKey] / max) * 100}%`,
                            height: '100%',
                            backgroundColor: color,
                            borderRadius: '4px',
                            transition: 'width 0.5s ease',
                            minWidth: d[valueKey] > 0 ? '4px' : '0',
                        }} />
                    </div>
                    <span className="font-mono text-body fw-medium flex-shrink-0" style={{ fontSize: '11px', width: '24px' }}>{d[valueKey]}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Progress Ring (CSS) ────────────────────────────────────

function ProgressRing({ percentage, size = 80, stroke = 6 }: { percentage: number; size?: number; stroke?: number }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg width={size} height={size} className="d-block">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--struct-hover)" strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke="#198754"
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
                className="font-mono fw-bold" fill="var(--base-text)" style={{ fontSize: '14px' }}>
                {percentage}%
            </text>
        </svg>
    );
}

// ─── Section Wrapper ────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="mb-5">
            <div className="d-flex align-items-center gap-2 mb-3">
                <Icon size={14} className="text-secondary" />
                <h3 className="text-secondary text-uppercase fw-bold m-0 font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>{title}</h3>
            </div>
            {children}
        </div>
    );
}

// ─── Top List ───────────────────────────────────────────────

function TopList({ items, emptyMsg }: { items: { id: number; title: string; detail: string; image?: string }[]; emptyMsg: string }) {
    if (items.length === 0) return <p className="text-secondary font-mono m-0" style={{ fontSize: '12px' }}>{emptyMsg}</p>;
    return (
        <div className="d-flex flex-column">
            {items.map((item, i) => (
                <div key={item.id} className="d-flex align-items-center gap-3 py-2 border-bottom border-secondary border-opacity-10">
                    <span className="text-secondary font-mono fw-medium flex-shrink-0" style={{ fontSize: '11px', width: '18px' }}>{i + 1}.</span>
                    {item.image && (
                        <div className="flex-shrink-0 rounded overflow-hidden bg-secondary bg-opacity-10" style={{ width: '28px', height: '42px' }}>
                            <img src={item.image} alt={item.title} className="w-100 h-100 object-fit-cover" />
                        </div>
                    )}
                    <div className="flex-grow-1 min-w-0">
                        <span className="font-mono text-body fw-medium text-truncate d-block" style={{ fontSize: '12px' }}>{item.title}</span>
                    </div>
                    <span className="text-secondary font-mono flex-shrink-0" style={{ fontSize: '10px' }}>{item.detail}</span>
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function Analytics() {
    const { 
        movies, 
        shows, 
        analyticsFilter: filter, 
        setAnalyticsFilter: setFilter, 
        analyticsStatusFilter: statusFilter, 
        setAnalyticsStatusFilter: setStatusFilter 
    } = useLibrary();
    const [genreMap, setGenreMap] = useState<Map<number, string>>(new Map());

    useEffect(() => {
        fetchGenreMap().then(setGenreMap);
    }, []);

    // Apply filters
    const filteredMovies = useMemo(() => {
        let m = filter === 'tv' ? [] : movies;
        if (statusFilter !== 'all') m = m.filter(x => x.status === statusFilter || (statusFilter === 'WATCHED' && x.status === 'DONE'));
        return m;
    }, [movies, filter, statusFilter]);

    const filteredShows = useMemo(() => {
        let s = filter === 'movies' ? [] : shows;
        if (statusFilter !== 'all') s = s.filter(x => x.status === statusFilter || (statusFilter === 'WATCHED' && x.status === 'DONE'));
        return s;
    }, [shows, filter, statusFilter]);

    // Compute all stats
    const overview = useMemo(() => computeOverviewStats(filteredMovies, filteredShows), [filteredMovies, filteredShows]);
    const completion = useMemo(() => computeCompletionMetrics(filteredShows), [filteredShows]);
    const episodeProgress = useMemo(() => computeEpisodeProgress(filteredShows), [filteredShows]);
    const decades = useMemo(() => computeReleaseYearDistribution(filteredMovies, filteredShows), [filteredMovies, filteredShows]);
    const genres = useMemo(() => computeGenreDistribution(filteredMovies, filteredShows, genreMap), [filteredMovies, filteredShows, genreMap]);
    const monthlyAdditions = useMemo(() => computeMonthlyAdditions(filteredMovies, filteredShows), [filteredMovies, filteredShows]);
    const topLists = useMemo(() => computeTopLists(filteredMovies, filteredShows), [filteredMovies, filteredShows]);
    const behavior = useMemo(() => computeViewingBehavior(filteredMovies, filteredShows), [filteredMovies, filteredShows]);

    const totalItems = overview.totalMovies + overview.totalShows;
    const watchDays = Math.floor(overview.totalWatchTimeMinutes / (24 * 60));
    const watchHours = Math.floor((overview.totalWatchTimeMinutes % (24 * 60)) / 60);

    const isEmpty = totalItems === 0;

    return (
        <Container className="py-3 px-4" style={{ maxWidth: '672px' }}>
            {/* Header */}
            <div className="mb-4 d-flex flex-column flex-sm-row align-items-start align-items-sm-baseline gap-1 gap-sm-2">
                <h1 className="fs-5 fw-bold font-mono text-body m-0">Analytics</h1>
                <p className="text-secondary font-mono m-0" style={{ fontSize: '12px' }}>Reflect on your watch history.</p>
            </div>

            {/* Mindfulness Reminder */}
            <div className="bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded p-3 d-flex align-items-start gap-3 mb-4">
                <Lightbulb className="text-primary mt-1 flex-shrink-0" size={16} />
                <div className="d-flex flex-column gap-1">
                    <p className="m-0 text-primary-emphasis fw-medium font-mono" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                        {getDailyQuote()}
                    </p>
                    <p className="m-0 text-primary text-uppercase font-mono opacity-75" style={{ fontSize: '9px', letterSpacing: '0.05em' }}>
                        Mindfulness Reminder
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="d-flex gap-2 mb-4 flex-wrap">
                <div className="d-flex gap-1">
                    {(['all', 'movies', 'tv'] as FilterType[]).map(f => (
                        <Button
                            key={f}
                            variant="light"
                            size="sm"
                            onClick={() => setFilter(f)}
                            className={`rounded font-mono px-3 py-1 filter-btn ${filter === f ? 'filter-btn-active' : ''}`}
                            style={{ fontSize: '11px' }}
                        >
                            {f === 'all' ? 'All' : f === 'movies' ? 'Movies' : 'TV Series'}
                        </Button>
                    ))}
                </div>
                <div className="d-flex gap-1">
                    {(['WATCHED', 'WATCHING', 'WILL WATCH', 'ON HOLD'] as StatusFilter[]).map(s => (
                        <Button
                            key={s}
                            variant="light"
                            size="sm"
                            onClick={() => setStatusFilter(s)}
                            className={`rounded font-mono px-2 py-1 filter-btn ${statusFilter === s ? 'filter-btn-active' : ''}`}
                            style={{ fontSize: '10px' }}
                        >
                            {s === 'all' ? 'All Status' : s}
                        </Button>
                    ))}
                </div>
            </div>

            {isEmpty ? (
                <div className="text-center py-5">
                    <BarChart3 size={32} className="text-secondary opacity-50 mb-3" />
                    <p className="text-secondary font-mono" style={{ fontSize: '13px' }}>
                        No data to analyze yet. Add some movies or series to see your stats.
                    </p>
                </div>
            ) : (
                <>
                    {/* Overview Stats */}
                    <Section title="Overview" icon={BarChart3}>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            <StatCard icon={Film} label="Movies" value={overview.totalMovies} />
                            <StatCard icon={Tv} label="Series" value={overview.totalShows} />
                            <StatCard icon={Clapperboard} label="Episodes" value={overview.totalEpisodesWatched} sub="watched" />
                            <StatCard icon={Clock} label="Watch Time" value={`${watchDays}d ${watchHours}h`} sub="estimated" />
                        </div>
                    </Section>

                    {/* Status Breakdown */}
                    <Section title="Status Breakdown" icon={Layers}>
                        <div className="card border-0 shadow-sm p-3">
                            <StatusBar statusCounts={overview.statusCounts} total={totalItems} />
                        </div>
                    </Section>

                    {/* Completion Metrics */}
                    {filter !== 'movies' && (
                        <Section title="Series Completion" icon={ListChecks}>
                            <div className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-4">
                                <ProgressRing percentage={completion.avgCompletionRate} />
                                <div className="d-flex flex-column gap-1 flex-grow-1">
                                    <div className="d-flex justify-content-between font-mono" style={{ fontSize: '12px' }}>
                                        <span className="text-secondary">Completed</span>
                                        <span className="text-body fw-medium">{completion.completedSeries}</span>
                                    </div>
                                    <div className="d-flex justify-content-between font-mono" style={{ fontSize: '12px' }}>
                                        <span className="text-secondary">In Progress</span>
                                        <span className="text-body fw-medium">{completion.inProgressSeries}</span>
                                    </div>
                                    <div className="d-flex justify-content-between font-mono" style={{ fontSize: '12px' }}>
                                        <span className="text-secondary">On Hold</span>
                                        <span className="text-body fw-medium">{completion.onHoldSeries}</span>
                                    </div>
                                    <div className="d-flex justify-content-between font-mono" style={{ fontSize: '12px' }}>
                                        <span className="text-secondary">Planned</span>
                                        <span className="text-body fw-medium">{completion.willWatchSeries}</span>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* Release Year Distribution */}
                    {decades.length > 0 && (
                        <Section title="Release Decade" icon={CalendarDays}>
                            <div className="card border-0 shadow-sm p-3">
                                <BarChart data={decades} labelKey="decade" valueKey="count" color="var(--accent-blue)" />
                            </div>
                        </Section>
                    )}

                    {/* Genre Analysis */}
                    {genres.length > 0 && (
                        <Section title="Top Genres" icon={Layers}>
                            <div className="card border-0 shadow-sm p-3">
                                <BarChart data={genres.slice(0, 8)} labelKey="name" valueKey="count" color="var(--accent-green)" />
                            </div>
                        </Section>
                    )}

                    {/* Episode Progress */}
                    {episodeProgress.length > 0 && filter !== 'movies' && (
                        <Section title="Episode Progress" icon={TrendingUp}>
                            <div className="card border-0 shadow-sm p-3 d-flex flex-column gap-3">
                                {episodeProgress.map(ep => (
                                    <div key={ep.id}>
                                        <div className="d-flex justify-content-between align-items-baseline mb-1">
                                            <span className="font-mono text-body fw-medium text-truncate" style={{ fontSize: '12px', maxWidth: '65%' }}>{ep.title}</span>
                                            <span className="font-mono text-secondary" style={{ fontSize: '10px' }}>{ep.watched}/{ep.total} ({ep.percentage}%)</span>
                                        </div>
                                        <div style={{ height: '6px', backgroundColor: 'var(--struct-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${ep.percentage}%`,
                                                height: '100%',
                                                backgroundColor: ep.percentage === 100 ? '#198754' : '#0d6efd',
                                                borderRadius: '3px',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                    </div>
                                ))}
                                {behavior.totalEpisodesRemaining > 0 && (
                                    <div className="text-secondary font-mono mt-1" style={{ fontSize: '10px' }}>
                                        {behavior.totalEpisodesRemaining} episodes remaining across all in-progress series
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Archive Growth */}
                    {monthlyAdditions.length > 0 && (
                        <Section title="Archive Growth" icon={TrendingUp}>
                            <div className="card border-0 shadow-sm p-3">
                                <BarChart data={monthlyAdditions} labelKey="label" valueKey="count" color="var(--accent-yellow)" />
                            </div>
                        </Section>
                    )}

                    {/* Top Lists */}
                    <Section title="Top Lists" icon={Trophy}>
                        <div className="d-flex flex-column gap-4">
                            {filter !== 'tv' && (
                                <div>
                                    <h4 className="font-mono text-body fw-medium mb-2" style={{ fontSize: '12px' }}>Recent Movies</h4>
                                    <div className="card border-0 shadow-sm p-3">
                                        <TopList items={topLists.recentMovies} emptyMsg="No movies yet." />
                                    </div>
                                </div>
                            )}
                            {filter !== 'movies' && (
                                <>
                                    <div>
                                        <h4 className="font-mono text-body fw-medium mb-2" style={{ fontSize: '12px' }}>Completed Series</h4>
                                        <div className="card border-0 shadow-sm p-3">
                                            <TopList items={topLists.completedShows} emptyMsg="No completed series yet." />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-mono text-body fw-medium mb-2" style={{ fontSize: '12px' }}>Longest Series</h4>
                                        <div className="card border-0 shadow-sm p-3">
                                            <TopList items={topLists.longestSeries} emptyMsg="No series with episode data." />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </Section>

                    {/* Viewing Behavior */}
                    {behavior.avgMoviesPerMonth > 0 && filter !== 'tv' && (
                        <Section title="Viewing Behavior" icon={TrendingUp}>
                            <div className="card border-0 shadow-sm p-3 d-flex flex-row gap-4 flex-wrap">
                                <div className="d-flex flex-column">
                                    <span className="font-mono fw-bold text-body" style={{ fontSize: '18px' }}>{behavior.avgMoviesPerMonth}</span>
                                    <span className="text-secondary font-mono" style={{ fontSize: '10px' }}>avg movies / month</span>
                                </div>
                            </div>
                        </Section>
                    )}
                </>
            )}

            {/* Footer */}
            <div className="d-flex align-items-center gap-3 py-4 opacity-50">
                <div className="flex-grow-1 bg-secondary" style={{ height: '1px' }}></div>
                <span className="text-uppercase font-mono text-secondary" style={{ fontSize: '9px', letterSpacing: '0.1em' }}>End of Analytics</span>
                <div className="flex-grow-1 bg-secondary" style={{ height: '1px' }}></div>
            </div>
        </Container>
    );
}
