import { GooglePlaceRaw } from './types';
import { Business } from '@/types';

/**
 * Clean and format human-readable category name from raw Google Places category/types
 */
export function formatCategory(place: GooglePlaceRaw, fallbackIndustry?: string): string {
  if (place.primaryTypeDisplayName?.text) {
    return place.primaryTypeDisplayName.text;
  }
  if (place.primaryType) {
    return place.primaryType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  if (place.types && place.types.length > 0) {
    const validTypes = place.types.filter(
      (t) => !['point_of_interest', 'establishment'].includes(t)
    );
    if (validTypes.length > 0) {
      return validTypes[0]
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }
  }
  return fallbackIndustry || 'Local Business';
}

/**
 * Normalizes a single Google Places raw record into our internal Business model
 */
export function normalizeGooglePlace(
  place: GooglePlaceRaw,
  fallbackIndustry?: string
): Business | null {
  if (!place || !place.id) {
    return null;
  }

  const name = place.displayName?.text?.trim() || 'Unknown Business';
  const category = formatCategory(place, fallbackIndustry);
  const address = place.formattedAddress?.trim() || 'Address not available';
  const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || undefined;
  const website = place.websiteUri?.trim() || undefined;
  const rating = typeof place.rating === 'number' ? place.rating : undefined;
  const reviewCount = typeof place.userRatingCount === 'number' ? place.userRatingCount : 0;
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;
  const googleMapsUrl = place.googleMapsUri || undefined;
  const businessStatus = place.businessStatus || 'OPERATIONAL';
  const hasWebsite = Boolean(website && website.length > 0);

  return {
    googlePlaceId: place.id,
    name,
    category,
    address,
    phone,
    website,
    rating,
    reviewCount,
    latitude,
    longitude,
    googleMapsUrl,
    businessStatus,
    hasWebsite,
  };
}

/**
 * Normalizes an array of Google Place items and removes duplicates by place ID
 */
export function normalizeGooglePlaces(
  places: GooglePlaceRaw[] | undefined | null,
  fallbackIndustry?: string
): Business[] {
  if (!places || !Array.isArray(places)) {
    return [];
  }

  const seenIds = new Set<string>();
  const normalizedList: Business[] = [];

  for (const rawPlace of places) {
    const business = normalizeGooglePlace(rawPlace, fallbackIndustry);
    if (business && !seenIds.has(business.googlePlaceId)) {
      seenIds.add(business.googlePlaceId);
      normalizedList.push(business);
    }
  }

  return normalizedList;
}
