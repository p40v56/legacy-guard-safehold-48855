import type { CheckInFrequency } from '@/types/common';

/**
 * SINGLE SOURCE OF TRUTH for computing the next check-in deadline
 * from a frequency and a starting timestamp.
 *
 * The edge function `supabase/functions/check-in-via-token/index.ts`
 * MUST use a matching implementation (Deno cannot import client code).
 * Keep both in sync — see the `nextCheckInFromFrequency` helper there.
 *
 * Rules:
 *   daily    → +1 day
 *   weekly   → +7 days
 *   biweekly → +14 days
 *   monthly  → +1 month (setMonth, so Jan 31 → Feb 28/29)
 */
export const calculateNextCheckIn = (
  frequency: CheckInFrequency,
  fromDate: Date = new Date()
): string => {
  const next = new Date(fromDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next.toISOString();
};
