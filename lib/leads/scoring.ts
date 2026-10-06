import { Business } from '@/types';
import { WebsiteAnalysisResult } from '../website/types';
import { LeadScoreResult, LeadScoreBreakdown } from './types';
import { classifyOpportunityLevel } from './classifier';
import { generateLeadReasons } from './reasons';

/**
 * Calculates business demand strength (0 - 50) from Google Places metrics
 */
export function calculateBusinessStrengthScore(business: Business): number {
  let score = 15; // baseline

  const rating = business.rating || 0;
  const reviewCount = business.reviewCount || 0;

  // Rating contribution (0 - 15)
  if (rating >= 4.7) score += 15;
  else if (rating >= 4.3) score += 12;
  else if (rating >= 4.0) score += 8;
  else if (rating >= 3.5) score += 4;

  // Review volume contribution (0 - 20)
  if (reviewCount >= 300) score += 20;
  else if (reviewCount >= 100) score += 16;
  else if (reviewCount >= 40) score += 12;
  else if (reviewCount >= 10) score += 6;
  else if (reviewCount >= 1) score += 3;

  return Math.min(50, Math.max(0, score));
}

/**
 * Calculates agency pitch opportunity score (0 - 50) based on website absence or gaps
 */
export function calculateWebsiteOpportunityScore(
  business: Business,
  websiteAnalysis?: WebsiteAnalysisResult
): number {
  // 1. NO WEBSITE — Maximum opportunity
  if (!business.hasWebsite || !business.website || !websiteAnalysis) {
    return 50;
  }

  // 2. UNREACHABLE WEBSITE — Extreme opportunity
  if (!websiteAnalysis.reachable) {
    return 48;
  }

  // 3. Low quality website — Inversely proportional to website quality score
  const quality = websiteAnalysis.qualityScore; // 0 - 100
  const opportunity = Math.round(((100 - quality) / 100) * 50);

  return Math.min(50, Math.max(0, opportunity));
}

/**
 * Computes deterministic Lead Score and detailed breakdown
 */
export function computeLeadScore(
  business: Business,
  websiteAnalysis?: WebsiteAnalysisResult
): LeadScoreResult {
  const businessStrengthScore = calculateBusinessStrengthScore(business);
  const websiteOpportunityScore = calculateWebsiteOpportunityScore(business, websiteAnalysis);

  const overallScore = Math.min(100, Math.max(0, businessStrengthScore + websiteOpportunityScore));
  const opportunityLevel = classifyOpportunityLevel(overallScore);

  const breakdown: LeadScoreBreakdown = {
    businessStrengthScore,
    websiteOpportunityScore,
    overallScore,
    opportunityLevel,
  };

  const { reasons, recommendedServices } = generateLeadReasons(business, websiteAnalysis);

  return {
    businessId: business.id || business.googlePlaceId,
    businessName: business.name,
    score: overallScore,
    opportunityLevel,
    breakdown,
    reasons,
    recommendedServices,
    websiteAnalysis,
    hasWebsite: business.hasWebsite,
    analyzedAt: new Date().toISOString(),
  };
}
