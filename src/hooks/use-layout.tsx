// Layout Management Hook - Provides utilities for layout and responsive behavior
import { useState, useEffect } from 'react';

export interface LayoutConfig {
  showNavbar?: boolean;
  showFooter?: boolean;
  showSidebar?: boolean;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centerContent?: boolean;
}

export const useLayout = (initialConfig: LayoutConfig = {}) => {
  const [config, setConfig] = useState<LayoutConfig>({
    showNavbar: true,
    showFooter: true,
    showSidebar: false,
    containerSize: 'xl',
    centerContent: true,
    ...initialConfig,
  });

  const updateConfig = (newConfig: Partial<LayoutConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return { config, updateConfig };
};

export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('xl');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;
      
      // Set breakpoint
      if (width < 640) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1024) setBreakpoint('lg');
      else if (width < 1280) setBreakpoint('xl');
      else setBreakpoint('2xl');

      // Set device types
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
  };
};

export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const combo = [
        event.ctrlKey && 'ctrl',
        event.metaKey && 'cmd',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        key
      ].filter(Boolean).join('+');

      if (shortcuts[combo] || shortcuts[key]) {
        event.preventDefault();
        (shortcuts[combo] || shortcuts[key])();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}; 