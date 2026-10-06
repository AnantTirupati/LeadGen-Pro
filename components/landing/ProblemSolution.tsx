import React from 'react';

export default function ProblemSolution() {
  return (
    <section id="problem-solution" className="pvs">
      <div className="pvs__inner">
        <div className="section-header">
          <span className="section-tag">Why LeadGen Pro?</span>
          <h2 className="section-heading">The Old Way vs. The New Way</h2>
        </div>
        <div className="pvs__grid">
          {/* Problem Card */}
          <div className="pvs__card pvs__card--problem">
            <div className="pvs__card-header">
              <span className="pvs__icon pvs__icon--x">✕</span>
              <h3>Without LeadGen Pro</h3>
            </div>
            <ul className="pvs__list">
              <li>
                <span className="pvs__x">✕</span> Hours spent on manual prospecting
              </li>
              <li>
                <span className="pvs__x">✕</span> Low-quality leads that never convert
              </li>
              <li>
                <span className="pvs__x">✕</span> Missed follow-ups and lost opportunities
              </li>
              <li>
                <span className="pvs__x">✕</span> Inconsistent pipeline with revenue dips
              </li>
              <li>
                <span className="pvs__x">✕</span> No insight into lead engagement
              </li>
            </ul>
          </div>

          {/* Solution Card */}
          <div className="pvs__card pvs__card--solution">
            <div className="pvs__card-header">
              <span className="pvs__icon pvs__icon--check">✓</span>
              <h3>With LeadGen Pro</h3>
            </div>
            <ul className="pvs__list">
              <li>
                <span className="pvs__check">✓</span> AI finds leads while you sleep
              </li>
              <li>
                <span className="pvs__check">✓</span> Smart scoring filters top prospects
              </li>
              <li>
                <span className="pvs__check">✓</span> Automated nurture sequences
              </li>
              <li>
                <span className="pvs__check">✓</span> Predictable pipeline growth
              </li>
              <li>
                <span className="pvs__check">✓</span> Real-time engagement analytics
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
