import { useState, useEffect } from 'react';
import { validateStep3Completion, ProviderStep3Data } from '@/utils/profileValidation';
import { providerService } from '@/services/provider.service';
import { getCookie } from '@/utils/authCookieService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface UseProfileValidationResult {
  isProfileComplete: boolean;
  missingFields: string[];
  hasAnyData: boolean;
  showCompletionDialog: boolean;
  setShowCompletionDialog: (show: boolean) => void;
  checkProfileBeforeAction: (action: () => void) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const useProfileValidation = (): UseProfileValidationResult => {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState<ProviderStep3Data | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerId = getCookie('providerId');

  // Fetch provider profile data
  const fetchProviderProfile = async () => {
    if (!providerId) {
      setError('Provider not logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await providerService.getProfile(providerId);
      setProfileData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
      console.error('Error fetching provider profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load profile data on mount
  useEffect(() => {
    if (providerId) {
      fetchProviderProfile();
    }
  }, [providerId]);

  // Validate profile completion
  const validation = validateStep3Completion(profileData);

  /**
   * Check if profile is complete before allowing an action
   * @param action - The action to perform if profile is complete
   * @returns Promise<boolean> - true if action was performed, false if blocked
   */
  const checkProfileBeforeAction = async (action: () => void): Promise<boolean> => {
    // Refresh profile data before checking
    if (providerId) {
      await fetchProviderProfile();
    }

    const currentValidation = validateStep3Completion(profileData);
    
    if (!currentValidation.isComplete) {
      // Show completion dialog instead of performing action
      setShowCompletionDialog(true);
      
      // Show toast message explaining why action was blocked
      toast.warning(
        t('profileCompletion.actionBlocked') || 
        'Please complete your profile information before accepting jobs.',
        {
          description: t('profileCompletion.actionBlockedDescription') || 
                      'This includes your social security number, bank details, and terms acceptance.'
        }
      );
      
      return false;
    }

    // Profile is complete, perform the action
    action();
    return true;
  };

  return {
    isProfileComplete: validation.isComplete,
    missingFields: validation.missingFields,
    hasAnyData: validation.hasAnyData,
    showCompletionDialog,
    setShowCompletionDialog,
    checkProfileBeforeAction,
    loading,
    error
  };
}; 