import React, { useState, memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { Combobox } from "@/components/global/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { prioritizedCountries } from "../../../lists/countries";

type BusinessType = "Individual" | "Company" | "Agency" | null;

export interface AddressType {
  businessType: BusinessType; // Individual, Company, or Agency
  businessName: string | null;
  registrationNumber: string | null; // Business/Tax registration
  country: string | null;
  city: string | null;
  streetAddress: string | null;
  postalCode: string | null;
  isMainOffice: boolean | null;
  VAT: string | null;
}

interface AddressSectionProps {
  address: AddressType[];
  onNestedInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "address",
    index: number,
    key: string
  ) => void;
}

/**
 * AddressSection component:
 * - Shows multiple address blocks if `address` array has multiple items.
 * - If address is empty/null, a default (blank) address form is shown,
 *   so you can fill in a new address.
 */
const AddressSection: React.FC<AddressSectionProps> = memo(
  ({ address = [], onNestedInputChange }) => {
    const { t } = useTranslation();

    // State to track the search input for each address's country field
    const [countrySearches, setCountrySearches] = useState<Record<number, string>>({});

    const handleCountrySearchChange = (index: number, value: string) => {
      setCountrySearches((prev) => ({ ...prev, [index]: value }));
    };

    // If address is empty, we display at least one blank address form.
    const addressData =
      address.length === 0
        ? [
            {
              businessType: null,
              businessName: null,
              registrationNumber: null,
              country: null,
              city: null,
              streetAddress: null,
              postalCode: null,
              isMainOffice: null,
              VAT: null,
            } as AddressType,
          ]
        : address;

    return (
      <>
        {addressData.map((item, index) => (
          <div key={`address-${index}`} className="flex flex-col gap-4 mb-6 mt-4">
            <h2 className="text-2xl font-semibold mb-2">{t("Tax")}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Business Type Selection */}
              <div className="sm:col-span-2 flex flex-col gap-2">
                <Label>{t("Business Type")}</Label>
                <div className="flex gap-4">
                  {(["Individual", "Company", "Agency"] as BusinessType[]).map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`businessType-${type}-${index}`}
                        name={`businessType-${index}`}
                        checked={item.businessType === type}
                        onChange={() =>
                          onNestedInputChange(
                            {
                              target: { id: `businessType-${index}`, value: type },
                            } as React.ChangeEvent<HTMLInputElement>,
                            "address",
                            index,
                            "businessType"
                          )
                        }
                      />
                      <label htmlFor={`businessType-${type}-${index}`}>{type}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditional Fields (Company / Agency) */}
              {(item.businessType === "Company" || item.businessType === "Agency") && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`businessName-${index}`}>{t("Business Name")}*</Label>
                    <Input
                      id={`businessName-${index}`}
                      value={item.businessName || ""}
                      onChange={(e) => onNestedInputChange(e, "address", index, "businessName")}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`registrationNumber-${index}`}>
                      {t("Registration Number")}*
                    </Label>
                    <Input
                      id={`registrationNumber-${index}`}
                      value={item.registrationNumber || ""}
                      onChange={(e) => onNestedInputChange(e, "address", index, "registrationNumber")}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`vat-${index}`}>{t("VAT Number")}</Label>
                    <Input
                      id={`vat-${index}`}
                      value={item.VAT || ""}
                      onChange={(e) => onNestedInputChange(e, "address", index, "VAT")}
                    />
                  </div>
                </>
              )}

              {/* Main Office Checkbox */}
              <div className="sm:col-span-2 flex items-center gap-2">
                <Checkbox
                  id={`isMainOffice-${index}`}
                  checked={!!item.isMainOffice}
                  onCheckedChange={(checked) =>
                    onNestedInputChange(
                      {
                        target: { id: `isMainOffice-${index}`, value: String(checked) },
                      } as React.ChangeEvent<HTMLInputElement>,
                      "address",
                      index,
                      "isMainOffice"
                    )
                  }
                />
                <Label htmlFor={`isMainOffice-${index}`}>{t("Main Office")}</Label>
              </div>

              {/* Street Address */}
              <div className="flex flex-col gap-2">
                <Label htmlFor={`streetAddress-${index}`}>{t("Street Address")}</Label>
                <Input
                  id={`streetAddress-${index}`}
                  value={item.streetAddress || ""}
                  onChange={(e) => onNestedInputChange(e, "address", index, "streetAddress")}
                  placeholder={t("Enter street address") || "Enter street address"}
                />
              </div>

              {/* Postal Code */}
              <div className="flex flex-col gap-2">
                <Label htmlFor={`postalCode-${index}`}>{t("Postal Code")}</Label>
                <Input
                  id={`postalCode-${index}`}
                  value={item.postalCode || ""}
                  onChange={(e) => onNestedInputChange(e, "address", index, "postalCode")}
                  placeholder={t("Enter postal code") || "Enter postal code"}
                />
              </div>

              {/* City */}
              <div className="flex flex-col gap-2">
                <Label htmlFor={`city-${index}`}>{t("City")}</Label>
                <Input
                  id={`city-${index}`}
                  value={item.city || ""}
                  onChange={(e) => onNestedInputChange(e, "address", index, "city")}
                  placeholder={t("Enter city") || "Enter city"}
                />
              </div>

              {/* Country Selection with Combobox */}
              <div className="flex flex-col gap-2">
                <Label htmlFor={`country-${index}`}>{t("Country")}</Label>
                <Combobox>
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder={t("searchCountries") || "Search countries..."}
                      value={countrySearches[index] || ""}
                      onChange={(e) => handleCountrySearchChange(index, e.target.value)}
                      className="border p-2 mb-2 w-full"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {prioritizedCountries
                      .filter((c) =>
                        c.toLowerCase().includes((countrySearches[index] || "").toLowerCase())
                      )
                      .map((country) => (
                        <div key={country} className="flex items-center px-3 py-1">
                          <Checkbox
                            id={`country-${country}-${index}`}
                            checked={item.country === country}
                            onCheckedChange={(checked) => {
                              const newCountry = checked ? country : "";
                              onNestedInputChange(
                                {
                                  target: {
                                    id: `country-${index}`,
                                    value: newCountry,
                                  },
                                } as React.ChangeEvent<HTMLInputElement>,
                                "address",
                                index,
                                "country"
                              );
                            }}
                          />
                          <label htmlFor={`country-${country}-${index}`} className="ml-2">
                            {country}
                          </label>
                        </div>
                      ))}
                  </div>
                </Combobox>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }
);

export default AddressSection;
