import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/email/provider';
import { isValidEmail } from '@/lib/email/templates';
import { recordLeadEmail, getLeadEmails, updateLeadContactInfo } from '@/lib/supabase/outreach';
import { getSavedLeadsFromDb } from '@/lib/supabase/crm';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// Simple in-memory rate limiting / debounce for duplicate send prevention
const recentSends = new Map<string, number>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const emails = await getLeadEmails(decodedId);

    return NextResponse.json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (err) {
    console.error('[GET /api/leads/[id]/email Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to retrieve email history.' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON payload.' } },
        { status: 400 }
      );
    }

    const { to, subject, body: emailBody, contactName } = body;

    // 1. Validate inputs
    if (!to || !isValidEmail(to)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_EMAIL', message: 'A valid recipient email address is required.' },
        },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email subject is required.' },
        },
        { status: 400 }
      );
    }

    if (!emailBody || typeof emailBody !== 'string' || emailBody.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email message body is required.' },
        },
        { status: 400 }
      );
    }

    // 2. Duplicate send prevention (rate-limit window: 5 seconds per lead/recipient)
    const rateKey = `${decodedId}_${to.trim().toLowerCase()}`;
    const lastSent = recentSends.get(rateKey);
    const now = Date.now();
    if (lastSent && now - lastSent < 5000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Email was just submitted. Please wait a few seconds before sending another message.',
          },
        },
        { status: 429 }
      );
    }
    recentSends.set(rateKey, now);

    // 3. Resolve lead from CRM (scoped to authenticated user)
    const leads = await getSavedLeadsFromDb({ userId: user?.id });
    const existingLead = leads.find((l) => l.id === decodedId || l.businessId === decodedId);
    const targetLeadId = existingLead?.id || decodedId;

    // Update contact email and name if provided
    await updateLeadContactInfo(targetLeadId, {
      contactEmail: to.trim(),
      contactName: contactName || existingLead?.contactName,
    });

    // 4. Send Email via Provider
    const provider = getEmailProvider();
    const sendResult = await provider.sendEmail({
      to: to.trim(),
      subject: subject.trim(),
      body: emailBody.trim(),
      leadId: targetLeadId,
    });

    // 5. Store email record & activity
    const emailRecord = await recordLeadEmail({
      savedLeadId: targetLeadId,
      toEmail: to.trim(),
      fromEmail: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      replyTo: process.env.EMAIL_REPLY_TO || user?.email || null,
      subject: subject.trim(),
      body: emailBody.trim(),
      status: sendResult.status,
      provider: sendResult.provider,
      providerMessageId: sendResult.messageId || null,
      errorMessage: sendResult.error || null,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SEND_FAILED',
            message: sendResult.error || 'Email could not be delivered by the email provider.',
          },
          email: emailRecord,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully.',
      email: emailRecord,
    });
  } catch (err) {
    console.error('[POST /api/leads/[id]/email Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error while sending email.' } },
      { status: 500 }
    );
  }
}
