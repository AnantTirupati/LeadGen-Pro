import { NextRequest, NextResponse } from 'next/server';
import { getSavedLeadsFromDb, saveLeadInDb } from '@/lib/supabase/crm';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Business } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const leads = await getSavedLeadsFromDb({
      userId: user?.id,
      status,
      sortBy,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (err) {
    console.error('[GET /api/leads Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve saved leads.',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    // If Supabase is configured, require authentication
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

    const { business, notes } = body;
    if (!business || (!business.googlePlaceId && !business.id)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Valid business object is required.' },
        },
        { status: 400 }
      );
    }

    const businessId = (business.googlePlaceId || business.id) as string;

    // Never trust client user_id — always derive from authenticated session
    const savedLead = await saveLeadInDb({
      businessId,
      business: business as Business,
      status: body.status || 'NEW',
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
      lead: savedLead,
    });
  } catch (err) {
    console.error('[POST /api/leads Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Internal server error while saving lead.' },
      },
      { status: 500 }
    );
  }
}
