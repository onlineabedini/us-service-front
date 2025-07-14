// @collapse
// Section: Admin Provider Management Page with Translation Support
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getCookie } from '../../../utils/authCookieService';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../../services/admin.service';
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
  FiShield,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';

// Section: Interface for list view (minimal data)
interface ProviderListItem {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  phoneNumber: string;
  isEmailVerified: boolean;
  partOfPilot: boolean;
  profileImage?: string;
  role?: string;
}

// Section: Interface for full provider data (used in edit modal)
interface ProviderDetails {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  phoneNumber: string;
  profileImage?: string;
  city: string;
  streetAddress: string;
  postalCode: string;
  isEmailVerified: boolean;
  partOfPilot: boolean;
  role?: string;
  createdAt?: string;
}

const AdminProviders: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ProviderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'pilot'>('all');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string>('');
  const [showRoleChangeConfirm, setShowRoleChangeConfirm] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{providerId: string, newRole: string, oldRole: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [updating, setUpdating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

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
        setCurrentAdminId(providerId);
      } catch (err) {
        console.error('Error checking admin status:', err);
        navigate('/login/provider');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  // Section: Load providers data
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoading(true);
        const data = await adminService.getAllProviders();
  
        setProviders(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load providers');
      } finally {
        setLoading(false);
      }
    };

    loadProviders();
  }, []);

  // Section: Handle provider update
  const handleUpdateProvider = async (updatedData: Partial<ProviderDetails>) => {
    if (!selectedProviderId) return;

    try {
      setUpdating(true);
      setError('');
      const response = await adminService.updateProvider(selectedProviderId, updatedData);

      
      // Section: Update local state with all relevant fields
      setProviders(prev =>
        prev.map(provider =>
          provider.id === selectedProviderId
            ? { 
                ...provider, 
                ...updatedData,
                // Section: Ensure all fields are properly updated
                firstName: updatedData.firstName || provider.firstName,
                lastName: updatedData.lastName || provider.lastName,
                username: updatedData.username || provider.username,
                email: updatedData.email || provider.email,
                phoneNumber: updatedData.phoneNumber || provider.phoneNumber,
                isEmailVerified: updatedData.isEmailVerified !== undefined ? updatedData.isEmailVerified : provider.isEmailVerified,
                partOfPilot: updatedData.partOfPilot !== undefined ? updatedData.partOfPilot : provider.partOfPilot,
                role: updatedData.role || provider.role
              }
            : provider
        )
      );
      
      setSuccessMessage(t('admin.providers.providerUpdated'));
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update provider');
    } finally {
      setUpdating(false);
    }
  };

  // Section: Handle provider deletion
  const handleDeleteProvider = async () => {
    if (!selectedProviderId) return;

    // Section: Prevent deletion of super admin
    const providerToDelete = providers.find(provider => provider.id === selectedProviderId);
    if (providerToDelete && providerToDelete.email === 'vitago.swe@gmail.com') {
      setError(t('admin.providers.cannotDeleteSuperAdmin'));
      return;
    }

    try {
      await adminService.deleteProvider(selectedProviderId);
      setProviders(prev => prev.filter(provider => provider.id !== selectedProviderId));
      setShowEditModal(false);
      setSelectedProviderId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete provider');
    }
  };

  // Section: Handle role change with confirmation
  const handleRoleChange = (providerId: string, newRole: string, oldRole: string) => {
    // Section: Prevent role changes for super admin
    const providerToChange = providers.find(provider => provider.id === providerId);
    if (providerToChange && providerToChange.email === 'vitago.swe@gmail.com') {
      setError(t('admin.providers.cannotChangeSuperAdminRole'));
      return;
    }

    // Role restrictions
    if (providerId === currentAdminId && newRole === 'user') {
      setError(t('admin.providers.cannotDemoteYourself'));
      return;
    }

    if (oldRole !== newRole && (oldRole === 'admin' || newRole === 'admin')) {
      setPendingRoleChange({ providerId, newRole, oldRole });
      setShowRoleChangeConfirm(true);
    }
  };

  // Section: Confirm role change
  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;

    try {
      await adminService.updateProvider(pendingRoleChange.providerId, { role: pendingRoleChange.newRole });
      
      // Update local state
      setProviders(prev => 
        prev.map(provider => 
          provider.id === pendingRoleChange.providerId 
            ? { ...provider, role: pendingRoleChange.newRole as any }
            : provider
        )
      );
      
      setShowRoleChangeConfirm(false);
      setPendingRoleChange(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update provider role');
    }
  };

  // Section: Filter providers
  const filteredProviders = providers.filter(provider => {
    const matchesSearch =
      provider.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (provider.username && provider.username.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filter === 'all' ? true :
        filter === 'verified' ? provider.isEmailVerified :
          filter === 'unverified' ? !provider.isEmailVerified :
            filter === 'pilot' ? provider.partOfPilot : true;

    return matchesSearch && matchesFilter;
  });

  // Section: Get filter count
  const getFilterCount = (filterType: string) => {
    switch (filterType) {
      case 'all': return providers.length;
      case 'verified': return providers.filter(p => p.isEmailVerified).length;
      case 'unverified': return providers.filter(p => !p.isEmailVerified).length;
      case 'pilot': return providers.filter(p => p.partOfPilot).length;
      default: return 0;
    }
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

    // Add provider names
    providers.forEach(provider => {
      const fullName = `${provider.firstName} ${provider.lastName}`;
      if (fullName.toLowerCase().includes(searchLower)) {
        allSuggestions.add(fullName);
      }
      if (provider.email.toLowerCase().includes(searchLower)) {
        allSuggestions.add(provider.email);
      }
      if (provider.username && provider.username.toLowerCase().includes(searchLower)) {
        allSuggestions.add(provider.username);
      }
      if (provider.phoneNumber && provider.phoneNumber.toLowerCase().includes(searchLower)) {
        allSuggestions.add(provider.phoneNumber);
      }
    });

    // Add status values
    const statuses = ['verified', 'unverified', 'admin', 'user', 'pilot'];
    statuses.forEach(status => {
      if (status.toLowerCase().includes(searchLower)) {
        allSuggestions.add(status);
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
    if (searchTerm.trim() && providers.length > 0) {
      generateSuggestions(searchTerm);
    }
  }, [providers, searchTerm]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Section: Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('admin.providers.title')}</h1>
            <p className="text-gray-600">
              {t('admin.providers.description')}
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            {t('admin.providers.refresh')}
          </Button>
        </div>

        {/* Section: Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search */}
              <div className="relative max-w-md">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder={t('admin.providers.searchPlaceholder')}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10"
                    ref={searchInputRef}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                      {navigator.platform.includes('Mac') ? '⌘F' : 'Ctrl+F'}
                    </kbd>
                  </div>
                </div>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-lg z-50 max-h-80 overflow-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                          index === selectedSuggestionIndex 
                            ? 'bg-teal-50 text-teal-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        <div className="flex items-center gap-2">
                          <FiSearch className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{suggestion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'all', label: t('admin.providers.filter.all'), icon: FiFilter, color: 'bg-gray-100 text-gray-700' },
                  { key: 'verified', label: t('admin.providers.filter.verified'), icon: FiCheckCircle, color: 'bg-green-100 text-green-700' },
                  { key: 'unverified', label: t('admin.providers.filter.unverified'), icon: FiAlertCircle, color: 'bg-yellow-100 text-yellow-700' },
                  { key: 'pilot', label: t('admin.providers.filter.pilot'), icon: FiShield, color: 'bg-teal-100 text-teal-700' }
                ].map(({ key, label, icon: Icon, color }) => (
                  <Button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    variant={filter === key ? "default" : "outline"}
                    className={`flex items-center gap-2 ${filter === key ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                    <Badge variant="secondary" className="ml-1">
                      {getFilterCount(key)}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section: Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-700">
                <FiCheckCircle className="h-5 w-5" />
                <span className="font-medium">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section: Content */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FiLoader className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
              <p className="text-gray-600">{t('admin.providers.loading')}</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-700">
                <FiAlertCircle className="h-5 w-5" />
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        {t('admin.providers.table.provider')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        {t('admin.providers.table.email')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        {t('admin.providers.table.status')}
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        {t('admin.providers.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProviders.map(provider => {
                      // Section: Check if provider is super admin
                      const isSuperAdmin = provider.email === 'vitago.swe@gmail.com';
                      
                      return (
                        <tr 
                          key={provider.id} 
                          className={`transition-colors cursor-pointer group ${
                            isSuperAdmin 
                              ? 'bg-teal-50 hover:bg-teal-100' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => navigate(`/provider/${provider.id}`)}
                          title={t('admin.providers.table.clickToViewProfile')}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {provider.profileImage && provider.profileImage.trim() && provider.profileImage !== 'null' && provider.profileImage !== 'undefined' ? (
                                <img
                                  src={provider.profileImage.startsWith('http') ? provider.profileImage : `${API_BASE_URL}/${provider.profileImage}`}
                                  alt="Profile"
                                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/assets/img/provider.jpg';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                                  {provider.firstName[0]}{provider.lastName[0]}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 group-hover:text-teal-700 transition-colors">
                                    {provider.firstName} {provider.lastName}
                                  </span>
                                  <span className="text-xs text-gray-400 group-hover:text-teal-500 transition-colors">
                                    ({t('admin.providers.table.clickToView')})
                                  </span>
                                  {isSuperAdmin && (
                                    <Badge variant="default" className="text-xs bg-teal-600 hover:bg-teal-700">
                                      {t('admin.providers.table.superAdmin')}
                                    </Badge>
                                  )}
                                  {provider.role === 'admin' && !isSuperAdmin && (
                                    <Badge variant="destructive" className="text-xs">
                                      {t('admin.providers.table.admin')}
                                    </Badge>
                                  )}
                                  {provider.partOfPilot && (
                                    <Badge variant="secondary" className="text-xs">
                                      {t('admin.providers.table.pilot')}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  @{provider.username || t('admin.providers.table.noUsername')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FiMail className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{provider.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {provider.isEmailVerified ? (
                                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  <FiCheckCircle className="h-3 w-3 mr-1" />
                                  {t('admin.providers.table.verified')}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  <FiAlertCircle className="h-3 w-3 mr-1" />
                                  {t('admin.providers.table.unverified')}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => navigate(`/provider/${provider.id}`)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                              >
                                <FiUser className="h-4 w-4" />
                                {t('admin.providers.table.viewProfile')}
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedProviderId(provider.id);
                                  setShowEditModal(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <FiEdit3 className="h-4 w-4" />
                                {t('admin.providers.table.edit')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {filteredProviders.length === 0 && (
                <div className="p-12 text-center">
                  <FiUser className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">{t('admin.providers.noProvidersFound')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section: Edit Modal */}
        {showEditModal && selectedProviderId && (
          <EditProviderForm
            providerId={selectedProviderId}
            onSave={handleUpdateProvider}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedProviderId(null);
            }}
            onDelete={handleDeleteProvider}
            handleDelete={handleDeleteProvider}
            handleRoleChange={handleRoleChange}
            currentAdminId={currentAdminId}
            updating={updating}
          />
        )}

        {/* Section: Role Change Confirmation Modal */}
        {showRoleChangeConfirm && pendingRoleChange && (
          <Dialog open={showRoleChangeConfirm} onOpenChange={() => setShowRoleChangeConfirm(false)}>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FiShield className="h-5 w-5 text-orange-600" />
                  {t('admin.providers.roleChangeConfirm.title')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-gray-600">
                  {t('admin.providers.roleChangeConfirm.text', { oldRole: pendingRoleChange.oldRole, newRole: pendingRoleChange.newRole })}
                </p>
                <p className="text-sm text-gray-500">
                  {t('admin.providers.roleChangeConfirm.warning')}
                </p>
              </div>
              <DialogFooter className="flex gap-3">
                <Button variant="outline" onClick={() => setShowRoleChangeConfirm(false)}>
                  {t('admin.providers.roleChangeConfirm.cancel')}
                </Button>
                <Button onClick={confirmRoleChange} className="bg-orange-600 hover:bg-orange-700">
                  {t('admin.providers.roleChangeConfirm.confirm')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

// Section: Enhanced Edit Provider Form Component
const EditProviderForm: React.FC<{
  providerId: string;
  onSave: (data: Partial<ProviderDetails>) => void;
  onCancel: () => void;
  onDelete: () => void;
  handleDelete: () => void;
  handleRoleChange: (providerId: string, newRole: string, oldRole: string) => void;
  currentAdminId: string;
  updating: boolean;
}> = ({ providerId, onSave, onCancel, onDelete, handleDelete, handleRoleChange, currentAdminId, updating }) => {
  const { t } = useTranslation();
  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [providerError, setProviderError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    role: 'user',
    isEmailVerified: false,
    partOfPilot: false
  });
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  // Section: Load provider data
  useEffect(() => {
    const loadProvider = async () => {
      try {
        setLoadingProvider(true);
        setProviderError('');
        const providerData = await adminService.getProviderById(providerId);
        setProvider(providerData);
    setFormData({
          firstName: providerData.firstName,
          lastName: providerData.lastName,
          username: providerData.username || '',
          email: providerData.email,
          phoneNumber: providerData.phoneNumber,
          role: providerData.role || 'user',
          isEmailVerified: providerData.isEmailVerified,
          partOfPilot: providerData.partOfPilot
    });
      } catch (err: any) {
        console.error('Error loading provider:', err);
        setProviderError(err.message || t('admin.providers.failedToLoadProvider'));
      } finally {
        setLoadingProvider(false);
      }
    };

    loadProvider();
  }, [providerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Section: Show loading state while fetching provider data
  if (loadingProvider) {
    return (
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FiUser className="h-5 w-5 text-teal-600" />
              {t('admin.providers.editModal.loadingTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="p-12 text-center">
            <FiLoader className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
            <p className="text-gray-600">{t('admin.providers.editModal.loadingText')}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Section: Show error state if failed to load provider data
  if (providerError) {
    return (
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FiUser className="h-5 w-5 text-red-600" />
              {t('admin.providers.editModal.errorTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="p-12 text-center">
            <FiAlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600 mb-4">{providerError}</p>
            <Button onClick={onCancel} variant="outline">
              {t('admin.providers.editModal.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FiUser className="h-5 w-5 text-teal-600" />
            {t('admin.providers.editModal.title')}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>ID: {providerId}</span>
            {provider?.createdAt && (
              <>
                <span>•</span>
                <span>{t('admin.providers.editModal.created', { date: new Date(provider.createdAt).toLocaleDateString() })}</span>
              </>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiUser className="h-4 w-4" />
                {t('admin.providers.editModal.profileInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('admin.providers.editModal.firstName')}</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    disabled={updating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('admin.providers.editModal.lastName')}</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    disabled={updating}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{t('admin.providers.editModal.username')}</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder={t('admin.providers.editModal.usernamePlaceholder')}
                    disabled={updating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('admin.providers.editModal.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    disabled={updating}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{t('admin.providers.editModal.phone')}</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  disabled={updating}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section: Role and Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiShield className="h-4 w-4" />
                {t('admin.providers.editModal.rolePermissions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">{t('admin.providers.editModal.userRole')}</Label>
                {/* Section: Check if provider is super admin */}
                {formData.email === 'vitago.swe@gmail.com' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                      <FiShield className="h-4 w-4 text-teal-600" />
                      <Badge variant="default" className="text-xs bg-teal-600 hover:bg-teal-700">
                        {t('admin.providers.editModal.superAdmin')}
                      </Badge>
                      <span className="text-sm text-teal-700 font-medium">
                        {t('admin.providers.editModal.superAdminRole')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('admin.providers.editModal.superAdminWarning')}
                    </p>
                  </div>
                ) : (
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      const oldRole = formData.role;
                      if (newRole !== oldRole) {
                        handleRoleChange(providerId, newRole, oldRole);
                        if (!(providerId === currentAdminId && newRole === 'user')) {
                          setFormData(prev => ({ ...prev, role: newRole }));
                        }
                      }
                    }}
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base shadow-md transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500 hover:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60"
                    disabled={providerId === currentAdminId && formData.role === 'admin' || updating}
                  >
                    <option value="user">{t('admin.providers.editModal.regularUser')}</option>
                    <option value="admin">{t('admin.providers.editModal.admin')}</option>
                  </select>
                )}
                {providerId === currentAdminId && formData.role === 'admin' && formData.email !== 'vitago.swe@gmail.com' && (
                  <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                    <FiAlertCircle className="h-4 w-4" />
                    {t('admin.providers.editModal.cannotChangeAdmin')}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="emailVerified"
                    checked={formData.isEmailVerified}
                    onChange={(e) => setFormData(prev => ({ ...prev, isEmailVerified: e.target.checked }))}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    disabled={updating}
                  />
                  <Label htmlFor="emailVerified" className="flex items-center gap-2 cursor-pointer">
                    <FiCheckCircle className="h-4 w-4 text-green-600" />
                    {t('admin.providers.editModal.emailVerified')}
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="pilotProgram"
                    checked={formData.partOfPilot}
                    onChange={(e) => setFormData(prev => ({ ...prev, partOfPilot: e.target.checked }))}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    disabled={updating}
                  />
                  <Label htmlFor="pilotProgram" className="flex items-center gap-2 cursor-pointer">
                    <Badge variant="secondary" className="text-xs">
                      {t('admin.providers.editModal.pilot')}
                    </Badge>
                    {t('admin.providers.editModal.partOfPilot')}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Danger Zone */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                <FiTrash2 className="h-4 w-4" />
                {t('admin.providers.editModal.dangerZone')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Section: Super admin deletion prevention */}
              {formData.email === 'vitago.swe@gmail.com' ? (
                <div className="space-y-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2">
                    <FiShield className="h-5 w-5 text-teal-600" />
                    <h4 className="font-medium text-teal-700">
                      {t('admin.providers.editModal.superAdminAccount')}
                    </h4>
                  </div>
                  <p className="text-sm text-teal-600">
                    {t('admin.providers.editModal.superAdminWarningText')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-700">{t('admin.providers.deleteModal.title')}</h4>
                      <p className="text-sm text-red-600 mt-1">
                        {t('admin.providers.deleteModal.description')}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteSection(!showDeleteSection)}
                      className="flex items-center gap-2"
                      disabled={updating}
                    >
                      <FiTrash2 className="h-4 w-4" />
                                              {showDeleteSection ? t('admin.providers.deleteModal.cancelDelete') : t('admin.providers.deleteModal.deleteProvider')}
                    </Button>
                  </div>

                  {showDeleteSection && (
                    <div className="space-y-4 p-4 bg-red-100 rounded-lg border border-red-200">
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDelete}
                          className="flex items-center gap-2"
                          disabled={updating}
                        >
                          <FiTrash2 className="h-4 w-4" />
                          {t('admin.providers.deleteModal.confirmDelete')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowDeleteSection(false)}
                          disabled={updating}
                        >
                          {t('admin.common.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <DialogFooter className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={updating}>
              {t('admin.common.cancel')}
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={updating}>
              {updating ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin mr-2" />
                  {t('admin.common.updating')}
                </>
              ) : (
                t('admin.common.saveChanges')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminProviders;