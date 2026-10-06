import { NextRequest, NextResponse } from 'next/server';
import { generateSalesPitch } from '@/lib/sales/pitch-generator';
import {
  saveSalesPitchInDb,
  getPitchHistoryFromDb,
  getSavedLeadsFromDb,
} from '@/lib/supabase/crm';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { Business } from '@/types';
import { LeadScoreResult } from '@/lib/leads/types';
import { WebsiteAnalysisResult } from '@/lib/website/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const pitches = await getPitchHistoryFromDb(decodedId);

    return NextResponse.json({
      success: true,
      count: pitches.length,
      pitches,
    });
  } catch (err) {
    console.error('[GET /api/leads/[id]/pitch Error]', err);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get pitches.' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Body may be optional if lead is already in DB
    }

    const {
      business: requestBusiness,
      leadScore: requestScore,
      websiteAnalysis: requestWeb,
      senderName,
    } = body as {
      business?: Business;
      leadScore?: LeadScoreResult;
      websiteAnalysis?: WebsiteAnalysisResult;
      senderName?: string;
    };

    // Attempt to load lead from database scoped to user if available
    const leads = await getSavedLeadsFromDb({ userId: user?.id });
    const existingLead = leads.find((l) => l.id === decodedId || l.businessId === decodedId);

    const business: Business | undefined = requestBusiness || existingLead?.business;
    const leadScore: LeadScoreResult | undefined = requestScore || existingLead?.leadScore;
    const websiteAnalysis: WebsiteAnalysisResult | undefined =
      requestWeb || existingLead?.websiteAnalysis;

    if (!business) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Business details are required to generate a personalized pitch.',
          },
        },
        { status: 400 }
      );
    }

    // Determine sender name fallback
    const defaultSender =
      user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Alex';

    // Generate AI Pitch
    const pitchOutput = await generateSalesPitch({
      business,
      leadScore,
      websiteAnalysis,
      senderName: senderName || defaultSender,
    });

    // Save generated pitch if lead is stored
    const targetLeadId = existingLead?.id || (decodedId.length === 36 ? decodedId : null);
    let savedPitch = null;

    if (targetLeadId) {
      savedPitch = await saveSalesPitchInDb({
        savedLeadId: targetLeadId,
        subject: pitchOutput.subject,
        body: pitchOutput.body,
        personalizationPoints: pitchOutput.personalizationPoints,
        aiModel: 'gemini-1.5-flash',
      });
    }

    return NextResponse.json({
      success: true,
      pitch: savedPitch || {
        id: `temp-${Date.now()}`,
        savedLeadId: targetLeadId || 'temp',
        pitchType: 'INITIAL_OUTREACH',
        subject: pitchOutput.subject,
        body: pitchOutput.body,
        personalizationPoints: pitchOutput.personalizationPoints,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[POST /api/leads/[id]/pitch Error]', err);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'PITCH_GENERATION_FAILED', message: 'Failed to generate AI pitch.' },
      },
      { status: 500 }
    );
  }
}
