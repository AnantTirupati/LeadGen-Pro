import React from 'react';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section id="cta" className="final-cta">
      <div className="final-cta__dot-pattern"></div>
      <div className="final-cta__inner">
        <h2 className="final-cta__heading">Ready to Fill Your Pipeline?</h2>
        <p className="final-cta__sub">
          Join 2,400+ teams using LeadGen Pro to close more deals. No credit card required.
        </p>
        <div className="final-cta__actions">
          <Link href="/signup" className="btn btn--primary btn--lg" id="final-cta-primary">
            Start Your Free Trial
          </Link>
          <a href="#how-it-works" className="btn btn--secondary btn--lg" id="final-cta-secondary">
            Book a Demo
          </a>
        </div>
      </div>
    </section>
  );
}
