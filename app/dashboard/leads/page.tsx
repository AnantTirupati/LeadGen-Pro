'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { SavedLead, LeadStatus, LeadCrmStats } from '@/lib/sales/types';
import { getOpportunityBadgeDetails } from '@/lib/leads/classifier';
import {
  Users,
  Send,
  Sparkles,
  Trophy,
  Download,
  Search,
  ChevronRight,
  Columns3,
  List,
  Trash2,
  Phone,
  Flame,
  Star,
  Mail,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const STATUS_OPTIONS: { id: LeadStatus; label: string; badgeBg: string; badgeColor: string }[] = [
  { id: 'NEW', label: 'New', badgeBg: '#f4f4f5', badgeColor: '#000' },
  { id: 'CONTACTED', label: 'Contacted', badgeBg: '#dbeafe', badgeColor: '#1e40af' },
  { id: 'REPLIED', label: 'Replied', badgeBg: '#e0e7ff', badgeColor: '#3730a3' },
  { id: 'INTERESTED', label: 'Interested', badgeBg: '#fef3c7', badgeColor: '#92400e' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', badgeBg: '#f3e8ff', badgeColor: '#6b21a8' },
  { id: 'WON', label: 'Won', badgeBg: '#dcfce7', badgeColor: '#15803d' },
  { id: 'LOST', label: 'Lost', badgeBg: '#fee2e2', badgeColor: '#991b1b' },
];

export default function LeadsCrmPage() {
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [stats, setStats] = useState<LeadCrmStats>({
    totalLeads: 0,
    newLeads: 0,
    contacted: 0,
    replied: 0,
    interested: 0,
    proposalSent: 0,
    won: 0,
    lost: 0,
    followUpsDue: 0,
    emailsSent: 0,
    delivered: 0,
    bounced: 0,
    conversionRate: '--',
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [outreachFilter, setOutreachFilter] = useState<string>('all');
  const [opportunityFilter, setOpportunityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'score' | 'recent' | 'name' | 'followup'>('recent');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/leads/stats'),
      ]);

      const leadsData = await leadsRes.json();
      const statsData = await statsRes.json();

      if (leadsData.success && Array.isArray(leadsData.leads)) {
        setLeads(leadsData.leads);
      }
      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('[Load Leads CRM Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const statsRes = await fetch('/api/leads/stats');
      const statsData = await statsRes.json();
      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('[Status Update Error]', err);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to remove this lead from your CRM?')) return;

    setLeads((prev) => prev.filter((l) => l.id !== leadId));

    try {
      await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      const statsRes = await fetch('/api/leads/stats');
      const statsData = await statsRes.json();
      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('[Delete Lead Error]', err);
    }
  };

  const handleExportCsv = () => {
    if (leads.length === 0) {
      alert('No leads to export.');
      return;
    }

    const headers = [
      'Business Name',
      'Category',
      'Location',
      'Phone',
      'Website',
      'Contact Email',
      'Contact Person',
      'Google Rating',
      'Review Count',
      'Lead Score',
      'Opportunity Level',
      'Pipeline Status',
      'Follow-up Date',
      'Saved At',
      'Notes',
    ];

    const rows = leads.map((l) => {
      const biz = l.business;
      const score = l.leadScore;

      return [
        `"${(biz?.name || '').replace(/"/g, '""')}"`,
        `"${(biz?.category || '').replace(/"/g, '""')}"`,
        `"${(biz?.address || '').replace(/"/g, '""')}"`,
        `"${(biz?.phone || '').replace(/"/g, '""')}"`,
        `"${(biz?.website || 'No Website').replace(/"/g, '""')}"`,
        `"${(l.contactEmail || '').replace(/"/g, '""')}"`,
        `"${(l.contactName || '').replace(/"/g, '""')}"`,
        biz?.rating ?? 'N/A',
        biz?.reviewCount ?? 0,
        score?.score ?? 'N/A',
        score?.opportunityLevel ?? 'N/A',
        l.status,
        l.followUpAt ? new Date(l.followUpAt).toLocaleDateString() : 'None',
        new Date(l.createdAt).toLocaleDateString(),
        `"${(l.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leadgen_pro_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let list = [...leads];
    const now = new Date();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.business?.name.toLowerCase().includes(q) ||
          l.business?.category.toLowerCase().includes(q) ||
          l.business?.address.toLowerCase().includes(q) ||
          l.contactEmail?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((l) => l.status === statusFilter);
    }

    if (outreachFilter === 'never_contacted') {
      list = list.filter((l) => l.status === 'NEW');
    } else if (outreachFilter === 'contacted') {
      list = list.filter((l) => l.status !== 'NEW');
    } else if (outreachFilter === 'follow_up_due') {
      list = list.filter(
        (l) => l.followUpStatus === 'SCHEDULED' && l.followUpAt && new Date(l.followUpAt) <= now
      );
    } else if (outreachFilter === 'has_email') {
      list = list.filter((l) => Boolean(l.contactEmail));
    }

    if (opportunityFilter !== 'all') {
      list = list.filter((l) => l.leadScore?.opportunityLevel === opportunityFilter);
    }

    if (sortBy === 'score') {
      list.sort((a, b) => (b.leadScore?.score || 0) - (a.leadScore?.score || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.business?.name || '').localeCompare(b.business?.name || ''));
    } else if (sortBy === 'followup') {
      list.sort((a, b) => {
        if (!a.followUpAt) return 1;
        if (!b.followUpAt) return -1;
        return new Date(a.followUpAt).getTime() - new Date(b.followUpAt).getTime();
      });
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [leads, searchQuery, statusFilter, outreachFilter, opportunityFilter, sortBy]);

  return (
    <DashboardLayout>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '2rem',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            Saved Leads & Outreach CRM
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.25rem' }}>
            Manage client prospects, personalized email outreach, and scheduled follow-up reminders.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleExportCsv}
            disabled={leads.length === 0}
            className="btn btn--secondary btn--sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <Link
            href="/dashboard"
            className="btn btn--primary btn--sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Search size={14} />
            <span>Discover More</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard label="Total Saved" value={stats.totalLeads} variant="white" icon={<Users size={18} />} />
        <StatCard label="Never Contacted" value={stats.newLeads} variant="white" icon={<Sparkles size={18} />} />
        <StatCard label="Contacted" value={stats.contacted} variant="sage" icon={<Send size={18} />} />
        <StatCard label="Follow-ups Due" value={stats.followUpsDue} variant={stats.followUpsDue > 0 ? 'yellow' : 'white'} icon={<Clock size={18} />} />
        <StatCard label="Interested / Won" value={stats.interested + stats.won} variant="dark" icon={<Trophy size={18} />} />
      </div>

      {/* Filter and View Controls Toolbar */}
      <div
        className="neo-card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          border: '2px solid #000',
          boxShadow: '3px 3px 0px 0px #000',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '200px', flex: 1, maxWidth: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#666' }} />
            <input
              type="text"
              placeholder="Filter by name, email, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neo-input"
              style={{ paddingLeft: '2rem', fontSize: '0.85rem', height: '36px' }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="neo-select"
            style={{ width: 'auto', fontSize: '0.8rem', height: '36px', padding: '0.25rem 0.75rem' }}
          >
            <option value="all">All Pipeline Stages</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Outreach Filter */}
          <select
            value={outreachFilter}
            onChange={(e) => setOutreachFilter(e.target.value)}
            className="neo-select"
            style={{ width: 'auto', fontSize: '0.8rem', height: '36px', padding: '0.25rem 0.75rem' }}
          >
            <option value="all">All Outreach</option>
            <option value="never_contacted">Never Contacted (New)</option>
            <option value="contacted">Contacted</option>
            <option value="follow_up_due">⏰ Follow-up Due</option>
            <option value="has_email">Has Contact Email</option>
          </select>

          {/* Opportunity Filter */}
          <select
            value={opportunityFilter}
            onChange={(e) => setOpportunityFilter(e.target.value)}
            className="neo-select"
            style={{ width: 'auto', fontSize: '0.8rem', height: '36px', padding: '0.25rem 0.75rem' }}
          >
            <option value="all">All Opportunities</option>
            <option value="VERY_HIGH">🔥 Very High Opp</option>
            <option value="HIGH">⚡ High Opp</option>
            <option value="MEDIUM">Medium Opp</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="neo-select"
            style={{ width: 'auto', fontSize: '0.8rem', height: '36px', padding: '0.25rem 0.75rem' }}
          >
            <option value="recent">Recently Saved</option>
            <option value="score">🔥 Highest Lead Score</option>
            <option value="followup">⏰ Follow-up Date</option>
            <option value="name">Business Name (A-Z)</option>
          </select>
        </div>

        {/* View Toggle Buttons */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={() => setViewMode('list')}
            className={`btn btn--sm ${viewMode === 'list' ? 'btn--primary' : 'btn--secondary'}`}
            style={{ padding: '0.35rem 0.65rem' }}
            title="Table List View"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`btn btn--sm ${viewMode === 'pipeline' ? 'btn--primary' : 'btn--secondary'}`}
            style={{ padding: '0.35rem 0.65rem' }}
            title="Kanban Pipeline View"
          >
            <Columns3 size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div
          className="neo-card neo-card--yellow"
          style={{ padding: '4rem 2rem', textAlign: 'center', border: '2px solid #000' }}
        >
          <Sparkles size={32} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}>Loading Your Pipeline...</h3>
        </div>
      ) : leads.length === 0 ? (
        <div
          className="neo-card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: '#fff',
            border: '2px solid #000',
            boxShadow: '4px 4px 0px 0px #000',
          }}
        >
          <Users size={36} style={{ margin: '0 auto 1rem', color: '#666' }} />
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.4rem',
              marginBottom: '0.5rem',
            }}
          >
            No leads saved yet
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#666', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Discover local businesses from Google Places and click &ldquo;Save Lead&rdquo; to build your client pipeline.
          </p>
          <Link href="/dashboard" className="btn btn--primary">
            Find New Leads
          </Link>
        </div>
      ) : viewMode === 'pipeline' ? (
        /* Pipeline / Kanban Columns View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '1rem',
          }}
        >
          {STATUS_OPTIONS.map((column) => {
            const columnLeads = filteredLeads.filter((l) => l.status === column.id);
            return (
              <div
                key={column.id}
                className="neo-card"
                style={{
                  background: '#f8faf9',
                  border: '2px solid #000',
                  boxShadow: '3px 3px 0px 0px #000',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  minHeight: '350px',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid #000',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    {column.label}
                  </span>
                  <span
                    className="neo-badge"
                    style={{ background: column.badgeBg, color: column.badgeColor, fontSize: '0.75rem' }}
                  >
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards in Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {columnLeads.map((lead) => {
                    const biz = lead.business;
                    const score = lead.leadScore;

                    return (
                      <div
                        key={lead.id}
                        className="neo-card"
                        style={{
                          padding: '0.85rem',
                          border: '2px solid #000',
                          boxShadow: '2px 2px 0px 0px #000',
                          background: '#fff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Link
                            href={`/dashboard/leads/${encodeURIComponent(lead.businessId)}?name=${encodeURIComponent(
                              biz?.name || ''
                            )}&cat=${encodeURIComponent(biz?.category || '')}&addr=${encodeURIComponent(
                              biz?.address || ''
                            )}&phone=${encodeURIComponent(biz?.phone || '')}&web=${encodeURIComponent(
                              biz?.website || ''
                            )}`}
                            style={{ fontWeight: 800, fontSize: '0.95rem', color: '#000', textDecoration: 'underline' }}
                          >
                            {biz?.name || 'Local Business'}
                          </Link>
                          {score && (
                            <span className="neo-badge neo-badge--dark" style={{ fontSize: '0.65rem' }}>
                              {score.score}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.25rem' }}>
                          {biz?.category} · {biz?.address.split(',')[0]}
                        </div>

                        {lead.contactEmail && (
                          <div style={{ fontSize: '0.75rem', color: '#1e40af', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Mail size={12} />
                            <span>{lead.contactEmail}</span>
                          </div>
                        )}

                        {lead.followUpAt && lead.followUpStatus === 'SCHEDULED' && (
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} />
                            <span>Follow-up: {new Date(lead.followUpAt).toLocaleDateString()}</span>
                          </div>
                        )}

                        {/* Status Switcher */}
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.35rem' }}>
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                            className="neo-select"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', height: '28px' }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.id} value={s.id}>
                                → {s.label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="btn btn--secondary btn--sm"
                            style={{ padding: '0.2rem 0.4rem', height: '28px' }}
                            title="Delete Lead"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {filteredLeads.map((lead) => {
            const biz = lead.business;
            const score = lead.leadScore;
            const oppBadge = score ? getOpportunityBadgeDetails(score.opportunityLevel) : null;
            const isFollowUpDue =
              lead.followUpStatus === 'SCHEDULED' &&
              lead.followUpAt &&
              new Date(lead.followUpAt) <= new Date();

            return (
              <div
                key={lead.id}
                className="neo-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  border: '2px solid #000',
                  boxShadow: '4px 4px 0px 0px #000',
                  background: isFollowUpDue ? '#fefce8' : '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                {/* Business & Lead Info */}
                <div style={{ flex: 2, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <span className="neo-badge neo-badge--dark" style={{ fontSize: '0.7rem' }}>
                      {biz?.category || 'Business'}
                    </span>
                    {score && (
                      <span
                        className="neo-badge"
                        style={{
                          background: score.score >= 90 ? '#ffe17c' : '#b7c6c2',
                          color: '#000',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                        }}
                      >
                        {oppBadge?.emoji} {score.score}/100 {score.opportunityLevel}
                      </span>
                    )}
                    {isFollowUpDue && (
                      <span
                        className="neo-badge"
                        style={{ background: '#fef08a', color: '#854d0e', border: '1px solid #854d0e', fontSize: '0.7rem', fontWeight: 800 }}
                      >
                        ⏰ FOLLOW-UP DUE
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/leads/${encodeURIComponent(lead.businessId)}?name=${encodeURIComponent(
                      biz?.name || ''
                    )}&cat=${encodeURIComponent(biz?.category || '')}&addr=${encodeURIComponent(
                      biz?.address || ''
                    )}&phone=${encodeURIComponent(biz?.phone || '')}&web=${encodeURIComponent(
                      biz?.website || ''
                    )}`}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      color: '#000',
                      textDecoration: 'none',
                    }}
                  >
                    {biz?.name || 'Local Business'}
                  </Link>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#555', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    {biz?.address && <span>📍 {biz.address}</span>}
                    {lead.contactEmail ? (
                      <span style={{ color: '#1e40af', fontWeight: 700 }}>✉️ {lead.contactEmail}</span>
                    ) : (
                      <span style={{ color: '#888', fontStyle: 'italic' }}>No email set</span>
                    )}
                    {biz?.phone && <span>📞 {biz.phone}</span>}
                  </div>
                </div>

                {/* Status Selector & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Status Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Status:</span>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className="neo-select"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', width: 'auto', height: '36px' }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Open Details Action */}
                  <Link
                    href={`/dashboard/leads/${encodeURIComponent(lead.businessId)}?name=${encodeURIComponent(
                      biz?.name || ''
                    )}&cat=${encodeURIComponent(biz?.category || '')}&addr=${encodeURIComponent(
                      biz?.address || ''
                    )}&phone=${encodeURIComponent(biz?.phone || '')}&web=${encodeURIComponent(
                      biz?.website || ''
                    )}`}
                    className="btn btn--yellow btn--sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <span>Open Lead & Outreach</span>
                    <ChevronRight size={14} />
                  </Link>

                  <button
                    onClick={() => handleDeleteLead(lead.id)}
                    className="btn btn--secondary btn--sm"
                    style={{ padding: '0.4rem 0.6rem' }}
                    title="Remove from Saved Leads"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
