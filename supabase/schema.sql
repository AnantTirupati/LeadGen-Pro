-- ===================================================
-- LeadGen Pro — Database Schema & RLS (Phases 1–6)
-- ===================================================

-- 1. Profiles Table (Connected to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_profile_user_id UNIQUE (user_id)
);

-- Trigger to automatically create a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Businesses Table (Google Places Discovery)
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating NUMERIC(3, 2),
  review_count INTEGER DEFAULT 0,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  google_maps_url TEXT,
  business_status TEXT DEFAULT 'OPERATIONAL',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Searches Table (Query Tracking)
CREATE TABLE IF NOT EXISTS public.searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  location TEXT NOT NULL,
  industry TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Website Analysis Table (Phase 3 Technical Signals)
CREATE TABLE IF NOT EXISTS public.website_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  reachable BOOLEAN NOT NULL DEFAULT false,
  status_code INTEGER,
  https BOOLEAN DEFAULT false,
  load_time_ms INTEGER DEFAULT 0,
  page_size_bytes INTEGER DEFAULT 0,
  has_viewport BOOLEAN DEFAULT false,
  has_title BOOLEAN DEFAULT false,
  has_meta_description BOOLEAN DEFAULT false,
  has_canonical BOOLEAN DEFAULT false,
  has_h1 BOOLEAN DEFAULT false,
  has_contact_info BOOLEAN DEFAULT false,
  has_phone BOOLEAN DEFAULT false,
  has_email BOOLEAN DEFAULT false,
  has_booking BOOLEAN DEFAULT false,
  has_cta BOOLEAN DEFAULT false,
  has_social_links BOOLEAN DEFAULT false,
  website_quality_score INTEGER NOT NULL DEFAULT 0,
  analysis_data JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Lead Scores Table (Phase 3 Lead Intelligence)
CREATE TABLE IF NOT EXISTS public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL DEFAULT 0,
  opportunity_level TEXT NOT NULL CHECK (opportunity_level IN ('VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW')),
  business_strength_score INTEGER NOT NULL DEFAULT 0,
  website_opportunity_score INTEGER NOT NULL DEFAULT 0,
  reasons JSONB,
  recommended_services JSONB,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Saved Leads CRM Table (Phase 4 & 5 Pipeline + Outreach Contact)
CREATE TABLE IF NOT EXISTS public.saved_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'REPLIED', 'INTERESTED', 'PROPOSAL_SENT', 'WON', 'LOST')),
  notes TEXT,
  contact_email TEXT,
  contact_name TEXT,
  follow_up_at TIMESTAMPTZ,
  follow_up_status TEXT NOT NULL DEFAULT 'NONE' CHECK (follow_up_status IN ('NONE', 'SCHEDULED', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_business UNIQUE (user_id, business_id)
);

-- 7. Sales Pitches Table (Phase 4 AI Pitches)
CREATE TABLE IF NOT EXISTS public.sales_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_lead_id UUID NOT NULL REFERENCES public.saved_leads(id) ON DELETE CASCADE,
  pitch_type TEXT NOT NULL DEFAULT 'INITIAL_OUTREACH',
  subject TEXT,
  body TEXT NOT NULL,
  personalization_points JSONB,
  ai_model TEXT,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Lead Activities Table (Phase 4 & 5 Activity Timeline)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_lead_id UUID NOT NULL REFERENCES public.saved_leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('NOTE', 'EMAIL_SENT', 'MESSAGE_SENT', 'CALL', 'STATUS_CHANGED', 'PITCH_GENERATED')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Lead Emails Table (Phase 5 Email Outreach)
CREATE TABLE IF NOT EXISTS public.lead_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_lead_id UUID NOT NULL REFERENCES public.saved_leads(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED')),
  provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Email Events Table (Phase 5 Webhook Delivery Tracking)
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_email_id UUID NOT NULL REFERENCES public.lead_emails(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('SENT', 'DELIVERED', 'BOUNCED', 'FAILED', 'COMPLAINED')),
  provider_event_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for Fast Queries and Foreign Key Joins
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_place_id ON public.businesses (google_place_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses (category);
CREATE INDEX IF NOT EXISTS idx_saved_leads_user_id ON public.saved_leads (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_leads_biz_id ON public.saved_leads (business_id);
CREATE INDEX IF NOT EXISTS idx_saved_leads_status ON public.saved_leads (status);
CREATE INDEX IF NOT EXISTS idx_saved_leads_follow_up ON public.saved_leads (follow_up_at, follow_up_status);
CREATE INDEX IF NOT EXISTS idx_sales_pitches_lead_id ON public.sales_pitches (saved_lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities (saved_lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON public.lead_activities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_emails_lead_id ON public.lead_emails (saved_lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_emails_provider_id ON public.lead_emails (provider_message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_lead_email_id ON public.email_events (lead_email_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ───

-- 1. Profiles: Users can view and update only their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Businesses: Publicly readable discovery data
CREATE POLICY "Allow public read on businesses"
  ON public.businesses FOR SELECT
  USING (true);

CREATE POLICY "Allow insert/upsert on businesses"
  ON public.businesses FOR ALL
  USING (true);

-- 3. Searches: Logged in users or anonymous searches
CREATE POLICY "Users can read their searches"
  ON public.searches FOR SELECT
  USING (auth.uid() IS NULL OR user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can record searches"
  ON public.searches FOR INSERT
  WITH CHECK (auth.uid() IS NULL OR user_id IS NULL OR auth.uid() = user_id);

-- 4. Website Analysis & Lead Scores: Shared analysis caches
CREATE POLICY "Allow all on website_analysis"
  ON public.website_analysis FOR ALL
  USING (true);

CREATE POLICY "Allow all on lead_scores"
  ON public.lead_scores FOR ALL
  USING (true);

-- 5. Saved Leads: Strict User Ownership
CREATE POLICY "Users can manage their saved leads"
  ON public.saved_leads FOR ALL
  USING (
    auth.uid() IS NULL OR user_id IS NULL OR auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IS NULL OR user_id IS NULL OR auth.uid() = user_id
  );

-- 6. Sales Pitches: Tied to User's Saved Leads
CREATE POLICY "Users can manage pitches for their leads"
  ON public.sales_pitches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_leads
      WHERE public.saved_leads.id = sales_pitches.saved_lead_id
      AND (auth.uid() IS NULL OR saved_leads.user_id IS NULL OR saved_leads.user_id = auth.uid())
    )
  );

-- 7. Lead Activities: Tied to User's Saved Leads
CREATE POLICY "Users can manage activities for their leads"
  ON public.lead_activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_leads
      WHERE public.saved_leads.id = lead_activities.saved_lead_id
      AND (auth.uid() IS NULL OR saved_leads.user_id IS NULL OR saved_leads.user_id = auth.uid())
    )
  );

-- 8. Lead Emails: Tied to User's Saved Leads
CREATE POLICY "Users can manage emails for their leads"
  ON public.lead_emails FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_leads
      WHERE public.saved_leads.id = lead_emails.saved_lead_id
      AND (auth.uid() IS NULL OR saved_leads.user_id IS NULL OR saved_leads.user_id = auth.uid())
    )
  );

-- 9. Email Events: Tied to User's Emails
CREATE POLICY "Users can view email events for their emails"
  ON public.email_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lead_emails
      JOIN public.saved_leads ON public.saved_leads.id = lead_emails.saved_lead_id
      WHERE public.lead_emails.id = email_events.lead_email_id
      AND (auth.uid() IS NULL OR saved_leads.user_id IS NULL OR saved_leads.user_id = auth.uid())
    )
  );
