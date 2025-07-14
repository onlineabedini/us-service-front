import React from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import SimilarProviders from "@/components/global/similarProviders";
import AdvantagesSection from "./sections/AdvantagesSection";
import ServiceAreaSearch from "@/components/global/ServiceAreaSearch";
import { motion } from "framer-motion";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-teal-50">
            <div className="sticky top-2 z-10">
                <Navbar />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-teal-100/20 via-transparent to-transparent" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative text-center"
                >
                    <h1 className="text-6xl font-extrabold tracking-tight text-gray-900 sm:text-7xl md:text-8xl mb-8 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-400">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="block"
                        >
                            Find Your Perfect
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="block"
                        >
                            Cleaning Service
                        </motion.span>
                    </h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 max-w-md mx-auto text-lg text-gray-600 sm:text-xl md:mt-8 md:text-2xl md:max-w-3xl"
                    >
                        Connect with trusted cleaning professionals in your area. Book services, manage appointments, and ensure your space stays spotless.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8"
                    >
                        <ServiceAreaSearch />
                    </motion.div>
                </motion.div>
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="max-w-7xl mx-auto"
            >
                <SimilarProviders />
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <AdvantagesSection />
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="py-24"
            >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-400">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-gray-600 text-center mb-12">
                        Common questions about becoming a service provider on our platform
                    </p>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        <AccordionItem value="item-0" className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <span className="text-left font-medium text-gray-900">
                                    How do I become a service provider?
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 py-4 text-gray-600">
                                Sign up as a provider, complete your profile with your services and experience, and start receiving booking requests. Our platform makes it easy to manage your schedule and connect with clients.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-1" className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <span className="text-left font-medium text-gray-900">
                                    What are the fees and commissions?
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 py-4 text-gray-600">
                                We have a transparent fee structure based on completed bookings. You keep the majority of your earnings, and our platform fee covers payment processing, marketing, and customer support services.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2" className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <span className="text-left font-medium text-gray-900">
                                    How do I get paid?
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 py-4 text-gray-600">
                                Payments are processed securely through our platform. After completing a service, the payment is automatically transferred to your linked bank account within 1-2 business days.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3" className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <span className="text-left font-medium text-gray-900">
                                    What support do you offer providers?
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 py-4 text-gray-600">
                                We offer 24/7 customer support, insurance coverage for services, marketing tools to grow your business, and a dedicated provider success team to help you thrive on our platform.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </motion.div>
            <div className="bg-gradient-to-b from-teal-50 to-teal-100/30 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                >
                    <div className="text-center">
                        <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-400">
                            Join Our Growing Community
                        </h2>
                        <p className="mt-6 text-xl text-gray-600">
                            Connect with thousands of cleaning professionals and clients. Share experiences, grow your business, and be part of something bigger.
                        </p>
                        <div className="mt-10 flex justify-center space-x-6">
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="/landing/provider"
                                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 transition-all duration-300"
                            >
                                Join as Provider
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="/landing/client"
                                className="inline-flex items-center px-8 py-4 border-2 border-teal-500 text-lg font-medium rounded-xl text-teal-600 bg-white hover:bg-teal-50 transition-all duration-300"
                            >
                                Join as Client
                            </motion.a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LandingPage;