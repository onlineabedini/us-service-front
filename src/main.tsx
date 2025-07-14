import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.scss'
import { Provider } from 'react-redux'
import { store } from './store/store'
import './i18n'
import { i18nReady } from './i18n'

// Component that waits for i18n initialization
const I18nWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isI18nReady, setIsI18nReady] = React.useState(false);

  React.useEffect(() => {
    i18nReady.then(() => {
      setIsI18nReady(true);
    }).catch((error) => {
      console.error('Failed to initialize i18n:', error);
      // Still render the app even if i18n fails to initialize
      setIsI18nReady(true);
    });
  }, []);

  if (!isI18nReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e2e8f0',
            borderTop: '2px solid #0d9488',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading Vitago...
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <I18nWrapper>
          <App />
        </I18nWrapper>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
