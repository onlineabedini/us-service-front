//@collaps
import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import ProfileImage from "@/components/global/profileImage";

interface ClientSidebarProps {
  imagePreview: string;
  username?: string;
  // New prop to handle image changes from the file input
  onProfileImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnlyMode?: boolean;
}

const ClientSidebar: React.FC<ClientSidebarProps> = ({
  imagePreview,
  username,
  onProfileImageChange,
  readOnlyMode,
}) => {
  const { t } = useTranslation();

  return (
    <div className="lg:w-1/5">
      <Card className="p-6 flex flex-col items-center gap-4">
        <ProfileImage
          imageUrl={imagePreview}
          username={username}
          label={t("Client Profile")}
          editable={true}
          size="lg"
          showUploadButton={true}
          onImageChange={onProfileImageChange}
        />
      </Card>
    </div>
  );
};

export default ClientSidebar;