//@collapse
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { Combobox } from "@/components/global/combobox";
import { prioritizedCountries } from "../../../lists/countries";
import { Checkbox } from "@/components/ui/checkbox";


interface Address {
  firstName?: string;
  lastName?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}

interface MainAddressSectionProps {
  addresses: Address[];
  onAddressInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    key: keyof Address
  ) => void;
  readOnlyMode?: boolean;
}

const MainAddressSection: React.FC<MainAddressSectionProps> = ({
  addresses = [],
  onAddressInputChange,
  readOnlyMode,
}) => {
  const { t } = useTranslation();

  // Local state for the country combobox search
  const [countrySearch, setCountrySearch] = useState("");
  const filteredCountries = prioritizedCountries.filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Initialize addresses array with default empty address if not exists
  if (!addresses || addresses.length === 0) {
    addresses = [{
      firstName: "",
      lastName: "",
      streetAddress: "",
      postalCode: "",
      city: "",
      country: ""
    }];
  }

  const currentAddress = addresses[0];

  /**
   * Build a summary in this order:
   * First Name, Last Name, Street Address, Zip Code, City, Country
   */
  const getAddressSummary = (address: any): string => {
    const parts: string[] = [];
    if (address.firstName?.trim()) parts.push(address.firstName);
    if (address.lastName?.trim()) parts.push(address.lastName);
    if (address.streetAddress?.trim()) parts.push(address.streetAddress);
    if (address.postalCode?.trim()) parts.push(address.postalCode);
    if (address.city?.trim()) parts.push(address.city);
    if (address.country?.trim()) parts.push(address.country);

    // Fallback to "Address" if no parts are provided
    return parts.length > 0 ? parts.join(", ") : t("address", "Address");
  };

  // Local state to control the open/closed state of the accordion
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const toggleAccordion = () => {
    setIsAccordionOpen((prev) => !prev);
  };

  return (
    <div key={0} className="mt-4 space-y-4">
      <div className="border rounded">
        {/* Accordion Header */}
        <div
          className="bg-gray-200 p-3 mb-2 text-gray-400 cursor-pointer"
          onClick={toggleAccordion}
        >
          <h3 className="font-normal">{getAddressSummary(currentAddress)}</h3>
        </div>

        {/* Accordion Content */}
        {isAccordionOpen && (
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="flex flex-col gap-1">
                <Label htmlFor={`firstName-${0}`}>
                  {t("firstName", "First Name")}
                </Label>
                <Input
                  id={`firstName-${0}`}
                  value={currentAddress.firstName ?? ""}
                  onChange={(e) => onAddressInputChange(e, 0, "firstName")}
                  placeholder={t("Enter first name", "Enter first name")}
                  disabled={readOnlyMode}
                />
              </div>

              {/* Last Name */}
              <div className="flex flex-col gap-1">
                <Label htmlFor={`lastName-${0}`}>
                  {t("lastName", "Last Name")}
                </Label>
                <Input
                  id={`lastName-${0}`}
                  value={currentAddress.lastName ?? ""}
                  onChange={(e) => onAddressInputChange(e, 0, "lastName")}
                  placeholder={t("Enter last name", "Enter last name")}
                  disabled={readOnlyMode}
                />
              </div>

              {/* Street Address */}
              <div className="flex flex-col gap-1">
                <Label htmlFor={`streetAddress-${0}`}>
                  {t("streetAddress", "Street Address")}
                </Label>
                <Input
                  id={`streetAddress-${0}`}
                  value={currentAddress.streetAddress ?? ""}
                  onChange={(e) => onAddressInputChange(e, 0, "streetAddress")}
                  placeholder={t("Enter street address", "Enter street address")}
                  disabled={readOnlyMode}
                />
              </div>

              {/* Zip Code */}
              <div className="flex flex-col gap-1">
                <Label htmlFor={`postalCode-${0}`}>
                  {t("zipCode", "Zip Code")}
                </Label>
                <Input
                  id={`postalCode-${0}`}
                  value={currentAddress.postalCode ?? ""}
                  onChange={(e) => onAddressInputChange(e, 0, "postalCode")}
                  placeholder={t("Enter zip code", "Enter zip code")}
                  disabled={readOnlyMode}
                />
              </div>

              {/* City */}
              <div className="flex flex-col gap-1">
                <Label htmlFor={`city-${0}`}>{t("city", "City")}</Label>
                <Input
                  id={`city-${0}`}
                  value={currentAddress.city ?? ""}
                  onChange={(e) => onAddressInputChange(e, 0, "city")}
                  placeholder={t("Enter city", "Enter city")}
                  disabled={readOnlyMode}
                />
              </div>

              {/* Country with Combobox and Checkboxes */}
              <div className="flex flex-col gap-1">
                <Label htmlFor={`country-${0}`}>
                  {t("country", "Country")}
                </Label>
                <Combobox>
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder={t("searchCountries", "Search Countries")}
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="border p-2 mb-2 w-full"
                      disabled={readOnlyMode}
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredCountries.map((country) => (
                      <div key={country} className="flex items-center px-3 py-1">
                        <Checkbox
                          id={`country-${country}-${0}`}
                          checked={currentAddress.country === country}
                          onCheckedChange={(checked) => {
                            const newCountry = checked ? country : "";
                            onAddressInputChange(
                              {
                                target: {
                                  id: `country-${0}`,
                                  value: newCountry,
                                },
                              } as React.ChangeEvent<HTMLInputElement>,
                              0,
                              "country"
                            );
                          }}
                          disabled={readOnlyMode}
                        />
                        <label
                          htmlFor={`country-${country}-${0}`}
                          className="ml-2"
                        >
                          {country}
                        </label>
                      </div>
                    ))}
                  </div>
                </Combobox>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainAddressSection;
