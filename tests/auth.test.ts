import assert from 'node:assert/strict';
import test from 'node:test';
import { formatAuthError, UserProfile } from '../lib/supabase/auth';
import { isSupabaseConfigured, createBrowserSupabaseClient } from '../lib/supabase/client';
import { createServerSupabaseClient } from '../lib/supabase/server';
import { saveLeadInDb, getSavedLeadsFromDb, getCrmStatsFromDb } from '../lib/supabase/crm';

test('1. Auth Error Formatter: Formats duplicate user error to friendly message', () => {
  const rawError = { message: 'User already registered' };
  const formatted = formatAuthError(rawError);
  assert.equal(
    formatted,
    'An account with this email address already exists. Please sign in instead.'
  );
});

test('2. Auth Error Formatter: Formats invalid credentials error', () => {
  const rawError = { message: 'Invalid login credentials' };
  const formatted = formatAuthError(rawError);
  assert.equal(
    formatted,
    'Invalid email or password. Please check your credentials and try again.'
  );
});

test('3. Auth Error Formatter: Formats weak password error', () => {
  const rawError = { message: 'Password should be at least 6 characters' };
  const formatted = formatAuthError(rawError);
  assert.equal(formatted, 'Password must be at least 6 characters long.');
});

test('4. Auth Error Formatter: Formats rate limit / too many requests error', () => {
  const rawError = { message: 'Too many requests, please slow down' };
  const formatted = formatAuthError(rawError);
  assert.equal(
    formatted,
    'Too many login attempts. Please wait a moment and try again.'
  );
});

test('5. Auth Error Formatter: Handles unconfirmed email error', () => {
  const rawError = { message: 'Email not confirmed' };
  const formatted = formatAuthError(rawError);
  assert.equal(
    formatted,
    'Please confirm your email address before signing in.'
  );
});

test('6. User Profiles: Data structure validation', () => {
  const profile: UserProfile = {
    id: '11111111-1111-1111-1111-111111111111',
    userId: '22222222-2222-2222-2222-222222222222',
    fullName: 'Alex Rivera',
    email: 'alex@agency.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert.equal(profile.fullName, 'Alex Rivera');
  assert.equal(profile.email, 'alex@agency.com');
  assert.ok(profile.userId.length === 36);
});

test('7. Data Isolation: User A cannot see User B records in CRM queries', async () => {
  const userA = 'user_aaa_11111111-1111-1111-1111-111111111111';
  const userB = 'user_bbb_22222222-2222-2222-2222-222222222222';

  // Save lead for User A
  await saveLeadInDb({
    businessId: 'ChIJ_unique_biz_userA',
    business: {
      googlePlaceId: 'ChIJ_unique_biz_userA',
      name: 'User A Bakery',
      category: 'Bakery',
      address: 'Downtown',
      hasWebsite: true,
    },
    status: 'NEW',
    userId: userA,
  });

  // Save lead for User B
  await saveLeadInDb({
    businessId: 'ChIJ_unique_biz_userB',
    business: {
      googlePlaceId: 'ChIJ_unique_biz_userB',
      name: 'User B Bistro',
      category: 'Restaurant',
      address: 'Uptown',
      hasWebsite: false,
    },
    status: 'WON',
    userId: userB,
  });

  // Query User A leads
  const userALeads = await getSavedLeadsFromDb({ userId: userA });
  const hasUserBLead = userALeads.some((l) => l.businessId === 'ChIJ_unique_biz_userB');
  assert.equal(hasUserBLead, false, 'User A must not see User B leads');

  // Query User B leads
  const userBLeads = await getSavedLeadsFromDb({ userId: userB });
  const hasUserALead = userBLeads.some((l) => l.businessId === 'ChIJ_unique_biz_userA');
  assert.equal(hasUserALead, false, 'User B must not see User A leads');
});

test('8. CRM Stats Isolation: Stats calculation respects user boundary', async () => {
  const userA = 'user_stat_test_a';
  const userB = 'user_stat_test_b';

  await saveLeadInDb({
    businessId: 'ChIJ_stat_lead_1',
    status: 'WON',
    userId: userA,
  });

  const statsA = await getCrmStatsFromDb(userA);
  const statsB = await getCrmStatsFromDb(userB);

  assert.ok(statsA.totalLeads >= 1);
  assert.equal(statsB.won, 0);
});

test('9. Supabase Client Configuration Check', () => {
  const isConfigured = isSupabaseConfigured();
  assert.equal(typeof isConfigured, 'boolean');
});
