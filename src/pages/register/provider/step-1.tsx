import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { BasicRegistrationData } from "./provider.register.page";
import { FiMail, FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { Skeleton } from "@/components/ui/skeleton";

interface Step1Props {
  onSubmit: (data: BasicRegistrationData) => void;
}

const Step1: React.FC<Step1Props> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BasicRegistrationData>({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [passwordStrength, setPasswordStrength] = useState<number>(0);

  const validateName = (name: string) => {
    return name.trim().length > 0;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      hasNumber: /[0-9]/.test(password),
      hasLetter: /[a-zA-Z]/.test(password)
    };

    let strength = 0;
    strength += requirements.length ? 1 : 0;
    strength += requirements.hasNumber ? 1 : 0;
    strength += requirements.hasLetter ? 1 : 0;

    return { strength, requirements };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));

    const newErrors = { ...validationErrors };

    switch (id) {
      case 'email':
        if (!validateEmail(value)) {
          newErrors.email = t("invalidEmail") || "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;
      case 'firstName':
      case 'lastName':
        if (!validateName(value)) {
          newErrors[id] = t("requiredField") || "This field is required";
        } else {
          delete newErrors[id];
        }
        break;
      case 'password':
        const { strength, requirements } = validatePassword(value);
        setPasswordStrength(strength);
        if (!requirements.length || !requirements.hasNumber || !requirements.hasLetter) {
          newErrors.password = t("invalidPassword") || "Password must be at least 8 characters and contain both letters and numbers";
        } else {
          delete newErrors.password;
        }
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          newErrors.confirmPassword = t("passwordMismatch") || "Passwords do not match";
        } else if (formData.confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;
      case 'confirmPassword':
        if (value !== formData.password) {
          newErrors.confirmPassword = t("passwordMismatch") || "Passwords do not match";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }

    setValidationErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: { [key: string]: string } = {};
    
    if (!validateName(formData.firstName)) {
      errors.firstName = t("firstNameRequired") || "First name is required.";
    }
    
    if (!validateName(formData.lastName)) {
      errors.lastName = t("lastNameRequired") || "Last name is required.";
    }
    
    if (!validateEmail(formData.email)) {
      errors.email = t("invalidEmail") || "Please enter a valid email address.";
    }
    
    if (!formData.password) {
      errors.password = t("passwordRequired") || "Password is required.";
    } else {
      const { strength } = validatePassword(formData.password);
      if (strength < 3) {
        errors.password = t("weakPassword") || "Password is too weak.";
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t("passwordMismatch") || "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-2 py-4 bg-white/95 rounded-2xl transition-all duration-300">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div className="relative group">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 transition-colors group-focus-within:text-teal-600">
              <FiMail className="inline-block text-teal-500 mr-2" />{t("email")}
            </label>
            <Input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t("enterEmail") || "Enter your email"}
              className={`transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 ${validationErrors.email ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative group">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1 transition-colors group-focus-within:text-teal-600">
                <FiUser className="inline-block text-teal-500 mr-2" />{t("firstName")}
              </label>
              <Input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder={t("enterFirstName") || "Enter your first name"}
                className={`transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 ${validationErrors.firstName ? 'border-red-500' : ''}`}
                required
              />
              {validationErrors.firstName && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {validationErrors.firstName}
                </p>
              )}
            </div>

            <div className="relative group">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1 transition-colors group-focus-within:text-teal-600">
                <FiUser className="inline-block text-teal-500 mr-2" />{t("lastName")}
              </label>
              <Input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder={t("enterLastName") || "Enter your last name"}
                className={`transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 ${validationErrors.lastName ? 'border-red-500' : ''}`}
                required
              />
              {validationErrors.lastName && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {validationErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="relative group">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 transition-colors group-focus-within:text-teal-600">
              <FiLock className="inline-block text-teal-500 mr-2" />{t("password")}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t("enterPassword") || "Enter your password"}
                className={`transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
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
            {validationErrors.password && formData.password.length > 0 && (
              <div>
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {validationErrors.password}
                </p>

                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 2) * 100}%` }}
                      />
                    </div>
                  </div>
                  <ul className="text-xs space-y-1 text-gray-500">
                    <li className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-green-500' : ''}`}>
                      <i className={`fas ${formData.password.length >= 8 ? 'fa-check' : 'fa-times'}`} />
                      {t("passwordRequirementLength") || "At least 8 characters"}
                    </li>
                    <li className={`flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-green-500' : ''}`}>
                      <i className={`fas ${/[0-9]/.test(formData.password) ? 'fa-check' : 'fa-times'}`} />
                      {t("passwordRequirementNumber") || "At least one number"}
                    </li>
                    <li className={`flex items-center gap-1 ${/[a-zA-Z]/.test(formData.password) ? 'text-green-500' : ''}`}>
                      <i className={`fas ${/[a-zA-Z]/.test(formData.password) ? 'fa-check' : 'fa-times'}`} />
                      {t("passwordRequirementLetter") || "At least one letter"}
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="relative group">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 transition-colors group-focus-within:text-teal-600">
              <FiLock className="inline-block text-teal-500 mr-2" />{t("confirmPassword")}
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder={t("confirmPasswordPlaceholder") || "Confirm your password"}
                className={`transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
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
                <i className="fas fa-exclamation-circle mr-1"></i>
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-teal-500/25 hover:from-teal-500 hover:to-teal-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <span>{t("submitting") || "Submitting..."}</span>
            </div>
          ) : (
            <>
              <FiUser className="inline-block mr-2" />
              {t("register") || "Register"}
            </>
          )}
        </button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {t("alreadyHaveAccount") || "Already have an account?"}{" "}
            <a
              href="/login/provider"
              className="text-teal-600 hover:text-teal-700 font-medium transition-colors duration-200"
            >
              {t("login") || "Login"}
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Step1;
