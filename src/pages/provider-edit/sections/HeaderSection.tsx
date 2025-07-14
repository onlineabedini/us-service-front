//@collapse
// src/pages/provider-edit/components/HeaderSection.tsx
import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface HeaderSectionProps {
  onSave: () => void;
  onClose: () => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = memo(({ onSave, onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end items-center mb-6">
      <Button onClick={onSave} className="mr-2">
        {t("saveChanges")}
      </Button>
      <Button variant="secondary" onClick={onClose}>
        {t("cancel")}
      </Button>
    </div>
  );
});

export default HeaderSection;
