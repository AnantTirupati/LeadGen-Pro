/**
 * Safe Server-Side Website Fetcher with Strict SSRF Protection
 */

const MAX_RESPONSE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB limit
const FETCH_TIMEOUT_MS = 7000; // 7 seconds strict timeout
const MAX_REDIRECTS = 3;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 LeadGenPro-Analyzer/1.0';

export interface SafeFetchResult {
  reachable: boolean;
  statusCode?: number;
  html?: string;
  finalUrl: string;
  loadTimeMs: number;
  pageSizeBytes: number;
  isHttps: boolean;
  hasHttpsRedirect: boolean;
  error?: string;
}

/**
 * Checks if a hostname or IP address is private, local, or unsafe (SSRF Protection)
 */
export function isUnsafeHostOrIp(hostname: string): boolean {
  if (!hostname) return true;

  const normalized = hostname.toLowerCase().trim();

  // 1. Direct local names
  if (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    normalized === 'localhost.localdomain' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal') ||
    normalized.endsWith('.lan') ||
    normalized.endsWith('.test') ||
    normalized.endsWith('.invalid')
  ) {
    return true;
  }

  // 2. IPv4 Range Checks
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = normalized.match(ipv4Regex);
  if (match) {
    const [, a, b, c, d] = match.map(Number);
    if (a > 255 || b > 255 || c > 255 || d > 255) return true;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;
    // 10.0.0.0/8 (Private network)
    if (a === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata service e.g. 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12 (Private network: 172.16.0.0 to 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private network)
    if (a === 192 && b === 168) return true;
    // 100.64.0.0/10 (Carrier grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // Broadcast & Multicast
    if (a >= 224) return true;
  }

  // 3. IPv6 Checks (simplified)
  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    const v6 = normalized.slice(1, -1);
    if (
      v6 === '::1' ||
      v6.startsWith('fc') ||
      v6.startsWith('fd') ||
      v6.startsWith('fe80')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a target URL against protocol and SSRF constraints
 */
export function validateUrlForFetch(rawUrl: string): { valid: boolean; normalizedUrl?: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Empty URL provided.' };
  }

  const trimmed = rawUrl.trim();

  // Reject non-http/https protocols explicitly if a protocol is specified
  if (/^[a-zA-Z0-9+-.]+:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return { valid: false, error: 'Disallowed protocol.' };
  }

  let formatted = trimmed;
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = `https://${formatted}`;
  }

  try {
    const parsed = new URL(formatted);

    // Only allow http: and https: protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: `Disallowed protocol: ${parsed.protocol}` };
    }

    if (isUnsafeHostOrIp(parsed.hostname)) {
      return { valid: false, error: `Forbidden target host: ${parsed.hostname}` };
    }

    return { valid: true, normalizedUrl: parsed.toString() };
  } catch {
    return { valid: false, error: 'Invalid URL syntax.' };
  }
}

/**
 * Safely fetches a business website homepage with timeout and size limits
 */
export async function safeFetchWebsite(rawUrl: string): Promise<SafeFetchResult> {
  const validation = validateUrlForFetch(rawUrl);
  if (!validation.valid || !validation.normalizedUrl) {
    return {
      reachable: false,
      finalUrl: rawUrl,
      loadTimeMs: 0,
      pageSizeBytes: 0,
      isHttps: false,
      hasHttpsRedirect: false,
      error: validation.error || 'Invalid URL',
    };
  }

  let currentUrl = validation.normalizedUrl;
  const initialIsHttps = currentUrl.startsWith('https://');
  let redirectCount = 0;
  const startTime = Date.now();

  while (redirectCount <= MAX_REDIRECTS) {
    const urlValidation = validateUrlForFetch(currentUrl);
    if (!urlValidation.valid || !urlValidation.normalizedUrl) {
      return {
        reachable: false,
        finalUrl: currentUrl,
        loadTimeMs: Date.now() - startTime,
        pageSizeBytes: 0,
        isHttps: false,
        hasHttpsRedirect: false,
        error: `SSRF Violation on redirect: ${urlValidation.error}`,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
        },
        redirect: 'manual', // Manually handle redirects to inspect and validate each location
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle Redirects (301, 302, 303, 307, 308)
      if (
        response.status >= 300 &&
        response.status < 400 &&
        response.headers.get('location')
      ) {
        redirectCount++;
        const locationHeader = response.headers.get('location')!;
        const nextUrl = new URL(locationHeader, currentUrl).toString();
        currentUrl = nextUrl;
        continue;
      }

      const statusCode = response.status;
      const isHttps = currentUrl.startsWith('https://');
      const hasHttpsRedirect = !initialIsHttps && isHttps;

      if (!response.ok && statusCode >= 400) {
        return {
          reachable: false,
          statusCode,
          finalUrl: currentUrl,
          loadTimeMs: Date.now() - startTime,
          pageSizeBytes: 0,
          isHttps,
          hasHttpsRedirect,
          error: `HTTP ${statusCode}`,
        };
      }

      // Check content-type
      const contentType = response.headers.get('content-type') || '';
      if (
        !contentType.includes('text/html') &&
        !contentType.includes('application/xhtml+xml') &&
        !contentType.includes('text/plain')
      ) {
        // Not HTML (e.g. PDF or binary)
        return {
          reachable: true,
          statusCode,
          finalUrl: currentUrl,
          loadTimeMs: Date.now() - startTime,
          pageSizeBytes: 0,
          isHttps,
          hasHttpsRedirect,
          html: '',
        };
      }

      // Read response body with byte limit
      const arrayBuffer = await response.arrayBuffer();
      const loadTimeMs = Date.now() - startTime;
      const pageSizeBytes = arrayBuffer.byteLength;

      const trimmedBuffer = arrayBuffer.slice(0, MAX_RESPONSE_SIZE_BYTES);
      const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
      const html = decoder.decode(trimmedBuffer);

      return {
        reachable: true,
        statusCode,
        finalUrl: currentUrl,
        loadTimeMs,
        pageSizeBytes,
        isHttps,
        hasHttpsRedirect,
        html,
      };
    } catch (err: unknown) {
      const loadTimeMs = Date.now() - startTime;
      const isTimeout =
        err instanceof Error &&
        (err.name === 'AbortError' || err.name === 'TimeoutError');

      return {
        reachable: false,
        finalUrl: currentUrl,
        loadTimeMs,
        pageSizeBytes: 0,
        isHttps: currentUrl.startsWith('https://'),
        hasHttpsRedirect: false,
        error: isTimeout ? 'Connection timed out' : 'Unable to connect to website host',
      };
    }
  }

  return {
    reachable: false,
    finalUrl: currentUrl,
    loadTimeMs: Date.now() - startTime,
    pageSizeBytes: 0,
    isHttps: false,
    hasHttpsRedirect: false,
    error: 'Too many redirects',
  };
}
