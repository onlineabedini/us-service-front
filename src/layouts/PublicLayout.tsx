// Public Layout Component - For pages that need navbar and footer
import React from 'react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import RootLayout from './RootLayout';

interface PublicLayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
  className?: string;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ 
  children, 
  showNavbar = true, 
  showFooter = true,
  className = ''
}) => {
  return (
    <RootLayout className={className}>
      {/* Sticky navbar at top */}
      {showNavbar && (
        <div className="sticky top-2 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Navbar />
          </div>
        </div>
      )}
      
      {/* Main content area - centered and responsive */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      {showFooter && <Footer />}
    </RootLayout>
  );
};

export default PublicLayout; 