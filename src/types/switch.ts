
export type CheckInFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type DeadlineMode = 'frequency' | 'custom';

export interface UserSettings {
  check_in_frequency: CheckInFrequency;
  grace_period_hours: number;
  is_active: boolean;
  last_check_in: string | null;
  next_check_in_due: string | null;
  deadline_mode: DeadlineMode;
  custom_deadline: string | null;
}
