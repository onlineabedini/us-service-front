//@collapse
// src/pages/provider-page/sections/ActivitySection.tsx
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Edit, Activity, Calendar, Users, MessageCircle, Clock, Star, Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";
import { bookingService } from "@/services/booking.service";

type ActivitySectionProps = {
  userData?: any;
  onEdit: () => void;
  canEdit?: boolean;
};

const ActivitySection: React.FC<ActivitySectionProps> = ({ userData, onEdit, canEdit = false }) => {
  const { t } = useTranslation();
  const [recentServiceTypes, setRecentServiceTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Short comment: Fetch recent service types from API when component mounts
  /**
   * Endpoint: GET /booking/provider/:id/recent-service-types
   * Description: Get the recent service types for a provider
   * @param id - provider id
   * @returns recent service types
   */
  useEffect(() => {
    const fetchRecentServiceTypes = async () => {
      if (!userData?.id) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await bookingService.getProviderRecentServiceTypes(userData.id);
        setRecentServiceTypes(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch recent service types');
        setRecentServiceTypes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentServiceTypes();
  }, [userData?.id]);

  const renderIcon = (Icon: React.ElementType) => (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600 shadow-sm">
      <Icon className="w-5 h-5" />
    </div>
  );

  const renderMetric = (value: string | number, type: 'neutral' | 'success' | 'info' = 'neutral') => {
    const styles = {
      neutral: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700',
      success: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700',
      info: 'bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${styles[type]}`}>
        {value}
      </span>
    );
  };

  // Short comment: Build activity rows based on available data
  const activityRows = [
    // Show member since only if user has registration date
    userData?.createdAt ? (
      <TableRow key="memberSince" className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-transparent transition-colors">
        <TableCell>{renderIcon(Calendar)}</TableCell>
        <TableCell className="font-medium">{t("memberSince")}</TableCell>
        <TableCell>{renderMetric(new Date(userData.createdAt).toLocaleDateString(), 'info')}</TableCell>
      </TableRow>
    ) : null,
    
    // Show latest activity with recent service types from API
    recentServiceTypes.length > 0 ? (
      <TableRow key="latestActivity" className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-transparent transition-colors">
        <TableCell>{renderIcon(Briefcase)}</TableCell>
        <TableCell className="font-medium">{t("latestActivity")}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-2">
            {recentServiceTypes.slice(0, 3).map((service: string, index: number) => (
              <span key={index} className="px-2 py-1 text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full shadow-sm">
                {service}
              </span>
            ))}
            {recentServiceTypes.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 rounded-full shadow-sm">
                +{recentServiceTypes.length - 3} more
              </span>
            )}
          </div>
        </TableCell>
      </TableRow>
    ) : isLoading ? (
      <TableRow key="latestActivityLoading" className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-transparent transition-colors">
        <TableCell>{renderIcon(Briefcase)}</TableCell>
        <TableCell className="font-medium">{t("latestActivity")}</TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-500"></div>
            <span className="text-sm text-gray-500">{t("loading")}</span>
          </div>
        </TableCell>
      </TableRow>
    ) : null,
  ].filter(Boolean);

  // Short comment: Hide entire section if no activity data available
  if (activityRows.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="group w-full bg-gradient-to-b from-white to-gray-50/50 p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.12]" />
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 border-l-4 border-teal-400 pl-3">
            <Activity className="w-6 h-6 text-teal-500" />
            <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">{t("activity")}</h2>
          </div>
          {canEdit && (
            <button
              onClick={onEdit}
              className="p-2 rounded-full hover:bg-teal-50 text-teal-600 opacity-0 group-hover:opacity-100 transition-all duration-300"
              title={t("edit")}
            >
              <Edit className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-sm">
          <Table className="text-sm [&_tr:last-child]:border-0">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-colors">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="font-semibold text-gray-700">{t("category")}</TableHead>
                <TableHead className="font-semibold text-gray-700">{t("details")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityRows.length > 0 ? activityRows : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-400">{t("noActivityData")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ActivitySection;
