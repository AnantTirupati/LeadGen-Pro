import { Business } from '@/types';
import { WebsiteAnalysisResult } from '../website/types';

/**
 * Generates deterministic, explainable reasons why a business is a strong/weak lead
 */
export function generateLeadReasons(
  business: Business,
  websiteAnalysis?: WebsiteAnalysisResult
): { reasons: string[]; recommendedServices: string[] } {
  const reasons: string[] = [];
  const recommendedServices: string[] = [];

  const { rating, reviewCount = 0 } = business;

  // 1. Business Strength Indicators
  if (reviewCount >= 100) {
    reasons.push(`${reviewCount}+ customer reviews indicate established market presence and customer demand`);
  } else if (reviewCount >= 25) {
    reasons.push(`Active customer review volume (${reviewCount} reviews)`);
  }

  if (rating && rating >= 4.5) {
    reasons.push(`High customer satisfaction rating of ${rating.toFixed(1)} ⭐`);
  } else if (rating && rating >= 4.0) {
    reasons.push(`Solid rating of ${rating.toFixed(1)} ⭐ demonstrates good local reputation`);
  }

  // 2. NO WEBSITE Case (Highest Opportunity)
  if (!business.hasWebsite || !websiteAnalysis || !business.website) {
    reasons.push('No website listed on Google Business Profile');
    reasons.push('High risk of losing high-intent searchers to competitors with online booking/ordering');

    recommendedServices.push(
      'Modern Responsive Website Design',
      'Local SEO & Google Search Presence',
      'Online Booking & Lead Capture System',
      'Mobile-Friendly Digital Menu / Service Catalog'
    );

    return { reasons, recommendedServices };
  }

  // 3. WITH WEBSITE Case (Technical / UX / Conversion Gaps)
  if (!websiteAnalysis.reachable) {
    reasons.push('Current website is down, unreachable, or returning server errors');
    recommendedServices.push('Website Restoration & Modern Redesign', 'Reliable Fast Cloud Hosting');
    return { reasons, recommendedServices };
  }

  const { signals, categoryScores } = websiteAnalysis;

  // Security gap
  if (!signals.security.isHttps) {
    reasons.push('Website lacks HTTPS/SSL security certificate, causing browser security warnings');
    recommendedServices.push('SSL Installation & Security Hardening');
  }

  // Mobile readiness gap
  if (categoryScores.mobileReadiness < 15) {
    reasons.push('Weak mobile layout structure with missing responsive viewport optimization');
    recommendedServices.push('Mobile-First Responsive Website Redesign');
  }

  // Conversion gap
  if (!signals.conversion.hasBookingOrAppointment && !signals.conversion.hasClearCta) {
    reasons.push('No clear call-to-action, direct quote request, or online appointment booking option');
    recommendedServices.push('High-Converting Call-To-Action & Booking Funnel');
  }

  if (!signals.conversion.hasContactForm && !signals.conversion.hasEmail) {
    reasons.push('Missing digital contact form for frictionless customer inquiries');
    recommendedServices.push('Lead Capture Form & CRM Integration');
  }

  // Performance gap
  if (signals.performance.isSlow || categoryScores.performance < 12) {
    reasons.push(`Slow page load speed (${signals.performance.loadTimeMs}ms) which hurts search rankings and customer retention`);
    recommendedServices.push('Performance Speed Optimization & Asset Compression');
  }

  // SEO gap
  if (categoryScores.seoBasics < 10) {
    reasons.push('Missing basic on-page SEO meta tags and heading structure');
    recommendedServices.push('On-Page SEO Optimization & Local Schema Setup');
  }

  // Default fallback services if everything is already decent
  if (recommendedServices.length === 0) {
    recommendedServices.push(
      'Conversion Rate Optimization (CRO) Audit',
      'Advanced Local Search Engine Optimization',
      'Automated Customer Review & Outreach Sequences'
    );
  }

  return {
    reasons: reasons.slice(0, 5),
    recommendedServices: Array.from(new Set(recommendedServices)).slice(0, 4),
  };
}
