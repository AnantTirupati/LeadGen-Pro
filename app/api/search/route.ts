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

    const { location, industry, limit } = body;

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
    const validatedLimit = isNaN(parsedLimit) || parsedLimit < 1 ? 25 : Math.min(parsedLimit, 50);

    const cleanLocation = location.trim();
    const cleanIndustry = industry.trim();

    // 2. Fetch from Google Places service
    const businesses = await searchGooglePlaces({
      location: cleanLocation,
      industry: cleanIndustry,
      limit: validatedLimit,
    });

    // 3. Upsert to Supabase in background / non-blocking
    await upsertBusinessesToSupabase(businesses);
    await recordSearchToSupabase(cleanLocation, cleanIndustry, businesses.length, user?.id);

    // 4. Return normalized results
    return NextResponse.json({
      success: true,
      count: businesses.length,
      location: cleanLocation,
      industry: cleanIndustry,
      businesses,
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
