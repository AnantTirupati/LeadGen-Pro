import { PitchGenerationOutput } from './types';

/**
 * Validates that an object conforms to the PitchGenerationOutput structure
 */
export function validatePitchOutput(data: unknown): PitchGenerationOutput | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const candidate = data as Record<string, unknown>;

  if (typeof candidate.subject !== 'string' || candidate.subject.trim().length === 0) {
    return null;
  }

  if (typeof candidate.body !== 'string' || candidate.body.trim().length === 0) {
    return null;
  }

  const personalizationPoints = Array.isArray(candidate.personalizationPoints)
    ? candidate.personalizationPoints.filter((p) => typeof p === 'string' && p.trim().length > 0)
    : [];

  return {
    subject: candidate.subject.trim(),
    body: candidate.body.trim(),
    personalizationPoints,
  };
}

/**
 * Safely parses and validates a raw JSON string from AI output
 */
export function safeParsePitchOutput(raw: string): PitchGenerationOutput | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return validatePitchOutput(parsed);
  } catch {
    return null;
  }
}

