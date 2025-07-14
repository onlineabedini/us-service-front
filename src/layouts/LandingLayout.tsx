// Landing Layout Component - Full-width layout for landing pages without container restrictions
import React from 'react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import RootLayout from './RootLayout';

interface LandingLayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
  className?: string;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ 
  children, 
  showNavbar = true, 
  showFooter = true,
  className = ''
}) => {
  return (
    <RootLayout className={className}>
      {/* Sticky navbar at top - full width for landing pages */}
      {showNavbar && (
        <div className="sticky top-2 z-10">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <Navbar />
          </div>
        </div>
      )}
      
      {/* Full-width main content area - NO container restrictions */}
      <main className="flex-1 w-full">
        {children}
      </main>
      
      {/* Footer */}
      {showFooter && <Footer />}
    </RootLayout>
  );
};

export default LandingLayout;