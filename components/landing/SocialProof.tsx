import React from 'react';

const BRANDS = [
  'ACME',
  'GLOBEX',
  'INITECH',
  'MASSIVE DYNAMIC',
  'SOYLENT',
  'UMBRELLA',
  'WONKA IND.',
  'STARK LABS',
];

export default function SocialProof() {
  return (
    <section id="social-proof" className="marquee-section">
      <div className="marquee-track">
        <div className="marquee-content">
          {BRANDS.map((brand, idx) => (
            <React.Fragment key={`brand-1-${idx}`}>
              <span className="marquee-brand">{brand}</span>
              <span className="marquee-sep">✦</span>
            </React.Fragment>
          ))}
        </div>
        <div className="marquee-content" aria-hidden="true">
          {BRANDS.map((brand, idx) => (
            <React.Fragment key={`brand-2-${idx}`}>
              <span className="marquee-brand">{brand}</span>
              <span className="marquee-sep">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
