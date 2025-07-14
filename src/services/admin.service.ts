// Section: Import statements
import { API_BASE_URL } from '@/config/api';
import { getCookie, removeCookie } from '@/utils/authCookieService';

// Short comment: Admin service class for managing providers and clients
class AdminService {
  // Section: Authentication helper methods
  private getAuthHeaders(): HeadersInit {
    const token = getCookie('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private handleUnauthorizedResponse(response: Response) {
    if (response.status === 401) {
      removeCookie('token');
      removeCookie('providerId');
      return true;
    }
    return false;
  }

  // Section: Provider management operations
  async getAllProviders() {
    const response = await fetch(`${API_BASE_URL}/provider`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch providers');
    }

    return await response.json();
  }

  async getProviderById(id: string) {
    const response = await fetch(`${API_BASE_URL}/provider/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch provider');
    }

    return await response.json();
  }

  async updateProvider(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/provider/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to update provider');
    }

    return await response.json();
  }

  async deleteProvider(id: string) {
    const response = await fetch(`${API_BASE_URL}/provider/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to delete provider');
    }

    return await response.json();
  }

  // Section: Client management operations
  async getAllClients() {
    const response = await fetch(`${API_BASE_URL}/client`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch clients');
    }

    return await response.json();
  }

  async getClientById(id: string) {
    const response = await fetch(`${API_BASE_URL}/client/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch client');
    }

    return await response.json();
  }

  async updateClient(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/client/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to update client');
    }

    return await response.json();
  }

  async deleteClient(id: string) {
    const response = await fetch(`${API_BASE_URL}/client/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to delete client');
    }

    return await response.json();
  }

  // Section: Booking management operations
  async getAllBookings() {
    const response = await fetch(`${API_BASE_URL}/booking`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch bookings');
    }

    return await response.json();
  }

  async getBookingById(id: string) {
    const response = await fetch(`${API_BASE_URL}/booking/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to fetch booking');
    }

    return await response.json();
  }

  async updateBooking(id: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/booking/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to update booking');
    }

    return await response.json();
  }

  async deleteBooking(id: string, reason: string) {
    const response = await fetch(`${API_BASE_URL}/booking/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to delete booking');
    }

    return await response.json();
  }

  // Section: Dashboard statistics methods
  async getDashboardStats() {
    const [providers, clients, bookings] = await Promise.all([
      this.getAllProviders(),
      this.getAllClients(),
      this.getAllBookings()
    ]);

    const totalProviders = providers.length;
    const totalClients = clients.length;
    const totalJobs = bookings.length;
    const verifiedProviders = providers.filter((p: any) => p.isEmailVerified).length;
    const verifiedClients = clients.filter((c: any) => c.isEmailVerified).length;
    const pilotProviders = providers.filter((p: any) => p.partOfPilot).length;
    
    // Calculate jobs statistics
    const completedJobs = bookings.filter((b: any) => b.status === 'completed').length;
    const pendingJobs = bookings.filter((b: any) => b.status === 'pending').length;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newProviders = providers.filter((p: any) => {
      if (!p.createdAt) return false;
      return new Date(p.createdAt) >= sevenDaysAgo;
    }).length;
    
    const newClients = clients.filter((c: any) => {
      if (!c.createdAt) return false;
      return new Date(c.createdAt) >= sevenDaysAgo;
    }).length;

    return {
      totalProviders,
      totalClients,
      totalJobs,
      newRegistrations: newProviders + newClients,
      verifiedUsers: verifiedProviders + verifiedClients,
      unverifiedUsers: (totalProviders - verifiedProviders) + (totalClients - verifiedClients),
      pilotUsers: pilotProviders,
      completedJobs,
      pendingJobs
    };
  }

  // Section: Locale management methods
  async fetchLocale(lang: string) {
    const response = await fetch(`/locales/${lang}/translation.json`);
    if (!response.ok) {
      throw new Error('Failed to load translation file');
    }
    return await response.json();
  }

  async getAvailableLanguages(): Promise<string[]> {
    return [
      'ar', 'de', 'en', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'tr', 'uk', 'ur', 'zh'
    ];
  }

  // Section: Admin authentication check
  async checkAdminPermissions(providerId: string) {
    const response = await fetch(`${API_BASE_URL}/provider/${providerId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (this.handleUnauthorizedResponse(response)) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to check permissions');
    }

    const data = await response.json();
    
    // Section: Check for super admin email or admin role
    const isSuperAdmin = data.email === 'vitago.swe@gmail.com';
    const isAdmin = data.role === 'admin';
    
    return isSuperAdmin || isAdmin;
  }
}

export const adminService = new AdminService(); 