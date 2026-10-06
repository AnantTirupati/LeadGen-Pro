import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero__dot-pattern"></div>
      <div className="hero__inner">
        <div className="hero__content">
          <span className="hero__badge">NEW: AI Content Assistant 2.0</span>
          <h1 className="hero__heading">
            Generate <span className="hero__heading--stroke">Qualified</span> Leads on Autopilot
          </h1>
          <p className="hero__sub">
            Our AI engine finds, scores, and nurtures your ideal customers — so you can focus on closing deals, not chasing dead ends.
          </p>
          <div className="hero__cta-group">
            <Link href="/signup" className="btn btn--primary btn--lg" id="hero-cta-primary">
              Get Started Free
            </Link>
            <a href="#how-it-works" className="btn btn--secondary btn--lg" id="hero-cta-secondary">
              See How It Works
            </a>
          </div>
          <div className="hero__proof">
            <div className="hero__proof-avatars">
              <span className="avatar" style={{ background: '#b7c6c2' }}>A</span>
              <span className="avatar" style={{ background: '#171e19', color: '#fff' }}>B</span>
              <span className="avatar" style={{ background: '#ffe17c' }}>C</span>
              <span className="avatar" style={{ background: '#b7c6c2' }}>D</span>
            </div>
            <p className="hero__proof-text">
              <strong>2,400+</strong> teams already onboard
            </p>
          </div>
        </div>

        <div className="hero__visual">
          <div className="browser-mockup">
            <div className="browser-mockup__header">
              <span className="browser-dot" style={{ background: '#ff5f57' }}></span>
              <span className="browser-dot" style={{ background: '#febc2e' }}></span>
              <span className="browser-dot" style={{ background: '#28c840' }}></span>
              <span className="browser-mockup__url">app.leadgenpro.com/dashboard</span>
            </div>
            <div className="browser-mockup__body">
              <div className="dash-sidebar">
                <div className="dash-sidebar__item active"></div>
                <div className="dash-sidebar__item"></div>
                <div className="dash-sidebar__item"></div>
                <div className="dash-sidebar__item"></div>
                <div className="dash-sidebar__item"></div>
              </div>
              <div className="dash-main">
                <div className="dash-stats">
                  <div className="dash-stat-card dash-stat-card--sage">
                    <span className="dash-stat-label">MRR</span>
                    <span className="dash-stat-value">$48.2k</span>
                    <span className="dash-stat-change">+12.4%</span>
                  </div>
                  <div className="dash-stat-card dash-stat-card--dark">
                    <span className="dash-stat-label">Leads</span>
                    <span className="dash-stat-value">1,247</span>
                    <span className="dash-stat-change">+8.1%</span>
                  </div>
                  <div className="dash-stat-card dash-stat-card--sage">
                    <span className="dash-stat-label">Conv.</span>
                    <span className="dash-stat-value">23.6%</span>
                    <span className="dash-stat-change">+3.2%</span>
                  </div>
                </div>
                <div className="dash-chart">
                  <div className="dash-chart__title">Revenue Growth</div>
                  <div className="dash-chart__bars">
                    <div className="dash-bar" style={{ height: '40%' }}></div>
                    <div className="dash-bar" style={{ height: '55%' }}></div>
                    <div className="dash-bar" style={{ height: '45%' }}></div>
                    <div className="dash-bar" style={{ height: '65%' }}></div>
                    <div className="dash-bar" style={{ height: '50%' }}></div>
                    <div className="dash-bar" style={{ height: '75%' }}></div>
                    <div className="dash-bar" style={{ height: '60%' }}></div>
                    <div className="dash-bar" style={{ height: '85%' }}></div>
                    <div className="dash-bar" style={{ height: '70%' }}></div>
                    <div className="dash-bar dash-bar--active" style={{ height: '92%' }}></div>
                  </div>
                </div>
                <div className="dash-panel">
                  <div className="dash-panel__row">
                    <span className="dash-panel__dot"></span>
                    <span className="dash-panel__name">Enterprise Lead</span>
                    <span className="dash-panel__score">94</span>
                  </div>
                  <div className="dash-panel__row">
                    <span className="dash-panel__dot"></span>
                    <span className="dash-panel__name">Mid-Market</span>
                    <span className="dash-panel__score">87</span>
                  </div>
                  <div className="dash-panel__row">
                    <span className="dash-panel__dot"></span>
                    <span className="dash-panel__name">Startup Lead</span>
                    <span className="dash-panel__score">76</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
