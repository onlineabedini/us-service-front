export interface Report {
  id: string;
  clientId: string;
  providerId?: string;
  bookingId?: string;
  rate: number; // 1-5
  startTime?: string;
  endTime?: string;
  comment?: string;
  advantages?: string[];
  disadvantages?: string[];
  clientAccept: boolean;
  providerAccept: boolean;
  createdAt: string;
}

export interface CreateReportRequest {
  clientId: string;
  providerId?: string;
  bookingId?: string;
  rate: number;
  startTime?: string;
  endTime?: string;
  comment?: string;
  advantages?: string[];
  disadvantages?: string[];
  clientAccept?: boolean;
  providerAccept?: boolean;
  rateDate?: string;
}

export interface UpdateReportRequest {
  rate?: number;
  startTime?: string;
  endTime?: string;
  comment?: string;
  advantages?: string[];
  disadvantages?: string[];
  rateDate?: string;
}

export interface ReportSearchFilters {
  clientId?: string;
  providerId?: string;
  bookingId?: string;
  minRate?: number;
  maxRate?: number;
  startTimeFrom?: string;
  startTimeTo?: string;
  endTimeFrom?: string;
  endTimeTo?: string;
  clientAccept?: boolean;
  providerAccept?: boolean;
  limit?: number;
  offset?: number;
}

export interface ReportStats {
  totalReports: number;
  averageRating: number;
  acceptedReports: number;
  pendingReports: number;
} 