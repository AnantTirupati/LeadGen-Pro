import React from 'react';
import Link from 'next/link';
import { Star, Globe, Phone, MapPin, ExternalLink, Bookmark, Check, Flame, Zap, Loader2, ArrowRight } from 'lucide-react';
import { Business } from '@/types';
import { LeadScoreResult } from '@/lib/leads/types';
import { getOpportunityBadgeDetails } from '@/lib/leads/classifier';

interface BusinessCardProps {
  business: Business;
  analysis?: LeadScoreResult;
  isAnalyzing?: boolean;
  isSaved?: boolean;
  onToggleSave?: (business: Business) => void;
  onAnalyze?: (business: Business) => void;
  onViewDetails?: (business: Business) => void;
}

export default function BusinessCard({
  business,
  analysis,
  isAnalyzing = false,
  isSaved = false,
  onToggleSave,
  onAnalyze,
  onViewDetails,
}: BusinessCardProps) {
  const {
    googlePlaceId,
    name,
    category,
    address,
    phone,
    website,
    rating,
    reviewCount,
    googleMapsUrl,
    hasWebsite,
  } = business;

  const opportunityBadge = analysis
    ? getOpportunityBadgeDetails(analysis.opportunityLevel)
    : null;

  return (
    <div
      className={`neo-card ${analysis && analysis.score >= 90 ? 'neo-card--yellow' : ''}`}
      style={{
        padding: '1.5rem',
        border: '2px solid #000',
        boxShadow: '4px 4px 0px 0px #000',
        background: analysis && analysis.score >= 90 ? 'var(--yellow)' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1.25rem',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div>
        {/* Top Badges & Website Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span className="neo-badge neo-badge--dark" style={{ fontSize: '0.7rem' }}>
            {category}
          </span>

          {analysis ? (
            <span
              className="neo-badge"
              style={{
                background: analysis.score >= 90 ? '#000' : analysis.score >= 75 ? '#ffe17c' : '#b7c6c2',
                color: analysis.score >= 90 ? '#ffe17c' : '#000',
                fontWeight: 800,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>{opportunityBadge?.emoji}</span>
              <span>{analysis.score}/100 {opportunityBadge?.label.split(' ')[0]} OPP</span>
            </span>
          ) : !hasWebsite ? (
            <span
              className="neo-badge"
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                border: '2px solid #b91c1c',
                fontWeight: 800,
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Flame size={12} />
              NO WEBSITE
            </span>
          ) : (
            <span className="neo-badge neo-badge--sage" style={{ fontSize: '0.7rem' }}>
              Website Available
            </span>
          )}
        </div>

        {/* Business Name */}
        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.3rem',
            letterSpacing: '-0.02em',
            marginBottom: '0.35rem',
            lineHeight: 1.2,
          }}
        >
          {name}
        </h3>

        {/* Rating and Reviews */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            marginBottom: '0.85rem',
          }}
        >
          {rating !== undefined ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Star size={15} fill="#febc2e" color="#febc2e" />
                <span style={{ fontWeight: 800 }}>{rating.toFixed(1)}</span>
              </div>
              <span style={{ color: '#888' }}>·</span>
              <span style={{ color: '#555', fontWeight: 600 }}>
                {reviewCount || 0} reviews
              </span>
            </>
          ) : (
            <span style={{ color: '#888', fontStyle: 'italic' }}>No ratings yet</span>
          )}
        </div>

        {/* AI Analyzed Highlights */}
        {analysis && (
          <div
            style={{
              background: '#ffffff',
              border: '2px solid #000',
              borderRadius: '6px',
              padding: '0.85rem 1rem',
              margin: '0.75rem 0',
              boxShadow: '2px 2px 0px 0px #000',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#000',
                marginBottom: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Zap size={13} fill="#000" /> Why this lead?
            </div>
            <ul
              style={{
                fontSize: '0.8rem',
                color: '#222',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                paddingLeft: '0.25rem',
              }}
            >
              {analysis.reasons.slice(0, 3).map((reason, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                  <span style={{ fontWeight: 800, color: '#000' }}>•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact & Location Details */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            fontSize: '0.85rem',
            color: '#444',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            paddingTop: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <MapPin size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ lineHeight: 1.4 }}>{address}</span>
          </div>

          {phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={15} style={{ flexShrink: 0 }} />
              <a
                href={`tel:${phone}`}
                style={{ fontWeight: 600, color: '#000', textDecoration: 'underline' }}
              >
                {phone}
              </a>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={15} style={{ flexShrink: 0 }} />
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontWeight: 600,
                  color: '#000',
                  textDecoration: 'underline',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink size={12} />
              </a>
            ) : (
              <span style={{ color: '#888', fontWeight: 500 }}>No website registered</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderTop: '1px solid #e4e4e7',
          paddingTop: '0.85rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Analyze Button or View Lead Link */}
        {analysis ? (
          <Link
            href={`/dashboard/leads/${encodeURIComponent(googlePlaceId)}?name=${encodeURIComponent(
              name
            )}&cat=${encodeURIComponent(category)}&addr=${encodeURIComponent(address)}&phone=${encodeURIComponent(
              phone || ''
            )}&web=${encodeURIComponent(website || '')}`}
            className="btn btn--primary btn--sm"
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            <span>View Full Audit</span>
            <ArrowRight size={14} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onAnalyze && onAnalyze(business)}
            disabled={isAnalyzing}
            className={`btn ${!hasWebsite ? 'btn--yellow' : 'btn--secondary'} btn--sm`}
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Zap size={14} />
                <span>{!hasWebsite ? 'Analyze Lead' : 'Analyze Website'}</span>
              </>
            )}
          </button>
        )}

        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--secondary btn--sm"
            style={{
              padding: '0.5rem 0.65rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Open in Google Maps"
          >
            <ExternalLink size={14} />
          </a>
        )}

        <button
          type="button"
          onClick={() => onToggleSave && onToggleSave(business)}
          className={`btn btn--sm ${isSaved ? 'btn--primary' : 'btn--secondary'}`}
          style={{
            padding: '0.5rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isSaved ? 'Saved to Pipeline' : 'Save Lead'}
          aria-label={isSaved ? 'Saved' : 'Save'}
        >
          {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
        </button>
      </div>
    </div>
  );
}
