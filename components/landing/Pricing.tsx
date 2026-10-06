import React from 'react';
import Link from 'next/link';

const PLANS = [
  {
    id: 'plan-starter',
    name: 'Starter',
    badge: null,
    price: '$49',
    period: '/month',
    desc: 'Perfect for solo freelancers and consultants needing consistent fresh leads.',
    features: [
      '500 Verified Leads / month',
      'AI Lead Scoring Engine',
      'Basic CRM & CSV Export',
      'Standard Email Support',
      '1 Workspace User',
    ],
    buttonText: 'Start Free Trial',
    buttonVariant: 'secondary' as const,
    popular: false,
  },
  {
    id: 'plan-pro',
    name: 'Pro Agency',
    badge: 'MOST POPULAR',
    price: '$99',
    period: '/month',
    desc: 'For growing web agencies and dev shops that want scalable lead generation.',
    features: [
      '2,500 Verified Leads / month',
      'Advanced AI Scoring & Signals',
      'Full CRM Integrations',
      'Website Tech-Stack Inspection',
      'Automated Outreach Prep',
      'Priority Support',
    ],
    buttonText: 'Get Started with Pro',
    buttonVariant: 'primary' as const,
    popular: true,
  },
  {
    id: 'plan-enterprise',
    name: 'Scale & Dev',
    badge: null,
    price: '$249',
    period: '/month',
    desc: 'For high-volume outreach teams requiring full pipeline automation.',
    features: [
      'Unlimited Lead Discovery',
      'Custom AI Qualification Rules',
      'Deep Firmographic Enrichment',
      'API & Webhook Access',
      'Dedicated Account Manager',
      'Custom Contract & Invoicing',
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'secondary' as const,
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="pricing-section">
      <div className="section-header">
        <span className="section-tag">Pricing</span>
        <h2 className="section-heading">Simple, Transparent Pricing</h2>
        <p className="section-sub">No hidden fees or surprises. Cancel or upgrade anytime.</p>
      </div>
      <div className="pricing__grid">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`}
          >
            {plan.badge && <span className="pricing-card__badge">{plan.badge}</span>}
            <h3 className="pricing-card__title">{plan.name}</h3>
            <p className="pricing-card__desc">{plan.desc}</p>
            <div className="pricing-card__price">
              {plan.price} <span>{plan.period}</span>
            </div>
            <ul className="pricing-card__features">
              {plan.features.map((f, i) => (
                <li key={i}>
                  <span style={{ fontWeight: 800, color: '#000' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`btn btn--${plan.buttonVariant}`}
              style={{ width: '100%', textAlign: 'center' }}
            >
              {plan.buttonText}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
