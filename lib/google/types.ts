/**
 * Google Places API (New) Types
 */

export interface GooglePlaceLocation {
  latitude: number;
  longitude: number;
}

export interface GooglePlaceDisplayName {
  text: string;
  languageCode?: string;
}

export interface GooglePlacePrimaryTypeDisplayName {
  text: string;
  languageCode?: string;
}

export interface GooglePlaceRaw {
  id: string; // Place ID
  displayName?: GooglePlaceDisplayName;
  primaryTypeDisplayName?: GooglePlacePrimaryTypeDisplayName;
  primaryType?: string;
  types?: string[];
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: GooglePlaceLocation;
  googleMapsUri?: string;
  businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | string;
}

export interface GooglePlacesSearchTextResponse {
  places?: GooglePlaceRaw[];
  nextPageToken?: string;
  errorMessage?: string;
}

export interface GoogleSearchPlacesParams {
  location: string;
  industry: string;
  limit?: number;
  pageToken?: string;
}

export interface GoogleSearchPlacesResult {
  businesses: import('@/types').Business[];
  nextPageToken?: string;
  hasMore: boolean;
}
