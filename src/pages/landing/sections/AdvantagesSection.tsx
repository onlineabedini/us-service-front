import React from "react";
import { Shield, Clock, UserCheck, Sparkles } from "lucide-react";

const AdvantagesSection: React.FC = () => {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Why Choose Vitago?
          </h2>
          <p className="text-lg text-gray-500">
            Experience the best in professional cleaning services with our platform
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Advantage 1 */}
          <div className="text-center p-6 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Trusted Professionals</h3>
            <p className="text-gray-600">All our cleaning providers are vetted and background-checked for your peace of mind</p>
          </div>
          {/* Advantage 2 */}
          <div className="text-center p-6 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Scheduling</h3>
            <p className="text-gray-600">Book services at your convenience with our easy-to-use scheduling system</p>
          </div>
          {/* Advantage 3 */}
          <div className="text-center p-6 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Guaranteed</h3>
            <p className="text-gray-600">Satisfaction guaranteed with our quality assurance and customer support</p>
          </div>
          {/* Advantage 4 */}
          <div className="text-center p-6 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors duration-300">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Services</h3>
            <p className="text-gray-600">Tailored cleaning solutions to meet your specific needs and preferences</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvantagesSection;