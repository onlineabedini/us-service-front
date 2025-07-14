// Page Header Component - Provides consistent page headers across the application
import React from 'react';
import Container from '@/components/layout/container';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <Container>
        <div className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            {children && (
              <div className="flex items-center gap-4">
                {children}
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PageHeader; 