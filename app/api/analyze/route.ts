import { NextRequest, NextResponse } from 'next/server';
import { analyzeWebsite } from '@/lib/website/analyzer';
import { computeLeadScore } from '@/lib/leads/scoring';
import { interpretLeadWithAi } from '@/lib/ai/provider';
import { getCachedLeadAnalysis, saveLeadAnalysisToSupabase } from '@/lib/supabase/db';
import { Business } from '@/types';
import { LeadScoreResult } from '@/lib/leads/types';
import { WebsiteAnalysisResult } from '@/lib/website/types';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { business, businessId, forceRefresh } = body;
    const targetBusiness: Business | undefined = business;
    const targetId: string = businessId || targetBusiness?.googlePlaceId || targetBusiness?.id;

    if (!targetBusiness && !targetId) {
      return NextResponse.json(
        { success: false, error: 'Target business or businessId is required.' },
        { status: 400 }
      );
    }

    // 1. Check cache freshness unless forceRefresh is true
    if (!forceRefresh && targetId) {
      const cached = await getCachedLeadAnalysis(targetId);
      if (cached) {
        return NextResponse.json({
          success: true,
          cached: true,
          result: {
            ...cached,
            businessName: targetBusiness?.name || cached.businessName,
          },
        });
      }
    }

    const biz: Business = targetBusiness || {
      googlePlaceId: targetId,
      name: 'Local Business',
      category: 'General',
      address: '',
      hasWebsite: false,
    };

    let websiteAnalysis: WebsiteAnalysisResult | undefined;

    // 2. Perform Website Analysis if website exists
    if (biz.hasWebsite && biz.website) {
      websiteAnalysis = await analyzeWebsite(biz.website);
    }

    // 3. Calculate Deterministic Lead Score
    const leadScore = computeLeadScore(biz, websiteAnalysis);

    // 4. Run AI Lead Intelligence Interpretation
    const aiInterpretation = await interpretLeadWithAi({
      business: biz,
      breakdown: leadScore.breakdown,
      deterministicReasons: leadScore.reasons,
      deterministicServices: leadScore.recommendedServices,
      websiteAnalysis,
    });

    const finalResult: LeadScoreResult = {
      ...leadScore,
      businessId: targetId,
      businessName: biz.name,
      reasons: aiInterpretation.reasons,
      recommendedServices: aiInterpretation.recommendedServices,
      aiSummary: aiInterpretation.aiSummary,
      websiteAnalysis,
    };

    // 5. Save Analysis to Supabase
    await saveLeadAnalysisToSupabase(targetId, finalResult, websiteAnalysis);

    return NextResponse.json({
      success: true,
      cached: false,
      result: finalResult,
    });
  } catch (error: unknown) {
    console.error('[Analyze API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to complete lead analysis at this time. Please try again.',
      },
      { status: 500 }
    );
  }
}
