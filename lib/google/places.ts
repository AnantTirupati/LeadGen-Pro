import { GoogleSearchPlacesParams, GooglePlacesSearchTextResponse, GooglePlaceRaw } from './types';
import { normalizeGooglePlaces } from './normalize';
import { Business } from '@/types';

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';

// Minimally required field mask according to Principle 8
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
].join(',');

export class GooglePlacesError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: 'NOT_CONFIGURED' | 'QUOTA_EXCEEDED' | 'INVALID_KEY' | 'API_ERROR' | 'NETWORK_ERROR' = 'API_ERROR'
  ) {
    super(message);
    this.name = 'GooglePlacesError';
  }
}

/**
 * Isolated mock provider for local development testing when USE_MOCK_PLACES=true
 */
function getMockPlaces(location: string, industry: string, limit: number): GooglePlaceRaw[] {
  const baseMocks: GooglePlaceRaw[] = [
    {
      id: `mock-place-1-${Date.now()}`,
      displayName: { text: `The Grand ${industry || 'Bistro'}` },
      primaryTypeDisplayName: { text: industry || 'Restaurant' },
      formattedAddress: `101 Central Blvd, ${location}`,
      nationalPhoneNumber: '+91 512 234 5678',
      websiteUri: 'https://grandbistro-demo.com',
      rating: 4.8,
      userRatingCount: 342,
      location: { latitude: 26.4499, longitude: 80.3319 },
      googleMapsUri: `https://maps.google.com/?q=${encodeURIComponent(`The Grand ${industry} ${location}`)}`,
      businessStatus: 'OPERATIONAL',
    },
    {
      id: `mock-place-2-${Date.now()}`,
      displayName: { text: `Kanpur ${industry || 'Services'} Co.` },
      primaryTypeDisplayName: { text: industry || 'Contractor' },
      formattedAddress: `24 Swaroop Nagar, ${location}`,
      nationalPhoneNumber: '+91 512 987 6543',
      websiteUri: undefined, // NO WEBSITE DEMO
      rating: 4.4,
      userRatingCount: 88,
      location: { latitude: 26.4725, longitude: 80.3186 },
      googleMapsUri: `https://maps.google.com/?q=${encodeURIComponent(`Kanpur ${industry} Co ${location}`)}`,
      businessStatus: 'OPERATIONAL',
    },
    {
      id: `mock-place-3-${Date.now()}`,
      displayName: { text: `Royal ${industry || 'Hub'} & Lounge` },
      primaryTypeDisplayName: { text: industry || 'Store' },
      formattedAddress: `88 Mall Road, ${location}`,
      nationalPhoneNumber: '+91 512 456 7890',
      websiteUri: 'https://royalhub-example.com',
      rating: 4.6,
      userRatingCount: 156,
      location: { latitude: 26.4658, longitude: 80.3498 },
      googleMapsUri: `https://maps.google.com/?q=${encodeURIComponent(`Royal Hub ${location}`)}`,
      businessStatus: 'OPERATIONAL',
    },
    {
      id: `mock-place-4-${Date.now()}`,
      displayName: { text: `Apex ${industry || 'Solutions'}` },
      primaryTypeDisplayName: { text: industry || 'Professional Services' },
      formattedAddress: `12 Civil Lines, ${location}`,
      nationalPhoneNumber: '+91 512 333 4444',
      websiteUri: undefined, // NO WEBSITE DEMO
      rating: 4.2,
      userRatingCount: 45,
      location: { latitude: 26.4712, longitude: 80.3521 },
      googleMapsUri: `https://maps.google.com/?q=${encodeURIComponent(`Apex Solutions ${location}`)}`,
      businessStatus: 'OPERATIONAL',
    },
    {
      id: `mock-place-5-${Date.now()}`,
      displayName: { text: `Star ${industry || 'Care'}` },
      primaryTypeDisplayName: { text: industry || 'Care' },
      formattedAddress: `55 Gumti No. 5, ${location}`,
      nationalPhoneNumber: '+91 512 888 9999',
      websiteUri: 'https://starcare-demo.org',
      rating: 4.9,
      userRatingCount: 512,
      location: { latitude: 26.481, longitude: 80.312 },
      googleMapsUri: `https://maps.google.com/?q=${encodeURIComponent(`Star Care ${location}`)}`,
      businessStatus: 'OPERATIONAL',
    },
  ];

  return baseMocks.slice(0, limit);
}

/**
 * Executes a location-aware search on Google Places API (New)
 */
export async function searchGooglePlaces(
  params: GoogleSearchPlacesParams
): Promise<Business[]> {
  const { location, industry, limit = 20 } = params;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  const useMock = process.env.USE_MOCK_PLACES === 'true';

  // 1. Mock Mode (explicitly opted in for development)
  if (useMock) {
    const rawMocks = getMockPlaces(location, industry, limit);
    return normalizeGooglePlaces(rawMocks, industry);
  }

  // 2. Configuration Validation
  if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
    throw new GooglePlacesError(
      'Google Places API is not configured.',
      503,
      'NOT_CONFIGURED'
    );
  }

  // 3. Construct Search Query
  const textQuery = `${industry.trim()} in ${location.trim()}`;
  const maxPageSize = Math.min(Math.max(limit, 1), 20); // Places API New max is 20 per page

  try {
    const response = await fetch(PLACES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery,
        pageSize: maxPageSize,
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      const status = response.status;
      let errorBody: { error?: { message?: string; status?: string } } = {};
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
        'Business search is temporarily unavailable. Please try again.',
        502,
        'API_ERROR'
      );
    }

    const data: GooglePlacesSearchTextResponse = await response.json();
    const rawPlaces = data.places || [];

    return normalizeGooglePlaces(rawPlaces, industry);
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
