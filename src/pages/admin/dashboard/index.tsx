import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCookie } from '../../../utils/authCookieService';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../services/admin.service';
import {
  FiUsers,
  FiUser,
  FiTrendingUp,
  FiCheckCircle,
  FiMail,
  FiRefreshCw,
  FiLoader,
  FiGlobe,
  FiMessageSquare,
  FiCalendar
} from 'react-icons/fi';

interface DashboardStats {
  totalProviders: number;
  totalClients: number;
  totalJobs: number;
  newRegistrations: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  pilotUsers: number;
  completedJobs: number;
  pendingJobs: number;
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Section: Load dashboard statistics on demand
  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const dashboardStats = await adminService.getDashboardStats();
      setStats(dashboardStats);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  // Section: Check admin permissions and auto-load on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      const token = getCookie('token');
      const providerId = getCookie('providerId');

      if (!token || !providerId) {
        navigate('/login/provider');
        return;
      }

      try {
        const hasPermission = await adminService.checkAdminPermissions(providerId);
        if (!hasPermission) {
          navigate('/');
          return;
        }

        // Section: Auto-load statistics on first visit
        await loadDashboardStats();
        setHasInitialLoad(true);
      } catch (err) {
        navigate('/login/provider');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  // Section: Enhanced StatCard component with hover effects
  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    bgColor,
    isCurrency = false,
    onClick
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
    isCurrency?: boolean;
    onClick?: () => void;
  }) => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      border: '1px solid #f1f5f9',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden'
    }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.borderColor = '#f1f5f9';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            color: '#64748b',
            fontSize: '15px',
            fontWeight: '600',
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </p>
          <h3 style={{
            color: '#1e293b',
            fontSize: '36px',
            fontWeight: '800',
            margin: '0',
            lineHeight: '1.1'
          }}>
            {isCurrency ? `${value.toLocaleString()} SEK` : value.toLocaleString()}
          </h3>
        </div>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          transition: 'all 0.3s ease',
          flexShrink: 0,
          marginLeft: '16px'
        }}>
          <Icon size={28} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '48px', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Section: Header with enhanced styling */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          padding: '32px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #f1f5f9'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              margin: '0 0 12px 0',
              color: '#1e293b',
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {t('admin.dashboard.title')}
            </h1>
            <p style={{
              margin: '0',
              color: '#64748b',
              fontSize: '17px',
              fontWeight: '500'
            }}>
              {!hasInitialLoad ? t('admin.dashboard.loadingDashboard') : t('admin.dashboard.clickRefreshToUpdate')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={loadDashboardStats}
              disabled={loading}
              style={{
                padding: '14px 28px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #4fd1c5 0%, #14b8a6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px',
                boxShadow: '0 4px 12px rgba(20,184,166,0.20)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(20,184,166,0.30)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(20,184,166,0.20)';
                }
              }}
            >
              <FiRefreshCw size={22} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? t('admin.dashboard.loading') : (hasInitialLoad ? t('admin.dashboard.refreshStatistics') : t('admin.dashboard.loadStatistics'))}
            </button>
            <a
              href="https://crisp.chat/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(99,102,241,0.20)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.30)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.20)';
              }}
            >
              <FiMessageSquare size={22} />
              {t('admin.dashboard.crispChat')}
            </a>
          </div>
        </div>

        {/* Section: Error display */}
        {error && (
          <div style={{
            color: '#dc2626',
            padding: '20px 24px',
            background: '#fef2f2',
            borderRadius: '12px',
            marginBottom: '32px',
            border: '1px solid #fecaca',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        {/* Section: No data state */}
        {!stats && !loading && hasInitialLoad && (
          <div style={{
            textAlign: 'center',
            padding: '100px 40px',
            background: 'white',
            borderRadius: '20px',
            border: '2px dashed #cbd5e1',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <FiTrendingUp size={64} style={{ color: '#64748b', marginBottom: '24px' }} />
            <div style={{ fontSize: '20px', color: '#64748b', marginBottom: '12px', fontWeight: '600' }}>{t('admin.dashboard.noDataAvailable')}</div>
            <div style={{ fontSize: '16px', color: '#94a3b8' }}>{t('admin.dashboard.clickRefreshToReload')}</div>
          </div>
        )}

        {/* Section: Loading state */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '100px 40px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <FiLoader size={64} style={{ animation: 'spin 1s linear infinite', color: '#14b8a6' }} />
            <div style={{ fontSize: '20px', color: '#64748b', marginTop: '24px', fontWeight: '600' }}>{t('admin.dashboard.loadingDashboardStatistics')}</div>
          </div>
        )}

        {/* Section: Statistics grid */}
        {stats && !loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px',
            marginBottom: '48px'
          }}>
            <StatCard
              title={t('admin.dashboard.totalProviders')}
              value={stats.totalProviders}
              icon={FiUser}
              color="#3b82f6"
              bgColor="#dbeafe"
              onClick={() => navigate('/admin/providers')}
            />
            <StatCard
              title={t('admin.dashboard.totalClients')}
              value={stats.totalClients}
              icon={FiUsers}
              color="#8b5cf6"
              bgColor="#ede9fe"
              onClick={() => navigate('/admin/clients')}
            />
            <StatCard
              title={t('admin.dashboard.totalJobs')}
              value={stats.totalJobs}
              icon={FiCalendar}
              color="#f59e0b"
              bgColor="#fef3c7"
              onClick={() => navigate('/admin/jobs')}
            />
            <StatCard
              title={t('admin.dashboard.completedJobs')}
              value={stats.completedJobs}
              icon={FiCheckCircle}
              color="#10b981"
              bgColor="#d1fae5"
              onClick={() => navigate('/admin/jobs?status=completed')}
            />
            <StatCard
              title={t('admin.dashboard.pendingJobs')}
              value={stats.pendingJobs}
              icon={FiCalendar}
              color="#f97316"
              bgColor="#fed7aa"
              onClick={() => navigate('/admin/jobs?status=pending')}
            />
            <StatCard
              title={t('admin.dashboard.newRegistrations')}
              value={stats.newRegistrations}
              icon={FiTrendingUp}
              color="#10b981"
              bgColor="#d1fae5"
              onClick={() => navigate('/admin/clients?filter=new')}
            />
            <StatCard
              title={t('admin.dashboard.verifiedUsers')}
              value={stats.verifiedUsers}
              icon={FiCheckCircle}
              color="#059669"
              bgColor="#d1fae5"
              onClick={() => navigate('/admin/clients?filter=verified')}
            />
            <StatCard
              title={t('admin.dashboard.unverifiedUsers')}
              value={stats.unverifiedUsers}
              icon={FiMail}
              color="#f59e0b"
              bgColor="#fef3c7"
              onClick={() => navigate('/admin/clients?filter=unverified')}
            />
            <StatCard
              title={t('admin.dashboard.pilotUsers')}
              value={stats.pilotUsers}
              icon={FiUsers}
              color="#14b8a6"
              bgColor="#ccfbf1"
              onClick={() => navigate('/admin/providers?filter=pilot')}
            />
          </div>
        )}

        {/* Section: Action buttons with enhanced styling */}
        <div style={{
          marginTop: '40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px'
        }}>
          <button
            onClick={() => navigate('/admin/providers')}
            style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(59,130,246,0.20)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.30)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.20)';
            }}
          >
            <FiUser size={20} />
            {t('admin.navigation.providers')}
          </button>
          <button
            onClick={() => navigate('/admin/clients')}
            style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(139,92,246,0.20)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.30)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.20)';
            }}
          >
            <FiUsers size={20} />
            {t('admin.navigation.clients')}
          </button>
          <button
            onClick={() => navigate('/admin/jobs')}
            style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(245,158,11,0.20)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.30)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.20)';
            }}
          >
            <FiCalendar size={20} />
            {t('admin.navigation.jobs')}
          </button>
          <button
            onClick={() => navigate('/admin/locales')}
            style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(20,184,166,0.20)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(20,184,166,0.30)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(20,184,166,0.20)';
            }}
          >
            <FiGlobe size={20} />
            {t('admin.dashboard.manageTranslations')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 