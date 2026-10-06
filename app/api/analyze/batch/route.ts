import { NextRequest, NextResponse } from 'next/server';
import { analyzeWebsite } from '@/lib/website/analyzer';
import { computeLeadScore } from '@/lib/leads/scoring';
import { interpretLeadWithAi } from '@/lib/ai/provider';
import { getCachedLeadAnalysis, saveLeadAnalysisToSupabase } from '@/lib/supabase/db';
import { Business } from '@/types';
import { LeadScoreResult } from '@/lib/leads/types';
import { WebsiteAnalysisResult } from '@/lib/website/types';

const MAX_BATCH_SIZE = 10;
const CONCURRENCY_LIMIT = 2;

async function processSingleBusiness(biz: Business): Promise<LeadScoreResult> {
  const targetId = biz.googlePlaceId || biz.id || 'unknown';

  // 1. Check cache first
  const cached = await getCachedLeadAnalysis(targetId);
  if (cached) {
    return {
      ...cached,
      businessName: biz.name,
    };
  }

  // 2. Website Analysis if website exists
  let websiteAnalysis: WebsiteAnalysisResult | undefined;
  if (biz.hasWebsite && biz.website) {
    try {
      websiteAnalysis = await analyzeWebsite(biz.website);
    } catch {
      // Graceful fallback
    }
  }

  // 3. Deterministic scoring
  const leadScore = computeLeadScore(biz, websiteAnalysis);

  // 4. AI Interpretation
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

  // 5. Save to DB
  await saveLeadAnalysisToSupabase(targetId, finalResult, websiteAnalysis);

  return finalResult;
}

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

    const { businesses } = body;

    if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Array of businesses is required.' },
        { status: 400 }
      );
    }

    // Limit batch size to 10 max
    const targets: Business[] = businesses.slice(0, MAX_BATCH_SIZE);
    const results: LeadScoreResult[] = [];

    // Controlled concurrency batch execution
    for (let i = 0; i < targets.length; i += CONCURRENCY_LIMIT) {
      const chunk = targets.slice(i, i + CONCURRENCY_LIMIT);
      const chunkResults = await Promise.all(
        chunk.map((business) => processSingleBusiness(business))
      );
      results.push(...chunkResults);
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error: unknown) {
    console.error('[Batch Analyze API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during batch analysis.',
      },
      { status: 500 }
    );
  }
}
