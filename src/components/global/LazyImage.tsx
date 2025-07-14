// LazyImage component for optimized image loading with blur-up effect
import React, { useState, useEffect } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    placeholderSrc?: string;
    onLoad?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    className = '',
    style = {},
    placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=',
    onLoad
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(placeholderSrc);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        
        img.onload = () => {
            setCurrentSrc(src);
            setIsLoaded(true);
            onLoad?.();
        };

        img.onerror = () => {
            setIsError(true);
            console.error(`Failed to load image: ${src}`);
        };

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src, onLoad]);

    return (
        <div className="relative w-full h-full">
            {/* Placeholder/Error State */}
            <div 
                className={`absolute inset-0 transition-opacity duration-500 ${
                    isLoaded ? 'opacity-0' : 'opacity-100'
                }`}
            >
                <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg" />
                {isError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                        <span className="text-red-500 text-sm">Failed to load image</span>
                    </div>
                )}
            </div>

            {/* Actual Image */}
            <img
                src={currentSrc}
                alt={alt}
                className={`w-full h-full transition-all duration-500 ${
                    isLoaded 
                        ? 'opacity-100 scale-100 blur-0' 
                        : 'opacity-0 scale-105 blur-lg'
                } ${className}`}
                style={{
                    ...style,
                    objectFit: 'cover',
                }}
                loading="lazy"
            />
        </div>
    );
};

export default LazyImage; 