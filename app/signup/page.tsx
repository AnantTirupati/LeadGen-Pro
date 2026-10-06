'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatAuthError } from '@/lib/supabase/auth';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErrorMsg(null);

    // 1. Client-Side Validation
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both passwords.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        // Local mode fallback
        router.push(redirectTo);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setErrorMsg(formatAuthError(error));
        setLoading(false);
        return;
      }

      // Check if user session was immediately established or email confirmation is required
      if (data?.session) {
        // User is immediately logged in
        router.push(redirectTo);
        router.refresh();
      } else if (data?.user && !data.session) {
        // Email confirmation is required by Supabase project settings
        setConfirmationNeeded(true);
        setLoading(false);
      } else {
        // Fallback redirect
        router.push(`/login?registered=true`);
      }
    } catch (err: any) {
      console.error('[Signup Error]', err);
      setErrorMsg(formatAuthError(err));
      setLoading(false);
    }
  };

  if (confirmationNeeded) {
    return (
      <div className="login-card">
        <div className="login-header">
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'var(--yellow)',
              border: '2px solid #000',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '4px 4px 0px 0px #000',
            }}
          >
            <Mail size={24} color="#000" />
          </div>
          <h1>Verify Your Email</h1>
          <p style={{ marginTop: '0.75rem', lineHeight: 1.5 }}>
            We&apos;ve sent a confirmation link to{' '}
            <strong style={{ color: '#000' }}>{email}</strong>. Please check your inbox and click
            the link to activate your account.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Link
            href="/login"
            className="btn btn--primary"
            style={{ width: '100%', textAlign: 'center' }}
          >
            Proceed to Sign In
          </Link>
          <button
            type="button"
            onClick={() => {
              setConfirmationNeeded(false);
              setPassword('');
              setConfirmPassword('');
            }}
            className="btn btn--secondary"
            style={{ width: '100%' }}
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    );
  }

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
        <h1>Create Account</h1>
        <p>Start discovering high-value leads in seconds</p>
      </div>

      {errorMsg && (
        <div className="auth-alert-error" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSignUp} className="login-form">
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            placeholder="Alex Rivera"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            required
            className="neo-input"
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="alex@agency.com"
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
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            minLength={6}
            className="neo-input"
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
            minLength={6}
            className="neo-input"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn--primary"
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem' }}>
        <span style={{ color: '#666' }}>Already have an account? </span>
        <Link
          href={`/login${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
          style={{ fontWeight: 800, textDecoration: 'underline' }}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="login-page">
      <div className="login__dot-pattern"></div>
      <Suspense fallback={<div className="login-card" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
