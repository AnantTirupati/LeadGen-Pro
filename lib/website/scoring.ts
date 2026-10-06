import { WebsiteSignals, WebsiteCategoryScores } from './types';

export interface ScoreCalculationResult {
  qualityScore: number; // 0 - 100
  categoryScores: WebsiteCategoryScores;
  penalties: string[];
  strengths: string[];
}

/**
 * Calculates a deterministic website quality score (0 - 100) based on objective signals
 */
export function calculateWebsiteScore(signals: WebsiteSignals): ScoreCalculationResult {
  const penalties: string[] = [];
  const strengths: string[] = [];

  // Unreachable website
  if (!signals.reachable) {
    return {
      qualityScore: 0,
      categoryScores: {
        performance: 0,
        mobileReadiness: 0,
        seoBasics: 0,
        conversionReadiness: 0,
        security: 0,
        contentAndBusiness: 0,
      },
      penalties: ['Website is down or unreachable'],
      strengths: [],
    };
  }

  // 1. Performance (0 - 20)
  let performance = 0;
  const { loadTimeMs, pageSizeBytes, brokenImageCount } = signals.performance;

  if (loadTimeMs <= 1000) {
    performance = 20;
    strengths.push('Fast server response (<1s)');
  } else if (loadTimeMs <= 2000) {
    performance = 15;
  } else if (loadTimeMs <= 3500) {
    performance = 10;
    penalties.push('Moderate page load time');
  } else {
    performance = 4;
    penalties.push('Slow page load speed (>3.5s)');
  }

  if (pageSizeBytes > 1024 * 1024) {
    performance = Math.max(0, performance - 5);
    penalties.push('Heavy HTML payload (>1MB)');
  }
  if (brokenImageCount > 0) {
    performance = Math.max(0, performance - 3);
    penalties.push(`${brokenImageCount} broken image tags detected`);
  }

  // 2. Mobile Readiness (0 - 20)
  let mobileReadiness = 0;
  if (signals.mobile.hasViewportMeta) {
    mobileReadiness += 15;
    strengths.push('Mobile viewport configured');
  } else {
    penalties.push('Missing mobile viewport meta tag');
  }

  if (signals.mobile.hasResponsiveIndicators) {
    mobileReadiness += 5;
  }

  if (signals.mobile.hasObviousFixedWidth) {
    mobileReadiness = Math.max(0, mobileReadiness - 10);
    penalties.push('Fixed-width desktop layout (poor mobile experience)');
  }

  // 3. SEO Basics (0 - 15)
  let seoBasics = 0;
  if (signals.seo.hasTitle) {
    seoBasics += 5;
    if (signals.seo.titleLength >= 10 && signals.seo.titleLength <= 70) {
      strengths.push('Optimized page title');
    }
  } else {
    penalties.push('Missing <title> tag');
  }

  if (signals.seo.hasMetaDescription) {
    seoBasics += 4;
  } else {
    penalties.push('Missing meta description');
  }

  if (signals.seo.hasH1) {
    seoBasics += 4;
  } else {
    penalties.push('Missing H1 heading hierarchy');
  }

  if (signals.seo.hasCanonical || signals.seo.hasRobotsMeta) {
    seoBasics += 2;
  }

  // 4. Conversion Readiness (0 - 20)
  let conversionReadiness = 0;
  if (signals.conversion.hasPhone) {
    conversionReadiness += 5;
    strengths.push('Direct phone number visible');
  } else {
    penalties.push('No direct phone number found');
  }

  if (signals.conversion.hasEmail || signals.conversion.hasContactForm) {
    conversionReadiness += 5;
  } else {
    penalties.push('No contact form or email address found');
  }

  if (signals.conversion.hasBookingOrAppointment || signals.conversion.hasClearCta) {
    conversionReadiness += 6;
    strengths.push('Clear call-to-action / booking feature');
  } else {
    penalties.push('No online booking or prominent CTA');
  }

  if (signals.conversion.hasContactPageOrLink) {
    conversionReadiness += 4;
  }

  // 5. Security (0 - 10)
  let security = 0;
  if (signals.security.isHttps) {
    security += 7;
    strengths.push('Secure HTTPS connection');
  } else {
    penalties.push('Insecure connection (HTTP only, missing SSL)');
  }

  if (signals.security.hasHttpsRedirect) {
    security += 3;
  }

  if (signals.security.hasMixedContent) {
    security = Math.max(0, security - 5);
    penalties.push('Mixed insecure HTTP content on HTTPS');
  }

  // 6. Content & Business Presence (0 - 15)
  let contentAndBusiness = 0;
  if (signals.conversion.hasSocialLinks) {
    contentAndBusiness += 5;
    strengths.push(`Social presence: ${signals.conversion.socialPlatforms.join(', ')}`);
  } else {
    penalties.push('No social media profile links');
  }

  if (signals.seo.h2Count >= 2) {
    contentAndBusiness += 5;
  }

  if (signals.performance.imageCount >= 3) {
    contentAndBusiness += 5;
  } else if (signals.performance.imageCount === 0) {
    penalties.push('Zero images or visual assets found');
  }

  const qualityScore = Math.min(
    100,
    Math.max(
      0,
      performance + mobileReadiness + seoBasics + conversionReadiness + security + contentAndBusiness
    )
  );

  return {
    qualityScore,
    categoryScores: {
      performance,
      mobileReadiness,
      seoBasics,
      conversionReadiness,
      security,
      contentAndBusiness,
    },
    penalties,
    strengths,
  };
}
