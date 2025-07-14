import React from "react";
import { Separator } from "@/components/ui/separator";
import OverviewSection from "./OverviewSection";
import OfferedServicesSection from "./OfferedServicesSection";
import ServiceAreaSection from "./ServiceAreaSection";

type OverviewAndDetailsProps = {
  description: string;
  offeredServices: string[];
  serviceArea?: string[];
  onEdit?: () => void;
  canEdit?: boolean;
};

const OverviewAndDetails: React.FC<OverviewAndDetailsProps> = ({
  description,
  offeredServices,
  serviceArea,
  onEdit,
  canEdit = false,
}) => {
  // Short comment: Check which sections have data to display
  const hasDescription = description && description.trim() !== "";
  const hasOfferedServices = Array.isArray(offeredServices) && offeredServices.length > 0;
  const hasServiceArea = Array.isArray(serviceArea) && serviceArea.length > 0;

  // Short comment: If no sections have data, don't render the container
  if (!hasDescription && !hasOfferedServices && !hasServiceArea) {
    return null;
  }

  // Short comment: Build array of sections to render
  const sectionsToRender = [];

  if (hasDescription) {
    sectionsToRender.push({
      key: 'overview',
      component: <OverviewSection description={description} onEdit={onEdit} canEdit={canEdit} />
    });
  }

  if (hasOfferedServices) {
    sectionsToRender.push({
      key: 'services',
      component: <OfferedServicesSection offeredServices={offeredServices} onEdit={onEdit} canEdit={canEdit} />
    });
  }

  if (hasServiceArea) {
    sectionsToRender.push({
      key: 'serviceArea',
      component: <ServiceAreaSection serviceArea={serviceArea} onEdit={onEdit} canEdit={canEdit} />
    });
  }

  return (
    <div className="relative bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 rounded-3xl shadow-2xl p-10 mb-10 border border-white/80 overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(94,234,212,0.08)_0,transparent_60%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.07)_0,transparent_70%)] pointer-events-none rounded-3xl z-0" />
      <div className="relative z-10 space-y-10">
        {sectionsToRender.map((section, index) => (
          <React.Fragment key={section.key}>
            <div className="transform hover:scale-[1.01] transition-transform duration-300">
              {section.component}
            </div>
            {/* Only add separator if not the last section */}
            {index < sectionsToRender.length - 1 && (
              <Separator className="bg-gray-200" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default OverviewAndDetails; 