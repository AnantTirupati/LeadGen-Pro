import { PitchGenerationInput, PitchGenerationOutput } from './types';
import { SALES_PITCH_SYSTEM_PROMPT, buildPitchPrompt } from './prompts';
import { validatePitchOutput } from './schema';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Deterministic generator used for offline/fallback operation
 */
export function generateDeterministicSalesPitch(
  input: PitchGenerationInput
): PitchGenerationOutput {
  const { business, websiteAnalysis, senderName = 'Alex' } = input;
  const area = business.address ? business.address.split(',')[0] : 'your area';

  if (!business.hasWebsite) {
    return {
      subject: `Quick idea for ${business.name}`,
      body: `Hi ${business.name} team,\n\nI was looking up top-rated ${business.category.toLowerCase()} businesses in ${area} and came across your profile. Your ${business.reviewCount || 'strong'} Google reviews and ${business.rating || 4.5}⭐ rating immediately stood out.\n\nI noticed you don't currently have a dedicated website linked, which means potential customers searching on mobile might be missing an easy way to see your full services or book directly.\n\nI build fast, high-converting websites for local businesses. Would you be open to me putting together a quick preview of what a modern site for ${business.name} could look like?\n\nBest,\n${senderName}`,
      personalizationPoints: [
        `Referenced ${business.reviewCount || 50}+ Google reviews`,
        `Highlighted lack of dedicated website in ${area}`,
        'Personalized category and business greeting',
      ],
    };
  }

  const gapMention = websiteAnalysis && !websiteAnalysis.signals.mobile.hasViewportMeta
    ? 'the mobile experience and ease of browsing on phones'
    : 'online appointment booking and mobile conversion paths';

  return {
    subject: `Quick suggestion for ${business.name}`,
    body: `Hi ${business.name} team,\n\nI came across ${business.name} while researching well-reviewed ${business.category.toLowerCase()} practices in ${area}. Your ${business.reviewCount || 'strong'} reviews and solid local reputation caught my eye.\n\nWhile browsing your website, I noticed a few quick opportunities to improve ${gapMention} so that more local searchers convert into paying clients.\n\nI help businesses redesign and optimize their websites for higher conversion. Would you be open to me sharing a couple of quick ideas I had for your site?\n\nBest,\n${senderName}`,
    personalizationPoints: [
      `Referenced real Google rating (${business.rating || 4.5}⭐) and review count`,
      `Highlighted specific ${gapMention} gap`,
      'Consultative, low-pressure offer',
    ],
  };
}

/**
 * Generates an AI-powered sales pitch tailored specifically to the business's signals
 */
export async function generateSalesPitch(
  input: PitchGenerationInput
): Promise<PitchGenerationOutput> {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim();

  // 1. If API Key is present, call Gemini
  if (apiKey && apiKey !== 'your-google-maps-api-key-here') {
    const prompt = buildPitchPrompt(input);

    try {
      const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SALES_PITCH_SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText) {
          const cleaned = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          const validated = validatePitchOutput(parsed);

          if (validated) {
            return validated;
          }
        }
      }
    } catch (err) {
      console.warn('[Pitch Generator AI Fallback]', err);
    }
  }

  // 2. High-Quality Deterministic Draft
  return generateDeterministicSalesPitch(input);
}
