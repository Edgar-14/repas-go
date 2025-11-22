'use client';

import { useState, useEffect } from 'react';

interface KeyboardState {
  isOpen: boolean;
  height: number;
}

export function useKeyboardHeight(): KeyboardState {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isOpen: false,
    height: 0,
  });

  useEffect(() => {
    // Only run on mobile devices
    if (typeof window === 'undefined' || window.innerWidth >= 768) {
      return;
    }

    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    let currentViewportHeight = initialViewportHeight;

    const handleViewportChange = () => {
      if (!window.visualViewport) return;

      const newHeight = window.visualViewport.height;
      const heightDifference = initialViewportHeight - newHeight;
      
      // Consider keyboard open if viewport height decreased by more than 150px
      const isKeyboardOpen = heightDifference > 150;
      
      setKeyboardState({
        isOpen: isKeyboardOpen,
        height: isKeyboardOpen ? heightDifference : 0,
      });

      currentViewportHeight = newHeight;
    };

    // Fallback for browsers without visualViewport support
    const handleResize = () => {
      if (window.visualViewport) return; // Use visualViewport if available

      const newHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - newHeight;
      const isKeyboardOpen = heightDifference > 150;
      
      setKeyboardState({
        isOpen: isKeyboardOpen,
        height: isKeyboardOpen ? heightDifference : 0,
      });
    };

    // Use Visual Viewport API if available (better for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize);
    }

    // Cleanup
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return keyboardState;
}