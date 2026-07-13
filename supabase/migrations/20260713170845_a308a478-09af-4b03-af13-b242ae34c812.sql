
-- P1: Block non-admin plan/status escalation on profiles
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text;
BEGIN
  -- Allow service role (edge functions) unconditionally
  BEGIN
    jwt_role := current_setting('request.jwt.claims', true)::jsonb ->> 'role';
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL;
  END;
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Admins allowed
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at
     OR NEW.deactivated IS DISTINCT FROM OLD.deactivated THEN
    RAISE EXCEPTION 'Not authorized to modify plan or account status' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_privileged_columns_trg ON public.profiles;
CREATE TRIGGER guard_profile_privileged_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- P2: Drop overly-permissive policies on check_in_tokens & check_in_history
DROP POLICY IF EXISTS "Service role can manage check-in tokens" ON public.check_in_tokens;
DROP POLICY IF EXISTS "Service role can manage check-in history" ON public.check_in_history;

-- P4: Add PBKDF2 salt+iterations to security_questions (per-row)
ALTER TABLE public.security_questions
  ADD COLUMN IF NOT EXISTS kdf_salt text,
  ADD COLUMN IF NOT EXISTS kdf_iterations integer;
