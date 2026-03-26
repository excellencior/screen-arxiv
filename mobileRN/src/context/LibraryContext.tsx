import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TypeToggle, StatusToggle } from '../types';

const DEFAULT_TYPE_TOGGLE: TypeToggle = { movies: true, tv: true };
const DEFAULT_STATUS_TOGGLE: StatusToggle = { WATCHED: true, WATCHING: true, 'WILL WATCH': true, 'ON HOLD': true };

export type LibraryContextType = {
  movies: any[];
  shows: any[];
  typeToggle: TypeToggle;
  statusToggle: StatusToggle;
  setTypeToggle: (t: TypeToggle) => void;
  setStatusToggle: (s: StatusToggle) => void;
  addMovie: (movie: any) => void;
  addShow: (show: any) => void;
  updateMovie: (id: number, data: any) => void;
  updateShow: (id: number, data: any) => void;
  removeMovie: (id: number) => void;
  removeShow: (id: number) => void;
  importData: (m: any[], s: any[]) => void;
  isLoaded: boolean;
};

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [movies, setMovies] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [typeToggle, setTypeToggle] = useState<TypeToggle>(DEFAULT_TYPE_TOGGLE);
  const [statusToggle, setStatusToggle] = useState<StatusToggle>(DEFAULT_STATUS_TOGGLE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedMovies = await AsyncStorage.getItem('arxiv_movies');
        const savedShows = await AsyncStorage.getItem('arxiv_shows');
        const savedType = await AsyncStorage.getItem('arxiv_type_toggle');
        const savedStatus = await AsyncStorage.getItem('arxiv_status_toggle');

        if (savedMovies) setMovies(JSON.parse(savedMovies));
        if (savedShows) setShows(JSON.parse(savedShows));
        if (savedType) setTypeToggle(JSON.parse(savedType));
        if (savedStatus) setStatusToggle(JSON.parse(savedStatus));
      } catch (e) {
        console.error('Failed to load library data', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem('arxiv_movies', JSON.stringify(movies));
  }, [movies, isLoaded]);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem('arxiv_shows', JSON.stringify(shows));
  }, [shows, isLoaded]);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem('arxiv_type_toggle', JSON.stringify(typeToggle));
  }, [typeToggle, isLoaded]);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem('arxiv_status_toggle', JSON.stringify(statusToggle));
  }, [statusToggle, isLoaded]);

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
      movies, shows,
      typeToggle, statusToggle,
      setTypeToggle, setStatusToggle,
      addMovie, addShow,
      updateMovie, updateShow,
      removeMovie, removeShow,
      importData, isLoaded
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
