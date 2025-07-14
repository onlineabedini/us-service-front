//@collapse
// src/pages/provider-page/sections/OfferedServicesSection.tsx
import React from "react";
import { Edit, Briefcase } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

type OfferedServicesSectionProps = {
  offeredServices: string[];
  onEdit?: () => void;
  canEdit?: boolean;
};

const OfferedServicesSection: React.FC<OfferedServicesSectionProps> = ({
  offeredServices,
  onEdit,
  canEdit = false,
}) => {
  const { t } = useTranslation();

  // Only render if offeredServices is a non-empty array
  if (!offeredServices || !Array.isArray(offeredServices) || offeredServices.length === 0) return null;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3 border-l-4 border-teal-400 pl-3">
          <Briefcase className="w-6 h-6 text-teal-500" />
          <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">{t("offeredServices")}</h2>
        </div>
        {canEdit && onEdit && (
          <button
            onClick={onEdit}
            className="p-2 rounded-full hover:bg-teal-50 text-teal-600 opacity-0 group-hover:opacity-100 transition-all duration-300"
            title={t("edit")}
          >
            <Edit className="w-5 h-5" />
          </button>
        )}
      </div>
      <Separator className="my-4 bg-gray-200" />
      <div className="flex gap-3 flex-wrap mt-4">
        {offeredServices &&
          offeredServices.map((service, i) => (
            <Badge
              key={i}
              className="bg-teal-100 hover:bg-teal-200 text-teal-800 border-none px-5 py-2 text-base font-semibold rounded-full shadow-md flex items-center gap-2 transition-all duration-200"
            >
              <Briefcase className="w-4 h-4 text-teal-500" />
              {service}
            </Badge>
          ))}
      </div>
    </div>
  );
};

export default OfferedServicesSection;
