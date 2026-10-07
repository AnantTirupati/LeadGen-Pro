'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SearchPanel from '@/components/dashboard/SearchPanel';
import StatCard from '@/components/dashboard/StatCard';
import EmptyLeadState from '@/components/dashboard/EmptyLeadState';
import SearchResults from '@/components/dashboard/SearchResults';
import SearchLoading from '@/components/dashboard/SearchLoading';
import SearchError from '@/components/dashboard/SearchError';
import SearchEmptyState from '@/components/dashboard/SearchEmptyState';
import { Business } from '@/types';
import { LeadScoreResult } from '@/lib/leads/types';
import { Building2, Flame, Bookmark, Zap } from 'lucide-react';

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [savedBusinesses, setSavedBusinesses] = useState<Business[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, LeadScoreResult>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<{
    location: string;
    industry: string;
    maxResults: number;
  }>({
    location: '',
    industry: '',
    maxResults: 25,
  });

  const handleSearch = async (criteria: {
    location: string;
    industry: string;
    maxResults: number;
  }) => {
    setIsSearching(true);
    setSearchError(null);
    setCurrentSearch(criteria);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: criteria.location,
          industry: criteria.industry,
          limit: criteria.maxResults,
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
      } else {
        setBusinesses(data.businesses || []);
        setHasSearched(true);
      }
    } catch (err: any) {
      console.error('[Search Client Error]', err);
      setSearchError(err?.message && !err.message.includes('<!DOCTYPE') ? err.message : 'Failed to retrieve search results. Please check your API keys or try again.');
      setBusinesses([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyzeSingle = async (business: Business) => {
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
        setAnalyses((prev) => ({
          ...prev,
          [business.googlePlaceId]: data.result,
        }));
      }
    } catch (err) {
      console.error('[Analyze Single Error]', err);
    }
  };

  const handleAnalyzeBatch = async (targetBusinesses: Business[]) => {
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
        setAnalyses((prev) => ({ ...prev, ...newMap }));
      }
    } catch (err) {
      console.error('[Batch Analyze Error]', err);
    } finally {
      setIsBatchAnalyzing(false);
      setBatchProgress({ current: targetBusinesses.length, total: targetBusinesses.length });
    }
  };

  const handleResetSearch = () => {
    setBusinesses([]);
    setHasSearched(false);
    setSearchError(null);
    setAnalyses({});
  };

  const handleToggleSave = (business: Business) => {
    const isSaved = savedBusinesses.some((b) => b.googlePlaceId === business.googlePlaceId);
    if (isSaved) {
      setSavedBusinesses(savedBusinesses.filter((b) => b.googlePlaceId !== business.googlePlaceId));
    } else {
      setSavedBusinesses([...savedBusinesses, business]);
    }
  };

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

  const savedBusinessIds = savedBusinesses.map((b) => b.googlePlaceId);

  return (
    <DashboardLayout>
      {/* 1. Search Panel */}
      <SearchPanel
        onSearch={handleSearch}
        isSearching={isSearching}
        initialLocation={currentSearch.location}
        initialIndustry={currentSearch.industry}
        initialMaxResults={currentSearch.maxResults}
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
          value={businesses.length}
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
          value={savedBusinesses.length}
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
          onRetry={() => handleSearch(currentSearch)}
        />
      ) : hasSearched && businesses.length === 0 ? (
        <SearchEmptyState
          location={currentSearch.location}
          industry={currentSearch.industry}
          onReset={handleResetSearch}
        />
      ) : hasSearched && businesses.length > 0 ? (
        <SearchResults
          businesses={businesses}
          location={currentSearch.location}
          industry={currentSearch.industry}
          savedBusinessIds={savedBusinessIds}
          analyses={analyses}
          onToggleSave={handleToggleSave}
          onAnalyzeSingle={handleAnalyzeSingle}
          onAnalyzeBatch={handleAnalyzeBatch}
          onResetSearch={handleResetSearch}
          isBatchAnalyzing={isBatchAnalyzing}
          batchProgress={batchProgress}
        />
      ) : (
        <EmptyLeadState />
      )}
    </DashboardLayout>
  );
}
