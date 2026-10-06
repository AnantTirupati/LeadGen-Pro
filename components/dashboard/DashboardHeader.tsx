import React from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface DashboardHeaderProps {
  onToggleMobileMenu?: () => void;
}

export default function DashboardHeader({ onToggleMobileMenu }: DashboardHeaderProps) {
  const supabaseReady = isSupabaseConfigured();

  return (
    <header className="dashboard-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="btn btn--secondary btn--sm"
            style={{ display: 'flex', alignItems: 'center', padding: '0.4rem 0.6rem' }}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.5rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Good morning.
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            Find businesses that need your services.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          className="neo-badge"
          style={{
            background: supabaseReady ? '#dcfce7' : '#fef9c3',
            color: supabaseReady ? '#15803d' : '#854d0e',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Sparkles size={12} />
          <span>{supabaseReady ? 'Supabase Connected' : 'Local Mode'}</span>
        </div>
      </div>
    </header>
  );
}
