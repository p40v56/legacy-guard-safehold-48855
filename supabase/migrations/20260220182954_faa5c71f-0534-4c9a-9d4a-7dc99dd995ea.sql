
-- Add emergency_instructions_iv column for encryption
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_instructions_iv text;

-- Add migration_complete flag to skip migration on every login
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS migration_complete boolean DEFAULT false;

-- Create portal_access_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS public.portal_access_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  success boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_portal_access_attempts_token_hash_time 
  ON public.portal_access_attempts (token_hash, attempted_at);

-- RLS: allow service role only (edge functions use service role key)
ALTER TABLE public.portal_access_attempts ENABLE ROW LEVEL SECURITY;

-- No user-facing policies needed — only edge functions (service role) access this table
