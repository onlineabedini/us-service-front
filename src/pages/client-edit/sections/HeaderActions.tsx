//@collapse
// src/pages/client-edit/components/HeaderActions.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface HeaderActionsProps {
  onSave: () => void;
  loading: boolean;
  readOnlyMode?: boolean;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({ onSave, loading, readOnlyMode }) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end mb-6 gap-2">
      <Button onClick={onSave} disabled={loading || readOnlyMode}>
        {readOnlyMode ? 'Read Only Mode' : t("update")}
      </Button>
    </div>
  );
};

export default HeaderActions;
