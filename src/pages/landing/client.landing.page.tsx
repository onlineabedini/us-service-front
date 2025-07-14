// ───────── Imports ─────────
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import registerBg from "@/assets/img/register-bg.png";
import Footer from "@/components/layout/footer";
import ChangeLang from "@/components/global/changeLangDropdonw";
import { getCookie } from '@/utils/authCookieService';
import { useTranslation } from "react-i18next";
import { Shield, Clock, Star, Sparkles, Bookmark } from "lucide-react";
import LazyImage from "@/components/global/LazyImage";

// ───────── Simple Analytics Tracking ─────────
// Replace this with your real analytics integration
const trackAnalyticsEvent = (event: string, data?: Record<string, any>) => {
    // For now, just log to the console

};

// ───────── Hero Section ─────────
const HeroSection = ({ isLoggedIn, handleButtonClick, handleLoginClick }: any) => {
    const { t } = useTranslation();
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
                    {t('client.landing.hero_title', 'Welcome to Vitago Client Portal')}
                </h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-base sm:text-lg md:text-xl text-white max-w-2xl md:max-w-3xl mx-auto mb-8"
                >
                    {t('client.landing.hero_subtitle', 'Book trusted cleaning services easily and securely.')}
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
                        {isLoggedIn ? t('client.landing.edit_profile', 'Edit Profile') : t('client.landing.register', 'Register as Client')}
                    </button>
                    {/* Add Market Place button when logged in */}
                    {isLoggedIn && (
                        <button
                            onClick={() => {
                                trackAnalyticsEvent('client_market_place_click');
                                window.location.href = '/marketPlace';
                            }}
                            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-teal-500 text-base sm:text-lg font-medium rounded-xl text-teal-600 bg-white hover:bg-teal-50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                        >
                            {t('client.landing.market_place', 'Market Place')}
                        </button>
                    )}
                    {/* Add Bookmarks button when logged in */}
                    {isLoggedIn && (
                        <button
                            onClick={() => {
                                trackAnalyticsEvent('client_bookmarks_click');
                                const clientId = getCookie('clientId');
                                if (clientId) {
                                    window.location.href = `/bookmarks/${clientId}`;
                                }
                            }}
                            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-yellow-500 text-base sm:text-lg font-medium rounded-xl text-yellow-600 bg-white hover:bg-yellow-50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                        >
                            <Bookmark className="w-5 h-5 mr-2" />
                            {t('client.landing.bookmarks', 'Bookmarks')}
                        </button>
                    )}
                    {!isLoggedIn && (
                        <button
                            onClick={handleLoginClick}
                            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-teal-500 text-base sm:text-lg font-medium rounded-xl text-teal-600 bg-white hover:bg-teal-50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                        >
                            {t('client.landing.login', 'Login')}
                        </button>
                    )}
                </motion.div>
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
                {t('client.landing.vitago_description', 'Vitago connects you with top-rated cleaning professionals for your home or business.')}
            </p>
        </motion.div>
    );
};

// ───────── Why Choose Vitago Section ─────────
const WhyChooseVitagoSection = () => {
    const { t } = useTranslation();
    return (
        <section id="why-choose-section" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 max-w-7xl">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900"
                >
                    {t('client.landing.why_choose_title', 'Why Choose Vitago?')}
                </motion.h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Trusted Professionals */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {t('client.landing.advantages.trusted.title', 'Trusted Professionals')}
                        </h3>
                        <p className="text-gray-600">
                            {t('client.landing.advantages.trusted.description', 'All our cleaning providers are vetted and background-checked for your peace of mind')}
                        </p>
                    </motion.div>

                    {/* Flexible Scheduling */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {t('client.landing.advantages.flexible.title', 'Flexible Scheduling')}
                        </h3>
                        <p className="text-gray-600">
                            {t('client.landing.advantages.flexible.description', 'Book services at your convenience with our easy-to-use scheduling system')}
                        </p>
                    </motion.div>

                    {/* Quality Guaranteed */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4">
                            <Star className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {t('client.landing.advantages.quality.title', 'Quality Guaranteed')}
                        </h3>
                        <p className="text-gray-600">
                            {t('client.landing.advantages.quality.description', 'We ensure high-quality service with our satisfaction guarantee and rating system')}
                        </p>
                    </motion.div>

                    {/* Easy Booking */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {t('client.landing.advantages.booking.title', 'Easy Booking')}
                        </h3>
                        <p className="text-gray-600">
                            {t('client.landing.advantages.booking.description', 'Simple and secure booking process with transparent pricing and instant confirmation')}
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

// ───────── Main Page Component ─────────
const ClientLandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check if client is logged in
    useEffect(() => {
        let userId = getCookie('clientId');
        setIsLoggedIn(!!userId);
    }, []);

    // Handle main button click
    const handleButtonClick = () => {
        // Track analytics event for CTA
        trackAnalyticsEvent(isLoggedIn ? 'client_edit_profile_click' : 'client_register_click');
        if (isLoggedIn) {
            navigate("/register/client?step=2");
        } else {
            navigate("/register/client");
        }
    };

    // Handle login button click
    const handleLoginClick = () => {
        // Track analytics event for login CTA
        trackAnalyticsEvent('client_login_click');
        navigate("/login/client");
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
            <HeroSection isLoggedIn={isLoggedIn} handleButtonClick={handleButtonClick} handleLoginClick={handleLoginClick} />
            {/* Why Choose Vitago Section */}
            <WhyChooseVitagoSection />
            {/* Footer */}
            <Footer />
        </div>
    );
};

export default ClientLandingPage; 