import { WebsiteConversionSignals } from './types';

/**
 * Extracts Conversion & Contact signals from raw HTML
 */
export function extractConversionSignals(html: string): WebsiteConversionSignals {
  if (!html) {
    return {
      hasPhone: false,
      detectedPhones: [],
      hasEmail: false,
      detectedEmails: [],
      hasContactPageOrLink: false,
      hasBookingOrAppointment: false,
      hasContactForm: false,
      hasClearCta: false,
      hasSocialLinks: false,
      socialPlatforms: [],
    };
  }

  // 1. Phone detection (tel: links and standard phone regex patterns)
  const telMatches = (html.match(/href=["']tel:([^"']+)["']/gi) || []).map((m) =>
    m.replace(/href=["']tel:/i, '').replace(/["']/, '').trim()
  );

  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const textPhoneMatches = (html.match(phoneRegex) || []).slice(0, 3);
  const detectedPhones = Array.from(new Set([...telMatches, ...textPhoneMatches]));
  const hasPhone = detectedPhones.length > 0;

  // 2. Email detection (mailto: links and standard email regex)
  const mailtoMatches = (html.match(/href=["']mailto:([^"']+)["']/gi) || []).map((m) =>
    m.replace(/href=["']mailto:/i, '').replace(/["']/, '').trim().toLowerCase()
  );
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const textEmailMatches = (html.match(emailRegex) || [])
    .filter((e) => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.webp'))
    .slice(0, 3);
  const detectedEmails = Array.from(new Set([...mailtoMatches, ...textEmailMatches]));
  const hasEmail = detectedEmails.length > 0;

  // 3. Contact page or link
  const hasContactPageOrLink =
    /href=["'][^"']*(contact|contact-us|get-in-touch|reach-us)[^"']*["']/i.test(html) ||
    />\s*(contact|contact us|get in touch)\s*</i.test(html);

  // 4. Booking or appointment widget / link
  const hasBookingOrAppointment =
    /href=["'][^"']*(calendly|acuityscheduling|opentable|resy|zocdoc|book|schedule|appointment)[^"']*["']/i.test(html) ||
    />\s*(book now|schedule appointment|book table|book online|reserve)\s*</i.test(html) ||
    /class=["'][^"']*(booking|appointment|scheduler)[^"']*["']/i.test(html);

  // 5. Contact form
  const hasContactForm = /<form[^>]*>[\s\S]*?(<input|<textarea)[\s\S]*?<\/form>/i.test(html);

  // 6. Clear Call To Action (CTA button)
  const hasClearCta =
    hasBookingOrAppointment ||
    /<button[^>]*>[\s\S]*?(get quote|request quote|free consultation|call now|order now|hire us|start today|get started)[\s\S]*?<\/button>/i.test(
      html
    ) ||
    /<a[^>]+class=["'][^"']*(btn|button|cta)[^"']*["'][^>]*>[\s\S]*?(get quote|request quote|book|call|contact|order|consultation)[\s\S]*?<\/a>/i.test(
      html
    );

  // 7. Social Links
  const socialPlatforms: string[] = [];
  if (/facebook\.com/i.test(html)) socialPlatforms.push('Facebook');
  if (/instagram\.com/i.test(html)) socialPlatforms.push('Instagram');
  if (/linkedin\.com/i.test(html)) socialPlatforms.push('LinkedIn');
  if (/twitter\.com|x\.com/i.test(html)) socialPlatforms.push('Twitter/X');
  if (/youtube\.com/i.test(html)) socialPlatforms.push('YouTube');
  if (/tiktok\.com/i.test(html)) socialPlatforms.push('TikTok');

  const hasSocialLinks = socialPlatforms.length > 0;

  return {
    hasPhone,
    detectedPhones,
    hasEmail,
    detectedEmails,
    hasContactPageOrLink,
    hasBookingOrAppointment,
    hasContactForm,
    hasClearCta,
    hasSocialLinks,
    socialPlatforms,
  };
}
