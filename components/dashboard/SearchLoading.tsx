import React from 'react';
import { Loader2 } from 'lucide-react';

interface SearchLoadingProps {
  location?: string;
  industry?: string;
}

export default function SearchLoading({ location, industry }: SearchLoadingProps) {
  return (
    <div
      className="neo-card neo-card--yellow"
      style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        border: '2px solid #000',
        boxShadow: '4px 4px 0px 0px #000',
        margin: '2rem 0',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          background: 'var(--black)',
          color: 'var(--yellow)',
          marginBottom: '1.5rem',
          border: '2px solid #000',
          boxShadow: '3px 3px 0px 0px #000',
        }}
      >
        <Loader2 size={32} className="animate-spin" />
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: '1.5rem',
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          marginBottom: '0.5rem',
        }}
      >
        Searching Local Businesses...
      </h3>

      <p
        style={{
          fontSize: '0.95rem',
          color: '#333',
          maxWidth: '460px',
          margin: '0 auto',
          fontWeight: 600,
        }}
      >
        {industry && location
          ? `Querying Google Places for ${industry} in ${location}...`
          : 'Connecting to Google Places and retrieving verified business records...'}
      </p>
    </div>
  );
}
