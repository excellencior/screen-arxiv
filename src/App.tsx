/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Movies from './pages/Movies';
import TV from './pages/TV';
import Search from './pages/Search';
import { LibraryProvider } from './context/LibraryContext';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <LibraryProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: 'font-mono text-body bg-body border shadow-sm',
          style: { fontSize: '13px', borderRadius: '12px', padding: '12px 20px' }
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="movies" element={<Movies />} />
            <Route path="tv" element={<TV />} />
            <Route path="search" element={<Search />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LibraryProvider>
  );
}


