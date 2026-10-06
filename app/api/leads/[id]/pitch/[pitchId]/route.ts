import { NextRequest, NextResponse } from 'next/server';
import { updateSalesPitchInDb } from '@/lib/supabase/crm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pitchId: string }> }
) {
  try {
    const { id: savedLeadId, pitchId } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON payload.' } },
        { status: 400 }
      );
    }

    const { subject, body: pitchBody } = body;

    if (typeof subject !== 'string' || typeof pitchBody !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Subject and body must be strings.' },
        },
        { status: 400 }
      );
    }

    const updated = await updateSalesPitchInDb(savedLeadId, pitchId, {
      subject: subject.trim(),
      body: pitchBody.trim(),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update pitch.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Pitch updated successfully.',
    });
  } catch (err) {
    console.error('[PATCH /api/leads/[id]/pitch/[pitchId] Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
