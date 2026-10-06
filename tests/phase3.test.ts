import assert from 'node:assert/strict';
import test from 'node:test';
import { isUnsafeHostOrIp, validateUrlForFetch } from '../lib/website/fetcher';
import { extractSeoSignals } from '../lib/website/seo';
import { extractMobileSignals } from '../lib/website/mobile';
import { extractConversionSignals } from '../lib/website/conversion';
import { calculateWebsiteScore } from '../lib/website/scoring';
import { computeLeadScore, calculateBusinessStrengthScore, calculateWebsiteOpportunityScore } from '../lib/leads/scoring';
import { classifyOpportunityLevel } from '../lib/leads/classifier';
import { generateLeadReasons } from '../lib/leads/reasons';
import { interpretLeadWithAi } from '../lib/ai/provider';
import { Business } from '../types';
import { WebsiteSignals } from '../lib/website/types';

test('1. SSRF Protection: Blocks localhost, private IPs, and cloud metadata', () => {
  // Localhost
  assert.equal(isUnsafeHostOrIp('localhost'), true);
  assert.equal(isUnsafeHostOrIp('127.0.0.1'), true);
  assert.equal(isUnsafeHostOrIp('0.0.0.0'), true);
  assert.equal(isUnsafeHostOrIp('sub.localhost'), true);

  // Private IPv4 ranges (10.x, 172.16-31.x, 192.168.x)
  assert.equal(isUnsafeHostOrIp('10.0.0.1'), true);
  assert.equal(isUnsafeHostOrIp('172.16.0.5'), true);
  assert.equal(isUnsafeHostOrIp('172.31.255.255'), true);
  assert.equal(isUnsafeHostOrIp('192.168.1.1'), true);

  // Cloud metadata service (AWS/GCP/Azure)
  assert.equal(isUnsafeHostOrIp('169.254.169.254'), true);

  // Valid public hostnames
  assert.equal(isUnsafeHostOrIp('example.com'), false);
  assert.equal(isUnsafeHostOrIp('my-dental-clinic.org'), false);
  assert.equal(isUnsafeHostOrIp('8.8.8.8'), false);
});

test('2. URL Protocol Validation: Disallows non-http/https protocols', () => {
  assert.equal(validateUrlForFetch('file:///etc/passwd').valid, false);
  assert.equal(validateUrlForFetch('ftp://example.com').valid, false);
  assert.equal(validateUrlForFetch('javascript:alert(1)').valid, false);
  assert.equal(validateUrlForFetch('http://127.0.0.1:8080').valid, false);

  const valid = validateUrlForFetch('https://google.com');
  assert.equal(valid.valid, true);
  assert.equal(valid.normalizedUrl, 'https://google.com/');
});

test('3. Signal Extraction: Parses SEO, Mobile, and Conversion signals from HTML', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Apex Dental Clinic - Austin TX</title>
        <meta name="description" content="Leading family and cosmetic dental care in South Austin.">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="canonical" href="https://apexdental.com">
      </head>
      <body>
        <h1>Welcome to Apex Dental</h1>
        <h2>Our Services</h2>
        <a href="tel:(512) 555-0199">Call (512) 555-0199</a>
        <a href="mailto:info@apexdental.com">Email Us</a>
        <a href="https://calendly.com/apex-dental/booking" class="btn btn-primary">Book Appointment</a>
        <a href="https://instagram.com/apexdental">Instagram</a>
      </body>
    </html>
  `;

  const seo = extractSeoSignals(sampleHtml);
  assert.equal(seo.hasTitle, true);
  assert.equal(seo.title, 'Apex Dental Clinic - Austin TX');
  assert.equal(seo.hasMetaDescription, true);
  assert.equal(seo.hasViewport, true);
  assert.equal(seo.hasH1, true);

  const mobile = extractMobileSignals(sampleHtml);
  assert.equal(mobile.hasViewportMeta, true);
  assert.equal(mobile.hasObviousFixedWidth, false);

  const conversion = extractConversionSignals(sampleHtml);
  assert.equal(conversion.hasPhone, true);
  assert.equal(conversion.hasEmail, true);
  assert.equal(conversion.hasBookingOrAppointment, true);
  assert.equal(conversion.hasSocialLinks, true);
  assert.ok(conversion.socialPlatforms.includes('Instagram'));
});

test('4. Deterministic Website Scoring: Scores quality between 0 and 100', () => {
  const mockSignals: WebsiteSignals = {
    url: 'https://example.com',
    finalUrl: 'https://example.com',
    reachable: true,
    statusCode: 200,
    security: { isHttps: true, hasHttpsRedirect: true, hasMixedContent: false },
    seo: {
      hasTitle: true,
      titleLength: 35,
      hasMetaDescription: true,
      metaDescriptionLength: 100,
      hasViewport: true,
      hasCanonical: true,
      hasRobotsMeta: false,
      h1Count: 1,
      h2Count: 3,
      hasH1: true,
    },
    mobile: { hasViewportMeta: true, hasResponsiveIndicators: true, hasObviousFixedWidth: false },
    conversion: {
      hasPhone: true,
      detectedPhones: ['+1 512 555 1234'],
      hasEmail: true,
      detectedEmails: ['info@example.com'],
      hasContactPageOrLink: true,
      hasBookingOrAppointment: true,
      hasContactForm: true,
      hasClearCta: true,
      hasSocialLinks: true,
      socialPlatforms: ['Facebook'],
    },
    performance: {
      loadTimeMs: 800,
      pageSizeBytes: 50000,
      imageCount: 5,
      brokenImageCount: 0,
      hasLargePageSize: false,
      isSlow: false,
    },
  };

  const result = calculateWebsiteScore(mockSignals);
  assert.ok(result.qualityScore >= 80, `Expected high quality score >= 80, got ${result.qualityScore}`);
  assert.equal(result.penalties.length, 0);
});

test('5. No-Website Scenario: Highly rated business without website yields VERY_HIGH lead score', () => {
  const noWebBiz: Business = {
    googlePlaceId: 'ChIJ_no_web_1',
    name: 'Sharma Dental Clinic',
    category: 'Dentist',
    address: 'Kanpur, UP',
    rating: 4.8,
    reviewCount: 350,
    hasWebsite: false,
  };

  const strength = calculateBusinessStrengthScore(noWebBiz);
  assert.ok(strength >= 45, `Expected strength >= 45, got ${strength}`);

  const oppScore = calculateWebsiteOpportunityScore(noWebBiz);
  assert.equal(oppScore, 50, 'No website must yield max 50 opportunity points');

  const leadResult = computeLeadScore(noWebBiz);
  assert.ok(leadResult.score >= 90, `Expected score >= 90, got ${leadResult.score}`);
  assert.equal(leadResult.opportunityLevel, 'VERY_HIGH');
  assert.ok(leadResult.reasons.some((r) => r.includes('No website listed')));
});

test('6. Opportunity Classification Thresholds', () => {
  assert.equal(classifyOpportunityLevel(95), 'VERY_HIGH');
  assert.equal(classifyOpportunityLevel(90), 'VERY_HIGH');
  assert.equal(classifyOpportunityLevel(85), 'HIGH');
  assert.equal(classifyOpportunityLevel(75), 'HIGH');
  assert.equal(classifyOpportunityLevel(60), 'MEDIUM');
  assert.equal(classifyOpportunityLevel(45), 'LOW');
});

test('7. AI Fallback & Deterministic Consistency', async () => {
  const biz: Business = {
    googlePlaceId: 'ChIJ_fallback_test',
    name: 'Kanpur Auto Repair',
    category: 'Auto Repair',
    address: 'Kanpur, UP',
    rating: 4.5,
    reviewCount: 150,
    hasWebsite: false,
  };

  const leadScore = computeLeadScore(biz);
  const aiResult = await interpretLeadWithAi({
    business: biz,
    breakdown: leadScore.breakdown,
    deterministicReasons: leadScore.reasons,
    deterministicServices: leadScore.recommendedServices,
  });

  assert.ok(aiResult.aiSummary.length > 0);
  assert.ok(aiResult.reasons.length > 0);
  assert.ok(aiResult.recommendedServices.length > 0);
});
