/**
 * Phase 5 — Email Outreach & Follow-up Types
 */

export type EmailStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'BOUNCED'
  | 'FAILED';

export type EmailEventType =
  | 'SENT'
  | 'DELIVERED'
  | 'BOUNCED'
  | 'FAILED'
  | 'COMPLAINED';

export type FollowUpStatus =
  | 'NONE'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
  html?: string;
  leadId?: string;
  isTest?: boolean;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  status: EmailStatus;
  error?: string;
  provider: string;
}

export interface EmailProvider {
  name: string;
  isConfigured(): boolean;
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
  getEmailStatus?(messageId: string): Promise<EmailStatus | null>;
}

export interface LeadEmailRecord {
  id: string;
  savedLeadId: string;
  toEmail: string;
  fromEmail: string;
  replyTo?: string | null;
  subject: string;
  body: string;
  status: EmailStatus;
  provider?: string | null;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailEventRecord {
  id: string;
  leadEmailId: string;
  eventType: EmailEventType;
  providerEventId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface FollowUpScheduleInput {
  leadId: string;
  followUpAt: string; // ISO date string
  note?: string;
}

export interface FollowUpDraftInput {
  leadId: string;
  businessName: string;
  category: string;
  address?: string;
  previousEmailSubject?: string;
  previousEmailBody?: string;
  senderName?: string;
}

export interface FollowUpDraftOutput {
  subject: string;
  body: string;
}

export const EMAIL_STATUS_CONFIG: Record<
  EmailStatus,
  { label: string; color: string; badgeVariant: string }
> = {
  DRAFT: { label: 'Draft', color: '#e4e4e7', badgeVariant: 'white' },
  QUEUED: { label: 'Queued', color: '#fed7aa', badgeVariant: 'orange' },
  SENDING: { label: 'Sending...', color: '#fed7aa', badgeVariant: 'orange' },
  SENT: { label: 'Sent', color: '#93c5fd', badgeVariant: 'blue' },
  DELIVERED: { label: 'Delivered', color: '#86efac', badgeVariant: 'green' },
  BOUNCED: { label: 'Bounced', color: '#fca5a5', badgeVariant: 'red' },
  FAILED: { label: 'Failed', color: '#fee2e2', badgeVariant: 'red' },
};
