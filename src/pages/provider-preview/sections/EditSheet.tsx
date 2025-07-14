//@collapse
// src/pages/provider-page/sections/EditSheet.tsx
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import EditProfileForm from "@/pages/provider-edit/editProfile";
import { useTranslation } from "react-i18next";

type EditSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: any;
  onSaveSuccess: () => void;
};

const EditSheet: React.FC<EditSheetProps> = ({
  open,
  onOpenChange,
  userData,
  onSaveSuccess,
}) => {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-white h-[100vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("editProfileTitle")}</SheetTitle>
          <SheetDescription>
            {t("editProfileDescription")}
          </SheetDescription>
        </SheetHeader>
        <EditProfileForm
          userData={userData}
          onClose={() => onOpenChange(false)}
          onSaveSuccess={onSaveSuccess}
        />
      </SheetContent>
    </Sheet>
  );
};

export default EditSheet;
