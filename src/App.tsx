import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Movies from './pages/Movies';
import TV from './pages/TV';
import Search from './pages/Search';
import Analytics from './pages/Analytics';
import SaveData from './pages/SaveData';
import { LibraryProvider } from './context/LibraryContext';
import { Toaster, toast, useToasterStore } from 'react-hot-toast';
import SwipeableToast from './components/SwipeableToast';

function AnimatedApp() {
  const location = useLocation();
  const { toasts } = useToasterStore();
  const TOAST_LIMIT = 3;

  // Limit number of active toasts to prevent screen crowding
  React.useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Analytics />} />
          <Route path="movies" element={<Movies />} />
          <Route path="tv" element={<TV />} />
          <Route path="search" element={<Search />} />
          <Route path="save-data" element={<SaveData />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <Toaster
        position="bottom-center"
        containerStyle={{
          bottom: 70, // Avoid bottom navigation bar
          left: 20,
          right: 20,
        }}
        toastOptions={{
          className: 'font-mono'
        }}
      >
        {(t) => <SwipeableToast t={t} />}
      </Toaster>
      <HashRouter>
        <AnimatedApp />
      </HashRouter>
    </LibraryProvider>
  );
}