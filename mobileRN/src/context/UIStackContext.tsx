import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface UIElement {
  id: string;
  type: 'modal' | 'drawer' | 'overlay';
  priority: number;
}

interface UIStackContextType {
  activeElements: UIElement[];
  registerElement: (element: UIElement) => () => void;
  isTopmost: (id: string) => boolean;
}

const UIStackContext = createContext<UIStackContextType | undefined>(undefined);

export const UIStackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeElements, setActiveElements] = useState<UIElement[]>([]);

  const registerElement = useCallback((element: UIElement) => {
    setActiveElements((prev) => {
      // Avoid duplicates
      if (prev.some(e => e.id === element.id)) return prev;
      
      const next = [...prev, element];
      // Sort by priority descending, then by insertion order (newest last)
      return next.sort((a, b) => b.priority - a.priority);
    });

    return () => {
      setActiveElements((prev) => prev.filter((e) => e.id !== element.id));
    };
  }, []);

  const isTopmost = useCallback((id: string) => {
    return activeElements.length > 0 && activeElements[0].id === id;
  }, [activeElements]);

  const value = useMemo(() => ({
    activeElements,
    registerElement,
    isTopmost
  }), [activeElements, registerElement, isTopmost]);

  return (
    <UIStackContext.Provider value={value}>
      {children}
    </UIStackContext.Provider>
  );
};

export const useUIStack = () => {
  const context = useContext(UIStackContext);
  if (!context) {
    throw new Error('useUIStack must be used within a UIStackProvider');
  }
  return context;
};
