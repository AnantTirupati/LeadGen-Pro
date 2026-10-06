import { WebsiteSecuritySignals } from './types';

/**
 * Extracts Security signals from fetch results & HTML
 */
export function extractSecuritySignals(
  isHttps: boolean,
  hasHttpsRedirect: boolean,
  html: string
): WebsiteSecuritySignals {
  if (!html) {
    return {
      isHttps,
      hasHttpsRedirect,
      hasMixedContent: false,
    };
  }

  // Check for insecure mixed content resources when served over HTTPS
  const hasMixedContent =
    isHttps &&
    (/src=["']http:\/\/[^"']+["']/i.test(html) ||
      /href=["']http:\/\/[^"']+\.(css|js)["']/i.test(html));

  return {
    isHttps,
    hasHttpsRedirect,
    hasMixedContent,
  };
}
