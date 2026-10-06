import { Business } from '@/types';
import { WebsiteAnalysisResult } from '../website/types';

export type OpportunityLevel = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface LeadScoreBreakdown {
  businessStrengthScore: number; // 0 - 50 (Rating, reviews, business demand)
  websiteOpportunityScore: number; // 0 - 50 (Lack of website or quality gaps)
  overallScore: number; // 0 - 100
  opportunityLevel: OpportunityLevel;
}

export interface LeadScoreResult {
  businessId: string;
  businessName: string;
  score: number; // 0 - 100
  opportunityLevel: OpportunityLevel;
  breakdown: LeadScoreBreakdown;
  reasons: string[];
  recommendedServices: string[];
  aiSummary?: string;
  websiteAnalysis?: WebsiteAnalysisResult;
  hasWebsite: boolean;
  analyzedAt: string;
}
