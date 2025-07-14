import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import registerBg from "@/assets/img/register-bg.png";
import Step1 from "./step-1";
import Step2 from "./step-2";
import Step3, { Step3Data } from "./step-3";
import { API_BASE_URL } from "@/config/api";
import ChangeLang from "@/components/global/changeLangDropdonw";
import { setCookie, getCookie } from '@/utils/authCookieService';
import { providerService } from '@/services/provider.service';

// ----- Type Definitions -----
export interface BasicRegistrationData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

// Note: We now include an "id" property so that Step2 can use it.
export interface CompleteProfileData {
  id: string;
  username: string;
  phoneNumber: string;
  profileImageFile: File | null;
  profileImage?: string; // URL returned after image upload
  description: string;
  hourlyRate: string;
  currency: string;
  languages: string[];
  offeredServices: string[];
  serviceArea: string[];
  citizenship: string;
  car: boolean;
  carLicense: boolean;
  smoke: boolean;
  address: {
    businessType: "Individual" | "Company" | "Agency";
    businessName: string;
    registrationNumber: string;
    country: string;
    city: string;
    streetAddress: string;
    postalCode: string;
    isMainOffice: boolean;
    VAT: string;
  }[];
  socialSecurityNumber?: string;
  bankDetails: {
    name?: string;
    clearingNumber?: string;
    bankNumber?: string;
    consent?: boolean;
    // Legacy fields
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    IBAN?: string;
    SWIFT?: string;
  };
  consents?: {
    generalConsent?: boolean;
  };
}

const ProviderRegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which step to render from the URL query parameter.
  const params = new URLSearchParams(location.search);
  const stepParam = params.get("step");
  const initialStep = stepParam === "2" ? 2 : stepParam === "3" ? 3 : 1;
  const [step, setStep] = useState<number>(initialStep);
  
  // Email verification status
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  
  // Check email verification status on component mount
  useEffect(() => {
    const checkEmailVerification = async () => {
      try {
        const providerId = getCookie('providerId');
        if (providerId) {
          const userData = await providerService.getProfile(providerId);
          setIsEmailVerified(userData?.isEmailVerified || false);
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
      }
    };
    
    if (step > 1) {
      checkEmailVerification();
    }
  }, [step]);

  // --- Step 1: Basic Registration ---
  const handleBasicRegistration = async (data: BasicRegistrationData) => {
    if (data.password !== data.confirmPassword) {
      toast.error(t("passwordMismatch") || "Passwords do not match.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/provider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // if account already exists
        if (response.status === 409) {
          toast.error(t("Email Already Exists") || "An account with this email already exists. Please use a different email or try logging in.");
        }
        else {
          throw new Error(errorData.message || t("registrationFailed") || "Registration failed");
        }
        return;
      }

      const newProvider = await response.json();

      toast.success(
        t("registrationStep1Success") ||
        "Basic information saved! Please continue to complete your profile."
      );

      // Move to step 2
      setStep(2);
      navigate(`/register/provider?step=2`, { replace: true });
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message || t("registrationError") || "An error occurred during registration."
      );
    }
  };

  // --- Step 2: Profile Details Update ---
  const handleProfileDetails = async () => {
    toast.success(t("profileDetailsSuccess") || "Profile details saved! Please complete the final step.");
    // Move to step 3
    setStep(3);
    navigate(`/register/provider?step=3`, { replace: true });
  };

  // --- Step 3: Complete Registration ---
  const handleCompleteRegistration = async (step3Data: Step3Data) => {
    try {
      const providerId = getCookie('providerId');
      if (!providerId) {
        toast.error(t("providerNotFound") || "Provider not found. Please try registering again.");
        navigate("/register/provider", { replace: true });
        return;
      }

      // Update provider with Step 3 data
      await providerService.updateProfile(providerId, {
        socialSecurityNumber: step3Data.socialSecurityNumber,
        bankDetails: {
          name: step3Data.bankDetails.name,
          clearingNumber: step3Data.bankDetails.clearingNumber,
          bankNumber: step3Data.bankDetails.bankNumber,
          consent: true,
        },
        consents: {
          generalConsent: step3Data.consents.generalConsent,
        },
      });

      toast.success(t("registrationSuccess") || "Registration completed successfully!");
      navigate("/latest-jobs", { replace: true });
    } catch (error: any) {
      console.error('Error completing registration:', error);
      toast.error(
        error.message || t("registrationError") || "An error occurred while completing registration."
      );
    }
  };


  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #f6f8fd 0%, #e2f0ff 100%)",
        backgroundImage: `url(${registerBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/30 backdrop-blur-[4px]"></div>
      <div className="bg-white backdrop-blur-sm p-8 rounded-2xl w-full max-w-xl shadow-xl transition-all duration-300 hover:shadow-2xl relative z-10 my-8 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="flex justify-between">
          {/* Logo with enhanced hover effect */}
          <a href="/landing/provider" className="group flex items-center mb-8 transition-transform hover:scale-105">
            <span className="text-3xl font-extrabold transition-all duration-300">
              <span className="text-teal-600 group-hover:text-teal-700">Vitago</span>
            </span>
            <div className="ml-2 h-2 w-2 bg-gradient-to-tr from-teal-500 to-teal-400 rounded-full group-hover:animate-ping"></div>
          </a>
          <div>
            <ChangeLang />
          </div>
        </div>
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              {step === 1 && (
                <div className="ml-2 text-sm font-medium text-teal-500">
                  {t("basicInfo") || "Basic Information"}
                </div>
              )}
            </div>
            
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full transition-all duration-300 ${step >= 2 ? 'bg-teal-500' : 'bg-gray-200'}`} style={{ width: step >= 2 ? '100%' : '0%' }}></div>
            </div>
            
            {/* Step 2 */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  if (isEmailVerified || step >= 2) {
                    setStep(2);
                    navigate(`/register/provider?step=2`, { replace: true });
                  }
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  step >= 2 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
                } ${(isEmailVerified || step >= 2) ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                disabled={!isEmailVerified && step < 2}
              >
                2
              </button>
              {step === 2 && (
                <div className="ml-2 text-sm font-medium text-teal-500">
                  {t("profileDetails") || "Profile Details"}
                </div>
              )}
            </div>
            
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full transition-all duration-300 ${step >= 3 ? 'bg-teal-500' : 'bg-gray-200'}`} style={{ width: step >= 3 ? '100%' : '0%' }}></div>
            </div>
            
            {/* Step 3 */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  if (isEmailVerified || step >= 3) {
                    setStep(3);
                    navigate(`/register/provider?step=3`, { replace: true });
                  }
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  step >= 3 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
                } ${(isEmailVerified || step >= 3) ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                disabled={!isEmailVerified && step < 3}
              >
                3
              </button>
              {step === 3 && (
                <div className="ml-2 text-sm font-medium text-teal-500">
                  {t("securityAndPayment") || "Security & Payment"}
                </div>
              )}
            </div>
          </div>
        </div>
        {step === 1 ? (
          <Step1 onSubmit={handleBasicRegistration} />
        ) : step === 2 ? (
          <Step2 onSubmit={handleProfileDetails} />
        ) : (
          <Step3 onSubmit={handleCompleteRegistration} onBack={() => setStep(2)} />
        )}
      </div>
    </div>
  );
};

export default ProviderRegisterPage;
