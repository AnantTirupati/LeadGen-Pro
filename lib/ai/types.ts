import { Business } from '@/types';
import { WebsiteAnalysisResult } from '../website/types';
import { LeadScoreBreakdown } from '../leads/types';

export interface AiLeadInterpretationInput {
  business: Business;
  breakdown: LeadScoreBreakdown;
  deterministicReasons: string[];
  deterministicServices: string[];
  websiteAnalysis?: WebsiteAnalysisResult;
}

export interface AiLeadInterpretationOutput {
  summary: string;
  opportunity: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  recommendedServices: string[];
}
