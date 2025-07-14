import React from "react";
import { useTranslation } from "react-i18next";

// Constants for calendar configuration
const CALENDAR_CONFIG = {
  DAYS: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const,
  TIMES: ["Morning", "Noon", "Afternoon", "Night"] as const,
};

// Types
type TimeSlot = typeof CALENDAR_CONFIG.TIMES[number];
type DaySlot = typeof CALENDAR_CONFIG.DAYS[number];
type Availability = Record<TimeSlot, Record<DaySlot, boolean>>;

interface AvailabilityCalendarProps {
  value: Availability; // Controlled value from parent
  onChange?: (availability: Availability) => void; // Callback to update parent
  mode?: "edit" | "view"; // Mode to toggle editability
}

// Helper function to create default availability structure
const createDefaultAvailability = (): Availability => {
  const defaultAvailability: Availability = {} as Availability;
  
  CALENDAR_CONFIG.TIMES.forEach(time => {
    defaultAvailability[time] = {} as Record<DaySlot, boolean>;
    CALENDAR_CONFIG.DAYS.forEach(day => {
      defaultAvailability[time][day] = false;
    });
  });
  
  return defaultAvailability;
};

// Helper function to validate and normalize availability data
const normalizeAvailability = (data: any): Availability => {
  if (!data || typeof data !== 'object') {
    return createDefaultAvailability();
  }

  const normalized: Availability = {} as Availability;
  
  CALENDAR_CONFIG.TIMES.forEach(time => {
    normalized[time] = {} as Record<DaySlot, boolean>;
    CALENDAR_CONFIG.DAYS.forEach(day => {
      // Check if the data exists and is boolean, otherwise default to false
      normalized[time][day] = typeof data[time]?.[day] === 'boolean' ? data[time][day] : false;
    });
  });
  
  return normalized;
};

// Helper Components
const AnimatedCheck: React.FC = () => (
  <svg
    className="w-4 h-4 animate-pulse"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const TimeSlotButton: React.FC<{
  isSelected: boolean;
  onClick: () => void;
  isEditable: boolean;
  label: string;
}> = ({ isSelected, onClick, isEditable, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      w-8 h-8 flex items-center justify-center rounded-xl border transition-all duration-200
      ${isSelected
        ? "bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 border-teal-600 text-white shadow-lg animate-glow"
        : "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-200 text-gray-400"}
      ${isEditable ? "hover:scale-105 hover:border-teal-400 hover:shadow-md" : "cursor-default"}
    `}
    aria-label={label}
    disabled={!isEditable}
    style={{ boxShadow: isSelected ? '0 0 8px 2px rgba(20,184,166,0.18)' : undefined }}
  >
    {isSelected && <AnimatedCheck />}
  </button>
);

// Main Component
const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  value,
  onChange,
  mode = "view",
}) => {
  const { t } = useTranslation();

  // Normalize the availability data to ensure it has the correct structure
  const normalizedValue = React.useMemo(() => normalizeAvailability(value), [value]);

  // Handle slot toggle
  const toggleSlot = (time: TimeSlot, day: DaySlot) => {
    if (mode === "view" || !onChange) return;

    const newAvailability = {
      ...normalizedValue,
      [time]: {
        ...normalizedValue[time],
        [day]: !normalizedValue[time][day], // Toggle the specific slot
      },
    };

    onChange(newAvailability); // Notify parent of the change
  };

  // Main card container - increased max width for profile card
  return (
    <div className="w-full max-w-lg rounded-3xl shadow-2xl border border-white/70 p-6 flex flex-col items-center justify-center mx-auto bg-gradient-to-br from-teal-50 via-teal-100 to-white relative overflow-hidden">
      {/* Decorative blurred background circles */}
      <div className="absolute -top-16 -left-16 w-40 h-40 bg-teal-200/30 rounded-full blur-2xl z-0" />
      <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-teal-300/20 rounded-full blur-2xl z-0" />
      {/* Title */}
      <h3 className="text-xl font-extrabold text-teal-700 mb-4 text-center z-10 drop-shadow-sm tracking-tight">
        {t('availability', 'Availability')}
      </h3>
      {/* Calendar Table */}
      <div className="overflow-x-auto w-full z-10">
        <table className="min-w-full border-collapse text-center">
          <thead>
            <tr>
              <th className="p-2"></th>
              {CALENDAR_CONFIG.DAYS.map((day) => (
                <th key={day} className="text-teal-700 text-xs font-bold pb-2 px-2 tracking-wide">
                  {t(`calendar.days.${day.toLowerCase()}`, day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CALENDAR_CONFIG.TIMES.map((time) => (
              <tr key={time} className="border-t border-teal-100">
                <td className="font-semibold text-teal-700 text-xs py-2 pr-2">
                  {t(`calendar.times.${time.toLowerCase()}`, time)}
                </td>
                {CALENDAR_CONFIG.DAYS.map((day) => (
                  <td key={day} className="p-1 text-center">
                    <TimeSlotButton
                      isSelected={normalizedValue[time][day]}
                      onClick={() => toggleSlot(time, day)}
                      isEditable={mode === "edit"}
                      label={`${t(`calendar.days.${day.toLowerCase()}`, day)} ${t(`calendar.times.${time.toLowerCase()}`, time)}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend with icons and better spacing */}
      <div className="mt-6 flex items-center justify-center gap-8 text-teal-700 z-10">
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 shadow-md border-2 border-white" />
          <span className="text-xs font-semibold">{t('available', 'Available')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full bg-gray-200 shadow-inner border-2 border-white" />
          <span className="text-xs font-semibold">{t('unavailable', 'Unavailable')}</span>
        </div>
      </div>
      {/* Subtle animation for available slots */}
      <style>{`
        .animate-glow {
          animation: glow 1.5s infinite alternate;
        }
        @keyframes glow {
          0% { box-shadow: 0 0 0 0 rgba(20,184,166,0.18); }
          100% { box-shadow: 0 0 12px 4px rgba(20,184,166,0.22); }
        }
      `}</style>
    </div>
  );
};

export default AvailabilityCalendar;