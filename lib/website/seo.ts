import { WebsiteSeoSignals } from './types';

/**
 * Extracts SEO signals from raw HTML
 */
export function extractSeoSignals(html: string): WebsiteSeoSignals {
  if (!html) {
    return {
      hasTitle: false,
      titleLength: 0,
      hasMetaDescription: false,
      metaDescriptionLength: 0,
      hasViewport: false,
      hasCanonical: false,
      hasRobotsMeta: false,
      h1Count: 0,
      h2Count: 0,
      hasH1: false,
    };
  }

  // 1. Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;
  const hasTitle = Boolean(title && title.length > 0);
  const titleLength = title ? title.length : 0;

  // 2. Meta Description
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const metaDescription = descMatch ? descMatch[1].trim() : undefined;
  const hasMetaDescription = Boolean(metaDescription && metaDescription.length > 0);
  const metaDescriptionLength = metaDescription ? metaDescription.length : 0;

  // 3. Viewport Meta
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);

  // 4. Canonical
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1].trim() : undefined;
  const hasCanonical = Boolean(canonicalUrl);

  // 5. Robots
  const hasRobotsMeta = /<meta[^>]+name=["']robots["']/i.test(html);

  // 6. Heading structure (H1 / H2)
  const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi) || [];

  return {
    hasTitle,
    title,
    titleLength,
    hasMetaDescription,
    metaDescription,
    metaDescriptionLength,
    hasViewport,
    hasCanonical,
    canonicalUrl,
    hasRobotsMeta,
    h1Count: h1Matches.length,
    h2Count: h2Matches.length,
    hasH1: h1Matches.length > 0,
  };
}
