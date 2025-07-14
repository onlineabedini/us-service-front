//@collapse
import React, { useState, memo } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/global/combobox";
import { prioritizedCountries } from "../../../lists/countries";
import { prioritizedLanguages } from "../../../lists/languages";
import { StockholmAreas } from "../../../lists/stockholmAreas";
import { servicesList } from "../../../lists/services";
import { API_BASE_URL } from '@/config/api';

export interface ProviderData {
  [key: string]: any;
}

interface GeneralInputsSectionProps {
  formData: ProviderData;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLanguagesChange: (languages: string[]) => void;
  onOfferedServicesChange: (services: string[]) => void;
  onServiceAreaChange: (areas: string[]) => void;
  onCitizenshipChange: (citizenship: string) => void;
  // Validation errors from parent
  validationErrors: { [key: string]: string };
}

const GeneralInputsSection: React.FC<GeneralInputsSectionProps> = memo(({
  formData,
  onInputChange,
  onUpload,
  onLanguagesChange,
  onOfferedServicesChange,
  onServiceAreaChange,
  onCitizenshipChange,
  validationErrors,
}) => {
  const baseUrl = API_BASE_URL;
  const { t } = useTranslation();

  // Fields to be excluded from dynamic rendering
  const excludedFields = [
    "id",
    "profileImage",
    "address",
    "serviceArea",
    "availability",
    "bankId",
    "isActive",
    "hireDate",
    "officialId",
    "createdAt",
    "language",
    "citizenship",
  ];

  // Define the desired order of fields
  const fieldOrder = [
    "username",
    "email",
    "firstName",
    "lastName",
    "phoneNumber",
    "address",
    "serviceArea",
    "availability",
    "bankId",
    "isActive",
    "hireDate",
  ];

  // Filter out fields that will be dynamically rendered, respecting the defined order
  const editableFields = fieldOrder
    .filter(field => !excludedFields.includes(field) && field in formData)
    .concat(
      Object.keys(formData).filter(
        key =>
          !excludedFields.includes(key) &&
          !fieldOrder.includes(key) &&
          typeof formData[key] !== "object"
      )
    );

  // Define input types for specific fields
  const fieldInputTypes: Record<
    string,
    "input" | "textarea" | "checkbox" | "inlineCheckbox" | "file"
  > = {
    description: "textarea",
    isVerified: "checkbox",
    car: "inlineCheckbox",
    carLicense: "inlineCheckbox",
    smoke: "inlineCheckbox",
    workPermit: "file", // will be disabled if already uploaded
  };

  // Fields that should be rendered as inline checkboxes
  const inlineCheckboxFields = ["car", "carLicense", "smoke"];

  // Lists for comboboxes
  const languages = prioritizedLanguages;
  const offeredServicesList = servicesList;
  const stockholmAreas = StockholmAreas;
  const europeanCountries = prioritizedCountries;

  // Local states for combobox search
  const [languageSearch, setLanguageSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [citizenshipSearch, setCitizenshipSearch] = useState("");

  const filteredLanguages = languages.filter((lang) =>
    lang.toLowerCase().includes(languageSearch.toLowerCase())
  );
  const filteredServices = offeredServicesList.filter((service) =>
    service.toLowerCase().includes(serviceSearch.toLowerCase())
  );
  const filteredAreas = stockholmAreas.filter((area) =>
    area.toLowerCase().includes(areaSearch.toLowerCase())
  );
  const filteredCitizenship = europeanCountries.filter((country) =>
    country.toLowerCase().includes(citizenshipSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Dynamic Fields */}
      {editableFields.map((key) => {
        // Provide a nicer label
        let labelText =
          key === "education"
            ? t("educationAndTraining")
            : key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());

        const inputType = fieldInputTypes[key] || "input";
        const isDisabled =
          key === "currency" ||
          key === "firstName" ||
          key === "lastName" ||
          (key === "workPermit" && formData[key]);
        const isFullWidth = inputType === "textarea";

        return (
          <div
            key={key}
            className={`flex flex-col gap-2 ${isFullWidth ? "col-span-2" : ""}`}
          >
            {/* Label (skip if inlineCheckbox) */}
            {inputType !== "inlineCheckbox" && (
              <label htmlFor={key} className="capitalize">
                {labelText}
              </label>
            )}

            {inputType === "input" && (
              <>
                <Input
                  id={key}
                  value={formData[key] || ""}
                  onChange={onInputChange}
                  disabled={isDisabled}
                  // Add a red border if there's a validation error
                  className={validationErrors[key] ? "border-red-500" : ""}
                />
                {/* Display validation error if any */}
                {validationErrors[key] && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors[key]}
                  </p>
                )}
              </>
            )}

            {inputType === "textarea" && (
              <>
                <Textarea
                  id={key}
                  value={formData[key] || ""}
                  onChange={onInputChange}
                  disabled={isDisabled}
                  rows={4}
                  className={validationErrors[key] ? "border-red-500" : ""}
                />
                {validationErrors[key] && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors[key]}
                  </p>
                )}
              </>
            )}

            {inputType === "checkbox" && (
              <div className="flex items-center">
                <Checkbox
                  id={key}
                  checked={!!formData[key]}
                  onCheckedChange={(checked) =>
                    onInputChange({
                      target: { id: key, value: checked },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                />
                <label htmlFor={key} className="ml-2">
                  {labelText}
                </label>
                {validationErrors[key] && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors[key]}
                  </p>
                )}
              </div>
            )}

            {inputType === "inlineCheckbox" &&
              inlineCheckboxFields.includes(key) && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={!!formData[key]}
                    onCheckedChange={(checked) =>
                      onInputChange({
                        target: { id: key, value: checked },
                      } as React.ChangeEvent<HTMLInputElement>)
                    }
                  />
                  <span>{labelText}</span>
                  {validationErrors[key] && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors[key]}
                    </p>
                  )}
                </div>
              )
            }

            {inputType === "file" && (
              <div>
                <input
                  type="file"
                  id={key}
                  disabled={isDisabled}
                  accept=".pdf"
                  className={`border p-1 w-full ${formData[key] ? "bg-green-100" : ""
                    } ${validationErrors[key] ? "border-red-500" : ""}`}
                  onChange={onUpload}
                />
                <span className={formData[key] ? "text-green-500" : "text-red-500"}>
                  {formData[key] ? t("valid") : t("notUploadedYet")}
                </span>
                {formData[key] && (
                  <span className="text-green-500 hover:scale-x-125 ms-1">
                    <a
                      href={`${baseUrl}/${formData[key]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fi fi-rr-download"></i>
                    </a>
                  </span>
                )}
                {validationErrors[key] && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors[key]}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Combobox for Languages */}
      <div className="sm:col-span-1">
        <Combobox label={t("chooseLanguages")}>
          <div className="p-2">
            <input
              type="text"
              placeholder={t("searchLanguages")}
              value={languageSearch}
              onChange={(e) => setLanguageSearch(e.target.value)}
              className="border p-2 mb-2 w-full"
            />
          </div>
          {filteredLanguages.map((lang) => (
            <div key={lang} className="flex items-center px-3 py-1">
              <Checkbox
                id={lang}
                checked={formData.languages?.includes(lang) || false}
                onCheckedChange={(checked) => {
                  const newLanguages = checked
                    ? [...(formData.languages || []), lang]
                    : (formData.languages || []).filter((l: any) => l !== lang);
                  onLanguagesChange(newLanguages);
                }}
              />
              <label htmlFor={lang} className="ml-2">
                {lang}
              </label>
            </div>
          ))}
        </Combobox>
      </div>

      {/* Combobox for Offered Services */}
      <div className="sm:col-span-1">
        <Combobox label={t("chooseOfferedServices")}>
          <div className="p-2">
            <input
              type="text"
              placeholder={t("searchServices")}
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="border p-2 mb-2 w-full"
            />
          </div>
          {filteredServices.map((service) => (
            <div key={service} className="flex items-center px-3 py-1">
              <Checkbox
                id={service}
                checked={formData.offeredServices?.includes(service) || false}
                onCheckedChange={(checked) => {
                  const newServices = checked
                    ? [...(formData.offeredServices || []), service]
                    : (formData.offeredServices || []).filter((s: any) => s !== service);
                  onOfferedServicesChange(newServices);
                }}
              />
              <label htmlFor={service} className="ml-2">
                {service}
              </label>
            </div>
          ))}
        </Combobox>
      </div>

      {/* Combobox for Service Area */}
      <div className="sm:col-span-1">
        <Combobox label={t("chooseServiceAreas")}>
          <div className="p-2">
            <input
              type="text"
              placeholder={t("searchAreas")}
              value={areaSearch}
              onChange={(e) => setAreaSearch(e.target.value)}
              className="border p-2 mb-2 w-full"
            />
          </div>
          {filteredAreas.map((area) => (
            <div key={area} className="flex items-center px-3 py-1">
              <Checkbox
                id={area}
                checked={formData.serviceArea?.includes(area) || false}
                onCheckedChange={(checked) => {
                  const newAreas = checked
                    ? [...(formData.serviceArea || []), area]
                    : (formData.serviceArea || []).filter((a: any) => a !== area);
                  onServiceAreaChange(newAreas);
                }}
              />
              <label htmlFor={area} className="ml-2">
                {area}
              </label>
            </div>
          ))}
        </Combobox>
      </div>

      {/* Combobox for Citizenship */}
      <div className="sm:col-span-1">
        <Combobox label={t("chooseCitizenship")}>
          <div className="p-2">
            <input
              type="text"
              placeholder={t("searchCountries")}
              value={citizenshipSearch}
              onChange={(e) => setCitizenshipSearch(e.target.value)}
              className="border p-2 mb-2 w-full"
            />
          </div>
          {filteredCitizenship.map((country) => (
            <div key={country} className="flex items-center px-3 py-1">
              <Checkbox
                id={country}
                checked={formData.citizenship === country}
                onCheckedChange={(checked) => {
                  const newCitizenship = checked ? country : "";
                  onCitizenshipChange(newCitizenship);
                }}
              />
              <label htmlFor={country} className="ml-2">
                {country}
              </label>
            </div>
          ))}
        </Combobox>
      </div>
    </div>
  );
});

export default GeneralInputsSection;
