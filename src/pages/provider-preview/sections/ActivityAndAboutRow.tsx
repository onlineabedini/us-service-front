//@collapse
// src/pages/provider-page/sections/ActivityAndAboutRow.tsx
import React from "react";
import ActivitySection from "./ActivitySection";
import AboutMeSection from "./AboutMeSection";

type ActivityAndAboutRowProps = {
  userData: any;
  onEdit: () => void;
};

const ActivityAndAboutRow: React.FC<ActivityAndAboutRowProps> = ({
  userData,
  onEdit,
}) => {
  // Short comment: Check if any sections have data to show (updated to match AboutMeSection)
  const hasAboutData = (Array.isArray(userData.languages) && userData.languages.length > 0) ||
                      (userData.citizenship && userData.citizenship.trim() !== '') ||
                      (Array.isArray(userData.serviceEnablers) && userData.serviceEnablers.length > 0);

  const hasActivityData = userData?.createdAt || userData?.id;

  // Short comment: If no data for either section, don't render the container
  if (!hasAboutData && !hasActivityData) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 rounded-3xl shadow-2xl p-10 mb-10 border border-white/80 overflow-hidden flex flex-col md:flex-row gap-6 mt-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.07)_0,transparent_60%),radial-gradient(circle_at_80%_80%,rgba(45,212,191,0.08)_0,transparent_70%)] pointer-events-none rounded-3xl z-0" />
      
      {/* Show activity section only if data exists */}
      {hasActivityData && (
        <div className="relative z-10 flex-1">
          <ActivitySection userData={userData} onEdit={onEdit} />
        </div>
      )}
      
      {/* Show about section only if data exists */}
      {hasAboutData && (
        <div className="relative z-10 flex-1">
          <AboutMeSection userData={userData} onEdit={onEdit} />
        </div>
      )}
    </div>
  );
};

export default ActivityAndAboutRow;
