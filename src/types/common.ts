
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface MockAuthResponse {
  user: User | null;
  error: { message: string } | null;
}

export interface DashboardStats {
  contactsCount: number;
  accountsCount: number;
  documentsCount: number;
  userSettings: UserSettings | null;
}

export interface UserSettings {
  check_in_frequency: CheckInFrequency;
  grace_period_hours: number;
  is_active: boolean;
  last_check_in: string | null;
  next_check_in_due: string | null;
  deadline_mode: DeadlineMode;
  custom_deadline: string | null;
}

export type CheckInFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type DeadlineMode = 'frequency' | 'custom';
