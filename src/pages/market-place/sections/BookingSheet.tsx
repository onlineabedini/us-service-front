//@collaps
import React, { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar, Info, AlertCircle, Clock, List, MapPin, Repeat, Ban, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { servicesList } from "../../../lists/services";
import { serviceEnablersList } from "../../../lists/serviceEnablers";
import { Combobox } from "@/components/global/combobox";

import { API_BASE_URL } from '@/config/api';
import { clientService } from "@/services/client.service";
import { bookingService } from "@/services/booking.service";
import { getCookie, removeCookie } from '@/utils/authCookieService';
import { useNavigate } from "react-router-dom";
import { Address } from "@/types/address";
import CustomDatePicker from '@/components/global/CustomDatePicker';
import { addDays } from 'date-fns';
import CustomTimePicker from '@/components/global/CustomTimePicker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { timePeriods } from "@/lists/timePeriods";
import { Home, Layers, Sun, Truck, Trash2, Package, Move3D, HelpCircle } from 'lucide-react';

// Dummy service durations in hours
const serviceDurations: Record<string, number> = {
  'Regular Cleaning': 2,
  'Deep Cleaning': 4,
  'Window Cleaning': 1.5,
  'Move Out Cleaning': 5,
  'Office Cleaning': 3,
  'Post Construction': 6
};

// Business hours configuration
const BUSINESS_HOURS = {
  start: '07:00',
  end: '23:00',
  minDuration: 1, // minimum booking duration in hours
  maxDuration: 8  // maximum booking duration in hours
};

// Helper function to calculate end time
const calculateEndTime = (startTime: string, serviceType: string): string => {
  if (!startTime || !serviceType) return '';

  const duration = serviceDurations[serviceType] || 2; // Default to 2 hours if service not found
  const [hours, minutes] = startTime.split(':').map(Number);
  const endDate = new Date(2000, 0, 1, hours, minutes);
  endDate.setHours(endDate.getHours() + Math.floor(duration));
  endDate.setMinutes(endDate.getMinutes() + (duration % 1) * 60);

  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
};

// Existing booking interface for conflict detection
interface ExistingBooking {
  id: string;
  bookingDate: string;
  proposedStartTime: string;
  proposedEndTime: string;
  status: string;
}

// Function to check for booking time conflicts
const hasBookingConflict = (
  newStartTime: string,
  newEndTime: string,
  newDate: string,
  existingBookings: ExistingBooking[]
): boolean => {
  if (!newStartTime || !newEndTime || !newDate) return false;

  const newStart = new Date(`${newDate}T${newStartTime}`);
  const newEnd = new Date(`${newDate}T${newEndTime}`);

  return existingBookings.some(booking => {
    // Only check bookings on the same date and with active status
    if (booking.bookingDate !== newDate ||
      !['scheduled', 'confirmed', 'in_progress'].includes(booking.status)) {
      return false;
    }

    const existingStart = new Date(`${booking.bookingDate}T${booking.proposedStartTime}`);
    const existingEnd = new Date(`${booking.bookingDate}T${booking.proposedEndTime}`);

    // Check for overlap: new booking starts before existing ends AND new booking ends after existing starts
    return newStart < existingEnd && newEnd > existingStart;
  });
};

// Function to check if a time period has any booking conflicts
const isPeriodAvailable = (
  period: { label: string; start: string; end: string },
  date: string,
  existingBookings: ExistingBooking[],
  serviceType: string
): {
  available: boolean;
  conflictLevel: 'none' | 'partial' | 'full';
  availableSlots?: { start: string; end: string }[];
  conflictingBookings?: ExistingBooking[];
} => {
  if (!date || !existingBookings.length) {
    return { available: true, conflictLevel: 'none' };
  }

  // Get service duration for more accurate conflict detection
  const serviceDuration = serviceDurations[serviceType] || 2;
  const periodStart = new Date(`${date}T${period.start}`);
  const periodEnd = new Date(`${date}T${period.end}`);

  // Check if there's enough time in the period for the service
  const periodDurationHours = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
  if (periodDurationHours < serviceDuration) {
    return { available: false, conflictLevel: 'full' };
  }

  // Get bookings on the same date with active status
  const dayBookings = existingBookings.filter(booking =>
    booking.bookingDate === date &&
    ['scheduled', 'confirmed', 'in_progress'].includes(booking.status)
  );

  if (!dayBookings.length) {
    return { available: true, conflictLevel: 'none' };
  }

  // Check for conflicts with existing bookings
  let hasConflict = false;
  let availableTimeSlots: { start: Date; end: Date }[] = [];
  const conflictingBookings: ExistingBooking[] = [];

  // Start with the full period as available
  availableTimeSlots.push({ start: periodStart, end: periodEnd });

  // Remove conflicting time slots
  for (const booking of dayBookings) {
    const bookingStart = new Date(`${booking.bookingDate}T${booking.proposedStartTime}`);
    const bookingEnd = new Date(`${booking.bookingDate}T${booking.proposedEndTime}`);

    // Check if booking overlaps with this period
    if (bookingStart < periodEnd && bookingEnd > periodStart) {
      hasConflict = true;
      conflictingBookings.push(booking);

      // Remove the conflicting time from available slots
      availableTimeSlots = availableTimeSlots.flatMap(slot => {
        if (bookingStart >= slot.end || bookingEnd <= slot.start) {
          // No overlap with this slot
          return [slot];
        }

        const newSlots = [];
        // Add time before the booking if it exists
        if (bookingStart > slot.start) {
          newSlots.push({ start: slot.start, end: bookingStart });
        }
        // Add time after the booking if it exists
        if (bookingEnd < slot.end) {
          newSlots.push({ start: bookingEnd, end: slot.end });
        }
        return newSlots;
      });
    }
  }

  // Check if any remaining slot can accommodate the service duration
  const canAccommodateService = availableTimeSlots.some(slot => {
    const slotDurationHours = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60);
    return slotDurationHours >= serviceDuration;
  });

  // Convert available slots to string format
  const availableSlotsFormatted = availableTimeSlots
    .filter(slot => {
      const slotDurationHours = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60);
      return slotDurationHours >= serviceDuration;
    })
    .map(slot => ({
      start: slot.start.toTimeString().slice(0, 5),
      end: slot.end.toTimeString().slice(0, 5)
    }));

  if (!hasConflict) {
    return { available: true, conflictLevel: 'none' };
  } else if (canAccommodateService) {
    return {
      available: true,
      conflictLevel: 'partial',
      availableSlots: availableSlotsFormatted,
      conflictingBookings
    };
  } else {
    return {
      available: false,
      conflictLevel: 'full',
      conflictingBookings
    };
  }
};

// Add provider availability interface
interface ProviderAvailability {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Add time period mapping
const PERIOD_MAPPING = {
  'Morning': 'Morning',
  'Noon': 'Noon',
  'Afternoon': 'Afternoon',
  'Evening': 'Night'  // Map Evening to Night since that's what the provider uses
};

// Transform provider availability data
const transformProviderAvailability = (availability: any) => {
  if (!availability) {
    
    return {};
  }

  

  const transformed: { [key: string]: { [key: string]: boolean } } = {};

  // Map days of the week
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const providerDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  days.forEach((day, index) => {
    transformed[day] = {};
    // Map each period
    Object.entries(PERIOD_MAPPING).forEach(([period, providerPeriod]) => {
      // Check if the availability data has the period and day
      const isAvailable = availability[providerPeriod]?.[providerDays[index]] === true;
      transformed[day][period] = isAvailable;
      
    });
  });

  
  return transformed;
};

// Update time format helper
const formatTimeToEuropean = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes}`;
};

// Add availability checking function
const checkProviderAvailability = async (providerId: string, date: string): Promise<ProviderAvailability[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/provider/${providerId}/availability?date=${date}`);
    if (!response.ok) throw new Error('Failed to fetch availability');
    return await response.json();
  } catch (error) {
    console.error('Error fetching provider availability:', error);
    return [];
  }
};

// Add time slot validation
const isTimeSlotAvailable = (time: string, availability: ProviderAvailability[]): boolean => {
  if (!time || !availability.length) return true;

  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;

  return availability.some(slot => {
    if (!slot.isAvailable) return false;

    const [slotStartHours, slotStartMinutes] = slot.startTime.split(':').map(Number);
    const [slotEndHours, slotEndMinutes] = slot.endTime.split(':').map(Number);
    const slotStartInMinutes = slotStartHours * 60 + slotStartMinutes;
    const slotEndInMinutes = slotEndHours * 60 + slotEndMinutes;

    // Check if the time falls within the available slot
    return timeInMinutes >= slotStartInMinutes && timeInMinutes <= slotEndInMinutes;
  });
};

interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerData?: any; // Make providerData optional
  isGeneralRequest?: boolean;
  onSuccess: (response: any) => void; // Add onSuccess prop
}

interface BookingFormData {
  clientId: string;
  providerId?: string; // Make providerId optional for general requests
  bookingDate: string;
  typeOfService: string[]; // Changed from string to string[] for multiple selection
  proposedStartTime: string;
  proposedEndTime: string;
  repeat: string;
  serviceAddress: string;
  agreedHourlyPrice?: number; // Make hourly rate optional for general requests
  selectedPeriod?: string;
  expectedBrings: string[]; // Add expected brings field for client expectations
}

// Helper: Format client address for booking (matches client register step 2 and backend structure)
const formatClientAddress = (address: Address) => {
  if (!address) return '';
  const parts = [];
  if (address.firstName) parts.push(address.firstName);
  if (address.lastName) parts.push(address.lastName);
  if (address.streetAddress) parts.push(address.streetAddress);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.city) parts.push(address.city);
  if (address.country) parts.push(address.country);
  return parts.filter(Boolean).join(', ');
};

// Helper: Check if client address is complete (matches backend structure)
const isClientAddressComplete = (address: Address) => {
  return !!(
    address.firstName &&
    address.lastName &&
    address.streetAddress &&
    address.postalCode &&
    address.city &&
    address.country
  );
};

// Helper: Get initial form data state
const getInitialFormData = (userData: any, providerData: any, isGeneralRequest: boolean, getMinHourlyRate: () => number): BookingFormData => {
  const address = userData?.user.address?.[0];
  const formattedAddress = address ?
    `${address.businessName || ''} ${address.streetAddress || ''} ${address.postalCode ? `, ${address.postalCode}` : ''} ${address.city ? `, ${address.city}` : ''} ${address.country ? `, ${address.country}` : ''}`.trim() : '';

  const minRate = getMinHourlyRate();

  return {
    clientId: userData?.user.id || "",
    providerId: isGeneralRequest ? undefined : providerData?.id,
    bookingDate: new Date().toISOString().split('T')[0],
    typeOfService: [],
    proposedStartTime: "",
    proposedEndTime: "",
    repeat: "none",
    serviceAddress: formattedAddress,
    agreedHourlyPrice: minRate,
    selectedPeriod: "",
    expectedBrings: [],
  };
};

// Add function to generate available end times based on start time and period
const generateAvailableEndTimes = (
  startTime: string,
  selectedPeriod: string,
  existingBookings: ExistingBooking[],
  providerAvailability: ProviderAvailability[],
  selectedDate: string,
  isGeneralRequest: boolean,
  providerData?: any
): string[] => {
  const availableEndTimes: string[] = [];

  // For general requests, all times after start time are available
  if (isGeneralRequest) {
    return availableEndTimes;
  }

  // If no start time is selected, return empty array
  if (!startTime) {
    return availableEndTimes;
  }

  

  // Get the time range for the selected period
  const periodTimeRanges: Record<string, { start: string; end: string }> = {
    'Morning': { start: '07:00', end: '11:00' },
    'Noon': { start: '11:00', end: '15:00' },
    'Afternoon': { start: '15:00', end: '18:00' },
    'Evening': { start: '18:00', end: '23:00' }
  };

  const periodRange = periodTimeRanges[selectedPeriod];
  if (!periodRange) {
    return availableEndTimes;
  }

  // Start from the selected start time
  const startTimeObj = new Date(`2000-01-01T${startTime}`);
  const periodEndObj = new Date(`2000-01-01T${periodRange.end}`);

  // Generate end times from start time until period end
  let currentTime = new Date(startTimeObj);
  currentTime.setMinutes(currentTime.getMinutes() + 5); // Start 5 minutes after start time

  while (currentTime <= periodEndObj) {
    const timeString = currentTime.toTimeString().slice(0, 5);
    availableEndTimes.push(timeString);
    currentTime.setMinutes(currentTime.getMinutes() + 5);
  }

  // Remove times that conflict with existing bookings
  const dayBookings = existingBookings.filter(booking =>
    booking.bookingDate === selectedDate &&
    ['scheduled', 'confirmed', 'in_progress'].includes(booking.status)
  );

  dayBookings.forEach(booking => {
    const bookingStart = new Date(`2000-01-01T${booking.proposedStartTime}`);
    const bookingEnd = new Date(`2000-01-01T${booking.proposedEndTime}`);

    // Remove conflicting time slots
    let currentTime = new Date(bookingStart);
    while (currentTime < bookingEnd) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      const index = availableEndTimes.indexOf(timeString);
      if (index > -1) {
        availableEndTimes.splice(index, 1);
      }
      currentTime.setMinutes(currentTime.getMinutes() + 5);
    }
  });

  // Remove times that are not available in provider availability
  if (providerAvailability.length > 0) {
    availableEndTimes.forEach((time: string, index: number) => {
      const isAvailable = isTimeSlotAvailable(time, providerAvailability);
      if (!isAvailable) {
        availableEndTimes.splice(index, 1);
      }
    });
  }

  // Ensure minimum service duration (1 hour)
  const minDuration = 60; // minutes
  availableEndTimes.forEach((time: string, index: number) => {
    const endTimeObj = new Date(`2000-01-01T${time}`);
    const duration = (endTimeObj.getTime() - startTimeObj.getTime()) / (1000 * 60);
    if (duration < minDuration) {
      availableEndTimes.splice(index, 1);
    }
  });

  
  return availableEndTimes.sort();
};

// Add function to generate available times based on selected period
const generateAvailableTimesForPeriod = (
  selectedPeriod: string,
  existingBookings: ExistingBooking[],
  providerAvailability: ProviderAvailability[],
  selectedDate: string,
  isGeneralRequest: boolean,
  providerData?: any
): string[] => {
  const availableTimes: string[] = [];

  // For general requests, all times are available
  if (isGeneralRequest) {
    return availableTimes;
  }

  // If no period is selected, return empty array (all times available)
  if (!selectedPeriod) {
    return availableTimes;
  }

  

  // Get the time range for the selected period
  const periodTimeRanges: Record<string, { start: string; end: string }> = {
    'Morning': { start: '07:00', end: '11:00' },
    'Noon': { start: '11:00', end: '15:00' },
    'Afternoon': { start: '15:00', end: '18:00' },
    'Evening': { start: '18:00', end: '23:00' }
  };

  const periodRange = periodTimeRanges[selectedPeriod];
  if (!periodRange) {
    return availableTimes;
  }

  // Generate all time slots within the selected period
  const periodStart = new Date(`2000-01-01T${periodRange.start}`);
  const periodEnd = new Date(`2000-01-01T${periodRange.end}`);

  let currentTime = new Date(periodStart);
  while (currentTime < periodEnd) {
    const timeString = currentTime.toTimeString().slice(0, 5);
    availableTimes.push(timeString);
    currentTime.setMinutes(currentTime.getMinutes() + 5);
  }

  // Remove times that conflict with existing bookings
  const dayBookings = existingBookings.filter(booking =>
    booking.bookingDate === selectedDate &&
    ['scheduled', 'confirmed', 'in_progress'].includes(booking.status)
  );

  dayBookings.forEach(booking => {
    const startTime = new Date(`2000-01-01T${booking.proposedStartTime}`);
    const endTime = new Date(`2000-01-01T${booking.proposedEndTime}`);

    // Remove conflicting time slots
    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      const index = availableTimes.indexOf(timeString);
      if (index > -1) {
        availableTimes.splice(index, 1);
      }
      currentTime.setMinutes(currentTime.getMinutes() + 5);
    }
  });

  // Remove times that are not available in provider availability
  if (providerAvailability.length > 0) {
    availableTimes.forEach((time: string, index: number) => {
      const isAvailable = isTimeSlotAvailable(time, providerAvailability);
      if (!isAvailable) {
        availableTimes.splice(index, 1);
      }
    });
  }

  
  return availableTimes.sort();
};

// Add function to generate unavailable times based on existing bookings and provider availability
const generateUnavailableTimes = (
  existingBookings: ExistingBooking[],
  providerAvailability: ProviderAvailability[],
  selectedDate: string,
  isGeneralRequest: boolean,
  providerData?: any
): string[] => {
  const unavailableTimes: string[] = [];

  // For general requests, no time restrictions
  if (isGeneralRequest) {
    return unavailableTimes;
  }

  // Get bookings on the selected date with active status
  const dayBookings = existingBookings.filter(booking =>
    booking.bookingDate === selectedDate &&
    ['scheduled', 'confirmed', 'in_progress'].includes(booking.status)
  );

  

  // Generate unavailable times from existing bookings
  dayBookings.forEach(booking => {
    const startTime = new Date(`2000-01-01T${booking.proposedStartTime}`);
    const endTime = new Date(`2000-01-01T${booking.proposedEndTime}`);

    // Generate time slots every 5 minutes within the booking period
    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      if (!unavailableTimes.includes(timeString)) {
        unavailableTimes.push(timeString);
      }
      currentTime.setMinutes(currentTime.getMinutes() + 5);
    }
  });

  // Generate unavailable times from provider availability API
  if (providerAvailability.length > 0) {
    // Find unavailable time slots from provider availability
    const businessStart = new Date(`2000-01-01T${BUSINESS_HOURS.start}`);
    const businessEnd = new Date(`2000-01-01T${BUSINESS_HOURS.end}`);

    // Generate all possible time slots in business hours
    let currentTime = new Date(businessStart);
    while (currentTime < businessEnd) {
      const timeString = currentTime.toTimeString().slice(0, 5);

      // Check if this time is available in provider availability
      const isAvailable = isTimeSlotAvailable(timeString, providerAvailability);

      if (!isAvailable && !unavailableTimes.includes(timeString)) {
        unavailableTimes.push(timeString);
      }

      currentTime.setMinutes(currentTime.getMinutes() + 5);
    }
  }

  // Generate unavailable times from provider's weekly availability schedule
  if (providerData?.availability && selectedDate) {
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];

    // Get provider's availability for this day
    const providerDayAvailability = providerData.availability[dayName] || {};

    // Check if provider is available on this day
    const isProviderAvailableOnDay = Object.values(providerDayAvailability).some(isAvailable => isAvailable);

    if (!isProviderAvailableOnDay) {
      // Provider is not available on this day, mark all business hours as unavailable
      const businessStart = new Date(`2000-01-01T${BUSINESS_HOURS.start}`);
      const businessEnd = new Date(`2000-01-01T${BUSINESS_HOURS.end}`);

      let currentTime = new Date(businessStart);
      while (currentTime < businessEnd) {
        const timeString = currentTime.toTimeString().slice(0, 5);
        if (!unavailableTimes.includes(timeString)) {
          unavailableTimes.push(timeString);
        }
        currentTime.setMinutes(currentTime.getMinutes() + 5);
      }
    } else {
      // Provider is available on this day, check specific time periods
      const timePeriods = ['Morning', 'Noon', 'Afternoon', 'Evening'] as const;
      const periodTimeRanges: Record<string, { start: string; end: string }> = {
        'Morning': { start: '07:00', end: '11:00' },
        'Noon': { start: '11:00', end: '15:00' },
        'Afternoon': { start: '15:00', end: '18:00' },
        'Evening': { start: '18:00', end: '23:00' }
      };

      timePeriods.forEach(period => {
        const isPeriodAvailable = providerDayAvailability[period];
        if (!isPeriodAvailable) {
          // This period is not available, mark all times in this period as unavailable
          const periodRange = periodTimeRanges[period];
          if (periodRange) {
            const periodStart = new Date(`2000-01-01T${periodRange.start}`);
            const periodEnd = new Date(`2000-01-01T${periodRange.end}`);

            let currentTime = new Date(periodStart);
            while (currentTime < periodEnd) {
              const timeString = currentTime.toTimeString().slice(0, 5);
              if (!unavailableTimes.includes(timeString)) {
                unavailableTimes.push(timeString);
              }
              currentTime.setMinutes(currentTime.getMinutes() + 5);
            }
          }
        }
      });
    }
  }

  
  return unavailableTimes.sort();
};

// Service descriptions for tooltips or inline help
const serviceDescriptions: Record<string, string> = {
  'Domestic cleaning': 'Standard home cleaning tasks such as dusting, vacuuming, and mopping.',
  'Deep cleaning': 'Thorough cleaning including hard-to-reach areas and detailed work.',
  'Window cleaning': 'Professional cleaning of interior and exterior windows.',
  'Move cleaning': 'Comprehensive cleaning for moving in or out of a property.',
  'Ring trash': 'Taking out and managing household trash and recycling.',
  'Bring pawn jars to': 'Transporting pawn jars to recycling or return points.',
  'Assist with moving': 'Help with packing, lifting, and moving items.'
};

// Service icons mapping (Lucide icons or fallback)
const serviceIcons: Record<string, React.ElementType> = {
  'Domestic cleaning': Home,
  'Deep cleaning': Layers,
  'Window cleaning': Sun,
  'Move cleaning': Truck,
  'Ring trash': Trash2,
  'Bring pawn jars to': Package,
  'Assist with moving': Move3D
};

const BookingSheet: React.FC<BookingSheetProps> = ({
  open,
  onOpenChange,
  providerData,
  isGeneralRequest = false,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [userData, setUserData] = useState<any>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const navigate = useNavigate();
  const [providerAvailability, setProviderAvailability] = useState<ProviderAvailability[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [isAddressManuallyEdited, setIsAddressManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTimeModifiable, setIsTimeModifiable] = useState(false);
  // Add state for existing bookings to prevent conflicts
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Add validation function
  const validateForm = (): boolean => {
    if (!formData.typeOfService.length) {
      toast.error(t("selectServiceType"));
      return false;
    }
    if (!formData.bookingDate) {
      toast.error(t("selectBookingDate"));
      return false;
    }
    if (!formData.proposedStartTime) {
      toast.error(t("selectProposedStartTime"));
      return false;
    }
    if (!formData.proposedEndTime) {
      toast.error(t("selectProposedEndTime"));
      return false;
    }
    if (!formData.serviceAddress) {
      toast.error(t("enterServiceAddress"));
      return false;
    }

    // Final validation for booking conflicts
    if (!isGeneralRequest && formData.proposedStartTime && formData.proposedEndTime && formData.bookingDate) {
      const hasConflict = hasBookingConflict(
        formData.proposedStartTime,
        formData.proposedEndTime,
        formData.bookingDate,
        existingBookings
      );
      if (hasConflict) {
        toast.error(t('bookingConflict') || 'This time slot conflicts with an existing booking. Please choose a different time.');
        return false;
      }
    }

    return true;
  };

  // Always fetch the latest client data using clientId from cookies
  const getUserData = async () => {
    const clientId = getCookie('clientId');
    const token = getCookie('token');

    if (!clientId || !token) {
      setUserData(null);
      toast.info(t('pleaseLoginToBook') || 'Please log in as a client to book a service.');
      return;
    }

    try {
      const response = await clientService.getClient(clientId);
      if (response && response.id) {
        setUserData(response);
        // Auto-fill address every time
        const address = (response.user || response).address?.[0];
        setFormData(prev => ({
          ...prev,
          serviceAddress: formatClientAddress(address),
        }));
      } else {
        setUserData(null);
        removeCookie('clientId');
        removeCookie('token');
        toast.error(t('userNotFound') || 'User not found.');
      }
    } catch (error: any) {
      setUserData(null);
      removeCookie('clientId');
      removeCookie('token');
      toast.error(error.message || t('userNotFound') || 'User not found.');
    }
  }

  // Fetch user data every time the sheet is opened
  useEffect(() => {
    if (open) {
      getUserData();
    }
  }, [open]);

  // ───── Helper: Get minimum hourly rate for input ─────
  const getMinHourlyRate = () => {
    if (isGeneralRequest) return 50;
    return providerData?.hourlyRate || 50;
  };

  // ───── Booking form state ─────
  const [formData, setFormData] = useState<BookingFormData>(() =>
    getInitialFormData(userData, providerData, isGeneralRequest, getMinHourlyRate)
  );

  const calculateTotalPrice = () => {
    if (!formData.proposedStartTime || !formData.proposedEndTime) return 0;

    const start = new Date(`2000-01-01T${formData.proposedStartTime}`);
    const end = new Date(`2000-01-01T${formData.proposedEndTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Ensure we don't return negative prices
    if (hours < 0) return 0;

    // Use agreed hourly price for general requests, otherwise use provider's rate
    const hourlyRate = isGeneralRequest ? formData.agreedHourlyPrice : (providerData?.hourlyRate || 0);
    return hours * hourlyRate;
  };

  useEffect(() => {

    const newTotalPrice = calculateTotalPrice();
    setTotalPrice(newTotalPrice);
  }, [formData.proposedStartTime, formData.proposedEndTime, providerData?.hourlyRate, formData.agreedHourlyPrice]);

  // Add availability fetching effect
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!providerData?.id || !formData.bookingDate) return;

      setIsLoadingAvailability(true);
      try {
        const availability = await checkProviderAvailability(providerData.id, formData.bookingDate);
        setProviderAvailability(availability);
      } catch (error) {
        console.error('Error fetching availability:', error);
        toast.error(t('availabilityFetchError') || 'Failed to fetch provider availability');
      } finally {
        setIsLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [providerData?.id, formData.bookingDate]);

  // Add existing bookings fetching effect
  useEffect(() => {
    const fetchExistingBookings = async () => {
      if (!providerData?.id || isGeneralRequest) return;

      setIsLoadingBookings(true);
      try {
        const bookings = await bookingService.getProviderBookings(providerData.id);
        setExistingBookings(bookings || []);
    
      } catch (error) {
        console.error('Error fetching existing bookings:', error);
        // Don't show error toast for this as it's not critical for the user experience
        setExistingBookings([]);
      } finally {
        setIsLoadingBookings(false);
      }
    };

    fetchExistingBookings();
  }, [providerData?.id, isGeneralRequest]);

  // Transform provider availability when providerData changes
  useEffect(() => {
    if (providerData?.availability) {
      const transformedAvailability = transformProviderAvailability(providerData.availability);
    }
  }, [providerData?.availability]);

  // Reset selected period when date or service type changes to re-evaluate availability
  useEffect(() => {
    if (formData.selectedPeriod && (formData.bookingDate || formData.typeOfService.length)) {
              // Check if the currently selected period is still available
        const selectedPeriod = timePeriods.find(p => p.label === formData.selectedPeriod);
        if (selectedPeriod && !isGeneralRequest) {
          const isProviderAvailable = availablePeriods.includes(selectedPeriod.label);
          const periodAvailability = isPeriodAvailable(
            selectedPeriod,
            formData.bookingDate,
            existingBookings,
            formData.typeOfService[0] || '' // Use first service type for availability check
          );

        // If the selected period is no longer available, reset it
        if (!isProviderAvailable || !periodAvailability.available) {
          setFormData(prev => ({
            ...prev,
            selectedPeriod: '',
            proposedStartTime: '',
            proposedEndTime: ''
          }));
          toast.info(t('periodNoLongerAvailable') || 'The selected time period is no longer available. Please choose a different period.');
        }
      }
    }
  }, [formData.bookingDate, formData.typeOfService, existingBookings, availablePeriods, isGeneralRequest]);

  const handleInputChange = (field: keyof BookingFormData, value: string | number | string[]) => {
    setFormData(prev => {
      const updates: Partial<BookingFormData> = { [field]: value };

      if (field === 'proposedStartTime' || field === 'proposedEndTime' || field === 'typeOfService') {
        const startTime = field === 'proposedStartTime' ? value as string : prev.proposedStartTime;
        const endTime = field === 'proposedEndTime' ? value as string : prev.proposedEndTime;
        const serviceType = field === 'typeOfService' ? value as string[] : prev.typeOfService;

        // Check availability for the selected time
        if (startTime && !isGeneralRequest) {
          const isAvailable = isTimeSlotAvailable(startTime, providerAvailability);
          if (!isAvailable) {
            toast.warning(t('timeSlotUnavailable') || 'This time slot is not available');
            return prev;
          }
        }

        // Validate end time is after start time
        if (startTime && endTime) {
          const startTimeObj = new Date(`2000-01-01T${startTime}`);
          const endTimeObj = new Date(`2000-01-01T${endTime}`);

          if (endTimeObj <= startTimeObj) {
            toast.error(t('endTimeMustBeAfterStartTime') || 'End time must be after start time');
            return prev;
          }

          // Check minimum duration (1 hour)
          const durationMinutes = (endTimeObj.getTime() - startTimeObj.getTime()) / (1000 * 60);
          if (durationMinutes < 60) {
            toast.error(t('minimumDurationOneHour') || 'Minimum booking duration is 1 hour');
            return prev;
          }
        }

        // Check for booking conflicts when both start and end times are set
        if (startTime && endTime && prev.bookingDate && !isGeneralRequest) {
          const hasConflict = hasBookingConflict(startTime, endTime, prev.bookingDate, existingBookings);
          if (hasConflict) {
            toast.error(t('bookingConflict') || 'This time slot conflicts with an existing booking. Please choose a different time.');
            return prev;
          }
        }
      }

      // If selectedPeriod changes, update proposedStartTime and proposedEndTime
      if (field === 'selectedPeriod') {
        const selectedPeriodObject = timePeriods.find(p => p.label === value);
        if (selectedPeriodObject) {
          updates.proposedStartTime = selectedPeriodObject.start;
          updates.proposedEndTime = selectedPeriodObject.end;
        }
      }

      // Track if serviceAddress is manually edited
      if (field === 'serviceAddress') {
        if (value !== (userData?.user?.address?.[0] ? formatClientAddress(userData.user.address[0]) : '')) {
          setIsAddressManuallyEdited(true);
        } else {
          setIsAddressManuallyEdited(false);
        }
      }

      return { ...prev, ...updates };
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Show preview dialog instead of direct submission
    setShowPreviewDialog(true);
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const clientIdFromCookie = getCookie('clientId') || '';
      const bookingData = {
        ...formData,
        clientId: clientIdFromCookie,
        status: "scheduled",
        providerId: isGeneralRequest ? undefined : providerData?.id,
        totalPrice: totalPrice.toFixed(2),
        createdAt: new Date().toISOString(),
      };

      const response = await fetch(`${API_BASE_URL}/booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error("Failed to create booking");
      }

      const responseData = await response.json();

      // Show success toast first
      toast.success(t(isGeneralRequest ? "requestSuccess" : "marketplace.booking.bookingSuccess"));

      // Close dialogs after a short delay to ensure toast is visible
      setTimeout(() => {
        setShowPreviewDialog(false); // Close preview dialog
        onOpenChange(false); // Close main booking sheet
        // Reset form data after successful submission
        setFormData(getInitialFormData(userData, providerData, isGeneralRequest, getMinHourlyRate));
        // Call onSuccess callback
        onSuccess(responseData);
      }, 500);

    } catch (error: any) {
      console.error("Booking error:", error);
      setError(error.message || t(isGeneralRequest ? "requestError" : "marketplace.booking.bookingError"));
      toast.error(t(isGeneralRequest ? "requestError" : "marketplace.booking.bookingError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Defensive: If userData is null, show a friendly message
  if (!userData) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-5xl overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <div className="text-center p-10 text-gray-600">
            {t('marketplace.booking.pleaseLoginToBook')}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[80vw] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
        <SheetHeader className="mb-8 border-b border-gray-100 pb-6 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-3 rounded-xl shadow-sm">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <SheetTitle className="text-3xl font-bold text-gray-800">
                  {isGeneralRequest ? t("marketplace.booking.generalRequestTitle") : t("marketplace.booking.title")}
                </SheetTitle>
                <SheetDescription className="text-gray-600 text-lg mt-1">
                  {isGeneralRequest
                    ? t("marketplace.booking.generalRequestTitle")
                    : t("bookingWithProvider", { name: providerData?.username })}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                {t("step")} 1/3
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="hover:bg-gray-100 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>
          </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                {t("marketplace.booking.selectDateTime")}
              </div>
              <div className="w-8 h-[1px] bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                {t("marketplace.booking.serviceDetails")}
              </div>
              <div className="w-8 h-[1px] bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                {t("marketplace.booking.confirmation")}
              </div>
            </div>
        </SheetHeader>

        {/* Provider Profile Card - Enhanced Design */}
        {!isGeneralRequest && providerData && (
          <div
            className="bg-gradient-to-r from-white to-teal-50 rounded-xl shadow-sm border border-teal-100 p-6 mb-8 cursor-pointer hover:shadow-md transition-all duration-300 group"
            onClick={() => navigate(`/provider/${providerData.id}`)}
            title={t('marketplace.providerCard.viewProfile')}
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center ring-4 ring-white shadow-lg">
                {providerData?.profileImage ? (
                  <img
                    src={
                      providerData.profileImage
                        ? `${API_BASE_URL}/${providerData.profileImage}`
                        : `/src/assets/img/provider.jpg`
                    }
                    alt={providerData?.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold text-teal-600">
                    {providerData?.username?.[0]?.toUpperCase() || 'P'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">{providerData?.username}</h3>
                  <div className="group relative inline-block">
                    <Info className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {providerData?.offeredServices?.slice(0, 3).map((service: string) => (
                    <span key={service} className="px-3 py-1 bg-teal-50 text-teal-700 text-sm rounded-full border border-teal-100">
                      {service}
                    </span>
                  ))}
                  {providerData?.offeredServices?.length > 3 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                      +{providerData.offeredServices.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-teal-600">{providerData?.hourlyRate} SEK</div>
                <div className="text-sm text-gray-500">{t('marketplace.providerCard.perHour')}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleBookingSubmit} className="space-y-6">
          <div className="space-y-6">
            {/* Date Selection */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-500" />
                {t("marketplace.booking.selectDate")}
                <div className="ml-2 group relative inline-block">
                  <Info className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                  <div className="pointer-events-none absolute z-10 w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("tooltips.bookingDate") || "Select your preferred date for the service. Available dates are shown in green."}
                  </div>
                </div>
              </label>
              <div className="flex gap-4 items-center">
                <CustomDatePicker
                  value={formData.bookingDate}
                  onChange={(date, periods) => {
                    handleInputChange("bookingDate", date);
                    setAvailablePeriods(periods || []);
                  }}
                  unavailableDates={providerAvailability
                    .filter(slot => !slot.isAvailable)
                    .map(slot => slot.date)}
                  providerAvailability={transformProviderAvailability(providerData?.availability || {})}
                  minDate={new Date()}
                  maxDate={addDays(new Date(), 30)}
                  className="w-full border-teal-500 rounded-lg"
                  isGeneralRequest={isGeneralRequest}
                />
              </div>
            </div>

            {/* Time Period Selection */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-500" />
                {t("selectTimePeriod")}
                <div className="ml-2 group relative inline-block">
                  <Info className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                  <div className="pointer-events-none absolute z-10 w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("tooltips.timePeriod") || "Choose a time period that works best for you. Available periods are highlighted."}
                  </div>
                </div>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {timePeriods.map((period) => {
                  const isProviderAvailable = availablePeriods.includes(period.label);
                  const periodAvailability = isPeriodAvailable(
                    period,
                    formData.bookingDate,
                    existingBookings,
                    formData.typeOfService[0] || '' // Use first service type for availability check
                  );
                  const isAvailable =
                    isProviderAvailable && periodAvailability.available && !isGeneralRequest;
                  const finalAvailable = isGeneralRequest || isAvailable;
                  const isSelected = formData.selectedPeriod === period.label;

                  let StatusIcon: React.ElementType = CheckCircle;
                  let statusText = "";
                  let statusClass = "";
                  let iconClass = "";

                  if (isGeneralRequest) {
                    statusText = t("available") || "Available";
                    statusClass =
                      "border border-gray-200 hover:border-teal-300 hover:bg-gray-50 hover:shadow-md";
                    iconClass = "text-teal-500";
                  } else if (!isProviderAvailable) {
                    StatusIcon = Ban;
                    statusText = t("providerUnavailable") || "Provider unavailable";
                    statusClass =
                      "bg-gray-100 border border-gray-300 text-gray-500 cursor-not-allowed";
                    iconClass = "text-gray-400";
                  } else if (!periodAvailability.available) {
                    StatusIcon = Ban;
                    statusText = t("fullyBooked") || "Fully booked";
                    statusClass =
                      "bg-red-50 border border-red-300 text-red-700 cursor-not-allowed";
                    iconClass = "text-red-500";
                  } else if (periodAvailability.conflictLevel === "partial") {
                    StatusIcon = AlertCircle;
                    statusText = t("partiallyAvailable") || "Partially available";
                    statusClass =
                      "bg-yellow-50 border border-yellow-300 text-yellow-700 hover:bg-yellow-100 hover:shadow-md";
                    iconClass = "text-yellow-500";
                  } else {
                    StatusIcon = CheckCircle;
                    statusText = t("available") || "Available";
                    statusClass =
                      "border border-gray-200 hover:border-teal-300 hover:bg-gray-50 hover:shadow-md";
                    iconClass = "text-teal-500";
                  }

                  if (isSelected && finalAvailable) {
                    statusClass = "border-2 border-teal-500 bg-teal-50 text-teal-700 shadow-lg";
                  }

                  return (
                    <button
                      key={period.label}
                      type="button"
                      onClick={() =>
                        finalAvailable &&
                        handleInputChange("selectedPeriod", period.label)
                      }
                      disabled={!finalAvailable}
                      className={`p-3 sm:p-4 rounded-xl transition-all duration-300 text-center flex flex-col justify-center items-center h-32 ${statusClass}`}
                    >
                      <div className="font-semibold text-base sm:text-lg">
                        {period.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {period.start} - {period.end}
                      </div>

                      {!isGeneralRequest && (
                        <div
                          className={`mt-auto pt-2 text-xs font-medium flex items-center gap-1.5 ${iconClass}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusText}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {availablePeriods.length === 0 && formData.bookingDate && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{t('noAvailablePeriods')}</span>
                </div>
              )}
            </div>

            {/* Time Selection */}
            {/* Time picker logic:
              - When a period is selected: use availableTimes to show only times within that period
              - When no period is selected: use disabledTimes to show all times except unavailable ones
              - For general requests: all times are available
            */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="space-y-4">
                {/* Existing bookings indicator */}
                {!isGeneralRequest && formData.bookingDate && existingBookings.length > 0 && (
                  <div className="mb-4">
                    {(() => {
                      const bookingsOnDate = existingBookings.filter(booking =>
                        booking.bookingDate === formData.bookingDate &&
                        ['scheduled', 'confirmed', 'in_progress'].includes(booking.status)
                      );

                      if (bookingsOnDate.length > 0) {
                        return (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-5 h-5 text-amber-600" />
                              <span className="text-sm font-medium text-amber-800">
                                {t('existingBookingsOnDate') || 'Existing bookings on this date'}
                              </span>
                            </div>
                            <div className="text-sm text-amber-700 space-y-1">
                              {bookingsOnDate.map((booking, index) => (
                                <div key={booking.id} className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                                  <span>{booking.proposedStartTime} - {booking.proposedEndTime}</span>
                                  <span className="text-xs text-amber-600 capitalize">({booking.status})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                {/* Loading indicator for existing bookings */}
                {isLoadingBookings && !isGeneralRequest && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <svg className="animate-spin h-4 w-4 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('checkingExistingBookings') || 'Checking existing bookings...'}</span>
                  </div>
                )}

                {/* Unavailable times indicator */}
                {!isGeneralRequest && formData.bookingDate && (
                  (() => {
                    const unavailableTimes = generateUnavailableTimes(existingBookings, providerAvailability, formData.bookingDate, isGeneralRequest, providerData);
                    if (unavailableTimes.length > 0) {
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              {t('unavailableTimesApplied') || 'Unavailable times are disabled'}
                            </span>
                          </div>
                          <div className="text-xs text-blue-700 mt-1">
                            {t('unavailableTimesDescription') || 'Some time slots are disabled due to existing bookings or provider unavailability'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()
                )}

                {/* Toggle button for time modification */}
                <button
                  type="button"
                  onClick={() => setIsTimeModifiable(!isTimeModifiable)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all duration-300 w-fit group ${isTimeModifiable
                      ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Clock className={`w-4 h-4 ${isTimeModifiable ? 'text-teal-500' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium">
                    {isTimeModifiable ? t("timeModificationEnabled") || "Time modification enabled" : t("modifyTime") || "Modify time manually"}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-teal-500" />
                      {t("startTime")}
                      <div className="ml-2 group relative inline-block">
                        <Info className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                        <div className="pointer-events-none absolute z-10 w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          {t("tooltips.startTime") || "Select when you want the service to begin. Make sure it's within the provider's available hours."}
                        </div>
                      </div>
                    </label>
                    <div className="space-y-3">
                      <CustomTimePicker
                        value={formData.proposedStartTime}
                        onChange={(time) => handleInputChange("proposedStartTime", time)}
                        minTime={BUSINESS_HOURS.start}
                        maxTime={BUSINESS_HOURS.end}
                        step={5}
                        className="w-full"
                        availableTimes={generateAvailableTimesForPeriod(formData.selectedPeriod || '', existingBookings, providerAvailability, formData.bookingDate, isGeneralRequest, providerData)}
                        isGeneralRequest={isGeneralRequest}
                        disabled={!isTimeModifiable}
                        disabledTimes={formData.selectedPeriod ? [] : generateUnavailableTimes(existingBookings, providerAvailability, formData.bookingDate, isGeneralRequest, providerData)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-teal-500" />
                      {t("endTime")}
                      <div className="ml-2 group relative inline-block">
                        <Info className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                        <div className="pointer-events-none absolute z-10 w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                          {t("tooltips.endTime") || "Select when you want the service to end. The duration must meet the minimum service time."}
                        </div>
                      </div>
                    </label>
                    {/* End time picker logic:
                      - Only shows times after the selected start time
                      - Respects period boundaries
                      - Ensures minimum service duration (1 hour)
                      - Excludes conflicting bookings
                    */}
                    <div className="space-y-3">
                      <CustomTimePicker
                        value={formData.proposedEndTime}
                        onChange={(time) => handleInputChange("proposedEndTime", time)}
                        minTime={formData.proposedStartTime || BUSINESS_HOURS.start}
                        maxTime={BUSINESS_HOURS.end}
                        step={5}
                        className="w-full"
                        availableTimes={generateAvailableEndTimes(formData.proposedStartTime, formData.selectedPeriod || '', existingBookings, providerAvailability, formData.bookingDate, isGeneralRequest, providerData)}
                        isGeneralRequest={isGeneralRequest}
                        disabled={!isTimeModifiable}
                        disabledTimes={formData.selectedPeriod ? [] : generateUnavailableTimes(existingBookings, providerAvailability, formData.bookingDate, isGeneralRequest, providerData)}
                      />
                      {formData.proposedStartTime && formData.typeOfService && (
                        <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                          Duration: {((new Date(`2000-01-01T${formData.proposedEndTime}`).getTime() -
                            new Date(`2000-01-01T${formData.proposedStartTime}`).getTime()) /
                            (1000 * 60 * 60)).toFixed(1)} hours
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Type */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              {/* Service type label and tooltip */}
              <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <List className="w-5 h-5 text-teal-500" />
                {t("serviceType")}
                <div className="ml-2 group relative inline-block">
                  <Info className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                  <div className="pointer-events-none absolute z-10 w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("tooltips.serviceType") || "Choose the type of service you need. Different services may have different durations and requirements."}
                  </div>
                </div>
              </label>
              {/* Multi-select checkboxes for services */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(isGeneralRequest ? servicesList : providerData?.offeredServices || []).map((service: string) => {
                  const checked = formData.typeOfService.includes(service);
                  const Icon = serviceIcons[service] || HelpCircle;
                  const description = serviceDescriptions[service] || t('noDescriptionAvailable') || 'No description available.';
                  return (
                    <label
                      key={service}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border cursor-pointer transition-all duration-200 text-base font-medium h-full ${checked ? 'bg-teal-50 border-teal-400 text-teal-700 shadow-lg' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            let newServices: string[];
                            if (checked) {
                              newServices = formData.typeOfService.filter((s) => s !== service);
                            } else {
                              newServices = [...formData.typeOfService, service];
                            }
                            handleInputChange("typeOfService", newServices);
                          }}
                          className="accent-teal-500 w-5 h-5 rounded border-gray-300"
                        />
                        <Icon className="w-6 h-6 text-teal-500 flex-shrink-0" />
                        <span className="font-semibold text-sm leading-tight">{service}</span>
                      </div>
                      <span className="text-xs text-gray-500 leading-relaxed pl-8">{description}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Expected Brings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-500" />
                {t("expectedBrings") || "Expected Brings"}
                <div className="ml-2 group relative inline-block">
                  <Info className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                  <div className="pointer-events-none absolute z-10 w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("tooltips.expectedBrings") || "Select what you expect the provider to bring for the service. This helps ensure the provider has the necessary equipment and supplies."}
                    {!isGeneralRequest && providerData?.serviceEnablers && (
                      <div className="mt-2 text-xs text-teal-600">
                        Showing only items this provider can bring.
                      </div>
                    )}
                    {isGeneralRequest && (
                      <div className="mt-2 text-xs text-blue-600">
                        Showing all available items for general requests.
                      </div>
                    )}
                  </div>
                </div>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.expectedBrings?.length === 0 && (
                  <div className="flex items-center gap-1 bg-gray-100 border border-gray-300 rounded-full px-3 py-1 shadow-sm text-gray-500">
                    <span className="text-sm font-medium">{t("Nothing") || "Nothing"}</span>
                  </div>
                )}
                {formData.expectedBrings?.map((item: string) => (
                  <div
                    key={item}
                    className="flex items-center gap-1 bg-teal-100 border border-teal-300 rounded-full px-3 py-1 shadow-sm"
                  >
                    <span className="text-sm font-medium">{t(`comboBox.serviceEnablers.${item}`) || item}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = formData.expectedBrings.filter((i: string) => i !== item);
                        handleInputChange("expectedBrings", newItems);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {/* Expected Brings Section */}
              {((providerData && Array.isArray(providerData.serviceEnablers) && providerData.serviceEnablers.length === 0)) && (
                <div className="text-sm text-orange-600 flex items-center gap-2 p-2 mb-2">
                  <Info className="w-4 h-4 text-orange-500" />
                  {t('noProviderEnablers') || 'This provider has not specified any items they can bring.'}
                </div>
              )}
              {/* Disable Combobox if special provider has nothing to bring */}
              <Combobox
                disabled={!!providerData && !isGeneralRequest && Array.isArray(providerData.serviceEnablers) && providerData.serviceEnablers.length === 0}
              >
                {/* Use provider's service enablers if available, otherwise use full list for general requests */}
                {((providerData && Array.isArray(providerData.serviceEnablers) && providerData.serviceEnablers.length > 0 ? providerData.serviceEnablers : serviceEnablersList) as string[]).map((item: string) => {
                  const isSelected = formData.expectedBrings?.includes(item);
                  // Simple icon mapping for demo; you can expand this as needed
                  const iconMap: Record<string, JSX.Element> = {
                    'Vacuum cleaner': <Package className="w-4 h-4 text-teal-500" />,
                    'Mop': <Move3D className="w-4 h-4 text-blue-500" />,
                    'Bucket': <Layers className="w-4 h-4 text-indigo-500" />,
                    'Microfiber cloth': <Sun className="w-4 h-4 text-yellow-500" />,
                    'Cleaning cloth / towel': <Home className="w-4 h-4 text-pink-500" />,
                    'All-purpose cleaner': <AlertCircle className="w-4 h-4 text-green-500" />,
                    'Glass cleaner': <Info className="w-4 h-4 text-cyan-500" />,
                    'Window squeegee': <CheckCircle className="w-4 h-4 text-blue-400" />,
                    'Duster': <Ban className="w-4 h-4 text-gray-400" />,
                    'Rubber gloves': <Package className="w-4 h-4 text-orange-500" />,
                    'Toilet bowl cleaner': <AlertCircle className="w-4 h-4 text-purple-500" />,
                    'Disinfectant': <AlertCircle className="w-4 h-4 text-red-500" />,
                  };
                  return (
                    <div
                      key={item}
                      className={`flex items-center gap-2 p-2 cursor-pointer border rounded-md hover:bg-gray-100 transition-colors ${isSelected ? "bg-teal-50 border-teal-300" : "border-gray-300"}`}
                      onClick={() => {
                        let newItems: string[];
                        if (isSelected) {
                          newItems = formData.expectedBrings.filter((i: string) => i !== item);
                        } else {
                          newItems = [...(formData.expectedBrings || []), item];
                        }
                        handleInputChange("expectedBrings", newItems);
                      }}
                    >
                      {iconMap[item] || <Package className="w-4 h-4 text-gray-400" />}
                      <span>{t(`comboBox.serviceEnablers.${item}`) || item}</span>
                    </div>
                  );
                })}
              </Combobox>
            </div>

            {/* Repeat */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-teal-500" />
                {t("repeat")}
                <div className="ml-2 group relative inline-block">
                  <Info className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                  <div className="pointer-events-none absolute z-10 w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("tooltips.repeat") || "Choose if you want this service to repeat. You can set it to repeat daily, weekly, or monthly."}
                  </div>
                </div>
              </label>
              <select
                value={formData.repeat}
                onChange={(e) => handleInputChange("repeat", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
              >
                <option value="none">{t("noRepeat")}</option>
                <option value="daily">{t("daily")}</option>
                <option value="weekly">{t("weekly")}</option>
                <option value="monthly">{t("monthly")}</option>
              </select>
            </div>

            {/* Service Address */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-500" />
                {t("serviceAddress")}
                <div className="ml-2 group relative inline-block">
                  <Info className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" />
                  <div className="pointer-events-none absolute z-10 w-64 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("tooltips.serviceAddress") || "The address where the service will be performed. You can edit your address in your profile settings."}
                  </div>
                </div>
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={formData.serviceAddress}
                    readOnly
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-gray-50 cursor-not-allowed"
                    placeholder={t("enterServiceAddress")}
                  />
                  <div className="group relative">
                    <Button
                      type="button"
                      variant="ghost"
                      className="p-3 hover:bg-teal-50 rounded-lg transition-all duration-200 hover:scale-105"
                      onClick={() => navigate('/register/client?step=2')}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-teal-500 group-hover:text-teal-600 transition-colors"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Button>
                    <div className="pointer-events-none absolute z-10 w-48 px-3 py-2 mt-2 text-sm text-gray-600 bg-white border rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity -right-2 top-full">
                      {t("tooltips.editAddressInProfile") || "Edit your address in profile settings"}
                    </div>
                  </div>
                </div>
                {userData && !isClientAddressComplete((userData.user || userData).address?.[0]) && (
                  <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">
                    {t('pleaseCompleteProfileForAddress') || 'Please complete your profile to use your address for booking.'}
                  </div>
                )}
              </div>
            </div>

            {/* Price Estimate */}
            <div className="bg-gradient-to-r from-teal-50 to-indigo-50 p-8 rounded-xl border border-teal-100 relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-100 to-transparent opacity-50 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-100 to-transparent opacity-50 rounded-full -ml-16 -mb-16"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900 text-xl flex items-center gap-2">
                    {t("priceEstimate")}
                  </h3>
                  <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-teal-100">
                    {t("estimatedTotal")}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-teal-100 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="text-gray-600 text-sm">{t("hourlyRate")}</span>
                          {!isGeneralRequest && (
                            <div className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                              {t("minimumRate")}: {providerData?.hourlyRate} SEK
                            </div>
                          )}
                        </div>
                        <div className="text-lg font-semibold text-teal-600">
                          {providerData?.hourlyRate ?? getMinHourlyRate()} SEK/hr
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-teal-100 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">{t("estimatedHours")}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {formData.proposedStartTime && formData.proposedEndTime
                            ? ((new Date(`2000-01-01T${formData.proposedEndTime}`).getTime() -
                              new Date(`2000-01-01T${formData.proposedStartTime}`).getTime()) /
                              (1000 * 60 * 60)).toFixed(1)
                            : "0"} {t("hours")}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-teal-600"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-teal-500 to-indigo-500 rounded-lg p-4 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{t("totalPrice")}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{totalPrice.toFixed(2)}</span>
                        <span className="text-sm opacity-80">SEK</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm opacity-80">
                      {t("priceIncludesVAT")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-8 py-3 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.01]"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="w-full py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("submitting")}
                </span>
              ) : (
                t("bookNow")
              )}
            </Button>
          </div>
        </form>
      </SheetContent>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-xl shadow-xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-gray-100">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("confirmBookingDetails")}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {t("pleaseReviewYourBooking")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            {/* Service Type */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl">
              <div className="p-2 bg-teal-100 rounded-lg">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t("serviceType")}</p>
                <p className="text-lg font-semibold text-gray-900">{formData.typeOfService.join(', ')}</p>
              </div>
            </div>

            {/* Expected Brings */}
            {formData.expectedBrings && formData.expectedBrings.length > 0 && (
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("expectedBrings")}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formData.expectedBrings.map(item => t(`comboBox.serviceEnablers.${item}`) || item).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-500">{t("date")}</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">{formData.bookingDate}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-500">{t("time")}</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.proposedStartTime} - {formData.proposedEndTime}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <div className="flex items-start gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("address")}</p>
                  <p className="text-lg font-semibold text-gray-900 break-words">{formData.serviceAddress}</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-500">{t("totalPrice")}</p>
                </div>
                <p className="text-2xl font-bold text-amber-700">{totalPrice.toFixed(2)} SEK</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-0 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
              className="flex-1 sm:flex-none border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("confirming")}
                </span>
              ) : (
                t("confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};

export default BookingSheet;