import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

import { BackButtonProvider, useBackButton } from './context/BackButtonContext';

function AnimatedApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toasts } = useToasterStore();
  const TOAST_LIMIT = 3;

  // Limit number of active toasts to prevent screen crowding
  React.useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  // Hardware back button handling (Android) - Default fallback
  const handleBack = React.useCallback(() => {
    const homeRoutes = ['/', ''];
    if (homeRoutes.includes(location.pathname)) {
      const now = Date.now();
      const lastPress = (window as any).__lastBackPress || 0;

      if (now - lastPress < 2000) {
        CapApp.exitApp();
      } else {
        (window as any).__lastBackPress = now;
        toast('Press back again to exit', { duration: 2000 });
      }
    } else {
      navigate(-1);
    }
    return true;
  }, [location.pathname, navigate]);

  useBackButton(handleBack, -1); // Lowest priority
  
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
      <BackButtonProvider>
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
      </BackButtonProvider>
    </LibraryProvider>
  );
}