// Section: Admin Jobs Management Page with Translation Support
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getCookie } from '../../../utils/authCookieService';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../services/admin.service';
import { clientService } from '@/services/client.service';
import { API_BASE_URL } from '../../../config/api';
import {
  FiRefreshCw,
  FiEdit3,
  FiTrash2,
  FiFilter,
  FiSearch,
  FiUser,
  FiMail,
  FiLoader,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiDollarSign,
  FiEye,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';

// Section: Interface for booking data
interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  bookingDate: string;
  typeOfService: string[]; // Changed from string to string[] for multiple services
  proposedStartTime: string;
  proposedEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  review: string | null;
  repeat: string | null;
  status: string;
  serviceAddress: string;
  responseTime: string;
  agreedHourlyPrice: number;
  totalPrice: string;
  finalPrice: string;
  stars: number;
  paymentSource: string[];
  paymentDestination: string[];
  transactionMeta: string[];
  createdAt: string;
  updatedAt?: string; // Add updatedAt field for sorting
  clientAccept?: boolean;
  providerAccept?: boolean;
  clientAcceptTimestamp?: string;
  providerAcceptTimestamp?: string;
}

// Section: Interface for user profiles
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
}

// Section: Sort options type
type SortField = 'createdAt' | 'updatedAt' | 'bookingDate' | 'status' | 'agreedHourlyPrice';
type SortDirection = 'asc' | 'desc';

const AdminJobs: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'cancelled'>('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
  const [providerProfile, setProviderProfile] = useState<UserProfile | null>(null);
  const [clientProfiles, setClientProfiles] = useState<Record<string, UserProfile>>({});
  const [providerProfiles, setProviderProfiles] = useState<Record<string, UserProfile>>({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingBookingDetails, setLoadingBookingDetails] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // Section: Sorting state
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
      } catch (err) {
        console.error('Error checking admin status:', err);
        navigate('/login/provider');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  // Section: Load bookings list on demand
  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAllBookings();
      setBookings(data);

      // Load client and provider profiles
      await loadUserProfiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Section: Load user profiles for bookings
  const loadUserProfiles = async (bookingsData: Booking[]) => {
    try {
      const clientIds = [...new Set(bookingsData.map(b => b.clientId))];
      const providerIds = [...new Set(bookingsData.map(b => b.providerId))];

      // Load client profiles
      const clientProfilesData: Record<string, UserProfile> = {};
      for (const clientId of clientIds) {
        try {
          const profile = await clientService.getClient(clientId);
          clientProfilesData[clientId] = profile;
        } catch (err) {
          // Do not assign null, just skip if not found
        }
      }
      setClientProfiles(clientProfilesData);

      // Load provider profiles
      const providerProfilesData: Record<string, UserProfile> = {};
      for (const providerId of providerIds) {
        try {
          const profile = await adminService.getProviderById(providerId);
          providerProfilesData[providerId] = profile;
        } catch (err) {
          // Do not assign null, just skip if not found
        }
      }
      setProviderProfiles(providerProfilesData);
    } catch (err) {
      console.error('Error loading user profiles:', err);
    }
  };

  // Section: Load bookings on component mount
  useEffect(() => {
    loadBookings();
  }, []);

  // Section: Keyboard shortcut handler for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+F (Windows/Linux) or Cmd+F (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault(); // Prevent browser's default find behavior
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Section: Handle booking update
  const handleUpdateBooking = async (updatedData: Partial<Booking>) => {
    if (!selectedBooking) return;

    try {
      await adminService.updateBooking(selectedBooking.id, updatedData);
      setBookings(prev =>
        prev.map(booking =>
          booking.id === selectedBooking.id
            ? { ...booking, ...updatedData }
            : booking
        )
      );
      setShowDetailsModal(false);
      setSelectedBooking(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update booking');
    }
  };

  // Section: Handle booking deletion
  const handleDeleteBooking = async (reason: string) => {
    if (!selectedBooking || !reason.trim()) return;

    try {
      await adminService.deleteBooking(selectedBooking.id, reason);
      setBookings(prev => prev.filter(booking => booking.id !== selectedBooking.id));
      setShowDetailsModal(false);
      setSelectedBooking(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete booking');
    }
  };

  // Helper function to safely handle typeOfService (string or array)
  const getServiceTypes = (typeOfService: any): string[] => {
    if (!typeOfService) return [];
    if (Array.isArray(typeOfService)) return typeOfService;
    if (typeof typeOfService === 'string') return [typeOfService];
    return [];
  };

  // Section: Sort bookings function
  const sortBookings = (bookingsToSort: Booking[]) => {
    return [...bookingsToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt || a.createdAt).getTime();
          bValue = new Date(b.updatedAt || b.createdAt).getTime();
          break;
        case 'bookingDate':
          aValue = new Date(a.bookingDate).getTime();
          bValue = new Date(b.bookingDate).getTime();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'agreedHourlyPrice':
          aValue = a.agreedHourlyPrice;
          bValue = b.agreedHourlyPrice;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // Section: Handle sort change
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Section: Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <FiArrowUp size={14} style={{ opacity: 0.3 }} />;
    }
    return sortDirection === 'asc' ? 
      <FiArrowUp size={14} style={{ color: '#14b8a6' }} /> : 
      <FiArrowDown size={14} style={{ color: '#14b8a6' }} />;
  };

  // Section: Filter and sort bookings
  const filteredBookings = sortBookings(bookings.filter(booking => {
    const clientProfile = clientProfiles[booking.clientId];
    const providerProfile = providerProfiles[booking.providerId];
    const serviceTypes = getServiceTypes(booking.typeOfService);

    const matchesSearch =
      serviceTypes.some(service => service.toLowerCase().includes(searchTerm.toLowerCase())) ||
      booking.serviceAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (clientProfile?.firstName + ' ' + clientProfile?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (providerProfile?.firstName + ' ' + providerProfile?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ? true :
        filter === 'pending' ? booking.status === 'pending' :
          filter === 'accepted' ? (booking.clientAccept && booking.providerAccept) :
            filter === 'completed' ? booking.status === 'completed' :
              filter === 'cancelled' ? booking.status === 'cancelled' : true;

    return matchesSearch && matchesFilter;
  }));

  // Section: Get filter count
  const getFilterCount = (filterType: string) => {
    switch (filterType) {
      case 'all': return bookings.length;
      case 'pending': return bookings.filter(b => b.status === 'pending').length;
      case 'accepted': return bookings.filter(b => b.clientAccept && b.providerAccept).length;
      case 'completed': return bookings.filter(b => b.status === 'completed').length;
      case 'cancelled': return bookings.filter(b => b.status === 'cancelled').length;
      default: return 0;
    }
  };

  // Section: Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Section: Format date and time for detailed view
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Section: Format time
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
  };

  // Section: Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return { bg: '#fff3cd', color: '#856404' };
      case 'accepted': return { bg: '#d1ecf1', color: '#0c5460' };
      case 'completed': return { bg: '#d4edda', color: '#155724' };
      case 'cancelled': return { bg: '#f8d7da', color: '#721c24' };
      default: return { bg: '#f8f9fa', color: '#6c757d' };
    }
  };

  // Section: Handle profile click
  const handleProfileClick = (userId: string, type: 'client' | 'provider') => {
    if (type === 'provider') {
      navigate(`/provider/${userId}`);
    }
    // For clients, you might want to navigate to a client profile page if it exists
  };

  // Section: Generate search suggestions from existing data
  const generateSuggestions = (searchValue: string) => {
    if (!searchValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    const allSuggestions = new Set<string>();

    // Add service types
    bookings.forEach(booking => {
      const serviceTypes = getServiceTypes(booking.typeOfService);
      serviceTypes.forEach(service => {
        if (service.toLowerCase().includes(searchLower)) {
          allSuggestions.add(service);
        }
      });
    });

    // Add client names
    Object.values(clientProfiles).forEach(client => {
      const fullName = `${client.firstName} ${client.lastName}`;
      if (fullName.toLowerCase().includes(searchLower)) {
        allSuggestions.add(fullName);
      }
      if (client.email.toLowerCase().includes(searchLower)) {
        allSuggestions.add(client.email);
      }
    });

    // Add provider names
    Object.values(providerProfiles).forEach(provider => {
      const fullName = `${provider.firstName} ${provider.lastName}`;
      if (fullName.toLowerCase().includes(searchLower)) {
        allSuggestions.add(fullName);
      }
      if (provider.email.toLowerCase().includes(searchLower)) {
        allSuggestions.add(provider.email);
      }
    });

    // Add status values
    const statuses = ['pending', 'accepted', 'completed', 'cancelled'];
    statuses.forEach(status => {
      if (status.toLowerCase().includes(searchLower)) {
        allSuggestions.add(status);
      }
    });

    // Add addresses
    bookings.forEach(booking => {
      if (booking.serviceAddress.toLowerCase().includes(searchLower)) {
        allSuggestions.add(booking.serviceAddress);
      }
    });

    const suggestionsArray = Array.from(allSuggestions).slice(0, 8); // Limit to 8 suggestions

    setSuggestions(suggestionsArray);
    setShowSuggestions(suggestionsArray.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  // Section: Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  // Section: Handle keyboard navigation for suggestions
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Section: Handle search input change with suggestions
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    generateSuggestions(value);
  };

  // Section: Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Section: Regenerate suggestions when data is loaded
  useEffect(() => {
    if (searchTerm.trim() && (bookings.length > 0 || Object.keys(clientProfiles).length > 0 || Object.keys(providerProfiles).length > 0)) {
      generateSuggestions(searchTerm);
    }
  }, [bookings, clientProfiles, providerProfiles, searchTerm]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Section: Show details modal
  const handleShowDetailsModal = async (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
    setLoadingBookingDetails(true);
    // Always fetch the latest client and provider profile for this booking
    try {
      let client: UserProfile | null = clientProfiles[booking.clientId] || null;
      let provider: UserProfile | null = providerProfiles[booking.providerId] || null;
      if (!client) {
        try {
          const fetchedClient = await clientService.getClient(booking.clientId);
          if (fetchedClient) {
            client = fetchedClient;
            setClientProfiles(prev => ({ ...prev, [booking.clientId]: fetchedClient }));
          }
        } catch (err) {
          client = null;
        }
      }
      if (!provider) {
        try {
          const fetchedProvider = await adminService.getProviderById(booking.providerId);
          if (fetchedProvider) {
            provider = fetchedProvider;
            setProviderProfiles(prev => ({ ...prev, [booking.providerId]: fetchedProvider }));
          }
        } catch (err) {
          provider = null;
        }
      }
      setClientProfile(client);
      setProviderProfile(provider);
    } finally {
      setLoadingBookingDetails(false);
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>
        {/* Section: Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, margin: 0 }}>{t('admin.jobs.title')}</h2>
            <p style={{ margin: '5px 0 0', color: '#666' }}>
              {t('admin.jobs.description')}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
              {t('admin.jobs.sortedBy')}: {sortField === 'createdAt' ? t('admin.jobs.createdDate') : 
                         sortField === 'updatedAt' ? t('admin.jobs.updatedDate') : 
                         sortField === 'bookingDate' ? t('admin.jobs.bookingDate') : 
                         sortField === 'status' ? t('admin.jobs.status') : t('admin.jobs.price')} 
              ({sortDirection === 'asc' ? t('admin.jobs.ascending') : t('admin.jobs.descending')})
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              background: '#14b8a6',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <FiRefreshCw size={18} />
            <span>{t('admin.common.refresh')}</span>
          </button>
        </div>

        {/* Section: Search */}
        <div style={{ marginBottom: 20, position: 'relative' }}>
          <div style={{
            position: 'relative',
            maxWidth: 400,
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s ease-in-out'
          }}>
            <FiSearch
              size={18}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                zIndex: 1
              }}
            />
            <input
              type="text"
                                placeholder={t('admin.jobs.searchPlaceholder')}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              ref={searchInputRef}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'transparent',
                color: '#374151'
              }}
              onFocus={(e) => {
                const parent = e.target.parentElement;
                if (parent) {
                  parent.style.borderColor = '#14b8a6';
                  parent.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)';
                }
                // Generate suggestions when focusing if there's a search term
                if (searchTerm.trim()) {
                  generateSuggestions(searchTerm);
                }
              }}
              onBlur={(e) => {
                const parent = e.target.parentElement;
                if (parent) {
                  parent.style.borderColor = '#e5e7eb';
                  parent.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                }
              }}
            />
            <div style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1
            }}>
              <kbd style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#6b7280',
                backgroundColor: '#f9fafb',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}>
                {navigator.platform.includes('Mac') ? '⌘F' : 'Ctrl+F'}
              </kbd>
            </div>
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              zIndex: 50,
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                    backgroundColor: index === selectedSuggestionIndex ? '#f0f9ff' : 'transparent',
                    color: index === selectedSuggestionIndex ? '#0369a1' : '#374151',
                    fontSize: '14px',
                    transition: 'all 0.15s ease-in-out'
                  }}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiSearch size={14} style={{ color: '#9ca3af' }} />
                    <span>{suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Filters and Sorting */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: t('admin.common.all'), icon: FiFilter },
              { key: 'pending', label: t('admin.jobs.pending'), icon: FiClock },
              { key: 'accepted', label: t('admin.jobs.accepted'), icon: FiUser },
              { key: 'completed', label: t('admin.jobs.completed'), icon: FiUser },
              { key: 'cancelled', label: t('admin.jobs.cancelled'), icon: FiUser }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                style={{
                  padding: '8px 16px',
                  background: filter === key ? '#14b8a6' : '#f5f5f5',
                  color: filter === key ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14
                }}
              >
                <Icon size={16} />
                <span>{label} ({getFilterCount(key)})</span>
              </button>
            ))}
          </div>

          {/* Sorting Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>{t('admin.jobs.sortBy')}:</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { field: 'createdAt' as SortField, label: t('admin.jobs.createdDate') },
                { field: 'updatedAt' as SortField, label: t('admin.jobs.updatedDate') },
                { field: 'bookingDate' as SortField, label: t('admin.jobs.bookingDate') },
                { field: 'status' as SortField, label: t('admin.jobs.status') },
                { field: 'agreedHourlyPrice' as SortField, label: t('admin.jobs.price') }
              ].map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => handleSortChange(field)}
                  style={{
                    padding: '6px 12px',
                    background: sortField === field ? '#e0f2fe' : '#f8f9fa',
                    color: sortField === field ? '#0284c7' : '#666',
                    border: `1px solid ${sortField === field ? '#bae6fd' : '#e5e7eb'}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: sortField === field ? '600' : '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (sortField !== field) {
                      e.currentTarget.style.background = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#7dd3fc';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (sortField !== field) {
                      e.currentTarget.style.background = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  {getSortIcon(field)}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>{t('admin.jobs.loadingJobs')}</div>
        ) : error ? (
          <div style={{ color: 'red', padding: 20, background: '#fee', borderRadius: 4 }}>
            {error}
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ccc', padding: 12, background: '#f8f9fa', textAlign: 'left' }}>
                    {t('admin.jobs.serviceType')}
                  </th>
                  <th style={{ border: '1px solid #ccc', padding: 12, background: '#f8f9fa', textAlign: 'left' }}>
                    {t('admin.jobs.client')}
                  </th>
                  <th style={{ border: '1px solid #ccc', padding: 12, background: '#f8f9fa', textAlign: 'left' }}>
                    {t('admin.jobs.provider')}
                  </th>
                  <th style={{ border: '1px solid #ccc', padding: 12, background: '#f8f9fa', textAlign: 'left' }}>
                    {t('admin.jobs.dateTime')}
                  </th>
                  <th style={{ border: '1px solid #ccc', padding: 12, background: '#f8f9fa', textAlign: 'left' }}>
                    {t('admin.jobs.status')}
                  </th>
                  <th style={{ border: '1px solid #ccc', padding: 12, background: '#f8f9fa', textAlign: 'left' }}>
                    {t('admin.common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => {
                  const clientProfile = clientProfiles[booking.clientId];
                  const providerProfile = providerProfiles[booking.providerId];
                  const statusColors = getStatusColor(booking.status);

                  return (
                    <tr key={booking.id}>
                      <td style={{ border: '1px solid #ccc', padding: 12 }}>
                        <div style={{ fontWeight: 'bold' }}>
                          {getServiceTypes(booking.typeOfService).join(', ')}
                        </div>
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 12 }}>
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                            background: '#f8fafc', borderRadius: 8, border: '1px solid #e0e7ef',
                            boxShadow: '0 1px 2px 0 rgba(20,184,166,0.04)',
                            transition: 'box-shadow 0.2s',
                            cursor: clientProfile ? 'pointer' : 'default',
                          }}
                          onClick={clientProfile ? () => handleProfileClick(booking.clientId, 'client') : undefined}
                          title={clientProfile ? t('admin.jobs.viewClientProfile') : ''}
                          onMouseOver={clientProfile ? (e => e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(20,184,166,0.10)') : undefined}
                          onMouseOut={clientProfile ? (e => e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(20,184,166,0.04)') : undefined}
                        >
                          <img
                            src={
                              clientProfile && clientProfile.profileImage && clientProfile.profileImage.trim() && clientProfile.profileImage !== 'null' && clientProfile.profileImage !== 'undefined'
                                ? (clientProfile.profileImage.startsWith('http')
                                  ? clientProfile.profileImage
                                  : `${API_BASE_URL}/${clientProfile.profileImage}`)
                                : '/assets/img/client.jpg'
                            }
                            alt="Client"
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #bae6fd', background: '#fff' }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/assets/img/client.jpg';
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#0369a1', lineHeight: 1.2 }}>
                              {loadingBookingDetails ? (
                                <FiLoader size={16} style={{ marginLeft: 4 }} />
                              ) : !clientProfile ? t('admin.jobs.notFound') : `${clientProfile.firstName} ${clientProfile.lastName}`}
                            </span>
                            <span style={{ color: '#64748b', fontSize: 11, lineHeight: 1.2 }}>
                              {clientProfile ? clientProfile.email : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 12 }}>
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                            background: '#fff7ed', borderRadius: 8, border: '1px solid #fde68a',
                            boxShadow: '0 1px 2px 0 rgba(251,191,36,0.04)',
                            transition: 'box-shadow 0.2s',
                            cursor: providerProfile ? 'pointer' : 'default',
                          }}
                          onClick={providerProfile ? () => handleProfileClick(booking.providerId, 'provider') : undefined}
                          title={providerProfile ? t('admin.jobs.viewProviderProfile') : ''}
                          onMouseOver={providerProfile ? (e => e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(251,191,36,0.10)') : undefined}
                          onMouseOut={providerProfile ? (e => e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(251,191,36,0.04)') : undefined}
                        >
                          <img
                            src={providerProfile && providerProfile.profileImage ? `${API_BASE_URL}/${providerProfile.profileImage}` : "/assets/img/provider.jpg"}
                            alt="Provider"
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #fde68a', background: '#fff' }}
                            onError={(e) => {
                              e.currentTarget.src = "/assets/img/provider.jpg";
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#b45309', lineHeight: 1.2 }}>
                              {loadingBookingDetails ? (
                                <FiLoader size={16} style={{ marginLeft: 4 }} />
                              ) : !providerProfile ? t('admin.jobs.notFound') : `${providerProfile.firstName} ${providerProfile.lastName}`}
                            </span>
                            <span style={{ color: '#a16207', fontSize: 11, lineHeight: 1.2 }}>
                              {providerProfile ? providerProfile.email : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiCalendar size={12} color="#666" />
                            <span style={{ fontSize: 13 }}>{formatDate(booking.bookingDate)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiClock size={12} color="#666" />
                            <span style={{ fontSize: 12, color: '#666' }}>
                              {formatTime(booking.proposedStartTime)} - {formatTime(booking.proposedEndTime)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 12 }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: statusColors.bg,
                          color: statusColors.color,
                          fontWeight: 'bold'
                        }}>
                          {booking.status}
                        </span>
                        {booking.stars > 0 && (
                          <div style={{ marginTop: 4, fontSize: 11, color: '#666' }}>
                            ⭐ {booking.stars}/5
                          </div>
                        )}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: 12 }}>
                        <button
                          onClick={() => handleShowDetailsModal(booking)}
                          style={{
                            padding: '6px 12px',
                            background: '#2196f3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12
                          }}
                        >
                          <FiEye size={12} />
                          {t('admin.jobs.viewDetails')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredBookings.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                {t('admin.jobs.noJobsFound')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section: Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            width: '95%',
            maxWidth: 900,
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              color: 'white',
              padding: '24px 32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
                  {t('admin.jobs.bookingDetails')}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBooking(null);
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '32px', maxHeight: 'calc(90vh - 120px)', overflow: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Left Column */}
                <div>
                  {/* Service Information Card */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{
                      margin: '0 0 16px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FiCalendar style={{ color: '#3b82f6' }} />
                      {t('admin.jobs.serviceInformation')}
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.serviceType')}:</span>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{getServiceTypes(selectedBooking.typeOfService).join(', ')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.date')}:</span>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatDate(selectedBooking.bookingDate)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.time')}:</span>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>
                            {formatTime(selectedBooking.proposedStartTime)} - {formatTime(selectedBooking.proposedEndTime)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.status')}:</span>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: getStatusColor(selectedBooking.status).bg,
                            color: getStatusColor(selectedBooking.status).color
                          }}>
                            {selectedBooking.status}
                          </span>
                        </div>
                                              {selectedBooking.actualStartTime && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.actualStartTime')}:</span>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>
                              {formatTime(selectedBooking.actualStartTime)}
                            </span>
                          </div>
                        )}
                        {selectedBooking.actualEndTime && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.actualEndTime')}:</span>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>
                              {formatTime(selectedBooking.actualEndTime)}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Address Information Card */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{
                      margin: '0 0 16px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FiMapPin style={{ color: '#ef4444' }} />
                      {t('admin.jobs.location')}
                    </h3>
                    <div style={{
                      padding: '16px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      color: '#374151',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {selectedBooking.serviceAddress}
                    </div>
                  </div>

                  {/* Client & Provider Information Card */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{
                      margin: '0 0 16px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FiUser style={{ color: '#8b5cf6' }} />
                      {t('admin.jobs.clientProviderDetails')}
                    </h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {/* Client Section */}
                      <div style={{
                        padding: '16px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{
                            background: '#e0f2fe', color: '#0284c7',
                            fontWeight: 600, fontSize: 11, borderRadius: 6, padding: '4px 8px',
                            border: '1px solid #bae6fd',
                          }}>
                            {t('admin.jobs.client').toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={
                              clientProfile && clientProfile.profileImage && clientProfile.profileImage.trim() && clientProfile.profileImage !== 'null' && clientProfile.profileImage !== 'undefined'
                                ? (clientProfile.profileImage.startsWith('http')
                                  ? clientProfile.profileImage
                                  : `${API_BASE_URL}/${clientProfile.profileImage}`)
                                : '/assets/img/client.jpg'
                            }
                            alt="Client"
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #bae6fd' }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/assets/img/client.jpg';
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: '600', color: '#0369a1', fontSize: '14px' }}>
                              {loadingBookingDetails ? (
                                <FiLoader size={16} style={{ marginLeft: 4 }} />
                              ) : !clientProfile ? t('admin.jobs.notFound') : `${clientProfile.firstName} ${clientProfile.lastName}`}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '12px' }}>
                              {clientProfile ? clientProfile.email : ''}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Provider Section */}
                      <div style={{
                        padding: '16px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{
                            background: '#fef9c3', color: '#b45309',
                            fontWeight: 600, fontSize: 11, borderRadius: 6, padding: '4px 8px',
                            border: '1px solid #fde68a',
                          }}>
                            {t('admin.jobs.provider').toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={providerProfile && providerProfile.profileImage ? `${API_BASE_URL}/${providerProfile.profileImage}` : "/assets/img/provider.jpg"}
                            alt="Provider"
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fde68a' }}
                            onError={(e) => {
                              e.currentTarget.src = "/assets/img/provider.jpg";
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: '600', color: '#b45309', fontSize: '14px' }}>
                              {loadingBookingDetails ? (
                                <FiLoader size={16} style={{ marginLeft: 4 }} />
                              ) : !providerProfile ? t('admin.jobs.notFound') : `${providerProfile.firstName} ${providerProfile.lastName}`}
                            </div>
                            <div style={{ color: '#a16207', fontSize: '12px' }}>
                              {providerProfile ? providerProfile.email : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  {/* Financial Information Card */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{
                      margin: '0 0 16px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FiDollarSign style={{ color: '#10b981' }} />
                      {t('admin.jobs.financialDetails')}
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.hourlyRate')}:</span>
                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>
                          {selectedBooking.agreedHourlyPrice} SEK
                        </span>
                      </div>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.totalPrice')}:</span>
                          <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>
                            {selectedBooking.totalPrice} SEK
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.finalPrice')}:</span>
                          <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>
                            {selectedBooking.finalPrice} SEK
                          </span>
                        </div>
                      {selectedBooking.stars > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.rating')}:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '16px' }}>⭐</span>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>
                              {selectedBooking.stars}/5
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Information Card */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{
                      margin: '0 0 16px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FiClock style={{ color: '#f59e0b' }} />
                      {t('admin.jobs.additionalInfo')}
                    </h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.responseTime')}:</span>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{selectedBooking.responseTime}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.repeat')}:</span>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>
                            {selectedBooking.repeat || t('admin.jobs.no')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.created')}:</span>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>
                            {formatDateTime(selectedBooking.createdAt)}
                          </span>
                        </div>
                                              {selectedBooking.updatedAt && selectedBooking.updatedAt !== selectedBooking.createdAt && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.updated')}:</span>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>
                              {formatDateTime(selectedBooking.updatedAt)}
                            </span>
                          </div>
                        )}
                                              {selectedBooking.clientAccept !== undefined && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.clientAccept')}:</span>
                            <span style={{ 
                              fontWeight: '600', 
                              color: selectedBooking.clientAccept ? '#10b981' : '#ef4444' 
                            }}>
                              {selectedBooking.clientAccept ? t('admin.jobs.yes') : t('admin.jobs.no')}
                            </span>
                          </div>
                        )}
                        {selectedBooking.providerAccept !== undefined && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontWeight: '500' }}>{t('admin.jobs.providerAccept')}:</span>
                            <span style={{ 
                              fontWeight: '600', 
                              color: selectedBooking.providerAccept ? '#10b981' : '#ef4444' 
                            }}>
                              {selectedBooking.providerAccept ? t('admin.jobs.yes') : t('admin.jobs.no')}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Section - Full Width */}
              {selectedBooking.review && (
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '24px',
                  marginTop: '24px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{
                    margin: '0 0 16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                                          <FiUser style={{ color: '#8b5cf6' }} />
                      {t('admin.jobs.clientReview')}
                  </h3>
                  <div style={{
                    padding: '16px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    color: '#374151',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontStyle: 'italic'
                  }}>
                    "{selectedBooking.review}"
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobs; 