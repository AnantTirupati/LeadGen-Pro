'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SearchPanel from '@/components/dashboard/SearchPanel';
import StatCard from '@/components/dashboard/StatCard';
import EmptyLeadState from '@/components/dashboard/EmptyLeadState';
import SearchResults from '@/components/dashboard/SearchResults';
import SearchLoading from '@/components/dashboard/SearchLoading';
import SearchError from '@/components/dashboard/SearchError';
import SearchEmptyState from '@/components/dashboard/SearchEmptyState';
import { useSearch } from '@/lib/context/SearchContext';
import { Building2, Flame, Bookmark, Zap } from 'lucide-react';

export default function DashboardPage() {
  const {
    currentSearch,
    businesses,
    currentPage,
    pageSize,
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
  } = useSearch();

  // Derived KPI Stats
  const analyzedScores = Object.values(analyses);
  const veryHighOppCount =
    analyzedScores.filter((a) => a.opportunityLevel === 'VERY_HIGH').length ||
    businesses.filter((b) => !b.hasWebsite).length;

  const avgLeadScore =
    analyzedScores.length > 0
      ? Math.round(
          analyzedScores.reduce((acc, curr) => acc + curr.score, 0) / analyzedScores.length
        )
      : businesses.length > 0
      ? 82
      : '--';

  return (
    <DashboardLayout>
      {/* 1. Search Panel */}
      <SearchPanel
        onSearch={performSearch}
        isSearching={isSearching}
        initialLocation={currentSearch.location}
        initialIndustry={currentSearch.industry}
      />

      {/* 2. Summary KPI Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          label="Businesses Found"
          value={businesses.length > 0 ? `${businesses.length}${hasMore ? '+' : ''}` : '0'}
          subtext={hasSearched ? `in ${currentSearch.location}` : 'Ready to discover'}
          variant="white"
          icon={<Building2 size={20} />}
        />
        <StatCard
          label="High Opportunity"
          value={veryHighOppCount}
          subtext={veryHighOppCount > 0 ? 'Prime web design targets' : '0 identified'}
          variant="yellow"
          icon={<Flame size={20} />}
        />
        <StatCard
          label="Saved Leads"
          value={savedBusinessIds.length}
          subtext="In your pipeline"
          variant="sage"
          icon={<Bookmark size={20} />}
        />
        <StatCard
          label="Avg Lead Score"
          value={avgLeadScore}
          subtext={
            analyzedScores.length > 0
              ? `Calculated from ${analyzedScores.length} audited leads`
              : 'Auto-computed on analysis'
          }
          variant="dark"
          icon={<Zap size={20} />}
        />
      </div>

      {/* 3. Dynamic State Rendering */}
      {isSearching ? (
        <SearchLoading
          location={currentSearch.location}
          industry={currentSearch.industry}
        />
      ) : searchError ? (
        <SearchError
          message={searchError}
          onRetry={() => performSearch(currentSearch)}
        />
      ) : hasSearched && businesses.length === 0 ? (
        <SearchEmptyState
          location={currentSearch.location}
          industry={currentSearch.industry}
          onReset={resetSearch}
        />
      ) : hasSearched && businesses.length > 0 ? (
        <SearchResults
          businesses={businesses}
          currentPage={currentPage}
          pageSize={pageSize}
          hasMore={hasMore}
          isLoadingPage={isLoadingPage}
          onPageChange={goToPage}
          location={currentSearch.location}
          industry={currentSearch.industry}
          savedBusinessIds={savedBusinessIds}
          analyses={analyses}
          onToggleSave={toggleSaveLead}
          onAnalyzeSingle={analyzeSingle}
          onAnalyzeBatch={analyzeBatch}
          onResetSearch={resetSearch}
          isBatchAnalyzing={isBatchAnalyzing}
          batchProgress={batchProgress}
        />
      ) : (
        <EmptyLeadState />
      )}
    </DashboardLayout>
  );
}
