import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface ProfileImageProps {
  imageUrl: string;
  alt?: string;
  editable?: boolean;
  size?: "sm" | "md" | "lg";
  username?: string;
  label?: string;
  showUploadButton?: boolean;
  onImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  imageUrl,
  alt,
  editable = false,
  size = "md",
  username,
  label,
  showUploadButton = false,
  onImageChange,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = React.useState(false);

  const sizeClasses = {
    sm: "w-28 h-28",
    md: "w-44 h-44",
    lg: "w-56 h-56",
  };

  const handleImageClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Image Container */}
      <div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-4 ${
          editable
            ? "border-teal-100 hover:border-teal-400 cursor-pointer group"
            : "border-gray-100"
        } shadow-lg transition-all duration-300 ease-in-out`}
        onClick={editable ? handleImageClick : undefined}
      >
        <img
          src={imgError ? "/assets/img/provider.jpg" : imageUrl}
          alt={alt || (username ? `${username}'s profile` : t("profileImageAlt"))}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
        {editable && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <span className="text-white text-sm font-medium px-3 py-1 bg-teal-500/80 rounded-full transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              {t("Change Photo")}
            </span>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageChange}
          id="profileImageUpload"
        />
      )}

      {/* Username and Label REQ */}
      {(username || label) && (
        <div className="text-center space-y-1">
          {username && (
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {username}
            </h2>
          )}
          {label && (
            <p className="text-sm text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded-full inline-block">
              {label}
            </p>
          )}
        </div>
      )}

      {/* Upload Button */}
      {editable && showUploadButton && (
        <Button
          variant="outline"
          className="mt-2 px-6 py-2 bg-white border-teal-400 text-teal-600 hover:bg-teal-50 hover:border-teal-500 hover:text-teal-700 rounded-full shadow-sm transition-all duration-200"
          onClick={handleImageClick}
        >
          {t("Upload New Photo")}
        </Button>
      )}
    </div>
  );
};

export default ProfileImage;