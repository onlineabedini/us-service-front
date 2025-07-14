import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { getBankName, validateBankAccount, validateClearingNumber } from "@/lists/bankClearingNumbers";
import ConsentContent from '@/components/global/ConsentContent';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Shield, 
  CreditCard, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { getCookie } from '@/utils/authCookieService';
import { providerService } from '@/services/provider.service';
// Import PDF files for both languages
import enPdf from '@/assets/terms-conditions/En.pdf';
import svPdf from '@/assets/terms-conditions/Sv.pdf';

// Types for Step 3 data
export interface BankDetails {
  name: string;
  clearingNumber: string;
  bankNumber: string;
}

export interface Consents {
  generalConsent: boolean;
}

export interface Step3Data {
  socialSecurityNumber: string;
  bankDetails: BankDetails;
  consents: Consents;
}

interface Step3Props {
  onSubmit: (data: Step3Data) => void;
  onBack: () => void;
}

const Step3: React.FC<Step3Props> = ({ onSubmit, onBack }) => {
  const { t, i18n } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSSN, setShowSSN] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<Step3Data>({
    socialSecurityNumber: "",
    bankDetails: {
      name: "",
      clearingNumber: "",
      bankNumber: "",
    },
    consents: {
      generalConsent: false,
    },
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Language for consent document - dynamically calculated based on current language
  const consentLanguage: 'sv' | 'en' = i18n.language.startsWith('sv') ? 'sv' : 'en';

  // Load existing data if user has already started Step 3
  useEffect(() => {
    const loadExistingData = async () => {
      setIsLoading(true);
      try {
        const providerId = getCookie('providerId');
        if (providerId) {
          const userData = await providerService.getProfile(providerId);
          if (userData) {
            setFormData({
              socialSecurityNumber: userData.socialSecurityNumber || "",
              bankDetails: {
                name: userData.bankDetails?.name || "",
                clearingNumber: userData.bankDetails?.clearingNumber || "",
                bankNumber: userData.bankDetails?.bankNumber || "",
              },
              consents: {
                generalConsent: userData.consents?.generalConsent || false,
              },
            });
          }
        }
      } catch (error) {
        console.error('Error loading existing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, []);

  // Social Security Number validation (Swedish Luhn algorithm)
  const passesLuhnCheck = (input: string): boolean => {
    const digits = input.replace(/\D/g, '');
    if (digits.length !== 10) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = parseInt(digits[i], 10);
      
      // For Swedish personal numbers, multiply every second digit (starting from position 0) by 2
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }
      sum += digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(digits[9], 10);
  };

  const determineCentury = (twoDigitYear: string, hasPlus: boolean): string => {
    const year = parseInt(twoDigitYear, 10);
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    return hasPlus ? `${currentCentury - 100 + year}` : `${currentCentury + year}`;
  };

  const validateSocialSecurityNumber = (ssn: string): string => {
    if (!ssn.trim()) return t("requiredField") || "This field is required";
    
    const cleaned = ssn.replace(/\s/g, '');
    const formatRegex = /^(\d{6}|\d{8})([-+])(\d{4})$/;
    const match = cleaned.match(formatRegex);
    
    if (!match) return t("invalidSSNFormat") || "Invalid format. Use YYMMDD-NNNN, YYYYMMDD-NNNN or add + for people over 100 years old";
    
    const [, birthDate, separator, lastFour] = match;
    const hasPlus = separator === '+';
    
    let year: string;
    let month: number;
    let day: number;
    
    if (birthDate.length === 8) {
      // 4-digit year format (YYYYMMDD)
      year = birthDate.substring(0, 4);
      month = parseInt(birthDate.substring(4, 6), 10);
      day = parseInt(birthDate.substring(6, 8), 10);
    } else {
      // 2-digit year format (YYMMDD)
      year = determineCentury(birthDate.substring(0, 2), hasPlus);
      month = parseInt(birthDate.substring(2, 4), 10);
      day = parseInt(birthDate.substring(4, 6), 10);
    }
    
    if (month < 1 || month > 12) return t("invalidSSNMonth") || "Invalid month";
    if (day < 1 || day > 31) return t("invalidSSNDay") || "Invalid day";
    
    const fullDate = new Date(parseInt(year), month - 1, day);
    if (fullDate.getMonth() !== month - 1 || fullDate.getDate() !== day) {
      return t("invalidSSNDate") || "Invalid date";
    }
    
    // Age validation
    const today = new Date();
    let age = today.getFullYear() - fullDate.getFullYear();
    const m = today.getMonth() - fullDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < fullDate.getDate())) {
      age--;
    }
    if (age < 16) return t("ssnTooYoung") || "Must be at least 16 years old";
    if (age > 120) return t("ssnTooOld") || "Invalid age";
    
    // Luhn algorithm validation - use last 10 digits for validation
    const digits = birthDate.length === 8 ? birthDate.substring(2) + lastFour : birthDate + lastFour;
    if (!passesLuhnCheck(digits)) return t("invalidSSNChecksum") || "Invalid personal number";
    
    return "";
  };

  // Handle input changes
  const handleInputChange = (field: keyof Step3Data | string, value: any) => {
    if (field === 'socialSecurityNumber') {
      setFormData(prev => ({ ...prev, socialSecurityNumber: value }));
      if (validationErrors.socialSecurityNumber) {
        setValidationErrors(prev => ({ ...prev, socialSecurityNumber: "" }));
      }
    } else if (field.startsWith('bankDetails.')) {
      const bankField = field.split('.')[1] as keyof BankDetails;
      setFormData(prev => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [bankField]: value }
      }));
      
      // Auto-populate bank name when clearing number changes
      if (bankField === 'clearingNumber' && value) {
        const bankName = getBankName(value);
        setFormData(prev => ({
          ...prev,
          bankDetails: { ...prev.bankDetails, name: bankName }
        }));
      }
      
      if (validationErrors[field]) {
        setValidationErrors(prev => ({ ...prev, [field]: "" }));
      }
    } else if (field.startsWith('consents.')) {
      const consentField = field.split('.')[1] as keyof Consents;
      setFormData(prev => ({
        ...prev,
        consents: { ...prev.consents, [consentField]: value }
      }));
      
      if (validationErrors[field]) {
        setValidationErrors(prev => ({ ...prev, [field]: "" }));
      }
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Validate social security number
    const ssnError = validateSocialSecurityNumber(formData.socialSecurityNumber);
    if (ssnError) errors.socialSecurityNumber = ssnError;

    // Helper function to safely trim values
    const safeTrim = (value: any): string => {
      if (typeof value === 'string') {
        return value.trim();
      }
      return '';
    };

    // Validate clearing number
    if (!formData.bankDetails.clearingNumber || safeTrim(formData.bankDetails.clearingNumber) === '') {
      errors['bankDetails.clearingNumber'] = t("requiredField") || "This field is required";
    } else {
      const { isValid, error } = validateClearingNumber(formData.bankDetails.clearingNumber);
      if (!isValid) errors['bankDetails.clearingNumber'] = error || "Invalid clearing number";
    }

    // Validate account number
    if (!formData.bankDetails.bankNumber || safeTrim(formData.bankDetails.bankNumber) === '') {
      errors['bankDetails.bankNumber'] = t("requiredField") || "This field is required";
    } else if (formData.bankDetails.clearingNumber) {
      const { isValid, error } = validateBankAccount(
        formData.bankDetails.clearingNumber,
        formData.bankDetails.bankNumber
      );
      if (!isValid) errors['bankDetails.bankNumber'] = error || "Invalid account number";
    }

    // Validate general consent
    if (!formData.consents.generalConsent) {
      errors['consents.generalConsent'] = t("termsConsentRequired") || "Terms consent is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error(t("pleaseFixErrors") || "Please fix the errors before continuing");
      return;
    }

    setIsSubmitting(true);
    try {
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting Step 3:', error);
      toast.error(t("submissionError") || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-6 bg-white/95 rounded-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 bg-white/95 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {t("securityAndPayment") || "Security & Payment Information"}
        </h2>
        <p className="text-gray-600">
          {t("step3Description") || "Complete your security verification and payment setup to start accepting jobs."}
        </p>
      </div>

      <div className="space-y-8">
        {/* Social Security Number Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {t("socialSecurityNumber") || "Social Security Number"}
            </h3>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("socialSecurityNumber") || "Social Security Number"} *
            </label>
            <div className="relative">
              <Input
                type={showSSN ? "text" : "password"}
                value={formData.socialSecurityNumber}
                onChange={(e) => handleInputChange('socialSecurityNumber', e.target.value)}
                placeholder={t("enterSocialSecurityNumber") || "YYMMDD-NNNN"}
                className={`pr-10 ${validationErrors.socialSecurityNumber ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowSSN(!showSSN)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSSN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {validationErrors.socialSecurityNumber && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {validationErrors.socialSecurityNumber}
              </p>
            )}
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {t("ssnFormatInfo") || "Format: YYMMDD-NNNN (use + for people over 100 years old)"}
            </p>
          </div>
        </div>

        {/* Bank Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {t("bankDetails") || "Bank Details"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clearing Number */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("clearingNumber") || "Clearing Number"} *
              </label>
              <Input
                type="text"
                value={formData.bankDetails.clearingNumber}
                onChange={(e) => handleInputChange('bankDetails.clearingNumber', e.target.value)}
                placeholder="NNNN"
                className={validationErrors['bankDetails.clearingNumber'] ? 'border-red-500' : ''}
              />
              {validationErrors['bankDetails.clearingNumber'] && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {validationErrors['bankDetails.clearingNumber']}
                </p>
              )}
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("accountNumber") || "Account Number"} *
              </label>
              <Input
                type="text"
                value={formData.bankDetails.bankNumber}
                onChange={(e) => handleInputChange('bankDetails.bankNumber', e.target.value)}
                placeholder={t("enterAccountNumber") || "Enter account number"}
                className={validationErrors['bankDetails.bankNumber'] ? 'border-red-500' : ''}
              />
              {validationErrors['bankDetails.bankNumber'] && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {validationErrors['bankDetails.bankNumber']}
                </p>
              )}
            </div>
          </div>

          {/* Bank Name (Auto-populated) */}
          {formData.bankDetails.name && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("bankName") || "Bank Name"}
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">{formData.bankDetails.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Terms and Conditions Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {t("termsAndConditions.title") || "Terms & Conditions"}
            </h3>
          </div>

          <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="generalConsent"
                checked={formData.consents.generalConsent}
                onCheckedChange={(checked) => handleInputChange('consents.generalConsent', checked)}
                className={validationErrors['consents.generalConsent'] ? 'border-red-500' : ''}
              />
              <div className="space-y-2">
                <label htmlFor="generalConsent" className="text-sm font-medium text-gray-800 cursor-pointer">
                  {t("acceptTermsAndConditions") || "I accept the terms and conditions"}
                </label>
                <div className="space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-sm text-teal-600 hover:text-teal-700 underline">
                        {t("readTermsAndConditions") || "Read Terms & Conditions"}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
                      <DialogHeader>
                        <DialogTitle>
                          {t("termsAndConditions.title") || "Terms & Conditions"}
                        </DialogTitle>
                        <DialogDescription>
                          {t("termsDescription") || "Please review our terms and conditions"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="bg-white">
                        <ConsentContent />
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <a
                    href={consentLanguage === 'sv' ? svPdf : enPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 hover:text-teal-700 underline block"
                  >
                    {t("downloadTermsPDF") || "Download Terms & Conditions (PDF)"}
                  </a>
                </div>
              </div>
            </div>
            {validationErrors['consents.generalConsent'] && (
              <p className="text-red-500 text-sm flex items-center gap-1 ml-6">
                <AlertTriangle className="w-4 h-4" />
                {validationErrors['consents.generalConsent']}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors duration-200"
          disabled={isSubmitting}
        >
          {t("back") || "Back"}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t("completing") || "Completing..."}
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              {t("completeRegistration") || "Complete Registration"}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step3;
