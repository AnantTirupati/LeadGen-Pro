import React from 'react';

const FEATURES = [
  {
    id: 'feature-ai',
    title: 'AI Lead Scoring',
    desc: 'Machine learning models analyze 50+ data points to score and rank every lead by conversion probability.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a4 4 0 014 4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2a4 4 0 014-4z" />
        <path d="M8 8v8a4 4 0 004 4v0a4 4 0 004-4V8" />
        <circle cx="9" cy="13" r="1" />
        <circle cx="15" cy="13" r="1" />
      </svg>
    ),
  },
  {
    id: 'feature-automation',
    title: 'Smart Automation',
    desc: 'Set up multi-step outreach sequences that adapt based on prospect behavior and engagement signals.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
      </svg>
    ),
  },
  {
    id: 'feature-analytics',
    title: 'Deep Analytics',
    desc: 'Real-time dashboards, funnel analytics, and attribution reports to optimize every touchpoint.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 17V13m5 4V7m5 10v-4" />
      </svg>
    ),
  },
  {
    id: 'feature-crm',
    title: 'CRM Integration',
    desc: 'Seamless sync with Salesforce, HubSpot, Pipedrive, and 30+ other tools via native integrations.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: 'feature-enrichment',
    title: 'Data Enrichment',
    desc: 'Automatically append firmographic, technographic, and intent data to every contact record.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    id: 'feature-security',
    title: 'Enterprise Security',
    desc: 'SOC 2 Type II, GDPR compliant, with SSO, role-based access, and end-to-end encryption.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section id="features" className="features">
      <div className="features__inner">
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2 className="section-heading">Everything You Need to Scale</h2>
          <p className="section-sub">Powerful tools that work together to supercharge your pipeline.</p>
        </div>
        <div className="features__grid">
          {FEATURES.map((feat) => (
            <div className="feature-card" id={feat.id} key={feat.id}>
              <div className="feature-card__icon">{feat.icon}</div>
              <h3 className="feature-card__title">{feat.title}</h3>
              <p className="feature-card__desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
