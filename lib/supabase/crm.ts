import { createServerSupabaseClient } from './server';
import { Business } from '@/types';
import {
  SavedLead,
  LeadStatus,
  SalesPitch,
  LeadActivity,
  LeadCrmStats,
} from '../sales/types';
import { LeadScoreResult } from '../leads/types';
import { WebsiteAnalysisResult } from '../website/types';

// In-Memory fallback store for testing and offline development
const memSavedLeads = new Map<string, SavedLead>();
const memPitches = new Map<string, SalesPitch[]>();
const memActivities = new Map<string, LeadActivity[]>();

/**
 * Saves a business as a tracked lead in the CRM
 */
export async function saveLeadInDb(params: {
  businessId: string;
  business?: Business;
  status?: LeadStatus;
  notes?: string;
  userId?: string | null;
}): Promise<SavedLead> {
  const { businessId, business, status = 'NEW', notes, userId } = params;
  const now = new Date().toISOString();
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      if (business) {
        await supabase.from('businesses').upsert(
          {
            google_place_id: business.googlePlaceId || businessId,
            name: business.name,
            category: business.category,
            address: business.address,
            phone: business.phone || null,
            website: business.website || null,
            rating: business.rating ?? null,
            review_count: business.reviewCount ?? 0,
            google_maps_url: business.googleMapsUrl || null,
            updated_at: now,
          },
          { onConflict: 'google_place_id' }
        );
      }

      const { data: savedRow, error } = await supabase
        .from('saved_leads')
        .upsert(
          {
            user_id: userId || null,
            business_id: businessId,
            status,
            notes: notes || null,
            updated_at: now,
          },
          { onConflict: 'user_id,business_id' }
        )
        .select('*')
        .single();

      if (!error && savedRow) {
        await supabase.from('lead_activities').insert({
          saved_lead_id: (savedRow as any).id,
          activity_type: 'STATUS_CHANGED',
          content: `Lead saved to CRM with initial status: ${status}`,
          created_at: now,
        });

        const record: SavedLead = {
          id: (savedRow as any).id,
          userId: (savedRow as any).user_id,
          businessId: (savedRow as any).business_id,
          status: (savedRow as any).status as LeadStatus,
          notes: (savedRow as any).notes,
          business,
          createdAt: (savedRow as any).created_at,
          updatedAt: (savedRow as any).updated_at,
        };

        memSavedLeads.set(record.id, record);
        memSavedLeads.set(businessId, record);
        return record;
      }
    } catch (err) {
      // Fall through to memory
    }
  }

  // In-Memory Fallback
  const existing = Array.from(memSavedLeads.values()).find(
    (l) => l.businessId === businessId || l.id === businessId
  );

  if (existing) {
    existing.status = status || existing.status;
    if (notes) existing.notes = notes;
    if (business) existing.business = business;
    existing.updatedAt = now;
    memSavedLeads.set(existing.id, existing);
    memSavedLeads.set(businessId, existing);
    return existing;
  }

  const newId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newLead: SavedLead = {
    id: newId,
    userId: userId || null,
    businessId,
    status,
    notes: notes || null,
    business,
    createdAt: now,
    updatedAt: now,
  };

  memSavedLeads.set(newId, newLead);
  memSavedLeads.set(businessId, newLead);

  const initialAct: LeadActivity = {
    id: `act_${Date.now()}`,
    savedLeadId: newId,
    activityType: 'STATUS_CHANGED',
    content: `Lead saved to CRM with initial status: ${status}`,
    createdAt: now,
  };
  memActivities.set(newId, [initialAct]);
  memActivities.set(businessId, [initialAct]);

  return newLead;
}

/**
 * Removes a business from saved leads
 */
export async function unsaveLeadInDb(
  businessIdOrSavedLeadId: string,
  userId?: string | null
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  let deletedFromDb = false;

  if (supabase && businessIdOrSavedLeadId) {
    try {
      let query = supabase.from('saved_leads').delete();
      if (businessIdOrSavedLeadId.includes('-') && businessIdOrSavedLeadId.length === 36) {
        query = query.eq('id', businessIdOrSavedLeadId);
      } else {
        query = query.eq('business_id', businessIdOrSavedLeadId);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { error } = await query;
      deletedFromDb = !error;
    } catch {
      deletedFromDb = false;
    }
  }

  let foundKey: string | null = null;
  for (const [key, val] of memSavedLeads.entries()) {
    if (val.id === businessIdOrSavedLeadId || val.businessId === businessIdOrSavedLeadId) {
      foundKey = key;
      memSavedLeads.delete(key);
      memSavedLeads.delete(val.id);
      memSavedLeads.delete(val.businessId);
      break;
    }
  }

  return deletedFromDb || Boolean(foundKey);
}

/**
 * Retrieves saved leads joined with businesses and scores
 */
export async function getSavedLeadsFromDb(params?: {
  userId?: string | null;
  status?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}): Promise<SavedLead[]> {
  const supabase = await createServerSupabaseClient();
  const { userId, status, limit = 50, offset = 0 } = params || {};

  if (supabase) {
    try {
      let query = supabase
        .from('saved_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (status && status !== 'ALL' && status !== 'all') {
        query = query.eq('status', status.toUpperCase());
      }

      const { data: savedRows, error } = await query;
      if (!error && savedRows && (savedRows as any[]).length > 0) {
        const rowsList = savedRows as any[];
        const businessIds = rowsList.map((r: any) => r.business_id);

        const [bizRes, scoreRes, webRes] = await Promise.all([
          supabase.from('businesses').select('*').in('google_place_id', businessIds),
          supabase.from('lead_scores').select('*').in('business_id', businessIds),
          supabase.from('website_analysis').select('*').in('business_id', businessIds),
        ]);

        const bizMap = new Map((bizRes.data as any[] || []).map((b: any) => [b.google_place_id, b]));
        const scoreMap = new Map((scoreRes.data as any[] || []).map((s: any) => [s.business_id, s]));
        const webMap = new Map((webRes.data as any[] || []).map((w: any) => [w.business_id, w]));

        return rowsList.map((row: any) => {
          const rawBiz: any = bizMap.get(row.business_id);
          const rawScore: any = scoreMap.get(row.business_id);
          const rawWeb: any = webMap.get(row.business_id);

          const business: Business | undefined = rawBiz
            ? {
                id: rawBiz.id,
                googlePlaceId: rawBiz.google_place_id,
                name: rawBiz.name,
                category: rawBiz.category,
                address: rawBiz.address,
                phone: rawBiz.phone,
                website: rawBiz.website,
                rating: rawBiz.rating ? Number(rawBiz.rating) : undefined,
                reviewCount: rawBiz.review_count,
                googleMapsUrl: rawBiz.google_maps_url,
                businessStatus: rawBiz.business_status,
                hasWebsite: Boolean(rawBiz.website),
              }
            : undefined;

          const leadScore: LeadScoreResult | undefined = rawScore
            ? {
                businessId: row.business_id,
                businessName: business?.name || '',
                score: rawScore.score,
                opportunityLevel: rawScore.opportunity_level,
                breakdown: {
                  businessStrengthScore: rawScore.business_strength_score,
                  websiteOpportunityScore: rawScore.website_opportunity_score,
                  overallScore: rawScore.score,
                  opportunityLevel: rawScore.opportunity_level,
                },
                reasons: Array.isArray(rawScore.reasons) ? rawScore.reasons : [],
                recommendedServices: Array.isArray(rawScore.recommended_services)
                  ? rawScore.recommended_services
                  : [],
                aiSummary: rawScore.ai_summary,
                hasWebsite: Boolean(business?.website),
                analyzedAt: rawScore.updated_at,
              }
            : undefined;

          const websiteAnalysis: WebsiteAnalysisResult | undefined = rawWeb?.analysis_data;

          return {
            id: row.id,
            userId: row.user_id,
            businessId: row.business_id,
            status: row.status as LeadStatus,
            notes: row.notes,
            contactEmail: row.contact_email,
            contactName: row.contact_name,
            followUpAt: row.follow_up_at,
            followUpStatus: row.follow_up_status || 'NONE',
            business,
            leadScore,
            websiteAnalysis,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });
      }
    } catch (err) {
      // Fall through to memory
    }
  }

  // In-Memory Fallback
  let list = Array.from(
    new Map(Array.from(memSavedLeads.values()).map((l) => [l.id, l])).values()
  );

  if (userId) {
    list = list.filter((l) => !l.userId || l.userId === userId);
  }

  if (status && status !== 'ALL' && status !== 'all') {
    list = list.filter((l) => l.status === status.toUpperCase());
  }

  return list.slice(offset, offset + limit);
}

/**
 * Updates lead status and logs activity
 */
export async function updateLeadStatusInDb(
  savedLeadIdOrBizId: string,
  newStatus: LeadStatus,
  userId?: string | null
): Promise<SavedLead | null> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      let query = supabase
        .from('saved_leads')
        .update({ status: newStatus, updated_at: now });

      if (savedLeadIdOrBizId.includes('-') && savedLeadIdOrBizId.length === 36) {
        query = query.eq('id', savedLeadIdOrBizId);
      } else {
        query = query.eq('business_id', savedLeadIdOrBizId);
      }

      if (userId) query = query.eq('user_id', userId);

      const { data, error } = await query.select('*').single();
      if (!error && data) {
        await supabase.from('lead_activities').insert({
          saved_lead_id: (data as any).id,
          activity_type: 'STATUS_CHANGED',
          content: `Status updated to ${newStatus}`,
          created_at: now,
        });

        const updated: SavedLead = {
          id: (data as any).id,
          userId: (data as any).user_id,
          businessId: (data as any).business_id,
          status: (data as any).status as LeadStatus,
          notes: (data as any).notes,
          createdAt: (data as any).created_at,
          updatedAt: (data as any).updated_at,
        };
        memSavedLeads.set((data as any).id, updated);
        memSavedLeads.set((data as any).business_id, updated);
        return updated;
      }
    } catch (err) {
      // Fall through to memory
    }
  }

  // In-memory fallback
  const lead = Array.from(memSavedLeads.values()).find(
    (l) => l.id === savedLeadIdOrBizId || l.businessId === savedLeadIdOrBizId
  );
  if (lead) {
    lead.status = newStatus;
    lead.updatedAt = now;
    memSavedLeads.set(lead.id, lead);
    memSavedLeads.set(lead.businessId, lead);

    const act: LeadActivity = {
      id: `act_${Date.now()}`,
      savedLeadId: lead.id,
      activityType: 'STATUS_CHANGED',
      content: `Status updated to ${newStatus}`,
      createdAt: now,
    };
    const prevActs = memActivities.get(lead.id) || [];
    memActivities.set(lead.id, [act, ...prevActs]);
    memActivities.set(lead.businessId, [act, ...prevActs]);
    return lead;
  }

  return null;
}

/**
 * Updates notes and logs activity
 */
export async function updateLeadNotesInDb(
  savedLeadIdOrBizId: string,
  notes: string,
  userId?: string | null
): Promise<SavedLead | null> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      let query = supabase
        .from('saved_leads')
        .update({ notes, updated_at: now });

      if (savedLeadIdOrBizId.includes('-') && savedLeadIdOrBizId.length === 36) {
        query = query.eq('id', savedLeadIdOrBizId);
      } else {
        query = query.eq('business_id', savedLeadIdOrBizId);
      }

      if (userId) query = query.eq('user_id', userId);

      const { data, error } = await query.select('*').single();
      if (!error && data) {
        await supabase.from('lead_activities').insert({
          saved_lead_id: (data as any).id,
          activity_type: 'NOTE',
          content: notes.length > 80 ? `${notes.slice(0, 80)}...` : notes,
          created_at: now,
        });

        const updated: SavedLead = {
          id: (data as any).id,
          userId: (data as any).user_id,
          businessId: (data as any).business_id,
          status: (data as any).status as LeadStatus,
          notes: (data as any).notes,
          createdAt: (data as any).created_at,
          updatedAt: (data as any).updated_at,
        };
        memSavedLeads.set((data as any).id, updated);
        memSavedLeads.set((data as any).business_id, updated);
        return updated;
      }
    } catch (err) {
      // Fall through to memory
    }
  }

  // In-memory fallback
  const lead = Array.from(memSavedLeads.values()).find(
    (l) => l.id === savedLeadIdOrBizId || l.businessId === savedLeadIdOrBizId
  );
  if (lead) {
    lead.notes = notes;
    lead.updatedAt = now;
    memSavedLeads.set(lead.id, lead);
    memSavedLeads.set(lead.businessId, lead);

    const act: LeadActivity = {
      id: `act_${Date.now()}`,
      savedLeadId: lead.id,
      activityType: 'NOTE',
      content: notes,
      createdAt: now,
    };
    const prevActs = memActivities.get(lead.id) || [];
    memActivities.set(lead.id, [act, ...prevActs]);
    memActivities.set(lead.businessId, [act, ...prevActs]);
    return lead;
  }

  return null;
}

/**
 * Saves a generated or edited sales pitch
 */
export async function saveSalesPitchInDb(params: {
  savedLeadId: string;
  pitchType?: 'INITIAL_OUTREACH' | 'FOLLOW_UP' | 'AUDIT_PROPOSAL';
  subject: string;
  body: string;
  aiModel?: string;
  personalizationPoints?: string[];
}): Promise<SalesPitch> {
  const { savedLeadId, pitchType = 'INITIAL_OUTREACH', subject, body, aiModel, personalizationPoints } = params;
  const now = new Date().toISOString();
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      const { data: savedPitch, error } = await supabase
        .from('sales_pitches')
        .insert({
          saved_lead_id: savedLeadId,
          pitch_type: pitchType,
          subject,
          body,
          personalization_points: personalizationPoints,
          ai_model: aiModel || 'gemini-1.5-flash',
          is_edited: false,
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single();

      if (!error && savedPitch) {
        await supabase.from('lead_activities').insert({
          saved_lead_id: savedLeadId,
          activity_type: 'PITCH_GENERATED',
          content: `Generated AI sales pitch: "${subject}"`,
          created_at: now,
        });

        const res: SalesPitch = {
          id: (savedPitch as any).id,
          savedLeadId: (savedPitch as any).saved_lead_id,
          pitchType: (savedPitch as any).pitch_type,
          subject: (savedPitch as any).subject,
          body: (savedPitch as any).body,
          personalizationPoints: (savedPitch as any).personalization_points,
          aiModel: (savedPitch as any).ai_model,
          isEdited: (savedPitch as any).is_edited,
          createdAt: (savedPitch as any).created_at,
          updatedAt: (savedPitch as any).updated_at,
        };

        const existing = memPitches.get(savedLeadId) || [];
        memPitches.set(savedLeadId, [res, ...existing]);
        return res;
      }
    } catch (err) {
      // Fall through to memory
    }
  }

  // In-Memory Fallback
  const newPitchId = `pitch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const pitch: SalesPitch = {
    id: newPitchId,
    savedLeadId,
    pitchType,
    subject,
    body,
    personalizationPoints,
    aiModel: aiModel || 'gemini-1.5-flash',
    isEdited: false,
    createdAt: now,
    updatedAt: now,
  };

  const existingPitches = memPitches.get(savedLeadId) || [];
  memPitches.set(savedLeadId, [pitch, ...existingPitches]);

  const act: LeadActivity = {
    id: `act_${Date.now()}`,
    savedLeadId,
    activityType: 'PITCH_GENERATED',
    content: `Generated AI sales pitch: "${subject}"`,
    createdAt: now,
  };
  const prevActs = memActivities.get(savedLeadId) || [];
  memActivities.set(savedLeadId, [act, ...prevActs]);

  return pitch;
}

/**
 * Updates an existing sales pitch with manual edits
 */
export async function updateSalesPitchInDb(
  savedLeadId: string,
  pitchId: string,
  updates: { subject?: string; body?: string }
): Promise<SalesPitch | null> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('sales_pitches')
        .update({
          ...updates,
          is_edited: true,
          updated_at: now,
        })
        .eq('id', pitchId)
        .select('*')
        .single();

      if (!error && data) {
        return {
          id: (data as any).id,
          savedLeadId: (data as any).saved_lead_id,
          pitchType: (data as any).pitch_type,
          subject: (data as any).subject,
          body: (data as any).body,
          personalizationPoints: (data as any).personalization_points,
          aiModel: (data as any).ai_model,
          isEdited: (data as any).is_edited,
          createdAt: (data as any).created_at,
          updatedAt: (data as any).updated_at,
        };
      }
    } catch (err) {
      // Fall through to memory
    }
  }

  // In-Memory Fallback
  const list = memPitches.get(savedLeadId) || [];
  const target = list.find((p) => p.id === pitchId);
  if (target) {
    if (updates.subject !== undefined) target.subject = updates.subject;
    if (updates.body !== undefined) target.body = updates.body;
    target.isEdited = true;
    target.updatedAt = now;
    return target;
  }

  return null;
}

/**
 * Retrieves pitch history for a lead
 */
export async function getPitchHistoryFromDb(savedLeadId: string): Promise<SalesPitch[]> {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      const { data: pitches, error } = await supabase
        .from('sales_pitches')
        .select('*')
        .eq('saved_lead_id', savedLeadId)
        .order('created_at', { ascending: false });

      if (!error && pitches && (pitches as any[]).length > 0) {
        return (pitches as any[]).map((p: any) => ({
          id: p.id,
          savedLeadId: p.saved_lead_id,
          pitchType: p.pitch_type,
          subject: p.subject,
          body: p.body,
          personalizationPoints: p.personalization_points,
          aiModel: p.ai_model,
          isEdited: p.is_edited,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
      }
    } catch (err) {
      // Fall through to memory
    }
  }

  return memPitches.get(savedLeadId) || [];
}

/**
 * Retrieves activity timeline for a lead
 */
export async function getActivityTimelineFromDb(savedLeadId: string): Promise<LeadActivity[]> {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      const { data: activities, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('saved_lead_id', savedLeadId)
        .order('created_at', { ascending: false });

      if (!error && activities && (activities as any[]).length > 0) {
        return (activities as any[]).map((a: any) => ({
          id: a.id,
          savedLeadId: a.saved_lead_id,
          activityType: a.activity_type,
          content: a.content,
          createdAt: a.created_at,
        }));
      }
    } catch (err) {
      // Fall through to memory
    }
  }

  return memActivities.get(savedLeadId) || [];
}

/**
 * Calculates real CRM pipeline statistics
 */
export async function getCrmStatsFromDb(userId?: string | null): Promise<LeadCrmStats> {
  const allLeads = await getSavedLeadsFromDb({ userId, limit: 1000 });
  const totalLeads = allLeads.length;

  let newLeads = 0;
  let contacted = 0;
  let replied = 0;
  let interested = 0;
  let proposalSent = 0;
  let won = 0;
  let lost = 0;
  let followUpsDue = 0;

  const now = new Date();

  for (const r of allLeads) {
    switch (r.status) {
      case 'NEW':
        newLeads++;
        break;
      case 'CONTACTED':
        contacted++;
        break;
      case 'REPLIED':
        replied++;
        break;
      case 'INTERESTED':
        interested++;
        break;
      case 'PROPOSAL_SENT':
        proposalSent++;
        break;
      case 'WON':
        won++;
        break;
      case 'LOST':
        lost++;
        break;
    }

    if (
      r.followUpStatus === 'SCHEDULED' &&
      r.followUpAt &&
      new Date(r.followUpAt) <= now
    ) {
      followUpsDue++;
    }
  }

  const conversionRate = totalLeads >= 3 ? `${Math.round((won / totalLeads) * 100)}%` : '--';

  return {
    totalLeads,
    newLeads,
    contacted,
    replied,
    interested,
    proposalSent,
    won,
    lost,
    followUpsDue,
    emailsSent: contacted + proposalSent,
    delivered: contacted,
    bounced: 0,
    conversionRate,
  };
}
