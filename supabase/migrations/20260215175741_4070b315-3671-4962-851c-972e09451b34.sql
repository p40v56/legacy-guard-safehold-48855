
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Service role can manage check-in tokens" ON public.check_in_tokens;
DROP POLICY IF EXISTS "Service role can manage check-in history" ON public.check_in_history;
