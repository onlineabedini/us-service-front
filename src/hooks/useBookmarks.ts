import { useState, useEffect, useCallback } from 'react';
import { clientService } from '@/services/client.service';
import { BookmarkedProvider, BookmarkStatus } from '@/types/bookmark';
import { toast } from 'sonner';

// Custom hook for bookmark functionality
export const useBookmarks = (clientId: string | null) => {
  const [bookmarkedProviders, setBookmarkedProviders] = useState<BookmarkedProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bookmarked providers
  const loadBookmarkedProviders = useCallback(async () => {
    if (!clientId) {
      setBookmarkedProviders([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const providers = await clientService.getBookmarkedProviders(clientId);
      setBookmarkedProviders(providers);
    } catch (err) {
      console.error('Failed to load bookmarked providers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
      toast.error('Failed to load bookmarked providers');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Bookmark a provider
  const bookmarkProvider = useCallback(async (providerId: string) => {
    if (!clientId) {
      toast.error('Please log in to bookmark providers');
      return false;
    }

    try {
      await clientService.bookmarkProvider(clientId, providerId);
      toast.success('Provider bookmarked successfully');
      
      // Reload bookmarked providers to update the list
      await loadBookmarkedProviders();
      return true;
    } catch (error) {
      console.error('Failed to bookmark provider:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to bookmark provider');
      return false;
    }
  }, [clientId, loadBookmarkedProviders]);

  // Remove bookmark
  const removeBookmark = useCallback(async (providerId: string) => {
    if (!clientId) {
      toast.error('Please log in to manage bookmarks');
      return false;
    }

    try {
      await clientService.removeBookmark(clientId, providerId);
      toast.success('Bookmark removed successfully');
      
      // Update local state immediately for better UX
      setBookmarkedProviders(prev => prev.filter(provider => provider.id !== providerId));
      return true;
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove bookmark');
      return false;
    }
  }, [clientId]);

  // Check if a provider is bookmarked
  const checkBookmarkStatus = useCallback(async (providerId: string): Promise<boolean> => {
    if (!clientId) return false;

    try {
      const status: BookmarkStatus = await clientService.checkBookmarkStatus(clientId, providerId);
      return status.isBookmarked;
    } catch (error) {
      console.error('Failed to check bookmark status:', error);
      return false;
    }
  }, [clientId]);

  // Toggle bookmark status
  const toggleBookmark = useCallback(async (providerId: string) => {
    const isBookmarked = bookmarkedProviders.some(provider => provider.id === providerId);
    
    if (isBookmarked) {
      return await removeBookmark(providerId);
    } else {
      return await bookmarkProvider(providerId);
    }
  }, [bookmarkedProviders, bookmarkProvider, removeBookmark]);

  // Load bookmarks on mount and when clientId changes
  useEffect(() => {
    loadBookmarkedProviders();
  }, [loadBookmarkedProviders]);

  return {
    bookmarkedProviders,
    loading,
    error,
    bookmarkProvider,
    removeBookmark,
    checkBookmarkStatus,
    toggleBookmark,
    refreshBookmarks: loadBookmarkedProviders
  };
}; 