import React from 'react';
import { SearchX, Sparkles } from 'lucide-react';

interface SearchEmptyStateProps {
  location?: string;
  industry?: string;
  onReset?: () => void;
}

export default function SearchEmptyState({
  location,
  industry,
  onReset,
}: SearchEmptyStateProps) {
  return (
    <div
      className="neo-card"
      style={{
        padding: '3.5rem 2rem',
        textAlign: 'center',
        border: '2px solid #000',
        boxShadow: '4px 4px 0px 0px #000',
        background: 'var(--white)',
        margin: '2rem 0',
      }}
    >
      <div
        style={{
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          background: 'var(--sage)',
          border: '2px solid #000',
          boxShadow: '2px 2px 0px 0px #000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}
      >
        <SearchX size={28} />
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: '1.5rem',
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
        }}
      >
        NO BUSINESSES FOUND
      </h3>

      <p
        style={{
          fontSize: '0.95rem',
          color: '#666',
          maxWidth: '460px',
          margin: '0 auto 1.5rem',
          lineHeight: 1.6,
        }}
      >
        {location && industry
          ? `No matching businesses were found for "${industry}" in "${location}". Try broadening your search area or selecting another category.`
          : 'No matching businesses were found for this location and category.'}
      </p>

      {onReset && (
        <button
          onClick={onReset}
          className="btn btn--secondary btn--sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Sparkles size={14} />
          <span>Try Another Search</span>
        </button>
      )}
    </div>
  );
}
