import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeGooglePlace, normalizeGooglePlaces, formatCategory } from '../lib/google/normalize';
import { GooglePlaceRaw } from '../lib/google/types';

test('1. Business Normalization: converts Google Place raw object to internal Business structure', () => {
  const rawPlace: GooglePlaceRaw = {
    id: 'ChIJ1234567890',
    displayName: { text: 'Test Bistro & Cafe', languageCode: 'en' },
    primaryTypeDisplayName: { text: 'Italian Restaurant', languageCode: 'en' },
    formattedAddress: '123 Main St, Kanpur, UP, India',
    nationalPhoneNumber: '+91 512 123 4567',
    websiteUri: 'https://testbistro.com',
    rating: 4.6,
    userRatingCount: 120,
    location: { latitude: 26.4499, longitude: 80.3319 },
    googleMapsUri: 'https://maps.google.com/?cid=123',
    businessStatus: 'OPERATIONAL',
  };

  const business = normalizeGooglePlace(rawPlace, 'Restaurants');

  assert.ok(business, 'Should return a valid business object');
  assert.equal(business?.googlePlaceId, 'ChIJ1234567890');
  assert.equal(business?.name, 'Test Bistro & Cafe');
  assert.equal(business?.category, 'Italian Restaurant');
  assert.equal(business?.address, '123 Main St, Kanpur, UP, India');
  assert.equal(business?.phone, '+91 512 123 4567');
  assert.equal(business?.website, 'https://testbistro.com');
  assert.equal(business?.rating, 4.6);
  assert.equal(business?.reviewCount, 120);
  assert.equal(business?.latitude, 26.4499);
  assert.equal(business?.longitude, 80.3319);
  assert.equal(business?.googleMapsUrl, 'https://maps.google.com/?cid=123');
  assert.equal(business?.businessStatus, 'OPERATIONAL');
  assert.equal(business?.hasWebsite, true);
});

test('2. Website Detection: correctly sets hasWebsite false when website is missing', () => {
  const rawPlaceWithoutWebsite: GooglePlaceRaw = {
    id: 'ChIJ9876543210',
    displayName: { text: 'Local Auto Garage' },
    formattedAddress: '45 Swaroop Nagar, Kanpur',
    nationalPhoneNumber: '+91 512 999 8888',
    websiteUri: undefined,
  };

  const business = normalizeGooglePlace(rawPlaceWithoutWebsite, 'Auto Repair');

  assert.ok(business);
  assert.equal(business?.hasWebsite, false);
  assert.equal(business?.website, undefined);
});

test('3. Empty Google Response: returns empty array without throwing', () => {
  assert.deepEqual(normalizeGooglePlaces(null), []);
  assert.deepEqual(normalizeGooglePlaces(undefined), []);
  assert.deepEqual(normalizeGooglePlaces([]), []);
});

test('4. Duplicate Place IDs: removes duplicates from result set', () => {
  const duplicateList: GooglePlaceRaw[] = [
    {
      id: 'place-dup-1',
      displayName: { text: 'Place One' },
      formattedAddress: 'Address 1',
    },
    {
      id: 'place-dup-1', // duplicate ID
      displayName: { text: 'Place One Duplicate' },
      formattedAddress: 'Address 1',
    },
    {
      id: 'place-unique-2',
      displayName: { text: 'Place Two' },
      formattedAddress: 'Address 2',
    },
  ];

  const normalized = normalizeGooglePlaces(duplicateList);
  assert.equal(normalized.length, 2, 'Should only contain 2 unique businesses');
  assert.equal(normalized[0].googlePlaceId, 'place-dup-1');
  assert.equal(normalized[1].googlePlaceId, 'place-unique-2');
});

test('5. Category Formatting fallback', () => {
  const rawWithPrimaryType: GooglePlaceRaw = {
    id: 'p1',
    primaryType: 'dentist',
  };
  assert.equal(formatCategory(rawWithPrimaryType), 'Dentist');

  const rawWithTypes: GooglePlaceRaw = {
    id: 'p2',
    types: ['point_of_interest', 'plumber', 'establishment'],
  };
  assert.equal(formatCategory(rawWithTypes), 'Plumber');

  const rawFallback: GooglePlaceRaw = {
    id: 'p3',
  };
  assert.equal(formatCategory(rawFallback, 'Lawyer'), 'Lawyer');
});
