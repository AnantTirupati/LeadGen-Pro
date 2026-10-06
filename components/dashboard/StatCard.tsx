import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'white' | 'yellow' | 'sage' | 'dark';
  icon?: React.ReactNode;
}

export default function StatCard({
  label,
  value,
  subtext,
  variant = 'white',
  icon,
}: StatCardProps) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`neo-card neo-card--${variant}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        border: '2px solid #000',
        boxShadow: '4px 4px 0px 0px #000',
        minHeight: '110px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: isDark ? 'var(--sage)' : '#555',
          }}
        >
          {label}
        </span>
        {icon && <span style={{ opacity: 0.8 }}>{icon}</span>}
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '2rem',
            lineHeight: 1.1,
            color: isDark ? 'var(--white)' : 'var(--black)',
          }}
        >
          {value}
        </div>
        {subtext && (
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              marginTop: '0.25rem',
              color: isDark ? 'var(--yellow)' : '#666',
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
