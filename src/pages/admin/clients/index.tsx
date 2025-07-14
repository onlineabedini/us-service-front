// Section: Admin Client Management Page with Translation Support
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
  FiMapPin,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiHome
} from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';

// Section: Interface for list view (minimal data)
interface ClientListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  profileImage?: string;
  username?: string;
  address?: Array<{
    streetAddress?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  }>;
}

// Section: Interface for full client data (used in edit modal)
interface ClientDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profileImage?: string;
  typeOfLiving: string;
  address?: Array<{
    streetAddress?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    firstName?: string;
    lastName?: string;
    floor?: string;
    doorCode?: string;
    doorPhone?: string;
    size?: string;
    typeOfLiving?: string;
    numberOfRooms?: string;
  }>;
  isEmailVerified: boolean;
  createdAt?: string;
}

const AdminClients: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
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
      } catch (err) {
        console.error('Error checking admin status:', err);
        navigate('/login/provider');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  // Section: Load clients data
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const data = await adminService.getAllClients();
        setClients(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // Section: Handle client update
  const handleUpdateClient = async (updatedData: Partial<ClientDetails>) => {
    if (!selectedClientId) return;

    try {
      await adminService.updateClient(selectedClientId, updatedData);
      setClients(prev => 
        prev.map(client => 
          client.id === selectedClientId 
            ? { ...client, ...updatedData }
            : client
        )
      );
      setShowEditModal(false);
      setSelectedClientId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update client');
    }
  };

  // Section: Handle client deletion
  const handleDeleteClient = async () => {
    if (!selectedClientId) return;

    try {
      await adminService.deleteClient(selectedClientId);
      setClients(prev => prev.filter(client => client.id !== selectedClientId));
      setShowEditModal(false);
      setSelectedClientId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete client');
    }
  };

  // Section: Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'verified' ? client.isEmailVerified :
      filter === 'unverified' ? !client.isEmailVerified : true;

    return matchesSearch && matchesFilter;
  });

  // Section: Get filter count
  const getFilterCount = (filterType: string) => {
    switch (filterType) {
      case 'all': return clients.length;
      case 'verified': return clients.filter(c => c.isEmailVerified).length;
      case 'unverified': return clients.filter(c => !c.isEmailVerified).length;
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

    // Add client names
    clients.forEach(client => {
      const fullName = `${client.firstName} ${client.lastName}`;
      if (fullName.toLowerCase().includes(searchLower)) {
        allSuggestions.add(fullName);
      }
      if (client.email.toLowerCase().includes(searchLower)) {
        allSuggestions.add(client.email);
      }
      if (client.username && client.username.toLowerCase().includes(searchLower)) {
        allSuggestions.add(client.username);
      }
    });

    // Add address information
    clients.forEach(client => {
      if (client.address && client.address.length > 0) {
        const primaryAddress = client.address[0];
        if (primaryAddress.city && primaryAddress.city.toLowerCase().includes(searchLower)) {
          allSuggestions.add(primaryAddress.city);
        }
        if (primaryAddress.streetAddress && primaryAddress.streetAddress.toLowerCase().includes(searchLower)) {
          allSuggestions.add(primaryAddress.streetAddress);
        }
        if (primaryAddress.postalCode && primaryAddress.postalCode.toLowerCase().includes(searchLower)) {
          allSuggestions.add(primaryAddress.postalCode);
        }
      }
    });

    // Add status values
    const statuses = ['verified', 'unverified'];
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
    if (searchTerm.trim() && clients.length > 0) {
      generateSuggestions(searchTerm);
    }
  }, [clients, searchTerm]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Section: Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('admin.clients.title')}</h1>
            <p className="text-gray-600">
              {t('admin.clients.description', 'Manage all clients in the system')}
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            {t('admin.common.refresh')}
          </Button>
        </div>

        {/* Section: Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search */}
              <div className="relative max-w-md">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder={t('admin.clients.searchPlaceholder')}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                  ref={searchInputRef}
                  onKeyDown={handleSearchKeyDown}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                    {navigator.platform.includes('Mac') ? '⌘F' : 'Ctrl+F'}
                  </kbd>
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
                            ? 'bg-blue-50 text-blue-700' 
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
                  { key: 'all', label: 'All', icon: FiFilter, color: 'bg-gray-100 text-gray-700' },
                  { key: 'verified', label: 'Verified', icon: FiCheckCircle, color: 'bg-green-100 text-green-700' },
                  { key: 'unverified', label: 'Unverified', icon: FiAlertCircle, color: 'bg-yellow-100 text-yellow-700' }
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

        {/* Section: Content */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FiLoader className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
              <p className="text-gray-600">{t('admin.clients.loadingClients')}</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-700">
                <FiAlertCircle className="h-5 w-5" />
                <span className="font-medium">Error: {error}</span>
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
                        Client
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredClients.map((client : any) => (
                      <tr 
                        key={client.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/client/${client.id}`)}
                        title="Click to view client profile"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {client.profileImage && client.profileImage.trim() && client.profileImage !== 'null' && client.profileImage !== 'undefined' ? (
                              <img
                                src={client.profileImage.startsWith('http') ? client.profileImage : `${API_BASE_URL}/${client.profileImage}`}
                                alt="Profile"
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/assets/img/client.jpg';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                                {client.firstName[0]}{client.lastName[0]}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 group-hover:text-teal-700 transition-colors">
                                  {client.firstName} {client.lastName}
                                </span>
                                <span className="text-xs text-gray-400 group-hover:text-teal-500 transition-colors">
                                  (Click to view)
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                @{client.username || 'No username'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FiMail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{client.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FiMapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {(() => {
                                const addressParts: string[] = [];
                                if (client.address && client.address.length > 0) {
                                  const primaryAddress = client.address[0];
                                  if (primaryAddress.streetAddress?.trim()) addressParts.push(primaryAddress.streetAddress);
                                  if (primaryAddress.postalCode?.trim()) addressParts.push(primaryAddress.postalCode);
                                  if (primaryAddress.city?.trim()) addressParts.push(primaryAddress.city);
                                }
                                return addressParts.length > 0 ? addressParts.join(', ') : 'Location not specified';
                              })()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {client.isEmailVerified ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                <FiCheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <FiAlertCircle className="h-3 w-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => navigate(`/client/${client.id}`)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            >
                              <FiUser className="h-4 w-4" />
                              View Profile
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setShowEditModal(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <FiEdit3 className="h-4 w-4" />
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredClients.length === 0 && (
                <div className="p-12 text-center">
                  <FiUser className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No clients found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section: Edit Modal */}
        {showEditModal && selectedClientId && (
          <EditClientForm
            clientId={selectedClientId}
            onSave={handleUpdateClient}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedClientId(null);
            }}
            onDelete={handleDeleteClient}
            handleDelete={handleDeleteClient}
          />
        )}
      </div>
    </div>
  );
};

// Section: Enhanced Edit Client Form Component
const EditClientForm: React.FC<{
  clientId: string;
  onSave: (data: Partial<ClientDetails>) => void;
  onCancel: () => void;
  onDelete: () => void;
  handleDelete: () => void;
}> = ({ clientId, onSave, onCancel, onDelete, handleDelete }) => {
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [clientError, setClientError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    isEmailVerified: false
  });
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  // Section: Load client data
  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoadingClient(true);
        setClientError('');
        const clientData = await adminService.getClientById(clientId);
        setClient(clientData);
        setFormData({
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email,
          phoneNumber: clientData.phoneNumber,
          isEmailVerified: clientData.isEmailVerified
        });
      } catch (err: any) {
        console.error('Error loading client:', err);
        setClientError(err.message || 'Failed to load client data');
      } finally {
        setLoadingClient(false);
      }
    };

    loadClient();
  }, [clientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Section: Show loading state while fetching client data
  if (loadingClient) {
    return (
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FiUser className="h-5 w-5 text-teal-600" />
              Loading Client...
            </DialogTitle>
          </DialogHeader>
          <div className="p-12 text-center">
            <FiLoader className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-600" />
            <p className="text-gray-600">Loading client data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Section: Show error state if failed to load client data
  if (clientError) {
    return (
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FiUser className="h-5 w-5 text-red-600" />
              Error Loading Client
            </DialogTitle>
          </DialogHeader>
          <div className="p-12 text-center">
            <FiAlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600 mb-4">{clientError}</p>
            <Button onClick={onCancel} variant="outline">
              Close
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
            Edit Client Profile
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>ID: {clientId}</span>
            {client?.createdAt && (
              <>
                <span>•</span>
                <span>Created: {new Date(client.createdAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiUser className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section: Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiShield className="h-4 w-4" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="emailVerified"
                  checked={formData.isEmailVerified}
                  onChange={(e) => setFormData(prev => ({ ...prev, isEmailVerified: e.target.checked }))}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <Label htmlFor="emailVerified" className="flex items-center gap-2 cursor-pointer">
                  <FiCheckCircle className="h-4 w-4 text-green-600" />
                  Email Verified
                </Label>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FiAlertCircle className="h-4 w-4" />
                <span>Email verification status affects the client's ability to access certain features.</span>
              </div>
            </CardContent>
          </Card>

          {/* Section: Client Information Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FiHome className="h-4 w-4" />
                Client Details (Read Only)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Type of Living</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-sm">{client?.typeOfLiving || 'Not specified'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">City</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-sm">{client?.address?.[0]?.city || 'Not specified'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Street Address</Label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-sm">{client?.address?.[0]?.streetAddress || 'Not specified'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Postal Code</Label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-sm">{client?.address?.[0]?.postalCode || 'Not specified'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Danger Zone */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                <FiTrash2 className="h-4 w-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-700">Delete Client Account</h4>
                  <p className="text-sm text-red-600 mt-1">
                    This action cannot be undone. This will permanently delete the client account and all associated data.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteSection(!showDeleteSection)}
                  className="flex items-center gap-2"
                >
                  <FiTrash2 className="h-4 w-4" />
                  {showDeleteSection ? 'Cancel Delete' : 'Delete Client'}
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
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Confirm Delete
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteSection(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminClients; 