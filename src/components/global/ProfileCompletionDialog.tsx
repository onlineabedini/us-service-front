import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  CreditCard, 
  FileText, 
  AlertTriangle,
  ArrowRight,
  X 
} from 'lucide-react';
import { getMissingFieldLabels } from '@/utils/profileValidation';

interface ProfileCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
  hasAnyData: boolean;
}

const ProfileCompletionDialog: React.FC<ProfileCompletionDialogProps> = ({
  isOpen,
  onClose,
  missingFields,
  hasAnyData
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCompleteProfile = () => {
    // Navigate to step 3 of provider registration
    navigate('/register/provider?step=3');
    onClose();
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'socialSecurityNumber':
        return <Shield className="w-5 h-5 text-orange-500" />;
      case 'bankDetails':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'consents':
        return <FileText className="w-5 h-5 text-green-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getFieldDescription = (field: string) => {
    switch (field) {
      case 'socialSecurityNumber':
        return t('profileCompletion.descriptions.socialSecurityNumber') || 'Your Swedish personal identity number for verification';
      case 'bankDetails':
        return t('profileCompletion.descriptions.bankDetails') || 'Bank account information for receiving payments';
      case 'consents':
        return t('profileCompletion.descriptions.consents') || 'Accept terms and conditions to start working';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-2xl shadow-xl border border-gray-200">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {t('profileCompletion.title') || 'Complete Your Profile'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {hasAnyData 
              ? (t('profileCompletion.description.partial') || 'You need to complete a few more fields before accepting jobs.')
              : (t('profileCompletion.description.empty') || 'Please complete your security and payment information to start accepting jobs.')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">
                  {t('profileCompletion.whyNeeded') || 'Why is this needed?'}
                </h4>
                <p className="text-sm text-amber-700">
                  {t('profileCompletion.whyNeededDescription') || 'For security and payment processing, we need to verify your identity and set up your payment information before you can accept jobs.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 mb-2">
              {t('profileCompletion.missingFields') || 'Missing Information:'}
            </h4>
            {missingFields.map((field, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {getFieldIcon(field)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {t(getMissingFieldLabels([field])[0]) || field}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {getFieldDescription(field)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            {t('profileCompletion.later') || 'Later'}
          </Button>
          <Button
            onClick={handleCompleteProfile}
            className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 border-0"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            {t('profileCompletion.completeNow') || 'Complete Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionDialog; 