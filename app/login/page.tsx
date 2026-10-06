'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatAuthError } from '@/lib/supabase/auth';
import { AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const registered = searchParams.get('registered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    registered ? 'Account created successfully! Please sign in with your password.' : null
  );

  useEffect(() => {
    // Check if user is already logged in
    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          router.replace(redirectTo);
        }
      });
    }
  }, [router, redirectTo]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        // Local mode or fallback
        router.push(redirectTo);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(formatAuthError(error));
        setLoading(false);
        return;
      }

      if (data?.user) {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      console.error('[Login Error]', err);
      setErrorMsg(formatAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <div className="login-header">
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.3rem',
          }}
        >
          <span
            style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'var(--black)',
              borderRadius: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
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
          <span>LeadGen Pro</span>
        </Link>
        <h1>Welcome Back</h1>
        <p>Sign in to your LeadGen Pro account</p>
      </div>

      {errorMsg && (
        <div className="auth-alert-error" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="auth-alert-success" role="status">
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSignIn} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="you@agency.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            className="neo-input"
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            className="neo-input"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn--primary"
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem' }}>
        <span style={{ color: '#666' }}>Don&apos;t have an account? </span>
        <Link
          href={`/signup${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
          style={{ fontWeight: 800, textDecoration: 'underline' }}
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login__dot-pattern"></div>
      <Suspense fallback={<div className="login-card" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
