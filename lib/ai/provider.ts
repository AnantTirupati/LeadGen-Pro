import { AiLeadInterpretationInput, AiLeadInterpretationOutput } from './types';
import { callGeminiLeadInterpretation } from './gemini';

/**
 * Interprets lead data using configured AI provider with deterministic fallback
 */
export async function interpretLeadWithAi(
  input: AiLeadInterpretationInput
): Promise<{
  aiSummary: string;
  reasons: string[];
  recommendedServices: string[];
  isAiGenerated: boolean;
}> {
  // 1. Attempt AI interpretation
  const aiResult: AiLeadInterpretationOutput | null = await callGeminiLeadInterpretation(input);

  if (aiResult) {
    return {
      aiSummary: aiResult.summary,
      reasons: aiResult.reasons.length > 0 ? aiResult.reasons : input.deterministicReasons,
      recommendedServices:
        aiResult.recommendedServices.length > 0
          ? aiResult.recommendedServices
          : input.deterministicServices,
      isAiGenerated: true,
    };
  }

  // 2. Deterministic Fallback
  const { business, breakdown, deterministicReasons, deterministicServices } = input;
  let fallbackSummary = '';

  if (!business.hasWebsite) {
    fallbackSummary = `${business.name} has strong local demand (${business.reviewCount || 0} reviews, ${business.rating || 0}⭐) but lacks a dedicated website, making it a prime candidate for full digital setup.`;
  } else if (input.websiteAnalysis && !input.websiteAnalysis.reachable) {
    fallbackSummary = `${business.name}'s website is currently unreachable or down, creating an urgent opportunity for website recovery and modern redesign.`;
  } else {
    fallbackSummary = `${business.name} is an active local business with an online presence that can be optimized for mobile conversion and search visibility.`;
  }

  return {
    aiSummary: fallbackSummary,
    reasons: deterministicReasons,
    recommendedServices: deterministicServices,
    isAiGenerated: false,
  };
}
