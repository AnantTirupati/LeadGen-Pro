'use client';

import React, { useState } from 'react';
import { Search, MapPin, Briefcase, Hash } from 'lucide-react';

interface SearchPanelProps {
  onSearch?: (criteria: { location: string; industry: string; maxResults: number }) => void;
  isSearching?: boolean;
  initialLocation?: string;
  initialIndustry?: string;
  initialMaxResults?: number;
}

const COMMON_INDUSTRIES = [
  'Restaurants',
  'Dentists & Orthodontists',
  'Plumbing & HVAC Contractors',
  'Real Estate Agencies',
  'Law Firms & Legal Services',
  'Fitness Gyms & Studios',
  'Auto Repair & Detailing',
  'Web Development & Design Agencies',
  'Roofing & Construction',
  'Veterinarians & Pet Care',
];

export default function SearchPanel({
  onSearch,
  isSearching = false,
  initialLocation = '',
  initialIndustry = '',
  initialMaxResults = 25,
}: SearchPanelProps) {
  const [location, setLocation] = useState(initialLocation);
  const [industry, setIndustry] = useState(initialIndustry);
  const [maxResults, setMaxResults] = useState(String(initialMaxResults));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && location.trim() && industry.trim()) {
      onSearch({
        location: location.trim(),
        industry: industry.trim(),
        maxResults: parseInt(maxResults, 10) || 25,
      });
    }
  };

  return (
    <div
      className="neo-card neo-card--yellow"
      style={{
        padding: '1.75rem',
        marginBottom: '2rem',
        border: '2px solid #000',
        boxShadow: '4px 4px 0px 0px #000',
      }}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.25rem',
            letterSpacing: '-0.02em',
          }}
        >
          Discover Local Businesses
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#333' }}>
          Connect directly to Google Places to find verified businesses, phone numbers, and website statuses.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            alignItems: 'flex-end',
          }}
        >
          {/* Location */}
          <div className="form-group">
            <label
              htmlFor="search-location"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <MapPin size={14} /> Location
            </label>
            <input
              id="search-location"
              type="text"
              placeholder="e.g. Kanpur, Uttar Pradesh or Austin, TX"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              disabled={isSearching}
              className="neo-input"
            />
          </div>

          {/* Industry */}
          <div className="form-group">
            <label
              htmlFor="search-industry"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Briefcase size={14} /> Industry
            </label>
            <input
              id="search-industry"
              type="text"
              list="industry-suggestions"
              placeholder="e.g. Restaurants or Dentists"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              disabled={isSearching}
              className="neo-input"
            />
            <datalist id="industry-suggestions">
              {COMMON_INDUSTRIES.map((ind) => (
                <option key={ind} value={ind} />
              ))}
            </datalist>
          </div>

          {/* Max Results */}
          <div className="form-group" style={{ maxWidth: '140px' }}>
            <label
              htmlFor="search-max"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Hash size={14} /> Max Results
            </label>
            <select
              id="search-max"
              value={maxResults}
              onChange={(e) => setMaxResults(e.target.value)}
              disabled={isSearching}
              className="neo-select"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSearching || !location.trim() || !industry.trim()}
              className="btn btn--primary"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                height: '46px',
              }}
            >
              <Search size={18} />
              <span>{isSearching ? 'Searching...' : 'Find Leads'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
