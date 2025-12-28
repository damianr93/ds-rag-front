import { useMemo } from 'react';

interface LoadingStates {
  isLoading: boolean;
  isFeedsLoading: boolean;
  isSearching: boolean;
  isScraping: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isAnyLoading: boolean;
}

export const useLoadingStates = (state: any): LoadingStates => {
  return useMemo(() => {
    const newsLoading = state.news.loading;
    const feedsLoading = state.feeds.loading;
    const authLoading = state.auth.loading;
    // const cartLoading = false; // Cart doesn't have loading state
    const disclaimerLoading = state.disclaimer.loading;
    const globalRssLoading = state.globalRss.loading;
    const adminRssLoading = state.adminRss.loading;
    const ragLoading = state.rag.loading;

    const isLoading = newsLoading;
    const isFeedsLoading = feedsLoading;
    const isSearching = false; // Could be derived from search state
    const isScraping = state.news.scrapingSelection;
    const hasError = !!(state.news.error || state.feeds.error || state.auth.error);
    const errorMessage = state.news.error || state.feeds.error || state.auth.error;
    const isAnyLoading = isLoading || isFeedsLoading || authLoading || disclaimerLoading || 
                        globalRssLoading || adminRssLoading || ragLoading;

    return {
      isLoading,
      isFeedsLoading,
      isSearching,
      isScraping,
      hasError,
      errorMessage,
      isAnyLoading,
    };
  }, [state]);
};
