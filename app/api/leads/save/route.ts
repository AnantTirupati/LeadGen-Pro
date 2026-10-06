import { NextRequest, NextResponse } from 'next/server';
import { saveLeadInDb } from '@/lib/supabase/crm';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Business } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (isSupabaseConfigured() && !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You must be signed in to save leads.' },
        },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_JSON', message: 'Malformed JSON payload.' },
        },
        { status: 400 }
      );
    }

    const { businessId: rawBizId, business, status, notes } = body;
    const resolvedBizId = (rawBizId || business?.googlePlaceId || business?.id) as string;

    if (!resolvedBizId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Valid business or businessId is required.' },
        },
        { status: 400 }
      );
    }

    // Always derive user_id server-side from authenticated session
    const savedLead = await saveLeadInDb({
      businessId: resolvedBizId,
      business: business as Business,
      status: status || 'NEW',
      notes,
      userId: user?.id || null,
    });

    if (!savedLead) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'SAVE_FAILED', message: 'Unable to save lead to database.' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: savedLead,
    });
  } catch (err) {
    console.error('[POST /api/leads/save Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Internal server error while saving lead.' },
      },
      { status: 500 }
    );
  }
}
