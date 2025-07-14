import React, { useState, useEffect } from 'react';
import { clientService } from '@/services/client.service';
import { BookmarkStatus } from '@/types/bookmark';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';

interface BookmarkButtonProps {
  clientId: string;
  providerId: string;
  onToggle?: () => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'overlay' | 'card' | 'default';
}

// Bookmark button component for toggling provider bookmarks
const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  clientId,
  providerId,
  onToggle,
  className = '',
  size = 'default',
  variant = 'default'
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check initial bookmark status
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const status: BookmarkStatus = await clientService.checkBookmarkStatus(clientId, providerId);
        setIsBookmarked(status.isBookmarked);
      } catch (error) {
        console.error('Failed to check bookmark status:', error);
      } finally {
        setInitialized(true);
      }
    };

    if (clientId && providerId) {
      checkBookmarkStatus();
    }
  }, [clientId, providerId]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    // Prevent event bubbling to parent elements
    e.stopPropagation();
    
    if (!clientId || !providerId) return;
    
    setLoading(true);
    try {
      if (isBookmarked) {
        await clientService.removeBookmark(clientId, providerId);
        setIsBookmarked(false);
        toast.success('Bookmark removed successfully');
      } else {
        await clientService.bookmarkProvider(clientId, providerId);
        setIsBookmarked(true);
        toast.success('Provider bookmarked successfully');
      }
      onToggle?.();
    } catch (error) {
      console.error('Bookmark operation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Bookmark operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'overlay':
        return `
          w-10 h-10 p-0 rounded-full 
          backdrop-blur-md bg-white/90 hover:bg-white 
          border border-white/50 shadow-lg hover:shadow-xl
          text-gray-600 hover:text-yellow-500
          transition-all duration-300 hover:scale-110
          ${isBookmarked ? 'bg-yellow-50 text-yellow-500 border-yellow-200' : ''}
        `;
      case 'card':
        return `
          w-8 h-8 p-0 rounded-full 
          bg-white/95 hover:bg-white 
          border border-gray-200/50 shadow-md hover:shadow-lg
          text-gray-500 hover:text-yellow-500
          transition-all duration-300 hover:scale-110
          ${isBookmarked ? 'bg-yellow-50 text-yellow-500 border-yellow-200' : ''}
        `;
      default:
        return `
          hover:scale-105 transition-all duration-200
          ${isBookmarked ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-500 hover:text-yellow-500'}
        `;
    }
  };

  // Get icon size based on button size and variant
  const getIconSize = () => {
    if (variant === 'overlay') return 'h-5 w-5';
    if (variant === 'card') return 'h-4 w-4';
    
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-8 w-8';
      default: return 'h-6 w-6';
    }
  };

  // Don't render until initialized to prevent flickering
  if (!initialized) {
    return (
      <Button
        variant={variant === 'overlay' || variant === 'card' ? 'ghost' : 'ghost'}
        size={variant === 'overlay' || variant === 'card' ? 'icon' : size}
        className={`animate-pulse ${getVariantStyles()} ${className}`}
        disabled
      >
        <Bookmark className={getIconSize()} />
      </Button>
    );
  }

  return (
    <Button
      variant={variant === 'overlay' || variant === 'card' ? 'ghost' : 'ghost'}
      size={variant === 'overlay' || variant === 'card' ? 'icon' : size}
      onClick={handleBookmarkToggle}
      disabled={loading}
      className={`${getVariantStyles()} ${className}`}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {loading ? (
        <div className={`animate-spin rounded-full border-b-2 border-current ${getIconSize()}`} />
      ) : isBookmarked ? (
        <BookmarkCheck className={`${getIconSize()} fill-current`} />
      ) : (
        <Bookmark className={getIconSize()} />
      )}
    </Button>
  );
};

export default BookmarkButton; 