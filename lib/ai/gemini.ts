import { AiLeadInterpretationInput, AiLeadInterpretationOutput } from './types';
import { AI_SYSTEM_PROMPT, buildAiPrompt } from './prompts';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Calls Gemini API with structured prompt and parses JSON output
 */
export async function callGeminiLeadInterpretation(
  input: AiLeadInterpretationInput
): Promise<AiLeadInterpretationOutput | null> {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
    return null; // AI not configured -> fallback to deterministic engine
  }

  const prompt = buildAiPrompt(input);

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: AI_SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2, // Low temperature for high consistency and ground-truth adherence
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(9000), // 9s timeout
    });

    if (!res.ok) {
      console.warn('[Gemini API Warning]', res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return null;
    }

    // Clean any markdown code fences if present
    const cleanedJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    if (
      parsed &&
      typeof parsed.summary === 'string' &&
      Array.isArray(parsed.reasons) &&
      Array.isArray(parsed.recommendedServices)
    ) {
      return {
        summary: parsed.summary,
        opportunity: parsed.opportunity || input.breakdown.opportunityLevel,
        reasons: parsed.reasons.slice(0, 5),
        recommendedServices: parsed.recommendedServices.slice(0, 4),
      };
    }

    return null;
  } catch (err) {
    console.warn('[Gemini AI Parse/Call Warning]', err);
    return null;
  }
}
