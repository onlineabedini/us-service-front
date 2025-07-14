// Provider data types
export interface Provider {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profileImage?: string;
  description: string;
  hourlyRate?: number;
  currency?: string;
  rating?: number; // Legacy field - kept for backward compatibility
  rate?: number; // New provider rating field from backend
  isAvailable?: boolean;
  location?: string;
  offeredServices: string[];
  serviceArea: string[];
  availability: AvailabilitySchedule;
  languages?: string[];
  citizenship?: string;
  workPermit?: string;
  education?: string;
  experience?: string;
  smoking?: boolean;
  hasCar?: boolean;
}

export interface AvailabilitySchedule {
  [key: string]: {
    morning?: boolean;
    afternoon?: boolean;
    evening?: boolean;
  };
}

// Component props types
export interface ProfileSectionProps {
  userData: Provider;
  setOpenSheet?: (value: boolean) => void;
}

export interface AvailabilitySectionProps {
  availability: AvailabilitySchedule;
  onEdit: () => void;
  canEdit?: boolean;
}

export interface OverviewAndDetailsProps {
  description: string;
  offeredServices: string[];
  serviceArea: string[];
  onEdit?: () => void;
  canEdit?: boolean;
}

export interface ActivityAndAboutRowProps {
  userData: Provider;
  onEdit: () => void;
}

export interface PendingRequestsSectionProps {
  firstName: string;
  providerId: string;
  onRepeatRequest: () => void;
}

export interface EditSheetProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  userData: Provider;
  onSaveSuccess: () => void;
}

// API Error type
export interface ApiError {
  message: string;
  status?: number;
}

// NOTE: All user/provider data fetching in components should use cookies and always fetch fresh data from the API.