import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookmarkedProvider } from '@/types/bookmark';
import { Button } from '@/components/ui/button';
import { Bookmark, ArrowLeft, UserPlus, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBookmarks } from '@/hooks/useBookmarks';
import { API_BASE_URL } from '@/config/api';
import ProgressiveImage from '@/components/global/ProgressiveImage';
import StarRating from '@/components/global/StarRating';
import BookmarkButton from '@/components/global/BookmarkButton';
import ProfileImage from '@/components/global/profileImage';
import { getCookie, removeCookie } from '@/utils/authCookieService';
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
} from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster, toast } from "sonner";
import ChangeLang from "@/components/global/changeLangDropdonw";

const baseUrl = API_BASE_URL;

// Loading skeleton component for provider cards
const ProviderCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
    <div className="relative h-64 bg-gray-200"></div>
    <div className="p-6 space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

// Provider card component matching marketplace design
const ProviderCard = ({ provider, onRemove }: { provider: BookmarkedProvider; onRemove: (providerId: string) => void }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/provider/${provider.id}`);
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
      {/* Provider Image with Gradient Overlay */}
      <div className="relative h-64 overflow-hidden" onClick={handleCardClick}>
        <ProgressiveImage
          src={`${baseUrl}/${provider.profileImage}`}
          alt={`${provider.firstName} ${provider.lastName}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* Provider Name and Rating Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white text-xl font-bold mb-2 group-hover:text-teal-200 transition-colors duration-300">
            {provider.firstName} {provider.lastName}
          </h3>
          <div className="flex items-center gap-1.5">
            <StarRating rating={provider.rate || 0} />
            <span className="text-white/90 text-xs hover:text-white transition-colors duration-300">
              ({(provider.rate || 0).toFixed(1)})
            </span>
          </div>
        </div>

        {/* Availability Badge */}
        {provider.isActive && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center gap-1 hover:bg-green-600 transition-colors duration-300">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            {t('marketplace.providerCard.available')}
          </div>
        )}

        {/* Remove Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(provider.id);
          }}
          className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-4" onClick={handleCardClick}>
        {/* Services */}
        {provider.offeredServices && provider.offeredServices.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {provider.offeredServices.slice(0, 3).map((service: string, index: number) => (
              <span
                key={index}
                className="bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 px-3 py-1 rounded-full text-xs font-medium"
              >
                {service}
              </span>
            ))}
            {provider.offeredServices.length > 3 && (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                +{provider.offeredServices.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Service Areas */}
        {provider.serviceArea && provider.serviceArea.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{provider.serviceArea.join(', ')}</span>
          </div>
        )}

        {/* Price Range */}
        {provider.hourlyRate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span>{t('marketplace.providerCard.priceRange')}: {provider.hourlyRate} {provider.currency}</span>
          </div>
        )}

        {/* View Profile Button */}
        <button
          onClick={handleCardClick}
          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
        >
          {t('marketplace.providerCard.viewProfile')}
        </button>
      </div>
    </div>
  );
};

const BookmarksPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bookmarkedProviders, loading, error, removeBookmark } = useBookmarks(clientId || '');
  
  // User state for sidebar
  const [userData, setUserData] = useState<any>(null);
  const [userType, setUserType] = useState<'client' | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check client login status
  useEffect(() => {
    const checkClientLogin = () => {
      const clientIdCookie = getCookie('clientId');
      const token = getCookie('token');
      
      if (clientIdCookie && token) {
        setUserType('client');
        // Fetch client data
        const fetchClientData = async () => {
          try {
            const response = await fetch(`${baseUrl}/api/clients/${clientIdCookie}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.ok) {
              const data = await response.json();
              setUserData({ user: data, type: 'client' });
            }
          } catch (error) {
            console.error('Error fetching client data:', error);
          }
        };
        fetchClientData();
      } else {
        // Redirect non-logged-in users to login page
        navigate('/login/client');
      }
    };

    checkClientLogin();
  }, [navigate]);

  const handleMouseEnter = () => setIsDropdownOpen(true);
  const handleMouseLeave = () => setIsDropdownOpen(false);

  const handleRemoveBookmark = async (providerId: string) => {
    try {
      await removeBookmark(providerId);
      toast.success(t('bookmarks.removedSuccessfully'));
    } catch (error) {
      toast.error(t('bookmarks.errorRemoving'));
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('bookmarks.errorTitle')}</h2>
          <p className="text-gray-600 mb-6">{t('bookmarks.errorMessage')}</p>
          <Button onClick={() => window.location.reload()} className="bg-teal-500 hover:bg-teal-600">
            {t('bookmarks.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarContent className="p-6 space-y-8">
          <SidebarGroup className="bg-white/90 rounded-2xl shadow-md p-4 mb-6">
            {/* Vitago Logo with gradient and animated dot */}
            <a href="/landing/client" className="group flex items-center justify-center mb-6 transition-transform hover:scale-105">
              <span className="text-3xl font-extrabold transition-all duration-300">
                <span className="text-teal-600 group-hover:text-teal-700 bg-gradient-to-r from-teal-500 to-teal-400 bg-clip-text text-transparent">Vitago</span>
              </span>
              <div className="ml-2 h-2 w-2 bg-gradient-to-tr from-teal-500 to-teal-400 rounded-full group-hover:animate-ping"></div>
            </a>

            {/* Profile Section - Only show for logged in clients */}
            {userData && userType === 'client' && (
              <div className="mb-5 relative">
                <div className="text-center">
                  <div
                    className="cursor-pointer inline-block"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <ProfileImage
                      imageUrl={userData.user.profileImage
                        ? `${baseUrl}/${userData.user.profileImage}`
                        : "/assets/img/client.jpg"}
                      username={(userData.user.username && userData.user.username !== "") ? userData.user.username : userData.user.firstName + " " + userData.user.lastName}
                      size="sm"
                      label="Client"
                      showUploadButton={false}
                    />
                  </div>
                  {isDropdownOpen && (
                    <div
                      className="absolute z-10 left-1/2 transform -translate-x-1/2 mt-2"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="bg-white shadow-lg rounded-lg py-2 w-48">
                        <div
                          onClick={() => navigate('/register/client?step=2')}
                          className="flex items-center px-4 py-2 text-sm text-teal-700 hover:bg-teal-50 cursor-pointer transition-colors duration-150"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h12"
                            />
                          </svg>
                          <span>Edit Profile</span>
                        </div>
                        <div
                          onClick={() => {
                            removeCookie('clientId');
                            removeCookie('token');
                            setUserData(null);
                            setUserType(null);
                            navigate("/");
                          }}
                          className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 cursor-pointer transition-colors duration-150"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          <span>Logout</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SidebarGroup>

          {/* Bookmarks Info Section */}
          <SidebarGroup className="bg-white/90 rounded-2xl shadow-md p-4 mb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <Bookmark className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{t('bookmarks.title')}</h3>
                  <p className="text-sm text-gray-600">{t('bookmarks.subtitle')}</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                                     <span className="text-sm font-medium">{t('bookmarks.totalBookmarks')}: {bookmarkedProviders.length}</span>
                </div>
              </div>
            </div>
          </SidebarGroup>

          {/* Quick Actions */}
          <SidebarGroup className="bg-white/90 rounded-2xl shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('bookmarks.quickActions')}</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/marketPlace')}
                className="w-full flex items-center gap-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                <UserPlus className="w-5 h-5" />
                {t('bookmarks.browseProviders')}
              </button>
              
              <button
                onClick={() => navigate('/latest-jobs')}
                className="w-full flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                <Clock className="w-5 h-5" />
                {t('bookmarks.myJobs')}
              </button>
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <main className="flex-1 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/marketPlace')}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('bookmarks.backToMarketplace')}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <Bookmark className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{t('bookmarks.myBookmarks')}</h1>
                  <p className="text-gray-600">{t('bookmarks.manageYourSavedProviders')}</p>
                </div>
              </div>
            </div>
            <ChangeLang />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {loading ? (
            // Loading state
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProviderCardSkeleton key={index} />
              ))}
            </div>
                     ) : bookmarkedProviders.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Bookmark className="w-12 h-12 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('bookmarks.noBookmarksTitle')}</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('bookmarks.noBookmarksDescription')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/marketPlace')}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  {t('bookmarks.browseProviders')}
                </button>
                <button
                  onClick={() => navigate('/latest-jobs')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  {t('bookmarks.viewMyJobs')}
                </button>
              </div>
            </div>
          ) : (
                         // Bookmarks grid
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {bookmarkedProviders.map((provider: BookmarkedProvider) => (
                 <ProviderCard
                   key={provider.id}
                   provider={provider}
                   onRemove={handleRemoveBookmark}
                 />
               ))}
             </div>
          )}
        </div>
      </main>

      <Toaster />
    </SidebarProvider>
  );
};

export default BookmarksPage; 