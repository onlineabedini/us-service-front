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

export interface CompleteProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  socialSecurityNumber: string;
  phoneNumber: string;
  profileImage?: string;
  profileImageFile?: File | null;
  description: string;
  hourlyRate?: number;
  currency: string;
  rate?: number;
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
  availability: {
    Morning: { [key: string]: boolean };
    Noon: { [key: string]: boolean };
    Afternoon: { [key: string]: boolean };
    Night: { [key: string]: boolean };
  };
}

export interface ValidationErrors {
  [key: string]: string;
} 