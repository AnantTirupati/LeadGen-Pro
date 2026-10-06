export type OpportunityLevel = 'high' | 'medium' | 'low';

export type WebsiteStatus = 'none' | 'outdated' | 'slow' | 'unresponsive' | 'good';

export interface Business {
  id?: string;
  googlePlaceId: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  businessStatus?: string;
  hasWebsite: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadScore {
  overall: number; // 0 - 100
  opportunityLevel: OpportunityLevel;
  websiteScore?: number;
  seoScore?: number;
  socialPresenceScore?: number;
  reasons?: string[];
}

export interface Lead {
  id: string;
  business_id: string;
  business?: Business;
  score: number;
  opportunity_level: OpportunityLevel;
  website_status: WebsiteStatus;
  notes?: string;
  status?: 'discovered' | 'saved' | 'contacted' | 'qualified' | 'converted' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface Search {
  id: string;
  user_id?: string;
  location: string;
  industry: string;
  results_count: number;
  created_at?: string;
}

export interface DashboardStats {
  businessesFound: number;
  highOpportunity: number;
  savedLeads: number;
  averageLeadScore: number | string;
}

export interface SearchFilters {
  rating: 'all' | '4.0+' | '4.5+';
  website: 'all' | 'has_website' | 'no_website' | 'poor_website' | 'good_website';
  opportunity: 'all' | 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  minScore: 'all' | '90+' | '75+' | '50+';
  sortBy: 'relevance' | 'score' | 'rating' | 'reviews';
}
