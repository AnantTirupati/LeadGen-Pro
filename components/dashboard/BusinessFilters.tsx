'use client';

import React from 'react';
import { SearchFilters } from '@/types';
import { Star, Globe, Zap, Flame } from 'lucide-react';

interface BusinessFiltersProps {
  filters: SearchFilters;
  onFilterChange: (updated: Partial<SearchFilters>) => void;
  totalCount: number;
  filteredCount: number;
  hasAnalyzedLeads?: boolean;
}

export default function BusinessFilters({
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
  hasAnalyzedLeads = false,
}: BusinessFiltersProps) {
  return (
    <div
      className="neo-card"
      style={{
        padding: '1.25rem',
        marginBottom: '1.5rem',
        border: '2px solid #000',
        boxShadow: '3px 3px 0px 0px #000',
        background: 'var(--white)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Opportunity Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Zap size={13} fill="#000" /> Opp Level:
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'VERY_HIGH', label: '🔥 Very High' },
                  { id: 'HIGH', label: '⚡ High' },
                  { id: 'MEDIUM', label: 'Medium' },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onFilterChange({ opportunity: o.id })}
                  className={`btn btn--sm ${filters.opportunity === o.id ? 'btn--primary' : 'btn--secondary'}`}
                  style={{
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Website Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Globe size={13} /> Website:
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'no_website', label: '🔥 No Website' },
                  { id: 'poor_website', label: 'Poor Site (<50)' },
                  { id: 'has_website', label: 'Has Site' },
                ] as const
              ).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onFilterChange({ website: w.id })}
                  className={`btn btn--sm ${filters.website === w.id ? 'btn--primary' : 'btn--secondary'}`}
                  style={{
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                  }}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Star size={13} fill="#000" /> Rating:
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(['all', '4.0+', '4.5+'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onFilterChange({ rating: r })}
                  className={`btn btn--sm ${filters.rating === r ? 'btn--primary' : 'btn--secondary'}`}
                  style={{
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                  }}
                >
                  {r === 'all' ? 'All' : `${r} ⭐`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Counter */}
        <div style={{ fontSize: '0.8rem', color: '#555', fontWeight: 700 }}>
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> businesses
        </div>
      </div>
    </div>
  );
}
