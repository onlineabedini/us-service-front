//@collapse
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface HomeDetailsProps {
  addresses: any;
  onAddressInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    key: any
  ) => void;
  readOnlyMode?: boolean;
}

const HomeDetails: React.FC<HomeDetailsProps> = ({
  addresses = [],
  onAddressInputChange,
  readOnlyMode,
}) => {
  const { t } = useTranslation();

  // Initialize empty address if not exists
  if (!addresses || addresses.length === 0) {
    addresses = [{
      floor: "",
      doorCode: "",
      doorPhone: "",
      size: "",
      typeOfLiving: "",
      numberOfRooms: ""
    }];
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Floor */}
        <div className="flex flex-col gap-1">
          <Label htmlFor={`floor-${0}`}>
            {t("floor", "Floor")}
          </Label>
          <Input
            type="number"
            id={`floor-${0}`}
            value={addresses[0]?.floor ?? ""}
            onChange={(e) => onAddressInputChange(e, 0, "floor")}
            placeholder={t("Enter floor number", "Enter floor number")}
            disabled={readOnlyMode}
          />
        </div>

        {/* Door Code */}
        <div className="flex flex-col gap-1">
          <Label htmlFor={`doorCode-${0}`}>{t("doorCode", "Door Code")}</Label>
          <Input
            id={`doorCode-${0}`}
            value={addresses[0]?.doorCode ?? ""}
            onChange={(e) => onAddressInputChange(e, 0, "doorCode")}
            placeholder={t("Enter door code", "Enter door code")}
            disabled={readOnlyMode}
          />
        </div>

        {/* Door Phone */}
        <div className="flex flex-col gap-1">
          <Label htmlFor={`doorPhone-${0}`}>{t("doorPhone", "Door Phone")}</Label>
          <Input
            type="number"
            id={`doorPhone-${0}`}
            value={addresses[0]?.doorPhone ?? ""}
            onChange={(e) => onAddressInputChange(e, 0, "doorPhone")}
            placeholder={t("Enter door phone", "Enter door phone")}
            disabled={readOnlyMode}
          />
        </div>

        {/* Size */}
        <div className="flex flex-col gap-1">
          <Label htmlFor={`size-${0}`}>{t("size", "Size")}</Label>
          <Input
            type="number"
            id={`size-${0}`}
            value={addresses[0]?.size ?? ""}
            onChange={(e) => onAddressInputChange(e, 0, "size")}
            placeholder={t("Enter size in sqm", "Enter size in sqm")}
            disabled={readOnlyMode}
          />
        </div>

        {/* Type of Living */}
        <div className="flex flex-col gap-1">
          <Label htmlFor={`typeOfLiving-${0}`}>
            {t("typeOfLiving", "Type of Living")}
          </Label>
          <Input
            id={`typeOfLiving-${0}`}
            value={addresses[0]?.typeOfLiving ?? ""}
            onChange={(e) => onAddressInputChange(e, 0, "typeOfLiving")}
            placeholder={t("Enter type of living", "Enter type of living")}
            disabled={readOnlyMode}
          />
        </div>

        {/* Number of Rooms */}
        <div className="flex flex-col gap-1">
          <Label htmlFor={`numberOfRooms-${0}`}>
            {t("numberOfRooms", "Number of Rooms")}
          </Label>
          <Input
            type="number"
            id={`numberOfRooms-${0}`}
            value={addresses[0]?.numberOfRooms ?? ""}
            onChange={(e) => onAddressInputChange(e, 0, "numberOfRooms")}
            placeholder={t("Enter number of rooms", "Enter number of rooms")}
            disabled={readOnlyMode}
          />
        </div>
      </div>
    </div>
  );
};

export default HomeDetails;
