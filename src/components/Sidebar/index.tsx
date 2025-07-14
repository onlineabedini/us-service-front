// Section: Admin Panel Sidebar Component
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiGlobe, FiLogOut, FiUser, FiUsers, FiTrendingUp, FiCalendar, FiSettings } from 'react-icons/fi';
import { removeCookie } from '@/utils/authCookieService';
import { useTranslation } from 'react-i18next';

const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Handle logout
    const handleLogout = () => {
        removeCookie('token');
        navigate('/landing/provider');
    };

    const linkStyle = (path: string) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        color: location.pathname === path ? '#fff' : '#e0e0e0',
        backgroundColor: location.pathname === path ? '#14b8a6' : 'transparent',
        textDecoration: 'none',
        borderRadius: '4px',
        margin: '4px 0',
        transition: 'all 0.3s ease'
    });

    return (
        <div style={{
            width: 250,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            backgroundColor: '#2c3e50',
            padding: '20px',
            boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
            borderRight: '1px solid #34495e',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Vitago Logo */}
            <div 
                onClick={() => navigate('/landing/provider')}
                style={{ 
                    cursor: 'pointer',
                    marginBottom: '30px',
                    padding: '10px 0',
                    borderBottom: '1px solid #34495e'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1)', transition: 'all 0.3s ease' }}>
                    <span style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        color: '#4fd1c5',
                        transition: 'all 0.3s ease'
                    }}>
                        Vitago
                    </span>
                    <div style={{ 
                        position: 'relative',
                        marginLeft: '4px'
                    }}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: '#4fd1c5',
                            borderRadius: '50%',
                            filter: 'blur(4px)',
                            opacity: 0.5,
                            transition: 'all 0.3s ease'
                        }}></div>
                        <div style={{
                            position: 'relative',
                            height: '8px',
                            width: '8px',
                            backgroundColor: '#4fd1c5',
                            borderRadius: '50%',
                            animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                        }}></div>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <nav style={{ flex: 1 }}>
                <Link to="/admin" style={linkStyle('/admin')}>
                    <FiTrendingUp size={20} />
                    {t('admin.sidebar.dashboard')}
                </Link>
                <Link to="/admin/jobs" style={linkStyle('/admin/jobs')}>
                    <FiCalendar size={20} />
                    {t('admin.sidebar.jobs')}
                </Link>
                <Link to="/admin/providers" style={linkStyle('/admin/providers')}>
                    <FiUser size={20} />
                    {t('admin.sidebar.providers')}
                </Link>
                <Link to="/admin/clients" style={linkStyle('/admin/clients')}>
                    <FiUsers size={20} />
                    {t('admin.sidebar.clients')}
                </Link>
                <Link to="/admin/settings" style={linkStyle('/admin/settings')}>
                    <FiSettings size={20} />
                    {t('admin.sidebar.settings')}
                </Link>
            </nav>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    color: '#e0e0e0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    margin: '4px 0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    textAlign: 'left'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#34495e';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <FiLogOut size={20} />
                {t('admin.sidebar.logout')}
            </button>
        </div>
    );
};

export default Sidebar; 