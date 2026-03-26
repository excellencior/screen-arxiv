import { useEffect, useCallback } from 'react';
import { useBackButton, BackPriorityValue } from '../context/BackButtonContext';
import { useUIStack } from '../context/UIStackContext';

export const useBackHandler = (
  id: string,
  onBack: () => boolean,
  priority: number | BackPriorityValue,
  enabled: boolean = true,
  type: 'modal' | 'drawer' | 'overlay' = 'modal'
) => {
  const { registerElement, isTopmost } = useUIStack();

  // Register with the UI stack for visibility and management
  useEffect(() => {
    if (!enabled) return;
    return registerElement({ id, type, priority });
  }, [id, type, priority, enabled, registerElement]);

  // Wrap the handler to ensure it only fires if it's the topmost relevant element
  // or if it explicitly wants to handle it regardless.
  const wrappedHandler = useCallback(() => {
    // If not enabled, don't handle
    if (!enabled) return false;
    
    // We can add logic here if we wanted to enforce that only the topmost element 
    // of a certain type handles the back button.
    // For now, we trust the BackButtonContext priority system.
    return onBack();
  }, [enabled, onBack]);

  // Register with the actual hardware back button listener
  useBackButton(wrappedHandler, priority, enabled);

  return { isTopmost: () => isTopmost(id) };
};
