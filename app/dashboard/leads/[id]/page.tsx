'use client';

import React, { useEffect, useState, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { LeadScoreResult } from '@/lib/leads/types';
import { getOpportunityBadgeDetails } from '@/lib/leads/classifier';
import { LeadStatus, SalesPitch, LeadActivity, LEAD_STATUS_CONFIG } from '@/lib/sales/types';
import { LeadEmailRecord, EMAIL_STATUS_CONFIG, FollowUpStatus } from '@/lib/email/types';
import { isValidEmail } from '@/lib/email/templates';
import {
  Star,
  Globe,
  Phone,
  MapPin,
  ArrowLeft,
  Zap,
  ShieldCheck,
  Smartphone,
  Search,
  Gauge,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Bookmark,
  Check,
  Send,
  Edit3,
  Copy,
  Clock,
  FileText,
  History,
  Save,
  Loader2,
  Mail,
  Calendar,
  AlertCircle,
  Eye,
  UserCheck,
} from 'lucide-react';

const STATUS_OPTIONS: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'REPLIED',
  'INTERESTED',
  'PROPOSAL_SENT',
  'WON',
  'LOST',
];

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const businessId = decodeURIComponent(resolvedParams.id);
  const businessName = searchParams.get('name') || 'Local Business';
  const category = searchParams.get('cat') || 'Business';
  const address = searchParams.get('addr') || '';
  const phone = searchParams.get('phone') || '';
  const website = searchParams.get('web') || '';

  // Analysis State
  const [analysis, setAnalysis] = useState<LeadScoreResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // CRM State
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null);
  const [status, setStatus] = useState<LeadStatus>('NEW');
  const [notes, setNotes] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');
  const [savingNote, setSavingNote] = useState(false);
  const [pitches, setPitches] = useState<SalesPitch[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);

  // Outreach Contact Info
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  // Email Outreach State
  const [emailTo, setEmailTo] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [emailHistory, setEmailHistory] = useState<LeadEmailRecord[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [outreachMessage, setOutreachMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');
  const [showTestModal, setShowTestModal] = useState(false);

  // Follow-up State
  const [followUpAt, setFollowUpAt] = useState<string | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>('NONE');
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
  const [customFollowUpDate, setCustomFollowUpDate] = useState<string>('');

  // AI Pitch Generation State
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [pitchSubject, setPitchSubject] = useState<string>('');
  const [pitchBody, setPitchBody] = useState<string>('');
  const [activePitchId, setActivePitchId] = useState<string | null>(null);
  const [personalizationPoints, setPersonalizationPoints] = useState<string[]>([]);
  const [isPitchCopied, setIsPitchCopied] = useState(false);
  const [isSavingPitch, setIsSavingPitch] = useState(false);
  const [pitchMessage, setPitchMessage] = useState<string | null>(null);

  // Load Website Analysis
  useEffect(() => {
    async function loadAnalysis() {
      setLoadingAnalysis(true);
      setAnalysisError(null);

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            business: {
              googlePlaceId: businessId,
              name: businessName,
              category,
              address,
              phone,
              website: website || undefined,
              hasWebsite: Boolean(website && website.length > 0),
            },
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setAnalysisError(data.error || 'Failed to load lead analysis.');
        } else {
          setAnalysis(data.result);
        }
      } catch (err) {
        console.error('[Lead Details Load Error]', err);
        setAnalysisError('Network error while analyzing lead.');
      } finally {
        setLoadingAnalysis(false);
      }
    }

    loadAnalysis();
  }, [businessId, businessName, category, address, phone, website]);

  // Load CRM & Outreach details
  useEffect(() => {
    async function checkSavedStatus() {
      try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.leads)) {
          const matching = data.leads.find(
            (item: any) => item.businessId === businessId || item.id === businessId
          );
          if (matching) {
            setIsSaved(true);
            setSavedLeadId(matching.id);
            setStatus(matching.status || 'NEW');
            setNotes(matching.notes || '');
            if (matching.contactEmail) {
              setContactEmail(matching.contactEmail);
              setEmailTo(matching.contactEmail);
            }
            if (matching.contactName) {
              setContactName(matching.contactName);
            }
            if (matching.followUpAt) {
              setFollowUpAt(matching.followUpAt);
              setFollowUpStatus(matching.followUpStatus || 'SCHEDULED');
            }

            loadPitches(matching.id);
            loadActivities(matching.id);
            loadEmails(matching.id);
          }
        }
      } catch (err) {
        console.error('[Load CRM error]', err);
      }
    }

    checkSavedStatus();
  }, [businessId]);

  const loadPitches = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/pitch`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.pitches)) {
        setPitches(data.pitches);
        if (data.pitches.length > 0) {
          const latest: SalesPitch = data.pitches[0];
          setActivePitchId(latest.id);
          setPitchSubject(latest.subject || '');
          setPitchBody(latest.body || '');
          if (!emailSubject) setEmailSubject(latest.subject || '');
          if (!emailBody) setEmailBody(latest.body || '');
          if (latest.personalizationPoints) {
            setPersonalizationPoints(latest.personalizationPoints);
          }
        }
      }
    } catch (err) {
      console.error('[Load pitches error]', err);
    }
  };

  const loadActivities = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/activities`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.activities)) {
        setActivities(data.activities);
      }
    } catch (err) {
      console.error('[Load activities error]', err);
    }
  };

  const loadEmails = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(leadId)}/email`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.emails)) {
        setEmailHistory(data.emails);
      }
    } catch (err) {
      console.error('[Load emails error]', err);
    }
  };

  // Toggle Save Lead
  const handleToggleSave = async () => {
    if (isSaved && savedLeadId) {
      try {
        const res = await fetch(`/api/leads/${encodeURIComponent(savedLeadId)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setIsSaved(false);
          setSavedLeadId(null);
        }
      } catch (err) {
        console.error('[Unsave lead error]', err);
      }
    } else {
      try {
        const res = await fetch('/api/leads/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            business: {
              googlePlaceId: businessId,
              name: businessName,
              category,
              address,
              phone,
              website: website || undefined,
              hasWebsite: Boolean(website && website.length > 0),
            },
            status: 'NEW',
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setIsSaved(true);
          const newId = data.data?.id || businessId;
          setSavedLeadId(newId);
          loadActivities(newId);
        }
      } catch (err) {
        console.error('[Save lead error]', err);
      }
    }
  };

  // Status Change Handler
  const handleStatusChange = async (newStatus: LeadStatus) => {
    setStatus(newStatus);
    let currentId = savedLeadId;

    if (!isSaved) {
      try {
        const res = await fetch('/api/leads/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            business: {
              googlePlaceId: businessId,
              name: businessName,
              category,
              address,
              phone,
              website: website || undefined,
              hasWebsite: Boolean(website && website.length > 0),
            },
            status: newStatus,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsSaved(true);
          currentId = data.data?.id || businessId;
          setSavedLeadId(currentId);
          loadActivities(currentId!);
          return;
        }
      } catch (err) {
        console.error('[Auto save on status change]', err);
      }
    }

    if (currentId) {
      try {
        const res = await fetch(`/api/leads/${encodeURIComponent(currentId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          loadActivities(currentId);
        }
      } catch (err) {
        console.error('[Update status error]', err);
      }
    }
  };

  // Save Contact Info
  const handleSaveContact = async () => {
    setSavingContact(true);
    let targetId = savedLeadId;

    if (!isSaved) {
      try {
        const res = await fetch('/api/leads/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            business: {
              googlePlaceId: businessId,
              name: businessName,
              category,
              address,
              phone,
              website: website || undefined,
              hasWebsite: Boolean(website && website.length > 0),
            },
            status: 'NEW',
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsSaved(true);
          targetId = data.data?.id || businessId;
          setSavedLeadId(targetId);
        }
      } catch (err) {
        console.error('[Auto save before contact save]', err);
      }
    }

    if (targetId) {
      try {
        const res = await fetch(`/api/leads/${encodeURIComponent(targetId)}/contact`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactEmail: contactEmail.trim(),
            contactName: contactName.trim(),
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setEmailTo(contactEmail.trim());
          setIsEditingContact(false);
          loadActivities(targetId);
        }
      } catch (err) {
        console.error('[Save contact error]', err);
      } finally {
        setSavingContact(false);
      }
    }
  };

  // Send Live Outreach Email
  const handleSendEmail = async () => {
    if (!emailTo || !isValidEmail(emailTo)) {
      setOutreachMessage({ type: 'error', text: 'Please enter a valid recipient email address.' });
      return;
    }
    if (!emailSubject.trim() || !emailBody.trim()) {
      setOutreachMessage({ type: 'error', text: 'Please provide both email subject and body.' });
      return;
    }

    const confirmSend = window.confirm(
      `Ready to send this email to ${emailTo}?\n\nSubject: ${emailSubject}\n\nClick OK to confirm sending.`
    );
    if (!confirmSend) return;

    setIsSendingEmail(true);
    setOutreachMessage(null);

    let targetLeadId = savedLeadId;
    if (!isSaved) {
      try {
        const saveRes = await fetch('/api/leads/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            business: {
              googlePlaceId: businessId,
              name: businessName,
              category,
              address,
              phone,
              website: website || undefined,
              hasWebsite: Boolean(website && website.length > 0),
            },
            status: 'NEW',
          }),
        });
        const saveData = await saveRes.json();
        if (saveRes.ok && saveData.success) {
          setIsSaved(true);
          targetLeadId = saveData.data?.id || businessId;
          setSavedLeadId(targetLeadId);
        }
      } catch (err) {
        console.error('[Auto save before send]', err);
      }
    }

    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(targetLeadId || businessId)}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo.trim(),
          subject: emailSubject.trim(),
          body: emailBody.trim(),
          contactName: contactName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setOutreachMessage({
          type: 'error',
          text: data.error?.message || 'Failed to deliver email through provider.',
        });
      } else {
        setOutreachMessage({ type: 'success', text: `✓ Email successfully transmitted to ${emailTo}!` });
        setStatus('CONTACTED');
        if (targetLeadId) {
          loadEmails(targetLeadId);
          loadActivities(targetLeadId);
        }
      }
    } catch (err) {
      console.error('[Send email exception]', err);
      setOutreachMessage({ type: 'error', text: 'Network connection error while sending email.' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setOutreachMessage(null);

    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(savedLeadId || businessId)}/email/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testRecipient: testEmailAddress.trim() || undefined,
          subject: emailSubject.trim(),
          body: emailBody.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setOutreachMessage({
          type: 'error',
          text: data.error?.message || 'Failed to send test email.',
        });
      } else {
        setOutreachMessage({
          type: 'success',
          text: `✓ Test preview email sent to ${data.testRecipient}!`,
        });
        setShowTestModal(false);
      }
    } catch (err) {
      console.error('[Send test error]', err);
      setOutreachMessage({ type: 'error', text: 'Network error while sending test email.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Schedule Follow-up
  const handleScheduleFollowUp = async (daysFromNow: number | 'custom') => {
    let targetDate: string;
    if (daysFromNow === 'custom') {
      if (!customFollowUpDate) return;
      targetDate = new Date(customFollowUpDate).toISOString();
    } else {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      targetDate = d.toISOString();
    }

    setIsSchedulingFollowUp(true);
    let targetId = savedLeadId;

    if (!isSaved) {
      try {
        const saveRes = await fetch('/api/leads/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            business: {
              googlePlaceId: businessId,
              name: businessName,
              category,
              address,
              phone,
              website: website || undefined,
              hasWebsite: Boolean(website && website.length > 0),
            },
            status: 'NEW',
          }),
        });
        const saveData = await saveRes.json();
        if (saveRes.ok && saveData.success) {
          setIsSaved(true);
          targetId = saveData.data?.id || businessId;
          setSavedLeadId(targetId);
        }
      } catch (err) {
        console.error('[Auto save before followup]', err);
      }
    }

    if (targetId) {
      try {
        const res = await fetch(`/api/leads/${encodeURIComponent(targetId)}/follow-up`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            followUpAt: targetDate,
            note: `Follow-up on proposal`,
          }),
        });
        if (res.ok) {
          setFollowUpAt(targetDate);
          setFollowUpStatus('SCHEDULED');
          loadActivities(targetId);
        }
      } catch (err) {
        console.error('[Schedule followup error]', err);
      } finally {
        setIsSchedulingFollowUp(false);
      }
    }
  };

  // Cancel Follow-up
  const handleCancelFollowUp = async () => {
    if (!savedLeadId) return;
    try {
      await fetch(`/api/leads/${encodeURIComponent(savedLeadId)}/follow-up`, { method: 'DELETE' });
      setFollowUpAt(null);
      setFollowUpStatus('CANCELLED');
      loadActivities(savedLeadId);
    } catch (err) {
      console.error('[Cancel followup error]', err);
    }
  };

  // Draft Follow-up with AI
  const handleDraftFollowUp = async () => {
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(savedLeadId || businessId)}/follow-up/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          category,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.draft) {
        setEmailSubject(data.draft.subject);
        setEmailBody(data.draft.body);
        setOutreachMessage({ type: 'success', text: '✓ AI follow-up draft loaded into composer below.' });
      }
    } catch (err) {
      console.error('[Draft followup error]', err);
    }
  };

  // Add Note Handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSavingNote(true);
    let targetId = savedLeadId;

    if (!isSaved) {
      try {
        const res = await fetch('/api/leads/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            business: {
              googlePlaceId: businessId,
              name: businessName,
              category,
              address,
              phone,
              website: website || undefined,
              hasWebsite: Boolean(website && website.length > 0),
            },
            notes: newNote.trim(),
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsSaved(true);
          targetId = data.data?.id || businessId;
          setSavedLeadId(targetId);
          setNotes(newNote.trim());
          setNewNote('');
          loadActivities(targetId!);
        }
      } catch (err) {
        console.error('[Save lead on add note error]', err);
      } finally {
        setSavingNote(false);
      }
      return;
    }

    if (targetId) {
      try {
        const res = await fetch(`/api/leads/${encodeURIComponent(targetId)}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: newNote.trim() }),
        });
        if (res.ok) {
          setNotes((prev) => (prev ? `${prev}\n${newNote.trim()}` : newNote.trim()));
          setNewNote('');
          loadActivities(targetId);
        }
      } catch (err) {
        console.error('[Add note error]', err);
      } finally {
        setSavingNote(false);
      }
    }
  };

  // Generate AI Pitch Handler
  const handleGeneratePitch = async () => {
    setIsGeneratingPitch(true);
    setPitchMessage(null);

    let targetLeadId = savedLeadId;
    if (!isSaved) {
      try {
        const saveRes = await fetch('/api/leads/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            business: {
              googlePlaceId: businessId,
              name: businessName,
              category,
              address,
              phone,
              website: website || undefined,
              hasWebsite: Boolean(website && website.length > 0),
            },
            status: 'NEW',
          }),
        });
        const saveData = await saveRes.json();
        if (saveRes.ok && saveData.success) {
          setIsSaved(true);
          targetLeadId = saveData.data?.id || businessId;
          setSavedLeadId(targetLeadId);
        }
      } catch (err) {
        console.error('[Auto save before pitch error]', err);
      }
    }

    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(targetLeadId || businessId)}/pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pitchType: 'INITIAL_OUTREACH',
          business: {
            googlePlaceId: businessId,
            name: businessName,
            category,
            address,
            phone,
            website: website || undefined,
            hasWebsite: Boolean(website && website.length > 0),
          },
          leadScore: analysis,
          websiteAnalysis: analysis?.websiteAnalysis,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPitchMessage(data.error?.message || 'Failed to generate AI pitch.');
      } else {
        const savedPitch: SalesPitch = data.pitch;
        setActivePitchId(savedPitch.id);
        setPitchSubject(savedPitch.subject || '');
        setPitchBody(savedPitch.body || '');
        if (!emailSubject) setEmailSubject(savedPitch.subject || '');
        if (!emailBody) setEmailBody(savedPitch.body || '');

        if (savedPitch.personalizationPoints) {
          setPersonalizationPoints(savedPitch.personalizationPoints);
        } else if (analysis?.reasons) {
          setPersonalizationPoints(analysis.reasons.slice(0, 3));
        }

        if (targetLeadId) {
          loadPitches(targetLeadId);
          loadActivities(targetLeadId);
        }
      }
    } catch (err) {
      console.error('[Pitch generation error]', err);
      setPitchMessage('Network error occurred during AI pitch generation.');
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  // Save manual edits to active pitch
  const handleSavePitchEdits = async () => {
    if (!savedLeadId || !activePitchId) return;
    setIsSavingPitch(true);
    setPitchMessage(null);

    try {
      const res = await fetch(
        `/api/leads/${encodeURIComponent(savedLeadId)}/pitch/${encodeURIComponent(activePitchId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: pitchSubject,
            body: pitchBody,
          }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        setPitchMessage('✓ Pitch changes saved successfully.');
        loadPitches(savedLeadId);
        loadActivities(savedLeadId);
        setTimeout(() => setPitchMessage(null), 3000);
      } else {
        setPitchMessage(data.error?.message || 'Failed to save pitch changes.');
      }
    } catch (err) {
      console.error('[Save pitch edit error]', err);
      setPitchMessage('Network error while saving pitch.');
    } finally {
      setIsSavingPitch(false);
    }
  };

  const handleCopyPitch = () => {
    const fullContent = `Subject: ${pitchSubject}\n\n${pitchBody}`;
    navigator.clipboard.writeText(fullContent);
    setIsPitchCopied(true);
    setTimeout(() => setIsPitchCopied(false), 2500);
  };

  const opportunityBadge = analysis
    ? getOpportunityBadgeDetails(analysis.opportunityLevel)
    : null;

  const isFollowUpDue =
    followUpStatus === 'SCHEDULED' && followUpAt && new Date(followUpAt) <= new Date();

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <button
            onClick={() => router.back()}
            className="btn btn--secondary btn--sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Discovery</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleToggleSave}
              className={`btn btn--sm ${isSaved ? 'btn--primary' : 'btn--secondary'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
              <span>{isSaved ? 'Saved to CRM' : 'Save Lead'}</span>
            </button>

            {/* Status Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Status:</span>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                style={{
                  padding: '0.45rem 0.75rem',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  border: '2px solid #000',
                  boxShadow: '2px 2px 0px 0px #000',
                  background: LEAD_STATUS_CONFIG[status]?.color || '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {LEAD_STATUS_CONFIG[st].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Follow-up Reminder Banner */}
        {isFollowUpDue && (
          <div
            className="neo-card"
            style={{
              background: '#fef08a',
              border: '3px solid #000',
              boxShadow: '4px 4px 0px 0px #000',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Clock size={24} color="#854d0e" />
              <div>
                <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#713f12' }}>
                  Follow-up Reminder Due for {businessName}
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#854d0e', marginTop: '0.15rem' }}>
                  Scheduled for {new Date(followUpAt!).toLocaleDateString()}. Take the next step to convert this lead.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleDraftFollowUp}
                className="btn btn--primary btn--sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Sparkles size={14} />
                <span>Draft AI Follow-up</span>
              </button>
              <button
                onClick={handleCancelFollowUp}
                className="btn btn--secondary btn--sm"
              >
                Mark Done
              </button>
            </div>
          </div>
        )}

        {loadingAnalysis ? (
          <div
            className="neo-card neo-card--yellow"
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              border: '2px solid #000',
              boxShadow: '4px 4px 0px 0px #000',
            }}
          >
            <Zap size={36} className="animate-bounce" style={{ margin: '0 auto 1rem' }} />
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1.5rem',
                textTransform: 'uppercase',
              }}
            >
              Generating Lead Intelligence & Technical Audit...
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#333', marginTop: '0.5rem' }}>
              Analyzing {businessName} website signals, conversion funnels, and opportunity ranking.
            </p>
          </div>
        ) : analysisError ? (
          <div
            className="neo-card"
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              background: '#fee2e2',
              border: '2px solid #000',
              boxShadow: '4px 4px 0px 0px #000',
            }}
          >
            <h3 style={{ color: '#991b1b', fontWeight: 800, fontSize: '1.3rem' }}>Analysis Error</h3>
            <p style={{ color: '#7f1d1d', margin: '0.75rem 0 1.5rem' }}>{analysisError}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn--primary btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RotateCcw size={14} />
              <span>Retry Analysis</span>
            </button>
          </div>
        ) : analysis ? (
          <>
            {/* 1. Header Banner */}
            <div
              className="neo-card neo-card--yellow"
              style={{
                padding: '2rem',
                border: '3px solid #000',
                boxShadow: '6px 6px 0px 0px #000',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1.5rem',
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="neo-badge neo-badge--dark">
                    {category}
                  </span>
                  <span
                    className="neo-badge"
                    style={{
                      background: LEAD_STATUS_CONFIG[status]?.color || '#ffffff',
                      border: '2px solid #000',
                      fontWeight: 800,
                    }}
                  >
                    STATUS: {LEAD_STATUS_CONFIG[status]?.label}
                  </span>
                  {isSaved && (
                    <span className="neo-badge neo-badge--sage">
                      ✓ Saved in CRM
                    </span>
                  )}
                </div>

                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: '2rem',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.15,
                    marginBottom: '0.5rem',
                  }}
                >
                  {businessName}
                </h1>

                {/* Contact Person & Email quick badge */}
                <div style={{ margin: '0.5rem 0 0.85rem' }}>
                  {contactEmail ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1px solid #000', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}>
                      <Mail size={13} />
                      <strong>{contactEmail}</strong>
                      {contactName && <span style={{ color: '#666' }}>({contactName})</span>}
                      <button
                        onClick={() => setIsEditingContact(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.25rem' }}
                        title="Edit Contact"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingContact(true)}
                      className="btn btn--secondary btn--sm"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    >
                      + Add Contact Email
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    fontSize: '0.9rem',
                    color: '#222',
                  }}
                >
                  {address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} />
                      <span>{address}</span>
                    </div>
                  )}
                  {phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={15} />
                      <a href={`tel:${phone}`} style={{ textDecoration: 'underline', fontWeight: 700 }}>
                        {phone}
                      </a>
                    </div>
                  )}
                  {website ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Globe size={15} />
                      <a
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'underline', fontWeight: 700 }}
                      >
                        {website}
                      </a>
                    </div>
                  ) : (
                    <div style={{ color: '#b91c1c', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>🔥</span>
                      <span>No Website Registered</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Score Big Pill */}
              <div
                style={{
                  background: '#000000',
                  color: '#ffffff',
                  padding: '1.5rem 2rem',
                  borderRadius: '12px',
                  border: '2px solid #000',
                  boxShadow: '4px 4px 0px 0px #ffe17c',
                  textAlign: 'center',
                  minWidth: '200px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--yellow)',
                  }}
                >
                  LEAD OPPORTUNITY SCORE
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: '3.25rem',
                    lineHeight: 1,
                    margin: '0.35rem 0',
                    color: '#ffffff',
                  }}
                >
                  {analysis.score}
                  <span style={{ fontSize: '1.25rem', color: 'var(--sage)' }}>/100</span>
                </div>
                <div
                  className="neo-badge"
                  style={{
                    background: 'var(--yellow)',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                  }}
                >
                  {opportunityBadge?.emoji} {opportunityBadge?.label}
                </div>
              </div>
            </div>

            {/* Contact Edit Modal / Box */}
            {isEditingContact && (
              <div
                className="neo-card"
                style={{
                  padding: '1.5rem',
                  border: '2px solid #000',
                  boxShadow: '4px 4px 0px 0px #000',
                  background: '#ffffff',
                }}
              >
                <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                  Contact Information for {businessName}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                      Contact Email:
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. contact@business.com"
                      className="neo-input"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                      Contact Person (Optional):
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Dr. Sharma / General Manager"
                      className="neo-input"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleSaveContact} disabled={savingContact} className="btn btn--primary btn--sm">
                    {savingContact ? 'Saving...' : 'Save Contact'}
                  </button>
                  <button onClick={() => setIsEditingContact(false)} className="btn btn--secondary btn--sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* 2. EMAIL OUTREACH WORKSPACE (Phase 5) */}
            <div
              className="neo-card"
              style={{
                padding: '2rem',
                border: '3px solid #000',
                boxShadow: '6px 6px 0px 0px #000',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={22} color="#000" />
                    <h2
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Email Outreach & Review
                    </h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.25rem' }}>
                    Review and personalize cold outreach before transmitting. Every email requires explicit user approval.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleDraftFollowUp}
                    className="btn btn--secondary btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Clock size={14} />
                    <span>AI Follow-up Draft</span>
                  </button>
                  <button
                    onClick={() => setShowTestModal(true)}
                    className="btn btn--secondary btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Eye size={14} />
                    <span>Send Test</span>
                  </button>
                </div>
              </div>

              {outreachMessage && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    border: '2px solid #000',
                    marginBottom: '1rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    background: outreachMessage.type === 'success' ? 'var(--sage)' : '#fee2e2',
                    color: outreachMessage.type === 'success' ? '#000' : '#991b1b',
                  }}
                >
                  {outreachMessage.text}
                </div>
              )}

              {/* Two-Column Composer & Preview Layout */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {/* Editor Column */}
                <div
                  style={{
                    background: '#fcfcfc',
                    border: '2px solid #000',
                    borderRadius: '8px',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ marginBottom: '0.85rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      To (Recipient Email):
                    </label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="business@example.com"
                      className="neo-input"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ marginBottom: '0.85rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Subject:
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g. Quick idea for Sharma Dental Clinic"
                      className="neo-input"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      Message Body (Editable):
                    </label>
                    <textarea
                      rows={8}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Email body text..."
                      className="neo-input"
                      style={{ height: 'auto', minHeight: '180px', fontSize: '0.85rem', lineHeight: 1.5, resize: 'vertical' }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleSendEmail}
                      disabled={isSendingEmail || !emailTo}
                      className="btn btn--primary"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 800 }}
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Transmitting Email...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>SEND EMAIL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Live Client Preview Column */}
                <div
                  style={{
                    background: '#f4f4f5',
                    border: '2px solid #000',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#666', marginBottom: '0.75rem' }}>
                    Email Preview
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #000',
                      borderRadius: '6px',
                      padding: '1rem',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                      <div><strong>To:</strong> {emailTo || '<recipient email>'}</div>
                      <div><strong>Subject:</strong> {emailSubject || '<subject line>'}</div>
                    </div>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#171e19', flex: 1 }}>
                      {emailBody || 'Your email preview will appear here...'}
                    </div>
                  </div>

                  {/* Follow-up scheduler under preview */}
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        Schedule Follow-up Reminder:
                      </span>
                      {followUpAt && followUpStatus === 'SCHEDULED' && (
                        <button
                          onClick={handleCancelFollowUp}
                          style={{ background: 'none', border: 'none', color: '#991b1b', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Cancel Reminder
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleScheduleFollowUp(1)}
                        className="btn btn--secondary btn--sm"
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                      >
                        Tomorrow
                      </button>
                      <button
                        onClick={() => handleScheduleFollowUp(3)}
                        className="btn btn--secondary btn--sm"
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                      >
                        In 3 Days
                      </button>
                      <button
                        onClick={() => handleScheduleFollowUp(7)}
                        className="btn btn--secondary btn--sm"
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                      >
                        In 7 Days
                      </button>
                    </div>
                    {followUpAt && (
                      <div style={{ fontSize: '0.75rem', color: '#854d0e', marginTop: '0.35rem', fontWeight: 700 }}>
                        📅 Follow-up set for {new Date(followUpAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Outreach History */}
              {emailHistory.length > 0 && (
                <div style={{ marginTop: '1.75rem', borderTop: '2px solid #000', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    <History size={16} />
                    <span>Outreach History ({emailHistory.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {emailHistory.map((em) => (
                      <div
                        key={em.id}
                        style={{
                          padding: '0.75rem 1rem',
                          border: '1px solid #000',
                          borderRadius: '6px',
                          background: '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                            To: {em.toEmail} · &ldquo;{em.subject}&rdquo;
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.15rem' }}>
                            {new Date(em.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })} {em.providerMessageId ? `· ID: ${em.providerMessageId.slice(0, 12)}...` : ''}
                          </div>
                        </div>

                        <span
                          className="neo-badge"
                          style={{
                            background: EMAIL_STATUS_CONFIG[em.status]?.color || '#f4f4f5',
                            border: '1px solid #000',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                          }}
                        >
                          {EMAIL_STATUS_CONFIG[em.status]?.label || em.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Test Email Modal */}
            {showTestModal && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 999,
                  padding: '1rem',
                }}
              >
                <div
                  className="neo-card"
                  style={{
                    maxWidth: '450px',
                    width: '100%',
                    padding: '1.75rem',
                    background: '#fff',
                    border: '3px solid #000',
                    boxShadow: '6px 6px 0px 0px #000',
                  }}
                >
                  <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    Send Test Preview Email
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '1rem' }}>
                    Sends a safe test email preview to your own inbox without contacting {businessName}.
                  </p>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                      Your Test Email Address:
                    </label>
                    <input
                      type="email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="your-inbox@example.com"
                      className="neo-input"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowTestModal(false)}
                      className="btn btn--secondary btn--sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendTestEmail}
                      disabled={isSendingTest}
                      className="btn btn--primary btn--sm"
                    >
                      {isSendingTest ? 'Sending Test...' : 'Send Test Now'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. AI Sales Pitch Generator Section (Phase 4) */}
            <div
              className="neo-card"
              style={{
                padding: '2rem',
                border: '3px solid #000',
                boxShadow: '6px 6px 0px 0px #000',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={22} fill="var(--yellow)" />
                    <h2
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      AI Sales Pitch Generator
                    </h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.25rem' }}>
                    Generates concise, human cold outreach pitches grounded in real website signals.
                  </p>
                </div>

                <button
                  onClick={handleGeneratePitch}
                  disabled={isGeneratingPitch}
                  className="btn btn--primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
                >
                  {isGeneratingPitch ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>GENERATING PERSONALIZED PITCH...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>{pitchBody ? 'Regenerate Pitch' : 'Generate AI Pitch'}</span>
                    </>
                  )}
                </button>
              </div>

              {pitchMessage && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    border: '2px solid #000',
                    marginBottom: '1rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    background: pitchMessage.startsWith('✓') ? 'var(--sage)' : '#fee2e2',
                    color: pitchMessage.startsWith('✓') ? '#000' : '#991b1b',
                  }}
                >
                  {pitchMessage}
                </div>
              )}

              {/* Pitch Editor Workspace */}
              {pitchBody || isGeneratingPitch ? (
                <div
                  style={{
                    background: '#fcfcfc',
                    border: '2px solid #000',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    boxShadow: '4px 4px 0px 0px #000',
                  }}
                >
                  {/* Personalization Points */}
                  {personalizationPoints.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#555',
                          marginBottom: '0.4rem',
                        }}
                      >
                        Personalization Signals Detected:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {personalizationPoints.map((pt, idx) => (
                          <span
                            key={idx}
                            className="neo-badge neo-badge--sage"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            ✓ {pt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subject Line Input */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Subject Line:
                    </label>
                    <input
                      type="text"
                      value={pitchSubject}
                      onChange={(e) => setPitchSubject(e.target.value)}
                      placeholder="e.g. Quick idea for Sharma Dental Clinic"
                      className="neo-input"
                      style={{ fontSize: '0.95rem', fontWeight: 700 }}
                    />
                  </div>

                  {/* Body Textarea */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Message Body (Editable):
                    </label>
                    <textarea
                      rows={8}
                      value={pitchBody}
                      onChange={(e) => setPitchBody(e.target.value)}
                      placeholder="Your personalized pitch message..."
                      className="neo-input"
                      style={{ height: 'auto', minHeight: '160px', fontSize: '0.95rem', lineHeight: 1.6, resize: 'vertical' }}
                    />
                  </div>

                  {/* Pitch Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      onClick={handleCopyPitch}
                      className="btn btn--secondary btn--sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      {isPitchCopied ? <Check size={15} /> : <Copy size={15} />}
                      <span>{isPitchCopied ? 'Copied to Clipboard!' : 'Copy Pitch'}</span>
                    </button>

                    <button
                      onClick={handleSavePitchEdits}
                      disabled={isSavingPitch || !activePitchId}
                      className="btn btn--primary btn--sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Save size={15} />
                      <span>{isSavingPitch ? 'Saving...' : 'Save Pitch Changes'}</span>
                    </button>

                    <button
                      onClick={handleGeneratePitch}
                      disabled={isGeneratingPitch}
                      className="btn btn--secondary btn--sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <RotateCcw size={15} />
                      <span>Regenerate</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '2px dashed #000',
                    borderRadius: '8px',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                  }}
                >
                  <Sparkles size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.35rem' }}>
                    No Pitch Generated Yet
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#666', maxWidth: '450px', margin: '0 auto 1.25rem' }}>
                    Click &ldquo;Generate AI Pitch&rdquo; above to create a bespoke, human-sounding sales email citing specific website observations.
                  </p>
                  <button
                    onClick={handleGeneratePitch}
                    disabled={isGeneratingPitch}
                    className="btn btn--primary btn--sm"
                  >
                    Generate Initial Outreach Pitch
                  </button>
                </div>
              )}

              {/* Pitch History List */}
              {pitches.length > 0 && (
                <div style={{ marginTop: '1.75rem', borderTop: '2px solid #000', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    <History size={16} />
                    <span>Pitch History ({pitches.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {pitches.map((p) => {
                      const isCurrent = p.id === activePitchId;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setActivePitchId(p.id);
                            setPitchSubject(p.subject || '');
                            setPitchBody(p.body || '');
                            setEmailSubject(p.subject || '');
                            setEmailBody(p.body || '');
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            border: '1px solid #000',
                            borderRadius: '6px',
                            background: isCurrent ? 'var(--yellow)' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                              {p.subject || 'Cold Outreach Pitch'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.15rem' }}>
                              {new Date(p.createdAt || '').toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })} · {p.pitchType}
                            </div>
                          </div>
                          {isCurrent && (
                            <span className="neo-badge neo-badge--dark" style={{ fontSize: '0.65rem' }}>
                              Active
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Executive Summary & Why this lead */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {/* Executive Summary */}
              <div
                className="neo-card"
                style={{
                  padding: '1.75rem',
                  border: '2px solid #000',
                  boxShadow: '4px 4px 0px 0px #000',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.75rem',
                  }}
                >
                  <Sparkles size={16} /> AI Executive Summary
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#333', marginBottom: '1.25rem' }}>
                  {analysis.aiSummary || 'Business opportunity evaluated based on verified digital signals.'}
                </p>

                <div
                  style={{
                    borderTop: '2px dashed #ccc',
                    paddingTop: '1rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.6rem',
                    }}
                  >
                    Recommended Agency Services to Pitch:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {analysis.recommendedServices.map((service, idx) => (
                      <span
                        key={idx}
                        className="neo-badge neo-badge--sage"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        ✓ {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Explainable Reasons */}
              <div
                className="neo-card"
                style={{
                  padding: '1.75rem',
                  border: '2px solid #000',
                  boxShadow: '4px 4px 0px 0px #000',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.75rem',
                  }}
                >
                  <Zap size={16} /> Why This Business Is a Lead
                </div>

                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {analysis.reasons.map((reason, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        lineHeight: 1.4,
                      }}
                    >
                      <CheckCircle2 size={16} color="#000" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>

                {/* Score Breakdown Bar */}
                <div
                  style={{
                    marginTop: '1.5rem',
                    borderTop: '2px solid #000',
                    paddingTop: '1rem',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    SCORE COMPONENTS
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Business Strength Demand:</span>
                    <strong>{analysis.breakdown.businessStrengthScore} / 50 pts</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    <span>Website Opportunity Gap:</span>
                    <strong>{analysis.breakdown.websiteOpportunityScore} / 50 pts</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Notes & Activity Timeline */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {/* Notes Box */}
              <div
                className="neo-card"
                style={{
                  padding: '1.75rem',
                  border: '2px solid #000',
                  boxShadow: '4px 4px 0px 0px #000',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '1rem',
                  }}
                >
                  <FileText size={16} /> Sales Prospect Notes
                </div>

                <form onSubmit={handleAddNote} style={{ marginBottom: '1.25rem' }}>
                  <textarea
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g. Called owner on Tuesday. Asked to send portfolio examples."
                    className="neo-input"
                    style={{ height: 'auto', minHeight: '70px', fontSize: '0.85rem', marginBottom: '0.75rem' }}
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !newNote.trim()}
                    className="btn btn--secondary btn--sm"
                    style={{ fontWeight: 800 }}
                  >
                    {savingNote ? 'Adding...' : '+ Add Note'}
                  </button>
                </form>

                {notes && (
                  <div
                    style={{
                      background: '#f4f4f5',
                      border: '1px solid #000',
                      borderRadius: '6px',
                      padding: '1rem',
                      fontSize: '0.85rem',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                    }}
                  >
                    {notes}
                  </div>
                )}
              </div>

              {/* Activity Timeline */}
              <div
                className="neo-card"
                style={{
                  padding: '1.75rem',
                  border: '2px solid #000',
                  boxShadow: '4px 4px 0px 0px #000',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '1rem',
                  }}
                >
                  <Clock size={16} /> Activity Timeline
                </div>

                {activities.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          borderLeft: '2px solid #000',
                          paddingLeft: '0.85rem',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#000',
                            position: 'absolute',
                            left: '-5px',
                            top: '5px',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                            {act.activityType.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#444', marginTop: '0.15rem' }}>
                            {act.content}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.2rem' }}>
                            {new Date(act.createdAt || '').toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                    No outreach activities recorded yet. Save lead or send email to start tracking.
                  </div>
                )}
              </div>
            </div>

            {/* 6. Technical Website Audit Scorecard */}
            {analysis.websiteAnalysis && (
              <div
                className="neo-card"
                style={{
                  padding: '1.75rem',
                  border: '2px solid #000',
                  boxShadow: '4px 4px 0px 0px #000',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                        fontSize: '1.3rem',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Technical Website Audit Scorecard
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>
                      Objective signals parsed directly from homepage source code
                    </p>
                  </div>
                  <div
                    className="neo-badge neo-badge--dark"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    Quality Score: {analysis.websiteAnalysis.qualityScore} / 100
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {/* Performance */}
                  <div style={{ background: '#f4f4f5', border: '1px solid #000', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.8rem' }}>
                      <Gauge size={14} /> Performance
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.35rem 0' }}>
                      {analysis.websiteAnalysis.categoryScores.performance} / 20
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>
                      Load Time: {analysis.websiteAnalysis.loadTimeMs || 0}ms
                    </div>
                  </div>

                  {/* Mobile */}
                  <div style={{ background: '#f4f4f5', border: '1px solid #000', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.8rem' }}>
                      <Smartphone size={14} /> Mobile UX
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.35rem 0' }}>
                      {analysis.websiteAnalysis.categoryScores.mobileReadiness} / 20
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>
                      Viewport: {analysis.websiteAnalysis.signals.mobile.hasViewportMeta ? 'Configured' : 'Missing'}
                    </div>
                  </div>

                  {/* SEO */}
                  <div style={{ background: '#f4f4f5', border: '1px solid #000', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.8rem' }}>
                      <Search size={14} /> SEO Basics
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.35rem 0' }}>
                      {analysis.websiteAnalysis.categoryScores.seoBasics} / 15
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>
                      Title: {analysis.websiteAnalysis.signals.seo.hasTitle ? 'Yes' : 'No'} | H1: {analysis.websiteAnalysis.signals.seo.hasH1 ? 'Yes' : 'No'}
                    </div>
                  </div>

                  {/* Conversion */}
                  <div style={{ background: '#f4f4f5', border: '1px solid #000', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.8rem' }}>
                      <Zap size={14} /> Conversion Funnel
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.35rem 0' }}>
                      {analysis.websiteAnalysis.categoryScores.conversionReadiness} / 20
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>
                      CTA/Booking: {analysis.websiteAnalysis.signals.conversion.hasBookingOrAppointment || analysis.websiteAnalysis.signals.conversion.hasClearCta ? 'Yes' : 'No'}
                    </div>
                  </div>

                  {/* Security */}
                  <div style={{ background: '#f4f4f5', border: '1px solid #000', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.8rem' }}>
                      <ShieldCheck size={14} /> Security (SSL)
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.35rem 0' }}>
                      {analysis.websiteAnalysis.categoryScores.security} / 10
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>
                      HTTPS: {analysis.websiteAnalysis.signals.security.isHttps ? 'Valid SSL' : 'Insecure HTTP'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
