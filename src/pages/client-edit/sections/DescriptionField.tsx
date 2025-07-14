//@collapse
// DescriptionField.tsx
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface DescriptionFieldProps {
  description: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  readOnlyMode?: boolean;
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({
  description,
  onChange,
  readOnlyMode,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1 sm:col-span-2">
      <Label htmlFor="description">{t("description")}</Label>
      <Textarea
        id="description"
        value={description}
        onChange={onChange}
        rows={3}
        disabled={readOnlyMode}
      />
    </div>
  );
};

export default DescriptionField;
