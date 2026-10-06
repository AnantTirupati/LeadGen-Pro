import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          <div className="footer__col footer__col--brand">
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
              <span className="nav__logo-text" style={{ color: '#fff' }}>
                LeadGen Pro
              </span>
            </Link>
            <p className="footer__tagline">
              AI-powered lead generation for modern revenue teams.
            </p>
            <div className="footer__socials">
              <a href="#" className="footer__social" aria-label="Twitter">
                𝕏
              </a>
              <a href="#" className="footer__social" aria-label="LinkedIn">
                in
              </a>
              <a href="#" className="footer__social" aria-label="GitHub">
                GH
              </a>
              <a href="#" className="footer__social" aria-label="YouTube">
                ▶
              </a>
            </div>
          </div>
          <div className="footer__col">
            <h4 className="footer__col-title">Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#">Integrations</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4 className="footer__col-title">Resources</h4>
            <ul>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Documentation</a></li>
              <li><a href="/api/health">API Health</a></li>
              <li><a href="#">Community</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4 className="footer__col-title">Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© 2026 LeadGen Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
