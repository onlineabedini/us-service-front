//@collapse
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const periodsOfDay = ['Morning', 'Noon', 'Afternoon', 'Night'];

function createEmptyAvailability() {
  const availability: Record<string, Record<string, boolean>> = {};
  daysOfWeek.forEach(day => {
    availability[day] = {};
    periodsOfDay.forEach(period => {
      availability[day][period] = false;
    });
  });
  return availability;
}

interface DefineAvailabilityCalendarProps {
  value?: Record<string, Record<string, boolean>>;
  onChange?: (availability: Record<string, Record<string, boolean>>) => void;
  mode?: 'edit' | 'view';
}

const DefineAvailabilityCalendar: React.FC<DefineAvailabilityCalendarProps> = ({
  value,
  onChange,
  mode = 'view'
}) => {
  const { t } = useTranslation();
  const [availability, setAvailability] = useState(
    value || createEmptyAvailability()
  );

  useEffect(() => {
    setAvailability(value || createEmptyAvailability());
  }, [value]);

  const toggleSlot = (day: string, period: string) => {
    if (mode === 'view') return;
    setAvailability(prev => {
      const updated = {
        ...prev,
        [day]: {
          ...prev[day],
          [period]: !prev[day][period]
        }
      };
      onChange?.(updated);
      return updated;
    });
  };

  const toggleDay = (day: string) => {
    if (mode === 'view') return;
    const currentState = periodsOfDay.every(period => availability[day][period]);
    setAvailability(prev => {
      const updated = {
        ...prev,
        [day]: Object.fromEntries(
          periodsOfDay.map(period => [period, !currentState])
        )
      };
      onChange?.(updated);
      return updated;
    });
  };

  return (
    <div className="max-w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-5 gap-3">
        {/* Header row */}
        <div className="col-span-1" /> {/* Empty cell for alignment */}
        {periodsOfDay.map(period => (
          <div
            key={period}
            className="text-center text-[0.65rem] font-medium text-gray-500 uppercase tracking-wider"
          >
            {period === 'Morning' ? t('marketplace.providerCard.periods.morning').slice(0, 4) :
              period === 'Afternoon' ? t('marketplace.providerCard.periods.afternoon').slice(0, 4) :
                period === 'Night' ? t('marketplace.providerCard.periods.night').slice(0, 4) : 
                t('marketplace.providerCard.periods.noon').slice(0, 4)}
          </div>
        ))}

        {/* Rows for each day */}
        {daysOfWeek.map(day => (
          <React.Fragment key={day}>
            <button
              type="button"
              onClick={() => toggleDay(day)}
              disabled={mode === 'view'}
              className={`
                flex items-center justify-start px-2 py-1.5 rounded-lg
                transition-all duration-200 font-medium
                ${mode === 'edit' 
                  ? 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer' 
                  : 'cursor-default'}
                ${periodsOfDay.every(period => availability[day][period])
                  ? 'text-teal-600 bg-teal-50'
                  : 'text-gray-700'}
              `}
            >
              {day === 'Mon' ? t('marketplace.providerCard.days.mon') :
               day === 'Tue' ? t('marketplace.providerCard.days.tue') :
               day === 'Wed' ? t('marketplace.providerCard.days.wed') :
               day === 'Thu' ? t('marketplace.providerCard.days.thu') :
               day === 'Fri' ? t('marketplace.providerCard.days.fri') :
               day === 'Sat' ? t('marketplace.providerCard.days.sat') :
               day === 'Sun' ? t('marketplace.providerCard.days.sun') : day}
            </button>

            {periodsOfDay.map(period => (
              <button
                key={period}
                type="button"
                onClick={() => toggleSlot(day, period)}
                disabled={mode === 'view'}
                className={`
                  w-12 h-8 flex items-center justify-center 
                  rounded-lg transition-all duration-200
                  transform hover:scale-105 active:scale-95
                  ${availability[day][period]
                    ? 'bg-teal-500 text-white shadow-sm hover:bg-teal-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                  ${mode === 'edit' ? 'cursor-pointer' : 'cursor-default'}
                  relative
                `}
                aria-label={`${day} ${period} availability`}
              >
                <span className="font-medium text-xs">
                  {availability[day][period] ? '✓' : '—'}
                </span>
                {mode === 'edit' && (
                  <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-gray-200/50" />
                )}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      {mode === 'edit' && (
        <div className="mt-4 flex items-center justify-end gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-sm" />
            <span className="text-[0.65rem] font-medium">{t('marketplace.providerCard.available')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200 shadow-sm" />
            <span className="text-[0.65rem] font-medium">{t('marketplace.providerCard.unavailable')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefineAvailabilityCalendar;
