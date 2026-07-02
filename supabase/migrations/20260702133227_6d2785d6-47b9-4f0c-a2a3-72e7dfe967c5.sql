
-- ============================================================
-- Phase 1: Security hardening migration
-- ============================================================

-- 1. Admin RPC guards (C1) --------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_profile(_profile_user_id uuid, _updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  UPDATE public.profiles
  SET
    plan = COALESCE(_updates->>'plan', plan),
    plan_expires_at = CASE
      WHEN _updates ? 'plan_expires_at' THEN (_updates->>'plan_expires_at')::timestamptz
      ELSE plan_expires_at
    END,
    deactivated = CASE
      WHEN _updates ? 'deactivated' THEN (_updates->>'deactivated')::boolean
      ELSE deactivated
    END,
    updated_at = now()
  WHERE user_id = _profile_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'free_users', (SELECT count(*) FROM public.profiles WHERE plan = 'free'),
    'paid_users', (SELECT count(*) FROM public.profiles WHERE plan IN ('essential', 'family')),
    'essential_users', (SELECT count(*) FROM public.profiles WHERE plan = 'essential'),
    'family_users', (SELECT count(*) FROM public.profiles WHERE plan = 'family'),
    'active_switches', (SELECT count(*) FROM public.user_settings WHERE is_active = true),
    'checked_in_today', (SELECT count(DISTINCT user_id) FROM public.check_in_history WHERE checked_in_at >= CURRENT_DATE),
    'triggered_switches', (SELECT count(*) FROM public.user_settings WHERE switch_triggered = true)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_triggered_switches()
RETURNS TABLE(user_id uuid, switch_triggered_at timestamptz, grace_period_active boolean, grace_period_end timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT us.user_id, us.switch_triggered_at, us.grace_period_active, us.grace_period_end
    FROM public.user_settings us
    WHERE us.switch_triggered = true
    ORDER BY us.switch_triggered_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_profile(uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_profiles() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_triggered_switches() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_emails(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_triggered_switches() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_emails(int) TO authenticated;

-- 2. Portal share table: gate SELECT on switch_triggered + add zero-knowledge columns (C2, C6)
DROP POLICY IF EXISTS "Portal access via token hash" ON public.contact_shares;

ALTER TABLE public.contact_shares
  ADD COLUMN IF NOT EXISTS kdf_salt text,
  ADD COLUMN IF NOT EXISTS kdf_iterations int DEFAULT 310000,
  ADD COLUMN IF NOT EXISTS security_question_id uuid REFERENCES public.security_questions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS needs_regeneration boolean NOT NULL DEFAULT false;

-- Mark existing shares as needing regeneration (their old token-derived key is being retired)
UPDATE public.contact_shares SET needs_regeneration = true WHERE kdf_salt IS NULL;

-- Note: no new SELECT policy for anon; the contact-portal edge function uses the
-- service role and gates access on switch_triggered + security-question verification.

-- 3. Financial asset visibility default: opt-in (H3)
--    Explicitly mark any asset with NULL visible_to as "unshared" by setting it to '{}'.
--    Empty arrays now mean "no contact sees this"; owner must add contact IDs to share.
UPDATE public.financial_assets
SET visible_to = '{}'::uuid[]
WHERE visible_to IS NULL;

-- 4. Check-in token hashing (C5)
ALTER TABLE public.check_in_tokens
  ADD COLUMN IF NOT EXISTS token_hash text;

-- Migrate existing rows: hash the plaintext token, then clear the plaintext.
-- We use pgcrypto for the hash; enable it if not already.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE public.check_in_tokens
SET token_hash = encode(digest(token, 'sha256'), 'base64')
WHERE token_hash IS NULL AND token IS NOT NULL;

-- Add uniqueness and drop plaintext column
ALTER TABLE public.check_in_tokens ALTER COLUMN token DROP NOT NULL;
UPDATE public.check_in_tokens SET token = NULL;
CREATE UNIQUE INDEX IF NOT EXISTS check_in_tokens_token_hash_key ON public.check_in_tokens(token_hash);

-- 5. Stripe webhook idempotency table (H2)
CREATE TABLE IF NOT EXISTS public.processed_stripe_sessions (
  session_id text PRIMARY KEY,
  user_id uuid NOT NULL,
  plan text NOT NULL,
  prorated boolean NOT NULL DEFAULT false,
  keep_expiry timestamptz,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.processed_stripe_sessions TO authenticated;
GRANT ALL ON public.processed_stripe_sessions TO service_role;
ALTER TABLE public.processed_stripe_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own processed sessions"
ON public.processed_stripe_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
