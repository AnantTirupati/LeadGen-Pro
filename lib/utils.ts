/**
 * Utility function to combine CSS classes cleanly
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phoneNumber?: string): string {
  if (!phoneNumber) return 'N/A';
  return phoneNumber;
}

/**
 * Score badge color helper based on score
 */
export function getScoreBadgeVariant(score: number): 'yellow' | 'sage' | 'dark' {
  if (score >= 80) return 'yellow';
  if (score >= 50) return 'sage';
  return 'dark';
}
