'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  ChevronRight,
  Copy,
  Check,
  Mail,
  Sparkles,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface OutreachEmailItem {
  id: string;
  savedLeadId: string;
  toEmail: string;
  fromEmail: string;
  replyTo?: string | null;
  subject: string;
  body: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'FAILED';
  provider?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
  businessName?: string;
  businessCategory?: string;
  businessAddress?: string;
}

interface CampaignStats {
  totalEmailsSent: number;
  delivered: number;
  bounced: number;
  failed: number;
  deliveryRate: string;
  followUpsDue: number;
  contactedLeads: number;
  repliedLeads: number;
  interestedLeads: number;
  wonLeads: number;
  conversionRate: string;
}

const TEMPLATES = [
  {
    id: 'cold-audit',
    name: 'Cold Audit Pitch',
    badge: 'High Conversion',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
    subject: 'Quick question about {{business_name}}\'s website & customer flow',
    body: `Hi {{contact_name}},\n\nI was researching top-rated {{category}} businesses in {{city}} and noticed {{business_name}} has stellar customer reviews.\n\nHowever, when I checked your website, I spotted a few technical speed and mobile usability bottlenecks that might be costing you calls and bookings.\n\nI put together a quick, free 2-minute video breakdown of how you could capture 20-30% more inbound leads. Would it be okay if I sent that over?\n\nBest regards,\n[Your Name]`,
  },
  {
    id: 'follow-up-bump',
    name: '3-Day Value Follow-up',
    badge: 'Sequence #2',
    badgeBg: '#dbeafe',
    badgeColor: '#1e40af',
    subject: 'Re: Quick question about {{business_name}}',
    body: `Hi {{contact_name}},\n\nJust following up on my previous note. I know you're busy running {{business_name}}.\n\nI drafted a quick mockup showing what a modernized, fast-loading booking page could look like for you. No strings attached!\n\nLet me know if you'd like me to send the link over.\n\nBest,\n[Your Name]`,
  },
  {
    id: 'competitor-angle',
    name: 'Local Competitor Angle',
    badge: 'Urgency Driver',
    badgeBg: '#fef3c7',
    badgeColor: '#92400e',
    subject: 'Local search rankings for {{category}} in {{city}}',
    body: `Hi {{contact_name}},\n\nDid you know several local competitors in {{city}} recently revamped their mobile sites and are capturing top spots for "{{category}} near me"?\n\n{{business_name}} already has the reputation—modernizing your site could easily put you ahead.\n\nWould you be open to a 5-minute chat this Thursday?\n\nBest,\n[Your Name]`,
  },
];

export default function CampaignsPage() {
  const [emails, setEmails] = useState<OutreachEmailItem[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    totalEmailsSent: 0,
    delivered: 0,
    bounced: 0,
    failed: 0,
    deliveryRate: '100%',
    followUpsDue: 0,
    contactedLeads: 0,
    repliedLeads: 0,
    interestedLeads: 0,
    wonLeads: 0,
    conversionRate: '--',
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    loadCampaignData();
  }, []);

  const loadCampaignData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('[Load Campaigns Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTemplate = (template: (typeof TEMPLATES)[0]) => {
    const text = `Subject: ${template.subject}\n\n${template.body}`;
    navigator.clipboard.writeText(text);
    setCopiedTemplateId(template.id);
    setTimeout(() => setCopiedTemplateId(null), 2000);
  };

  const filteredEmails = useMemo(() => {
    return emails.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const bName = item.businessName?.toLowerCase() || '';
        const email = item.toEmail.toLowerCase();
        const subj = item.subject.toLowerCase();
        return bName.includes(q) || email.includes(q) || subj.includes(q);
      }
      return true;
    });
  }, [emails, statusFilter, searchQuery]);

  return (
    <DashboardLayout activeTab="campaigns">
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
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
                <Send size={13} />
                Outreach Engine
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ink)' }}>
                Email Campaigns & Outreach
              </h1>
              <p style={{ color: '#4b5563', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                Track cold pitch delivery status, monitor follow-up cadences, and deploy high-converting sequence templates.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={loadCampaignData}
                className="btn btn--secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                title="Refresh Campaigns"
              >
                <RefreshCw size={15} />
                Refresh
              </button>
              <Link
                href="/dashboard/leads"
                className="btn btn--primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <Sparkles size={16} />
                Generate New Pitch in CRM
              </Link>
            </div>
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
            label="Total Emails Sent"
            value={stats.totalEmailsSent}
            variant="yellow"
            icon={<Send size={18} />}
            subtext={`${stats.contactedLeads} leads contacted`}
          />
          <StatCard
            label="Delivery Rate"
            value={stats.deliveryRate}
            variant="sage"
            icon={<CheckCircle2 size={18} />}
            subtext={`${stats.delivered} delivered successfully`}
          />
          <StatCard
            label="Follow-Ups Due"
            value={stats.followUpsDue}
            variant="white"
            icon={<Clock size={18} />}
            subtext="Scheduled in CRM"
          />
          <StatCard
            label="Deals Won"
            value={stats.wonLeads}
            variant="yellow"
            icon={<Sparkles size={18} />}
            subtext={`Conv Rate: ${stats.conversionRate}`}
          />
        </div>

        {/* Proven Campaign Sequence Templates */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--ink)' }}>
              Proven Outreach Sequence Templates
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Pre-built high-converting frameworks tailored for local web design and SEO agency pitching.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {TEMPLATES.map((tmpl) => {
              const isCopied = copiedTemplateId === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  className="neo-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                    background: '#fff',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                        {tmpl.name}
                      </h3>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          background: tmpl.badgeBg,
                          color: tmpl.badgeColor,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          borderRadius: '4px',
                          border: '1.5px solid #000',
                        }}
                      >
                        {tmpl.badge}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#374151',
                        background: '#f9fafb',
                        padding: '0.5rem 0.65rem',
                        border: '1px solid #e5e7eb',
                        marginBottom: '0.75rem',
                        borderRadius: '4px',
                      }}
                    >
                      <span style={{ color: '#9ca3af' }}>Subject:</span> {tmpl.subject}
                    </div>

                    <pre
                      style={{
                        fontSize: '0.78rem',
                        color: '#4b5563',
                        background: '#fcfcfc',
                        padding: '0.75rem',
                        border: '1.5px dashed #d1d5db',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        lineHeight: '1.4',
                        maxHeight: '130px',
                        overflowY: 'auto',
                        marginBottom: '1rem',
                      }}
                    >
                      {tmpl.body}
                    </pre>
                  </div>

                  <button
                    onClick={() => handleCopyTemplate(tmpl)}
                    className="btn btn--secondary"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      background: isCopied ? '#dcfce7' : '#fff',
                    }}
                  >
                    {isCopied ? (
                      <>
                        <Check size={16} color="#15803d" />
                        Copied Template!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy Template
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outreach Dispatch History Table */}
        <div className="neo-card" style={{ background: '#fff', padding: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ink)' }}>
                Outreach History & Dispatch Logs
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Full record of individual personalized cold pitches and follow-up dispatches.
              </p>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: '220px',
                }}
              >
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    color: '#9ca3af',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by business or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem 0.45rem 2.2rem',
                    border: '2px solid #000',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxShadow: '2px 2px 0px #000',
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  border: '2px solid #000',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  boxShadow: '2px 2px 0px #000',
                  cursor: 'pointer',
                  background: '#fff',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="SENT">Sent</option>
                <option value="BOUNCED">Bounced</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {/* Email Log Items */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <div
                style={{
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '0.75rem',
                }}
              />
              <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Loading outreach logs...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                background: '#f9fafb',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
              }}
            >
              <Mail size={42} style={{ color: '#9ca3af', marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)' }}>
                No outreach emails found
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '450px', margin: '0.5rem auto 1.25rem' }}>
                {searchQuery || statusFilter !== 'all'
                  ? 'No emails match your active filters. Try clearing your search.'
                  : 'Start sending personalized AI pitches from your Saved Leads CRM page to populate your outreach history.'}
              </p>
              <Link
                href="/dashboard/leads"
                className="btn btn--primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                Go to Saved Leads CRM
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredEmails.map((email) => {
                const isDelivered = email.status === 'DELIVERED' || email.status === 'SENT';
                const isBounced = email.status === 'BOUNCED';
                const isFailed = email.status === 'FAILED';

                return (
                  <div
                    key={email.id}
                    style={{
                      border: '2px solid #000',
                      padding: '1rem 1.25rem',
                      background: '#fff',
                      boxShadow: '3px 3px 0px #000',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      transition: 'transform 0.1s',
                    }}
                  >
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                        <span
                          style={{
                            fontWeight: 900,
                            fontSize: '1rem',
                            color: 'var(--ink)',
                          }}
                        >
                          {email.businessName || 'Local Business'}
                        </span>
                        {email.businessCategory && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: '#f3f4f6',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                            }}
                          >
                            {email.businessCategory}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '0.25rem' }}>
                        {email.subject}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#6b7280', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span>
                          <strong>To:</strong> {email.toEmail}
                        </span>
                        <span>
                          <strong>Sent:</strong> {new Date(email.createdAt).toLocaleDateString()} at{' '}
                          {new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {email.provider && (
                          <span>
                            <strong>Via:</strong> {email.provider}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '4px',
                          border: '1.5px solid #000',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: isDelivered ? '#dcfce7' : isBounced ? '#fee2e2' : '#fef3c7',
                          color: isDelivered ? '#15803d' : isBounced ? '#991b1b' : '#92400e',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        {isDelivered && <CheckCircle2 size={13} />}
                        {isBounced && <AlertTriangle size={13} />}
                        {isFailed && <AlertTriangle size={13} />}
                        {email.status}
                      </span>

                      <Link
                        href={`/dashboard/leads/${email.savedLeadId}`}
                        className="btn btn--secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.8rem',
                          padding: '0.4rem 0.75rem',
                          textDecoration: 'none',
                        }}
                      >
                        View Lead
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
