//@collaps
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

// Sections
import ProfileSection from "./sections/ProfileSection";
import AvailabilitySection from "./sections/AvailabilitySection";
import PendingRequestsSection from "./sections/PendingRequestsSection";
import OverviewAndDetails from "./sections/OverviewAndDetails";
import ActivityAndAboutRow from "./sections/ActivityAndAboutRow";
import EditSheet from "./sections/EditSheet";
import BookingSheet from "../market-place/sections/BookingSheet";

// Other components
import Footer from "@/components/layout/footer";
import SimilarProviders from "@/components/global/similarProviders";
import { providerService } from "@/services/provider.service";
import { API_BASE_URL } from '@/config/api';
import { getCookie } from '@/utils/authCookieService';
import AuthPromptDialog from "@/components/global/AuthPromptDialog";
import { clientService } from "@/services/client.service";

// Types
import { Provider, ApiError } from "./types";

interface AuthenticatedUser {
  user: {
    id: string;
    [key: string]: any;
  };
}

const ProviderPage: React.FC = () => {
  const { t } = useTranslation();
  // gets provider id from url
  const { id: providerId } = useParams();
  // gets current user from local storage
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  // gets provider details from api
  const [providerDetails, setProviderDetails] = useState<Provider | null>(null);
  // gets edit sheet open from state
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  // gets has edit permission from state
  const [hasEditPermission, setHasEditPermission] = useState(false);
  // gets is loading from state
  const [isLoading, setIsLoading] = useState(true);
  // gets error from state
  const [error, setError] = useState<ApiError | null>(null);
  // gets is booking sheet open from state
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  // Add loading state for auth check
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  // Add client authentication state
  const [clientUser, setClientUser] = useState<any>(null);
  const [clientAuthLoading, setClientAuthLoading] = useState(true);
  const navigate = useNavigate();

  // Always fetch the latest provider data using providerId from cookies
  const getUserData = async () => {
    const providerId = getCookie('providerId');
    if (!providerId) {
      setCurrentUser(null);
      // Optionally, show a friendly message or redirect
      // navigate('/login/provider');
      return;
    }
    try {
      const response = await providerService.getProfile(providerId);
      setCurrentUser(response);
    } catch (error: any) {
      setCurrentUser(null);
      // Optionally, show a friendly message or redirect
      // navigate('/login/provider');
    }
  };

  // Short comment: Check if client is logged in and fetch data if available
  const getClientData = async () => {
    setClientAuthLoading(true);
    const clientId = getCookie('clientId');
    const token = getCookie('token');

    if (!clientId || !token) {
      setClientUser(null);
      setClientAuthLoading(false);
      return;
    }

    try {
      const response = await clientService.getClient(clientId);
      if (response && response.id) {
        setClientUser({ user: response, type: 'client' });
      } else {
        setClientUser(null);
      }
    } catch (error: any) {
      setClientUser(null);
    } finally {
      setClientAuthLoading(false);
    }
  };

  useEffect(() => {
    getUserData();
    getClientData();
  }, []);

  // fetches provider details from api
  const fetchProviderDetails = useCallback(async () => {
    if (!providerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/provider/${providerId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const providerData = await response.json();
      setProviderDetails(providerData);
    } catch (err) {
      const error = err as Error;
      setError({ message: error.message });
      toast.error(t("errorLoadingProvider"));
      console.error("[Provider Fetch Error]", error);
    } finally {
      setIsLoading(false);
    }
  }, [providerId, t]);

  useEffect(() => {
    fetchProviderDetails();
  }, [fetchProviderDetails]);

  useEffect(() => {
    if (currentUser?.user?.id && providerDetails?.id) {
      setHasEditPermission(currentUser.user.id === providerDetails.id);
    }
  }, [currentUser, providerDetails]);

  const handleProfileUpdateSuccess = () => fetchProviderDetails();

  const handleBookClick = async () => {
    setIsAuthChecking(true);
    try {
      const clientId = getCookie('clientId');
      const token = getCookie('token');

      if (!clientId || !token) {
        setShowAuthPrompt(true);
        return;
      }
      setIsBookingSheetOpen(true);
    } finally {
      setIsAuthChecking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>{t("loadingProvider")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-10 text-red-600">
          <p>{t("errorLoadingProvider")}</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!providerDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-10">
          <p>{t("providerPreview.providerNotFound")}</p>
        </div>
      </div>
    );
  }

  // Event Handlers
  const handleContactProvider = () => alert(t("contactingProvider", { name: providerDetails.firstName }));
  const handleRepeatServiceRequest = () => alert(t("repeatRequestAlert"));

  return (
    <div className="text-start">

      {/* Profile Section */}
      <ProfileSection
        userData={providerDetails}
        setOpenSheet={hasEditPermission ? setIsEditSheetOpen : undefined}
        availability={providerDetails.availability}
        onBook={handleBookClick}
        isAuthChecking={isAuthChecking}
        isClientLoggedIn={!!clientUser}
        clientAuthLoading={clientAuthLoading}
      />
      <Separator className="my-4" />

      {/* Attractive Login Prompt for Non-Logged In Clients */}
      {!clientAuthLoading && !clientUser && (
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="login-prompt-gradient w-full rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden animate-bounce-in">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full opacity-50"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold">{t("providerPreview.readyToBook", { name: providerDetails?.firstName })}</h2>
                </div>
                
                <p className="text-lg text-teal-100 mb-6 max-w-2xl">
                  {t("providerPreview.joinThousands")}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <div className="flex items-center gap-2 text-teal-100">
                    <svg className="w-5 h-5 text-teal-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{t("providerPreview.instantBooking")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-teal-100">
                    <svg className="w-5 h-5 text-teal-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{t("providerPreview.trackRequests")}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 min-w-[280px]">
                <button
                  onClick={() => navigate('/register/client')}
                  className="group relative bg-white text-teal-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-teal-50 hover:scale-105 hover:shadow-xl overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    {t("providerPreview.getStartedFree")}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={() => navigate('/login/client')}
                  className="group bg-transparent border-2 border-white/30 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-white/10 hover:border-white/50 hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    {t("providerPreview.alreadyHaveAccount")}
                  </span>
                </button>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-4 left-8 w-8 h-8 bg-white/10 rounded-full animate-pulse delay-1000"></div>
          </div>
        </div>
      )}

      {/* Animated Down Arrow to attract user attention */}
      <div className="flex justify-center my-2">
        <button
          className="animate-bounce text-teal-500 cursor-pointer focus:outline-none"
          onClick={() => {
            const infoSection = document.getElementById('info-section');
            if (infoSection) {
              infoSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          aria-label={t("providerPreview.scrollToInfo")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Main Content: Only left column, centered and full width */}
      <div id="info-section" className="container m-auto flex flex-col items-center justify-center w-full mt-8 gap-8">
        <div className="w-full max-w-7xl">
          {/* Short comment: Only show OverviewAndDetails if any of its sections have data */}
          {((providerDetails.description && providerDetails.description.trim() !== '') ||
            (Array.isArray(providerDetails.offeredServices) && providerDetails.offeredServices.length > 0) ||
            (Array.isArray(providerDetails.serviceArea) && providerDetails.serviceArea.length > 0)) && (
            <>
              <OverviewAndDetails
                description={providerDetails.description}
                offeredServices={providerDetails.offeredServices}
                serviceArea={providerDetails.serviceArea}
                onEdit={hasEditPermission ? () => setIsEditSheetOpen(true) : () => {}}
                canEdit={hasEditPermission}
              />
              <Separator className="my-8" />
            </>
          )}

          {/* Short comment: Fallback content if provider has minimal data */}
          {!((providerDetails.description && providerDetails.description.trim() !== '') ||
            (Array.isArray(providerDetails.offeredServices) && providerDetails.offeredServices.length > 0) ||
            (Array.isArray(providerDetails.serviceArea) && providerDetails.serviceArea.length > 0)) && (
            <div className="bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 rounded-3xl shadow-xl p-10 mb-10 border border-white/80">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {providerDetails.firstName || providerDetails.username || 'Provider'} Profile
                </h3>
                <p className="text-gray-600 mb-4">
                  This provider is setting up their profile. Check back soon for more details!
                </p>
                {hasEditPermission && (
                  <button
                    onClick={() => setIsEditSheetOpen(true)}
                    className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-2 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
                  >
                    Complete Profile
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Compact Login Prompt for Non-Logged In Users */}
          {!clientAuthLoading && !clientUser && (
            <div className="container mx-auto px-4">
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 border border-teal-200/50 shadow-sm mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-teal-800 mb-2">{t("providerPreview.readyToBook", { name: providerDetails?.firstName })}</h3>
                  <p className="text-sm text-teal-600 mb-4">{t("providerPreview.createAccountToBook")}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => navigate('/register/client')}
                      className="bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium py-2 px-6 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      {t("providerPreview.signUpFree")}
                    </button>
                    <button
                      onClick={() => navigate('/login/client')}
                      className="bg-transparent border border-teal-300 text-teal-700 text-sm font-medium py-2 px-6 rounded-lg hover:bg-teal-50 transition-all duration-200"
                    >
                      {t("login")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Short comment: Only show ActivityAndAboutRow if either section has data */}
          <ActivityAndAboutRow
            userData={providerDetails}
            onEdit={hasEditPermission ? () => setIsEditSheetOpen(true) : () => {}}
          />
        </div>
      </div>

      {/* Similar Providers & Footer */}
      <div className="max-w-7xl w-full mx-auto flex justify-center px-2">
          <SimilarProviders currentProviderId={providerId} />
      </div>

      {/* Edit Sheet Modal */}
      <EditSheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen} userData={providerDetails} onSaveSuccess={handleProfileUpdateSuccess} />

      {/* BookingSheet Modal - same as marketplace */}
      <BookingSheet
        open={isBookingSheetOpen}
        onOpenChange={setIsBookingSheetOpen}
        providerData={providerDetails}
        isGeneralRequest={false}
        onSuccess={() => {
          setIsBookingSheetOpen(false);
          toast.success(t("providerPreview.bookingRequestSent"));
        }}
      />

      <AuthPromptDialog
        open={showAuthPrompt}
        onOpenChange={setShowAuthPrompt}
      />

      <Footer />
    </div>
  );
};

export default ProviderPage;
