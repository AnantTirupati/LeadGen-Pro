import { createServerSupabaseClient } from './server';
import { Business } from '@/types';
import { LeadScoreResult } from '../leads/types';
import { WebsiteAnalysisResult } from '../website/types';

const ANALYSIS_CACHE_HOURS = parseInt(process.env.ANALYSIS_CACHE_HOURS || '24', 10);

/**
 * Upserts normalized businesses into the Supabase 'businesses' table.
 */
export async function upsertBusinessesToSupabase(businesses: Business[]): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase || businesses.length === 0) {
    return;
  }

  try {
    const records = businesses.map((b) => ({
      google_place_id: b.googlePlaceId,
      name: b.name,
      category: b.category,
      address: b.address,
      phone: b.phone || null,
      website: b.website || null,
      rating: b.rating ?? null,
      review_count: b.reviewCount ?? 0,
      latitude: b.latitude ?? null,
      longitude: b.longitude ?? null,
      google_maps_url: b.googleMapsUrl || null,
      business_status: b.businessStatus || 'OPERATIONAL',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('businesses').upsert(records, {
      onConflict: 'google_place_id',
      ignoreDuplicates: false,
    });

    if (error) {
      console.warn('[Supabase Upsert Warning]', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Upsert Exception]', err);
  }
}

/**
 * Records a search query in Supabase searches table
 */
export async function recordSearchToSupabase(
  location: string,
  industry: string,
  resultsCount: number,
  userId?: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('searches').insert({
      user_id: userId || null,
      location,
      industry,
      results_count: resultsCount,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[Supabase Search Record Warning]', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Search Record Exception]', err);
  }
}

/**
 * Retrieves cached Lead Score & Analysis from Supabase if fresh within ANALYSIS_CACHE_HOURS
 */
export async function getCachedLeadAnalysis(
  businessId: string
): Promise<LeadScoreResult | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase || !businessId) return null;

  try {
    const { data: scoreData, error: scoreErr } = await supabase
      .from('lead_scores')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (scoreErr || !scoreData) return null;

    // Check freshness
    const updatedAt = new Date(scoreData.updated_at || scoreData.created_at).getTime();
    const ageHours = (Date.now() - updatedAt) / (1000 * 60 * 60);

    if (ageHours > ANALYSIS_CACHE_HOURS) {
      return null; // Cache expired
    }

    // Fetch optional website analysis
    const { data: websiteData } = await supabase
      .from('website_analysis')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    const websiteAnalysis: WebsiteAnalysisResult | undefined = websiteData?.analysis_data;

    return {
      businessId,
      businessName: '', // populated by caller if needed
      score: scoreData.score,
      opportunityLevel: scoreData.opportunity_level,
      breakdown: {
        businessStrengthScore: scoreData.business_strength_score,
        websiteOpportunityScore: scoreData.website_opportunity_score,
        overallScore: scoreData.score,
        opportunityLevel: scoreData.opportunity_level,
      },
      reasons: Array.isArray(scoreData.reasons) ? scoreData.reasons : [],
      recommendedServices: Array.isArray(scoreData.recommended_services)
        ? scoreData.recommended_services
        : [],
      aiSummary: scoreData.ai_summary,
      websiteAnalysis,
      hasWebsite: Boolean(websiteData?.url),
      analyzedAt: scoreData.updated_at || scoreData.created_at,
    };
  } catch (err) {
    console.warn('[Supabase Cache Check Exception]', err);
    return null;
  }
}

/**
 * Saves Lead Score & Website Analysis results to Supabase
 */
export async function saveLeadAnalysisToSupabase(
  businessId: string,
  leadScore: LeadScoreResult,
  websiteAnalysis?: WebsiteAnalysisResult
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase || !businessId) return;

  const now = new Date().toISOString();

  try {
    // 1. Save Website Analysis if present
    if (websiteAnalysis) {
      const { signals } = websiteAnalysis;
      await supabase.from('website_analysis').upsert(
        {
          business_id: businessId,
          url: websiteAnalysis.url,
          reachable: websiteAnalysis.reachable,
          status_code: websiteAnalysis.statusCode || null,
          https: signals.security.isHttps,
          load_time_ms: websiteAnalysis.loadTimeMs || 0,
          page_size_bytes: websiteAnalysis.pageSizeBytes || 0,
          has_viewport: signals.mobile.hasViewportMeta,
          has_title: signals.seo.hasTitle,
          has_meta_description: signals.seo.hasMetaDescription,
          has_canonical: signals.seo.hasCanonical,
          has_h1: signals.seo.hasH1,
          has_contact_info: signals.conversion.hasPhone || signals.conversion.hasEmail,
          has_phone: signals.conversion.hasPhone,
          has_email: signals.conversion.hasEmail,
          has_booking: signals.conversion.hasBookingOrAppointment,
          has_cta: signals.conversion.hasClearCta,
          has_social_links: signals.conversion.hasSocialLinks,
          website_quality_score: websiteAnalysis.qualityScore,
          analysis_data: websiteAnalysis,
          updated_at: now,
        },
        { onConflict: 'business_id' }
      );
    }

    // 2. Save Lead Score
    await supabase.from('lead_scores').upsert(
      {
        business_id: businessId,
        score: leadScore.score,
        opportunity_level: leadScore.opportunityLevel,
        business_strength_score: leadScore.breakdown.businessStrengthScore,
        website_opportunity_score: leadScore.breakdown.websiteOpportunityScore,
        reasons: leadScore.reasons,
        recommended_services: leadScore.recommendedServices,
        ai_summary: leadScore.aiSummary || null,
        updated_at: now,
      },
      { onConflict: 'business_id' }
    );
  } catch (err) {
    console.warn('[Supabase Save Analysis Exception]', err);
  }
}
