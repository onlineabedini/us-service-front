//@collapse
// ClientBasicInfo.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import DescriptionField from "./DescriptionField"; // Adjust the path as needed

interface ClientBasicInfoProps {
  clientData: any;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  // Pass validation errors down
  validationErrors: { [key: string]: string };
  readOnlyMode?: boolean;
}

const ClientBasicInfo: React.FC<ClientBasicInfoProps> = ({
  clientData,
  onInputChange,
  validationErrors,
  readOnlyMode,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Username */}
        <div className="flex flex-col gap-2 sm:col-span-2 transition-all duration-200">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
            {t("Username/Nickname")}
          </Label>
          <div className="relative">
            <Input
              id="username"
              value={clientData.username || ""}
              onChange={onInputChange}
              className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${
                validationErrors.username 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder={t("Enter username")}
              disabled={readOnlyMode}
            />
            {validationErrors.username && (
              <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                {validationErrors.username}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2 transition-all duration-200">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            {t("email")}
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={clientData.email || ""}
              onChange={onInputChange}
              className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${
                validationErrors.email 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder={t("Enter email")}
              disabled={readOnlyMode}
            />
            {validationErrors.email && (
              <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                {validationErrors.email}
              </p>
            )}
          </div>
        </div>

        {/* Phone Number */}
        <div className="flex flex-col gap-2 transition-all duration-200">
          <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
            {t("phoneNumber")}
          </Label>
          <div className="relative">
            <Input
              id="phoneNumber"
              type="tel"
              value={clientData.phoneNumber || ""}
              onChange={onInputChange}
              className={`h-10 px-3 py-2 rounded-md border transition-all duration-200 focus:ring-2 focus:ring-offset-2 ${
                validationErrors.phoneNumber 
                  ? "border-red-500 focus:ring-red-500" 
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder={t("Enter phone number")}
              disabled={readOnlyMode}
            />
            {validationErrors.phoneNumber && (
              <p className="absolute -bottom-6 left-0 text-red-500 text-sm mt-1 animate-fadeIn">
                {validationErrors.phoneNumber}
              </p>
            )}
          </div>
        </div>

        {/* First Name (read-only) */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
            {t("firstName")}
          </Label>
          <Input
            id="firstName"
            value={clientData.firstName || ""}
            disabled={readOnlyMode}
            className="bg-gray-50 cursor-not-allowed"
          />
        </div>

        {/* Last Name (read-only) */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
            {t("lastName")}
          </Label>
          <Input
            id="lastName"
            value={clientData.lastName || ""}
            disabled={readOnlyMode}
            className="bg-gray-50 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};

export default ClientBasicInfo;
