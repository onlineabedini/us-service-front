import React from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiStar, FiUser, FiArrowRight, FiGift, FiCalendar, FiMessageSquare } from "react-icons/fi";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface CompletedDialogProps {
  isPilot: boolean;
  firstName: string;
  onClose: () => void;
}

const CompletedDialog: React.FC<CompletedDialogProps> = ({ isPilot, firstName, onClose }) => {
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    window.location.href = "/landing/provider";
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <DialogHeader className="bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-6 border-b border-teal-600">
        <motion.div variants={itemVariants}>
          <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <FiCheck className="w-6 h-6" />
            </div>
            {t("profileCompleted") || "Profile Completed!"}
          </DialogTitle>
          <DialogDescription className="text-teal-50 text-lg">
            {t("profileCompletedDescription") || "Your journey with Vitago begins now!"}
          </DialogDescription>
        </motion.div>
      </DialogHeader>

      <div className="p-8 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
        <motion.div variants={itemVariants} className="flex items-start gap-5">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center shadow-md">
              <FiUser className="w-7 h-7 text-teal-600" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {t("welcomeMessage", { name: firstName }) || `Welcome to the team, ${firstName}!`}
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              {t("profileReadyMessage") || "Your profile is now ready. You're all set to start your journey with us and connect with clients who need your services."}
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-green-50 border border-teal-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <FiCalendar className="w-6 h-6 text-teal-600 mb-2" />
            <h4 className="font-semibold text-teal-800 mb-1">{t("flexibleScheduleTitle") || "Flexible Schedule"}</h4>
            <p className="text-teal-600 text-sm">{t("flexibleScheduleDescription") || "Work when it suits you best with our flexible booking system"}</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <FiMessageSquare className="w-6 h-6 text-blue-600 mb-2" />
            <h4 className="font-semibold text-blue-800 mb-1">{t("directCommunicationTitle") || "Direct Communication"}</h4>
            <p className="text-blue-600 text-sm">{t("directCommunicationDescription") || "Connect directly with clients through our secure messaging system"}</p>
          </div>
        </motion.div>

        {isPilot && (
          <motion.div
            variants={itemVariants}
            className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shadow-md">
                  <FiStar className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div>
                <h4 className="text-xl font-bold text-amber-800 mb-2">
                  🚀 {t("pilotProgramWelcome") || "Welcome to the Pilot Program!"}
                </h4>
                <p className="text-amber-700 leading-relaxed mb-4">
                  {t("pilotProgramDescription") || `Thank you for stepping in as one of our inaugural participants. As a member of this exclusive group, you'll enjoy:`}
                </p>
                <ul className="space-y-3 text-amber-700">
                  <li>{t("pilotProgramBullet1") || "• VIP support from our expert team whenever you need it"}</li>
                  <li>{t("pilotProgramBullet2") || "• First-look access to upcoming features and product updates"}</li>
                  <li>{t("pilotProgramBullet3") || "• Interactive feedback workshops where your insights directly shape our roadmap"}</li>
                  <li>{t("pilotProgramBullet4") || "• Introductory pricing & bonus perks reserved for our earliest adopters"}</li>
                </ul>
                <p className="text-amber-700 leading-relaxed mt-4">
                  {t("pilotProgramOutro") || `We're thrilled to have you on this journey—let's build something great together!`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-gray-200"
        >
          <p className="text-gray-500 text-center max-w-md">
            {t("nextStepsMessage") || "Ready to start? Click below to go to your dashboard and begin accepting jobs."}
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClose}
            className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 hover:from-teal-600 hover:to-teal-700"
          >
            {t("gotItButton") || "Got it, let's go!"}
            <FiArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CompletedDialog;
