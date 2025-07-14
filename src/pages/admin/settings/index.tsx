// Section: Admin Settings Page with Translation Support and Language Selection
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCookie } from '../../../utils/authCookieService';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../services/admin.service';
import { FiSettings, FiGlobe, FiSave, FiUser, FiShield } from 'react-icons/fi';
import ChangeLang from '../../../components/global/changeLangDropdonw';

const AdminSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Section: Check admin permissions
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
        setLoading(false);
      } catch (err) {
        console.error('Error checking admin status:', err);
        navigate('/login/provider');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '18px', 
            color: '#64748b', 
            fontWeight: '500' 
          }}>
            {t('admin.common.loading')}...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section: Header */}
        <div style={{ 
          marginBottom: '40px',
          padding: '32px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #f1f5f9'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            margin: '0 0 12px 0', 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <FiSettings size={36} style={{ color: '#14b8a6' }} />
            {t('admin.settings.title')}
          </h1>
          <p style={{ 
            margin: '0', 
            color: '#64748b', 
            fontSize: '17px',
            fontWeight: '500'
          }}>
            {t('admin.settings.description')}
          </p>
        </div>

        {/* Section: Settings Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          
          {/* Language Settings Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiGlobe size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 4px 0'
                }}>
                  {t('admin.settings.languageSettings')}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: '0'
                }}>
                  {t('admin.settings.languageDescription')}
                </p>
              </div>
            </div>
            
            <div style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <label style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  {t('admin.settings.selectLanguage')}
                </label>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center'
              }}>
                <ChangeLang />
              </div>
            </div>
          </div>

          {/* Account Settings Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiUser size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 4px 0'
                }}>
                  {t('admin.settings.accountSettings')}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: '0'
                }}>
                  {t('admin.settings.accountDescription')}
                </p>
              </div>
            </div>
            
            <div style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#64748b',
                fontStyle: 'italic'
              }}>
                {t('admin.settings.comingSoon')}
              </div>
            </div>
          </div>

          {/* Translation Management Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiGlobe size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 4px 0'
                }}>
                  {t('admin.settings.translationManagement')}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: '0'
                }}>
                  {t('admin.settings.translationDescription')}
                </p>
              </div>
            </div>
            
            <div style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => navigate('/admin/locales')}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(139,92,246,0.20)',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.30)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.20)';
                }}
              >
                <FiGlobe size={20} />
                {t('admin.settings.openTranslationEditor')}
              </button>
            </div>
          </div>

          {/* Security Settings Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiShield size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 4px 0'
                }}>
                  {t('admin.settings.securitySettings')}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: '0'
                }}>
                  {t('admin.settings.securityDescription')}
                </p>
              </div>
            </div>
            
            <div style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#64748b',
                fontStyle: 'italic'
              }}>
                {t('admin.settings.comingSoon')}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 