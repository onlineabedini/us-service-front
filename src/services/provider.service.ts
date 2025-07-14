import { API_BASE_URL } from '@/config/api';
import { getCookie, removeCookie, setCookie } from '@/utils/authCookieService';

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
  consent: boolean;
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
  availability: any;
}

class ProviderService {
  private getAuthHeaders(): HeadersInit {
    const token = getCookie('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeadersMultipart(): HeadersInit {
    const token = getCookie('token');
    return {
      'Authorization': `Bearer ${token}`,
    };
  }


  // __dev
  private handleUnauthorizedResponse(response: Response) {
    if (response.status === 401) {
      removeCookie('token');
      removeCookie('user');
      return true;
    }
    return false;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/provider/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Login failed');
    }

    const data = await response.json();
    if (data.token) {
      setCookie('token', data.token);
    }
    return data;
  }

  async forgotPassword(email: string) {
    const response = await fetch(`${API_BASE_URL}/provider/forget-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to send password reset email');
    }

    return await response.json();
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await fetch(`${API_BASE_URL}/provider/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: newPassword }),
    });

    if (!response.ok) {
      throw new Error('Failed to reset password');
    }

    return await response.json();
  }

  async getProfile(providerId: string) {
    const response = await fetch(`${API_BASE_URL}/provider/${providerId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch provider profile');
    }

    return await response.json();
  }

  // __dev
  async updateProfile(providerId: string, profileData: Partial<CompleteProfileData>) {
    const { profileImageFile, ...patchPayload } = profileData;

    const response = await fetch(`${API_BASE_URL}/provider/${providerId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(patchPayload),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Profile update failed');
    }

    return await response.json();
  }

  async uploadProfileImage(providerId: string, imageFile: File) {
    const formData = new FormData();
    formData.append('profileImage', imageFile);

    const response = await fetch(
      `${API_BASE_URL}/provider/${providerId}/upload-profile`,
      {
        method: 'POST',
        headers: this.getAuthHeadersMultipart(),
        body: formData,
      }
    );

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Profile image upload failed');
    }

    return await response.json();
  }

  async updateCompleteProfile(providerId: string, profileData: any) {
    try {
      let updatedData = { ...profileData };

      // // 1. Upload profile image if provided
      if (profileData.profileImageFile) {
        const uploadResult = await this.uploadProfileImage(
          providerId,
          profileData.profileImageFile
        );
        updatedData.profileImage = uploadResult.profileImage;
      }

      // // 2. Update the rest of the profile data
      const result = await this.updateProfile(providerId, updatedData);
      return result;
    } catch (error) {
      throw error;
    }
  }

  logout() {
    removeCookie('token');
  }

  // Fetch the list of providers from the API, with optional query string
  async fetchProviders(queryString?: string) {
    const url = queryString ? `${API_BASE_URL}/provider?${queryString}` : `${API_BASE_URL}/provider`;
    const token = getCookie('token');
    const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(url, { headers });
    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch providers');
    }
    // Only parse JSON if response is not empty
    const text = await response.text();
    if (!text) return [];
    return JSON.parse(text);
  }

  // Short comment: Delete a provider account
  async deleteAccount(id: string, data: { reason: string }) {
    const response = await fetch(`${API_BASE_URL}/provider/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      let errorMsg = 'Failed to delete account';
      try {
        const errorData = await response.json();
        // Handle specific error messages from backend
        if (errorData.message) {
          errorMsg = errorData.message;
        } else if (errorData.error) {
          errorMsg = errorData.error;
        }
        // Create a structured error object with additional context
        const structuredError = {
          message: errorMsg,
          statusCode: errorData.statusCode || response.status,
          error: errorData.error || 'Bad Request',
          details: errorData
        };
        throw structuredError;
      } catch (parseError) {
        // If JSON parsing fails, throw the original error
        throw new Error(errorMsg);
      }
    }
    return response.json();
  }
}

export const providerService = new ProviderService();