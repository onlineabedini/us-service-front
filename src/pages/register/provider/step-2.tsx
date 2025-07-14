import React, { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/global/combobox";
import ProfileImage from "@/components/global/profileImage";
import { servicesList } from "@/lists/services";
import { serviceEnablersList } from "@/lists/serviceEnablers";
import { StockholmAreas } from "@/lists/stockholmAreas";
import { providerService } from '@/services/provider.service';
import { API_BASE_URL } from "@/config/api";
import { countryFlags, getFlagIconClass } from "@/lists/countryFlags";
import { useEditor, EditorContent } from '@tiptap/react';
import ConsentContent from '@/components/global/ConsentContent';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  FiInfo,
  FiList,
  FiMapPin,
  FiFileText,
  FiCreditCard,
  FiUser,
  FiGlobe,
  FiPhone,
  FiHash,
  FiLogOut,
  FiMail,
  FiShield,
  FiCalendar,
  FiCheck,
  FiTrash2,
  FiBold,
  FiItalic,
  FiUnderline,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { BsListUl, BsListOl } from "react-icons/bs";
import { phonePreFixes } from "@/lists/phonePreFixes";
import { getBankName, validateBankAccount, validateClearingNumber } from "@/lists/bankClearingNumbers";
import AvailabilityCalendar from "@/components/global/availabilityCalendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton";
import { getCookie, removeCookie } from '@/utils/authCookieService';
import { handleApiError } from '@/utils/handleErrors';
import CompletedDialog from "./completedDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Import PDF files for both languages
import enPdf from '@/assets/terms-conditions/En.pdf';
import svPdf from '@/assets/terms-conditions/Sv.pdf';

// ---------- Types ----------
export interface AddressData {
  businessType: string;
  businessName: string;
  registrationNumber: string;
  country: string;
  city: string;
  streetAddress: string;
  postalCode: string;
  isMainOffice: boolean;
  VAT: string;
}

export interface BankDetails {
  name: string;
  clearingNumber: string;
  bankNumber: string;
}

export interface Consents {
  generalConsent: boolean;
}

// --- UPDATED: Include firstName, lastName, email, and serviceEnablers ---
export interface CompleteProfileData {
  id: string;
  // read-only fields
  firstName: string;
  lastName: string;
  email: string;
  // existing fields
  username: string;
  socialSecurityNumber: string;
  phoneNumber: string;
  profileImage?: string;
  profileImageFile?: File | null;
  description: string;
  hourlyRate?: number;
  currency: string;
  languages: string[];
  offeredServices: string[];
  serviceArea: string[];
  serviceEnablers: string[];
  citizenship: string;
  car: boolean;
  carLicense: boolean;
  smoke: boolean;
  partOfPilot: boolean;
  address: AddressData[];
  bankDetails: BankDetails;
  consents: Consents;
  availability: any; // typed as needed
}

interface Step2Props {
  onSubmit: (data: CompleteProfileData) => void;
}

// Default address object
const defaultAddress: AddressData = {
  businessType: "Individual",
  businessName: "",
  registrationNumber: "",
  country: "",
  city: "",
  streetAddress: "",
  postalCode: "",
  isMainOffice: true,
  VAT: "",
};

// Add these types after the existing types
interface DeleteAccountData {
  username: string;
  reason: string;
}

// Add this constant before the Step2 component
const deleteReasons = [
  "No longer need the service",
  "Found a better alternative",
  "Privacy concerns",
  "Technical issues",
  "Not satisfied with service",
  "Other"
];

// --- Stockholm subareas for municipality expansion ---
const STOCKHOLM_MUNICIPALITY = "Stockholm";
const STOCKHOLM_SUBAREAS = [
  "Bromma",
  "Enskede-Årsta-Vantör",
  "Farsta",
  "Hägersten-Älvsjö",
  "Hässelby-Vällingby",
  "Kungsholmen",
  "Norrmalm",
  "Rinkeby-Kista",
  "Skarpnäck",
  "Skärholmen",
  "Södermalm",
  "Spånga-Tensta",
  "Östermalm"
];


const Step2: React.FC<Step2Props> = ({ onSubmit }) => {
  const { t, i18n } = useTranslation();
  // const { user, clearUser } = useUser();
  const [userData, setUserData] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("+46"); // Default to Sweden
  const [localPhoneNumber, setLocalPhoneNumber] = useState<string>("");

  // --- UPDATED: add firstName, lastName, email to local state ---
  const [formData, setFormData] = useState<any>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",

    username: "",
    socialSecurityNumber: "",
    phoneNumber: "",
    profileImageFile: null,
    description: "",
    hourlyRate: 350,
    currency: "SEK",
    // default values
    languages: [],
    offeredServices: [...servicesList], // All services selected by default
    serviceArea: !userData ? ["Stockholm"] : [],
    serviceEnablers: [],
    citizenship: "",
    car: false,
    carLicense: false,
    smoke: false,
    partOfPilot: false,
    address: [defaultAddress],
    bankDetails: {
      name: "",
      bankNumber: "",
      clearingNumber: "",
    },
    consents: {
      generalConsent: false,
    },
    availability: {
      Morning: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false },
      Noon: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false },
      Afternoon: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false },
      Night: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false },
    },
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [consentLanguage] = useState<'sv' | 'en'>('sv');
  const [imagePreview, setImagePreview] = useState<string>("/assets/img/provider.jpg");
  const navigate = useNavigate();

  // Inside the Step2 component, add this state
  const [deleteData, setDeleteData] = useState<DeleteAccountData>({
    username: "",
    reason: ""
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState<string>("");

  // Update the error state to handle multiple error types
  const [deleteErrors, setDeleteErrors] = useState<{
    username?: string;
    reason?: string;
  }>({});

  // --- State for Stockholm municipality expansion ---
  // State for Stockholm municipality expansion (default: closed)
  const [isStockholmExpanded, setIsStockholmExpanded] = useState(false); // closed by default

  // --- UI state for showing default values info message ---
  const [showDefaultInfo, setShowDefaultInfo] = useState(false);
  // --- UI state for showing update button after draft save ---
  const [draftSaved, setDraftSaved] = useState(false);

  // Add state to control completed dialog visibility
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);

  // Allowed image MIME types for upload
  const allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/heic',
    'image/heif',
    'image/hevc',
    'image/heif-sequence',
    'image/avif',
    'image/avif-sequence',
    'image/bmp',
    'image/tiff',
    'image/x-icon',
    'image/vnd.microsoft.icon',
  ];

  // --- Fix: useEffect for userId should not cause infinite loop ---
  useEffect(() => {
    if (!userId) {
      const id = getCookie('providerId') || "";
      if (id) setUserId(id);
      return;
    }
    // Only fetch if userData is not already loaded for this userId
    if (!userData || userData.id !== userId) {
      initUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // --- Loading and error state for profile fetch ---
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // --- Loading and error state for profile image upload ---
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // --- Update: init from api with loading/error state ---
  const initUserData = async () => {
    setIsProfileLoading(true);
    setProfileError(null);
    try {
      const user = await providerService.getProfile(userId || "");
      setUserData(user);
    } catch (err: any) {
      setProfileError(err?.message || "Failed to load profile data.");
      toast.error(err?.message || "Failed to load profile data.");
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,    // Disable default to use our custom config
        orderedList: false,   // Disable default to use our custom config
        listItem: false,      // Disable default listItem to avoid duplication
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
      ListItem,  // Use default configuration
    ],
    content: formData.description || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText().trim();

      // Update formData
      setFormData((prev: any) => ({ ...prev, description: html }));

      // Update validation errors
      setValidationErrors((prev: any) => ({
        ...prev,
        description: !text ? t("requiredField") : undefined
      }));

      // Force a re-render to update the Complete Profile button state
      setFormData((prev: CompleteProfileData) => ({ ...prev }));
    },
  });

  // Prepopulate the form data from userData (if available)
  useEffect(() => {
    if (editor && userData?.description) {
      editor.commands.setContent(userData.description);
    }
  }, [editor, userData?.description]);

  useEffect(() => {
    if (userData) {
      let localNumber = "";
      let countryCode = "+46";
      // phone logic
      if (userData.phoneNumber) {
        const matchingPrefix = Object.values(phonePreFixes).find((prefix) =>
          userData.phoneNumber.startsWith(prefix)
        );
        if (matchingPrefix) {
          countryCode = matchingPrefix;
          localNumber = userData.phoneNumber.substring(matchingPrefix.length);
        }
      }
      setSelectedCountryCode(countryCode);
      setLocalPhoneNumber(localNumber);

      // --- Set default combo box values if only basic fields are present (ignore hourlyRate and availability) ---
      const onlyBasicFields =
        !!userData.email &&
        !!userData.firstName &&
        !!userData.lastName &&
        !!userData.username &&
        (!userData.socialSecurityNumber &&
          !userData.phoneNumber &&
          (!userData.languages || userData.languages.length === 0) &&
          (!userData.offeredServices || userData.offeredServices.length === 0) &&
          (!userData.serviceArea || userData.serviceArea.length === 0) &&
          (!userData.serviceEnablers || userData.serviceEnablers.length === 0) &&
          !userData.citizenship &&
          !userData.car &&
          !userData.carLicense &&
          !userData.smoke &&
          !userData.partOfPilot &&
          (!userData.address || userData.address.length === 0) &&
          (!userData.bankDetails || (!userData.bankDetails.name && !userData.bankDetails.bankNumber && !userData.bankDetails.clearingNumber)) &&
          (!userData.consents || !userData.consents.generalConsent)
        );

      setFormData((prev: any) => ({
        ...prev,
        id: userData.id || "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        username: userData.username || "",
        socialSecurityNumber: userData.socialSecurityNumber || "",
        phoneNumber: userData.phoneNumber || "",
        description: userData.description || "",
        hourlyRate: userData.hourlyRate || 350,
        currency: userData.currency || "SEK",
        languages: userData.languages || [],
        offeredServices: onlyBasicFields ? [...servicesList] : (userData.offeredServices || []),
        serviceArea: onlyBasicFields ? ["Stockholm"] : (userData.serviceArea || []),
        serviceEnablers: onlyBasicFields ? [] : (userData.serviceEnablers || []),
        citizenship: userData.citizenship || "",
        car: userData.car || false,
        carLicense: userData.carLicense || false,
        smoke: userData.smoke || false,
        partOfPilot: userData.partOfPilot || false,
        address:
          userData.address && userData.address.length > 0
            ? userData.address
            : [defaultAddress],
        bankDetails: {
          name: userData.bankDetails?.name || "",
          bankNumber: userData.bankDetails?.bankNumber || "",
          clearingNumber: userData.bankDetails?.clearingNumber || "",
        },
        consents: {
          generalConsent: userData.consents?.generalConsent || false,
        },
        availability: userData.availability || {
          Morning: {
            Mon: false,
            Tue: false,
            Wed: false,
            Thu: false,
            Fri: false,
            Sat: false,
            Sun: false,
          },
          Noon: {
            Mon: false,
            Tue: false,
            Wed: false,
            Thu: false,
            Fri: false,
            Sat: false,
            Sun: false,
          },
          Afternoon: {
            Mon: false,
            Tue: false,
            Wed: false,
            Thu: false,
            Fri: false,
            Sat: false,
            Sun: false,
          },
          Night: {
            Mon: false,
            Tue: false,
            Wed: false,
            Thu: false,
            Fri: false,
            Sat: false,
            Sun: false,
          },
        },
      }));

      // set preview image if user has an existing profile image
      if (userData.profileImage) {
        setImagePreview(`${API_BASE_URL}/${userData.profileImage}`);
      }
    }
  }, [userData]);

  // --- Fix: useEffect for setting default combo box values should not cause infinite loop ---
  const hasSetDefaults = useRef(false);
  useEffect(() => {
    if (!formData) return;
    // Only basic fields: ignore hourlyRate and availability for this logic
    const onlyBasicFields =
      !!formData.email &&
      !!formData.firstName &&
      !!formData.lastName &&
      !!formData.username &&
      (!formData.socialSecurityNumber &&
        !formData.phoneNumber &&
        (!formData.languages || formData.languages.length === 0) &&
        (!formData.offeredServices || formData.offeredServices.length === 0) &&
        (!formData.serviceArea || formData.serviceArea.length === 0) &&
        (!formData.serviceEnablers || formData.serviceEnablers.length === 0) &&
        !formData.citizenship &&
        !formData.car &&
        !formData.carLicense &&
        !formData.smoke &&
        !formData.partOfPilot &&
        (!formData.address || formData.address.length === 0) &&
        (!formData.bankDetails || (!formData.bankDetails.name && !formData.bankDetails.bankNumber && !formData.bankDetails.clearingNumber)) &&
        (!formData.consents || !formData.consents.generalConsent)
      );
    if (onlyBasicFields && !hasSetDefaults.current) {
      setFormData((prev: any) => ({
        ...prev,
        languages: ["Swedish"],
        offeredServices: [...servicesList],
        serviceArea: ["Stockholm"],
        serviceEnablers: [],
      }));
      hasSetDefaults.current = true;
    }
    // Only run once per session/init
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.email, formData.firstName, formData.lastName, formData.username]);

  // --- Fix: phone number input and validation logic ---
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

  // --- Fix: country code change logic for phone number ---
  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    setSelectedCountryCode(newCountryCode);
    const fullNumber = newCountryCode + localPhoneNumber;
    const error = validatePhoneNumber(fullNumber, newCountryCode);
    setValidationErrors((prev: any) => ({ ...prev, phoneNumber: error }));
    setFormData((prev: any) => ({ ...prev, phoneNumber: fullNumber }));
  };

  // --- Fix: profile image upload and preview logic with loading/error state ---
  const handleProfileImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImageUploading(true);
    setImageUploadError(null);
    if (!allowedImageTypes.includes(file.type)) {
      const errorMsg = t("profileImageInvalidType") || "Invalid image type. Please upload a valid image file.";
      setValidationErrors((prev: any) => ({ ...prev, profileImage: errorMsg }));
      setImageUploadError(errorMsg);
      toast.error(errorMsg);
      setIsImageUploading(false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = t("profileImageTooLarge") || "Profile image must be less than 5MB.";
      setValidationErrors((prev: any) => ({ ...prev, profileImage: errorMsg }));
      setImageUploadError(errorMsg);
      toast.error(errorMsg);
      setIsImageUploading(false);
      return;
    }
    setValidationErrors((prev: any) => {
      const newErrors = { ...prev };
      delete newErrors.profileImage;
      return newErrors;
    });
    setFormData((prev: any) => ({ ...prev, profileImageFile: file }));
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
      setIsImageUploading(false);
    };
    reader.onerror = () => {
      setImageUploadError("Failed to preview image.");
      setIsImageUploading(false);
    };
    reader.readAsDataURL(file);
  }, [t]);

  // Validate phone number
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

  //  validate personal security number
  const testSSNBlacklist = ["121212-1212", "1212121212", "19900101-1234", "900101-1234"];

  // const isValidDate = (yyyymmdd: string): boolean => {
  //   const year = parseInt(yyyymmdd.slice(0, 4), 10);
  //   const month = parseInt(yyyymmdd.slice(4, 6), 10) - 1;
  //   const day = parseInt(yyyymmdd.slice(6, 8), 10);

  //   const date = new Date(year, month, day);
  //   return (
  //     date.getFullYear() === year &&
  //     date.getMonth() === month &&
  //     date.getDate() === day
  //   );
  // };

  const passesLuhnCheck = (input: string): boolean => {
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      let digit = parseInt(input[input.length - 1 - i], 10);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  };

  // Helper function for determining the century based on the two-digit year and separator
  function determineCentury(twoDigitYear: string, hasPlus: boolean): string {
    const yearNumber = parseInt(twoDigitYear, 10);
    // If the input includes a plus sign, assume the person is over 100 years old (using 19xx).
    // Otherwise, if the two-digit year is greater than 20, assume it's 1900; otherwise, assume 2000.
    return hasPlus ? "19" : (yearNumber > 20 ? "19" : "20");
  }

  const validateSocialSecurityNumber = (ssn: string): string => {
    if (!ssn)
      return "Invalid social security number";

    // Remove whitespaces and keep track of whether there's a plus sign indicating 100+ years of age.
    const cleaned = ssn.replace(/\s/g, '');
    const hasPlus = cleaned.includes("+");

    // Remove any non-digit characters for validation (ignoring '-' or '+').
    const digitsOnly = cleaned.replace(/[^0-9]/g, '');

    // Check for test/demo numbers from the blacklist.
    if (testSSNBlacklist.includes(ssn) || testSSNBlacklist.includes(digitsOnly)) {
      return "Invalid social security number";
    }

    let year: number, month: number, day: number, luhnInput: string;

    if (digitsOnly.length === 10) {
      // Expected format: YYMMDDXXXX
      const shortPattern = /^(\d{2})(\d{2})(\d{2})(\d{4})$/;
      const match = digitsOnly.match(shortPattern);
      if (!match)
        return "Invalid social security number";

      // Destructure the matched groups.
      const [, yy, mm, dd] = match;
      const century = determineCentury(yy, hasPlus);
      year = parseInt(century + yy, 10);
      month = parseInt(mm, 10);
      day = parseInt(dd, 10);
      luhnInput = digitsOnly;
    } else if (digitsOnly.length === 12) {
      // Expected format: YYYYMMDDXXXX
      const longPattern = /^(\d{4})(\d{2})(\d{2})(\d{4})$/;
      const match = digitsOnly.match(longPattern);
      if (!match)
        return "Invalid social security number";

      const [, yyyy, mm, dd] = match;
      year = parseInt(yyyy, 10);
      month = parseInt(mm, 10);
      day = parseInt(dd, 10);
      // For the long format, drop the first two digits for Luhn check.
      luhnInput = digitsOnly.slice(2);
    } else {
      return "Invalid social security number";
    }

    // Validate the date portion.
    const date = new Date(year, month - 1, day);
    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return "Invalid social security number";
    }

    // Validate the control digit using the Luhn algorithm.
    if (!passesLuhnCheck(luhnInput)) {
      return "Invalid social security number";
    }

    return "";
  };

  // --- Utility: Safe string trim ---
  const safeTrim = (value: any) => (typeof value === 'string' ? value.trim() : String(value ?? '').trim());

  // --- Handle input changes for all fields, always treat as string where needed ---
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      if (id === "phoneNumber") {
        handlePhoneNumberChange(e as React.ChangeEvent<HTMLInputElement>);
      } else if (id === "bankDetails.clearingNumber") {
        let sanitizedValue = value.replace(/[^0-9]/g, "");
        sanitizedValue = sanitizedValue.slice(0, 5);
        const validation = validateClearingNumber(sanitizedValue);
        let error = "";
        if (sanitizedValue && !validation.isValid) {
          error = "Invalid clearing number";
        }
        setValidationErrors((prev: any) => ({ ...prev, clearingNumber: error }));
        setFormData((prev: any) => ({
          ...prev,
          bankDetails: {
            ...prev.bankDetails,
            clearingNumber: sanitizedValue,
            name: validation.bank?.name || ""
          }
        }));
      } else if (id === "bankDetails.bankNumber") {
        let sanitizedValue = value.replace(/[^0-9]/g, "");
        const clearingNumber = formData.bankDetails.clearingNumber;
        const validation = validateBankAccount(clearingNumber, sanitizedValue);
        let error = "";
        if (validation.error) {
          error = "Invalid bank number";
        }
        setValidationErrors((prev: any) => ({ ...prev, bankNumber: error }));
        setFormData((prev: any) => ({
          ...prev,
          bankDetails: {
            ...prev.bankDetails,
            bankNumber: sanitizedValue
          }
        }));
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
    [selectedCountryCode, t, formData.bankDetails.clearingNumber]
  );

  // Update editor onChange to clear validation error
  useEffect(() => {
    if (editor) {
      editor.on('update', ({ editor }) => {
        const text = editor.getText().trim();
        if (text) {
          setValidationErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.description;
            return newErrors;
          });
        }
      });
    }

    // Cleanup function
    return () => {
      editor?.off('update');
    };
  }, [editor]);

  // Add reactive error clearing for arrays (languages, services, areas, enablers)
  useEffect(() => {
    if (formData.languages?.length > 0) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.languages;
        return newErrors;
      });
    }
  }, [formData.languages]);

  useEffect(() => {
    if (formData.offeredServices?.length > 0) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.offeredServices;
        return newErrors;
      });
    }
  }, [formData.offeredServices]);

  useEffect(() => {
    if (formData.serviceArea?.length > 0) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.serviceArea;
        return newErrors;
      });
    }
  }, [formData.serviceArea]);

  useEffect(() => {
    if (formData.serviceEnablers?.length > 0) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.serviceEnablers;
        return newErrors;
      });
    }
  }, [formData.serviceEnablers]);

  // Add reactive error clearing for consent
  useEffect(() => {
    if (formData.consents?.generalConsent) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.consent;
        return newErrors;
      });
    }
  }, [formData.consents?.generalConsent]);

  // Handle the specialized checkboxes (car, carLicense, smoke)
  // const handleCheckboxChange = useCallback((key: keyof CompleteProfileData, checked: boolean) => {
  //   setFormData((prev: any) => ({ ...prev, [key]: checked }));
  // }, []);

  // Handle changes from the AvailabilityCalendar
  const handleAvailabilityChange = useCallback((updatedAvailability: any) => {
    setFormData((prev: any) => ({
      ...prev,
      availability: updatedAvailability,
    }));
  }, []);

  // Function to generate and download consent PDF
  const generateConsentPDF = useCallback(() => {
    const fileUrl = i18n.language === 'sv' ? svPdf : enPdf;
    const fileName = i18n.language === 'sv' ? 'Sv.pdf' : 'En.pdf';
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(t('errorGeneratingPDF') || 'Error downloading PDF. Please try again.');
    }
  }, [t, i18n.language]);

  // Update the validateForm function to use getText() for description validation
  const validateForm = () => {
    const validationErrors: any = {};

    // Required fields validation
    if (!safeTrim(formData.username)) {
      validationErrors.username = t("requiredField");
    }

    if (!safeTrim(formData.socialSecurityNumber)) {
      validationErrors.socialSecurityNumber = t("requiredField");
    }

    if (!safeTrim(formData.phoneNumber)) {
      validationErrors.phoneNumber = t("requiredField");
    }

    // Check editor content for description
    if (!editor?.getText().trim()) {
      validationErrors.description = t("requiredField");
    }

    if (!formData.hourlyRate || formData.hourlyRate < 200) {
      validationErrors.hourlyRate = t("requiredField");
    }

    if (!formData.languages?.length) {
      validationErrors.languages = t("requiredField");
    }

    if (!formData.offeredServices?.length) {
      validationErrors.offeredServices = t("requiredField");
    }

    if (!formData.serviceArea?.length) {
      validationErrors.serviceArea = t("requiredField");
    }

    // Bank details validation
    if (!safeTrim(formData.bankDetails.clearingNumber)) {
      validationErrors.clearingNumber = t("requiredField");
    }

    if (!safeTrim(formData.bankDetails.bankNumber)) {
      validationErrors.bankNumber = t("requiredField");
    }

    // Consent validation
    if (!formData.consents?.generalConsent) {
      validationErrors.consent = t("requiredField");
    }

    return validationErrors;
  }

  // --- Update: handleSubmit with loading/error state for profile update ---
  const [profileUpdateError, setProfileUpdateError] = useState<string | null>(null);

  const handleSubmit = async (isDraft: boolean = false) => {
    const token = getCookie('token');
    const providerId = getCookie('providerId');
    setProfileUpdateError(null);
    // Check if both token and providerId exist
    if (!token || !providerId) {
      toast.error(t("sessionExpired") || "Session expired. Please log in again.");
      removeCookie('token');
      removeCookie('providerId');
      navigate('/landing/provider');
      return;
    }
    // check if already submitting
    if (isSubmitting) return;
    // Get the latest description from editor
    const currentDescription = editor?.getHTML() || "";
    // Update formData with the latest description
    const updatedFormData = {
      ...formData,
      description: currentDescription
    };
    // Always validate all required fields for update
    const errors: any = validateForm();
    if (!isDraft && Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error(t("pleaseFixErrors") || "Please fix all required fields.");
      // Scroll to the first error field
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setIsSubmitting(true);
    try {
      await providerService.updateCompleteProfile(formData.id, updatedFormData);
      if (isDraft) {
        setDraftSaved(true); // Show update button after draft save
        toast.success(t("draftSaved") || "Draft saved successfully!");
        navigate("/landing/provider");
      } else {
        // Show completed dialog instead of navigating immediately
        setShowCompletedDialog(true);
        // toast.success((t("profileUpdated") || "Profile updated successfully!"));
        // navigate("/");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || t("failedToUpdateProfile") || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to translate service names
  const getServiceLabel = (service: string, t: any) => t(`comboBox.services.${service}`);
  // Helper to translate service enabler names
  const getServiceEnablerLabel = (enabler: string, t: any) => t(`comboBox.serviceEnablers.${enabler}`);
  // Helper to translate Stockholm area names
  const getStockholmAreaLabel = (area: string, t: any) => t(`comboBox.stockholmAreas.${area}`);
  // Helper to translate language names
  const getLanguageLabel = (lang: string, t: any) => t(`comboBox.languages.${lang}`);

  // --- UI: Show loading and error states in the UI ---
  if (isProfileLoading) {
    // Show a simple loading spinner or skeleton for the whole form
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4" />
        <span className="text-teal-700 font-semibold text-lg">Loading profile...</span>
      </div>
    );
  }
  if (profileError) {
    // Show error message if profile fetch failed
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-red-600 text-2xl mb-2">⚠️</div>
        <div className="text-red-600 font-semibold text-lg mb-2">{profileError}</div>
        <button
          className="mt-2 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          onClick={() => initUserData()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    // Responsive container for the complete profile form
    <div className="w-full max-w-full overflow-x-hidden px-2 py-4 bg-white/95 rounded-2xl transition-all duration-300">
      {/* Show error message for profile update */}
      {profileUpdateError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">
          <span>⚠️</span> {profileUpdateError}
        </div>
      )}
      {/* Show error message for image upload */}
      {imageUploadError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">
          <span>⚠️</span> {imageUploadError}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="bg-gradient-to-r from-teal-500 to-teal-600 text-transparent bg-clip-text">
            {t("updateProfile") || "Update Your Profile"}
          </span>
          <div className="ml-2 w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
        </h2>
        <button
          type="button"
          onClick={() => {
            removeCookie('providerId');
            removeCookie('token');
            navigate('/landing/provider');
          }}
          className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <FiLogOut className="w-4 h-4" />
          <span>{t("logOut") || "Logout"}</span>
        </button>
      </div>

      {/* PROFILE IMAGE */}
      <div className="flex flex-col items-center mb-8 relative">
        {/* Show spinner overlay if uploading image */}
        {isImageUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500" />
          </div>
        )}
        <ProfileImage
          imageUrl={imagePreview}
          alt={t("profileImageAlt") || "Profile Image"}
          editable={true}
          size="md"
          onImageChange={handleProfileImageChange}
          label={t("Profile Image")}
        />
        {validationErrors.profileImage && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.profileImage}</p>
        )}
      </div>

      {/*
        NEW, READ-ONLY FIELDS:
        - Email
        - First Name
        - Last Name
      */}
      <div className="mb-6">
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"
        >
          <FiMail className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
          {t("email") || "Email"}
          <div className="ml-2 group relative inline-block flex-shrink-0">
            <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
            <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
              {t("tooltips.email") || "Your verified email address. This will be used for account-related communications."}
            </div>
          </div>
        </label>
        <Input
          type="text"
          id="email"
          value={formData.email}
          // do nothing on change
          onChange={() => { }}
          disabled
          className="w-full px-4 py-2 border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed focus:border-gray-300 focus:ring-0 rounded-md transition-all duration-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"
          >
            <FiUser className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
            {t("firstName") || "First Name"}
            <div className="ml-2 group relative inline-block flex-shrink-0">
              <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
              <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                {t("tooltips.firstName") || "Your first name as registered in the system."}
              </div>
            </div>
          </label>
          <Input
            type="text"
            id="firstName"
            value={formData.firstName}
            // do nothing on change
            onChange={() => { }}
            disabled
            className="w-full px-4 py-2 border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed focus:border-gray-300 focus:ring-0 rounded-md transition-all duration-200"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"
          >
            <FiUser className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
            {t("lastName") || "Last Name"}
            <div className="ml-2 group relative inline-block flex-shrink-0">
              <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
              <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
                {t("tooltips.lastName") || "Your last name as registered in the system."}
              </div>
            </div>
          </label>
          <Input
            type="text"
            id="lastName"
            value={formData.lastName}
            // do nothing on change
            onChange={() => { }}
            disabled
            className="w-full px-4 py-2 border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed focus:border-gray-300 focus:ring-0 rounded-md transition-all duration-200"
          />
        </div>
      </div>
      {/* END NEW READ-ONLY FIELDS */}

      {/* USERNAME */}
      <div className="mb-6">
        <label
          htmlFor="username"
          className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"
        >
          <FiUser className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
          {t("titleNickname") || "Title / Nickname"}
          <div className="ml-2 group relative inline-block flex-shrink-0">
            <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
            <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
              {t("tooltips.username") || "Your professional title or preferred nickname. This will be visible to clients."}
            </div>
          </div>
        </label>
        <Input
          type="text"
          id="username"
          value={formData.username}
          onChange={handleInputChange}
          placeholder={t("enterUsername") || "Enter your username"}
          className={`w-full px-4 py-2 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 rounded-md transition-all duration-200 ${validationErrors.username ? "border-red-500 bg-red-50" : ""
            }`}
          required
        />
        {validationErrors.username && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.username}</p>
        )}
      </div>



      {/* PHONE NUMBER */}
      <div className="mb-6">
        <label
          htmlFor="phoneNumber"
          className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"
        >
          <FiPhone className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
          {t("phoneNumber") || "Phone Number"}
          <div className="ml-2 group relative inline-block flex-shrink-0">
            <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
            <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
              {t("tooltips.phoneNumber") || "Enter your local mobile number. The country code is selected separately."}
            </div>
          </div>
        </label>
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
            className={`w-full px-4 py-2 h-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500/20 rounded-md transition-all duration-200 shadow-sm ${validationErrors.phoneNumber ? "border-red-500 bg-red-50" : ""
              }`}
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

      {/* DESCRIPTION */}
      <div className="mb-6">
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
              {t("tooltips.description") || "Provide a brief description about yourself or your services."}
            </div>
          </div>
        </label>
        <div className="relative">
          <div className={`w-full border-2 rounded-lg transition-all duration-200 ${validationErrors.description
            ? "border-red-500 bg-red-50/50"
            : "border-gray-200 hover:border-gray-300 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20"
            }`}>
            <div className="px-4 py-3 bg-white/80 backdrop-blur-sm min-h-[120px] rounded-lg">
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
          <div className="absolute bottom-16 right-3 text-sm text-gray-500 bg-white/90 px-2 py-1 rounded-md shadow-sm">
            {editor?.getText().length || 0}/1000
          </div>
        </div>
      </div>

      {/* HOURLY RATE */}
      <div className="mb-6">
        <label
          htmlFor="price"
          className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"
        >
          <FiCreditCard className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
          {t("hourlyRate") || "Hourly Rate (SEK)"}
          <div className="ml-2 group relative inline-block flex-shrink-0">
            <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
            <div className="pointer-events-none absolute z-10 w-48 sm:w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity right-0">
              {t("tooltips.hourlyRate") || "Your desired hourly rate. Set a competitive rate based on your experience and services offered."}
            </div>
          </div>
        </label>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <input
              type="range"
              id="price"
              value={formData.hourlyRate}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 200) {
                  setFormData((prev: any) => ({ ...prev, hourlyRate: value }));
                }
              }}
              min="200"
              step="10"
              max="1000"
              style={{
                background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((formData.hourlyRate || 350) - 200) * 100 / 800}%, #e5e7eb ${((formData.hourlyRate || 350) - 200) * 100 / 800}%, #e5e7eb 100%)`
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              required
            />
            <span className="text-gray-600 whitespace-nowrap">SEK/h</span>
          </div>
          <div className="text-sm text-gray-700">
            <span className="text-teal-700 font-medium">Current Rate: </span>
            <span className="text-lg font-bold text-gray-800">
              {formData.hourlyRate} SEK
            </span>
          </div>
        </div>
      </div>

      {/* LANGUAGES */}
      <div className={`mb-4 ${validationErrors.languages ? "border-red-500 bg-red-50 rounded-lg p-2" : ""}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <FiGlobe className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
          {t("I Speak")}
          {validationErrors.languages && (
            <span className="text-red-500 text-sm ml-2">({validationErrors.languages})</span>
          )}
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.languages?.map((lang: any) => (
            <div
              key={lang}
              className="flex items-center gap-1 bg-teal-100 border border-teal-300 rounded-full px-3 py-1 shadow-sm"
            >
              <span className={getFlagIconClass(lang)} />
              <span className="text-sm font-medium">{getLanguageLabel(lang, t)}</span>
              <button
                type="button"
                onClick={() => {
                  const newLanguages = formData.languages.filter((l: any) => l !== lang);
                  setFormData((prev: any) => ({ ...prev, languages: newLanguages }));
                }}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <Combobox>
          {countryFlags.map((lang: any) => {
            const isSelected = formData.languages?.includes(lang.language);
            return (
              <div
                key={lang.language}
                className={`flex items-center gap-2 p-2 cursor-pointer border rounded-md hover:bg-gray-100 transition-colors ${isSelected ? "bg-teal-50 border-teal-300" : "border-gray-300"
                  }`}
                onClick={() => {
                  let newLanguages: string[];
                  if (isSelected) {
                    newLanguages = formData.languages.filter((l: any) => l !== lang.language);
                  } else {
                    newLanguages = [...(formData.languages || []), lang.language];
                  }
                  setFormData((prev: any) => ({ ...prev, languages: newLanguages }));
                }}
              >
                {lang.code && <span className={`fi fi-${lang.code.toLowerCase()}`} />}
                <span>{getLanguageLabel(lang.language, t)}</span>
              </div>
            );
          })}
        </Combobox>
      </div>

      {/* OFFERED SERVICES */}
      <div className={`mb-4 ${validationErrors.offeredServices ? "border-red-500 bg-red-50 rounded-lg p-2" : ""}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <FiList className="w-5 h-5 mr-2 text-teal-500 flex-shrink-0" />
          {t("I Offer")}
          {validationErrors.offeredServices && (
            <span className="text-red-500 text-sm ml-2">({validationErrors.offeredServices})</span>
          )}
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.offeredServices?.map((service: any) => (
            <div
              key={service}
              className="flex items-center gap-1 bg-teal-100 border border-teal-300 rounded-full px-3 py-1 shadow-sm"
            >
              <span className="text-sm font-medium">{getServiceLabel(service, t)}</span>
              <button
                type="button"
                onClick={() => {
                  const newServices = formData.offeredServices.filter((s: any) => s !== service);
                  setFormData((prev: any) => ({ ...prev, offeredServices: newServices }));
                }}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <Combobox>
          {servicesList?.map((service: any) => {
            const isSelected = formData.offeredServices?.includes(service);
            return (
              <div
                key={service}
                className={`flex items-center gap-2 p-2 cursor-pointer border rounded-md hover:bg-gray-100 transition-colors ${isSelected ? "bg-teal-50 border-teal-300" : "border-gray-300"
                  }`}
                onClick={() => {
                  let newServices: string[];
                  if (isSelected) {
                    newServices = formData.offeredServices.filter((s: any) => s !== service);
                  } else {
                    newServices = [...(formData.offeredServices || []), service];
                  }
                  setFormData((prev: any) => ({ ...prev, offeredServices: newServices }));
                }}
              >
                <span>{getServiceLabel(service, t)}</span>
              </div>
            );
          })}
        </Combobox>
      </div>

      {/* SERVICE AREA */}
      <div className={`mb-4 ${validationErrors.serviceArea ? "border-red-500 bg-red-50 rounded-lg p-2" : ""}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <FiMapPin className="w-5 h-5 mr-2 text-teal-500 flex-shrink-0" />
          {t("I Offer in")}
          {validationErrors.serviceArea && (
            <span className="text-red-500 text-sm ml-2">({validationErrors.serviceArea})</span>
          )}
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {/* Only show selected areas as tags, no 'Nothing' */}
          {formData.serviceArea?.map((area: any) => (
            <div
              key={area}
              className="flex items-center gap-1 bg-teal-100 border border-teal-300 rounded-full px-3 py-1 shadow-sm"
            >
              <span className="text-sm font-medium">{getStockholmAreaLabel(area, t)}</span>
              <button
                type="button"
                onClick={() => {
                  const newAreas = formData.serviceArea.filter((a: any) => a !== area);
                  setFormData((prev: any) => ({ ...prev, serviceArea: newAreas }));
                }}
                className="text-black hover:text-gray-700 focus:outline-none"
                style={{ fontSize: '1rem', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {/* Combobox for service areas with Stockholm municipality expansion */}
        <Combobox>
          {/* Fix: IIFE must return an array of ReactNode, not void */}
          {(() => {
            // --- Helper: Render a normal area item ---
            const renderAreaItem = (area: string) => {
              const isSelected = formData.serviceArea?.includes(area);
              return (
                <div
                  key={area}
                  className={`flex items-center gap-2 p-2 cursor-pointer border rounded-md hover:bg-gray-100 transition-colors ${isSelected ? "bg-teal-50 border-teal-300" : "border-gray-300"}`}
                  onClick={() => {
                    let newAreas: string[];
                    if (isSelected) {
                      newAreas = formData.serviceArea.filter((a: any) => a !== area);
                    } else {
                      newAreas = [...(formData.serviceArea || []), area];
                    }
                    setFormData((prev: any) => ({ ...prev, serviceArea: newAreas }));
                  }}
                >
                  <span>{getStockholmAreaLabel(area, t)}</span>
                </div>
              );
            };
            // --- Helper: Render the Stockholm expandable row ---
            const renderStockholmRow = () => (
              <div className="flex flex-col" key={STOCKHOLM_MUNICIPALITY}>
                <div
                  className={`flex items-center gap-2 p-2 border rounded-md transition-colors ${formData.serviceArea?.includes(STOCKHOLM_MUNICIPALITY) ? "bg-teal-50 border-teal-300" : "border-gray-300"}`}
                >
                  {/* Select/deselect Stockholm by clicking the label area */}
                  <span
                    className="font-semibold flex-1 cursor-pointer"
                    onClick={() => {
                      const isSelected = formData.serviceArea?.includes(STOCKHOLM_MUNICIPALITY);
                      let newAreas: string[];
                      if (isSelected) {
                        newAreas = formData.serviceArea.filter((a: any) => a !== STOCKHOLM_MUNICIPALITY);
                      } else {
                        newAreas = [...(formData.serviceArea || []), STOCKHOLM_MUNICIPALITY];
                      }
                      setFormData((prev: any) => ({ ...prev, serviceArea: newAreas }));
                    }}
                  >
                    {getStockholmAreaLabel(STOCKHOLM_MUNICIPALITY, t)}
                  </span>
                  {/* Arrow icon for expand/collapse, only clickable for expansion */}
                  <span
                    className="ml-auto text-xs text-black flex items-center cursor-pointer px-1"
                    onClick={e => {
                      e.stopPropagation();
                      setIsStockholmExpanded((prev) => !prev);
                    }}
                  >
                    {isStockholmExpanded ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                  </span>
                </div>
                {/* Show subareas only when expanded */}
                {isStockholmExpanded && (
                  <div className="ml-4 mt-1 flex flex-col gap-1">
                    {STOCKHOLM_SUBAREAS.map((subarea) => {
                      const isSelected = formData.serviceArea?.includes(subarea);
                      return (
                        <div
                          key={subarea}
                          className={`flex items-center gap-2 p-2 cursor-pointer border rounded-md hover:bg-gray-100 transition-colors ${isSelected ? "bg-teal-50 border-teal-300" : "border-gray-300"}`}
                          onClick={() => {
                            let newAreas: string[];
                            if (isSelected) {
                              newAreas = formData.serviceArea.filter((a: any) => a !== subarea);
                            } else {
                              newAreas = [...(formData.serviceArea || []), subarea];
                            }
                            setFormData((prev: any) => ({ ...prev, serviceArea: newAreas }));
                          }}
                        >
                          <span>{getStockholmAreaLabel(subarea, t)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
            // --- Main: Render the sorted list, replacing Stockholm with the expandable row ---
            return [
              ...StockholmAreas.map(area =>
                area === STOCKHOLM_MUNICIPALITY
                  ? renderStockholmRow()
                  : renderAreaItem(area)
              )
            ];
          })()}
        </Combobox>
      </div>

      {/* SERVICE ENABLERS */}
      <div className={`mb-4 ${validationErrors.serviceEnablers ? "border-red-500 bg-red-50 rounded-lg p-2" : ""}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <FiList className="w-5 h-5 mr-2 text-teal-500 flex-shrink-0" />
          {t("I Bring")}
          {validationErrors.serviceEnablers && (
            <span className="text-red-500 text-sm ml-2">({validationErrors.serviceEnablers})</span>
          )}
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {/* Show 'Nothing' as default if no enablers selected */}
          {formData.serviceEnablers?.length === 0 && (
            <div className="flex items-center gap-1 bg-gray-100 border border-gray-300 rounded-full px-3 py-1 shadow-sm text-gray-500">
              <span className="text-sm font-medium">{t("Nothing") || "Nothing"}</span>
            </div>
          )}
          {formData.serviceEnablers?.map((enabler: any) => (
            <div
              key={enabler}
              className="flex items-center gap-1 bg-teal-100 border border-teal-300 rounded-full px-3 py-1 shadow-sm"
            >
              <span className="text-sm font-medium">{getServiceEnablerLabel(enabler, t)}</span>
              <button
                type="button"
                onClick={() => {
                  const newEnablers = formData.serviceEnablers.filter((e: any) => e !== enabler);
                  setFormData((prev: any) => ({ ...prev, serviceEnablers: newEnablers }));
                }}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <Combobox>
          {/* 'Nothing' option for enablers if list is empty */}
          {formData.serviceEnablers?.length === 0 && (
            <div className="flex items-center gap-2 p-2 text-gray-400 cursor-default">
              <span>{t("Nothing") || "Nothing"}</span>
            </div>
          )}
          {serviceEnablersList?.map((enabler) => {
            const isSelected = formData.serviceEnablers?.includes(enabler);
            return (
              <div
                key={enabler}
                className={`flex items-center gap-2 p-2 cursor-pointer border rounded-md hover:bg-gray-100 transition-colors ${isSelected ? "bg-teal-50 border-teal-300" : "border-gray-300"}`}
                onClick={() => {
                  let newEnablers: string[];
                  if (isSelected) {
                    newEnablers = formData.serviceEnablers.filter((e: any) => e !== enabler);
                  } else {
                    newEnablers = [...(formData.serviceEnablers || []), enabler];
                  }
                  setFormData((prev: any) => ({ ...prev, serviceEnablers: newEnablers }));
                }}
              >
                <span>{getServiceEnablerLabel(enabler, t)}</span>
              </div>
            );
          })}
        </Combobox>
      </div>

      {/* PILOT PARTICIPATION */}
      <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center space-x-3 group">
          <Checkbox
            id="partOfPilot"
            checked={formData.partOfPilot}
            onCheckedChange={(checked) => {
              setFormData((prev: any) => ({
                ...prev,
                partOfPilot: checked as boolean,
              }));
            }}
            className="h-5 w-5 rounded-md border-2 border-teal-400 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500 transition-colors duration-200"
          />
          <div className="flex flex-col">
            <label
              htmlFor="partOfPilot"
              className="text-sm font-medium text-gray-800 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
            >
              <span className="mr-1">
                {t("pilotParticipation") || "I want to be part of the pilot program"}
              </span>
              <div className="relative inline-flex group">
                <FiInfo className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help" />
                <div className="absolute hidden group-hover:flex flex-col items-center bottom-full mb-2 -left-8 w-48">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-600">
                    {t("pilotParticipationDescription") || "Join our pilot program to get early access to new features and exclusive benefits."}
                  </div>
                </div>
              </div>
            </label>
            <span className="text-xs text-gray-500 mt-1">
              {t("pilotParticipationDescription") || "Get early access to new features"}
            </span>
          </div>
        </div>
      </div>

      {/* AVAILABILITY */}
      <div className="mb-6 mt-8">
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <FiCalendar className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
          {t("availability") || "Availability"}
        </label>
        <div className="flex items-center gap-2 text-teal-800 mb-4">
          <FiInfo
            className="w-5 h-5 text-teal-600 cursor-help"
            title="Set your weekly availability to let clients know when you're free to work"
          />
          <span className="text-sm">
            {t("availabilityDescription") || "Select the time slots when you're typically available for work"}
          </span>
        </div>
        <AvailabilityCalendar
          value={formData.availability} // Controlled value
          onChange={handleAvailabilityChange} // Updates formData
          mode="edit"
        />
      </div>



      {/* SUBMIT AND DELETE ACCOUNT */}
      <div className="flex flex-col gap-4 mt-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Show Save Draft if not all required fields are completed and draft not saved yet */}
          {Object.keys(validateForm()).length > 0 && !draftSaved && (
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className={`group relative flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 
                text-gray-700 py-3 px-6 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md 
                transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 text-base font-semibold 
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <FiFileText className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors relative z-10" />
              <span className="relative z-10 group-hover:text-gray-900 transition-colors">
                {t("saveDraft") || "Save Draft"}
              </span>
            </button>
          )}
          {/* Always show Update Data button, show errors if not completed */}
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className={`group relative flex-1 bg-gradient-to-r from-teal-500 to-teal-600
              text-white py-3 px-6 rounded-xl transition-all duration-300 
              transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 text-base font-semibold
              shadow-[0_0_15px_rgba(20,184,166,0.15)] hover:shadow-[0_0_20px_rgba(20,184,166,0.25)]
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2 relative z-10">
                <Skeleton className="h-4 w-4 rounded-full" />
                <span>{t("submitting") || "Submitting..."}</span>
              </div>
            ) : (
              <>
                <FiCheck className="w-4 h-4 relative z-10" />
                <span className="relative z-10">
                  {t("continue") || "Continue"}
                </span>
              </>
            )}
          </button>
        </div>

        {userData && (
          <div className="w-full">
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="group relative w-full bg-white border-2 border-red-200 hover:border-red-300
                text-red-600 py-3 px-6 rounded-xl transition-all duration-300 
                transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base font-medium"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-red-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <FiTrash2 className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{t("deleteAccount") || "Delete Account"}</span>
            </button>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                    <FiTrash2 className="w-5 h-5" />
                    {t("deleteAccount") || "Delete Account"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    {t("deleteAccountWarning") || "This action cannot be undone. This will permanently delete your account and remove your data from our servers."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("confirmUsername") || "Please type your username to confirm"}
                    </label>
                    <Input
                      type="text"
                      placeholder={formData.username}
                      value={deleteData.username}
                      onChange={(e) => {
                        setDeleteData((prev) => ({ ...prev, username: e.target.value }));
                        setDeleteErrors((prev) => ({ ...prev, username: undefined }));
                      }}
                      className={cn(
                        "w-full",
                        deleteErrors.username && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {deleteErrors.username && (
                      <p className="text-sm text-red-500">{deleteErrors.username}</p>
                    )}
                  </div>
                  {/* <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("deleteReason") || "Why are you deleting your account?"}
                    </label>
                    <Select
                      value={deleteData.reason}
                      onValueChange={(value) => {
                        setDeleteData((prev) => ({ ...prev, reason: value }));
                        setDeleteErrors((prev) => ({ ...prev, reason: undefined }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectReason") || "Select a reason"} />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {deleteReasons.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            <span className="text-gray-700">{t(reason)}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {deleteErrors.reason && (
                      <p className="text-sm text-red-500">{deleteErrors.reason}</p>
                    )}
                  </div> */}
                </div>
                <DialogFooter className="flex gap-3 sm:gap-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteData({ username: "", reason: "" });
                      setDeleteErrors({});
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {t("cancel") || "Cancel"}
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={async () => {
                      const newErrors: { username?: string; reason?: string } = {};

                      if (deleteData.username !== formData.username) {
                        newErrors.username = t("usernameNotMatch") || "Username doesn't match";
                      }
                      /*           if (!deleteData.reason) {
                                  newErrors.reason = t("reasonRequired") || "Please select a reason";
                                } */

                      if (Object.keys(newErrors).length > 0) {
                        setDeleteErrors(newErrors);
                        return;
                      }

                      setIsDeleting(true);
                      try {
                        await providerService.deleteAccount(formData.id, { reason: deleteData.reason });
                        toast.success(t("deleteAccountSuccess") || "Account deleted successfully!");
                        removeCookie('providerId');
                        removeCookie('token');
                        setTimeout(() => {
                          window.location.href = "/landing/provider";
                        }, 3000);
                      } catch (error: any) {
                        console.error(error);
                        // Use the new error handling utility
                        const { message, description } = handleApiError(error, t);
                        toast.error(message, { description });
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2",
                      isDeleting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isDeleting ? (
                      <>
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <span>{t("deleting") || "Deleting..."}</span>
                      </>
                    ) : (
                      <>
                        <FiTrash2 className="w-4 h-4" />
                        <span>{t("confirmDelete") || "Confirm Delete"}</span>
                      </>
                    )}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      {showCompletedDialog && (
        <Dialog open={showCompletedDialog} onOpenChange={setShowCompletedDialog}>
          <DialogContent className="max-w-2xl w-full bg-transparent shadow-none border-none flex items-center justify-center">
            <CompletedDialog
              isPilot={!!formData.partOfPilot}
              firstName={formData.firstName}
              onClose={() => {
                setShowCompletedDialog(false);
                navigate("/landing/provider");
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Step2;