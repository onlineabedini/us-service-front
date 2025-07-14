import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import registerBg from "@/assets/img/register-bg.png";
import Step1 from "./step-1";
import Step2 from "./step-2";
import Footer from "@/components/layout/footer";
import ChangeLang from "@/components/global/changeLangDropdonw";
import { clientService } from "@/services/client.service";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { getCookie } from '@/utils/authCookieService';
import { Address } from "@/types/address";
// import CompletedDialog from "./completedDialog"; // Uncomment if you create a dialog for client

// -- Client registration model --
export interface ClientRegistrationData {
  username: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  socialSecurityNumber: string;
  address: Address[]; // Array of addresses (at least one required)
  description: string;
  profileFile?: File | null;
}

// Initial form data for registration
const initialFormData: ClientRegistrationData = {
  username: "",
  email: "",
  phoneNumber: "",
  firstName: "",
  lastName: "",
  password: "",
  confirmPassword: "",
  socialSecurityNumber: "",
  address: [
    {
      firstName: "",
      lastName: "",
      country: "",
      city: "",
      streetAddress: "",
      floor: undefined,
      postalCode: "",
      doorCode: undefined,
      doorPhone: undefined,
      size: undefined,
      typeOfLiving: undefined,
      numberOfRooms: undefined,
    },
  ],
  description: "",
  profileFile: null,
};

const ClientRegisterPage: React.FC = () => {
  // --- Stepper logic: control step from URL param ---
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const stepParam = params.get("step");
  const initialStep = stepParam === "2" ? 2 : 1;
  const [step, setStep] = useState<number>(initialStep);

  // --- Keep step in sync with URL param ---
  useEffect(() => {
    const currentStep = params.get("step");
    if (currentStep && Number(currentStep) !== step) {
      setStep(Number(currentStep));
    }
    // eslint-disable-next-line
  }, [location.search]);

  // --- Helper to change step and update URL param ---
  const goToStep = (stepNum: number) => {
    params.set("step", String(stepNum));
    navigate({ search: params.toString() }, { replace: true });
    setStep(stepNum);
  };

  // -- Form state --
  const [formData, setFormData] = useState<ClientRegistrationData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // --- Always fetch client data if logged in (token & clientId exist) ---
  const token = getCookie('token');
  const clientId = getCookie('clientId');
  useEffect(() => {
    if (token && clientId) {
      (async () => {
        try {
          const data = await clientService.getClient(clientId);
          setFormData((prev) => ({ ...prev, ...data }));
        } catch (err) {
          toast.error(t("failedToLoadClientData") || "Failed to load client data");
        }
      })();
    }
    // eslint-disable-next-line
  }, [token, clientId]);

  // --- Only fetch and init step 2 data if on step 2 and in edit mode (logged in) ---
  useEffect(() => {
    if (step === 2 && token && clientId) {
      (async () => {
        try {
          const data = await clientService.getClient(clientId);
          // Handle address as array of objects, map first address to form fields
          let address = data.address && Array.isArray(data.address) && data.address.length > 0 ? data.address[0] : {};
          setFormData((prev) => ({
            ...prev,
            // Step 2 fields only:
            username: data.username || prev.username,
            phoneNumber: data.phoneNumber || prev.phoneNumber,
            description: data.description || prev.description,
            address: [
              {
                firstName: address.firstName || prev.address[0].firstName,
                lastName: address.lastName || prev.address[0].lastName,
                country: address.country || prev.address[0].country,
                city: address.city || prev.address[0].city,
                streetAddress: address.streetAddress || prev.address[0].streetAddress,
                floor: address.floor !== undefined && address.floor !== null ? Number(address.floor) : undefined,
                postalCode: address.postalCode || prev.address[0].postalCode,
                doorCode: address.doorCode || prev.address[0].doorCode,
                doorPhone: address.doorPhone !== undefined && address.doorPhone !== null ? Number(address.doorPhone) : undefined,
                size: address.size !== undefined && address.size !== null ? Number(address.size) : undefined,
                typeOfLiving: address.typeOfLiving || prev.address[0].typeOfLiving,
                numberOfRooms: address.numberOfRooms !== undefined && address.numberOfRooms !== null ? Number(address.numberOfRooms) : undefined,
              },
            ],
          }));
        } catch (err) {
          toast.error(t("failedToLoadClientData") || "Failed to load client data");
        }
      })();
    }
    // eslint-disable-next-line
  }, [step, token, clientId]);

  // -- Edit mode: true if logged in (token & clientId) or ?edit=true param --
  const editMode = (step === 2 && !!(token && clientId)) || params.get("edit") === "true";

  // --- Helper: Check if client is activated ---
  const checkClientActivation = async (clientId: string) => {
    try {
      const data = await clientService.getClient(clientId);
      // Assume backend returns isEmailVerified or isActivated
      return data.isEmailVerified || data.isActivated;
    } catch {
      return false;
    }
  };

  // -- Step 1 handler --
  const handleStep1Submit = async (data: Partial<ClientRegistrationData>) => {
    // Short comment: Register client and redirect to activation page
    setFormData((prev) => ({ ...prev, ...data }));
    try {
      const response = await clientService.registerClient({ ...formData, ...data });
      // Optionally store clientId in cookie/localStorage if needed
      if (response && response.id) {
        // Optionally set clientId cookie here if needed for later
        // setCookie('clientId', response.id);
      }
      toast.success(t("registrationSuccess") || "Registration successful! Please check your email for activation.");
      navigate("/activation", { replace: true });
    } catch (error: any) {
      toast.error(error.message || t("registrationFailed") || "Registration failed");
    }
  };

  // -- Step 2 handler --
  const handleStep2Submit = async (data: Partial<ClientRegistrationData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    try {
      let response;
      // --- Edit mode: update client profile ---
      if (editMode && clientId) {
        // Always use address[0] for address fields
        const address = [{
          firstName: formData.address[0].firstName,
          lastName: formData.address[0].lastName,
          country: formData.address[0].country,
          city: formData.address[0].city,
          streetAddress: formData.address[0].streetAddress,
          floor: formData.address[0].floor !== undefined && formData.address[0].floor !== null ? Number(formData.address[0].floor) : undefined,
          postalCode: formData.address[0].postalCode,
          doorCode: formData.address[0].doorCode,
          doorPhone: formData.address[0].doorPhone !== undefined && formData.address[0].doorPhone !== null ? Number(formData.address[0].doorPhone) : undefined,
          size: formData.address[0].size !== undefined && formData.address[0].size !== null ? Number(formData.address[0].size) : undefined,
          typeOfLiving: formData.address[0].typeOfLiving,
          numberOfRooms: formData.address[0].numberOfRooms !== undefined && formData.address[0].numberOfRooms !== null ? Number(formData.address[0].numberOfRooms) : undefined,
        }];
        // 1. Update client profile (without image)
        response = await clientService.updateClient(clientId, {
          ...formData,
          ...data,
          address,
        });
        // 2. If a new profile image is selected, upload it
        if (formData.profileFile instanceof File) {
          try {
            await clientService.uploadProfileImage(clientId, formData.profileFile);
          } catch (imgErr: any) {
            toast.error(imgErr.message || t("profileImageUploadFailed") || "Profile image upload failed");
          }
        }
        toast.success(response.message || t("profileUpdateSuccess") || "Profile updated successfully!");
        setIsCompleted(true);
        setTimeout(() => setIsCompleted(false), 2000);
        setTimeout(() => {
          // Redirect to market place page
          navigate("/marketPlace");
        }, 2000);
      } else {
        // --- Registration mode: register client (without image) ---
        response = await clientService.registerClient(formData);
        // 2. If a profile image is selected, upload it
        if (response && response.id && formData.profileFile instanceof File) {
          try {
            await clientService.uploadProfileImage(response.id, formData.profileFile);
          } catch (imgErr: any) {
            toast.error(imgErr.message || t("profileImageUploadFailed") || "Profile image upload failed");
          }
        }
        setIsCompleted(true);
        toast.success(response.message || "Registration successful!");
        setTimeout(() => {
          navigate("/login/client");
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.message || (editMode ? t("profileUpdateFailed") : "Registration failed"));
      setIsCompleted(false);
    }
  };

  // --- useEffect: Prevent access to step 2 unless activated ---
  useEffect(() => {
    const checkActivationAndRedirect = async () => {
      if (step === 2 && clientId) {
        const activated = await checkClientActivation(clientId);
        if (!activated) {
          navigate("/activation", { replace: true });
        }
      }
    };
    checkActivationAndRedirect();
    // eslint-disable-next-line
  }, [step, clientId]);

  // -- Stepper/progress UI --
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        background: "linear-gradient(135deg, #f6f8fd 0%, #e2f0ff 100%)",
        backgroundImage: `url(${registerBg})`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/30 backdrop-blur-[4px] z-0"></div>
      <div className="flex flex-col items-center justify-center w-full z-10">
        <div className="bg-white backdrop-blur-sm p-8 rounded-2xl w-full max-w-xl shadow-xl transition-all duration-300 hover:shadow-2xl my-8 max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <div className="flex justify-between">
            <a href="/landing/client" className="group flex items-center mb-8 transition-transform hover:scale-105">
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
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                <div className={`ml-2 text-sm font-medium ${step >= 1 ? 'text-teal-500' : 'text-gray-500'}`}>{t("accountDetails") || "Account Details"}</div>
              </div>
              <div className="flex-1 h-1 mx-4 bg-gray-200">
                <div className={`h-full ${step >= 2 ? 'bg-teal-500' : 'bg-gray-200'}`} style={{ width: step >= 2 ? '100%' : '0%' }}></div>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                <div className={`ml-2 text-sm font-medium ${step >= 2 ? 'text-teal-500' : 'text-gray-500'}`}>{t("profileContact") || "Profile & Contact"}</div>
              </div>
            </div>
          </div>
          {/* Step content */}
          {isCompleted ? (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold text-teal-600 mb-4">
                {editMode
                  ? t("profileUpdateSuccess") || "Profile updated successfully!"
                  : t("registrationSuccess") || "Registration successful!"}
              </h2>
              {/* Only show button for registration, not for update */}
              {!editMode && (
                <button
                  className="mt-4 px-6 py-2 bg-teal-600 text-white rounded"
                  onClick={() => navigate("/login/client")}
                >
                  {t("goToLogin") || "Go to Login"}
                </button>
              )}
            </div>
          ) : step === 1 ? (
            <Step1
              formData={formData}
              setFormData={setFormData}
              validationErrors={validationErrors}
              setValidationErrors={setValidationErrors}
              onSubmit={handleStep1Submit}
            />
          ) : (
            <Step2
              formData={formData}
              setFormData={setFormData}
              validationErrors={validationErrors}
              setValidationErrors={setValidationErrors}
              onSubmit={handleStep2Submit}
              editMode={editMode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientRegisterPage;
