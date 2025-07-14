//@collapse
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


interface Address {
  country: string;
  city: string;
  streetAddress: string;
  streetName: string;
  houseNumber: number;
  floor: number;
  postalCode: string;
  doorCode: string;
  doorPhone: number;
  size: number;
  typeOfLiving: string;
  numberOfRooms: number;
}

interface ClientAddressSectionProps {
  addresses: Address[];
  onAddressInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    key: keyof Address
  ) => void;
  onAddAddress: () => void;
}

const ClientAddressSection: React.FC<ClientAddressSectionProps> = ({
  addresses,
  onAddressInputChange,
  onAddAddress,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {addresses.map((addr, index) => {
        if (index > 0) return (
          <div key={index} className="mb-4 space-y-4">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <h3 className="font-semibold">
                    {
                      (addr.postalCode.toString().trim().length > 0) ? addr.postalCode : t("address ") + index
                    }
                  </h3>
                </AccordionTrigger>
                <AccordionContent>
                  {/* Row with two fields per line, responsive */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Country */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`country-${index}`}>{t("country", "Country")}</Label>
                      <Input
                        id={`country-${index}`}
                        value={addr.country ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "country")}
                        placeholder={t("Enter country", "Enter country")}
                      />
                    </div>

                    {/* City */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`city-${index}`}>{t("city", "City")}</Label>
                      <Input
                        id={`city-${index}`}
                        value={addr.city ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "city")}
                        placeholder={t("Enter city", "Enter city")}
                      />
                    </div>

                    {/* Street Address */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`streetAddress-${index}`}>
                        {t("streetAddress", "Street Address")}
                      </Label>
                      <Input
                        id={`streetAddress-${index}`}
                        value={addr.streetAddress ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "streetAddress")}
                        placeholder={t("Enter street address", "Enter street address")}
                      />
                    </div>

                    {/* Street Name */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`streetName-${index}`}>{t("streetName", "Street Name")}</Label>
                      <Input
                        id={`streetName-${index}`}
                        value={addr.streetName ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "streetName")}
                        placeholder={t("Enter street name", "Enter street name")}
                      />
                    </div>

                    {/* House Number */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`houseNumber-${index}`}>
                        {t("houseNumber", "House Number")}
                      </Label>
                      <Input
                        type="number"
                        id={`houseNumber-${index}`}
                        value={addr.houseNumber ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "houseNumber")}
                        placeholder={t("Enter house number", "Enter house number")}
                      />
                    </div>

                    {/* Floor */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`floor-${index}`}>{t("floor", "Floor")}</Label>
                      <Input
                        type="number"
                        id={`floor-${index}`}
                        value={addr.floor ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "floor")}
                        placeholder={t("Enter floor number", "Enter floor number")}
                      />
                    </div>

                    {/* Postal Code */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`postalCode-${index}`}>{t("postalCode", "Postal Code")}</Label>
                      <Input
                        id={`postalCode-${index}`}
                        value={addr.postalCode ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "postalCode")}
                        placeholder={t("Enter postal code", "Enter postal code")}
                      />
                    </div>

                    {/* Door Code */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`doorCode-${index}`}>{t("doorCode", "Door Code")}</Label>
                      <Input
                        id={`doorCode-${index}`}
                        value={addr.doorCode ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "doorCode")}
                        placeholder={t("Enter door code", "Enter door code")}
                      />
                    </div>

                    {/* Door Phone */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`doorPhone-${index}`}>{t("doorPhone", "Door Phone")}</Label>
                      <Input
                        type="number"
                        id={`doorPhone-${index}`}
                        value={addr.doorPhone ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "doorPhone")}
                        placeholder={t("Enter door phone", "Enter door phone")}
                      />
                    </div>

                    {/* Size */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`size-${index}`}>{t("size", "Size")}</Label>
                      <Input
                        type="number"
                        id={`size-${index}`}
                        value={addr.size ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "size")}
                        placeholder={t("Enter size in sqm", "Enter size in sqm")}
                      />
                    </div>

                    {/* Type of Living */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`typeOfLiving-${index}`}>
                        {t("typeOfLiving", "Type of Living")}
                      </Label>
                      <Input
                        id={`typeOfLiving-${index}`}
                        value={addr.typeOfLiving ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "typeOfLiving")}
                        placeholder={t("Enter type of living", "Enter type of living")}
                      />
                    </div>

                    {/* Number of Rooms */}
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`numberOfRooms-${index}`}>
                        {t("numberOfRooms", "Number of Rooms")}
                      </Label>
                      <Input
                        type="number"
                        id={`numberOfRooms-${index}`}
                        value={addr.numberOfRooms ?? ""}
                        onChange={(e) => onAddressInputChange(e, index, "numberOfRooms")}
                        placeholder={t("Enter number of rooms", "Enter number of rooms")}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )
      }
      )}

      {/* Button to Add Another Address */}
      <div className="mt-6">
        <button
          type="button"
          onClick={onAddAddress}
          className="inline-flex items-center font-semibold bg-blue-600 hover:bg-blue-400 text-white rounded p-2"
        >
          <i className="fi fi-rs-plus me-2"></i>
          <span>
            {t("Add More Address")}
          </span>
        </button>
      </div>
    </>
  );
};

export default ClientAddressSection;
