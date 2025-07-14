// Client Step 2: Address and Home Details
// ... 

// Step 2: Client Address and Home Details
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clientService } from '@/services/client.service';
import { FiLogOut, FiTrash2, FiCheck, FiPhone, FiInfo, FiShield, FiMail, FiUser, FiMapPin, FiHash, FiFileText, FiLayers, FiKey, FiMaximize, FiHome, FiGrid } from "react-icons/fi";
import { removeCookie } from '@/utils/authCookieService';
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/global/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { prioritizedCountries } from "@/lists/countries";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ProfileImage from "@/components/global/profileImage";
import { API_BASE_URL } from '@/config/api';
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { phonePreFixes } from "@/lists/phonePreFixes";
import { countryFlags } from "@/lists/countryFlags";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { 
  FiBold, 
  FiItalic, 
  FiUnderline, 
  FiAlignLeft, 
  FiAlignCenter, 
  FiAlignRight 
} from 'react-icons/fi';
import { BsListUl, BsListOl } from 'react-icons/bs';
import { handleApiError } from "@/utils/handleErrors";

// -- Props for Step2 --
interface Step2Props {
  formData: any;
  setFormData: (cb: (prev: any) => any) => void;
  validationErrors: { [key: string]: string };
  setValidationErrors: (cb: (prev: { [key: string]: string }) => { [key: string]: string }) => void;
  onSubmit: (data: any) => void;
  editMode?: boolean;
}

interface DeleteAccountData {
  username: string;
  reason: string;
}

// Delete Account Dialog Component
const DeleteAccountDialog = React.memo<{
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  deleteData: DeleteAccountData;
  setDeleteData: (data: DeleteAccountData) => void;
  isDeleting: boolean;
  username: string;
}>(({ isOpen, onClose, onDelete, deleteData, setDeleteData, isDeleting, username }) => {
  const { t } = useTranslation();
  const [localUsername, setLocalUsername] = React.useState(deleteData.username);
  const [deleteErrors, setDeleteErrors] = React.useState<{ username?: string }>({});

  React.useEffect(() => {
    setLocalUsername(deleteData.username);
  }, [deleteData.username]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalUsername(newValue);
    setDeleteData({ ...deleteData, username: newValue });
    setDeleteErrors((prev) => ({ ...prev, username: undefined }));
  };

  const handleDelete = async () => {
    const newErrors: { username?: string } = {};

    if (localUsername !== username) {
      newErrors.username = t("usernameNotMatch") || "Username doesn't match";
    }

    if (Object.keys(newErrors).length > 0) {
      setDeleteErrors(newErrors);
      return;
    }

    onDelete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
            <FiTrash2 className="w-5 h-5" />
            {t("deleteAccount")}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {t("deleteAccountWarning")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("confirmUsername")}
            </label>
            <Input
              type="text"
              placeholder={username}
              value={localUsername}
              onChange={handleUsernameChange}
              className={cn(
                "w-full",
                deleteErrors.username && "border-red-500 focus:ring-red-500"
              )}
            />
            {deleteErrors.username && (
              <p className="text-sm text-red-500">{deleteErrors.username}</p>
            )}
          </div>
        </div>
        <DialogFooter className="flex gap-3 sm:gap-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              setDeleteData({ username: "", reason: "" });
              setDeleteErrors({});
            }}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2",
              isDeleting && "opacity-50 cursor-not-allowed"
            )}
          >
            {isDeleting ? (
              <>
                <Skeleton className="h-4 w-4 rounded-full" />
                <span>{t("deleting")}</span>
              </>
            ) : (
              <>
                <FiTrash2 className="w-4 h-4" />
                <span>{t("confirmDelete")}</span>
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

DeleteAccountDialog.displayName = 'DeleteAccountDialog';

// -- Step2 Component --
const Step2: React.FC<Step2Props> = ({ formData, setFormData, validationErrors, setValidationErrors, onSubmit, editMode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteData, setDeleteData] = useState<DeleteAccountData>({
    username: "",
    reason: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+46");
  const [localPhoneNumber, setLocalPhoneNumber] = useState("");

  // For country combobox
  const [countrySearch, setCountrySearch] = React.useState("");
  const filteredCountries = prioritizedCountries.filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // --- Profile Image Upload State and Handler ---
  const [profileFile, setProfileFile] = React.useState<File | null>(formData.profileFile || null);
  const [imagePreview, setImagePreview] = React.useState<string>(
    formData.profileFile
      ? URL.createObjectURL(formData.profileFile)
      : formData.profileImage
        ? `${API_BASE_URL}/${formData.profileImage}`
        : '/assets/img/provider.jpg'
  );

  // Effect: Update image preview when formData changes
  React.useEffect(() => {
    if (formData.profileFile instanceof File) {
      setImagePreview(URL.createObjectURL(formData.profileFile));
    } else if (formData.profileImage) {
      setImagePreview(`${API_BASE_URL}/${formData.profileImage}`);
    } else {
      setImagePreview('/assets/img/provider.jpg');
    }
  }, [formData.profileFile, formData.profileImage]);

  // Handle profile image change and validation
  const handleImageChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors(prev => ({ ...prev, profileImage: t("imageTooLarge") || "Image must be less than 5MB" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setValidationErrors(prev => ({ ...prev, profileImage: t("invalidImageType") || "Please upload an image file" }));
      return;
    }
    setValidationErrors(prev => ({ ...prev, profileImage: "" }));
    setProfileFile(file);
    setFormData((prev: any) => ({ ...prev, profileFile: file }));
    setImagePreview(URL.createObjectURL(file));
  }, [t, setValidationErrors, setFormData]);

  // Sync localPhoneNumber and selectedCountryCode with formData.phoneNumber
  useEffect(() => {
    if (formData.phoneNumber) {
      const matchingPrefix = Object.values(phonePreFixes).find((prefix) =>
        formData.phoneNumber.startsWith(prefix)
      );
      if (matchingPrefix) {
        setSelectedCountryCode(matchingPrefix);
        setLocalPhoneNumber(formData.phoneNumber.substring(matchingPrefix.length));
      } else {
        setLocalPhoneNumber(formData.phoneNumber);
      }
    }
  }, [formData.phoneNumber]);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['paragraph', 'heading'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      BulletList.configure({
        keepMarks: true,
        keepAttributes: false,
      }),
      OrderedList.configure({
        keepMarks: true,
        keepAttributes: false,
      }),
      ListItem,
    ],
    content: formData.description || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText().trim();

      setFormData((prev: any) => ({ ...prev, description: html }));

      setValidationErrors((prev: any) => ({
        ...prev,
        description: !text ? t("requiredField") : undefined
      }));
    },
  });

  // Update editor content when formData.description changes
  useEffect(() => {
    if (editor && formData.description && formData.description !== editor.getHTML()) {
      editor.commands.setContent(formData.description);
    }
  }, [editor, formData.description]);

  // -- Validation functions --
  const validateField = useCallback((fieldName: string, value: any) => {
    let errorMsg = "";

    switch (fieldName) {
      case "username":
        if (!value) {
          errorMsg = t("usernameRequired") || "Username is required";
        } else if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(value)) {
          errorMsg = t("usernameInvalid") || "Username can only contain letters, numbers, spaces, and common special characters";
        }
        break;
      case "phoneNumber":
        errorMsg = validatePhoneNumber(value, selectedCountryCode);
        break;
      case "socialSecurityNumber":
        if (!value) {
          errorMsg = t("socialSecurityNumberRequired") || "Social security number is required";
        } else {
          // Remove any non-digit characters for validation
          const cleanValue = value.replace(/[^0-9]/g, '');
          
          // Check if the cleaned value is 10-12 digits
          if (!/^[0-9]{10,12}$/.test(cleanValue)) {
            errorMsg = t("invalidSocialSecurityNumber") || "Social security number must be 10-12 digits";
          } else {
            // Validate the date part (first 8 digits)
            const year = parseInt(cleanValue.substring(0, 4));
            const month = parseInt(cleanValue.substring(4, 6));
            const day = parseInt(cleanValue.substring(6, 8));
            
            const date = new Date(year, month - 1, day);
            if (date.getMonth() !== month - 1 || date.getDate() !== day) {
              errorMsg = t("invalidSocialSecurityNumber") || "Invalid date in social security number";
            }
          }
        }
        break;
      case "address.firstName":
        if (!value) {
          errorMsg = t("firstNameRequired") || "First name is required";
        }
        break;
      case "address.lastName":
        if (!value) {
          errorMsg = t("lastNameRequired") || "Last name is required";
        }
        break;
      case "address.country":
        if (!value) {
          errorMsg = t("countryRequired") || "Country is required";
        }
        break;
      case "address.city":
        if (!value) {
          errorMsg = t("cityRequired") || "City is required";
        }
        break;
      case "address.streetAddress":
        if (!value) {
          errorMsg = t("streetAddressRequired") || "Street address is required";
        }
        break;
      case "address.postalCode":
        if (!value) {
          errorMsg = t("postalCodeRequired") || "Postal code is required";
        }
        break;
      case "address.floor":
        if (value && isNaN(Number(value))) {
          errorMsg = t("invalidFloor") || "Floor must be a number";
        }
        break;
      case "address.doorPhone":
        if (value && isNaN(Number(value))) {
          errorMsg = t("invalidDoorPhone") || "Door phone must be a number";
        }
        break;
      case "address.size":
        if (value && isNaN(Number(value))) {
          errorMsg = t("invalidSize") || "Size must be a number";
        }
        break;
      case "address.numberOfRooms":
        if (!value) {
          errorMsg = t("numberOfRoomsRequired") || "Number of rooms is required";
        } else if (isNaN(Number(value)) || Number(value) < 1) {
          errorMsg = t("invalidNumberOfRooms") || "Number of rooms must be at least 1";
        }
        break;
      default:
        break;
    }

    return errorMsg;
  }, [t, selectedCountryCode]);

  // Helper to update nested address fields with validation
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldName = `address.${id}`;
    
    // Validate the field
    const errorMsg = validateField(fieldName, value);
    setValidationErrors(prev => ({ ...prev, [fieldName]: errorMsg }));

    // Update form data
    setFormData((prev: any) => ({
      ...prev,
      address: [
        {
          ...prev.address[0],
          [id]: value,
        },
      ],
    }));
  };

  // -- Handle input change with validation --
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      if (id === "phoneNumber") {
        handlePhoneNumberChange(e as React.ChangeEvent<HTMLInputElement>);
      } else if (id === "socialSecurityNumber") {
        let formattedValue = value.replace(/[^0-9+-]/g, "");
        formattedValue = formattedValue.slice(0, 13);
        const error = validateSocialSecurityNumber(formattedValue);
        setValidationErrors((prev: any) => ({ ...prev, socialSecurityNumber: error }));
        setFormData((prev: any) => ({ ...prev, [id]: String(formattedValue) }));
      } else {
        if (safeTrim(value)) {
          setValidationErrors((prev: any) => {
            const newErrors = { ...prev };
            delete newErrors[id];
            return newErrors;
          });
        }
        setFormData((prev: any) => ({ ...prev, [id]: typeof value === 'string' ? value : String(value ?? '') }));
      }
    },
    [selectedCountryCode, t]
  );

  // Helper to build address summary
  const getAddressSummary = useCallback(() => {
    const a = formData.address[0] || {};
    const parts = [];
    if (a.firstName?.trim()) parts.push(a.firstName);
    if (a.lastName?.trim()) parts.push(a.lastName);
    if (a.streetAddress?.trim()) parts.push(a.streetAddress);
    if (a.postalCode?.trim()) parts.push(a.postalCode);
    if (a.city?.trim()) parts.push(a.city);
    if (a.country?.trim()) parts.push(a.country);
    return parts.length > 0 ? parts.join(", ") : t("address", "Address");
  }, [formData.address, t]);

  // Handle save draft without validation
  const handleSafeDraft = async () => {
    try {
      // Clear any existing validation errors
      setValidationErrors(() => ({}));
      // Submit the form data without validation
      await onSubmit(formData);
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  // Handle submit with validation
  const handleSubmit = async () => {
    try {
      // Validate all fields
      const errors: { [key: string]: string } = {};
      
      // Special validation for description using editor
      if (!editor?.getText().trim()) {
        errors.description = t("requiredField") || "Description is required";
      }
      
      Object.keys(formData).forEach(key => {
        if (key !== 'profileFile' && key !== 'description') { // Skip profile file and description validation
          const error = validateField(key, formData[key]);
          if (error) errors[key] = error;
        }
      });

      // Validate address fields
      Object.keys(formData.address[0]).forEach(key => {
        const error = validateField(`address.${key}`, formData.address[0][key]);
        if (error) errors[`address.${key}`] = error;
      });

      // Update validation errors
      setValidationErrors(() => errors);

      // If there are no errors, submit the form
      if (Object.keys(errors).length === 0) {
        await onSubmit(formData);
      } else {
        toast.error(t("pleaseFixErrors") || "Please fix validation errors before submitting");
      }
    } catch (error: any) {
      toast.error(error.message || t("submitFailed") || "Failed to submit form");
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await clientService.deleteAccount(formData.id, { reason: deleteData.reason });
      toast.success(t("deleteAccountSuccess") || "Account deleted successfully!");
      removeCookie('clientId');
      removeCookie('token');
      setTimeout(() => {
        window.location.href = "/landing/client";
      }, 3000);
    } catch (error: any) {
      console.error(error);
      // Use the new error handling utility
      const { message, description } = handleApiError(error, t);
      toast.error(message, { description });
    } finally {
      setIsDeleting(false);
    }
  };

  // Add the missing utility functions
  const safeTrim = (value: any) => (typeof value === 'string' ? value.trim() : String(value ?? '').trim());

  const validateSocialSecurityNumber = (ssn: string): string => {
    if (!ssn) {
      return t("socialSecurityNumberRequired") || "Social security number is required";
    }
    
    // Remove any non-digit characters for validation
    const cleanValue = ssn.replace(/[^0-9]/g, '');
    
    // Check if the cleaned value is 10-12 digits
    if (!/^[0-9]{10,12}$/.test(cleanValue)) {
      return t("invalidSocialSecurityNumber") || "Social security number must be 10-12 digits";
    }
    
    // Validate the date part (first 8 digits)
    const year = parseInt(cleanValue.substring(0, 4));
    const month = parseInt(cleanValue.substring(4, 6));
    const day = parseInt(cleanValue.substring(6, 8));
    
    const date = new Date(year, month - 1, day);
    if (date.getMonth() !== month - 1 || date.getDate() !== day) {
      return t("invalidSocialSecurityNumber") || "Invalid date in social security number";
    }
    
    return "";
  };

  // Phone number validation (copied from provider step 2)
  const validatePhoneNumber = (phone: string, countryCode: string): string => {
    if (!phone) {
      return t("invalidPhoneNumber") || "Invalid phone number";
    }

    const cleanPhone = phone.replace(/[^\d+]/g, "");

    if (cleanPhone.length < 8) return t("invalidPhoneNumber") || "Invalid phone number";
    if (cleanPhone.length > 15) return t("invalidPhoneNumber") || "Invalid phone number";

    const numericCountryCode = countryCode.replace(/\+/g, "");
    let numericPhone = cleanPhone;
    if (cleanPhone.startsWith("+")) {
      numericPhone = cleanPhone.substring(1);
    }

    if (!numericPhone.startsWith(numericCountryCode)) {
      return t("invalidPhoneNumber") || "Invalid phone number";
    }

    const remainingDigits = numericPhone.substring(numericCountryCode.length);

    // Check for leading zeros in the remaining digits
    if (remainingDigits.startsWith("0")) {
      return t("invalidPhoneNumber") || "Invalid phone number";
    }

    if (!/^\d+$/.test(remainingDigits)) {
      return t("invalidPhoneNumber") || "Invalid phone number";
    }

    if (countryCode === "+46") {
      // Swedish-specific rules - must start with 7, followed by 8 digits
      if (!/^7/.test(remainingDigits)) {
        return t("invalidPhoneNumber") || "Invalid phone number";
      }
      if (remainingDigits.length !== 9) {
        return t("invalidPhoneNumber") || "Invalid phone number";
      }
    } else {
      if (remainingDigits.length < 6 || remainingDigits.length > 12) {
        return t("invalidPhoneNumber") || "Invalid phone number";
      }
    }

    return "";
  };

  // Phone number change logic (copied from provider step 2)
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let sanitizedValue = e.target.value.replace(/[^0-9]/g, "");
    // Remove any leading zeros
    while (sanitizedValue.startsWith("0")) {
      sanitizedValue = sanitizedValue.substring(1);
    }
    sanitizedValue = sanitizedValue.slice(0, 15);
    setLocalPhoneNumber(sanitizedValue);
    const fullNumber = selectedCountryCode + sanitizedValue;
    const error = validatePhoneNumber(fullNumber, selectedCountryCode);
    setValidationErrors((prev: any) => ({ ...prev, phoneNumber: error }));
    setFormData((prev: any) => ({ ...prev, phoneNumber: fullNumber }));
  };

  // Country code change logic for phone number
  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    setSelectedCountryCode(newCountryCode);
    const fullNumber = newCountryCode + localPhoneNumber;
    const error = validatePhoneNumber(fullNumber, newCountryCode);
    setValidationErrors((prev: any) => ({ ...prev, phoneNumber: error }));
    setFormData((prev: any) => ({ ...prev, phoneNumber: fullNumber }));
  };

  // -- Render --
  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Logout Button (top right) */}
      <div className="flex justify-end items-center mb-4">
        <button
          type="button"
          onClick={() => {
            removeCookie('clientId');
            removeCookie('token');
            navigate('/landing/client');
          }}
          className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <FiLogOut className="w-4 h-4" />
          <span>{t("logOut") || "Logout"}</span>
        </button>
      </div>
      {/* Basic Info Section Title */}
      <h2 className="text-xl font-semibold text-teal-500 mb-2 flex items-center gap-2">
        <FiUser className="w-5 h-5" />
        {t("Basic Info")}
      </h2>
      {/* Basic Info Section (match ClientBasicInfo) */}
      <div className="flex flex-col gap-6 pb-8 border-b border-gray-200 w-full">
        <div className="flex flex-col items-center mb-6">
          <ProfileImage
            imageUrl={imagePreview}
            alt={t("profileImageAlt") || "Profile Image"}
            editable={true}
            size="md"
            onImageChange={handleImageChange}
            label={t("Client Profile")}
          />
          {validationErrors.profileImage && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.profileImage}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
          {/* Email (full width, disabled) */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
              <FiMail className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
              {t("email")}
              <div className="ml-2 group relative inline-block flex-shrink-0">
                <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                  {t("tooltips.email") || "Your email address."}
                </div>
              </div>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              disabled
              className="w-full bg-gray-50 cursor-not-allowed"
            />
          </div>
          {/* First Name (left, disabled) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 flex items-center">
              <FiUser className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
              {t("firstName")}
              <div className="ml-2 group relative inline-block flex-shrink-0">
                <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                  {t("tooltips.firstName") || "Your first name as registered in the system."}
                </div>
              </div>
            </Label>
            <Input
              id="firstName"
              value={formData.firstName || ""}
              disabled
              className="w-full bg-gray-50 cursor-not-allowed"
            />
          </div>
          {/* Last Name (right, disabled) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 flex items-center">
              <FiUser className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
              {t("lastName")}
              <div className="ml-2 group relative inline-block flex-shrink-0">
                <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                  {t("tooltips.lastName") || "Your last name as registered in the system."}
                </div>
              </div>
            </Label>
            <Input
              id="lastName"
              value={formData.lastName || ""}
              disabled
              className="w-full bg-gray-50 cursor-not-allowed"
            />
          </div>
          {/* Title/Nickname (full width) */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700 flex items-center">
              <FiUser className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
              {t("Username/Nickname")}
              <div className="ml-2 group relative inline-block flex-shrink-0">
                <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                  {t("tooltips.username") || "Your professional title or preferred nickname. This will be visible to providers."}
                </div>
              </div>
            </Label>
            <Input
              id="username"
              value={formData.username || ""}
              onChange={handleInputChange}
              className={`w-full h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors.username ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
              placeholder={t("Enter username")}
            />
            {validationErrors.username && (
              <p className="text-red-500 text-sm mt-1 animate-fadeIn">
                {validationErrors.username}
              </p>
            )}
          </div>
          {/* Social Security Number (full width, provider style) */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="socialSecurityNumber" className="text-sm font-medium text-gray-700 flex items-center">
              <FiShield className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
              {t("socialSecurityNumber") || "Personal Identity Number"}
              <div className="ml-2 group relative inline-block flex-shrink-0">
                <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                  {t("tooltips.socialSecurityNumber") || `Use Swedish personnummer (e.g. 19900101-1234 or 900101-1234). Must include valid date and control digit.`}
                </div>
              </div>
            </Label>
            <div className="relative w-full">
              <Input
                type="text"
                id="socialSecurityNumber"
                value={formData.socialSecurityNumber || ""}
                onChange={handleInputChange}
                placeholder="19900101-1234"
                inputMode="numeric"
                className={`w-full px-4 py-2 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 rounded-md transition-all duration-200 ${validationErrors.socialSecurityNumber ? "border-red-500 bg-red-50" : ""}`}
                required
              />
              {validationErrors.socialSecurityNumber && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FiInfo className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
            {validationErrors.socialSecurityNumber && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <FiInfo className="w-4 h-4 mr-1" />
                {validationErrors.socialSecurityNumber}
              </p>
            )}
          </div>
          {/* Phone Number (full width, provider style) */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 flex items-center">
              <FiPhone className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
              {t("phoneNumber")}
              <div className="ml-2 group relative inline-block flex-shrink-0">
                <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                  {t("tooltips.phoneNumber") || "Enter your local mobile number. The country code is selected separately."}
                </div>
              </div>
            </Label>
            <div className="relative flex w-full">
              <select
                value={selectedCountryCode}
                onChange={handleCountryCodeChange}
                className="w-28 sm:w-32 pl-9 pr-3 py-2 h-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 rounded-md transition-all duration-200 appearance-none bg-white shadow-sm flex-shrink-0"
              >
                {Object.entries(phonePreFixes).map(([country, code]) => (
                  <option key={country} value={code} className="flex items-center">
                    {code} ({country})
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {(() => {
                  const country = Object.entries(phonePreFixes).find(([, code]) => code === selectedCountryCode)?.[0];
                  const countryData = countryFlags.find((c: any) => c.name === country);
                  return countryData ? (
                    <span className={`fi fi-${countryData.code.toLowerCase()} w-4 h-4 rounded-sm shadow-sm`} />
                  ) : null;
                })()}
              </div>
              <Input
                type="tel"
                id="phoneNumber"
                value={localPhoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder={t("enterPhoneNumber") || "Enter your local mobile number"}
                className={`w-full px-4 py-2 h-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 rounded-md transition-all duration-200 shadow-sm ${validationErrors.phoneNumber ? "border-red-500 bg-red-50" : ""}`}
                required
              />
              {validationErrors.phoneNumber && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FiInfo className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
            {validationErrors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <FiInfo className="w-4 h-4 mr-1" />
                {validationErrors.phoneNumber}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Address Section Title */}
      <h2 className="text-xl font-semibold text-teal-500 mb-2 mt-8 flex items-center gap-2">
        <FiMapPin className="w-5 h-5" />
        {t("Address")}
      </h2>
      {/* Address Section (accordion, closed by default, preview in header) */}
      <div className="mt-4 space-y-4 pb-8 border-b border-gray-200 w-full">
        {/* Accordion for address fields */}
        <Accordion type="single" collapsible defaultValue="">
          <AccordionItem value="address">
            <AccordionTrigger className="bg-gray-200 px-4 py-3">
              <h3 className="font-normal">{getAddressSummary()}</h3>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-3 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {/* First Name (address.firstName) */}
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="firstName" className="flex items-center text-sm font-medium text-gray-700">
                      <FiUser className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
                      {t("firstName", "First Name")}
                      <div className="ml-2 group relative inline-block flex-shrink-0">
                        <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                        <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                          {t("tooltips.firstName") || "Your first name for the address."}
                        </div>
                      </div>
                    </Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        value={formData.address[0].firstName || ""}
                        onChange={handleAddressInputChange}
                        className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors["address.firstName"] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                        placeholder={t("Enter first name", "Enter first name")}
                      />
                      {validationErrors["address.firstName"] && (
                        <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                          {validationErrors["address.firstName"]}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Last Name (address.lastName) */}
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="lastName" className="flex items-center text-sm font-medium text-gray-700">
                      <FiUser className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
                      {t("lastName", "Last Name")}
                      <div className="ml-2 group relative inline-block flex-shrink-0">
                        <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                        <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                          {t("tooltips.lastName") || "Your last name for the address."}
                        </div>
                      </div>
                    </Label>
                    <div className="relative">
                      <Input
                        id="lastName"
                        value={formData.address[0].lastName || ""}
                        onChange={handleAddressInputChange}
                        className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors["address.lastName"] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                        placeholder={t("Enter last name", "Enter last name")}
                      />
                      {validationErrors["address.lastName"] && (
                        <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                          {validationErrors["address.lastName"]}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Street Address */}
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="streetAddress" className="flex items-center text-sm font-medium text-gray-700">
                      <FiMapPin className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
                      {t("streetAddress", "Street Address")}
                      <div className="ml-2 group relative inline-block flex-shrink-0">
                        <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                        <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                          {t("tooltips.streetAddress") || "Your street address."}
                        </div>
                      </div>
                    </Label>
                    <div className="relative">
                      <Input
                        id="streetAddress"
                        value={formData.address[0].streetAddress || ""}
                        onChange={handleAddressInputChange}
                        className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors["address.streetAddress"] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                        placeholder={t("Enter street address", "Enter street address")}
                      />
                      {validationErrors["address.streetAddress"] && (
                        <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                          {validationErrors["address.streetAddress"]}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Zip Code */}
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="postalCode" className="flex items-center text-sm font-medium text-gray-700">
                      <FiHash className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
                      {t("zipCode", "Zip Code")}
                      <div className="ml-2 group relative inline-block flex-shrink-0">
                        <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                        <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                          {t("tooltips.zipCode") || "Your postal code."}
                        </div>
                      </div>
                    </Label>
                    <div className="relative">
                      <Input
                        id="postalCode"
                        value={formData.address[0].postalCode || ""}
                        onChange={handleAddressInputChange}
                        className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors["address.postalCode"] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                        placeholder={t("Enter zip code", "Enter zip code")}
                      />
                      {validationErrors["address.postalCode"] && (
                        <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                          {validationErrors["address.postalCode"]}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* City */}
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="city" className="flex items-center text-sm font-medium text-gray-700">
                      <FiMapPin className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
                      {t("city", "City")}
                      <div className="ml-2 group relative inline-block flex-shrink-0">
                        <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                        <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                          {t("tooltips.city") || "Your city."}
                        </div>
                      </div>
                    </Label>
                    <div className="relative">
                      <Input
                        id="city"
                        value={formData.address[0].city || ""}
                        onChange={handleAddressInputChange}
                        className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors["address.city"] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                        placeholder={t("Enter city", "Enter city")}
                      />
                      {validationErrors["address.city"] && (
                        <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                          {validationErrors["address.city"]}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Country with simple input (no combobox, matches client edit page) */}
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="country">
                      {t("country", "Country")}
                    </Label>
                    {/* Simple text input for country, no combobox */}
                    <div className="relative">
                      <Input
                        id="country"
                        value={formData.address[0].country || ""}
                        onChange={handleAddressInputChange}
                        className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors["address.country"] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                        placeholder={t("Enter country", "Enter country")}
                      />
                      {validationErrors["address.country"] && (
                        <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                          {validationErrors["address.country"]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      {/* Description Section Title */}
      <h2 className="text-xl font-semibold text-teal-500 mb-2 mt-8 flex items-center gap-2">
        <FiFileText className="w-5 h-5" />
        {t("aboutMe") || "About me"}
      </h2>
      {/* Description Field with Rich Text Editor */}
      <div className="pb-8 border-b border-gray-200">
        <label
          htmlFor="description"
          className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"
        >
          <FiFileText className="w-4 h-4 mr-2 text-teal-500" />
          {t("aboutMe") || "About me"}
          {validationErrors.description && (
            <span className="text-red-500 text-sm ml-2">({t("requiredField")})</span>
          )}
          <div className="ml-2 relative inline-block group">
            <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
            <div className="absolute z-10 w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              {t("tooltips.description") || "Provide a brief description about yourself, your preferences, and any specific requirements."}
            </div>
          </div>
        </label>
        
        <div className={`w-full border-2 rounded-lg transition-all duration-200 ${validationErrors.description
          ? "border-red-500 bg-red-50/50"
          : "border-gray-200 hover:border-gray-300 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20"
        }`}>
          <div className="px-4 py-3 bg-white/80 backdrop-blur-sm min-h-[120px] rounded-t-lg">
            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none focus:outline-none focus:ring-0"
            />
          </div>
          <div className="flex gap-2 p-2 bg-gray-50 rounded-b-lg border-t border-gray-200">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('bold') ? 'bg-gray-200 text-teal-600' : ''}`}
              type="button"
            >
              <FiBold size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('italic') ? 'bg-gray-200 text-teal-600' : ''}`}
              type="button"
            >
              <FiItalic size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('underline') ? 'bg-gray-200 text-teal-600' : ''}`}
              type="button"
            >
              <FiUnderline size={16} />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-teal-600' : ''}`}
              type="button"
            >
              <FiAlignLeft size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-teal-600' : ''}`}
              type="button"
            >
              <FiAlignCenter size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-teal-600' : ''}`}
              type="button"
            >
              <FiAlignRight size={16} />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('bulletList') ? 'bg-gray-200 text-teal-600' : ''}`}
              type="button"
            >
              <BsListUl size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('orderedList') ? 'bg-gray-200 text-teal-600' : ''}`}
              type="button"
            >
              <BsListOl size={16} />
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 text-right mt-1">
          {editor?.getText().length || 0}/1000
        </div>
      </div>
      {/* Home Details Section Title */}
      <h2 className="text-xl font-semibold text-teal-500 mb-2 mt-8 flex items-center gap-2">
        <FiHome className="w-5 h-5" />
        {t("Home Details")}
      </h2>
      {/* Home Details Section (match HomeDetails) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 border-b border-gray-200">
        {/* Floor */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="floor" className="flex items-center text-sm font-medium text-gray-700">
            <FiLayers className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
            {t("floor", "Floor")}
            <div className="ml-2 group relative inline-block flex-shrink-0">
              <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
              <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                {t("tooltips.floor") || "Enter the floor number of your apartment or house."}
              </div>
            </div>
          </Label>
          <div className="relative">
            <Input
              id="floor"
              type="text"
              value={formData.address[0].floor ?? ""}
              onChange={handleAddressInputChange}
              className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors["address.floor"] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
              placeholder={t("Enter floor number", "Enter floor number")}
            />
            {validationErrors["address.floor"] && (
              <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                {validationErrors["address.floor"]}
              </p>
            )}
          </div>
        </div>
        {/* Door Code */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="doorCode" className="flex items-center text-sm font-medium text-gray-700">
            <FiKey className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
            {t("doorCode", "Door Code")}
            <div className="ml-2 group relative inline-block flex-shrink-0">
              <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
              <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                {t("tooltips.doorCode") || "Enter the code for your building's main entrance."}
              </div>
            </div>
          </Label>
          <div className="relative">
            <Input
              id="doorCode"
              value={formData.address[0].doorCode ?? ""}
              onChange={handleAddressInputChange}
              className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors["address.doorCode"] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
              placeholder={t("Enter door code", "Enter door code")}
            />
            {validationErrors["address.doorCode"] && (
              <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                {validationErrors["address.doorCode"]}
              </p>
            )}
          </div>
        </div>
        {/* Door Phone */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="doorPhone" className="flex items-center text-sm font-medium text-gray-700">
            <FiPhone className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
            {t("doorPhone", "Door Phone")}
            <div className="ml-2 group relative inline-block flex-shrink-0">
              <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
              <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                {t("tooltips.doorPhone") || "Enter your door phone number if available."}
              </div>
            </div>
          </Label>
          <div className="relative">
            <Input
              id="doorPhone"
              type="text"
              value={formData.address[0].doorPhone ?? ""}
              onChange={handleAddressInputChange}
              className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors["address.doorPhone"] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
              placeholder={t("Enter door phone", "Enter door phone")}
            />
            {validationErrors["address.doorPhone"] && (
              <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                {validationErrors["address.doorPhone"]}
              </p>
            )}
          </div>
        </div>
        {/* Size */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="size" className="flex items-center text-sm font-medium text-gray-700">
            <FiMaximize className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
            {t("size", "Size")}
            <div className="ml-2 group relative inline-block flex-shrink-0">
              <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
              <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                {t("tooltips.size") || "Enter the size of your home in square meters."}
              </div>
            </div>
          </Label>
          <div className="relative">
            <Input
              id="size"
              type="text"
              value={formData.address[0].size ?? ""}
              onChange={handleAddressInputChange}
              className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors["address.size"] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
              placeholder={t("Enter size in sqm", "Enter size in sqm")}
            />
            {validationErrors["address.size"] && (
              <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                {validationErrors["address.size"]}
              </p>
            )}
          </div>
        </div>
        {/* Type of Living */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="typeOfLiving" className="flex items-center text-sm font-medium text-gray-700">
            <FiHome className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
            {t("typeOfLiving", "Type of Living")}
            <div className="ml-2 group relative inline-block flex-shrink-0">
              <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
              <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                {t("tooltips.typeOfLiving") || "Specify the type of your living space (e.g., apartment, house, villa)."}
              </div>
            </div>
          </Label>
          <Input
            id="typeOfLiving"
            value={formData.address[0].typeOfLiving ?? ""}
            onChange={handleAddressInputChange}
            placeholder={t("Enter type of living", "Enter type of living")}
          />
        </div>
        {/* Number of Rooms */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="numberOfRooms" className="flex items-center text-sm font-medium text-gray-700">
            <FiGrid className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
            {t("numberOfRooms", "Number of Rooms")}
            <div className="ml-2 group relative inline-block flex-shrink-0">
              <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
              <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                {t("tooltips.numberOfRooms") || "Enter the total number of rooms in your home."}
              </div>
            </div>
          </Label>
          <div className="relative">
            <Input
              id="numberOfRooms"
              type="text"
              value={formData.address[0].numberOfRooms ?? ""}
              onChange={handleAddressInputChange}
              className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${validationErrors["address.numberOfRooms"] ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
              placeholder={t("Enter number of rooms", "Enter number of rooms")}
            />
            {validationErrors["address.numberOfRooms"] && (
              <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                {validationErrors["address.numberOfRooms"]}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSafeDraft}
            className="group relative flex-1 bg-gradient-to-r from-gray-100 to-gray-200
              text-gray-700 py-3 px-6 rounded-xl transition-all duration-300 
              transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 text-base font-semibold
              shadow-[0_0_15px_rgba(0,0,0,0.05)] hover:shadow-[0_0_20px_rgba(0,0,0,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">{t("saveDraft")}</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="group relative flex-1 bg-gradient-to-r from-teal-500 to-teal-600
              text-white py-3 px-6 rounded-xl transition-all duration-300 
              transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 text-base font-semibold
              shadow-[0_0_15px_rgba(20,184,166,0.15)] hover:shadow-[0_0_20px_rgba(20,184,166,0.25)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <FiCheck className="w-4 h-4 relative z-10" />
            <span className="relative z-10">
              {editMode ? t("update") : t("submit")}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          className="group relative w-full bg-white border-2 border-red-200 hover:border-red-300
            text-red-600 py-3 px-6 rounded-xl transition-all duration-300 
            transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base font-medium"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-red-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <FiTrash2 className="w-4 h-4 relative z-10" />
          <span className="relative z-10">{t("deleteAccount")}</span>
        </button>
      </div>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteData({ username: "", reason: "" });
        }}
        onDelete={handleDeleteAccount}
        deleteData={deleteData}
        setDeleteData={setDeleteData}
        isDeleting={isDeleting}
        username={formData.username}
      />
    </div>
  );
};

export default Step2; 