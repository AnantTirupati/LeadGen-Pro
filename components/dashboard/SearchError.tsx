import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface SearchErrorProps {
  message: string;
  onRetry?: () => void;
}

export default function SearchError({ message, onRetry }: SearchErrorProps) {
  return (
    <div
      className="neo-card"
      style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        border: '2px solid #000',
        boxShadow: '4px 4px 0px 0px #000',
        background: '#fee2e2',
        margin: '2rem 0',
      }}
    >
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          background: '#ef4444',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          border: '2px solid #000',
          boxShadow: '2px 2px 0px 0px #000',
        }}
      >
        <AlertCircle size={28} />
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: '1.35rem',
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
          color: '#991b1b',
        }}
      >
        Search Error
      </h3>

      <p
        style={{
          fontSize: '0.95rem',
          color: '#7f1d1d',
          maxWidth: '480px',
          margin: '0 auto 1.5rem',
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn--primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RotateCcw size={16} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
