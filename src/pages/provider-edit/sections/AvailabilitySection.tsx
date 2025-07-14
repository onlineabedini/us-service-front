// src/pages/provider-edit/components/AvailabilitySection.tsx
import React, { memo } from "react";
import AvailabilityCalendar from "@/components/global/availabilityCalendar";
import { useTranslation } from "react-i18next";

interface AvailabilitySectionProps {
  availability: any;
  onAvailabilityChange: (updatedAvailability: any) => void;
}

const AvailabilitySection: React.FC<AvailabilitySectionProps> = memo(({ availability, onAvailabilityChange }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">{t("availability")}</h2>
      <AvailabilityCalendar
        value={availability || {}}
        onChange={onAvailabilityChange}
        mode="edit"
      />
    </div>
  );
});

export default AvailabilitySection;
