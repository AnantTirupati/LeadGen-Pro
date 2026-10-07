import { NextRequest, NextResponse } from 'next/server';
import { getAllOutreachEmails } from '@/lib/supabase/outreach';
import { getCrmStatsFromDb } from '@/lib/supabase/crm';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    const [emails, crmStats] = await Promise.all([
      getAllOutreachEmails(user?.id),
      getCrmStatsFromDb(user?.id),
    ]);

    const totalSent = emails.length;
    const delivered = emails.filter((e) => e.status === 'DELIVERED' || e.status === 'SENT').length;
    const bounced = emails.filter((e) => e.status === 'BOUNCED').length;
    const failed = emails.filter((e) => e.status === 'FAILED').length;
    const deliveryRate = totalSent > 0 ? `${Math.round((delivered / totalSent) * 100)}%` : '100%';

    return NextResponse.json({
      success: true,
      stats: {
        totalEmailsSent: totalSent,
        delivered,
        bounced,
        failed,
        deliveryRate,
        followUpsDue: crmStats.followUpsDue,
        contactedLeads: crmStats.contacted,
        repliedLeads: crmStats.replied,
        interestedLeads: crmStats.interested,
        wonLeads: crmStats.won,
        conversionRate: crmStats.conversionRate,
      },
      emails,
    });
  } catch (err) {
    console.error('[GET /api/campaigns Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to retrieve campaign data.',
        },
      },
      { status: 500 }
    );
  }
}
