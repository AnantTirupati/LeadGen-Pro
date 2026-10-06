import React from 'react';

const TESTIMONIALS = [
  {
    id: 'testimonial-1',
    stars: '★★★★★',
    quote: '"LeadGen Pro transformed our outbound. We went from 50 to 200+ qualified meetings per month in 90 days."',
    name: 'Jake Reeves',
    role: 'VP Sales, Acme Corp',
    avatar: 'JR',
    bg: '#ffe17c',
    color: '#000',
  },
  {
    id: 'testimonial-2',
    stars: '★★★★★',
    quote: '"The AI scoring is frighteningly accurate. It surfaced our best leads and cut our sales cycle by 40%."',
    name: 'Sara Mitchell',
    role: 'Head of Growth, Globex Inc',
    avatar: 'SM',
    bg: '#b7c6c2',
    color: '#000',
  },
  {
    id: 'testimonial-3',
    stars: '★★★★★',
    quote: '"We replaced three tools with LeadGen Pro. Better data, better workflows, and half the cost."',
    name: 'Daniel Kim',
    role: 'RevOps Lead, Initech',
    avatar: 'DK',
    bg: '#171e19',
    color: '#fff',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="testimonials">
      <div className="testimonials__inner">
        <div className="section-header">
          <span className="section-tag section-tag--sage">Testimonials</span>
          <h2 className="section-heading">Loved by Revenue Teams</h2>
        </div>
        <div className="testimonials__grid">
          {TESTIMONIALS.map((t) => (
            <div className="testimonial-card" id={t.id} key={t.id}>
              <div className="testimonial-card__stars">{t.stars}</div>
              <p className="testimonial-card__quote">{t.quote}</p>
              <div className="testimonial-card__author">
                <div
                  className="testimonial-card__avatar"
                  style={{ background: t.bg, color: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="testimonial-card__name">{t.name}</p>
                  <p className="testimonial-card__role">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
