import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n, { i18nReady } from "../../i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FiGlobe } from "react-icons/fi";
import { getFlagIconClass } from "@/lists/countryFlags";
import { useNavigate } from "react-router-dom";

// Language configuration
interface Language {
  code: string;
  name: string;
  countryCode: string;
}

const SUPPORTED_LANGUAGES: readonly Language[] = [
  { code: "sv", name: "Swedish", countryCode: "SE" },
  { code: "de", name: "German", countryCode: "DE" },
  { code: "en", name: "English", countryCode: "GB" },
  { code: "ar", name: "Arabic", countryCode: "SA" },
  { code: "es", name: "Spanish", countryCode: "ES" },
  { code: "fr", name: "French", countryCode: "FR" },
  { code: "hi", name: "Hindi", countryCode: "IN" },
  { code: "it", name: "Italian", countryCode: "IT" },
  { code: "ja", name: "Japanese", countryCode: "JP" },
  { code: "ko", name: "Korean", countryCode: "KR" },
  { code: "nl", name: "Dutch", countryCode: "NL" },
  { code: "pl", name: "Polish", countryCode: "PL" },
  { code: "pt", name: "Portuguese", countryCode: "PT" },
  { code: "ru", name: "Russian", countryCode: "RU" },
  { code: "th", name: "Thai", countryCode: "TH" },
  { code: "tr", name: "Turkish", countryCode: "TR" },
  { code: "uk", name: "Ukrainian", countryCode: "UA" },
  { code: "ur", name: "Urdu", countryCode: "PK" },
  { code: "zh", name: "Chinese", countryCode: "CN" }
] as const;

// Language selector trigger button with improved styling using react-icons/fi
const LanguageTrigger: React.FC<{ selectedLanguage: string }> = ({ selectedLanguage }) => {
  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-md hover:from-teal-500 hover:to-teal-600 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm hover:shadow-md">
      <span className={`fi fi-${currentLang.countryCode.toLowerCase()} w-4 h-4 rounded-sm shadow-sm`} />
      <span className="font-medium">{currentLang.code}</span>
    </div>
  );
};

// Language menu items with enhanced design and transition effects
const LanguageItems: React.FC<{ onLanguageSelect: (code: string) => void }> = ({ onLanguageSelect }) => {
  const { t } = useTranslation();
  return (
    <>
      <DropdownMenuLabel className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-600 text-transparent bg-clip-text">Select Language</DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-gray-200" />
      {SUPPORTED_LANGUAGES.map(({ code, name, countryCode }) => (
        <DropdownMenuItem
          key={code}
          onClick={() => onLanguageSelect(code)}
          className="flex items-center gap-3 px-4 py-2 text-gray-700 cursor-pointer hover:bg-teal-50 hover:text-teal-700 transition-colors"
        >
          <span className={`fi fi-${countryCode.toLowerCase()} w-4 h-4 rounded-sm shadow-sm`} />
          <span className="text-lg">{t(`languagesFullList.${code}`, name)}</span>
        </DropdownMenuItem>
      ))}
    </>
  );
};

// Function to get current language from localStorage
const getCurrentLanguageFromStorage = (): string => {
  return localStorage.getItem('i18nextLng') || 'sv';
};

// Main component
const ChangeLang: React.FC = () => {
  const { i18n, ready } = useTranslation();
  const navigate = useNavigate();
  
  // Initialize with language from localStorage
  const [selectedLanguage, setSelectedLanguage] = useState(() => getCurrentLanguageFromStorage());
  const [isInitialized, setIsInitialized] = useState(false);

  // Wait for i18n to be ready and ensure proper initialization
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Wait for i18n to be ready
        await i18nReady;
        
        // Get the current language from localStorage
        const storedLang = getCurrentLanguageFromStorage();
        
        // If i18n language doesn't match stored language, update i18n
        if (i18n.language !== storedLang) {
          await i18n.changeLanguage(storedLang);
        }
        
        // Update component state
        setSelectedLanguage(storedLang);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize language:', error);
        // Fallback to Swedish if initialization fails
        setSelectedLanguage('sv');
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, [i18n]);

  // Listen for language changes and update localStorage
  useEffect(() => {
    const handleLanguageChange = () => {
      const currentLang = i18n.language || 'sv';
      setSelectedLanguage(currentLang);
      // Ensure localStorage is updated
      localStorage.setItem('i18nextLng', currentLang);
    };

    // Listen for language change events
    i18n.on('languageChanged', handleLanguageChange);
    
    // Cleanup listener
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Sync with i18n language changes from other sources
  useEffect(() => {
    if (ready && i18n.language && i18n.language !== selectedLanguage) {
      setSelectedLanguage(i18n.language);
    }
  }, [i18n.language, ready, selectedLanguage]);

  // Handle language change
  const handleLanguageChange = async (code: string) => {
    try {
      // Update localStorage immediately
      localStorage.setItem('i18nextLng', code);
      
      // Update component state immediately for UI responsiveness
      setSelectedLanguage(code);
      
      // Change i18n language (this will trigger the languageChanged event)
      await i18n.changeLanguage(code);
      
      // Force reload translations to ensure they're up to date
      await i18n.reloadResources();
    } catch (error) {
      console.error('Failed to change language:', error);
      // Revert to previous language on error
      const storedLang = getCurrentLanguageFromStorage();
      setSelectedLanguage(storedLang);
    }
  };

  // Show loading state while initializing
  if (!isInitialized || !ready) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-300 text-gray-600 rounded-md animate-pulse">
        <FiGlobe className="w-4 h-4" />
        <span className="font-medium">...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <LanguageTrigger selectedLanguage={selectedLanguage} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white/95 backdrop-blur-sm shadow-lg rounded-md border border-gray-200 min-w-[200px] transition-all duration-300 max-h-[400px] overflow-y-auto">
        <LanguageItems onLanguageSelect={handleLanguageChange} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChangeLang;
