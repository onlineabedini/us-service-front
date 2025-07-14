import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";
import { removeCookie } from "@/utils/authCookieService";
import { useTranslation } from "react-i18next";

// Email Confirmation Page Component
const EmailConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const { t } = useTranslation();

  // --- Helper: Confirm email for client ---
  const confirmClientEmail = async (token: string) => {
    try {
      const endpoint = `${API_BASE_URL}/client/verify-email?token=${token}`;
      const response = await fetch(endpoint);
      if (response.ok) {
        toast.success(t("emailConfirmedWelcome"));
        setTimeout(() => {
          removeCookie('token');
          removeCookie('clientId');
          window.location.href = "/login/client";
        }, 2000);
      } else {}
    } catch (error) {
      console.error(t("verificationError"), error);
    }
  };

  // --- Helper: Confirm email for provider ---
  const confirmProviderEmail = async (token: string) => {
    try {
      const endpoint = `${API_BASE_URL}/provider/verify-email?token=${token}`;
      const response = await fetch(endpoint);
      if (response.ok) {
        toast.success(t("emailConfirmedWelcome"));
        setTimeout(() => {
          removeCookie('token');
          removeCookie('providerId');
          window.location.href = "/login/provider";
        }, 2000);
      } else {}
    } catch (error) {
      console.error(t("verificationError"), error);
    }
  };

  // Effect to handle email confirmation on component mount
  useEffect(() => {
    if (!token || !type) {
      toast.error(t("invalidOrMissingToken"));
      return;
    }
    if (type === "client") {
      confirmClientEmail(token);
    } else if (type === "provider") {
      confirmProviderEmail(token);
    } else {
      toast.error(t("invalidType"));
    }
    // eslint-disable-next-line
  }, [token, type, t]);

  // Render email confirmation page
  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-2xl font-semibold text-teal-600 mb-4 animate-pulse">
          {`🔒 ${t("verifyingYourEmail")}`}
        </h1>
        <p className="text-gray-600 text-lg">
          {t("pleaseWaitWhileWeConfirmYourEmail")}
        </p>
      </div>
    </div>
  );
};

export default EmailConfirmationPage;
