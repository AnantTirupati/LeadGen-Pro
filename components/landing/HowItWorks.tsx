import React from 'react';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="hiw">
      <div className="hiw__inner">
        <div className="section-header section-header--dark">
          <span className="section-tag section-tag--dark">How It Works</span>
          <h2 className="section-heading section-heading--light">Three Steps to a Full Pipeline</h2>
          <p className="section-sub section-sub--light">Get up and running in minutes — not months.</p>
        </div>
        <div className="hiw__steps">
          <div className="hiw__step" id="step-1">
            <div className="hiw__circle hiw__circle--sage">
              <span>1</span>
            </div>
            <h3 className="hiw__step-title">Connect Your Stack</h3>
            <p className="hiw__step-desc">
              Integrate your CRM, email, and ad platforms in a few clicks. We handle the data sync.
            </p>
          </div>
          <div className="hiw__line"></div>
          <div className="hiw__step" id="step-2">
            <div className="hiw__circle hiw__circle--yellow">
              <span>2</span>
            </div>
            <h3 className="hiw__step-title">Define Your ICP</h3>
            <p className="hiw__step-desc">
              Tell our AI who your ideal customer is. It learns your patterns and starts finding matches.
            </p>
          </div>
          <div className="hiw__line"></div>
          <div className="hiw__step" id="step-3">
            <div className="hiw__circle hiw__circle--white">
              <span>3</span>
            </div>
            <h3 className="hiw__step-title">Close More Deals</h3>
            <p className="hiw__step-desc">
              Engage qualified leads with AI-powered sequences. Watch your pipeline and revenue grow.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
