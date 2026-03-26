import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Note: Handlers are now expected to be synchronous to avoid race conditions and 
// ensure Capacitor correctly identifies that the event has been handled.
type Handler = () => boolean;

interface BackButtonContextType {
  registerHandler: (handler: Handler, priority?: number) => () => void;
}

const BackButtonContext = createContext<BackButtonContextType | undefined>(undefined);

export const BackButtonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handlersRef = useRef<{ handler: Handler; priority: number }[]>([]);

  // We use a counter to ensure stable sorting for same-priority handlers
  const counterRef = useRef(0);

  const registerHandler = useCallback((handler: Handler, priority: number = 0) => {
    counterRef.current += 1;
    const entry = { handler, priority, order: counterRef.current };
    handlersRef.current.push(entry as any);
    
    // Sort by priority (descending) and then by order (descending - newest first)
    handlersRef.current.sort((a: any, b: any) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.order - a.order;
    });

    return () => {
      handlersRef.current = handlersRef.current.filter((h: any) => h !== entry);
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Use a synchronous listener to ensure immediate interception
    const listener = CapApp.addListener('backButton', (data) => {
      // Execute handlers in priority order
      for (const { handler } of handlersRef.current) {
        try {
          const handled = handler();
          if (handled === true) {
            return; // Stop propagation and prevent default
          }
        } catch (err) {
          console.error('Error in back button handler:', err);
        }
      }

      // Default behavior if not handled by any registered handler:
      // If the app can go back in WebView history, do it.
      // Otherwise, the default Capacitor behavior (exiting app) will happen 
      // ONLY IF we don't handle it in App.tsx.
      // Actually, since we register a listener, we MUST handle EVERYTHING.
      
      if (data.canGoBack) {
        window.history.back();
      } else {
        // This part is usually handled by the fallback handler in App.tsx 
        // with priority -1, but as a last resort:
        CapApp.exitApp();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return (
    <BackButtonContext.Provider value={{ registerHandler }}>
      {children}
    </BackButtonContext.Provider>
  );
};

export const useBackButton = (handler: Handler, priority: number = 0, enabled: boolean = true) => {
  const context = useContext(BackButtonContext);
  if (!context) {
    throw new Error('useBackButton must be used within a BackButtonProvider');
  }

  // Memoize the registration to avoid constant re-sorting
  useEffect(() => {
    if (!enabled) return;
    return context.registerHandler(handler, priority);
  }, [context, handler, priority, enabled]);
};

export const useBackButtonContext = () => {
  const context = useContext(BackButtonContext);
  if (!context) {
    throw new Error('useBackButtonContext must be used within a BackButtonProvider');
  }
  return context;
};
