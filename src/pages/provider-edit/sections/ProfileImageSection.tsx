//@collapse
// src/pages/provider-edit/components/ProfileImageSection.tsx
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import ProfileImage from "@/components/global/profileImage";

interface ProfileImageSectionProps {
  imagePreview: string;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileImageSection: React.FC<ProfileImageSectionProps> = memo(({ imagePreview, onImageChange }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center mb-6">
      <ProfileImage
        imageUrl={imagePreview}
        alt={t("profileImageAlt")}
        editable={true}
        size="md"
        onImageChange={onImageChange}
        label={t("Provider Profile")}
      />
    </div>
  );
});

export default ProfileImageSection;
