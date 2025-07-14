// Custom date picker component for booking sheets
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, addDays, isBefore, isAfter, isSameDay, getDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Period icons for visual indicators
const PERIOD_ICONS = {
  Morning: '🌅',
  Noon: '☀️',
  Afternoon: '🌤️',
  Evening: '🌙'
};

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string, availablePeriods?: string[]) => void;
  unavailableDates?: string[];
  providerAvailability?: {
    [key: string]: {
      [key: string]: boolean;
    };
  };
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  isGeneralRequest?: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  unavailableDates = [],
  providerAvailability = {},
  minDate = new Date(),
  maxDate = addDays(new Date(), 30),
  className = '',
  isGeneralRequest = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Get available periods for a given date
  const getAvailablePeriodsForDate = (date: Date): string[] => {
    // For general requests, return all periods
    if (isGeneralRequest) {
      return ['Morning', 'Noon', 'Afternoon', 'Evening'];
    }

    const dayOfWeek = getDay(date);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    const periods = providerAvailability[dayName] || {};

    return Object.keys(periods).filter(period => periods[period]);
  };

  // Check if a day of the week is available
  const isDayOfWeekAvailable = (date: Date) => {
    // For general requests, all days are available
    if (isGeneralRequest) {
      return true;
    }

    const dayOfWeek = getDay(date);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    const periods = providerAvailability[dayName] || {};
    
    // Check if any time slot is available for this day
    const hasAvailablePeriod = Object.values(periods).some(isAvailable => isAvailable);
    return hasAvailablePeriod;
  };

  // Check if a date is unavailable
  const isDateUnavailable = (date: Date) => {
    return unavailableDates.some(unavailableDate => 
      isSameDay(new Date(unavailableDate), date)
    );
  };

  // Check if a date is selectable
  const isDateSelectable = (date: Date) => {
    // For general requests, only check date range and unavailable dates
    if (isGeneralRequest) {
      const isInRange = !isBefore(date, minDate) && !isAfter(date, maxDate);
      const isUnavailable = isDateUnavailable(date);
      return isInRange && !isUnavailable;
    }

    // For provider bookings, check availability as well
    const isInRange = !isBefore(date, minDate) && !isAfter(date, maxDate);
    const isUnavailable = isDateUnavailable(date);
    const hasAvailablePeriods = isDayOfWeekAvailable(date);

    // If we have no provider availability data, allow all dates
    if (!providerAvailability || Object.keys(providerAvailability).length === 0) {
      return isInRange && !isUnavailable;
    }

    return isInRange && !isUnavailable && hasAvailablePeriods;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isDateSelectable(date)) {
      setSelectedDate(date);
      const availablePeriods = getAvailablePeriodsForDate(date);
      onChange(format(date, 'yyyy-MM-dd'), availablePeriods);
      setIsOpen(false);
    }
  };

  // Handle month navigation
  const handleMonthChange = (increment: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days: (Date | null)[] = [];
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      days.push(date);
    }

    return days;
  };

  // Get tooltip content for a date
  const getDateTooltip = (date: Date) => {
    if (isDateUnavailable(date)) {
      return t('dateUnavailable');
    }
    if (isBefore(date, minDate)) {
      return t('dateTooEarly');
    }
    if (isAfter(date, maxDate)) {
      return t('dateTooLate');
    }
    const availablePeriods = getAvailablePeriodsForDate(date);
    if (availablePeriods.length === 0) {
      return t('noAvailability');
    }
    return (
      <div className="space-y-2">
        <div className="font-medium">{format(date, 'EEEE, MMMM d')}</div>
        <div className="flex flex-wrap gap-2">
          {availablePeriods.map(period => (
            <div key={period} className="flex items-center gap-1.5 bg-gray-800/10 px-2 py-1 rounded-md">
              <span className="text-xs">{PERIOD_ICONS[period as keyof typeof PERIOD_ICONS]}</span>
              <span className="text-xs">{period}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-5 py-3 text-gray-800 bg-white border border-gray-300 rounded-xl cursor-pointer shadow-sm hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-[1.01]"
      >
        <Calendar className="mr-3 h-6 w-6 text-teal-600" />
        <span className="text-lg font-semibold flex-grow text-left">
          {value ? format(new Date(value), 'PPP') : t('selectDate')}
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
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 bg-white rounded-xl shadow-2xl p-5 z-50 border border-gray-200 transform transition-all duration-300 ease-in-out origin-top animate-fade-in-down">
          {/* Month and Year Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleMonthChange(-1)}
                className="h-8 w-8 p-0 rounded-lg hover:bg-teal-50 text-gray-700 hover:text-teal-700 transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <button
                type="button"
                onClick={() => handleMonthChange(1)}
                className="h-8 w-8 p-0 rounded-lg hover:bg-teal-50 text-gray-700 hover:text-teal-700 transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-700 py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {generateCalendarDays().map((date, index) => {
              if (!date) return <div key={index} className="aspect-square" />;
              
              const isAvailable = isDateSelectable(date);
              const isUnavailable = isDateUnavailable(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isHovered = hoveredDate && isSameDay(date, hoveredDate);
              const isToday = isSameDay(date, new Date());
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={`
                    w-14 h-14 flex items-center justify-center text-lg font-semibold relative transition-all duration-200 rounded-full border border-gray-300
                    ${isUnavailable ? 'bg-red-50 text-red-400 cursor-not-allowed opacity-70' : ''}
                    ${isSelected ? 'bg-teal-500 text-white shadow-md transform scale-105' : ''}
                    ${!isAvailable && !isUnavailable ? 'text-gray-400 cursor-not-allowed opacity-50' : ''}
                    ${isAvailable && !isSelected ? 'text-gray-800 hover:bg-teal-50 hover:text-teal-700 hover:shadow-sm' : ''}
                    ${isToday && !isSelected ? 'ring-2 ring-teal-500 ring-offset-1' : ''}
                  `}
                >
                  {format(date, 'd')}
                  {isAvailable && !isSelected && !isToday && (
                    <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" title="Available">
                    </div>
                  )}
                  {isHovered && !isUnavailable && isAvailable && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-10 group-hover:block hidden">
                      {getDateTooltip(date)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker; 