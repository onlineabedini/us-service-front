import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import registerBg from "@/assets/img/register-bg.png";
import Footer from "@/components/layout/footer";
import { Briefcase, Clock, DollarSign, Users, ClipboardCheck, ChevronDown } from "lucide-react";
import ChangeLang from "@/components/global/changeLangDropdonw";
import { getCookie } from '@/utils/authCookieService';
import CalculatePriceSection from "./sections/calculatePriceSection";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from '@/config/api';
import LazyImage from "@/components/global/LazyImage";

// ───────── Hero Section ─────────
const HeroSection = ({ isLoggedIn, isAdmin, handleButtonClick, handleLoginClick, handleAdminPanelClick }: any) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    return (
        <div className="relative min-h-[65vh] sm:min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0">
                <LazyImage
                    src={registerBg}
                    alt="Background"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="absolute inset-0 bg-black/40" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative text-center z-10 px-2 sm:px-4 md:px-8 w-full"
            >
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-400">
                    {t('provider.landing.hero_title')}
                </h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-base sm:text-lg md:text-xl text-white max-w-2xl md:max-w-3xl mx-auto mb-8"
                >
                    {t('provider.landing.hero_subtitle')}
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <button
                        onClick={handleButtonClick}
                        className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border border-transparent text-base sm:text-lg font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                    >
                        {isLoggedIn ? t('provider.landing.edit_profile') : t('provider.landing.pre_register')}
                    </button>
                    {!isLoggedIn && (
                        <button
                            onClick={handleLoginClick}
                            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-teal-500 text-base sm:text-lg font-medium rounded-xl text-teal-600 bg-white hover:bg-teal-50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                        >
                            {t('provider.landing.login')}
                        </button>
                    )}
                </motion.div>
                {isLoggedIn && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
                        <button
                            onClick={() => navigate('/latest-jobs')}
                            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border border-teal-500 text-base sm:text-lg font-medium rounded-xl text-teal-600 bg-white hover:bg-teal-50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                        >
                            {t('provider.landing.my_jobs')}
                        </button>
                        <button
                            onClick={() => navigate('/general-requests')}
                            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border border-teal-500 text-base sm:text-lg font-medium rounded-xl text-teal-600 bg-white hover:bg-teal-50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                        >
                            {t('provider.landing.general_jobs')}
                        </button>
                        <button
                            onClick={() => navigate('/monthly-balance')}
                            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border border-teal-500 text-base sm:text-lg font-medium rounded-xl text-teal-600 bg-white hover:bg-teal-50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                        >
                            {t('provider.landing.monthly_balance') || 'Monthly Balance'}
                        </button>
                        {isAdmin && (
                            <button
                                onClick={handleAdminPanelClick}
                                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border border-teal-500 text-base sm:text-lg font-medium rounded-xl text-teal-600 bg-white hover:bg-teal-50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                            >
                                {t('provider.landing.admin_panel')}
                            </button>
                        )}
                    </div>
                )}
                <VitagoDescription />
            </motion.div>
        </div>
    );
};

// ───────── Vitago Description Section ─────────
const VitagoDescription = () => {
    const { t } = useTranslation();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 max-w-3xl md:max-w-6xl mx-auto text-center"
        >
            <p className="text-base sm:text-lg text-white bg-teal-600/30 rounded-xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg inline-block">
                {t('provider.landing.vitago_description')}
            </p>
        </motion.div>
    );
};

// ───────── Advantages Section ─────────
const AdvantagesSection = ({ handleButtonClick, isLoggedIn }: any) => {
    const { t } = useTranslation();
    let advantages = t('provider.landing.advantages', { returnObjects: true }) as any;
    if (!Array.isArray(advantages)) advantages = [];
    return (
        <section id="why-choose-section" className="py-8 sm:py-10 bg-gray-50">
            <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-2xl sm:text-4xl font-bold text-center mb-10 sm:mb-16 text-gray-900"
                >
                    {t('provider.landing.why_choose_title')}
                </motion.h2>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mx-auto">
                    {advantages.map((adv: any, index: number) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 w-full xs:w-[90%] sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] max-w-sm"
                        >
                            <div className="flex flex-col items-center text-center">
                                {/* Icon rendering logic can be improved for i18n, but keep as is for now */}
                                {adv.icon === 'users' && <Users className="w-10 h-10 sm:w-12 sm:h-12 text-teal-500" />}
                                {adv.icon === 'clock' && <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-teal-500" />}
                                {adv.icon === 'briefcase' && <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-teal-500" />}
                                {adv.icon === 'dollar-sign' && <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-teal-500" />}
                                {adv.icon === 'clipboard-check' && <ClipboardCheck className="w-10 h-10 sm:w-12 sm:h-12 text-teal-500" />}
                                <h3 className="mt-4 text-lg sm:text-xl font-semibold text-gray-900">{adv.title}</h3>
                                <p className="mt-2 text-gray-600 text-sm sm:text-base">{adv.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex justify-center mt-8 sm:mt-12"
                >
                    <button
                        onClick={handleButtonClick}
                        className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border border-transparent text-base sm:text-lg font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                    >
                        {isLoggedIn ? t('provider.landing.edit_profile') : t('provider.landing.pre_register')}
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

// ───────── Calculate Price Section Wrapper ─────────
const CalculatePriceSectionWrapper = ({ handleButtonClick, isLoggedIn }: any) => {
    const { t } = useTranslation();
    return (
        <section id="calculate-price-section" className="pb-8 pt-4 sm:pb-10 sm:pt-5 bg-gray-50">
            <CalculatePriceSection />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex justify-center mt-6 sm:mt-8"
            >
                <button
                    onClick={handleButtonClick}
                    className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border border-transparent text-base sm:text-lg font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                >
                    {isLoggedIn ? t('provider.landing.edit_profile') : t('provider.landing.pre_register')}
                </button>
            </motion.div>
        </section>
    );
};

// ───────── FAQ Section ─────────
const FAQSection = ({ handleButtonClick, isLoggedIn, openFAQIndex, setOpenFAQIndex }: any) => {
    const { t } = useTranslation();
    let faqItems = t('provider.landing.faq', { returnObjects: true }) as any;
    if (!Array.isArray(faqItems)) faqItems = [];
    return (
        <section id="faq-section" className="py-10 sm:py-16 bg-white">
            <div className="container mx-auto px-2 sm:px-4 max-w-2xl md:max-w-4xl">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-2xl sm:text-4xl font-bold text-center mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-400"
                >
                    {t('provider.landing.faq_title')}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-base sm:text-lg text-gray-600 text-center mb-8 sm:mb-12"
                >
                    {t('provider.landing.faq_subtitle')}
                </motion.p>
                <div className="space-y-4">
                    {faqItems.map((item: any, index: number) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300"
                        >
                            <div
                                className="p-4 sm:p-6 cursor-pointer"
                                onClick={() => setOpenFAQIndex(openFAQIndex === index ? null : index)}
                            >
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                                    {item.question}
                                </h3>
                                {openFAQIndex === index && (
                                    <p className="text-gray-600 text-sm sm:text-base">{item.answer}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex justify-center mt-8 sm:mt-12"
                >
                    <button
                        onClick={handleButtonClick}
                        className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border border-transparent text-base sm:text-lg font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                    >
                        {isLoggedIn ? t('provider.landing.edit_profile') : t('provider.landing.pre_register')}
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

// ───────── Main Page Component ─────────
const ProviderLandingPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

    useEffect(() => {
        const checkProviderStatus = async () => {
            const userId = getCookie('providerId');
            const token = getCookie('token');
            
            if (userId && token) {
                setIsLoggedIn(true);
                try {
                    const response = await fetch(`${API_BASE_URL}/provider/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        // Section: Check for super admin email or admin role
                        const isSuperAdmin = data.email === 'vitago.swe@gmail.com';
                        const isAdminRole = data.role === 'admin';
                        setIsAdmin(isSuperAdmin || isAdminRole);
                    }
                } catch (err) {
                    console.error('Error checking provider status:', err);
                }
            }
        };
        
        checkProviderStatus();
    }, []);

    const handleButtonClick = () => {
        if (isLoggedIn) {
            navigate("/register/provider?step=2");
        } else {
            navigate("/register/provider");
        }
    };

    const handleLoginClick = () => {
        navigate("/login/provider");
    };

    const handleAdminPanelClick = () => {
        navigate("/admin");
    };

    return (
        <div className="relative min-h-screen flex flex-col">
            {/* Top Left: Logo + Language Selector */}
            <div className="fixed top-2 left-2 sm:left-8 z-50 flex items-center gap-3">
                {/* Vitago Logo as text, clickable */}
                <a href="/" className="group flex items-center transform hover:scale-[1.02] transition-all duration-300">
                    <span className="text-2xl sm:text-3xl font-extrabold transition-all duration-300">
                        <span className="text-teal-600 group-hover:text-teal-700">Vitago</span>
                    </span>
                    <div className="relative ml-1">
                        <div className="absolute inset-0 bg-teal-400 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
                        <div className="relative h-2 w-2 bg-teal-500 rounded-full group-hover:animate-ping"></div>
                    </div>
                </a>
                {/* Language Selector */}
                <ChangeLang />
            </div>
            {/* Hero Section */}
            <HeroSection 
                isLoggedIn={isLoggedIn} 
                isAdmin={isAdmin}
                handleButtonClick={handleButtonClick} 
                handleLoginClick={handleLoginClick}
                handleAdminPanelClick={handleAdminPanelClick}
            />
            {/* Down Arrow Animation */}
            <div className="relative">
                <motion.div
                    className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer z-10 hidden sm:block"
                    initial={{ y: 0 }}
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    onClick={() => {
                        document.querySelector('#why-choose-section')?.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }}
                >
                    <ChevronDown className="w-8 h-8 sm:w-10 sm:h-10 text-teal-500" />
                </motion.div>
            </div>
            <AdvantagesSection handleButtonClick={handleButtonClick} isLoggedIn={isLoggedIn} />
            <CalculatePriceSectionWrapper handleButtonClick={handleButtonClick} isLoggedIn={isLoggedIn} />
            <FAQSection handleButtonClick={handleButtonClick} isLoggedIn={isLoggedIn} openFAQIndex={openFAQIndex} setOpenFAQIndex={setOpenFAQIndex} />
            <Footer />
        </div>
    );
};

export default ProviderLandingPage;