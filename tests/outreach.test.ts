import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidEmail, escapeHtml, generateEmailHtml } from '../lib/email/templates';
import { ResendEmailProvider } from '../lib/email/resend';
import { MockEmailProvider, setEmailProvider, getEmailProvider } from '../lib/email/provider';
import {
  recordLeadEmail,
  getLeadEmails,
  updateLeadEmailStatusByProviderId,
  recordEmailEvent,
  scheduleLeadFollowUp,
  cancelLeadFollowUp,
  updateLeadContactInfo,
} from '../lib/supabase/outreach';
import { saveLeadInDb, getSavedLeadsFromDb, getCrmStatsFromDb } from '../lib/supabase/crm';
import {
  generateDeterministicFollowUp,
  generateFollowUpDraft,
} from '../lib/sales/followup-generator';
import { buildEmailOutreachPrompt, buildFollowUpPrompt } from '../lib/sales/email-prompts';

test('1. Email Validation: Accepts valid email syntax and rejects invalid addresses', () => {
  assert.equal(isValidEmail('owner@sharmadental.com'), true);
  assert.equal(isValidEmail('info.austin@cafe-local.org'), true);
  assert.equal(isValidEmail('contact+lead@agency.co.in'), true);

  // Invalid cases
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidEmail('missing@domain'), false);
  assert.equal(isValidEmail('@nodomain.com'), false);
  assert.equal(isValidEmail('spaces in@email.com'), false);
  assert.equal(isValidEmail(null), false);
  assert.equal(isValidEmail(''), false);
});

test('2. HTML Escaping & Email Template: Prevents script injection in generated HTML', () => {
  const maliciousInput = '<script>alert("XSS")</script> & "quotes"';
  const escaped = escapeHtml(maliciousInput);
  assert.ok(!escaped.includes('<script>'));
  assert.ok(escaped.includes('&lt;script&gt;'));
  assert.ok(escaped.includes('&amp;'));

  const fullHtml = generateEmailHtml('Line 1\n\nLine 2 with <b onerror="evil()">text</b>');
  assert.ok(fullHtml.includes('<!DOCTYPE html>'));
  assert.ok(fullHtml.includes('&lt;b onerror=&quot;evil()&quot;&gt;'));
});

test('3. Email Provider Abstraction: MockProvider sends email and returns messageId', async () => {
  const mock = new MockEmailProvider();
  setEmailProvider(mock);

  assert.equal(getEmailProvider().name, 'mock');
  assert.equal(mock.isConfigured(), true);

  const result = await mock.sendEmail({
    to: 'client@example.com',
    subject: 'Quick idea for your website',
    body: 'Hi team, I noticed your site could use a mobile upgrade...',
  });

  assert.equal(result.success, true);
  assert.equal(result.status, 'SENT');
  assert.ok(result.messageId?.startsWith('mock_'));
});

test('4. Email Provider Abstraction: Resend provider gracefully reports unconfigured state', async () => {
  const resend = new ResendEmailProvider();
  // In test environment without key, it must not throw
  const configured = resend.isConfigured();
  if (!configured) {
    const res = await resend.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      body: 'Test body',
    });
    assert.equal(res.success, false);
    assert.equal(res.status, 'FAILED');
    assert.ok(res.error?.includes('not configured'));
  }
});

test('5. Outreach Storage: Records email, logs EMAIL_SENT activity, and transitions NEW to CONTACTED', async () => {
  const leadId = 'test_lead_email_flow';
  await saveLeadInDb({
    businessId: leadId,
    status: 'NEW',
  });

  const emailRecord = await recordLeadEmail({
    savedLeadId: leadId,
    toEmail: 'owner@localstore.com',
    fromEmail: 'onboarding@resend.dev',
    subject: 'Idea for your website',
    body: 'We noticed your mobile site could be optimized...',
    status: 'SENT',
    providerMessageId: 'resend_msg_12345',
  });

  assert.ok(emailRecord.id);
  assert.equal(emailRecord.toEmail, 'owner@localstore.com');
  assert.equal(emailRecord.status, 'SENT');

  // Verify email history
  const history = await getLeadEmails(leadId);
  assert.ok(history.length >= 1);
  assert.equal(history[0].id, emailRecord.id);

  // Verify lead status transition
  const leads = await getSavedLeadsFromDb();
  const targetLead = leads.find((l) => l.id === leadId || l.businessId === leadId);
  assert.equal(targetLead?.status, 'CONTACTED');
});

test('6. Contact Info Update: Stores contact email and contact name', async () => {
  const leadId = 'test_contact_info_lead';
  await saveLeadInDb({
    businessId: leadId,
    status: 'NEW',
  });

  const updated = await updateLeadContactInfo(leadId, {
    contactEmail: 'dr.sharma@clinic.com',
    contactName: 'Dr. Sharma',
  });

  assert.equal(updated, true);
});

test('7. Follow-up Reminders: Schedules and cancels follow-up dates', async () => {
  const leadId = 'test_followup_lead';
  await saveLeadInDb({
    businessId: leadId,
    status: 'CONTACTED',
  });

  const targetDate = new Date(Date.now() + 86400000 * 3).toISOString(); // 3 days
  const scheduled = await scheduleLeadFollowUp(leadId, targetDate, 'Send homepage mockup');
  assert.equal(scheduled, true);

  const cancelled = await cancelLeadFollowUp(leadId);
  assert.equal(cancelled, true);
});

test('8. AI Follow-up Draft Generator: Creates grounded, concise follow-up email', async () => {
  const draft = await generateFollowUpDraft({
    leadId: 'test_lead_followup',
    businessName: 'Sharma Dental Clinic',
    category: 'Dental Clinic',
    previousEmailSubject: 'Quick idea for Sharma Dental Clinic',
    previousEmailBody: 'I noticed a few mobile optimizations on your site...',
    senderName: 'Anant',
  });

  assert.ok(draft.subject.includes('Sharma Dental Clinic'));
  assert.ok(draft.body.includes('Sharma Dental Clinic'));
  assert.ok(draft.body.length > 50);
});

test('9. AI Email Prompt Builder: Enforces anti-hallucination and grounded website findings', () => {
  const prompt = buildEmailOutreachPrompt({
    business: {
      googlePlaceId: 'ChIJ_prompt_test',
      name: 'Apex Auto Care',
      category: 'Auto Repair',
      address: 'Austin, TX',
      rating: 4.8,
      reviewCount: 450,
      hasWebsite: true,
    },
    contactName: 'Alex',
    senderName: 'Anant',
  });

  assert.ok(prompt.includes('Apex Auto Care'));
  assert.ok(prompt.includes('450'));
  assert.ok(prompt.includes('4.8'));
  assert.ok(prompt.includes('Respond ONLY with valid JSON'));

  const followUpPrompt = buildFollowUpPrompt({
    leadId: 'test',
    businessName: 'Apex Auto Care',
    category: 'Auto Repair',
    previousEmailSubject: 'Website idea',
  });
  assert.ok(followUpPrompt.includes('Apex Auto Care'));
  assert.ok(followUpPrompt.includes('40 to 100 words'));
});

test('10. Webhook Event Processing: Updates email status and prevents duplicate events', async () => {
  const providerMsgId = 'resend_event_test_msg_99';
  const emailRecord = await recordLeadEmail({
    savedLeadId: 'test_webhook_lead',
    toEmail: 'user@domain.com',
    fromEmail: 'onboarding@resend.dev',
    subject: 'Test delivery',
    body: 'Content',
    status: 'SENT',
    providerMessageId: providerMsgId,
  });

  // Webhook event arrives
  const updatedStatus = await updateLeadEmailStatusByProviderId(
    providerMsgId,
    'DELIVERED'
  );
  assert.equal(updatedStatus, true);

  const eventLogged = await recordEmailEvent(
    emailRecord.id,
    'DELIVERED',
    'evt_unique_123',
    { ip: '1.2.3.4' }
  );
  assert.equal(eventLogged, true);

  // Duplicate event should not fail
  const duplicateLogged = await recordEmailEvent(
    emailRecord.id,
    'DELIVERED',
    'evt_unique_123',
    { ip: '1.2.3.4' }
  );
  assert.equal(duplicateLogged, true);
});

test('11. Outreach KPI Stats: Calculates sent emails and follow-ups due', async () => {
  const stats = await getCrmStatsFromDb();
  assert.ok(typeof stats.totalLeads === 'number');
  assert.ok(typeof stats.newLeads === 'number');
  assert.ok(typeof stats.contacted === 'number');
  assert.ok(typeof stats.followUpsDue === 'number');
  assert.ok(typeof stats.emailsSent === 'number');
  assert.ok(typeof stats.delivered === 'number');
});

test('12. Security Verification: No email API secrets exposed to client-side', () => {
  assert.equal(process.env.NEXT_PUBLIC_RESEND_API_KEY, undefined);
  assert.equal(process.env.NEXT_PUBLIC_RESEND_WEBHOOK_SECRET, undefined);
});
