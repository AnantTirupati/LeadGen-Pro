import { createServerSupabaseClient } from './server';
import {
  LeadEmailRecord,
  EmailEventRecord,
  EmailStatus,
  EmailEventType,
  FollowUpStatus,
} from '../email/types';
import { updateLeadStatusInDb } from './crm';

// In-Memory store for tests and local development
const memEmails = new Map<string, LeadEmailRecord[]>();
const memEvents = new Map<string, EmailEventRecord[]>();
const memLeadFollowUps = new Map<
  string,
  { followUpAt: string | null; followUpStatus: FollowUpStatus }
>();
const memLeadContact = new Map<
  string,
  { contactEmail?: string | null; contactName?: string | null }
>();

/**
 * Updates a saved lead's contact email and/or contact name
 */
export async function updateLeadContactInfo(
  savedLeadIdOrBizId: string,
  params: { contactEmail?: string | null; contactName?: string | null }
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      let query = supabase.from('saved_leads').update({
        ...params,
        updated_at: now,
      });

      if (savedLeadIdOrBizId.includes('-') && savedLeadIdOrBizId.length === 36) {
        query = query.eq('id', savedLeadIdOrBizId);
      } else {
        query = query.eq('business_id', savedLeadIdOrBizId);
      }

      const { error } = await query;
      if (!error) {
        memLeadContact.set(savedLeadIdOrBizId, params);
        return true;
      }
    } catch {
      // Fall through to memory
    }
  }

  memLeadContact.set(savedLeadIdOrBizId, params);
  return true;
}

/**
 * Records an email record for a lead, logs activity, and sets status to CONTACTED if NEW
 */
export async function recordLeadEmail(params: {
  savedLeadId: string;
  toEmail: string;
  fromEmail: string;
  replyTo?: string | null;
  subject: string;
  body: string;
  status?: EmailStatus;
  provider?: string | null;
  providerMessageId?: string | null;
  errorMessage?: string | null;
}): Promise<LeadEmailRecord> {
  const {
    savedLeadId,
    toEmail,
    fromEmail,
    replyTo,
    subject,
    body,
    status = 'SENT',
    provider = 'resend',
    providerMessageId,
    errorMessage,
  } = params;

  const now = new Date().toISOString();
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      const { data: record, error } = await supabase
        .from('lead_emails')
        .insert({
          saved_lead_id: savedLeadId,
          to_email: toEmail,
          from_email: fromEmail,
          reply_to: replyTo || null,
          subject,
          body,
          status,
          provider,
          provider_message_id: providerMessageId || null,
          error_message: errorMessage || null,
          sent_at: status === 'SENT' ? now : null,
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single();

      if (!error && record) {
        const rawRec = record as any;
        // Record Activity
        if (status === 'SENT') {
          await supabase.from('lead_activities').insert({
            saved_lead_id: savedLeadId,
            activity_type: 'EMAIL_SENT',
            content: `Email sent to ${toEmail}: "${subject}"`,
            created_at: now,
          });

          // Transition NEW to CONTACTED automatically
          await supabase
            .from('saved_leads')
            .update({ status: 'CONTACTED', updated_at: now })
            .eq('id', savedLeadId)
            .eq('status', 'NEW');
        }

        const emailRec: LeadEmailRecord = {
          id: rawRec.id,
          savedLeadId: rawRec.saved_lead_id,
          toEmail: rawRec.to_email,
          fromEmail: rawRec.from_email,
          replyTo: rawRec.reply_to,
          subject: rawRec.subject,
          body: rawRec.body,
          status: rawRec.status as EmailStatus,
          provider: rawRec.provider,
          providerMessageId: rawRec.provider_message_id,
          errorMessage: rawRec.error_message,
          sentAt: rawRec.sent_at,
          createdAt: rawRec.created_at,
          updatedAt: rawRec.updated_at,
        };

        const existing = memEmails.get(savedLeadId) || [];
        memEmails.set(savedLeadId, [emailRec, ...existing]);
        return emailRec;
      }
    } catch {
      // Fall through to memory
    }
  }

  // Memory Fallback
  const newEmailId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const emailRec: LeadEmailRecord = {
    id: newEmailId,
    savedLeadId,
    toEmail,
    fromEmail,
    replyTo: replyTo || null,
    subject,
    body,
    status,
    provider,
    providerMessageId: providerMessageId || null,
    errorMessage: errorMessage || null,
    sentAt: status === 'SENT' ? now : null,
    createdAt: now,
    updatedAt: now,
  };

  const existing = memEmails.get(savedLeadId) || [];
  memEmails.set(savedLeadId, [emailRec, ...existing]);

  if (status === 'SENT') {
    await updateLeadStatusInDb(savedLeadId, 'CONTACTED');
  }

  return emailRec;
}

/**
 * Retrieves email history for a saved lead
 */
export async function getLeadEmails(savedLeadId: string): Promise<LeadEmailRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      const { data: rows, error } = await supabase
        .from('lead_emails')
        .select('*')
        .eq('saved_lead_id', savedLeadId)
        .order('created_at', { ascending: false });

      if (!error && rows && (rows as any[]).length > 0) {
        return (rows as any[]).map((r: any) => ({
          id: r.id,
          savedLeadId: r.saved_lead_id,
          toEmail: r.to_email,
          fromEmail: r.from_email,
          replyTo: r.reply_to,
          subject: r.subject,
          body: r.body,
          status: r.status as EmailStatus,
          provider: r.provider,
          providerMessageId: r.provider_message_id,
          errorMessage: r.error_message,
          sentAt: r.sent_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch {
      // Fall through to memory
    }
  }

  return memEmails.get(savedLeadId) || [];
}

/**
 * Updates email status by provider message ID (e.g. from webhook event)
 */
export async function updateLeadEmailStatusByProviderId(
  providerMessageId: string,
  newStatus: EmailStatus,
  errorMessage?: string | null
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('lead_emails')
        .update({
          status: newStatus,
          error_message: errorMessage || null,
          updated_at: now,
        })
        .eq('provider_message_id', providerMessageId)
        .select('id, saved_lead_id, to_email')
        .single();

      if (!error && data) {
        const rawData = data as any;
        // Record appropriate activity on bounce or failure
        if (newStatus === 'BOUNCED' || newStatus === 'FAILED') {
          await supabase.from('lead_activities').insert({
            saved_lead_id: rawData.saved_lead_id,
            activity_type: 'EMAIL_SENT',
            content: `Email to ${rawData.to_email} ${newStatus.toLowerCase()}: ${errorMessage || 'Delivery issue'}`,
            created_at: now,
          });
        }
        return true;
      }
    } catch {
      // Fall through to memory
    }
  }

  // Memory update
  for (const [, list] of memEmails.entries()) {
    const target = list.find((e) => e.providerMessageId === providerMessageId);
    if (target) {
      target.status = newStatus;
      if (errorMessage) target.errorMessage = errorMessage;
      target.updatedAt = now;
      return true;
    }
  }

  return false;
}

/**
 * Records an email delivery event from webhook
 */
export async function recordEmailEvent(
  leadEmailId: string,
  eventType: EmailEventType,
  providerEventId?: string | null,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      // Check duplicate event ID to avoid duplicate webhook processing
      if (providerEventId) {
        const { data: existing } = await supabase
          .from('email_events')
          .select('id')
          .eq('provider_event_id', providerEventId)
          .single();

        if (existing) {
          return true; // Already processed
        }
      }

      const { error } = await supabase.from('email_events').insert({
        lead_email_id: leadEmailId,
        event_type: eventType,
        provider_event_id: providerEventId || null,
        metadata: metadata || {},
        created_at: now,
      });

      return !error;
    } catch {
      // Fall through to memory
    }
  }

  // Memory store event
  const newEvt: EmailEventRecord = {
    id: `evt_${Date.now()}`,
    leadEmailId,
    eventType,
    providerEventId: providerEventId || null,
    metadata,
    createdAt: now,
  };

  const existing = memEvents.get(leadEmailId) || [];
  memEvents.set(leadEmailId, [newEvt, ...existing]);
  return true;
}

/**
 * Schedules a follow-up reminder date for a lead
 */
export async function scheduleLeadFollowUp(
  savedLeadIdOrBizId: string,
  followUpAt: string,
  note?: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      let query = supabase.from('saved_leads').update({
        follow_up_at: followUpAt,
        follow_up_status: 'SCHEDULED',
        updated_at: now,
      });

      if (savedLeadIdOrBizId.includes('-') && savedLeadIdOrBizId.length === 36) {
        query = query.eq('id', savedLeadIdOrBizId);
      } else {
        query = query.eq('business_id', savedLeadIdOrBizId);
      }

      const { error } = await query;
      if (!error) {
        if (note) {
          await supabase.from('lead_activities').insert({
            saved_lead_id: savedLeadIdOrBizId,
            activity_type: 'NOTE',
            content: `Scheduled follow-up reminder for ${new Date(followUpAt).toLocaleDateString()}: ${note}`,
            created_at: now,
          });
        }
        memLeadFollowUps.set(savedLeadIdOrBizId, {
          followUpAt,
          followUpStatus: 'SCHEDULED',
        });
        return true;
      }
    } catch {
      // Fall through to memory
    }
  }

  memLeadFollowUps.set(savedLeadIdOrBizId, {
    followUpAt,
    followUpStatus: 'SCHEDULED',
  });
  return true;
}

/**
 * Cancels or completes a scheduled follow-up
 */
export async function cancelLeadFollowUp(
  savedLeadIdOrBizId: string,
  status: 'COMPLETED' | 'CANCELLED' = 'CANCELLED'
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      let query = supabase.from('saved_leads').update({
        follow_up_at: null,
        follow_up_status: status,
        updated_at: now,
      });

      if (savedLeadIdOrBizId.includes('-') && savedLeadIdOrBizId.length === 36) {
        query = query.eq('id', savedLeadIdOrBizId);
      } else {
        query = query.eq('business_id', savedLeadIdOrBizId);
      }

      const { error } = await query;
      if (!error) {
        memLeadFollowUps.set(savedLeadIdOrBizId, {
          followUpAt: null,
          followUpStatus: status,
        });
        return true;
      }
    } catch {
      // Fall through to memory
    }
  }

  memLeadFollowUps.set(savedLeadIdOrBizId, {
    followUpAt: null,
    followUpStatus: status,
  });
  return true;
}
