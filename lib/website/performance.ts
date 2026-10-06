import { WebsitePerformanceSignals } from './types';

/**
 * Extracts Performance signals from fetch timing & HTML payload
 */
export function extractPerformanceSignals(
  loadTimeMs: number,
  pageSizeBytes: number,
  html: string
): WebsitePerformanceSignals {
  if (!html) {
    return {
      loadTimeMs,
      pageSizeBytes,
      imageCount: 0,
      brokenImageCount: 0,
      hasLargePageSize: pageSizeBytes > 1024 * 1024,
      isSlow: loadTimeMs > 2500,
    };
  }

  // Count <img> tags
  const imgMatches = html.match(/<img[^>]+src=["'][^"']*["']/gi) || [];
  const imageCount = imgMatches.length;

  // Check for broken / empty src images
  const brokenImages = html.match(/<img[^>]+src=["']\s*["']/gi) || [];

  return {
    loadTimeMs,
    pageSizeBytes,
    imageCount,
    brokenImageCount: brokenImages.length,
    hasLargePageSize: pageSizeBytes > 1024 * 1024, // > 1MB HTML payload
    isSlow: loadTimeMs > 2500, // > 2.5s initial TTFB/download
  };
}
