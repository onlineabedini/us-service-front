//@collapse
// src/pages/provider-page/sections/AboutMeSection.tsx
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Edit, User2, Car, Cigarette, Languages, GraduationCap, Briefcase, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

type AboutMeSectionProps = {
  userData: any;
  onEdit: () => void;
  canEdit?: boolean;
};

const AboutMeSection: React.FC<AboutMeSectionProps> = ({ userData, onEdit, canEdit = false }) => {
  const { t } = useTranslation();

  const renderIcon = (Icon: React.ElementType) => (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600 shadow-sm">
      <Icon className="w-5 h-5" />
    </div>
  );

  // Short comment: Build array of rows only for fields that exist and have values
  const aboutRows = [
    // Show driver license only if value exists
    // userData.carLicense !== undefined && userData.carLicense !== null ? (
    //   <TableRow key="carLicense" className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-transparent transition-colors">
    //     <TableCell>{renderIcon(Car)}</TableCell>
    //     <TableCell className="font-medium">{t("driverLicense")}</TableCell>
    //     <TableCell>
    //       <span className={`px-3 py-1 rounded-full text-sm ${userData.carLicense ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700' : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700'}`}>
    //         {userData.carLicense ? t("yes") : t("no")}
    //       </span>
    //     </TableCell>
    //   </TableRow>
    // ) : null,
    
    // // Show car only if value exists
    // userData.car !== undefined && userData.car !== null ? (
    //   <TableRow key="car" className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-transparent transition-colors">
    //     <TableCell>{renderIcon(Car)}</TableCell>
    //     <TableCell className="font-medium">{t("car")}</TableCell>
    //     <TableCell>
    //       <span className={`px-3 py-1 rounded-full text-sm ${userData.car ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700' : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700'}`}>
    //         {userData.car ? t("yes") : t("no")}
    //       </span>
    //     </TableCell>
    //   </TableRow>
    // ) : null,
    
    // // Show smoke only if value exists
    // userData.smoke !== undefined && userData.smoke !== null ? (
    //   <TableRow key="smoke" className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-transparent transition-colors">
    //     <TableCell>{renderIcon(Cigarette)}</TableCell>
    //     <TableCell className="font-medium">{t("smoke")}</TableCell>
    //     <TableCell>
    //       <span className={`px-3 py-1 rounded-full text-sm ${userData.smoke ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700' : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700'}`}>
    //         {userData.smoke ? t("yes") : t("no")}
    //       </span>
    //     </TableCell>
    //   </TableRow>
    // ) : null,
    
    // Show languages only if array exists and has values
    Array.isArray(userData.languages) && userData.languages.length > 0 ? (
      <TableRow key="languages" className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-transparent transition-colors">
        <TableCell>{renderIcon(Languages)}</TableCell>
        <TableCell className="font-medium">{t("languages")}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-2">
            {userData.languages.map((lang: string, index: number) => (
              <span key={index} className="px-3 py-1 bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 rounded-full text-sm shadow-sm">
                {lang}
              </span>
            ))}
          </div>
        </TableCell>
      </TableRow>
    ) : null,
    
    // Show citizenship only if value exists
    userData.citizenship && userData.citizenship.trim() !== '' ? (
      <TableRow key="citizenship" className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-transparent transition-colors">
        <TableCell>{renderIcon(MapPin)}</TableCell>
        <TableCell className="font-medium">{t("citizenship")}</TableCell>
        <TableCell>
          <span className="px-3 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 rounded-full text-sm shadow-sm">
            {userData.citizenship}
          </span>
        </TableCell>
      </TableRow>
    ) : null,
    
    // Show service enablers only if array exists and has values
    Array.isArray(userData.serviceEnablers) && userData.serviceEnablers.length > 0 ? (
      <TableRow key="serviceEnablers" className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-transparent transition-colors">
        <TableCell>{renderIcon(Briefcase)}</TableCell>
        <TableCell className="font-medium">{t("serviceEnablers")}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-2">
            {userData.serviceEnablers.map((enabler: string, index: number) => (
              <span key={index} className="px-3 py-1 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 rounded-full text-sm shadow-sm">
                {enabler}
              </span>
            ))}
          </div>
        </TableCell>
      </TableRow>
    ) : null,
  ].filter(Boolean);

  // Short comment: Hide entire section if no data to show
  if (aboutRows.length === 0) {
    return null;
  }

  return (
    <div className="group w-full bg-gradient-to-b from-white to-gray-50/50 p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.12]" />
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 border-l-4 border-teal-400 pl-3">
            <User2 className="w-6 h-6 text-teal-500" />
            <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">{t("aboutMe")}</h2>
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
                <TableHead className="font-semibold text-gray-700">{t("attribute")}</TableHead>
                <TableHead className="font-semibold text-gray-700">{t("value")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aboutRows}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AboutMeSection;
