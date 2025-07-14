// Dashboard Layout Component - For client and provider dashboard pages
import React from 'react';
import PublicLayout from './PublicLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title,
  subtitle,
  className = ''
}) => {
  return (
    <PublicLayout className={className}>
      <div className="py-8">
        {/* Dashboard Header */}
        {(title || subtitle) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        {/* Dashboard Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {children}
        </div>
      </div>
    </PublicLayout>
  );
};

export default DashboardLayout; 