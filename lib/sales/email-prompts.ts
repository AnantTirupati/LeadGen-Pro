import { Business } from '@/types';
import { LeadScoreResult } from '../leads/types';
import { WebsiteAnalysisResult } from '../website/types';
import { FollowUpDraftInput, FollowUpDraftOutput } from '../email/types';
import { PitchGenerationOutput } from './types';
import { SALES_PITCH_SYSTEM_PROMPT } from './prompts';

export const EMAIL_OUTREACH_SYSTEM_PROMPT = `${SALES_PITCH_SYSTEM_PROMPT}

EMAIL OUTREACH SPECIFIC RULES:
1. The message must be formatted ready for sending as a direct cold email.
2. Subject must be concise and engaging (e.g. "Quick idea for Sharma Dental Clinic" or "Mobile experience note - Sharma Dental").
3. Use contact name if provided (e.g. "Hi [Name]," or "Hi [Business Name] team,").
4. Never use marketing jargon or fake urgency.
5. Ground observations strictly in the verified analysis data.`;

export function buildEmailOutreachPrompt(params: {
  business: Business;
  contactName?: string;
  leadScore?: LeadScoreResult;
  websiteAnalysis?: WebsiteAnalysisResult;
  senderName?: string;
}): string {
  const { business, contactName, leadScore, websiteAnalysis, senderName = 'Anant' } = params;

  const websiteDetails = !business.hasWebsite || !websiteAnalysis
    ? 'Website Status: NO WEBSITE currently listed on Google Business profile.'
    : `Website Analysis:
- Quality Score: ${websiteAnalysis.qualityScore}/100
- Mobile Viewport: ${websiteAnalysis.signals.mobile.hasViewportMeta ? 'Present' : 'MISSING (poor phone experience)'}
- Fast Load: ${websiteAnalysis.signals.performance.loadTimeMs}ms
- Booking / CTA: ${websiteAnalysis.signals.conversion.hasBookingOrAppointment ? 'Present' : 'MISSING clear booking CTA'}
- SSL / HTTPS: ${websiteAnalysis.signals.security.isHttps ? 'Valid HTTPS' : 'Insecure HTTP'}`;

  return `Write a personalized cold email for this business:

Recipient Info:
- Business: ${business.name}
- Contact Person: ${contactName || 'Owner/Manager'}
- Category: ${business.category}
- Location: ${business.address}
- Google Rating: ${business.rating || 4.5}⭐ (${business.reviewCount || 0} reviews)
- Lead Score: ${leadScore?.score || 85}/100

${websiteDetails}

Key Lead Reasons:
${leadScore?.reasons.map((r) => `- ${r}`).join('\n') || '- Strong local reviews with digital growth potential'}

Sender Name: ${senderName}

Respond ONLY with valid JSON matching:
{
  "subject": "Short compelling email subject line",
  "body": "80-150 word email body with friendly opening, genuine review praise, specific website observation, simple offer, and low-pressure CTA.",
  "personalizationPoints": [
    "Referenced verified ${business.reviewCount || 50}+ reviews",
    "Pointed out specific ${business.hasWebsite ? 'mobile/booking' : 'website lack'} observation"
  ]
}`;
}

export function buildFollowUpPrompt(input: FollowUpDraftInput): string {
  const { businessName, category, address, previousEmailSubject, previousEmailBody, senderName = 'Anant' } = input;

  return `Write a short, friendly, and low-pressure follow-up email (40 to 100 words):

Business: ${businessName}
Category: ${category}
${address ? `Location: ${address}` : ''}
${previousEmailSubject ? `Previous Subject: ${previousEmailSubject}` : ''}
${previousEmailBody ? `Previous Email Content: ${previousEmailBody.slice(0, 300)}...` : ''}
Sender Name: ${senderName}

RULES:
- Length: 40-100 words.
- Tone: Friendly, respectful, no pressure.
- Offer to share a quick mock-up or concept.
- Avoid being annoying or aggressive.

Respond ONLY with valid JSON:
{
  "subject": "Follow up: ${previousEmailSubject || `Website concept for ${businessName}`}",
  "body": "Hi ${businessName} team,\n\nJust following up on my previous note..."
}`;
}
