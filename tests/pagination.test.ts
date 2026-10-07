import assert from 'node:assert/strict';
import test from 'node:test';
import { searchGooglePlaces, GooglePlacesError } from '../lib/google/places';

test('1. Google Places Pagination: Page 1 returns 20 businesses and nextPageToken', async () => {
  process.env.USE_MOCK_PLACES = 'true';

  const page1 = await searchGooglePlaces({
    location: 'Kanpur',
    industry: 'Restaurants',
    limit: 20,
  });

  assert.equal(page1.businesses.length, 20, 'Page 1 should contain exactly 20 businesses');
  assert.equal(page1.hasMore, true, 'Page 1 should indicate more results are available');
  assert.equal(page1.nextPageToken, 'mock-page-2', 'Page 1 should return token for page 2');
  assert.ok(page1.businesses[0].googlePlaceId.startsWith('mock-place-p1-'), 'Page 1 IDs should match p1 pattern');
});

test('2. Google Places Pagination: Page 2 returns subsequent 20 unique businesses', async () => {
  process.env.USE_MOCK_PLACES = 'true';

  const page1 = await searchGooglePlaces({
    location: 'Kanpur',
    industry: 'Restaurants',
    limit: 20,
  });

  const page2 = await searchGooglePlaces({
    location: 'Kanpur',
    industry: 'Restaurants',
    limit: 20,
    pageToken: page1.nextPageToken,
  });

  assert.equal(page2.businesses.length, 20, 'Page 2 should contain exactly 20 businesses');
  assert.equal(page2.hasMore, true, 'Page 2 should indicate more results are available');
  assert.equal(page2.nextPageToken, 'mock-page-3', 'Page 2 should return token for page 3');
  assert.ok(page2.businesses[0].googlePlaceId.startsWith('mock-place-p2-'), 'Page 2 IDs should match p2 pattern');

  // Verify none of page 2's place IDs overlap with page 1
  const page1Ids = new Set(page1.businesses.map((b) => b.googlePlaceId));
  for (const b of page2.businesses) {
    assert.equal(page1Ids.has(b.googlePlaceId), false, `Place ID ${b.googlePlaceId} should not duplicate page 1`);
  }
});

test('3. Google Places Pagination: Page 3 reaches the end of available results', async () => {
  process.env.USE_MOCK_PLACES = 'true';

  const page3 = await searchGooglePlaces({
    location: 'Kanpur',
    industry: 'Restaurants',
    limit: 20,
    pageToken: 'mock-page-3',
  });

  assert.equal(page3.businesses.length, 20, 'Page 3 should contain 20 businesses');
  assert.equal(page3.hasMore, false, 'Page 3 should indicate no further pages are available');
  assert.equal(page3.nextPageToken, undefined, 'Page 3 should have undefined nextPageToken');
});

test('4. Google Places Pagination: Total multi-page accumulation has 60 unique businesses', async () => {
  process.env.USE_MOCK_PLACES = 'true';

  const page1 = await searchGooglePlaces({ location: 'Austin, TX', industry: 'Dentists' });
  const page2 = await searchGooglePlaces({ location: 'Austin, TX', industry: 'Dentists', pageToken: page1.nextPageToken });
  const page3 = await searchGooglePlaces({ location: 'Austin, TX', industry: 'Dentists', pageToken: page2.nextPageToken });

  const allBusinesses = [...page1.businesses, ...page2.businesses, ...page3.businesses];
  assert.equal(allBusinesses.length, 60, 'Combined 3 pages should have 60 businesses');

  const uniquePlaceIds = new Set(allBusinesses.map((b) => b.googlePlaceId));
  assert.equal(uniquePlaceIds.size, 60, 'All 60 accumulated businesses must have unique Google Place IDs');
});

test('5. Google Places Error: Handles unconfigured state when mock is disabled and no key', async () => {
  delete process.env.USE_MOCK_PLACES;
  const originalKey = process.env.GOOGLE_MAPS_API_KEY;
  delete process.env.GOOGLE_MAPS_API_KEY;

  try {
    await searchGooglePlaces({ location: 'Patna', industry: 'Gyms' });
    assert.fail('Should have thrown GooglePlacesError');
  } catch (err: any) {
    assert.ok(err instanceof GooglePlacesError);
    assert.equal(err.code, 'NOT_CONFIGURED');
    assert.equal(err.statusCode, 503);
  } finally {
    if (originalKey) process.env.GOOGLE_MAPS_API_KEY = originalKey;
  }
});
