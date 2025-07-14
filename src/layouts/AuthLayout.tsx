// Authentication Layout Component - For login, register, and auth pages
import React from 'react';
import RootLayout from './RootLayout';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showLogo?: boolean;
  className?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title,
  description,
  showLogo = true,
  className = ''
}) => {
  return (
    <RootLayout className={className}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and header */}
          {showLogo && (
            <div className="text-center">
              <a href="/" className="group flex items-center justify-center mb-8">
                <span className="text-4xl font-extrabold">
                  <span className="text-teal-600 bg-gradient-to-r from-teal-500 to-teal-400 bg-clip-text text-transparent">
                    Vitago
                  </span>
                </span>
                <div className="ml-2 h-2 w-2 bg-gradient-to-tr from-teal-500 to-teal-400 rounded-full group-hover:animate-ping"></div>
              </a>
              
              {title && (
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                  {title}
                </h2>
              )}
              
              {description && (
                <p className="text-sm text-gray-600">
                  {description}
                </p>
              )}
            </div>
          )}
          
          {/* Auth form content */}
          <div className="bg-white shadow-xl rounded-2xl p-8">
            {children}
          </div>
        </div>
      </div>
    </RootLayout>
  );
};

export default AuthLayout; 