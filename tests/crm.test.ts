import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePitchOutput, safeParsePitchOutput } from '../lib/sales/schema';
import { buildPitchPrompt, SALES_PITCH_SYSTEM_PROMPT } from '../lib/sales/prompts';
import { generateSalesPitch, generateDeterministicSalesPitch } from '../lib/sales/pitch-generator';
import { LeadStatus, LEAD_STATUS_CONFIG, PitchGenerationInput } from '../lib/sales/types';
import {
  saveLeadInDb,
  getSavedLeadsFromDb,
  updateLeadStatusInDb,
  updateLeadNotesInDb,
  saveSalesPitchInDb,
  updateSalesPitchInDb,
  getPitchHistoryFromDb,
  getActivityTimelineFromDb,
  getCrmStatsFromDb,
  unsaveLeadInDb,
} from '../lib/supabase/crm';

const mockLeadInput: PitchGenerationInput = {
  business: {
    googlePlaceId: 'ChIJ_test_sharma_dental',
    name: 'Sharma Dental Clinic',
    category: 'Dental Clinic',
    address: 'Kanpur, UP',
    rating: 4.6,
    reviewCount: 812,
    website: 'https://sharmadental.example.com',
    hasWebsite: true,
  },
  leadScore: {
    businessId: 'ChIJ_test_sharma_dental',
    businessName: 'Sharma Dental Clinic',
    score: 91,
    opportunityLevel: 'VERY_HIGH',
    breakdown: {
      businessStrengthScore: 46,
      websiteOpportunityScore: 45,
      overallScore: 91,
      opportunityLevel: 'VERY_HIGH',
    },
    reasons: [
      'Weak mobile experience with non-responsive layout indicators',
      'Missing online appointment scheduling or clear conversion CTA',
      'High local reputation with 812 reviews and 4.6 star rating',
    ],
    recommendedServices: [
      'Complete Modern Website Redesign',
      'Mobile UX Optimization',
      'Online Patient Booking System',
    ],
    aiSummary: 'Strong local business with a high-rated reputation but weak mobile conversion experience.',
    hasWebsite: true,
    analyzedAt: new Date().toISOString(),
  },
  senderName: 'Alex',
};

test('1. AI Pitch Output Schema Validation: Accepts valid structured JSON', () => {
  const validOutput = {
    subject: 'Quick idea for Sharma Dental Clinic',
    body: 'Hi Sharma Dental Clinic,\n\nI came across your clinic while looking at top dental practices in Kanpur...',
    personalizationPoints: [
      '812 Google reviews with 4.6 rating',
      'Mobile UX optimization potential',
      'Online appointment booking integration',
    ],
  };

  const validated = validatePitchOutput(validOutput);
  assert.ok(validated);
  assert.equal(validated?.subject, validOutput.subject);
  assert.equal(validated?.body, validOutput.body);
  assert.equal(validated?.personalizationPoints?.length, 3);
});

test('2. AI Pitch Output Schema Validation: Rejects missing or invalid fields', () => {
  assert.equal(validatePitchOutput({ subject: 'Incomplete' }), null);
  assert.equal(validatePitchOutput(null), null);
  assert.equal(validatePitchOutput('not an object'), null);
  assert.equal(validatePitchOutput({ subject: '', body: 'Some body' }), null);
  assert.equal(validatePitchOutput({ subject: 'Valid', body: '' }), null);

  const parsed = safeParsePitchOutput('Invalid JSON String');
  assert.equal(parsed, null);
});

test('3. AI Pitch System Prompt & Anti-Injection Rules', () => {
  const prompt = buildPitchPrompt(mockLeadInput);

  // Checks prompt constraints
  assert.ok(prompt.includes('Sharma Dental Clinic'));
  assert.ok(prompt.includes('812'));
  assert.ok(prompt.includes('4.6'));
  assert.ok(prompt.includes('Respond ONLY with valid JSON'));

  // System instructions must enforce human tone and forbid hallucinations
  assert.ok(SALES_PITCH_SYSTEM_PROMPT.includes('80 to 150 words'));
  assert.ok(SALES_PITCH_SYSTEM_PROMPT.includes('STRICT ANTI-HALLUCINATION'));
  assert.ok(SALES_PITCH_SYSTEM_PROMPT.includes('UNTRUSTED'));
});

test('4. Deterministic Pitch Generator: Generates grounded pitch without hallucinations', () => {
  const pitch = generateDeterministicSalesPitch(mockLeadInput);

  assert.ok(pitch.subject.length > 5);
  assert.ok(pitch.subject.includes('Sharma Dental Clinic'));
  assert.ok(pitch.body.includes('Sharma Dental Clinic'));
  assert.ok(pitch.personalizationPoints.length >= 2);
});

test('5. Lead Status Pipeline Definitions & Labels', () => {
  const expectedStatuses: LeadStatus[] = [
    'NEW',
    'CONTACTED',
    'REPLIED',
    'INTERESTED',
    'PROPOSAL_SENT',
    'WON',
    'LOST',
  ];

  for (const st of expectedStatuses) {
    assert.ok(LEAD_STATUS_CONFIG[st]);
    assert.ok(LEAD_STATUS_CONFIG[st].label.length > 0);
    assert.ok(LEAD_STATUS_CONFIG[st].color.length > 0);
  }
});

test('6. CRM Database / Memory Store: Save Lead and prevent duplicate saves', async () => {
  const saveResult = await saveLeadInDb({
    businessId: 'test_biz_100',
    business: {
      googlePlaceId: 'test_biz_100',
      name: 'Alpha Cafe',
      category: 'Cafe',
      address: 'Austin, TX',
      rating: 4.7,
      reviewCount: 120,
      hasWebsite: false,
    },
    status: 'NEW',
    notes: 'Initial discovery note',
  });

  assert.ok(saveResult.id);
  assert.equal(saveResult.businessId, 'test_biz_100');
  assert.equal(saveResult.status, 'NEW');

  // Second save should update/return existing without throwing
  const secondSave = await saveLeadInDb({
    businessId: 'test_biz_100',
    status: 'CONTACTED',
  });

  assert.equal(secondSave.id, saveResult.id);
  assert.equal(secondSave.status, 'CONTACTED');
});

test('7. CRM Database: Status Changes and Activity Timeline Creation', async () => {
  const leadId = 'test_biz_status_tracker';
  await saveLeadInDb({
    businessId: leadId,
    business: {
      googlePlaceId: leadId,
      name: 'Status Test Store',
      category: 'Store',
      address: 'City',
      hasWebsite: true,
    },
    status: 'NEW',
  });

  const updated = await updateLeadStatusInDb(leadId, 'INTERESTED');
  assert.ok(updated);
  assert.equal(updated.status, 'INTERESTED');

  const activities = await getActivityTimelineFromDb(leadId);
  assert.ok(activities.length > 0);
  assert.ok(activities.some((a) => a.activityType === 'STATUS_CHANGED' && a.content.includes('INTERESTED')));
});

test('8. CRM Database: Notes Logging', async () => {
  const leadId = 'test_biz_notes_tracker';
  await saveLeadInDb({
    businessId: leadId,
    status: 'NEW',
  });

  const noteContent = 'Spoke with founder on Thursday. Requested pricing options.';
  const updated = await updateLeadNotesInDb(leadId, noteContent);
  assert.ok(updated);
  assert.ok(updated.notes?.includes(noteContent));

  const activities = await getActivityTimelineFromDb(leadId);
  assert.ok(activities.some((a) => a.activityType === 'NOTE' && a.content === noteContent));
});

test('9. CRM Database: Pitch Storage, Editing, and Pitch History', async () => {
  const leadId = 'test_biz_pitch_tracker';
  await saveLeadInDb({
    businessId: leadId,
    status: 'NEW',
  });

  const pitch1 = await saveSalesPitchInDb({
    savedLeadId: leadId,
    pitchType: 'INITIAL_OUTREACH',
    subject: 'Idea for your store',
    body: 'Initial AI pitch body',
    aiModel: 'gemini-1.5-flash',
    personalizationPoints: ['Observation 1', 'Observation 2'],
  });

  assert.ok(pitch1.id);
  assert.equal(pitch1.subject, 'Idea for your store');

  // Edit pitch
  const edited = await updateSalesPitchInDb(leadId, pitch1.id, {
    subject: 'Updated Idea for your store',
    body: 'Custom edited body text',
  });

  assert.ok(edited);
  assert.equal(edited.subject, 'Updated Idea for your store');
  assert.equal(edited.body, 'Custom edited body text');

  // Verify pitch history
  const history = await getPitchHistoryFromDb(leadId);
  assert.ok(history.length >= 1);
  assert.equal(history[0].id, pitch1.id);
});

test('10. CRM KPI Stats Calculation', async () => {
  const stats = await getCrmStatsFromDb();
  assert.ok(typeof stats.totalLeads === 'number');
  assert.ok(typeof stats.newLeads === 'number');
  assert.ok(typeof stats.contacted === 'number');
  assert.ok(typeof stats.interested === 'number');
  assert.ok(typeof stats.won === 'number');
});

test('11. Lead Removal / Unsave', async () => {
  const leadId = 'test_biz_to_delete';
  await saveLeadInDb({
    businessId: leadId,
    status: 'NEW',
  });

  const deleted = await unsaveLeadInDb(leadId);
  assert.equal(deleted, true);

  const leads = await getSavedLeadsFromDb();
  assert.equal(leads.some((l) => l.id === leadId || l.businessId === leadId), false);
});

test('12. Bookmark Direct Save: Saves lead with full metadata directly without requiring audit', async () => {
  const bookmarkBiz = {
    googlePlaceId: 'mock_place_bookmark_101',
    name: 'Patna Fitness Center',
    category: 'Gym',
    address: 'Boring Road, Patna',
    phone: '+91 612 123 4567',
    website: 'https://patnafitness.example.com',
    rating: 4.8,
    reviewCount: 350,
    googleMapsUrl: 'https://maps.google.com/?q=Patna+Fitness',
    hasWebsite: true,
  };

  const savedLead = await saveLeadInDb({
    businessId: bookmarkBiz.googlePlaceId,
    business: bookmarkBiz,
    status: 'NEW',
    userId: 'user_test_bookmark_owner',
  });

  assert.ok(savedLead.id, 'Should generate a valid lead ID');
  assert.equal(savedLead.businessId, 'mock_place_bookmark_101');
  assert.equal(savedLead.status, 'NEW');
  assert.equal(savedLead.business?.name, 'Patna Fitness Center');
  assert.equal(savedLead.business?.address, 'Boring Road, Patna');

  // Verify lead appears in saved list
  const userLeads = await getSavedLeadsFromDb({ userId: 'user_test_bookmark_owner' });
  const found = userLeads.find((l) => l.businessId === 'mock_place_bookmark_101');
  assert.ok(found, 'Saved lead must appear in user saved leads query');
  assert.equal(found?.business?.name, 'Patna Fitness Center');
});

test('13. Bookmark Deduplication: Re-saving an already bookmarked lead does not duplicate', async () => {
  const bookmarkBiz = {
    googlePlaceId: 'mock_place_bookmark_dedup',
    name: 'Royal Bakery',
    category: 'Bakery',
    address: 'Main St',
    hasWebsite: false,
  };

  const save1 = await saveLeadInDb({
    businessId: bookmarkBiz.googlePlaceId,
    business: bookmarkBiz,
    status: 'NEW',
    userId: 'user_dedup_test',
  });

  const save2 = await saveLeadInDb({
    businessId: bookmarkBiz.googlePlaceId,
    business: bookmarkBiz,
    status: 'NEW',
    userId: 'user_dedup_test',
  });

  assert.equal(save1.id, save2.id, 'Duplicate saves must return the same SavedLead record ID');
});

