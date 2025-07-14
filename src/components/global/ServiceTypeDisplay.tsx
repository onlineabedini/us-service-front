// Service Type Display Component
import React from 'react';
import { Tag } from 'lucide-react';

interface ServiceTypeDisplayProps {
  services: string[];
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

const ServiceTypeDisplay: React.FC<ServiceTypeDisplayProps> = ({ 
  services, 
  variant = 'default',
  className = ''
}) => {
  if (!services || services.length === 0) {
    return <span className="text-gray-400 italic">No services specified</span>;
  }

  // Handle case where services might be a string, null, or undefined (backward compatibility)
  const serviceArray = (() => {
    if (!services) return [];
    if (Array.isArray(services)) return services;
    if (typeof services === 'string') return [services];
    return [];
  })();

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {serviceArray.map((service, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full border border-teal-200"
          >
            <Tag className="w-3 h-3" />
            {service}
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`text-gray-900 ${className}`}>
        {serviceArray.join(', ')}
      </span>
    );
  }

  // Default variant - larger badges
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {serviceArray.map((service, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-teal-100 to-teal-50 text-teal-800 rounded-lg border border-teal-200 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Tag className="w-4 h-4" />
          {service}
        </span>
      ))}
    </div>
  );
};

export default ServiceTypeDisplay; 