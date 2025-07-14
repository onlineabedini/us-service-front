// Custom time picker component with clock-like interface
// Supports disabled times based on existing bookings and provider availability
import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface CustomTimePickerProps {
  value: string;
  onChange: (time: string) => void;
  minTime?: string;
  maxTime?: string;
  step?: number;
  className?: string;
  availableTimes?: string[];
  isGeneralRequest?: boolean;
  disabled?: boolean;
  disabledTimes?: string[]; // Times that are unavailable due to existing bookings or provider unavailability
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  minTime = '00:00',
  maxTime = '23:59',
  step = 5,
  className = '',
  availableTimes = [],
  isGeneralRequest = false,
  disabled = false,
  disabledTimes = [],
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [activeSection, setActiveSection] = useState<'hours' | 'minutes'>('hours');
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize selected time from value
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      setSelectedHour(hours);
      setSelectedMinute(minutes);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate hours for 24-hour format
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate minutes (0-59)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  // Check if a time is available
  const isTimeAvailable = (hour: number, minute: number) => {
    if (isGeneralRequest) return true;
    
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Check if time is in disabledTimes
    if (disabledTimes.includes(time)) {
      return false;
    }
    
    // Check if time is in availableTimes (if provided)
    if (availableTimes.length > 0) {
      return availableTimes.includes(time);
    }
    
    // If no availableTimes provided, only check disabledTimes
    return true;
  };

  // Quick time presets
  const timePresets = [
    { label: 'Now', value: () => {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, '0')}:${Math.floor(now.getMinutes() / 5) * 5}`;
    }},
    { label: t('marketplace.providerCard.periods.morning'), value: '09:00' },
    { label: t('marketplace.providerCard.periods.noon'), value: '12:00' },
    { label: t('marketplace.providerCard.periods.afternoon'), value: '15:00' },
    { label: t('marketplace.providerCard.periods.night'), value: '18:00' },
  ];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, type: 'hours' | 'minutes') => {
    const currentValue = type === 'hours' ? selectedHour : selectedMinute;
    const maxValue = type === 'hours' ? 23 : 55;
    const step = type === 'hours' ? 1 : 5;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        const newValueUp = currentValue - step;
        if (newValueUp >= 0) {
          type === 'hours' ? setSelectedHour(newValueUp) : setSelectedMinute(newValueUp);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        const newValueDown = currentValue + step;
        if (newValueDown <= maxValue) {
          type === 'hours' ? setSelectedHour(newValueDown) : setSelectedMinute(newValueDown);
        }
        break;
      case 'Tab':
        e.preventDefault();
        setActiveSection(type === 'hours' ? 'minutes' : 'hours');
        break;
      case 'Enter':
        e.preventDefault();
        handleTimeSelect(selectedHour, selectedMinute);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Handle time selection
  const handleTimeSelect = (hour: number, minute: number) => {
    if (!isTimeAvailable(hour, minute) || disabled) return;
    
    const newTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(newTime);
    setIsOpen(false);
  };

  // Handle preset selection
  const handlePresetSelect = (preset: string | (() => string)) => {
    if (disabled) return;
    const time = typeof preset === 'function' ? preset() : preset;
    const [hours, minutes] = time.split(':').map(Number);
    handleTimeSelect(hours, minutes);
  };

  // Check if time is within range
  const isTimeInRange = (time: string) => {
    return time >= minTime && time <= maxTime;
  };

  // Calculate position for clock numbers
  const getClockPosition = (index: number, total: number, radius: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    return {
      left: `${50 + radius * Math.cos(angle)}%`,
      top: `${50 + radius * Math.sin(angle)}%`,
    };
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-5 py-3 text-gray-800 bg-white border border-gray-300 rounded-xl cursor-pointer shadow-sm hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-[1.01]",
          disabled && "opacity-50 cursor-not-allowed hover:border-gray-300 hover:scale-100"
        )}
      >
        <span className="text-lg font-semibold">
          {selectedHour.toString().padStart(2, '0')}:
          {selectedMinute.toString().padStart(2, '0')}
        </span>
        <svg
          className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[9999] w-full max-w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-200 origin-top top-full left-0 animate-fade-in-down">
          <div className="p-3">
            {/* Quick presets: smaller buttons */}
            <div className="flex flex-wrap gap-1 mb-2 justify-center">
              {timePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetSelect(preset.value)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-teal-100 text-gray-700 hover:text-teal-700 rounded-md transition-all duration-150 font-medium shadow-sm hover:shadow-md flex items-center gap-1"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Hours and Minutes selection: compact grid */}
            <div className="flex justify-between mb-2 gap-2">
              <div className="w-1/2 pr-1">
                <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Hours
                </h3>
                <div 
                  className="grid grid-cols-4 gap-1"
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, 'hours')}
                >
                  {hours.map((hour) => {
                    const isAvailable = isTimeAvailable(hour, selectedMinute);
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeSelect(hour, selectedMinute);
                        }}
                        disabled={!isAvailable}
                        className={`p-2 text-center font-semibold text-xs w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150
                          ${selectedHour === hour
                            ? "bg-teal-500 text-white shadow-md scale-105"
                            : isAvailable
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-sm"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"}
                          ${activeSection === 'hours' ? 'ring-2 ring-teal-400 ring-offset-1' : ''}`}
                      >
                        {hour.toString().padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="w-1/2 pl-1">
                <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Minutes
                </h3>
                <div 
                  className="grid grid-cols-4 gap-1"
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, 'minutes')}
                >
                  {minutes.map((minute) => {
                    const isAvailable = isTimeAvailable(selectedHour, minute);
                    return (
                      <button
                        key={minute}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeSelect(selectedHour, minute);
                        }}
                        disabled={!isAvailable}
                        className={`p-2 text-center font-semibold text-xs w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150
                          ${selectedMinute === minute
                            ? "bg-teal-500 text-white shadow-md scale-105"
                            : isAvailable
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-sm"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"}
                          ${activeSection === 'minutes' ? 'ring-2 ring-teal-400 ring-offset-1' : ''}`}
                      >
                        {minute.toString().padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Keyboard navigation hint: smaller text */}
            <div className="text-[10px] text-gray-400 mt-2 text-center">
              Use <span className="font-bold">Arrow Keys</span>, <span className="font-bold">Tab</span>, <span className="font-bold">Enter</span>, <span className="font-bold">Esc</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTimePicker; 