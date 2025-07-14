// ───────── Imports ─────────
import React from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Briefcase } from "lucide-react";
import registerBg from "@/assets/img/register-bg.png";
import ChangeLang from "@/components/global/changeLangDropdonw";
import LazyImage from "@/components/global/LazyImage";
import { useTranslation } from "react-i18next";

// ───────── Role Card Component ─────────
const RoleCard = ({ icon, title, description, onClick }: any) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 w-64 h-64 border-2 border-teal-100 hover:border-teal-400 focus:outline-none"
  >
    <div className="mb-4 text-teal-600">{icon}</div>
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-gray-600 text-center text-base">{description}</p>
  </button>
);

// ───────── Main Role Landing Page ─────────
const RoleLandingPage: React.FC = () => {
  // Short comment: Navigation hook
  const navigate = useNavigate();

  const { t } = useTranslation();

  // Short comment: Handler for provider selection
  const handleProviderClick = () => {
    navigate("/landing/provider");
  };

  // Short comment: Handler for client selection
  const handleClientClick = () => {
    navigate("/marketPlace");
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-teal-50 to-teal-100 overflow-hidden">
      {/* Language dropdown at the top left */}
      <div className="absolute top-6 left-8 z-20">
        <ChangeLang />
      </div>
      {/* Background illustration */}
      <div className="absolute inset-0 z-0">
        <LazyImage
          src={registerBg}
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/30 z-0" />
      {/* Main content (no Navbar) */}
      <main className="flex flex-1 flex-col items-center justify-center py-16 relative z-10">
        {/* Vitago logo link */}
        <a href="/" className="group flex items-center mb-8 transition-transform hover:scale-105">
          <span className="text-4xl font-extrabold transition-all duration-300">
            <span className="text-teal-600 group-hover:text-teal-700">Vitago</span>
          </span>
          <div className="ml-2 h-2 w-2 bg-gradient-to-tr from-teal-500 to-teal-400 rounded-full group-hover:animate-ping"></div>
        </a>
        {/* Short description */}
        <p className="text-lg sm:text-xl text-white bg-teal-600/40 rounded-xl px-6 py-4 shadow-lg mb-8 max-w-2xl text-center">
          {t("roleLanding.description")}
        </p>
        <h1 className="text-4xl font-extrabold text-white mb-8 text-center drop-shadow-lg">{t("roleLanding.selectRole")}</h1>
        <div className="flex flex-col sm:flex-row gap-8">
          <RoleCard
            icon={<Briefcase size={48} />}
            title={t("roleLanding.role.provider.title")}
            description={t("roleLanding.role.provider.description")}
            onClick={handleProviderClick}
          />
          <RoleCard
            icon={<UserPlus size={48} />}
            title={t("roleLanding.role.client.title")}
            description={t("roleLanding.role.client.description")}
            onClick={handleClientClick}
          />
        </div>
      </main>
    </div>
  );
};

export default RoleLandingPage; 