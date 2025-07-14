import { API_BASE_URL } from '@/config/api';

const baseUrl: string = API_BASE_URL;

export const bookingService = {
  getBookings: async (params?: { providerId?: string; status?: string }) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const response = await fetch(`${baseUrl}/booking?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  },

  getProviderBookings: async (providerId: string) => {
    const response = await fetch(`${baseUrl}/booking/provider/${providerId}`);
    if (!response.ok) throw new Error('Failed to fetch provider bookings');
    return response.json();
  },

  getProviderRecentServiceTypes: async (providerId: string) => {
    const response = await fetch(`${baseUrl}/booking/provider/${providerId}/recent-service-types`);

    if (!response.ok) throw new Error('Failed to fetch recent service types');
    return response.json();
  },

  createBooking: async (bookingData: any) => {
    const response = await fetch(`${baseUrl}/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) throw new Error('Failed to create booking');
    return response.json();
  },

  updateBookingStatus: async (bookingId: string, status: string, providerId?: string) => {
    const response = await fetch(`${baseUrl}/booking/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, providerId }),
    });
    if (!response.ok) throw new Error('Failed to update booking status');
    return response.json();
  },
};
