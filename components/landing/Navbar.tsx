'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav
      id="main-nav"
      className="nav"
      style={{
        boxShadow: scrolled ? '0 2px 0 0 #000' : 'none',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div className="nav__inner">
        <Link href="/" className="nav__logo" aria-label="LeadGen Pro Home">
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
          <span className="nav__logo-text">LeadGen Pro</span>
        </Link>

        <ul className="nav__links" id="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#use-cases">Use Cases</a></li>
          <li><a href="#testimonials">Testimonials</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>

        <div className="nav__actions">
          <Link href="/login" className="btn btn--secondary btn--nav" style={{ marginRight: '0.25rem' }}>
            Sign In
          </Link>
          <Link href="/dashboard" className="btn btn--primary btn--nav" id="nav-cta">
            Dashboard
          </Link>
          <button
            className={`nav__hamburger ${mobileMenuOpen ? 'open' : ''}`}
            id="nav-hamburger"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`nav__mobile ${mobileMenuOpen ? 'active' : ''}`} id="nav-mobile">
        <ul>
          <li><a href="#features" onClick={closeMenu}>Features</a></li>
          <li><a href="#how-it-works" onClick={closeMenu}>How It Works</a></li>
          <li><a href="#use-cases" onClick={closeMenu}>Use Cases</a></li>
          <li><a href="#testimonials" onClick={closeMenu}>Testimonials</a></li>
          <li><a href="#pricing" onClick={closeMenu}>Pricing</a></li>
        </ul>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <Link href="/login" className="btn btn--secondary" onClick={closeMenu} style={{ width: '100%', textAlign: 'center' }}>
            Sign In
          </Link>
          <Link href="/dashboard" className="btn btn--primary" onClick={closeMenu} style={{ width: '100%', textAlign: 'center' }}>
            Launch Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
