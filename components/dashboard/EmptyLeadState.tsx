import React from 'react';
import { Sparkles, Search } from 'lucide-react';

interface EmptyLeadStateProps {
  onSuggestSearch?: () => void;
}

export default function EmptyLeadState({ onSuggestSearch }: EmptyLeadStateProps) {
  return (
    <div
      className="neo-card"
      style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        border: '2px solid #000',
        boxShadow: '4px 4px 0px 0px #000',
        background: 'var(--white)',
        marginTop: '2rem',
      }}
    >
      <div
        style={{
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          background: 'var(--yellow)',
          border: '2px solid #000',
          boxShadow: '2px 2px 0px 0px #000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}
      >
        <Search size={28} />
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
        No leads yet
      </h3>

      <p
        style={{
          fontSize: '0.95rem',
          color: '#666',
          maxWidth: '420px',
          margin: '0 auto 1.5rem',
          lineHeight: 1.6,
        }}
      >
        Search a location and industry above to discover potential customers with outdated websites and high conversion potential.
      </p>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#f4f4f5',
          border: '1px solid #000',
          padding: '0.5rem 1rem',
          borderRadius: '100px',
          fontSize: '0.8rem',
          fontWeight: 600,
        }}
      >
        <Sparkles size={14} color="#000" />
        <span>Tip: Try searching &ldquo;Austin, TX&rdquo; and &ldquo;Dentists &amp; Orthodontists&rdquo;</span>
      </div>
    </div>
  );
}
