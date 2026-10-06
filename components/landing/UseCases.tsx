import React from 'react';

export default function UseCases() {
  return (
    <section id="use-cases" className="personas">
      <div className="personas__inner">
        <div className="section-header">
          <span className="section-tag">Use Cases</span>
          <h2 className="section-heading">Built for Every Revenue Team</h2>
        </div>
        <div className="personas__grid">
          <div className="persona-card persona-card--sage" id="persona-sales">
            <span className="persona-card__badge">Sales Teams</span>
            <h3 className="persona-card__title">Hit Quota Faster</h3>
            <p className="persona-card__desc">
              Prioritize your outreach with AI scoring. Spend time on prospects that actually convert.
            </p>
            <ul className="persona-card__list">
              <li>Lead prioritization</li>
              <li>Email sequence automation</li>
              <li>Pipeline forecasting</li>
            </ul>
          </div>

          <div className="persona-card persona-card--yellow" id="persona-marketing">
            <span className="persona-card__badge">Marketing Teams</span>
            <h3 className="persona-card__title">Maximize MQL Output</h3>
            <p className="persona-card__desc">
              Turn anonymous traffic into known leads. Enrich, score, and route to sales automatically.
            </p>
            <ul className="persona-card__list">
              <li>Visitor identification</li>
              <li>Intent signal tracking</li>
              <li>Campaign attribution</li>
            </ul>
          </div>

          <div className="persona-card persona-card--dark" id="persona-revops">
            <span className="persona-card__badge">RevOps</span>
            <h3 className="persona-card__title">Unify Your Data</h3>
            <p className="persona-card__desc">
              Single source of truth across marketing, sales, and CS. Clean, enriched, and actionable.
            </p>
            <ul className="persona-card__list">
              <li>Data deduplication</li>
              <li>Cross-platform sync</li>
              <li>Custom reporting</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
