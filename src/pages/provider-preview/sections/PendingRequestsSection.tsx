//@collapse
// src/pages/provider-page/sections/PendingRequestsSection.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Clock, DollarSign, ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from '@/config/api';
import ProfileCompletionDialog from '@/components/global/ProfileCompletionDialog';
import { useProfileValidation } from '@/hooks/useProfileValidation';

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
  createdAt: string;
};

type PendingRequestsSectionProps = {
  firstName: string;
  providerId: string;
  onRepeatRequest: () => void;
};

const PendingRequestsSection: React.FC<PendingRequestsSectionProps> = ({
  firstName,
  providerId,
  onRepeatRequest,
}) => {
  // Helper function to safely handle typeOfService (string or array)
  const getServiceTypes = (typeOfService: any): string[] => {
    if (!typeOfService) return [];
    if (Array.isArray(typeOfService)) return typeOfService;
    if (typeof typeOfService === 'string') return [typeOfService];
    return [];
  };
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile validation hook for providers
  const {
    checkProfileBeforeAction,
    showCompletionDialog,
    setShowCompletionDialog,
    missingFields,
    hasAnyData
  } = useProfileValidation();

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
    try {
      const response = await fetch(`${API_BASE_URL}/booking/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Accepted'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept job');
      }

      // Update the jobs list with the new status
      setLatestJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId ? { ...job, status: 'Accepted' } : job
        )
      );

      toast.success(t('jobAccepted'));
    } catch (error) {
      console.error('Error accepting job:', error);
      toast.error(t('errorAcceptingJob'));
    }
  };

  const handleRejectJob = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/booking/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Rejected'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject job');
      }

      // Update the jobs list with the new status
      setLatestJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId ? { ...job, status: 'Rejected' } : job
        )
      );

      toast.success(t('jobRejected'));
    } catch (error) {
      console.error('Error rejecting job:', error);
      toast.error(t('errorRejectingJob'));
    }
  };

  useEffect(() => {
    const fetchLatestJobs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/booking?providerId=${providerId}`);
        if (!response.ok) throw new Error('Failed to fetch my jobs');
        const data = await response.json();
        // Sort jobs by booking date, most recent first
        const sortedJobs = data.sort((a: Job, b: Job) => 
          new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
        );
        setLatestJobs(sortedJobs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching my jobs:', err);
        setError('Failed to load my jobs');
        setLoading(false);
      }
    };

    fetchLatestJobs();
  }, [providerId]);

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* My Jobs Section */}
      <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">{t("pendingRequests")}</h2>
        
        {loading ? (
          <div className="text-gray-600 text-sm mb-4">{t("loadingLatestJobs")}</div>
        ) : error ? (
          <div className="text-red-600 text-sm mb-4">{t("errorLoadingLatestJobs")}</div>
        ) : latestJobs.length === 0 ? (
          <div className="text-gray-600 text-sm mb-4">
            {t("noPendingRequests", { name: firstName })}
          </div>
        ) : (
          <div className="space-y-4">
            {latestJobs.slice(0, 3).map((job) => (
              <div 
                key={job.id}
                className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{getServiceTypes(job.typeOfService).join(', ')}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatDateTime(job.bookingDate)} ({job.proposedStartTime} - {job.proposedEndTime})
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    📍 {job.serviceAddress}
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status.toLowerCase() === 'scheduled' && (
                      <>
                        <Button
                          onClick={() => handleAcceptJob(job.id)}
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleRejectJob(job.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <div className="flex items-center text-sm font-medium text-green-600">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {job.totalPrice}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => navigate(`/latest-jobs/provider/${providerId}`)}
                className="text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 mx-auto"
              >
                {t("seeAllJobs")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

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

export default PendingRequestsSection;
