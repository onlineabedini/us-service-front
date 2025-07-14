import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
} from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import ProvidersList from "./sections/provider-list";
import DefineAvailabilityCalendar from "./sections/DefineAvailabilityCalendar";
import BookingSheet from "./sections/BookingSheet";
import { prioritizedLanguages } from "../../lists/languages";
import { servicesList } from "../../lists/services";
import { UserPlus, Clock, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster, toast } from "sonner";
import ProfileImage from "@/components/global/profileImage";
import { API_BASE_URL } from '@/config/api';
import { clientService } from "@/services/client.service";
import { providerService } from "@/services/provider.service";
import { getCookie, removeCookie } from '@/utils/authCookieService';
import { Combobox } from "@/components/global/combobox";
import { StockholmAreas } from "@/lists/stockholmAreas";
import StarRating from '@/components/global/StarRating';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import ChangeLang from "@/components/global/changeLangDropdonw";

const baseUrl = API_BASE_URL;

// Define types
interface User {
  id: string;
  username: string;
  profileImage?: string;
}

interface UserContextType {
  user: { user: User; type: "provider" | "client" } | null;
  clearUser: () => void;
}

// Define day and period types for clarity
const daysOfWeekList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = typeof daysOfWeekList[number];
const periodsOfDayList = ["Morning", "Noon", "Afternoon", "Night"] as const;
type Period = typeof periodsOfDayList[number];

// Provider type now supports per-period availability
interface Provider {
  serviceArea: string[];
  rating: number;
  price: number;
  languages: string[];
  services: string[];
  qualifies: string[];
  availability: {
    [day in Day]: {
      [period in Period]: boolean;
    };
  };
}

interface FetchedProvider {
  id?: string;
  name?: string;
  profileImage?: string;
  [key: string]: any; // Allow additional properties from API
}

// --- Stockholm subareas for municipality expansion ---
const STOCKHOLM_MUNICIPALITY = "Stockholm";
const STOCKHOLM_SUBAREAS = [
  "Bromma",
  "Enskede-Årsta-Vantör",
  "Farsta",
  "Hägersten-Älvsjö",
  "Hässelby-Vällingby",
  "Kungsholmen",
  "Norrmalm",
  "Rinkeby-Kista",
  "Skarpnäck",
  "Skärholmen",
  "Södermalm",
  "Spånga-Tensta",
  "Östermalm"
];

// Add these helper functions at the top of the file, after the imports
const getDateForDay = (day: string): string => {
  const today = new Date();
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
  const currentDayIndex = today.getDay();
  const diff = dayIndex - currentDayIndex;
  const targetDate = new Date(today);
  
  // If the day has already passed this week, add 7 days to get next week's date
  if (diff < 0) {
    targetDate.setDate(today.getDate() + diff + 7);
  } else {
    targetDate.setDate(today.getDate() + diff);
  }
  
  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isNextWeek = (day: string): boolean => {
  const today = new Date();
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
  const currentDayIndex = today.getDay();
  return dayIndex < currentDayIndex;
};

const isToday = (day: string): boolean => {
  const today = new Date();
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
  return dayIndex === today.getDay();
};

// Add debounce utility
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Helper function to translate day names
const translateDay = (day: string, t: any): string => {
  const dayMap: { [key: string]: string } = {
    'Mon': t('marketplace.providerCard.days.mon'),
    'Tue': t('marketplace.providerCard.days.tue'),
    'Wed': t('marketplace.providerCard.days.wed'),
    'Thu': t('marketplace.providerCard.days.thu'),
    'Fri': t('marketplace.providerCard.days.fri'),
    'Sat': t('marketplace.providerCard.days.sat'),
    'Sun': t('marketplace.providerCard.days.sun')
  };
  return dayMap[day] || day;
};

// Helper function to translate period names
const translatePeriod = (period: string, t: any): string => {
  const periodMap: { [key: string]: string } = {
    'Morning': t('marketplace.providerCard.periods.morning'),
    'Noon': t('marketplace.providerCard.periods.noon'),
    'Afternoon': t('marketplace.providerCard.periods.afternoon'),
    'Night': t('marketplace.providerCard.periods.night')
  };
  return periodMap[period] || period;
};

function MarketPlacePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userData, setUserData] = useState<any>(null);
  const [userType, setUserType] = useState<'client' | null>(null);

  // Add keyboard shortcut handler for sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        const sidebarTrigger = document.querySelector('[data-sidebar="trigger"]') as HTMLElement;
        if (sidebarTrigger) {
          sidebarTrigger.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add error boundary for sidebar state
  const [sidebarError, setSidebarError] = useState<string | null>(null);

  // Handle sidebar state errors
  const handleSidebarError = useCallback((error: Error) => {
    console.error('Sidebar error:', error);
    setSidebarError(error.message);
    // Reset sidebar state after error
    setTimeout(() => {
      setSidebarError(null);
    }, 3000);
  }, []);

  // Short comment: Check if client is logged in and fetch data if available
  useEffect(() => {
    const checkClientLogin = () => {
      const clientId = getCookie('clientId');
      const token = getCookie('token');

      if (!clientId || !token) {
        setUserData(null);
        setUserType(null);
        return;
      }

      // Fetch client data if logged in
      const fetchClientData = async () => {
        try {
          const response = await clientService.getClient(clientId);
          if (response && response.id) {
            setUserData({ user: response, type: 'client' });
            setUserType('client');
          } else {
            setUserData(null);
            setUserType(null);
            removeCookie('clientId');
            removeCookie('token');
          }
        } catch (error: any) {
          console.error('Failed to fetch client data:', error);
          setUserData(null);
          setUserType(null);
          removeCookie('clientId');
          removeCookie('token');
        }
      };
      fetchClientData();
    };

    checkClientLogin();
    // Check login status every minute
    const interval = setInterval(checkClientLogin, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  const [isGeneralRequestOpen, setIsGeneralRequestOpen] = useState(false);
  // Helper to create empty availability for all days/periods
  const createEmptyAvailability = () => {
    const emptyPeriods: { [period in Period]: boolean } = {
      Morning: false,
      Noon: false,
      Afternoon: false,
      Night: false,
    };
    const days: Provider["availability"] = {
      Mon: { ...emptyPeriods },
      Tue: { ...emptyPeriods },
      Wed: { ...emptyPeriods },
      Thu: { ...emptyPeriods },
      Fri: { ...emptyPeriods },
      Sat: { ...emptyPeriods },
      Sun: { ...emptyPeriods },
    };
    return days;
  };
  // Initial state for provider, now with nested availability
  const [provider, setProvider] = useState<Provider>({
    serviceArea: [],
    rating: 0,
    price: 0,
    languages: [],
    services: [],
    qualifies: [],
    availability: createEmptyAvailability(),
  });
  const [providers, setProviders] = useState<FetchedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);

  const languageOptions: string[] = prioritizedLanguages;
  const serviceOptions: string[] = servicesList;

  // Dropdown state for profile section
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  let timeoutId: NodeJS.Timeout | undefined;

  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutId = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  // Add local state for immediate UI updates
  const [localProvider, setLocalProvider] = useState<Provider>({
    serviceArea: [],
    rating: 0,
    price: 0,
    languages: [],
    services: [],
    qualifies: [],
    availability: createEmptyAvailability(),
  });

  // Use debounced local provider for API calls
  const debouncedLocalProvider = useDebounce(localProvider, 1000);

  // Update provider state when debounced value changes
  useEffect(() => {
    setProvider(debouncedLocalProvider);
  }, [debouncedLocalProvider]);

  // Modify handlers to update local state
  const debouncedHandleInputChange = useCallback((field: keyof Provider, value: any) => {
    setLocalProvider((prev) => ({ ...prev, [field]: value }));
  }, []);

  const debouncedHandleToggleChange = useCallback((field: keyof Provider) => {
    setLocalProvider((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const debouncedHandleArrayToggle = useCallback((field: keyof Provider, value: string) => {
    setLocalProvider((prev) => {
      const arr = prev[field] as string[];
      return arr.includes(value)
        ? { ...prev, [field]: arr.filter((item) => item !== value) }
        : { ...prev, [field]: [...arr, value] };
    });
  }, []);

  const debouncedHandleServiceAreaToggle = useCallback((area: string) => {
    setLocalProvider((prev) => {
      const newAreas = prev.serviceArea.includes(area)
        ? prev.serviceArea.filter(a => a !== area)
        : [...prev.serviceArea, area];
      return { ...prev, serviceArea: newAreas };
    });
  }, []);

  const debouncedHandleAvailabilityChange = useCallback(
    (newAvailability: Record<string, Record<string, boolean>>) => {
      setLocalProvider((prev) => ({
        ...prev,
        availability: newAvailability as Provider["availability"],
      }));
    },
    []
  );

  // State for managing the overall availability section collapse
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);

  // State for managing individual day collapses
  const [openDays, setOpenDays] = useState<Record<Day, boolean>>({
    Mon: false,
    Tue: false,
    Wed: false,
    Thu: false,
    Fri: false,
    Sat: false,
    Sun: false,
  });

  // Helper function to toggle individual day collapse
  const toggleDay = (day: Day) => {
    setOpenDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const getActiveFilters = (): string[] => {
    const filters: string[] = [];
    if (localProvider.serviceArea.length > 0) {
      localProvider.serviceArea.forEach(area => filters.push(`Service Area: ${area}`));
    }
    if (localProvider.rating > 0) filters.push(`Rating: ${localProvider.rating}★`);
    if (localProvider.price !== 0) filters.push(`Price: ${localProvider.price}`);
    localProvider.languages.forEach((lang) => filters.push(lang));
    localProvider.services.forEach((svc) => filters.push(svc));
    localProvider.qualifies.forEach((q) => filters.push(q));
    
    // Add availability filters
    Object.entries(localProvider.availability).forEach(([day, periods]) => {
      const availablePeriods = Object.entries(periods)
        .filter(([_, isAvailable]) => isAvailable)
        .map(([period, _]) => translatePeriod(period, t));
      
      if (availablePeriods.length > 0) {
        filters.push(`${translateDay(day, t)}: ${availablePeriods.join(', ')}`);
      }
    });
    
    return filters;
  };

  const activeFilters = getActiveFilters();

  // Add debounced provider state
  const debouncedProvider = useDebounce(provider, 1000);

  // Fetch providers for sidebar stats display (actual filtering is handled by ProvidersList component)
  const fetchProviders = useCallback(async () => {
    try {
      setIsFetching(true); // Set loading state before fetch
      const url = `${baseUrl}/provider`;
      const token = getCookie('token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });

      if (!res.ok) throw new Error('Failed to fetch providers');

      const text = await res.text();
      if (!text) {
        setProviders([]);
        setLoading(false);
        setIsFetching(false);
        return;
      }
      const data: FetchedProvider[] = JSON.parse(text);
      setProviders(data);
      setLoading(false);
      setIsFetching(false);
    } catch (err: any) {
      console.error(err);
      setError('Could not load providers.');
      setLoading(false);
      setIsFetching(false);
      toast.error(t('marketplace.errors.couldNotLoadProviders'));
    }
  }, []);

  // Add effect to trigger fetch when debounced provider changes
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // --- State for Stockholm municipality expansion in sidebar ---
  const [isStockholmExpanded, setIsStockholmExpanded] = useState(false);

  // Short comment: Function to handle My Jobs button click and show toast
  function handleMyJobsClick() {
    toast.info(t('marketplace.navigation.underDevelopment'));
  }

  const [showClearFiltersDialog, setShowClearFiltersDialog] = useState(false);

  // Update clearAllFilters to clear both states
  const clearAllFilters = useCallback(() => {
    const emptyState = {
      serviceArea: [],
      rating: 0,
      price: 0,
      languages: [],
      services: [],
      qualifies: [],
      availability: createEmptyAvailability(),
    };
    setLocalProvider(emptyState);
    setProvider(emptyState);
    setShowAllLanguages(false);
    setShowAllServices(false);
    setShowClearFiltersDialog(false);
    toast.success(t('marketplace.filters.allFiltersCleared'));
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      {sidebarError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {sidebarError}
        </div>
      )}
      {isFetching && (
        <div className="fixed top-4 right-4 bg-teal-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>{t('marketplace.filters.updatingResults')}</span>
        </div>
      )}
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

            {/* Profile Section - Show login prompt for non-logged in users, profile for logged in users */}
            {userData && userType === 'client' ? (
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
            ) : (
              // Login prompt for non-logged in users
              <div className="mb-5 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-4 border border-teal-200/50 shadow-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-teal-800 mb-2">{t('marketplace.loginPrompt.title')}</h3>
                  <p className="text-xs text-teal-600 mb-3">{t('marketplace.loginPrompt.description')}</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/register/client')}
                      className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200 hover:scale-105 shadow-sm"
                    >
                      {t('marketplace.loginPrompt.signUpFree')}
                    </button>
                    <button
                      onClick={() => navigate('/login/client')}
                      className="w-full bg-transparent border border-teal-300 text-teal-700 text-xs font-medium py-2 px-3 rounded-lg hover:bg-teal-50 transition-all duration-200"
                    >
                      {t('marketplace.loginPrompt.login')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </SidebarGroup>

          {/* Results & Choices Section - Moved to top */}
          <SidebarGroup className="bg-white/90 rounded-2xl shadow-md p-4 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">{t('marketplace.sidebar.yourChoices')}</h3>
                <p className="text-sm text-gray-600">{t('marketplace.sidebar.results')}: {providers.length}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.length > 0 ? (
                  <>
                    {activeFilters.map((choice, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-teal-200 to-teal-100 text-teal-900 px-3 py-1 rounded-full text-xs font-semibold shadow-sm animate-fade-in"
                      >
                        {choice}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowClearFiltersDialog(true)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02] mt-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('marketplace.sidebar.clearAllFilters')}
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic">{t('marketplace.sidebar.noFiltersSelected')}</p>
                )}
              </div>
            </div>
          </SidebarGroup>

          {/* Filter by Location Section */}
          <SidebarGroup className="bg-white/90 rounded-2xl shadow-md p-4 mb-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-teal-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M21 21l-4.35-4.35" /></svg>
                {t('marketplace.sidebar.filterByLocation')}
              </label>
              <Combobox label={undefined}>
                {/* --- Helper: Render a normal area item --- */}
                {StockholmAreas.map(area => {
                  if (area === STOCKHOLM_MUNICIPALITY) {
                    // --- Render the Stockholm expandable row ---
                    const isSelected = localProvider.serviceArea.includes(STOCKHOLM_MUNICIPALITY);
                    return (
                      <div className="flex flex-col" key={STOCKHOLM_MUNICIPALITY}>
                        <div
                          className={`flex items-center gap-2 p-2 border rounded-md transition-colors ${isSelected ? "bg-teal-50 border-teal-300" : "border-gray-300"}`}
                        >
                          <span
                            className="font-semibold flex-1 cursor-pointer"
                            onClick={() => debouncedHandleServiceAreaToggle(STOCKHOLM_MUNICIPALITY)}
                          >
                            {STOCKHOLM_MUNICIPALITY}
                          </span>
                          <span
                            className="ml-auto text-black flex items-center cursor-pointer px-1"
                            onClick={e => {
                              e.stopPropagation();
                              setIsStockholmExpanded(prev => !prev);
                            }}
                          >
                            {isStockholmExpanded ? (
                              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
                            ) : (
                              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                            )}
                          </span>
                          {isSelected && (
                            <button
                              type="button"
                              className="ml-2 text-red-500 hover:text-red-700 text-2xl px-2 py-0.5 rounded transition-transform hover:scale-125"
                              onClick={e => {
                                e.stopPropagation();
                                debouncedHandleServiceAreaToggle(STOCKHOLM_MUNICIPALITY);
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                        {isStockholmExpanded && (
                          <div className="ml-4 mt-1 flex flex-col gap-1">
                            {STOCKHOLM_SUBAREAS.map(subarea => {
                              const isSelected = localProvider.serviceArea.includes(subarea);
                              return (
                                <div
                                  key={subarea}
                                  className={`flex items-center gap-2 p-2 cursor-pointer border rounded-md hover:bg-gray-100 transition-colors ${isSelected ? "bg-teal-50 border-teal-300" : "border-gray-300"}`}
                                  onClick={() => debouncedHandleServiceAreaToggle(subarea)}
                                >
                                  <span>{subarea}</span>
                                  {isSelected && (
                                    <button
                                      type="button"
                                      className="ml-auto text-red-500 hover:text-red-700 text-2xl px-2 py-0.5 rounded transition-transform hover:scale-125"
                                      onClick={e => {
                                        e.stopPropagation();
                                        debouncedHandleServiceAreaToggle(subarea);
                                      }}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // --- Render a normal area item ---
                    const isSelected = localProvider.serviceArea.includes(area);
                    return (
                      <div
                        key={area}
                        className={`flex items-center gap-2 p-2 cursor-pointer border rounded-md hover:bg-gray-100 transition-colors ${isSelected ? "bg-teal-50 border-teal-300" : "border-gray-300"}`}
                        onClick={() => debouncedHandleServiceAreaToggle(area)}
                      >
                        <span>{area}</span>
                        {isSelected && (
                          <button
                            type="button"
                            className="ml-auto text-red-500 hover:text-red-700 text-2xl px-2 py-0.5 rounded transition-transform hover:scale-125"
                            onClick={e => {
                              e.stopPropagation();
                              debouncedHandleServiceAreaToggle(area);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  }
                })}
              </Combobox>
              {/* Show selected service areas as tags below combobox */}
              {localProvider.serviceArea.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {localProvider.serviceArea.map((area, index) => (
                    <span key={index} className="bg-gradient-to-r from-teal-200 to-teal-100 text-teal-900 px-3 py-1 rounded-full text-xs font-semibold shadow-sm animate-fade-in">
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </SidebarGroup>

          {/* Availability Section */}
          <SidebarGroup className="bg-white/90 rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsAvailabilityOpen(!isAvailabilityOpen)}
              >
                <label className="block text-lg font-semibold text-teal-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t('marketplace.sidebar.availability')}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const allAvailable = Object.keys(localProvider.availability).every(day =>
                        Object.values(localProvider.availability[day as Day]).every(period => period)
                      );
                      const newAvailability = Object.keys(localProvider.availability).reduce((acc, day) => ({
                        ...acc,
                        [day]: Object.keys(localProvider.availability[day as Day]).reduce((periodAcc, period) => ({
                          ...periodAcc,
                          [period]: !allAvailable
                        }), {})
                      }), {});
                      debouncedHandleAvailabilityChange(newAvailability);
                    }}
                    className="text-sm text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    {Object.keys(localProvider.availability).every(day =>
                      Object.values(localProvider.availability[day as Day]).every(period => period)
                    ) ? t('marketplace.sidebar.clearAll') : t('marketplace.sidebar.selectAll')}
                  </button>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 sidebar-arrow ${isAvailabilityOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {isAvailabilityOpen && (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(localProvider.availability).map(([day, periods]) => {
                      const allPeriodsSelected = Object.values(periods).every(period => period);
                      const isDayOpen = openDays[day as Day];
                      return (
                        <div 
                          key={day} 
                          onClick={() => {
                            const newPeriods = Object.keys(periods).reduce((acc, period) => ({
                              ...acc,
                              [period]: !allPeriodsSelected
                            }), {});
                            debouncedHandleAvailabilityChange({
                              ...localProvider.availability,
                              [day]: newPeriods
                            });
                          }}
                          className={`
                            bg-gray-50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer
                            ${allPeriodsSelected ? 'border-2 border-teal-500 bg-teal-50' : 'border-2 border-transparent'}
                            ${isToday(day) ? 'bg-gradient-to-r from-teal-100 to-teal-50 border-2 border-teal-400 shadow-md' : ''}
                          `}
                        >
                          <div 
                            className={`flex items-center justify-between mb-2 cursor-pointer ${isToday(day) ? 'bg-teal-100/80 rounded-lg p-2 border border-teal-200' : ''}`}
                          >
                            <span className={`text-base font-medium flex items-center gap-2 ${allPeriodsSelected ? 'text-teal-700' : 'text-gray-700'} ${isToday(day) ? 'text-teal-800 text-lg' : ''}`}>
                              <svg className={`w-4 h-4 ${isToday(day) ? 'w-5 h-5' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {translateDay(day, t)}
                              <span className={`text-xs flex items-center gap-1 ${isToday(day) ? 'text-teal-600 font-medium text-sm' : 'text-gray-500'}`}>
                                {getDateForDay(day)}
                                {isToday(day) && <span className="text-teal-500 font-semibold">({t('marketplace.providerCard.today')})</span>}
                                {isNextWeek(day) && <span className="text-teal-500">({t('marketplace.providerCard.nextWeek')})</span>}
                              </span>
                            </span>
                            <div className="flex items-center gap-2">
                              <svg
                                className={`w-5 h-5 text-gray-500 transition-transform duration-200 sidebar-arrow ${isDayOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDay(day as Day);
                                }}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          {isDayOpen && (
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(periods).map(([period, isAvailable]) => (
                                <button
                                  key={period}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    debouncedHandleAvailabilityChange({
                                      ...localProvider.availability,
                                      [day]: {
                                        ...periods,
                                        [period]: !isAvailable
                                      }
                                    });
                                  }}
                                  className={`
                                    relative flex items-center justify-center p-2 rounded-xl cursor-pointer transition-all
                                    ${isAvailable 
                                      ? 'bg-teal-100 text-teal-800 shadow-sm hover:shadow-md' 
                                      : 'bg-white text-gray-600 hover:bg-gray-100 hover:shadow-sm'
                                    }
                                  `}
                                >
                                  <span className="text-base">{translatePeriod(period, t)}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Color Legend - Moved to bottom and made compact */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-wrap gap-3 justify-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-teal-100 border-2 border-teal-500"></div>
                        <span className="text-xs text-gray-500">{t('marketplace.sidebar.colorLegend.selected')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-teal-100"></div>
                        <span className="text-xs text-gray-500">{t('marketplace.sidebar.colorLegend.available')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-gray-50 border border-gray-200"></div>
                        <span className="text-xs text-gray-500">{t('marketplace.sidebar.colorLegend.inactive')}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </SidebarGroup>

          {/* Stars (Rating) Section */}
          <SidebarGroup className="bg-white/90 rounded-2xl shadow-md p-4 mb-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-yellow-600 flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5 12 2" /></svg>
                {t('marketplace.sidebar.stars')}
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => debouncedHandleInputChange("rating", star)}
                    className={`text-2xl transition ${localProvider.rating >= star
                      ? "text-yellow-400 drop-shadow"
                      : "text-gray-300 hover:text-yellow-400"}`}
                    aria-label={`Set rating to ${star} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </SidebarGroup>

          {/* Price Section */}
          <SidebarGroup className="bg-white/90 rounded-2xl shadow-md p-4 mb-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-teal-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M17 5H7m10 7H7m10 7H7" /></svg>
                {t('marketplace.sidebar.price')}
              </label>
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={localProvider.price}
                onChange={(e) => debouncedHandleInputChange("price", Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <p className="text-xs text-gray-600">{t('marketplace.sidebar.current')}: {localProvider.price}</p>
            </div>
          </SidebarGroup>

          {/* Language Section */}
          <SidebarGroup className="bg-white/90 rounded-2xl shadow-md p-4 mb-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-teal-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20" /></svg>
                {t('marketplace.sidebar.language')}
              </label>
              {(showAllLanguages ? languageOptions : languageOptions.slice(0, 2)).map((lang) => (
                <label key={lang} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localProvider.languages.includes(lang)}
                    onChange={() => debouncedHandleArrayToggle("languages", lang)}
                    className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm">{lang}</span>
                </label>
              ))}
              {languageOptions.length > 2 && (
                <p
                  onClick={() => setShowAllLanguages(!showAllLanguages)}
                  className="text-xs text-teal-600 cursor-pointer hover:underline"
                >
                  {showAllLanguages ? t('marketplace.sidebar.seeLess') : t('marketplace.sidebar.seeMore')}
                </p>
              )}
            </div>
          </SidebarGroup>

          {/* Services Section */}
          <SidebarGroup className="bg-white/90 rounded-2xl shadow-md p-4 mb-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-purple-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3v4M8 3v4" /></svg>
                {t('marketplace.sidebar.services')}
              </label>
              {(showAllServices ? serviceOptions : serviceOptions.slice(0, 2)).map((svc) => (
                <label key={svc} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localProvider.services.includes(svc)}
                    onChange={() => debouncedHandleArrayToggle("services", svc)}
                    className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm">{svc}</span>
                </label>
              ))}
              {serviceOptions.length > 2 && (
                <p
                  onClick={() => setShowAllServices(!showAllServices)}
                  className="text-xs text-purple-600 cursor-pointer hover:underline"
                >
                  {showAllServices ? t('marketplace.sidebar.seeLess') : t('marketplace.sidebar.seeMore')}
                </p>
              )}
            </div>
          </SidebarGroup>

          {/* Fade-in animation for sidebar */}
          <style>{`
            @keyframes fade-in-sidebar {
              0% { opacity: 0; transform: translateX(-32px); }
              100% { opacity: 1; transform: translateX(0); }
            }
            .animate-fade-in-sidebar {
              animation: fade-in-sidebar 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
            }
            .animate-fade-in {
              animation: fade-in 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
            }
            @keyframes fade-in {
              0% { opacity: 0; transform: translateY(16px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            .sidebar-arrow {
              transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
            }
            .sidebar-arrow:hover {
              transform: scale(1.25);
            }
          `}</style>
        </SidebarContent>
      </Sidebar>

      {/* Main Content */}
      <main className="p-10">
        <nav className="flex items-center justify-between bg-white shadow-sm px-4 py-2">
          <div className="flex items-center gap-4">
            <SidebarTrigger 
              className="bg-gray-200 hover:bg-gray-100 p-5 rounded-md shadow transition"
              aria-label={t('marketplace.navigation.toggleSidebar')}
              data-sidebar="trigger"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </SidebarTrigger>
            {/* Language Switcher - ChangeLang component placed next to sidebar toggle */}
            <ChangeLang />
            {/* Active Filters Display */}
            {getActiveFilters().length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('marketplace.navigation.activeFilters')}:</span>
                <div className="flex flex-wrap gap-2">
                  {getActiveFilters().map((filter, index) => (
                    <span
                      key={index}
                      className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                    >
                      {filter}
                      <button
                        onClick={() => {
                          // Remove specific filter
                          const [category, value] = filter.split(': ');
                          switch (category) {
                            case 'Service Area':
                              debouncedHandleServiceAreaToggle(value);
                              break;
                            case 'Language':
                              debouncedHandleArrayToggle('languages', value);
                              break;
                            case 'Service':
                              debouncedHandleArrayToggle('services', value);
                              break;
                            case 'Price':
                              debouncedHandleInputChange('price', 0);
                              break;
                            case 'Rating':
                              debouncedHandleInputChange('rating', 0);
                              break;
                          }
                        }}
                        className="hover:text-teal-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Create General Job button - Only show if user is logged in as client */}
            {userData && userType === 'client' && (
              <button
                onClick={() => setIsGeneralRequestOpen(true)}
                className="group relative flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-[1.02] overflow-hidden"
              >
                <div className="relative flex items-center -space-x-2">
                  {providers.slice(0, 5).map((provider, index) => (
                    <Avatar
                      key={provider.id || index}
                      className={`w-8 h-8 border-2 border-white/80 transition-transform duration-300 group-hover:translate-x-${index} group-hover:scale-110`}
                    >
                      <AvatarImage
                        src={`${baseUrl}/${provider.profileImage}`}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-teal-400 text-white text-sm">
                        {provider.name?.slice(0, 2).toUpperCase() || "CN"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {providers.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-white/80 flex items-center justify-center text-sm font-medium">
                      +{providers.length - 5}
                    </div>
                  )}
                </div>
                <span className="font-semibold text-base whitespace-nowrap">
                  {t('marketplace.navigation.createGeneralJob')}
                </span>
                <UserPlus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600/0 via-teal-400/10 to-teal-600/0 group-hover:animate-shimmer" />
              </button>
            )}
            {/* My Jobs Button - Only show if user is logged in as client */}
            {userData && userType === 'client' && (
              <button
                onClick={() => navigate('/latest-jobs')}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-4 rounded transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                <Clock className="h-5 w-5" />
                {t('marketplace.navigation.myJobs')}
              </button>
            )}
            {/* Bookmarks Button - Only show if user is logged in as client */}
            {userData && userType === 'client' && (
              <button
                onClick={() => navigate(`/bookmarks/${userData.user.id}`)}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-4 rounded transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                <Bookmark className="h-5 w-5" />
                {t('marketplace.navigation.bookmarks')}
              </button>
            )}
          </div>
        </nav>

        <div className="mt-8">
          {/* Attractive Login Prompt for Non-Logged In Users */}
          {!userData && (
            <div className="mb-8 relative overflow-hidden">
              <div className="login-prompt-gradient rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden animate-bounce-in">
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
                      <h2 className="text-3xl font-bold">{t('marketplace.loginPrompt.unlockFullAccess')}</h2>
                    </div>
                    
                    <p className="text-lg text-teal-100 mb-6 max-w-2xl">
                      {t('marketplace.loginPrompt.joinThousands')}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                      <div className="flex items-center gap-2 text-teal-100">
                        <svg className="w-5 h-5 text-teal-200" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{t('marketplace.loginPrompt.instantBooking')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-teal-100">
                        <svg className="w-5 h-5 text-teal-200" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{t('marketplace.loginPrompt.trackRequests')}</span>
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
                        {t('marketplace.loginPrompt.getStartedFree')}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    
                    <button
                      onClick={() => navigate('/login/client')}
                      className="group bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-white/10 hover:border-white/50 hover:scale-105"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        {t('marketplace.loginPrompt.alreadyHaveAccount')}
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

          <ProvidersList provider={debouncedLocalProvider} />
        </div>

        <BookingSheet
          open={isGeneralRequestOpen}
          onOpenChange={setIsGeneralRequestOpen}
          isGeneralRequest={true}
          onSuccess={() => {
            setIsGeneralRequestOpen(false);
            toast.success("Booking request sent successfully!");
          }}
        />
      </main>

      {/* Clear Filters Confirmation Dialog */}
      <Dialog open={showClearFiltersDialog} onOpenChange={setShowClearFiltersDialog}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>{t('marketplace.filters.clearAllFiltersTitle')}</DialogTitle>
            <DialogDescription>
              {t('marketplace.filters.clearAllFiltersDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowClearFiltersDialog(false)}
              className="flex-1 sm:flex-none"
            >
              {t('marketplace.filters.cancel')}
            </Button>
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="flex-1 sm:flex-none border-teal-500 text-teal-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-600"
            >
              {t('marketplace.filters.clearFilters')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default MarketPlacePage;