import {
  GoogleSearchPlacesParams,
  GooglePlacesSearchTextResponse,
  GooglePlaceRaw,
  GoogleSearchPlacesResult,
} from './types';
import { normalizeGooglePlaces } from './normalize';

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';

// Minimally required field mask with nextPageToken for pagination
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.primaryTypeDisplayName',
  'places.primaryType',
  'places.types',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.location',
  'places.googleMapsUri',
  'places.businessStatus',
  'nextPageToken',
].join(',');

export class GooglePlacesError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code:
      | 'NOT_CONFIGURED'
      | 'QUOTA_EXCEEDED'
      | 'INVALID_KEY'
      | 'INVALID_PAGE_TOKEN'
      | 'API_ERROR'
      | 'NETWORK_ERROR' = 'API_ERROR'
  ) {
    super(message);
    this.name = 'GooglePlacesError';
  }
}

/**
 * Mock business name prefixes and streets for generating realistic pagination data
 */
const MOCK_PREFIXES = [
  'Apex', 'Royal', 'Grand', 'Summit', 'Prime', 'Elite', 'Metro', 'Pinnacle',
  'Starlight', 'Vanguard', 'Precision', 'Heritage', 'Nexus', 'Horizon', 'Infinity',
  'Titan', 'Zenith', 'Silver', 'Golden', 'Benchmark', 'Diamond', 'Crown', 'Radiant',
  'Bliss', 'Nova', 'Crest', 'Beacon', 'Sovereign', 'Prestige', 'Ascent', 'Paramount',
  'Pioneer', 'Catalyst', 'Frontier', 'Olympus', 'Trillium', 'Empower', 'Stellar',
  'Velocity', 'Solace', 'Signature', 'Sterling', 'Sentry', 'Matrix', 'Atlas',
  'Prosper', 'Genesis', 'Venture', 'Harbor', 'TrueNorth', 'Optima', 'Meridian',
  'Capital', 'Unity', 'Liberty', 'Civic', 'Imperial', 'Galaxy', 'Radiance', 'Solstice'
];

const MOCK_STREETS = [
  'Central Blvd', 'Mall Road', 'Swaroop Nagar', 'Civil Lines', 'Gumti No. 5',
  'MG Road', 'Park Street', 'Ring Road', 'Station Road', 'Connaught Circle',
  'Commerce Ave', 'Grand Trunk Rd', 'High Street', 'Market Square', 'Greenway Lane'
];

/**
 * Isolated mock provider for local development and testing when USE_MOCK_PLACES=true
 * Generates 3 pages of 20 unique businesses (60 total) with realistic data and tokens
 */
function getMockPlacesPage(
  location: string,
  industry: string,
  pageToken?: string
): { places: GooglePlaceRaw[]; nextPageToken?: string; hasMore: boolean } {
  let pageNum = 1;
  if (pageToken === 'mock-page-2') pageNum = 2;
  else if (pageToken === 'mock-page-3') pageNum = 3;

  const pageSize = 20;
  const startIndex = (pageNum - 1) * pageSize;
  const places: GooglePlaceRaw[] = [];

  for (let i = 0; i < pageSize; i++) {
    const globalIndex = startIndex + i;
    const prefix = MOCK_PREFIXES[globalIndex % MOCK_PREFIXES.length];
    const street = MOCK_STREETS[globalIndex % MOCK_STREETS.length];
    const streetNum = 10 + (globalIndex * 7) % 300;
    
    // Distribute realistic website availability: ~40% have no website or poor website
    const hasWeb = globalIndex % 3 !== 0;
    const websiteUri = hasWeb ? `https://${prefix.toLowerCase()}-${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}-demo.com` : undefined;
    const rating = Math.round((3.8 + ((globalIndex * 13) % 12) / 10) * 10) / 10;
    const userRatingCount = 15 + ((globalIndex * 37) % 450);

    places.push({
      id: `mock-place-p${pageNum}-${i + 1}`,
      displayName: { text: `${prefix} ${industry || 'Business'}` },
      primaryTypeDisplayName: { text: industry || 'Local Business' },
      formattedAddress: `${streetNum} ${street}, ${location}`,
      nationalPhoneNumber: `+91 512 ${(1000 + (globalIndex * 111)) % 9000} ${5000 + globalIndex}`,
      websiteUri,
      rating,
      userRatingCount,
      location: {
        latitude: 26.4499 + (globalIndex * 0.003),
        longitude: 80.3319 + (globalIndex * 0.003),
      },
      googleMapsUri: `https://maps.google.com/?q=${encodeURIComponent(`${prefix} ${industry} ${location}`)}`,
      businessStatus: 'OPERATIONAL',
    });
  }

  let nextPageToken: string | undefined;
  if (pageNum === 1) {
    nextPageToken = 'mock-page-2';
  } else if (pageNum === 2) {
    nextPageToken = 'mock-page-3';
  } else {
    nextPageToken = undefined;
  }

  return {
    places,
    nextPageToken,
    hasMore: Boolean(nextPageToken),
  };
}

/**
 * Executes a location-aware search on Google Places API (New) with pagination support
 */
export async function searchGooglePlaces(
  params: GoogleSearchPlacesParams
): Promise<GoogleSearchPlacesResult> {
  const { location, industry, limit = 20, pageToken } = params;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  const useMock = process.env.USE_MOCK_PLACES === 'true';

  // 1. Mock Mode (explicitly opted in for development / testing)
  if (useMock) {
    const mockData = getMockPlacesPage(location, industry, pageToken);
    const businesses = normalizeGooglePlaces(mockData.places, industry);
    return {
      businesses: businesses.slice(0, limit),
      nextPageToken: mockData.nextPageToken,
      hasMore: mockData.hasMore,
    };
  }

  // 2. Configuration Validation
  if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
    throw new GooglePlacesError(
      'Google Places API is not configured.',
      503,
      'NOT_CONFIGURED'
    );
  }

  // 3. Construct Search Query & Request Payload
  const textQuery = `${industry.trim()} in ${location.trim()}`;
  const maxPageSize = Math.min(Math.max(limit, 1), 20); // Places API New max is 20 per page

  const requestBody: Record<string, unknown> = {
    textQuery,
    pageSize: maxPageSize,
  };

  if (pageToken && pageToken.trim().length > 0) {
    requestBody.pageToken = pageToken.trim();
  }

  try {
    const response = await fetch(PLACES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(12000), // 12s timeout
    });

    if (!response.ok) {
      const status = response.status;
      let errorBody: { error?: { message?: string; status?: string; details?: unknown[] } } = {};
      try {
        errorBody = await response.json();
      } catch {
        // Ignore json parse error
      }

      console.error('[Google Places API Error]', {
        status,
        statusText: response.statusText,
        error: errorBody.error?.message || 'Unknown error',
      });

      if (status === 400) {
        // Check if error is related to invalid/expired page token
        const errorMsg = (errorBody.error?.message || '').toLowerCase();
        if (errorMsg.includes('page token') || errorMsg.includes('pagetoken') || errorMsg.includes('token')) {
          throw new GooglePlacesError(
            'The search page session has expired or is invalid. Please start a new search.',
            400,
            'INVALID_PAGE_TOKEN'
          );
        }
      }

      if (status === 403 || status === 401) {
        throw new GooglePlacesError(
          'Google Places API key is invalid or unauthorized.',
          502,
          'INVALID_KEY'
        );
      }

      if (status === 429) {
        throw new GooglePlacesError(
          'Google Places API quota exceeded. Please try again later.',
          429,
          'QUOTA_EXCEEDED'
        );
      }

      throw new GooglePlacesError(
        errorBody.error?.message || 'Business search is temporarily unavailable. Please try again.',
        502,
        'API_ERROR'
      );
    }

    const data: GooglePlacesSearchTextResponse = await response.json();
    const rawPlaces = data.places || [];
    const businesses = normalizeGooglePlaces(rawPlaces, industry);

    return {
      businesses,
      nextPageToken: data.nextPageToken || undefined,
      hasMore: Boolean(data.nextPageToken && data.nextPageToken.trim().length > 0),
    };
  } catch (error: unknown) {
    if (error instanceof GooglePlacesError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error('[Google Places Timeout]', error.message);
      throw new GooglePlacesError(
        'Search request timed out. Please try again.',
        504,
        'NETWORK_ERROR'
      );
    }

    console.error('[Google Places Unexpected Error]', error);
    throw new GooglePlacesError(
      'Business search is temporarily unavailable. Please try again.',
      502,
      'NETWORK_ERROR'
    );
  }
}
