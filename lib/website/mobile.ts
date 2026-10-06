import { WebsiteMobileSignals } from './types';

/**
 * Extracts Mobile friendliness indicators from raw HTML
 */
export function extractMobileSignals(html: string): WebsiteMobileSignals {
  if (!html) {
    return {
      hasViewportMeta: false,
      hasResponsiveIndicators: false,
      hasObviousFixedWidth: true,
    };
  }

  // 1. Viewport Meta tag
  const viewportMatch =
    html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']viewport["']/i);

  const hasViewportMeta = Boolean(viewportMatch);
  const viewportContent = viewportMatch ? viewportMatch[1].trim() : undefined;

  // 2. Responsive CSS indicators in HTML/inline styles
  const hasResponsiveIndicators =
    hasViewportMeta ||
    /@media[^{]+(max-width|min-width)/i.test(html) ||
    /class=["'][^"']*(flex|grid|col-|sm:|md:|lg:|w-full|responsive)[^"']*["']/i.test(html);

  // 3. Obvious fixed-width desktop indicators (e.g. width="980", width: 1024px without media query)
  const hasObviousFixedWidth =
    !hasViewportMeta &&
    (/width=["'](960|980|1024|1200)["']/i.test(html) ||
      /width:\s*(960px|980px|1024px|1200px)/i.test(html) ||
      /<table[^>]+width=["']\d{3,4}["']/i.test(html));

  return {
    hasViewportMeta,
    viewportContent,
    hasResponsiveIndicators,
    hasObviousFixedWidth,
  };
}
