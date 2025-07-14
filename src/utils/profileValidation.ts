// Utility functions for validating provider profile completion

/**
 * Safely trim a value that might not be a string
 * @param value - Value to trim
 * @returns Trimmed string or empty string if value is not a string
 */
const safeTrim = (value: any): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
};

export interface ProviderStep3Data {
  socialSecurityNumber?: string;
  bankDetails?: {
    name?: string;
    clearingNumber?: string;
    bankNumber?: string;
    consent?: boolean;
  };
  consents?: {
    generalConsent?: boolean;
  };
}

/**
 * Check if provider has completed all required Step 3 fields
 * @param providerData - Provider profile data
 * @returns Object containing validation result and missing fields
 */
export const validateStep3Completion = (providerData: ProviderStep3Data | null | undefined) => {
  const missingFields: string[] = [];
  
  if (!providerData) {
    return {
      isComplete: false,
      missingFields: ['socialSecurityNumber', 'bankDetails', 'consents'],
      hasAnyData: false
    };
  }

  // Check social security number
  if (!providerData.socialSecurityNumber || safeTrim(providerData.socialSecurityNumber) === '') {
    missingFields.push('socialSecurityNumber');
  }

  // Check bank details
  if (!providerData.bankDetails || 
      safeTrim(providerData.bankDetails.clearingNumber) === '' || 
      safeTrim(providerData.bankDetails.bankNumber) === '' || 
      safeTrim(providerData.bankDetails.name) === '') {
    missingFields.push('bankDetails');
  }

  // Check terms and conditions consent
  if (!providerData.consents || !providerData.consents.generalConsent) {
    missingFields.push('consents');
  }

  const hasAnyData = !!(
    providerData.socialSecurityNumber ||
    (providerData.bankDetails && (
      providerData.bankDetails.clearingNumber || 
      providerData.bankDetails.bankNumber
    )) ||
    (providerData.consents && providerData.consents.generalConsent)
  );

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    hasAnyData
  };
};

/**
 * Get user-friendly missing field labels for translation
 * @param missingFields - Array of missing field keys
 * @returns Array of translation keys
 */
export const getMissingFieldLabels = (missingFields: string[]) => {
  const fieldMap: Record<string, string> = {
    socialSecurityNumber: 'profileCompletion.socialSecurityNumber',
    bankDetails: 'profileCompletion.bankDetails', 
    consents: 'profileCompletion.termsAndConditions'
  };

  return missingFields.map(field => fieldMap[field] || field);
}; 