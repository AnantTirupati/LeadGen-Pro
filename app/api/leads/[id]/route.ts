import { NextRequest, NextResponse } from 'next/server';
import {
  unsaveLeadInDb,
  updateLeadStatusInDb,
  updateLeadNotesInDb,
  getPitchHistoryFromDb,
  getActivityTimelineFromDb,
  getSavedLeadsFromDb,
} from '@/lib/supabase/crm';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { LeadStatus } from '@/lib/sales/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    const leads = await getSavedLeadsFromDb({ userId: user?.id });
    const lead = leads.find((l) => l.id === decodedId || l.businessId === decodedId);

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lead not found in saved list.' },
        },
        { status: 404 }
      );
    }

    const [pitches, activities] = await Promise.all([
      getPitchHistoryFromDb(lead.id),
      getActivityTimelineFromDb(lead.id),
    ]);

    return NextResponse.json({
      success: true,
      lead,
      pitches,
      activities,
    });
  } catch (err) {
    console.error('[GET /api/leads/[id] Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve lead details.' },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { status, notes } = body;

    // 1. Update Status if provided
    if (status) {
      const validStatuses: LeadStatus[] = [
        'NEW',
        'CONTACTED',
        'REPLIED',
        'INTERESTED',
        'PROPOSAL_SENT',
        'WON',
        'LOST',
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: `Status must be one of: ${validStatuses.join(', ')}`,
            },
          },
          { status: 400 }
        );
      }

      await updateLeadStatusInDb(decodedId, status, user?.id);
    }

    // 2. Update Notes if provided
    if (typeof notes === 'string') {
      await updateLeadNotesInDb(decodedId, notes, user?.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully.',
    });
  } catch (err) {
    console.error('[PATCH /api/leads/[id] Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update lead.' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    const success = await unsaveLeadInDb(decodedId, user?.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: { code: 'DELETE_FAILED', message: 'Unable to remove lead.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead removed from pipeline.',
    });
  } catch (err) {
    console.error('[DELETE /api/leads/[id] Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}
