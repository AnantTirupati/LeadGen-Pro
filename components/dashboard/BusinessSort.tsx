'use client';

import React from 'react';
import { SearchFilters } from '@/types';
import { ArrowUpDown } from 'lucide-react';

interface BusinessSortProps {
  sortBy: SearchFilters['sortBy'];
  onSortChange: (sortBy: SearchFilters['sortBy']) => void;
}

export default function BusinessSort({ sortBy, onSortChange }: BusinessSortProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <label
        htmlFor="sort-select"
        style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          whiteSpace: 'nowrap',
        }}
      >
        <ArrowUpDown size={13} /> Sort:
      </label>
      <select
        id="sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SearchFilters['sortBy'])}
        className="neo-select"
        style={{
          padding: '0.35rem 0.65rem',
          fontSize: '0.8rem',
          width: 'auto',
          borderRadius: '4px',
        }}
      >
        <option value="relevance">Relevance</option>
        <option value="score">🔥 Highest Lead Score</option>
        <option value="rating">Highest Rating</option>
        <option value="reviews">Most Reviews</option>
      </select>
    </div>
  );
}
