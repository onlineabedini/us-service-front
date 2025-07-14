//@collapse
// src/pages/provider-page/sections/AvailabilitySection.tsx
import React from "react";
import { Edit } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import AvailabilityCalendar from "@/components/global/availabilityCalendar";
import { useTranslation } from "react-i18next";

type AvailabilitySectionProps = {
    availability: any;
    onEdit: () => void;
    canEdit?: boolean;
};

const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
    availability,
    onEdit,
    canEdit = false,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white mt-4 p-6 mx-4 rounded-md">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-700">
                    {t("availability")}
                </h2>
                {canEdit && (
                    <button
                        onClick={onEdit}
                        className="text-gray-600 hover:text-gray-800"
                        title={t("edit")}
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                )}
            </div>
            <Separator className="my-4" />
            <AvailabilityCalendar value={availability || {}} mode="view" />
        </div>
    );
};

export default AvailabilitySection;
