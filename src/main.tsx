import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App.tsx';
import './index.css';

// Configure status bar for native platforms
if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Light });
  StatusBar.setBackgroundColor({ color: '#ffffff' });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
