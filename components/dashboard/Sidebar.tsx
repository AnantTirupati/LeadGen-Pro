'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Search,
  Bookmark,
  Send,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, href: '/' },
  { id: 'find-leads', label: 'Find Leads', icon: Search, href: '/dashboard' },
  { id: 'saved-leads', label: 'Saved Leads (CRM)', icon: Bookmark, href: '/dashboard/leads' },
  { id: 'campaigns', label: 'Campaigns', icon: Send, href: '/dashboard/campaigns' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function Sidebar({
  mobileOpen = false,
  onClose,
  activeTab = 'find-leads',
  setActiveTab,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('Alex Rivera');
  const [userEmail, setUserEmail] = useState<string>('alex@agency.com');
  const [initials, setInitials] = useState<string>('AR');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const metaName = user.user_metadata?.full_name;
        const emailStr = user.email || 'user@leadgenpro.com';
        const displayName = metaName || emailStr.split('@')[0];

        setUserName(displayName);
        setUserEmail(emailStr);

        const letters = displayName
          .split(' ')
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        setInitials(letters || 'U');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metaName = session.user.user_metadata?.full_name;
        const emailStr = session.user.email || 'user@leadgenpro.com';
        const displayName = metaName || emailStr.split('@')[0];

        setUserName(displayName);
        setUserEmail(emailStr);

        const letters = displayName
          .split(' ')
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        setInitials(letters || 'U');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleItemClick = (id: string) => {
    if (setActiveTab) {
      setActiveTab(id);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createBrowserSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('[Logout Error]', err);
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className={`dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Sidebar Header */}
      <div className="dashboard-sidebar__logo">
        <Link href="/" className="nav__logo" style={{ color: '#fff' }}>
          <span className="nav__logo-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M10.5 2L6 10H9L7.5 16L12 8H9L10.5 2Z"
                fill="#ffe17c"
                stroke="#ffe17c"
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span style={{ color: '#fff', fontSize: '1.15rem' }}>LeadGen Pro</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden"
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: mobileOpen ? 'block' : 'none',
            }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="dashboard-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            (item.id === 'home' && pathname === '/') ||
            (item.id === 'find-leads' && pathname === '/dashboard') ||
            (item.id === 'saved-leads' && pathname.startsWith('/dashboard/leads')) ||
            (item.id === 'campaigns' && pathname.startsWith('/dashboard/campaigns')) ||
            (item.id === 'analytics' && pathname.startsWith('/dashboard/analytics')) ||
            (item.id === 'settings' && pathname.startsWith('/dashboard/settings')) ||
            activeTab === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleItemClick(item.id)}
              className={`dashboard-nav__item ${isActive ? 'active' : ''}`}
              style={{
                width: '100%',
                textAlign: 'left',
                background: isActive ? 'var(--yellow)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                textDecoration: 'none',
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer / User Profile & Logout */}
      <div className="dashboard-sidebar__footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '50%',
              background: 'var(--yellow)',
              border: '2px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.8rem',
              color: '#000',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={userName}
            >
              {userName}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--sage)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={userEmail}
            >
              {userEmail}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Sign Out"
          aria-label="Sign Out"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--sage)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.4rem',
            borderRadius: '0.35rem',
            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
            transition: 'color 0.2s, transform 0.1s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--yellow)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sage)')}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
