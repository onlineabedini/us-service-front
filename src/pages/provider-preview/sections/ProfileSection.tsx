//@collapse
import React from "react";
import { useTranslation } from "react-i18next";
import { Edit, Star, StarHalf, Calendar } from "lucide-react";
import { API_BASE_URL } from '@/config/api';
import AvailabilityCalendar from '@/components/global/availabilityCalendar';
import { useNavigate } from 'react-router-dom';
import StarRating from '@/components/global/StarRating';
import { getCookie } from '@/utils/authCookieService';

const baseUrl = API_BASE_URL;

type ProfileProps = {
    userData: any;
    setOpenSheet?: (value: boolean) => void;
    availability?: any;
    onBook?: () => void;
    isAuthChecking?: boolean;
    isClientLoggedIn?: boolean;
    clientAuthLoading?: boolean;
};

const ProfileSection: React.FC<ProfileProps> = ({ userData, setOpenSheet, availability, onBook, isAuthChecking = false, isClientLoggedIn = true, clientAuthLoading = false }) => {
    const { t } = useTranslation(); 
    const navigate = useNavigate();
    // Use provider rate from backend (new field) or fallback to legacy rating field
    const avgRating = userData.rate || userData.rating || 0;
    const isTopRated = avgRating >= 4.5;
    


    // Helper to normalize currency to SEK
    const displayCurrency = 'SEK';

    return (
        // Main background gradient
        <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-blue-500 min-h-[340px] flex flex-col items-center justify-center py-12 px-2">
            {/* Small back to marketplace link absolutely positioned at top left of profile card - transparent, light white text, cursor-pointer */}
            <div className="flex justify-start w-full z-20 max-w-7xl pb-2">
                <button
                    onClick={() => navigate('/marketPlace')}
                    className="text-sm text-white/80 hover:underline hover:text-white flex items-center gap-1 bg-transparent border-none p-0 m-0 shadow-none focus:outline-none cursor-pointer"
                    style={{ background: 'none' }}
                >
                    <span className="text-lg">&#8592;</span>
                    <span>{t('providerPreview.backToMarketplace')}</span>
                </button>
            </div>
            {/* Decorative blurred circle */}
            <div className="absolute -top-16 -left-16 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl z-0" />
            <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl z-0" />

            {/* Profile Card and Availability side by side, all centered */}
            <div className="relative z-10 w-full max-w-7xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between border border-white/40 gap-10 p-2 md:p-2">
                {/* Avatar left, big and centered - only show if profileImage exists */}
                {userData.profileImage && (
                    <div className="flex flex-col items-center justify-center md:items-center md:justify-center flex-shrink-0 ms-10">
                        <div className="relative group mb-4 md:mb-0 flex-shrink-0">
                            <img
                                src={userData.profileImage ? `${baseUrl}/${userData.profileImage}` : "/assets/img/provider.jpg"}
                                alt={t("profileImageAlt")}
                                className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300 bg-gray-100"
                            />
                            {setOpenSheet && (
                                <button
                                    onClick={() => setOpenSheet(true)}
                                    className="absolute bottom-2 right-2 p-2 rounded-full bg-white/90 shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
                                    title={t("edit")}
                                >
                                    <Edit className="w-5 h-5 text-teal-600" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Info and actions center */}
                <div className="flex flex-col items-center justify-center text-center gap-2 md:gap-4 w-full max-w-xl">
                    {/* Show name if available, fallback to username, hide if neither exists */}
                    {(userData.firstName || userData.lastName || userData.username) && (
                        <h1 className="text-gray-900 text-3xl md:text-4xl font-extrabold tracking-wide mb-1">
                            {userData.firstName && userData.lastName 
                                ? `${userData.firstName} ${userData.lastName}`
                                : userData.username || ''}
                        </h1>
                    )}
                    
                    {/* Star rating and average value */}
                    <div className="flex items-center justify-center gap-1 mb-1">
                        {/* Render stars based on avgRating */}
                        <StarRating rating={avgRating} />
                        <span className="ml-2 text-lg font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                    </div>
                    
                    {/* Hourly Rate, Book Now Button, and Bookmark Button in one row */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full mt-2 relative">
                        {/* Only show hourlyRate if exists and has value */}
                        {userData.hourlyRate && userData.hourlyRate > 0 && (
                            <div className="px-8 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-full shadow-md text-lg font-bold flex items-center gap-2">
                                <span>{t("hourlyRate")}: </span>
                                <span className="text-2xl font-extrabold">{userData.hourlyRate} SEK</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            {onBook && (
                                <div className="relative">
                                    <button
                                        onClick={onBook}
                                        disabled={isAuthChecking}
                                        className={`px-8 py-3 bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 text-white rounded-full shadow-xl text-lg font-extrabold flex items-center gap-3 hover:scale-105 hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-400 book-glow ${isAuthChecking ? 'opacity-75 cursor-not-allowed' : ''}`}
                                    >
                                        {isAuthChecking ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                        ) : (
                                            <Calendar className="w-6 h-6" />
                                        )}
                                        {isAuthChecking ? t("providerPreview.checkingAuth") : t("providerPreview.bookNow")}
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
                
                {/* Availability Calendar right - only show if availability exists */}
                {availability && Object.keys(availability).length > 0 && (
                    <div className="flex flex-col items-center justify-center w-full md:w-[440px]">
                        <AvailabilityCalendar value={availability} mode="view" />
                    </div>
                )}
            </div>
        </div>
    );
};

// Add custom glow animation style
<style>{`
.book-glow {
  box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7), 0 0 0 4px rgba(251, 191, 36, 0.2);
  animation: book-glow 2s infinite alternate;
}
@keyframes book-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7), 0 0 0 4px rgba(251, 191, 36, 0.2);
  }
  100% {
    box-shadow: 0 0 16px 8px rgba(236, 72, 153, 0.25), 0 0 0 12px rgba(251, 191, 36, 0.08);
  }
}
`}</style>

export default ProfileSection;
