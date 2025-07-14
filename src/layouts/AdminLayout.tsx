// Admin Layout Component - For admin panel with closable responsive sidebar
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiMenu, 
  FiX, 
  FiTrendingUp,
  FiCalendar, 
  FiUser, 
  FiUsers, 
  FiGlobe, 
  FiLogOut,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import RootLayout from './RootLayout';
import { removeCookie } from '@/utils/authCookieService';

const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+B or Cmd+B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
      // Escape to close sidebar on mobile
      if (event.key === 'Escape' && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, isMobile]);

  // Handle logout
  const handleLogout = () => {
    removeCookie('token');
    navigate('/landing/provider');
  };

  // Navigation items
  const navigationItems = [
    { path: '/admin', icon: FiTrendingUp, label: t('admin.sidebar.dashboard') },
    { path: '/admin/jobs', icon: FiCalendar, label: t('admin.sidebar.jobs') },
    { path: '/admin/providers', icon: FiUser, label: t('admin.sidebar.providers') },
    { path: '/admin/clients', icon: FiUsers, label: t('admin.sidebar.clients') },
    { path: '/admin/locales', icon: FiGlobe, label: t('admin.sidebar.editLocales') },
  ];

  const isActiveLink = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <RootLayout>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar Overlay (Mobile) */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            ${isMobile ? 'fixed' : 'relative'} 
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            ${isMobile ? 'z-30' : 'z-10'}
            w-64 bg-white shadow-lg border-r border-gray-200 transition-transform duration-300 ease-in-out
            flex flex-col h-full
          `}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-teal-600">Vitago</span>
              <div className="ml-2 h-2 w-2 bg-teal-500 rounded-full animate-pulse"></div>
            </div>
            
            {/* Close button for mobile */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActiveLink(item.path)
                    ? 'bg-teal-50 text-teal-700 border-r-2 border-teal-500'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'
                  }
                `}
                onClick={() => isMobile && setSidebarOpen(false)}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
            >
              <FiLogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Sidebar Toggle */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {sidebarOpen ? <FiChevronLeft size={20} /> : <FiMenu size={20} />}
                </button>
                
                {/* Page Title */}
                <h1 className="text-xl font-semibold text-gray-900">
                  Admin Panel
                </h1>
              </div>

              {/* Top Bar Actions */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="admin-shortcuts no-print">
        <div className="space-y-1">
          <div>Ctrl+B: Toggle sidebar</div>
          <div>Esc: Close (mobile)</div>
        </div>
      </div>
    </RootLayout>
  );
};

export default AdminLayout; 