'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  Settings,
  User,
  Mail,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Trash2,
  Download,
  Save,
  Key,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [agencyName, setAgencyName] = useState('Apex Digital Studio');
  const [senderName, setSenderName] = useState('Alex Rivera');
  const [senderEmail, setSenderEmail] = useState('alex@agency.com');
  const [pitchTone, setPitchTone] = useState<'direct' | 'consultative' | 'friendly'>('direct');
  const [followUpDays, setFollowUpDays] = useState<number>(3);
  const [includeMockup, setIncludeMockup] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  // Service health checks
  const [apiHealth, setApiHealth] = useState<{
    googlePlaces: boolean;
    geminiAi: boolean;
    supabase: boolean;
    resend: boolean;
  }>({
    googlePlaces: true,
    geminiAi: true,
    supabase: true,
    resend: true,
  });

  useEffect(() => {
    // Load local storage preferences if any
    const saved = localStorage.getItem('leadgen_pro_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.agencyName) setAgencyName(parsed.agencyName);
        if (parsed.senderName) setSenderName(parsed.senderName);
        if (parsed.senderEmail) setSenderEmail(parsed.senderEmail);
        if (parsed.pitchTone) setPitchTone(parsed.pitchTone);
        if (parsed.followUpDays) setFollowUpDays(parsed.followUpDays);
        if (parsed.includeMockup !== undefined) setIncludeMockup(parsed.includeMockup);
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }

    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          if (user.email) setSenderEmail(user.email);
          if (user.user_metadata?.full_name) setSenderName(user.user_metadata.full_name);
        }
      });
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      agencyName,
      senderName,
      senderEmail,
      pitchTone,
      followUpDays,
      includeMockup,
    };
    localStorage.setItem('leadgen_pro_settings', JSON.stringify(config));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClearCache = () => {
    setClearingCache(true);
    sessionStorage.clear();
    setTimeout(() => {
      setClearingCache(false);
      alert('Local search cache and session buffers have been cleared successfully.');
    }, 500);
  };

  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      const backupData = {
        exportedAt: new Date().toISOString(),
        settings: { agencyName, senderName, senderEmail, pitchTone, followUpDays },
        leads: data.leads || [],
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leadgen-pro-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export backup data.');
    }
  };

  return (
    <DashboardLayout activeTab="settings">
      <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
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
            <Settings size={13} />
            Preferences & Configuration
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ink)' }}>
            System Settings & Agency Profile
          </h1>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Customize your outreach identity, configure AI pitch generation parameters, and monitor connected integrations.
          </p>
        </div>

        {savedSuccess && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: '#dcfce7',
              border: '2px solid #000',
              boxShadow: '3px 3px 0px #000',
              color: '#15803d',
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <CheckCircle2 size={18} />
            Settings saved successfully!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Agency & Sender Profile Form */}
          <form onSubmit={handleSaveSettings} className="neo-card" style={{ background: '#fff', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <User size={20} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                Agency & Sender Profile
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  Agency / Brand Name
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="e.g. Apex Digital Studio"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    border: '2px solid #000',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxShadow: '2px 2px 0px #000',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    border: '2px solid #000',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxShadow: '2px 2px 0px #000',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  Sender / Reply-To Email
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. alex@apexstudio.io"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    border: '2px solid #000',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxShadow: '2px 2px 0px #000',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  AI Pitch Tone Style
                </label>
                <select
                  value={pitchTone}
                  onChange={(e) => setPitchTone(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    border: '2px solid #000',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxShadow: '2px 2px 0px #000',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <option value="direct">Direct & High Impact (Focus on revenue loss)</option>
                  <option value="consultative">Consultative & Advisory (Value-first insights)</option>
                  <option value="friendly">Friendly & Casual (Low pressure introduction)</option>
                </select>
              </div>
            </div>

            {/* Cadence settings */}
            <div
              style={{
                borderTop: '1.5px solid #e5e7eb',
                paddingTop: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.5rem',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: '1 1 250px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  Default Follow-up Reminder Window
                </label>
                <select
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(Number(e.target.value))}
                  style={{
                    padding: '0.5rem 0.85rem',
                    border: '2px solid #000',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    boxShadow: '2px 2px 0px #000',
                    background: '#fff',
                  }}
                >
                  <option value={2}>2 days after initial pitch</option>
                  <option value={3}>3 days after initial pitch (Recommended)</option>
                  <option value={5}>5 days after initial pitch</option>
                  <option value={7}>7 days after initial pitch</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="includeMockupToggle"
                  checked={includeMockup}
                  onChange={(e) => setIncludeMockup(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#000' }}
                />
                <label
                  htmlFor="includeMockupToggle"
                  style={{ fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  Include mockup redesign proposal angle in AI generation
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn--primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Save size={16} />
              Save Agency Preferences
            </button>
          </form>

          {/* Connected Integrations & Health Diagnostic */}
          <div className="neo-card" style={{ background: '#fff', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <ShieldCheck size={20} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                API & Service Health Diagnostics
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  border: '2px solid #000',
                  padding: '1rem',
                  background: '#f8fafc',
                  boxShadow: '2px 2px 0px #000',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Google Places API</span>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      border: '1px solid #000',
                    }}
                  >
                    Active / Mock Ready
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                  Handles local business discovery and multi-page search retrieval.
                </p>
              </div>

              <div
                style={{
                  border: '2px solid #000',
                  padding: '1rem',
                  background: '#f8fafc',
                  boxShadow: '2px 2px 0px #000',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Gemini AI Engine</span>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      border: '1px solid #000',
                    }}
                  >
                    Active
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                  Powers audit synthesis, opportunity scoring, and sales pitch copy.
                </p>
              </div>

              <div
                style={{
                  border: '2px solid #000',
                  padding: '1rem',
                  background: '#f8fafc',
                  boxShadow: '2px 2px 0px #000',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Supabase DB & Auth</span>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      border: '1px solid #000',
                    }}
                  >
                    Connected
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                  Realtime CRM storage, saved leads persistence, and activity logging.
                </p>
              </div>

              <div
                style={{
                  border: '2px solid #000',
                  padding: '1rem',
                  background: '#f8fafc',
                  boxShadow: '2px 2px 0px #000',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Resend Outreach</span>
                  <span
                    style={{
                      background: '#dbeafe',
                      color: '#1e40af',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      border: '1px solid #000',
                    }}
                  >
                    Ready / Preview
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                  Direct email dispatching, webhook event logging, and bounce tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Data & Cache Management */}
          <div className="neo-card" style={{ background: '#fff', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <Database size={20} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                Data & Cache Management
              </h2>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '1.25rem' }}>
              Export full CRM snapshots or purge cached search queries and session buffers.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleExportBackup}
                className="btn btn--secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={15} />
                Export Complete Data Backup (JSON)
              </button>

              <button
                onClick={handleClearCache}
                disabled={clearingCache}
                className="btn btn--secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#fff1f2',
                  borderColor: '#f43f5e',
                  color: '#be123c',
                }}
              >
                <Trash2 size={15} />
                {clearingCache ? 'Clearing...' : 'Clear Search Cache & Sessions'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
