// StarRating.tsx - Renders star icons based on a numeric rating
import React from 'react';
import { Star, StarHalf } from 'lucide-react';

// Props for the StarRating component
interface StarRatingProps {
  rating: number; // e.g., 4.5
  max?: number; // default 5
  className?: string;
  starClassName?: string;
}

// Helper to render stars based on rating
const StarRating: React.FC<StarRatingProps> = ({ rating, max = 5, className = '', starClassName = '' }) => {
  // Calculate number of full, half, and empty stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = max - fullStars - (hasHalfStar ? 1 : 0);

  // Render stars
  return (
    <span className={`flex items-center gap-0.5 ${className}`} aria-label={`Rating: ${rating} out of ${max}`}> 
      {/* Full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={`w-6 h-6 fill-yellow-400 text-yellow-400 ${starClassName}`} />
      ))}
      {/* Half star */}
      {hasHalfStar && <StarHalf className={`w-6 h-6 fill-yellow-400 text-yellow-400 ${starClassName}`} />}
      {/* Empty stars */}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={`w-6 h-6 text-yellow-400/30 ${starClassName}`} />
      ))}
    </span>
  );
};

// Export both default and named export for compatibility
export default StarRating;
export { StarRating }; 