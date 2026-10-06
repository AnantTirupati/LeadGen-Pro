import { NextRequest, NextResponse } from 'next/server';
import { generateFollowUpDraft } from '@/lib/sales/followup-generator';
import { getLeadEmails } from '@/lib/supabase/outreach';
import { getSavedLeadsFromDb } from '@/lib/supabase/crm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Optional body
    }

    const {
      businessName: requestBizName,
      category: requestCategory,
      senderName,
    } = body as { businessName?: string; category?: string; senderName?: string };

    const leads = await getSavedLeadsFromDb();
    const existingLead = leads.find((l) => l.id === decodedId || l.businessId === decodedId);
    const targetLeadId = existingLead?.id || decodedId;

    const emails = await getLeadEmails(targetLeadId);
    const latestSentEmail = emails.find((e) => e.status === 'SENT' || e.status === 'DELIVERED');

    const businessName =
      requestBizName ||
      existingLead?.business?.name ||
      existingLead?.leadScore?.businessName ||
      'Business Owner';

    const category =
      requestCategory ||
      existingLead?.business?.category ||
      'Local Business';

    const draft = await generateFollowUpDraft({
      leadId: targetLeadId,
      businessName,
      category,
      address: existingLead?.business?.address,
      previousEmailSubject: latestSentEmail?.subject,
      previousEmailBody: latestSentEmail?.body,
      senderName: senderName || 'Anant',
    });

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (err) {
    console.error('[POST /api/leads/[id]/follow-up/draft Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'DRAFT_FAILED', message: 'Failed to generate follow-up draft.' } },
      { status: 500 }
    );
  }
}
