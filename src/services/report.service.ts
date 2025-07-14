import { API_BASE_URL } from '@/config/api';
import { 
  Report, 
  CreateReportRequest, 
  UpdateReportRequest, 
  ReportSearchFilters, 
  ReportStats 
} from '@/types/report';

export class ReportService {
  // Create a new report
  static async createReport(data: CreateReportRequest): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create report');
    }

    return response.json();
  }

  // Get all reports
  static async getAllReports(): Promise<Report[]> {
    const response = await fetch(`${API_BASE_URL}/reports`);

    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }

    return response.json();
  }

  // Search reports with filters
  static async searchReports(filters: ReportSearchFilters): Promise<Report[]> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_BASE_URL}/reports/search?${params}`);

    if (!response.ok) {
      throw new Error('Failed to search reports');
    }

    return response.json();
  }

  // Get report statistics
  static async getReportStats(): Promise<ReportStats> {
    const response = await fetch(`${API_BASE_URL}/reports/stats`);

    if (!response.ok) {
      throw new Error('Failed to fetch report statistics');
    }

    return response.json();
  }

  // Get reports by client
  static async getReportsByClient(clientId: string): Promise<Report[]> {
    const response = await fetch(`${API_BASE_URL}/reports/client/${clientId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch client reports');
    }

    return response.json();
  }

  // Get reports by provider
  static async getReportsByProvider(providerId: string): Promise<Report[]> {
    const response = await fetch(`${API_BASE_URL}/reports/provider/${providerId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch provider reports');
    }

    return response.json();
  }

  // Get reports by booking
  static async getReportsByBooking(bookingId: string): Promise<Report[]> {
    const response = await fetch(`${API_BASE_URL}/reports/booking/${bookingId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch booking reports');
    }

    return response.json();
  }

  // Get single report
  static async getReport(reportId: string): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch report');
    }

    return response.json();
  }

  // Update report
  static async updateReport(reportId: string, data: UpdateReportRequest): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update report');
    }

    return response.json();
  }

  // Client accept report
  static async clientAcceptReport(reportId: string): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/accept-client`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      throw new Error('Failed to accept report as client');
    }

    return response.json();
  }

  // Provider accept report
  static async providerAcceptReport(reportId: string): Promise<Report> {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/accept-provider`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      throw new Error('Failed to accept report as provider');
    }

    return response.json();
  }

  // Delete report
  static async deleteReport(reportId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete report');
    }
  }
} 