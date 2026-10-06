'use client';

import React, { useState, useMemo } from 'react';
import { Business, SearchFilters } from '@/types';
import { LeadScoreResult } from '@/lib/leads/types';
import BusinessCard from './BusinessCard';
import BusinessFilters from './BusinessFilters';
import BusinessSort from './BusinessSort';
import { RotateCcw, Zap, Loader2, Sparkles } from 'lucide-react';

interface SearchResultsProps {
  businesses: Business[];
  location: string;
  industry: string;
  savedBusinessIds: string[];
  analyses: Record<string, LeadScoreResult>;
  onToggleSave: (business: Business) => void;
  onAnalyzeSingle: (business: Business) => Promise<void>;
  onAnalyzeBatch: (businesses: Business[]) => Promise<void>;
  onResetSearch: () => void;
  isBatchAnalyzing?: boolean;
  batchProgress?: { current: number; total: number };
}

export default function SearchResults({
  businesses,
  location,
  industry,
  savedBusinessIds,
  analyses,
  onToggleSave,
  onAnalyzeSingle,
  onAnalyzeBatch,
  onResetSearch,
  isBatchAnalyzing = false,
  batchProgress,
}: SearchResultsProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    rating: 'all',
    website: 'all',
    opportunity: 'all',
    minScore: 'all',
    sortBy: 'relevance',
  });

  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());

  const handleFilterChange = (updated: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleAnalyzeClick = async (business: Business) => {
    const id = business.googlePlaceId;
    setAnalyzingIds((prev) => new Set([...prev, id]));
    try {
      await onAnalyzeSingle(business);
    } finally {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Filter and sort logic
  const filteredAndSortedBusinesses = useMemo(() => {
    let result = [...businesses];

    // 1. Rating Filter
    if (filters.rating === '4.0+') {
      result = result.filter((b) => (b.rating ?? 0) >= 4.0);
    } else if (filters.rating === '4.5+') {
      result = result.filter((b) => (b.rating ?? 0) >= 4.5);
    }

    // 2. Website Filter
    if (filters.website === 'has_website') {
      result = result.filter((b) => b.hasWebsite);
    } else if (filters.website === 'no_website') {
      result = result.filter((b) => !b.hasWebsite);
    } else if (filters.website === 'poor_website') {
      result = result.filter((b) => {
        const analysis = analyses[b.googlePlaceId];
        return (
          !b.hasWebsite ||
          (analysis?.websiteAnalysis && analysis.websiteAnalysis.qualityScore < 50)
        );
      });
    }

    // 3. Opportunity Filter
    if (filters.opportunity !== 'all') {
      result = result.filter((b) => {
        const analysis = analyses[b.googlePlaceId];
        return analysis?.opportunityLevel === filters.opportunity;
      });
    }

    // 4. Min Score Filter
    if (filters.minScore === '90+') {
      result = result.filter((b) => (analyses[b.googlePlaceId]?.score ?? 0) >= 90);
    } else if (filters.minScore === '75+') {
      result = result.filter((b) => (analyses[b.googlePlaceId]?.score ?? 0) >= 75);
    } else if (filters.minScore === '50+') {
      result = result.filter((b) => (analyses[b.googlePlaceId]?.score ?? 0) >= 50);
    }

    // 5. Sort
    if (filters.sortBy === 'score') {
      result.sort((a, b) => {
        const scoreA = analyses[a.googlePlaceId]?.score ?? (!a.hasWebsite ? 85 : 50);
        const scoreB = analyses[b.googlePlaceId]?.score ?? (!b.hasWebsite ? 85 : 50);
        return scoreB - scoreA;
      });
    } else if (filters.sortBy === 'rating') {
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (filters.sortBy === 'reviews') {
      result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    }

    return result;
  }, [businesses, filters, analyses]);

  const unanalyzedBusinesses = businesses.filter((b) => !analyses[b.googlePlaceId]);
  const hasAnalyzedLeads = Object.keys(analyses).length > 0;

  return (
    <section style={{ marginTop: '1.5rem' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            {businesses.length} businesses found
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            Showing verified Google Places results for <strong>{industry}</strong> in{' '}
            <strong>{location}</strong>
          </p>
        </div>

        {/* Batch Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {unanalyzedBusinesses.length > 0 && (
            <button
              type="button"
              onClick={() => onAnalyzeBatch(businesses.slice(0, 10))}
              disabled={isBatchAnalyzing}
              className="btn btn--yellow btn--sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isBatchAnalyzing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>
                    Analyzing {batchProgress ? `(${batchProgress.current}/${batchProgress.total})` : '...'}
                  </span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Analyze Top {Math.min(10, unanalyzedBusinesses.length)} Leads</span>
                </>
              )}
            </button>
          )}

          <BusinessSort
            sortBy={filters.sortBy}
            onSortChange={(sortBy) => handleFilterChange({ sortBy })}
          />

          <button
            type="button"
            onClick={onResetSearch}
            className="btn btn--secondary btn--sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={14} />
            <span>New Search</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <BusinessFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        totalCount={businesses.length}
        filteredCount={filteredAndSortedBusinesses.length}
        hasAnalyzedLeads={hasAnalyzedLeads}
      />

      {/* Cards Grid */}
      {filteredAndSortedBusinesses.length === 0 ? (
        <div
          className="neo-card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '2px solid #000',
            boxShadow: '4px 4px 0px 0px #000',
            background: 'var(--white)',
          }}
        >
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#444' }}>
            No businesses match your active filter criteria.
          </p>
          <button
            onClick={() =>
              setFilters({
                rating: 'all',
                website: 'all',
                opportunity: 'all',
                minScore: 'all',
                sortBy: 'relevance',
              })
            }
            className="btn btn--secondary btn--sm"
            style={{ marginTop: '1rem' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredAndSortedBusinesses.map((biz) => (
            <BusinessCard
              key={biz.googlePlaceId}
              business={biz}
              analysis={analyses[biz.googlePlaceId]}
              isAnalyzing={analyzingIds.has(biz.googlePlaceId) || isBatchAnalyzing}
              isSaved={savedBusinessIds.includes(biz.googlePlaceId)}
              onToggleSave={onToggleSave}
              onAnalyze={handleAnalyzeClick}
            />
          ))}
        </div>
      )}
    </section>
  );
}
