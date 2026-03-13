import React, { createContext, useState, useContext, useEffect } from 'react';
import { FilterType, StatusFilter } from '../types';

export type LibraryContextType = {
  movies: any[];
  shows: any[];
  analyticsFilter: FilterType;
  analyticsStatusFilter: StatusFilter;
  setAnalyticsFilter: (f: FilterType) => void;
  setAnalyticsStatusFilter: (s: StatusFilter) => void;
  addMovie: (movie: any) => void;
  addShow: (show: any) => void;
  updateMovie: (id: number, data: any) => void;
  updateShow: (id: number, data: any) => void;
  removeMovie: (id: number) => void;
  removeShow: (id: number) => void;
  importData: (m: any[], s: any[]) => void;
};

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [movies, setMovies] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [analyticsFilter, setAnalyticsFilter] = useState<FilterType>('all');
  const [analyticsStatusFilter, setAnalyticsStatusFilter] = useState<StatusFilter>('all');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedMovies = localStorage.getItem('arxiv_movies');
    const savedShows = localStorage.getItem('arxiv_shows');
    const savedFilter = localStorage.getItem('arxiv_analytics_filter');
    const savedStatusFilter = localStorage.getItem('arxiv_analytics_status_filter');

    if (savedMovies) setMovies(JSON.parse(savedMovies));
    if (savedShows) setShows(JSON.parse(savedShows));
    if (savedFilter) setAnalyticsFilter(savedFilter as FilterType);
    if (savedStatusFilter) setAnalyticsStatusFilter(savedStatusFilter as StatusFilter);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('arxiv_movies', JSON.stringify(movies));
    }
  }, [movies, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('arxiv_shows', JSON.stringify(shows));
    }
  }, [shows, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('arxiv_analytics_filter', analyticsFilter);
    }
  }, [analyticsFilter, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('arxiv_analytics_status_filter', analyticsStatusFilter);
    }
  }, [analyticsStatusFilter, isLoaded]);

  const addMovie = (movie: any) => {
    if (!movies.find(m => m.id === movie.id)) {
      setMovies(prev => [...prev, { ...movie, addedAt: movie.addedAt || new Date().toISOString() }]);
    }
  };

  const addShow = (show: any) => {
    if (!shows.find(s => s.id === show.id)) {
      setShows(prev => [...prev, { ...show, addedAt: show.addedAt || new Date().toISOString() }]);
    }
  };

  const updateMovie = (id: number, data: any) => {
    setMovies(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  };

  const updateShow = (id: number, data: any) => {
    setShows(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const removeMovie = (id: number) => {
    setMovies(prev => prev.filter(m => m.id !== id));
  };

  const removeShow = (id: number) => {
    setShows(prev => prev.filter(s => s.id !== id));
  };

  const importData = (importedMovies: any[], importedShows: any[]) => {
    setMovies(importedMovies);
    setShows(importedShows);
  };

  return (
    <LibraryContext.Provider value={{ 
      movies, 
      shows, 
      analyticsFilter, 
      analyticsStatusFilter,
      setAnalyticsFilter,
      setAnalyticsStatusFilter,
      addMovie, 
      addShow, 
      updateMovie, 
      updateShow, 
      removeMovie, 
      removeShow, 
      importData 
    }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
};
