// Address type shared by client and provider, matching DB structure
export interface Address {
  // First name for the address (person receiving service)
  firstName: string;
  // Last name for the address
  lastName: string;
  // Country
  country: string;
  // City
  city: string;
  // Street address (full)
  streetAddress: string;
  // Floor number (optional)
  floor?: number;
  // Postal code
  postalCode: string;
  // Door code (optional)
  doorCode?: string;
  // Door phone (optional)
  doorPhone?: number;
  // Size in square meters (optional)
  size?: number;
  // Type of living (Apartment, House, etc.)
  typeOfLiving?: string;
  // Number of rooms (optional)
  numberOfRooms?: number;
} 