import { NextRequest, NextResponse } from 'next/server';
import {
  updateLeadEmailStatusByProviderId,
  recordEmailEvent,
} from '@/lib/supabase/outreach';
import { EmailStatus, EmailEventType } from '@/lib/email/types';

export async function POST(request: NextRequest) {
  try {
    // 1. Signature / Secret verification
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
    const authHeader = request.headers.get('authorization') || request.headers.get('svix-signature');

    if (webhookSecret && webhookSecret !== 'your-webhook-secret-here') {
      const isAuthorized =
        authHeader?.includes(webhookSecret) ||
        request.headers.get('x-webhook-secret') === webhookSecret;

      if (!isAuthorized && !request.headers.get('svix-signature')) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature or secret.' } },
          { status: 401 }
        );
      }
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Malformed JSON payload.' } },
        { status: 400 }
      );
    }

    const { type, data } = payload;
    const providerMessageId = data?.email_id || data?.id;

    if (!providerMessageId) {
      return NextResponse.json(
        { success: true, message: 'Event ignored: No email message ID found.' },
        { status: 200 }
      );
    }

    let emailStatus: EmailStatus = 'SENT';
    let eventType: EmailEventType = 'SENT';
    let errorMessage: string | null = null;

    if (type === 'email.delivered') {
      emailStatus = 'DELIVERED';
      eventType = 'DELIVERED';
    } else if (type === 'email.bounced') {
      emailStatus = 'BOUNCED';
      eventType = 'BOUNCED';
      errorMessage = data?.bounce_reason || 'Mailbox address bounced or rejected.';
    } else if (type === 'email.failed' || type === 'email.delivery_delayed') {
      emailStatus = 'FAILED';
      eventType = 'FAILED';
      errorMessage = data?.error || 'Email delivery failed.';
    } else if (type === 'email.complained') {
      eventType = 'COMPLAINED';
    } else {
      return NextResponse.json({ success: true, message: 'Event received and ignored.' });
    }

    // Update status in DB / memory
    await updateLeadEmailStatusByProviderId(providerMessageId, emailStatus, errorMessage);

    // Record Event
    const eventId = data?.id || `evt_${Date.now()}`;
    await recordEmailEvent(providerMessageId, eventType, eventId, data);

    return NextResponse.json({
      success: true,
      message: `Processed ${type} event for email ${providerMessageId}`,
    });
  } catch (err) {
    console.error('[POST /api/webhooks/email Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Webhook handler error.' } },
      { status: 500 }
    );
  }
}
