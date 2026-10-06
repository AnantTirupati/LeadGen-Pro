import { NextRequest, NextResponse } from 'next/server';
import { updateLeadContactInfo } from '@/lib/supabase/outreach';
import { isValidEmail } from '@/lib/email/templates';

export async function PATCH(
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

    const { contactEmail, contactName } = body;

    if (contactEmail && !isValidEmail(contactEmail)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_EMAIL', message: 'Please provide a valid email address.' } },
        { status: 400 }
      );
    }

    const success = await updateLeadContactInfo(decodedId, {
      contactEmail: contactEmail ? contactEmail.trim() : null,
      contactName: contactName ? contactName.trim() : null,
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update contact info.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact details updated successfully.',
    });
  } catch (err) {
    console.error('[PATCH /api/leads/[id]/contact Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
