/**
 * Phase 4 — AI Sales Assistant & Lead CRM Types
 */

import { Business } from '@/types';
import { LeadScoreResult } from '../leads/types';
import { WebsiteAnalysisResult } from '../website/types';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'REPLIED'
  | 'INTERESTED'
  | 'PROPOSAL_SENT'
  | 'WON'
  | 'LOST';

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; badgeVariant: string }
> = {
  NEW: { label: 'New', color: '#ffffff', badgeVariant: 'white' },
  CONTACTED: { label: 'Contacted', color: '#b7c6c2', badgeVariant: 'sage' },
  REPLIED: { label: 'Replied', color: '#93c5fd', badgeVariant: 'blue' },
  INTERESTED: { label: 'Interested', color: '#ffe17c', badgeVariant: 'yellow' },
  PROPOSAL_SENT: { label: 'Proposal Sent', color: '#fed7aa', badgeVariant: 'orange' },
  WON: { label: 'Won', color: '#86efac', badgeVariant: 'green' },
  LOST: { label: 'Lost', color: '#fca5a5', badgeVariant: 'red' },
};

export type LeadActivityType =
  | 'NOTE'
  | 'EMAIL_SENT'
  | 'MESSAGE_SENT'
  | 'CALL'
  | 'STATUS_CHANGED'
  | 'PITCH_GENERATED';

export interface SavedLead {
  id: string;
  userId?: string | null;
  businessId: string;
  status: LeadStatus;
  notes?: string | null;
  contactEmail?: string | null;
  contactName?: string | null;
  followUpAt?: string | null;
  followUpStatus?: 'NONE' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  lastContactAt?: string | null;
  lastEmailStatus?: string | null;
  business?: Business;
  leadScore?: LeadScoreResult;
  websiteAnalysis?: WebsiteAnalysisResult;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPitch {
  id: string;
  savedLeadId: string;
  pitchType: 'INITIAL_OUTREACH' | 'FOLLOW_UP' | 'AUDIT_PROPOSAL';
  subject: string;
  body: string;
  personalizationPoints?: string[];
  aiModel?: string;
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  savedLeadId: string;
  activityType: LeadActivityType;
  content: string;
  createdAt: string;
}

export interface PitchGenerationInput {
  business: Business;
  leadScore?: LeadScoreResult;
  websiteAnalysis?: WebsiteAnalysisResult;
  senderName?: string;
}

export interface PitchGenerationOutput {
  subject: string;
  body: string;
  personalizationPoints: string[];
}

export interface LeadCrmStats {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  replied: number;
  interested: number;
  proposalSent: number;
  won: number;
  lost: number;
  followUpsDue: number;
  emailsSent: number;
  delivered: number;
  bounced: number;
  conversionRate: number | string;
}
