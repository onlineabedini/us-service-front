import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/cookieMiddleware';

interface RegistrationMiddlewareProps {
    children: React.ReactNode;
    requireEmailVerified?: boolean;
    requireProfileComplete?: boolean;
    allowUnauthorized?: boolean;
}

const RegistrationMiddleware: React.FC<RegistrationMiddlewareProps> = ({
    children,
    requireEmailVerified = true,
    requireProfileComplete = true,
    allowUnauthorized = false,
}) => {
    const { user }: any = useUser();
    const userData = user?.user;
    const userType = user?.type;

    // If user is not logged in and the route requires authorization
    if (!userData && !allowUnauthorized) {
        return <Navigate to="/login/client" replace />;
    }

    // If user is logged in but email is not verified
    if (userData && !userData.isEmailVerified && requireEmailVerified) {
        return <Navigate to="/activation" replace />;
    }

    // Check if profile is complete for providers
    const isProfileComplete = (userData: any): boolean => {
        if (userType === 'provider') {
            return (
                userData.phoneNumber &&
                userData.description &&
                userData.hourlyRate &&
                userData.currency &&
                userData.languages?.length > 0 &&
                userData.offeredServices?.length > 0 &&
                userData.serviceArea?.length > 0
            );
        }
        return true;
    };

    // If profile is not complete and the route requires it
    if (userData && userType === 'provider' && requireProfileComplete) {
        if (userData.isEmailVerified && !isProfileComplete(userData)) {
            return <Navigate to="/register/provider?step=2" replace />;
        }
    }


    return <>{children}</>;
};

export default RegistrationMiddleware;