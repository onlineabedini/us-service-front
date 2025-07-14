// Client Step 1: Basic Info, Credentials, Profile Image
// ... 

// Step 1: Client Basic Info, Credentials, Profile Image
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FiMail, FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

// -- Props for Step1 --
interface Step1Props {
  formData: any;
  setFormData: (cb: (prev: any) => any) => void;
  validationErrors: { [key: string]: string };
  setValidationErrors: (cb: (prev: any) => any) => void;
  onSubmit: (data: any) => void;
}

// -- Step1 Component --
const Step1: React.FC<Step1Props> = ({ formData, setFormData, validationErrors, setValidationErrors, onSubmit }) => {
  const { t } = useTranslation();
  // Add state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // -- Handle input change --
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    let error = "";
    switch (id) {
      case "email":
        if (value && !/^\S+@\S+\.\S+$/.test(value)) error = t("invalidEmail") || "Invalid email format.";
        break;
      case "username":
        if (value && !/^[a-zA-Z0-9_]+$/.test(value)) error = t("invalidUsername") || "Username can only contain letters, numbers, and underscores.";
        break;
      case "phoneNumber":
        if (value && !/^[0-9]{7,15}$/.test(value)) error = t("invalidPhoneNumber") || "Phone number must be 7-15 digits.";
        break;
      case "password":
        if (value && value.length < 8) error = t("invalidPassword") || "Password must be at least 8 characters long.";
        break;
      case "confirmPassword":
        if (value !== formData.password) error = t("passwordMismatch") || "Passwords do not match.";
        break;
      default:
        break;
    }
    setValidationErrors((prev: any) => ({ ...prev, [id]: error }));
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  // -- Render --
  return (
    <div className="space-y-6">
      {/* Email Field */}
      <div className="relative group">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          <FiMail className="inline-block text-teal-500 mr-2" />{t("email")}
        </label>
        <Input
          type="email"
          id="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder={t("enterEmail") || "Enter your email"}
          className="w-full"
          required
        />
        {validationErrors.email && (
          <p className="text-red-500 text-sm mt-1 flex items-center">
            {validationErrors.email}
          </p>
        )}
      </div>
      {/* First Name and Last Name Side by Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative group">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            <FiUser className="inline-block text-teal-500 mr-2" />{t("firstName")}
          </label>
          <Input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder={t("enterFirstName") || "Enter your first name"}
            required
          />
          {validationErrors.firstName && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              {validationErrors.firstName}
            </p>
          )}
        </div>
        <div className="relative group">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            <FiUser className="inline-block text-teal-500 mr-2" />{t("lastName")}
          </label>
          <Input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder={t("enterLastName") || "Enter your last name"}
            required
          />
          {validationErrors.lastName && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              {validationErrors.lastName}
            </p>
          )}
        </div>
      </div>
      {/* Password Field */}
      <div className="relative group">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          <FiLock className="inline-block text-teal-500 mr-2" />{t("password")}
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            id="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={t("enterPassword") || "Enter your password"}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
        {validationErrors.password && (
          <p className="text-red-500 text-sm mt-1 flex items-center">
            {validationErrors.password}
          </p>
        )}
      </div>
      {/* Confirm Password Field */}
      <div className="relative group">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          <FiLock className="inline-block text-teal-500 mr-2" />{t("confirmPassword")}
        </label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder={t("confirmYourPassword") || "Confirm your password"}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
        {validationErrors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1 flex items-center">
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>
      {/* Submit Button */}
      <button
        type="button"
        className="w-full bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 transition-colors mt-4"
        onClick={() => {
          // -- Button click handler for submit --
          const hasErrors = Object.values(validationErrors).some((error) => error !== "");
          if (hasErrors) return;
          onSubmit(formData);
        }}
      >
        {t("register") || "Register"}
      </button>
    </div>
  );
};

export default Step1; 