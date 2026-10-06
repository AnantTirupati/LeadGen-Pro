import { createServerSupabaseClient } from './server';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Gets the current authenticated Supabase user from the server session
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error('[getAuthenticatedUser Error]', err);
    return null;
  }
}

/**
 * Gets the profile for the authenticated user from the profiles table
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name || '',
      email: data.email || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('[getUserProfile Error]', err);
    return null;
  }
}

/**
 * Upserts user profile in public.profiles
 */
export async function upsertUserProfile(params: {
  userId: string;
  fullName: string;
  email: string;
}): Promise<UserProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: params.userId,
          full_name: params.fullName,
          email: params.email,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error || !data) {
      console.error('[upsertUserProfile Error]', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      email: data.email,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('[upsertUserProfile Error]', err);
    return null;
  }
}

/**
 * Maps raw Supabase auth errors into friendly user messages
 */
export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const message = (error.message || error.toString()).toLowerCase();

  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (message.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  if (message.includes('network') || message.includes('fetch failed')) {
    return 'Network connection error. Please verify your internet connection.';
  }

  return error.message || 'Authentication failed. Please try again.';
}
