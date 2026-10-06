import React from 'react';
import { Star, Globe, Phone, MapPin, ExternalLink, BookmarkPlus, Zap } from 'lucide-react';
import { Lead } from '@/types';

interface LeadCardProps {
  lead: Lead;
  onSave?: (leadId: string) => void;
  onGeneratePitch?: (leadId: string) => void;
}

export default function LeadCard({
  lead,
  onSave,
  onGeneratePitch,
}: LeadCardProps) {
  const { business, score, opportunity_level, website_status } = lead;

  const getOpportunityBadgeClass = (level: string) => {
    switch (level) {
      case 'high':
        return 'neo-badge--yellow';
      case 'medium':
        return 'neo-badge--sage';
      default:
        return 'neo-badge--dark';
    }
  };

  const getWebsiteStatusText = (status: string) => {
    switch (status) {
      case 'none':
        return 'No Website';
      case 'outdated':
        return 'Outdated Design';
      case 'slow':
        return 'Slow Load Speed';
      case 'unresponsive':
        return 'Not Mobile-Friendly';
      case 'good':
        return 'Modern Website';
      default:
        return status;
    }
  };

  return (
    <div
      className="neo-card"
      style={{
        padding: '1.5rem',
        border: '2px solid #000',
        boxShadow: '4px 4px 0px 0px #000',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div>
        {/* Top Badges & Score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className={`neo-badge ${getOpportunityBadgeClass(opportunity_level)}`}>
              {opportunity_level.toUpperCase()} OPPORTUNITY
            </span>
            <span className="neo-badge neo-badge--white" style={{ background: '#f4f4f5' }}>
              {getWebsiteStatusText(website_status)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'var(--black)',
              color: 'var(--yellow)',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '0.9rem',
            }}
          >
            <Zap size={14} />
            <span>Score: {score}/100</span>
          </div>
        </div>

        {/* Business Name & Category */}
        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.3rem',
            letterSpacing: '-0.02em',
            marginBottom: '0.25rem',
          }}
        >
          {business?.name || 'Local Business'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
          {business?.category || 'Category'}
        </p>

        {/* Details: Address, Rating, Contact */}
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            fontSize: '0.85rem',
            color: '#444',
          }}
        >
          {business?.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={14} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {business.address}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {business?.rating !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star size={14} fill="#febc2e" color="#febc2e" />
                <span style={{ fontWeight: 700 }}>{business.rating}</span>
                <span style={{ color: '#888' }}>({business.reviewCount || 0} reviews)</span>
              </div>
            )}

            {business?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={14} />
                <span>{business.phone}</span>
              </div>
            )}
          </div>

          {business?.website && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
              <Globe size={14} />
              <a
                href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#000',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderTop: '1px solid #e4e4e7',
          paddingTop: '0.75rem',
          marginTop: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => onSave && onSave(lead.id)}
          className="btn btn--secondary btn--sm"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
        >
          <BookmarkPlus size={14} />
          <span>Save Lead</span>
        </button>

        <button
          type="button"
          onClick={() => onGeneratePitch && onGeneratePitch(lead.id)}
          className="btn btn--yellow btn--sm"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
        >
          <Zap size={14} />
          <span>Quick Pitch</span>
        </button>
      </div>
    </div>
  );
}

/**
 * MOCK LEADS DATA
 * Clearly isolated for Phase 1 UI demonstration.
 * In Phase 2, this will be replaced with real API data from Google Places and crawler analysis.
 */
export const MOCK_LEADS_SAMPLE: Lead[] = [
  {
    id: 'mock-lead-1',
    business_id: 'biz-1',
    score: 92,
    opportunity_level: 'high',
    website_status: 'outdated',
    business: {
      id: 'biz-1',
      googlePlaceId: 'ChIJ1',
      name: 'Austin Family Dental Care',
      category: 'Dentists & Orthodontists',
      address: '1420 S Congress Ave, Austin, TX 78704',
      phone: '(512) 555-0192',
      website: 'www.austinfamilydentalexample.com',
      hasWebsite: true,
      rating: 4.8,
      reviewCount: 142,
    },
  },
  {
    id: 'mock-lead-2',
    business_id: 'biz-2',
    score: 88,
    opportunity_level: 'high',
    website_status: 'none',
    business: {
      id: 'biz-2',
      googlePlaceId: 'ChIJ2',
      name: 'Apex Heating & Air Conditioning',
      category: 'Plumbing & HVAC Contractors',
      address: '8801 Research Blvd, Austin, TX 78758',
      phone: '(512) 555-0418',
      website: undefined,
      hasWebsite: false,
      rating: 4.6,
      reviewCount: 89,
    },
  },
  {
    id: 'mock-lead-3',
    business_id: 'biz-3',
    score: 74,
    opportunity_level: 'medium',
    website_status: 'unresponsive',
    business: {
      id: 'biz-3',
      googlePlaceId: 'ChIJ3',
      name: 'Verde Kitchen & Cantina',
      category: 'Restaurants & Cafes',
      address: '221 Colorado St, Austin, TX 78701',
      phone: '(512) 555-0834',
      website: 'www.verdekitchenexample.com',
      hasWebsite: true,
      rating: 4.4,
      reviewCount: 310,
    },
  },
];
