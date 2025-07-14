import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from "react-icons/fi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import ChangeLang from "@/components/global/changeLangDropdonw";
import { API_BASE_URL } from '@/config/api';
import registerBg from "@/assets/img/register-bg.png";
import { removeCookie, setCookie } from '@/utils/authCookieService';

interface ValidationErrors {
  [key: string]: string;
}

interface ProviderLoginData {
  email: string;
  password: string;
}

const ProviderLoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<ProviderLoginData>({
    email: "",
    password: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      let error = "";

      switch (id) {
        case "email":
          if (value && !validateEmail(value)) {
            error = t("invalidEmail") || "Please enter a valid email address.";
          }
          break;

        case "password":
          if (value && value.length < 8) {
            error = t("invalidPassword") || "Password must be at least 8 characters long.";
          }
          break;

        default:
          break;
      }

      setValidationErrors((prev) => ({
        ...prev,
        [id]: error,
      }));

      setFormData((prev) => ({
        ...prev,
        [id]: value,
      }));
    },
    [t]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasErrors = Object.values(validationErrors).some((error) => error !== "");
    if (hasErrors) {
      toast.error(t("pleaseFixErrors") || "Please fix the errors before submitting.");
      return;
    }

    try {
      const response : any = await fetch(`${API_BASE_URL}/provider/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          toast.error(t("invalidCredentials") || "Invalid email or password.");
        } else {
          throw new Error(errorData.message || "Login failed");
        }
        return;
      }

      const data : any = await response.json();
      const { token, ...user } = data;
      // Set token and providerId in cookies
      setCookie('token', token);
      setCookie('providerId', user.user.id);
      removeCookie("clientId");

      if (!user.user.isEmailVerified) {
        toast.info(t("completeYourProfile") || "Please complete your profile to proceed.");
        navigate("/activation");
      } else if (user.type === 'provider' && (!user.user.phoneNumber || !user.user.description || !user.user.hourlyRate || !user.user.currency || !user.user.languages || user.user.languages.length === 0 || !user.user.offeredServices || user.user.offeredServices.length === 0 || !user.user.serviceArea || user.user.serviceArea.length === 0 || !user.user.citizenship)) {
        toast.info(t("completeYourProfile") || "Please complete your profile to proceed.");
        navigate("/register/provider?step=2");
      } else {
        toast.success(t("loginSuccess") || "Login successful!");
        // navigate("/marketplace");
        navigate("/register/provider?step=2");
      }
    } catch (error) {
      console.error(error);
      toast.error(t("loginError") || "An error occurred during login.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #f6f8fd 0%, #e2f0ff 100%)",
        backgroundImage: `url(${registerBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/30 backdrop-blur-[4px]"></div>
      <div className="bg-white backdrop-blur-sm p-8 rounded-2xl w-full max-w-xl shadow-xl transition-all duration-300 hover:shadow-2xl relative z-10 my-8">
        <div className="flex justify-between">
          <a href="/" className="group flex items-center mb-8 transition-transform hover:scale-105">
            <span className="text-3xl font-extrabold transition-all duration-300">
              <span className="text-teal-600 group-hover:text-teal-700">Vitago</span>
            </span>
            <div className="ml-2 h-2 w-2 bg-gradient-to-tr from-teal-500 to-teal-400 rounded-full group-hover:animate-ping"></div>
          </a>
          <div>
            <ChangeLang />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center">{t("providerLogin")}</h1>
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
                  className={`transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 ${validationErrors.password ? 'border-red-500' : ''}`}
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
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {validationErrors.password}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-start">
            <a
              href="/forgot-password"
              className="text-sm text-teal-600 hover:text-teal-700 transition-all duration-200 flex items-center gap-1 hover:gap-2"
            >
              <FiLock className="w-4 h-4" />
              {t("forgotPassword")}
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-teal-500/25 hover:from-teal-500 hover:to-teal-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <FiUser className="inline-block mr-2" />
            {t("login")}
          </button>

          <p className="text-center text-sm text-gray-600">
            {t("noAccount")}{" "}
            <a
              href="/register/provider"
              className="text-teal-600 hover:text-teal-700 underline"
            >
              {t("registerHere")}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ProviderLoginPage;
