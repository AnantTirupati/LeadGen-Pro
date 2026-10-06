import { safeFetchWebsite } from './fetcher';
import { extractSeoSignals } from './seo';
import { extractMobileSignals } from './mobile';
import { extractSecuritySignals } from './security';
import { extractPerformanceSignals } from './performance';
import { extractConversionSignals } from './conversion';
import { calculateWebsiteScore } from './scoring';
import { WebsiteAnalysisResult, WebsiteSignals } from './types';

/**
 * Analyzes a website URL and extracts structured technical, SEO, mobile, and conversion signals
 */
export async function analyzeWebsite(url: string): Promise<WebsiteAnalysisResult> {
  const fetchResult = await safeFetchWebsite(url);
  const html = fetchResult.html || '';

  const seo = extractSeoSignals(html);
  const mobile = extractMobileSignals(html);
  const security = extractSecuritySignals(fetchResult.isHttps, fetchResult.hasHttpsRedirect, html);
  const performance = extractPerformanceSignals(fetchResult.loadTimeMs, fetchResult.pageSizeBytes, html);
  const conversion = extractConversionSignals(html);

  const signals: WebsiteSignals = {
    url,
    finalUrl: fetchResult.finalUrl,
    reachable: fetchResult.reachable,
    statusCode: fetchResult.statusCode,
    security,
    seo,
    mobile,
    conversion,
    performance,
  };

  const { qualityScore, categoryScores, penalties, strengths } = calculateWebsiteScore(signals);

  return {
    url,
    reachable: fetchResult.reachable,
    statusCode: fetchResult.statusCode,
    loadTimeMs: fetchResult.loadTimeMs,
    pageSizeBytes: fetchResult.pageSizeBytes,
    qualityScore,
    categoryScores,
    signals,
    penalties,
    strengths,
    analyzedAt: new Date().toISOString(),
  };
}
