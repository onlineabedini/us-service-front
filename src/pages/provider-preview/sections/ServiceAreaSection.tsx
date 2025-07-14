//@collapse
// src/pages/provider-page/sections/ServiceAreaSection.tsx
import React from "react";
import { Edit, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

type ServiceAreaSectionProps = {
  serviceArea: string[];
  onEdit?: () => void;
  canEdit?: boolean;
};

const ServiceAreaSection: React.FC<ServiceAreaSectionProps> = ({
  serviceArea,
  onEdit,
  canEdit = false,
}) => {
  const { t } = useTranslation();

  // Short comment: Hide entire section if no service areas exist
  if (!serviceArea || !Array.isArray(serviceArea) || serviceArea.length === 0) {
    return null;
  }

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3 border-l-4 border-purple-400 pl-3">
          <MapPin className="w-6 h-6 text-purple-500" />
          <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">{t("serviceAreas")}</h2>
        </div>
        {canEdit && onEdit && (
          <button
            onClick={onEdit}
            className="p-2 rounded-full hover:bg-purple-50 text-purple-600 opacity-0 group-hover:opacity-100 transition-all duration-300"
            title={t("edit")}
          >
            <Edit className="w-5 h-5" />
          </button>
        )}
      </div>
      <Separator className="my-4 bg-gray-200" />
      <div className="flex gap-3 flex-wrap mt-4">
        {serviceArea.map((area, i) => (
          <Badge
            key={i}
            className="bg-purple-100 hover:bg-purple-200 text-purple-800 border-none px-5 py-2 text-base font-semibold rounded-full shadow-md flex items-center gap-2 transition-all duration-200"
          >
            <MapPin className="w-4 h-4 text-purple-500" />
            {area}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ServiceAreaSection;
