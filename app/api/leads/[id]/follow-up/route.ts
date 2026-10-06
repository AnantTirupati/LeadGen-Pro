import { NextRequest, NextResponse } from 'next/server';
import { scheduleLeadFollowUp, cancelLeadFollowUp } from '@/lib/supabase/outreach';

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

    const { followUpAt, note } = body;

    if (!followUpAt) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Follow-up date/time is required.' },
        },
        { status: 400 }
      );
    }

    const success = await scheduleLeadFollowUp(decodedId, followUpAt, note);

    if (!success) {
      return NextResponse.json(
        { success: false, error: { code: 'SCHEDULE_FAILED', message: 'Failed to schedule follow-up.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Follow-up scheduled successfully.',
      followUpAt,
    });
  } catch (err) {
    console.error('[POST /api/leads/[id]/follow-up Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    const success = await cancelLeadFollowUp(decodedId);

    return NextResponse.json({
      success: true,
      message: 'Follow-up cancelled.',
    });
  } catch (err) {
    console.error('[DELETE /api/leads/[id]/follow-up Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
