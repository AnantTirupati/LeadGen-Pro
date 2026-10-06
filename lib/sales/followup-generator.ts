import { FollowUpDraftInput, FollowUpDraftOutput } from '../email/types';
import { EMAIL_OUTREACH_SYSTEM_PROMPT, buildFollowUpPrompt } from './email-prompts';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Generates a deterministic follow-up email draft
 */
export function generateDeterministicFollowUp(input: FollowUpDraftInput): FollowUpDraftOutput {
  const { businessName, previousEmailSubject, senderName = 'Anant' } = input;
  const subject = previousEmailSubject
    ? `Re: ${previousEmailSubject.replace(/^Re:\s*/i, '')}`
    : `Quick follow-up for ${businessName}`;

  return {
    subject,
    body: `Hi ${businessName} team,\n\nJust wanted to follow up on my note from last week about the website ideas I mentioned.\n\nI put together a couple of quick layout concepts that could make it much easier for mobile visitors to view your services and get in touch.\n\nWould you be open to taking a quick look at the preview?\n\nBest regards,\n${senderName}`,
  };
}

/**
 * AI-powered follow-up generator
 */
export async function generateFollowUpDraft(
  input: FollowUpDraftInput
): Promise<FollowUpDraftOutput> {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (apiKey && apiKey !== 'your-google-maps-api-key-here') {
    const prompt = buildFollowUpPrompt(input);

    try {
      const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: EMAIL_OUTREACH_SYSTEM_PROMPT }],
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

          if (parsed && typeof parsed.subject === 'string' && typeof parsed.body === 'string') {
            return {
              subject: parsed.subject.trim(),
              body: parsed.body.trim(),
            };
          }
        }
      }
    } catch (err) {
      console.warn('[AI Follow-up Draft Fallback]', err);
    }
  }

  return generateDeterministicFollowUp(input);
}
