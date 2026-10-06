import { NextRequest, NextResponse } from 'next/server';
import { getEmailProvider } from '@/lib/email/provider';
import { isValidEmail } from '@/lib/email/templates';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { testRecipient, subject, body: emailBody } = body;
    const resolvedTestEmail =
      testRecipient?.trim() ||
      process.env.EMAIL_TEST_RECIPIENT?.trim() ||
      process.env.EMAIL_REPLY_TO?.trim();

    if (!resolvedTestEmail || !isValidEmail(resolvedTestEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEST_EMAIL_REQUIRED',
            message: 'Please specify a valid test recipient email address in the field or set EMAIL_TEST_RECIPIENT in .env.local.',
          },
        },
        { status: 400 }
      );
    }

    const provider = getEmailProvider();
    const result = await provider.sendEmail({
      to: resolvedTestEmail,
      subject: `[TEST PREVIEW] ${subject || 'Outreach Preview'}`,
      body: `*** THIS IS A TEST EMAIL (NOT SENT TO CLIENT) ***\n\n${emailBody || ''}`,
      leadId: decodedId,
      isTest: true,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEST_SEND_FAILED',
            message: result.error || 'Failed to send test email.',
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${resolvedTestEmail}`,
      testRecipient: resolvedTestEmail,
    });
  } catch (err) {
    console.error('[POST /api/leads/[id]/email/test Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error while sending test email.' } },
      { status: 500 }
    );
  }
}
