import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { providerService } from "@/services/provider.service";
import ChangeLang from "@/components/global/changeLangDropdonw";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiMail, FiLock, FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi";
import registerBg from "@/assets/img/register-bg.png";

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string): boolean => {
    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasMinLength) {
      setPasswordError(t("passwordRequirementLength") || "Password must be at least 8 characters long");
      return false;
    }
    if (!hasLetter) {
      setPasswordError(t("passwordRequirementLetter") || "Password must contain at least one letter");
      return false;
    }
    if (!hasNumber) {
      setPasswordError(t("passwordRequirementNumber") || "Password must contain at least one number");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await providerService.forgotPassword(email);
      setSuccessMessage(t("resetEmailSent") || "Password reset email sent successfully!");
      toast.success(t("resetEmailSent") || "Password reset email sent successfully!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordMismatch") || "Passwords do not match");
      toast.error(t("passwordMismatch") || "Passwords do not match");
      return;
    }
    if (!validatePassword(newPassword)) {
      return;
    }
    setIsLoading(true);
    try {
      await providerService.resetPassword(token!, newPassword);
      setSuccessMessage(t("passwordResetSuccess") || "Password reset successfully!");
      toast.success(t("passwordResetSuccess") || "Password reset successfully!");
      setTimeout(() => {
        navigate("/login/provider");
      }, 3000);
    } finally {
      setIsLoading(false);
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {token ? t("resetPassword") : t("forgotPassword")}
          </h1>
          <ChangeLang />
        </div>

        {token ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <FiLock className="inline-block text-teal-500 mr-2" />
                {t("newPassword")}
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e: any) => {
                    setNewPassword(e.target.value);
                    validatePassword(e.target.value);
                  }}
                  className="w-full"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v: any) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <FiLock className="inline-block text-teal-500 mr-2" />
                {t("confirmPassword")}
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e: any) => setConfirmPassword(e.target.value)}
                  className="w-full"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v: any) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading || !!passwordError}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-teal-500/25 hover:from-teal-500 hover:to-teal-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? t("resetting") : t("resetPassword")}
            </Button>

            {successMessage && (
              <p className="text-teal-500 text-sm mt-1">{successMessage}</p>
            )}
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <FiMail className="inline-block text-teal-500 mr-2" />
                {t("email")}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-teal-500/25 hover:from-teal-500 hover:to-teal-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? t("sending") || "Sending..." : t("sendResetLink") || "Send Reset Link"}
            </Button>

            {successMessage && (
              <p className="text-teal-500 text-sm mt-1">{successMessage}</p>
            )}
          </form>
        )}

        <div className="mt-4 text-center">
          <Button
            onClick={() => navigate("/login/provider")}
            variant="ghost"
            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
          >
            <FiArrowLeft className="inline-block mr-2" />
            {t("backToLogin") || "Back to Login"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 