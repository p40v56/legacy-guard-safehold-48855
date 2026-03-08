ALTER TABLE public.check_in_history 
  ADD COLUMN deadline_at timestamptz DEFAULT NULL,
  ADD COLUMN deadline_mode text DEFAULT NULL,
  ADD COLUMN grace_period_hours integer DEFAULT NULL;