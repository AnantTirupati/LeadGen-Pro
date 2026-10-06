import { NextResponse } from 'next/server';
import { getCrmStatsFromDb } from '@/lib/supabase/crm';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const stats = await getCrmStatsFromDb(user?.id);
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('[GET /api/leads/stats Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to retrieve lead CRM statistics.' },
      },
      { status: 500 }
    );
  }
}
