// Bookmark types for the application

export interface BookmarkedProvider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  description: string;
  hourlyRate: string;
  currency: string;
  isActive: boolean;
  rate: number;
  profileImage?: string;
  languages: string[];
  offeredServices: string[];
  serviceArea: string[];
  createdAt: string;
}

export interface BookmarkStatus {
  isBookmarked: boolean;
}

export interface BookmarkCount {
  count: number;
}

export interface BookmarkResponse {
  success: boolean;
  message: string;
} 