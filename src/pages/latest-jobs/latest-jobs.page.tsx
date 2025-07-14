//@collaps
import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, Check, X, Filter, Pencil, Eye, Search, Tag, DollarSign, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/layout/footer";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { API_BASE_URL } from '@/config/api';
import { getCookie } from '@/utils/authCookieService';
import ChangeLang from '@/components/global/changeLangDropdonw';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import CustomTimePicker from '@/components/global/CustomTimePicker';
import ReportDialog from '@/components/global/ReportDialog';
import { ReportService } from '@/services/report.service';
import { Report } from '@/types/report';
import StarRating from '@/components/global/StarRating';
import StatusTimeline, { StatusStep } from '@/components/global/StatusTimeline';
import Confetti from "react-confetti";
import { clientService } from '@/services/client.service';
import { providerService } from '@/services/provider.service';
import ServiceTypeDisplay from '@/components/global/ServiceTypeDisplay';
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/global/combobox";
import { serviceEnablersList } from "@/lists/serviceEnablers";
import ProfileCompletionDialog from '@/components/global/ProfileCompletionDialog';
import { useProfileValidation } from '@/hooks/useProfileValidation';

type Job = {
  id: string;
  clientId: string;
  providerId: string;
  bookingDate: string;
  typeOfService: string[];
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
  clientAccept?: boolean;
  providerAccept?: boolean;
  clientAcceptTimestamp?: string;
  providerAcceptTimestamp?: string;
};

const LatestJobsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Get clientId and providerId from cookies
  const clientId = getCookie('clientId');
  const providerId = getCookie('providerId');

  // Profile validation hook for providers
  const {
    checkProfileBeforeAction,
    showCompletionDialog,
    setShowCompletionDialog,
    missingFields,
    hasAnyData
  } = useProfileValidation();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [GeneralJobs, setGeneralJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string>("");

  // Add state for client and provider profiles
  const [clientProfiles, setClientProfiles] = useState<Record<string, any>>({});
  const [providerProfiles, setProviderProfiles] = useState<Record<string, any>>({});

  // Add separate state for client and provider jobs
  const [clientJobs, setClientJobs] = useState<Job[]>([]);
  const [providerJobs, setProviderJobs] = useState<Job[]>([]);

  // Add state for editing jobs
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editForm, setEditForm] = useState<Partial<Job>>({});
  const [editLoading, setEditLoading] = useState(false);

  // Add state for processing accept
  const [processingAcceptId, setProcessingAcceptId] = useState<string | null>(null);

  // Add state for edit confirmation
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false);
  const [pendingEditRole, setPendingEditRole] = useState<'client' | 'provider' | null>(null);

  // Helper function to safely handle typeOfService (string or array)
  const getServiceTypes = (typeOfService: any): string[] => {
    if (!typeOfService) return [];
    if (Array.isArray(typeOfService)) return typeOfService;
    if (typeof typeOfService === 'string') return [typeOfService];
    return [];
  };

  // Add filter states
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    serviceType: '',
    searchQuery: ''
  });

  // Add report state
  const [reports, setReports] = useState<Record<string, Report[]>>({});
  const [reportDialog, setReportDialog] = useState({
    isOpen: false,
    mode: 'create' as 'create' | 'accept' | 'view',
    bookingId: '',
    existingReport: null as Report | null
  });
  const [loadingReports, setLoadingReports] = useState<Record<string, boolean>>({});

  // Add expanded timelines state
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});

  // Add state for summary modal and confetti
  const [summaryModal, setSummaryModal] = useState<{ open: boolean, job: Job | null }>({ open: false, job: null });
  const [showConfetti, setShowConfetti] = useState(false);
  const prevCompletedJobsRef = useRef<string[]>([]);
  
  // Add state for provider data
  const [providerData, setProviderData] = useState<Record<string, any>>({});

  // Accept handler for client and provider, updates local state after API call
  const handleAcceptJob = async (jobId: string, role: 'client' | 'provider') => {
    // For providers, check if profile is complete before accepting job
    if (role === 'provider' && providerId) {
      const isAllowed = await checkProfileBeforeAction(async () => {
        await performJobAcceptance(jobId, role);
      });
      if (!isAllowed) {
        return; // Profile incomplete, action was blocked and dialog shown
      }
    } else {
      // For clients, proceed normally
      await performJobAcceptance(jobId, role);
    }
  };

  // Separated job acceptance logic
  const performJobAcceptance = async (jobId: string, role: 'client' | 'provider') => {
    setProcessingAcceptId(jobId);
    try {
      const patchBody: any = {};
      if (role === 'client') patchBody.clientAccept = true;
      if (role === 'provider') patchBody.providerAccept = true;
      // Do NOT set status here; let backend handle status based on both accepts
      const response = await fetch(`${API_BASE_URL}/booking/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      if (!response.ok) throw new Error('Failed to accept job');
      toast.success(t('latestJobs.jobAccepted'));
      // Update local state for the relevant job list
      const updateJob = (job: Job) => {
        if (job.id !== jobId) return job;
        if (role === 'client') {
          return {
            ...job,
            clientAccept: true,
          };
        } else {
          return {
            ...job,
            providerAccept: true,
          };
        }
      };
      if (role === 'client') setClientJobs(jobs => jobs.map(updateJob));
      if (role === 'provider') setProviderJobs(jobs => jobs.map(updateJob));
    } catch (error) {
      toast.error(t('latestJobs.errorAcceptingJob'));
    } finally {
      setProcessingAcceptId(null);
    }
  };

  // reject job
  const handleRejectJob = async (jobId: string, role: 'client' | 'provider') => {
    try {
      const patchBody: any = {};
      if (role === 'client') patchBody.clientAccept = false;
      if (role === 'provider') patchBody.providerAccept = false;
      patchBody.status = 'Rejected';
      const response = await fetch(`${API_BASE_URL}/booking/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      if (!response.ok) throw new Error('Failed to reject job');
      toast.success(t('latestJobs.jobRejected'));
      // Refetch jobs or update state as needed
      // ...
    } catch (error) {
      toast.error(t('latestJobs.errorRejectingJob'));
    }
  };

  // --- Helper: Check if user is provider (based on URL param) ---
  const isProvider = Boolean(providerId);

  // --- Helper: Render empty or error state ---
  const renderStateMessage = (msg: string) => (
    <div className="text-gray-600 text-sm py-4">{msg}</div>
  );

  // --- Redirect if neither clientId nor providerId ---
  useEffect(() => {
    if (!clientId && !providerId) {
      toast.error(t('latestJobs.pleaseLoginFirst'));
      navigate('/');
    }
  }, [clientId, providerId, navigate, t]);

  // Add function to fetch user profiles
  const fetchUserProfiles = async (job: Job) => {
    try {
      // Fetch client profile if not already fetched
      if (!clientProfiles[job.clientId]) {
        const clientData = await clientService.getClient(job.clientId);
        setClientProfiles(prev => ({ ...prev, [job.clientId]: clientData }));
      }
      
      // Fetch provider profile if not already fetched
      if (!providerProfiles[job.providerId]) {
        const providerData = await providerService.getProfile(job.providerId);
        setProviderProfiles(prev => ({ ...prev, [job.providerId]: providerData }));
      }
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  };

  // Modify the fetchJobs function to fetch profiles
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        // Fetch client jobs if clientId exists
        if (clientId) {
          const response = await fetch(`${API_BASE_URL}/booking?clientId=${clientId}`);
          if (response.ok) {
            const data = await response.json();
            const sortedJobs = data.sort((a: any, b: any) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
            setClientJobs(sortedJobs);
            // Fetch profiles for each job
            sortedJobs.forEach(fetchUserProfiles);
          }
        }
        // Fetch provider jobs if providerId exists
        if (providerId) {
          const response = await fetch(`${API_BASE_URL}/booking?providerId=${providerId}`);
          if (response.ok) {
            const data = await response.json();
            const sortedJobs = data.sort((a: any, b: any) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
            setProviderJobs(sortedJobs);
            // Fetch profiles for each job
            sortedJobs.forEach(fetchUserProfiles);
          }
        }
      } catch (err) {
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [clientId, providerId]);

  // Load reports for a specific booking
  const loadReports = async (bookingId: string) => {
    if (loadingReports[bookingId]) return;
    
    setLoadingReports(prev => ({ ...prev, [bookingId]: true }));
    try {
      const bookingReports = await ReportService.getReportsByBooking(bookingId);
      setReports(prev => ({ ...prev, [bookingId]: bookingReports }));
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoadingReports(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  // Get reports for a booking
  const getBookingReports = (bookingId: string): Report[] => {
    return reports[bookingId] || [];
  };

  // Check if provider has created a report
  const hasProviderReport = (bookingId: string): Report | null => {
    const bookingReports = getBookingReports(bookingId);
    return bookingReports.find(report => report.providerAccept) || null;
  };

  // Check if client has accepted/responded to report
  const hasClientAcceptedReport = (bookingId: string): boolean => {
    const bookingReports = getBookingReports(bookingId);
    return bookingReports.some(report => report.clientAccept);
  };

  // Open report dialog
  const openReportDialog = (mode: 'create' | 'accept' | 'view', bookingId: string, existingReport?: Report) => {
    setReportDialog({
      isOpen: true,
      mode,
      bookingId,
      existingReport: existingReport || null
    });
  };

  // Close report dialog
  const closeReportDialog = () => {
    setReportDialog({
      isOpen: false,
      mode: 'create',
      bookingId: '',
      existingReport: null
    });
  };

  // Handle report success (refresh reports)
  const handleReportSuccess = () => {
    if (reportDialog.bookingId) {
      loadReports(reportDialog.bookingId);
    }
  };

  // Load reports for all jobs
  useEffect(() => {
    const allJobs = [...clientJobs, ...providerJobs];
    allJobs.forEach(job => {
      if (job.clientAccept && job.providerAccept) {
        loadReports(job.id);
      }
    });
  }, [clientJobs, providerJobs]);

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

  // Helper to normalize service type keys to camelCase
  const normalizeServiceTypeKey = (str: string) => {
    if (!str) return '';
    // Convert "Domestic cleaning" to "domesticCleaning"
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/\s+([a-z])/g, (match, letter) => letter.toUpperCase());
  };

  // Status labels for each role
  const getCombinedStatus = (job: Job) => {
    if (job.clientAccept && job.providerAccept) {
      const hasReport = hasProviderReport(job.id);
      if (hasReport) {
        const clientAcceptedReport = hasClientAcceptedReport(job.id);
        return clientAcceptedReport ? t('latestJobs.statusValues.completed') : t('latestJobs.statusValues.waitingForRating');
      } else {
        return t('latestJobs.statusValues.jobInProgress');
      }
    } else if (job.clientAccept) {
      return t('latestJobs.statusValues.waitingForProvider');
    } else if (job.providerAccept) {
      return t('latestJobs.statusValues.waitingForClient');
    } else {
      return t('latestJobs.statusValues.pending');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'job in progress':
        return 'bg-blue-100 text-blue-800 animate-pulse';
      case 'waiting for rating':
        return 'bg-amber-100 text-amber-800';
      case 'waiting for provider':
      case 'waiting for client':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Open edit modal/form
  // Fetch provider data for service enablers
  const fetchProviderData = async (providerId: string) => {
    if (providerData[providerId]) return; // Already fetched
    
    try {
      const response = await fetch(`${API_BASE_URL}/provider/${providerId}`);
      if (response.ok) {
        const data = await response.json();
        setProviderData(prev => ({ ...prev, [providerId]: data }));
      }
    } catch (error) {
      console.error('Failed to fetch provider data:', error);
    }
  };

  const handleEditClick = (job: Job) => {
    setEditingJob(job);
    setEditForm({
      typeOfService: job.typeOfService,
      bookingDate: job.bookingDate,
      proposedStartTime: job.proposedStartTime,
      proposedEndTime: job.proposedEndTime,
      serviceAddress: job.serviceAddress,
      expectedBrings: job.expectedBrings || [],
    });
    
    // Fetch provider data if not already fetched
    if (job.providerId) {
      fetchProviderData(job.providerId);
    }
  };

  // Handle edit form change
  const handleEditFormChange = (field: keyof Job, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // Save edit with confirmation
  const handleEditSave = async (role: 'client' | 'provider') => {
    if (!editingJob) return;
    setPendingEditRole(role);
    setShowEditConfirmDialog(true);
  };

  // Handle confirmed edit
  const handleConfirmedEdit = async () => {
    if (!editingJob || !pendingEditRole) return;
    setEditLoading(true);
    try {
      // Prepare the patch body with form data and accept status updates
      const patchBody: any = { 
        ...editForm,
        // Set current user's accept status to true automatically
        ...(pendingEditRole === 'client' && { clientAccept: true, clientAcceptTimestamp: new Date().toISOString() }),
        ...(pendingEditRole === 'provider' && { providerAccept: true, providerAcceptTimestamp: new Date().toISOString() }),
        // Reset the other role's accept status to false (they need to re-approve changes)
        ...(pendingEditRole === 'client' && { providerAccept: false }),
        ...(pendingEditRole === 'provider' && { clientAccept: false })
      };

      const response = await fetch(`${API_BASE_URL}/booking/${editingJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      if (!response.ok) throw new Error('Failed to update job');
      toast.success(t('jobUpdated'));
      
      // Update local state with the new values
      const updateJob = (job: Job) => {
        if (job.id !== editingJob.id) return job;
        return {
          ...job,
          ...editForm,
          // Set current user's accept status to true
          ...(pendingEditRole === 'client' && { 
            clientAccept: true, 
            clientAcceptTimestamp: new Date().toISOString(),
            providerAccept: false 
          }),
          ...(pendingEditRole === 'provider' && { 
            providerAccept: true, 
            providerAcceptTimestamp: new Date().toISOString(),
            clientAccept: false 
          })
        };
      };
      
      if (pendingEditRole === 'client') setClientJobs(jobs => jobs.map(updateJob));
      if (pendingEditRole === 'provider') setProviderJobs(jobs => jobs.map(updateJob));
      
      setEditingJob(null);
      setEditForm({});
      setShowEditConfirmDialog(false);
      setPendingEditRole(null);
    } catch (error) {
      toast.error(t('errorUpdatingJob'));
    } finally {
      setEditLoading(false);
    }
  };

  // Cancel edit
  const handleEditCancel = () => {
    setEditingJob(null);
    setEditForm({});
  };

  // Filter jobs based on selected filters
  const getFilteredJobs = (jobs: Job[]) => {
    return jobs.filter(job => {
      // Status filter
      if (filters.status !== 'all') {
        const status = getCombinedStatus(job).toLowerCase().replace(/ /g, '_');
        if (filters.status !== status) return false;
      }

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
  const filteredClientJobs = getFilteredJobs(clientJobs).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const filteredProviderJobs = getFilteredJobs(providerJobs).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Add this function to generate status history
  const getStatusHistory = (job: Job, userRole: 'client' | 'provider'): StatusStep[] => {
    const steps: StatusStep[] = [];
    
    // Initial booking
    steps.push({
      status: t('latestJobs.statusSteps.bookingCreated'),
      timestamp: job.createdAt,
      description: userRole === 'client' ? t('latestJobs.statusDescriptions.youCreatedRequest') : t('latestJobs.statusDescriptions.clientCreatedRequest'),
      isCompleted: true,
      isCurrent: false
    });

    // Client acceptance
    if (job.clientAccept) {
      steps.push({
        status: t('latestJobs.statusSteps.clientAccepted'),
        timestamp: job.clientAcceptTimestamp || job.createdAt,
        description: userRole === 'client' ? t('latestJobs.statusDescriptions.youAcceptedRequest') : t('latestJobs.statusDescriptions.clientAcceptedRequest'),
        isCompleted: true,
        isCurrent: false
      });
    } else {
      steps.push({
        status: userRole === 'client' ? t('latestJobs.statusSteps.pleaseAcceptBooking') : t('latestJobs.statusSteps.waitingForClientAcceptance'),
        timestamp: job.createdAt,
        description: userRole === 'client' ? t('latestJobs.statusDescriptions.pleaseReviewAccept') : t('latestJobs.statusDescriptions.waitingForClientAccept'),
        isCompleted: false,
        isCurrent: true,
        needsCompletion: true
      });
    }

    // Provider acceptance
    if (job.providerAccept) {
      steps.push({
        status: t('latestJobs.statusSteps.providerAccepted'),
        timestamp: job.providerAcceptTimestamp || job.createdAt,
        description: userRole === 'provider' ? t('latestJobs.statusDescriptions.youAcceptedRequest') : t('latestJobs.statusDescriptions.providerAcceptedRequest'),
        isCompleted: true,
        isCurrent: false
      });
    } else {
      steps.push({
        status: userRole === 'provider' ? t('latestJobs.statusSteps.pleaseAcceptBooking') : t('latestJobs.statusSteps.waitingForProviderAcceptance'),
        timestamp: job.createdAt,
        description: userRole === 'provider' ? t('latestJobs.statusDescriptions.pleaseReviewAccept') : t('latestJobs.statusDescriptions.waitingForProviderAccept'),
        isCompleted: false,
        isCurrent: true,
        needsCompletion: true
      });
    }

    // Report status
    const providerReport = hasProviderReport(job.id);
    const clientAcceptedReport = hasClientAcceptedReport(job.id);
    
    if (providerReport) {
      steps.push({
        status: t('latestJobs.statusSteps.serviceReportCreated'),
        timestamp: providerReport.createdAt,
        description: userRole === 'provider' ? t('latestJobs.statusDescriptions.youCreatedReport') : t('latestJobs.statusDescriptions.providerCreatedReport'),
        isCompleted: true,
        isCurrent: false
      });

      if (clientAcceptedReport) {
        steps.push({
          status: t('latestJobs.statusSteps.serviceCompleted'),
          timestamp: providerReport.createdAt,
          description: userRole === 'client' ? t('latestJobs.statusDescriptions.youRatedAccepted') : t('latestJobs.statusDescriptions.clientRatedAccepted'),
          isCompleted: true,
          isCurrent: false
        });
      } else {
        steps.push({
          status: userRole === 'client' ? t('latestJobs.statusSteps.pleaseRateService') : t('latestJobs.statusSteps.waitingForClientRating'),
          timestamp: providerReport.createdAt,
          description: userRole === 'client' ? t('latestJobs.statusDescriptions.pleaseReviewRate') : t('latestJobs.statusDescriptions.waitingForClientRate'),
          isCompleted: false,
          isCurrent: true,
          needsCompletion: true
        });
      }
    } else if (job.clientAccept && job.providerAccept) {
      steps.push({
        status: t('latestJobs.statusSteps.serviceInProgress'),
        timestamp: new Date().toISOString(),
        description: userRole === 'provider'
          ? t('latestJobs.statusDescriptions.providerWorking')
          : t('latestJobs.statusDescriptions.clientWaiting'),
        isCompleted: false,
        isCurrent: true,
        needsCompletion: true
      });
    }

    return steps;
  };

  // Toggle timeline expansion
  const toggleTimeline = (jobId: string) => {
    setExpandedTimelines(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  // Effect to trigger confetti when a job is newly completed
  useEffect(() => {
    const completedJobs = [...clientJobs, ...providerJobs].filter(j => hasClientAcceptedReport(j.id)).map(j => j.id);
    const prevCompletedJobs = prevCompletedJobsRef.current;
    const newCompleted = completedJobs.find(id => !prevCompletedJobs.includes(id));
    if (newCompleted) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    }
    prevCompletedJobsRef.current = completedJobs;
  }, [clientJobs, providerJobs]);

  // Add function to handle provider profile click
  const handleProviderClick = (providerId: string) => {
    navigate(`/provider/${providerId}`);
  };

  // --- Render jobs list with empty state ---
  const renderJobsList = (jobsList: Job[], emptyMsg: string, role: 'client' | 'provider') => {
    if (jobsList.length === 0) {
      return renderStateMessage(emptyMsg);
    }
    return (
      <div className="space-y-6">
        {jobsList.map((job) => {

          // Only show accept button for the relevant role in this list
          const showAcceptAction =
            (role === 'client' && job.clientAccept === false) ||
            (role === 'provider' && job.providerAccept === false);
          // Only show status as 'Accepted' if both accepted
          const isFullyAccepted = job.clientAccept && job.providerAccept;
          // Check if job can be edited
          const canEdit = (clientId && job.clientId === clientId) || (providerId && job.providerId === providerId);
          const hasReport = hasProviderReport(job.id);
          const isEditing = editingJob && editingJob.id === job.id;

          // Only allow editing if there's no report AND the job hasn't been accepted by both parties
          const canEditJob = canEdit && !hasReport && !(job.clientAccept && job.providerAccept);

          // Report status
          const providerReport = hasProviderReport(job.id);
          const clientAcceptedReport = hasClientAcceptedReport(job.id);
          const canCreateReport = role === 'provider' && !providerReport && isFullyAccepted;
          const canRespondToReport = role === 'client' && providerReport && !clientAcceptedReport;
          const canViewReport = providerReport && (clientAcceptedReport || role === 'provider');
          return (
            <div
              key={job.id}
              className={`relative p-5 border rounded-2xl bg-white/95 shadow-lg transition-all duration-200 hover:shadow-2xl hover:scale-[1.02] flex flex-col gap-2 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-full ${
                clientAcceptedReport 
                  ? 'bg-gradient-to-br from-green-50 to-white border-green-200 before:from-green-400 before:to-green-600 hover:from-green-100 hover:to-white' 
                  : 'border-gray-100 before:from-teal-400 before:to-teal-600 hover:bg-gradient-to-br hover:from-teal-50 hover:to-white'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <div className="flex items-center justify-between mb-2">
                <ServiceTypeDisplay services={getServiceTypes(job.typeOfService).map(type => t(`latestJobs.tags.${normalizeServiceTypeKey(type)}`) || type)} variant="compact" className="font-semibold text-lg" />
                <div className="flex items-center gap-4">
                  {/* Client Profile */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={clientProfiles[job.clientId]?.profileImage ? `${API_BASE_URL}/${clientProfiles[job.clientId].profileImage}` : "/assets/img/client.jpg"}
                        alt={t('latestJobs.client')}
                        className="w-8 h-8 rounded-full object-cover border-2 border-teal-100"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-teal-500 text-white text-xs px-1.5 py-0.5 rounded-full">C</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {clientProfiles[job.clientId]?.firstName} {clientProfiles[job.clientId]?.lastName}
                      </span>
                      <span className="text-xs text-gray-500">{t('latestJobs.labels.client')}</span>
                    </div>
                  </div>

                  {/* Provider Profile */}
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-teal-50 p-1 rounded-lg transition-colors duration-200"
                    onClick={() => handleProviderClick(job.providerId)}
                  >
                    <div className="relative">
                      <img
                        src={providerProfiles[job.providerId]?.profileImage ? `${API_BASE_URL}/${providerProfiles[job.providerId].profileImage}` : "/assets/img/provider.jpg"}
                        alt={t('latestJobs.provider')}
                        className="w-8 h-8 rounded-full object-cover border-2 border-teal-100"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">P</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 hover:text-teal-600 transition-colors duration-200">
                        {providerProfiles[job.providerId]?.firstName} {providerProfiles[job.providerId]?.lastName}
                      </span>
                      <span className="text-xs text-gray-500">{t('latestJobs.labels.provider')}</span>
                    </div>
                  </div>

                  {clientAcceptedReport && (
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={hasProviderReport(job.id)?.rate || 0} starClassName="w-4 h-4" />
                      <span className="text-sm font-medium text-gray-600">({hasProviderReport(job.id)?.rate?.toFixed(1) || '0.0'})</span>
                    </div>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${clientAcceptedReport ? 'bg-green-100 text-green-800 flex items-center gap-1' : getStatusColor(getCombinedStatus(job))}`}> 
                    {clientAcceptedReport ? <><Check className="w-3 h-3" /><Check className="w-3 h-3 -ml-2" /> {t('latestJobs.completed')}</> : getCombinedStatus(job)}
                  </span>
                  <button
                    className="ml-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold hover:bg-teal-200 transition flex items-center gap-1"
                    onClick={() => setSummaryModal({ open: true, job })}
                  >
                    <Eye className="w-4 h-4 mr-1" /> {t('latestJobs.showSummary')}
                  </button>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Clock className="w-4 h-4 mr-2 text-teal-500" />
                <span className="font-medium">{formatDateTime(job.bookingDate)}</span>
                <span className="mx-2 text-gray-400">|</span>
                <span>{job.proposedStartTime} - {job.proposedEndTime}</span>
              </div>
              <div className="text-sm text-gray-600 mb-1 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">📍</span> <span>{job.serviceAddress}</span>
                  <CopyButton text={job.serviceAddress} />
                </div>
                <div className="flex items-center text-lg font-extrabold text-teal-800 ml-4 whitespace-nowrap">
                  {t('latestJobs.currency', { value: job.totalPrice })}
                </div>
              </div>
              
              {/* Expected Brings Section */}
              {job.expectedBrings && job.expectedBrings.length > 0 && (
                <div className="text-sm text-gray-600 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="mr-2">📦</span>
                    <span className="font-medium">{t('expectedBrings')}:</span>
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
                </div>
              )}
              
              {/* Report Status Section */}
              {isFullyAccepted && (
                <div 
                  onClick={() => {
                    if (canCreateReport) {
                      openReportDialog('create', job.id);
                    } else if (canRespondToReport) {
                      openReportDialog('accept', job.id, providerReport);
                    } else if (canViewReport) {
                      openReportDialog('view', job.id, providerReport);
                    }
                  }}
                  className={`
                    relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer
                    ${canCreateReport || canRespondToReport || canViewReport ? 'hover:scale-[1.02] hover:shadow-lg' : ''}
                    ${providerReport 
                      ? clientAcceptedReport 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg' 
                        : canRespondToReport 
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 animate-pulse shadow-lg ring-2 ring-amber-200' 
                          : 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200'
                      : canCreateReport 
                        ? 'bg-gradient-to-br from-teal-50 via-white to-teal-100 border-2 border-teal-200 shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-lg ring-2 ring-blue-200'
                    }
                  `}
                >
                  {/* Decorative background elements */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent" />
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-teal-200/20 to-transparent rounded-full blur-2xl" />
                  <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-teal-300/20 to-transparent rounded-full blur-2xl" />
                  
                  {/* Active job indicator (move to bottom) */}
                  {/* Removed from top-right, add below main content */}

                  <div className="relative p-4">
                    <div className="flex items-center justify-between">
                      <span className={`
                        text-sm font-medium px-4 py-2 rounded-full transition-all duration-300
                        ${providerReport 
                          ? clientAcceptedReport 
                            ? 'bg-green-100 text-green-700 border-2 border-green-200 font-bold shadow-md' 
                            : canRespondToReport
                              ? 'bg-amber-100 text-amber-800 border-2 border-amber-400 font-bold shadow-md'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          : canCreateReport
                            ? 'bg-gradient-to-r from-teal-100 via-white to-teal-50 text-teal-800 border-2 border-teal-200 font-bold shadow-md'
                            : 'bg-blue-100 text-blue-800 border-2 border-blue-400 font-bold shadow-md'
                        }
                      `}>
                        {(() => {
                          if (providerReport) {
                            if (clientAcceptedReport) {
                              return t('latestJobs.serviceCompletedAndRated');
                            } else if (role === 'client') {
                              return t('latestJobs.pleaseRateThisService');
                            } else {
                              return t('latestJobs.waitingForClientRating');
                            }
                          } else if (role === 'provider') {
                            return t('latestJobs.createServiceReport');
                          } else {
                            return t('latestJobs.serviceInProgress');
                          }
                        })()}
                      </span>
                      <div className="flex items-center gap-2">
                        {(canCreateReport || canRespondToReport) && (
                          <span className={`
                            text-xs font-bold px-2 py-1 rounded-full animate-bounce
                            ${canCreateReport ? 'bg-teal-200 text-teal-800' : 'bg-amber-200 text-amber-800'}
                          `}>
                            {role === 'provider' ? t('latestJobs.createReport') : t('latestJobs.rateNow')}
                          </span>
                        )}
                        <span className={`
                          text-xs transition-all duration-300
                          ${(canCreateReport || canRespondToReport) ? 'text-teal-700 font-bold' : 'text-gray-500'}
                        `}>
                          {(() => {
                            if (providerReport) {
                              if (clientAcceptedReport) {
                                return t('latestJobs.completed');
                              } else if (role === 'client') {
                                return t('latestJobs.yourActionRequired');
                              } else {
                                return t('latestJobs.waitingForClient');
                              }
                            } else if (role === 'provider') {
                              return t('latestJobs.yourActionRequired');
                            } else {
                              return t('latestJobs.providerIsWorkingOnIt');
                            }
                          })()}
                        </span>
                        {(canCreateReport || canRespondToReport || canViewReport) && (
                          <svg className={`
                            w-4 h-4 transition-all duration-300
                            ${(canCreateReport || canRespondToReport) ? 'text-teal-400 animate-pulse' : 'text-gray-400'}
                          `} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    {/* Additional info for in-progress jobs */}
                    {!providerReport && isFullyAccepted && (
                      <div className="mt-3 p-3 bg-teal-50/80 rounded-lg border border-teal-100">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-teal-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm text-teal-800 font-medium">
                              {role === 'client' 
                                ? t('latestJobs.clientServiceInProgress')
                                : t('latestJobs.providerServiceInProgress')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ACTIVE badge moved to bottom */}
                    {!providerReport && isFullyAccepted && (
                      <div className="flex justify-end mt-2">
                        <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                          {t('latestJobs.active')}
                        </span>
                      </div>
                    )}

                    {/* Completion celebration for completed jobs */}
                    {clientAcceptedReport && (
                      <div className="mt-3 p-3 bg-green-50/80 rounded-lg border-2 border-green-200">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm text-green-800 font-medium">
                              {role === 'client' 
                                ? t('latestJobs.clientServiceCompleted')
                                : t('latestJobs.providerServiceCompleted')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {isEditing ? (
                <div className="bg-gradient-to-br from-teal-50/50 to-white p-6 rounded-xl border border-teal-100 mb-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <Label>{t('editJob.serviceType')}</Label>
                      <input 
                        type="text" 
                        value={editForm.typeOfService?.join(', ') || ''} 
                        onChange={(e) => handleEditFormChange('typeOfService', e.target.value.split(', '))} 
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 outline-none text-gray-700 placeholder-gray-400"
                        placeholder={t('latestJobs.enterServiceType')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('editJob.bookingDate')}</Label>
                      <input 
                        type="date" 
                        value={editForm.bookingDate ? String(editForm.bookingDate).split('T')[0] : ''} 
                        onChange={e => handleEditFormChange('bookingDate', e.target.value)} 
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-200 outline-none text-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('editJob.proposedStartTime')}</Label>
                      <CustomTimePicker
                        value={editForm.proposedStartTime || ''}
                        onChange={(time) => handleEditFormChange("proposedStartTime", time)}
                        minTime={"00:00"}
                        maxTime={"23:59"}
                        step={5}
                        className="w-full"
                        availableTimes={[]}
                        isGeneralRequest={true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('editJob.proposedEndTime')}</Label>
                      <CustomTimePicker
                        value={editForm.proposedEndTime || ''}
                        onChange={(time) => handleEditFormChange("proposedEndTime", time)}
                        minTime={editForm.proposedStartTime || "00:00"}
                        maxTime={"23:59"}
                        step={5}
                        className="w-full"
                        availableTimes={[]}
                        isGeneralRequest={true}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>{t('editJob.serviceAddress')}</Label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={editForm.serviceAddress || ''} 
                          readOnly
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed text-gray-700"
                          placeholder={t('latestJobs.enterServiceAddress')}
                        />
                        <div className="group relative">
                          <Button
                            type="button"
                            variant="ghost"
                            className="p-3 hover:bg-teal-50 rounded-lg transition-all duration-200 hover:scale-105"
                            onClick={() => navigate('/register/client?step=2')}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
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
                    </div>
                    
                    {/* Expected Brings Field */}
                    <div className="md:col-span-2 space-y-2">
                      <Label className="flex items-center gap-2">
                        <span>📦</span>
                        {t('expectedBrings')}
                      </Label>
                      <div className="space-y-3">
                        {/* Selected items display */}
                        <div className="flex flex-wrap gap-2">
                          {(editForm.expectedBrings || []).map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full border border-orange-200"
                            >
                              <span className="text-sm">{t(`comboBox.serviceEnablers.${item}`) || item}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = (editForm.expectedBrings || []).filter((i: string) => i !== item);
                                  handleEditFormChange('expectedBrings', newItems);
                                }}
                                className="text-orange-500 hover:text-orange-700"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        {/* Disable Combobox if special provider has nothing to bring */}
                        <Combobox
                          disabled={!!editingJob && providerData[editingJob.providerId] && Array.isArray(providerData[editingJob.providerId].serviceEnablers) && providerData[editingJob.providerId].serviceEnablers.length === 0}
                        >
                          {/* Use provider's service enablers if available, otherwise use full list */}
                          {(editingJob && providerData[editingJob.providerId]?.serviceEnablers || serviceEnablersList)?.map((item: string) => {
                            const isSelected = (editForm.expectedBrings || []).includes(item);
                            return (
                              <div
                                key={item}
                                className={`flex items-center gap-2 p-2 cursor-pointer border rounded-md hover:bg-gray-100 transition-colors ${isSelected ? "bg-teal-50 border-teal-300" : "border-gray-300"}`}
                                onClick={() => {
                                  let newItems: string[];
                                  if (isSelected) {
                                    newItems = (editForm.expectedBrings || []).filter((i: string) => i !== item);
                                  } else {
                                    newItems = [...(editForm.expectedBrings || []), item];
                                  }
                                  handleEditFormChange('expectedBrings', newItems);
                                }}
                              >
                                <span>{t(`comboBox.serviceEnablers.${item}`) || item}</span>
                              </div>
                            );
                          })}
                        </Combobox>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleEditSave(role)} 
                      disabled={editLoading} 
                      className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                      {editLoading ? (
                        <>
                          <span className="animate-spin">⟳</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          {t('editJob.saveChanges')}
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleEditCancel} 
                      variant="outline" 
                      className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    >
                      {t('editJob.cancel')}
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-2 mt-2">
                {showAcceptAction && !isEditing && (
                  <Button
                    onClick={() => handleAcceptJob(job.id, role)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-full shadow-md px-4 py-2 font-semibold hover:from-teal-600 hover:to-teal-800 hover:scale-105 hover:text-white transition-all border-0"
                    disabled={processingAcceptId === job.id}
                  >
                    {processingAcceptId === job.id ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-2">⟳</span> {t('latestJobs.processing')}
                      </span>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" /> {t('latestJobs.accept')}
                      </>
                    )}
                  </Button>
                )}
                {canEditJob && !isEditing && (
                  <Button
                    onClick={() => handleEditClick(job)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-full shadow-md px-4 py-2 font-semibold hover:from-teal-600 hover:to-teal-800 hover:scale-105 hover:text-white transition-all border-0"
                  >
                    <Pencil className="w-4 h-4 mr-1" /> {t('latestJobs.edit')}
                  </Button>
                )}
              </div>

              {/* Timeline Section */}
              <div className="mt-1 pt-2 border-t border-gray-100">
                <button
                  onClick={() => toggleTimeline(job.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl group transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-white/20 rounded-full">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold">{t('latestJobs.timeline')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-teal-100 font-medium">
                      {expandedTimelines[job.id] ? 'Hide' : 'Show'}
                    </span>
                    <div className="p-1 bg-white/20 rounded-full">
                      <svg
                        className={`w-4 h-4 text-white transition-transform duration-300 ${
                          expandedTimelines[job.id] ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
                {expandedTimelines[job.id] && (
                  <div className="mt-3 px-4 py-3 bg-teal-50/80 rounded-2xl overflow-x-visible border-2 border-teal-100 shadow-inner">
                    <StatusTimeline steps={getStatusHistory(job, role)} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
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
        title={t("latestJobs.copyAddress")}
      >
        {copied ? (
          <CheckCheck className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-gray-500 group-hover:text-teal-500" />
        )}
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {copied ? t('latestJobs.copied') : t('latestJobs.copyAddress')}
        </span>
      </button>
    );
  };

  // --- Main render ---
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
              {t("latestJobs.yourJobs")}
            </h1>
            
            {/* Filter Section */}
            <div className="bg-white/90 rounded-xl p-4 shadow-sm border border-teal-100 mb-6">
              <div className="flex flex-wrap gap-4">
                {/* Status Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('latestJobs.filters.status')}</label>
                  <div className="relative group">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 group-hover:border-teal-300 transition-colors duration-200"
                    >
                      <option value="all">{t('latestJobs.filters.all')}</option>
                      <option value="pending">{t('latestJobs.statuses.pending')}</option>
                      <option value="accepted">{t('latestJobs.statuses.accepted')}</option>
                      <option value="rejected">{t('latestJobs.statuses.rejected')}</option>
                      <option value="inProgress">{t('latestJobs.statuses.inProgress')}</option>
                      <option value="completed">{t('latestJobs.statuses.completed')}</option>
                      <option value="cancelled">{t('latestJobs.statuses.cancelled')}</option>
                    </select>
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-hover:text-teal-500 group-hover:scale-110 transition-all duration-200" />
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('latestJobs.filters.dateRange')}</label>
                  <div className="relative group">
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 group-hover:border-teal-300 transition-colors duration-200"
                    >
                      <option value="all">{t('latestJobs.filters.allDates')}</option>
                      <option value="today">{t('latestJobs.filters.today')}</option>
                      <option value="tomorrow">{t('latestJobs.filters.tomorrow')}</option>
                      <option value="week">{t('latestJobs.filters.next7Days')}</option>
                    </select>
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-hover:text-teal-500 group-hover:scale-110 transition-all duration-200" />
                  </div>
                </div>

                {/* Service Type Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('latestJobs.filters.serviceType')}</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={filters.serviceType}
                      onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value }))}
                      placeholder={t('latestJobs.filters.filterByServiceType')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 group-hover:border-teal-300 transition-colors duration-200"
                    />
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-hover:text-teal-500 group-hover:scale-110 transition-all duration-200" />
                  </div>
                </div>

                {/* Search Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('latestJobs.filters.search')}</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={filters.searchQuery}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                      placeholder={t('latestJobs.filters.searchJobs')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 group-hover:border-teal-300 transition-colors duration-200"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-hover:text-teal-500 group-hover:scale-110 transition-all duration-200" />
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({
                      status: 'all',
                      dateRange: 'all',
                      serviceType: '',
                      searchQuery: ''
                    })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 hover:shadow-md"
                  >
                    <Filter className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                    {t('latestJobs.filters.clearFilters')}
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              renderStateMessage(t('latestJobs.loadingJobs'))
            ) : error ? (
              <div className="text-red-600 text-sm py-4">{error}</div>
            ) : (
              <div className="flex flex-col gap-8">
                {/* Show client section if logged in as client */}
                {clientId && (
                  <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-teal-100">
                    <h2 className="text-2xl font-extrabold mb-6 text-teal-700 tracking-tight border-l-4 border-teal-400 pl-4 bg-gradient-to-r from-teal-50 to-white py-2">
                      {t("latestJobs.yourRequestsList")} <span className="text-gray-500 text-sm">{providerId && t('latestJobs.asClient')}</span>
                    </h2>
                    {renderJobsList(filteredClientJobs, t('latestJobs.noJobsAvailable'), 'client')}
                  </div>
                )}
                {/* Show provider section if logged in as provider */}
                {providerId && (
                  <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-teal-100">
                    <h2 className="text-2xl font-extrabold mb-6 text-teal-700 tracking-tight border-l-4 border-teal-400 pl-4 bg-gradient-to-r from-teal-50 to-white py-2">
                      {t("latestJobs.yourClientsRequests")} <span className="text-gray-500 text-sm">{clientId && t('latestJobs.asProvider')}</span>
                    </h2>
                    {renderJobsList(filteredProviderJobs, t('latestJobs.noJobsAvailable'), 'provider')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Report Dialog */}
      <ReportDialog
        isOpen={reportDialog.isOpen}
        onClose={closeReportDialog}
        bookingId={reportDialog.bookingId}
        clientId={clientId || ''}
        providerId={providerId || ''}
        mode={reportDialog.mode}
        existingReport={reportDialog.existingReport || undefined}
        userRole={clientId ? 'client' : 'provider'}
        onSuccess={handleReportSuccess}
      />

      {/* Edit Confirmation Dialog */}
      <Dialog open={showEditConfirmDialog} onOpenChange={setShowEditConfirmDialog}>
        <DialogContent className="bg-white/90 rounded-2xl shadow-lg p-6 border border-teal-100">
          <DialogHeader>
            <DialogTitle>{t('latestJobs.confirmJobEdit')}</DialogTitle>
            <DialogDescription>
              {pendingEditRole === 'client' 
                ? t('latestJobs.clientEditConfirmation')
                : t('latestJobs.providerEditConfirmation')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditConfirmDialog(false);
                setPendingEditRole(null);
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleConfirmedEdit}
              disabled={editLoading}
              className="bg-teal-600 text-white"
            >
              {editLoading ? t('latestJobs.saving') : t('latestJobs.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Modal */}
      {summaryModal.open && summaryModal.job && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setSummaryModal({ open: false, job: null })}><X className="w-5 h-5" /></button>
            <h2 className="text-2xl font-bold mb-4 text-teal-700 flex items-center gap-2">
              {getCombinedStatus(summaryModal.job).toLowerCase() === 'completed' ? (
                <><Check className="w-5 h-5 text-green-600" /><Check className="w-5 h-5 text-green-600 -ml-2" /></>
              ) : null}
              {t('latestJobs.jobSummary')}
            </h2>
            <div className="space-y-2 text-gray-700">
              <div><b>{t('latestJobs.service')}:</b> <ServiceTypeDisplay services={getServiceTypes(summaryModal.job.typeOfService)} variant="inline" /></div>
              {summaryModal.job.expectedBrings && summaryModal.job.expectedBrings.length > 0 && (
                <div><b>{t('expectedBrings')}:</b> {summaryModal.job.expectedBrings.map(item => t(`comboBox.serviceEnablers.${item}`) || item).join(', ')}</div>
              )}
              <div><b>{t('latestJobs.date')}:</b> {formatDateTime(summaryModal.job.bookingDate)}</div>
              <div><b>{t('latestJobs.time')}:</b> {summaryModal.job.proposedStartTime} - {summaryModal.job.proposedEndTime}</div>
              <div><b>{t('latestJobs.address')}:</b> {summaryModal.job.serviceAddress}</div>
              <div><b>{t('latestJobs.totalPrice')}:</b> {t('latestJobs.currency', { value: summaryModal.job.totalPrice })}</div>
              <div><b>{t('latestJobs.status')}:</b> {getCombinedStatus(summaryModal.job)}</div>
            </div>
            {/* Dynamic next steps/info based on status */}
            <div className="mt-4">
              {(() => {
                const status = getCombinedStatus(summaryModal.job).toLowerCase();
                if (status === 'job in progress') {
                  return <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 font-medium">{t('latestJobs.jobInProgress')}</div>;
                } else if (status === 'waiting for rating') {
                  return <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-medium">{t('latestJobs.waitingForRating')}</div>;
                } else if (status === 'completed') {
                  return <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium">{t('latestJobs.jobCompleted')}</div>;
                } else if (status === 'waiting for provider') {
                  return <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 font-medium">{t('latestJobs.waitingForProvider')}</div>;
                } else if (status === 'waiting for client') {
                  return <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 font-medium">{t('latestJobs.waitingForClientAccept')}</div>;
                } else if (status === 'pending') {
                  return <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-medium">{t('latestJobs.bookingPending')}</div>;
                } else if (status === 'rejected') {
                  return <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 font-medium">{t('latestJobs.bookingRejected')}</div>;
                } else {
                  return null;
                }
              })()}
            </div>
            <div className="mt-6 flex justify-end">
              <button className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700" onClick={() => setSummaryModal({ open: false, job: null })}>{t('latestJobs.close')}</button>
            </div>
          </div>
        </div>
      )}
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={250} recycle={false} />}

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

export default LatestJobsPage;
