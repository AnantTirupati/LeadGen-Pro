import { NextRequest, NextResponse } from 'next/server';
import { searchGooglePlaces, GooglePlacesError } from '@/lib/google/places';
import { upsertBusinessesToSupabase, recordSearchToSupabase } from '@/lib/supabase/db';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { location, industry, limit, pageToken } = body;

    // 1. Validation
    if (!location || typeof location !== 'string' || location.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Location is required (min 2 characters).' },
        { status: 400 }
      );
    }

    if (!industry || typeof industry !== 'string' || industry.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Industry category is required.' },
        { status: 400 }
      );
    }

    const parsedLimit = typeof limit === 'number' ? limit : parseInt(limit, 10);
    const validatedLimit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(parsedLimit, 20);

    const cleanLocation = location.trim();
    const cleanIndustry = industry.trim();
    const cleanPageToken =
      typeof pageToken === 'string' && pageToken.trim().length > 0
        ? pageToken.trim()
        : undefined;

    // 2. Fetch from Google Places service with pagination support
    const result = await searchGooglePlaces({
      location: cleanLocation,
      industry: cleanIndustry,
      limit: validatedLimit,
      pageToken: cleanPageToken,
    });

    // 3. Upsert newly discovered businesses to Supabase
    await upsertBusinessesToSupabase(result.businesses);

    // Only record a search entry for the initial search (Page 1)
    if (!cleanPageToken) {
      await recordSearchToSupabase(
        cleanLocation,
        cleanIndustry,
        result.businesses.length,
        user?.id
      );
    }

    // 4. Return normalized results with pagination metadata
    return NextResponse.json({
      success: true,
      count: result.businesses.length,
      location: cleanLocation,
      industry: cleanIndustry,
      businesses: result.businesses,
      nextPageToken: result.nextPageToken,
      hasMore: result.hasMore,
    });
  } catch (error: unknown) {
    if (error instanceof GooglePlacesError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    console.error('[Search API Unhandled Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while searching for businesses. Please try again.',
      },
      { status: 500 }
    );
  }
}
