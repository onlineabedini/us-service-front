import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface InteractiveStarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  max?: number;
  className?: string;
  starClassName?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const InteractiveStarRating: React.FC<InteractiveStarRatingProps> = ({
  rating,
  onRatingChange,
  max = 5,
  className = '',
  starClassName = '',
  disabled = false,
  size = 'md'
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const getStarSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-6 h-6';
      case 'lg': return 'w-8 h-8';
      case 'xl': return 'w-10 h-10';
      case '2xl': return 'w-12 h-12';
      case '3xl': return 'w-16 h-16';
      case '4xl': return 'w-20 h-20';
      default: return 'w-6 h-6';
    }
  };

  const handleStarClick = (starIndex: number) => {
    if (!disabled) {
      onRatingChange(starIndex);
    }
  };

  const handleStarHover = (starIndex: number) => {
    if (!disabled) {
      setHoverRating(starIndex);
    }
  };

  const handleStarLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  const getStarColor = (starIndex: number) => {
    const currentRating = hoverRating || rating;
    if (starIndex <= currentRating) {
      return 'fill-yellow-400 text-yellow-400';
    }
    return 'text-yellow-400/30';
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[...Array(max)].map((_, index) => {
        const starIndex = index + 1;
        return (
          <button
            key={starIndex}
            type="button"
            onClick={() => handleStarClick(starIndex)}
            onMouseEnter={() => handleStarHover(starIndex)}
            onMouseLeave={handleStarLeave}
            disabled={disabled}
            className={`
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'} 
              transition-all duration-150 focus:outline-none rounded
            `}
          >
            <Star 
              className={`
                ${getStarSize()} transition-colors duration-150 
                ${getStarColor(starIndex)} 
                ${starClassName}
              `} 
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-600">
        {rating}/{max}
      </span>
    </div>
  );
};

export default InteractiveStarRating; 