import { API_BASE_URL } from '@/config/api';

const baseUrl: string = API_BASE_URL;

export const clientService = {
  // Short comment: Get a client by ID
  getClient: async (id: string) => {
    const response = await fetch(`${baseUrl}/client/${id}`);
    if (!response.ok) throw new Error('Failed to fetch client');
    return response.json();
  },

  // Short comment: Get all clients
  getClients: async () => {
    const response = await fetch(`${baseUrl}/client`);
    if (!response.ok) throw new Error('Failed to fetch clients');
    return response.json();
  },

  // Short comment: Update a client by ID
  updateClient: async (id: string, data: any) => {
    const response = await fetch(`${baseUrl}/client/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update client');
    return response.json();
  },

  // Short comment: Register a new client (uses /client/register endpoint)
  registerClient: async (data: any) => {
    // Separate logic for registration endpoint
    const response = await fetch(`${baseUrl}/client/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      // Try to parse error message from backend
      let errorMsg = 'Failed to register client';
      try {
        const err = await response.json();
        errorMsg = err.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
    return response.json();
  },

  // Short comment: Upload client profile image
  uploadProfileImage: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    const response = await fetch(`${baseUrl}/client/${id}/upload-profile`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload profile image');
    return response.json();
  },

  // Short comment: Login a client
  login: async (data: { email: string; password: string }) => {
    const response = await fetch(`${baseUrl}/client/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errorMsg = 'Login failed';
      try {
        const err = await response.json();
        errorMsg = err.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
    return response.json();
  },

  // Short comment: Delete a client account
  deleteAccount: async (id: string, data: { reason: string }) => {
    const response = await fetch(`${baseUrl}/client/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
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
  },

  // Short comment: Bookmark a provider
  bookmarkProvider: async (clientId: string, providerId: string) => {
    const response = await fetch(`${baseUrl}/client/${clientId}/bookmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId }),
    });
    if (!response.ok) {
      let errorMsg = 'Failed to bookmark provider';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
    return response.json();
  },

  // Short comment: Remove bookmark
  removeBookmark: async (clientId: string, providerId: string) => {
    const response = await fetch(`${baseUrl}/client/${clientId}/bookmark`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId }),
    });
    if (!response.ok) {
      let errorMsg = 'Failed to remove bookmark';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
    return response.json();
  },

  // Short comment: Get bookmarked providers
  getBookmarkedProviders: async (clientId: string) => {
    const response = await fetch(`${baseUrl}/client/${clientId}/bookmarks`);
    if (!response.ok) {
      let errorMsg = 'Failed to fetch bookmarked providers';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
    return response.json();
  },

  // Short comment: Check bookmark status
  checkBookmarkStatus: async (clientId: string, providerId: string) => {
    const response = await fetch(`${baseUrl}/client/${clientId}/bookmark/${providerId}`);
    if (!response.ok) {
      let errorMsg = 'Failed to check bookmark status';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
    return response.json();
  },

  // Short comment: Get provider bookmark count
  getProviderBookmarkCount: async (providerId: string) => {
    const response = await fetch(`${baseUrl}/client/provider/${providerId}/bookmark-count`);
    if (!response.ok) {
      let errorMsg = 'Failed to get bookmark count';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
    return response.json();
  },
};
