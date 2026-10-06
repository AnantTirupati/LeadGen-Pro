import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Creates a Supabase client for Server Components, Server Actions, Route Handlers, and DB operations.
 * Reads/writes auth session cookies using next/headers when in Next.js request context.
 * Falls back to standard client when running in standalone or test environments.
 */
export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignored if called from a Server Component
          }
        },
      },
    });
  } catch {
    // Fallback if running outside of Next request context (e.g. tests)
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    }) as any;
  }
}
