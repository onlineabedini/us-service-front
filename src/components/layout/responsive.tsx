// Responsive Utility Component - Provides hooks and utilities for responsive behavior
import { useState, useEffect } from 'react';

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('xl');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1024) setBreakpoint('lg');
      else if (width < 1280) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
};

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

export const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkIsTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1024);
    };

    checkIsTablet();
    window.addEventListener('resize', checkIsTablet);
    return () => window.removeEventListener('resize', checkIsTablet);
  }, []);

  return isTablet;
}; 