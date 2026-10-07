'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { SavedLead, LeadCrmStats } from '@/lib/sales/types';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Send,
  PieChart,
  Layers,
  ArrowRight,
  Globe,
  AlertCircle,
  CheckCircle2,
  Download,
  Flame,
  Search,
} from 'lucide-react';

export default function AnalyticsPage() {
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

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
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
      console.error('[Load Analytics Error]', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute opportunity tiers
  const opportunityBreakdown = React.useMemo(() => {
    let veryHigh = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let noWebsite = 0;
    let hasWebsite = 0;

    leads.forEach((l) => {
      const tier = l.leadScore?.opportunityLevel;
      if (tier === 'VERY_HIGH') veryHigh++;
      else if (tier === 'HIGH') high++;
      else if (tier === 'MEDIUM') medium++;
      else if (tier === 'LOW') low++;
      else veryHigh++; // unanalyzed default to high potential

      if (l.business?.website || l.business?.hasWebsite) {
        hasWebsite++;
      } else {
        noWebsite++;
      }
    });

    return {
      veryHigh,
      high,
      medium,
      low,
      noWebsite,
      hasWebsite,
      total: leads.length || 1,
    };
  }, [leads]);

  // Funnel calculations
  const funnelSteps = [
    { label: 'Saved Leads', count: stats.totalLeads, color: '#000', bg: 'var(--yellow)' },
    { label: 'Pitches Sent', count: stats.contacted + stats.replied + stats.interested + stats.proposalSent + stats.won, color: '#1e40af', bg: '#dbeafe' },
    { label: 'Replies Received', count: stats.replied + stats.interested + stats.proposalSent + stats.won, color: '#3730a3', bg: '#e0e7ff' },
    { label: 'Interested / Demo', count: stats.interested + stats.proposalSent + stats.won, color: '#92400e', bg: '#fef3c7' },
    { label: 'Proposals Out', count: stats.proposalSent + stats.won, color: '#6b21a8', bg: '#f3e8ff' },
    { label: 'Deals Won', count: stats.won, color: '#15803d', bg: '#dcfce7' },
  ];

  const handleExportAnalyticsReport = () => {
    const csvContent = [
      'Metric,Value',
      `Total Leads Saved,${stats.totalLeads}`,
      `Pitches Sent,${stats.emailsSent}`,
      `Replies Received,${stats.replied}`,
      `Interested Leads,${stats.interested}`,
      `Proposals Sent,${stats.proposalSent}`,
      `Deals Won,${stats.won}`,
      `Deals Lost,${stats.lost}`,
      `Conversion Rate,${stats.conversionRate}`,
      `Very High Opportunity Leads,${opportunityBreakdown.veryHigh}`,
      `High Opportunity Leads,${opportunityBreakdown.high}`,
      `Businesses Without Website,${opportunityBreakdown.noWebsite}`,
      `Businesses With Website,${opportunityBreakdown.hasWebsite}`,
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leadgen-pro-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout activeTab="analytics">
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.25rem 0.65rem',
                background: 'var(--yellow)',
                border: '2px solid #000',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                boxShadow: '2px 2px 0px #000',
              }}
            >
              <BarChart3 size={13} />
              Performance Intelligence
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ink)' }}>
              CRM & Opportunity Analytics
            </h1>
            <p style={{ color: '#4b5563', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Real-time conversion metrics, deal pipeline velocities, and high-value prospect deficiency breakdowns.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleExportAnalyticsReport}
              className="btn btn--secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={15} />
              Export Report
            </button>
            <Link
              href="/dashboard"
              className="btn btn--primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
            >
              <Search size={15} />
              Find More Leads
            </Link>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          <StatCard
            label="Total Saved Pipeline"
            value={stats.totalLeads}
            variant="yellow"
            icon={<Users size={18} />}
            subtext={`${stats.newLeads} pending initial contact`}
          />
          <StatCard
            label="Outreach Velocity"
            value={stats.emailsSent}
            variant="sage"
            icon={<Send size={18} />}
            subtext="Total pitches dispatched"
          />
          <StatCard
            label="Win Conversion Rate"
            value={stats.conversionRate}
            variant="white"
            icon={<Award size={18} />}
            subtext={`${stats.won} deals closed won`}
          />
          <StatCard
            label="High Opportunity Rate"
            value={`${Math.round(((opportunityBreakdown.veryHigh + opportunityBreakdown.high) / (leads.length || 1)) * 100)}%`}
            variant="yellow"
            icon={<Flame size={18} />}
            subtext="Very High & High tiers"
          />
        </div>

        {/* Funnel & Opportunity Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Conversion Pipeline Funnel */}
          <div className="neo-card" style={{ background: '#fff', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Layers size={20} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
                Lead Conversion Funnel
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {funnelSteps.map((step, idx) => {
                const max = Math.max(stats.totalLeads, 1);
                const percent = Math.round((step.count / max) * 100);

                return (
                  <div key={idx}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        marginBottom: '0.35rem',
                      }}
                    >
                      <span style={{ color: 'var(--ink)' }}>{step.label}</span>
                      <span style={{ color: step.color }}>
                        {step.count} ({percent}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: '14px',
                        background: '#f3f4f6',
                        border: '2px solid #000',
                        overflow: 'hidden',
                        boxShadow: '1.5px 1.5px 0px #000',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(percent, 4)}%`,
                          background: step.bg,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opportunity Tier Breakdown */}
          <div className="neo-card" style={{ background: '#fff', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <PieChart size={20} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
                Opportunity Score Distribution
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  border: '2px solid #000',
                  padding: '1rem',
                  background: '#fef2f2',
                  boxShadow: '3px 3px 0px #000',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991b1b' }}>
                  VERY HIGH VALUE
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#000', marginTop: '0.2rem' }}>
                  {opportunityBreakdown.veryHigh}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  No site or critical issues
                </div>
              </div>

              <div
                style={{
                  border: '2px solid #000',
                  padding: '1rem',
                  background: '#fffbeb',
                  boxShadow: '3px 3px 0px #000',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e' }}>
                  HIGH OPPORTUNITY
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#000', marginTop: '0.2rem' }}>
                  {opportunityBreakdown.high}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  Outdated UX / Mobile flaws
                </div>
              </div>

              <div
                style={{
                  border: '2px solid #000',
                  padding: '1rem',
                  background: '#f0fdf4',
                  boxShadow: '3px 3px 0px #000',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803d' }}>
                  MEDIUM POTENTIAL
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#000', marginTop: '0.2rem' }}>
                  {opportunityBreakdown.medium}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  Minor redesign opportunities
                </div>
              </div>

              <div
                style={{
                  border: '2px solid #000',
                  padding: '1rem',
                  background: '#f8fafc',
                  boxShadow: '3px 3px 0px #000',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
                  LOW / OPTIMIZED
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#000', marginTop: '0.2rem' }}>
                  {opportunityBreakdown.low}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  Modern website detected
                </div>
              </div>
            </div>

            {/* Quick Website Status summary */}
            <div
              style={{
                background: '#fafafa',
                border: '1.5px dashed #000',
                padding: '0.85rem',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '0.82rem',
                fontWeight: 800,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626' }}>
                <Globe size={15} />
                <span>No Website: {opportunityBreakdown.noWebsite}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a' }}>
                <CheckCircle2 size={15} />
                <span>Has Website: {opportunityBreakdown.hasWebsite}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Agency Action Banner */}
        <div
          className="neo-card"
          style={{
            background: 'var(--yellow)',
            padding: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#000' }}>
              Want to increase your outreach response rate?
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937', fontWeight: 600 }}>
              Audit high-opportunity businesses first to generate personalized teardowns before sending cold pitches.
            </p>
          </div>

          <Link
            href="/dashboard/leads"
            className="btn btn--primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              background: '#000',
              color: '#fff',
            }}
          >
            Review Saved Leads
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
