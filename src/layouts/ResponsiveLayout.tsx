// Responsive Layout Component - Handles responsive behavior across different screen sizes
import React, { useState, useEffect } from 'react';
import RootLayout from './RootLayout';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children, className = '' }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <RootLayout className={className}>
      <div 
        className={`
          ${isMobile ? 'px-2' : isTablet ? 'px-4' : 'px-8'}
          transition-all duration-300
        `}
        data-mobile={isMobile}
        data-tablet={isTablet}
      >
        {children}
      </div>
    </RootLayout>
  );
};

export default ResponsiveLayout; 