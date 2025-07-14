// Root Layout Component - Provides basic structure for all pages
import React from 'react';
import { Toaster } from 'sonner';

interface RootLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 via-white to-teal-50 ${className}`}>
      {/* Global notification system */}
      <Toaster position="bottom-right" />
      
      {/* Main content container - always centered */}
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default RootLayout; 