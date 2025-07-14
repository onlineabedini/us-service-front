// Marketplace Layout Component - For marketplace and provider search pages
import React from 'react';
import RootLayout from './RootLayout';

interface MarketplaceLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const MarketplaceLayout: React.FC<MarketplaceLayoutProps> = ({ children, className = '' }) => {
  return (
    <RootLayout className={className}>
      {/* Full-width marketplace content */}
      <div className="h-screen overflow-hidden">
        {children}
      </div>
    </RootLayout>
  );
};

export default MarketplaceLayout; 