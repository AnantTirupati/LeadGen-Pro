import { OpportunityLevel } from './types';

/**
 * Classifies a numeric lead score (0 - 100) into an Opportunity Level
 */
export function classifyOpportunityLevel(score: number): OpportunityLevel {
  if (score >= 90) return 'VERY_HIGH';
  if (score >= 75) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Converts OpportunityLevel to human-readable label and color token
 */
export function getOpportunityBadgeDetails(level: OpportunityLevel): {
  label: string;
  badgeClass: string;
  emoji: string;
} {
  switch (level) {
    case 'VERY_HIGH':
      return { label: 'VERY HIGH OPPORTUNITY', badgeClass: 'neo-badge--yellow', emoji: '🔥' };
    case 'HIGH':
      return { label: 'HIGH OPPORTUNITY', badgeClass: 'neo-badge--yellow', emoji: '⚡' };
    case 'MEDIUM':
      return { label: 'MEDIUM OPPORTUNITY', badgeClass: 'neo-badge--sage', emoji: '✨' };
    case 'LOW':
      return { label: 'LOW OPPORTUNITY', badgeClass: 'neo-badge--dark', emoji: 'ℹ️' };
  }
}
