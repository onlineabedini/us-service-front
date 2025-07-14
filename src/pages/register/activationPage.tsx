import React from "react";
import { FiMail, FiCheckCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";

// Activation Page Component
const ActivationPage: React.FC = () => {
  const { t } = useTranslation();

  // Render activation page
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-lg p-8 max-w-md text-center">
        <div className="flex justify-center mb-4 text-teal-600">
          <FiMail size={48} />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          {t("activateYourEmail")}
        </h1>
        <p className="text-gray-600 mb-6">
          {t("activationEmailSent")}
        </p>
        <hr />
        <p className="text-teal-600 font-semibold mb-2">
          {t("checkSpam")}
        </p>
        <hr />
        <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-teal-500" />
            {t("secureYourAccount")}
          </div>
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-teal-500" />
            {t("unlockFullAccess")}
          </div>
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-teal-500" />
            {t("continueProfileSetup")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivationPage;
