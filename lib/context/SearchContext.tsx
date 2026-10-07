'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Business } from '@/types';
import { LeadScoreResult } from '@/lib/leads/types';

interface CurrentSearchCriteria {
  location: string;
  industry: string;
}

interface SearchContextType {
  // Search State
  currentSearch: CurrentSearchCriteria;
  businesses: Business[];
  currentPage: number;
  pageSize: number;
  nextPageToken?: string;
  hasMore: boolean;
  hasSearched: boolean;
  isSearching: boolean;
  isLoadingPage: boolean;
  searchError: string | null;

  // Analysis State
  analyses: Record<string, LeadScoreResult>;
  isBatchAnalyzing: boolean;
  batchProgress: { current: number; total: number };

  // Saved Leads State
  savedBusinessIds: string[];

  // Actions
  performSearch: (criteria: CurrentSearchCriteria) => Promise<void>;
  goToPage: (targetPage: number) => Promise<void>;
  resetSearch: () => void;
  analyzeSingle: (business: Business) => Promise<void>;
  analyzeBatch: (targetBusinesses: Business[]) => Promise<void>;
  toggleSaveLead: (business: Business) => Promise<void>;
  refreshSavedLeads: () => Promise<void>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const CACHE_KEY = 'leadgen_find_leads_cache_v1';

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [currentSearch, setCurrentSearch] = useState<CurrentSearchCriteria>({
    location: '',
    industry: '',
  });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [analyses, setAnalyses] = useState<Record<string, LeadScoreResult>>({});
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  const [savedBusinessIds, setSavedBusinessIds] = useState<string[]>([]);

  // 1. Fetch user's saved leads on mount to ensure bookmark indicators are accurate
  const refreshSavedLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.leads)) {
        const ids = data.leads.map((l: any) => l.businessId || l.business?.googlePlaceId).filter(Boolean);
        setSavedBusinessIds(ids);
      }
    } catch (err) {
      console.warn('[SearchContext] Failed to load saved leads on mount', err);
    }
  }, []);

  // 2. Hydrate search state from sessionStorage if available
  useEffect(() => {
    refreshSavedLeads();

    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.currentSearch && parsed.businesses && parsed.businesses.length > 0) {
            setCurrentSearch(parsed.currentSearch);
            setBusinesses(parsed.businesses);
            setCurrentPage(parsed.currentPage || 1);
            setNextPageToken(parsed.nextPageToken || undefined);
            setHasMore(Boolean(parsed.hasMore));
            setHasSearched(true);
            if (parsed.analyses) {
              setAnalyses(parsed.analyses);
            }
          }
        }
      } catch (err) {
        console.warn('[SearchContext] Could not restore search cache', err);
      }
    }
  }, [refreshSavedLeads]);

  // 3. Persist search state to sessionStorage when it changes
  const saveToSessionCache = useCallback(
    (
      newCriteria: CurrentSearchCriteria,
      newBusinesses: Business[],
      newPage: number,
      newNextPageToken?: string,
      newHasMore?: boolean,
      newAnalyses?: Record<string, LeadScoreResult>
    ) => {
      if (typeof window === 'undefined') return;
      try {
        if (newBusinesses.length === 0) {
          sessionStorage.removeItem(CACHE_KEY);
          return;
        }
        const stateToSave = {
          currentSearch: newCriteria,
          businesses: newBusinesses,
          currentPage: newPage,
          nextPageToken: newNextPageToken,
          hasMore: newHasMore,
          analyses: newAnalyses || analyses,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(stateToSave));
      } catch (err) {
        console.warn('[SearchContext] Failed to save search cache to sessionStorage', err);
      }
    },
    [analyses]
  );

  // 4. Perform a new Search (Page 1)
  const performSearch = async (criteria: CurrentSearchCriteria) => {
    setIsSearching(true);
    setSearchError(null);
    setCurrentSearch(criteria);
    setCurrentPage(1);
    setNextPageToken(undefined);
    setHasMore(false);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: criteria.location,
          industry: criteria.industry,
          limit: pageSize,
        }),
      });

      let data: any;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server error (${res.status})`);
      }

      if (!res.ok || !data.success) {
        setSearchError(data.error || 'Failed to search for businesses.');
        setBusinesses([]);
        setHasSearched(true);
        saveToSessionCache(criteria, [], 1, undefined, false, {});
      } else {
        const fetchedBusinesses: Business[] = data.businesses || [];
        setBusinesses(fetchedBusinesses);
        setNextPageToken(data.nextPageToken || undefined);
        setHasMore(Boolean(data.hasMore));
        setCurrentPage(1);
        setHasSearched(true);
        saveToSessionCache(
          criteria,
          fetchedBusinesses,
          1,
          data.nextPageToken || undefined,
          Boolean(data.hasMore),
          analyses
        );
      }
    } catch (err: any) {
      console.error('[Search Error]', err);
      setSearchError(
        err?.message && !err.message.includes('<!DOCTYPE')
          ? err.message
          : 'Failed to retrieve search results. Please check your API keys or try again.'
      );
      setBusinesses([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  // 5. Navigate to a page (using in-memory cache if loaded, or fetching from Google Places)
  const goToPage = async (targetPage: number) => {
    if (targetPage === currentPage || targetPage < 1) return;

    const loadedPages = Math.ceil(businesses.length / pageSize);

    // Case A: Page is already in memory -> navigate instantly with 0 API requests
    if (targetPage <= loadedPages) {
      setCurrentPage(targetPage);
      saveToSessionCache(currentSearch, businesses, targetPage, nextPageToken, hasMore, analyses);
      window.scrollTo({ top: 380, behavior: 'smooth' });
      return;
    }

    // Case B: Page is not yet loaded -> fetch next page from Google Places via nextPageToken
    if (!nextPageToken || !hasMore) {
      return;
    }

    setIsLoadingPage(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: currentSearch.location,
          industry: currentSearch.industry,
          pageToken: nextPageToken,
          limit: pageSize,
        }),
      });

      let data: any;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server error (${res.status})`);
      }

      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to retrieve additional results. Please try again.');
      } else {
        const newBusinesses: Business[] = data.businesses || [];
        let updatedList: Business[] = [];

        setBusinesses((prev) => {
          const existingIds = new Set(prev.map((b) => b.googlePlaceId));
          const uniqueNew = newBusinesses.filter((b) => !existingIds.has(b.googlePlaceId));
          updatedList = [...prev, ...uniqueNew];
          return updatedList;
        });

        const newNextToken = data.nextPageToken || undefined;
        const newHasMore = Boolean(data.hasMore);

        setNextPageToken(newNextToken);
        setHasMore(newHasMore);
        setCurrentPage(targetPage);

        saveToSessionCache(
          currentSearch,
          updatedList.length > 0 ? updatedList : [...businesses, ...newBusinesses],
          targetPage,
          newNextToken,
          newHasMore,
          analyses
        );
        window.scrollTo({ top: 380, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('[Page Navigation Error]', err);
      alert(err?.message || 'Error fetching additional leads.');
    } finally {
      setIsLoadingPage(false);
    }
  };

  // 6. Reset Search
  const resetSearch = () => {
    setBusinesses([]);
    setHasSearched(false);
    setSearchError(null);
    setAnalyses({});
    setCurrentPage(1);
    setNextPageToken(undefined);
    setHasMore(false);
    setCurrentSearch({ location: '', industry: '' });
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CACHE_KEY);
    }
  };

  // 7. Toggle Bookmark / Save Lead in Supabase CRM
  const toggleSaveLead = async (business: Business) => {
    const bizId = business.googlePlaceId;
    const isCurrentlySaved = savedBusinessIds.includes(bizId);

    // Optimistic UI state update
    if (isCurrentlySaved) {
      setSavedBusinessIds((prev) => prev.filter((id) => id !== bizId));
    } else {
      setSavedBusinessIds((prev) => [...prev, bizId]);
    }

    try {
      if (isCurrentlySaved) {
        // Unsave lead from CRM
        const res = await fetch(`/api/leads/${encodeURIComponent(bizId)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || 'Failed to remove saved lead.');
        }
      } else {
        // Save lead directly to Supabase CRM with full business data
        const res = await fetch('/api/leads/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: bizId,
            business,
            status: 'NEW',
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || 'Failed to save lead to CRM.');
        }
      }
    } catch (err: any) {
      console.error('[Toggle Save Error]', err);
      // Rollback optimistic update on error
      if (isCurrentlySaved) {
        setSavedBusinessIds((prev) => (prev.includes(bizId) ? prev : [...prev, bizId]));
      } else {
        setSavedBusinessIds((prev) => prev.filter((id) => id !== bizId));
      }
      alert(err.message || 'Error updating bookmark status.');
    }
  };

  // 8. Analyze single business
  const analyzeSingle = async (business: Business) => {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.googlePlaceId,
          business,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.result) {
        setAnalyses((prev) => {
          const next = { ...prev, [business.googlePlaceId]: data.result };
          saveToSessionCache(currentSearch, businesses, currentPage, nextPageToken, hasMore, next);
          return next;
        });
      }
    } catch (err) {
      console.error('[Analyze Single Error]', err);
    }
  };

  // 9. Batch analyze businesses
  const analyzeBatch = async (targetBusinesses: Business[]) => {
    if (targetBusinesses.length === 0) return;
    setIsBatchAnalyzing(true);
    setBatchProgress({ current: 0, total: targetBusinesses.length });

    try {
      const res = await fetch('/api/analyze/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businesses: targetBusinesses }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.results)) {
        const newMap: Record<string, LeadScoreResult> = {};
        for (const item of data.results) {
          if (item.businessId) {
            newMap[item.businessId] = item;
          }
        }
        setAnalyses((prev) => {
          const next = { ...prev, ...newMap };
          saveToSessionCache(currentSearch, businesses, currentPage, nextPageToken, hasMore, next);
          return next;
        });
      }
    } catch (err) {
      console.error('[Batch Analyze Error]', err);
    } finally {
      setIsBatchAnalyzing(false);
      setBatchProgress({ current: targetBusinesses.length, total: targetBusinesses.length });
    }
  };

  return (
    <SearchContext.Provider
      value={{
        currentSearch,
        businesses,
        currentPage,
        pageSize,
        nextPageToken,
        hasMore,
        hasSearched,
        isSearching,
        isLoadingPage,
        searchError,
        analyses,
        isBatchAnalyzing,
        batchProgress,
        savedBusinessIds,
        performSearch,
        goToPage,
        resetSearch,
        analyzeSingle,
        analyzeBatch,
        toggleSaveLead,
        refreshSavedLeads,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
