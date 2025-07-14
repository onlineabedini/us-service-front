import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-2 z-10">
        <Navbar />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="block"
            >
              About
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="block text-teal-600"
            >
              Vitago
            </motion.span>
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
          >
            Connecting quality cleaning services with those who need them.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-teal-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600">
              At Vitago, we're dedicated to revolutionizing the cleaning service industry by creating
              a seamless connection between professional cleaners and clients. Our platform ensures quality,
              reliability, and satisfaction in every cleaning service provided.
            </p>
          </motion.div>
    
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-teal-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center">
                <span className="h-2 w-2 bg-teal-500 rounded-full mr-2"></span>
                Verified Professional Cleaners
              </li>
              <li className="flex items-center">
                <span className="h-2 w-2 bg-teal-500 rounded-full mr-2"></span>
                Secure Booking System
              </li>
              <li className="flex items-center">
                <span className="h-2 w-2 bg-teal-500 rounded-full mr-2"></span>
                Quality Guaranteed Services
              </li>
              <li className="flex items-center">
                <span className="h-2 w-2 bg-teal-500 rounded-full mr-2"></span>
                Flexible Scheduling
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;