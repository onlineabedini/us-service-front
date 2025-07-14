//@collapse
import React, { useEffect, useState, useCallback } from "react";
import { Toaster, toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import BookingSheet from "./BookingSheet";
import { API_BASE_URL } from '@/config/api';
import { providerService } from "@/services/provider.service";
import { getCookie, removeCookie } from '@/utils/authCookieService';
import { clientService } from '@/services/client.service';
import ProgressiveImage from '@/components/global/ProgressiveImage';
import AuthPromptDialog from "@/components/global/AuthPromptDialog";
import StarRating from '@/components/global/StarRating';
import BookmarkButton from '@/components/global/BookmarkButton';
import { marketPlaceRequiredFields } from '@/utils/requiredFieldsCheck';
const baseUrl = API_BASE_URL;

// Loading skeleton component for provider cards
const ProviderCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 animate-pulse">
    {/* Image skeleton */}
    <div className="h-64 bg-gray-200 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-300/50 to-transparent" />
    </div>
    
    {/* Content skeleton */}
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </div>
      
      {/* Description skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-3/4 bg-gray-200 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 rounded" />
      </div>
      
      {/* Tags skeleton */}
      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
        <div className="h-4 w-16 bg-gray-200 rounded-full" />
        <div className="h-4 w-20 bg-gray-200 rounded-full" />
        <div className="h-4 w-14 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

interface ProvidersListProps {
  provider: any;
}

const ProvidersList: React.FC<ProvidersListProps> = ({ provider }) => {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [openBookingSheet, setOpenBookingSheet] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(false);
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Short comment: State to track hovered provider for tooltip
  const [hoveredProviderId, setHoveredProviderId] = useState<string | null>(null);

  // Short comment: State to track tooltip position (above or below)
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Add intersection observer for lazy loading
  const [observedElements, setObservedElements] = useState<Set<string>>(new Set());

  // Short comment: Function to handle mouse enter on provider name
  const handleNameMouseEnter = (providerId: string) => {
    setHoveredProviderId(providerId);
  };

  // Short comment: Function to handle mouse leave on provider name
  const handleNameMouseLeave = () => {
    setHoveredProviderId(null);
  };

  // Short comment: Use clientId cookie for client authentication and data fetching
  const getClientData = async () => {
    const clientId = getCookie('clientId');
    const token = getCookie('token');

    if (!clientId || !token) {
      setCurrentUser(null);
      return;
    }

    try {
      const response = await clientService.getClient(clientId);
      if (response && response.id) {
        setCurrentUser(response);
      } else {
        setCurrentUser(null);
        removeCookie('clientId');
        removeCookie('token');
      }
    } catch (error: any) {
      setCurrentUser(null);
      removeCookie('clientId');
      removeCookie('token');
      toast.error(error.message || t('marketplace.errors.failedToFetchClientData'));
    }
  };

  useEffect(() => {
    getClientData();
    // Check client data every minute
    const interval = setInterval(getClientData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper to check if any filters are actually applied
  const hasActiveFilters = (providerFilters: any) => {
    // Check if any filter has a non-default value
    if (providerFilters.serviceArea && providerFilters.serviceArea.length > 0) return true;
    if (providerFilters.rating && providerFilters.rating > 0) return true;
    if (providerFilters.price && providerFilters.price > 0) return true;
    if (providerFilters.languages && providerFilters.languages.length > 0) return true;
    if (providerFilters.services && providerFilters.services.length > 0) return true;
    if (providerFilters.qualifies && providerFilters.qualifies.length > 0) return true;
    
    // Check availability filters
    if (providerFilters.availability) {
      const hasAvailabilityFilter = Object.values(providerFilters.availability).some((dayPeriods: any) =>
        Object.values(dayPeriods).some((isAvailable: any) => isAvailable === true)
      );
      if (hasAvailabilityFilter) return true;
    }
    
    return false;
  };

  // Helper to build a query string from our updated provider object
  const buildQueryString = (obj: any) => {
    return Object.keys(obj)
      .map((key) => {
        const value = obj[key];
        if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "")
        ) {
          return null;
        }
        // For arrays/objects, encode JSON if non-empty
        if (typeof value === "object") {
          if (Array.isArray(value)) {
            if (value.length === 0) {
              return null;
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(
              JSON.stringify(value)
            )}`;
          } else {
            if (Object.keys(value).length === 0) {
              return null;
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(
              JSON.stringify(value)
            )}`;
          }
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .filter(Boolean)
      .join("&");
  };

  // Main provider fetching function with filtering logic
  const fetchProviders = useCallback(async () => {
    try {
      let data;
      
      // Only apply filters if user has actually selected any
      if (hasActiveFilters(provider)) {
        const queryString = buildQueryString(provider);
        data = await providerService.fetchProviders(queryString);
      } else {
        // Fetch all providers without filters when no filters are applied
        data = await providerService.fetchProviders();
      }
      
      

      // Filter providers based on marketplace requirements and admin status
      const filteredProviders = data.filter((providerItem: any) => {
        // Exclude admin and super admin providers
        const isSuperAdmin = providerItem.email === 'vitago.swe@gmail.com';
        const isAdmin = providerItem.role === 'admin';
        if (isSuperAdmin || isAdmin) {
          return false;
        }
        

        // __dev


        // Check if provider meets marketplace requirements
        const meetsRequirements = marketPlaceRequiredFields(providerItem);
        return meetsRequirements;
      });
      
      setProviders(filteredProviders);
      setLoading(false);
    } catch (err: any) {
      setError(t('marketplace.errors.couldNotLoadProviders'));
      setLoading(false);
      toast.error(t('marketplace.errors.couldNotLoadProviders'));
    }
  }, [provider]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-provider-id');
            if (id) {
              setObservedElements((prev) => new Set([...prev, id]));
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    );

    // Observe all provider cards
    document.querySelectorAll('[data-provider-id]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [providers]);

  const handleCardClick = (providerItem: any) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/provider/${providerItem.id}`);
  };

  const handleBookClick = async (e: React.MouseEvent, providerItem: any) => {
    e.stopPropagation();
    setLoadingProvider(true);
    // Check client authentication before proceeding
    const clientId = getCookie('clientId');
    const token = getCookie('token');
    if (!clientId || !token) {
      setShowAuthPrompt(true);
      setLoadingProvider(false);
      return;
    }
    let providerWithEnablers = providerItem;
    // If serviceEnablers is missing or empty, fetch full profile
    if (!providerItem.serviceEnablers || providerItem.serviceEnablers.length === 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/provider/${providerItem.id}`);
        if (response.ok) {
          const data = await response.json();
          providerWithEnablers = { ...providerItem, ...data };
        }
      } catch (err) {
        // fallback to original providerItem
      }
    }
    setSelectedProvider(providerWithEnablers);
    setOpenBookingSheet(true);
    setLoadingProvider(false);
  };

  // Short comment: Function to handle card hover for non-logged in users
  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>, providerItem: any) => {
    if (!currentUser) {
      // Add a subtle visual indicator that login is required
      const card = e.currentTarget;
      card.style.transform = 'scale(1.02) translateY(-2px)';
      card.style.boxShadow = '0 20px 50px rgba(20, 184, 166, 0.3)';
    }
  };

  // Short comment: Function to handle card leave for non-logged in users
  const handleCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transform = '';
    card.style.boxShadow = '';
  };

  // Helper function to safely render HTML description
  const renderDescription = (description: string) => {
    // Fallback if no description
    if (!description) return <span>{t('marketplace.providerCard.noDescription')}</span>;
    return <span dangerouslySetInnerHTML={{ __html: description }} />;
  };

  // Short comment: Function to check card position and set tooltip placement
  const handleCardMouseEnter = (providerId: string, e: React.MouseEvent<HTMLDivElement>) => {
    setHoveredProviderId(providerId);
    // Check if there's enough space above, else show below
    const cardRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const tooltipHeight = 80; // Approximate tooltip height
    if (cardRect.top < tooltipHeight + 16) {
      setTooltipPosition('bottom');
    } else {
      setTooltipPosition('top');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto pt-10 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, index) => (
            <ProviderCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto pt-10 px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-8">
        {providers.map((providerItem: any) => (
          <div
            key={providerItem.id}
            data-provider-id={providerItem.id}
            className={`bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 cursor-pointer border border-gray-100 relative ${
              currentUser 
                ? 'hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(20,_184,_166,_0.7)] hover:border-teal-200' 
                : 'hover:scale-[1.01] hover:shadow-[0_10px_30px_rgba(20,_184,_166,_0.4)] hover:border-teal-300 card-login-required'
            }`}
            onClick={() => handleCardClick(providerItem)}
            onMouseEnter={(e) => {
              handleCardMouseEnter(providerItem.id, e);
              handleCardHover(e, providerItem);
            }}
            onMouseLeave={(e) => {
              handleNameMouseLeave();
              handleCardLeave(e);
            }}
          >
            {/* Card Header with Image */}
            <div className="relative h-64 overflow-hidden">
              {/* Lazy loaded provider image */}
              {observedElements.has(providerItem.id) ? (
                <ProgressiveImage
                  src={
                    providerItem.profileImage
                      ? `${baseUrl}/${providerItem.profileImage}`
                      : '/assets/img/provider.jpg'
                  }
                  alt={`${providerItem.firstName} ${providerItem.lastName}`}
                  className="w-full h-full object-cover transform scale-110 transition-transform duration-500 hover:scale-125"
                  placeholder="/assets/img/provider.jpg"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-100 transition-opacity duration-300 hover:from-black/90 hover:via-black/50" />
              
              {/* Bookmark button - positioned at top right overlay */}
              {currentUser && (
                <div className="absolute top-3 right-3 z-30">
                  <BookmarkButton
                    clientId={currentUser.id}
                    providerId={providerItem.id}
                    variant="overlay"
                  />
                </div>
              )}

              {/* Availability Badge */}
              {providerItem.isAvailable && (
                <div className={`absolute top-4 ${currentUser ? 'right-16' : 'right-4'} bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center gap-1 hover:bg-green-600 transition-colors duration-300`}>
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  {t('marketplace.providerCard.available')}
                </div>
              )}

              {/* Provider Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-0 transition-transform duration-300 hover:translate-y-[-4px]">
                <h3 className="text-lg font-bold text-white mb-1 drop-shadow-lg hover:text-teal-200 transition-colors duration-300">
                  {providerItem.firstName} {providerItem.lastName}
                </h3>
                <div className="flex items-center gap-1.5">
                  <StarRating rating={providerItem.rate || providerItem.rating || 0} />
                  <span className="text-white/90 text-xs hover:text-white transition-colors duration-300">({(providerItem.rate || providerItem.rating || 0).toFixed(1)})</span>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
              {/* Rate and Book Button Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-medium border border-teal-100 hover:bg-teal-100 transition-colors duration-300">
                    {providerItem.hourlyRate || "--"} SEK/hr
                  </span>
                </div>
                <button
                  onClick={(e) => handleBookClick(e, providerItem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full shadow-lg font-medium text-xs transition-all duration-200 hover:scale-105 hover:shadow-xl hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t('marketplace.providerCard.bookNow')}</span>
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-xs line-clamp-3 min-h-[2.5rem] mb-3 hover:text-gray-800 transition-colors duration-300">
                {renderDescription(providerItem.description)}
              </p>

              {/* Service Areas */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(providerItem.serviceArea) && providerItem.serviceArea.length > 0 ? (
                    providerItem.serviceArea.map((area: string, idx: number) => (
                      <span 
                        key={idx} 
                        className="px-2 py-0.5 bg-gradient-to-r from-teal-50 to-blue-50 text-teal-700 rounded-full text-[10px] font-medium border border-teal-100/50 hover:from-teal-100 hover:to-blue-100 hover:border-teal-200 transition-all duration-300"
                      >
                        {area}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full text-[10px] font-medium border border-gray-100 hover:bg-gray-100 transition-colors duration-300">
                      {t('marketplace.providerCard.noServiceArea')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BookingSheet
        open={openBookingSheet}
        onOpenChange={setOpenBookingSheet}
        providerData={selectedProvider}
        onSuccess={() => {
          setOpenBookingSheet(false);
          toast.success(t('marketplace.booking.bookingSuccess'));
        }}
      />

      <AuthPromptDialog
        open={showAuthPrompt}
        onOpenChange={setShowAuthPrompt}
      />
    </div>
  );
};

export default ProvidersList;
