// General Jobs Page for Providers
import React, { useEffect, useState } from 'react';
import Footer from '@/components/layout/footer';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import ChangeLang from '@/components/global/changeLangDropdonw';
import { getCookie } from '@/utils/authCookieService';
import { Filter, Calendar, Tag, Search, DollarSign, Copy, Check, Eye, Clock, X, Info, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import ServiceTypeDisplay from '@/components/global/ServiceTypeDisplay';
import ProfileCompletionDialog from '@/components/global/ProfileCompletionDialog';
import { useProfileValidation } from '@/hooks/useProfileValidation';

// Job type definition
// ... (reuse Job type from latest jobs page) ...
type Job = {
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
  expectedBrings?: string[]; // Add expected brings field
  createdAt: string;
  clientAccept: boolean;
  providerAccept: boolean;
};

// Add this function near other utility functions
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

// Add this component near other components
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();
  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded-md hover:bg-gray-100 transition-colors duration-200 group relative"
      title={t('latestJobs.copyAddress')}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-gray-500 group-hover:text-teal-500" />
      )}
      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {copied ? t('latestJobs.copied') : t('latestJobs.copyAddress')}
      </span>
    </button>
  );
};

// Helper to normalize service type keys to camelCase
const normalizeServiceTypeKey = (str: string) => {
  if (!str) return '';
  // Convert "Domestic cleaning" to "domesticCleaning"
  return str.charAt(0).toLowerCase() + str.slice(1).replace(/\s+([a-z])/g, (match, letter) => letter.toUpperCase());
};

const GeneralRequestsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const providerId = getCookie('providerId');
  // State for jobs
  const [generalJobs, setGeneralJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAcceptId, setProcessingAcceptId] = useState<string | null>(null);
  const [summaryModal, setSummaryModal] = useState<{ open: boolean; job: Job | null }>({ open: false, job: null });
  const [acceptedJobId, setAcceptedJobId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Profile validation hook for providers
  const {
    checkProfileBeforeAction,
    showCompletionDialog,
    setShowCompletionDialog,
    missingFields,
    hasAnyData
  } = useProfileValidation();

  // Helper function to safely handle typeOfService (string or array)
  const getServiceTypes = (typeOfService: any): string[] => {
    if (!typeOfService) return [];
    if (Array.isArray(typeOfService)) return typeOfService;
    if (typeof typeOfService === 'string') return [typeOfService];
    return [];
  };

  // Add filter states
  const [filters, setFilters] = useState({
    dateRange: 'all',
    serviceType: '',
    searchQuery: '',
    priceRange: 'all'
  });

  // Format date and time
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Fetch general jobs (scheduled jobs with no providerId)
  useEffect(() => {
    const fetchGeneralJobs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/booking?status=scheduled`);
        if (response.ok) {
          const data = await response.json();
          setGeneralJobs(data.filter((job: any) => !job.providerId));
        } else {
          setError(t('generalRequests.failedToLoadGeneralJobs'));
        }
      } catch (err) {
        setError(t('generalRequests.failedToLoadGeneralJobs'));
      } finally {
        setLoading(false);
      }
    };
    fetchGeneralJobs();
  }, [t]);

  // Accept handler for provider
  const handleAcceptJob = async (jobId: string) => {
    // Check if profile is complete before accepting job
    const isAllowed = await checkProfileBeforeAction(async () => {
      await performJobAcceptance(jobId);
    });
    if (!isAllowed) {
      return; // Profile incomplete, action was blocked and dialog shown
    }
  };

  // Separated job acceptance logic
  const performJobAcceptance = async (jobId: string) => {
    setProcessingAcceptId(jobId);
    try {
      if (!providerId) {
        toast.error(t('generalRequests.providerNotLoggedIn'));
        return;
      }
      const patchBody: any = { providerAccept: true, providerId };
      const response = await fetch(`${API_BASE_URL}/booking/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      if (!response.ok) throw new Error('Failed to accept job');
      
      // Show success message and set accepted job
      setAcceptedJobId(jobId);
      setShowSuccessMessage(true);
      toast.success(t('generalRequests.jobAcceptedSuccessfully'));
      
      // Update local state
      setGeneralJobs(jobs => jobs.map(job => job.id === jobId ? { ...job, providerAccept: true, providerId } : job));
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        setAcceptedJobId(null);
      }, 5000);
    } catch (error) {
      toast.error(t('generalRequests.errorAcceptingJob'));
    } finally {
      setProcessingAcceptId(null);
    }
  };

  // Filter jobs based on selected filters
  const getFilteredJobs = (jobs: Job[]) => {
    return jobs.filter(job => {
      // Date range filter
      if (filters.dateRange !== 'all') {
        const jobDate = new Date(job.bookingDate);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        switch (filters.dateRange) {
          case 'today':
            return jobDate.toDateString() === today.toDateString();
          case 'tomorrow':
            return jobDate.toDateString() === tomorrow.toDateString();
          case 'week':
            return jobDate >= today && jobDate <= nextWeek;
          default:
            return true;
        }
      }

      // Service type filter
      const serviceTypes = getServiceTypes(job.typeOfService);
      if (filters.serviceType && !serviceTypes.some(service => service.toLowerCase().includes(filters.serviceType.toLowerCase()))) {
        return false;
      }

      // Price range filter
      if (filters.priceRange !== 'all') {
        const price = parseFloat(job.totalPrice);
        switch (filters.priceRange) {
          case 'low':
            return price <= 500;
          case 'medium':
            return price > 500 && price <= 1000;
          case 'high':
            return price > 1000;
          default:
            return true;
        }
      }

      // Search query filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        return (
          serviceTypes.some(service => service.toLowerCase().includes(searchLower)) ||
          job.serviceAddress.toLowerCase().includes(searchLower) ||
          job.status.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  };

  // Get filtered jobs
  const filteredGeneralJobs = getFilteredJobs(generalJobs);

  // Render jobs list
  const renderJobsList = (jobs: Job[]) => {
    if (jobs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {t('generalRequests.noGeneralJobsAvailable')}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="relative p-5 border rounded-2xl bg-white/95 shadow-lg transition-all duration-200 hover:shadow-2xl hover:scale-[1.02] flex flex-col gap-2 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-full border-gray-100 before:from-teal-400 before:to-teal-600 hover:bg-gradient-to-br hover:from-teal-50 hover:to-white"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="flex items-center justify-between mb-2">
              <ServiceTypeDisplay services={getServiceTypes(job.typeOfService).map(type => t(`latestJobs.tags.${normalizeServiceTypeKey(type)}`) || type)} variant="compact" className="font-semibold text-lg" />
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                  {t('latestJobs.statusValues.' + (job.status ? job.status.toLowerCase() : 'pending'))}
                </span>
                <button
                  className="ml-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold hover:bg-teal-200 transition flex items-center gap-1"
                  onClick={() => setSummaryModal({ open: true, job })}
                >
                  <Eye className="w-4 h-4 mr-1" /> {t('latestJobs.viewSummary')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 text-teal-500" />
                  <span>{formatDateTime(job.bookingDate)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2 text-teal-500" />
                  <span>{job.proposedStartTime} - {job.proposedEndTime}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📍</span>
                  <div className="flex items-center gap-2">
                    <span>{job.serviceAddress}</span>
                    <div className="group relative">
                      <Button
                        type="button"
                        variant="ghost"
                        className="p-2 hover:bg-teal-50 rounded-lg transition-all duration-200 hover:scale-105"
                        onClick={() => navigate('/register/client?step=2')}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-teal-500 group-hover:text-teal-600 transition-colors"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Button>
                      <div className="pointer-events-none absolute z-10 w-48 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity -right-2 top-full">
                        {t("tooltips.editAddressInProfile") || "Edit your address in profile settings"}
                      </div>
                    </div>
                  </div>
                  <CopyButton text={job.serviceAddress} />
                </div>
                
                {/* Expected Brings Section */}
                {job.expectedBrings && job.expectedBrings.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📦</span>
                    <span className="font-medium mr-2">{t('expectedBrings')}:</span>
                    <div className="flex flex-wrap gap-1">
                      {job.expectedBrings.map((item, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full border border-orange-200"
                        >
                          {t(`comboBox.serviceEnablers.${item}`) || item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-lg font-bold text-teal-700">{t('generalRequests.currency', { value: job.totalPrice })}</span>
                </div>
                <div className="flex flex-col items-end mt-2">
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                    <Info className="w-4 h-4 text-teal-500" />
                    <span className="italic">{t('generalRequests.acceptingJobWillMove')}</span>
                  </div>
                  {showSuccessMessage && acceptedJobId === job.id && (
                    <div className="flex items-center gap-2 mb-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <Check className="w-4 h-4" />
                      <span>{t('generalRequests.jobMovedToRequests')}</span>
                      <button
                        onClick={() => navigate('/latest-jobs')}
                        className="flex items-center gap-1 text-green-700 hover:text-green-800 font-medium"
                      >
                        {t('generalRequests.viewNow')}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {(!showSuccessMessage || acceptedJobId !== job.id) && (
                    <button
                      onClick={() => handleAcceptJob(job.id)}
                      disabled={processingAcceptId === job.id}
                      className="flex items-center gap-1 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-full shadow-md px-4 py-2 font-semibold hover:from-teal-600 hover:to-teal-800 hover:scale-105 hover:text-white transition-all border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingAcceptId === job.id ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2">⟳</span> {t('generalRequests.processing')}
                        </span>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" /> {t('generalRequests.acceptJob')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100">
      {/* Top bar with logo and language selector */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur shadow-md border-b border-teal-100 flex items-center justify-between px-6 py-3">
        <a href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-extrabold text-teal-600 group-hover:text-teal-700 transition">Vitago</span>
          <span className="relative ml-1">
            <span className="absolute inset-0 bg-teal-400 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></span>
            <span className="relative h-2 w-2 bg-teal-500 rounded-full group-hover:animate-ping inline-block"></span>
          </span>
        </a>
        <ChangeLang />
      </div>
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col mb-8 mt-8 sm:mt-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('generalRequests.pageTitle')}
            </h1>
            <button onClick={() => navigate(-1)} className="text-teal-600 hover:text-teal-700 mt-2 flex items-center">
              ← {t('generalRequests.back')}
            </button>

            {/* Filter Section */}
            <div className="bg-white/90 rounded-xl p-4 shadow-sm border border-teal-100 mb-6">
              <div className="flex flex-wrap gap-4">
                {/* Date Range Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('generalRequests.filters.dateRange')}</label>
                  <div className="relative group">
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 group-hover:border-teal-300 transition-colors duration-200"
                    >
                      <option value="all">{t('generalRequests.filters.allDates')}</option>
                      <option value="today">{t('generalRequests.filters.today')}</option>
                      <option value="tomorrow">{t('generalRequests.filters.tomorrow')}</option>
                      <option value="week">{t('generalRequests.filters.next7Days')}</option>
                    </select>
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-hover:text-teal-500 group-hover:scale-110 transition-all duration-200" />
                  </div>
                </div>

                {/* Service Type Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('generalRequests.filters.serviceType')}</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={filters.serviceType}
                      onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value }))}
                      placeholder={t('generalRequests.filters.filterByServiceType')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 group-hover:border-teal-300 transition-colors duration-200"
                    />
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-hover:text-teal-500 group-hover:scale-110 transition-all duration-200" />
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('generalRequests.filters.priceRange')}</label>
                  <div className="relative group">
                    <select
                      value={filters.priceRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 group-hover:border-teal-300 transition-colors duration-200"
                    >
                      <option value="all">{t('generalRequests.filters.allPrices')}</option>
                      <option value="low">{t('generalRequests.filters.low')}</option>
                      <option value="medium">{t('generalRequests.filters.medium')}</option>
                      <option value="high">{t('generalRequests.filters.high')}</option>
                    </select>
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-hover:text-teal-500 group-hover:scale-110 transition-all duration-200" />
                  </div>
                </div>

                {/* Search Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('generalRequests.filters.search')}</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={filters.searchQuery}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                      placeholder={t('generalRequests.filters.searchJobs')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 group-hover:border-teal-300 transition-colors duration-200"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-hover:text-teal-500 group-hover:scale-110 transition-all duration-200" />
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({
                      dateRange: 'all',
                      serviceType: '',
                      searchQuery: '',
                      priceRange: 'all'
                    })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 hover:shadow-md"
                  >
                    <Filter className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                    {t('generalRequests.filters.clearFilters')}
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-gray-600 text-sm py-4">{t('generalRequests.loadingGeneralJobs')}</div>
            ) : error ? (
              <div className="text-red-600 text-sm py-4">{error}</div>
            ) : (
              <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-teal-100">
                <h2 className="text-2xl font-extrabold mb-6 text-teal-700 tracking-tight border-l-4 border-teal-400 pl-4 bg-gradient-to-r from-teal-50 to-white py-2">
                  {t('generalRequests.generalJobs')}
                </h2>
                {renderJobsList(filteredGeneralJobs)}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Summary Modal */}
      {summaryModal.open && summaryModal.job && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative">
            <button 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" 
              onClick={() => setSummaryModal({ open: false, job: null })}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-teal-700 flex items-center gap-2">
              {t('generalRequests.jobSummary')}
            </h2>
            <div className="space-y-2 text-gray-700">
              <div><b>{t('generalRequests.service')}:</b> <ServiceTypeDisplay services={getServiceTypes(summaryModal.job.typeOfService).map(type => t(`latestJobs.tags.${normalizeServiceTypeKey(type)}`) || type)} variant="inline" /></div>
              {summaryModal.job.expectedBrings && summaryModal.job.expectedBrings.length > 0 && (
                <div><b>{t('expectedBrings')}:</b> {summaryModal.job.expectedBrings.map(item => t(`comboBox.serviceEnablers.${item}`) || item).join(', ')}</div>
              )}
              <div><b>{t('generalRequests.date')}:</b> {formatDateTime(summaryModal.job.bookingDate)}</div>
              <div><b>{t('generalRequests.time')}:</b> {summaryModal.job.proposedStartTime} - {summaryModal.job.proposedEndTime}</div>
              <div><b>{t('generalRequests.address')}:</b> {summaryModal.job.serviceAddress}</div>
              <div><b>{t('generalRequests.totalPrice')}:</b> {t('generalRequests.currency', { value: summaryModal.job.totalPrice })}</div>
              <div><b>{t('generalRequests.status')}:</b> {t('latestJobs.statusValues.' + (summaryModal.job.status ? summaryModal.job.status.toLowerCase() : 'pending'))}</div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Completion Dialog */}
      <ProfileCompletionDialog
        isOpen={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        missingFields={missingFields}
        hasAnyData={hasAnyData}
      />
    </div>
  );
};

export default GeneralRequestsPage; 