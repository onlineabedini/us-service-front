import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Import your custom sections
import HeaderSection from "./sections/HeaderSection";
import ProfileImageSection from "./sections/ProfileImageSection";
import GeneralInputsSection, { ProviderData } from "./sections/GeneralInputsSection";
import AddressSection from "./sections/AddressSection";
import BankDetailsSection from "./sections/BankDetailsSection";
import AvailabilitySection from "./sections/AvailabilitySection";

import { API_BASE_URL } from '@/config/api';

const baseUrl = API_BASE_URL;

interface EditProfileFormProps {
  userData: ProviderData;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  userData,
  onClose,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();

  // State for the full form data
  const [formData, setFormData] = useState<ProviderData>({ ...userData });
  // State for showing inline validation errors
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Profile image preview & file for uploading
  const [imagePreview, setImagePreview] = useState<string>(
    userData.profileImage
      ? `${baseUrl}/${userData.profileImage}`
      : "/src/assets/img/provider.jpg" // Fallback or some placeholder
  );
  const [profileFile, setProfileFile] = useState<File | null>(null);

  // Work permit file for uploading
  const [workPermitFile, setWorkPermitFile] = useState<File | null>(null);

  /**
   * Handle changes to basic fields (text, textarea, etc.),
   * and do inline validations.
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;

      const updatedFormData = {
        ...formData,
        [id]: value,
      };

      let error = "";

      // Inline validations
      switch (id) {
        case "email":
          if (value && !/^\S+@\S+\.\S+$/.test(value)) {
            error = t("invalidEmail") || "Invalid email format.";
          }
          break;

        case "username":
          // Example: allow only letters, numbers, underscores
          if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
            error =
              t("invalidUsername") ||
              "Username can only contain letters, numbers, and underscores.";
          }
          break;

        case "hourlyRate": {
          const numericValue = Number(value);
          const currentCurrency = "SEK";
          let minRate = 200;
          let maxRate = 1000;

          // Example logic: different range if currency is SEK
          if (currentCurrency === "SEK") {
            minRate = 200;
            maxRate = 1000;
          }

          if (
            isNaN(numericValue) ||
            numericValue < minRate ||
            numericValue > maxRate
          ) {
            error =
              t("invalidHourlyRate") ||
              `Hourly rate must be between ${minRate} and ${maxRate} SEK.`;
          }
          break;
        }

        case "phoneNumber":
          // Example: digits only, length 7-15
          if (value && !/^[0-9]{7,15}$/.test(value)) {
            error = t("invalidPhoneNumber") || "Phone number must be 7-15 digits.";
          }
          break;

        // ... add other field validations here if needed ...

        default:
          break;
      }

      setValidationErrors((prev) => ({
        ...prev,
        [id]: error,
      }));

      setFormData(updatedFormData);
    },
    [t, formData]
  );

  /**
   * Handle file input changes (e.g., work permit).
   */
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id } = e.target;
    if (e.target.files && e.target.files[0]) {
      if (id === "workPermit") {
        setWorkPermitFile(e.target.files[0]);
        // Optionally set a temporary preview
        setFormData((prev) => ({
          ...prev,
          workPermit: URL.createObjectURL(e.target.files![0]),
        }));
      }
    }
  }, []);

  /**
   * Handle profile image changes.
   */
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  /**
   * Handle changes in availability (passed down to <AvailabilitySection />).
   */
  const handleAvailabilityChange = useCallback((updatedAvailability: any) => {
    setFormData((prev) => ({
      ...prev,
      availability: updatedAvailability,
    }));
  }, []);

  /**
   * Handlers for combo boxes, arrays, etc.
   */
  const handleLanguagesChange = useCallback((languages: string[]) => {
    setFormData((prev) => ({ ...prev, languages }));
  }, []);

  const handleOfferedServicesChange = useCallback((services: string[]) => {
    setFormData((prev) => ({ ...prev, offeredServices: services }));
  }, []);

  const handleServiceAreaChange = useCallback((areas: string[]) => {
    setFormData((prev) => ({ ...prev, serviceArea: areas }));
  }, []);

  const handleCitizenshipChange = useCallback((citizenship: string) => {
    setFormData((prev) => ({ ...prev, citizenship }));
  }, []);

  /**
   * Final save handler.
   * Checks for any validation errors before proceeding.
   */
  const handleSave = useCallback(async () => {
    // If any field has an error, don't proceed
    const hasErrors = Object.values(validationErrors).some((err) => err !== "");
    if (hasErrors) {
      toast.error(
        t("pleaseFixErrors") || "Please fix the validation errors before saving."
      );
      return;
    }

    try {
      // Upload profile image if there's a new file
      if (profileFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("profileImage", profileFile);

        const uploadResponse = await fetch(
          `${baseUrl}/provider/${formData.id}/upload-profile`,
          {
            method: "POST",
            body: uploadFormData,
          }
        );
        if (!uploadResponse.ok) {
          throw new Error(t("failedUploadProfileImage") || "Profile image upload failed.");
        }
      }

      // Upload work permit file if there's a new file
      if (workPermitFile) {
        const workPermitFormData = new FormData();
        workPermitFormData.append("workPermit", workPermitFile);

        const workPermitResponse = await fetch(
          `${baseUrl}/provider/${formData.id}/upload-work-permit`,
          {
            method: "POST",
            body: workPermitFormData,
          }
        );
        if (!workPermitResponse.ok) {
          throw new Error(t("failedUploadWorkPermit") || "Work permit upload failed.");
        }
      }

      // Prepare the final data excluding local file references
      const { profileImage, workPermit, ...payload } = formData;

      // Send patch request
      const updateResponse = await fetch(`${baseUrl}/provider/${formData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!updateResponse.ok) {
        throw new Error(t("failedUpdateProfile") || "Profile update failed.");
      }

      toast.success(t("profileUpdated"), {
        description: t("profileUpdatedDescription"),
      });

      // Success callback & close
      onSaveSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(t("failedUpdateProfile") || "Failed to update profile.");
      // We do NOT close if there's an error
    }
  }, [
    validationErrors,
    formData,
    profileFile,
    workPermitFile,
    onClose,
    onSaveSuccess,
    t,
  ]);

  return (
    <div className="p-6">
      <HeaderSection onSave={handleSave} onClose={onClose} />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN: Profile image & Availability */}
        <div className="lg:w-1/3">
          <ProfileImageSection
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
          />
          <AvailabilitySection
            availability={formData.availability}
            onAvailabilityChange={handleAvailabilityChange}
          />
        </div>

        {/* RIGHT COLUMN: General inputs & Address */}
        <div className="lg:w-2/3 flex flex-col gap-6">
          <GeneralInputsSection
            formData={formData}
            onInputChange={handleInputChange}
            onUpload={handleUpload}
            onLanguagesChange={handleLanguagesChange}
            onOfferedServicesChange={handleOfferedServicesChange}
            onServiceAreaChange={handleServiceAreaChange}
            onCitizenshipChange={handleCitizenshipChange}
            validationErrors={validationErrors}
          />

          <AddressSection
            address={formData.address || []}
            onNestedInputChange={(
              e: React.ChangeEvent<HTMLInputElement>,
              field: "address",
              index: number,
              key: string 
            ) => {
              setFormData((prev) => {
                const updatedField = [...(prev[field] || [])];
                updatedField[index] = {
                  ...updatedField[index],
                  [key]: e.target.value,
                };
                return { ...prev, [field]: updatedField };
              });
            }}
          />

          <BankDetailsSection
            bankDetails={formData.bankDetails || {
              accountHolder: null,
              bankName: null,
              accountNumber: null,
              IBAN: null,
              SWIFT: null
            }}
            onInputChange={(e, field) => {
              setFormData((prev) => ({
                ...prev,
                bankDetails: {
                  ...prev.bankDetails,
                  [field]: e.target.value
                }
              }));
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EditProfileForm;
