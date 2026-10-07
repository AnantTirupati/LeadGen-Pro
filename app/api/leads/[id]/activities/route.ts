import { NextRequest, NextResponse } from 'next/server';
import {
  getActivityTimelineFromDb,
  getSavedLeadsFromDb,
} from '@/lib/supabase/crm';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    // Find lead to resolve internal saved_lead_id if place ID was provided
    const leads = await getSavedLeadsFromDb({ userId: user?.id });
    const lead = leads.find((l) => l.id === decodedId || l.businessId === decodedId);
    const targetLeadId = lead?.id || decodedId;

    const activities = await getActivityTimelineFromDb(targetLeadId);

    return NextResponse.json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (err) {
    console.error('[GET /api/leads/[id]/activities Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve activities.' },
      },
      { status: 500 }
    );
  }
}
