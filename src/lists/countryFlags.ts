export interface CountryData {
  name: string;
  code: string;
  language: string;  // Primary/official language
  priority?: boolean;
}

export const countryFlags: any = [
  // Prioritized European countries (only one per language)
  { name: "Sweden", code: "SE", language: "Swedish", priority: true },
  { name: "Germany", code: "DE", language: "German", priority: true },
  { name: "United Kingdom", code: "GB", language: "English", priority: true },
  { name: "France", code: "FR", language: "French", priority: true },
  { name: "Spain", code: "ES", language: "Spanish", priority: true },
  { name: "Italy", code: "IT", language: "Italian", priority: true },
  { name: "Netherlands", code: "NL", language: "Dutch", priority: true },
  { name: "Greece", code: "GR", language: "Greek", priority: true },
  { name: "Portugal", code: "PT", language: "Portuguese", priority: true },
  { name: "Denmark", code: "DK", language: "Danish", priority: true },
  { name: "Finland", code: "FI", language: "Finnish", priority: true },
  { name: "Norway", code: "NO", language: "Norwegian", priority: true },
  { name: "Iceland", code: "IS", language: "Icelandic", priority: true },
  { name: "Poland", code: "PL", language: "Polish", priority: true },
  { name: "Czech Republic", code: "CZ", language: "Czech", priority: true },
  { name: "Hungary", code: "HU", language: "Hungarian", priority: true },
  { name: "Slovakia", code: "SK", language: "Slovak", priority: true },
  { name: "Slovenia", code: "SI", language: "Slovene", priority: true },
  { name: "Croatia", code: "HR", language: "Croatian", priority: true },
  { name: "Bulgaria", code: "BG", language: "Bulgarian", priority: true },
  { name: "Romania", code: "RO", language: "Romanian", priority: true },
  { name: "Estonia", code: "EE", language: "Estonian", priority: true },
  { name: "Latvia", code: "LV", language: "Latvian", priority: true },
  { name: "Lithuania", code: "LT", language: "Lithuanian", priority: true },
  { name: "Belarus", code: "BY", language: "Belarusian", priority: true },
  { name: "Ukraine", code: "UA", language: "Ukrainian", priority: true },
  { name: "Russia", code: "RU", language: "Russian", priority: true },

  // Non-European countries (one per language)
  { name: "Afghanistan", code: "AF", language: "Pashto" },
  { name: "Albania", code: "AL", language: "Albanian" },
  { name: "Armenia", code: "AM", language: "Armenian" },
  { name: "Azerbaijan", code: "AZ", language: "Azerbaijani" },
  { name: "Bangladesh", code: "BD", language: "Bengali" },
  { name: "Bhutan", code: "BT", language: "Dzongkha" },
  { name: "Cambodia", code: "KH", language: "Khmer" },
  { name: "China", code: "CN", language: "Mandarin" },
  { name: "Ethiopia", code: "ET", language: "Amharic" },
  { name: "India", code: "IN", language: "Hindi" },
  { name: "Indonesia", code: "ID", language: "Indonesian" },
  { name: "Iran", code: "IR", language: "Persian" },
  { name: "Iraq", code: "IQ", language: "Arabic" },
  { name: "Israel", code: "IL", language: "Hebrew" },
  { name: "Japan", code: "JP", language: "Japanese" },
  { name: "Kazakhstan", code: "KZ", language: "Kazakh" },
  { name: "Korea", code: "KR", language: "Korean" }, // South Korea prioritized over North Korea
  { name: "Laos", code: "LA", language: "Lao" },
  { name: "Malaysia", code: "MY", language: "Malay" },
  { name: "Mongolia", code: "MN", language: "Mongolian" },
  { name: "Myanmar", code: "MM", language: "Burmese" },
  { name: "Nepal", code: "NP", language: "Nepali" },
  { name: "Pakistan", code: "PK", language: "Urdu" },
  { name: "Philippines", code: "PH", language: "Filipino" },
  { name: "Saudi Arabia", code: "SA", language: "Arabic" },
  { name: "Serbia", code: "RS", language: "Serbian" },
  { name: "Somalia", code: "SO", language: "Somali" },
  { name: "Sri Lanka", code: "LK", language: "Sinhala" },
  { name: "Switzerland", code: "CH", language: "German" }, // Retained as a European country
  { name: "Syria", code: "SY", language: "Arabic" },
  { name: "Thailand", code: "TH", language: "Thai" },
  { name: "Turkey", code: "TR", language: "Turkish" },
  { name: "Vietnam", code: "VN", language: "Vietnamese" },
];

// Helper function to get flag icon class
export const getFlagIconClass = (language: string): string => {
  const country = countryFlags.find(c => c.language === language);
  return country ? `fi fi-${country.code.toLowerCase()}` : "";
};

// Helper function to get country code
export const getCountryCode = (countryName: string): string => {
  const country = countryFlags.find(c => c.name === countryName);
  return country ? country.code : "";
};

// Helper function to get country language
export const getCountryLanguage = (countryName: string): string => {
  const country = countryFlags.find(c => c.name === countryName);
  return country ? country.language : "";
};

// Helper function to get prioritized countries
export const getPrioritizedCountries = (): string[] => {
  return countryFlags
    .filter(country => country.priority)
    .map(country => country.name);
};