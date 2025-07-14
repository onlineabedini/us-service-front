import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCookie, removeCookie } from '@/utils/authCookieService';

// Types
interface User {
  id: string;
  type: 'client' | 'provider';
}

interface UserContextType {
  user: User | null;
  clearUser: () => void;
  checkAuth: () => boolean;
}

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Clear user data and cookies
  const clearUser = () => {
    setUser(null);
    removeCookie('token');
    removeCookie('clientId');
    removeCookie('providerId');
  };

  // Check authentication status
  const checkAuth = (): boolean => {
    const token = getCookie('token');
    const clientId = getCookie('clientId');
    const providerId = getCookie('providerId');

    if (!token) {
      clearUser();
      return false;
    }

    // Check if user is a client
    if (clientId) {
      setUser({ id: clientId, type: 'client' });
      return true;
    }

    // Check if user is a provider
    if (providerId) {
      setUser({ id: providerId, type: 'provider' });
      return true;
    }

    // If neither client nor provider is authenticated
    clearUser();
    return false;
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <UserContext.Provider value={{ user, clearUser, checkAuth }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = (WrappedComponent: React.ComponentType<any>, requiredUserType?: 'client' | 'provider') => {
  return (props: any) => {
    const { user, checkAuth } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
      const isAuthenticated = checkAuth();
      
      if (!isAuthenticated) {
        // Redirect to appropriate login page based on required user type
        if (requiredUserType === 'provider') {
          navigate('/login/provider');
        } else {
          navigate('/login/client');
        }
        return;
      }

      // Check if user type matches required type
      if (requiredUserType && user?.type !== requiredUserType) {
        if (user?.type === 'provider') {
          navigate('/login/provider');
        } else {
          navigate('/login/client');
        }
      }
    }, [user, requiredUserType]);

    return <WrappedComponent {...props} />;
  };
};
