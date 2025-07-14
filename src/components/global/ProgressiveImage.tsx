// Simple progressive image loader with fallback and skeleton
import React, { useState } from "react";

const ProgressiveImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}> = ({ src, alt, className = "", placeholder = "/assets/img/provider.jpg" }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative ${className}`} style={{ minHeight: '100%' }}>
      {/* Skeleton/placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg z-0" />
      )}
      <img
        src={error ? placeholder : src}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-500 rounded-lg ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ position: "relative", zIndex: 2, minHeight: '100%' }}
      />
    </div>
  );
};

export default ProgressiveImage; 