import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

// Function to get stored language from localStorage
const getStoredLanguage = () => {
  const stored = localStorage.getItem('i18nextLng');
  return stored || 'sv';
};

// Initialize i18n with proper configuration
const initI18n = async () => {
  return i18n
    .use(HttpBackend) // Load translations from the backend (public/locales)
    .use(LanguageDetector) // Detects user language
    .use(initReactI18next) // Bind React with i18next
    .init({
      // Always use stored language or Swedish as default
      lng: getStoredLanguage(),
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng'
      },
      supportedLngs: ['sv', 'en', 'de', 'ar', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'th', 'tr', 'uk', 'ur', 'zh'], // Only allow supported languages
      ns: ["translation"], // Namespaces for translations
      fallbackLng: "sv", // Fallback language
      debug: false, // Set to false in production
      interpolation: {
        escapeValue: false, // React already protects against XSS
      },
      backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json", // Translation file path
        requestOptions: {
          cache: 'no-cache' // Prevent caching issues
        }
      },
      react: {
        useSuspense: false // Disable suspense to prevent loading issues
      },
      // Wait for translations to load before considering initialization complete
      initImmediate: false,
    });
};

// Export a promise that resolves when i18n is ready
export const i18nReady = initI18n();

export default i18n;
