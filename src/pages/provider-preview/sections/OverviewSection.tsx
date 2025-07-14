//@collapse
// src/pages/provider-page/sections/OverviewSection.tsx
import React from "react";
import { Edit, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import DOMPurify from 'dompurify';

type OverviewSectionProps = {
  description: string;
  onEdit?: () => void;
  canEdit?: boolean;
};

const OverviewSection: React.FC<OverviewSectionProps> = ({
  description,
  onEdit,
  canEdit = false,
}) => {
  const { t } = useTranslation();

  // Only render if description has value
  if (!description || description.trim() === "") return null;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3 border-l-4 border-teal-400 pl-3">
          <FileText className="w-6 h-6 text-teal-500" />
          <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">{t("overview")}</h2>
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
      {/* Render description as sanitized HTML */}
      <div
        className="text-gray-700 mt-4 leading-relaxed text-base"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
      />
    </div>
  );
};

export default OverviewSection;
