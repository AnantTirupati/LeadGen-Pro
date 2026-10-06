/**
 * Website Analysis & Signal Contracts
 */

export interface WebsiteSecuritySignals {
  isHttps: boolean;
  hasHttpsRedirect: boolean;
  hasMixedContent: boolean;
}

export interface WebsiteSeoSignals {
  hasTitle: boolean;
  title?: string;
  titleLength: number;
  hasMetaDescription: boolean;
  metaDescription?: string;
  metaDescriptionLength: number;
  hasViewport: boolean;
  hasCanonical: boolean;
  canonicalUrl?: string;
  hasRobotsMeta: boolean;
  h1Count: number;
  h2Count: number;
  hasH1: boolean;
}

export interface WebsiteMobileSignals {
  hasViewportMeta: boolean;
  viewportContent?: string;
  hasResponsiveIndicators: boolean;
  hasObviousFixedWidth: boolean;
}

export interface WebsiteConversionSignals {
  hasPhone: boolean;
  detectedPhones: string[];
  hasEmail: boolean;
  detectedEmails: string[];
  hasContactPageOrLink: boolean;
  hasBookingOrAppointment: boolean;
  hasContactForm: boolean;
  hasClearCta: boolean;
  hasSocialLinks: boolean;
  socialPlatforms: string[];
}

export interface WebsitePerformanceSignals {
  loadTimeMs: number;
  pageSizeBytes: number;
  imageCount: number;
  brokenImageCount: number;
  hasLargePageSize: boolean;
  isSlow: boolean;
}

export interface WebsiteSignals {
  url: string;
  finalUrl: string;
  reachable: boolean;
  statusCode?: number;
  security: WebsiteSecuritySignals;
  seo: WebsiteSeoSignals;
  mobile: WebsiteMobileSignals;
  conversion: WebsiteConversionSignals;
  performance: WebsitePerformanceSignals;
}

export interface WebsiteCategoryScores {
  performance: number; // 0 - 20
  mobileReadiness: number; // 0 - 20
  seoBasics: number; // 0 - 15
  conversionReadiness: number; // 0 - 20
  security: number; // 0 - 10
  contentAndBusiness: number; // 0 - 15
}

export interface WebsiteAnalysisResult {
  url: string;
  reachable: boolean;
  statusCode?: number;
  loadTimeMs?: number;
  pageSizeBytes?: number;
  qualityScore: number; // 0 - 100
  categoryScores: WebsiteCategoryScores;
  signals: WebsiteSignals;
  penalties: string[];
  strengths: string[];
  analyzedAt: string;
}
